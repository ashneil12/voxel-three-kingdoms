import test from 'node:test';
import assert from 'node:assert/strict';
import { createQualityGovernor } from '../src/core/quality.js';

const rig = (mode = 'auto') => {
  const P = { volume: 0.2, aoContact: 1, ssr: 0.8, ao: 0.9 }, shadow = { res: 4096 }, scale = [];
  const sun = { shadow: { map: { dispose() { this.gone = true; } }, mapSize: { set(w, h) { this.w = w; this.h = h; } }, needsUpdate: false } };
  const q = createQualityGovernor({ P, sun, shadow, setScale: (k) => scale.push(k), mode });
  let t = 1000;
  const feed = (n, dt) => { for (let i = 0; i < n; i++) { t += dt; q.tick(t); } };
  return { q, P, shadow, sun, scale, feed };
};
const quiet = (fn) => { const info = console.info; console.info = () => {}; try { fn(); } finally { console.info = info; } };

test('fast frames never drop quality', () => {
  const r = rig(); r.feed(2000, 8.3);
  assert.equal(r.q.tier, 0); assert.equal(r.P.volume, 0.2); assert.equal(r.shadow.res, 4096);
});
test('sustained slow frames step down one cumulative tier at a time, with a cooldown', () => quiet(() => {
  const r = rig();
  // frame 1 only sets the clock (no interval yet), then 180 cooldown frames, then a full 120-frame window
  r.feed(300, 30); assert.equal(r.q.tier, 0, 'needs the start cooldown + a full window');
  r.feed(1, 30); assert.equal(r.q.tier, 1);
  assert.equal(r.P.volume, 0); assert.equal(r.P.aoContact, 0); assert.equal(r.P.ssr, 0.8);
  r.feed(300, 30); assert.equal(r.q.tier, 2);
  assert.equal(r.P.ssr, 0); assert.equal(r.P.ao, 0); assert.equal(r.shadow.res, 2048);
  assert.equal(r.sun.shadow.map, null, 'old 4096 map released'); assert.equal(r.sun.shadow.needsUpdate, true);
  r.feed(300, 30); assert.equal(r.q.tier, 3); assert.deepEqual(r.scale, [0.75]);
  r.feed(2000, 30); assert.equal(r.q.tier, 3, 'never below the last tier');
}));
test('tab switches and hitches (> 250 ms) are not counted; reset() forgets a paused game', () => quiet(() => {
  const r = rig();
  r.feed(2000, 400); assert.equal(r.q.tier, 0);
  r.feed(250, 30); r.q.reset(); r.feed(100, 30); assert.equal(r.q.tier, 0, 'window restarted after reset');
}));
test('locked modes: high never moves, low applies tier 3 at once, unknown modes fall back to auto', () => quiet(() => {
  const hi = rig('high'); hi.feed(2000, 40); assert.equal(hi.q.tier, 0);
  const lo = rig('low'); assert.equal(lo.q.tier, 3); assert.equal(lo.shadow.res, 2048); assert.deepEqual(lo.scale, [0.75]);
  const two = rig('2'); assert.equal(two.q.tier, 2); assert.deepEqual(two.scale, []);
  const odd = rig('ultra'); odd.feed(600, 30); assert.ok(odd.q.tier >= 1);
}));

test('a caller that does not pass `shadow` (old signature) still steps through tier 2 without throwing', () => quiet(() => {
  const P = { volume: 1, aoContact: 1, ssr: 1, ao: 1 }, sun = { shadow: { mapSize: { set() {} } } };
  const q = createQualityGovernor({ P, sun, setScale() {}, mode: '2' });
  assert.equal(q.tier, 2); assert.equal(P.ssr, 0);
}));
