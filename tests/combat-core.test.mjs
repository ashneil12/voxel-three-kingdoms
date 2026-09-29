import test from 'node:test';
import assert from 'node:assert/strict';
import { guardHit } from '../src/hero/guard.js';
import { lockedTarget, selectLock } from '../src/camera/lock.js';
import { bossReady } from '../src/boss/timing.js';
import { followYaw } from '../src/camera/follow.js';

const hero = () => ({ x: 0, z: 0, yaw: 0, hp: 100, state: 'guard', guard: 100,
  guardMax: 100, guardStart: 10, parryCd: 0, guardWait: 0 });

test('front hit in the short guard window parries once without HP damage', () => {
  const h = hero();
  assert.equal(guardHit(h, 15, 40, 0, 2)?.type, 'parry');
  assert.equal(h.hp, 100);
  assert.equal(h.parryCd, 150);
  assert.equal(guardHit(h, 16, 40, 0, 2)?.type, 'block');
  assert.equal(h.hp, 92);
});

test('sustained guard drains meter, chips health, and rear hits bypass it', () => {
  const h = hero();
  assert.equal(guardHit(h, 30, 40, 0, -2), null);
  assert.equal(h.guard, 100);
  const hit = guardHit(h, 30, 40, 0, 2);
  assert.deepEqual(hit, { type: 'block', chip: 8, broken: false });
  assert.equal(h.guard, 68);
  guardHit(h, 31, 100, 0, 2);
  assert.equal(h.guard, 0);
});

function game() {
  const c = { N: 2, grunts: 1, st: [3, 3], hp: [30, 100], x: [2, 4], z: [5, 4], y: [0, 0], type: [0, 1] };
  return { hero: { x: 0, z: 0 }, cam: { yaw: 0, lock: null }, crowd: c, boss: null };
}

test('lock prefers an on-screen elite and prioritizes an active boss', () => {
  const g = game();
  assert.deepEqual(selectLock(g), { kind: 'crowd', index: 1 });
  g.cam.lock = { kind: 'crowd', index: 1 };
  assert.equal(lockedTarget(g)?.name, 'ELITE UNIT');
  g.boss = { x: 3, z: 7, y: 0, def: { en: 'WARDEN' }, alive: () => true };
  assert.deepEqual(selectLock(g), { kind: 'boss' });
  g.cam.lock = { kind: 'boss' };
  assert.equal(lockedTarget(g)?.name, 'WARDEN');
  g.boss.x = 50;
  assert.equal(lockedTarget(g), null);
});

test('boss has a minimum wave duration, KO shortcut, and eventual timeout', () => {
  const cfg = { earliest: 4200, arrive: 6900, arriveKOs: 60 };
  assert.equal(bossReady(1800, 80, cfg), false);
  assert.equal(bossReady(4200, 60, cfg), true);
  assert.equal(bossReady(6901, 0, cfg), true);
  assert.equal(bossReady(0, 0, { earliest: 0, arrive: 60, arriveKOs: 60 }), false);
  assert.equal(bossReady(61, 0, { earliest: 0, arrive: 60, arriveKOs: 60 }), true);
});

test('auto camera takes the short turn and never exceeds its frame cap', () => {
  const yaw = Math.PI - 0.1, target = -Math.PI + 0.1;
  const next = followYaw(yaw, target, 0.5, 0.036);
  assert.ok(next > yaw); // begins turning toward the nearby target across the wrap boundary
  const delta = Math.atan2(Math.sin(next - yaw), Math.cos(next - yaw));
  assert.ok(delta > 0 && delta <= 0.036001);
  let turned = yaw;
  for (let i = 0; i < 10; i++) turned = followYaw(turned, target, 0.5, 0.036);
  assert.ok(turned < 0); // completes the short crossing
  assert.equal(followYaw(0.5, 0.5, 0.055, 0.036), 0.5);
});
