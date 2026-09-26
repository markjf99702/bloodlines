// The family tree as data: who descends from whom, where each horse sits on the chart,
// and how two horses are related through their fathers. No drawing here, so it can be tested in Node.

export const YEAR0 = 1680;   // the centre of the chart
export const YEAR1 = 2025;   // the outer rim

export function buildTree(horses, founders) {
  const byName = new Map();
  for (const h of horses) byName.set(h.name, { ...h, parent: null, children: [] });
  for (const n of byName.values()) {
    if (!n.sire) continue;
    const p = byName.get(n.sire);
    if (!p) throw new Error(`${n.name}: sire ${n.sire} is not in the data`);
    n.parent = p;
    p.children.push(n);
  }
  for (const n of byName.values()) n.children.sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));

  const roots = founders.map(f => byName.get(f));
  const visit = (n, founder, depth) => {
    n.founder = founder;
    n.depth = depth;
    n.leaves = n.children.length ? 0 : 1;
    n.size = 1;
    for (const c of n.children) {
      visit(c, founder, depth + 1);
      n.leaves += c.leaves;
      n.size += c.size;
    }
  };
  roots.forEach(r => visit(r, r, 0));
  for (const n of byName.values()) {
    if (!n.founder) throw new Error(`${n.name} does not trace back to a founder`);
  }
  return { byName, roots, nodes: [...byName.values()] };
}

// Polar layout: the angle comes from the horse's place in the tree, the radius from the year it was foaled.
// Leaves share the circle evenly; each sire sits midway between its first and last child.
export function layout(tree, { r0 = 70, r1 = 1000, gapDeg = 16, founderGap = 3 } = {}) {
  const leafCount = tree.roots.reduce((s, r) => s + r.leaves, 0);
  const sweep = (2 * Math.PI) * (1 - gapDeg / 360);
  const unit = sweep / (leafCount + founderGap * (tree.roots.length - 1));
  let cursor = -Math.PI / 2 + (gapDeg / 360) * Math.PI + unit / 2;

  const place = n => {
    if (!n.children.length) {
      n.angle = cursor;
      cursor += unit;
    } else {
      n.children.forEach(place);
      n.angle = (n.children[0].angle + n.children[n.children.length - 1].angle) / 2;
    }
  };
  tree.roots.forEach((r, i) => {
    if (i) cursor += unit * founderGap;
    place(r);
  });

  const radius = year => r0 + (year - YEAR0) / (YEAR1 - YEAR0) * (r1 - r0);
  for (const n of tree.nodes) {
    n.r = radius(n.year);
    n.x = n.r * Math.cos(n.angle);
    n.y = n.r * Math.sin(n.angle);
  }
  return { r0, r1, unit, radius };
}

// Founder first, the horse itself last.
export function lineage(n) {
  const out = [];
  for (let x = n; x; x = x.parent) out.push(x);
  return out.reverse();
}

const WORDS = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
export function ordinal(n) {
  if (n < WORDS.length) return WORDS[n];
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  return `${n}${s}`;
}

const TIMES = ['', 'once', 'twice'];
const removed = n => (n ? `, ${TIMES[n] || `${n} times`} removed` : '');
const female = n => n.tags.includes('m');

// "father", "grandfather", "great-grandfather", "second great-grandfather", ...
export function ancestorWord(gens) {
  if (gens === 1) return 'father';
  if (gens === 2) return 'grandfather';
  if (gens === 3) return 'great-grandfather';
  return `${ordinal(gens - 2)} great-grandfather`;
}

// "uncle", "great-uncle", "second great-uncle", ...
function uncleWord(gens, isFemale) {
  const base = isFemale ? 'aunt' : 'uncle';
  if (gens === 2) return base;
  if (gens === 3) return `great-${base}`;
  return `${ordinal(gens - 2)} great-${base}`;
}

export function generations(n) {
  return n.depth === 1 ? '1 generation' : `${n.depth} generations`;
}

// How two horses are related through their fathers' lines.
// Returns { kind, ancestor, ga, gb, headline } where ga/gb count father-to-son steps from each horse up to the
// ancestor they share. kind is 'same', 'none' (different founders), 'ancestor', 'siblings', 'uncle' or 'cousins'.
export function relate(a, b) {
  if (a === b) return { kind: 'same', headline: 'The same horse' };
  const pa = lineage(a);
  const pb = lineage(b);
  if (pa[0] !== pb[0]) return { kind: 'none', headline: 'Not related through their fathers' };

  let i = 0;
  while (i < pa.length && i < pb.length && pa[i] === pb[i]) i++;
  const ancestor = pa[i - 1];
  const ga = a.depth - ancestor.depth;
  const gb = b.depth - ancestor.depth;
  const base = { ancestor, ga, gb };

  if (ga === 0) return { ...base, kind: 'ancestor', older: a, younger: b, headline: `${a.name} is ${b.name}\u2019s ${ancestorWord(gb)}` };
  if (gb === 0) return { ...base, kind: 'ancestor', older: b, younger: a, headline: `${b.name} is ${a.name}\u2019s ${ancestorWord(ga)}` };
  if (ga === 1 && gb === 1) return { ...base, kind: 'siblings', headline: 'Same father' };
  if (ga === 1) return { ...base, kind: 'uncle', older: a, younger: b, headline: `${a.name} is ${b.name}\u2019s ${uncleWord(gb, female(a))}` };
  if (gb === 1) return { ...base, kind: 'uncle', older: b, younger: a, headline: `${b.name} is ${a.name}\u2019s ${uncleWord(ga, female(b))}` };

  const degree = Math.min(ga, gb) - 1;
  const word = ordinal(degree);
  const headline = `${word[0].toUpperCase()}${word.slice(1)} cousins${removed(Math.abs(ga - gb))}`;
  return { ...base, kind: 'cousins', degree, removed: Math.abs(ga - gb), headline };
}

// For the search box: accents, punctuation and "the" don't matter.
export function normalize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/['\u2019.]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function search(nodes, query, limit = 8) {
  const q = normalize(query);
  if (!q) return [];
  const scored = [];
  for (const n of nodes) {
    const name = normalize(n.name);
    const bare = name.replace(/^the /, '');
    let score = -1;
    if (name === q || bare === q) score = 0;
    else if (name.startsWith(q) || bare.startsWith(q)) score = 1;
    else if (name.split(' ').some(w => w.startsWith(q))) score = 2;
    else if (name.includes(q)) score = 3;
    else if (name.replace(/ /g, '').includes(q.replace(/ /g, ''))) score = 4;
    if (score >= 0) scored.push({ n, score });
  }
  scored.sort((x, y) => x.score - y.score || y.n.tags.includes('k') - x.n.tags.includes('k') || x.n.name.localeCompare(y.n.name));
  return scored.slice(0, limit).map(s => s.n);
}
