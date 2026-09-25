// Per-hero fighting style: rewrites the shared moveset (moves.js) once at load, before the clips (anims/attacks.js),
// audio cues and vfx read it, so every system stays keyed to the same frames.
//   tempo   time scale of every frame number (1.1 = 10 % slower: frames, windows, cancels, lunges, leaps, anim keys)
//   reach   × hit range / line length (and ½ of it on line width) · arc: + degrees on every arc
//   dmg     × damage · force: × knockback and lift
//   armor   'all' (every ground move) | 'heavy' (N3 on, charges, dash) — hyper armour against officers
//   moves   (M) => void: signature changes after the scaling (new windows, projectiles `proj`, roars, beams)
// A hit window may carry `proj: { speed m/s, life frames, r m, count, spread deg, y }`: instead of striking around the
// hero it launches `count` projectiles (combat.js) that strike a circle of radius r as they fly, each enemy once.

const ONCE = 99;
const TIMED = ['frames', 'cancel', 'branch', 'dodgeCancel', 'steer', 'landFrame'];

export function applyStyle(M, st) {
  if (!st) return;
  const T = st.tempo || 1, f = (v) => Math.max(0, Math.round(v * T));
  for (const [id, m] of Object.entries(M)) {
    if (T !== 1) {
      const F0 = m.frames;
      for (const k of TIMED) if (m[k] != null && m[k] <= F0) m[k] = f(m[k]);   // 99 = "never" sentinels stay
      for (const k of ['leap', 'plunge']) if (m[k]) m[k] = [f(m[k][0]), m[k][1]];
      if (m.hang) m.hang = m.hang.map(f);
      m.lunge = m.lunge.map(([a, b, d, e]) => [f(a), Math.max(f(a) + 1, f(b)), d, e]);
      if (m.anim) for (const k of m.anim) k[0] = f(k[0]);
      for (const h of m.hits) {
        h.f = [f(h.f[0]), Math.max(f(h.f[0]), f(h.f[1]))];
        if (h.every && h.every < ONCE) h.every = Math.max(1, f(h.every));
        if (h.sweepN) h.sweepN = Math.max(1, f(h.sweepN));
      }
    }
    for (const h of m.hits) {
      if (st.reach) { if (h.range) h.range *= st.reach; if (h.len) h.len *= st.reach; if (h.width) h.width *= 1 + (st.reach - 1) / 2; }
      if (st.arc && h.ang) h.ang = Math.min(360, h.ang + st.arc);
      if (st.dmg) h.dmg = Math.round(h.dmg * st.dmg);
      if (st.force) { h.force *= st.force; if (h.lift) h.lift *= Math.sqrt(st.force); }
    }
    if (st.armor === 'all' && !m.air) m.armor = true;
    if (st.armor === 'heavy' && !m.air && !/^n[12]$/.test(id)) m.armor = true;
  }
  if (st.moves) st.moves(M);
  // keep the invariants moves.js checks: the △ branch comes after the last strike and no later than the beat
  for (const m of Object.values(M)) {
    if (m.branch != null) m.branch = Math.min(m.cancel, Math.max(m.branch, m.hits.at(-1).f[1] + 1));
    m.tell = m.hits.length ? m.hits[0].f[0] : 0;
  }
}
