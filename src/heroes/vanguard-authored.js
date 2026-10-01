// VANGUARD (EXO-01), authored the way the original officers are (zhaoyun.js): fine voxels (FV body, HV head), every part
// centred on its joint at the shared rig's own proportions, so the shared moveset, the two-hand IK grip and the spring
// chains fit him exactly as they fit Zhao Yun. Design from the character sheet (tools/vanguard/ref/vanguard_sheet.png):
// ivory plate over a black frame, navy panels, orange power lights, a stepped navy crest, octagonal ear discs, knee
// discs, a navy tabard with a gold cross (front and back, spring chains) and the power lance.
import { vox, B, P, md } from '../hero/model.js';
import { FV } from './parts.js';

const HV = 0.0152;
const C = {
  I: 0xdcc6a2, Il: 0xefe2c6, Id: 0xa0875f,       // ivory plate: base, bevel highlight, underside seam
  N: 0x2f5a8e, Nl: 0x4a78ae, Nd: 0x1e3c62,       // navy (muted steel blue, as in the T-pose reference)
  O: 0xff9420, Ol: 0xffc860,                     // orange power light (glows: heroLook)
  K: 0x26252b, Kd: 0x1a191e, D: 0x3d3c45, Dl: 0x51505a,   // black frame, dark grey
  M: 0x6c6e78, Ml: 0x979aa6,                     // metal (pistons, collars)
  G: 0xf0a232,                                   // tabard cross
};
const TONE = {
  I: [C.I, C.Il, C.Id], N: [C.N, C.Nl, C.Nd], K: [C.K, C.D, C.Kd], D: [C.D, C.Dl, C.K], M: [C.M, C.Ml, C.D],
};

// ---------------------------------------------------------------- authoring helpers (voxel units)
/** Mirror an [a, b) box to the right side (sx −1): parts are authored with +x = outward (the hero's left). */
const mx = (sx, a, b) => (sx > 0 ? [a, b] : [[-b[0], a[1], a[2]], [-a[0], b[1], b[2]]]);
/**
 * Armour plate: box with a bright bevel on its top row, a dark seam on its bottom row (plates read as layered panels
 * under the AO) and a few glints; `r` chamfers the vertical edges, `rt` the top edges (rounded armour).
 */
function shell(a, b, t = 'I', r = 0, rt = 0, { top = true, bottom = true } = {}) {
  const [base, hi, lo] = TONE[t];
  return B(a, b, (x, y, z) => {
    const dx = Math.min(x - a[0], b[0] - 1 - x), dz = Math.min(z - a[2], b[2] - 1 - z), dy = b[1] - 1 - y;
    if (dx + dz < r) return null;
    if (rt && (dx + dy < rt || dz + dy < rt)) return null;
    if (top && y === b[1] - 1) return hi;
    if (bottom && y === a[1]) return lo;
    return base;
  });
}
/** Octagonal joint disc facing ±x (ear, knee): black rim, dark ring, glowing orange core. x range [x0, x1). */
function disc(x0, x1, cy, cz, R, core = true) {
  return B([x0, Math.floor(cy - R), Math.floor(cz - R)], [x1, Math.ceil(cy + R), Math.ceil(cz + R)], (x, y, z) => {
    const u = Math.abs(y + 0.5 - cy), v = Math.abs(z + 0.5 - cz), d = Math.max(u, v, (u + v) * 0.74);
    if (d > R) return null;
    if (d > R - 1) return C.K;
    if (!core || d > R * 0.55) return C.D;
    return d > R * 0.3 ? C.O : C.Ol;
  });
}
const light = (a, b) => B(a, b, C.O);

// ---------------------------------------------------------------- torso (body voxels FV, centred on the joints)
function torso() {
  const P_ = {};
  // pelvis: black frame, dark grey belt, the ivory buckle with its orange light, ivory side blocks, lumbar plate behind
  P_.hips = [
    B([-10, -11, -8], [10, 6, 8], C.K),
    B([-12, -1, -9], [12, 5, 9], (x, y, z) => (y === 4 ? C.Dl : md(x + z, 5) === 0 && y === 1 ? C.M : C.D)),
    shell([-4, -3, 8], [4, 6, 12], 'I', 1, 1),
    light([-2, 0, 12], [2, 4, 13]), P([-1, 1, 12], [1, 3, 13], C.Ol),
    ...[1, -1].map((sx) => shell(...mx(sx, [7, -2, -6], [13, 6, 8]), 'I', 1, 1)),
    shell([-7, -8, -11], [7, 4, -8], 'I', 1, 1),
    B([-6, -12, -7], [6, -6, 7], C.Kd),
  ];
  // lean abdomen: black core, three dark grey rib plates, ribbed flanks, dark back plates
  P_.spine = [
    // fuller midsection (Ash 2026-10-01: "too skinny in the middle")
    B([-10, -6, -8], [10, 16, 8], C.K),
    shell([-8, -3, 8], [8, 2, 10], 'D', 1), shell([-9, 2, 8], [9, 7, 10], 'D', 1), shell([-9, 7, 8], [9, 12, 10], 'D', 1),
    ...[1, -1].map((sx) => B(...mx(sx, [9, -4, -6], [11, 14, 6]), (x, y) => (md(y, 3) === 0 ? C.K : C.D))),
    shell([-9, -2, -10], [9, 12, -8], 'D', 1),
  ];
  // chest: ivory shell and pectoral plates, the layered navy centre plate (wide on top, narrowing down onto the belly)
  // with an orange chevron, high ivory collar blocks; back plate with navy shoulder-blade panels and the power slot
  P_.chest = [
    B([-12, -4, -9], [12, 18, 9], C.K),
    shell([-14, 6, -10], [14, 17, 10], 'I', 2), shell([-12, -1, -9], [12, 6, 9], 'I', 2),
    ...[1, -1].map((sx) => shell(...mx(sx, [3, 5, 10], [13, 16, 12]), 'I', 1)),
    shell([-8, 6, 11], [8, 17, 14], 'N', 1), shell([-6, 1, 11], [6, 6, 13], 'N', 1), shell([-4, -3, 9], [4, 1, 12], 'N', 1),
    P([-3, 15, 13], [3, 16, 14], C.O), P([-2, 14, 13], [2, 15, 14], C.O), P([-1, 13, 13], [1, 14, 14], C.Ol),
    ...[1, -1].map((sx) => shell(...mx(sx, [4, 15, -7], [11, 21, 7]), 'I', 1, 1)),
    B([-4, 16, -5], [4, 20, 5], C.D),
    shell([-11, 2, -13], [11, 16, -10], 'I', 1),
    ...[1, -1].map((sx) => shell(...mx(sx, [3, 6, -14], [10, 14, -13]), 'N', 0)),
    B([-2, 3, -15], [2, 15, -13], C.K), light([-1, 4, -15], [1, 14, -14]),
    // detail: three vent slits on each flank, rivets on the collar blocks, vent rows either side of the power slot
    ...[1, -1].flatMap((sx) => [8, 10, 12].map((y) => P(...mx(sx, [13, y, -5], [14, y + 1, 5]), C.K))),
    ...[1, -1].map((sx) => P(...mx(sx, [9, 20, 5], [10, 21, 6]), C.M)),
    ...[1, -1].flatMap((sx) => [3, 5].map((y) => P(...mx(sx, [3, y, -14], [10, y + 1, -13]), C.Id))),
  ];
  P_.neck = [B([-4, -2, -4], [4, 7, 4], C.D), P([-4, 1, -4], [4, 2, 4], C.M), P([-4, 4, -4], [4, 5, 4], C.M)];
  return P_;
}

// ---------------------------------------------------------------- limbs
function limbs(P_) {
  for (const [s, sx] of [['R', -1], ['L', 1]]) {
    const m = (a, b) => mx(sx, a, b);
    // upper arm: black frame, dark grey sleeve, ivory elbow cop
    P_['upperArm' + s] = [
      B([-4, -24, -4], [4, 2, 4], C.K),
      B([-5, -13, -5], [5, -4, 5], (x, y) => (md(y, 3) === 0 ? C.K : C.D)),
      shell([-5, -24, -6], [5, -18, 4], 'I', 2, 2),                     // elbow cop ends at the elbow joint and is rounder: no bite into the forearm when it bends
    ];
    // forearm: chunky ivory gauntlet, navy plate on the outside (on top in the T-pose), dark wrist cuff, orange wrist light
    P_['foreArm' + s] = [
      B([-4, -22, -4], [4, -2, 4], C.K),
      shell([-6, -17, -6], [6, -3, 7], 'I', 3, 2),                     // gauntlet starts below the elbow, narrower and more chamfered at the top
      shell(...m([6, -15, -5], [8, -3, 6]), 'N', 1),
      B([-5, -21, -5], [5, -17, 5], (x, y) => (y === -18 ? C.M : C.D)),
      light([-1, -20, 5], [1, -18, 6]),
      P([-7, -10, -7], [7, -9, 8], C.Id),
      P(...m([7, -14, -3], [8, -13, -2]), C.M), P(...m([7, -14, 3], [8, -13, 4]), C.M),
    ];
    // fist around the shaft (hand local Z = along the spear): black glove, dark grey knuckle guard
    P_['hand' + s] = [
      shell([-4, -4, -3], [4, 4, 3], 'K', 1),
      shell([-4, 4, -3], [4, 6, 3], 'D', 1),
      B(...m([4, -2, -2], [5, 3, 2]), C.D),
    ];
    // thigh: black frame, ivory plate above the knee, and the layered skirt plates (tassets) over the front and outside —
    // ivory, navy, ivory tiers stepping out and down, an orange running light on the navy tier; metal piston behind
    P_['thigh' + s] = [
      B([-6, -36, -6], [6, 2, 6], C.K),
      shell([-6, -31, -5], [6, -19, 7], 'I', 2), P([-6, -25, 6], [6, -24, 7], C.Id),
      shell(...m([-4, -7, -8], [11, 3, 10]), 'I', 2, 1),
      shell(...m([-3, -15, -7], [12, -6, 11]), 'I', 2), P(...m([-3, -14, 10], [5, -7, 11]), C.N),
      shell(...m([-1, -22, -6], [13, -14, 10]), 'I', 2), P(...m([12, -21, -5], [13, -15, 9]), C.N),
      light(...m([12, -11, 0], [13, -9, 3])),
      B([-2, -28, -8], [2, -11, -6], C.M),
    ];
    // shin: ivory knee cap with its orange light and navy side plates, ivory greave with a navy front panel, calf
    // piston, ankle light
    P_['shin' + s] = [
      B([-5, -35, -5], [5, 0, 5], C.K),
      shell([-7, -6, 3], [7, 5, 10], 'I', 1, 1), light([-1, -2, 10], [1, 0, 11]),
      shell(...m([6, -6, -4], [8, 4, 6]), 'N', 1),
      shell([-8, -29, -7], [8, -7, 8], 'I', 2),
      shell([-4, -25, 8], [4, -13, 9], 'N', 0),
      P([-6, -27, 7], [-5, -9, 8], C.Id), P([4, -27, 7], [5, -9, 8], C.Id), P([-8, -28, -7], [8, -27, 8], C.Id),
      B([-2, -25, -8], [2, -9, -6], C.M), P([-2, -17, -8], [2, -16, -6], C.D),
      light(...m([6, -31, -1], [8, -29, 2])),
    ];
    // boot: ivory shell with a stepped toe cap, black toe tip and sole, dark ankle joint, heel block
    P_['foot' + s] = [
      B([-5, -2, -5], [5, 5, 5], C.K),
      shell([-8, -6, -8], [8, 1, 11], 'I', 2, 1),
      shell([-7, -6, 11], [7, -1, 17], 'I', 2, 1),
      B([-7, -6, 16], [7, -3, 18], C.K),
      P([-8, -6, -8], [8, -5, 18], C.Kd),
      B([-4, -6, -9], [4, -2, -7], C.D),
      P([-8, -3, -8], [8, -2, 11], C.D), P(...m([7, -3, 2], [8, -2, 4]), C.M),
    ];
  }
  return P_;
}

/** Pauldron (turns halfway with the upper arm): rounded ivory cap over the shoulder and an outer flare, stepped navy
 *  plates on top, an orange running light at the front. Authored for the left side (+x outward). */
function pauldronBoxes(sx) {
  const m = (a, b) => mx(sx, a, b);
  return [
    shell(...m([-6, -1, -9], [10, 8, 9]), 'I', 2, 2),
    shell(...m([3, -11, -10], [13, 3, 10]), 'I', 2, 1),
    shell(...m([-2, 8, -7], [8, 10, 6]), 'N', 1),
    shell(...m([6, 3, -8], [12, 5, 7]), 'N', 1),
    light(...m([9, -5, 10], [11, -3, 11])),
    P(...m([3, -11, -10], [13, -10, 10]), C.Id),
    ...[-6, 0, 6].map((z) => P(...m([12, -1, z], [13, 0, z + 1]), C.M)),
  ];
}

// ---------------------------------------------------------------- head (head voxels HV, chin y 0, centred on x = 0)
function head() {
  const iv = () => C.I;
  const round = (a, b, r, f = iv) => B(a, b, (x, y, z) => {
    const dx = Math.min(x - a[0], b[0] - 1 - x), dz = Math.min(z - a[2], b[2] - 1 - z);
    return dx + dz < r ? null : f(x, y, z);
  });
  return [
    // rounded dome (stacked chamfered slabs), ivory cheek guards
    round([-8, 4, -8], [8, 13, 8], 3), round([-7, 13, -7], [7, 15, 7], 3), round([-5, 15, -5], [5, 16, 5], 2),
    round([-8, 0, -5], [8, 7, 7], 2), round([-9, 6, -6], [9, 10, 5], 2),
    // dark mouth plate with grille slits, black visor frame wrapping the front, the wide orange visor (bright core row)
    B([-3, 0, 6], [3, 5, 8], C.D), ...[1, 3].map((y) => P([-2, y, 7], [2, y + 1, 8], C.K)),
    B([-7, 6, 5], [7, 10, 9], C.K),
    B([-7, 7, 8], [7, 9, 9], (x, y) => (y === 8 && Math.abs(x + 0.5) < 5.5 ? C.Ol : C.O)),
    round([-8, 10, 3], [8, 12, 9], 1),
    // stepped navy crest from the brow over the top to the nape, raised ridge on alternate rows
    B([-2, 10, 7], [2, 13, 9], C.N),
    B([-2, 13, -7], [2, 17, 8], (x, y, z) => (md(z, 2) === 0 ? C.Nd : C.N)),
    B([-1, 17, -5], [1, 18, 6], (x, y, z) => (md(z, 2) === 0 ? C.Nl : null)),
    B([-2, 5, -9], [2, 14, -7], (x, y) => (md(y, 2) === 0 ? C.Nd : C.N)),
    // ear pieces: dark blocks with an orange light at visor height; nape guard
    ...[1, -1].flatMap((sx) => [B(...mx(sx, [9, 6, -2], [10, 10, 2]), C.K), light(...mx(sx, [9, 7, -1], [10, 9, 1]))]),
    round([-7, 1, -9], [7, 6, -6], 1),
    ...[1, -1].flatMap((sx) => [1, 3].map((y) => P(...mx(sx, [7, y, 2], [8, y + 1, 5]), C.D))),
    ...[1, -1].map((sx) => P(...mx(sx, [8, 11, -6], [9, 12, 5]), C.Id)),
  ];
}

// ---------------------------------------------------------------- power lance (weapon joint: shaft +Z, origin = rear grip)
function lanceGeo() {
  const sv = 0.02;
  const shaft = vox([
    B([-1, -1, -36], [1, 1, 74], (x, y, z) => ((z >> 1) & 1 ? C.K : C.D)),
    ...[-28, -12, 12, 34, 56].map((z) => B([-2, -2, z], [2, 2, z + 2], C.I)),
    B([-2, -2, -41], [2, 2, -36], C.I), B([-2, -2, -43], [2, 2, -41], C.O),
  ], sv, { jitter: 0.03, ao: 0.3 });
  // socket at 0.012: metal collar, navy fins, glowing core (z 1.42 … 1.6)
  const cv = 0.012;
  const socket = vox([
    B([-3, -3, 118], [3, 3, 124], C.M), B([-4, -4, 121], [4, 4, 123], C.Ml),
    B([-5, -3, 124], [5, 3, 134], (x, y, z) => (Math.abs(x + 0.5) < 1.5 && Math.abs(y + 0.5) > 1.5 ? C.O : C.N)),
    B([-7, -1, 126], [7, 1, 132], C.Nd),
  ], cv, { jitter: 0.03, ao: 0.3 });
  return [shaft, socket];
}
function bladeGeo() {
  // layered leaf blade, flat in Y: ivory edges, navy fuller, an orange power core up the base third
  const bv = 0.011, z0 = Math.round(1.6 / bv), z1 = Math.round(2.02 / bv), len = z1 - z0, boxes = [];
  for (let z = z0; z < z1; z++) {
    const u = (z - z0) / len;
    const w = Math.max(1, Math.round(8 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.25 + 0.12)), 0.8) * (1 - u * 0.35)));
    boxes.push(B([-w, -2, z], [w, 2, z + 1], (x, y) => {
      const e = Math.abs(x + 0.5), edge = Math.abs(y + 0.5) > 1;
      if (edge && e > w - 2.5) return null;
      if (u < 0.36 && e < 1.5) return u < 0.3 ? C.Ol : C.O;
      if (e < w * 0.5 && w > 2) return edge ? C.N : C.Nd;
      return e >= w - 1 ? C.Il : C.I;
    }));
  }
  return vox(boxes, bv, { jitter: 0.03, ao: 0.2 });
}
function weaponGeo() {
  const [shaft, socket] = lanceGeo();
  return [{ geo: shaft, mat: 'body' }, { geo: socket, mat: 'body' }, { geo: bladeGeo(), mat: 'body' }];
}

// ---------------------------------------------------------------- spring-chain segments: the navy tabard, front and back
function tabardSeg(back) {
  return (i, n) => {
    const last = i === n - 1, w = 8;
    const cross = (x, y) => last && ((Math.abs(x + 0.5) < 1 && y >= -9 && y <= -2) || (Math.abs(x + 0.5) < 3.5 && (y === -5 || y === -6)));
    return vox([
      B([-w, -12, 0], [w, 0, 1], (x, y) => {
        if (last && y <= -11) return C.Nd;
        if (cross(x, y)) return C.G;
        if (x === -w || x === w - 1) return C.Nd;
        return C.N;
      }),
      B([-w + 1, -12, -1], [w - 1, 0, 0], C.Nd),
    ], FV, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.2 });
  };
}

// ---------------------------------------------------------------- HUD portrait (20×20 pixels)
const face = [
  '....................', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....', '...GGGggggggggGGG...', '...GGgTTTTTTTTgGG...', '...GGgTwwwwwwTgGG...',
  '...GGgTwwwwwwTgGG...', '...GGgTTTTTTTTgGG...', '...GGGGGGGGGGGGGG...', '....GGGggggggGGG....', '.....GGGGGGGGGG.....', '......GGGGGGGG......',
  '......GGGGGGGG......', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....', '....GGGGGGGGGGGG....', '....GGGGGGGGGGGG....', '.....GGGGGGGGGG.....', '......GGGGGGGG......', '....................',
];

export const VANGUARD_AUTHORED = {
  id: 'vanguard', zh: 'EXO-01', en: 'VANGUARD', seal: 'PILOT', weapon: 'POWER LANCE', role: 'ARMORED RESPONSE',
  sub: 'BUILT TO HOLD THE LINE', copy: 'HOLD THE<br>LINE', tagline: 'Break the machine assault. Protect the people behind you.',
  cut: { sub: 'VANGUARD OVERDRIVE', seal: 'OVERDRIVE' },
  lines: { open: ['EXO-01 deployed.', 'The evacuation is behind us. Hold the line.'], musou: ['OVERDRIVE', 'Overdrive engaged.'] },
  face, pal: { G: '#f0cfa6', g: '#c8a880', T: '#2b282f', w: '#ff9528' },
  matColor: 0.66, fill: 0.3, rim: 0.6, glow: 0.8,
  // run: an armoured lancer's run — both hands keep the lance at the ready across the body (carry.run), the torso stays
  // upright and half-turned behind it, the pelvis glides (less bounce, lower knee drive than Zhao Yun's DW8 sprint)
  run: { lean: [4, 6], chest: [3, 1], hipsY: [0.88, 0.04], bounce: 0.022, shift: 0.02, twist: 0.18, roll: 2, rock: 3,
    yaw: -14, yawUp: [4, 6], stepH: [0.05, 0.2], kick: 0.1, footX: 0.09 },
  carry: { run: { spear: [-0.24, 1.0, 0.06, 28, 24, 0], gripR: 0, gripL: 0.5, lfree: 0, armL: [0, 0, 0, 0] } },
  build: () => ({ parts: limbs(torso()), head: head(), hv: HV, bv: FV, headOff: [0, 0, 0], pauldrons: pauldronBoxes, weapon: weaponGeo() }),
  chains() {
    const hit = [['thighL', 0.01], ['thighR', 0.01], ['kneeL', 0.02], ['kneeR', 0.02]];
    return [
      { joint: 'hips', anchor: [0, -0.04, 0.145], rest: [0, -1, 0.03], n: 4, len: 0.12, stiff: 0.16, drag: 0.2, wind: 0.35, face: [0, 0, 1],
        cone: 70, sway: 0.08, seg: tabardSeg(false), hit },
      { joint: 'hips', anchor: [0, -0.04, -0.14], rest: [0, -1, -0.04], n: 4, len: 0.12, stiff: 0.15, drag: 0.2, wind: 0.5,
        cone: 75, sway: 0.12, seg: tabardSeg(true), hit: ['hips', ...hit] },
    ];
  },
};
export const VANGUARD_VOXEL = VANGUARD_AUTHORED;
