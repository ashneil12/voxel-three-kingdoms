// 呂布 Lü Bu: purple-gold crown (束髮紫金冠) with two long pheasant tail feathers (雉雞翎) as spring chains, black-gold
// beast-face armour (獸面吞頭連環鎧) over a red brocade robe (西川紅錦百花袍), gold lion belt, beast-head pauldrons and a
// long red cape. Weapon: the Sky Piercer (方天畫戟) — a long spear point flanked by two crescent blades, red tassel.
import { vox, HV, B, P, md, mirX, lamellar } from '../hero/model.js';
import { hash01 } from '../core/rng.js';
import { shade } from '../core/voxel.js';

const C = {
  K: 0x26222a, Kd: 0x17141a, Kl: 0x3c3642,                                  // black armour
  A: 0xd4a84c, Ad: 0x8f6a26, Al: 0xf0cc70,                                  // gold
  R: 0xb0241c, Rd: 0x7a1510, Rl: 0xd8463a, Rp: 0xe8a040,                    // red brocade + flower pattern
  U: 0x2e2226, purple: 0x6a2e8a, purpleL: 0xa25cc8,
  glove: 0x2a1e1c, sole: 0x1a1414, boot: 0x241c1e,
  skin: 0xf0c8a4, skinD: 0xd49c80, lip: 0xb86a5a, eye: 0x120c10, iris: 0x5a1a14, scl: 0xe0d6cc,
  hair: 0x141018, hairH: 0x34283a, hairT: 0x221a28,
  shaft: 0x2a1414, shaftH: 0x401c1a, band: 0xd4a84c,
  red: 0xd0281c, redH: 0xff5a3a, redD: 0x8a1410,
  steel: 0xd8e2ec, edge: 0xf6fbff, fuller: 0x8f9aa8,
  fA: 0x8a5a2a, fB: 0xe8dcc0, fC: 0x2a1c14,                                 // pheasant feather bars
};

const brocade = (x, y, z) => (md(x * 3 + y * 5 + z, 13) === 0 ? C.Rp : md(x + y * 2, 7) === 0 ? C.Rd : md(x - z, 9) === 0 ? C.Rl : C.R);

// ---------------------------------------------------------------- body parts
/** Gold beast face (吞頭) on a front plate, z = front layer: brow ridge, glaring eyes, snout, fangs. x centred on cx. */
function beastFace(cx, y0, z) {
  return [
    B([cx - 4, y0, z], [cx + 4, y0 + 6, z + 1], C.A),
    B([cx - 4, y0 + 5, z + 1], [cx + 4, y0 + 6, z + 2], C.Al),                            // brow ridge
    P([cx - 3, y0 + 3, z], [cx - 1, y0 + 4, z + 1], C.redH), P([cx + 1, y0 + 3, z], [cx + 3, y0 + 4, z + 1], C.redH),   // eyes
    B([cx - 1, y0 + 1, z + 1], [cx + 1, y0 + 4, z + 2], C.Ad),                            // snout
    P([cx - 3, y0, z], [cx + 3, y0 + 1, z + 1], C.Kd),                                     // mouth
    B([cx - 3, y0 - 1, z], [cx - 2, y0 + 1, z + 1], C.edge), B([cx + 2, y0 - 1, z], [cx + 3, y0 + 1, z + 1], C.edge),   // fangs
  ];
}

function torso() {
  const P_ = {};
  P_.hips = [
    B([-6, -5, -4], [6, 3, 4], C.U),
    B([-7, -6, -5], [7, 1, 5], brocade),
    B([-7, 0, -5], [7, 3, 5], (x) => (md(x, 3) === 0 ? C.Ad : C.A)),                   // lion belt (獅蠻帶)
    ...beastFace(0, -1, 5).map((b) => ({ ...b, a: [b.a[0] + 1, b.a[1], b.a[2]], b: [b.b[0] - 1, b.b[1], b.b[2]] })),
  ];
  P_.spine = [
    B([-5, -3, -4], [5, 8, 4], C.U),
    ...lamellar([-6, -2, -5], [6, 7, 5], { base: C.K, rowH: 2, pw: 3 }),
    B([-6, 6, -5], [6, 8, 5], C.A),
  ];
  // chest: black lamellar cuirass, gold edges, a big gold beast face on the breast, red robe collar
  P_.chest = [
    B([-7, -2, -5], [7, 9, 5], C.U),
    ...lamellar([-7, -2, -5], [7, 9, 5], { base: C.K, rowH: 2, pw: 3 }),
    B([-7, 8, -6], [7, 10, 6], C.A),
    ...beastFace(0, 1, 6),
    B([-4, 8, -4], [4, 12, 4], C.R),                                  // robe collar
    B([-2, 7, 3], [2, 12, 7], -1), B([-2, 7, 3], [2, 10, 5], C.R),    // V at the throat
    B([-3, 8, -3], [3, 13, 3], -1),                                   // neck hole
  ];
  P_.neck = [B([-2, -1, -2], [2, 3, 2], C.skinD)];
  return P_;
}

function limbs(P_) {
  for (const [s, sx] of [['R', -1], ['L', 1]]) {
    P_['upperArm' + s] = [
      B([-3, -12, -3], [3, 1, 3], brocade),                           // red brocade sleeve
      B([-3, -12, -3], [3, -11, 3], C.A),
    ];
    P_['foreArm' + s] = [
      B([-2, -11, -2], [3, 0, 3], C.Kd),
      ...lamellar([-2, -9, -2], [3, -2, 3], { base: C.K, rowH: 2, trim: C.A }),
      B([-2, -1, -3], [3, 1, 3], C.A),
    ];
    P_['hand' + s] = [B([-2, -2, -2], [2, 2, 2], C.glove), B([-2, 1, -2], [2, 2, 2], C.Kd)];
    // thigh: red trousers, black lamellar tasset with a gold hem on the outside/front/back
    P_['thigh' + s] = [
      B([-3, -18, -3], [4, 1, 4], (x, y, z) => (y % 5 === 0 ? C.Rd : brocade(x, y, z))),
      ...lamellar([-2, -10, -4], [5, 2, 5], { base: C.K, rowH: 2, trim: C.A, jag: true }).map((b) => mirX(b, sx, 1)),
    ];
    P_['shin' + s] = [
      B([-2, -17, -2], [3, 0, 3], C.boot),
      ...lamellar([-2, -15, -1], [3, -3, 4], { base: C.K, rowH: 3, pw: 4 }),
      B([0, -14, 4], [1, -3, 5], C.A),
      B([-3, -17, -3], [4, -15, 4], (x, y) => (y === -17 ? C.A : C.K)),
      B([-2, -3, 0], [3, 2, 5], C.A),
    ];
    P_['foot' + s] = [
      B([-3, -3, -2], [3, 1, 6], C.boot),
      B([-3, -3, 4], [3, -1, 7], C.A),
      P([-3, -3, -2], [3, -2, 7], C.sole),
      B([-3, 0, -3], [3, 1, 3], C.A),
    ];
  }
  return P_;
}

/** Beast-head pauldron: black plate tiers with a gold rim and a gold beast face on the outside, upswept horn. */
function pauldronBoxes(sx) {
  const b = [
    ...lamellar([-4, 1, -4], [2, 5, 4], { base: C.K, rowH: 2 }),
    ...lamellar([-2, -3, -5], [3, 1, 5], { base: C.K, rowH: 2, trim: C.A, jag: true }),
    B([3, -2, -3], [5, 5, 3], C.A),
    P([4, 2, -2], [6, 3, -1], C.redH), P([4, 2, 1], [6, 3, 2], C.redH),
    B([5, 0, -1], [7, 2, 1], C.Ad),
    P([5, -1, -2], [6, 0, 2], C.Kd),
    B([5, -2, -2], [6, -1, -1], C.edge), B([5, -2, 1], [6, -1, 2], C.edge),
    B([2, 5, -2], [4, 8, 2], C.A), B([3, 8, -1], [5, 10, 1], C.Al),   // horn
  ];
  return b.map((bx) => mirX(bx, sx));
}

function head() {
  const hairPaint = (x, y, z) => (md(x * 3 + z, 5) === 0 ? C.hairH : md(x + y * 2, 7) === 0 ? C.hairT : C.hair);
  const bangs = { '-4': 8, '-3': 7, '-2': 8, '-1': 9, 0: 9, 1: 9, 2: 8, 3: 7, 4: 8 };
  return [
    B([-3, 0, -2], [4, 2, 5], C.skin),
    B([-4, 2, -4], [5, 10, 5], C.skin),
    B([-5, 5, -1], [6, 8, 1], C.skinD),
    B([-5, 8, -6], [6, 13, 6], hairPaint),
    B([-5, 2, -6], [6, 13, -2], hairPaint),
    B([-5, 3, -2], [-3, 12, 3], hairPaint), B([4, 3, -2], [6, 12, 3], hairPaint),
    B([-4, 7, 5], [5, 12, 6], (x, y) => (y >= bangs[x] ? hairPaint(x, y, 5) : null)),
    // 束髮紫金冠: gold crown over a top knot, purple gems, a gold band round the head with a red pearl at the brow
    B([-6, 10, -7], [7, 11, 7], C.A),
    B([0, 10, 7], [1, 12, 8], C.redH),
    B([-3, 13, -4], [4, 16, 3], C.hair),
    B([-4, 13, -5], [5, 17, 4], (x, y, z) => (y === 16 ? (md(x, 2) ? C.Al : null) : md(x + z, 4) === 0 ? C.purple : C.A)),
    B([-1, 14, 4], [2, 16, 5], C.purpleL), B([-5, 14, -1], [-4, 16, 1], C.purpleL), B([5, 14, -1], [6, 16, 1], C.purpleL),
    B([-1, 17, -2], [2, 19, 1], C.Al),                                // crown finial
    // face: fierce eyes with a red-brown iris, brows angled up and out, set mouth
    P([-3, 5, 4], [0, 6, 5], C.eye), P([1, 5, 4], [4, 6, 5], C.eye),
    P([-3, 4, 4], [0, 5, 5], C.scl), P([1, 4, 4], [4, 5, 5], C.scl),
    P([-2, 4, 4], [-1, 5, 5], C.iris), P([2, 4, 4], [3, 5, 5], C.iris),
    P([-4, 7, 4], [-1, 8, 5], C.hair), P([2, 7, 4], [5, 8, 5], C.hair), P([-2, 6, 4], [0, 7, 5], C.hair), P([1, 6, 4], [3, 7, 5], C.hair),
    B([0, 3, 5], [1, 4, 6], C.skin), P([0, 2, 4], [1, 3, 5], C.skinD),
    P([-1, 1, 4], [2, 2, 5], C.lip),
    P([-4, 1, 3], [-3, 4, 5], C.skinD), P([4, 1, 3], [5, 4, 5], C.skinD),
  ];
}

// ---------------------------------------------------------------- Sky Piercer 方天畫戟 (weapon joint: shaft +Z)
function weaponGeo() {
  const sv = 0.02;
  const shaft = vox([
    B([-1, -1, -36], [1, 1, 76], (x, y, z) => (((z + 36) % 12) === 0 ? C.band : ((z >> 1) & 1) ? C.shaftH : C.shaft)),
    ...Array.from({ length: 9 }, (_, i) => B([-2, -2, -33 + i * 12], [2, 2, -32 + i * 12], C.band)),
    B([-2, -2, -38], [2, 2, -35], C.A),
    B([-1, -1, -42], [1, 1, -38], C.Ad),
  ], sv, { jitter: 0.04, ao: 0.3 });
  const cv = 0.012;
  const collar = vox([
    B([-3, -3, 120], [3, 3, 124], C.A),
    B([-4, -4, 124], [4, 4, 134], (x, y, z) => ((z + y) % 3 === 0 ? shade(C.A, 0.8) : C.A)),
    B([-5, -1, 128], [5, 1, 132], C.purple),
    B([-4, -5, 115], [4, 4, 120], (x, y, z) => (hash01(x, y, z) < 0.25 ? null : hash01(y, z, x) < 0.3 ? C.redH : C.red)),
  ], cv, { jitter: 0.05, ao: 0.35 });
  // long spear point on the axis (z 1.62 … 2.1) and two crescent blades (月牙) either side of its root, all in the
  // shaft's YZ plane (flat in X) so the silhouette reads from the side
  const bv = 0.011, boxes = [];
  const z0 = Math.round(1.6 / bv), z1 = Math.round(2.12 / bv);
  for (let z = z0; z < z1; z++) {
    const u = (z - z0) / (z1 - z0);
    const w = Math.max(1, Math.round(5 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.2 + 0.08)), 0.7) * (1 - u * 0.4)));
    boxes.push(B([-1, -w, z], [1, w, z + 1], (_, y) => (Math.abs(y + 0.5) < 1 ? C.fuller : Math.abs(y + 0.5) >= w - 1 ? C.edge : C.steel)));
  }
  // crescents (月牙): an annulus sector whose convex back sits against the shaft and whose horns reach outward
  const cz = Math.round(1.68 / bv), R = 12, r0 = 8, c = 3 + R;
  for (const sy of [-1, 1]) for (let dz = -R + 1; dz < R; dz++) {
    const lo = Math.round(c - Math.sqrt(R * R - dz * dz)), hi = Math.round(c - Math.sqrt(Math.max(0, r0 * r0 - dz * dz)));
    if (hi <= lo) continue;
    const a = sy > 0 ? lo : -hi, b = sy > 0 ? hi : -lo;
    boxes.push(B([-1, a, cz + dz], [1, b, cz + dz + 1], (_, y) => (Math.abs(y + 0.5) >= Math.abs(sy > 0 ? hi : lo) - 1.5 && Math.abs(dz) < r0 ? C.edge : C.steel)));
  }
  boxes.push(B([-2, -4, cz - 2], [2, 4, cz + 3], C.A));               // gold boss where the blades meet
  const blade = vox(boxes, bv, { jitter: 0.03, ao: 0.2 });
  return [{ geo: shaft, mat: 'body' }, { geo: collar, mat: 'metal' }, { geo: blade, mat: 'blade' }];
}

// ---------------------------------------------------------------- spring-chain segments (local -Y along the chain)
function featherSeg(i, n) {
  // long pheasant tail feather: barred brown / cream / dark, a darker quill line, tapering to a point
  const w = i < n - 2 ? 2 : 1, tip = i === n - 1;
  return vox([B([-w, tip ? -8 : -7, 0], [w, 0, 1], (x, y) => {
    if (tip && y < -4 && x !== -1 && x !== 0) return null;
    if (x === -1 && w > 1) return C.fC;                               // quill
    const bar = md(y + i * 7, 7);
    return bar < 2 ? C.fC : bar < 4 ? C.fB : C.fA;
  })], 0.016, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.15 });
}
function capeSeg(i, n) {
  const w = Math.round(6 + (i * 3) / (n - 1)), last = i === n - 1;
  const paint = (x, y) => {
    if (last && y === -7 && hash01(x, i, 3) < 0.4) return null;
    if (last && (y === -5 || y === -4)) return C.A;
    return x === -w || x === w - 1 ? C.Rd : md(x * 3 + y * 5 + i * 7, 13) === 0 ? C.Rp : C.R;
  };
  const curl = (x) => x === -w || x === w - 1 || (i >= 3 && (x === -w + 1 || x === w - 2));
  return vox([
    B([-w, -7, 0], [w, 0, 1], (x, y) => (curl(x) ? null : paint(x, y))),
    B([-w, -7, -1], [w, 0, 0], (x, y) => (curl(x) ? paint(x, y) : null)),
  ], 0.025, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.18 });
}
function apronSeg(i, n) {
  const last = i === n - 1;
  return vox([B([-4, -5, 0], [4, 0, 1], (x, y) => (last && y === -5 ? (x % 2 ? null : C.A) : x === -4 || x === 3 ? C.A : brocade(x, y, 0)))],
    0.025, { off: [0, 0, -0.5], jitter: 0.05, ao: 0.2 });
}
function hairSeg(i, n) {
  const w = Math.max(1, Math.round(3 - (i * 2) / (n - 1))), tip = i === n - 1;
  return vox([B([-w, tip ? -6 : -4, -w], [w, 0, w], (x, y, z) => {
    if (tip && y < -3 && hash01(x, z, i) < 0.5 + (-3 - y) * 0.15) return null;
    return (x * 2 + z + 40) % 5 === 0 ? C.hairH : C.hair;
  })], HV, { jitter: 0.06, ao: 0.3 });
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
  '...f..........f.....',
  '...ff...AAA..ff.....',
  '....ff.APAPA.f......',
  '.....fAAAAAAAf......',
  '....KKAAAAAAAKK.....',
  '...KKKKKKKKKKKKK....',
  '...KAAAAArAAAAAAK...',
  '...KKKSKKKKKSKKKK...',
  '...KKSSSSSSSSSSKKK..',
  '...KBBSSSSSSSSBBKK..',
  '...KSEeSSSSSSeESKK..',
  '...KSSSSSsSSSSSSKK..',
  '....SSSSSsSSSSSKK...',
  '....sSSSSSSSSSsK....',
  '.....sSSSMMSSSs.....',
  '......ssSSSSss......',
  '...RRAAssssssAARR...',
  '.RRRKKAAAKKAAAKKRRR.',
  'RRKKKKKAAAAAAKKKKKRR',
  'RKKAKKKKAddAKKKKAKKR',
];
const PAL = { f: '#a8743a', A: '#e0b24a', P: '#8a44b0', K: '#1d1719', r: '#e04030', S: '#f0c8a4', s: '#c8906c', B: '#140c10',
  E: '#140c10', e: '#7a2a1a', M: '#a85a4a', R: '#c0281e', d: '#6a4a1a' };

export default {
  id: 'lubu', zh: '呂布', en: 'LÜ BU', seal: '飛將', weapon: '方天畫戟',
  sub: '人中呂布 · 飛將無雙 · 天下莫敵', copy: '方天所向<br>天下無雙', tagline: '人中呂布，一戟橫掃千軍',
  cut: { sub: '五原 呂奉先', seal: '飛將' },
  lines: {
    open: ['螻蟻之輩，也敢擋我呂奉先？', 'Insects. You think you can stand in Lü Fengxian\'s way?'],
    musou: ['天下無雙，捨我其誰！', 'Peerless under heaven. Who else but me?'],
  },
  face: FACE, pal: PAL,
  build: () => ({ parts: limbs(torso()), head: head(), pauldrons: pauldronBoxes, weapon: weaponGeo() }),
  chains() {
    const out = [];
    out.push({ joint: 'chest', anchor: [0, 0.255, -0.17], rest: [0, -1, 0.15], n: 7, len: 0.18, stiff: 0.16, drag: 0.22, wind: 1.2, cone: 80, sway: 0.22,
      seg: capeSeg, hit: ['chest', 'hips', 'thighL', 'thighR', 'kneeL', 'kneeR'] });
    out.push({ joint: 'hips', anchor: [0, -0.06, 0.19], rest: [0, -1, 0.1], n: 3, len: 0.12, stiff: 0.12, drag: 0.14, wind: 0.4, face: [0, 0, 1], cone: 70, sway: 0.08,
      seg: apronSeg, hit: [['thighL', 0.02], ['thighR', 0.02], ['kneeL', 0.02], ['kneeR', 0.02]] });
    out.push({ joint: 'head', anchor: [0, 13 * HV, -5 * HV], rest: [0, -0.9, -0.4], n: 5, len: 0.06, stiff: 0.1, drag: 0.13, wind: 1.4, cone: 110, sway: 0.35,
      seg: hairSeg, hit: ['head', ['chest', 0.03]] });
    // 雉雞翎: two long feathers rising from the crown and arcing back; light gravity + a stiff pull to the rest direction
    for (const sx of [-1, 1]) {
      out.push({ joint: 'head', anchor: [sx * 1.5 * HV, 17 * HV, 1 * HV], rest: [sx * 0.35, 1, -0.55], n: 9, len: 0.105, stiff: 0.2, drag: 0.1, grav: 0.35, wind: 0.9, cone: 55, sway: 0.25,
        face: [0, 0, 1], seg: featherSeg });
    }
    for (let k = 0; k < 5; k++) {
      const a = k * 1.2566, ox = Math.cos(a) * 0.016, oy = Math.sin(a) * 0.016;
      out.push({ joint: 'weapon', anchor: [ox, oy, 1.41], rest: [ox * 12, oy * 4 - 1, -0.35], n: 3, len: 0.07, stiff: 0.05 + k * 0.004, drag: 0.12, wind: 0.8, cone: 130, sway: 0.15,
        face: [1, 0, 0], seg: tasselSeg });
    }
    return out;
  },
};
