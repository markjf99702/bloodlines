// The family tree's logic, without a browser:  node --test test/tree.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HORSES, FOUNDERS } from '../js/horses.js';
import { buildTree, layout, lineage, relate, search, ordinal } from '../js/tree.js';

const tree = buildTree(HORSES, FOUNDERS);
layout(tree);
const h = name => {
  const n = tree.byName.get(name);
  assert.ok(n, `${name} is on the chart`);
  return n;
};

test('every horse traces back to a founder, and every name is used once', () => {
  assert.equal(tree.byName.size, HORSES.length);
  for (const n of tree.nodes) assert.ok(FOUNDERS.includes(lineage(n)[0].name), n.name);
});

test('every father was born at least three years before his foal, and was a stallion', () => {
  for (const n of tree.nodes) {
    if (!n.parent) continue;
    assert.ok(n.year - n.parent.year >= 3, `${n.name} (${n.year}) by ${n.parent.name} (${n.parent.year})`);
    assert.ok(!n.parent.tags.includes('m') && !n.parent.tags.includes('g'), `${n.parent.name} can't be a sire`);
  }
});

test('the chart is laid out inside its rim', () => {
  for (const n of tree.nodes) {
    assert.ok(Number.isFinite(n.x) && Number.isFinite(n.y), n.name);
    assert.ok(n.r > 0 && n.r <= 1000, n.name);
  }
});

test('the famous lines are right', () => {
  assert.deepEqual(lineage(h('Eclipse')).map(n => n.name), ['Darley Arabian', 'Bartlett’s Childers', 'Squirt', 'Marske', 'Eclipse']);
  assert.equal(h('Secretariat').founder.name, 'Darley Arabian');
  assert.equal(h('Seabiscuit').founder.name, 'Godolphin Arabian');
  assert.equal(h('Tourbillon').founder.name, 'Byerley Turk');
  assert.equal(h('Secretariat').depth, 22);
});

test('relationships read the way a family tree would', () => {
  assert.equal(relate(h('Secretariat'), h('Frankel')).headline, 'Second cousins, twice removed');
  assert.equal(relate(h('Secretariat'), h('Frankel')).ancestor.name, 'Nearco');
  assert.equal(relate(h('Seabiscuit'), h('War Admiral')).headline, 'War Admiral is Seabiscuit’s uncle');
  assert.equal(relate(h('Winx'), h('Zenyatta')).kind, 'siblings');
  assert.equal(relate(h('Man o’ War'), h('Secretariat')).kind, 'none');
  assert.equal(relate(h('Northern Dancer'), h('Frankel')).headline, 'Northern Dancer is Frankel’s great-grandfather');
  assert.equal(relate(h('Frankel'), h('Northern Dancer')).headline, 'Northern Dancer is Frankel’s great-grandfather');
  assert.equal(relate(h('Galileo'), h('Frankel')).headline, 'Galileo is Frankel’s father');
  assert.equal(relate(h('Frankel'), h('Enable')).headline, 'Frankel is Enable’s uncle');
  assert.equal(relate(h('Enable'), h('Adayar')).headline, 'First cousins');
  assert.equal(relate(h('Winx'), h('Winx')).kind, 'same');
});

test('ordinals', () => {
  assert.equal(ordinal(2), 'second');
  assert.equal(ordinal(11), '11th');
  assert.equal(ordinal(22), '22nd');
  assert.equal(ordinal(23), '23rd');
});

test('search ignores case, accents, punctuation and "the"', () => {
  assert.equal(search(tree.nodes, 'secr')[0].name, 'Secretariat');
  assert.equal(search(tree.nodes, "man o' war")[0].name, 'Man o’ War');
  assert.equal(search(tree.nodes, 'tetrarch')[0].name, 'The Tetrarch');
  assert.equal(search(tree.nodes, 'ap indy')[0].name, 'A.P. Indy');
  assert.equal(search(tree.nodes, 'seabird')[0].name, 'Sea-Bird');
  assert.equal(search(tree.nodes, 'st simon')[0].name, 'St. Simon');
  assert.equal(search(tree.nodes, 'roi herode')[0].name, 'Roi Herode');
  assert.deepEqual(search(tree.nodes, 'zzz'), []);
});
