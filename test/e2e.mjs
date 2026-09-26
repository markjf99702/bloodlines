// Uses the app in Chromium through the real page:  node test/e2e.mjs  (needs Playwright)
// Skeleton from the junkdrawer skill: the checks at the bottom are the ones every project wants;
// add the ones that prove this app does its job.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(join(execSync('npm root -g').toString().trim(), 'playwright')); }
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let body;
  try { body = await readFile(join(root, path === '/' ? 'index.html' : path)); } catch { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'text/html' });
  res.end(body);
}).listen(0);
const base = `http://localhost:${server.address().port}/`;

const browser = await pw.chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', e => problems.push(e.message));
page.on('console', m => { if (m.type() === 'error') problems.push(m.text()); });
page.on('requestfailed', r => problems.push('failed: ' + r.url()));
page.on('request', r => { if (!r.url().startsWith(base)) problems.push('left the site: ' + r.url()); });

await page.goto(base);
await page.evaluate(() => document.fonts.ready);

const panel = page.locator('#panel');
const settle = () => page.evaluate(() => window.bloodlines.settle());

// The tree is drawn and labelled.
await settle();
assert.ok(await page.evaluate(() => window.bloodlines.labels().length) > 15, 'hardly any labels on the chart');
assert.match(await panel.innerText(), /Three stallions/);

// Find a horse by typing part of its name.
await page.fill('#q', 'secr');
await page.locator('#suggest li').first().waitFor();
assert.match(await page.locator('#suggest li').first().innerText(), /Secretariat/);
await page.keyboard.press('Enter');
await page.waitForFunction(() => document.querySelector('#panel h2')?.textContent === 'Secretariat');
assert.match(await panel.innerText(), /By Bold Ruler/);
assert.match(await panel.innerText(), /22 generations after the Darley Arabian/);
assert.equal(new URL(page.url()).hash, '#Secretariat');

// Ask how he's related to another horse.
await panel.getByRole('button', { name: /How is Secretariat related to/ }).click();
await panel.getByRole('button', { name: 'Frankel' }).click();
await page.waitForFunction(() => document.querySelector('#panel .big')?.textContent === 'Second cousins, twice removed');
assert.match(await panel.innerText(), /Their fathers’ lines meet at Nearco/);
assert.equal(decodeURIComponent(new URL(page.url()).hash), '#Secretariat/Frankel');

// Horses from different founders share no father's line.
await page.goto(base + '#Seabiscuit/Secretariat');
await page.waitForFunction(() => /Not related/.test(document.querySelector('#panel .big')?.textContent));

// Tap a horse on the chart itself.
await page.goto(base + '#Justify');
await settle();
await page.evaluate(() => window.bloodlines.clear());
await settle();
const spot = await page.evaluate(() => window.bloodlines.where('Justify'));
const box = await page.locator('#chart').boundingBox();
await page.touchscreen.tap(box.x + spot.x, box.y + spot.y);
await page.waitForFunction(() => document.querySelector('#panel h2')?.textContent === 'Justify');

// A group lights up.
await page.goto(base);
await panel.getByRole('button', { name: 'American Triple Crown winners' }).click();
assert.equal(await panel.locator('.group li').count(), 13, 'there have been 13 Triple Crown winners');

// Tapping empty space (the corner, well outside the circle) clears it.
await settle();
await page.mouse.click(box.x + 4, box.y + box.height - 4); // a touch this close to the panel gets steered onto its buttons
await page.waitForFunction(() => /Three stallions/.test(document.querySelector('#panel').textContent));

// Fits a phone: nothing scrolls sideways.
assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'the page scrolls sideways on a phone');

// Works offline once it has been opened.
await page.waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 10000 }).catch(() => {});
await ctx.setOffline(true);
await page.reload();
assert.ok(await page.title(), 'the page did not load offline');
await ctx.setOffline(false);

assert.deepEqual(problems.filter(p => !p.startsWith('failed:')), [], 'problems while using it');
await browser.close();
server.close();
console.log('all good');
