// 關羽 Guan Yu: green war robe (綠袍) over bronze-gold lamellar — the robe shows a V of armour and a gold heart mirror
// at the front, lion-head pauldrons (吞肩獸), a face "like a ripe jujube" (面如重棗) with sleeping-silkworm brows and
// phoenix eyes, a green kerchief with trailing ties, and the long beard (美髯) as a heavy spring chain that lies on the
// robe. Weapon: the Green Dragon Crescent Blade (青龍偃月刀) — dark lacquered shaft with gold bands, a gold dragon
// mouth swallowing a broad crescent blade with a back spike, red tassel.
import { vox, HV, B, P, md, mirX, lamellar } from '../hero/model.js';
import { hash01 } from '../core/rng.js';
import { shade } from '../core/voxel.js';

const C = {
  R: 0x2f7a3e, Rd: 0x1f5a2c, Rl: 0x4a9a55, Rs: 0x17442a,                   // green robe (base, fold, light, deep)
  A: 0xb8914c, Ad: 0x7a5a2c, Al: 0xd9b56a,                                  // bronze-gold armour
  U: 0x3a2e26, Ud: 0x2a211c,                                                // dark underlayer
  gold: 0xe0b24a, goldD: 0x9c7428, leather: 0x4a3024, glove: 0x2e221d, sole: 0x1e1814, boot: 0x2a2320,
  skin: 0xb5503a, skinD: 0x8c3a2a, lip: 0x7a2a20, eye: 0x120c0e, scl: 0xd8c8b8, brow: 0x0e0a0c,
  beard: 0x141014, beardH: 0x2c2530, beardT: 0x1e1820,
  shaft: 0x3a1c16, shaftH: 0x52281e, band: 0xd0a040,
  red: 0xc82a1e, redH: 0xf05a3a, redD: 0x8a1812,
  steel: 0xd8e2ec, edge: 0xf6fbff, fuller: 0x8f9aa8, jade: 0x3fc48a,
};

// ---------------------------------------------------------------- body parts
const beardPaint = (x, y, z) => (md(x * 3 + z + y, 5) === 0 ? C.beardH : md(x + y * 2, 4) === 0 ? C.beardT : C.beard);
const robe = (x, y, z) => (md(x * 2 + y, 7) === 0 ? C.Rd : md(x + z * 3, 11) === 0 ? C.Rl : C.R);
function torso() {
  const P_ = {};
  P_.hips = [
    B([-6, -5, -4], [6, 3, 4], C.U),
    B([-7, -6, -5], [7, 2, 5], robe),                                // robe skirt top
    B([-7, 1, -5], [7, 3, 5], C.leather),                            // belt
    B([-2, 0, 5], [2, 3, 6], C.gold), B([-1, 1, 6], [1, 2, 7], C.goldD),   // tiger buckle
    B([5, -4, -2], [8, 1, 2], C.Rd),                                 // sash knot
  ];
  P_.spine = [
    B([-5, -3, -4], [5, 8, 4], C.U),
    B([-6, -2, -5], [6, 8, 5], robe),
    B([-6, 5, -5], [6, 7, 5], C.gold),                               // gold waist band under the cuirass
    ...lamellar([-3, -1, 5], [3, 5, 6], { base: C.A, rowH: 2, lipX: false, lipZ: false }),   // armour showing at the belly
  ];
  // chest: robe over the cuirass; the front opens in a V (collar edges gold) showing bronze lamellar and the mirror
  const vHalf = (y) => 1.5 + (y + 2) * 0.42;
  P_.chest = [
    B([-7, -2, -5], [7, 9, 5], C.U),
    B([-8, -2, -6], [8, 10, 6], robe),
    ...lamellar([-6, -2, 5], [6, 10, 7], { base: C.A, rowH: 2, pw: 3, lipX: false, lipZ: false })
      .map((b) => ({ ...b, c: typeof b.c === 'function' ? ((c) => (x, y, z) => (Math.abs(x + 0.5) < vHalf(y) ? c(x, y, z) : null))(b.c) : b.c })),
    B([-7, -2, 6], [7, 10, 7], (x, y) => (Math.abs(Math.abs(x + 0.5) - vHalf(y)) < 1 ? C.gold : null)),   // collar edge
    // the long beard (美髯) lies on the chest over the armour, tapering from the chin; the tip is a spring chain
    B([-4, -1, 7], [5, 10, 9], (x, y, z) => (Math.abs(x + 0.5) < 1.6 + (y + 1) * 0.2 - (y === -1 && md(x, 2) ? 1 : 0) ? beardPaint(x, y, z) : null)),
    B([-4, 8, -4], [4, 11, 4], C.Rd),                                // inner collar
    B([-3, 8, -3], [3, 13, 3], -1),                                  // neck hole
  ];
  P_.neck = [B([-2, -1, -2], [2, 3, 2], C.skinD)];
  return P_;
}

function limbs(P_) {
  for (const [s, sx] of [['R', -1], ['L', 1]]) {
    // upper arm: wide green robe sleeve with a dark lining at the cuff
    P_['upperArm' + s] = [
      B([-3, -12, -3], [3, 1, 3], robe),
      B([-3, -12, -3], [3, -11, 3], C.Rs),
    ];
    // forearm: bronze vambrace in plate rows, gold cuff, dark wrist
    P_['foreArm' + s] = [
      B([-2, -11, -2], [3, 0, 3], C.Ud),
      ...lamellar([-2, -9, -2], [3, -2, 3], { base: C.A, rowH: 2, trim: C.gold }),
      B([-2, -1, -3], [3, 1, 3], C.Rd),
    ];
    P_['hand' + s] = [B([-2, -2, -2], [2, 2, 2], C.glove), B([-2, 1, -2], [2, 2, 2], C.Ud)];
    // thigh: dark trousers under a long green robe panel (front/outside), gold hem
    P_['thigh' + s] = [
      B([-3, -18, -3], [4, 1, 4], (x, y) => (y % 5 === 0 ? C.Ud : C.U)),
      ...[B([-3, -12, -4], [5, 2, 5], (x, y, z) => (y === -12 ? (md(x + z, 3) === 0 ? null : C.gold) : robe(x, y, z)))].map((b) => mirX(b, sx, 1)),
    ];
    P_['shin' + s] = [
      B([-2, -17, -2], [3, 0, 3], C.boot),
      ...lamellar([-2, -15, -1], [3, -4, 4], { base: C.A, rowH: 3, pw: 4 }),
      B([-3, -17, -3], [4, -15, 4], (x, y) => (y === -17 ? C.gold : C.boot)),
      B([-2, -3, 0], [3, 2, 5], C.A),
      B([0, -2, 5], [1, 0, 6], C.gold),
    ];
    P_['foot' + s] = [
      B([-3, -3, -2], [3, 1, 6], C.boot),
      B([-3, -3, 4], [3, -1, 7], C.Ad),
      P([-3, -3, -2], [3, -2, 7], C.sole),
      B([-3, 0, -3], [3, 1, 3], C.gold),
    ];
  }
  return P_;
}

/** Lion-head pauldron: two bronze plate tiers and a round lion face on the outside (eyes, fangs), gold rim. */
function pauldronBoxes(sx) {
  const b = [
    ...lamellar([-4, 1, -4], [2, 5, 4], { base: C.A, rowH: 2 }),
    ...lamellar([-2, -3, -5], [3, 1, 5], { base: C.A, rowH: 2, trim: C.gold, jag: true }),
    B([3, -2, -3], [5, 5, 3], C.Al),                                  // lion face
    B([5, 3, -3], [6, 4, 3], C.gold), B([5, -2, -3], [6, -1, 3], C.gold),
    P([4, 2, -2], [6, 3, -1], C.eye), P([4, 2, 1], [6, 3, 2], C.eye),
    B([5, 0, -1], [7, 2, 1], C.gold),                                 // snout
    P([5, -1, -2], [6, 0, 2], C.redD),                                // mouth
    B([5, -2, -2], [6, -1, -1], C.edge), B([5, -2, 1], [6, -1, 2], C.edge),   // fangs
    B([2, 5, -3], [4, 7, 3], C.Al), B([3, 6, -3], [5, 7, 3], C.gold), // upturned wing
  ];
  return b.map((bx) => mirX(bx, sx));
}

function head() {
  const cap = (x, y, z) => (md(x + y + z, 6) === 0 ? C.Rd : md(x * 2 - z, 9) === 0 ? C.Rl : C.R);
  return [
    B([-3, 0, -2], [4, 2, 5], C.skin),                               // jaw
    B([-4, 2, -4], [5, 10, 5], C.skin),                              // skull / face
    B([-5, 5, -1], [6, 8, 1], C.skinD),                              // ears
    B([-5, 3, -6], [6, 9, -2], C.beard),                             // hair at the nape
    // green kerchief: cap over the crown, a darker band across the brow with a gold plate, top knot wrapped in green
    B([-5, 9, -6], [6, 14, 6], cap),
    B([-4, 14, -5], [5, 15, 4], cap),
    B([-5, 9, -7], [6, 10, 7], C.Rs),
    B([-1, 9, 6], [2, 11, 7], C.gold), B([0, 10, 7], [1, 11, 8], C.jade),
    B([-2, 15, -4], [3, 18, 1], cap), B([-2, 16, -4], [3, 17, 1], C.gold),
    B([-5, 3, -2], [-3, 9, 2], C.beard), B([4, 3, -2], [6, 9, 2], C.beard),   // sideburns
    // face: phoenix eyes (long, narrow, tilted up at the outer corner), thick sleeping-silkworm brows, a strong nose
    P([-3, 5, 4], [0, 6, 5], C.eye), P([1, 5, 4], [4, 6, 5], C.eye),
    P([-4, 6, 4], [-3, 7, 5], C.eye), P([4, 6, 4], [5, 7, 5], C.eye),
    P([-2, 5, 4], [-1, 6, 5], C.scl), P([2, 5, 4], [3, 6, 5], C.scl),
    B([-4, 7, 5], [0, 9, 6], (x, y) => (y === 8 && x === -1 ? null : C.brow)), B([1, 7, 5], [5, 9, 6], (x, y) => (y === 8 && x === 1 ? null : C.brow)),
    B([0, 3, 5], [1, 5, 6], C.skin), P([0, 2, 4], [1, 3, 5], C.skinD),
    P([-4, 1, 3], [-3, 4, 5], C.skinD), P([4, 1, 3], [5, 4, 5], C.skinD),
    // moustache (droops past the mouth corners) and the beard root under the chin; the long beard is a chain
    B([-3, 1, 5], [4, 3, 6], (x, y) => (y === 2 && Math.abs(x) > 2 ? null : beardPaint(x, y, 5))),
    B([-3, 0, 5], [-2, 1, 6], C.beard), B([3, 0, 5], [4, 1, 6], C.beard),
    B([-4, -3, 1], [5, 1, 5], beardPaint),
    B([-4, -7, 3], [5, -3, 9], (x, y) => (Math.abs(x - 0.5) < 4.5 + (y + 3) * 0.2 ? beardPaint(x, y, 5) : null)),   // down to the chest beard
    B([-5, 0, -1], [-4, 4, 3], beardPaint), B([5, 0, -1], [6, 4, 3], beardPaint),
  ];
}

// ---------------------------------------------------------------- Green Dragon Crescent Blade (weapon joint: shaft +Z)
function weaponGeo() {
  const sv = 0.02;
  const shaft = vox([
    B([-1, -1, -36], [1, 1, 73], (x, y, z) => (((z + 36) % 15) === 0 ? C.band : ((z >> 1) & 1) ? C.shaftH : C.shaft)),
    ...Array.from({ length: 7 }, (_, i) => B([-2, -2, -33 + i * 15], [2, 2, -32 + i * 15], C.band)),
    B([-2, -2, -38], [2, 2, -35], C.gold),
    B([-1, -1, -42], [1, 1, -38], C.goldD),                         // butt spike (鐏)
  ], sv, { jitter: 0.04, ao: 0.3 });
  // gold dragon mouth at 0.012 (z 1.42 … 1.64) swallowing the blade root: ring, snout, jaws, horns, jade eyes
  const cv = 0.012;
  const collar = vox([
    B([-3, -3, 118], [3, 3, 122], C.gold),
    B([-4, -4, 122], [4, 4, 130], (x, y, z) => ((z + y) % 3 === 0 ? shade(C.gold, 0.8) : C.gold)),
    B([-4, 1, 130], [4, 5, 137], C.gold),                            // upper jaw
    B([-4, -4, 130], [4, -1, 135], shade(C.gold, 0.85)),            // lower jaw
    B([-3, 4, 120], [-1, 7, 126], C.gold), B([1, 4, 120], [3, 7, 126], C.gold),
    B([-3, 6, 115], [-1, 8, 120], shade(C.gold, 0.9)), B([1, 6, 115], [3, 8, 120], shade(C.gold, 0.9)),
    B([-5, 1, 127], [-4, 3, 129], C.jade), B([4, 1, 127], [5, 3, 129], C.jade),
    B([-4, -5, 114], [4, 4, 118], (x, y, z) => (hash01(x, y, z) < 0.25 ? null : hash01(y, z, x) < 0.3 ? C.redH : C.red)),
  ], cv, { jitter: 0.05, ao: 0.35 });
  // crescent blade, flat in X (the blade stands in the shaft's YZ plane): the cutting edge bulges to +y, the back (−y) runs almost straight with a notch and a
  // spike near the root; the tip sweeps back toward the spine. A green dragon line is engraved along the fuller.
  const bv = 0.012, z0 = Math.round(1.6 / bv), z1 = Math.round(2.14 / bv), len = z1 - z0;
  const boxes = [];
  for (let z = z0; z < z1; z++) {
    const u = (z - z0) / len;
    const back = Math.round(-3 + 3 * u * u);
    const front = Math.round(3 + 14 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + u * 0.95)), 0.8) * (1 - 0.35 * u));
    const f = Math.max(back + 1, front);
    boxes.push(B([-1, back, z], [1, f, z + 1], (_, x) => (x >= f - 2 ? C.edge : x <= back ? shade(C.steel, 0.8)
      : Math.abs(x - (back + 3)) < 1 && u > 0.08 && u < 0.8 ? (md(z, 4) < 2 ? C.jade : C.fuller) : C.steel)));
    if (u > 0.18 && u < 0.28) boxes.push(B([-1, back - 1, z], [1, back, z + 1], -1));             // notch
    if (u > 0.3 && u < 0.4) { const w = Math.round((0.4 - u) * 50); boxes.push(B([-1, back - w, z], [1, back, z + 1], C.steel)); }   // back spike
  }
  const blade = vox(boxes, bv, { jitter: 0.03, ao: 0.2 });
  return [{ geo: shaft, mat: 'body' }, { geo: collar, mat: 'metal' }, { geo: blade, mat: 'blade' }];
}

// ---------------------------------------------------------------- spring-chain segments (local -Y along the chain)
function beardSeg(i, n) {
  // long, thick beard: 7 → 2 voxels wide, a point at the tip, strands in three shades
  const w = Math.max(1, Math.round(2.5 - (i * 1.5) / (n - 1))), tip = i === n - 1;
  return vox([B([-w, tip ? -6 : -4, -1], [w, 0, 1], (x, y, z) => {
    if (tip && y < -2 && Math.abs(x + 0.5) > (y + 7) * 0.6) return null;
    if ((x === -w || x === w - 1) && hash01(x + i * 7, y, z) < 0.35) return null;
    return md(x * 3 + z, 5) === 0 ? C.beardH : md(x + y, 3) === 0 ? C.beardT : C.beard;
  })], 0.025, { off: [0, 0, -0.5], jitter: 0.06, ao: 0.3 });
}
function tieSeg(i, n) {
  const tip = i === n - 1;
  return vox([B([-2, -9, 0], [2, 0, 1], (x, y) => (tip && y <= -8 && (x === -1 || x === 0) ? null : x === -2 ? C.Rd : C.R))],
    0.013, { off: [0, 0, -0.5], jitter: 0.03, ao: 0.15 });
}
function capeSeg(i, n) {
  const w = Math.round(6 + (i * 3) / (n - 1)), last = i === n - 1;
  const paint = (x, y) => {
    if (last && y === -7 && hash01(x, i, 3) < 0.4) return null;
    if (last && (y === -5 || y === -4)) return C.gold;
    return x === -w || x === w - 1 ? C.Rd : md(x + 40, 5) === 0 ? C.Rd : C.R;
  };
  const curl = (x) => x === -w || x === w - 1 || (i >= 3 && (x === -w + 1 || x === w - 2));
  return vox([
    B([-w, -7, 0], [w, 0, 1], (x, y) => (curl(x) ? null : paint(x, y))),
    B([-w, -7, -1], [w, 0, 0], (x, y) => (curl(x) ? paint(x, y) : null)),
  ], 0.025, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.18 });
}
function apronSeg(i, n) {
  const last = i === n - 1;
  return vox([B([-4, -5, 0], [4, 0, 1], (x, y) => (last && y === -5 ? (x % 2 ? null : C.gold) : last && y === -4 ? C.gold : x === -4 || x === 3 ? C.gold : robe(x, y, 0)))],
    0.025, { off: [0, 0, -0.5], jitter: 0.05, ao: 0.2 });
}
function tasselSeg(i, n) {
  const w = i === 0 ? 3 : 2, last = i === n - 1;
  return vox([B([-w, -7, -w], [w, 0, w], (x, y, z) => {
    const h = hash01(x + 9, z + 9, 7);
    if (last && -y > 3 + h * 5) return null;
    if ((x === -w || x === w - 1) && (z === -w || z === w - 1) && i > 0) return null;
    return last && -y > 3 + h * 3 ? C.redD : h < 0.3 ? C.redH : h > 0.8 ? C.redD : C.red;
  })], 0.014, { jitter: 0.06, ao: 0.25 });
}

// ---------------------------------------------------------------- HUD portrait (20×20 pixels)
const FACE = [
  '....................',
  '.......GGGGGG.......',
  '.....GGGGGYYGGG.....',
  '....GGGGGGYYGGGG....',
  '....GgGGGGGGGGGGg...',
  '....ggggggYgggggg...',
  '....RRRRRRRRRRRRK...',
  '....BBBBRRRRBBBBK...',
  '....RRRRRRRRRRRRRK..',
  '....RRREeRRReERRRK..',
  '....RRRRRRrRRRRRRK..',
  '....KRRRRRrrRRRRRK..',
  '....KKKKKKKKKKKKKK..',
  '....KKKKKMMKKKKKKK..',
  '.....KKKKKKKKKKKK...',
  '.....KKKKKkKKKKKK...',
  '..GGG.KKKKKKKKKK.GG.',
  '.GGGGG.KKKkKKKK.GGGG',
  'GGGYGGG.KKKKKK.GYGGG',
  'GGGGGGGG.KKKK.GGGGGG',
];
const PAL = { G: '#3a8a48', g: '#1f5a2c', Y: '#e8b84a', R: '#b8503a', r: '#8a3526', B: '#0e0a0c', E: '#140c0c', e: '#e8d8c8', K: '#15111a', k: '#3a3440', M: '#6a2018' };

export default {
  id: 'guanyu', zh: '關羽', en: 'GUAN YU', seal: '武聖', weapon: '青龍偃月刀',
  sub: '青龍偃月 · 過關斬將 · 義薄雲天', copy: '青龍所指<br>萬軍辟易', tagline: '青龍偃月，萬軍之中取上將首級',
  cut: { sub: '河東 關雲長', seal: '武聖' },
  lines: {
    open: ['關某在此，鼠輩安敢近前！', 'Guan Yu stands here. Which of you rats dares come near?'],
    musou: ['吾乃河東關雲長也！', 'I am Guan Yunchang of Hedong!'],
  },
  face: FACE, pal: PAL,
  build: () => ({ parts: limbs(torso()), head: head(), pauldrons: pauldronBoxes, weapon: weaponGeo() }),
  chains() {
    const out = [];
    // heaviest → lightest
    out.push({ joint: 'chest', anchor: [0, 0.255, -0.17], rest: [0, -1, 0.15], n: 6, len: 0.18, stiff: 0.16, drag: 0.22, wind: 1.1, cone: 80, sway: 0.2,
      seg: capeSeg, hit: ['chest', 'hips', 'thighL', 'thighR', 'kneeL', 'kneeR'] });
    out.push({ joint: 'hips', anchor: [0, -0.04, 0.19], rest: [0, -1, 0.1], n: 4, len: 0.12, stiff: 0.12, drag: 0.14, wind: 0.4, face: [0, 0, 1], cone: 70, sway: 0.08,
      seg: apronSeg, hit: [['thighL', 0.02], ['thighR', 0.02], ['kneeL', 0.02], ['kneeR', 0.02]] });
    // beard tip: swings below the part authored on the chest
    out.push({ joint: 'chest', anchor: [0, -0.02, 0.2], rest: [0, -1, 0.25], n: 3, len: 0.055, stiff: 0.2, drag: 0.2, wind: 0.5, face: [0, 0, 1], cone: 60, sway: 0.06,
      seg: beardSeg, hit: [['hips', 0.05]] });
    for (const sx of [-1, 1]) {
      out.push({ joint: 'head', anchor: [sx * 2 * HV, 11 * HV, -6.5 * HV], rest: [sx * 0.3, -0.6, -1], n: 5, len: 0.1, stiff: 0.03, drag: 0.06, wind: 2.2, cone: 105, sway: 0.55,
        seg: tieSeg, hit: ['head', ['chest', 0.02]] });
    }
    for (let k = 0; k < 5; k++) {
      const a = k * 1.2566, ox = Math.cos(a) * 0.016, oy = Math.sin(a) * 0.016;
      out.push({ joint: 'weapon', anchor: [ox, oy, 1.39], rest: [ox * 12, oy * 4 - 1, -0.35], n: 3, len: 0.07, stiff: 0.05 + k * 0.004, drag: 0.12, wind: 0.8, cone: 130, sway: 0.15,
        face: [1, 0, 0], seg: tasselSeg });
    }
    return out;
  },
};
