// 呂布's own moveset — the Sky Piercer as a whirlwind: fast, wide, airborne, every big blow throwing a crimson
// crescent. (Data like hero/moves.js; clips authored with anims/author.js.)
//   N1 fast cut right → left · N2 backhand left → right, stepping · N3 rising cross-cut, low left → high right
//   N4 hop and a full spin in the air · N5 two turns on the ground · N6 leaping crush + crimson crescent
//   C1 天下無雙: the halberd raised one-handed, then a 540° sweep throwing five crescents
//   C2 (N1→) uppercut with a hop · C3 (N2→) piercing thrust that carries him 5 m + crescent
//   C4 (N3→) tornado, four turns carried forward · C5 (N4→) leap and plunge, a ring of crescents
//   dash: halberd trailing, then a spinning slash + crescent · jatk: air cross cut · jc: dive, shock ring
import { P } from '../hero/rig.js';

const ONCE = 99;
const CR = (o = {}, h = {}) => ({ every: ONCE, proj: { speed: 20, life: 24, r: 1.8, kind: 'crescent', ...o }, dmg: 22, kb: 'blow', force: 11, lift: 5, hitstop: 0, ...h });
export function moves() {
  return {
    n1: { frames: 30, next: 'n2', charge: 'c2', cancel: 20, branch: 12, dodgeCancel: 12, steer: 5, lunge: [[2, 9, 0.5]], armor: true,
      hits: [{ f: [8, 11], sweep: 1, shape: 'arc', range: 3.6, ang: 170, dir: 15, dmg: 18, kb: 'flinch', force: 4, hitstop: 3 }] },
    n2: { frames: 30, next: 'n3', charge: 'c3', cancel: 21, branch: 13, dodgeCancel: 13, steer: 4, lunge: [[0, 9, 0.9]], armor: true,
      hits: [{ f: [8, 11], sweep: -1, shape: 'arc', range: 3.6, ang: 170, dir: -15, dmg: 18, kb: 'flinch', force: 4, hitstop: 3 }] },
    n3: { frames: 32, next: 'n4', charge: 'c4', cancel: 22, branch: 14, dodgeCancel: 14, steer: 5, lunge: [[4, 11, 0.5]], armor: true,
      hits: [{ f: [9, 12], every: ONCE, shape: 'arc', range: 3.6, ang: 140, dmg: 20, kb: 'launch', force: 3, lift: 7, hitstop: 4 }] },
    n4: { frames: 38, next: 'n5', charge: 'c5', cancel: 28, branch: 24, dodgeCancel: 24, steer: 5, lunge: [[4, 20, 1.4]], armor: true,
      hits: [{ f: [12, 22], sweep: -1, sweepN: 10, shape: 'circle', range: 3.8, dmg: 18, kb: 'push', force: 6, hitstop: 3, yMax: 4 }] },
    n5: { frames: 44, next: 'n6', cancel: 33, dodgeCancel: 30, steer: 5, lunge: [[6, 28, 1.2]], armor: true,
      hits: [{ f: [10, 28], every: 6, shape: 'circle', range: 3.9, dmg: 12, kb: 'spin', force: 5, lift: 2, hitstop: 2 }] },
    n6: { frames: 54, next: 'n1', charge: 'c1', cancel: 44, dodgeCancel: 26, steer: 6, lunge: [[4, 18, 2.0]], armor: true,
      hits: [{ f: [19, 22], every: ONCE, shape: 'arc', range: 4, ang: 160, dmg: 34, kb: 'blow', force: 14, lift: 6, hitstop: 7, heavy: true },
        { f: [19, 19], ...CR({ r: 2.2, life: 28 }) }] },

    c1: { frames: 80, cancel: 72, dodgeCancel: 52, steer: 14, lunge: [[26, 44, 1.0]], armor: true,
      hits: [{ f: [30, 44], sweep: 1, sweepN: 14, shape: 'circle', range: 4.6, dmg: 26, kb: 'blow', force: 12, lift: 5, hitstop: 6, heavy: true },
        { f: [38, 38], ...CR({ count: 5, spread: 110, r: 2.2, life: 32 }) }] },
    c2: { frames: 58, cancel: 50, dodgeCancel: 30, steer: 10, lunge: [[10, 18, 0.8]], armor: true,
      hits: [{ f: [17, 20], every: ONCE, shape: 'arc', range: 3.8, ang: 150, dmg: 24, kb: 'launch', force: 2, lift: 12, hitstop: 6, heavy: true }] },
    c3: { frames: 70, cancel: 62, dodgeCancel: 40, steer: 12, lunge: [[18, 30, 5.0, 'lin']], armor: true,
      hits: [{ f: [18, 30], every: 3, shape: 'line', len: 2.6, width: 2.6, dmg: 12, kb: 'blow', force: 9, lift: 3, hitstop: 1 },
        { f: [30, 30], ...CR({ r: 2.2, speed: 22, life: 26 }) }] },
    c4: { frames: 92, cancel: 84, dodgeCancel: 76, steer: 10, lunge: [[16, 64, 2.6]], armor: true,
      hits: [{ f: [16, 64], every: 6, shape: 'circle', range: 4.2, dmg: 11, kb: 'spin', force: 6, lift: 3, hitstop: 2 },
        { f: [68, 70], every: ONCE, shape: 'circle', range: 4.6, dmg: 26, kb: 'blow', force: 13, lift: 6, hitstop: 7, heavy: true }] },
    c5: { frames: 96, cancel: 88, dodgeCancel: 60, steer: 10, lunge: [[12, 34, 1.6]], armor: true, leap: [14, 12], plunge: [30, -30], landFrame: 36,
      hits: [{ f: [36, 39], every: ONCE, shape: 'circle', range: 5, dmg: 30, kb: 'launch', force: 5, lift: 10, hitstop: 8, heavy: true, yMax: 4.5 },
        { f: [36, 36], ...CR({ count: 8, spread: 360, speed: 17, life: 22, r: 1.8 }) }] },

    dash: { frames: 80, cancel: 72, dodgeCancel: 50, steer: 3, lunge: [[0, 40, 6, 'lin'], [40, 52, 1.6]],
      hits: [{ f: [8, 38], every: 10, shape: 'line', len: 2.6, width: 2.6, dmg: 10, kb: 'push', force: 7, hitstop: 2 },
        { f: [44, 52], sweep: 1, sweepN: 8, shape: 'circle', range: 4.2, dmg: 24, kb: 'blow', force: 12, lift: 4, hitstop: 5, heavy: true },
        { f: [48, 48], ...CR({ r: 2.0, speed: 22 }) }] },
    jatk: { frames: 24, air: true, hover: 2.6, next: 'jatk', charge: 'jc', cancel: 12, dodgeCancel: 99, steer: 3,
      hits: [{ f: [5, 9], every: ONCE, shape: 'arc', range: 4, ang: 220, dmg: 15, kb: 'flinch', force: 3, hitstop: 2, yMax: 4.5 }] },
    jc: { frames: 56, air: true, hover: 3, landFrame: 36, hang: [6, 32], plunge: [32, -80], cancel: 50, dodgeCancel: 40, steer: 12, armor: true,
      hits: [{ f: [36, 39], every: ONCE, shape: 'circle', range: 5, dmg: 28, kb: 'launch', force: 6, lift: 9, hitstop: 7, heavy: true },
        { f: [36, 36], ...CR({ count: 6, spread: 360, speed: 15, life: 18, r: 1.6 }) }] },
  };
}

export const entry = { n2: 'n1', n3: 'n2', n4: 'n3', n5: 'n4', n6: 'n5', c2: 'n1', c3: 'n2', c4: 'n3', c5: 'n4' };

// ---------------------------------------------------------------- poses
const G = 0.55;
const tw = (hy, lean = 6, dy = 0.8, dz = 0.06) => ({ hips: [0, dy, dz], hipsR: [lean, hy, 0], spine: [lean, hy * 0.3, 0], chest: [lean * 0.6, hy * 0.4, 0], head: [0, 0, 0], gripL: G });
const RAISED = { hips: [0, 0.96, 0], hipsR: [-6, -14, 0], spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-8, 0, 0], gripL: 0.5 };
const CRUSH = { hips: [0, 0.62, 0.28], hipsR: [26, -8, 0], spine: [18, 0, 0], chest: [14, 0, 0], head: [8, 0, 0], gripL: 0.5 };
const SIDE = { hips: [0, 0.78, 0.04], hipsR: [4, 10, 0], spine: [6, 8, 0], chest: [2, 10, 0], head: [0, 0, 0], gripL: 0.4 };
const THRUST = { hips: [0, 0.76, 0.28], hipsR: [8, -70, 0], spine: [6, -10, 0], chest: [2, -8, 0], head: [0, 0, 0], spear: [-0.06, 1.14, 0.64, 0, -2, 90], gripL: 0.3 };
const ONEHAND = { hips: [0, 0.92, 0], hipsR: [-4, -30, 0], spine: [-4, -8, 0], chest: [-8, -12, 0], head: [-10, 0, 0],
  spear: [-0.38, 1.58, 0.1, 0, 88, 90], gripL: 0.4, lfree: 1, armL: [-10, 0, 70, 30] };

export function clips(A, M) {
  const { clipF, lungeAt, body, ft } = A;
  const hit = (id, i = 0) => M[id].hits[i].f;
  const ST = {};
  const lz = (id, f) => lungeAt(id, f);
  const wide = (id, f, fwd = 0) => ({ fL: [0.32, 0.08, lz(id, f) + 0.4 + fwd, 0, 22], fR: [-0.32, 0.08, lz(id, f) - 0.3, 0, -48] });
  const spinFeet = (id, from, to, sp, step = 4) => {
    const k = [];
    for (let f = from, i = 0; f <= to; f += step, i++) k.push(ft(f, i % 2 ? body(id, f, sp(f), [0.26, 0.08, 0.3, 0, 15]) : null, i % 2 ? null : body(id, f, sp(f), [-0.28, 0.08, -0.24, 0, -35])));
    return k;
  };
  const endSpin = (id, F, deg) => ft(F, [0.17, 0.08, 0.3 + lz(id, F), 0, 15 + deg], [-0.2, 0.08, -0.26 + lz(id, F), 0, -30 + deg]);
  const out = {};
  // N1 fast cut right → left
  { const [s, e] = hit('n1'), F = M.n1.frames, c = M.n1.cancel;
    out.n1 = clipF('n1', [
      [0, ST],
      [s - 4, { ...tw(-55, 6, 0.8), spear: [-0.32, 1.14, -0.06, -120, 6, 0] }, 'out'],
      [s, { ...tw(-10, 6, 0.8), spear: [-0.2, 1.1, 0.3, -30, -2, 0] }, 'lin'],
      [s + 2, { ...tw(25, 6, 0.8), spear: [0, 1.1, 0.32, 40, -2, 0] }, 'lin'],
      [e + 2, { ...tw(55, 4, 0.82), spear: [0.14, 1.14, 0.2, 115, 4, 0] }, 'out'],
      [c, { ...tw(50, 4, 0.84), spear: [0.12, 1.14, 0.2, 110, 6, 0] }, 'io'],
      [F, ST],
    ]); }
  // N2 backhand left → right, stepping
  { const [s, e] = hit('n2'), F = M.n2.frames, c = M.n2.cancel;
    out.n2 = clipF('n2', [
      [0, ST],
      [s - 4, { ...tw(55, 6, 0.8), spear: [0.14, 1.16, 0.1, 125, 6, 0] }, 'out'],
      [s, { ...tw(15, 8, 0.78), spear: [0, 1.1, 0.32, 30, -2, 0], ...wide('n2', s) }, 'lin'],
      [s + 2, { ...tw(-25, 8, 0.78), spear: [-0.2, 1.1, 0.3, -45, -2, 0] }, 'lin'],
      [e + 2, { ...tw(-60, 6, 0.8), spear: [-0.34, 1.14, 0.02, -125, 4, 0] }, 'out'],
      [c, { ...tw(-55, 6, 0.82), spear: [-0.32, 1.14, 0.04, -120, 6, 0] }, 'io'],
      [F, ST],
    ]); }
  // N3 rising cross-cut, low left → high right
  { const [s, e] = hit('n3'), F = M.n3.frames, c = M.n3.cancel;
    out.n3 = clipF('n3', [
      [0, ST],
      [s - 5, { ...tw(40, 12, 0.74), spear: [0.06, 0.84, 0.1, 70, -40, 0] }, 'out'],
      [s, { ...tw(0, 4, 0.8), spear: [-0.1, 1.1, 0.34, 0, 10, 0] }, 'in'],
      [e + 2, { ...tw(-40, -8, 0.88), spear: [-0.3, 1.5, 0.16, -60, 60, 0] }, 'out'],
      [c, { ...tw(-36, -6, 0.88), spear: [-0.3, 1.46, 0.14, -56, 56, 0] }, 'io'],
      [F, ST],
    ]); }
  // N4 hop and a full spin in the air
  { const [s, e] = hit('n4'), F = M.n4.frames, c = M.n4.cancel;
    const sp = (f) => -360 * Math.min(1, Math.max(0, (f - s) / (e - s)));
    const air = (f, y = 0.5) => ({ fL: [0.18, y, lz('n4', f) + 0.2, -30, 15 + sp(f)], fR: [-0.18, y - 0.1, lz('n4', f) - 0.12, -20, -30 + sp(f)] });
    const keys = [[0, ST], [s - 5, { ...tw(40, 8, 0.74), spear: [0.1, 1.1, 0.2, 110, 4, 0] }, 'out']];
    for (let f = s; f <= e; f += 2) keys.push([f, { ...SIDE, hips: [0, 0.8 + 0.4 * Math.sin(Math.PI * (f - s) / (e - s)), 0.06], spin: sp(f), spear: [0.06, 1.06, 0.3, 90, -6, 0], ...air(f, 0.3 + 0.4 * Math.sin(Math.PI * (f - s) / (e - s))) }, 'lin']);
    keys.push([e + 3, { ...SIDE, hips: [0, 0.72, 0.06], spin: -360, spear: [0.08, 1.08, 0.28, 92, -2, 0], ...wide('n4', e + 3) }, 'in'],
      [c, { ...SIDE, spin: -360, spear: [0.08, 1.1, 0.26, 92, 0, 0] }, 'io'], [F, { ...ST, spin: -360 }], endSpin('n4', F, -360));
    out.n4 = clipF('n4', keys); }
  // N5 two turns on the ground, halberd held out wide
  { const [s, e] = hit('n5'), F = M.n5.frames, c = M.n5.cancel;
    const sp = (f) => 720 * Math.min(1, Math.max(0, (f - s) / (e - s)));
    const keys = [[0, ST], [s - 5, { ...tw(-40, 6, 0.78), spear: [-0.32, 1.1, 0.08, -100, 0, 0] }, 'out']];
    for (let f = s; f <= e; f += 2) keys.push([f, { ...SIDE, hipsR: [4, -10, 0], chest: [2, -10, 0], spin: sp(f), spear: [-0.3, 1.04, 0.26, -90, -4, 0] }, 'lin']);
    keys.push([c, { ...SIDE, hipsR: [4, -10, 0], spin: 720, spear: [-0.3, 1.06, 0.22, -88, 0, 0] }, 'io'], [F, { ...ST, spin: 720 }],
      ...spinFeet('n5', s + 2, e, sp, 3), endSpin('n5', F, 720));
    out.n5 = clipF('n5', keys); }
  // N6 leaping crush
  { const [s] = hit('n6'), F = M.n6.frames, c = M.n6.cancel;
    out.n6 = clipF('n6', [
      [0, ST],
      [7, { hips: [0, 0.7, 0], hipsR: [14, -20, 0], spine: [10, 0, 0], chest: [6, -6, 0], head: [0, 0, 0], spear: [-0.3, 1.0, -0.2, -10, 30, 0], gripL: 0.5 }, 'out'],
      [13, { ...RAISED, hips: [0, 1.4, 0.3], spear: [-0.16, 2.0, 0, 0, 140, 0], fL: [0.2, 0.55, lz('n6', 13) + 0.3, -30, 15], fR: [-0.2, 0.5, lz('n6', 13) - 0.1, -20, -30] }, 'out'],
      [17, { ...RAISED, hips: [0, 1.14, 0.4], spear: [-0.16, 1.86, 0, 0, 152, 0], fL: [0.24, 0.3, lz('n6', 17) + 0.4, -20, 15], fR: [-0.24, 0.25, lz('n6', 17) - 0.2, -10, -30] }, 'io'],
      [s, { ...CRUSH, hips: [0, 0.58, 0.3], spear: [-0.1, 0.9, 0.55, 0, -46, 0], ...wide('n6', s) }, 'snap'],
      [c, { ...CRUSH, hips: [0, 0.64, 0.28], spear: [-0.1, 0.92, 0.55, 0, -42, 0] }, 'io'],
      [F, ST],
    ]); }
  // C1 天下無雙: raised one-handed, then a 540° sweep
  { const [s, e] = hit('c1'), F = M.c1.frames, c = M.c1.cancel;
    const sp = (f) => -540 * Math.min(1, Math.max(0, (f - s) / (e - s)));
    const keys = [[0, ST], [12, ONEHAND, 'out'], [22, { ...ONEHAND, chest: [-10, -14, 0], spear: [-0.38, 1.62, 0.1, 0, 92, 90] }, 'io'],
      [s - 3, { ...tw(45, 10, 0.74), spear: [0.12, 1.12, 0.14, 120, 4, 0], ...wide('c1', s - 3) }, 'in']];
    for (let f = s; f <= e; f += 2) keys.push([f, { ...SIDE, hips: [0, 0.74, 0.04], spin: sp(f), spear: [0.06, 1.04, 0.3, 90, -6, 0] }, 'lin']);
    keys.push([e + 4, { ...SIDE, hips: [0, 0.72, 0.04], spin: -560, spear: [0.1, 1.08, 0.26, 100, 0, 0] }, 'out'],
      [c, { ...SIDE, spin: -540, spear: [0.1, 1.1, 0.24, 96, 2, 0] }, 'io'], [F, { ...ST, spin: -540 }],
      ...spinFeet('c1', s + 2, e, sp, 4), endSpin('c1', F, -540));
    out.c1 = clipF('c1', keys); }
  // C2 uppercut with a hop
  { const [s] = hit('c2'), F = M.c2.frames, c = M.c2.cancel;
    out.c2 = clipF('c2', [
      [0, ST],
      [s - 7, { hips: [0, 0.66, 0.1], hipsR: [20, -30, 0], spine: [14, -10, 0], chest: [8, -12, 0], head: [0, 0, 0], spear: [-0.3, 0.7, 0.18, -20, -48, 0], gripL: 0.5, ...wide('c2', s - 7) }, 'out'],
      [s + 1, { hips: [0, 1.1, 0.22], hipsR: [-10, 10, 0], spine: [-8, 4, 0], chest: [-14, 10, 0], head: [-12, 0, 0], spear: [-0.12, 1.5, 0.36, 5, 75, 0], gripL: 0.5,
        fL: [0.22, 0.3, lz('c2', s + 1) + 0.3, -20, 15], fR: [-0.22, 0.26, lz('c2', s + 1) - 0.1, -10, -30] }, 'snap'],
      [s + 8, { ...RAISED, hips: [0, 0.94, 0.2], spear: [-0.1, 1.8, 0.1, 0, 112, 0], ...wide('c2', s + 8) }, 'out'],
      [c, { ...RAISED, spear: [-0.12, 1.7, 0.04, 0, 116, 0] }, 'io'],
      [F, ST],
    ]); }
  // C3 piercing thrust carrying him 5 m
  { const [s, e] = hit('c3'), F = M.c3.frames, c = M.c3.cancel;
    const chamber = { hips: [0, 0.76, -0.04], hipsR: [10, -60, 0], spine: [8, -14, 0], chest: [4, -22, 0], head: [0, 0, 0], spear: [-0.22, 1.1, -0.36, 0, 0, 90], gripL: 0.4 };
    out.c3 = clipF('c3', [
      [0, ST],
      [s - 6, { ...chamber, ...wide('c3', s - 6) }, 'out'],
      [s - 1, { ...chamber, hips: [0, 0.74, -0.08] }, 'io'],
      [s + 2, { ...THRUST, fL: [0.2, 0.3, lz('c3', s + 2) + 0.6, -20, 10], fR: [-0.26, 0.26, lz('c3', s + 2) - 0.4, 20, -60] }, 'snap'],
      [e, { ...THRUST, hips: [0, 0.74, 0.3], fL: [0.2, 0.08, lz('c3', e) + 0.7, 0, 10], fR: [-0.26, 0.08, lz('c3', e) - 0.42, 0, -60] }, 'lin'],
      [c, { ...THRUST, hips: [0, 0.8, 0.22] }, 'io'],
      [F, ST],
    ]); }
  // C4 tornado: four turns carried forward, then a final spin slash
  { const [s, e] = hit('c4', 0), [s2] = hit('c4', 1), F = M.c4.frames, c = M.c4.cancel;
    const sp = (f) => -1440 * Math.min(1, Math.max(0, (f - s) / (e - s)));
    const keys = [[0, ST], [s - 6, { ...ONEHAND, spear: [-0.36, 1.7, 0.1, 0, 100, 90] }, 'out']];
    for (let f = s; f <= e; f += 3) keys.push([f, { ...SIDE, hips: [0, 0.76, 0.04], spin: sp(f), spear: [0.06, 1.2, 0.3, 90, 10, 0] }, 'lin']);
    keys.push([s2, { ...SIDE, hips: [0, 0.7, 0.04], spin: -1500, spear: [0.08, 1.02, 0.3, 92, -8, 0], ...wide('c4', s2) }, 'snap'],
      [c, { ...SIDE, spin: -1440, spear: [0.08, 1.06, 0.26, 92, -2, 0] }, 'io'], [F, { ...ST, spin: -1440 }],
      ...spinFeet('c4', s + 2, e, sp, 4), endSpin('c4', F, -1440));
    out.c4 = clipF('c4', keys); }
  // C5 leap and plunge
  { const [s] = hit('c5'), F = M.c5.frames, c = M.c5.cancel, L = M.c5.landFrame;
    const air = (f, y = 0.55) => ({ fL: [0.18, y, lz('c5', f) + 0.25, -30, 15], fR: [-0.18, y - 0.1, lz('c5', f) - 0.1, -20, -30] });
    out.c5 = clipF('c5', [
      [0, ST],
      [10, { hips: [0, 0.66, 0], hipsR: [14, -10, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [0, 0, 0], spear: [-0.28, 1.0, -0.15, 0, 40, 0], gripL: 0.5 }, 'out'],
      [16, { ...RAISED, hips: [0, 1.0, 0.1], spear: [-0.16, 1.8, 0, 0, 150, 90], ...air(16) }, 'out'],
      [L - 4, { ...RAISED, hips: [0, 1.0, 0.1], spear: [-0.14, 1.9, 0.1, 0, 172, 90], ...air(L - 4) }, 'io'],
      [L - 1, { ...CRUSH, hips: [0, 0.96, 0.2], spear: [-0.1, 1.4, 0.4, 0, -60, 90], ...air(L - 1, 0.4) }, 'in'],
      [s, { ...CRUSH, hips: [0, 0.56, 0.26], spear: [-0.08, 1.1, 0.5, 0, -78, 90], ...wide('c5', s) }, 'snap'],
      [c, { ...CRUSH, hips: [0, 0.64, 0.24], spear: [-0.08, 1.1, 0.5, 0, -72, 90] }, 'io'],
      [F, ST],
    ]); }
  // dash: halberd trailing at a run, then a spinning slash
  { const [s2, e2] = hit('dash', 1), F = M.dash.frames, c = M.dash.cancel;
    const run = { hips: [0, 0.8, 0.12], hipsR: [18, -30, 0], spine: [8, -8, 0], chest: [8, -10, 0], head: [0, 0, 0], spear: [-0.32, 0.96, -0.28, -165, -6, 0], gripL: 0.5 };
    const sp = (f) => -360 * Math.min(1, Math.max(0, (f - s2) / (e2 - s2)));
    const keys = [[0, ST], [4, run, 'out'], [38, { ...run, hips: [0, 0.78, 0.14] }]];
    for (let f = 5, j = 0; f < 40; f += 5, j ^= 1) {
      const z = lz('dash', f) + 0.3;
      keys.push(ft(f - 2.5, j ? null : [0.14, 0.3, z - 0.3, -20, 5], j ? [-0.14, 0.3, z - 0.3, -20, -5] : null), ft(f, j ? null : [0.14, 0.08, z, 0, 5], j ? [-0.14, 0.08, z, 0, -5] : null));
    }
    keys.push([s2 - 2, { ...tw(45, 10, 0.74), spear: [0.12, 1.1, 0.14, 120, 2, 0] }, 'in']);
    for (let f = s2; f <= e2; f += 2) keys.push([f, { ...SIDE, spin: sp(f), spear: [0.06, 1.04, 0.3, 90, -6, 0] }, 'lin']);
    keys.push([c, { ...SIDE, spin: -360, spear: [0.1, 1.1, 0.24, 96, 2, 0] }, 'io'], [F, { ...ST, spin: -360 }], ...spinFeet('dash', s2 + 2, e2, sp, 3), endSpin('dash', F, -360));
    out.dash = clipF('dash', keys); }
  // jump attack: air cross cut
  { const [s, e] = hit('jatk'), F = M.jatk.frames;
    const air = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };
    out.jatk = clipF('jatk', [
      [0, { hips: [0, 0.95, 0], ...air, spear: [-0.2, 1.2, -0.1, 30, 30, 0] }],
      [s - 2, { hips: [0, 0.98, 0], hipsR: [-4, 45, 0], chest: [-8, 20, 0], ...air, spear: [0.1, 1.5, -0.05, 70, 50, 0], gripL: G }, 'out'],
      [e, { hips: [0, 0.95, 0.06], hipsR: [12, -30, 0], chest: [14, -20, 0], ...air, spear: [-0.3, 1.0, 0.3, -60, -40, 0], gripL: G }, 'in'],
      [F, { hips: [0, 0.95, 0.04], hipsR: [6, -10, 0], ...air, spear: [-0.2, 1.04, 0.26, -40, -24, 0], gripL: G }],
    ]); }
  // jump charge: overhead through the hang, plunge the point into the ground
  { const L = M.jc.landFrame, F = M.jc.frames, D = M.jc.plunge[0], c = M.jc.cancel;
    const air = (y) => ({ fL: [0.16, y, 0.14, -30, 10], fR: [-0.18, y - 0.08, -0.12, 20, -20] });
    out.jc = clipF('jc', [
      [0, { hips: [0, 0.95, 0], ...air(0.36), spear: [-0.2, 1.2, -0.1, 30, 30, 0] }],
      [5, { ...RAISED, hips: [0, 1.0, 0.04], ...air(0.5), spear: [-0.16, 1.8, 0, 0, 150, 90] }, 'out'],
      [D - 1, { ...RAISED, hips: [0, 1.0, 0.04], ...air(0.5), spear: [-0.16, 1.84, 0.04, 0, 168, 90] }],
      [L - 1, { ...CRUSH, hips: [0, 0.96, 0.14], ...air(0.4), spear: [-0.1, 1.4, 0.36, 0, -60, 90] }, 'in'],
      [L, { ...CRUSH, hips: [0, 0.56, 0.24], spear: [-0.08, 1.1, 0.5, 0, -78, 90], fL: [0.32, 0.08, 0.4, 0, 22], fR: [-0.32, 0.08, -0.3, 0, -48] }, 'snap'],
      [c, { ...CRUSH, hips: [0, 0.64, 0.22], spear: [-0.08, 1.1, 0.5, 0, -72, 90], fL: [0.32, 0.08, 0.4, 0, 22], fR: [-0.32, 0.08, -0.3, 0, -48] }, 'io'],
      [F, ST],
    ]); }
  void P;
  return out;
}

// ---------------------------------------------------------------- 真・無雙 天下無雙・神鬼亂舞 (musou.js runScript)
// zig-zag piercing charges, each throwing a crimson crescent · at CONTACT the widest one · a tornado · leap — and the
// FINISHER: the plunge, a storm of twelve crescents
const MU = (dmg, kb, force, lift, extra) => ({ shape: 'circle', range: 5, dmg, kb, force, lift, hitstop: 0, yMax: 5, ...extra });
export const musou = {
  act: { ...ONEHAND },
  face: { hips: [0, 0.9, 0], hipsR: [0, -24, 0], spine: [2, -6, 0], chest: [0, -8, 0], head: [2, -22, 0], spear: [-0.3, 1.2, 0.12, 20, 70, 90], gripL: 0.4 },
  ready: { hips: [0, 0.76, -0.04], hipsR: [10, -60, 0], spine: [8, -14, 0], chest: [4, -22, 0], head: [0, 0, 0], spear: [-0.22, 1.1, -0.36, 0, 0, 90], gripL: 0.4 },
  seq: [[100, 110, 'c3', 0.14, 0.24], [110, 122, 'c3', 0.26, 0.5], [122, 132, 'n1', 0.1, 0.6], [132, 144, 'c3', 0.26, 0.5],
    [144, 164, 'c4', 0.16, 0.72], [164, 176, 'c5', 0.08, 0.3]],
  fin: ['c5', 0.36, 1],
  turn: [[122, 45], [132, -90], [144, 45]],
  travel: [[110, 122, 7], [122, 126, 1], [132, 144, 7], [144, 164, 2.4], [164, 176, 1.6]],
  hits: [[110, MU(14, 'blow', 11, 4, { shape: 'line', len: 3, width: 3.4 }), 0, 2, 122],
    [125, MU(24, 'blow', 12, 5, { shape: 'arc', range: 6, ang: 200 })],
    [132, MU(16, 'blow', 12, 5, { shape: 'line', len: 3, width: 3.6, heavy: true, hitstop: 3 }), 0, 2, 144],
    [146, MU(12, 'spin', 7, 4, { range: 5.8 }), 0, 3, 163]],
  proj: [[112, { every: 99, proj: { speed: 24, life: 30, r: 2.6, kind: 'crescent' }, dmg: 26, kb: 'blow', force: 12, lift: 5, hitstop: 0 }],
    [127, { every: 99, proj: { speed: 22, life: 30, r: 2.4, kind: 'crescent', count: 3, spread: 80 }, dmg: 24, kb: 'blow', force: 11, lift: 5, hitstop: 0 }],
    [134, { every: 99, proj: { speed: 24, life: 34, r: 3.2, kind: 'crescent' }, dmg: 30, kb: 'blow', force: 13, lift: 6, hitstop: 0 }]],
  fx: [[132, 'aura', 5]],
  finFx: [[176, 'slam', 13]],
  finProj: [{ every: 99, proj: { speed: 18, life: 34, r: 2.4, kind: 'crescent', count: 12, spread: 360 }, dmg: 26, kb: 'blow', force: 12, lift: 7, hitstop: 0 }],
};
