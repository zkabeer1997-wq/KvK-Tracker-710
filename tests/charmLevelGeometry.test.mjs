import assert from 'node:assert/strict';
import test from 'node:test';
import { CHARM_LEVEL_GEOMETRY, CHARM_TIERS, levelFeatureVector } from '../lib/charmLevelGeometry.mjs';

function cardVec(c) {
  return [c.c * 2.5, c.f * 2.0, (c.p / 6) * 1.5, ...c.r.map((x) => x * 1.2), ...c.a];
}

function dist(a, b) {
  let s = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

test('every level 1-22 has a geometry entry', () => {
  for (let level = 1; level <= 22; level += 1) {
    assert.ok(CHARM_LEVEL_GEOMETRY[level], `missing geometry for level ${level}`);
    assert.ok(CHARM_TIERS.includes(CHARM_LEVEL_GEOMETRY[level].tier), `unknown tier for level ${level}`);
  }
});

test('levelFeatureVector returns a well-formed vector for every level', () => {
  for (let level = 1; level <= 22; level += 1) {
    const v = levelFeatureVector(level);
    assert.ok(v, `no vector for level ${level}`);
    assert.ok(v.c > 0 && v.c <= 1, `circularity out of range at level ${level}: ${v.c}`);
    assert.ok(v.f > 0 && v.f <= 1, `fill out of range at level ${level}: ${v.f}`);
    assert.equal(v.r.length, 6, `radial histogram wrong length at level ${level}`);
    assert.equal(v.a.length, 8, `angular histogram wrong length at level ${level}`);
    assert.ok(Math.abs(v.r.reduce((s, x) => s + x, 0) - 1) < 1e-9, `radial histogram doesn't sum to 1 at level ${level}`);
    assert.ok(Math.abs(v.a.reduce((s, x) => s + x, 0) - 1) < 1e-9, `angular histogram doesn't sum to 1 at level ${level}`);
  }
});

test('levelFeatureVector returns null for an unknown level', () => {
  assert.equal(levelFeatureVector(0), null);
  assert.equal(levelFeatureVector(23), null);
});

test('no two levels produce an identical match vector', () => {
  // A real duplicate here means shape alone can never tell those two levels
  // apart, no matter how good the pixel sampling gets - the reference art
  // has to differ, or the tier/color signal has to carry the distinction.
  const levels = Object.keys(CHARM_LEVEL_GEOMETRY).map(Number);
  const vecs = Object.fromEntries(levels.map((l) => [l, cardVec(levelFeatureVector(l))]));
  const duplicates = [];
  for (let i = 0; i < levels.length; i += 1) {
    for (let j = i + 1; j < levels.length; j += 1) {
      if (dist(vecs[levels[i]], vecs[levels[j]]) < 0.01) {
        duplicates.push([levels[i], levels[j]]);
      }
    }
  }
  assert.deepEqual(duplicates, [], `found exact-duplicate level vectors: ${JSON.stringify(duplicates)}`);
});
