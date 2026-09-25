// Shared fine-voxel (0.0125 m) building blocks for hero definitions: every part is centred on its joint, 1 base-rig
// voxel = 2 of these. Colours come from the hero's palette.
import { B, P, md } from '../hero/model.js';

export const FV = 0.0125;

/** Hand: palm, knuckle creases, thumb on the inner side (sx: −1 right, +1 left). */
export function hand(sx, skin, skinD) {
  return [
    B([-4, -4, -3], [4, 4, 3], skin),
    P([-4, -4, 2], [4, -3, 3], skinD), P([-4, -1, 2], [4, 0, 3], skinD),
    B([sx > 0 ? 4 : -6, -2, -2], [sx > 0 ? 6 : -4, 3, 2], skin),
  ];
}

/** Gloved hand: leather with a lighter cuff. */
export function glove(sx, c, cuff) {
  return [...hand(sx, c, cuff), B([-5, 2, -4], [5, 4, 4], cuff)];
}

/** Bare, muscled upper arm: deltoid, biceps, triceps, groove under the deltoid; `band` adds an armband near the elbow. */
export function bareUpperArm({ skin, skinD, skinH }, band) {
  const sk = (x, y, z) => (z > 2 && y < -6 && y > -18 ? skinH : x > 2 || z < -2 ? skinD : skin);
  return [
    B([-4, -24, -4], [4, 2, 4], sk),
    B([-5, -4, -5], [5, 2, 5], sk),
    B([-4, -18, 2], [4, -6, 6], sk),
    B([-4, -16, -6], [4, -6, -2], skinD),
    P([-5, -6, -5], [5, -5, 6], skinD),
    ...(band ? [B([-5, -22, -5], [5, -18, 5], band[0]), P([-5, -22, -5], [5, -21, 5], band[1]), P([-5, -19, -5], [5, -18, 5], band[2])] : []),
  ];
}

/** Bare forearm with a bracer (cols: [base, dark, light]) over its lower two thirds. */
export function bracer(skin, [c, d, l], ridge = true) {
  return [
    B([-4, -22, -4], [4, 0, 4], skin),
    B([-5, -20, -5], [5, -4, 5], (x, y, z) => (md(y, 5) === 0 ? d : md(x - z + y, 7) === 0 ? l : c)),
    B([-6, -20, -6], [6, -18, 6], l), B([-6, -6, -6], [6, -4, 6], l),
    ...(ridge ? [B([-1, -18, 5], [1, -6, 6], l)] : []),
  ];
}

/** Boot foot with an optional upturned toe; `sole`, `trim` colours. */
export function bootFoot(c, cd, sole, { curl = false, trim = null } = {}) {
  return [
    B([-6, -6, -4], [6, 2, 12], c),
    ...(curl ? [B([-4, -4, 12], [4, 0, 16], c), B([-3, -3, 16], [3, 1, 18], c), B([-2, -1, 18], [2, 3, 20], cd), B([-1, 2, 19], [1, 4, 21], cd)]
      : [B([-5, -6, 12], [5, -1, 15], c), P([-5, -3, 12], [5, -1, 15], cd)]),
    P([-6, -6, -4], [6, -5, 21], sole),
    ...(trim ? [P([-6, 1, -4], [6, 2, 12], trim)] : []),
  ];
}

/** Head feature on both sides: x range [a, b) on the +x side and its mirror (head voxels are centred on column 0). */
export function symH(a, b, y0, y1, z0, z1, c, paint = true) {
  return [{ a: [a, y0, z0], b: [b, y1, z1], c, paint }, { a: [-b + 1, y0, z0], b: [-a + 1, y1, z1], c, paint }];
}
