// Renderer + post chain — the concept.png look: backlit golden hour, warm bloom, strong DoF, subtle retro texture.
//   scene  → sceneRT  full res, HDR, 4× MSAA, depth texture (crisp voxel edges)
//   atmos  → atmosRT  full res: aerial perspective (mauve haze away from the sun, peach toward it) + backlit dust
//                     in-scatter; alpha = view distance
//   dof    → dofRT    half res: single-pass gather bokeh; alpha = how much a blurred foreground covers this pixel
//   bloom             UnrealBloom on dofRT, source-hued, HDR threshold: only sun / fire / spear arc bloom
//   final  → screen   sharp/blurred mix per pixel (CoC from full-res depth), bloom, horizontal highlight streaks,
//                     chromatic fringe, split-tone grade (scene-linear), hue-preserving S-curve + per-channel soft
//                     shoulder (fire stays orange/yellow, white armour keeps its shading), bottom darkening,
//                     vignette, grain, 2 px ordered dither + palette quantisation (retro).
// post=0 renders straight to the canvas. Render-only: reads camera/focus, never touches sim state.
import * as THREE from 'three';
import { STAGE } from '../stages/index.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { createLightingEffects } from '../lighting/effects.js';
import { numParam } from '../core/params.js';   // shadow-mapped participating media (shared with the lighting lab)
import { NOISE_GLSL, WET_GLSL, FLOOR_LIGHTS, MAX_FLOOR_LIGHTS } from '../world/floor-glsl.js';

// Tunables. Every key k is uniform u<K> in all passes.
// Tuned on overview / crowd-fight / musou captures toward the concept stats (luma mean ≈ 0.36, p5 ≤ 0.08, p95 ≥ 0.78,
// saturation ≈ 0.33, bottom third darker): r2 medians mean 0.34-0.39, p5 0.05-0.06, p95 0.63-0.76, sat 0.32-0.33,
// hero armour never at white (it was 3-7 % of the hero box). The scene itself is low-contrast (scene-luminance p50 ≈ 0.11,
// p95 ≈ 0.22), hence the steep curve.
export const P = {   // live: tweak from the console in ?debug (import('/src/post/post.js').then(m => m.P))
  // tone curve (Lottes): scene luminance tmMidIn → display tmMidOut, tmContrast = mid slope, tmShoulder < 1 = roll-off
  // reaching 1.0 at tmMax; knee = start of the per-channel shoulder; hotDesat = how fast overflow bleaches to white
  exposure: 1.22, tmContrast: 3.3, tmShoulder: 0.97, tmMidIn: 0.11, tmMidOut: 0.1, tmMax: 5, knee: 0.75, hotDesat: 0.25,
  sat: 1.22, lift: 0.006,
  shadowTint: [0.9, 0.93, 1.12], highTint: [1.12, 1.0, 0.74], tintLo: 0.02, tintHi: 0.4,   // split tone: mauve-blue shade, peach-gold light
  hazeCool: [0.1, 0.11, 0.17], hazeWarm: [0.34, 0.2, 0.15], sunGlow: [0.9, 0.6, 0.35], sunGlowGeo: 0.8, inscatter: [0.02, 0.011, 0.005], sunBurst: [0.1, 0.06, 0.025], inscatterDist: 60,
  hazeStart: 9, hazeDensity: 0.006, hazeMax: 0.06, skyHaze: 0.3, skyGain: 0.5, farGain: 0.45,   // light enough that the wall keeps its bricks
  nearBlur: 26, farBlur: 0.6, bandNear: 1.4, bandFar: 5,          // DoF: CoC in half-res px, bands in metres
  bloom: 0.6, bloomRadius: 0.1, bloomThreshold: 1.5, bloomKnee: 0.5, bloomCool: 1.5, hdrClamp: 2.5,
  sharpen: 0.35, streak: 0.05, rowNoise: 0.018, ca: 1.3, grain: 0.03, levels: 40, dither: 0.8, vignette: 0.18, bottom: 0.25,
  // art-direction extras (0 = off): edge = ink outline from view-distance breaks, mono = wash to paper tone (reds kept),
  // paper = paper tint, pixel = screen pixel size for the chunky retro look
  edge: 0, mono: 0, paper: [1, 1, 1], pixel: 1,
  // screen-space floor mirror (floor pixels are tagged alpha 0.5 by the stage's floor material; strength scales the
  // Fresnel reflection, fallback = what an escaped ray sees) and hemisphere AO (radius in metres); 0 = off
  ssr: 0, ssrFallback: [0.012, 0.02, 0.032], ao: 0, aoRadius: 0.6, aoContact: 1,   // aoContact: the 7 cm plate-scale pass
  // auto-exposure (0 = off): partial adaptation toward aeKey mean scene luminance, gain clamped to [aeMin, aeMax]
  aeKey: 0.12, aeStrength: 0, aeMin: 0.7, aeMax: 1.6,
  // volumetric light (0 = off): single scattering of the shadow-casting sun, half res, `volumeSteps` march steps
  // cloud shadows (0 = off): strength, noise scale (1/m), wind (m/s, xz)
  cloud: 0, cloudScale: 0.03, cloudWind: [2.2, 0, 1.1],
  volume: 0, volumeDensity: 0.012, volumeHeight: 12, volumeAnisotropy: 0.35, volumeSteps: 20,
};
// Look presets (?look=name): overrides of P. 'dusk' is the default golden-hour concept look.
export const LOOKS = {
  dusk: {},
  ink: {   // 水墨: paper-toned wash, black ink outlines, only red survives
    edge: 0.9, mono: 0.92, paper: [0.96, 0.92, 0.84], sat: 1.0, grain: 0.05, levels: 64, dither: 0.3, streak: 0, ca: 0,
    shadowTint: [1, 1, 1], highTint: [1, 1, 1], vignette: 0.35, bottom: 0.1, bloom: 0.3, exposure: 1.35,
  },
  night: {  // 夜战火攻: moonlit blue shade, fire-orange light
    exposure: 0.95, sat: 1.1, shadowTint: [0.62, 0.78, 1.35], highTint: [1.35, 0.92, 0.55], tintLo: 0.03, tintHi: 0.5,
    hazeCool: [0.03, 0.05, 0.12], hazeWarm: [0.2, 0.08, 0.04], sunGlow: [0.5, 0.2, 0.1], skyGain: 0.22, farGain: 0.3,
    bloom: 1.0, bloomThreshold: 1.1, vignette: 0.3,
  },
  bright: { // 明快卡通: clean daylight, saturated, no film artefacts
    exposure: 1.45, tmContrast: 2.6, sat: 1.45, shadowTint: [0.97, 1.0, 1.08], highTint: [1.04, 1.02, 0.96],
    hazeCool: [0.22, 0.28, 0.36], hazeWarm: [0.32, 0.3, 0.26], sunGlow: [0.5, 0.45, 0.35], skyGain: 0.8,
    grain: 0, rowNoise: 0, ca: 0, streak: 0, dither: 0, levels: 255, vignette: 0.05, bottom: 0.05, nearBlur: 8, farBlur: 0.2,
    edge: 0.35,
  },
  foundry: {   // EXO Foundry: teal shade / amber light, smoky haze toward the furnace wall, hard contrast, strong bloom
    exposure: 1.05, sat: 1.2, tmContrast: 3.0,
    shadowTint: [0.86, 0.98, 1.1], highTint: [1.1, 0.98, 0.84], tintLo: 0.012, tintHi: 0.55,
    hazeCool: [0.015, 0.045, 0.065], hazeWarm: [0.22, 0.095, 0.045], sunGlow: [0.55, 0.22, 0.1], skyGain: 0.3, farGain: 0.55,
    hazeStart: 12, hazeDensity: 0.011, hazeMax: 0.55,
    bloom: 0.5, bloomThreshold: 1.8, bloomRadius: 0.1, vignette: 0.3, bottom: 0.1, grain: 0.02, streak: 0.05, ca: 1.0,
    nearBlur: 10, hdrClamp: 2.0, ssr: 0.75, ao: 0.9,
    volume: 0.22, volumeDensity: 0.01, volumeHeight: 9, volumeAnisotropy: 0.6,   // furnace light cut into shafts by the columns
    aeKey: 0.077, aeStrength: 0.5, aeMin: 0.65, aeMax: 1.5,   // key = measured mean at the hero shot: AE only answers deviations
  },
  city: {   // Neon City: cool blue shade, magenta / amber highlights, wet and contrasty, neon blooms
    exposure: 1.15, sat: 1.18, tmContrast: 2.8,
    shadowTint: [0.88, 0.95, 1.18], highTint: [1.08, 0.96, 1.0], tintLo: 0.012, tintHi: 0.5,
    hazeCool: [0.012, 0.016, 0.04], hazeWarm: [0.06, 0.025, 0.06], sunGlow: [0.1, 0.05, 0.12], skyGain: 0.35, farGain: 0.6,
    hazeStart: 14, hazeDensity: 0.012, hazeMax: 0.6,
    bloom: 0.5, bloomThreshold: 1.8, bloomRadius: 0.12, vignette: 0.32, bottom: 0.1, grain: 0.02, streak: 0.04, ca: 0.8,
    nearBlur: 10, hdrClamp: 2.0, ssr: 0.8, ao: 0.9,
    volume: 0.3, volumeDensity: 0.012, volumeHeight: 8, volumeAnisotropy: 0.45,   // moonlit rain haze
    aeKey: 0.024, aeStrength: 0.5, aeMin: 0.65, aeMax: 1.5,
  },
  retro: {  // 复古像素: 16-bit chunky pixels, few colour levels
    pixel: 3, levels: 20, dither: 0.35, grain: 0, rowNoise: 0, ca: 0, streak: 0, sat: 1.3, nearBlur: 0, farBlur: 0,
    bloom: 0.25, edge: 0.7, vignette: 0.1,
  },
};
const QS = new URLSearchParams(location.search);
const lookName = QS.get('look') || STAGE.look;
if (lookName && LOOKS[lookName]) Object.assign(P, LOOKS[lookName]);
if (!QS.get('look') && STAGE.post) Object.assign(P, STAGE.post);   // per-stage tweaks of its look
P.aeStrength = numParam('ae', P.aeStrength, 0, 1);   // debug: ?ae=0 off, ?ae=0.5 force on (probe with post.aeProbe())
// ?fx=low drops the screen-space effects (floor mirror + AO) for weaker GPUs; ?fx=ssr / ?fx=ao isolate one
const FX = QS.get('fx');
if (FX === 'low') { P.ssr = 0; P.ao = 0; } else if (FX === 'ssr') P.ao = 0; else if (FX === 'ao') P.ssr = 0;
const uName = (k) => 'u' + k[0].toUpperCase() + k.slice(1);
const pUniforms = () => Object.fromEntries(Object.entries(P).map(([k, v]) => [uName(k), { value: Array.isArray(v) ? new THREE.Vector3(...v) : v }]));
const syncP = (u) => { for (const k in P) { const x = u[uName(k)]; if (Array.isArray(P[k])) x.value.set(...P[k]); else x.value = P[k]; } };

const quadVS = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// circle of confusion (half-res px) from view distance: sharp band around the focus plane (hero + the ring around him),
// strong near-field blur, soft far field
const COC = /* glsl */`
  uniform float uFocus, uNearBlur, uNearScale, uFarBlur, uFarScale, uBandN, uBandF;
  float coc(float d) {
    float fn = max(uFocus - uBandN, 0.4), ff = uFocus + uBandF;
    return max(clamp((fn / d - 1.0) * uNearBlur * uNearScale, 0.0, 12.0), clamp((1.0 - ff / d) * uFarBlur * uFarScale, 0.0, 12.0));
  }`;

const AtmosShader = /* glsl */`
  uniform sampler2D tColor, tDepth; uniform mat4 uProjInv, uCamWorld; uniform vec3 uSunDir, uCamPos;
  uniform vec3 uHazeCool, uHazeWarm, uSunGlow, uInscatter, uSunBurst; uniform float uSunGlowGeo, uSkyGain, uFarGain, uHazeStart, uHazeDensity, uHazeMax, uSkyHaze, uHdrClamp, uInscatterDist;
  uniform sampler2D tVolume; uniform vec2 uVolTexel; uniform float uVolOn, uVolume;
  uniform float uCloud, uCloudScale, uCloudT, uAoContact; uniform vec3 uCloudWind;   // noise: NOISE_GLSL is already in this shader
  uniform float uSsr, uAo, uAoRadius; uniform mat4 uProj; uniform vec2 uRes; uniform sampler2D tSsr;
  varying vec2 vUv;
  ${NOISE_GLSL}${WET_GLSL}
  vec3 vpAt(vec2 uv) { float z = texture2D(tDepth, uv).x; vec4 q = uProjInv * vec4(uv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0); return q.xyz / q.w; }
  // the mirror pass is half-res with one jittered ray per pixel. A 16-tap blur stretched 3:1 vertically turns its
  // speckle and stair-stepping into the long streaks real wet ground makes (a puddle mirror is never pixel-sharp)
  vec3 ssrDenoise(vec2 uv) {
    vec2 t = 2.2 / uRes; vec3 acc = texture2D(tSsr, uv).rgb * 2.0; float w = 2.0;
    for (int i = 0; i < 16; i++) {
      float a = float(i) * 2.39996323, r = sqrt((float(i) + 0.5) / 16.0);
      acc += texture2D(tSsr, uv + vec2(cos(a) * 1.6, sin(a) * 5.0) * r * t).rgb; w += 1.0;
    }
    vec3 r = acc / w;
    return any(isnan(r)) || any(isinf(r)) ? vec3(0.0) : r;
  }
  // half-res light shafts back to full res, depth-aware (the volume target stores view depth in alpha): bilinear would
  // bleed sky-lit air onto the hero's silhouette
  vec3 volumeAt(float depth) {
    vec2 cell = floor(vUv / uVolTexel - 0.5), f = fract(vUv / uVolTexel - 0.5);
    vec3 sum = vec3(0.0); float ws = 0.0;
    for (int y = 0; y < 2; y++) for (int x = 0; x < 2; x++) {
      vec2 k = vec2(float(x), float(y)); vec4 t = texture2D(tVolume, (cell + k + 0.5) * uVolTexel);
      vec2 w = mix(1.0 - f, f, k);
      float wt = max(w.x * w.y, 1e-4) * exp(-abs(t.a - depth) / max(0.03, depth * 0.006));
      sum += t.rgb * wt; ws += wt;
    }
    vec3 r = ws > 1e-5 ? sum / ws : texture2D(tVolume, vUv).rgb;
    return any(isnan(r)) ? vec3(0.0) : r;
  }
  float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
  // hemisphere AO: normal from depth differences, 12 cosine-weighted taps in a ring-rotated frame (grain is hidden by
  // the final pass's dither); contact darkening under feet and inside crowds
  float ssao(vec3 vp, float R, float k) {
    vec2 t = 1.0 / uRes;
    vec3 pl = vpAt(vUv - vec2(t.x, 0.0)), pr = vpAt(vUv + vec2(t.x, 0.0)), pu = vpAt(vUv + vec2(0.0, t.y)), pd = vpAt(vUv - vec2(0.0, t.y));
    vec3 dx = abs(pr.z - vp.z) < abs(vp.z - pl.z) ? pr - vp : vp - pl;
    vec3 dy = abs(pu.z - vp.z) < abs(vp.z - pd.z) ? pu - vp : vp - pd;
    vec3 N = normalize(cross(dx, dy));
    if (dot(N, vp) > 0.0) N = -N;
    vec3 T = normalize(abs(N.y) < 0.99 ? cross(N, vec3(0.0, 1.0, 0.0)) : cross(N, vec3(1.0, 0.0, 0.0))), B = cross(N, T);
    float ang = ign(gl_FragCoord.xy + R * 97.0) * 6.2831853, occ = 0.0;
    for (int i = 0; i < 12; i++) {
      float u = (float(i) + 0.5) / 12.0, r = sqrt(u), phi = float(i) * 2.39996323 + ang;
      vec3 sp = vp + (T * (r * cos(phi)) + B * (r * sin(phi)) + N * sqrt(1.0 - u)) * R * (0.25 + 0.75 * u);
      vec4 cp = uProj * vec4(sp, 1.0);
      float sz = vpAt(cp.xy / cp.w * 0.5 + 0.5).z;
      occ += step(sp.z + R * 0.04, sz) * smoothstep(0.0, 1.0, R / max(abs(vp.z - sz), 1e-3));
    }
    return 1.0 - clamp(occ / 12.0 * k, 0.0, 0.92);
  }
  void main() {
    float z = texture2D(tDepth, vUv).x;
    vec4 v = uProjInv * vec4(vUv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0); v.xyz /= v.w;
    vec3 dir = normalize(mat3(uCamWorld) * v.xyz);
    bool sky = z >= 0.99999;
    float dist = sky ? 5000.0 : length(v.xyz);
    // graduated exposure: fully fogged distance and sky sit a stop lower, so close-ups against the horizon read as a
    // sunset gradient instead of a white-out
    vec4 src = texture2D(tColor, vUv);
    // one NaN/Inf pixel (MSAA edge extrapolation, a degenerate normal) would be smeared into black blocks by the square DoF + bloom
    if (any(isnan(src)) || any(isinf(src))) src = vec4(0.0, 0.0, 0.0, 1.0);
    vec3 c = src.rgb * (sky ? uSkyGain : mix(1.0, uFarGain, smoothstep(60.0, 250.0, dist)));
    if (!sky) {
      if (uAo > 0.0) {
        c *= mix(1.0, ssao(v.xyz, uAoRadius, uAo), 1.0 - smoothstep(35.0, 80.0, dist));
        // contact AO at plate scale (~7 cm): dark gaps where armour overlaps, under lips, between fingers; near field only
        if (uAoContact > 0.0) c *= mix(1.0, ssao(v.xyz, 0.07, uAo * 1.6 * uAoContact), 1.0 - smoothstep(6.0, 16.0, dist));
      }
      if (uSsr > 0.0 && abs(src.a - 0.5) < 0.12) c += ssrDenoise(vUv);
    }
    // drifting cloud shadows (outdoor stages): world-space fbm on the ground plane under each pixel, moving with the wind;
    // only darkens what the sun can reach (fully shaded pixels barely change), sky untouched
    if (uCloud > 0.0 && !sky) {
      vec3 wp = uCamPos + dir * dist;
      vec2 q = (wp.xz + uSunDir.xz / max(uSunDir.y, 0.2) * wp.y) * uCloudScale + uCloudWind.xz * uCloudT;
      float cs = smoothstep(0.42, 0.68, fFbm(q) * 0.75 + fNoise(q * 0.37 + 4.0) * 0.4);
      float lit = smoothstep(0.02, 0.25, dot(c, vec3(0.2126, 0.7152, 0.0722)));
      c *= 1.0 - uCloud * cs * lit * (1.0 - smoothstep(180.0, 420.0, dist));
    }
    if (uVolOn > 0.5) c += volumeAt(-v.z) * uVolume;          // light shafts through the sun's shadow map
    float mu = dot(dir, uSunDir);
    vec3 hz = mix(uHazeCool, uHazeWarm, smoothstep(-0.4, 0.95, mu)) + uSunGlow * pow(max(mu, 0.0), 10.0) * (sky ? 1.0 : uSunGlowGeo);  // backlit walls stay silhouettes
    float wy = uCamPos.y + dir.y * min(dist, 400.0);                      // height of the hit point: dust hugs the ground
    float a = (1.0 - exp(-max(dist - uHazeStart, 0.0) * uHazeDensity)) * mix(0.6, 1.0, exp(-max(wy, 0.0) / 14.0));
    if (sky) a = uSkyHaze * (1.0 - smoothstep(0.0, 0.4, dir.y));
    c = mix(c, hz, a * uHazeMax * (1.0 - smoothstep(0.9, 2.0, max(c.r, max(c.g, c.b)))));   // fires stay fire through the haze
    // backlit dust: sunlight scattered forward by the air between the camera and the hit point (lifts the sun side
    // of the frame; additive and growing with distance, so near silhouettes stay readable)
    // (broad lift, plus a tight golden burst around the sun that only builds up over long distances: the concept's
    // glowing sky behind the castle, while the backlit wall itself stays a legible silhouette)
    float dd = min(dist, 400.0);
    c += uInscatter * pow(max(mu, 0.0), 4.0) * (1.0 - exp(-dd / uInscatterDist)) + uSunBurst * pow(max(mu, 0.0), 16.0) * (1.0 - exp(-dd / (3.0 * uInscatterDist)));
    // tame stacked additive fire before bloom; hue-preserving (scale, not per-channel clip) so flames stay orange
    float cm = max(c.r, max(c.g, c.b));
    gl_FragColor = vec4(c * min(1.0, uHdrClamp / max(cm, 1e-4)), dist);
  }`;

// Floor mirror pass (half res). For every floor-tagged pixel: reflect the view ray about the (ripple-perturbed) floor
// normal and trace it through the depth buffer in *pixel* steps (Morgan McGuire's DDA: perspective-correct 1/w
// interpolation, so thin things like the column light strips are never stepped over), then read the HDR scene colour at
// the hit. Lamps hang above the frame, so they are intersected analytically. Output = reflection × Fresnel × wetness.
const SSR_STEPS = 150;
const SsrShader = /* glsl */`
  uniform sampler2D tColor, tDepth; uniform mat4 uProj, uProjInv, uCamWorld; uniform vec2 uRes; uniform float uNear, uSsr; uniform vec2 uHeroXZ;
  uniform vec3 uSsrFallback, uLampPos[${MAX_FLOOR_LIGHTS}], uLampCol[${MAX_FLOOR_LIGHTS}]; uniform int uNLamps;
  varying vec2 vUv;
  ${NOISE_GLSL}${WET_GLSL}
  float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
  float viewZ(vec2 px) { float d = texture2D(tDepth, px / uRes).x * 2.0 - 1.0; return -uProj[3][2] / (d + uProj[2][2]); }
  vec4 toPx(vec3 p) { vec4 h = uProj * vec4(p, 1.0); h.xy = (h.xy * 0.5 + h.w * 0.5) * uRes; return h; }
  bool trace(vec3 o, vec3 d, float jitter, out vec2 hitPx, out float frac) {
    float nearZ = -uNear, maxDist = 90.0;
    float rayLen = (o.z + d.z * maxDist) > nearZ ? (nearZ - o.z) / d.z : maxDist;
    vec3 e = o + d * rayLen;
    vec4 H0 = toPx(o), H1 = toPx(e);
    float k0 = 1.0 / H0.w, k1 = 1.0 / H1.w;
    vec3 Q0 = o * k0, Q1 = e * k1;
    vec2 P0 = H0.xy * k0, P1 = H1.xy * k1;
    P1 += vec2(dot(P1 - P0, P1 - P0) < 0.0001 ? 0.01 : 0.0);
    vec2 delta = P1 - P0; bool permute = false;
    if (abs(delta.x) < abs(delta.y)) { permute = true; delta = delta.yx; P0 = P0.yx; P1 = P1.yx; }
    float stepDir = sign(delta.x), invdx = stepDir / delta.x, stride = 3.0;
    vec2 dP = vec2(stepDir, delta.y * invdx) * stride; float dQz = (Q1.z - Q0.z) * invdx * stride, dk = (k1 - k0) * invdx * stride;
    vec2 P = P0 + dP * jitter; float Qz = Q0.z + dQz * jitter, k = k0 + dk * jitter, prevZ = o.z, endx = P1.x * stepDir;
    for (int i = 0; i < ${SSR_STEPS}; i++) {
      if (P.x * stepDir > endx) break;
      P += dP; Qz += dQz; k += dk;
      float z1 = (dQz * 0.5 + Qz) / (dk * 0.5 + k), lo = min(prevZ, z1), hi = max(prevZ, z1); prevZ = z1;
      vec2 pp = permute ? P.yx : P;
      if (pp.x < 0.0 || pp.y < 0.0 || pp.x >= uRes.x || pp.y >= uRes.y) break;
      float sz = viewZ(pp);
      if (hi >= sz - (0.35 + 0.035 * -sz) && lo <= sz) { hitPx = pp; frac = float(i) / ${SSR_STEPS}.0; return true; }
    }
    return false;
  }
  void main() {
    vec4 src = texture2D(tColor, vUv);
    if (abs(src.a - 0.5) > 0.12) { gl_FragColor = vec4(0.0); return; }        // not floor
    float z = texture2D(tDepth, vUv).x;
    vec4 q = uProjInv * vec4(vUv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0); vec3 vp = q.xyz / q.w;
    vec3 wp = (uCamWorld * vec4(vp, 1.0)).xyz;
    float wet = max(foundryWet(wp.xz), 0.9 * (1.0 - smoothstep(1.2, 4.5, length(wp.xz - uHeroXZ))));   // a wet patch always lies under the hero so the suit mirrors in the floor
    // ripples + broad undulation tilt the mirror normal (flat in puddles, rougher on dry plates)
    vec2 rip = (vec2(fNoise(wp.xz * 2.3 + 7.0), fNoise(wp.xz * 2.3 - 3.0)) - 0.5) * 0.6 + (vec2(fNoise(wp.xz * 0.4), fNoise(wp.xz * 0.4 + 9.0)) - 0.5) * 1.6;
    vec3 nW = normalize(vec3(rip.x, 1.0 / mix(0.1, 0.03, wet), rip.y));
    vec3 n = vec3(dot(uCamWorld[0].xyz, nW), dot(uCamWorld[1].xyz, nW), dot(uCamWorld[2].xyz, nW));
    vec3 V = normalize(vp);
    float F0 = mix(0.03, 0.12, wet);
    float F = F0 + (1.0 - F0) * pow(1.0 - clamp(dot(n, -V), 0.0, 1.0), 5.0);
    float rough = mix(0.3, 0.006, wet);
    float nz = ign(gl_FragCoord.xy + 13.0);
    vec3 rd = reflect(V, n);
    rd = normalize(rd + rough * (vec3(nz, ign(gl_FragCoord.yx + 71.0), ign(gl_FragCoord.xy * 1.7 + 5.0)) - 0.5) * 2.0);
    if (dot(rd, n) < 0.03) rd = normalize(rd + n * (0.03 - dot(rd, n)));
    vec2 hitPx; float frac; vec3 col = uSsrFallback;
    if (trace(vp + n * 0.02, rd, nz, hitPx, frac)) {
      vec2 huv = hitPx / uRes, e = abs(huv - 0.5) * 2.0;
      vec3 h = texture2D(tColor, huv).rgb;
      h /= 1.0 + 0.3 * max(h.r, max(h.g, h.b));                              // compress hot sources so one bay cannot flood the floor
      col = mix(uSsrFallback, h, (1.0 - smoothstep(0.75, 1.0, max(e.x, e.y))) * (1.0 - smoothstep(0.5, 1.0, frac)));
    }
    // lamps above the frame: intersect the world-space reflected ray with each lamp's plane, glow by miss distance
    // (blur grows with roughness and distance: sharp lens streaks on wet floor, a soft smear on dry plates)
    vec3 rdW = mat3(uCamWorld) * rd;
    if (rdW.y > 0.02) for (int i = 0; i < ${MAX_FLOOR_LIGHTS}; i++) {
      if (i >= uNLamps) break;
      float t = (uLampPos[i].y - wp.y) / rdW.y;
      vec2 dd = wp.xz + rdW.xz * t - uLampPos[i].xz;
      float R = 1.1 + t * rough * 0.5;
      col += uLampCol[i] * exp(-dot(dd, dd) / (R * R)) * (1.32 / (R * R));
    }
    gl_FragColor = vec4(col * F * mix(0.1, 1.0, wet) * uSsr, 1.0);
  }`;

// Gather DoF (after Gustafsson's single-pass bokeh): golden-angle spiral stretched to a square, so blurred voxels read
// as soft blocks as in the concept. Every tap spreads by its own CoC; taps behind the centre are clamped to the centre's
// CoC so a sharp hero never smears onto the blurred background.
const DofShader = /* glsl */`
  uniform sampler2D tAtmos; uniform vec2 uTexel;
  varying vec2 vUv;
  ${COC}
  #define RAD_SCALE 0.85
  void main() {
    vec4 c0 = texture2D(tAtmos, vUv);
    float cSize = coc(c0.a);
    vec3 col = c0.rgb; float tot = 1.0, fg = 0.0, radius = RAD_SCALE;
    for (float ang = 0.0; radius < 12.0; ang += 2.39996323) {
      vec2 dv = vec2(cos(ang), sin(ang)); dv /= max(abs(dv.x), abs(dv.y));   // square bokeh: soft voxel blocks
      vec4 s = texture2D(tAtmos, vUv + dv * uTexel * radius);
      float sSize = coc(s.a);
      if (s.a > c0.a) sSize = clamp(sSize, 0.0, cSize * 2.0);
      float m = smoothstep(radius - 0.5, radius + 0.5, sSize);
      col += mix(col / tot, s.rgb, m); tot += 1.0;
      fg += s.a < c0.a - 0.5 ? m : 0.0;                                    // blurred foreground spilling over us
      radius += RAD_SCALE / radius;
    }
    gl_FragColor = vec4(col / tot, clamp(fg / tot * 4.0, 0.0, 1.0));
  }`;

const FinalShader = /* glsl */`
  uniform sampler2D tSharp, tDof, tBloom; uniform vec2 uRes; uniform float uTime, uFlash;
  uniform sampler2D tAe; uniform float uAeKey, uAeStrength, uAeMin, uAeMax;
  float aeGain() { if (uAeStrength <= 0.0) return 1.0; float a = max(texture2D(tAe, vec2(0.5)).r, 1e-3); return clamp(pow(uAeKey / a, uAeStrength), uAeMin, uAeMax); }
  uniform float uExposure, uTmContrast, uTmShoulder, uTmB, uTmC, uKnee, uHotDesat, uSat, uLift, uTintLo, uTintHi, uSharpen, uStreak, uRowNoise, uCa, uGrain, uLevels, uDither, uVignette, uBottom;
  uniform float uEdge, uMono, uPixel;
  uniform vec3 uShadowTint, uHighTint, uPaper;
  varying vec2 vUv;
  ${COC}
  float bayer4(vec2 p) {
    int i = int(mod(p.x, 4.0)) + int(mod(p.y, 4.0)) * 4;
    int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
    return (float(m[i]) + 0.5) / 16.0 - 0.5;
  }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  // scene colour at uv: full-res sharp where in focus (lightly unsharp-masked: crisp voxel edges), half-res bokeh where
  // the pixel's own depth is out of focus or a blurred foreground covers it; + bloom
  vec3 scene(vec2 uv) {
    vec2 t = 1.0 / uRes;
    vec4 s = texture2D(tSharp, uv);
    vec3 nb = texture2D(tSharp, uv + vec2(t.x, 0.0)).rgb + texture2D(tSharp, uv - vec2(t.x, 0.0)).rgb
            + texture2D(tSharp, uv + vec2(0.0, t.y)).rgb + texture2D(tSharp, uv - vec2(0.0, t.y)).rgb;
    vec3 sharp = max(s.rgb + (s.rgb - nb * 0.25) * uSharpen, 0.0);
    vec4 b = texture2D(tDof, uv);
    float k = max(smoothstep(0.3, 1.3, coc(s.a)), b.a);
    return mix(sharp, b.rgb, k) + texture2D(tBloom, uv).rgb;
  }
  // ink outline: relative jump in view distance (tSharp alpha) to any 4-neighbour at pixel scale
  float edgeAt(vec2 uv) {
    vec2 t = max(uPixel, 1.0) / uRes;
    float c = texture2D(tSharp, uv).a, e = 0.0;
    for (int i = 0; i < 4; i++) {
      vec2 o = i == 0 ? vec2(t.x, 0.0) : i == 1 ? vec2(-t.x, 0.0) : i == 2 ? vec2(0.0, t.y) : vec2(0.0, -t.y);
      float n = texture2D(tSharp, uv + o).a;
      e = max(e, (n - c) / max(c, 0.5));   // only the near side of a break draws the line
    }
    return smoothstep(0.06, 0.2, e) * (1.0 - smoothstep(25.0, 60.0, c));
  }
  void main() {
    vec2 uv = uPixel > 1.0 ? (floor(vUv * uRes / uPixel) + 0.5) * uPixel / uRes : vUv;
    vec2 d = uv - 0.5;
    // light lateral chromatic fringe toward the edges
    vec2 ca = vec2(uCa * dot(d, d) * 4.0 / uRes.x, 0.0);
    vec3 c = vec3(scene(uv + ca).r, scene(uv).g, scene(uv - ca).b);
    // faint horizontal streaks: highlights smear sideways (tape / anamorphic feel), plus low row-to-row jitter
    vec3 st = vec3(0.0);
    for (int i = 1; i <= 6; i++) {
      float o = (float(i * i) + 1.0) * 2.0 / uRes.x, w = 1.0 / float(i);
      st += (max(texture2D(tDof, uv + vec2(o, 0.0)).rgb - 1.0, 0.0) + max(texture2D(tDof, uv - vec2(o, 0.0)).rgb - 1.0, 0.0)) * w;
    }
    c += st * uStreak * vec3(1.0, 0.86, 0.7);
    c *= 1.0 + (hash(vec2(floor(gl_FragCoord.y * 0.5), floor(uTime * 12.0))) - 0.5) * uRowNoise;
    // golden-hour grade in scene-linear (before the curve, so its shoulder also rolls off the tinted highlights):
    // split tone — cool mauve-blue shade, peach-gold light; blue-dominant pixels (spear arc, tassel, teal trim) keep
    // their cool, the arc is the one cool light in the frame — then saturation
    c *= uExposure * aeGain();
    float L = max(dot(c, vec3(0.2126, 0.7152, 0.0722)), 1e-6);
    float cool = smoothstep(0.0, 0.25, (c.b - c.r) / max(c.b, 1e-4));
    // (emissive-hot light — musou burst, flashes — fades back to neutral so it still burns to white, not cream)
    c *= mix(mix(uShadowTint, mix(uHighTint, vec3(0.97, 1.0, 1.06), cool), smoothstep(uTintLo, uTintHi, L)), vec3(1.0), smoothstep(1.2, 3.0, L));
    L = max(dot(c, vec3(0.2126, 0.7152, 0.0722)), 1e-6);
    c = max(mix(vec3(L), c, uSat), 0.0);
    // film response: a Lottes S-curve on luminance (steep mids = the concept's contrast, long shoulder) scales the
    // colour, so hue survives the top end; then a per-channel soft shoulder takes the overflow, so saturated light walks
    // orange → yellow → white like real fire (not peach-white) and white armour rolls off with its shading
    c *= pow(L, uTmContrast) / (pow(L, uTmContrast * uTmShoulder) * uTmB + uTmC) / L;
    float pk = max(c.r, max(c.g, c.b));
    c = min(c, uKnee) + (1.0 - uKnee) * (1.0 - exp(-max(c - uKnee, 0.0) / (1.0 - uKnee)));
    float pk2 = max(c.r, max(c.g, c.b));
    c = mix(c, vec3(pk2), 1.0 - 1.0 / (uHotDesat * max(pk - pk2, 0.0) + 1.0));   // only the hottest cores bleach
    c = uLift * vec3(1.0, 0.8, 0.75) + min(c, 1.0) * (1.0 - uLift);
    c = sRGBTransferOETF(vec4(max(c, 0.0), 1.0)).rgb;
    // wash: everything but strong reds goes to paper tone by lightness; ink outline on top
    if (uMono > 0.0) {
      float Lp = dot(c, vec3(0.299, 0.587, 0.114));
      float red = smoothstep(0.12, 0.35, c.r - max(c.g, c.b));
      c = mix(c, uPaper * smoothstep(0.03, 0.85, Lp), uMono * (1.0 - red));
    }
    if (uEdge > 0.0) c *= 1.0 - uEdge * edgeAt(uv);
    // lens: soft vignette + darker foreground band (concept: bottom third darker than the top)
    c *= (1.0 - uVignette * smoothstep(0.35, 0.95, length(d * vec2(1.6, 1.0)))) * (1.0 - uBottom * (1.0 - smoothstep(0.0, 0.42, vUv.y)));
    c = mix(c, vec3(1.0, 0.97, 0.9), uFlash);
    // grain on the screen grid (fine); dither + quantise on a 2 px grid (retro)
    c += (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 97.0) - 0.5) * uGrain;
    c += bayer4(floor(gl_FragCoord.xy / max(2.0, uPixel))) * uDither / uLevels;
    c = floor(c * uLevels + 0.5) / uLevels;
    gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
  }`;

// Temporal AA: the camera is jittered by a sub-pixel Halton offset every frame; this pass reprojects last frame's
// resolved image through the depth buffer (camera motion), clamps it to the current pixel's 3x3 colour neighbourhood
// (so moving soldiers / VFX never ghost) and blends. Voxel edges stop crawling, and the one-sample-per-pixel effects
// downstream (SSR rays, AO taps) get averaged over frames. Alpha (the floor tag) is always the current frame's.
const TaaShader = /* glsl */`
  uniform sampler2D tCur, tHist, tDepth; uniform mat4 uInvVP, uPrevVP; uniform vec2 uRes; uniform float uFeedback, uValid;
  varying vec2 vUv;
  vec3 tm(vec3 c) { return c / (1.0 + max(c.r, max(c.g, c.b))); }          // compress HDR so a hot pixel can't dominate
  vec3 itm(vec3 c) { return c / max(1.0 - max(c.r, max(c.g, c.b)), 1e-4); }
  // 5-tap Catmull-Rom history fetch: bilinear resampling every frame would soften the image a little more each frame
  vec3 histAt(vec2 uv) {
    vec2 p = uv * uRes - 0.5, f = fract(p), c = (floor(p) + 0.5) / uRes;
    vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f)), w1 = 1.0 + f * f * (-2.5 + 1.5 * f), w2 = f * (0.5 + f * (2.0 - 1.5 * f)), w3 = f * f * (-0.5 + 0.5 * f);
    vec2 w12 = w1 + w2, t0 = c - 1.0 / uRes, t3 = c + 2.0 / uRes, t12 = c + (w2 / w12) / uRes;
    vec3 r = texture2D(tHist, vec2(t12.x, t0.y)).rgb * w12.x * w0.y
           + texture2D(tHist, vec2(t0.x, t12.y)).rgb * w0.x * w12.y + texture2D(tHist, t12).rgb * w12.x * w12.y + texture2D(tHist, vec2(t3.x, t12.y)).rgb * w3.x * w12.y
           + texture2D(tHist, vec2(t12.x, t3.y)).rgb * w12.x * w3.y;
    float wsum = w12.x * w0.y + w0.x * w12.y + w12.x * w12.y + w3.x * w12.y + w12.x * w3.y;
    return max(r / wsum, 0.0);
  }
  void main() {
    vec4 cur4 = texture2D(tCur, vUv); vec3 cur = tm(cur4.rgb);
    vec2 t = 1.0 / uRes; vec3 lo = cur, hi = cur, m1 = vec3(0.0), m2 = vec3(0.0);
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec3 s = tm(texture2D(tCur, vUv + vec2(float(x), float(y)) * t).rgb);
      lo = min(lo, s); hi = max(hi, s); m1 += s; m2 += s * s;
    }
    m1 /= 9.0; vec3 sd = sqrt(max(m2 / 9.0 - m1 * m1, 0.0));
    lo = max(lo, m1 - sd); hi = min(hi, m1 + sd);            // variance clip: tighter than min/max
    float z = texture2D(tDepth, vUv).x;
    vec4 w = uInvVP * vec4(vUv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0); w /= w.w;
    vec4 pc = uPrevVP * w; vec2 puv = pc.xy / pc.w * 0.5 + 0.5;
    float inside = step(0.0, puv.x) * step(puv.x, 1.0) * step(0.0, puv.y) * step(puv.y, 1.0) * uValid;
    vec3 hist = clamp(tm(histAt(puv)), lo, hi);
    // the reprojection only knows camera motion: anything moving with the camera (the hero) or on its own would drag
    // a smear, so trust history less the further this pixel moved on screen
    float px = length((puv - vUv) * uRes);
    float fb = uFeedback * (1.0 - smoothstep(0.5, 6.0, px) * 0.55);
    vec3 o = mix(cur, hist, fb * inside);
    if (any(isnan(o))) o = cur;
    gl_FragColor = vec4(itm(o), cur4.a);
  }`;
// Auto-exposure: (1) average log luminance of the lit scene over a 32x18 grid, centre-weighted (where the fight is),
// skipping the sky; (2) adapt a 1x1 value toward it over ~1 s (faster when brightening). The final pass multiplies the
// look's hand-tuned exposure by pow(key / adapted, strength), clamped, so stages keep their mood but a dark street or a
// sunlit plaza pulls back toward a readable middle.
const AeMeasure = /* glsl */`
  uniform sampler2D tColor; varying vec2 vUv;
  void main() {
    float s = 0.0, w = 0.0;
    for (int y = 0; y < 18; y++) for (int x = 0; x < 32; x++) {
      vec2 uv = (vec2(float(x), float(y)) + 0.5) / vec2(32.0, 18.0);
      vec3 c = texture2D(tColor, uv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722)), cw = 1.0 - 0.7 * length((uv - 0.5) * vec2(1.6, 1.2));
      s += log(max(l, 1e-3)) * cw; w += cw;
    }
    gl_FragColor = vec4(exp(s / w), 0.0, 0.0, 1.0);
  }`;
const AeAdapt = /* glsl */`
  uniform sampler2D tMeas, tPrev; uniform float uDt, uInit; varying vec2 vUv;
  void main() {
    float m = texture2D(tMeas, vec2(0.5)).r, p = texture2D(tPrev, vec2(0.5)).r;
    float rate = m > p ? 2.2 : 1.1;
    gl_FragColor = vec4(uInit > 0.5 ? m : p + (m - p) * (1.0 - exp(-uDt * rate)), 0.0, 0.0, 1.0);
  }`;
const HALTON = Array.from({ length: 8 }, (_, i) => { const h = (b, n) => { let f = 1, r = 0; for (n++; n > 0; n = Math.floor(n / b)) { f /= b; r += f * (n % b); } return r; }; return [h(2, i) - 0.5, h(3, i) - 0.5]; });

const mat = (fragmentShader, uniforms) => new THREE.ShaderMaterial({ vertexShader: quadVS, fragmentShader, uniforms: { ...pUniforms(), ...uniforms }, depthTest: false, depthWrite: false, toneMapped: false });
const v3 = (a) => new THREE.Vector3(...a);

export function createPost({ canvas, enabled = true, width, height, preserveDrawingBuffer = false, taa = true }) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: !enabled, powerPreference: 'high-performance', preserveDrawingBuffer,
  });
  const TAA = taa && QS.get('taa') !== '0' && QS.get('fx') !== 'low';
  renderer.setPixelRatio(enabled ? 1 : Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.info.autoReset = false;

  let sceneRT, atmosRT, dofRT, ssrRT, bloom, atmos, ssrQ, dof, fin, taaQ, taaRT = [], aeMeasQ, aeAdaptQ, aeMeasRT, aeRT = [], volFx;
  if (enabled) {
    sceneRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4, depthTexture: new THREE.DepthTexture(4, 4) });
    // nearest: the half-res DoF must not average a hero-plane distance with the background behind it
    atmosRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    dofRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false });
    ssrRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false });
    bloom = new UnrealBloomPass(new THREE.Vector2(320, 180), P.bloom, P.bloomRadius, P.bloomThreshold);
    bloom.blendMaterial.visible = false;          // don't add onto dofRT: the final pass adds the bloom to both branches
    // prefilter: soft knee instead of a hard cut (no popping), and blue-dominant light (the spear arc, the one cool
    // light in a warm frame) passes at a lower threshold so the arc glows like the concept's without blooming the sand
    const hp = bloom.materialHighPassFilter;
    hp.uniforms.uCool = { value: 0 };
    hp.fragmentShader = /* glsl */`
      uniform sampler2D tDiffuse; uniform float luminosityThreshold, smoothWidth, uCool;
      varying vec2 vUv;
      void main() {
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        float cool = clamp((c.b - c.r) / max(c.b, 1e-3), 0.0, 1.0);
        float v = luminance(c) * (1.0 + uCool * cool);
        gl_FragColor = vec4(min(c, vec3(1.6)) * smoothstep(luminosityThreshold, luminosityThreshold + smoothWidth, v), 1.0);   // capped: stacked trails glow, never flare over the hero
      }`;
    // bloom keeps its source's hue (orange fire → orange halo, blue arc → blue halo); the wide mips lean only a little
    // warm, the grade already carries the golden hour. The two widest mips are faint: at full weight a large bright mass
    // (the Musou payoff's dragon + light shards) spread into a screen-wide pale-blue veil; light stays a local glow.
    bloom.bloomTintColors = [v3([0.95, 1, 1.08]), v3([1, 0.97, 0.93]), v3([0.45, 0.42, 0.39]), v3([0.12, 0.11, 0.1]), v3([0.03, 0.026, 0.023])];
    const dofU = { uFocus: { value: 7 }, uNearScale: { value: 1 }, uFarScale: { value: 1 }, uBandN: { value: 3 }, uBandF: { value: 5 } };   // shared by dof + final
    ssrQ = new FullScreenQuad(mat(SsrShader, {
      tColor: { value: sceneRT.texture }, tDepth: { value: sceneRT.depthTexture },
      uProj: { value: new THREE.Matrix4() }, uProjInv: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() },
      uRes: { value: new THREE.Vector2(640, 360) }, uNear: { value: 0.1 }, uHeroXZ: { value: new THREE.Vector2(1e5, 1e5) },
      uLampPos: { value: Array.from({ length: MAX_FLOOR_LIGHTS }, () => new THREE.Vector3()) },
      uLampCol: { value: Array.from({ length: MAX_FLOOR_LIGHTS }, () => new THREE.Vector3()) }, uNLamps: { value: 0 },
    }));
    atmos = new FullScreenQuad(mat(AtmosShader, {
      tSsr: { value: ssrRT.texture }, uCloudT: { value: 0 }, tVolume: { value: null }, uVolTexel: { value: new THREE.Vector2(1, 1) }, uVolOn: { value: 0 },
      tColor: { value: sceneRT.texture }, tDepth: { value: sceneRT.depthTexture },
      uProjInv: { value: new THREE.Matrix4() }, uProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uRes: { value: new THREE.Vector2(1280, 720) },
      uSunDir: { value: new THREE.Vector3(-0.62, 0.2, 0.76).normalize() }, uCamPos: { value: new THREE.Vector3() },
    }));
    dof = new FullScreenQuad(mat(DofShader, { tAtmos: { value: atmosRT.texture }, uTexel: { value: new THREE.Vector2() }, ...dofU }));
    if (TAA) {
      taaRT = [0, 1].map(() => new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false }));
      taaQ = new FullScreenQuad(mat(TaaShader, {
        tCur: { value: sceneRT.texture }, tHist: { value: taaRT[0].texture }, tDepth: { value: sceneRT.depthTexture },
        uInvVP: { value: new THREE.Matrix4() }, uPrevVP: { value: new THREE.Matrix4() }, uRes: { value: new THREE.Vector2(1280, 720) },
        uFeedback: { value: 0.88 }, uValid: { value: 0 },
      }));
    }
    const one = () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.FloatType, depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    aeMeasRT = one(); aeRT = [one(), one()];
    volFx = createLightingEffects(renderer, sceneRT.depthTexture);
    aeMeasQ = new FullScreenQuad(mat(AeMeasure, { tColor: { value: sceneRT.texture } }));
    aeAdaptQ = new FullScreenQuad(mat(AeAdapt, { tMeas: { value: aeMeasRT.texture }, tPrev: { value: aeRT[0].texture }, uDt: { value: 1 / 60 }, uInit: { value: 1 } }));
    fin = new FullScreenQuad(mat(FinalShader, {
      tAe: { value: aeRT[0].texture },
      tSharp: { value: atmosRT.texture }, tDof: { value: dofRT.texture }, tBloom: { value: bloom.renderTargetsHorizontal[0].texture },
      uRes: { value: new THREE.Vector2(1280, 720) }, uTime: { value: 0 }, uFlash: { value: 0 }, uTmB: { value: 1 }, uTmC: { value: 1 }, ...dofU,
    }));
  }

  function setSize(w, h) {
    renderer.setSize(w, h, false);
    if (!enabled) return;
    const hw = Math.round(w / 2), hh = Math.round(h / 2);
    sceneRT.setSize(w, h); atmosRT.setSize(w, h); dofRT.setSize(hw, hh); ssrRT.setSize(hw, hh);
    for (const rt of taaRT) rt.setSize(w, h);
    volFx.setSize(hw, hh); atmos.material.uniforms.uVolTexel.value.set(1 / hw, 1 / hh);
    if (taaQ) { taaQ.material.uniforms.uRes.value.set(w, h); taaQ.material.uniforms.uValid.value = 0; }
    ssrQ.material.uniforms.uRes.value.set(hw, hh);
    bloom.setSize(hw, hh);
    fin.material.uniforms.uRes.value.set(w, h); atmos.material.uniforms.uRes.value.set(w, h);
    dof.material.uniforms.uTexel.value.set(1 / hw, 1 / hh);
  }
  setSize(width, height);

  let flash = 0, taaFrame = 0, taaPing = 0, aePing = 0, aeLast = performance.now();
  const _vp = new THREE.Matrix4(), _prevVP = new THREE.Matrix4();
  return {
    renderer, bloom, enabled,
    setSize,
    /** debug: [measured, adapted] scene luminance (GPU readback, do not call per frame) */
    aeProbe() {
      if (!aeMeasRT) return null;
      const b = new Float32Array(4), r = [];
      renderer.readRenderTargetPixels(aeMeasRT, 0, 0, 1, 1, b); r.push(b[0]);
      renderer.readRenderTargetPixels(aeRT[aePing], 0, 0, 1, 1, b); r.push(b[0]);
      return r;
    },
    flash(v) { flash = v; },
    /** focus: world point the camera frames (hero) → DoF focus plane; sunDir: world sun direction → haze glow. */
    render(scene, camera, time = 0, focus = null, sunDir = null, sun = null) {
      renderer.info.reset();
      if (!enabled) { renderer.render(scene, camera); return; }
      // temporal AA: jitter the projection by a sub-pixel Halton step for the scene render only
      let colorTex = sceneRT.texture;
      if (taaQ) {
        const [jx, jy] = HALTON[taaFrame++ % HALTON.length], w = sceneRT.width, h = sceneRT.height;
        _vp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);           // unjittered view-projection
        camera.projectionMatrix.elements[8] += jx * 2 / w; camera.projectionMatrix.elements[9] += jy * 2 / h;
        renderer.setRenderTarget(sceneRT);
        renderer.render(scene, camera);
        camera.projectionMatrix.elements[8] -= jx * 2 / w; camera.projectionMatrix.elements[9] -= jy * 2 / h;
        const u = taaQ.material.uniforms, read = taaRT[taaPing], write = taaRT[1 - taaPing];
        u.tHist.value = read.texture; u.uInvVP.value.copy(_vp).invert(); u.uPrevVP.value.copy(_prevVP);
        renderer.setRenderTarget(write); taaQ.render(renderer);
        u.uValid.value = 1; _prevVP.copy(_vp); taaPing = 1 - taaPing;
        colorTex = write.texture;
      } else {
        renderer.setRenderTarget(sceneRT);
        renderer.render(scene, camera);
      }
      atmos.material.uniforms.tColor.value = colorTex; ssrQ.material.uniforms.tColor.value = colorTex;
      {                                                         // light shafts (needs the sun's shadow depth texture)
        const on = P.volume > 0 && volFx.render(camera, sun, { ao: 0, denoiseAO: 0, volume: P.volume, volumeDensity: P.volumeDensity,
          volumeHeight: P.volumeHeight, volumeAnisotropy: P.volumeAnisotropy }, { aoSamples: 0, volumeSteps: P.volumeSteps });
        atmos.material.uniforms.uVolOn.value = on ? 1 : 0; atmos.material.uniforms.tVolume.value = volFx.volumeTexture;
      }
      if (P.aeStrength > 0) {                                   // auto-exposure: measure, then adapt (1x1 ping-pong)
        const nowMs = performance.now(), dtA = Math.min(0.25, (nowMs - aeLast) / 1000); aeLast = nowMs;
        aeMeasQ.material.uniforms.tColor.value = colorTex;
        renderer.setRenderTarget(aeMeasRT); aeMeasQ.render(renderer);
        const au = aeAdaptQ.material.uniforms, src = aeRT[aePing], dst = aeRT[1 - aePing];
        au.tPrev.value = src.texture; au.uDt.value = dtA;
        renderer.setRenderTarget(dst); aeAdaptQ.render(renderer);
        au.uInit.value = 0; aePing = 1 - aePing;
        fin.material.uniforms.tAe.value = dst.texture;
      }

      const a = atmos.material.uniforms;
      syncP(a);
      a.uProjInv.value.copy(camera.projectionMatrixInverse); a.uProj.value.copy(camera.projectionMatrix);
      if (P.ssr > 0) {                                          // floor mirror (half res) → read by the atmos pass
        const q = ssrQ.material.uniforms; syncP(q);
        q.uProj.value.copy(camera.projectionMatrix); q.uProjInv.value.copy(camera.projectionMatrixInverse); q.uCamWorld.value.copy(camera.matrixWorld);
        q.uNear.value = camera.near; if (focus) q.uHeroXZ.value.set(focus.x, focus.z); q.uNLamps.value = Math.min(FLOOR_LIGHTS.length, MAX_FLOOR_LIGHTS);
        for (let i = 0; i < q.uNLamps.value; i++) { const L = FLOOR_LIGHTS[i]; q.uLampPos.value[i].set(L.x, L.y, L.z); q.uLampCol.value[i].set(L.r, L.g, L.b); }
        renderer.setRenderTarget(ssrRT); ssrQ.render(renderer);
      }
      a.uCamWorld.value.copy(camera.matrixWorld);
      a.uCamPos.value.copy(camera.position); a.uCloudT.value = time;
      if (sunDir) a.uSunDir.value.copy(sunDir);
      renderer.setRenderTarget(atmosRT); atmos.render(renderer);

      const f = focus ? camera.position.distanceTo(focus) : 7;
      const u = dof.material.uniforms;
      syncP(u);
      u.uFarScale.value = THREE.MathUtils.clamp(7 / f, 1, 3);   // close-ups: stronger background bokeh
      u.uNearScale.value = THREE.MathUtils.clamp(8 / f, 0.25, 1);   // wide/high shots: no tilt-shift miniature at the bottom
      u.uFocus.value = f; u.uBandN.value = Math.max(P.bandNear, f * 0.22); u.uBandF.value = Math.max(P.bandFar, f * 0.6);
      renderer.setRenderTarget(dofRT); dof.render(renderer);

      bloom.strength = P.bloom; bloom.radius = P.bloomRadius; bloom.threshold = P.bloomThreshold;
      bloom.highPassUniforms.smoothWidth.value = P.bloomKnee; bloom.highPassUniforms.uCool.value = P.bloomCool;
      bloom.render(renderer, null, dofRT, 1 / 60, false);

      const g = fin.material.uniforms;
      syncP(g);
      g.uTime.value = time; g.uFlash.value = flash;
      // Lottes curve constants: tmMidIn → tmMidOut and tmMax → 1
      const ta = P.tmContrast, ad = ta * P.tmShoulder, mi = P.tmMidIn, mo = P.tmMidOut, hm = P.tmMax, den = (hm ** ad - mi ** ad) * mo;
      g.uTmB.value = (hm ** ta * mo - mi ** ta) / den;
      g.uTmC.value = (hm ** ad * mi ** ta - hm ** ta * mi ** ad * mo) / den;
      renderer.setRenderTarget(null); fin.render(renderer);
    },
  };
}
