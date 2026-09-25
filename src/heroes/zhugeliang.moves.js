// 諸葛亮's own moveset — the strategist does not brawl: light steps, one-handed fan casts, every blow thrown as wind or
// light, the left hand open before him. (Data like hero/moves.js; clips authored with anims/author.js.)
// Fan axes as a weapon: origin = the handle in the right hand, +Z out through the feathers (and the wind blade that
// shows while he attacks, heroes/zhugeliang.js).
//   N1 flick right → left, a wind blade · N2 backhand flick, a blade · N3 half-turn flick, two blades
//   N4 step back, then a thrust of the fan: three blades · N5 fan raised and brought down: a beam of light
//   N6 a full turn, fan held out: a ring of eight blades
//   C1 the palm opens, the fan thrust out: a long beam · C2 (N1→) a whirlwind rising round him (launcher)
//   C3 (N2→) retreating barrage of blades · C4 (N3→) spin: rings of blades · C5 (N4→) pillars of light rain down
//   dash: glides in, then a beam · jatk: a blade thrown down · jc: lands in a ring of blades
import { P } from '../hero/rig.js';
import { locoClips } from './loco.js';

const AIRF = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };   // air string legs

const ONCE = 99;
const BL = (f, o = {}, h = {}) => ({ f: [f, f], every: ONCE, proj: { speed: 22, life: 26, r: 1.2, ...o }, dmg: 12, kb: 'flinch', force: 3, hitstop: 0, ...h });
export function moves() {
  return {
    n1: { frames: 32, next: 'n2', charge: 'c2', cancel: 22, branch: 12, dodgeCancel: 12, steer: 6, lunge: [[2, 8, 0.3]],
      hits: [{ f: [8, 10], every: ONCE, shape: 'arc', range: 2.2, ang: 120, dmg: 8, kb: 'flinch', force: 2, hitstop: 2 }, BL(8)] },
    n2: { frames: 32, next: 'n3', charge: 'c3', cancel: 22, branch: 12, dodgeCancel: 12, steer: 6, lunge: [[2, 8, 0.3]],
      hits: [{ f: [8, 10], every: ONCE, shape: 'arc', range: 2.2, ang: 120, dmg: 8, kb: 'flinch', force: 2, hitstop: 2 }, BL(8)] },
    n3: { frames: 36, next: 'n4', charge: 'c4', cancel: 25, branch: 16, dodgeCancel: 16, steer: 6, lunge: [[3, 12, 0.4]],
      hits: [{ f: [11, 14], every: ONCE, shape: 'arc', range: 2.4, ang: 180, dmg: 9, kb: 'push', force: 4, hitstop: 2 }, BL(12, { count: 2, spread: 40 })] },
    n4: { frames: 40, next: 'n5', charge: 'c5', cancel: 28, branch: 20, dodgeCancel: 20, steer: 6, lunge: [[0, 8, -0.8], [12, 18, 0.6]],
      hits: [{ f: [16, 18], every: ONCE, shape: 'line', len: 2.6, width: 1.4, dmg: 10, kb: 'push', force: 5, hitstop: 3 }, BL(16, { count: 3, spread: 50 })] },
    n5: { frames: 44, next: 'n6', cancel: 32, dodgeCancel: 24, steer: 6, lunge: [[4, 12, 0.3]],
      hits: [{ f: [18, 21], every: ONCE, shape: 'line', len: 9, width: 1.8, dmg: 18, kb: 'blow', force: 9, lift: 4, hitstop: 5, heavy: true, beam: true }] },
    n6: { frames: 54, next: 'n1', charge: 'c1', cancel: 44, dodgeCancel: 30, steer: 6, lunge: [[6, 22, 0.6]], armor: true,
      hits: [{ f: [14, 24], sweep: 1, sweepN: 10, shape: 'circle', range: 2.8, dmg: 12, kb: 'push', force: 6, hitstop: 3 },
        BL(20, { count: 8, spread: 360, speed: 18, life: 24, r: 1.2 }, { dmg: 14, kb: 'blow', force: 8, lift: 4 })] },

    c1: { frames: 70, cancel: 62, dodgeCancel: 42, steer: 14, lunge: [[24, 30, -0.5]], armor: true,
      hits: [{ f: [30, 36], every: 3, shape: 'line', len: 13, width: 2.2, dmg: 12, kb: 'blow', force: 10, lift: 4, hitstop: 3, heavy: true, beam: true }] },
    c2: { frames: 64, cancel: 56, dodgeCancel: 36, steer: 10, armor: true,
      hits: [{ f: [20, 34], every: 5, shape: 'circle', range: 3.8, dmg: 10, kb: 'launch', force: 2, lift: 9, hitstop: 3, heavy: true, pillars: 7 }] },
    c3: { frames: 90, cancel: 82, dodgeCancel: 66, steer: 12, lunge: [[12, 54, -2.2]], armor: true,
      hits: [{ f: [14, 54], every: 6, proj: { speed: 22, life: 24, r: 1.1, count: 2, spread: 24 }, dmg: 8, kb: 'flinch', force: 3, hitstop: 0 },
        { f: [62, 64], every: ONCE, shape: 'line', len: 10, width: 2.4, dmg: 22, kb: 'blow', force: 12, lift: 5, hitstop: 6, heavy: true, beam: true }] },
    c4: { frames: 80, cancel: 72, dodgeCancel: 54, steer: 14, armor: true,
      hits: [{ f: [22, 46], every: 8, shape: 'circle', range: 3.4, dmg: 8, kb: 'spin', force: 5, lift: 2, hitstop: 2 },
        { f: [22, 46], every: 8, proj: { count: 8, spread: 360, speed: 18, life: 22, r: 1.1 }, dmg: 8, kb: 'spin', force: 4, lift: 2, hitstop: 0 }] },
    c5: { frames: 88, cancel: 80, dodgeCancel: 60, steer: 14, armor: true,
      hits: [{ f: [34, 36], every: ONCE, shape: 'arc', range: 8, ang: 130, dmg: 26, kb: 'launch', force: 3, lift: 10, hitstop: 7, heavy: true, rain: 7 },
        { f: [48, 50], every: ONCE, shape: 'arc', range: 9, ang: 150, dmg: 22, kb: 'blow', force: 10, lift: 6, hitstop: 5, heavy: true, rain: 7 }] },

    dash: { frames: 76, cancel: 68, dodgeCancel: 46, steer: 3, lunge: [[0, 36, 5.2, 'lin'], [36, 42, 0.6]],
      hits: [{ f: [8, 32], every: 12, proj: { speed: 22, life: 20, r: 1.0 }, dmg: 8, kb: 'flinch', force: 3, hitstop: 0 },
        { f: [42, 46], every: ONCE, shape: 'line', len: 10, width: 2, dmg: 20, kb: 'blow', force: 11, lift: 4, hitstop: 5, heavy: true, beam: true }] },
    jatk: { frames: 24, air: true, hover: 2.8, next: 'ja2', charge: 'jc', cancel: 12, dodgeCancel: 99, steer: 3,
      hits: [{ f: [5, 8], every: ONCE, shape: 'arc', range: 2.6, ang: 160, dmg: 8, kb: 'flinch', force: 2, hitstop: 2, yMax: 4.5 }, BL(6, { y: 0.4, speed: 20, life: 18 })] },
    ja2: { frames: 24, air: true, hover: 2.8, next: 'ja3', charge: 'jc', cancel: 12, dodgeCancel: 99, steer: 3,
      hits: [{ f: [5, 8], every: ONCE, shape: 'arc', range: 2.6, ang: 160, dmg: 8, kb: 'flinch', force: 2, hitstop: 2, yMax: 4.5 }, BL(6, { y: 0.4, speed: 20, life: 18 })] },
    ja3: { frames: 30, air: true, hover: 2.2, next: 'jatk', charge: 'jc', cancel: 18, dodgeCancel: 99, steer: 3,
      hits: [{ f: [10, 12], every: ONCE, shape: 'line', len: 7, width: 1.8, dmg: 16, kb: 'blow', force: 8, lift: 3, hitstop: 4, heavy: true, beam: true, yMax: 5 },
        BL(10, { count: 3, spread: 50, y: 0.3, speed: 20, life: 20 })] },
    jc: { frames: 56, air: true, hover: 3, landFrame: 34, hang: [6, 30], plunge: [30, -60], cancel: 50, dodgeCancel: 40, steer: 12, armor: true,
      hits: [{ f: [34, 37], every: ONCE, shape: 'circle', range: 4, dmg: 18, kb: 'launch', force: 4, lift: 8, hitstop: 6, heavy: true },
        BL(34, { count: 10, spread: 360, speed: 18, life: 22, r: 1.2, y: 0.8 }, { dmg: 12, kb: 'launch', force: 4, lift: 6 })] },
  };
}

export const entry = { ja2: 'jatk', ja3: 'ja2', n2: 'n1', n3: 'n2', n4: 'n3', n5: 'n4', n6: 'n5', c2: 'n1', c3: 'n2', c4: 'n3', c5: 'n4' };

// ---------------------------------------------------------------- poses (fan channels: spear = handle in the right hand)
const OPEN = [-28, 0, 14, 88];                                      // left hand raised before the chest, palm open
const PALM = [-72, -12, -6, 18];                                    // left arm out toward the target
const UP = [-150, 0, -20, 20];                                      // both arms raised (the left one)
const fan = (spear, armL = OPEN) => ({ spear, gripR: 0, gripL: 0.3, lfree: 1, armL });
const calm = (hy = 0, dy = 0.88, lean = 2) => ({ hips: [0, dy, 0.02], hipsR: [lean, hy, 0], spine: [lean, hy * 0.3, 0], chest: [0, hy * 0.4, 0], head: [0, 0, 0] });
const F_ = {
  cockR: [-0.46, 1.32, -0.02, -105, 22, 0], cockL: [0.08, 1.34, 0.22, 95, 26, 180],
  fwd: [-0.2, 1.26, 0.42, 0, 8, 0], endL: [0.14, 1.22, 0.3, 100, 6, 0], endR: [-0.5, 1.18, 0.1, -110, 4, 180],
  high: [-0.2, 1.72, -0.06, 0, 128, 90], chop: [-0.2, 1.16, 0.46, 0, -14, 90],
  aim: [-0.22, 1.34, -0.04, 0, 14, 90], cast: [-0.14, 1.36, 0.5, 0, 6, 90], raise: [-0.12, 1.8, 0.14, 0, 96, 90], side: [0.12, 1.24, 0.34, 88, 0, 0],
};

export function clips(A, M) {
  const { clipF, lungeAt, body, ft } = A;
  const hit = (id, i = 0) => M[id].hits[i].f;
  const ST = { ...calm(-18), ...fan([-0.3, 1.0, 0.18, -12, 70, 90]) };  // his own rest: fan upright at the right of the chest
  const lz = (id, f) => lungeAt(id, f);
  const step = (id, f, fwd = 0.4) => ({ fL: [0.18, 0.08, lz(id, f) + 0.3 + fwd, 0, 12], fR: [-0.2, 0.08, lz(id, f) - 0.26, 0, -30] });
  const out = {};
  /** A flick: cocked (−5), through (+1, snap), follow-through (e+4), held to the cancel, back to rest. */
  const flick = (id, cock, end, hyA, hyB, extra = {}) => {
    const [s, e] = hit(id), F = M[id].frames, c = M[id].cancel;
    return clipF(id, [[0, ST],
      [s - 5, { ...calm(hyA, 0.86, 4), ...fan(F_[cock]), ...extra }, 'out'],
      [s + 1, { ...calm(0, 0.84, 6), ...fan(F_.fwd), ...step(id, s + 1) }, 'snap'],
      [e + 4, { ...calm(hyB, 0.86, 4), ...fan(F_[end]) }, 'out'],
      [c, { ...calm(hyB * 0.8, 0.87, 3), ...fan(F_[end]) }, 'io'],
      [F, ST]]);
  };
  out.n1 = flick('n1', 'cockR', 'endL', -40, 35);
  out.n2 = flick('n2', 'cockL', 'endR', 35, -40);
  // N3 half turn (the body turns 180 and back through the flick)
  { const [s, e] = hit('n3'), F = M.n3.frames, c = M.n3.cancel;
    out.n3 = clipF('n3', [[0, ST],
      [s - 6, { ...calm(30, 0.86, 4), spin: -120, ...fan(F_.cockL) }, 'out'],
      [s + 1, { ...calm(0, 0.84, 6), spin: 0, ...fan(F_.fwd), ...step('n3', s + 1) }, 'snap'],
      [e + 4, { ...calm(-35, 0.86, 4), ...fan(F_.endR) }, 'out'],
      [c, { ...calm(-30, 0.87, 3), ...fan(F_.endR) }, 'io'], [F, ST]]); }
  // N4 step back (lunge −0.8), then a thrust of the fan
  { const [s] = hit('n4'), F = M.n4.frames, c = M.n4.cancel;
    out.n4 = clipF('n4', [[0, ST],
      [8, { ...calm(-20, 0.84, -4), ...fan(F_.aim, PALM), fL: [0.2, 0.08, lz('n4', 8) + 0.2, 0, 12], fR: [-0.22, 0.08, lz('n4', 8) - 0.4, 0, -30] }, 'out'],
      [s - 2, { ...calm(-24, 0.82, 0), ...fan(F_.aim, PALM) }, 'io'],
      [s, { ...calm(-10, 0.8, 8), hips: [0, 0.8, 0.18], ...fan(F_.cast, PALM), ...step('n4', s, 0.5) }, 'snap'],
      [c, { ...calm(-10, 0.84, 6), hips: [0, 0.84, 0.12], ...fan(F_.cast, PALM) }, 'io'], [F, ST]]); }
  // N5 fan raised overhead, brought down: a beam
  { const [s] = hit('n5'), F = M.n5.frames, c = M.n5.cancel;
    out.n5 = clipF('n5', [[0, ST],
      [s - 8, { ...calm(0, 0.92, -6), ...fan(F_.high, UP) }, 'out'],
      [s - 2, { ...calm(0, 0.94, -8), ...fan([-0.2, 1.78, -0.1, 0, 140, 90], UP) }, 'io'],
      [s, { ...calm(0, 0.82, 10), ...fan(F_.chop, PALM), ...step('n5', s, 0.3) }, 'snap'],
      [c, { ...calm(0, 0.84, 8), ...fan(F_.chop, PALM) }, 'io'], [F, ST]]); }
  // N6 a full turn with the fan held out, blades thrown at 20
  { const [s, e] = hit('n6'), F = M.n6.frames, c = M.n6.cancel;
    const sp = (f) => 360 * Math.min(1, Math.max(0, (f - s) / (e - s)));
    const keys = [[0, ST], [s - 5, { ...calm(-30, 0.86, 4), ...fan(F_.cockR) }, 'out']];
    for (let f = s; f <= e; f += 2) keys.push([f, { ...calm(0, 0.84, 4), spin: sp(f), ...fan(F_.side) }, 'lin']);
    keys.push([e + 6, { ...calm(0, 0.9, -4), spin: 360, ...fan(F_.raise, UP) }, 'out'], [c, { ...calm(0, 0.9, -2), spin: 360, ...fan(F_.raise, UP) }, 'io'],
      [F, { ...ST, spin: 360 }]);
    for (let f = s + 2, i = 0; f <= e; f += 4, i++) keys.push(ft(f, i % 2 ? body('n6', f, sp(f), [0.2, 0.08, 0.26, 0, 12]) : null, i % 2 ? null : body('n6', f, sp(f), [-0.22, 0.08, -0.22, 0, -30])));
    keys.push(ft(F, [0.17, 0.08, 0.3 + lz('n6', F), 0, 15 + 360], [-0.2, 0.08, -0.26 + lz('n6', F), 0, -30 + 360]));
    out.n6 = clipF('n6', keys); }
  // C1 the palm opens, the fan thrust out: a long beam
  { const [s, e] = hit('c1'), F = M.c1.frames, c = M.c1.cancel;
    out.c1 = clipF('c1', [[0, ST],
      [11, { ...calm(0, 0.9, -4), ...fan(F_.raise, UP) }, 'out'],
      [22, { ...calm(-30, 0.84, 0), ...fan(F_.aim, PALM), fL: [0.24, 0.08, 0.5, 0, 12], fR: [-0.24, 0.08, -0.36, 0, -40] }, 'io'],
      [s, { ...calm(-20, 0.8, 8), hips: [0, 0.8, 0.14], ...fan(F_.cast, PALM) }, 'snap'],
      [e + 6, { ...calm(-20, 0.82, 8), hips: [0, 0.82, 0.12], ...fan([-0.14, 1.38, 0.52, 0, 8, 90], PALM) }, 'io'],
      [c, { ...calm(-18, 0.86, 4), ...fan(F_.cast, PALM) }, 'io'], [F, ST]]); }
  // C2 whirlwind: fan swept up round him, raised
  { const [s, e] = hit('c2'), F = M.c2.frames, c = M.c2.cancel;
    out.c2 = clipF('c2', [[0, ST],
      [s - 6, { ...calm(40, 0.8, 8), ...fan([0.1, 0.96, 0.24, 100, -20, 0]) }, 'out'],
      [s, { ...calm(0, 0.86, 0), spin: 180, ...fan(F_.side) }, 'lin'],
      [s + 6, { ...calm(0, 0.92, -6), spin: 360, ...fan(F_.raise, UP) }, 'out'],
      [e, { ...calm(0, 0.94, -8), spin: 360, ...fan([-0.12, 1.86, 0.14, 0, 100, 90], UP) }, 'io'],
      [c, { ...calm(0, 0.9, -4), spin: 360, ...fan(F_.raise, UP) }, 'io'], [F, { ...ST, spin: 360 }],
      ft(s + 3, null, body('c2', s + 3, 180, [-0.22, 0.08, -0.22, 0, -30])), ft(s + 6, body('c2', s + 6, 360, [0.2, 0.08, 0.26, 0, 12]), null),
      ft(F, [0.17, 0.08, 0.3, 0, 15 + 360], [-0.2, 0.08, -0.26, 0, -30 + 360])]); }
  // C3 retreating barrage: alternating flicks while stepping back, then a beam
  { const [s, e] = hit('c3', 0), [s2] = hit('c3', 1), F = M.c3.frames, c = M.c3.cancel;
    const keys = [[0, ST], [s - 4, { ...calm(-30, 0.86, -2), ...fan(F_.cockR) }, 'out']];
    for (let f = s, k = 0; f < e; f += 6, k++) {
      keys.push([f + 1, { ...calm(0, 0.86, 2), ...fan(F_.fwd) }, 'snap'], [f + 4, { ...calm(k & 1 ? -30 : 30, 0.86, -2), ...fan(k & 1 ? F_.cockR : F_.cockL) }, 'io']);
      keys.push(ft(f + 3, k & 1 ? null : [0.18, 0.08, lz('c3', f + 3) + 0.2, 0, 12], k & 1 ? [-0.2, 0.08, lz('c3', f + 3) - 0.4, 0, -30] : null));
    }
    keys.push([s2 - 4, { ...calm(-24, 0.84, 0), ...fan(F_.aim, PALM) }, 'io'], [s2, { ...calm(-16, 0.8, 8), ...fan(F_.cast, PALM) }, 'snap'],
      [c, { ...calm(-16, 0.84, 6), ...fan(F_.cast, PALM) }, 'io'], [F, ST]);
    out.c3 = clipF('c3', keys); }
  // C4 spinning with the fan held out: rings of blades
  { const [s, e] = hit('c4'), F = M.c4.frames, c = M.c4.cancel;
    const sp = (f) => 1080 * Math.min(1, Math.max(0, (f - s) / (e - s)));
    const keys = [[0, ST], [s - 6, { ...calm(-30, 0.86, 2), ...fan(F_.cockR) }, 'out']];
    for (let f = s; f <= e; f += 3) keys.push([f, { ...calm(0, 0.86, 2), spin: sp(f), ...fan(F_.side, UP) }, 'lin']);
    keys.push([c, { ...calm(0, 0.88, 0), spin: 1080, ...fan(F_.raise, UP) }, 'io'], [F, { ...ST, spin: 1080 }]);
    for (let f = s + 2, i = 0; f <= e; f += 4, i++) keys.push(ft(f, i % 2 ? body('c4', f, sp(f), [0.2, 0.08, 0.26, 0, 12]) : null, i % 2 ? null : body('c4', f, sp(f), [-0.22, 0.08, -0.22, 0, -30])));
    keys.push(ft(F, [0.17, 0.08, 0.3, 0, 15 + 1080], [-0.2, 0.08, -0.26, 0, -30 + 1080]));
    out.c4 = clipF('c4', keys); }
  // C5 pillars of light: the fan raised to the sky, then swept down twice
  { const [s1] = hit('c5', 0), [s2] = hit('c5', 1), F = M.c5.frames, c = M.c5.cancel;
    out.c5 = clipF('c5', [[0, ST],
      [18, { ...calm(0, 0.92, -8), ...fan(F_.raise, UP), fL: [0.2, 0.08, 0.3, 0, 12], fR: [-0.22, 0.08, -0.3, 0, -30] }, 'out'],
      [s1 - 3, { ...calm(0, 0.94, -10), ...fan([-0.12, 1.9, 0.1, 0, 110, 90], UP) }, 'io'],
      [s1, { ...calm(-10, 0.84, 6), ...fan(F_.chop, PALM) }, 'snap'],
      [s2 - 4, { ...calm(10, 0.9, -6), ...fan(F_.high, UP) }, 'io'],
      [s2, { ...calm(10, 0.82, 8), ...fan(F_.chop, PALM) }, 'snap'],
      [c, { ...calm(6, 0.86, 4), ...fan(F_.chop, PALM) }, 'io'], [F, ST]]); }
  // dash: glides in, fan held back, then the beam
  { const [s2] = hit('dash', 1), F = M.dash.frames, c = M.dash.cancel;
    const glide = { ...calm(-10, 0.84, 10), ...fan([-0.42, 1.1, -0.2, -150, 20, 0], [-10, 0, 40, 60]) };
    const keys = [[0, ST], [5, glide, 'out'], [34, { ...glide, hips: [0, 0.82, 0.04] }]];
    for (let f = 6, j = 0; f < 36; f += 6, j ^= 1) {
      const z = lz('dash', f) + 0.28;
      keys.push(ft(f - 3, j ? null : [0.14, 0.24, z - 0.3, -20, 5], j ? [-0.14, 0.24, z - 0.3, -20, -5] : null), ft(f, j ? null : [0.14, 0.08, z, 0, 5], j ? [-0.14, 0.08, z, 0, -5] : null));
    }
    keys.push([s2 - 4, { ...calm(-24, 0.84, 0), ...fan(F_.aim, PALM) }, 'in'], [s2, { ...calm(-16, 0.8, 8), ...fan(F_.cast, PALM), ...step('dash', s2, 0.4) }, 'snap'],
      [c, { ...calm(-16, 0.84, 6), ...fan(F_.cast, PALM) }, 'io'], [F, ST]);
    out.dash = clipF('dash', keys); }
  // jump attack: a blade thrown down
  { const [s, e] = hit('jatk'), F = M.jatk.frames;
    const air = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };
    out.jatk = clipF('jatk', [[0, { ...calm(0, 0.95, 0), ...air, ...fan(F_.fwd) }],
      [s - 2, { ...calm(-30, 0.98, -4), ...air, ...fan(F_.cockR) }, 'out'],
      [e, { ...calm(20, 0.95, 12), ...air, ...fan([-0.14, 1.0, 0.4, 20, -40, 0]) }, 'snap'],
      [F, { ...calm(10, 0.95, 4), ...air, ...fan(F_.fwd) }]]); }
  // jump charge: fan raised through the hang, lands in a ring of blades
  { const L = M.jc.landFrame, F = M.jc.frames, D = M.jc.plunge[0], c = M.jc.cancel;
    const air = (y) => ({ fL: [0.16, y, 0.14, -30, 10], fR: [-0.18, y - 0.08, -0.12, 20, -20] });
    out.jc = clipF('jc', [[0, { ...calm(0, 0.95, 0), ...air(0.36), ...fan(F_.fwd) }],
      [5, { ...calm(0, 1.0, -8), ...air(0.5), ...fan(F_.raise, UP) }, 'out'],
      [D - 1, { ...calm(0, 1.0, -8), ...air(0.5), ...fan([-0.12, 1.86, 0.14, 0, 100, 90], UP) }],
      [L, { ...calm(0, 0.7, 14), ...fan(F_.chop, PALM), fL: [0.26, 0.08, 0.36, 0, 20], fR: [-0.26, 0.08, -0.3, 0, -40] }, 'snap'],
      [c, { ...calm(0, 0.76, 10), ...fan(F_.chop, PALM), fL: [0.26, 0.08, 0.36, 0, 20], fR: [-0.26, 0.08, -0.3, 0, -40] }, 'io'], [F, ST]]); }
  void P;
  // air string: jatk flick right → left · ja2 flick left → right · ja3 the fan thrust down, a beam and three blades
  { const [s, e] = hit('ja2'), F = M.ja2.frames;
    const air = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };
    out.ja2 = clipF('ja2', [[0, { ...calm(10, 0.95, 4), ...air, ...fan(F_.fwd) }],
      [s - 2, { ...calm(30, 0.98, -4), ...air, ...fan(F_.cockL) }, 'out'],
      [e, { ...calm(-20, 0.95, 12), ...air, ...fan([-0.34, 1.0, 0.36, -30, -40, 0]) }, 'snap'],
      [F, { ...calm(-10, 0.95, 4), ...air, ...fan(F_.fwd) }]]); }
  { const [s] = hit('ja3'), F = M.ja3.frames;
    const air = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };
    out.ja3 = clipF('ja3', [[0, { ...calm(-10, 0.95, 4), ...air, ...fan(F_.fwd) }],
      [s - 4, { ...calm(0, 1.0, -8), ...air, ...fan(F_.raise, UP) }, 'out'],
      [s, { ...calm(0, 0.94, 16), ...air, ...fan([-0.14, 1.1, 0.46, 0, -30, 90], PALM) }, 'snap'],
      [F, { ...calm(0, 0.95, 10), ...air, ...fan([-0.14, 1.12, 0.44, 0, -24, 90], PALM) }]]); }
  { const L = locoClips({
      idle: { ...calm(-18), ...fan([-0.3, 1.0, 0.18, -12, 70, 90]) },
      takeoff: { ...calm(0, 0.98, -4), ...fan(F_.fwd) },
      apex: { ...calm(0, 0.95, -6), ...fan(F_.raise, UP) },
      fall: { ...calm(0, 0.95, -8), head: [14, 0, 0], ...fan(F_.side, PALM) },
      land: { ...calm(0, 0.7, 12), ...fan(F_.chop, PALM), footL: [0.24, 0.08, 0.3, 0, 18], footR: [-0.24, 0.08, -0.26, 0, -36] },
      hurt: { ...calm(-20, 0.84, -14), head: [-18, 0, 0], ...fan([-0.36, 1.2, -0.06, -60, 40, 0], [-30, 0, 70, 40]) },
    });
    out.air = L.air; out.airFall = L.airFall; out.land = L.land; out.hurt = L.hurt; }   // idle / run: the fan overlay
  return out;
}

// ---------------------------------------------------------------- 真・無雙 東風・八陣 (musou.js runScript)
// the east wind rises round him · beams thrown out in eight directions · at CONTACT pillars of light march through the
// ranks · a storm of blades · the FINISHER: a great ring of light and wind
const MU = (dmg, kb, force, lift, extra) => ({ shape: 'circle', range: 5, dmg, kb, force, lift, hitstop: 0, yMax: 5, ...extra });
export const musou = {
  act: { hips: [0, 0.9, 0], hipsR: [-4, -10, 0], spine: [-6, 0, 0], chest: [-10, -8, 0], head: [-12, -10, 0], ...fan(F_.raise, UP) },
  face: { hips: [0, 0.9, 0], hipsR: [0, -24, 0], spine: [2, -6, 0], chest: [0, -8, 0], head: [2, -22, 0], ...fan([-0.26, 1.2, 0.24, -10, 60, 90], OPEN) },
  ready: { hips: [0, 0.86, 0], hipsR: [0, -20, 0], spine: [0, -4, 0], chest: [-4, -6, 0], head: [0, 0, 0], ...fan(F_.aim, PALM) },
  seq: [[100, 116, 'c2', 0.2, 0.6], [116, 132, 'n6', 0.2, 0.7], [132, 148, 'c5', 0.3, 0.6], [148, 164, 'c4', 0.25, 0.6], [164, 176, 'c1', 0.1, 0.4]],
  fin: ['c1', 0.45, 1],
  travel: [[132, 148, 3], [148, 164, 1]],
  hits: [[104, MU(10, 'launch', 3, 8, { range: 5 }), 0, 4, 116],
    [124, MU(20, 'blow', 11, 5, { shape: 'line', len: 12, width: 3 })],
    [134, MU(18, 'launch', 3, 10, { range: 2.6 }), 5, 4, 148],
    [150, MU(10, 'spin', 6, 3, { range: 7 }), 0, 4, 164]],
  proj: [[152, { every: 99, proj: { count: 10, spread: 360, speed: 18, life: 26, r: 1.3 }, dmg: 12, kb: 'spin', force: 5, lift: 3, hitstop: 0 }],
    [158, { every: 99, proj: { count: 10, spread: 360, speed: 18, life: 26, r: 1.3 }, dmg: 12, kb: 'spin', force: 5, lift: 3, hitstop: 0 }]],
  fx: [[104, 'aura', 5], [124, 'beams', 8], [134, 'rain', 2.4, 4], [138, 'rain', 2.4, 7], [142, 'rain', 2.4, 10], [146, 'rain', 2.4, 13]],
  finFx: [[176, 'beams', 12], [176, 'slam', 12]],
  finProj: [{ every: 99, proj: { count: 16, spread: 360, speed: 20, life: 34, r: 1.6 }, dmg: 20, kb: 'blow', force: 10, lift: 6, hitstop: 0 }],
};
