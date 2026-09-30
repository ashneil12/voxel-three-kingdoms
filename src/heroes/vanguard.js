// VANGUARD — the sheet's chibi ivory/navy mech, rebuilt voxel-for-voxel from the concept views (data: vanguard-data.js).
// One voxel = 0.0245 m. Every rig joint gets its own rigid voxel grid; the rig's proportions (rigDim) are the model's own,
// so the rest pose matches the sheet and the shared moveset/IK/animation drive it unchanged.
import { B, vox } from '../hero/model.js';
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
  return { parts, head: group('head'), headOff: [0, 0, 0], hv: VOXEL, bv: VOXEL, pauldrons: (sx) => group(sx > 0 ? 'pauldronL' : 'pauldronR'), weapon };
}

const face = [
  '....................', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....', '...GGGggggggggGGG...', '...GGgTTTTTTTTgGG...', '...GGgTwwwwwwTgGG...',
  '...GGgTwwwwwwTgGG...', '...GGgTTTTTTTTgGG...', '...GGGGGGGGGGGGGG...', '....GGGggggggGGG....', '.....GGGGGGGGGG.....', '......GGGGGGGG......',
  '......GGGGGGGG......', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....', '....GGGGGGGGGGGG....', '....GGGGGGGGGGGG....', '.....GGGGGGGGGG.....', '......GGGGGGGG......', '....................',
];

export const VANGUARD_VOXEL = {
  id: 'vanguard', zh: 'EXO-01', en: 'VANGUARD', seal: 'PILOT', weapon: 'POWER LANCE', role: 'ARMORED RESPONSE',
  sub: 'BUILT TO HOLD THE LINE', copy: 'HOLD THE<br>LINE', tagline: 'Break the machine assault. Protect the people behind you.',
  cut: { sub: 'VANGUARD OVERDRIVE', seal: 'OVERDRIVE' },
  lines: { open: ['EXO-01 deployed.', 'The evacuation is behind us. Hold the line.'], musou: ['OVERDRIVE', 'Overdrive engaged.'] },
  face, pal: { G: '#f0cfa6', g: '#c8a880', T: '#2b282f', w: '#ff9528' },
  rigDim: RIG_DIM, matColor: 0.6, fill: 0.22, rim: 0.5, glow: 0.45, build, chains: () => [],
};
