// Per-hero locomotion poses (replace the shared spear-holding ones in hero.js CLIPS): idle (breathing loop), air
// (t 0 take-off, 0.5 apex, 1 falling — the same time base as anims/locomotion.js), airFall (after an air string),
// land (squash, then up into his own idle) and hurt. A hero supplies full pose specs (rig.js P()) for his stance,
// weapon and arms; the legs of the air poses are shared.
import { P, clip } from '../hero/rig.js';

const LEGS = {
  up: { footL: [0.13, 0.0, 0.02, 55, 10], footR: [-0.14, 0.05, -0.14, 60, -15] },
  tuck: { footL: [0.15, 0.5, 0.22, 20, 10], footR: [-0.16, 0.36, -0.02, 40, -15] },
  hang: { footL: [0.15, 0.42, 0.2, 10, 10], footR: [-0.16, 0.3, -0.06, 30, -15] },
  reach: { footL: [0.16, 0.12, 0.22, -5, 10], footR: [-0.18, 0.16, -0.2, 15, -20] },
  spread: { footL: [0.16, 0.36, 0.16, 20, 12], footR: [-0.17, 0.26, -0.12, 30, -15] },
  gather: { footL: [0.17, 0.14, 0.16, 5, 12], footR: [-0.18, 0.18, -0.14, 15, -15] },
};

/** { idle, breath (delta at the loop's middle), takeoff, apex, fall, land, hurt } → clips. */
export function locoClips({ idle, breath = {}, takeoff, apex, fall, land, hurt }) {
  return {
    idle: clip([[0, P(idle)], [0.5, P({ ...idle, ...breath })], [1, P(idle)]], true),
    air: clip([
      [0, P({ ...takeoff, ...LEGS.up })],
      [0.22, P({ ...apex, ...LEGS.tuck }), 'out'],
      [0.55, P({ ...apex, ...LEGS.hang })],
      [1, P({ ...apex, ...LEGS.reach })],
    ]),
    airFall: clip([[0.5, P({ ...fall, ...LEGS.spread })], [1, P({ ...fall, hips: [0, 0.97, 0], ...LEGS.gather })]]),
    land: clip([[0, P(land)], [0.4, P({ ...land, hips: [land.hips[0], land.hips[1] + 0.04, land.hips[2]] }), 'out'], [1, P(idle)]]),
    hurt: clip([[0, P(idle)], [0.25, P(hurt), 'out'], [1, P(idle)]]),
  };
}
