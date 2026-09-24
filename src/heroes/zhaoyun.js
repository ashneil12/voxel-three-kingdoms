// 趙雲 Zhao Yun (concept: bench/concept.png): white-silver lamellar armour in overlapping plate rows (dark seams) over a
// gunmetal underlayer, a white scale mantle, flared three-tier pauldrons, teal trim, headband with a silver plate, dark
// banded spear with a gold dragon collar. Ponytail, ribbons, cape, front apron and the blue tassel are spring chains.
import { vox, V, HV, B, P, md, mirX, lamellar } from '../hero/model.js';
import { hash01 } from '../core/rng.js';
import { shade } from '../core/voxel.js';

const C = {
  W: 0xdcdee2, W2: 0xb4b9c2, Wh: 0xeeefee, S: 0xa6aeba, Sd: 0x6a717e,                      // white-silver armour, silver
  G: 0x3a3a44, Gd: 0x2a2a32, Gm: 0x50525e, Gl: 0x8a8e9a,                                   // gunmetal underlayer, dark scale
  T: 0x1f9c95, Td: 0x136b68, Tl: 0x3fc4b8,                                                   // teal
  gold: 0xd4a84c, leather: 0x6b4a33, glove: 0x3b2c27, sole: 0x2a2226,
  skin: 0xf1caa9, skinD: 0xd8a488, lip: 0xcc8c78, eye: 0x17121a, iris: 0x3b2a2c, scl: 0xd4ccc6,
  hair: 0x16131a, hairH: 0x363245, hairT: 0x241f2a,
  shaft: 0x1d1e26, shaftH: 0x30323e, band: 0x6b707c,
  blue: 0x2a78e0, blueH: 0x78c8ff, blueD: 0x1c4aa8, ribbon: 0x8ccbe8, ribbonD: 0x5c9ccc,
  cape: 0xebe6dc, capeD: 0xd6d0c4, emb: 0x2f5fa6,
};


// ---------------------------------------------------------------- body parts
function torso() {
  const P_ = {};
  // hips (pelvis, narrow): gunmetal core, teal sash + leather belt with the gold buckle, white faulds at the back
  P_.hips = [
    B([-6, -5, -4], [6, 3, 4], C.G),
    B([-7, -1, -5], [7, 2, 5], (x, y) => (md(x + y, 4) === 0 ? C.Td : C.T)),
    B([-7, 2, -5], [7, 3, 5], C.leather),
    B([-1, 0, 5], [1, 3, 6], C.gold),
    B([5, -4, -2], [8, 1, 2], C.T),                                  // sash knot on the left hip
    ...lamellar([-6, -6, -6], [6, -1, -5], { rowH: 2, lipX: false, trim: C.T, jag: true }),   // back fauld (front: apron chain)
  ];
  // waist (narrow): gunmetal with grey-white belly lamellar and a teal band under the breastplate
  P_.spine = [
    B([-5, -3, -4], [5, 8, 4], C.G),
    ...lamellar([-5, -1, -4], [5, 6, 4], { base: C.W2, rowH: 2 }),
    B([-6, 6, -5], [6, 8, 5], C.T),
  ];
  // chest (V taper, broad at the top): white lamellar cuirass, white scale mantle round the neck and shoulders (teal
  // lining, V opening), silver heart-mirror with a teal gem
  P_.chest = [
    B([-7, -2, -5], [7, 9, 5], C.G),
    ...lamellar([-6, -1, -5], [6, 3, 5], { base: C.W2, rowH: 2 }),
    ...lamellar([-7, 3, -5], [7, 8, 5], { base: C.W, rowH: 3, pw: 3 }),
    B([-1, -1, 6], [1, 5, 7], C.T),                                  // teal centre strip under the mirror
    B([-2, 2, 6], [2, 6, 8], C.S),
    B([-1, 3, 8], [1, 5, 9], C.Tl),
    B([-2, 2, 7], [2, 3, 8], C.Sd, true),
    // mantle: shaggy scale tiers, widest at the bottom, reaching over the shoulders
    ...lamellar([-9, 6, -6], [9, 11, 6], { base: C.Wh, rowH: 2, pw: 3, jag: true }),
    B([-4, 8, -4], [4, 12, 4], C.T),                                 // teal inner collar
    B([-3, 8, -3], [3, 13, 3], -1),                                  // neck hole
    B([-2, 6, 3], [2, 12, 8], -1),                                   // V opening at the throat
    B([-2, 5, 3], [2, 10, 5], C.T),
    B([-1, 5, 4], [1, 8, 6], C.S),                                   // collar clasp
  ];
  P_.neck = [B([-2, -1, -2], [2, 3, 2], C.skinD)];
  return P_;
}

function limbs(P_) {
  for (const [s, sx] of [['R', -1], ['L', 1]]) {
    // upper arm: gunmetal sleeve under small white lamellar with a teal hem (pauldron is separate)
    P_['upperArm' + s] = [
      B([-2, -12, -2], [2, 1, 2], C.G),
      ...lamellar([-2, -11, -2], [2, -5, 2], { rowH: 2, pw: 3, trim: C.T }),
    ];
    // forearm: banded white vambrace (plate rows with dark gaps), dark wrist band, teal line, silver elbow cop
    P_['foreArm' + s] = [
      B([-2, -11, -2], [3, 0, 3], C.Gd),
      ...lamellar([-2, -9, -2], [3, -2, 3], { rowH: 2, trim: C.S }),
      P([-3, -3, -3], [4, -2, 4], C.T),
      B([-2, -1, -3], [3, 1, 3], C.S),
    ];
    P_['hand' + s] = [B([-2, -2, -2], [2, 2, 2], C.glove), B([-2, 1, -2], [2, 2, 2], C.Gd)];
    // thigh: gunmetal trousers, flared scale tasset on the outside/front/back (rotates with the leg)
    P_['thigh' + s] = [
      B([-3, -18, -3], [4, 1, 4], (x, y) => (y % 5 === 0 ? C.Gd : C.G)),
      ...lamellar([-2, -9, -4], [5, 2, 5], { rowH: 2, trim: C.T, jag: true }).map((b) => mirX(b, sx, 1)),
    ];
    // shin: plated greave over the front/sides with a silver ridge and knee cop, teal band, gunmetal calf
    P_['shin' + s] = [
      B([-2, -17, -2], [3, 0, 3], C.G),                               // slim calf, gunmetal wrap
      ...lamellar([-2, -15, -1], [3, -3, 4], { rowH: 3, pw: 4 }),     // greave plates
      B([0, -14, 4], [1, -3, 5], C.S),                                // centre ridge
      B([-3, -17, -3], [4, -15, 4], (x, y) => (y === -17 ? C.T : C.S)),            // greave cuff over the boot
      B([-2, -3, 0], [3, 2, 5], C.S),                                 // knee cop
      B([0, -2, 5], [1, 0, 6], C.T),
    ];
    // foot: armoured white boot, silver toe cap, dark sole, teal ankle band
    P_['foot' + s] = [
      B([-3, -3, -2], [3, 1, 6], (x, y) => (y === -1 ? C.W2 : C.W)),
      B([-3, -3, 4], [3, -1, 7], C.S),
      P([-3, -3, -2], [3, -2, 7], C.sole),
      B([-3, 0, -3], [3, 1, 3], C.T),
    ];
  }
  return P_;
}

/** Big flared three-tier scale pauldron + upturned wing, chest-aligned, u = outward (voxels). */
function pauldronBoxes(sx) {
  const b = [
    ...lamellar([-4, 2, -4], [2, 5, 4], { base: C.W, rowH: 3 }),
    ...lamellar([-2, -1, -5], [3, 2, 5], { base: C.W, rowH: 3 }),
    ...lamellar([-1, -4, -5], [4, -1, 5], { base: C.W, rowH: 3, trim: C.T, jag: true }),
    B([2, 4, -3], [4, 6, 3], C.Wh),                                  // upturned outer wing, silver rim
    B([3, 6, -3], [5, 7, 3], C.S),
  ];
  return b.map((bx) => mirX(bx, sx));
}

function head() {
  // head: 9-voxel face (x −4..5 with off −0.5 → centred), chin y 0, hair top y 13 (hd ≈ 0.26 m at 0.02)
  const bangs = { '-4': 8, '-3': 9, '-2': 8, '-1': 9, 0: 7, 1: 9, 2: 8, 3: 9, 4: 8 };
  const hairPaint = (x, y, z) => (md(x * 3 + z, 5) === 0 ? C.hairH : md(x + y * 2, 7) === 0 ? C.hairT : C.hair);
  return [
    B([-3, 0, -2], [4, 2, 5], C.skin),                               // jaw
    B([-4, 2, -4], [5, 10, 5], C.skin),                              // skull / face
    B([-5, 5, -1], [6, 8, 1], C.skinD),                              // ears
    B([-5, 8, -6], [6, 13, 6], hairPaint),                           // hair cap
    B([-4, 13, -5], [5, 14, 4], hairPaint),
    B([-5, 2, -6], [6, 13, -2], hairPaint),                          // back hair
    B([-5, 3, -2], [-3, 12, 4], hairPaint), B([4, 3, -2], [6, 12, 4], hairPaint),   // sideburns
    B([-5, 0, 1], [-4, 6, 4], (x, y, z) => (y === 0 && z % 2 ? null : C.hair)),       // front locks
    B([5, 0, 1], [6, 6, 4], (x, y, z) => (y === 0 && z % 2 ? null : C.hair)),
    B([-4, 7, 5], [5, 12, 6], (x, y) => (y >= bangs[x] ? hairPaint(x, y, 5) : null)),   // spiky fringe
    B([-2, 12, 5], [3, 14, 7], C.hair), B([-3, 14, -2], [0, 15, 2], C.hair), B([2, 14, -4], [4, 15, 0], C.hair),
    // headband (dark teal) with a silver plate and gold gem
    B([-6, 9, -7], [7, 10, 7], C.Td),
    B([-1, 8, 6], [2, 11, 7], C.S),
    B([0, 9, 7], [1, 10, 8], C.gold),
    // silver guan on the crown (holds the ponytail) with a teal gem
    B([-1, 12, -5], [2, 16, -1], C.S),
    B([0, 14, -1], [1, 15, 0], C.Tl),
    // face: eyes with a catch-light, slanted brows, nose, mouth, cheek shade
    // eyes 3×2: lash line over sclera | iris | sclera; brows one row above with a skin gap
    P([-3, 5, 4], [0, 6, 5], C.eye), P([1, 5, 4], [4, 6, 5], C.eye),
    P([-3, 4, 4], [0, 5, 5], C.scl), P([1, 4, 4], [4, 5, 5], C.scl),
    P([-2, 4, 4], [-1, 5, 5], C.iris), P([2, 4, 4], [3, 5, 5], C.iris),
    P([-3, 7, 4], [0, 8, 5], C.hair), P([1, 7, 4], [4, 8, 5], C.hair),
    B([0, 3, 5], [1, 4, 6], C.skin), P([0, 2, 4], [1, 3, 5], C.skinD),
    P([-1, 1, 4], [2, 2, 5], C.lip),
    P([-4, 1, 3], [-3, 4, 5], C.skinD), P([4, 1, 3], [5, 4, 5], C.skinD),
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
  // gold dragon-head collar at 0.012 (z 1.44 … 1.62): ring, head, jaws, swept-back horns, teal eyes, whiskers
  const cv = 0.012;
  const collar = vox([
    B([-3, -3, 120], [3, 3, 123], C.gold),
    B([-4, -3, 123], [4, 4, 130], (x, y, z) => ((z + y) % 3 === 0 ? shade(C.gold, 0.8) : C.gold)),
    B([-3, 1, 130], [3, 4, 135], C.gold),                            // upper jaw
    B([-3, -3, 130], [3, -1, 133], shade(C.gold, 0.85)),             // lower jaw
    B([-3, 4, 121], [-1, 6, 126], C.gold), B([1, 4, 121], [3, 6, 126], C.gold),
    B([-3, 5, 117], [-1, 7, 121], shade(C.gold, 0.9)), B([1, 5, 117], [3, 7, 121], shade(C.gold, 0.9)),
    B([-5, 1, 127], [-4, 3, 129], C.Tl), B([4, 1, 127], [5, 3, 129], C.Tl),
    B([-6, 0, 131], [-3, 1, 132], C.gold), B([3, 0, 131], [6, 1, 132], C.gold),
    // bushy blue tassel root ring under the collar
    B([-4, -4, 116], [4, 4, 120], (x, y, z) => (hash01(x, y, z) < 0.25 ? null : hash01(y, z, x) < 0.3 ? C.blueH : C.blue)),
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

// ---------------------------------------------------------------- segment voxel slabs (local -Y along the chain)
const EMBLEM = [                     // blue dragon-swirl roundel on the cape
  '..XXX..',
  '.XX..X.',
  'X...X.X',
  'X.XXX.X',
  'X.X...X',
  '.X..XX.',
  '..XXX..',
];

function hairSeg(i, n) {
  const w = Math.max(1, Math.round(4 - (i * 3) / (n - 1)));
  const tip = i === n - 1;
  return vox([B([-w, tip ? -6 : -4, -w], [w, 0, w], (x, y, z) => {
    const edge = x === -w || x === w - 1 || z === -w || z === w - 1;
    if (edge && hash01(x + i * 11, y + 50, z) < 0.3) return null;
    if (tip && y < -3 && hash01(x, z, i) < 0.5 + (-3 - y) * 0.15) return null;
    return (x * 2 + z + 40) % 5 === 0 ? C.hairH : (x + z + 40) % 3 === 0 ? C.hairT : C.hair;
  })], HV, { jitter: 0.06, ao: 0.3 });
}

function ribbonSeg(i, n) {
  const tip = i === n - 1;
  return vox([B([-2, -8, 0], [2, 0, 1], (x, y) => (tip && y <= -7 && (x === -1 || x === 0) ? null : x === -2 ? C.ribbonD : C.ribbon))],
    0.012, { off: [0, 0, -0.5], jitter: 0.03, ao: 0.15 });
}

function capeSeg(i, n) {
  const w = Math.round(6 + (i * 2.5) / (n - 1));                  // half-width in voxels: 0.3 m → 0.42 m wide
  const last = i === n - 1;
  const paint = (x, y) => {
    if (last && y === -7 && hash01(x, i, 3) < 0.45) return null;  // ragged hem
    if (last && (y === -5 || y === -4)) return y === -5 ? C.T : C.Td;
    if (i === 1) {
      const row = EMBLEM[-1 - y], ch = row && row[x + 3];
      if (ch === 'X') return C.emb;
    }
    return x === -w || x === w - 1 ? C.capeD : C.cape;
  };
  // 1-voxel cloth whose side edges curl toward the body (a shallow U, not a flat board), with pleats standing out
  // on the back every 5th column (AO shades the folds)
  const curl = (x) => x === -w || x === w - 1 || (i >= 3 && (x === -w + 1 || x === w - 2));
  return vox([
    B([-w, -7, 0], [w, 0, 1], (x, y) => (curl(x) ? null : paint(x, y))),
    B([-w, -7, -1], [w, 0, 0], (x, y) => (curl(x) ? paint(x, y) : null)),
    B([-w, -7, 1], [w, 0, 2], (x, y) => ((x + 40) % 5 === 0 && !curl(x) && !(i === 1 && Math.abs(x) < 4) ? paint(x, y) : null)),
  ],
    0.025, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.18 });
}

function apronSeg(i, n) {
  const last = i === n - 1;
  return vox([B([-3, -5, 0], [3, 0, 1], (x, y) => (last && y === -5 ? (x % 2 ? null : C.S) : last && y === -4 ? C.Wh : x === -3 || x === 2 ? C.Td : C.T))],
    0.025, { off: [0, 0, -0.5], jitter: 0.05, ao: 0.2 });
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


function weaponGeo() {
  const [shaft, collar] = spearGeo();
  return [{ geo: shaft, mat: 'body' }, { geo: collar, mat: 'metal' }, { geo: bladeGeo(), mat: 'blade' }];
}

// ---------------------------------------------------------------- HUD portrait (20×20 pixels, voxel look)
const FACE = [
  '....................',
  '.......KKKKK........',
  '.....KKKKKKKKK......',
  '....KKKKKKKKKKKK....',
  '...KKKkkKKKKKKKKK...',
  '...KKKKKKKKKKKKKKKK.',
  '...KTTTTTTTTTTTTKKTt',
  '...KKKKKKKKKKKKKKKtT',
  '...KKKSKKKKKSKKKKKKt',
  '...KKSSSSSSSSSSKKKKK',
  '...KKEESSSSSSEEKKKK.',
  '...KKSwESSSSwESKKKK.',
  '...KKSSSSSsSSSSKKK..',
  '....KSSSSSsSSSSKKK..',
  '....KsSSSSSSSSsKK...',
  '.....sSSSMMSSSsKK...',
  '......ssSSSSssKK....',
  '...WWTtssssssTtWW...',
  '.WWWWWWTWWWWTWWWWW..',
  'WWwwWWWWTWWTWWWWwwW.',
];
const PAL = { K: '#1d1514', k: '#4a3834', S: '#efc3a0', s: '#c38a6c', E: '#140c0c', M: '#7e3a2e', T: '#3fb8b0', t: '#1f5f5c', W: '#efe8de', w: '#ffffff' };

export default {
  id: 'zhaoyun', zh: '趙雲', en: 'ZHAO YUN', seal: '常山', weapon: '龍膽亮銀槍',
  sub: '常山龍膽 · 單騎無雙 · 義貫雲天', copy: '長槍所向<br>百軍皆破', tagline: '一杆長槍，獨闖魏軍三百',
  cut: { sub: '常山 趙子龍', seal: '龍膽' },
  lines: {
    open: ['主公之子在此，趙雲誓死護之！', 'My lord\'s son is in my care. None of you shall pass!'],
    musou: ['吾乃常山趙子龍也！', 'I am Zhao Zilong of Changshan!'],
  },
  face: FACE, pal: PAL,
  build: () => ({ parts: limbs(torso()), head: head(), pauldrons: pauldronBoxes, weapon: weaponGeo() }),
  chains() {
    const out = [];
    // heaviest → lightest
    out.push({ joint: 'chest', anchor: [0, 0.255, -0.16], rest: [0, -1, 0.15], n: 6, len: 0.17, stiff: 0.16, drag: 0.22, wind: 1.1, cone: 80, sway: 0.2,
      seg: capeSeg, hit: ['chest', 'hips', 'thighL', 'thighR', 'kneeL', 'kneeR'] });
    out.push({ joint: 'hips', anchor: [0, -0.02, 0.19], rest: [0, -1, 0.12], n: 3, len: 0.12, stiff: 0.12, drag: 0.14, wind: 0.4, face: [0, 0, 1], cone: 70, sway: 0.08,
      seg: apronSeg, hit: [['thighL', 0.02], ['thighR', 0.02], ['kneeL', 0.02], ['kneeR', 0.02]] });
    out.push({ joint: 'head', anchor: [0, 14 * HV, -5 * HV], rest: [0, -0.92, -0.4], n: 8, len: 0.07, stiff: 0.09, drag: 0.13, wind: 1.6, cone: 115, sway: 0.4,
      seg: hairSeg, hit: ['head', ['chest', 0.035], ['hips', 0.03]] });
    for (const sx of [-1, 1]) {
      out.push({ joint: 'head', anchor: [sx * 2.5 * HV, 10.5 * HV, -6.8 * HV], rest: [sx * 0.35, -0.5, -1], n: 5, len: 0.09, stiff: 0.03, drag: 0.06, wind: 2.4, cone: 105, sway: 0.6,
        seg: ribbonSeg, hit: ['head', ['chest', 0.02]] });
    }
    // blue tassel: three bushy strands hanging from under the dragon collar
    for (let k = 0; k < 5; k++) {
      const a = k * 1.2566, ox = Math.cos(a) * 0.016, oy = Math.sin(a) * 0.016;
      out.push({ joint: 'weapon', anchor: [ox, oy, 1.43], rest: [ox * 12, oy * 4 - 1, -0.35], n: 3, len: 0.064, stiff: 0.05 + k * 0.004, drag: 0.12, wind: 0.8, cone: 130, sway: 0.15,
        face: [1, 0, 0], seg: tasselSeg });
    }

    return out;
  },
};
