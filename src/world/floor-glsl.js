// Shared GLSL for the Foundry set: value noise + the world-space "how wet is the floor here" mask. The floor material
// (foundry.js) uses it to darken/gloss the steel, and the post's screen-space floor reflection (post.js) uses the same
// function so mirror strength lands exactly where the floor looks wet.
export const NOISE_GLSL = /* glsl */`
  float fHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float fNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(fHash(i), fHash(i + vec2(1.0, 0.0)), f.x), mix(fHash(i + vec2(0.0, 1.0)), fHash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fFbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * fNoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
`;

export const WET_GLSL = /* glsl */`
  // 0 = dry plate, 1 = standing water. Broad puddles plus a finer film, biased wet so most of the arena mirrors.
  float foundryWet(vec2 p) {
    float n = fFbm(p * 0.075 + 3.7), m = fFbm(p * 0.33 - 9.2);
    return smoothstep(0.4, 0.55, n * 0.85 + m * 0.3);
  }
`;

/** Lamps the post reflects analytically on the wet floor (they hang above the frame, so screen-space marching never
 *  sees them). Filled by the stage: { x, y, z, r, g, b } with HDR colour. */
export const FLOOR_LIGHTS = [];
export const MAX_FLOOR_LIGHTS = 16;
