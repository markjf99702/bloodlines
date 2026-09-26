import { HORSES, FOUNDERS } from './horses.js';
import { buildTree, layout, lineage, relate, search, generations } from './tree.js';

const tree = buildTree(HORSES, FOUNDERS);
const geo = layout(tree);
const nodes = tree.nodes;
const byName = tree.byName;
const horse = name => byName.get(name);

const FOUNDER_VAR = { 'Darley Arabian': '--darley', 'Godolphin Arabian': '--godolphin', 'Byerley Turk': '--byerley' };
const LEGEND_ORDER = ['Darley Arabian', 'Godolphin Arabian', 'Byerley Turk'];
const FOUNDER_LINE = {
  'Darley Arabian': 'About 95% of thoroughbreds today, through Eclipse.',
  'Godolphin Arabian': 'Man o’ War, Seabiscuit and Tiznow.',
  'Byerley Turk': 'Herod, The Tetrarch and Tourbillon.',
};

const GROUPS = {
  us3: {
    title: 'American Triple Crown winners',
    blurb: 'All thirteen horses who have won the Kentucky Derby, Preakness and Belmont in one year. Every one descends from the Darley Arabian except War Admiral, a son of Man o’ War.',
    members: nodes.filter(n => n.tags.includes('us3')),
  },
  mares: {
    title: 'Great mares',
    blurb: 'A mare passes on her own father’s line to nobody: her sons carry their fathers’ lines instead. So on this chart every great mare ends a branch.',
    members: nodes.filter(n => n.tags.includes('m')),
  },
};
for (const g of Object.values(GROUPS)) g.members.sort((a, b) => a.year - b.year);

const TRIES = [
  ['Secretariat', 'Frankel'],
  ['Seabiscuit', 'War Admiral'],
  ['Winx', 'Zenyatta'],
  ['American Pharoah', 'Justify'],
  ['Man o’ War', 'Secretariat'],
  ['Eclipse', 'Frankel'],
];

for (const n of nodes) {
  n.isFounder = n.tags.includes('founder');
  n.isKey = n.tags.includes('k');
  n.ends = n.tags.includes('m') || n.tags.includes('g');
  // Which labels win when they'd overlap: founders, then famous horses, then big branches.
  n.prio = (n.isFounder ? 1e7 : 0) + (n.isKey ? 1e5 : 0) + n.size * 100 + (n.year - 1680);
}
const byPrio = [...nodes].sort((a, b) => b.prio - a.prio);
const yearText = n => (n.tags.includes('c') ? `c. ${n.year}` : `${n.year}`);

// ---------------------------------------------------------------- state

const state = {
  sel: null,       // the horse whose card is open
  other: null,     // the second horse, when comparing
  picking: false,  // waiting for the second horse
  group: null,     // key of GROUPS being shown
  hover: null,
};

// ---------------------------------------------------------------- canvas

const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');
const stage = document.getElementById('stage');
let W = 0, H = 0, dpr = 1, fitK = 0;
const cam = { x: 0, y: 0, k: 1 };
let colors = {};
let placedLabels = [];
let obstacles = [];   // boxes of the legend, zoom buttons and hint, which sit on top of the chart
let hintGone = false;
const hint = document.getElementById('hint');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const v = name => cs.getPropertyValue(name).trim();
  colors = {
    bg: v('--bg'), ink: v('--ink'), muted: v('--muted'), ring: v('--ring'), ringStrong: v('--ring-strong'),
    founder: Object.fromEntries(Object.entries(FOUNDER_VAR).map(([f, name]) => [f, v(name)])),
  };
}

function resize() {
  const r = stage.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const oldFit = fitK;
  W = r.width;
  H = r.height;
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const m = Math.min(W, H);
  fitK = (m / 2 - Math.min(80, m * 0.09)) / geo.r1;
  if (!oldFit) Object.assign(cam, fitView());
  else cam.k *= fitK / oldFit;
  clampCam(cam);
  measureObstacles();
  requestDraw();
}

function measureObstacles() {
  const base = stage.getBoundingClientRect();
  const els = [...document.querySelectorAll('.legend button, .zoom'), ...(hintGone ? [] : [hint])];
  obstacles = els.map(el => {
    const r = el.getBoundingClientRect();
    return { box: obb(r.left - base.left + r.width / 2, r.top - base.top + r.height / 2, r.width / 2 + 2, r.height / 2 + 2, 0) };
  });
}

function fitView() {
  return { x: 0, y: 0, k: fitK };
}

function clampCam(c) {
  c.k = Math.min(fitK * 18, Math.max(fitK * 0.8, c.k));
  const d = Math.hypot(c.x, c.y);
  const lim = geo.r1 * 1.05;
  if (d > lim) { c.x *= lim / d; c.y *= lim / d; }
  return c;
}

const sx = x => (x - cam.x) * cam.k + W / 2;
const sy = y => (y - cam.y) * cam.k + H / 2;

let drawQueued = false;
function requestDraw() {
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(frame);
}

let anim = null;
function animateTo(target, ms = 700) {
  clampCam(target);
  if (reduceMotion.matches || ms === 0) { Object.assign(cam, target); anim = null; requestDraw(); return; }
  anim = { from: { ...cam }, to: target, t0: performance.now(), ms };
  requestDraw();
}

function frame(now) {
  drawQueued = false;
  if (anim) {
    const t = Math.min(1, (now - anim.t0) / anim.ms);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const { from, to } = anim;
    cam.k = Math.exp(Math.log(from.k) + (Math.log(to.k) - Math.log(from.k)) * e);
    cam.x = from.x + (to.x - from.x) * e;
    cam.y = from.y + (to.y - from.y) * e;
    if (t >= 1) anim = null;
    else requestDraw();
  }
  draw();
}

// The horses whose lines are lit up, and the ones that get rings and must-show labels.
function focus() {
  const lit = new Set();
  const marked = new Set();
  if (state.group) {
    for (const m of GROUPS[state.group].members) { lineage(m).forEach(n => lit.add(n)); marked.add(m); }
  }
  if (state.sel) { lineage(state.sel).forEach(n => lit.add(n)); marked.add(state.sel); }
  if (state.sel && state.other) { lineage(state.other).forEach(n => lit.add(n)); marked.add(state.other); }
  return lit.size ? { lit, marked } : null;
}

function linkWidth(n, gain) {
  return (0.8 + 0.5 * Math.sqrt(n.leaves)) * gain;
}

const FONT = '"Source Serif 4", Georgia, serif';
const widthCache = new Map();
function textWidth(text, font) {
  const key = font + '|' + text;
  let w = widthCache.get(key);
  if (w === undefined) { ctx.font = font; w = ctx.measureText(text).width; widthCache.set(key, w); }
  return w;
}

function draw() {
  if (!W) return;
  const k = cam.k;
  const gain = Math.min(2.2, Math.max(1, Math.pow(k / fitK, 0.4)));
  const f = focus();
  const common = state.sel && state.other ? relate(state.sel, state.other).ancestor : null;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, W, H);

  // Tree rings: one every 50 years.
  ctx.save();
  ctx.translate(W / 2 - cam.x * k, H / 2 - cam.y * k);
  ctx.scale(k, k);
  for (let y = 1700; y <= 2000; y += 50) {
    ctx.beginPath();
    ctx.arc(0, 0, geo.radius(y), 0, Math.PI * 2);
    ctx.lineWidth = (y % 100 ? 0.8 : 1.3) / k;
    ctx.strokeStyle = y % 100 ? colors.ring : colors.ringStrong;
    ctx.stroke();
  }

  // Father-to-son links: an arc around the father's ring, then out to the son.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const link = n => {
    const p = n.parent;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.arc(0, 0, p.r, p.angle, n.angle, n.angle < p.angle);
    ctx.lineTo(n.x, n.y);
  };
  for (const n of nodes) {
    if (!n.parent) continue;
    link(n);
    ctx.globalAlpha = f && !f.lit.has(n) ? 0.2 : 1;
    ctx.strokeStyle = colors.founder[n.founder.name];
    ctx.lineWidth = linkWidth(n, gain) / k;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (f) {
    for (const n of nodes) {
      if (!n.parent || !f.lit.has(n)) continue;
      link(n);
      ctx.strokeStyle = colors.bg;
      ctx.lineWidth = (linkWidth(n, gain) + 4) / k;
      ctx.stroke();
      ctx.strokeStyle = colors.founder[n.founder.name];
      ctx.lineWidth = (linkWidth(n, gain) + 1.5) / k;
      ctx.stroke();
    }
  }
  ctx.restore();

  const placed = [...obstacles];

  // Ring years, up the gap at the top of the chart.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const ringFont = `500 12px ${FONT}`;
  ctx.font = ringFont;
  for (let y = 1700; y <= 2000; y += 50) {
    const x0 = sx(0), y0 = sy(-geo.radius(y));
    const w = textWidth(String(y), ringFont);
    if (y % 100 && k < fitK * 1.6) continue;
    const box = obb(x0, y0, w / 2 + 3, 8, 0);
    if (!onScreen(box)) continue;
    placed.push({ box });
    halo(String(y), x0, y0, colors.muted);
  }

  // Dots.
  const visible = n => {
    const x = sx(n.x), y = sy(n.y);
    return x > -20 && y > -20 && x < W + 20 && y < H + 20;
  };
  for (const n of nodes) {
    if (!visible(n)) continue;
    const dim = f && !f.lit.has(n);
    const r = (n.isFounder ? 5.5 : n.isKey ? 3.4 : 2.4) * Math.min(gain, 1.6);
    ctx.globalAlpha = dim ? 0.3 : 1;
    ctx.beginPath();
    ctx.arc(sx(n.x), sy(n.y), r, 0, Math.PI * 2);
    if (n.ends) {
      ctx.fillStyle = colors.bg;
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = colors.founder[n.founder.name];
      ctx.stroke();
    } else {
      ctx.fillStyle = colors.founder[n.founder.name];
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Rings around the horses in play.
  const ring = (n, r, dashed) => {
    if (!n || !visible(n)) return;
    ctx.beginPath();
    ctx.arc(sx(n.x), sy(n.y), r, 0, Math.PI * 2);
    ctx.setLineDash(dashed ? [3, 3] : []);
    ctx.lineWidth = 2;
    ctx.strokeStyle = colors.ink;
    ctx.stroke();
    ctx.setLineDash([]);
  };
  if (f) for (const m of f.marked) ring(m, 7.5);
  if (common && common !== state.sel && common !== state.other) ring(common, 8, true);
  if (state.hover && !(f && f.marked.has(state.hover))) ring(state.hover, 7);

  // Labels: most important first, skipping any that would overlap one already placed.
  const must = [];
  if (state.hover) must.push(state.hover);
  if (state.sel) must.push(state.sel);
  if (state.other) must.push(state.other);
  if (common) must.push(common);
  if (f) {
    for (const m of f.marked) must.push(m);
    const trail = [...f.lit].sort((a, b) => b.prio - a.prio);
    must.push(...trail);
  }
  const inPlay = new Set(must);
  const seen = new Set();
  const order = [...must, ...byPrio].filter(n => (seen.has(n) ? false : (seen.add(n), true)));

  for (const n of order) {
    if (!visible(n)) continue;
    const strong = must.includes(n) && (n === state.sel || n === state.other || n === common || n === state.hover || (f && f.marked.has(n)));
    const weight = n.isFounder ? 700 : strong || n.isKey ? 600 : 400;
    const size = n.isFounder ? 15 : n.isKey || strong ? 13 : 12;
    const font = `${weight} ${size}px ${FONT}`;
    const w = textWidth(n.name, font);
    const x = sx(n.x), y = sy(n.y);
    const dotR = (n.isFounder ? 5.5 : 3.4) * Math.min(gain, 1.6);
    const hh = size * 0.62;
    const free = b => onScreen(b) && !placed.some(p => overlaps(p.box, b));
    let spot = null;

    if (!n.children.length) {
      // Leaves read outward along their spoke, flipped on the left so they're never upside down.
      const a = n.angle;
      const left = Math.cos(a) < 0;
      const rot = left ? a + Math.PI : a;
      const off = dotR + 5;
      const box = obb(x + Math.cos(a) * (off + w / 2), y + Math.sin(a) * (off + w / 2), w / 2 + 2, hh, rot);
      if (free(box)) spot = { box, tx: x + Math.cos(a) * off, ty: y + Math.sin(a) * off, rot, align: left ? 'right' : 'left' };
    } else {
      // Fathers get a level label beside the dot, on the side away from the centre. Horses in play
      // (selected, compared, or on a lit line) can also go on the other side, above or below.
      const off = dotR + 5;
      const out = Math.cos(n.angle) >= -0.2 ? 1 : -1;
      const tries = [
        { tx: x + out * off, ty: y, cx: x + out * (off + w / 2), cy: y, align: out > 0 ? 'left' : 'right' },
        { tx: x - out * off, ty: y, cx: x - out * (off + w / 2), cy: y, align: out > 0 ? 'right' : 'left' },
        { tx: x, ty: y - dotR - hh - 1, cx: x, cy: y - dotR - hh - 1, align: 'center' },
        { tx: x, ty: y + dotR + hh + 1, cx: x, cy: y + dotR + hh + 1, align: 'center' },
      ];
      for (const t of inPlay.has(n) ? tries : tries.slice(0, 1)) {
        const box = obb(t.cx, t.cy, w / 2 + 2, hh, 0);
        if (free(box)) { spot = { ...t, box, rot: 0 }; break; }
      }
    }
    if (!spot) continue;
    placed.push({ box: spot.box, n });
    const { tx, ty, rot, align } = spot;

    const dim = f && !f.lit.has(n);
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = dim ? 0.45 : 1;
    if (rot) {
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(rot);
      halo(n.name, 0, 0, dim ? colors.muted : colors.ink);
      ctx.restore();
    } else {
      halo(n.name, tx, ty, dim ? colors.muted : colors.ink);
    }
    ctx.globalAlpha = 1;
  }
  placedLabels = placed.filter(p => p.n);
}

function halo(text, x, y, fill) {
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = colors.bg;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

// Oriented boxes for label collisions (separating axis test).
function obb(cx, cy, hw, hh, rot) {
  const c = Math.cos(rot), s = Math.sin(rot);
  const ax = [c, s], ay = [-s, c];
  const ex = Math.abs(c) * hw + Math.abs(s) * hh, ey = Math.abs(s) * hw + Math.abs(c) * hh;
  return { cx, cy, hw, hh, ax, ay, minx: cx - ex, maxx: cx + ex, miny: cy - ey, maxy: cy + ey };
}
function onScreen(b) {
  return b.minx >= 2 && b.miny >= 2 && b.maxx <= W - 2 && b.maxy <= H - 2;
}
function overlaps(a, b) {
  if (a.maxx < b.minx || b.maxx < a.minx || a.maxy < b.miny || b.maxy < a.miny) return false;
  const dx = b.cx - a.cx, dy = b.cy - a.cy;
  for (const axis of [a.ax, a.ay, b.ax, b.ay]) {
    const d = Math.abs(dx * axis[0] + dy * axis[1]);
    const ra = a.hw * Math.abs(a.ax[0] * axis[0] + a.ax[1] * axis[1]) + a.hh * Math.abs(a.ay[0] * axis[0] + a.ay[1] * axis[1]);
    const rb = b.hw * Math.abs(b.ax[0] * axis[0] + b.ax[1] * axis[1]) + b.hh * Math.abs(b.ay[0] * axis[0] + b.ay[1] * axis[1]);
    if (d > ra + rb) return false;
  }
  return true;
}
function inBox(b, x, y) {
  const dx = x - b.cx, dy = y - b.cy;
  return Math.abs(dx * b.ax[0] + dy * b.ax[1]) <= b.hw && Math.abs(dx * b.ay[0] + dy * b.ay[1]) <= b.hh;
}

function hitTest(x, y, touch) {
  let best = null, bestD = touch ? 22 : 12;
  for (const n of nodes) {
    const d = Math.hypot(sx(n.x) - x, sy(n.y) - y);
    if (d < bestD) { best = n; bestD = d; }
  }
  if (best) return best;
  const lab = placedLabels.find(p => inBox(p.box, x, y));
  return lab ? lab.n : null;
}

// ---------------------------------------------------------------- camera moves

function viewCenterFor(n, k) {
  // Put the horse a little outside the middle of the view, so its line back toward the centre shows.
  const shift = Math.min(W, H) * 0.14 / k;
  const d = Math.hypot(n.x, n.y) || 1;
  return { x: n.x - (n.x / d) * shift, y: n.y - (n.y / d) * shift };
}

function flyTo(n) {
  const k = Math.max(cam.k, fitK * 2.2);
  animateTo({ ...viewCenterFor(n, k), k });
}

function flyToFit(list) {
  const xs = list.map(n => n.x), ys = list.map(n => n.y);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  const pad = 90;
  const k = Math.min((W - pad * 2) / Math.max(1, maxx - minx), (H - pad * 2) / Math.max(1, maxy - miny), fitK * 4);
  animateTo({ x: (minx + maxx) / 2, y: (miny + maxy) / 2, k: Math.max(k, fitK) });
}

// ---------------------------------------------------------------- pointer input

const pointers = new Map();
let gesture = null;
function dropHint() {
  if (hintGone) return;
  hintGone = true;
  hint.classList.add('gone');
  measureObstacles();
  requestDraw();
}

function local(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId);
  const p = local(e);
  pointers.set(e.pointerId, p);
  anim = null;
  if (pointers.size === 1) {
    gesture = { type: 'pan', start: p, cam: { ...cam }, t: performance.now(), moved: false, touch: e.pointerType !== 'mouse' };
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    gesture = {
      type: 'pinch', moved: true, cam: { ...cam },
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  }
});

canvas.addEventListener('pointermove', e => {
  const p = local(e);
  if (!pointers.has(e.pointerId)) {
    if (e.pointerType === 'mouse') {
      const h = hitTest(p.x, p.y, false);
      if (h !== state.hover) { state.hover = h; canvas.classList.toggle('over', !!h); requestDraw(); }
    }
    return;
  }
  pointers.set(e.pointerId, p);
  if (!gesture) return;
  if (gesture.type === 'pan') {
    const dx = p.x - gesture.start.x, dy = p.y - gesture.start.y;
    if (!gesture.moved && Math.hypot(dx, dy) > 6) { gesture.moved = true; canvas.classList.add('dragging'); dropHint(); }
    if (gesture.moved) {
      cam.x = gesture.cam.x - dx / cam.k;
      cam.y = gesture.cam.y - dy / cam.k;
      clampCam(cam);
      requestDraw();
    }
  } else if (gesture.type === 'pinch' && pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const g = gesture.cam;
    // The world point that was under the starting midpoint stays under the current midpoint.
    const wx = g.x + (gesture.mid.x - W / 2) / g.k, wy = g.y + (gesture.mid.y - H / 2) / g.k;
    const k = Math.min(fitK * 18, Math.max(fitK * 0.8, g.k * dist / Math.max(1, gesture.dist)));
    cam.k = k;
    cam.x = wx - (mid.x - W / 2) / k;
    cam.y = wy - (mid.y - H / 2) / k;
    clampCam(cam);
    dropHint();
    requestDraw();
  }
});

function endPointer(e) {
  if (!pointers.has(e.pointerId)) return;
  const p = pointers.get(e.pointerId);
  pointers.delete(e.pointerId);
  canvas.classList.remove('dragging');
  if (gesture && gesture.type === 'pan' && !gesture.moved && e.type === 'pointerup' && performance.now() - gesture.t < 600) {
    tapAt(p.x, p.y, gesture.touch);
  }
  if (pointers.size === 1) {
    const [rest] = [...pointers.values()];
    gesture = { type: 'pan', start: rest, cam: { ...cam }, t: 0, moved: true };
  } else if (!pointers.size) {
    gesture = null;
  }
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', e => {
  if (e.pointerType === 'mouse' && state.hover && !pointers.size) { state.hover = null; canvas.classList.remove('over'); requestDraw(); }
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  dropHint();
  anim = null;
  const p = local(e);
  const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0022));
  zoomAt(p.x, p.y, cam.k * factor);
}, { passive: false });

canvas.addEventListener('dblclick', e => {
  const p = local(e);
  const target = { k: cam.k * 2 };
  const wx = cam.x + (p.x - W / 2) / cam.k, wy = cam.y + (p.y - H / 2) / cam.k;
  target.x = wx - (p.x - W / 2) / clampK(target.k);
  target.y = wy - (p.y - H / 2) / clampK(target.k);
  animateTo(target, 350);
});

const clampK = k => Math.min(fitK * 18, Math.max(fitK * 0.8, k));

function zoomAt(x, y, k) {
  k = clampK(k);
  const wx = cam.x + (x - W / 2) / cam.k, wy = cam.y + (y - H / 2) / cam.k;
  cam.k = k;
  cam.x = wx - (x - W / 2) / k;
  cam.y = wy - (y - H / 2) / k;
  clampCam(cam);
  requestDraw();
}

function tapAt(x, y, touch) {
  const n = hitTest(x, y, touch);
  if (n) { choose(n); return; }
  if (!state.picking && (state.sel || state.group)) clearAll();
}

// ---------------------------------------------------------------- choosing horses

function choose(n) {
  dropHint();
  if (state.picking && state.sel) {
    if (n === state.sel) return;
    compare(state.sel, n);
  } else {
    select(n);
  }
}

function select(n, { fly = true } = {}) {
  Object.assign(state, { sel: n, other: null, picking: false, group: null });
  render();
  if (fly) flyTo(n);
}

function compare(a, b, { fly = true } = {}) {
  Object.assign(state, { sel: a, other: b, picking: false, group: null });
  render();
  if (fly) {
    const r = relate(a, b);
    flyToFit(r.ancestor ? [a, b, r.ancestor] : [a, b]);
  }
}

function showGroup(key) {
  Object.assign(state, { sel: null, other: null, picking: false, group: key });
  render();
  animateTo(fitView());
}

function clearAll() {
  Object.assign(state, { sel: null, other: null, picking: false, group: null });
  render();
}

// ---------------------------------------------------------------- the panel

const panel = document.getElementById('panel');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const swatch = n => `<i class="sw" style="--c: var(${FOUNDER_VAR[n.founder.name]})"></i>`;
const hlink = n => `<button type="button" class="link" data-horse="${esc(n.name)}">${esc(n.name)}</button>`;
const the = f => (f.name.startsWith('Byerley') ? 'the Byerley Turk' : `the ${f.name}`);
const list = items => (items.length < 3 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

function descendantWord(g, n) {
  const kid = n.tags.includes('m') ? 'daughter' : 'son';
  if (g === 1) return kid;
  if (g === 2) return `grand${kid}`;
  if (g === 3) return `great-grand${kid}`;
  return `${ordinalShort(g - 2)} great-grand${kid}`;
}
function ordinalShort(n) {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  return `${n}${s}`;
}

function chain(from, to, { here, meet } = {}) {
  // from is an ancestor of to (or the same horse); list every step.
  const steps = [];
  for (let x = to; x; x = x.parent) { steps.push(x); if (x === from) break; }
  steps.reverse();
  const c = `var(${FOUNDER_VAR[to.founder.name]})`;
  return `<ol class="chain" style="--c: ${c}">${steps.map(n => {
    const cls = [n === here ? 'here' : '', n === meet ? 'meet' : ''].filter(Boolean).join(' ');
    const name = n === here ? esc(n.name) : hlink(n);
    return `<li${cls ? ` class="${cls}"` : ''}>${name}<span class="yr">${yearText(n)}</span></li>`;
  }).join('')}</ol>`;
}

function introHTML() {
  const founders = LEGEND_ORDER.map(horse);
  return `
    <h2>Three stallions, three hundred years</h2>
    <p>Follow any thoroughbred\u2019s father, then his father, and so on back. You end up at one of three horses brought to England between about 1690 and 1730.</p>
    <p class="fine">Each line runs from a father to a son. The further from the centre, the later the horse was foaled, so the rings work like a tree\u2019s: one every 50 years.</p>
    <ul class="founders">${founders.map(f => `
      <li><button type="button" data-horse="${esc(f.name)}">${swatch(f)}<b>${esc(f.name)} <span class="meta">${yearText(f)}</span></b><small>${esc(FOUNDER_LINE[f.name])}</small></button></li>`).join('')}
    </ul>
    <h3>How are they related?</h3>
    <div class="chips">${TRIES.map(([a, b]) => `<button type="button" class="chip" data-pair="${esc(a)}|${esc(b)}">${esc(a)} &amp; ${esc(b)}</button>`).join('')}</div>
    <h3>Show</h3>
    <div class="chips">${Object.entries(GROUPS).map(([key, g]) => `<button type="button" class="chip" data-group="${key}">${esc(g.title)}</button>`).join('')}</div>
    ${aboutHTML()}`;
}

function aboutHTML() {
  return `
    <details>
      <summary>About this chart</summary>
      <p>It follows the sire line: father, father\u2019s father and so on. That\u2019s how breeders group horses, and it\u2019s the path the Y chromosome takes. Through their mothers, thoroughbreds carry all three founders many times over.</p>
      <p>The chart holds ${nodes.length} horses: the famous ones and every stallion needed to join them up. Most of the stallions who ever lived are left out, including every line that died out quietly. Hollow dots are mares and geldings, where the male line stops.</p>
      <p>The 95% figure is from a 2005 study of the stud books by Patrick Cunningham\u2019s group at Trinity College Dublin (<a href="https://www.newscientist.com/article/dn7946-95-of-thoroughbreds-linked-to-one-superstud/" rel="noopener">New Scientist</a>). The pedigrees were checked against Wikipedia\u2019s articles on each horse.</p>
    </details>`;
}

function horseHTML(n) {
  const f = n.founder;
  const kids = n.children;
  const kidWord = kids.every(c => !c.tags.includes('m')) ? (kids.length === 1 ? 'Son' : 'Sons') : (kids.length === 1 ? 'Daughter' : 'Offspring');
  const meta = n.isFounder
    ? `Foaled ${yearText(n)} · one of the three founders`
    : `Foaled ${yearText(n)} · ${generations(n)} after ${the(f)}`;
  const family = [];
  if (n.parent) family.push(`By ${hlink(n.parent)}.`);
  if (kids.length) family.push(`${kidWord} on the chart: ${list(kids.map(hlink))}.`);
  if (n.ends) family.push(n.tags.includes('m') ? 'As a mare, she ends her father’s line here.' : 'As a gelding, he ends his father’s line here.');
  return `
    <div class="phead"><p class="kicker">${swatch(n)}${esc(f.name)} line</p><button type="button" class="x" data-act="close" aria-label="Close">×</button></div>
    <h2>${esc(n.name)}</h2>
    <p class="meta">${meta}</p>
    ${n.note ? `<p class="note">${esc(n.note)}</p>` : ''}
    ${family.length ? `<p>${family.join(' ')}</p>` : ''}
    <button type="button" class="act primary" data-act="pick">How is ${esc(n.name)} related to…</button>
    ${n.isFounder ? '' : `<h3>Father to son, from the founder</h3>${chain(f, n, { here: n })}`}`;
}

function pickHTML(n) {
  const picks = ['Secretariat', 'Frankel', 'Winx', 'Seabiscuit', 'Man o’ War', 'Northern Dancer', 'Eclipse', 'Justify', 'Black Caviar']
    .map(horse).filter(h => h !== n);
  return `
    <div class="phead"><p class="kicker">${swatch(n)}${esc(n.name)}</p><button type="button" class="x" data-act="cancel-pick" aria-label="Cancel">×</button></div>
    <h2>Related to whom?</h2>
    <p>Tap a second horse on the chart, or find one with the search box.</p>
    <div class="chips">${picks.map(h => `<button type="button" class="chip" data-horse="${esc(h.name)}">${esc(h.name)}</button>`).join('')}</div>`;
}

function compareHTML(a, b) {
  const r = relate(a, b);
  const head = `<div class="phead"><p class="kicker">How they’re related</p><button type="button" class="x" data-act="close" aria-label="Close">×</button></div>
    <h2>${esc(a.name)} &amp; ${esc(b.name)}</h2>`;
  const again = `<button type="button" class="act" data-act="pick">Compare ${esc(a.name)} with someone else</button>`;
  const fine = `<p class="fine">Counting fathers only. Through their mothers, thoroughbreds are related many times over.</p>`;

  if (r.kind === 'none') {
    return `${head}
      <p class="big">${esc(r.headline)}</p>
      <p>${esc(a.name)} goes back to ${the(a.founder)} and ${esc(b.name)} to ${the(b.founder)}, so their fathers’ lines never meet. Through their mothers, both carry all three founders many times over.</p>
      <div class="pair">
        <div><h4>${esc(a.name)}</h4>${chain(a.founder, a, { here: a })}</div>
        <div><h4>${esc(b.name)}</h4>${chain(b.founder, b, { here: b })}</div>
      </div>
      ${again}`;
  }

  const ca = r.ancestor;
  if (r.kind === 'ancestor') {
    const { older, younger } = r;
    const g = Math.max(r.ga, r.gb);
    return `${head}
      <p class="big">${esc(r.headline)}</p>
      <p>${esc(younger.name)} was foaled ${younger.year - older.year} years after ${esc(older.name)}, ${g} ${g === 1 ? 'generation' : 'generations'} down the line.</p>
      ${chain(older, younger, { here: younger, meet: older })}
      ${again}`;
  }

  let why;
  if (r.kind === 'siblings') {
    why = `Both are by ${hlink(ca)}. (In racing, “brother” and “sister” are kept for horses with the same mother.)`;
  } else if (r.kind === 'uncle') {
    const { older, younger } = r;
    const gy = younger === a ? r.ga : r.gb;
    why = `${esc(older.name)} is a ${descendantWord(1, older)} of ${hlink(ca)}, and ${esc(younger.name)} is his ${descendantWord(gy, younger)}.`;
  } else {
    why = `Their fathers’ lines meet at ${hlink(ca)}, foaled ${yearText(ca)}. ${esc(a.name)} is his ${descendantWord(r.ga, a)}; ${esc(b.name)} is his ${descendantWord(r.gb, b)}.`;
  }
  return `${head}
    <p class="big">${esc(r.headline)}</p>
    <p>${why}</p>
    <div class="pair">
      <div><h4>${esc(a.name)}</h4>${chain(ca, a, { here: a, meet: ca })}</div>
      <div><h4>${esc(b.name)}</h4>${chain(ca, b, { here: b, meet: ca })}</div>
    </div>
    <p class="fine">Before ${esc(ca.name)}, they share the line back to ${the(ca.founder)}: ${ca.depth} more ${ca.depth === 1 ? 'generation' : 'generations'}.</p>
    ${fine}
    ${again}`;
}

function groupHTML(key) {
  const g = GROUPS[key];
  return `
    <div class="phead"><p class="kicker">${g.members.length} horses</p><button type="button" class="x" data-act="close" aria-label="Close">×</button></div>
    <h2>${esc(g.title)}</h2>
    <p>${esc(g.blurb)}</p>
    <ul class="group">${g.members.map(m => `<li><button type="button" data-horse="${esc(m.name)}">${swatch(m)}${esc(m.name)}<span class="yr">${yearText(m)}</span></button></li>`).join('')}</ul>`;
}

function render() {
  if (state.picking && state.sel) panel.innerHTML = pickHTML(state.sel);
  else if (state.sel && state.other) panel.innerHTML = compareHTML(state.sel, state.other);
  else if (state.sel) panel.innerHTML = horseHTML(state.sel);
  else if (state.group) panel.innerHTML = groupHTML(state.group);
  else panel.innerHTML = introHTML();
  panel.scrollTop = 0;
  input.placeholder = state.picking ? `Compare ${state.sel.name} with…` : 'Find a horse';
  writeHash();
  requestDraw();
}

panel.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.horse) choose(horse(t.dataset.horse));
  else if (t.dataset.pair) { const [a, b] = t.dataset.pair.split('|').map(horse); compare(a, b); }
  else if (t.dataset.group) showGroup(t.dataset.group);
  else if (t.dataset.act === 'close') clearAll();
  else if (t.dataset.act === 'pick') {
    state.picking = true;
    render();
    if (matchMedia('(pointer: fine)').matches) input.focus();
  } else if (t.dataset.act === 'cancel-pick') {
    state.picking = false;
    render();
  }
});

// ---------------------------------------------------------------- legend and zoom buttons

const legend = document.getElementById('legend');
legend.innerHTML = LEGEND_ORDER.map(name =>
  `<li><button type="button" data-horse="${esc(name)}"><i class="sw" style="--c: var(${FOUNDER_VAR[name]})"></i>${esc(name)}</button></li>`).join('');
legend.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (t) choose(horse(t.dataset.horse));
});

document.querySelector('.zoom').addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) return;
  dropHint();
  const k = cam.k;
  if (t.dataset.act === 'zoom-in') animateTo({ x: cam.x, y: cam.y, k: k * 1.8 }, 300);
  if (t.dataset.act === 'zoom-out') animateTo({ x: cam.x, y: cam.y, k: k / 1.8 }, 300);
  if (t.dataset.act === 'zoom-fit') animateTo(fitView(), 500);
});

// ---------------------------------------------------------------- search

const input = document.getElementById('q');
const suggest = document.getElementById('suggest');
let results = [];
let active = 0;

function showSuggest() {
  results = search(nodes, input.value);
  active = 0;
  if (!input.value.trim()) { hideSuggest(); return; }
  suggest.hidden = false;
  input.setAttribute('aria-expanded', 'true');
  if (!results.length) {
    suggest.innerHTML = `<li class="none" role="option" aria-disabled="true">No horse by that name here</li>`;
    return;
  }
  paintSuggest();
}
function paintSuggest() {
  suggest.innerHTML = results.map((n, i) =>
    `<li role="option" id="opt-${i}" data-i="${i}" aria-selected="${i === active}">${swatch(n)}<span>${esc(n.name)}</span><span class="yr">${yearText(n)}</span></li>`).join('');
  input.setAttribute('aria-activedescendant', results.length ? `opt-${active}` : '');
}
function hideSuggest() {
  suggest.hidden = true;
  input.setAttribute('aria-expanded', 'false');
  input.removeAttribute('aria-activedescendant');
}
function pickResult(n) {
  input.value = '';
  hideSuggest();
  if (!matchMedia('(pointer: fine)').matches) input.blur();
  choose(n);
}

input.addEventListener('input', showSuggest);
input.addEventListener('focus', () => { if (input.value.trim()) showSuggest(); });
input.addEventListener('blur', () => setTimeout(hideSuggest, 150));
input.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' && results.length) { e.preventDefault(); active = (active + 1) % results.length; paintSuggest(); }
  else if (e.key === 'ArrowUp' && results.length) { e.preventDefault(); active = (active - 1 + results.length) % results.length; paintSuggest(); }
  else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) pickResult(results[active]); }
  else if (e.key === 'Escape') {
    if (!suggest.hidden) hideSuggest();
    else if (state.picking) { state.picking = false; render(); }
    input.value = '';
  }
});
suggest.addEventListener('pointerdown', e => {
  const li = e.target.closest('li[data-i]');
  if (!li) return;
  e.preventDefault();
  pickResult(results[+li.dataset.i]);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.activeElement !== input) {
    if (state.picking) { state.picking = false; render(); } else if (state.sel || state.group) clearAll();
  }
  if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
});

// ---------------------------------------------------------------- links you can share: #Secretariat, #Secretariat/Frankel, #show=us3

function writeHash() {
  let h = '';
  if (state.sel && state.other) h = `${encodeURIComponent(state.sel.name)}/${encodeURIComponent(state.other.name)}`;
  else if (state.sel) h = encodeURIComponent(state.sel.name);
  else if (state.group) h = `show=${state.group}`;
  const url = h ? `#${h}` : location.pathname + location.search;
  // Some embedded views don't allow changing the address; the app works the same without it.
  try { if (location.hash.slice(1) !== h) history.replaceState(null, '', url); } catch {}
}

function readHash({ fly }) {
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h) return false;
  if (h.startsWith('show=') && GROUPS[h.slice(5)]) { showGroup(h.slice(5)); return true; }
  const [a, b] = h.split('/').map(s => horse(s.replace(/'/g, '’')) || horse(s));
  if (a && b) { compare(a, b, { fly }); return true; }
  if (a) { select(a, { fly }); return true; }
  return false;
}

// ---------------------------------------------------------------- start

readColors();
new ResizeObserver(resize).observe(stage);
resize();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readColors(); requestDraw(); });
if (!readHash({ fly: true })) render();
window.addEventListener('hashchange', () => readHash({ fly: true }));
document.fonts?.ready.then(() => { widthCache.clear(); requestDraw(); });

if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// For the screenshot and test tools.
window.bloodlines = {
  select: name => select(horse(name)),
  compare: (a, b) => compare(horse(a), horse(b)),
  group: key => showGroup(key),
  clear: clearAll,
  labels: () => placedLabels.map(p => p.n.name),
  settle: () => { if (anim) { Object.assign(cam, anim.to); anim = null; } draw(); },
  where: name => { const n = horse(name); return { x: sx(n.x), y: sy(n.y) }; },
  view: () => ({ W, H, k: cam.k, fitK, r1: geo.r1 }),
  count: nodes.length,
};
