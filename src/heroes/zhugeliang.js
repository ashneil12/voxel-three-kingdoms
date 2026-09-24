// 諸葛亮 Zhuge Liang: silk kerchief (綸巾) with trailing ties, white crane-feather robe (鶴氅) with black trim over a
// blue-grey under-robe, long robe panels down to the ankles, a long white cloak with the eight trigrams (八卦) on the
// back, a thin moustache and goatee. Weapon: the white feather fan (白羽扇) in the right hand; while he attacks it
// conjures a translucent wind blade along the line the rig's polearm would take, so the shared moveset, hit shapes and
// trails line up with what is drawn. The blade fades in on attack/Musou and out at rest (update()).
import * as THREE from 'three';
import { vox, HV, B, P, md, mirX } from '../hero/model.js';
import { hash01 } from '../core/rng.js';

const C = {
  W: 0xdcd6c8, Wd: 0xbcb5a6, Wl: 0xebe6da,                                  // white robe
  K: 0x1c1c24, Kd: 0x121218, Kl: 0x34343e,                                  // black trim / kerchief
  N: 0x3a4a6a, Nd: 0x283450, Nl: 0x566a94,                                  // blue-grey under-robe
  A: 0xc8a050, Ad: 0x8a6a30,                                                // gold
  glove: 0xe8dccc, sole: 0x1a1414, shoe: 0x22222a, sash: 0x2a3a5c,
  skin: 0xf2d0b0, skinD: 0xd8aa8c, lip: 0xc08070, eye: 0x120c10, iris: 0x2a2030, scl: 0xe0d8d0,
  hair: 0x16131a, hairH: 0x34303e,
  wood: 0x5a3a24, featherG: 0xb8bcc4, featherD: 0x5a5e68,
  wind: 0x9fe8ff, windH: 0xffffff, windD: 0x3fa8e0,
};

const robe = (x, y, z) => (md(x * 2 + y, 9) === 0 ? C.Wd : md(x + z * 3, 13) === 0 ? C.Wl : C.W);

// ---------------------------------------------------------------- body parts
function torso() {
  const P_ = {};
  P_.hips = [
    B([-6, -5, -4], [6, 3, 4], C.N),
    B([-7, -8, -5], [7, 1, 5], robe),
    B([-7, 0, -5], [7, 3, 5], C.sash),                               // blue sash
    B([-1, -3, 5], [1, 2, 6], C.A),                                  // jade-gold pendant cord
  ];
  P_.spine = [
    B([-5, -3, -4], [5, 8, 4], C.N),
    B([-6, -2, -5], [6, 8, 5], robe),
    B([-2, -2, 5], [2, 8, 6], C.N),                                  // under-robe showing in the front opening
  ];
  // chest: crossed collar (交領) — the black-trimmed right-over-left lapel runs diagonally across the white robe
  P_.chest = [
    B([-7, -2, -5], [7, 9, 5], C.N),
    B([-8, -2, -6], [8, 10, 6], robe),
    B([-8, -2, 6], [8, 10, 7], (x, y) => {
      const d = x + 0.5 - (y - 9) * 0.55;                             // lapel edge line (from the left collar to the right hip)
      return Math.abs(d) < 1.2 ? C.K : d < 0 && d > -3 && y > 4 ? C.N : null;
    }),
    B([-8, 8, -6], [8, 10, 6], (x, y, z) => (y === 9 && Math.abs(z) < 5 ? C.K : null), true),
    B([-3, 8, -3], [3, 13, 3], -1),
  ];
  P_.neck = [B([-2, -1, -2], [2, 3, 2], C.skinD)];
  return P_;
}

function limbs(P_) {
  for (const [s, sx] of [['R', -1], ['L', 1]]) {
    // wide robe sleeves with black cuffs
    P_['upperArm' + s] = [B([-3, -12, -3], [3, 1, 3], robe)];
    P_['foreArm' + s] = [
      B([-3, -10, -3], [4, 1, 4], robe),
      B([-3, -11, -3], [4, -9, 4], C.K),
    ];
    P_['hand' + s] = [B([-2, -2, -2], [2, 2, 2], C.skin)];
    // long robe panels reach the ankles: the thighs carry wide white skirt panels, the shins robe hems
    P_['thigh' + s] = [
      B([-3, -18, -3], [4, 1, 4], C.N),
      ...[B([-3, -18, -5], [6, 1, 6], (x, y, z) => (y <= -17 ? C.K : robe(x, y, z)))].map((b) => mirX(b, sx, 1)),
    ];
    P_['shin' + s] = [
      B([-2, -17, -2], [3, 0, 3], C.N),
      B([-3, -8, -4], [4, 0, 5], (x, y, z) => (y === -8 ? C.K : robe(x, y, z))),
    ];
    P_['foot' + s] = [
      B([-3, -3, -2], [3, 0, 6], C.shoe),
      B([-2, -1, 5], [2, 1, 7], C.shoe),                              // upturned toe
      P([-3, -3, -2], [3, -2, 7], C.sole),
    ];
  }
  return P_;
}

function head() {
  const hairPaint = (x, y, z) => (md(x * 3 + z, 5) === 0 ? C.hairH : C.hair);
  return [
    B([-3, 0, -2], [4, 2, 5], C.skin),
    B([-4, 2, -4], [5, 10, 5], C.skin),
    B([-5, 5, -1], [6, 8, 1], C.skinD),
    B([-5, 3, -6], [6, 10, -2], hairPaint),
    B([-5, 8, -5], [6, 10, 5], hairPaint),
    B([-5, 4, -2], [-4, 9, 2], hairPaint), B([5, 4, -2], [6, 9, 2], hairPaint),
    // 綸巾: black silk kerchief, square top rising in two folds, a band over the brow
    B([-5, 9, -6], [6, 14, 5], (x, y, z) => (md(x + y, 5) === 0 ? C.Kl : C.K)),
    B([-4, 14, -5], [5, 18, 3], (x, y, z) => (y === 16 ? C.Kl : C.K)),
    B([-3, 18, -4], [4, 19, 2], C.K),
    B([-5, 9, 5], [6, 10, 6], C.Kl),
    // face: calm eyes, straight brows, a thin moustache and a small goatee
    P([-3, 5, 4], [0, 6, 5], C.eye), P([1, 5, 4], [4, 6, 5], C.eye),
    P([-3, 4, 4], [0, 5, 5], C.scl), P([1, 4, 4], [4, 5, 5], C.scl),
    P([-2, 4, 4], [-1, 5, 5], C.iris), P([2, 4, 4], [3, 5, 5], C.iris),
    P([-3, 7, 4], [0, 8, 5], C.hair), P([1, 7, 4], [4, 8, 5], C.hair),
    B([0, 3, 5], [1, 4, 6], C.skin), P([0, 2, 4], [1, 3, 5], C.skinD),
    P([-2, 2, 4], [0, 3, 5], C.hair), P([1, 2, 4], [3, 3, 5], C.hair), P([-3, 1, 4], [-2, 2, 5], C.hair), P([3, 1, 4], [4, 2, 5], C.hair),
    P([-1, 1, 4], [2, 2, 5], C.lip),
    B([-1, -3, 3], [2, 1, 5], C.hair), B([0, -5, 3], [1, -3, 5], C.hairH),   // goatee
  ];
}

// ---------------------------------------------------------------- white feather fan + wind blade (weapon joint: +Z)
function weaponGeo() {
  // fan in the shaft's YZ plane: wooden handle with a gold ferrule, a black band of short feathers, then long white
  // crane feathers fanning out, grey tips
  const fv = 0.012, fan = [];
  fan.push(B([-1, -1, -8], [1, 1, 10], C.wood), B([-2, -2, 8], [2, 2, 11], C.A), B([-1, -1, -10], [1, 1, -8], C.A));
  for (let z = 11; z < 44; z++) {
    const u = (z - 11) / 33, w = Math.round(2 + 11 * Math.sin(Math.min(1, u * 1.05) * Math.PI * 0.62) * (u > 0.85 ? 1 - (u - 0.85) * 2.5 : 1));
    fan.push(B([-1, -w, z], [1, w, z + 1], (_, y) => {
      if (z >= 40 && md(y + 20, 3) === 0) return null;                // feather tips
      if (u < 0.18) return C.K;
      if (Math.abs(y + 0.5) < 0.6) return C.featherG;                  // central quill
      return u > 0.8 ? C.featherG : md(y + 20, 3) === 0 ? C.Wd : C.Wl;
    }));
  }
  const fanGeo = vox(fan, fv, { jitter: 0.04, ao: 0.2 });
  // wind blade: a long tapered crescent of light from past the fan to the spear-tip reach
  const bv = 0.016, wb = [];
  const z0 = Math.round(0.56 / bv), z1 = Math.round(2.02 / bv);
  for (let z = z0; z < z1; z++) {
    const u = (z - z0) / (z1 - z0), cy = Math.round(4 * Math.sin(u * Math.PI));
    const w = Math.max(1, Math.round(1 + 5 * Math.sin(Math.PI * Math.min(1, u * 1.1)) * (1 - u * 0.5)));
    wb.push(B([0, cy - w, z], [1, cy + w, z + 1], (_, y) => (Math.abs(y - cy + 0.5) < 1 ? C.windH : Math.abs(y - cy + 0.5) >= w - 1 ? C.windD : C.wind)));
  }
  const windMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const wind = vox(wb, bv, { off: [-0.5, 0, 0], jitter: 0, ao: 0 });
  return [{ geo: fanGeo, mat: 'body' }, { geo: wind, mat: windMat }];
}

// ---------------------------------------------------------------- spring-chain segments (local -Y along the chain)
const TRIGRAMS = [                    // ☰ ☱ ☲ ☳ ☴ ☵ ☶ ☷ as 3-line glyphs (1 = solid, 0 = broken) round a taiji dot
  [1, 1, 1], [0, 1, 1], [1, 0, 1], [0, 0, 1], [1, 1, 0], [0, 1, 0], [1, 0, 0], [0, 0, 0],
];
function capeSeg(i, n) {
  const w = Math.round(6 + (i * 3) / (n - 1)), last = i === n - 1;
  const paint = (x, y) => {
    if (last && y === -7 && hash01(x, i, 3) < 0.4) return null;
    if (last && (y === -6 || y === -5)) return C.K;
    if (x === -w || x === w - 1) return C.K;
    // eight trigrams: segments 1-2 carry a ring of short bars round a black/white dot
    if (i === 1 || i === 2) {
      const cy = i === 1 ? -7 : 0, dy = y - cy, r = Math.hypot(x + 0.5, dy);
      if (r < 1.6) return x < 0 ? C.K : C.Wl;
      if (r > 3.2 && r < 5.2) {
        const k = Math.round((Math.atan2(dy, x + 0.5) / (2 * Math.PI)) * 8 + 8) % 8, line = Math.floor(r - 3.2);
        const bar = TRIGRAMS[k][Math.min(2, line)], a = Math.atan2(dy, x + 0.5) * 8 / (2 * Math.PI) + 8;
        if (!bar && Math.abs((a % 1) - 0.5) < 0.12) return C.W;
        return Math.abs((a % 1) - 0.5) < 0.36 ? C.K : C.W;
      }
    }
    return md(x + 40, 5) === 0 ? C.Wd : C.W;
  };
  const curl = (x) => x === -w || x === w - 1 || (i >= 3 && (x === -w + 1 || x === w - 2));
  return vox([
    B([-w, -7, 0], [w, 0, 1], (x, y) => (curl(x) ? null : paint(x, y))),
    B([-w, -7, -1], [w, 0, 0], (x, y) => (curl(x) ? paint(x, y) : null)),
  ], 0.025, { off: [0, 0, -0.5], jitter: 0.03, ao: 0.18 });
}
function apronSeg(i, n) {
  const last = i === n - 1;
  return vox([B([-4, -5, 0], [4, 0, 1], (x, y) => (last && y <= -4 ? C.K : x === -4 || x === 3 ? C.K : C.N))],
    0.025, { off: [0, 0, -0.5], jitter: 0.05, ao: 0.2 });
}
function tieSeg(i, n) {
  const tip = i === n - 1;
  return vox([B([-2, -9, 0], [2, 0, 1], (x, y) => (tip && y <= -8 && (x === -1 || x === 0) ? null : x === -2 ? C.Kl : C.K))],
    0.012, { off: [0, 0, -0.5], jitter: 0.03, ao: 0.15 });
}

// ---------------------------------------------------------------- HUD portrait (20×20 pixels)
const FACE = [
  '......KKKKKKK.......',
  '......KkKKKkK.......',
  '.....KKKKKKKKK......',
  '....KKKKKKKKKKK.....',
  '....KkkkkkkkkkK.....',
  '...HKKKKKKKKKKKH....',
  '...HSSSSSSSSSSSH....',
  '...HSBBBSSSSBBBH....',
  '...HSSSSSSSSSSSH....',
  '...HSEeSSSSSeESH....',
  '...HSSSSSsSSSSSH....',
  '....SSSSSsSSSSS.....',
  '....sSHHSSSHHSs.....',
  '.....sSSSMMSSs......',
  '......sSSHHSs.......',
  '.......sSHHs........',
  '...WWWKKsHssKKWWW...',
  '.WWWWWWKKSSKKWWWWWW.',
  'WWWWWWWWKKKKWWWWWWWW',
  'WwWWWWWWNKKNWWWWWwWW',
];
const PAL = { K: '#1c1c24', k: '#3a3a46', H: '#16131a', S: '#f2d0b0', s: '#d0a080', B: '#16131a', E: '#120c10', e: '#e0d8d0',
  M: '#b07060', W: '#eeeae0', w: '#c8c2b4', N: '#3a4a6a' };

let glow = 0;
export default {
  id: 'zhugeliang', zh: '諸葛亮', en: 'ZHUGE LIANG', seal: '臥龍', weapon: '白羽扇',
  sub: '臥龍 · 運籌帷幄 · 決勝千里', copy: '羽扇一揮<br>萬軍灰飛', tagline: '羽扇綸巾，運籌帷幄之中',
  cut: { sub: '臥龍 諸葛孔明', seal: '臥龍' },
  lines: {
    open: ['魏軍雖眾，不過烏合之眾！', 'Wei\'s host is vast — and nothing but a rabble.'],
    musou: ['東風已至，破敵正在此時！', 'The east wind has come. Now we break them!'],
  },
  face: FACE, pal: PAL,
  build: () => ({ parts: limbs(torso()), head: head(), pauldrons: null, weapon: weaponGeo() }),
  /** Render hook: the wind blade shows while he attacks (fast in, slow out), flickering a little. */
  update(model, h, dt) {
    const on = h.state === 'attack' || h.state === 'musou' ? 1 : 0;
    glow += (on - glow) * Math.min(1, dt * (on ? 20 : 5));
    const m = model.meshes.weapon1;
    m.visible = glow > 0.02;
    m.material.opacity = glow * (0.75 + 0.25 * Math.sin(performance.now() * 0.03));
  },
  chains() {
    const out = [];
    out.push({ joint: 'chest', anchor: [0, 0.255, -0.17], rest: [0, -1, 0.12], n: 8, len: 0.18, stiff: 0.16, drag: 0.22, wind: 1.2, cone: 80, sway: 0.22,
      seg: capeSeg, hit: ['chest', 'hips', 'thighL', 'thighR', 'kneeL', 'kneeR'] });
    out.push({ joint: 'hips', anchor: [0, -0.1, 0.2], rest: [0, -1, 0.1], n: 5, len: 0.12, stiff: 0.12, drag: 0.14, wind: 0.4, face: [0, 0, 1], cone: 70, sway: 0.08,
      seg: apronSeg, hit: [['thighL', 0.03], ['thighR', 0.03], ['kneeL', 0.03], ['kneeR', 0.03]] });
    for (const sx of [-1, 1]) {
      out.push({ joint: 'head', anchor: [sx * 2 * HV, 13 * HV, -5.5 * HV], rest: [sx * 0.3, -0.6, -1], n: 5, len: 0.1, stiff: 0.03, drag: 0.06, wind: 2.2, cone: 105, sway: 0.55,
        seg: tieSeg, hit: ['head', ['chest', 0.02]] });
    }
    return out;
  },
};
