import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./helpers/three-resolve.mjs', import.meta.url);
globalThis.location ??= { search: '' };
const { voxelGeometry } = await import('../src/core/voxel.js');

// plate attributes per vertex: vuv = (u, v inside the plate in voxels, 1 + plate hash), vsz = (plate w, h)
const facesUp = (g) => {
  const n = g.attributes.normal.array, uv = g.attributes.vuv.array, sz = g.attributes.vsz.array, out = [];
  for (let v = 0; v < n.length / 3; v++) if (n[v * 3 + 1] > 0.5) out.push({ u: uv[v * 3], w: uv[v * 3 + 1], h: uv[v * 3 + 2], sw: sz[v * 2], sh: sz[v * 2 + 1] });
  return out;
};

test('a one-colour bar merges into one plate per face: the bevel spans the bar, not each voxel', () => {
  const g = voxelGeometry(4, 1, 1, 0.1, () => 0xaabbcc);
  assert.ok(g.attributes.vuv && g.attributes.vsz, 'plate attributes present');
  assert.equal(g.attributes.vuv.count, g.attributes.position.count);
  const top = facesUp(g);
  assert.equal(top.length, 16, '4 voxel quads x 4 corners on top');
  for (const c of top) { assert.equal(c.sw, 4); assert.equal(c.sh, 1); assert.ok(c.h >= 1 && c.h < 2, 'hash flag > 0.5 marks "has plate data"'); }
  const us = top.map((c) => c.u);
  assert.equal(Math.min(...us), 0); assert.equal(Math.max(...us), 4, 'u runs continuously 0..4 across the merged plate');
});

test('a colour change splits plates', () => {
  const g = voxelGeometry(4, 1, 1, 0.1, (i) => (i < 2 ? 0x111111 : 0x222222));
  const widths = new Set(facesUp(g).map((c) => c.sw));
  assert.deepEqual([...widths], [2]);
});

test('every attribute is finite (NaN here would reach the surface shader)', () => {
  const g = voxelGeometry(3, 3, 3, 0.05, (i, j, k) => ((i + j + k) % 2 ? 0x335577 : (i === 1 && j === 1 ? -1 : 0xddccaa)));
  for (const a of ['vuv', 'vsz', 'position']) for (const x of g.attributes[a].array) assert.ok(Number.isFinite(x), a);
});
