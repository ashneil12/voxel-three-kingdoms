// VANGUARD (EXO-01), "block concept": big flat blocks, ivory-dominant, navy only as flat panels, dark joint bands, a single wide orange visor and one orange
// chest light (concept render: VANGUARD / BLOCK CONCEPT). Same rig, joint boxes, spear moveset and clips as the original officers — only the
// shapes and colours differ, so every animation (grips, holds, strikes) works unchanged. No cloth chains: the silhouette is the design.
import { vox, B, P, mirX } from '../hero/model.js';
import { weaponGeo } from './vanguard-reskin.js';

const HV = 0.0165;
const C = { I: 0xece2cc, Id: 0xe4d9c0, N: 0x1d3466, Nl: 0x2c4a88, K: 0x2e2e34, D: 0x45454d, O: 0xffa817, Ol: 0xffd25a };
// faint 2-voxel checker, as in the concept render's flat blocks
const IV = (x, y, z) => ((x >> 1) + (y >> 1) + (z >> 1)) & 1 ? C.I : C.Id;
const NV = (x, y, z) => ((x >> 1) + (y >> 1) + (z >> 1)) & 1 ? C.N : 0x192f5e;

// ---------------------------------------------------------------- body (fine voxels FV = 0.0125, joint at the origin, +x = hero's left)
function torso() {
  return {
    hips: [
      B([-12, -10, -8], [12, 1, 8], IV),                                            // pelvis block
      B([-14, 1, -9], [14, 6, 9], C.K),                                              // belt
      ...[1, -1].map((sx) => mirX(B([8, 0, -2], [13, 7, 6], IV), sx)),              // ivory side pouches
      B([-5, 0, 8], [5, 7, 12], C.K), B([-2, 2, 12], [2, 5, 13], C.D),               // dark buckle
    ],
    spine: [B([-10, -6, -8], [10, 16, 8], IV), B([-10, -6, -8], [10, -4, 8], C.D)],
    chest: [
      B([-13, -4, -10], [13, 18, 10], IV),                                          // ivory shell
      B([-10, 4, 10], [10, 17, 13], NV),                                            // big navy chest plate
      B([-3, 0, 10], [3, 5, 12], IV),                                               // sternum tab
      B([4, 9, 13], [8, 13, 14], C.O), B([5, 10, 14], [7, 12, 15], C.Ol),            // the chest light
      ...[1, -1].map((sx) => mirX(B([5, 16, 8], [12, 21, 12], IV), sx)),            // collar flaps
      B([-7, 16, -7], [7, 22, 7], C.K),                                              // dark neck seal
      B([-12, 2, -14], [12, 18, -10], IV), B([-8, 6, -15], [8, 16, -14], NV),      // back plate with a navy panel
    ],
    neck: [B([-4, -2, -4], [4, 6, 4], C.K)],
  };
}

function limbs(P_) {
  for (const [s, sx] of [['R', -1], ['L', 1]]) {
    const m = (b) => mirX(b, sx);
    P_['upperArm' + s] = [B([-7, -20, -7], [7, 2, 7], IV), B([-7, -24, -7], [7, -20, 7], C.K)];            // ivory arm, dark elbow band
    P_['foreArm' + s] = [
      B([-8, -22, -8], [8, -3, 8], IV),                                                                     // big ivory gauntlet
      m(B([8, -19, -5], [9, -6, 5], NV)),                                                                   // navy panel on the outside
      B([-7, -3, -7], [7, 0, 7], C.K), B([-7, -22, -7], [7, -19, 7], C.K),                                   // dark bands
    ];
    P_['hand' + s] = [B([-6, -6, -6], [6, 5, 6], C.K), B([-5, -6, 5], [5, 0, 7], C.D)];                        // blocky dark fist
    P_['thigh' + s] = [
      B([-9, -30, -9], [9, 2, 9], IV),                                                                      // ivory thigh block
      m(B([9, -22, -3], [10, -8, 3], NV)),                                                                   // navy slit on the outer face
      B([-9, -36, -9], [9, -30, 9], C.K),                                                                    // dark knee band
    ];
    P_['shin' + s] = [
      B([-9, -34, -9], [9, 0, 9], IV),                                                                      // tall ivory greave
      B([-9, -4, -9], [9, 6, 10], C.K),                                                                       // dark knee block
      m(B([9, -26, -3], [10, -12, 3], NV)),                                                                  // navy slit
    ];
    P_['foot' + s] = [
      B([-9, -6, -8], [9, -2, 18], NV),                                                                     // navy sole
      B([-8, -2, -6], [8, 4, 16], IV), B([-8, 3, 11], [8, 5, 16], NV),                                      // ivory boot top, navy toe trim
    ];
  }
  return P_;
}

/** Pauldron: a big ivory block with a navy inset on the top/outer face and a dark underside slab. */
function pauldronBoxes(sx) {
  return [
    B([-5, 0, -11], [14, 12, 11], IV), B([13, 3, -5], [14, 10, 5], NV), B([-2, 12, -4], [11, 13, 4], NV),
    B([-4, -4, -8], [12, 0, 8], C.K),
  ].map((b) => mirX(b, sx));
}

// ---------------------------------------------------------------- head (chin y 0)
function head() {
  return [
    B([-8, 0, -8], [9, 14, 8], IV),                                                // ivory helmet block
    B([-8, 13, -8], [9, 18, 8], NV), B([-8, 11, 5], [9, 14, 8], IV),             // navy crown; ivory brim over the visor
    B([-8, 5, 7], [9, 12, 9], C.K),                                                 // dark visor frame
    B([-7, 6, 8], [8, 11, 10], C.O), B([-5, 8, 9], [6, 10, 10], C.Ol),              // the wide orange visor
    B([-3, 0, 8], [4, 5, 10], NV),                                                 // navy chin panel
    B([9, 3, -4], [12, 11, 4], IV), B([10, 5, -2], [12, 9, 2], C.K),               // ear block with a dark inset (left)
    B([-12, 3, -4], [-9, 11, 4], IV), B([-12, 5, -2], [-10, 9, 2], C.K),            // (right)
  ];
}

export const VANGUARD_BLOCK = {
  id: 'vanguard', zh: 'EXO-01', en: 'VANGUARD', seal: 'PILOT', weapon: 'POWER LANCE', role: 'ARMORED RESPONSE',
  sub: 'BUILT TO HOLD THE LINE', copy: 'HOLD THE<br>LINE', tagline: 'Break the machine assault. Protect the people behind you.',
  cut: { sub: 'VANGUARD OVERDRIVE', seal: 'OVERDRIVE' },
  lines: { open: ['EXO-01 deployed.', 'The evacuation is behind us. Hold the line.'], musou: ['OVERDRIVE', 'Overdrive engaged.'] },
  face: [
    '....................', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....', '...GGGggggggggGGG...', '...GGgTTTTTTTTgGG...', '...GGgTwwwwwwTgGG...',
    '...GGgTwwwwwwTgGG...', '...GGgTTTTTTTTgGG...', '...GGGGGGGGGGGGGG...', '....GGGggggggGGG....', '.....GGGGGGGGGG.....', '......GGGGGGGG......',
    '......GGGGGGGG......', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....', '....GGGGGGGGGGGG....', '....GGGGGGGGGGGG....', '.....GGGGGGGGGG.....', '......GGGGGGGG......', '....................',
  ],
  pal: { G: '#ece2cc', g: '#c9bd9f', T: '#2e2e34', w: '#ffa817' },
  glow: 1.0, matColor: 0.82, fill: 0.3, rim: 0.3,
  build: () => ({ parts: limbs(torso()), head: head(), hv: HV, bv: 0.0125, pauldrons: pauldronBoxes, weapon: weaponGeo() }),
  chains: () => [],
};
