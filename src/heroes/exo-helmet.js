// Shared EXO helmet + HUD portrait for the reskinned officers (same construction as Vanguard's helmet, parameterised per class).
import { B, P, md } from '../hero/model.js';

/** Head boxes (head voxels, chin y 0, 13-voxel head). pal: { iv, ivL, dark, frame, crest, crestL, light, lightL }; crestH = crest height in voxels. */
export function helmetBoxes(pal, { crestH = 4, fin = false } = {}) {
  const iv = (x, y, z) => (md(x * 3 + y * 5 + z * 7, 23) === 0 ? pal.ivL : pal.iv);
  const round = (a, b, r, f = iv) => B(a, b, (x, y, z) => {
    const dx = Math.min(x - a[0], b[0] - 1 - x), dz = Math.min(z - a[2], b[2] - 1 - z);
    return dx + dz < r ? null : f(x, y, z);
  });
  const disc = (x0, x1) => B([x0, 2, -5], [x1, 12, 5], (x, y, z) => {
    const u = Math.abs(y - 7 + 0.5), v = Math.abs(z + 0.5), d = Math.max(u, v, (u + v) * 0.74);
    return d > 5 ? null : d > 4.2 ? pal.dark : d > 3 ? pal.frame : d > 1.6 ? pal.light : pal.lightL;
  });
  return [
    round([-7, 3, -7], [8, 14, 7], 3), round([-6, 14, -6], [7, 17, 5], 3),
    round([-6, -1, -4], [7, 5, 7], 2),
    B([-5, -1, 6], [6, 6, 8], pal.frame),
    ...[1, 3].map((y) => P([-4, y, 7], [5, y + 1, 8], pal.dark)),
    B([-7, 5, 4], [8, 10, 9], pal.dark),
    B([-6, 6, 8], [7, 9, 10], pal.light), B([-5, 7, 9], [6, 8, 10], pal.lightL),
    B([-8, 6, 5], [-6, 9, 8], pal.light), B([7, 6, 5], [9, 9, 8], pal.light),
    round([-8, 10, 3], [9, 13, 9], 1), P([-6, 12, 8], [7, 13, 10], pal.crest),
    B([-3, 14, -6], [4, 17, 7], pal.crest),
    ...(fin ? [B([-1, 17, -7], [2, 17 + crestH + 3, 6], pal.crest)] : [-5, -2, 1, 4].map((z) => B([-2, 17, z], [3, 17 + Math.max(1, crestH - 2), z + 2], pal.crestL))),
    B([-1, 6, -8], [2, 13, -7], pal.light),
    disc(8, 11), disc(-10, -7),
  ];
}

/** 20x20 HUD portrait art + palette for a visored helmet. */
export const FACE = [
  '....................', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....', '...GGGggggggggGGG...', '...GGgTTTTTTTTgGG...', '...GGgTwwwwwwTgGG...',
  '...GGgTwwwwwwTgGG...', '...GGgTTTTTTTTgGG...', '...GGGGGGGGGGGGGG...', '....GGGggggggGGG....', '.....GGGGGGGGGG.....', '......GGGGGGGG......',
  '......GGGGGGGG......', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....', '....GGGGGGGGGGGG....', '....GGGGGGGGGGGG....', '.....GGGGGGGGGG.....', '......GGGGGGGG......', '....................',
];
