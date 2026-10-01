// VANGUARD (EXO-01), grown from a reskin of Zhao Yun's suit: the original officer's body, proportions, rig, spear moveset and clips untouched —
// only the surface changes. Silver plate -> ivory plate, teal robe -> navy, brown leather / grey trousers -> dark frame, gems and tassels ->
// orange power lights, the face and hair -> a visored helmet with a navy crest, the robe tail and apron -> navy tabards, the dragon spear -> a
// power lance. Geometry (parts, pauldrons, tassets, greaves, boots, chains) is the original's.
import { vox, B, P, md, mirX, lamellar } from '../hero/model.js';
import { hash01 } from '../core/rng.js';
import { shade } from '../core/voxel.js';
import { FV, glove, bracer, bootFoot, symH } from './parts.js';

const HV = 0.0135;
const C = {
  T: 0x2f5ea8, Td: 0x1f4080, Tl: 0x4a7cc8,                                  // navy (was teal robe)
  S: 0xe4cfa8, Sd: 0xa89468, Sl: 0xf6ead0,                                  // ivory plate (was engraved silver)
  L: 0x55535f, Ld: 0x3c3a46, U: 0x4c4a57, pants: 0x676573, pantsD: 0x4c4a57, // dark frame (was leather / trousers)
  skin: 0x3c3a46, skinD: 0x2a2830, skinH: 0x4e4c58, lip: 0x2a2830, eye: 0x160f12, iris: 0x4a2e22, scl: 0xe8e0d8,
  hair: 0x221a18, hairH: 0x3e302a,
  gem: 0xff9a28, gemL: 0xffd070,                                            // orange power light (was blue gem)
  shaft: 0x2a2c34, shaftH: 0x3c3e48, band: 0xe4cfa8, gold: 0xdcd0b0,
  blue: 0xff9a28, blueH: 0xffd070, blueD: 0xc86a10,
};
// the robe cloth is now the suit's dark under-frame (sleeves, waist, chest sides); `navy` is the clean tabard cloth
const teal = (x, y) => (md(y, 5) === 0 ? C.Ld : C.U);                     // dark frame: clean horizontal panel seams (no speckle)
const navy = (x, y) => (md(y, 6) === 0 ? C.Td : C.T);                     // tabard cloth: clean, faint fold lines
// silver with a symmetric engraved cloud-scroll: thin dark grooves mirrored about the centre line, soft highlights
const silver = (x, y, z) => (md(x * 5 + y * 3 + z * 7, 23) === 0 ? C.Sl : C.S);   // plain plate, a few glints; structure comes from the parts

// ---------------------------------------------------------------- body parts (fine voxels, centred on the joints)
function torso() {
  const P_ = {};
  P_.hips = [
    B([-12, -10, -8], [12, 6, 8], C.U),
    B([-14, -12, -10], [14, -2, 10], teal),
    B([-15, -2, -11], [15, 6, 11], (x, y, z) => (y === -2 || y === 5 ? C.Ld : md(x, 5) === 0 ? C.Ld : C.L)),
    ...[1, -1].map((sx) => P(sx > 0 ? [14, 1, -2] : [-15, 1, -2], sx > 0 ? [15, 3, 2] : [-14, 3, 2], C.gem)),
    B([-4, -2, 11], [4, 6, 13], C.S), B([-3, -1, 13], [3, 5, 14], C.Sl), P([-1, 1, 13], [1, 3, 14], C.gem),   // buckle
  ];
  P_.spine = [
    B([-10, -6, -8], [10, 16, 8], C.U),
    B([-12, -4, -10], [12, 16, 10], teal),
    ...lamellar([-10, -2, 10], [10, 14, 12], { base: C.S, rowH: 4, pw: 40, lipX: false, lipZ: false }),   // belly: stacked ab plates (was staggered scales)
    B([-1, -2, 11], [1, 14, 13], (x, y) => (y === 3 || y === 9 ? C.gem : C.Ld)),
  ];
  // chest: teal robe, a sculpted silver breastplate (two pectoral plates, centre ridge, scroll engraving, blue gem),
  // silver back plate, high teal collar
  P_.chest = [
    B([-13, -4, -10], [13, 18, 10], C.U),
    B([-14, -4, -11], [14, 8, 11], teal), B([-16, 8, -12], [16, 20, 12], teal),
    B([-13, 0, 12], [13, 19, 13], silver),
    // two pectoral plates with bright rims and a dark groove inside the rim, a raised centre ridge
    ...[[-12, -1], [1, 12]].flatMap(([a, b]) => [
      B([a, 6, 13], [b, 18, 15], silver),
      P([a, 17, 14], [b, 18, 15], C.Sl), P([a, 6, 14], [b, 7, 15], C.Sl),
      P([a + 1, 16, 14], [b - 1, 17, 15], C.Sd), P([a + 1, 7, 14], [b - 1, 8, 15], C.Sd),
    ]),
    B([-1, 2, 13], [1, 18, 16], C.Sl),
    // (was a cloud-scroll inlay) a navy chevron on each pectoral, stepping down toward the centre — the suit's mark
    ...[1, -1].flatMap((sx) => [[2, 9], [3, 10], [4, 11], [5, 12], [6, 13], [7, 14], [8, 15], [9, 15], [10, 15]].map(([x, y]) =>
      P(sx > 0 ? [x, y, 14] : [-x - 1, y, 14], sx > 0 ? [x + 1, y + 2, 15] : [-x, y + 2, 15], C.T))),
    // (was the blue gem) the reactor: ivory housing, orange ring, hot core
    B([-3, 9, 16], [3, 15, 17], C.Sl), P([-2, 10, 16], [2, 14, 17], C.gem), P([-1, 11, 16], [1, 13, 17], C.gemL),
    P([-13, 0, 12], [13, 1, 13], C.Sd),
    B([-12, 2, -14], [12, 18, -12], silver),
    // power pack (new): dark housing with ivory side cheeks, navy top plate, twin orange exhaust vents and a status light
    B([-7, 3, -18], [7, 16, -14], (x, y) => (md(y, 3) === 0 ? C.Ld : C.L)),
    B([-9, 4, -17], [-7, 15, -14], silver), B([7, 4, -17], [9, 15, -14], silver),
    B([-7, 16, -17], [7, 18, -13], C.T),
    ...[-5, 2].map((x) => B([x, 5, -19], [x + 3, 12, -18], (xx, y) => (y === 5 || y === 11 ? C.Ld : y >= 8 ? C.gem : C.gemL))),
    P([-1, 14, -18], [1, 15, -17], C.gem),
    B([-8, 16, -8], [8, 23, 8], (x, y) => (md(y, 2) === 0 ? C.Ld : C.L)), P([-8, 22, -8], [8, 23, 8], C.S),   // armoured neck seal (was a high cloth collar)
    P([-8, 18, 7], [-6, 20, 8], C.gem), P([6, 18, 7], [8, 20, 8], C.gem),
    B([-6, 16, -6], [6, 26, 6], -1),
  ];
  P_.neck = [B([-4, -2, -4], [4, 6, 4], C.skinD), P([-4, 2, 3], [4, 6, 4], C.skin)];
  return P_;
}

function limbs(P_) {
  for (const [s, sx] of [['R', -1], ['L', 1]]) {
    P_['upperArm' + s] = [B([-5, -24, -5], [5, 2, 5], teal), B([-6, -24, -6], [6, -20, 6], C.Td),
      P(sx > 0 ? [5, -23, -1] : [-6, -23, -1], sx > 0 ? [6, -21, 1] : [-5, -21, 1], C.gem)];          // elbow bearing light
    P_['foreArm' + s] = [...bracer(C.T, [C.S, C.Sd, C.Sl]), P([-1, -14, 5], [1, -10, 6], C.gem)];       // gauntlet power slot
    P_['hand' + s] = glove(sx, C.L, C.Ld);
    // grey trousers under silver tassets that flare over the front and outside of the thigh
    P_['thigh' + s] = [
      B([-7, -36, -7], [7, 2, 7], (x, y) => (md(y, 6) === 0 ? C.pantsD : C.pants)),
      ...lamellar([-6, -16, -9], [10, 4, 9], { base: C.S, rowH: 5, pw: 40, trim: C.T }).map((b) => mirX(b, sx)),   // stacked hip plates (was scales)
      mirX(P([10, -6, -2], [11, -4, 3], C.gem), sx),                                                     // tasset running light
    ];
    // greave with an arrow motif, diamond knee guard
    P_['shin' + s] = [
      B([-5, -34, -5], [5, 0, 5], C.pantsD),
      B([-6, -32, 0], [6, -5, 7], (x, y) => (Math.abs(x + 0.5) < 1 && y >= -11 && y < -8 ? C.gem : Math.abs(x + 0.5) < 1 + (-5 - y) * 0.12 && y > -22 && y < -8 ? C.T : silver(x, y, 7))),
      B([-6, -34, -6], [6, -31, 6], C.S),
      // (was a diamond knee guard) octagonal knee bearing: ivory rim, navy ring, glowing core
      B([-6, -5, 3], [6, 7, 9], (x, y) => { const u = Math.abs(x + 0.5), v = Math.abs(y - 0.5), d = Math.max(u, v, (u + v) * 0.74);
        return d > 6 ? null : d > 4.8 ? C.Sl : d > 2.4 ? C.T : d > 1.2 ? C.gem : C.gemL; }),
    ];
    P_['foot' + s] = bootFoot(C.Sd, shade(C.Sd, 0.7), C.Ld, { trim: C.S });
  }
  return P_;
}

/** Big swept silver pauldron: three engraved tiers flaring out and down, teal lining, an upturned wing at the top. */
function pauldronBoxes(sx) {
  const b = [
    B([-6, 4, -10], [6, 8, 10], silver),
    B([-2, 0, -12], [9, 5, 12], silver), P([-2, 0, -12], [9, 1, 12], C.Sd),
    B([1, -6, -12], [12, 0, 12], silver), P([1, -6, -12], [12, -5, 12], C.T), P([11, -6, -12], [12, 0, 12], C.Sl),
    P([-6, 7, -10], [6, 8, 10], C.T),                                                                // navy cap on the top tier
    B([5, 6, -9], [9, 10, 9], C.S), B([8, 9, -8], [11, 13, 8], C.Sl), B([10, 12, -6], [12, 14, 6], C.S),   // swept fin
    P([11, 12, -6], [12, 14, 6], C.T), P([11, 12, -1], [12, 14, 1], C.gem),                          // fin edge: navy strip, light
  ];
  return b.map((bx) => mirX(bx, sx));
}

// ---------------------------------------------------------------- head (head voxels, chin y 0)
function head() {
  const iv = (x, y, z) => (md(x * 3 + y * 5 + z * 7, 23) === 0 ? C.Sl : C.S);
  const round = (a, b, r, f = iv) => B(a, b, (x, y, z) => {
    const dx = Math.min(x - a[0], b[0] - 1 - x), dz = Math.min(z - a[2], b[2] - 1 - z);
    return dx + dz < r ? null : f(x, y, z);
  });
  const disc = (x0, x1) => B([x0, 3, -4], [x1, 11, 4], (x, y, z) => {                // octagonal ear disc, glowing core
    const u = Math.abs(y - 7 + 0.5), v = Math.abs(z + 0.5), d = Math.max(u, v, (u + v) * 0.74);
    return d > 4 ? null : d > 3 ? C.Ld : d > 1.8 ? C.L : C.gem;
  });
  return [
    round([-7, 3, -7], [8, 14, 7], 3), round([-6, 14, -6], [7, 17, 5], 3),         // rounded dome
    round([-6, -1, -4], [7, 5, 7], 2),                                              // jaw guard
    B([-5, -1, 6], [6, 6, 8], C.U),                                                 // dark lower face
    B([-6, 5, 5], [7, 10, 9], C.Ld), B([-5, 6, 8], [6, 9, 10], C.gem), B([-4, 7, 9], [5, 8, 10], C.gemL),   // visor recess + glowing visor
    round([-7, 10, 4], [8, 12, 9], 1),                                              // brow
    B([-2, 14, -6], [3, 18, 7], C.T), B([-1, 17, -5], [2, 19, 6], C.Tl),            // navy crest
    disc(8, 10), disc(-9, -7),
  ];
}

// ---------------------------------------------------------------- spear (weapon joint: shaft +Z, origin = rear grip)
function spearGeo() {
  // shaft + butt at 0.02: banded dark iron, butt spike (z −0.72 … 1.5)
  const sv = 0.02;
  const shaft = vox([
    B([-1, -1, -36], [1, 1, 75], (x, y, z) => (((z + 36) % 15) === 0 ? C.band : ((z >> 1) & 1) ? C.shaftH : C.shaft)),
    ...Array.from({ length: 7 }, (_, i) => B([-2, -2, -33 + i * 15], [2, 2, -32 + i * 15], C.band)),
    B([-2, -2, -38], [2, 2, -35], C.S),
    B([-1, -1, -41], [1, 1, -38], C.S),
  ], sv, { jitter: 0.04, ao: 0.3 });
  // energy collar at 0.012 (z 1.4 … 1.62; was the gold dragon head): ivory rings, navy fins, glowing cells, a hot ring under the blade
  const cv = 0.012;
  const collar = vox([
    B([-3, -3, 116], [3, 3, 135], C.S),
    B([-4, -4, 118], [4, 4, 120], C.Sl), B([-4, -4, 131], [4, 4, 133], C.Sl),
    B([-3, -3, 121], [3, 3, 130], (x, y, z) => (Math.abs(x + 0.5) < 2 && Math.abs(y + 0.5) < 2 ? C.gemL : md(z, 3) === 0 ? C.Ld : C.gem)),
    B([-7, -1, 122], [7, 1, 131], (x) => (Math.abs(x + 0.5) < 3.5 ? null : C.T)),
    B([-1, -7, 123], [1, 7, 130], (x, y) => (Math.abs(y + 0.5) < 3.5 ? null : C.Td)),
    B([-3, -3, 133], [3, 3, 135], C.gem),
  ], cv, { jitter: 0.05, ao: 0.35 });
  return [shaft, collar];
}

function bladeGeo() {
  // long leaf blade, flat in Y: widest a third of the way up, darker fuller down the middle, bright edges
  const bv = 0.011, z0 = Math.round(1.6 / bv), z1 = Math.round(2.0 / bv), len = z1 - z0;
  const boxes = [];
  for (let z = z0; z < z1; z++) {
    const u = (z - z0) / len;
    const w = Math.max(1, Math.round(7 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.3 + 0.1)), 0.75) * (1 - u * 0.3)));
    boxes.push(B([-w, -1, z], [w, 1, z + 1], (x) => (Math.abs(x + 0.5) < 1 ? 0x8f9aa8 : Math.abs(x + 0.5) >= w - 1 ? 0xf6fbff : 0xd8e2ec)));
  }
  return vox(boxes, bv, { jitter: 0.03, ao: 0.2 });
}

function weaponGeo() {
  const [shaft, collar] = spearGeo();
  return [{ geo: shaft, mat: 'body' }, { geo: collar, mat: 'body' }, { geo: bladeGeo(), mat: 'blade' }];
}

// ---------------------------------------------------------------- spring-chain segments (local -Y along the chain)
function hairSeg(i, n) {
  const w = Math.max(2, Math.round(5 - (i * 3) / (n - 1))), tip = i === n - 1;
  return vox([B([-w, tip ? -8 : -6, -w], [w, 0, w], (x, y, z) => {
    const edge = x === -w || x === w - 1 || z === -w || z === w - 1;
    if (edge && hash01(x + i * 11, y + 50, z) < 0.3) return null;
    if (tip && y < -4 && hash01(x, z, i) < 0.5 + (-4 - y) * 0.12) return null;
    return md(x * 2 + z + 40, 5) === 0 ? C.hairH : C.hair;
  })], FV, { jitter: 0.06, ao: 0.3 });
}
function tieSeg(i, n) {
  const tip = i === n - 1;
  return vox([B([-2, -8, 0], [2, 0, 1], (x, y) => (tip && y <= -7 && (x === -1 || x === 0) ? null : x === -2 ? C.Sd : C.S))],
    0.011, { off: [0, 0, -0.5], jitter: 0.03, ao: 0.15 });
}
/** Torn teal robe tail: embroidered face, darker lining, ragged hem that tears deeper toward the end. */
function tailSeg(i, n) {
  const w = Math.round(10 + i * 0.5), last = i === n - 1;
  return vox([
    B([-w, -12, 0], [w, 0, 1], (x, y) => (last && y < -10 ? C.Sl : x <= -w + 1 || x >= w - 2 ? C.Td : navy(x, y + i * 12, 2))),
    B([-w + 1, -12, -1], [w - 1, 0, 0], C.Td),
  ], FV, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.18 });
}
function apronSeg(i, n) {
  const last = i === n - 1;
  return vox([B([-9, -12, 0], [9, 0, 1], (x, y) => (last && y <= -10 ? C.Sl : x <= -8 || x >= 7 ? C.Td : (i === 0 && y >= -5 && x >= -2 && x < 2 ? C.gem : navy(x, y + i * 12, 4)))),
    B([-8, -12, -1], [8, 0, 0], C.Td)], FV, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.2 });
}
function tasselSeg(i, n) {
  // silk strands: every (x,z) column is one strand with its own shade; the last segment frays to uneven lengths
  const w = i === 0 ? 3 : 2, last = i === n - 1;
  return vox([B([-w, -7, -w], [w, 0, w], (x, y, z) => {
    const h = hash01(x + 9, z + 9, 7);
    if (last && -y > 3 + h * 5) return null;
    if ((x === -w || x === w - 1) && (z === -w || z === w - 1) && i > 0) return null;
    return last && -y > 3 + h * 3 ? C.blueD : h < 0.3 ? C.blueH : h > 0.8 ? C.blueD : C.blue;
  })], 0.014, { jitter: 0.06, ao: 0.25 });
}




// ---------------------------------------------------------------- HUD portrait (20×20 pixels)
const FACE = [
  '....................', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....', '...GGGggggggggGGG...', '...GGgTTTTTTTTgGG...', '...GGgTwwwwwwTgGG...',
  '...GGgTwwwwwwTgGG...', '...GGgTTTTTTTTgGG...', '...GGGGGGGGGGGGGG...', '....GGGggggggGGG....', '.....GGGGGGGGGG.....', '......GGGGGGGG......',
  '......GGGGGGGG......', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....', '....GGGGGGGGGGGG....', '....GGGGGGGGGGGG....', '.....GGGGGGGGGG.....', '......GGGGGGGG......', '....................',
];
const PAL = { G: '#e4cfa8', g: '#a89468', T: '#2c2a33', w: '#ff9a28' };

export const VANGUARD_RESKIN = {
  id: 'vanguard', zh: 'EXO-01', en: 'VANGUARD', seal: 'PILOT', weapon: 'POWER LANCE', role: 'ARMORED RESPONSE',
  sub: 'BUILT TO HOLD THE LINE', copy: 'HOLD THE<br>LINE', tagline: 'Break the machine assault. Protect the people behind you.',
  cut: { sub: 'VANGUARD OVERDRIVE', seal: 'OVERDRIVE' },
  lines: { open: ['EXO-01 deployed.', 'The evacuation is behind us. Hold the line.'], musou: ['OVERDRIVE', 'Overdrive engaged.'] },
  face: FACE, pal: PAL, glow: 0.8, matColor: 0.9, fill: 0.3, rim: 0.4,
  build: () => ({ parts: limbs(torso()), head: head(), hv: HV, bv: FV, pauldrons: pauldronBoxes, weapon: weaponGeo() }),
  chains() {
    const out = [];
    out.push({ joint: 'hips', anchor: [0, -0.1, -0.15], rest: [0, -1, -0.14], n: 4, len: 0.13, stiff: 0.2, drag: 0.2, wind: 0.5, cone: 70, sway: 0.1,
      seg: tailSeg, hit: ['hips', ['thighL', 0.02], ['thighR', 0.02], ['kneeL', 0.03], ['kneeR', 0.03]] });
    out.push({ joint: 'hips', anchor: [0, -0.12, 0.17], rest: [0, -1, 0.1], n: 3, len: 0.13, stiff: 0.13, drag: 0.18, wind: 0.5, face: [0, 0, 1], cone: 70, sway: 0.1,
      seg: apronSeg, hit: [['thighL', 0.03], ['thighR', 0.03], ['kneeL', 0.03], ['kneeR', 0.03]] });
    return out;
  },
};
