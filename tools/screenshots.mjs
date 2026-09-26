// Renders the README screenshots (docs/*.png) and the link preview (og.png):  node tools/screenshots.mjs
// Nothing in the app is random, so the same pictures come out every time. Needs Playwright, and upng-js from `npm install`.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(join(execSync('npm root -g').toString().trim(), 'playwright')); }
const UPNG = require('upng-js');
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
// A 256-colour palette keeps the files small; the pictures are mostly flat colour anyway.
async function save(shot, path) {
  const img = UPNG.decode(shot);
  await writeFile(join(root, path), Buffer.from(UPNG.encode(UPNG.toRGBA8(img), img.width, img.height, 256)));
}
const browser = await pw.chromium.launch();
await mkdir(join(root, 'docs'), { recursive: true });

async function open(viewport, deviceScaleFactor, hash = '') {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor, hasTouch: true, serviceWorkers: 'block', colorScheme: 'light' });
  const page = await ctx.newPage();
  await page.goto(base + hash);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.evaluate(() => window.bloodlines.settle());
  return page;
}

// Phone screenshots for the README.
const shots = [
  ['tree', ''],
  ['related', '#Secretariat/Frankel'],
  ['horse', '#Man%20o%E2%80%99%20War'],
];
for (const [name, hash] of shots) {
  const page = await open({ width: 390, height: 844 }, 2, hash);
  await save(await page.screenshot(), `docs/phone-${name}.png`);
  await page.context().close();
}

// Link preview, 1200 x 630: the name and one line on the left, the real chart on the right.
{
  const page = await open({ width: 1100, height: 790 }, 2);
  const chart = await page.evaluate(() => {
    const c = document.getElementById('chart');
    return { src: c.toDataURL('image/png'), w: c.clientWidth, h: c.clientHeight };
  });
  const font = (await readFile(join(root, 'fonts/source-serif-4.woff2'))).toString('base64');
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<!doctype html><style>
    @font-face { font-family: S; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 400 700; }
    body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #f4efe6; font-family: S, serif; color: #221e19; position: relative; }
    img { position: absolute; left: ${828 - chart.w * 0.47}px; top: ${317 - chart.h * 0.47}px; width: ${chart.w * 0.94}px; height: ${chart.h * 0.94}px; }
    .words { position: absolute; left: 64px; top: 0; bottom: 0; width: 420px; display: flex; flex-direction: column; justify-content: center; }
    h1 { margin: 0 0 22px; font-size: 84px; line-height: 1; font-weight: 700; letter-spacing: -0.01em; font-variation-settings: 'opsz' 60; }
    p { margin: 0 0 30px; font-size: 30px; line-height: 1.3; color: #4f473d; }
    ul { margin: 0; padding: 0; list-style: none; font-size: 23px; color: #4f473d; display: grid; gap: 8px; }
    li { display: flex; align-items: center; gap: 12px; }
    i { width: 14px; height: 14px; border-radius: 50%; display: inline-block; }
  </style>
  <img src="${chart.src}" alt="">
  <div class="words">
    <h1>Bloodlines</h1>
    <p>Every racehorse, father to son, back to three stallions from around 1700.</p>
    <ul>
      <li><i style="background:#2a78d6"></i>Darley Arabian</li>
      <li><i style="background:#eb6834"></i>Godolphin Arabian</li>
      <li><i style="background:#1baf7a"></i>Byerley Turk</li>
    </ul>
  </div>`);
  await page.evaluate(() => document.fonts.ready);
  await save(await page.screenshot({ scale: 'css' }), 'og.png');
  await page.context().close();
}

await browser.close();
server.close();
console.log('screenshots written');
