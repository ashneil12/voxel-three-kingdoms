// 關羽 Guan Yu (after the DW9 design): engraved bronze helmet over a green hood that drapes to the shoulders, long
// black hair, a stern face (heavy brows pressed low, narrow phoenix eyes, straight nose), moustache and a long beard
// that tapers to a point at the belly. Asymmetric armour: one big bronze dragon-head pauldron on the right shoulder
// over a bare right arm, a wide green sleeve on the left. Dark-green robe with gold embroidery and a dark-red crossed
// collar, wide leather belt with bronze plaques, robe panels to the shins (spring chains), baggy trousers, tall boots
// with upturned toes. Weapon: Green Dragon Crescent Blade — green shaft, a gold dragon coiling up it, a gold dragon
// head swallowing a broad curved blade with iron rings through its back.
import { vox, B, P, md, mirX, lamellar } from '../hero/model.js';
import { hash01 } from '../core/rng.js';
import { shade } from '../core/voxel.js';

const HV = 0.0125;   // head voxel: a 13-voxel face (vs 9 on the base rig) so brows, eyes and nose can carry an expression
const C = {
  R: 0x2c6848, Rd: 0x1d4a33, Rl: 0x3c805a, emb: 0xb8954a, embD: 0x8a6e36,   // dark-green robe, gold embroidery
  T: 0x7a2e24, Td: 0x4e1d18,                                                // dark-red collar / lining
  A: 0x8a7650, Ad: 0x55462c, Al: 0xb09a6a,                                  // bronze
  L: 0x5a3a28, Ld: 0x3a261a,                                                // leather
  U: 0x3a2622, boot: 0x3c3432, bootD: 0x282220, sole: 0x1a1614,
  skin: 0xc07a5a, skinD: 0x94553c, skinH: 0xd89678, eye: 0x100a0a, scl: 0xd8ccc0,
  beard: 0x0e0c10, beardH: 0x2c2832, hair: 0x100e12, hairH: 0x2a2630,
  hood: 0x2a6044, hoodD: 0x1a3e2c,
  shaft: 0x24503a, shaftH: 0x336a4c, gold: 0xc09a46, goldD: 0x7e6028,
  steel: 0xc4ccd6, edge: 0xf2f6fa, steelD: 0x7c8490,
};

// robe cloth: fold streaks plus a sparse gold diamond-scroll embroidery
const robe = (x, y, z) => {
  const a = md(x * 2 + y + z, 10), b = md(x * 2 - y - z, 10);
  if ((a === 0 || b === 0) && hash01(x, y, z) < 0.55) return hash01(z, x, y) < 0.3 ? C.embD : C.emb;
  return md(x + z * 3, 7) === 0 ? C.Rd : md(x * 3 - y, 11) === 0 ? C.Rl : C.R;
};
const beardPaint = (x, y, z) => (md(x, 3) === 0 ? C.beardH : hash01(x, y, z) < 0.15 ? C.beardH : C.beard);   // vertical strands

// ---------------------------------------------------------------- body parts (body voxels, 0.025 m)
function torso() {
  const P_ = {};
  P_.hips = [
    B([-6, -5, -4], [6, 3, 4], C.U),
    B([-7, -6, -5], [7, -1, 5], robe),                                // robe below the belt (panels are chains)
    B([-7, -1, -5], [7, 3, 5], (x, y) => (y === -1 || y === 2 ? C.Ld : C.L)),   // wide leather belt
    ...[-5, -2, 2, 5].map((x) => B([x - 1, 0, 5], [x + 1, 2, 6], C.A)),         // bronze plaques
    B([-2, -1, 5], [3, 3, 6], C.Al), B([-1, 0, 6], [2, 2, 7], C.Ad),           // round buckle
  ];
  P_.spine = [
    B([-5, -3, -4], [5, 8, 4], C.U),
    B([-6, -2, -5], [6, 8, 5], robe),
  ];
  // chest: green robe, the dark-red crossed collar running from the left of the neck down to the right flank, the
  // under-robe showing above it; dark leather scale on the right side under the pauldron
  const lap = (x, y) => x + 0.5 - (3 - (10 - y) * 0.8);                 // signed distance to the collar line
  P_.chest = [
    B([-7, -2, -5], [7, 9, 5], C.U),
    B([-8, -2, -6], [8, 10, 6], robe),
    ...lamellar([-8, 2, -6], [-3, 10, 6], { base: C.L, rowH: 2, pw: 3, lipX: false }),
    B([-8, -2, 6], [8, 11, 7], (x, y) => {
      const d = lap(x, y);
      if (Math.abs(d) < 1.3) return C.T;
      if (Math.abs(d) < 1.9) return C.emb;
      return d < 0 && y > 6 && x > -4 ? C.Td : null;
    }),
    B([-4, 8, -4], [4, 11, 4], C.T),                                  // inner collar
    B([-3, 8, -3], [3, 13, 3], -1),                                   // neck hole
    // the long beard lies on the chest: face-wide under the chin, tapering to a point (tip continues as a chain)
    B([-5, -2, 6], [6, 10, 8], (x, y, z) => (Math.abs(x + 0.5) < 1.4 + (y + 2) * 0.19 ? beardPaint(x, y, z) : null)),
  ];
  P_.neck = [B([-2, -1, -2], [2, 3, 2], C.skinD)];
  return P_;
}

function limbs(P_) {
  // right arm bare (muscle, bronze armband) under the pauldron; left arm in a wide green sleeve
  P_.upperArmR = [
    B([-2, -12, -2], [2, 1, 2], (x, y) => (y < -8 ? C.skin : C.skinD)),
    B([-2, -9, 1], [2, -3, 3], C.skin),                               // biceps
    B([-3, -11, -3], [3, -9, 3], C.A), P([-3, -11, -3], [3, -10, 3], C.Ad),
  ];
  P_.upperArmL = [
    B([-3, -12, -3], [3, 1, 3], robe),
    B([-4, -12, -4], [4, -10, 4], robe), P([-4, -12, -4], [4, -11, 4], C.T),   // flared sleeve end with red lining
  ];
  for (const [s, sx] of [['R', -1], ['L', 1]]) {
    // bronze bracers (engraved rows) over a dark-red wrap
    P_['foreArm' + s] = [
      B([-2, -11, -2], [3, 0, 3], C.Td),
      B([-2, -10, -3], [3, -2, 4], (x, y, z) => (md(y, 3) === 0 ? C.Ad : md(x + z, 4) === 0 ? C.Al : C.A)),
      P([-2, -2, -3], [3, -1, 4], C.Al), P([-2, -10, -3], [3, -9, 4], C.Al),
    ];
    P_['hand' + s] = [B([-2, -2, -2], [2, 2, 2], C.skin), P([-2, -2, 1], [2, -1, 2], C.skinD)];
    // baggy green trousers; the right thigh carries a leather-and-bronze tasset on the outside
    P_['thigh' + s] = [
      B([-3, -18, -3], [4, 1, 4], (x, y) => (md(y, 4) === 0 ? C.Rd : C.R)),
      B([-4, -16, -4], [5, -10, 5], (x, y) => (md(y, 4) === 0 ? C.Rd : C.R)),   // bagging above the boot
      ...(s === 'R' ? lamellar([-2, -9, -4], [5, 2, 5], { base: C.L, rowH: 2, trim: C.A, jag: true }).map((b) => mirX(b, sx, 1)) : []),
    ];
    // tall dark boots with a folded cuff
    P_['shin' + s] = [
      B([-2, -17, -2], [3, 0, 3], (x, y) => (md(y, 5) === 0 ? C.bootD : C.boot)),
      B([-3, -4, -3], [4, 0, 4], C.bootD),
      B([-3, 0, -3], [4, 3, 4], C.R),
    ];
    P_['foot' + s] = [
      B([-3, -3, -2], [3, 1, 6], C.boot),
      B([-2, -2, 6], [2, 0, 8], C.boot), B([-1, -1, 8], [1, 1, 9], C.boot), B([-1, 0, 9], [1, 2, 10], C.bootD),   // upturned toe
      P([-3, -3, -2], [3, -2, 10], C.sole),
    ];
  }
  return P_;
}

/** One big bronze dragon-head pauldron, right shoulder only: engraved plate tiers, the dragon's head on the outside
 *  facing forward (snout, jaw, gold eye), a horn swept back. */
function pauldronBoxes(sx) {
  if (sx > 0) return [];
  const eng = (base) => (x, y, z) => (md(x + z, 4) === 0 ? C.Ad : md(y + z, 5) === 0 ? C.Al : base);
  const b = [
    ...lamellar([-4, 3, -5], [3, 7, 5], { base: C.A, rowH: 2 }),
    ...lamellar([-2, -1, -6], [4, 3, 6], { base: C.A, rowH: 2 }),
    ...lamellar([-1, -5, -6], [5, -1, 6], { base: C.A, rowH: 2, trim: C.L, jag: true }),
    B([4, 0, -4], [7, 6, 3], eng(C.A)),                               // dragon head
    B([5, 1, 3], [7, 4, 7], eng(C.A)),                                // snout
    B([5, -1, 3], [7, 1, 6], C.Ad),                                   // lower jaw
    B([7, 2, 5], [8, 3, 7], C.Al),                                    // nostril ridge
    P([7, 4, 1], [8, 5, 3], C.gold),                                  // eye
    B([4, 5, -5], [6, 7, 2], C.Ad),                                   // brow / mane ridge
    B([5, 6, -6], [6, 9, -3], C.Al), B([5, 8, -8], [6, 10, -5], C.Al), // horn swept back
  ];
  return b.map((bx) => mirX(bx, sx));
}

// ---------------------------------------------------------------- head (head voxels HV = 0.0125, chin y 0)
function head() {
  const bronze = (x, y, z) => (md(x + z, 3) === 0 && y > 12 && y < 15 ? C.Ad : md(x * 2 + y, 7) === 0 ? C.Al : C.A);
  const hood = (x, y, z) => (md(y + z, 5) === 0 ? C.hoodD : C.hood);
  const eyes = [];
  for (const sx of [-1, 1]) {
    const bx = (a, b) => (sx < 0 ? [-b + 1, -a + 1] : [a, b]);   // mirror a half-open x range
    const r = (a, b, y0, y1, z0, z1, c, paint = true) => { const [x0, x1] = bx(a, b); eyes.push({ a: [x0, y0, z0], b: [x1, y1, z1], c, paint }); };
    r(1, 6, 7, 10, 5, 6, C.skinD);                                    // eye socket shade
    r(1, 2, 8, 9, 5, 6, C.skinD); r(2, 3, 8, 9, 5, 6, C.scl); r(3, 4, 8, 9, 5, 6, C.eye); r(4, 5, 8, 9, 5, 6, C.scl); r(5, 6, 8, 9, 5, 6, C.eye);
    r(1, 6, 9, 10, 5, 6, C.eye);                                      // upper lid line
    r(1, 6, 10, 11, 5, 7, C.beard, false); r(3, 7, 11, 12, 5, 7, C.beard, false);   // heavy brows, rising outward
    r(1, 2, 10, 11, 6, 7, C.beard, false);
    r(4, 6, 5, 7, 5, 6, C.skinH);                                     // cheekbone
    r(5, 7, 2, 6, 5, 6, C.skinD);                                     // hollow cheek
  }
  return [
    B([-6, 2, -6], [7, 13, 6], C.skin),                               // skull / face
    B([-5, 0, -5], [6, 2, 5], C.skin),                                // jaw
    B([-7, 6, -1], [8, 10, 2], C.skinD),                              // ears
    ...eyes.map((e) => ({ ...e })),
    B([0, 5, 6], [1, 10, 7], C.skin), B([-1, 4, 6], [2, 6, 7], C.skin), P([-1, 4, 6], [0, 5, 7], C.skinD), P([1, 4, 6], [2, 5, 7], C.skinD),   // nose
    P([0, 10, 5], [1, 11, 6], C.skinD),                               // frown crease
    // long hair at the back and sideburns
    B([-6, 1, -7], [7, 13, -4], (x, y, z) => (md(x * 3 + z, 5) === 0 ? C.hairH : C.hair)),
    B([-7, 3, -4], [-5, 11, 2], C.hair), B([6, 3, -4], [8, 11, 2], C.hair),
    // green hood framing the face, under the helmet rim, falling behind the head (the tail is a chain)
    B([-9, 1, -8], [-7, 13, 4], hood), B([8, 1, -8], [10, 13, 4], hood), B([-9, 1, -9], [10, 13, -7], hood),
    P([-9, 1, 3], [-7, 13, 4], C.hoodD), P([8, 1, 3], [10, 13, 4], C.hoodD),
    // engraved bronze helmet: rim with rivets, stepped bowl, gold crest at the brow, knob on top
    B([-8, 12, -8], [9, 15, 8], bronze),
    B([-8, 12, -8], [9, 13, 8], (x, y, z) => (md(x + z, 3) === 0 ? C.Al : C.Ad)),
    B([-7, 15, -7], [8, 17, 7], bronze), B([-5, 17, -5], [6, 19, 5], bronze), B([-1, 19, -1], [2, 21, 2], C.gold),
    B([-2, 13, 8], [3, 17, 9], C.gold), B([-1, 17, 7], [2, 19, 8], C.gold), P([0, 14, 8], [1, 16, 9], C.T),
    // moustache drooping past the mouth, beard over the jaw and down under the chin (reaching toward the chest beard)
    B([-3, 3, 6], [4, 5, 7], beardPaint), B([-5, 1, 5], [-3, 4, 7], beardPaint), B([4, 1, 5], [6, 4, 7], beardPaint),
    B([-6, -2, 0], [7, 3, 7], (x, y, z) => (y > 1 && Math.abs(x) < 2 && z > 5 ? null : beardPaint(x, y, z))),
    B([-5, -9, 2], [6, -2, 12], (x, y, z) => (Math.abs(x) < 5 - (-2 - y) * 0.3 && z >= 2 + (-2 - y) && z < 8 + (-2 - y) * 0.6 ? beardPaint(x, y, z) : null)),
  ];
}

// ---------------------------------------------------------------- Green Dragon Crescent Blade (weapon joint: shaft +Z)
function weaponGeo() {
  const sv = 0.02;
  const shaft = vox([
    B([-1, -1, -36], [1, 1, 74], (x, y, z) => (((z >> 1) & 1) ? C.shaftH : C.shaft)),
    ...[-33, -12, 20, 45].map((z) => B([-2, -2, z], [2, 2, z + 1], C.gold)),
    B([-2, -2, -38], [2, 2, -35], C.gold), B([-1, -1, -42], [1, 1, -38], C.goldD),
    // gold dragon coiling up the top of the shaft toward the head
    ...Array.from({ length: 22 }, (_, i) => { const z = 50 + i, a = i * 0.62, x = Math.round(Math.cos(a) * 1.6), y = Math.round(Math.sin(a) * 1.6);
      return B([x - 1, y - 1, z], [x + 1, y + 1, z + 1], i % 4 === 0 ? C.goldD : C.gold); }),
  ], sv, { jitter: 0.04, ao: 0.3 });
  const cv = 0.012;
  const collar = vox([
    B([-3, -3, 118], [3, 3, 122], C.gold),
    B([-4, -4, 122], [4, 4, 130], (x, y, z) => ((z + y) % 3 === 0 ? shade(C.gold, 0.8) : C.gold)),
    B([-4, 1, 130], [4, 5, 138], C.gold), B([-4, -4, 130], [4, -1, 135], shade(C.gold, 0.85)),   // jaws round the blade
    B([-3, 4, 118], [-1, 8, 126], C.gold), B([1, 4, 118], [3, 8, 126], C.gold),                 // horns
    B([-3, 7, 112], [-1, 9, 118], shade(C.gold, 0.9)), B([1, 7, 112], [3, 9, 118], shade(C.gold, 0.9)),
    B([-5, 2, 127], [-4, 4, 129], C.T), B([4, 2, 127], [5, 4, 129], C.T),                       // eyes
  ], cv, { jitter: 0.05, ao: 0.35 });
  // crescent blade in the shaft's YZ plane: the edge bulges to +y, the back (−y) runs straight with notches and three
  // iron rings; a gold scroll line is engraved along it
  const bv = 0.012, z0 = Math.round(1.6 / bv), z1 = Math.round(2.14 / bv), len = z1 - z0;
  const boxes = [];
  for (let z = z0; z < z1; z++) {
    const u = (z - z0) / len;
    const back = Math.round(-3 + 3 * u * u);
    const f = Math.max(back + 1, Math.round(3 + 14 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + u * 0.95)), 0.8) * (1 - 0.35 * u)));
    boxes.push(B([-1, back, z], [1, f, z + 1], (_, y) => (y >= f - 2 ? C.edge : y <= back ? C.steelD
      : Math.abs(y - (back + 3 + Math.round(Math.sin(u * 14) * 1.2))) < 1 && u > 0.06 && u < 0.85 ? C.gold : C.steel)));
    if (md(Math.round(u * 40), 7) === 3 && u > 0.1 && u < 0.7) boxes.push(B([-1, back, z], [1, back + 1, z + 1], -1));   // notches
  }
  for (const u of [0.28, 0.43, 0.58]) {                               // rings through the back of the blade
    const cz = z0 + Math.round(u * len), cy = Math.round(-3 + 3 * u * u) - 2;
    for (let dz = -4; dz <= 4; dz++) for (let dy = -4; dy <= 4; dy++) {
      const r = Math.hypot(dy, dz);
      if (r >= 2.2 && r < 3.6) boxes.push(B([-1, cy + dy, cz + dz], [1, cy + dy + 1, cz + dz + 1], C.steelD));
    }
  }
  const blade = vox(boxes, bv, { jitter: 0.03, ao: 0.2 });
  return [{ geo: shaft, mat: 'body' }, { geo: collar, mat: 'metal' }, { geo: blade, mat: 'blade' }];
}

// ---------------------------------------------------------------- spring-chain segments (local -Y along the chain)
function beardSeg(i, n) {
  const w = Math.max(1, Math.round(2 - i * 0.5)), tip = i === n - 1;
  return vox([B([-w, tip ? -6 : -4, -1], [w, 0, 1], (x, y, z) => (tip && y < -2 && Math.abs(x + 0.5) > (y + 7) * 0.4 ? null : beardPaint(x, y, z)))],
    0.025, { off: [0, 0, -0.5], jitter: 0.06, ao: 0.3 });
}
function hairSeg(i, n) {
  // a broad sheet of long hair, strands separating toward the ends
  const w = Math.max(2, Math.round(5 - (i * 2) / (n - 1))), tip = i === n - 1;
  return vox([B([-w, -5, -1], [w, 0, 1], (x, y, z) => {
    if ((tip || i === n - 2) && md(x, 2) === 0 && y < -1 - (tip ? 0 : 3)) return null;
    if (tip && y < -3 && hash01(x, i, z) < 0.5) return null;
    return md(x * 2 + i, 5) === 0 ? C.hairH : C.hair;
  })], 0.014, { off: [0, 0, -0.5], jitter: 0.05, ao: 0.25 });
}
function hoodSeg(i, n) {
  const w = 5 - i, last = i === n - 1;
  return vox([B([-w, -5, 0], [w, 0, 1], (x, y) => (last && y === -5 && md(x, 2) ? null : md(x + y, 5) === 0 ? C.hoodD : C.hood))],
    0.02, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.2 });
}
/** Robe panel: green face with embroidery, dark-red lining on the inner layer, gold hem. */
function panelSeg(w) {
  // local +Z is the chain's face direction (outward), so the lining sits on the −Z side
  return (i, n) => {
    const last = i === n - 1;
    return vox([
      B([-w, -6, 0], [w, 0, 1], (x, y) => (last && y <= -5 ? (y === -6 && md(x, 2) ? null : C.emb) : x === -w || x === w - 1 ? C.emb : robe(x, y + i * 6, 3))),
      B([-w + 1, -6, -1], [w - 1, 0, 0], C.Td),
    ], 0.025, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.2 });
  };
}

// ---------------------------------------------------------------- HUD portrait (20×20 pixels)
const FACE = [
  '.......AAAAAA.......',
  '.....AAAAYAAAAA.....',
  '....AAAAYYYAAAAA....',
  '...GAAAAAYAAAAAAG...',
  '..GGaaaaaaaaaaaaGG..',
  '..GGKSSSSSSSSSSKGG..',
  '..GGKBBBSSSSBBBKGG..',
  '..GGSSSBBSSBBSSSGG..',
  '..GGSEeESSSSEeESGG..',
  '..GGShSSSrrSSShSGG..',
  '..GGsSSSSrrSSSSsGG..',
  '..GGsKKKKKKKKKKsGG..',
  '..GGKKKKSMMSKKKKGG..',
  '..GGGKKKKKKKKKKGGG..',
  '..GGG.KKKKKKKK.GGG..',
  '.GGGG..KKKkKK..GGGG.',
  'GGGgTT..KKKK..TTgGGG',
  'GgGGGTT.KKKK.TTGGGgG',
  'GGgGGGTT.KK.TTGGgGGG',
  'GGGGgGGTT..TTGGGGgGG',
];
const PAL = { A: '#8a7650', a: '#55462c', Y: '#c8a04a', G: '#2c6848', g: '#b8954a', K: '#110e12', k: '#34303a', S: '#c07a5a',
  s: '#94553c', h: '#d89678', B: '#0e0c10', E: '#100a0a', e: '#d8ccc0', r: '#a8664a', M: '#5a2420', T: '#7a2e24' };

export default {
  id: 'guanyu', zh: '關羽', en: 'GUAN YU', seal: '武聖', weapon: '青龍偃月刀',
  sub: '青龍偃月 · 過關斬將 · 義薄雲天', copy: '青龍所指<br>萬軍辟易', tagline: '青龍偃月，萬軍之中取上將首級',
  cut: { sub: '河東 關雲長', seal: '武聖' },
  lines: {
    open: ['關某在此，鼠輩安敢近前！', 'Guan Yu stands here. Which of you rats dares come near?'],
    musou: ['吾乃河東關雲長也！', 'I am Guan Yunchang of Hedong!'],
  },
  face: FACE, pal: PAL,
  build: () => ({ parts: limbs(torso()), head: head(), hv: HV, pauldrons: pauldronBoxes, weapon: weaponGeo() }),
  chains() {
    const out = [];
    // robe panels, back and front, down to the shins (no shoulder cape)
    out.push({ joint: 'hips', anchor: [0, -0.1, -0.15], rest: [0, -1, -0.12], n: 5, len: 0.13, stiff: 0.14, drag: 0.2, wind: 0.9, cone: 75, sway: 0.15,
      seg: panelSeg(8), hit: ['hips', ['thighL', 0.02], ['thighR', 0.02], ['kneeL', 0.03], ['kneeR', 0.03]] });
    out.push({ joint: 'hips', anchor: [0, -0.12, 0.17], rest: [0, -1, 0.1], n: 5, len: 0.12, stiff: 0.13, drag: 0.18, wind: 0.5, face: [0, 0, 1], cone: 70, sway: 0.1,
      seg: panelSeg(6), hit: [['thighL', 0.03], ['thighR', 0.03], ['kneeL', 0.03], ['kneeR', 0.03]] });
    out.push({ joint: 'chest', anchor: [0, -0.05, 0.185], rest: [0, -1, 0.2], n: 3, len: 0.05, stiff: 0.22, drag: 0.2, wind: 0.4, face: [0, 0, 1], cone: 50, sway: 0.05,
      seg: beardSeg, hit: [['hips', 0.06]] });
    // long hair and the hood's tail falling over the back
    out.push({ joint: 'head', anchor: [0, 6 * HV, -7.5 * HV], rest: [0, -1, -0.25], n: 7, len: 0.065, stiff: 0.1, drag: 0.14, wind: 1.3, cone: 80, sway: 0.3,
      seg: hairSeg, hit: ['head', ['chest', 0.04], ['hips', 0.03]] });
    out.push({ joint: 'head', anchor: [0, 11 * HV, -9 * HV], rest: [0, -1, -0.4], n: 3, len: 0.08, stiff: 0.14, drag: 0.16, wind: 1.1, cone: 70, sway: 0.25,
      seg: hoodSeg, hit: ['head', ['chest', 0.05]] });
    return out;
  },
};
