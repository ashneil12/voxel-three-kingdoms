// 張飛 Zhang Fei (after the DW9 design): a brawler's build. Green head wrap with a gold band and trailing ties, a
// ferocious face — brows crushed together over round glaring eyes, a broad nose, an upswept moustache and a thick
// short beard. Half-bare muscled chest with a round breastplate bearing a red 張, an iron chain across it, a gold
// dragon pauldron on the right and a red plaque on the left; the right arm in a big puffed green robe sleeve, the left
// arm bare with a dark bracer. Silver scale belt under a knotted black sash, engraved gold tassets, baggy brown
// trousers tied at the knee, black boots. Weapon: the Serpent Spear — red-brown shaft, a gold serpent head with
// claws gripping a wavy blade, red tassel.
import { vox, B, P, md, mirX, lamellar } from '../hero/model.js';
import { hash01 } from '../core/rng.js';
import { shade } from '../core/voxel.js';
import { FV, glove, bareUpperArm, bracer, bootFoot, symH } from './parts.js';

const HV = 0.0135;
const C = {
  skin: 0x86563a, skinD: 0x603a26, skinH: 0x9c6a4a, lip: 0x5a2a20, eye: 0x0e0a0c, iris: 0x2a1a14, scl: 0xe4dcd0, teeth: 0xe0d8c8,
  beard: 0x120e10, beardH: 0x2e2628,
  G: 0x3a6a40, Gd: 0x274a2c, Gl: 0x4e8656, emb: 0xa88a40,                   // green wrap / robe, gold embroidery
  A: 0x947836, Ad: 0x5e4a22, Al: 0xba9c54,                                  // gold
  red: 0x9a3228, redD: 0x6a2018, disc: 0x8e9270, discD: 0x646a50,           // red plaque, round breastplate
  iron: 0x4c4e56, ironL: 0x7a7e88, scale: 0x7e828c, scaleD: 0x50545c,
  sash: 0x26262a, sashL: 0x3a3a40, pants: 0x5a3a26, pantsD: 0x3e2819, boot: 0x221e1c, bootD: 0x161312,
  leather: 0x2e2622, leatherL: 0x46382e,
  shaft: 0x5a2a1c, shaftH: 0x6e3824, steel: 0xc4ccd6, edge: 0xf0f4f8, fuller: 0x7c8490,
  tas: 0xd02a1e, tasH: 0xff5a3a, tasD: 0x8a1812,
};
const robe = (x, y, z) => (md(x * 2 + y + z, 18) === 0 && hash01(x, y, z) < 0.6 ? C.emb : md(x + z * 3, 11) === 0 ? C.Gd : md(x * 3 - y, 17) === 0 ? C.Gl : C.G);
const beardPaint = (x, y, z) => (md(x + y, 3) === 0 ? C.beardH : C.beard);
// 張 as a 9×8 pixel glyph (弓 + 長), row 0 at the top
const ZHANG = ['XXX.XXXX.', '..X.X....', 'XXX.XXXX.', 'X...X....', 'XXX.XXXX.', '..X.XXXXX', '..X.X.X..', 'XX..X..XX'];

// ---------------------------------------------------------------- body parts (fine voxels, centred on the joints)
function torso() {
  const P_ = {};
  // hips: knotted black sash over the scale belt, the robe below
  P_.hips = [
    B([-12, -10, -8], [12, 6, 8], C.pantsD),
    B([-14, -12, -10], [14, -2, 10], robe),
    B([-15, -2, -11], [15, 3, 11], (x, y) => (y === 2 ? C.sashL : C.sash)),
    B([-15, 3, -11], [15, 7, 11], (x, y) => (md(x + (y & 1), 2) === 0 ? C.scaleD : C.scale)),
    B([-9, -3, 11], [-3, 4, 14], C.sash), P([-9, 0, 13], [-3, 1, 14], C.sashL),   // knot
  ];
  // waist: bare abs above a second band of scale belt
  const abs = (x, y, z) => (z > 8 && (Math.abs(x + 0.5) < 0.8 || md(y, 5) === 0) ? C.skinD : x < -8 || z < -6 ? C.skinD : C.skin);
  P_.spine = [
    B([-11, -6, -9], [11, 16, 9], abs),
    B([-12, -6, -10], [12, 2, 10], (x, y) => (md(x + (y & 1), 2) === 0 ? C.scaleD : C.scale)),
    B([-12, 2, -10], [-3, 16, 10], robe),                            // the robe wraps the right side
  ];
  // chest: bare muscled left half (pectorals), green robe over the right half, the round breastplate with a red 張,
  // an iron chain from the right shoulder to the left flank
  const chest = (x, y, z) => (z > 9 && y > 10 && y < 18 && Math.abs(x) > 1 ? (y === 11 ? C.skinD : C.skinH) : z > 9 && Math.abs(x + 0.5) < 1 ? C.skinD : C.skin);
  const disc = [];
  for (let y = 0; y < 16; y++) for (let x = -9; x < 9; x++) {
    const r = Math.hypot(x + 0.5, y - 7.5);
    if (r > 8.2) continue;
    const gy = Math.floor((13 - y) * 8 / 10), gx = Math.floor((x + 7) * 9 / 14);
    const ch = r < 6.6 && gy >= 0 && gy < 8 && gx >= 0 && gx < 9 && ZHANG[gy][gx] === 'X';
    disc.push(B([x - 1, y, 12], [x, y + 1, r > 7.2 ? 14 : 15], ch ? C.red : r > 7.2 ? C.A : hash01(x, y, 3) < 0.2 ? C.discD : C.disc));
  }
  P_.chest = [
    B([-14, -4, -11], [14, 19, 11], chest),
    B([-16, 8, -12], [16, 20, 12], chest), B([-14, 11, 11], [14, 18, 13], chest),   // broad shoulders, pectorals
    B([-16, -4, -12], [-3, 21, 12], robe), P([-4, -4, 12], [-3, 21, 13], C.emb),
    ...disc,
    ...Array.from({ length: 22 }, (_, i) => { const x = -12 + i, y = 20 - Math.round(i * 0.95);
      return B([x, y, i % 2 ? 13 : 12], [x + 1, y + 2, i % 2 ? 14 : 15], i % 2 ? C.ironL : C.iron); }),
    B([-6, 16, -6], [6, 26, 6], -1),
  ];
  P_.neck = [B([-5, -2, -5], [5, 6, 5], C.skinD), P([-5, 2, 4], [5, 6, 5], C.skin)];   // thick neck
  return P_;
}

function limbs(P_) {
  // right arm: big puffed green sleeve over a gold bracer; left arm bare with a dark leather bracer
  P_.upperArmR = [
    B([-7, -22, -7], [7, 2, 7], robe),
    B([-8, -18, -8], [8, -6, 8], robe),
    B([-7, -24, -7], [7, -22, 7], C.Gd),
  ];
  P_.upperArmL = bareUpperArm(C, [C.A, C.Ad, C.Al]);
  P_.foreArmR = bracer(C.skinD, [C.A, C.Ad, C.Al]);
  P_.foreArmL = bracer(C.skin, [C.leather, C.bootD, C.leatherL], false);
  for (const [s, sx] of [['R', -1], ['L', 1]]) {
    P_['hand' + s] = glove(sx, C.leather, C.leatherL);
    // baggy brown trousers with a dark tie below the knee; engraved gold tasset over the front
    P_['thigh' + s] = [
      B([-8, -36, -8], [8, 2, 8], (x, y, z) => (md(y + (x & 1), 7) === 0 ? C.pantsD : C.pants)),
      B([-9, -32, -9], [9, -20, 9], (x, y) => (md(y + x, 5) === 0 ? C.pantsD : C.pants)),
      B([-8, -14, 8], [8, 4, 11], (x, y, z) => (y === -14 || Math.abs(x + 0.5) > 6.5 ? C.Ad : md(x * 3 + y * 2, 11) === 0 ? C.Al : md(x - y, 7) === 0 ? C.Ad : C.A)),
      ...[B([7, -14, -7], [10, 4, 8], (x, y) => (y === -14 ? C.Ad : C.A))].map((b) => mirX(b, sx)),
    ];
    P_['shin' + s] = [
      B([-6, -34, -6], [6, 0, 6], C.boot),
      B([-8, -12, -8], [8, 2, 8], (x, y) => (md(y + x, 4) === 0 ? C.pantsD : C.pants)),   // trousers bagging over the boot
      B([-8, -13, -8], [8, -11, 8], C.sash),
      B([-7, -34, -7], [7, -31, 7], C.bootD),
    ];
    P_['foot' + s] = bootFoot(C.boot, C.bootD, C.bootD, { trim: C.A });
  }
  return P_;
}

/** Right: gold dragon pauldron. Left: a red plaque with a gold rim and a dragon roundel. */
function pauldronBoxes(sx) {
  if (sx < 0) {
    const eng = (base) => (x, y, z) => (md(x + z, 5) === 0 ? C.Ad : md(y * 2 + z, 9) === 0 ? C.Al : base);
    return [
      ...lamellar([-6, 4, -10], [6, 12, 10], { base: C.A, rowH: 3, pw: 5 }),
      ...lamellar([-2, -4, -12], [9, 4, 12], { base: C.A, rowH: 3, pw: 5, trim: C.Ad, jag: true }),
      B([8, 0, -7], [13, 10, 5], eng(C.A)), B([10, 2, 5], [13, 7, 11], eng(C.A)), B([10, -1, 5], [13, 2, 9], C.Ad),
      B([13, 7, 1], [14, 9, 4], C.red),
      B([9, 9, -10], [11, 14, -4], C.Al), B([9, 12, -14], [11, 16, -9], C.Al),
    ].map((b) => mirX(b, sx));
  }
  return [
    B([-2, 0, -9], [9, 8, 9], (x, y, z) => (y === 0 || y === 7 || Math.abs(z) > 7 ? C.A : C.red)),
    B([8, 1, -7], [10, 8, 7], (x, y, z) => (Math.hypot(y - 4.5, z) < 2.5 ? C.Al : Math.hypot(y - 4.5, z) < 3.5 ? C.Ad : C.red)),
    B([0, -3, -8], [8, 0, 8], C.redD),
  ];
}

// ---------------------------------------------------------------- head (head voxels, chin y 0)
function head() {
  const wrap = (x, y, z) => (md(x + y * 2 + z, 6) === 0 ? C.Gd : md(x * 3 - z, 7) === 0 ? C.Gl : C.G);
  return [
    B([-6, 2, -6], [7, 13, 6], C.skin),
    B([-6, 0, -5], [7, 2, 5], C.skin),                                 // square jaw
    B([-7, 6, -1], [8, 10, 2], C.skinD),
    // face: round glaring eyes (whites all round the iris), brows crushed down and together, a broad nose,
    // a snarl showing teeth
    ...symH(1, 7, 6, 7, 5, 6, C.skinD),                                // heavy lower lids
    ...symH(2, 6, 7, 9, 5, 6, C.scl), ...symH(3, 5, 7, 9, 5, 6, C.iris), ...symH(3, 4, 7, 9, 5, 6, C.eye),
    ...symH(1, 7, 9, 10, 5, 6, C.eye),
    // brows: a thick bar crushed down onto the eyes, lowest at the inner ends, flaring up at the temples
    ...symH(1, 5, 9, 11, 6, 8, C.beard, false), ...symH(4, 8, 10, 12, 6, 8, C.beard, false), ...symH(6, 8, 12, 13, 6, 8, C.beard, false),
    ...symH(1, 2, 11, 13, 5, 6, C.skinD),                              // furrow between the brows
    B([-1, 4, 6], [2, 9, 7], C.skin), B([-2, 4, 6], [3, 6, 7], C.skin), P([-2, 4, 6], [-1, 5, 7], C.skinD), P([2, 4, 6], [3, 5, 7], C.skinD),
    P([-3, 1, 5], [4, 3, 6], C.lip), P([-2, 1, 5], [3, 2, 6], C.eye), P([-2, 2, 5], [-1, 3, 6], C.teeth), P([2, 2, 5], [3, 3, 6], C.teeth),   // snarl: dark mouth, canines
    // upswept moustache and a thick beard round the jaw, bushy sideburns
    B([-4, 3, 6], [5, 4, 8], C.beard), B([-6, 3, 5], [-4, 6, 8], C.beard), B([5, 3, 5], [7, 6, 8], C.beard),
    B([-7, 4, 4], [-6, 6, 7], C.beard), B([7, 4, 4], [8, 6, 7], C.beard),
    B([-7, -3, -2], [8, 3, 7], (x, y, z) => (y > 0 && Math.abs(x) < 4 && z > 4 ? null : beardPaint(x, y, z))),
    B([-5, -5, 1], [6, -3, 7], beardPaint),
    B([-8, 2, -4], [-6, 11, 3], beardPaint), B([7, 2, -4], [9, 11, 3], beardPaint),
    B([-6, 2, -7], [7, 12, -4], C.beard),
    // green head wrap: bunched cloth over the crown, a gold band across the brow, the knot at the back
    B([-8, 11, -8], [9, 17, 8], wrap), B([-7, 17, -7], [8, 19, 6], wrap), B([-4, 19, -5], [5, 20, 3], wrap),
    B([-8, 12, 7], [9, 15, 9], (x, y) => (y === 12 ? C.Ad : C.A)), P([-2, 13, 8], [3, 14, 9], C.Al),
    B([-3, 10, -10], [4, 16, -7], C.Gd),
  ];
}

// ---------------------------------------------------------------- Serpent Spear 丈八蛇矛 (weapon joint: shaft +Z)
function weaponGeo() {
  const sv = 0.02;
  const shaft = vox([
    B([-1, -1, -36], [1, 1, 76], (x, y, z) => (((z >> 1) & 1) ? C.shaftH : C.shaft)),
    ...[-33, -10, 20, 50].map((z) => B([-2, -2, z], [2, 2, z + 1], C.A)),
    B([-2, -2, -38], [2, 2, -35], C.A), B([-1, -1, -42], [1, 1, -38], C.Al),
  ], sv, { jitter: 0.04, ao: 0.3 });
  // gold serpent head at 0.012 (z 1.42 … 1.64): ring, head with jaws round the blade, jade eyes, four clawed legs
  const cv = 0.012;
  const serpent = vox([
    B([-3, -3, 118], [3, 3, 122], C.A),
    B([-4, -4, 122], [4, 4, 132], (x, y, z) => ((z + y) % 3 === 0 ? C.Ad : C.A)),
    B([-4, 1, 132], [4, 5, 137], C.A), B([-4, -4, 132], [4, -1, 136], C.Ad),
    B([-5, 2, 128], [-4, 4, 130], C.red), B([4, 2, 128], [5, 4, 130], C.red),
    ...[[124, 1], [124, -1], [129, 1], [129, -1]].flatMap(([z, s]) => [
      B([-1, s > 0 ? 4 : -9, z], [1, s > 0 ? 9 : -4, z + 2], C.A),
      B([-1, s > 0 ? 8 : -11, z + 2], [1, s > 0 ? 11 : -8, z + 4], C.Al),
    ]),
  ], cv, { jitter: 0.05, ao: 0.35 });
  const bv = 0.011, boxes = [];
  const z0 = Math.round(1.62 / bv), z1 = Math.round(2.18 / bv);
  for (let z = z0; z < z1; z++) {
    const u = (z - z0) / (z1 - z0);
    const cy = Math.round(3.2 * Math.sin(u * Math.PI * 3) * (1 - u * 0.5));
    const w = Math.max(1, Math.round(4.5 * (1 - Math.pow(u, 1.6)) + (u < 0.06 ? 2 : 0)));
    boxes.push(B([-1, cy - w, z], [1, cy + w, z + 1], (_, y) => (Math.abs(y - cy + 0.5) < 1 ? C.fuller : Math.abs(y - cy + 0.5) >= w - 1 ? C.edge : C.steel)));
  }
  const blade = vox(boxes, bv, { jitter: 0.03, ao: 0.2 });
  return [{ geo: shaft, mat: 'body' }, { geo: serpent, mat: 'metal' }, { geo: blade, mat: 'blade' }];
}

// ---------------------------------------------------------------- spring-chain segments (local -Y along the chain)
function tieSeg(i, n) {
  const tip = i === n - 1;
  return vox([B([-3, -8, 0], [3, 0, 1], (x, y) => (tip && y <= -6 && Math.abs(x + 0.5) > (y + 9) * 0.8 ? null : x === -3 ? C.Gd : C.G))],
    FV, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.15 });
}
function sashSeg(i, n) {
  const tip = i === n - 1;
  return vox([B([-2, -8, 0], [2, 0, 1], (x, y) => (tip && y <= -7 && x === 1 ? null : x === -2 ? C.sashL : C.sash))],
    FV, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.15 });
}
function panelSeg(w) {
  return (i, n) => {
    const last = i === n - 1;
    return vox([
      B([-w, -12, 0], [w, 0, 1], (x, y) => (last && y <= -10 ? C.emb : x <= -w + 1 || x >= w - 2 ? C.emb : robe(x, y + i * 12, 3))),
      B([-w + 1, -12, -1], [w - 1, 0, 0], C.Gd),
    ], FV, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.2 });
  };
}
function tasselSeg(i, n) {
  const w = i === 0 ? 3 : 2, last = i === n - 1;
  return vox([B([-w, -7, -w], [w, 0, w], (x, y, z) => {
    const h = hash01(x + 9, z + 9, 7);
    if (last && -y > 3 + h * 5) return null;
    if ((x === -w || x === w - 1) && (z === -w || z === w - 1) && i > 0) return null;
    return last && -y > 3 + h * 3 ? C.tasD : h < 0.3 ? C.tasH : h > 0.8 ? C.tasD : C.tas;
  })], 0.014, { jitter: 0.06, ao: 0.25 });
}

// ---------------------------------------------------------------- HUD portrait (20×20 pixels)
const FACE = [
  '.....GGGGGGGGG......',
  '...GGGGGgGGGGGGG....',
  '..GGGGGGGGGGGGGGG...',
  '..AAAAAAAYAAAAAAAG..',
  '..HKKKKSSSSSKKKKHG..',
  '..HSSKKKSSKKKSSSH...',
  '..HKKKKSSSSKKKKSH...',
  '..HSWEESSSSEEWSSH...',
  '..HSSSSSsSSSSSSSH...',
  '..HsSSSsssSSSSSsH...',
  '..HHKKKKKKKKKKKHH...',
  '.HHHKHMTTTTMHKHHH...',
  '.HHHHHHMMMMHHHHHH...',
  '..HHHHHHHHHHHHHH....',
  '...HHHHHHHHHHHH.....',
  '....HHHHHHHHHH......',
  '..AAG..SSSSSS..RR...',
  '.AAAGGGSSkSSSSRRRR..',
  'AAAGGGGSDDDDSSRRRRR.',
  'AAGGGGGSDrrDSSSRRRRR',
];
const PAL = { G: '#3a6a40', g: '#4e8656', A: '#b0903e', Y: '#d4b464', H: '#141012', K: '#141012', S: '#86563a', s: '#603a26',
  W: '#e4dcd0', E: '#0e0a0c', M: '#5a2a20', T: '#e0d8c8', k: '#7e5a3a', D: '#8e9270', r: '#9a3228', R: '#9a3228' };

export default {
  id: 'zhangfei', zh: '張飛', en: 'ZHANG FEI', seal: '燕人', weapon: '丈八蛇矛',
  sub: '燕人張翼德 · 當陽一喝 · 萬夫莫當', copy: '蛇矛一挺<br>喝斷長橋', tagline: '丈八蛇矛，當陽橋頭一聲喝退百萬兵',
  cut: { sub: '燕人 張翼德', seal: '萬夫' },
  lines: {
    open: ['燕人張翼德在此！誰敢來決一死戰？', 'Zhang Yide of Yan is here! Who dares fight me to the death?'],
    musou: ['戰又不戰，退又不退，卻是何故！', 'You neither fight nor flee — what are you waiting for?!'],
  },
  face: FACE, pal: PAL,
  build: () => ({ parts: limbs(torso()), head: head(), hv: HV, bv: FV, pauldrons: pauldronBoxes, weapon: weaponGeo() }),
  chains() {
    const out = [];
    out.push({ joint: 'hips', anchor: [0, -0.1, -0.15], rest: [0, -1, -0.12], n: 5, len: 0.12, stiff: 0.14, drag: 0.2, wind: 0.9, cone: 75, sway: 0.15,
      seg: panelSeg(14), hit: ['hips', ['thighL', 0.03], ['thighR', 0.03], ['kneeL', 0.03], ['kneeR', 0.03]] });
    for (const [x, k] of [[-0.075, 0], [-0.05, 1]]) {
      out.push({ joint: 'hips', anchor: [x, -0.01, 0.17], rest: [k ? 0.15 : -0.1, -1, 0.15], n: 4, len: 0.08, stiff: 0.08, drag: 0.12, wind: 0.8, face: [0, 0, 1], cone: 80, sway: 0.2,
        seg: sashSeg, hit: [['thighL', 0.04], ['thighR', 0.04]] });
    }
    for (const sx of [-1, 1]) {
      out.push({ joint: 'head', anchor: [sx * 1.5 * HV, 13 * HV, -10 * HV], rest: [sx * 0.4, -0.5, -1], n: 5, len: 0.08, stiff: 0.04, drag: 0.07, wind: 2.2, cone: 105, sway: 0.55,
        seg: tieSeg, hit: ['head', ['chest', 0.03]] });
    }
    for (let k = 0; k < 5; k++) {
      const a = k * 1.2566, ox = Math.cos(a) * 0.016, oy = Math.sin(a) * 0.016;
      out.push({ joint: 'weapon', anchor: [ox, oy, 1.41], rest: [ox * 12, oy * 4 - 1, -0.35], n: 3, len: 0.07, stiff: 0.05 + k * 0.004, drag: 0.12, wind: 0.8, cone: 130, sway: 0.15,
        face: [1, 0, 0], seg: tasselSeg });
    }
    return out;
  },
};
