// EXO reskin of guanyu.js: the original officer's body, proportions, rig, moveset and clips unchanged; only the surface, helmet and class identity change.
// 關羽 Guan Yu (after the DW9 design): engraved bronze helmet over a green hood that drapes to the shoulders, long
// black hair, a stern face (heavy brows pressed low, narrow phoenix eyes, straight nose), moustache and a long beard
// that tapers to a point at the belly. Asymmetric armour: one big bronze dragon-head pauldron on the right shoulder
// over a bare right arm, a wide green sleeve on the left. Dark-green robe with gold embroidery and a dark-red crossed
// collar, wide leather belt with bronze plaques, robe panels to the shins (spring chains), baggy trousers, tall boots
// with upturned toes. Weapon: Green Dragon Crescent Blade — green shaft, a gold dragon coiling up it, a gold dragon
// head swallowing a broad curved blade with iron rings through its back.
import { helmetBoxes, FACE as EXO_FACE } from './exo-helmet.js';
import { vox, B, P, md, mirX, lamellar } from '../hero/model.js';
import { hash01 } from '../core/rng.js';
import { shade } from '../core/voxel.js';
import * as MOVESET from './guanyu.moves.js';

const HV = 0.0135;   // head voxel: a 13-voxel face (vs 9 on the base rig) so brows, eyes and nose can carry an expression
const BV = 0.0125;   // body voxel: half the base rig's, for muscle, plate engraving, hands and boots
const C = {
  R: 0x2f6b4c, Rd: 0x1d4a33, Rl: 0x41875f, emb: 0x41875f, embD: 0x1d4a33,   // dark-green robe, gold embroidery
  T: 0x45444f, Td: 0x2f2e38,                                                // dark-red collar / lining
  A: 0xe9d8b6, Ad: 0xb09d74, Al: 0xfbf1d8,                                  // bronze
  L: 0x4a4958, Ld: 0x32313c,                                                // leather
  U: 0x3a3948, boot: 0xdccaa4, bootD: 0xb09d74, sole: 0x32313c,
  skin: 0x4a4958, skinD: 0x32313c, skinH: 0x5e5d6e, eye: 0x100a0a, scl: 0xd8ccc0,
  beard: 0x32313c, beardH: 0x4a4958, hair: 0x32313c, hairH: 0x4a4958,
  hood: 0x2f6b4c, hoodD: 0x1d4a33,
  shaft: 0x32313c, shaftH: 0x4a4958, gold: 0xf0d9a0, goldD: 0xb09050,
  steel: 0xc4ccd6, edge: 0xf2f6fa, steelD: 0x7c8490,
};

// robe cloth: fold streaks plus a sparse gold diamond-scroll embroidery
const robe = (x, y, z) => {
  const a = md(x * 2 + y + z, 18), b = md(x * 2 - y - z, 18);
  if ((a === 0 || b === 0) && hash01(x, y, z) < 0.6) return hash01(z, x, y) < 0.3 ? C.embD : C.emb;
  return md(x + z * 3, 11) === 0 ? C.Rd : md(x * 3 - y, 17) === 0 ? C.Rl : C.R;
};
const beardPaint = (x, y, z) => (md(x, 3) === 0 ? C.beardH : hash01(x, y, z) < 0.15 ? C.beardH : C.beard);   // vertical strands

// ---------------------------------------------------------------- body parts (fine body voxels BV = 0.0125 m)
// Every part is centred on its joint (x and z symmetric about 0); 1 base-rig voxel = 2 of these.
const lap = (x, y) => x + 0.5 - (6 - (20 - y) * 0.8);                  // crossed collar: left of the neck → right flank
function torso() {
  const P_ = {};
  P_.hips = [
    B([-12, -10, -8], [12, 6, 8], C.U),
    B([-14, -12, -10], [14, -2, 10], robe),                           // robe below the belt (the long panels are chains)
    // wide leather belt: stitched edges, bronze plaques with studs, a round buckle with a tiger mask
    B([-15, -2, -11], [15, 6, 11], (x, y, z) => (y === -2 || y === 5 ? C.Ld : md(x + z, 6) === 0 && (y === -1 || y === 4) ? C.Al : C.L)),
    ...[-11, -5, 5, 11].flatMap((x) => [B([x - 2, 0, 11], [x + 2, 4, 12], C.A), P([x - 2, 0, 11], [x + 2, 1, 12], C.Ad), B([x - 1, 1, 12], [x + 1, 3, 13], C.Al)]),
    B([-4, -2, 11], [4, 6, 13], C.A), B([-3, -1, 13], [3, 5, 14], C.Al),
    P([-2, 2, 13], [-1, 3, 14], C.Ad), P([1, 2, 13], [2, 3, 14], C.Ad), P([-1, 0, 13], [1, 1, 14], C.Ad),
  ];
  // waist: narrow, robe over the under-robe
  P_.spine = [
    B([-10, -6, -8], [10, 16, 8], C.U),
    B([-12, -4, -10], [12, 16, 10], robe),
    B([-12, -4, 10], [12, 16, 11], (x, y) => (Math.abs(lap(x, y + 16)) < 2.4 ? C.T : Math.abs(lap(x, y + 16)) < 3.4 ? C.emb : null)),
  ];
  // chest: broad V-taper (shoulders wider than the ribs), robe with the crossed collar and the under-robe above it,
  // dark leather scale over the right breast and shoulder under the pauldron
  P_.chest = [
    B([-13, -4, -10], [13, 18, 10], C.U),
    B([-14, -4, -11], [14, 8, 11], robe),
    B([-16, 8, -12], [16, 20, 12], robe),
    ...lamellar([-16, 4, -12], [-5, 20, 12], { base: C.L, rowH: 3, pw: 5, lipX: false }),
    B([-16, -4, 12], [16, 21, 13], (x, y) => {
      const d = lap(x, y);
      if (Math.abs(d) < 2.4) return C.T;
      if (Math.abs(d) < 3.4) return C.emb;
      return d < 0 && y > 12 && x > -8 ? C.Td : null;
    }),
    B([-8, 16, -8], [8, 22, 8], C.T), B([-7, 17, -7], [7, 23, 7], C.Td),   // standing inner collar
    B([-6, 16, -6], [6, 26, 6], -1),                                   // neck hole
    // the long beard lies on the chest: face-wide under the chin, tapering to a point (the tip is a chain)
    B([-9, -4, 12], [9, 21, 16], (x, y, z) => (Math.abs(x + 0.5) < 2.4 + (y + 4) * 0.25 && (z < 15 || Math.abs(x + 0.5) < 1.5 + (y + 4) * 0.15) ? beardPaint(x, y, z) : null)),
  ];
  P_.neck = [B([-4, -2, -4], [4, 6, 4], C.skinD), P([-4, 2, 3], [4, 6, 4], C.skin)];
  return P_;
}

/** Bare, muscled upper arm: deltoid cap, biceps and triceps bulges, shaded groove, bronze armband near the elbow. */
function bareUpperArm() {
  const sk = (x, y, z) => (z > 2 && y < -6 && y > -18 ? C.skinH : x > 2 || z < -2 ? C.skinD : C.skin);
  return [
    B([-4, -24, -4], [4, 2, 4], sk),
    B([-5, -4, -5], [5, 2, 5], sk),                                    // deltoid
    B([-4, -18, 2], [4, -6, 6], sk),                                   // biceps
    B([-4, -16, -6], [4, -6, -2], C.skinD),                            // triceps
    P([-5, -6, -5], [5, -5, 6], C.skinD),                              // groove under the deltoid
    B([-5, -22, -5], [5, -18, 5], C.A), P([-5, -22, -5], [5, -21, 5], C.Ad), P([-5, -19, -5], [5, -18, 5], C.Al),
  ];
}
function limbs(P_) {
  P_.upperArmR = bareUpperArm();
  P_.upperArmL = [                                                      // wide green sleeve, red lining at the flared end
    B([-6, -24, -6], [6, 2, 6], robe),
    B([-8, -24, -8], [8, -18, 8], robe), P([-8, -24, -8], [8, -22, 8], C.T), P([-8, -22, -8], [8, -21, 8], C.emb),
  ];
  for (const [s, sx] of [['R', -1], ['L', 1]]) {
    // bronze bracer: engraved bands and a raised ridge, over a dark-red wrap; the bare arm shows the forearm above it
    P_['foreArm' + s] = [
      B([-4, -22, -4], [4, 0, 4], s === 'R' ? C.skinD : C.Td),
      B([-5, -20, -5], [5, -4, 5], (x, y, z) => (md(y, 5) === 0 ? C.Ad : md(x - z + y, 7) === 0 ? C.Al : C.A)),
      B([-6, -20, -6], [6, -18, 6], C.Al), B([-6, -6, -6], [6, -4, 6], C.Al),
      B([-1, -18, 5], [1, -6, 6], C.Al),                               // ridge
    ];
    // hand: palm, knuckle row, thumb
    P_['hand' + s] = [
      B([-4, -4, -3], [4, 4, 3], C.skin),
      P([-4, -4, 2], [4, -3, 3], C.skinD), P([-4, -1, 2], [4, 0, 3], C.skinD),
      B([sx * 4 - (sx > 0 ? 0 : 2), -2, -2], [sx * 4 + (sx > 0 ? 2 : 0), 3, 2], C.skin),
    ];
    // baggy green trousers gathered above the boots; the right thigh carries a leather-and-bronze tasset outside
    P_['thigh' + s] = [
      B([-7, -36, -7], [7, 2, 7], (x, y, z) => (md(y + (x + z) % 3, 7) === 0 ? C.Rd : C.R)),
      B([-8, -34, -8], [8, -22, 8], (x, y, z) => (md(y + x, 6) === 0 ? C.Rd : md(x * 2 + z, 9) === 0 ? C.Rl : C.R)),
      ...(s === 'R' ? lamellar([-4, -18, -9], [10, 4, 9], { base: C.L, rowH: 3, pw: 5, trim: C.A, jag: true }).map((b) => mirX(b, sx)) : []),
    ];
    // tall boots: fold creases, a turned-down cuff, bronze ankle band
    P_['shin' + s] = [
      B([-5, -34, -5], [5, 0, 5], (x, y) => (md(y + (x & 1), 7) === 0 ? C.bootD : C.boot)),
      B([-6, -8, -6], [6, 0, 6], (x, y) => (y === -8 ? C.bootD : C.boot)),
      P([-6, -3, -6], [6, -2, 6], C.bootD),
      B([-6, -32, -6], [6, -30, 6], C.A),
      B([-6, 0, -6], [6, 6, 6], C.R),                                  // trouser cuff bunched over the boot top
    ];
    P_['foot' + s] = [
      B([-6, -6, -4], [6, 2, 12], C.boot),
      B([-4, -4, 12], [4, 0, 16], C.boot), B([-3, -3, 16], [3, 1, 18], C.boot), B([-2, -1, 18], [2, 3, 20], C.bootD), B([-1, 2, 19], [1, 4, 21], C.bootD),   // upturned toe
      P([-6, -6, -4], [6, -5, 21], C.sole),
      P([-6, 1, -4], [6, 2, 12], C.bootD),
    ];
  }
  return P_;
}

/** One big bronze dragon-head pauldron, right shoulder only: engraved plate tiers, the dragon's head on the outside
 *  facing forward (snout, fangs, gold eye), mane ridges and horns swept back. */
function pauldronBoxes(sx) {
  if (sx > 0) return [];
  const eng = (base) => (x, y, z) => (md(x + z, 5) === 0 ? C.Ad : md(y * 2 + z, 9) === 0 ? C.Al : base);
  const b = [
    ...lamellar([-8, 6, -10], [6, 14, 10], { base: C.A, rowH: 3, pw: 5 }),
    ...lamellar([-4, -2, -12], [8, 6, 12], { base: C.A, rowH: 3, pw: 5 }),
    ...lamellar([-2, -10, -12], [10, -2, 12], { base: C.A, rowH: 3, pw: 5, trim: C.L, jag: true }),
    B([8, 0, -8], [14, 12, 6], eng(C.A)),                              // head
    B([10, 3, 6], [14, 9, 14], eng(C.A)),                              // snout
    B([10, -1, 6], [14, 2, 12], C.Ad),                                 // lower jaw
    ...[7, 9, 11].map((z) => B([12, 2, z], [14, 3, z + 1], C.edge)),   // fangs
    B([13, 8, 11], [15, 10, 14], C.Al),                                // nostril ridge
    B([14, 8, 1], [15, 11, 5], C.gold), P([14, 9, 2], [15, 10, 4], C.eye),   // eye
    B([8, 10, -11], [12, 14, 5], C.Ad),                                // brow / mane
    ...[-10, -6, -2].map((z) => B([9, 13, z - 1], [11, 16, z + 1], C.Al)),
    B([10, 12, -12], [12, 17, -6], C.Al), B([10, 15, -16], [12, 20, -11], C.Al), B([10, 19, -18], [12, 22, -15], C.Ad),   // horn
  ];
  return b.map((bx) => mirX(bx, sx));
}

// ---------------------------------------------------------------- head (head voxels HV = 0.0125, chin y 0)
function head() { return helmetBoxes({ iv: 0xe9d8b6, ivL: 0xfbf1d8, dark: 0x32313c, frame: 0x4a4958, crest: 0x2f6b4c, crestL: 0x41875f, light: 0xffa020, lightL: 0xffd070 }, { crestH: 5 }); }

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
  const w = Math.max(1, Math.round(4 - i * 1.2)), tip = i === n - 1;
  return vox([B([-w, tip ? -12 : -8, -2], [w, 0, 1], (x, y, z) => (tip && y < -4 && Math.abs(x + 0.5) > (y + 13) * 0.4 ? null : beardPaint(x, y, z)))],
    BV, { off: [0, 0, -0.5], jitter: 0.06, ao: 0.3 });
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
      B([-w, -12, 0], [w, 0, 1], (x, y) => (last && y <= -9 ? (y === -12 && md(x, 2) ? null : y === -10 ? C.embD : C.emb) : x <= -w + 1 || x >= w - 2 ? C.emb : robe(x, y + i * 12, 3))),
      B([-w + 1, -12, -1], [w - 1, 0, 0], C.Td),
    ], BV, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.2 });
  };
}

// ---------------------------------------------------------------- fighting style
// His own moveset (guanyu.moves.js); STYLE keeps the look: projectile / beam colours, the green dragon, the edge lead
// and wide grip of the glaive (hero.js), the charge-hold glow (vfx/charge.js).
const STYLE = {
  trail: { white: [0.72, 0.95, 0.78], blue: [0.05, 0.7, 0.25], hot: [1.2, 1.6, 1.25] },   // weapon trail (vfx.js)
  weight: 1.3,                                                 // impact: camera kick scale (camera.js)
  edgeLead: true, grip: 0.62, charge: [0.4, 1.9, 0.7],
  fx: { proj: [0.25, 1.7, 0.6], core: [1.1, 2.2, 1.3], beam: [0.35, 1.8, 0.7] },
  dragon: { body: [0.03, 0.42, 0.14], scale: [0.06, 0.68, 0.24], belly: [0.5, 0.9, 0.55], fin: [0.5, 1.3, 0.6], whisker: [0.7, 1.5, 0.8] },
  rays: [0.5, 1.25, 0.6],
};

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

export const BASTION = {
  id: 'bastion', zh: 'EXO-02', en: 'BASTION', seal: 'PILOT', weapon: 'POWER GLAIVE', role: 'HEAVY FRONTLINE',
  sub: 'NOTHING GETS PAST', copy: 'NOTHING<br>GETS PAST', tagline: 'Heavy cuts. Hold the gate while the others fall back.',
  cut: { sub: 'BASTION OVERDRIVE', seal: 'OVERDRIVE' },
  lines: { open: ['EXO-02 online.', 'This gate stays closed.'], musou: ['OVERDRIVE', 'Overdrive engaged.'] },
  face: EXO_FACE, pal: {'G': '#e9d8b6', 'g': '#b09d74', 'T': '#32313c', 'w': '#ffa020'}, glow: 1.0, matColor: 0.9, fill: 0.3, rim: 0.35,
  style: STYLE,
  voice: { pitch: 0.8, fk: 0.9, growl: 0.12, gain: 1.05 },   // deep, resonant (audio/bank.js)
  moveset: MOVESET,
  build: () => ({ parts: limbs(torso()), head: head(), hv: HV, bv: BV, pauldrons: pauldronBoxes, weapon: weaponGeo() }),
  chains() {
    const out = [];
    // robe panels, back and front, down to the shins (no shoulder cape)
    out.push({ joint: 'hips', anchor: [0, -0.1, -0.15], rest: [0, -1, -0.12], n: 5, len: 0.13, stiff: 0.14, drag: 0.2, wind: 0.9, cone: 75, sway: 0.15,
      seg: panelSeg(16), hit: ['hips', ['thighL', 0.02], ['thighR', 0.02], ['kneeL', 0.03], ['kneeR', 0.03]] });
    out.push({ joint: 'hips', anchor: [0, -0.12, 0.17], rest: [0, -1, 0.1], n: 5, len: 0.12, stiff: 0.13, drag: 0.18, wind: 0.5, face: [0, 0, 1], cone: 70, sway: 0.1,
      seg: panelSeg(12), hit: [['thighL', 0.03], ['thighR', 0.03], ['kneeL', 0.03], ['kneeR', 0.03]] });
    /* (removed: face/hair/tassel chain) */
    // long hair and the hood's tail falling over the back
    /* (removed: face/hair/tassel chain) */
    /* (removed: face/hair/tassel chain) */
    return out;
  },
};
