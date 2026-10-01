import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./helpers/three-resolve.mjs', import.meta.url);
globalThis.location ??= { search: '' };
globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
const { STAGES } = await import('../src/stages/index.js');
const { LOOKS } = await import('../src/post/post.js');
const { vox, B } = await import('../src/hero/model.js');

test('demo stages: unique ids, a known set builder, a look that exists', () => {
  const ids = STAGES.map((s) => s.id);
  assert.deepEqual(ids, ['foundry', 'day', 'dusk', 'night', 'city']);
  for (const s of STAGES) {
    assert.ok(LOOKS[s.look], `${s.id}: look '${s.look}' exists`);
    assert.ok(['foundry', 'city', 'pass', 'river', undefined].includes(s.set), `${s.id}: set '${s.set}' has a builder in world.js`);
    assert.ok(s.enemy && s.boss && s.ally, `${s.id}: keeps the machine legion + boss`);
  }
});

test('every demo stage carries the anti-blob caps and a measured exposure key', () => {
  for (const s of STAGES) {
    const p = { ...LOOKS[s.look], ...s.post };
    assert.ok(p.bloom <= 0.5, `${s.id}: bloom ${p.bloom}`);
    assert.ok(p.bloomThreshold >= 1.7, `${s.id}: bloom threshold ${p.bloomThreshold}`);
    assert.ok(p.nearBlur <= 10, `${s.id}: near blur ${p.nearBlur}`);
    assert.ok(p.hdrClamp <= 2, `${s.id}: hdr clamp ${p.hdrClamp}`);
    assert.ok(p.aeKey > 0 && p.aeKey < 1, `${s.id}: aeKey ${p.aeKey}`);
    assert.ok(p.aeStrength > 0 && p.aeMin < 1 && p.aeMax > 1, `${s.id}: auto-exposure on and bounded`);
  }
});

test('outdoor stages: cloud shadows and ground bounce only where configured', () => {
  const by = Object.fromEntries(STAGES.map((s) => [s.id, s]));
  assert.ok(by.day.post.cloud > 0 && by.dusk.post.cloud > 0);
  assert.ok(!by.night.post.cloud && !(by.foundry.post?.cloud));
  assert.ok(by.day.light.bounce > 0 && by.dusk.light.bounce > 0 && !by.night.light.bounce);
});

test('hero vox(): plate attributes on every vertex, merged across a one-colour block', () => {
  const g = vox([B([0, 0, 0], [3, 2, 1], 0xdcdee2)], 0.0125);
  const n = g.attributes.position.count;
  assert.equal(g.attributes.vuv.count, n); assert.equal(g.attributes.vsz.count, n);
  const sz = g.attributes.vsz.array, nor = g.attributes.normal.array;
  for (let v = 0; v < n; v++) if (nor[v * 3 + 2] > 0.5) { assert.equal(sz[v * 2], 3); assert.equal(sz[v * 2 + 1], 2); }   // +z face = one 3x2 plate
  for (const x of g.attributes.vuv.array) assert.ok(Number.isFinite(x));
});
