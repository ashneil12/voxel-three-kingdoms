// VANGUARD (default: the character-sheet reconstruction; other builds via ?vanguard=ref|authored) — the sheet's chibi ivory/navy mech, rebuilt voxel-for-voxel from the concept views (data: vanguard-data.js).
// One voxel = 0.0245 m. Every rig joint gets its own rigid voxel grid; the rig's proportions (rigDim) are the model's own,
// so the rest pose matches the sheet and the shared moveset/IK/animation drive it unchanged.
import { B, vox } from '../hero/model.js';
import { P, clip } from '../hero/rig.js';
import { VOXEL, RIG_DIM, GROUPS, SPEAR } from './vanguard-data.js';

const PAL = [null, 0xf0cfa6, 0x2a5cbc, 0xff9528, 0xf0b232, 0x2b282f, 0x3d3944, 0x2a2428];   // 1 ivory 2 navy 3 orange 4 gold 5 black 6 dark 7 shaft

function decode(g) {
  const [nx, ny, nz] = g.n, grid = new Uint8Array(nx * ny * nz);
  let at = 0;
  for (let i = 0; i < g.rle.length; i += 2) { grid.fill(g.rle[i], at, at + g.rle[i + 1]); at += g.rle[i + 1]; }
  return grid;
}
/** One box spanning the group's bounding volume whose colour function reads the decoded grid (empty → carved out). */
function groupOf(g) {
  const [nx, ny] = g.n, [ox, oy, oz] = g.o, grid = decode(g);
  const at = (x, y, z) => { const i = x - ox, j = y - oy, k = z - oz; return i < 0 || j < 0 || k < 0 || i >= g.n[0] || j >= g.n[1] || k >= g.n[2] ? 0 : grid[i + nx * (j + ny * k)]; };
  return [B([ox, oy, oz], [ox + g.n[0], oy + g.n[1], oz + g.n[2]], (x, y, z) => { const v = at(x, y, z); return v ? PAL[v] : null; })];
}
function group(name) { const g = GROUPS[name]; return g ? groupOf(g) : []; }

function build() {
  const parts = {};
  for (const n of ['hips', 'spine', 'chest', 'neck']) parts[n] = group(n);
  for (const s of ['L', 'R']) for (const n of ['upperArm', 'foreArm', 'hand', 'thigh', 'shin', 'foot']) parts[n + s] = group(n + s);
  const weapon = [{ geo: vox(groupOf(SPEAR), VOXEL, { jitter: 0.03 }), mat: 'metal' }];
  return { parts, head: group('head'), headOff: [0, 0, 0], hv: VOXEL * 0.94, bv: VOXEL, pauldrons: (sx) => group(sx > 0 ? 'pauldronL' : 'pauldronR'), weapon };
}

// Idle: lance held upright at the right side (right hand low, arm hanging), left arm relaxed — a clean silhouette from the chase camera
// (the shared two-hand diagonal guard piles the wide sheet-rig arm, pauldron and fist into one clump from behind).
const IDLE = { hips: [0, 0.9, 0], hipsR: [0, -16, 0], spine: [3, 4, 0], chest: [2, 6, 0], head: [2, 8, 0],
  spear: [-0.46, 0.92, 0.08, 0, 78, 0], gripR: 0, gripL: 0.5, lfree: 1, armL: [6, 0, 10, 24] };
const LOCO = { idle: clip([[0, P(IDLE)], [0.5, P({ ...IDLE, hips: [0, 0.885, 0.005], chest: [5, 7, 0], spine: [5, 5, 0], spear: [-0.46, 0.925, 0.08, 0, 77, 0] })], [1, P(IDLE)]], true) };

const face = [
  '....................', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....', '...GGGggggggggGGG...', '...GGgTTTTTTTTgGG...', '...GGgTwwwwwwTgGG...',
  '...GGgTwwwwwwTgGG...', '...GGgTTTTTTTTgGG...', '...GGGGGGGGGGGGGG...', '....GGGggggggGGG....', '.....GGGGGGGGGG.....', '......GGGGGGGG......',
  '......GGGGGGGG......', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....', '....GGGGGGGGGGGG....', '....GGGGGGGGGGGG....', '.....GGGGGGGGGG.....', '......GGGGGGGG......', '....................',
];

export const VANGUARD_SHEET = {
  id: 'vanguard', zh: 'EXO-01', en: 'VANGUARD', seal: 'PILOT', weapon: 'POWER LANCE', role: 'ARMORED RESPONSE',
  sub: 'BUILT TO HOLD THE LINE', copy: 'HOLD THE<br>LINE', tagline: 'Break the machine assault. Protect the people behind you.',
  cut: { sub: 'VANGUARD OVERDRIVE', seal: 'OVERDRIVE' },
  lines: { open: ['EXO-01 deployed.', 'The evacuation is behind us. Hold the line.'], musou: ['OVERDRIVE', 'Overdrive engaged.'] },
  face, pal: { G: '#f0cfa6', g: '#c8a880', T: '#2b282f', w: '#ff9528' },
  loco: LOCO, rigDim: RIG_DIM, matColor: 0.54, fill: 0.2, rim: 0.45, glow: 0.7, build, chains: () => [],
  // run: two hands on the lance at the ready, upright and gliding (HERO.run / HERO.carry: anims/locomotion.js, hero.js)
  run: { lean: [4, 6], chest: [3, 1], hipsY: [0.88, 0.04], bounce: 0.022, shift: 0.02, twist: 0.18, roll: 2, rock: 3,
    yaw: -14, yawUp: [4, 6], stepH: [0.05, 0.2], kick: 0.1, footX: 0.09 },
  carry: { run: { spear: [-0.24, 1.0, 0.06, 28, 24, 0], gripR: 0, gripL: 0.5, lfree: 0, armL: [0, 0, 0, 0] } },
};
