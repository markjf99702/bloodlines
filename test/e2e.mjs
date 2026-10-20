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

// The font can arrive after the chart is first drawn (held back here until the app has started). At 375 wide
// it wraps the legend onto a second row, and the chart still knows where every legend button ends up.
const lateCtx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, hasTouch: true, serviceWorkers: 'block' });
const late = await lateCtx.newPage();
late.on('pageerror', e => problems.push(e.message));
let letFontIn;
const fontHeld = new Promise(r => { letFontIn = r; });
await late.route('**/*.woff2', async r => { await fontHeld; await r.continue(); });
await late.goto(base, { waitUntil: 'domcontentloaded' });
await late.waitForFunction(() => window.bloodlines);
letFontIn();
await late.evaluate(() => document.fonts.ready);
const legendAfterFont = await late.evaluate(() => {
  const stage = document.getElementById('stage').getBoundingClientRect();
  const kept = window.bloodlines.obstacles();
  const buttons = [...document.querySelectorAll('.legend button')];
  const lost = buttons.filter(b => {
    const r = b.getBoundingClientRect();
    return !kept.some(o => o.left <= r.left - stage.left && o.right >= r.right - stage.left && o.top <= r.top - stage.top && o.bottom >= r.bottom - stage.top);
  });
  return { rows: new Set(buttons.map(b => b.getBoundingClientRect().top)).size, lost: lost.map(b => b.textContent) };
});
assert.equal(legendAfterFont.rows, 2, 'the legend is on one row at 375 with the font in');
assert.deepEqual(legendAfterFont.lost, [], 'the chart lost track of the legend when the font arrived');
await lateCtx.close();

// Find a horse by typing part of its name.
await page.fill('#q', 'secr');
await page.locator('#suggest li').first().waitFor();
assert.match(await page.locator('#suggest li').first().innerText(), /Secretariat/);
await page.keyboard.press('Enter');
await page.waitForFunction(() => document.querySelector('#panel h2')?.textContent === 'Secretariat');
assert.match(await panel.innerText(), /By Bold Ruler/);
assert.match(await panel.innerText(), /22 generations after the Darley Arabian/);
assert.equal(new URL(page.url()).hash, '#Secretariat');

// Ask how he's related to another horse. The search box's prompt fits the box: on a phone it doesn't name him,
// since the card above does.
const prompt = () => page.evaluate(() => {
  const input = document.getElementById('q'), cs = getComputedStyle(input);
  const span = document.createElement('span');
  span.style.cssText = `position: absolute; white-space: pre; font: ${cs.font}`;
  span.textContent = input.placeholder;
  document.body.append(span);
  const fits = span.getBoundingClientRect().width <= input.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  span.remove();
  return { text: input.placeholder, fits };
});
await panel.getByRole('button', { name: /How is Secretariat related to/ }).click();
assert.deepEqual(await prompt(), { text: 'Compare with…', fits: true }, 'the search box’s prompt is cut off on a phone');
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

// On a computer the prompt names the horse when there's room, and drops the name when there isn't. Turning the
// window narrow while picking drops it too.
await resizeTo(1280, 800);
const pickFor = async name => {
  await page.evaluate(n => window.bloodlines.select(n), name);
  await panel.locator('[data-act="pick"]').click();
  return prompt();
};
assert.deepEqual(await pickFor('The Flying Dutchman'), { text: 'Compare with…', fits: true }, 'a long name in the prompt is cut off');
assert.deepEqual(await pickFor('Secretariat'), { text: 'Compare Secretariat with…', fits: true }, 'the prompt doesn’t name the horse on a computer');
await resizeTo(390, 844);
await page.waitForFunction(() => document.getElementById('q').placeholder === 'Compare with…', null, { timeout: 3000 }).catch(() => {});
assert.deepEqual(await prompt(), { text: 'Compare with…', fits: true }, 'the prompt stayed too long when the window got narrow');

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

// In the cards' sentences the founders take "the", as they do everywhere else, and a gap counted from a year that's
// only known roughly is "about" so many years.
const says = async (open, ...sentences) => {
  await page.evaluate(open);
  const text = await panel.innerText();
  for (const s of sentences) assert.ok(text.includes(s), `the card doesn’t say “${s}”:\n${text}`);
  return text;
};
await says(() => window.bloodlines.compare('Flying Childers', 'Eclipse'), 'Flying Childers is a son of the Darley Arabian, and Eclipse is his 2nd great-grandson.');
await says(() => window.bloodlines.select('Jigg'), 'By the Byerley Turk.');
await says(() => window.bloodlines.select('Darley Arabian'), 'How is the Darley Arabian related to…');
await says(() => window.bloodlines.compare('Darley Arabian', 'Eclipse'), 'The Darley Arabian is Eclipse’s second great-grandfather',
  'Eclipse was foaled about 64 years after the Darley Arabian, 4 generations down the line.', 'Compare the Darley Arabian with someone else');
await says(() => window.bloodlines.compare('Flying Childers', 'Bartlett’s Childers'), 'Both are by the Darley Arabian.');
const withFounder = await says(() => window.bloodlines.compare('Secretariat', 'Byerley Turk'),
  'Secretariat goes back to the Darley Arabian, and the Byerley Turk is one of the founders himself, so their fathers’ lines never meet.');
assert.doesNotMatch(withFounder, /carry all three founders/, 'a founder doesn’t carry the founders after him through his mother');
await says(() => window.bloodlines.compare('Godolphin Arabian', 'Tourbillon'),
  'Tourbillon goes back to the Byerley Turk, and the Godolphin Arabian is one of the founders himself');
await says(() => window.bloodlines.compare('Darley Arabian', 'Byerley Turk'),
  'The Darley Arabian and the Byerley Turk are two of the three founders, so their fathers’ lines never meet.');
await says(() => window.bloodlines.compare('Seabiscuit', 'Secretariat'),
  'Seabiscuit goes back to the Godolphin Arabian and Secretariat to the Darley Arabian, so their fathers’ lines never meet. Through their mothers, both carry all three founders many times over.');

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

// A group link still opens in a browser from before Object.hasOwn (Safari 15.3 and older), as it always has.
const older = await ctx.newPage();
older.on('pageerror', e => problems.push(e.message));
await older.addInitScript(() => { delete Object.hasOwn; });
await older.goto(base + '#show=us3');
assert.equal(await older.evaluate(() => document.querySelector('#panel h2')?.textContent), 'American Triple Crown winners', 'a group link stopped the app in an older browser');
await older.close();

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

// Opening a card from the introduction adds one step to the browser's history: Back closes the card, however many
// horses were looked at since, rather than leaving Bloodlines. Closing a card with × takes that step back too, so
// the next Back leaves as it would have before the card was opened.
const opened = name => page.waitForFunction(t => document.querySelector('#panel h2')?.textContent === t, name);
await page.goto('about:blank');
await page.goto(base);
await panel.locator('.founders [data-horse="Darley Arabian"]').click();
await opened('Darley Arabian');
await panel.getByRole('button', { name: 'Flying Childers', exact: true }).click();
await opened('Flying Childers');
await panel.locator('[data-act="pick"]').click();
await panel.getByRole('button', { name: 'Eclipse', exact: true }).click();
await opened('Flying Childers & Eclipse');
await page.goBack();
await showing(intro);
assert.equal(page.url(), base, 'Back after opening a card left Bloodlines');
assert.equal(await heading(), intro, 'Back didn’t close the card');
await panel.locator('.founders [data-horse="Byerley Turk"]').click();
await opened('Byerley Turk');
await panel.getByRole('button', { name: 'Close' }).click();
await page.waitForFunction(t => !location.hash && document.querySelector('#panel h2')?.textContent === t, intro);
await page.goBack();
assert.equal(page.url(), 'about:blank', 'closing a card left an extra step in the history');

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

// Every card ends with the line back to junkdrawer.works and its privacy page, not only the introduction.
const footerLinks = () => page.evaluate(() => {
  const last = document.getElementById('panel').lastElementChild;
  return last?.matches('footer.jd-foot') ? [...last.querySelectorAll('a')].map(a => a.href) : null;
});
for (const [card, open] of [
  ['introduction', () => window.bloodlines.clear()],
  ['horse', () => window.bloodlines.select('Frankel')],
  ['comparison', () => window.bloodlines.compare('Secretariat', 'Frankel')],
  ['group', () => window.bloodlines.group('mares')],
  ['Related to whom?', () => { window.bloodlines.select('Winx'); document.querySelector('#panel [data-act="pick"]').click(); }],
]) {
  await page.evaluate(open);
  assert.deepEqual(await footerLinks(), ['https://junkdrawer.works/', 'https://junkdrawer.works/privacy.html'],
    `the ${card} card doesn’t end with the junkdrawer.works footer`);
}
assert.equal(await heading(), 'Related to whom?');

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

// The small grey text (the hint, the ring years, the years in the lists) reads at 4.5:1 or better on every background
// it sits on, in both palettes: the chart, the panel, and a highlighted row or chip.
const greyContrast = () => page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  const lum = name => {
    const n = parseInt(cs.getPropertyValue(name).trim().slice(1), 16);
    return [n >> 16, (n >> 8) & 255, n & 255].map(c => c / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
  };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  return Object.fromEntries(['--bg', '--paper', '--chip'].map(bg => [bg, ratio('--muted', bg)]));
});
for (const theme of ['light', 'dark']) {
  await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
  const ratios = await greyContrast();
  for (const [bg, r] of Object.entries(ratios)) assert.ok(r >= 4.5, `grey text on ${bg} is only ${r.toFixed(2)}:1 in the ${theme} palette`);
}
await page.evaluate(() => { delete document.documentElement.dataset.theme; });

// A phone held sideways (844 x 390) keeps the chart beside a narrower panel instead of squeezing it into a strip
// above it. The title, the search box, the legend, the hint and the card stay clear of the notch on whichever side
// it is, and the controls at the bottom of the chart stay clear of the home indicator.
await resizeTo(844, 390);
const sideways = await page.evaluate(() => {
  const r = s => document.querySelector(s).getBoundingClientRect();
  return { stage: r('#stage'), panel: r('#panel'), lede: getComputedStyle(document.querySelector('.lede')).display };
});
assert.ok(sideways.panel.left >= sideways.stage.right - 1 && sideways.panel.top < sideways.stage.bottom, 'the panel sits under the chart on a phone held sideways');
assert.equal(sideways.panel.width, 340, 'the panel beside the chart is not the narrower one');
assert.ok(sideways.stage.height > 300 && sideways.stage.width > 480, `the chart is ${sideways.stage.width} x ${sideways.stage.height} on a phone held sideways`);
assert.equal(sideways.lede, 'none', 'the lede takes up room on a phone held sideways');
await page.evaluate(() => window.bloodlines.select('Secretariat'));
const edges = () => page.evaluate(() => {
  const r = el => el.getBoundingClientRect();
  const legend = [...document.querySelectorAll('.legend button')].map(r);
  const bottoms = [r(document.querySelector('.zoom')), r(document.getElementById('hint'))];
  return {
    left: Math.min(r(document.querySelector('h1')).left, r(document.getElementById('hint')).left, ...legend.map(b => b.left)),
    right: Math.max(r(document.getElementById('q')).right, r(document.querySelector('#panel h2')).right),
    bottom: Math.max(...bottoms.map(b => b.bottom)),
  };
});
for (const [left, right] of [[47, 0], [0, 47]]) {
  await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, left, right, bottom: 21 } });
  const e = await edges();
  assert.ok(e.left >= left, `something on the left starts at ${e.left}px, under a notch ${left}px wide`);
  assert.ok(e.right <= 844 - right, `something on the right ends at ${e.right}px, under a notch ${right}px wide`);
  assert.ok(e.bottom <= 390 - 21, `the zoom buttons or the hint reach ${e.bottom}px, onto the home indicator`);
}
await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, left: 0, right: 0, bottom: 0 } });
assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'the page scrolls sideways on a phone held sideways');
await resizeTo(390, 844);

// Fits a phone: nothing scrolls sideways.
assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'the page scrolls sideways on a phone');

// Works offline once it has been opened.
await page.waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 10000 }).catch(() => {});
await ctx.setOffline(true);
await page.reload();
assert.ok(await page.title(), 'the page did not load offline');
await ctx.setOffline(false);

// Every tool at junkdrawer.works shares one address, and so one set of offline copies. When the app's service
// worker starts, it clears out its own old copy and leaves another tool's alone, even one whose name starts the
// same way (a tool called bloodlines-x).
const sharedCtx = await browser.newContext();
const shared = await sharedCtx.newPage();
shared.on('pageerror', e => problems.push(e.message));
await shared.route('**/another-tool/', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Another tool</title>' }));
await shared.goto(base + 'another-tool/');
await shared.evaluate(async () => {
  await (await caches.open('another-tool-v1')).put('./', new Response('another tool, offline'));
  await (await caches.open('bloodlines-x-v1')).put('../bloodlines-x/', new Response('a tool with a longer name, offline'));
  await (await caches.open('bloodlines-v0')).put('../', new Response('an old copy of this app'));
});
await shared.unroute('**/another-tool/');
await shared.goto(base);
await shared.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated', null, { timeout: 30000 });
const left = await shared.evaluate(async () => ({
  another: await caches.has('another-tool-v1') && !!(await caches.match('another-tool/', { cacheName: 'another-tool-v1' })),
  longer: await caches.has('bloodlines-x-v1') && !!(await caches.match('bloodlines-x/', { cacheName: 'bloodlines-x-v1' })),
  old: await caches.has('bloodlines-v0'),
}));
assert.ok(left.another, 'the app’s service worker deleted another tool’s offline copy');
assert.ok(left.longer, 'the app’s service worker deleted the offline copy of a tool whose name starts with bloodlines-');
assert.ok(!left.old, 'the app’s service worker left its own old offline copy behind');
await sharedCtx.close();

assert.deepEqual(problems.filter(p => !p.startsWith('failed:')), [], 'problems while using it');
await browser.close();
server.close();
console.log('all good');
