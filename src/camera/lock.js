// Target selection is sim-side so combat aim and the camera agree on one target.
const OFF = 0, DEAD = 10;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function lockedTarget(game) {
  const lock = game.cam.lock;
  if (!lock) return null;
  const h = game.hero;
  if (lock.kind === 'boss') {
    const b = game.boss;
    if (!b?.alive() || Math.hypot(b.x - h.x, b.z - h.z) > 38) return null;
    return { x: b.x, y: b.y + 1.7, z: b.z, name: b.def.en || 'WARDEN', kind: 'boss' };
  }
  const c = game.crowd, i = lock.index;
  if (i < 0 || i >= c.N || c.st[i] === OFF || c.st[i] === DEAD || c.hp[i] <= 0 ||
      Math.hypot(c.x[i] - h.x, c.z[i] - h.z) > 24) return null;
  return { x: c.x[i], y: c.y[i] + 1.6, z: c.z[i], name: c.type[i] ? 'ELITE UNIT' : 'ROBOT', kind: 'crowd', index: i };
}

export function selectLock(game) {
  const h = game.hero, b = game.boss;
  // Command units take priority as soon as they are close enough to fight.
  if (b?.alive() && Math.hypot(b.x - h.x, b.z - h.z) < 32) return { kind: 'boss' };
  const c = game.crowd;
  let best = -1, score = Infinity;
  for (let i = 0; i < c.N; i++) {
    if (c.st[i] === OFF || c.st[i] === DEAD || c.hp[i] <= 0) continue;
    const dx = c.x[i] - h.x, dz = c.z[i] - h.z, d = Math.hypot(dx, dz);
    if (d > 19 || d < 0.1) continue;
    const a = Math.abs(wrap(Math.atan2(dx, dz) - game.cam.yaw));
    if (a > 1.35) continue;
    const s = d + a * 6 - (c.type[i] ? 4 : 0);
    if (s < score) { score = s; best = i; }
  }
  return best < 0 ? null : { kind: 'crowd', index: best };
}
