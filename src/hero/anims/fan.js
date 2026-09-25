// Fan upper body (Zhuge Liang): replaces the weapon and arm channels of every pose — the lower body (steps, lunges,
// spins, hips) stays the shared spear clip, so it keeps its sync with the moveset's root motion, while the right hand
// swings a one-handed feather fan and the left hand rests behind the back (or opens toward the target on beams).
// One overlay clip per move, keyed on the move's own hit windows (after styles.js), so a strike lands in its window.
// Weapon axes as in rig.js: origin = the fan handle in the right hand, +Z out through the feathers (and the wind blade).
import { P, clip, sampleClip, POSE_SIZE } from '../rig.js';
import { MOVES } from '../moves.js';

const W0 = 25, W1 = 38;                                      // channels copied: spear 25–30, grips 31–32, lfree 33, armL 34–37
const BACK = [-28, 0, 14, 88];                               // left hand raised before the chest, palm open (shoulder rx, ry, rz, elbow)
const PALM = [-72, -12, -6, 18];                             // left arm out toward the target, open palm
const f = (spear, armL = BACK) => ({ spear, gripR: 0, gripL: 0.3, lfree: 1, armL });

// fan poses (spear = [x, y, z, yaw°, elev°, roll°] of the handle, root space)
export const FAN = {
  rest: f([-0.3, 1.0, 0.18, -12, 70, 90]),                     // upright at the right of the chest, clear of the face
  run: f([-0.2, 1.05, 0.1, 0, 58, 90]),
  cockR: f([-0.46, 1.32, -0.02, -105, 22, 0]),                // drawn back past the right shoulder
  cockL: f([0.08, 1.34, 0.22, 95, 26, 180]),                  // across the body, over the left shoulder
  fwd: f([-0.2, 1.26, 0.42, 0, 8, 0]),                        // swung through, pointing ahead
  fwdLow: f([-0.22, 1.02, 0.4, 0, -12, 0]),
  endL: f([0.14, 1.22, 0.3, 100, 6, 0]),                      // follow-through out to the left
  endR: f([-0.5, 1.18, 0.1, -110, 4, 180]),                   // follow-through out to the right
  high: f([-0.2, 1.72, -0.06, 0, 128, 90]),                   // raised over the head, fan back
  chop: f([-0.2, 1.16, 0.46, 0, -14, 90]),                    // brought down in front
  aim: f([-0.22, 1.34, -0.04, 0, 14, 90], PALM),              // drawn back to cast, palm out
  cast: f([-0.14, 1.36, 0.5, 0, 6, 90], PALM),                // thrust out along the beam
  raise: f([-0.12, 1.8, 0.14, 0, 96, 90], [-150, 0, -20, 20]),   // both arms up (rings of blades)
  side: f([0.12, 1.24, 0.34, 88, 0, 0]),                      // held out to the left (spins)
};

/** Key list for one strike of `kind` whose active window starts at s (sim frames). */
function strike(kind, s, e) {
  switch (kind) {
    case 'R2L': return [[s - 6, 'cockR'], [s + 1, 'fwd', 'snap'], [e + 4, 'endL']];
    case 'L2R': return [[s - 6, 'cockL'], [s + 1, 'fwd', 'snap'], [e + 4, 'endR']];
    case 'low': return [[s - 6, 'cockR'], [s + 1, 'fwdLow', 'snap'], [e + 4, 'endL']];
    case 'chop': return [[s - 8, 'high'], [s + 1, 'chop', 'snap'], [e + 6, 'chop']];
    case 'cast': return [[s - 8, 'aim'], [s, 'cast', 'snap'], [e + 10, 'cast']];
    case 'raise': return [[s - 6, 'high'], [s, 'raise', 'snap'], [e + 8, 'raise']];
    case 'side': return [[s - 4, 'side'], [e, 'side']];
    default: return [];
  }
}
// per move: one strike kind per hit window (index), or a function for multi-phase moves
const PLAN = {
  n1: ['R2L'], n2: ['L2R'], n3: ['low'], n4: ['R2L'], n5: ['R2L', 'L2R'], n6: ['chop'],
  c1: ['cast'], c2: ['cast', 'raise'], c4: ['side'], c5: ['low', 'raise'], jatk: ['R2L'], jc: ['chop'],
  c3: (m) => {                                               // flurry of alternating flicks, the slam, the pillar ring
    const [a, b] = m.hits[0].f, k = [];
    for (let t = a, i = 0; t < b; t += 8, i++) k.push([t - 3, i & 1 ? 'cockL' : 'cockR'], [t + 1, 'fwd', 'snap']);
    return [...k, ...strike('chop', m.hits[1].f[0], m.hits[1].f[1]), ...strike('raise', m.hits[2].f[0], m.hits[2].f[1])];
  },
  c6: (m) => [...strike('side', m.hits[0].f[0], m.hits[0].f[1]), ...strike('chop', m.hits[1].f[0], m.hits[1].f[1]), ...strike('raise', m.hits[2].f[0], m.hits[2].f[1])],
  dash: (m) => [...strike('side', m.hits[0].f[0], m.hits[2].f[1]), ...strike('cast', m.hits[3].f[0], m.hits[3].f[1])],
};

const CLIPS = {};
function build(id) {
  const m = MOVES[id], F = m.frames, plan = PLAN[id];
  let keys = typeof plan === 'function' ? plan(m) : (plan || ['R2L']).flatMap((k, i) => (m.hits[i] ? strike(k, m.hits[i].f[0], m.hits[i].f[1]) : []));
  keys = [[0, 'rest'], ...keys.filter(([t]) => t > 0 && t < F), [F, 'rest']].sort((a, b) => a[0] - b[0]);
  return clip(keys.map(([t, pose, e]) => [t / F, P(FAN[pose]), e]), false, true);
}
const REST = P(FAN.rest), RUN = P(FAN.run), RAISE = P(FAN.raise);
const tmp = new Float32Array(POSE_SIZE);
// Musou: casts and raises in place of the spear's thrusts and spins
const MUSOU = { mu_act: RAISE, mu_face: P(FAN.aim), mu_charge: RAISE, mu_fin: RAISE };
const MU_RUSH = clip([[0, P(FAN.cockR)], [0.25, P(FAN.endL), 'snap'], [0.5, P(FAN.cockL)], [0.75, P(FAN.endR), 'snap'], [1, P(FAN.cockR)]], true);

/** Overwrite the fan channels of pose `out` for the hero's anim bookkeeping `a` (a.om = move id, a.ot = move frame). */
export function fanOverlay(a, out) {
  let src;
  if (a.om && MOVES[a.om]) {
    src = CLIPS[a.om] || (CLIPS[a.om] = build(a.om));
    sampleClip(src, a.ot / MOVES[a.om].frames, tmp); src = tmp;
  } else if (MUSOU[a.id]) src = MUSOU[a.id];
  else if (a.id === 'mu_rush' || a.id === 'mu_run') { sampleClip(MU_RUSH, a.t * 3, tmp); src = tmp; }
  else src = a.id === 'run' ? RUN : REST;
  for (let j = W0; j < W1; j++) out[j] = src[j];
}
