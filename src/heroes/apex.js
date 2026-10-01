// EXO reskin of lubu.js: the original officer's body, proportions, rig, moveset and clips unchanged; only the surface, helmet and class identity change.
// 呂布 Lü Bu (after the DW9 design): a wild black mane under a gold tiara, two very long red pheasant feathers (spring
// chains), a hard handsome face. Sculpted gold muscle cuirass (pectorals, segmented abs) with a dark-red high collar,
// black sleeves embroidered in gold, black pauldrons with gold rims sweeping up, gold bracers; a gold belt with a beast
// medallion, big flaring gold-scale tassets, a long black front apron with a gold trident motif, black trousers with
// purple knee bands, gold greaves; a long red cape. Weapon: the Sky Piercer — a long spear point, one great crescent
// blade with spurs and a small hook opposite, a red gem where they meet, red tassel.
import { helmetBoxes, FACE as EXO_FACE } from './exo-helmet.js';
import { vox, B, P, md, mirX, lamellar } from '../hero/model.js';
import { hash01 } from '../core/rng.js';
import { shade } from '../core/voxel.js';
import * as MOVESET from './lubu.moves.js';
import { FV, glove, bracer, symH } from './parts.js';

const HV = 0.0135;
const C = {
  A: 0xc99a3a, Ad: 0x8a6a22, Al: 0xf0cf7a,                                  // dark gold
  K: 0x2f2e38, Kd: 0x24232b, Kl: 0x4a4958, Kg: 0x4a4958,                    // black cloth, gold thread
  R: 0xb02a2a, Rd: 0x6a1a1a, Rl: 0xd04040, purple: 0x32313c,
  skin: 0x4a4958, skinD: 0x32313c, skinH: 0x5e5d6e, lip: 0x32313c, eye: 0x100a0c, iris: 0x3a1a14, scl: 0xe0d6cc,
  hair: 0x24232b, hairH: 0x3c3b48,
  feather: 0xb02a2a, featherL: 0xd04040, featherD: 0x6a1a1a,
  shaft: 0x24232b, shaftH: 0x3c3b48, steel: 0xdbe6f5, edge: 0xf6fbff, steelD: 0x8fa0b8, gem: 0xff3a20, gemL: 0xff8a60,
  tas: 0xd83a28, tasH: 0xff6a50, tasD: 0x8a1812,
};
const cloth = (x, y, z) => (md(x * 3 + y * 2 + z, 17) === 0 && hash01(x, y, z) < 0.7 ? C.Kg : md(x + z * 3, 11) === 0 ? C.Kd : C.K);

// ---------------------------------------------------------------- body parts (fine voxels, centred on the joints)
function torso() {
  const P_ = {};
  P_.hips = [
    B([-12, -10, -8], [12, 6, 8], C.K),
    B([-14, -12, -10], [14, -2, 10], cloth),
    B([-15, -2, -11], [15, 6, 11], (x, y) => (y === -2 || y === 5 ? C.Ad : md(x, 6) === 0 ? C.Al : C.A)),   // gold belt
    // beast medallion: round gold face, red eyes, fangs
    B([-5, -3, 11], [5, 7, 13], (x, y) => (Math.hypot(x + 0.5, y - 2) < 4.6 ? C.Al : null)),
    B([-3, -1, 13], [3, 5, 14], C.A), P([-3, 3, 13], [-1, 4, 14], C.gem), P([1, 3, 13], [3, 4, 14], C.gem),
    P([-2, 0, 13], [2, 1, 14], C.Ad), B([-2, -2, 13], [-1, 0, 14], C.steel), B([1, -2, 13], [2, 0, 14], C.steel),
  ];
  // waist: segmented gold abdominal plates, black sides
  P_.spine = [
    B([-10, -6, -8], [10, 16, 8], C.K),
    B([-11, -4, -9], [11, 16, 9], cloth),
    ...[[-3, 1], [2, 6], [7, 11], [12, 15]].flatMap(([y0, y1]) => [
      B([-9, y0, 9], [-1, y1, 11], C.A), B([1, y0, 9], [9, y1, 11], C.A),
      P([-9, y1 - 1, 10], [-1, y1, 11], C.Al), P([1, y1 - 1, 10], [9, y1, 11], C.Al),
    ]),
    B([-1, -4, 9], [1, 16, 10], C.Ad),
  ];
  // chest: gold muscle cuirass — two pectoral masses with highlights on top and a deep groove between, collarbone
  // ridge, gold back plate; black sleeves' shoulder caps; dark-red high collar with a gold rim
  const pec = (x, y, z) => (z >= 14 && y > 13 ? C.Al : y < 9 ? C.Ad : Math.abs(x + 0.5) > 10 ? C.Ad : C.A);   // lit top, shaded underside and flanks
  P_.chest = [
    B([-14, -4, -11], [14, 19, 11], cloth),
    B([-13, -4, 11], [13, 18, 12], C.A),
    B([-12, 6, 12], [-1, 18, 15], pec), B([1, 6, 12], [12, 18, 15], pec),
    B([-11, 9, 15], [-2, 17, 16], pec), B([2, 9, 15], [11, 17, 16], pec),
    P([-12, 6, 14], [-1, 7, 15], C.Ad), P([1, 6, 14], [12, 7, 15], C.Ad),
    B([-1, 0, 11], [1, 19, 13], C.Ad),
    B([-12, 18, 10], [12, 20, 13], C.Al),                              // collarbone ridge
    B([-13, -2, -13], [13, 18, -11], C.A), P([-13, 17, -13], [13, 18, -11], C.Al),
    B([-8, 16, -8], [8, 24, 8], C.R), P([-8, 23, -8], [8, 24, 8], C.A), P([-8, 16, 7], [8, 24, 8], C.Rd),
    B([-6, 16, -6], [6, 26, 6], -1),
  ];
  P_.neck = [B([-4, -2, -4], [4, 6, 4], C.skinD), P([-4, 2, 3], [4, 6, 4], C.skin)];
  return P_;
}

function limbs(P_) {
  for (const [s, sx] of [['R', -1], ['L', 1]]) {
    P_['upperArm' + s] = [B([-5, -24, -5], [5, 2, 5], cloth), B([-6, -24, -6], [6, -21, 6], C.Kd), P([-6, -21, -6], [6, -20, 6], C.purple)];
    P_['foreArm' + s] = bracer(C.K, [C.A, C.Ad, C.Al]);
    P_['hand' + s] = glove(sx, C.K, C.Kl);
    // black trousers with gold thread; great gold-scale tasset flaring out over the outside and front of the thigh
    const scaleG = (x, y) => (md(y, 3) === 0 ? C.Ad : md(x + (Math.floor(y / 3) & 1) * 2, 4) === 0 ? C.Ad : C.A);
    P_['thigh' + s] = [
      B([-8, -36, -8], [8, 2, 8], cloth),
      B([-9, -32, -9], [9, -22, 9], cloth),
      ...[
        B([6, -18, -10], [10, 4, 10], scaleG), B([9, -20, -11], [12, -6, 11], scaleG),   // flaring outward toward the hem
        P([6, -18, -10], [12, -17, 11], C.K), P([11, -20, -11], [12, -6, 11], C.K),
        B([-6, -12, 8], [7, 4, 11], scaleG), P([-6, -12, 8], [7, -11, 11], C.K),
      ].map((b) => mirX(b, sx)),
    ];
    // purple knee band, gold greave with a black centre stripe, pointed gold-black boots
    P_['shin' + s] = [
      B([-6, -34, -6], [6, 0, 6], C.K),
      B([-7, -2, -7], [7, 2, 7], C.purple),
      B([-7, -32, -2], [7, -4, 8], (x, y) => (Math.abs(x + 0.5) < 1.5 ? C.K : y === -5 || Math.abs(x + 0.5) > 6 ? C.Al : C.A)),
      B([-7, -34, -7], [7, -31, 7], C.Ad),
    ];
    P_['foot' + s] = [
      B([-6, -6, -4], [6, 2, 12], C.K),
      B([-5, -6, 12], [5, 0, 16], C.A), B([-3, -6, 16], [3, -2, 19], C.Al),
      P([-6, 1, -4], [6, 2, 12], C.A), P([-6, -6, -4], [6, -5, 19], C.Kd),
    ];
  }
  return P_;
}

/** Black pauldron with gold rims, three tiers sweeping up and out to a pointed wing. */
function pauldronBoxes(sx) {
  const rim = (y0) => (x, y, z) => (y === y0 || Math.abs(z) >= 9 ? C.Al : C.K);
  const b = [
    B([-6, 4, -10], [6, 8, 10], rim(4)),
    B([-2, 0, -11], [9, 4, 11], rim(0)),
    B([2, -5, -11], [12, 0, 11], rim(-5)), P([11, -5, -11], [12, 0, 11], C.Al),
    B([6, 6, -8], [10, 10, 8], C.K), B([9, 9, -7], [12, 13, 7], C.Al), B([11, 12, -4], [13, 16, 4], C.A),   // swept wing
  ];
  return b.map((bx) => mirX(bx, sx));
}

// ---------------------------------------------------------------- head (head voxels, chin y 0)
function head() { return helmetBoxes({ iv: 0x3c3b48, ivL: 0x56556a, dark: 0x1e1d25, frame: 0x2c2b34, crest: 0xc99a3a, crestL: 0xf0cf7a, light: 0xff3a20, lightL: 0xff8a60 }, { fin: true, crestH: 5 }); }

// ---------------------------------------------------------------- Sky Piercer 方天畫戟 (weapon joint: shaft +Z)
function weaponGeo() {
  const sv = 0.02;
  const shaft = vox([
    B([-1, -1, -36], [1, 1, 76], (x, y, z) => (((z >> 1) & 1) ? C.shaftH : C.shaft)),
    ...[-33, -12, 16].map((z) => B([-2, -2, z], [2, 2, z + 1], C.A)),
    ...Array.from({ length: 16 }, (_, i) => B([-2, -2, 52 + i], [2, 2, 53 + i], i % 3 === 2 ? C.Ad : C.A)),   // gold wrap under the head
    B([-2, -2, -38], [2, 2, -35], C.A), B([-1, -1, -42], [1, 1, -38], C.Al),
  ], sv, { jitter: 0.04, ao: 0.3 });
  const cv = 0.012;
  const collar = vox([
    B([-3, -3, 118], [3, 3, 124], C.A),
    B([-4, -4, 124], [4, 4, 136], (x, y, z) => ((z + y) % 3 === 0 ? C.Ad : C.A)),
  ], cv, { jitter: 0.05, ao: 0.35 });
  // spear point on the axis, the great crescent on +y (horns forward and back, spurs on its outer edge), a small hook
  // on −y, a red gem in a gold boss where they meet — all flat in X
  const bv = 0.011, boxes = [];
  const z0 = Math.round(1.62 / bv), z1 = Math.round(2.14 / bv);
  for (let z = z0; z < z1; z++) {
    const u = (z - z0) / (z1 - z0);
    const w = Math.max(1, Math.round(4 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.2 + 0.08)), 0.7) * (1 - u * 0.4)));
    boxes.push(B([-1, -w, z], [1, w, z + 1], (_, y) => (Math.abs(y + 0.5) < 1 ? C.steelD : Math.abs(y + 0.5) >= w - 1 ? C.edge : C.steel)));
  }
  const cz = Math.round(1.7 / bv), R = 15, r0 = 10, c = 3 + R;
  for (let dz = -R + 1; dz < R; dz++) {
    const lo = Math.round(c - Math.sqrt(R * R - dz * dz)), hi = Math.round(c - Math.sqrt(Math.max(0, r0 * r0 - dz * dz)));
    if (hi <= lo) continue;
    const spur = md(dz + 20, 7) === 0 && Math.abs(dz) < 11 ? 2 : 0;
    boxes.push(B([-1, lo - spur, cz + dz], [1, hi, cz + dz + 1], (_, y) => (y >= hi - 1 && Math.abs(dz) < r0 ? C.edge : y < lo ? C.steelD : C.steel)));
  }
  for (let dz = -3; dz <= 5; dz++) { const d = Math.round(3 + (dz + 3) * 0.7); boxes.push(B([-1, -3 - d, cz + dz], [1, -3, cz + dz + 1], C.steel)); }   // hook
  boxes.push(B([-2, -4, cz - 3], [2, 4, cz + 4], C.A), B([-3, -2, cz - 1], [3, 2, cz + 2], C.gem), B([-3, -1, cz], [3, 0, cz + 1], C.gemL));
  const blade = vox(boxes, bv, { jitter: 0.03, ao: 0.2 });
  return [{ geo: shaft, mat: 'body' }, { geo: collar, mat: 'metal' }, { geo: blade, mat: 'blade' }];
}

// ---------------------------------------------------------------- spring-chain segments (local -Y along the chain)
function featherSeg(i, n) {
  // long red pheasant feather: quill line, barbs fraying at the edges, darker toward the tip
  const w = i < 2 ? 2 : i < n - 3 ? 4 : i < n - 1 ? 3 : 2, tip = i === n - 1;
  return vox([B([-w, tip ? -10 : -8, 0], [w, 0, 1], (x, y) => {
    if (tip && y < -4 && Math.abs(x + 0.5) > (y + 11) * 0.4) return null;
    if (Math.abs(x + 0.5) >= w - 0.5 && hash01(x, y, i) < 0.45) return null;   // barbs fraying at the edges
    if (x === -1) return C.Rd;                                         // quill
    return i > n - 2 ? C.featherD : x === 0 || x === -2 ? C.featherL : C.feather;
  })], FV, { off: [0, 0, -0.5], jitter: 0.05, ao: 0.15 });
}
function hairSeg(i, n) {
  const w = Math.max(3, Math.round(7 - (i * 3) / (n - 1))), tip = i === n - 1;
  return vox([B([-w, -6, -2], [w, 0, 2], (x, y, z) => {
    if (i >= n - 2 && md(x, 2) === 0 && y < -2) return null;
    if (tip && hash01(x, y, z) < 0.4) return null;
    return md(x * 2 + i + z, 5) === 0 ? C.hairH : C.hair;
  })], FV, { off: [0, 0, -0.5], jitter: 0.05, ao: 0.25 });
}
function capeSeg(i, n) {
  const w = Math.round(14 + i * 1.8), last = i === n - 1;
  return vox([
    B([-w, -14, 0], [w, 0, 1], (x, y) => (last && y < -12 + 3 * hash01(x, i, 3) ? null : last && y < -9 ? C.A : x <= -w + 1 || x >= w - 2 ? C.Rd : md(x + 40, 7) === 0 ? C.Rd : C.R)),
    B([-w + 1, -14, -1], [w - 1, 0, 0], (x, y) => (last && y < -12 + 3 * hash01(x, i, 3) ? null : C.Rd)),
  ], FV, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.18 });
}
function apronSeg(i, n) {
  // long black apron with a gold trident motif and gold edges
  const last = i === n - 1;
  return vox([B([-7, -12, 0], [7, 0, 1], (x, y) => {
    if (x <= -6 || x >= 5 || (last && y <= -10)) return C.A;
    const X = Math.abs(x + 0.5), Y = y + i * 12;
    if (i < 3 && (X < 1 || (X > 2.5 && X < 3.5 && Y > -18) || (Y === -18 && X < 4))) return C.Kg;
    return C.K;
  }), B([-6, -12, -1], [6, 0, 0], C.Kd)], FV, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.2 });
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

// ---------------------------------------------------------------- fighting style
// His own moveset (lubu.moves.js); STYLE keeps the look: crimson crescents, the red dragon, the edge lead and grip of
// the halberd, the charge-hold glow.
const STYLE = {
  trail: { white: [0.98, 0.72, 0.68], blue: [0.9, 0.08, 0.06], hot: [1.6, 1.15, 1.05] },   // weapon trail (vfx.js)
  weight: 1.2,                                                 // impact: camera kick scale (camera.js)
  edgeLead: true, grip: 0.55, charge: [2.2, 0.5, 0.3],
  fx: { proj: [2.2, 0.35, 0.25], core: [2.4, 1.2, 0.8], beam: [2.2, 0.5, 0.3] },
  dragon: { body: [0.55, 0.03, 0.04], scale: [0.85, 0.08, 0.08], belly: [1.0, 0.5, 0.4], fin: [1.5, 0.35, 0.25], whisker: [1.5, 0.5, 0.4] },
  rays: [1.3, 0.4, 0.3],
};

// ---------------------------------------------------------------- HUD portrait (20×20 pixels)
const FACE = [
  '.ff..............ff.',
  '..ff....AAAA....ff..',
  '...ff..AArrAA..ff...',
  '....HHAAAAAAAAHH....',
  '...HHHHHHHHHHHHHH...',
  '..HHHHSHHSHHSHHHHH..',
  '..HHKKKSSSSSSKKKHH..',
  '.HHHSSKKSSSSKKSSHHH.',
  '.HHHSwEISSSSIEwSHHH.',
  '.HHHSSSSSSSSSSSSHHH.',
  '.HHHShSSSsSSSShSHHH.',
  '.HHHSSSSSsSSSSSSHHH.',
  '.HHHsSSSSSSSSSSsHHH.',
  '..HHHsSSSMMSSSsHHH..',
  '..HHH.ssSSSSss.HHH..',
  '..HHH..RRRRRR..HHH..',
  '...KKKKRRRRRRKKKK...',
  '.KKAAAAKRRRRKAAAAKK.',
  'KKAAAAAAKAAKAAAAAAKK',
  'KAAaAAAAAAAAAAAaAAAK',
];
const PAL = { f: '#b02a22', A: '#8c6e36', r: '#d01818', H: '#121014', S: '#e2b28e', s: '#ba8668', h: '#f0c8a6', K: '#1e1c22', E: '#100a0c',
  I: '#3a1a14', w: '#e0d6cc', M: '#a86a58', R: '#8a1e18', a: '#c8a458' };

export const APEX = {
  id: 'apex', zh: 'EXO-04', en: 'APEX', seal: 'PILOT', weapon: 'WAR HALBERD', role: 'PEERLESS CHAMPION',
  sub: 'NO ONE STANDS ABOVE', copy: 'NO ONE<br>STANDS ABOVE', tagline: 'One halberd. One sweep. The whole field.',
  cut: { sub: 'APEX OVERDRIVE', seal: 'OVERDRIVE' },
  lines: { open: ['EXO-04 online.', 'Stand in my way. See what happens.'], musou: ['OVERDRIVE', 'Overdrive engaged.'] },
  face: EXO_FACE, pal: {'G': '#3c3b48', 'g': '#56556a', 'T': '#1e1d25', 'w': '#ff3a20'}, glow: 1.0, matColor: 0.9, fill: 0.3, rim: 0.35,
  style: STYLE,
  voice: { pitch: 0.84, fk: 0.92, growl: 0.2, gain: 1.1 },   // low, imperious
  moveset: MOVESET,
  build: () => ({ parts: limbs(torso()), head: head(), hv: HV, bv: FV, pauldrons: pauldronBoxes, weapon: weaponGeo() }),
  chains() {
    const out = [];
    out.push({ joint: 'chest', anchor: [0, 0.24, -0.17], rest: [0, -1, 0.15], n: 7, len: 0.18, stiff: 0.16, drag: 0.22, wind: 1.2, cone: 80, sway: 0.22,
      seg: capeSeg, hit: ['chest', 'hips', 'thighL', 'thighR', 'kneeL', 'kneeR'] });
    out.push({ joint: 'hips', anchor: [0, -0.1, 0.17], rest: [0, -1, 0.1], n: 5, len: 0.13, stiff: 0.13, drag: 0.18, wind: 0.5, face: [0, 0, 1], cone: 70, sway: 0.1,
      seg: apronSeg, hit: [['thighL', 0.04], ['thighR', 0.04], ['kneeL', 0.04], ['kneeR', 0.04]] });
    /* (removed: face/hair/tassel chain) */
    // 雉雞翎: two very long feathers rising from the crest, arcing out and back
    for (const sx of [-1, 1]) {
      /* (removed: face/hair/tassel chain) */
    }
    for (let k = 0; k < 5; k++) {
      const a = k * 1.2566, ox = Math.cos(a) * 0.016, oy = Math.sin(a) * 0.016;
      /* (removed: face/hair/tassel chain) */
    }
    return out;
  },
};
