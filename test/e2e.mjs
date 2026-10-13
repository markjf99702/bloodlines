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
const labels = () => page.evaluate(() => window.bloodlines.labels());
// Changes the window size and waits for the chart to catch up.
async function resizeTo(width, height) {
  await page.setViewportSize({ width, height });
  await page.waitForFunction(() => {
    const r = document.getElementById('stage').getBoundingClientRect();
    const v = window.bloodlines.view();
    return v.W === r.width && v.H === r.height;
  });
  await settle();
}

// The tree is drawn and labelled.
await settle();
assert.ok((await labels()).length > 15, 'hardly any labels on the chart');
assert.match(await panel.innerText(), /Three stallions/);

// The three founders are named on the opening view, on a small phone and a desktop too.
for (const [width, height] of [[390, 844], [320, 568], [1280, 800]]) {
  await resizeTo(width, height);
  const shown = await labels();
  for (const f of ['Darley Arabian', 'Godolphin Arabian', 'Byerley Turk']) {
    assert.ok(shown.includes(f), `${f} has no name on the opening view at ${width} x ${height}`);
  }
}

// Pointing at a horse there names it first, but leaves the founders and the ring years where they were.
const ringYears = () => page.evaluate(() => window.bloodlines.years());
const still = await ringYears();
const chart = await page.locator('#chart').boundingBox();
const eclipse = await page.evaluate(() => window.bloodlines.where('Eclipse'));
await page.mouse.move(chart.x + eclipse.x, chart.y + eclipse.y);
await settle();
assert.equal((await labels())[0], 'Eclipse', 'the pointer never got to Eclipse');
assert.deepEqual(await ringYears(), still, 'pointing at a horse moved the ring years and the founders’ names');
await page.mouse.move(chart.x + 2, chart.y + 2); // nothing there
await settle();

// On narrow phones the legend wraps rather than running off the side.
for (const [width, height] of [[375, 667], [360, 780], [320, 568]]) {
  await resizeTo(width, height);
  const cut = await page.evaluate(() => {
    const stage = document.getElementById('stage').getBoundingClientRect();
    return [...document.querySelectorAll('.legend button')].filter(b => b.getBoundingClientRect().right > stage.right).map(b => b.textContent);
  });
  assert.deepEqual(cut, [], `the legend runs off the side at ${width} x ${height}`);
}
await resizeTo(390, 844);

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
assert.match(await panel.innerText(), /Before Nearco, they share the line back to the Darley Arabian: \d+ more generations\./);
assert.equal(decodeURIComponent(new URL(page.url()).hash), '#Secretariat/Frankel');

// Ring years never hide under the legend, the zoom buttons or the hint.
await settle();
const underneath = await page.evaluate(() => {
  const stage = document.getElementById('stage').getBoundingClientRect();
  const covers = [...document.querySelectorAll('.legend button, .zoom, .hint:not(.gone)')].map(el => el.getBoundingClientRect());
  return window.bloodlines.years().filter(y => covers.some(r => y.left + stage.left < r.right && y.right + stage.left > r.left
    && y.top + stage.top < r.bottom && y.bottom + stage.top > r.top)).map(y => y.year);
});
assert.deepEqual(underneath, [], 'ring years drawn under the legend or the zoom buttons');
assert.ok((await page.evaluate(() => window.bloodlines.years())).length > 1, 'hardly any ring years on the chart');

// Both horses being compared are named on the chart, even at the crowded ends of their branches.
for (const [width, height] of [[390, 844], [1280, 800]]) {
  await resizeTo(width, height);
  await page.evaluate(() => window.bloodlines.compare('American Pharoah', 'Justify'));
  await settle();
  const shown = await labels();
  for (const name of ['American Pharoah', 'Justify']) assert.ok(shown.includes(name), `${name} has no name on the chart at ${width} x ${height}`);
}
await resizeTo(390, 844);

// Enter in an empty search box does nothing: it doesn't bring back an earlier search's result.
const heading = () => page.evaluate(() => document.querySelector('#panel h2')?.textContent);
await page.focus('#q');
await page.keyboard.press('Enter');
assert.equal(await heading(), 'American Pharoah & Justify', 'Enter in the empty search box picked an earlier result');
await page.fill('#q', 'frank');
await page.locator('#suggest li').first().waitFor();
await page.keyboard.press('Escape');
assert.equal(await page.inputValue('#q'), '');
await page.keyboard.press('Enter');
assert.equal(await heading(), 'American Pharoah & Justify', 'Enter after Escape picked the result it had just cleared');

// Horses from different founders share no father's line.
await page.goto(base + '#Seabiscuit/Secretariat');
await page.waitForFunction(() => /Not related/.test(document.querySelector('#panel .big')?.textContent));

// In the lists of fathers, a name that wraps stays lined up on the left, and a year stays on one line.
const ragged = await page.evaluate(() => {
  const lines = el => { const r = document.createRange(); r.selectNodeContents(el); return [...r.getClientRects()]; };
  const names = [...document.querySelectorAll('#panel .chain .link')]
    .filter(b => lines(b).some(l => Math.abs(l.left - b.getBoundingClientRect().left) > 1));
  const years = [...document.querySelectorAll('#panel .chain .yr')]
    .filter(y => new Set(lines(y).map(l => Math.round(l.top))).size > 1);
  return [...names, ...years].map(el => el.textContent);
});
assert.deepEqual(ragged, [], 'names centred over two lines, or years split, in the lists of fathers');

// When the lines meet at the founder himself, there's no line before him to talk about.
await page.goto(base + '#Flying%20Childers/Eclipse');
await page.waitForFunction(() => document.querySelector('#panel h2')?.textContent === 'Flying Childers & Eclipse');
assert.doesNotMatch(await panel.innerText(), /more generations|Before Darley Arabian/);

// A link that got cut off, or names nothing on the chart, opens the introduction (or the one horse it
// names) rather than a blank panel, and the app still starts up properly behind it.
const intro = 'Three stallions, three hundred years';
for (const [link, opens] of [['#Secretariat%2', intro], ['#100%', intro], ['#Secretariat/Secretariat', 'Secretariat'],
  ['#show=constructor', intro], ['#show=toString', intro], ['#show=__proto__', intro]]) {
  await page.goto('about:blank');
  await page.goto(base + link);
  assert.equal(await page.evaluate(() => document.querySelector('#panel h2')?.textContent), opens, `${link} opens on the wrong thing`);
  assert.ok(await page.evaluate(() => !!window.bloodlines), `${link} stopped the app starting up`);
}
await page.evaluate(() => { location.hash = '#Frankel'; });
await page.waitForFunction(() => document.querySelector('#panel h2')?.textContent === 'Frankel');

// Going back to the bare address, or to one that names no horse, closes the card.
const showing = text => page.waitForFunction(t => document.querySelector('#panel h2')?.textContent === t, text, { timeout: 3000 }).catch(() => {});
await page.evaluate(() => { location.hash = '#nobody'; });
await showing(intro);
assert.equal(await heading(), intro, 'an address naming no horse left the card open');
await page.evaluate(() => { location.hash = '#Secretariat/Frankel'; });
await page.waitForFunction(() => document.querySelector('#panel h2')?.textContent === 'Secretariat & Frankel');
await page.goBack();
await showing(intro);
assert.equal(await page.evaluate(() => location.hash), '');
assert.equal(await heading(), intro, 'going back to the bare address left the card open');

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

// The zoom buttons are a labelled group, and the box around them doesn't cut off their keyboard focus ring.
assert.equal(await page.getByRole('group', { name: 'Zoom' }).count(), 1, 'the zoom buttons are not a labelled group');
await page.focus('#q');
for (let i = 0; i < 10 && !(await page.evaluate(() => document.activeElement.dataset.act === 'zoom-in')); i++) await page.keyboard.press('Tab');
const ring = await page.evaluate(() => {
  const b = document.activeElement, cs = getComputedStyle(b);
  return { act: b.dataset.act, shown: b.matches(':focus-visible'), reach: parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth) };
});
assert.ok(ring.act === 'zoom-in' && ring.shown, 'Tab never reached the zoom buttons');
assert.ok(ring.reach <= 0, 'the focus ring of a zoom button is drawn outside it, where the box around it cuts it off');

// On a phone with a home indicator (34px here), the end of a card stays clear of it, and the
// introduction doesn't end with the gap counted twice.
const cdp = await ctx.newCDPSession(page);
const homeBar = bottom => cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, left: 0, right: 0, bottom } });
const panelEnd = () => page.evaluate(() => {
  const p = document.getElementById('panel');
  p.scrollTop = p.scrollHeight;
  const last = p.lastElementChild, r = last.getBoundingClientRect();
  return { box: innerHeight - r.bottom, content: innerHeight - r.bottom + parseFloat(getComputedStyle(last).paddingBottom) };
});
await homeBar(34);
await page.evaluate(() => window.bloodlines.compare('Secretariat', 'Frankel'));
assert.ok((await panelEnd()).box > 33, 'the end of a card sits behind the home indicator'); // to the nearest pixel scrolled
await page.evaluate(() => window.bloodlines.clear());
assert.ok((await panelEnd()).content <= 40, 'the introduction ends with a double gap above the home indicator');
await homeBar(0);

// The chart follows a theme set on the page after it has loaded, as the Artifact viewer can do.
await page.click('[data-act="zoom-fit"]');
const corner = () => page.evaluate(async () => {
  await new Promise(requestAnimationFrame);
  window.bloodlines.settle();
  return [...document.getElementById('chart').getContext('2d').getImageData(1, 1, 1, 1).data.slice(0, 3)];
});
await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
assert.deepEqual(await corner(), [0x13, 0x1a, 0x17], 'the chart stayed light when the page turned dark');
await page.evaluate(() => { delete document.documentElement.dataset.theme; });
assert.deepEqual(await corner(), [0xf4, 0xef, 0xe6], 'the chart stayed dark when the page turned light again');

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
