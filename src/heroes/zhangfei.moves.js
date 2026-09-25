// 張飛's own moveset — the Serpent Spear in a brawler's hands: short brutal jabs, wild swings, shoulder charges and
// stomps; power over finesse. (Data like hero/moves.js; clips authored with anims/author.js.)
//   N1 jab · N2 stepping jab · N3 wild backhand swing left → right · N4 shoulder charge, spear across the chest
//   N5 overhead two-handed smash · N6 the spear twirled over the head, then a stomp that shakes the ground
//   C1 當陽一喝: a roar that blasts back everything within 7 m, then a rising thrust launcher
//   C2 (N1→) lunging rising thrust · C3 (N2→) thrust flurry, then a huge thrust · C4 (N3→) two-turn spinning sweep
//   C5 (N4→) leap and stomp: rock eruption · dash: lance charge, spear couched, into a thrust
import { P } from '../hero/rig.js';

const ONCE = 99;
export function moves() {
  return {
    n1: { frames: 30, next: 'n2', charge: 'c2', cancel: 20, branch: 11, dodgeCancel: 11, steer: 5, lunge: [[2, 8, 0.5]],
      hits: [{ f: [7, 9], every: ONCE, shape: 'line', len: 3.4, width: 1.2, dmg: 14, kb: 'flinch', force: 3, hitstop: 3 }] },
    n2: { frames: 32, next: 'n3', charge: 'c3', cancel: 22, branch: 12, dodgeCancel: 12, steer: 4, lunge: [[1, 9, 0.8]],
      hits: [{ f: [8, 10], every: ONCE, shape: 'line', len: 3.6, width: 1.3, dmg: 15, kb: 'flinch', force: 4, hitstop: 3 }] },
    n3: { frames: 36, next: 'n4', charge: 'c4', cancel: 25, branch: 17, dodgeCancel: 17, steer: 5, lunge: [[5, 12, 0.4]],
      hits: [{ f: [11, 15], sweep: -1, shape: 'arc', range: 3.2, ang: 190, dir: -20, dmg: 17, kb: 'push', force: 7, hitstop: 3 }] },
    n4: { frames: 40, next: 'n5', charge: 'c5', cancel: 29, branch: 20, dodgeCancel: 20, steer: 6, lunge: [[6, 18, 1.9]], armor: true,
      hits: [{ f: [12, 18], every: ONCE, shape: 'arc', range: 2.4, ang: 130, dmg: 18, kb: 'blow', force: 11, lift: 3, hitstop: 4 }] },
    n5: { frames: 42, next: 'n6', cancel: 31, dodgeCancel: 20, steer: 4, lunge: [[4, 16, 0.8]], armor: true,
      hits: [{ f: [16, 18], every: ONCE, shape: 'arc', range: 3.2, ang: 100, dmg: 22, kb: 'push', force: 7, hitstop: 5 }] },
    n6: { frames: 64, next: 'n1', charge: 'c1', cancel: 54, dodgeCancel: 47, steer: 6, lunge: [[10, 34, 0.8]], armor: true,
      hits: [{ f: [14, 34], every: 5, shape: 'circle', range: 3.2, dmg: 8, kb: 'flinch', force: 2, hitstop: 1 },
        { f: [44, 46], every: ONCE, shape: 'circle', range: 4.6, dmg: 28, kb: 'blow', force: 14, lift: 7, hitstop: 7, heavy: true, rocks: 10 }] },

    c1: { frames: 84, cancel: 76, dodgeCancel: 56, steer: 12, lunge: [[40, 48, 0.8]], armor: true,
      hits: [{ f: [20, 20], every: ONCE, shape: 'circle', range: 7, dmg: 8, kb: 'push', force: 11, lift: 2, hitstop: 5, heavy: true, roar: true },
        { f: [48, 52], every: ONCE, shape: 'arc', range: 3.8, ang: 150, dmg: 22, kb: 'launch', force: 2, lift: 11, hitstop: 6, heavy: true }] },
    c2: { frames: 60, cancel: 52, dodgeCancel: 30, steer: 10, lunge: [[10, 18, 1.4]], armor: true,
      hits: [{ f: [18, 21], every: ONCE, shape: 'line', len: 4.2, width: 2, dmg: 20, kb: 'launch', force: 3, lift: 11, hitstop: 6, heavy: true }] },
    c3: { frames: 92, cancel: 84, dodgeCancel: 70, steer: 10, lunge: [[12, 52, 1.2], [58, 62, 0.8]], armor: true,
      hits: [{ f: [12, 52], every: 4, shape: 'line', len: 4, width: 1.8, dmg: 5, kb: 'flinch', force: 1.5, hitstop: 1 },
        { f: [62, 64], every: ONCE, shape: 'line', len: 5, width: 2.6, dmg: 26, kb: 'blow', force: 14, lift: 5, hitstop: 7, heavy: true }] },
    c4: { frames: 80, cancel: 70, dodgeCancel: 50, steer: 14, lunge: [[20, 44, 1.0]], armor: true,
      hits: [{ f: [20, 44], every: 8, shape: 'circle', range: 4, dmg: 12, kb: 'spin', force: 6, lift: 3, hitstop: 3 }] },
    c5: { frames: 100, cancel: 92, dodgeCancel: 60, steer: 10, lunge: [[14, 40, 1.8]], armor: true, leap: [16, 12], plunge: [36, -30], landFrame: 42,
      hits: [{ f: [42, 45], every: ONCE, shape: 'circle', range: 5.4, dmg: 30, kb: 'blow', force: 15, lift: 8, hitstop: 8, heavy: true, yMax: 4.5, rocks: 16 }] },

    dash: { frames: 80, cancel: 72, dodgeCancel: 50, steer: 3, lunge: [[0, 42, 6, 'lin'], [42, 50, 1.6]],
      hits: [{ f: [4, 40], every: 8, shape: 'arc', range: 2.2, ang: 120, dmg: 10, kb: 'push', force: 8, hitstop: 2 },
        { f: [46, 49], every: ONCE, shape: 'line', len: 4.2, width: 2, dmg: 22, kb: 'blow', force: 12, lift: 4, hitstop: 5, heavy: true }] },
    jatk: { frames: 24, air: true, hover: 2.4, next: 'jatk', charge: 'jc', cancel: 12, dodgeCancel: 99, steer: 3,
      hits: [{ f: [5, 8], every: ONCE, shape: 'arc', range: 3.4, ang: 160, dmg: 13, kb: 'flinch', force: 3, hitstop: 2, yMax: 4.5 }] },
    jc: { frames: 58, air: true, hover: 3, landFrame: 36, hang: [6, 32], plunge: [32, -80], cancel: 52, dodgeCancel: 40, steer: 12, armor: true,
      hits: [{ f: [36, 39], every: ONCE, shape: 'circle', range: 5, dmg: 26, kb: 'launch', force: 6, lift: 9, hitstop: 7, heavy: true, rocks: 12 }] },
  };
}

export const entry = { n2: 'n1', n3: 'n2', n4: 'n3', n5: 'n4', n6: 'n5', c2: 'n1', c3: 'n2', c4: 'n3', c5: 'n4' };

// ---------------------------------------------------------------- poses
const CHAMBER = { hips: [0, 0.84, -0.02], hipsR: [6, -55, 0], spine: [6, -15, 0], chest: [2, -22, 0], head: [0, 0, 0], spear: [-0.2, 1.12, -0.32, 0, 2, 90], gripL: 0.42 };
const JAB = { hips: [0, 0.8, 0.22], hipsR: [8, -72, 0], spine: [6, -10, 0], chest: [2, -8, 0], head: [0, 0, 0], spear: [-0.08, 1.16, 0.58, 0, 0, 90], gripL: 0.3 };
const tw = (hy, lean = 8, dy = 0.8) => ({ hips: [0, dy, 0.06], hipsR: [lean, hy, 0], spine: [lean, hy * 0.3, 0], chest: [lean * 0.6, hy * 0.4, 0], head: [0, 0, 0], gripL: 0.45 });
const RAISED = { hips: [0, 0.94, 0], hipsR: [-6, -12, 0], spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-8, 0, 0], gripL: 0.5 };
const SMASH = { hips: [0, 0.64, 0.26], hipsR: [26, -10, 0], spine: [18, 0, 0], chest: [14, 0, 0], head: [8, 0, 0], gripL: 0.5 };
const STOMP = { hips: [0, 0.6, 0.1], hipsR: [20, -20, 0], spine: [14, -6, 0], chest: [10, -6, 0], head: [4, 0, 0], gripL: 0.45 };
const ROAR = { hips: [0, 0.8, -0.04], hipsR: [-10, -10, 0], spine: [-10, 0, 0], chest: [-18, 0, 0], head: [-26, 0, 0],
  spear: [-0.4, 1.0, 0.1, -40, 60, 90], gripL: 0.3, lfree: 1, armL: [-20, 0, 70, 40] };

export function clips(A, M) {
  const { clipF, lungeAt, body, ft } = A;
  const hit = (id, i = 0) => M[id].hits[i].f;
  const ST = {};
  const lz = (id, f) => lungeAt(id, f);
  const lungeFeet = (id, f) => ({ fL: [0.2, 0.08, lz(id, f) + 0.7, 0, 10], fR: [-0.26, 0.08, lz(id, f) - 0.42, 0, -60] });
  const wide = (id, f) => ({ fL: [0.34, 0.08, lz(id, f) + 0.36, 0, 25], fR: [-0.34, 0.08, lz(id, f) - 0.28, 0, -50] });
  const out = {};
  // N1 / N2 jabs
  for (const id of ['n1', 'n2']) {
    const [s, e] = hit(id), F = M[id].frames, c = M[id].cancel, deep = id === 'n2' ? 0.08 : 0;
    out[id] = clipF(id, [
      [0, ST],
      [s - 4, CHAMBER, 'out'],
      [s, { ...JAB, hips: [0, 0.78, 0.24 + deep], spear: [-0.06, 1.14, 0.62 + deep, 0, -2, 90], ...lungeFeet(id, s) }, 'snap'],
      [e + 3, JAB, 'io'],
      [c, { ...JAB, hips: [0, 0.82, 0.18], spear: [-0.12, 1.14, 0.4, 0, 0, 90] }, 'io'],
      [F, ST],
    ]);
  }
  // N3 wild backhand swing left → right
  { const [s, e] = hit('n3'), F = M.n3.frames, c = M.n3.cancel;
    out.n3 = clipF('n3', [
      [0, ST],
      [s - 5, { ...tw(60, 6, 0.8), spear: [0.12, 1.2, 0.0, 140, 10, 0], ...wide('n3', s - 5) }, 'out'],
      [s - 1, { ...tw(35, 8, 0.78), spear: [0.06, 1.12, 0.2, 80, 0, 0] }, 'lin'],
      [s + 1, { ...tw(5, 8, 0.78), spear: [-0.12, 1.1, 0.34, 10, -4, 0] }, 'lin'],
      [s + 3, { ...tw(-30, 8, 0.78), spear: [-0.28, 1.1, 0.24, -60, -4, 0] }, 'lin'],
      [e + 2, { ...tw(-60, 6, 0.8), spear: [-0.36, 1.16, 0.0, -125, 4, 0] }, 'out'],
      [c, { ...tw(-55, 6, 0.82), spear: [-0.34, 1.16, 0.02, -120, 6, 0] }, 'io'],
      [F, ST],
    ]); }
  // N4 shoulder charge: spear held across the chest, the whole body driven forward
  { const [s, e] = hit('n4'), F = M.n4.frames, c = M.n4.cancel;
    const bash = { hips: [0, 0.76, 0.3], hipsR: [22, 30, 0], spine: [14, 20, 0], chest: [10, 26, 0], head: [0, 0, 0], spear: [-0.12, 1.28, 0.28, 90, 8, 90], gripL: 0.5 };
    out.n4 = clipF('n4', [
      [0, ST],
      [s - 6, { ...bash, hips: [0, 0.78, 0.0], hipsR: [10, 40, 0], spear: [-0.14, 1.24, 0.1, 96, 10, 90] }, 'out'],
      [s, { ...bash, ...lungeFeet('n4', s) }, 'in'],
      [e, { ...bash, hips: [0, 0.72, 0.36], ...lungeFeet('n4', e) }, 'lin'],
      [c, { ...bash, hips: [0, 0.8, 0.24] }, 'io'],
      [F, ST],
    ]); }
  // N5 overhead smash
  { const [s] = hit('n5'), F = M.n5.frames, c = M.n5.cancel;
    out.n5 = clipF('n5', [
      [0, ST],
      [s - 8, { ...RAISED, spear: [-0.16, 1.66, -0.1, 0, 130, 90] }, 'out'],
      [s - 2, { ...RAISED, hips: [0, 0.96, 0.04], spear: [-0.16, 1.7, -0.12, 0, 142, 90] }, 'io'],
      [s + 1, { ...SMASH, spear: [-0.12, 0.98, 0.52, 0, -34, 90], ...wide('n5', s + 1) }, 'snap'],
      [c, { ...SMASH, hips: [0, 0.7, 0.22], spear: [-0.12, 1.0, 0.5, 0, -30, 90] }, 'io'],
      [F, ST],
    ]); }
  // N6 twirl over the head (the spear turns 3 times), then the stomp
  { const [s, e] = hit('n6', 0), [s2] = hit('n6', 1), F = M.n6.frames, c = M.n6.cancel;
    const twirl = (f, a) => [f, { hips: [0, 0.86, 0.04], hipsR: [-4, 0, 0], spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-6, 0, 0],
      spear: [-0.06, 1.95, 0.02, a, 6, 0], gripL: 0.2, lfree: 1, armL: [-150, 0, -10, 20] }, 'lin'];
    const keys = [[0, ST], twirl(s - 4, -60)];
    for (let k = 0; k <= 10; k++) keys.push(twirl(s + k * 2, k * 108));
    keys.push([s2 - 5, { ...RAISED, hips: [0, 1.0, 0.04], spear: [-0.14, 1.72, 0, 1080, 120, 0], fL: [0.2, 0.42, lz('n6', s2 - 5) + 0.3, -30, 15] }, 'out'],
      [s2, { ...STOMP, spear: [-0.16, 0.98, 0.46, 1080, -40, 90], ...wide('n6', s2) }, 'snap'],
      [c, { ...STOMP, hips: [0, 0.66, 0.1], spear: [-0.16, 1.0, 0.44, 1080, -34, 90] }, 'io'],
      [F, { ...ST, spear: [-0.24, 0.98, 0, 30 + 1080, 30, 0] }]);
    out.n6 = clipF('n6', keys); }
  // C1 當陽一喝, then the rising thrust
  { const [r] = hit('c1', 0), [s] = hit('c1', 1), F = M.c1.frames, c = M.c1.cancel;
    out.c1 = clipF('c1', [
      [0, ST],
      [r - 8, { ...STOMP, hips: [0, 0.74, 0.02], spear: [-0.36, 1.0, 0.0, -30, 40, 90], lfree: 0.6, armL: [0, 0, 60, 60], ...wide('c1', r - 8) }, 'out'],
      [r, ROAR, 'snap'],
      [r + 16, { ...ROAR, chest: [-20, 0, 0], head: [-30, 0, 0] }, 'io'],
      [s - 6, { ...STOMP, hips: [0, 0.64, 0.14], spear: [-0.3, 0.72, 0.2, -10, -40, 90] }, 'io'],
      [s + 1, { hips: [0, 0.94, 0.24], hipsR: [-8, -40, 0], spine: [-8, -10, 0], chest: [-14, -8, 0], head: [-12, 0, 0], spear: [-0.1, 1.4, 0.4, 0, 60, 90], gripL: 0.34 }, 'snap'],
      [s + 8, { ...RAISED, hips: [0, 0.96, 0.2], spear: [-0.1, 1.72, 0.14, 0, 100, 90] }, 'out'],
      [c, { ...RAISED, spear: [-0.12, 1.66, 0.06, 0, 106, 90] }, 'io'],
      [F, ST],
    ]); }
  // C2 lunging rising thrust
  { const [s] = hit('c2'), F = M.c2.frames, c = M.c2.cancel;
    out.c2 = clipF('c2', [
      [0, ST],
      [s - 8, { ...CHAMBER, hips: [0, 0.7, 0], spear: [-0.22, 0.86, -0.3, 0, -20, 90] }, 'out'],
      [s, { ...JAB, hips: [0, 0.86, 0.3], chest: [-8, -8, 0], spear: [-0.06, 1.3, 0.56, 0, 38, 90], ...lungeFeet('c2', s) }, 'snap'],
      [s + 8, { ...JAB, hips: [0, 0.94, 0.26], chest: [-12, -8, 0], spear: [-0.06, 1.5, 0.44, 0, 64, 90] }, 'out'],
      [c, { ...JAB, hips: [0, 0.9, 0.2], spear: [-0.08, 1.44, 0.4, 0, 56, 90] }, 'io'],
      [F, ST],
    ]); }
  // C3 thrust flurry, then the big one
  { const [s, e] = hit('c3', 0), [s2] = hit('c3', 1), F = M.c3.frames, c = M.c3.cancel;
    const keys = [[0, ST], [s - 4, CHAMBER, 'out']];
    for (let f = s, k = 0; f < e; f += 4, k++) {
      const y = 1.1 + ((k * 7) % 3) * 0.08, yaw = ((k * 5) % 3 - 1) * 10;
      keys.push([f, { ...JAB, spear: [-0.08, y, 0.6, yaw, 0, 90] }, 'snap'], [f + 2, { ...CHAMBER, hips: [0, 0.82, 0.06], spear: [-0.16, 1.12, -0.1, 0, 2, 90] }, 'in']);
    }
    keys.push([s2 - 5, { ...CHAMBER, hips: [0, 0.82, -0.06], chest: [4, -30, 0], spear: [-0.26, 1.12, -0.42, 0, 2, 90] }, 'out'],
      [s2, { ...JAB, hips: [0, 0.74, 0.34], spear: [-0.02, 1.14, 0.72, 0, -2, 90], ...lungeFeet('c3', s2) }, 'snap'],
      [c, { ...JAB, hips: [0, 0.78, 0.3] }, 'io'], [F, ST], ft(s, ...Object.values(lungeFeet('c3', s))));
    out.c3 = clipF('c3', keys); }
  // C4 two-turn spinning sweep, spear held out wide
  { const [s, e] = hit('c4'), F = M.c4.frames, c = M.c4.cancel;
    const sp = (f) => 720 * Math.min(1, Math.max(0, (f - s) / (e - s)));
    const SIDE = { hips: [0, 0.76, 0.04], hipsR: [6, -10, 0], spine: [6, -8, 0], chest: [2, -10, 0], head: [0, 0, 0], gripL: 0.32 };
    const keys = [[0, ST], [s - 6, { ...tw(-40, 6, 0.78), spear: [-0.32, 1.1, 0.1, -100, 0, 0] }, 'out']];
    for (let f = s; f <= e; f += 3) keys.push([f, { ...SIDE, spin: sp(f), spear: [-0.3, 1.02, 0.24, -90, -4, 0] }, 'lin']);
    keys.push([c, { ...SIDE, spin: 720, spear: [-0.3, 1.06, 0.2, -88, 0, 0] }, 'io'], [F, { ...ST, spin: 720 }]);
    for (let f = s + 2, i = 0; f <= e; f += 4, i++) keys.push(ft(f, i % 2 ? body('c4', f, sp(f), [0.26, 0.08, 0.3, 0, 15]) : null, i % 2 ? null : body('c4', f, sp(f), [-0.28, 0.08, -0.24, 0, -35])));
    keys.push(ft(F, [0.17, 0.08, 0.3 + lz('c4', F), 0, 15 + 720], [-0.2, 0.08, -0.26 + lz('c4', F), 0, -30 + 720]));
    out.c4 = clipF('c4', keys); }
  // C5 leap and stomp
  { const [s] = hit('c5'), F = M.c5.frames, c = M.c5.cancel, L = M.c5.landFrame;
    const air = (f, y = 0.55) => ({ fL: [0.2, y, lz('c5', f) + 0.25, -30, 15], fR: [-0.2, y - 0.1, lz('c5', f) - 0.15, -20, -30] });
    out.c5 = clipF('c5', [
      [0, ST],
      [12, { ...STOMP, hips: [0, 0.64, 0], spear: [-0.3, 1.0, -0.1, -20, 40, 90] }, 'out'],
      [18, { ...RAISED, hips: [0, 1.04, 0.1], spear: [-0.14, 1.8, 0, 0, 120, 90], lfree: 1, armL: [-150, 0, -20, 30], ...air(18) }, 'out'],
      [L - 3, { ...RAISED, hips: [0, 1.0, 0.16], spear: [-0.14, 1.6, 0.2, 0, 60, 90], ...air(L - 3, 0.4) }, 'in'],
      [s, { ...STOMP, hips: [0, 0.54, 0.14], spear: [-0.16, 0.9, 0.44, 0, -46, 90], ...wide('c5', s) }, 'snap'],
      [c, { ...STOMP, hips: [0, 0.62, 0.12], spear: [-0.16, 0.94, 0.44, 0, -40, 90] }, 'io'],
      [F, ST],
    ]); }
  // dash: lance charge, spear couched under the arm, then the thrust
  { const [s2] = hit('dash', 1), F = M.dash.frames, c = M.dash.cancel;
    const couch = { hips: [0, 0.8, 0.14], hipsR: [20, -40, 0], spine: [10, -10, 0], chest: [8, -12, 0], head: [0, 0, 0], spear: [-0.2, 1.06, -0.2, 0, -4, 90], gripL: 0.46 };
    const keys = [[0, ST], [4, couch, 'out'], [40, { ...couch, hips: [0, 0.78, 0.16] }]];
    for (let f = 5, j = 0; f < 42; f += 5, j ^= 1) {
      const z = lz('dash', f) + 0.3;
      keys.push(ft(f - 2.5, j ? null : [0.14, 0.3, z - 0.3, -20, 5], j ? [-0.14, 0.3, z - 0.3, -20, -5] : null), ft(f, j ? null : [0.14, 0.08, z, 0, 5], j ? [-0.14, 0.08, z, 0, -5] : null));
    }
    keys.push([s2 - 2, { ...CHAMBER, hips: [0, 0.8, 0.1] }, 'in'], [s2, { ...JAB, spear: [-0.04, 1.14, 0.7, 0, -2, 90], ...lungeFeet('dash', s2) }, 'snap'],
      [c, { ...JAB, hips: [0, 0.8, 0.2] }, 'io'], [F, ST]);
    out.dash = clipF('dash', keys); }
  // jump attack: downward jab
  { const [s, e] = hit('jatk'), F = M.jatk.frames;
    const air = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };
    out.jatk = clipF('jatk', [
      [0, { hips: [0, 0.95, 0], ...air, spear: [-0.2, 1.2, -0.1, 30, 30, 0] }],
      [s - 2, { hips: [0, 0.98, -0.04], hipsR: [0, -50, 0], chest: [-6, -20, 0], ...air, spear: [-0.2, 1.3, -0.3, 0, 10, 90], gripL: 0.4 }, 'out'],
      [e, { hips: [0, 0.94, 0.1], hipsR: [14, -60, 0], chest: [12, -10, 0], ...air, spear: [-0.08, 1.0, 0.5, 0, -40, 90], gripL: 0.3 }, 'snap'],
      [F, { hips: [0, 0.95, 0.04], ...air, spear: [-0.1, 1.04, 0.3, 0, -20, 90], gripL: 0.35 }],
    ]); }
  // jump charge: spear raised, plunge, stomp landing
  { const L = M.jc.landFrame, F = M.jc.frames, D = M.jc.plunge[0], c = M.jc.cancel;
    const air = (y) => ({ fL: [0.16, y, 0.14, -30, 10], fR: [-0.18, y - 0.08, -0.12, 20, -20] });
    out.jc = clipF('jc', [
      [0, { hips: [0, 0.95, 0], ...air(0.36), spear: [-0.2, 1.2, -0.1, 30, 30, 0] }],
      [5, { ...RAISED, hips: [0, 1.0, 0.04], ...air(0.5), spear: [-0.12, 1.84, 0, 0, 120, 90], lfree: 1, armL: [-150, 0, -20, 30] }, 'out'],
      [D - 1, { ...RAISED, hips: [0, 1.0, 0.04], ...air(0.5), spear: [-0.12, 1.86, 0, 0, 126, 90], lfree: 1, armL: [-150, 0, -20, 30] }],
      [L - 1, { ...SMASH, hips: [0, 0.96, 0.14], ...air(0.4), spear: [-0.12, 1.4, 0.36, 0, 10, 90] }, 'in'],
      [L, { ...STOMP, hips: [0, 0.54, 0.14], spear: [-0.16, 0.9, 0.44, 0, -46, 90], fL: [0.34, 0.08, 0.36, 0, 25], fR: [-0.34, 0.08, -0.28, 0, -50] }, 'snap'],
      [c, { ...STOMP, hips: [0, 0.62, 0.12], spear: [-0.16, 0.94, 0.44, 0, -40, 90], fL: [0.34, 0.08, 0.36, 0, 25], fR: [-0.34, 0.08, -0.28, 0, -50] }, 'io'],
      [F, ST],
    ]); }
  void P;
  return out;
}

// ---------------------------------------------------------------- 真・無雙 燕人咆哮 (musou.js runScript)
// stomp and a roar that blows the ring apart · lance charge · at CONTACT a storm of thrusts · one huge thrust · leap —
// and the FINISHER: the stomp that splits the ground
const MU = (dmg, kb, force, lift, extra) => ({ shape: 'circle', range: 5, dmg, kb, force, lift, hitstop: 0, yMax: 5, ...extra });
export const musou = {
  act: { ...ROAR },
  face: { hips: [0, 0.9, 0], hipsR: [0, -24, 0], spine: [2, -6, 0], chest: [-4, -8, 0], head: [-6, -20, 0], spear: [-0.3, 1.1, 0.1, 20, 70, 90], gripL: 0.3, lfree: 1, armL: [-30, 0, 60, 70] },
  ready: { ...STOMP, spear: [-0.36, 1.0, 0.0, -30, 40, 90] },
  seq: [[100, 116, 'c1', 0, 0.36], [116, 128, 'dash', 0.05, 0.5], [128, 132, 'c3', 0.08, 0.14], [132, 158, 'c3', 0.14, 0.56],
    [158, 166, 'c3', 0.6, 0.74], [166, 176, 'c5', 0.1, 0.36]],
  fin: ['c5', 0.42, 1],
  travel: [[116, 128, 5], [132, 158, 1.6], [158, 162, 1.0], [166, 176, 1.6]],
  hits: [[110, MU(10, 'push', 13, 3, { range: 11, heavy: true, hitstop: 4 })],
    [118, MU(10, 'push', 8, 2, { shape: 'arc', range: 2.6, ang: 130 }), 0, 3, 128],
    [132, MU(8, 'flinch', 3, 1, { shape: 'line', len: 7, width: 3.4 }), 0, 3, 158],
    [162, MU(34, 'blow', 16, 6, { shape: 'line', len: 11, width: 4.4, heavy: true })]],
  fx: [[110, 'roar', 11], [162, 'aura', 4, 3]],
  finFx: [[176, 'rocks', 12], [176, 'slam', 12]],
};
