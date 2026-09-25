// 關羽's own moveset — the Green Dragon Crescent Blade as a heavy glaive: big committed cuts carried by the whole body,
// hands wide on the shaft, every strike stepping in. (Data like hero/moves.js; clips authored with anims/author.js.)
//   N1 rising diagonal cut, low right → high left        N2 overhead cleave, stepping in
//   N3 wide waist cleave right → left (widest arc)       N4 spinning sweep, 360° with a step round
//   N5 leaping two-handed cleave + green crescent wave (the string's end)
//   C1 青龍斬: coils, circles the blade overhead, crushing slam + a great crescent wave down the field
//   C2 (N1→) scooping uppercut launcher                  C3 (N2→) advancing whirlwind, 3 turns, then a cleave
//   C4 (N3→) coiled 240° sweep throwing a fan of 3 crescents
//   C5 (N4→) leap, spin in the air, plunge, then wrench the blade up out of the ground: rock eruption
//   dash: blade dragged low behind at a run, ripped up at the end · jatk: air slash · jc: overhead plunge + crescent ring
import { P } from '../hero/rig.js';
import { locoClips } from './loco.js';

const AIRF = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };   // air string legs

const ONCE = 99;
export function moves() {
  return {
    n1: { frames: 38, next: 'n2', charge: 'c2', cancel: 26, branch: 15, dodgeCancel: 15, steer: 5, lunge: [[3, 10, 0.4]],
      hits: [{ f: [10, 13], sweep: 1, shape: 'arc', range: 3.2, ang: 150, dir: 10, dmg: 16, kb: 'flinch', force: 3.5, hitstop: 3 }] },
    n2: { frames: 40, next: 'n3', charge: 'c3', cancel: 28, branch: 18, dodgeCancel: 18, steer: 4, lunge: [[2, 13, 1.0]],
      hits: [{ f: [13, 15], every: ONCE, shape: 'line', len: 3.8, width: 1.8, dmg: 18, kb: 'push', force: 5, hitstop: 4 }] },
    n3: { frames: 36, next: 'n4', charge: 'c4', cancel: 25, branch: 17, dodgeCancel: 17, steer: 5, lunge: [[6, 12, 0.4]],
      hits: [{ f: [11, 15], sweep: 1, shape: 'arc', range: 3.5, ang: 210, dir: 20, dmg: 17, kb: 'push', force: 6.5, hitstop: 3 }] },
    n4: { frames: 44, next: 'n5', charge: 'c5', cancel: 32, branch: 28, dodgeCancel: 28, steer: 5, lunge: [[4, 22, 1.2]], armor: true,
      hits: [{ f: [14, 26], sweep: -1, sweepN: 12, shape: 'circle', range: 3.5, dmg: 16, kb: 'flinch', force: 5, hitstop: 3 }] },
    n5: { frames: 56, next: 'n1', charge: 'c1', cancel: 44, dodgeCancel: 26, steer: 6, lunge: [[4, 19, 1.8]], armor: true,
      hits: [{ f: [20, 23], every: ONCE, shape: 'arc', range: 3.6, ang: 150, dmg: 30, kb: 'blow', force: 12, lift: 6, hitstop: 7, heavy: true },
        { f: [20, 20], every: ONCE, proj: { speed: 15, life: 26, r: 1.9, kind: 'crescent' }, dmg: 20, kb: 'blow', force: 10, lift: 5, hitstop: 0 }] },

    c1: { frames: 70, cancel: 62, dodgeCancel: 40, steer: 14, lunge: [[26, 34, 0.9]], armor: true,
      hits: [{ f: [34, 37], every: ONCE, shape: 'line', len: 5, width: 2.6, dmg: 30, kb: 'blow', force: 10, lift: 6, hitstop: 7, heavy: true },
        { f: [34, 34], every: ONCE, proj: { speed: 16, life: 38, r: 2.4, kind: 'crescent' }, dmg: 26, kb: 'launch', force: 3, lift: 9, hitstop: 0 }] },
    c2: { frames: 64, cancel: 56, dodgeCancel: 34, steer: 10, lunge: [[12, 20, 0.6]], armor: true,
      hits: [{ f: [20, 24], every: ONCE, shape: 'arc', range: 3.6, ang: 160, dmg: 22, kb: 'launch', force: 2, lift: 11, hitstop: 6, heavy: true }] },
    c3: { frames: 96, cancel: 88, dodgeCancel: 78, steer: 10, lunge: [[18, 66, 2.4]], armor: true,
      hits: [{ f: [18, 66], shape: 'circle', range: 3.8, dmg: 9, kb: 'spin', force: 5, lift: 3, hitstop: 2, every: 8 },
        { f: [72, 75], every: ONCE, shape: 'arc', range: 4.4, ang: 140, dmg: 26, kb: 'blow', force: 13, lift: 6, hitstop: 7, heavy: true }] },
    c4: { frames: 78, cancel: 70, dodgeCancel: 44, steer: 12, lunge: [[20, 30, 0.8]], armor: true,
      hits: [{ f: [30, 34], sweep: 1, shape: 'arc', range: 4, ang: 240, dmg: 20, kb: 'blow', force: 10, lift: 4, hitstop: 6, heavy: true },
        { f: [32, 32], every: ONCE, proj: { count: 3, spread: 60, speed: 16, life: 30, r: 1.8, kind: 'crescent' }, dmg: 18, kb: 'blow', force: 9, lift: 5, hitstop: 0 }] },
    c5: { frames: 104, cancel: 96, dodgeCancel: 64, steer: 10, lunge: [[14, 38, 1.4]], armor: true, leap: [18, 10], plunge: [34, -24], landFrame: 40,
      hits: [{ f: [40, 43], every: ONCE, shape: 'circle', range: 4, dmg: 20, kb: 'launch', force: 3, lift: 9, hitstop: 6, heavy: true, yMax: 4 },
        { f: [58, 61], every: ONCE, shape: 'circle', range: 5.4, dmg: 32, kb: 'blow', force: 15, lift: 7, hitstop: 8, heavy: true, yMax: 4.5, rocks: 18 }] },

    dash: { frames: 84, cancel: 76, dodgeCancel: 54, steer: 3, lunge: [[0, 44, 5.4, 'lin'], [44, 52, 1.4]],
      hits: [{ f: [10, 40], every: 10, shape: 'line', len: 2.6, width: 2.4, off: 0.2, dmg: 10, kb: 'push', force: 6, hitstop: 2 },
        { f: [48, 52], every: ONCE, shape: 'arc', range: 3.8, ang: 170, dmg: 24, kb: 'launch', force: 4, lift: 10, hitstop: 6, heavy: true }] },
    jatk: { frames: 26, air: true, hover: 2.4, next: 'ja2', charge: 'jc', cancel: 14, dodgeCancel: 99, steer: 3,
      hits: [{ f: [6, 10], every: ONCE, shape: 'arc', range: 3.8, ang: 200, dmg: 14, kb: 'flinch', force: 3, hitstop: 2, yMax: 4.5 }] },
    ja2: { frames: 24, air: true, hover: 2.4, next: 'ja3', charge: 'jc', cancel: 13, dodgeCancel: 99, steer: 3,
      hits: [{ f: [5, 9], every: ONCE, shape: 'arc', range: 3.8, ang: 200, dmg: 14, kb: 'flinch', force: 3, hitstop: 2, yMax: 4.5 }] },
    ja3: { frames: 30, air: true, hover: 1.4, next: 'jatk', charge: 'jc', cancel: 18, dodgeCancel: 99, steer: 3,
      hits: [{ f: [9, 12], every: ONCE, shape: 'line', len: 4.2, width: 2.2, dmg: 22, kb: 'blow', force: 8, lift: 1, hitstop: 5, heavy: true, yMax: 5 },
        { f: [9, 9], every: ONCE, proj: { speed: 16, life: 18, r: 1.6, kind: 'crescent', y: 0.6 }, dmg: 14, kb: 'blow', force: 8, lift: 3, hitstop: 0 }] },
    jc: { frames: 60, air: true, hover: 3, landFrame: 38, hang: [6, 34], plunge: [34, -80], cancel: 54, dodgeCancel: 42, steer: 12, armor: true,
      hits: [{ f: [38, 41], every: ONCE, shape: 'circle', range: 4.6, dmg: 26, kb: 'launch', force: 5, lift: 9, hitstop: 7, heavy: true },
        { f: [38, 38], every: ONCE, proj: { count: 6, spread: 360, speed: 14, life: 18, r: 1.5, kind: 'crescent' }, dmg: 14, kb: 'blow', force: 8, lift: 4, hitstop: 0 }] },
  };
}

export const carry = { run: { spear: [-0.32, 0.9, -0.28, -172, -12, 0], gripR: 0, gripL: 0.5, lfree: 0, armL: [0, 0, 0, 0] } };
export const entry = { ja2: 'jatk', ja3: 'ja2', n2: 'n1', n3: 'n2', n4: 'n3', n5: 'n4', c2: 'n1', c3: 'n2', c4: 'n3', c5: 'n4' };

// ---------------------------------------------------------------- poses
const G = 0.62;                                                     // left hand far up the shaft
/** Torso turned `hy`° (+ left), leaning `lean`°, pelvis at height `dy`. */
const tw = (hy, lean = 6, dy = 0.82, dz = 0.06) => ({ hips: [0, dy, dz], hipsR: [lean, hy, 0], spine: [lean, hy * 0.3, 0], chest: [lean * 0.6, hy * 0.4, 0],
  head: [0, 0, 0], gripL: G });
const RAISED = { hips: [0, 0.94, 0], hipsR: [-6, -10, 0], spine: [-8, 0, 0], chest: [-10, 0, 0], head: [-6, 0, 0], gripL: 0.55 };
const CLEAVE = { hips: [0, 0.64, 0.28], hipsR: [26, -8, 0], spine: [18, 0, 0], chest: [14, 0, 0], head: [8, 0, 0], gripL: 0.55 };
const SIDE = { hips: [0, 0.78, 0.04], hipsR: [4, 10, 0], spine: [6, 8, 0], chest: [2, 10, 0], head: [0, 0, 0], gripL: G };

export function clips(A, M) {
  const { clipF, lungeAt, body, ft, BUILT } = A;
  const hit = (id, i = 0) => M[id].hits[i].f;
  const ST = {};                                                    // = STANCE (P fills every field from it)
  const lz = (id, f) => lungeAt(id, f);
  const wide = (id, f, fwd = 0) => ({ fL: [0.3, 0.08, lz(id, f) + 0.44 + fwd, 0, 20], fR: [-0.32, 0.08, lz(id, f) - 0.3 + fwd * 0.3, 0, -45] });
  /** Feet stepping round under a spin: at each listed frame both feet sit at their body-frame spots turned by the spin. */
  const spinFeet = (id, frames, spinAt, L = [0.26, 0.08, 0.3, 0, 15], R = [-0.28, 0.08, -0.24, 0, -35]) =>
    frames.map((f, i) => ft(f, i % 2 ? body(id, f, spinAt(f), L) : null, i % 2 ? null : body(id, f, spinAt(f), R)));

  const out = {};
  // N1 rising diagonal cut
  { const [s, e] = hit('n1'), F = M.n1.frames, c = M.n1.cancel;
    out.n1 = clipF('n1', [
      [0, ST],
      [s - 6, { ...tw(-50, 10, 0.78), spear: [-0.32, 0.86, -0.05, -75, -38, 0], fL: [0.26, 0.08, 0.44, 0, 20] }, 'out'],
      [s - 1, { ...tw(-22, 6, 0.8), spear: [-0.26, 0.98, 0.2, -30, -12, 0] }, 'in'],
      [s + 1, { ...tw(15, 0, 0.82), spear: [-0.08, 1.2, 0.36, 15, 25, 0] }, 'lin'],
      [e + 2, { ...tw(42, -6, 0.86), spear: [0.08, 1.46, 0.22, 62, 58, 0] }, 'out'],
      [c, { ...tw(36, -4, 0.86), spear: [0.06, 1.42, 0.2, 56, 55, 0] }, 'io'],
      [F, ST],
    ]); }
  // N2 overhead cleave, stepping in
  { const [s, e] = hit('n2'), F = M.n2.frames, c = M.n2.cancel;
    out.n2 = clipF('n2', [
      [0, ST],
      [s - 7, { ...RAISED, spear: [-0.18, 1.62, -0.05, 0, 128, 0] }, 'out'],
      [s - 2, { ...RAISED, hips: [0, 0.96, 0.06], spear: [-0.18, 1.68, -0.1, 0, 142, 0] }, 'io'],
      [s, { ...CLEAVE, hips: [0, 0.8, 0.18], hipsR: [10, -8, 0], spine: [10, 0, 0], chest: [8, 0, 0], spear: [-0.15, 1.34, 0.36, 0, 40, 0] }, 'in'],
      [e, { ...CLEAVE, spear: [-0.12, 0.95, 0.5, 0, -38, 0], fL: [0.28, 0.08, lz('n2', e) + 0.46, 0, 15], fR: [-0.3, 0.08, lz('n2', e) - 0.36, 0, -40] }, 'snap'],
      [c, { ...CLEAVE, hips: [0, 0.68, 0.26], spear: [-0.12, 0.97, 0.5, 0, -34, 0] }, 'io'],
      [F, ST],
    ]); }
  // N3 wide waist cleave right → left
  { const [s, e] = hit('n3'), F = M.n3.frames, c = M.n3.cancel;
    out.n3 = clipF('n3', [
      [0, ST],
      [s - 5, { ...tw(-65, 8, 0.78), spear: [-0.3, 1.08, -0.1, -135, 4, 0], ...wide('n3', s - 5) }, 'out'],
      [s - 1, { ...tw(-35, 8, 0.78), spear: [-0.3, 1.08, 0.12, -80, 0, 0] }, 'lin'],
      [s + 1, { ...tw(-5, 8, 0.78), spear: [-0.18, 1.08, 0.32, -20, -2, 0] }, 'lin'],
      [s + 3, { ...tw(25, 6, 0.78), spear: [0, 1.08, 0.34, 45, -2, 0] }, 'lin'],
      [e + 2, { ...tw(55, 4, 0.8), spear: [0.14, 1.1, 0.22, 120, 2, 0], ...wide('n3', e + 2) }, 'out'],
      [c, { ...tw(50, 4, 0.82), spear: [0.12, 1.12, 0.2, 115, 4, 0] }, 'io'],
      [F, ST],
    ]); }
  // N4 spinning sweep: the blade held out to the left, the whole body turns once over the feet (spin −360)
  { const [s, e] = hit('n4'), F = M.n4.frames, c = M.n4.cancel;
    const sp = (f) => -360 * Math.min(1, Math.max(0, (f - s) / (e - s)));
    const keys = [[0, ST], [s - 6, { ...tw(40, 4, 0.8), spear: [0.1, 1.12, 0.2, 110, 2, 0] }, 'out']];
    for (let k = 0; k <= 6; k++) { const f = s + k * 2; keys.push([f, { ...SIDE, spin: sp(f), spear: [0.06, 1.06, 0.3, 90, -4, 0] }, 'lin']); }
    keys.push([e + 3, { ...SIDE, hips: [0, 0.8, 0.04], spin: -380, spear: [0.1, 1.1, 0.26, 96, 0, 0] }, 'out'],
      [c, { ...SIDE, spin: -360, spear: [0.1, 1.1, 0.24, 94, 2, 0] }, 'io'], [F, { ...ST, spin: -360 }],
      ...spinFeet('n4', [s + 2, s + 5, s + 8, s + 11, e + 1], sp),
      ft(F, [0.17, 0.08, 0.3 + lz('n4', F), 0, 15 - 360], [-0.2, 0.08, -0.26 + lz('n4', F), 0, -30 - 360]));
    out.n4 = clipF('n4', keys); }
  // N5 leaping cleave: gather, spring (the pelvis rises, legs tuck), blade overhead, crash down
  { const [s] = hit('n5'), F = M.n5.frames, c = M.n5.cancel;
    out.n5 = clipF('n5', [
      [0, ST],
      [8, { hips: [0, 0.7, 0], hipsR: [16, -20, 0], spine: [10, 0, 0], chest: [6, -6, 0], head: [0, 0, 0], spear: [-0.3, 1.0, -0.22, -10, 20, 0], gripL: 0.55 }, 'out'],
      [14, { ...RAISED, hips: [0, 1.36, 0.3], hipsR: [-10, 0, 0], spear: [-0.18, 1.95, 0, 0, 135, 0],
        fL: [0.2, 0.5, lz('n5', 14) + 0.3, -30, 15], fR: [-0.2, 0.45, lz('n5', 14) - 0.1, -20, -30] }, 'out'],
      [18, { ...RAISED, hips: [0, 1.12, 0.4], spear: [-0.18, 1.8, 0, 0, 150, 0],
        fL: [0.24, 0.3, lz('n5', 18) + 0.4, -20, 15], fR: [-0.24, 0.25, lz('n5', 18) - 0.2, -10, -30] }, 'io'],
      [s, { ...CLEAVE, hips: [0, 0.58, 0.3], spear: [-0.1, 0.9, 0.55, 0, -45, 0], ...wide('n5', s) }, 'snap'],
      [c, { ...CLEAVE, hips: [0, 0.64, 0.28], spear: [-0.1, 0.92, 0.55, 0, -42, 0] }, 'io'],
      [F, ST],
    ]); }
  // C1 青龍斬
  { const [s] = hit('c1'), F = M.c1.frames, c = M.c1.cancel;
    out.c1 = clipF('c1', [
      [0, ST],
      [10, { ...tw(-60, 10, 0.76), spear: [-0.36, 0.95, -0.2, -160, 10, 0], ...wide('c1', 10) }, 'out'],
      [16, { ...tw(-62, 12, 0.74), spear: [-0.36, 0.96, -0.2, -162, 12, 0] }, 'io'],
      [24, { ...RAISED, hips: [0, 0.9, 0], chest: [-12, -10, 0], spear: [-0.2, 1.7, -0.1, -60, 120, 0] }, 'io'],
      [31, { ...RAISED, chest: [-14, 0, 0], spear: [-0.16, 1.76, -0.08, 0, 150, 0] }, 'io'],
      [s, { ...CLEAVE, hips: [0, 0.6, 0.32], hipsR: [28, -6, 0], spine: [20, 0, 0], chest: [16, 0, 0], spear: [-0.1, 0.92, 0.58, 0, -40, 0], ...wide('c1', s, 0.2) }, 'snap'],
      [s + 12, { ...CLEAVE, hips: [0, 0.62, 0.3], spear: [-0.1, 0.94, 0.58, 0, -38, 0] }, 'io'],
      [c, { ...CLEAVE, hips: [0, 0.7, 0.24], spear: [-0.12, 1.0, 0.5, 0, -24, 0] }, 'io'],
      [F, ST],
    ]); }
  // C2 scooping uppercut launcher
  { const [s] = hit('c2'), F = M.c2.frames, c = M.c2.cancel;
    out.c2 = clipF('c2', [
      [0, ST],
      [10, { hips: [0, 0.66, 0.12], hipsR: [20, -30, 0], spine: [14, -10, 0], chest: [8, -10, 0], head: [0, 0, 0], spear: [-0.3, 0.7, 0.2, -20, -45, 0], gripL: 0.55, ...wide('c2', 10) }, 'out'],
      [s - 1, { hips: [0, 0.64, 0.14], hipsR: [22, -32, 0], spine: [16, -10, 0], chest: [10, -12, 0], head: [0, 0, 0], spear: [-0.3, 0.68, 0.22, -22, -48, 0], gripL: 0.55 }, 'io'],
      [s + 1, { hips: [0, 0.92, 0.2], hipsR: [-8, 10, 0], spine: [-6, 4, 0], chest: [-12, 10, 0], head: [-10, 0, 0], spear: [-0.12, 1.36, 0.36, 5, 70, 0], gripL: 0.55 }, 'snap'],
      [s + 6, { hips: [0, 0.98, 0.2], hipsR: [-10, 12, 0], spine: [-8, 4, 0], chest: [-14, 10, 0], head: [-14, 0, 0], spear: [-0.1, 1.7, 0.1, 0, 110, 0], gripL: 0.55 }, 'out'],
      [c, { ...RAISED, hips: [0, 0.94, 0.12], spear: [-0.14, 1.64, 0.02, 0, 118, 0] }, 'io'],
      [F, ST],
    ]); }
  // C3 advancing whirlwind: three turns carried forward, then a cleave
  { const [s, e] = hit('c3', 0), [s2] = hit('c3', 1), F = M.c3.frames, c = M.c3.cancel;
    const sp = (f) => -1080 * Math.min(1, Math.max(0, (f - s) / (e - s)));
    const keys = [[0, ST], [s - 6, { ...tw(50, 4, 0.8), spear: [0.12, 1.2, 0.2, 110, 10, 0] }, 'out']];
    for (let f = s; f <= e; f += 3) keys.push([f, { ...SIDE, hips: [0, 0.76, 0.04], spin: sp(f), spear: [0.06, 1.06, 0.3, 90, -4, 0] }, 'lin']);
    keys.push([s2 - 3, { ...RAISED, spin: -1080, spear: [-0.18, 1.66, -0.05, 0, 132, 0] }, 'out'],
      [s2, { ...CLEAVE, spin: -1080, spear: [-0.12, 0.92, 0.52, 0, -40, 0], ...wide('c3', s2) }, 'snap'],
      [c, { ...CLEAVE, spin: -1080, hips: [0, 0.68, 0.26], spear: [-0.12, 0.95, 0.52, 0, -36, 0] }, 'io'],
      [F, { ...ST, spin: -1080 }],
      ...spinFeet('c3', Array.from({ length: Math.floor((e - s) / 4) + 1 }, (_, k) => s + 2 + k * 4), sp),
      ft(F, [0.17, 0.08, 0.3 + lz('c3', F), 0, 15 - 1080], [-0.2, 0.08, -0.26 + lz('c3', F), 0, -30 - 1080]));
    out.c3 = clipF('c3', keys); }
  // C4 coiled 240° sweep, a fan of crescents
  { const [s, e] = hit('c4'), F = M.c4.frames, c = M.c4.cancel;
    out.c4 = clipF('c4', [
      [0, ST],
      [14, { ...tw(-75, 10, 0.74), spear: [-0.3, 1.1, -0.15, -150, 15, 0], ...wide('c4', 14) }, 'out'],
      [s - 4, { ...tw(-78, 12, 0.72), spear: [-0.3, 1.1, -0.16, -155, 16, 0] }, 'io'],
      [s, { ...tw(-30, 8, 0.76), spear: [-0.3, 1.08, 0.1, -80, 0, 0] }, 'in'],
      [s + 2, { ...tw(10, 6, 0.76), spear: [-0.12, 1.08, 0.34, 0, -2, 0] }, 'lin'],
      [e, { ...tw(50, 4, 0.78), spear: [0.1, 1.1, 0.25, 100, 2, 0] }, 'lin'],
      [e + 6, { ...tw(70, 2, 0.8), spear: [0.16, 1.15, 0.1, 150, 8, 0], ...wide('c4', e + 6) }, 'out'],
      [c, { ...tw(66, 2, 0.82), spear: [0.14, 1.14, 0.12, 145, 8, 0] }, 'io'],
      [F, ST],
    ]); }
  // C5 leap, air spin, plunge, then wrench the blade up out of the ground
  { const [s1] = hit('c5', 0), [s2] = hit('c5', 1), F = M.c5.frames, c = M.c5.cancel, L = M.c5.landFrame;
    const air = (f) => ({ fL: [0.18, 0.55, lz('c5', f) + 0.25, -30, 15 - 360 * Math.min(1, Math.max(0, (f - 20) / 12))],
      fR: [-0.18, 0.5, lz('c5', f) - 0.1, -20, -30 - 360 * Math.min(1, Math.max(0, (f - 20) / 12))] });
    out.c5 = clipF('c5', [
      [0, ST],
      [12, { hips: [0, 0.68, 0], hipsR: [14, -10, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [0, 0, 0], spear: [-0.28, 1.0, -0.15, 0, 40, 0], gripL: 0.55 }, 'out'],
      [18, { ...RAISED, hips: [0, 1.0, 0.1], spear: [-0.16, 1.7, 0, 0, 140, 0], ...air(18) }, 'out'],
      [26, { ...RAISED, hips: [0, 1.0, 0.1], spin: -180, spear: [-0.16, 1.7, 0, 0, 145, 0], ...air(26) }, 'lin'],
      [32, { ...RAISED, hips: [0, 1.0, 0.1], spin: -360, spear: [-0.16, 1.72, 0, 0, 150, 0], ...air(32) }, 'lin'],
      [L - 2, { ...CLEAVE, hips: [0, 0.96, 0.2], spin: -360, spear: [-0.12, 1.3, 0.4, 0, -40, 0], ...air(L - 2) }, 'in'],
      [s1, { ...CLEAVE, hips: [0, 0.58, 0.28], spin: -360, spear: [-0.1, 0.9, 0.5, 0, -62, 0],
        fL: [0.3, 0.08, lz('c5', s1) + 0.44, 0, 20 - 360], fR: [-0.32, 0.08, lz('c5', s1) - 0.3, 0, -45 - 360] }, 'snap'],
      [s2 - 4, { ...CLEAVE, hips: [0, 0.56, 0.28], spin: -360, spear: [-0.1, 0.88, 0.5, 0, -64, 0] }, 'io'],
      [s2 + 1, { hips: [0, 0.9, 0.2], hipsR: [-8, -4, 0], spine: [-6, 0, 0], chest: [-12, 0, 0], head: [-8, 0, 0], spin: -360,
        spear: [-0.12, 1.4, 0.4, 0, 45, 0], gripL: 0.55 }, 'snap'],
      [c, { ...RAISED, spin: -360, spear: [-0.14, 1.6, 0.1, 0, 110, 0] }, 'io'],
      [F, { ...ST, spin: -360 }],
      ft(F, [0.17, 0.08, 0.3 + lz('c5', F), 0, 15 - 360], [-0.2, 0.08, -0.26 + lz('c5', F), 0, -30 - 360]),
    ]); }
  // dash: running with the blade dragged low behind, then planted and ripped upward
  { const [s2] = hit('dash', 1), F = M.dash.frames, c = M.dash.cancel;
    const run = { hips: [0, 0.8, 0.12], hipsR: [18, -30, 0], spine: [8, -8, 0], chest: [8, -10, 0], head: [0, 0, 0], spear: [-0.32, 0.9, -0.28, -172, -12, 0], gripL: 0.5 };
    const keys = [[0, ST], [4, run, 'out'], [40, { ...run, hips: [0, 0.78, 0.14] }]];
    const X = [0.14, -0.14];
    for (let f = 5, j = 0; f < 44; f += 5, j ^= 1) {                     // a stride every 5 frames just ahead of the root
      const z = lz('dash', f) + 0.3;
      keys.push(ft(f - 2.5, j ? null : [X[0], 0.3, z - 0.3, -20, 5], j ? [X[1], 0.3, z - 0.3, -20, -5] : null),
        ft(f, j ? null : [X[0], 0.08, z, 0, 5], j ? [X[1], 0.08, z, 0, -5] : null));
    }
    keys.push([s2 - 3, { hips: [0, 0.66, 0.2], hipsR: [20, -34, 0], spine: [14, -10, 0], chest: [8, -12, 0], head: [0, 0, 0], spear: [-0.34, 0.72, 0.1, -40, -40, 0], gripL: 0.55,
      ...wide('dash', s2 - 3) }, 'in'],
      [s2 + 1, { hips: [0, 0.94, 0.24], hipsR: [-8, 20, 0], spine: [-6, 6, 0], chest: [-12, 16, 0], head: [-10, 0, 0], spear: [0, 1.46, 0.3, 30, 72, 0], gripL: 0.55 }, 'snap'],
      [c, { ...RAISED, hips: [0, 0.92, 0.16], spear: [-0.1, 1.64, 0.1, 10, 110, 0] }, 'io'],
      [F, ST]);
    out.dash = clipF('dash', keys); }
  // jump attack: air slash high right → low left
  { const [s, e] = hit('jatk'), F = M.jatk.frames;
    const air = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };
    out.jatk = clipF('jatk', [
      [0, { hips: [0, 0.95, 0], ...air, spear: [-0.2, 1.2, -0.1, 30, 30, 0] }],
      [s - 2, { hips: [0, 0.98, 0], hipsR: [-4, -45, 0], chest: [-8, -20, 0], head: [0, 0, 0], ...air, spear: [-0.3, 1.52, -0.05, -70, 50, 0], gripL: G }, 'out'],
      [e, { hips: [0, 0.95, 0.06], hipsR: [12, 30, 0], chest: [14, 20, 0], head: [0, 0, 0], ...air, spear: [0.08, 1.0, 0.3, 60, -40, 0], gripL: G }, 'in'],
      [F, { hips: [0, 0.95, 0.04], hipsR: [6, 10, 0], ...air, spear: [0, 1.04, 0.26, 40, -24, 0], gripL: G }],
    ]); }
  // jump charge: blade raised overhead through the hang, the plunge, a cleave into the ground on landing
  { const L = M.jc.landFrame, F = M.jc.frames, D = M.jc.plunge[0], c = M.jc.cancel;
    const air = (y) => ({ fL: [0.16, y, 0.14, -30, 10], fR: [-0.18, y - 0.08, -0.12, 20, -20] });
    out.jc = clipF('jc', [
      [0, { hips: [0, 0.95, 0], ...air(0.36), spear: [-0.2, 1.2, -0.1, 30, 30, 0] }],
      [5, { ...RAISED, hips: [0, 1.0, 0.04], ...air(0.5), spear: [-0.18, 1.8, 0, 0, 140, 0] }, 'out'],
      [D - 1, { ...RAISED, hips: [0, 1.0, 0.04], ...air(0.5), spear: [-0.18, 1.84, -0.04, 0, 150, 0] }],
      [L - 1, { ...CLEAVE, hips: [0, 0.96, 0.16], ...air(0.4), spear: [-0.12, 1.36, 0.4, 0, 10, 0] }, 'in'],
      [L, { ...CLEAVE, hips: [0, 0.6, 0.26], spear: [-0.1, 0.9, 0.52, 0, -50, 0], fL: [0.3, 0.08, 0.5, 0, 25], fR: [-0.3, 0.08, -0.3, 0, -50] }, 'snap'],
      [c, { ...CLEAVE, hips: [0, 0.68, 0.22], spear: [-0.1, 0.94, 0.5, 0, -40, 0], fL: [0.3, 0.08, 0.5, 0, 25], fR: [-0.3, 0.08, -0.3, 0, -50] }, 'io'],
      [F, ST],
    ]); }
  void BUILT; void P;
  // air string: jatk high right → low left · ja2 rising backhand low left → high right · ja3 overhead cleave down
  { const [s, e] = hit('ja2'), F = M.ja2.frames;
    out.ja2 = clipF('ja2', [
      [0, { hips: [0, 0.95, 0], ...AIRF, spear: [0, 1.04, 0.26, 40, -24, 0], gripL: G }],
      [s - 2, { hips: [0, 0.96, 0], hipsR: [8, 40, 0], chest: [10, 24, 0], head: [0, 0, 0], ...AIRF, spear: [0.1, 0.9, 0.2, 80, -40, 0], gripL: G }, 'out'],
      [e, { hips: [0, 0.98, 0.04], hipsR: [-8, -40, 0], chest: [-12, -24, 0], head: [-6, 0, 0], ...AIRF, spear: [-0.3, 1.56, 0.1, -70, 55, 0], gripL: G }, 'in'],
      [F, { hips: [0, 0.97, 0.02], hipsR: [-4, -20, 0], ...AIRF, spear: [-0.26, 1.46, 0.08, -50, 45, 0], gripL: G }]]); }
  { const [s] = hit('ja3'), F = M.ja3.frames;
    out.ja3 = clipF('ja3', [
      [0, { hips: [0, 0.97, 0.02], ...AIRF, spear: [-0.26, 1.46, 0.08, -50, 45, 0], gripL: G }],
      [s - 3, { ...RAISED, hips: [0, 1.0, 0], ...AIRF, spear: [-0.18, 1.84, -0.06, 0, 150, 0] }, 'out'],
      [s + 1, { ...CLEAVE, hips: [0, 0.9, 0.16], ...AIRF, spear: [-0.12, 1.0, 0.5, 0, -50, 0] }, 'snap'],
      [F, { ...CLEAVE, hips: [0, 0.92, 0.12], ...AIRF, spear: [-0.12, 1.04, 0.48, 0, -40, 0] }]]); }
  Object.assign(out, locoClips({
    idle: { hips: [0, 0.9, 0], hipsR: [0, -20, 0], spine: [2, -4, 0], chest: [-2, -6, 0], head: [-2, 6, 0],
      footL: [0.18, 0.08, 0.24, 0, 10], footR: [-0.2, 0.08, -0.18, 0, -25], spear: [-0.34, 0.92, 0.1, 0, 84, 0], gripR: 0, gripL: 0.3, lfree: 1, armL: [-78, 22, 14, 128] },
    breath: { hips: [0, 0.895, 0], chest: [0, -6, 0], armL: [-74, 22, 14, 124] },
    takeoff: { hips: [0, 0.98, 0], hipsR: [-6, -10, 0], chest: [-6, 5, 0], head: [-6, 0, 0], spear: [-0.3, 1.1, -0.12, -150, 20, 0], gripL: 0.5 },
    apex: { hips: [0, 0.95, 0], hipsR: [-6, -8, 0], chest: [-8, 0, 0], head: [0, 0, 0], spear: [-0.18, 1.6, -0.05, 0, 120, 0], gripL: 0.55 },
    fall: { hips: [0, 0.95, 0], hipsR: [-8, 0, 0], chest: [-8, 0, 0], head: [10, 0, 0], spear: [-0.36, 1.3, 0.1, -100, 20, 0], gripL: 0.55 },
    land: { hips: [0, 0.6, 0.08], hipsR: [28, -10, 0], spine: [12, 0, 0], chest: [10, 0, 0], head: [6, 0, 0], footL: [0.26, 0.08, 0.34, 0, 18], footR: [-0.26, 0.08, -0.24, 0, -35], spear: [-0.2, 0.92, 0.4, 0, -28, 0], gripL: 0.55 },
    hurt: { hips: [0, 0.86, -0.12], hipsR: [-16, -30, 6], spine: [-12, 0, 0], chest: [-10, 0, 0], head: [-18, 0, 0], spear: [-0.3, 1.1, -0.1, -20, 60, 0], gripL: 0.4 },
  }));
  return out;
}

// ---------------------------------------------------------------- 真・無雙 青龍偃月・天斬 (musou.js runScript)
// charge in dragging the blade · overhead cleave throwing a crescent · coil and the great slam at CONTACT · a wide
// cleave throwing three · a spinning sweep · spring up — and the FINISHER: crash down, a ring of crescents
const MU = (dmg, kb, force, lift, extra) => ({ shape: 'circle', range: 5, dmg, kb, force, lift, hitstop: 0, yMax: 5, ...extra });
const CRES = (o = {}) => ({ every: 99, proj: { speed: 20, life: 30, r: 2.6, kind: 'crescent', ...o }, dmg: 24, kb: 'blow', force: 9, lift: 6, hitstop: 0 });
export const musou = {
  act: { ...RAISED, spear: [-0.3, 1.3, 0.1, 0, 85, 0], lfree: 1, armL: [-40, 0, 40, 60] },
  face: { hips: [0, 0.9, 0], hipsR: [0, -24, 0], spine: [2, -6, 0], chest: [0, -8, 0], head: [4, -20, 0], spear: [-0.25, 1.2, 0.2, 30, 60, 0], gripL: 0.62 },
  ready: { hips: [0, 0.8, 0.12], hipsR: [18, -30, 0], spine: [8, -8, 0], chest: [8, -10, 0], head: [0, 0, 0], spear: [-0.32, 0.9, -0.28, -172, -12, 0], gripL: 0.5 },
  seq: [[100, 112, 'dash', 0.05, 0.5], [112, 124, 'n2', 0.1, 0.6], [124, 132, 'c1', 0.14, 0.44], [132, 140, 'c1', 0.44, 0.62],
    [140, 152, 'n3', 0.1, 0.8], [152, 164, 'n4', 0.2, 0.8], [164, 176, 'n5', 0.05, 0.34]],
  fin: ['n5', 0.34, 1],
  travel: [[100, 112, 5.5], [112, 118, 1.2], [140, 146, 0.8], [152, 164, 1.6], [164, 176, 1.8]],
  hits: [[106, MU(10, 'push', 8, 2, { shape: 'line', len: 3, width: 3 }), 0, 3, 112],
    [118, MU(28, 'launch', 4, 10, { shape: 'line', len: 9, width: 4 })],
    [134, MU(40, 'blow', 12, 8, { shape: 'line', len: 12, width: 5, heavy: true, hitstop: 4 })],
    [143, MU(26, 'blow', 11, 6, { shape: 'arc', range: 7, ang: 220 })],
    [152, MU(12, 'spin', 6, 4, { range: 5.5 }), 0, 3, 163]],
  proj: [[118, CRES()], [134, CRES({ r: 3.6, speed: 18, life: 40 })], [143, CRES({ count: 3, spread: 70 })]],
  fx: [[134, 'slam', 6, 2]],
  finFx: [[176, 'slam', 12]],
  finProj: [CRES({ count: 10, spread: 360, speed: 17, life: 34, r: 2.4 })],
};
