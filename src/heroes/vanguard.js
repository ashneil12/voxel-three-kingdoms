// VANGUARD (EXO-01) — built from the turnaround reference (vanguard_ref.png) through the img2threejs pipeline: the model is a list
// of boxes per rig joint (img2-builds/vanguard2/parts.py → export_game.py → vanguard-ref-data.js), the same boxes the pipeline's
// spec and review renders use. One voxel = 0.0273 pose units; the rig keeps the original heroes' proportions (no rigDim), so the
// shared moveset, grips and stance apply unchanged. The navy tabards are spring chains like the originals' robes.
import { vox, B } from '../hero/model.js';
import { BOXES, SPEAR, VOXEL } from './vanguard-ref-data.js';

const PAL = { I: 0xf0d7ae, N: 0x1e4aa0, O: 0xff9628, K: 0x28262c, D: 0x4a4852, B: 0x6aa8f0, S: 0x2a282e };

/** Every box is a plain colour block: the voxel mesher adds the AO that reads as stepped plates. */
const boxesOf = (list) => list.map(([x0, y0, z0, x1, y1, z1, c]) => B([x0, y0, z0], [x1, y1, z1], PAL[c]));

function build() {
  const parts = {};
  for (const n of ['hips', 'spine', 'chest', 'neck']) parts[n] = boxesOf(BOXES[n] || []);
  for (const s of ['L', 'R']) for (const n of ['upperArm', 'foreArm', 'hand', 'thigh', 'shin', 'foot']) parts[n + s] = boxesOf(BOXES[n + s] || []);
  const weapon = [{ geo: vox(boxesOf(SPEAR), VOXEL, { jitter: 0.03, ao: 0.3 }), mat: 'body' }];
  return { parts, head: boxesOf(BOXES.head), hv: VOXEL, bv: VOXEL, headOff: [0, 0, 0], pauldrons: (sx) => boxesOf(BOXES[sx > 0 ? 'pauldronL' : 'pauldronR']), weapon };
}

/** Navy tabard panel, 8 voxels wide, n segments of 4 voxels; orange squares under the belt (first segment) and near the hem (last). */
function tabardSeg(front) {
  return (i, n) => {
    const last = i === n - 1;
    return vox([
      B([-4, -4, 0], [4, 0, 1], (x, y) => {
        if (i === 0 && front && x >= -2 && x < 2 && y >= -3) return PAL.O;
        if (last && x >= -2 && x < 2 && y >= -2) return PAL.O;
        if (last && (x < -3 + (y < -3 ? 1 : 0) || x >= 3 - (y < -3 ? 1 : 0)) && y < -2) return null;      // tapered hem
        return PAL.N;
      }),
      B([-3, -4, -1], [3, 0, 0], PAL.N),
    ], VOXEL, { off: [0, 0, -0.5], jitter: 0.03, ao: 0.2 });
  };
}

const face = [
  '....................', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....', '...GGGggggggggGGG...', '...GGgTTTTTTTTgGG...', '...GGgTwwwwwwTgGG...',
  '...GGgTwwwwwwTgGG...', '...GGgTTTTTTTTgGG...', '...GGGGGGGGGGGGGG...', '....GGGggggggGGG....', '.....GGGGGGGGGG.....', '......GGGGGGGG......',
  '......GGGGGGGG......', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....', '....GGGGGGGGGGGG....', '....GGGGGGGGGGGG....', '.....GGGGGGGGGG.....', '......GGGGGGGG......', '....................',
];

export const VANGUARD = {
  id: 'vanguard', zh: 'EXO-01', en: 'VANGUARD', seal: 'PILOT', weapon: 'POWER LANCE', role: 'ARMORED RESPONSE',
  sub: 'BUILT TO HOLD THE LINE', copy: 'HOLD THE<br>LINE', tagline: 'Break the machine assault. Protect the people behind you.',
  cut: { sub: 'VANGUARD OVERDRIVE', seal: 'OVERDRIVE' },
  lines: { open: ['EXO-01 deployed.', 'The evacuation is behind us. Hold the line.'], musou: ['OVERDRIVE', 'Overdrive engaged.'] },
  face, pal: { G: '#f0d7ae', g: '#c8ac84', T: '#28262c', w: '#ff9628' },
  matColor: 0.74, fill: 0.26, rim: 0.5, glow: 0.35,
  // two hands on the lance at the ready while running, upright and gliding (see HERO.run / HERO.carry in anims/locomotion.js, hero.js)
  run: { lean: [4, 6], chest: [3, 1], hipsY: [0.88, 0.04], bounce: 0.022, shift: 0.02, twist: 0.18, roll: 2, rock: 3,
    yaw: -14, yawUp: [4, 6], stepH: [0.05, 0.2], kick: 0.1, footX: 0.09 },
  carry: { run: { spear: [-0.24, 1.0, 0.06, 28, 24, 0], gripR: 0, gripL: 0.5, lfree: 0, armL: [0, 0, 0, 0] } },
  build,
  chains() {
    const hit = [['thighL', 0.01], ['thighR', 0.01], ['kneeL', 0.02], ['kneeR', 0.02]];
    return [
      { joint: 'hips', anchor: [0, -0.02, 0.17], rest: [0, -1, 0.03], n: 4, len: 0.109, stiff: 0.16, drag: 0.2, wind: 0.35, face: [0, 0, 1],
        cone: 70, sway: 0.08, seg: tabardSeg(true), hit },
      { joint: 'hips', anchor: [0, -0.02, -0.2], rest: [0, -1, -0.04], n: 4, len: 0.109, stiff: 0.15, drag: 0.2, wind: 0.5,
        cone: 75, sway: 0.12, seg: tabardSeg(false), hit: ['hips', ...hit] },
    ];
  },
};
export const VANGUARD_VOXEL = VANGUARD;
