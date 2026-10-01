// EXO reskin of zhugeliang.js: the original officer's body, proportions, rig, moveset and clips unchanged; only the surface, helmet and class identity change.
// 諸葛亮 Zhuge Liang (after the DW9 design): a tall white pleated scholar's hat with a gold band and jewel, long black
// hair to the shoulders, a calm, sharp face with a thin moustache and a pointed goatee. White robe over a black
// under-robe, green-and-gold trim on the collar and gold studs on the shoulders, wide sleeves lined in green, a purple
// sash with a gold-fringed panel, a green cloud-scroll apron, grey trousers gathered at the ankle, grey boots, and a
// long white overcoat tail with a taiji and gold cloud embroidery. Weapon: the feather fan — gold-mounted handle,
// white and green feathers; while he attacks it conjures a translucent wind blade along the line the rig's polearm
// takes, so the shared moveset, hit shapes and trails line up with what is drawn.
import * as THREE from 'three';
import { helmetBoxes, FACE as EXO_FACE } from './exo-helmet.js';
import { vox, B, P, md, mirX } from '../hero/model.js';
import { hash01 } from '../core/rng.js';
import * as MOVESET from './zhugeliang.moves.js';
import { FV, hand, symH } from './parts.js';

const HV = 0.0135;
const C = {
  W: 0xf0ead8, Wd: 0xcfc7b0, Wl: 0xfffaf0,                                  // white robe (kept under the bloom knee)
  K: 0x32313c, Kl: 0x4a4958,
  G: 0x2a8f9a, Gd: 0x1b5f6a, Gl: 0x45b3bf,                                  // green trim
  A: 0x4fd8f0, Ad: 0x2a9ab0, Al: 0xa8f0ff,                                  // gold
  purple: 0x4a3a7a, purpleD: 0x30264e,
  grey: 0x6a6980, greyD: 0x4a4958, boot: 0xdccaa4, bootD: 0xb09d74, sole: 0x32313c,
  skin: 0x4a4958, skinD: 0x32313c, skinH: 0x5e5d6e, lip: 0x32313c, eye: 0x120c10, iris: 0x2a2030, scl: 0xe0d8d0,
  hair: 0x32313c, hairH: 0x4a4958,
  wood: 0x2a1c16, featherW: 0xf0ead8, featherG: 0x2a8f9a, featherGd: 0x1b5f6a,
  wind: 0x9fe8ff, windH: 0xffffff, windD: 0x3fa8e0,
};
const robe = (x, y, z) => (md(x * 2 + y, 13) === 0 ? C.Wd : md(x + z * 3, 17) === 0 ? C.Wl : C.W);

// ---------------------------------------------------------------- body parts (fine voxels, centred on the joints)
function torso() {
  const P_ = {};
  // hips: purple sash, the gold-fringed front panel, robe below
  P_.hips = [
    B([-11, -10, -8], [11, 6, 8], C.K),
    B([-13, -12, -10], [13, -2, 10], robe),
    B([-14, -2, -11], [14, 5, 11], (x, y) => (y === -2 || y === 4 ? C.purpleD : C.purple)),
    B([-10, 0, 11], [-5, 4, 13], C.purple),                           // sash knot
    B([-5, -8, 11], [5, -1, 12], (x, y) => (y === -8 ? (md(x, 2) ? C.Al : null) : y === -7 ? C.A : C.K)),   // fringed panel
  ];
  P_.spine = [
    B([-9, -6, -7], [9, 16, 7], C.K),
    B([-11, -4, -9], [11, 16, 9], robe),
    B([-3, -4, 9], [3, 16, 10], C.K),                                 // black under-robe in the front opening
  ];
  // chest: slim — white robe with a V opening showing the black under-robe, green-and-gold collar trim, gold studs
  const vHalf = (y) => 2 + (y + 4) * 0.25;
  P_.chest = [
    B([-12, -4, -9], [12, 18, 9], C.K),
    B([-13, -4, -10], [13, 20, 10], robe),
    B([-13, -4, 10], [13, 21, 11], (x, y) => {
      const d = Math.abs(x + 0.5) - vHalf(y);
      return d < 0 ? C.K : d < 1.5 ? C.G : d < 2.2 ? C.A : null;
    }),
    B([-8, 16, -8], [8, 23, 8], C.K), P([-8, 22, -8], [8, 23, 8], C.G),   // high black collar, green rim
    ...[-11, -8, 7, 10].map((x) => B([x, 18, -3], [x + 2, 21, 3], C.Al)),   // gold studs along the shoulder line
    B([-6, 16, -6], [6, 26, 6], -1),
  ];
  P_.neck = [B([-4, -2, -4], [4, 6, 4], C.skinD), P([-4, 2, 3], [4, 6, 4], C.skin)];
  return P_;
}

function limbs(P_) {
  for (const [s, sx] of [['R', -1], ['L', 1]]) {
    P_['upperArm' + s] = [B([-5, -24, -5], [5, 2, 5], robe)];
    // wide sleeve: flares toward the wrist, green lining and a gold edge at the opening; black-embroidered cuff
    P_['foreArm' + s] = [
      B([-5, -18, -5], [5, 2, 5], robe),
      B([-7, -22, -7], [7, -10, 7], robe),
      B([-8, -24, -8], [8, -20, 8], C.G), P([-8, -24, -8], [8, -23, 8], C.A),
      B([-4, -24, -4], [4, -18, 4], C.K),
    ];
    P_['hand' + s] = hand(sx, C.skin, C.skinD);
    // loose grey trousers
    P_['thigh' + s] = [
      B([-8, -36, -8], [8, 2, 8], (x, y, z) => (md(y + (x & 1), 8) === 0 ? C.greyD : C.grey)),
      B([-9, -32, -9], [9, -18, 9], (x, y) => (md(y + x, 6) === 0 ? C.greyD : C.grey)),
    ];
    // trousers gathered at the ankle over tall grey boots
    P_['shin' + s] = [
      B([-5, -34, -5], [5, 0, 5], C.boot),
      B([-8, -14, -8], [8, 2, 8], (x, y) => (md(y + x, 5) === 0 ? C.greyD : C.grey)),
      B([-7, -15, -7], [7, -13, 7], C.greyD),
    ];
    P_['foot' + s] = [
      B([-6, -6, -4], [6, 2, 12], C.boot),
      B([-5, -6, 12], [5, -1, 16], C.boot), B([-3, -6, 16], [3, -3, 18], C.A),   // gold toe cap
      P([-6, -6, -4], [6, -5, 18], C.sole), P([-6, 1, -4], [6, 2, 12], C.bootD),
    ];
  }
  return P_;
}

// ---------------------------------------------------------------- head (head voxels, chin y 0)
function head() { return helmetBoxes({ iv: 0xf0ead8, ivL: 0xfffaf0, dark: 0x32313c, frame: 0x4a4958, crest: 0x2a8f9a, crestL: 0x45b3bf, light: 0x4fd8f0, lightL: 0xc8f6ff }, { fin: true, crestH: 6 }); }

// ---------------------------------------------------------------- feather fan + wind blade (weapon joint: +Z)
function weaponGeo() {
  // fan in the shaft's YZ plane: dark handle with gold mounts, a gold boss, then a fan of green feathers under long
  // white feathers, each with a dark quill
  const fv = 0.012, fan = [];
  fan.push(B([-1, -1, -10], [1, 1, 10], C.wood), B([-2, -2, 8], [2, 2, 12], C.A), B([-2, -2, -12], [2, 2, -9], C.A), B([-2, -2, 0], [2, 2, 1], C.A));
  fan.push(B([-2, -5, 11], [2, 5, 15], (x, y) => (md(y, 2) ? C.Al : C.A)));
  for (let z = 14; z < 50; z++) {
    const u = (z - 14) / 36, w = Math.round(4 + 13 * Math.sin(Math.min(1, u * 1.1) * Math.PI * 0.6) * (u > 0.82 ? 1 - (u - 0.82) * 3 : 1));
    fan.push(B([-1, -w, z], [1, w, z + 1], (_, y) => {
      const k = Math.floor((y + 40) / 3);                              // feather index
      if (z >= 44 && md(y + 40, 3) === 0) return null;                  // separated tips
      if (md(y + 40, 3) === 1 && u > 0.1) return u < 0.45 ? C.featherGd : C.Wd;   // quills
      if (u < 0.45) return md(k, 2) ? C.featherG : C.featherGd;
      return md(k, 2) ? C.featherW : C.Wl;
    }));
  }
  const fanGeo = vox(fan, fv, { jitter: 0.04, ao: 0.2 });
  const bv = 0.016, wb = [];
  const z0 = Math.round(0.62 / bv), z1 = Math.round(2.02 / bv);
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
/** Long white overcoat tail: green-and-gold edges, a ring sigil on the second segment, gold cloud scrolls lower down. */
function coatSeg(i, n) {
  const w = Math.round(13 + i * 1.6), last = i === n - 1;
  return vox([
    B([-w, -14, 0], [w, 0, 1], (x, y) => {
      if (x <= -w + 1 || x >= w - 2) return x === -w || x === w - 1 ? C.A : C.G;
      if (last && y <= -12) return y === -14 ? C.A : C.G;
      if (i === 1) {                                                   // ring sigil
        const dx = x + 0.5, dy = y + 7, r = Math.hypot(dx, dy);
        if (r < 5.5) {
          if (r > 4.6) return C.K;
          return r > 3.4 ? C.Wd : r > 1.8 ? C.A : C.Al;                                  // ring sigil with a glowing core
        }
      }
      if (i >= 3 && Math.abs(Math.sin(x * 0.5 + y * 0.35 + i) * 5 - (y + 7)) < 0.8 && x > 2) return C.A;   // cloud scroll
      return robe(x, y + i * 14, 1);
    }),
    B([-w + 1, -14, -1], [w - 1, 0, 0], C.G),
  ], FV, { off: [0, 0, -0.5], jitter: 0.03, ao: 0.18 });
}
function apronSeg(i, n) {
  // green apron with a gold cloud-scroll band and a black hem
  const last = i === n - 1;
  return vox([B([-8, -12, 0], [8, 0, 1], (x, y) => {
    if (last && y <= -10) return C.K;
    if (x <= -7 || x >= 6) return C.A;
    if (i === 0 && Math.abs(Math.sin((x + 0.5) * 0.7) * 2 - (y + 6)) < 0.7) return C.Al;
    return i === 0 ? C.G : C.Gd;
  }), B([-7, -12, -1], [7, 0, 0], C.K)], FV, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.2 });
}
function hairSeg(i, n) {
  const w = Math.max(3, Math.round(7 - (i * 2) / (n - 1))), tip = i === n - 1;
  return vox([B([-w, -6, -1], [w, 0, 1], (x, y, z) => {
    if (tip && md(x, 2) === 0 && y < -2) return null;
    return md(x * 2 + i, 5) === 0 ? C.hairH : C.hair;
  })], FV, { off: [0, 0, -0.5], jitter: 0.05, ao: 0.25 });
}

// ---------------------------------------------------------------- fighting style
// His own moveset (zhugeliang.moves.js); STYLE keeps the look: wind-blade and beam colours, the ice-white dragon.
const STYLE = {
  trail: { white: [0.86, 0.95, 0.98], blue: [0.3, 0.8, 0.95], hot: [1.45, 1.6, 1.65] },   // weapon trail (vfx.js)
  weight: 0.8,                                                 // impact: camera kick scale (camera.js)
  fx: { proj: [0.5, 1.6, 2.2], core: [1.6, 2.2, 2.5], beam: [0.6, 1.6, 2.6] },
  dragon: { body: [0.35, 0.5, 0.55], scale: [0.6, 0.85, 0.9], belly: [0.9, 1.0, 1.0], fin: [0.9, 1.3, 1.3], whisker: [1.0, 1.3, 1.4] },
  rays: [0.8, 1.2, 1.3],
};

// ---------------------------------------------------------------- HUD portrait (20×20 pixels)
const FACE = [
  '......WWWWWWW.......',
  '.....WwWWwWWwW......',
  '.....WwWWwWWwW......',
  '.....WwWWwWWwW......',
  '.....AAAAGAAAA......',
  '....HHHHHHHHHHH.....',
  '...HHSSSSSSSSSHH....',
  '...HSKKKSSSKKKSH....',
  '...HSSSSSSSSSSSH....',
  '...HSSEISSSIESSH....',
  '...HSShSSsSShSSH....',
  '...HSSSSSsSSSSSH....',
  '...HHSHHHHHHHSHH....',
  '...HH.sSSMSSs.HH....',
  '...HH..sSHSs..HH....',
  '...HH...sHs...HH....',
  '..WWGGKK.H.KKGGWW...',
  '.WWWWGGKKKKKGGWWWW..',
  'WWWWWWGAKKKAGWWWWWW.',
  'WWWWWWWGAKAGWWWWWWWW',
];
const PAL = { W: '#d8d4ca', w: '#aea99e', A: '#b89648', G: '#3a7a4a', H: '#141216', S: '#ecc6a4', s: '#c89a7c', h: '#f8d8bc',
  K: '#1c1c22', E: '#120c10', I: '#2a2030', M: '#b87c6a' };

let glow = 0;
export const ORACLE = {
  id: 'oracle', zh: 'EXO-05', en: 'ORACLE', seal: 'PILOT', weapon: 'DRONE FAN', role: 'SUPPORT / RANGED',
  sub: 'SEE EVERY MOVE', copy: 'SEE EVERY<br>MOVE', tagline: 'Read the field. Cut it apart from range.',
  cut: { sub: 'ORACLE OVERDRIVE', seal: 'OVERDRIVE' },
  lines: { open: ['EXO-05 online.', 'I have already mapped their routes.'], musou: ['OVERDRIVE', 'Overdrive engaged.'] },
  face: EXO_FACE, pal: {'G': '#f0ead8', 'g': '#cfc7b0', 'T': '#32313c', 'w': '#4fd8f0'}, glow: 1.0, matColor: 0.9, fill: 0.3, rim: 0.35,
  style: STYLE,
  voice: { pitch: 0.98, fk: 1.02, growl: -0.12, gain: 0.85 },   // calm, clear
  moveset: MOVESET,
  anim: 'fan',                                              // one-handed fan upper body (hero/anims/fan.js)
  build: () => ({ parts: limbs(torso()), head: head(), hv: HV, bv: FV, pauldrons: null, weapon: weaponGeo() }),
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
    out.push({ joint: 'chest', anchor: [0, 0.2, -0.14], rest: [0, -1, 0.1], n: 8, len: 0.18, stiff: 0.16, drag: 0.22, wind: 1.2, cone: 80, sway: 0.22,
      seg: coatSeg, hit: ['chest', 'hips', 'thighL', 'thighR', 'kneeL', 'kneeR'] });
    out.push({ joint: 'hips', anchor: [0, -0.12, 0.17], rest: [0, -1, 0.1], n: 3, len: 0.13, stiff: 0.13, drag: 0.18, wind: 0.5, face: [0, 0, 1], cone: 70, sway: 0.1,
      seg: apronSeg, hit: [['thighL', 0.04], ['thighR', 0.04], ['kneeL', 0.04], ['kneeR', 0.04]] });
    /* (removed: face/hair/tassel chain) */
    return out;
  },
};
