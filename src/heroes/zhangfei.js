// 張飛 Zhang Fei: "leopard head, ring eyes, swallow jaw, tiger whiskers" (豹頭環眼 燕頷虎鬚) — a dark weathered face
// with big round eyes and a bristling beard that fans out like wire, black iron helmet with a gold rim and a red
// plume, black lamellar over a navy robe, a tiger-skin skirt and a tiger-head belt. Weapon: the eighteen-span Serpent
// Spear (丈八蛇矛) — a long wavy blade on a black shaft, red tassel.
import { vox, HV, B, P, md, mirX, lamellar } from '../hero/model.js';
import { hash01 } from '../core/rng.js';
import { shade } from '../core/voxel.js';

const C = {
  K: 0x24222a, Kd: 0x16141a, Kl: 0x3a3844,                                  // black iron
  N: 0x274a8c, Nd: 0x1a3262, Nl: 0x3a64b0,                                  // navy robe
  A: 0xc89a40, Ad: 0x8a6424, Al: 0xe6c060,                                  // gold
  T: 0xd08a2a, Td: 0x2a1a10, Tl: 0xf0c070,                                  // tiger skin (amber, black stripes, cream)
  U: 0x2a2224, glove: 0x2a1e1c, sole: 0x1a1414, boot: 0x201a1c, leather: 0x4a3024,
  skin: 0x9a6444, skinD: 0x744630, lip: 0x6a3024, eye: 0x0e0a0c, scl: 0xf0ece4,
  beard: 0x121014, beardH: 0x2e2830,
  shaft: 0x1c1a20, shaftH: 0x2c2a32, band: 0x8a8e9a,
  red: 0xc82a1e, redH: 0xf05a3a, redD: 0x8a1812,
  steel: 0xd0dae6, edge: 0xf6fbff, fuller: 0x8a94a4,
};

const robe = (x, y, z) => (md(x * 2 + y, 7) === 0 ? C.Nd : md(x + z * 3, 11) === 0 ? C.Nl : C.N);
const tiger = (x, y, z) => (md(y + Math.round(Math.sin((x + z) * 0.9) * 1.5), 4) === 0 ? C.Td : md(x * 3 + y, 13) === 0 ? C.Tl : C.T);

// ---------------------------------------------------------------- body parts
function torso() {
  const P_ = {};
  P_.hips = [
    B([-6, -5, -4], [6, 3, 4], C.U),
    B([-7, -7, -5], [7, 1, 5], tiger),                               // tiger-skin skirt
    B([-7, 0, -5], [7, 3, 5], C.leather),
    B([-3, -1, 5], [3, 4, 6], C.A), P([-2, 1, 5], [-1, 2, 6], C.Kd), P([1, 1, 5], [2, 2, 6], C.Kd),   // tiger-head buckle
    B([-1, -1, 6], [1, 1, 7], C.Ad),
  ];
  P_.spine = [
    B([-5, -3, -4], [5, 8, 4], C.U),
    ...lamellar([-6, -2, -5], [6, 7, 5], { base: C.K, rowH: 2, pw: 3 }),
    B([-6, 6, -5], [6, 8, 5], C.N),
  ];
  P_.chest = [
    B([-7, -2, -5], [7, 9, 5], C.U),
    ...lamellar([-7, -2, -5], [7, 9, 5], { base: C.K, rowH: 2, pw: 3 }),
    B([-3, 1, 5], [3, 7, 7], C.Kl), B([-2, 2, 7], [2, 6, 8], C.A), B([-1, 3, 8], [1, 5, 9], C.Nl),   // chest plate, gold mirror
    B([-8, 7, -6], [8, 10, 6], (x, y, z) => (y === 7 ? C.A : robe(x, y, z))),          // navy robe collar over the shoulders
    B([-4, 8, -4], [4, 11, 4], C.Nd),
    B([-3, 8, -3], [3, 13, 3], -1),
  ];
  P_.neck = [B([-2, -1, -2], [2, 3, 2], C.skinD)];
  return P_;
}

function limbs(P_) {
  for (const [s, sx] of [['R', -1], ['L', 1]]) {
    P_['upperArm' + s] = [
      B([-3, -12, -3], [3, 1, 3], robe),
      B([-3, -12, -3], [3, -11, 3], C.A),
    ];
    P_['foreArm' + s] = [
      B([-2, -11, -2], [3, 0, 3], C.Kd),
      ...lamellar([-2, -9, -2], [3, -2, 3], { base: C.K, rowH: 2, trim: C.A }),
      B([-2, -1, -3], [3, 1, 3], C.Kl),
    ];
    P_['hand' + s] = [B([-2, -2, -2], [2, 2, 2], C.glove), B([-2, 1, -2], [2, 2, 2], C.Kd)];
    P_['thigh' + s] = [
      B([-3, -18, -3], [4, 1, 4], (x, y) => (y % 5 === 0 ? C.Nd : C.N)),
      ...lamellar([-2, -9, -4], [5, 2, 5], { base: C.K, rowH: 2, trim: C.A, jag: true }).map((b) => mirX(b, sx, 1)),
    ];
    P_['shin' + s] = [
      B([-2, -17, -2], [3, 0, 3], C.boot),
      ...lamellar([-2, -15, -1], [3, -3, 4], { base: C.K, rowH: 3, pw: 4 }),
      B([-3, -17, -3], [4, -15, 4], (x, y) => (y === -17 ? C.A : C.K)),
      B([-2, -3, 0], [3, 2, 5], C.Kl),
    ];
    P_['foot' + s] = [
      B([-3, -3, -2], [3, 1, 6], C.boot),
      B([-3, -3, 4], [3, -1, 7], C.Kl),
      P([-3, -3, -2], [3, -2, 7], C.sole),
      B([-3, 0, -3], [3, 1, 3], C.A),
    ];
  }
  return P_;
}

/** Heavy black pauldron: three iron tiers, gold rim, round gold stud. */
function pauldronBoxes(sx) {
  const b = [
    ...lamellar([-4, 2, -4], [2, 5, 4], { base: C.K, rowH: 3 }),
    ...lamellar([-2, -1, -5], [3, 2, 5], { base: C.K, rowH: 3 }),
    ...lamellar([-1, -4, -5], [4, -1, 5], { base: C.K, rowH: 3, trim: C.A, jag: true }),
    B([3, 0, -2], [5, 3, 2], C.A), B([5, 1, -1], [6, 2, 1], C.Al),
    B([2, 4, -3], [4, 6, 3], C.Kl), B([3, 6, -3], [5, 7, 3], C.A),
  ];
  return b.map((bx) => mirX(bx, sx));
}

function head() {
  // bristling "tiger whiskers": wire-like strands that fan out from the jaw and cheeks (jagged, gaps between tufts)
  const bristle = (x, y, z) => (hash01(x, y, z) < 0.18 ? null : md(x * 3 + z + y, 5) === 0 ? C.beardH : C.beard);
  return [
    B([-3, 0, -2], [4, 2, 5], C.skin),
    B([-4, 2, -4], [5, 10, 5], C.skin),
    B([-5, 5, -1], [6, 8, 1], C.skinD),
    B([-5, 3, -6], [6, 10, -2], C.beard),
    // helmet: black iron bowl with a gold rim, cheek guards, a gold ridge and a spike carrying the red plume (chain)
    B([-6, 9, -7], [7, 14, 6], (x, y, z) => (y === 9 ? C.A : md(x + z, 5) === 0 ? C.Kl : C.K)),
    B([-5, 14, -6], [6, 16, 5], C.K),
    B([-1, 13, -7], [2, 17, 7], C.A),                                  // ridge
    B([-1, 16, -2], [2, 19, 1], C.A),                                  // plume spike
    B([-7, 3, -4], [-5, 10, 2], C.K), B([6, 3, -4], [8, 10, 2], C.K),  // cheek guards
    P([-7, 3, -4], [-5, 4, 2], C.A), P([6, 3, -4], [8, 4, 2], C.A),
    B([-2, 9, 6], [3, 11, 7], C.A),                                    // brow plate
    // big round "ring eyes": white 3×3 with a dark 1×1 centre, thick brows sweeping up, a broad nose
    P([-4, 4, 4], [-1, 7, 5], C.scl), P([1, 4, 4], [4, 7, 5], C.scl),
    P([-3, 5, 4], [-2, 6, 5], C.eye), P([2, 5, 4], [3, 6, 5], C.eye),
    B([-5, 7, 5], [0, 9, 6], (x, y) => (y === 8 && x === -1 ? null : C.beard)), B([1, 7, 5], [6, 9, 6], (x, y) => (y === 8 && x === 1 ? null : C.beard)),
    B([-1, 2, 5], [2, 4, 6], C.skinD),
    // beard: swallow-jaw mass under the chin plus whiskers spiking out sideways and forward
    B([-4, -3, 1], [5, 3, 6], (x, y, z) => (y >= 2 && Math.abs(x) < 2 ? (y === 2 ? C.lip : null) : bristle(x, y, z))),
    B([-5, -4, 0], [6, -1, 7], bristle),
    B([-7, 0, 1], [-4, 4, 5], bristle), B([5, 0, 1], [8, 4, 5], bristle),
    B([-9, 1, 2], [-7, 3, 4], bristle), B([8, 1, 2], [10, 3, 4], bristle),
    B([-11, 2, 3], [-9, 3, 4], C.beard), B([10, 2, 3], [12, 3, 4], C.beard),              // whisker spikes flaring out
    B([-10, -1, 2], [-7, 0, 4], C.beard), B([8, -1, 2], [11, 0, 4], C.beard),
    B([-3, -6, 2], [4, -4, 8], bristle), B([-1, -8, 3], [2, -6, 8], bristle), B([-5, -5, 5], [-3, -3, 8], bristle), B([4, -5, 5], [6, -3, 8], bristle),
  ];
}

// ---------------------------------------------------------------- Serpent Spear 丈八蛇矛 (weapon joint: shaft +Z)
function weaponGeo() {
  const sv = 0.02;
  const shaft = vox([
    B([-1, -1, -36], [1, 1, 76], (x, y, z) => (((z + 36) % 15) === 0 ? C.band : ((z >> 1) & 1) ? C.shaftH : C.shaft)),
    ...Array.from({ length: 7 }, (_, i) => B([-2, -2, -33 + i * 15], [2, 2, -32 + i * 15], C.band)),
    B([-2, -2, -38], [2, 2, -35], C.band),
    B([-1, -1, -42], [1, 1, -38], C.band),
  ], sv, { jitter: 0.04, ao: 0.3 });
  const cv = 0.012;
  const collar = vox([
    B([-3, -3, 120], [3, 3, 124], C.Kl),
    B([-4, -4, 124], [4, 4, 132], (x, y, z) => ((z + y) % 3 === 0 ? shade(C.A, 0.8) : C.A)),
    B([-4, -5, 115], [4, 4, 120], (x, y, z) => (hash01(x, y, z) < 0.25 ? null : hash01(y, z, x) < 0.3 ? C.redH : C.red)),
  ], cv, { jitter: 0.05, ao: 0.35 });
  // wavy serpent blade in the shaft's YZ plane: the centre line snakes (three bends), the width tapers to the point
  const bv = 0.011, boxes = [];
  const z0 = Math.round(1.59 / bv), z1 = Math.round(2.16 / bv);
  for (let z = z0; z < z1; z++) {
    const u = (z - z0) / (z1 - z0);
    const cy = Math.round(3.2 * Math.sin(u * Math.PI * 3) * (1 - u * 0.5));
    const w = Math.max(1, Math.round(4.5 * (1 - Math.pow(u, 1.6)) + (u < 0.06 ? 2 : 0)));
    boxes.push(B([-1, cy - w, z], [1, cy + w, z + 1], (_, y) => (Math.abs(y - cy + 0.5) < 1 ? C.fuller : Math.abs(y - cy + 0.5) >= w - 1 ? C.edge : C.steel)));
  }
  const blade = vox(boxes, bv, { jitter: 0.03, ao: 0.2 });
  return [{ geo: shaft, mat: 'body' }, { geo: collar, mat: 'metal' }, { geo: blade, mat: 'blade' }];
}

// ---------------------------------------------------------------- spring-chain segments (local -Y along the chain)
function plumeSeg(i, n) {
  const w = Math.max(1, 3 - i), tip = i === n - 1;
  return vox([B([-w, tip ? -6 : -4, -w], [w, 0, w], (x, y, z) => {
    const h = hash01(x + i * 5, y + 30, z);
    if (tip && y < -3 && h < 0.5) return null;
    return h < 0.3 ? C.redH : h > 0.8 ? C.redD : C.red;
  })], HV, { jitter: 0.06, ao: 0.25 });
}
function capeSeg(i, n) {
  const w = Math.round(6 + (i * 2.5) / (n - 1)), last = i === n - 1;
  const paint = (x, y) => {
    if (last && y === -7 && hash01(x, i, 3) < 0.45) return null;
    if (last && (y === -5 || y === -4)) return y === -5 ? C.A : C.redD;
    return x === -w || x === w - 1 ? C.Nd : md(x + 40, 5) === 0 ? C.Nd : C.N;
  };
  const curl = (x) => x === -w || x === w - 1 || (i >= 3 && (x === -w + 1 || x === w - 2));
  return vox([
    B([-w, -7, 0], [w, 0, 1], (x, y) => (curl(x) ? null : paint(x, y))),
    B([-w, -7, -1], [w, 0, 0], (x, y) => (curl(x) ? paint(x, y) : null)),
  ], 0.025, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.18 });
}
function apronSeg(i, n) {
  const last = i === n - 1;
  return vox([B([-4, -5, 0], [4, 0, 1], (x, y) => (last && y === -5 ? (x % 2 ? null : C.Td) : tiger(x, y + i * 5, 1)))],
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
  '.........rr.........',
  '........rRRr........',
  '.........AA.........',
  '.....KKKKAAKKKK.....',
  '....KKKKKAAKKKKKK...',
  '...KKKKKKKKKKKKKKK..',
  '...KAAAAAAAAAAAAAK..',
  '...KBBBSSSSSSBBBBK..',
  '...KSWWWSSSSWWWSSK..',
  '...KSWEWSSSSWEWSSK..',
  '...KSWWWSsSSWWWSSK..',
  '..HKSSSSsssSSSSSKH..',
  '.HHHSSSSSSSSSSSSHHH.',
  'H.HHHHSSMMMSSHHHHH.H',
  '..HHHHHHHHHHHHHHHH..',
  '.H.HHHHHHHHHHHHHH.H.',
  '...NNHHHHHHHHHHNN...',
  '.NNNKKNHHHHHHNKKNNN.',
  'NNKKKKKNHHHHNKKKKKNN',
  'NKKAKKKKNHHNKKKKAKKN',
];
const PAL = { r: '#e03a2a', R: '#ff6a4a', A: '#d8a848', K: '#1f1d24', B: '#0e0a0c', S: '#9a6444', s: '#744630', W: '#f0ece4',
  E: '#0e0a0c', H: '#141016', M: '#6a3024', N: '#26345a' };

export default {
  id: 'zhangfei', zh: '張飛', en: 'ZHANG FEI', seal: '燕人', weapon: '丈八蛇矛',
  sub: '燕人張翼德 · 當陽一喝 · 萬夫莫當', copy: '蛇矛一挺<br>喝斷長橋', tagline: '丈八蛇矛，當陽橋頭一聲喝退百萬兵',
  cut: { sub: '燕人 張翼德', seal: '萬夫' },
  lines: {
    open: ['燕人張翼德在此！誰敢來決一死戰？', 'Zhang Yide of Yan is here! Who dares fight me to the death?'],
    musou: ['戰又不戰，退又不退，卻是何故！', 'You neither fight nor flee — what are you waiting for?!'],
  },
  face: FACE, pal: PAL,
  build: () => ({ parts: limbs(torso()), head: head(), pauldrons: pauldronBoxes, weapon: weaponGeo() }),
  chains() {
    const out = [];
    out.push({ joint: 'chest', anchor: [0, 0.255, -0.17], rest: [0, -1, 0.15], n: 6, len: 0.17, stiff: 0.16, drag: 0.22, wind: 1.1, cone: 80, sway: 0.2,
      seg: capeSeg, hit: ['chest', 'hips', 'thighL', 'thighR', 'kneeL', 'kneeR'] });
    out.push({ joint: 'hips', anchor: [0, -0.08, 0.19], rest: [0, -1, 0.1], n: 3, len: 0.12, stiff: 0.12, drag: 0.14, wind: 0.4, face: [0, 0, 1], cone: 70, sway: 0.08,
      seg: apronSeg, hit: [['thighL', 0.02], ['thighR', 0.02], ['kneeL', 0.02], ['kneeR', 0.02]] });
    // red plume from the helmet spike: a short bushy chain that bounces and streams back
    out.push({ joint: 'head', anchor: [0, 19 * HV, -0.5 * HV], rest: [0, 0.3, -1], n: 4, len: 0.065, stiff: 0.08, drag: 0.12, wind: 1.6, cone: 110, sway: 0.4,
      seg: plumeSeg, hit: ['head'] });
    for (let k = 0; k < 5; k++) {
      const a = k * 1.2566, ox = Math.cos(a) * 0.016, oy = Math.sin(a) * 0.016;
      out.push({ joint: 'weapon', anchor: [ox, oy, 1.41], rest: [ox * 12, oy * 4 - 1, -0.35], n: 3, len: 0.07, stiff: 0.05 + k * 0.004, drag: 0.12, wind: 0.8, cone: 130, sway: 0.15,
        face: [1, 0, 0], seg: tasselSeg });
    }
    return out;
  },
};
