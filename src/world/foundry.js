// The Foundry (EXO demo stage). An enclosed steelworks hall lit like a night street scene:
//  - warm furnace bays along the far wall are the backlight (the sun key comes from there: long shadows run toward the
//    camera, enemies get an orange rim) and a cool teal fill comes from the camera side, so the cast splits warm / cool
//  - wet gunmetal floor (procedural plates + puddles; world.js/post.js read the same wet mask for screen-space mirrors)
//  - hanging lamps with volumetric shafts and dust motes that only glow inside the shafts; a small pool of real point
//    lights follows the hero from lamp to lamp (fixed count, intensity cross-fades, so no shader recompiles or pops)
//  - dark columns with cool light strips, roof trusses, the evacuation gate behind the camera
// Render-only. Everything animates as a pure function of render time.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { NOISE_GLSL, WET_GLSL, FLOOR_LIGHTS } from './floor-glsl.js';
import { SHADOW } from './world.js';

export const HALL = 88;            // half-extent of the square hall (m); the sim arena (r ≈ 46) sits well inside
const WALL_Y = 36;                  // roof height
const LAMP_Y = 17;
const ARENA_R = 46;

export const tint = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
export function boxGeo(w, h, d, x, y, z, hex, k = 1, ry = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  const [r, gg, b] = tint(hex, k), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = r; a[i * 3 + 1] = gg; a[i * 3 + 2] = b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}
export const merged = (list) => mergeGeometries(list.map((g) => g.index ? g.toNonIndexed() : g));

// ---------------------------------------------------------------- environment map (IBL for the suit + steel)
// A dark box with a few hot panels: cool softboxes overhead, warm furnace strips on the far side, a white gate behind.
export function createFoundryEnv() {
  const s = new THREE.Scene();
  const shell = new THREE.Mesh(new THREE.BoxGeometry(60, 30, 60), new THREE.MeshBasicMaterial({ color: 0x06090d, side: THREE.BackSide }));
  s.add(shell);
  const panel = (w, h, x, y, z, rx, ry, hex, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m);
  };
  for (const x of [-14, 0, 14]) panel(10, 24, x, 14.5, 0, Math.PI / 2, 0, 0x8fe0f0, 3.2);        // cool roof softboxes
  for (const x of [-18, 0, 18]) panel(11, 8, x, 5, 29, 0, 0, 0xff7a2a, 9);                      // furnace bays (far wall)
  panel(10, 14, 0, 7, -29, 0, 0, 0xcfefff, 4);                                                  // evacuation gate (camera side)
  panel(28, 2, -29, 10, 0, 0, Math.PI / 2, 0x4cc8e0, 2.2);                                      // side light strips
  panel(28, 2, 29, 10, 0, 0, Math.PI / 2, 0x4cc8e0, 2.2);
  return s;
}

// ---------------------------------------------------------------- floor material
/** kind 'steel' = foundry deck plates; 'asphalt' = city street slabs with lane paint (both keep the wet mask + SSR tag). */
export function floorMaterial(kind = 'steel') {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.55 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWP;\nfloat gWet, gSeam, gPaint;\n${NOISE_GLSL}${WET_GLSL}`)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        {
${kind === 'asphalt' ? `          vec2 p = vWP.xz;
          vec2 q = p / 6.0, cell = floor(q), f = fract(q);
          float edge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)) * 6.0;
          gSeam = (1.0 - smoothstep(0.0, 0.04, edge)) * 0.6;
          gWet = foundryWet(p);
          float slab = fHash(cell), grit = fFbm(p * 3.1 + slab * 40.0), fine = fNoise(p * 45.0);
          vec3 steel = vec3(0.075, 0.078, 0.085) * (0.8 + 0.4 * slab) * (0.7 + 0.6 * grit) * (0.85 + 0.3 * fine);
          steel *= 1.0 - 0.5 * gSeam;
          // lane paint: dashed centre lines every 12 m along x, solid kerb lines at the plaza rim, worn by the noise
          float lane = (1.0 - smoothstep(0.1, 0.16, abs(fract(p.y / 12.0 + 0.5) - 0.5) * 12.0)) * step(0.45, fract(p.x / 6.0));
          float rr = length(p), kerb = 1.0 - smoothstep(0.12, 0.2, abs(rr - ${ARENA_R.toFixed(1)}));
          gPaint = max(lane * step(rr, ${ARENA_R.toFixed(1)} - 1.0), kerb) * smoothstep(0.25, 0.55, grit + 0.2);
          steel = mix(steel, vec3(0.62, 0.6, 0.55), gPaint * 0.75);
` : `          vec2 p = vWP.xz;
          vec2 q = p / 4.0, cell = floor(q), f = fract(q);
          float edge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)) * 4.0;       // metres to the nearest plate seam
          gSeam = 1.0 - smoothstep(0.0, 0.05, edge);
          float bevel = 1.0 - smoothstep(0.05, 0.22, edge);                         // chamfer highlight band next to the seam
          gWet = foundryWet(p);
          float plate = fHash(cell), scuff = fFbm(p * 2.6 + plate * 40.0), fine = fNoise(p * 38.0);
          vec3 steel = vec3(0.16, 0.18, 0.205) * (0.75 + 0.5 * plate) * (0.7 + 0.6 * scuff) * (0.9 + 0.2 * fine);
          steel *= 1.0 - 0.7 * gSeam;
          steel += vec3(0.02, 0.026, 0.03) * bevel;
          // bolt heads in each plate corner
          vec2 bc = abs(f - 0.5) * 4.0 - 1.82; float bolt = 1.0 - smoothstep(0.045, 0.075, length(bc));
          steel += vec3(0.03, 0.034, 0.04) * bolt;
          // amber hazard band on the arena boundary
          float rr = length(p), band = smoothstep(0.55, 0.45, abs(rr - ${ARENA_R.toFixed(1)}));
          float stripe = step(0.5, fract((p.x + p.y) * 0.9));
          gPaint = band * stripe;
          steel = mix(steel, vec3(0.5, 0.31, 0.04), gPaint * 0.8);
`}          diffuseColor.rgb = mix(steel, steel * 0.6, gWet * (1.0 - gPaint));
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(mix(0.62 - 0.2 * fNoise(vWP.xz * 1.7), 0.1, gWet) + gSeam * 0.5, 0.03, 1.0);`)
      .replace('#include <lights_fragment_end>', `
        // the hall's real reflections come from the post's screen-space mirror; the env map (a stand-in room) would
        // paint the same furnace panel over the whole floor, so the floor keeps only a trace of it
        radiance *= 0.05; iblIrradiance *= 0.3;
        #include <lights_fragment_end>`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += ${kind === 'asphalt' ? 'vec3(0.0)' : 'vec3(1.0, 0.5, 0.08) * gPaint * 0.55'};`)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
        gl_FragColor.a = 0.5;                       // tags the floor for post's screen-space mirror (opaque = 1.0)`);
  };
  m.customProgramCacheKey = () => 'floor-' + kind;
  return m;
}

// ---------------------------------------------------------------- volumetric shaft
const CONE_VS = /* glsl */`
  uniform float uH;
  varying vec3 vN, vVP, vW; varying float vH;
  void main() {
    vH = position.y / uH + 0.5;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vVP = mv.xyz; vN = normalMatrix * normal; vW = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
  }`;
const CONE_FS = /* glsl */`
  uniform vec3 uColor; uniform float uTime, uI;
  varying vec3 vN, vVP, vW; varying float vH;
  ${NOISE_GLSL}
  void main() {
    vec3 N = normalize(vN), V = normalize(-vVP);
    float edge = pow(abs(dot(N, V)), 1.6);                                    // soft sides: the cone has no visible rim
    float along = mix(0.3, 1.0, vH) * smoothstep(1.0, 0.9, vH) * smoothstep(0.0, 0.1, vH);
    float d = length(vVP);
    float nearF = smoothstep(2.5, 10.0, d), farF = 1.0 - smoothstep(70.0, 150.0, d);
    float dust = 0.55 + 0.9 * fNoise(vec2(vW.x * 0.3 + vW.y * 0.17 + uTime * 0.12, vW.z * 0.3 - vW.y * 0.45 + uTime * 0.08));
    gl_FragColor = vec4(uColor * (edge * along * nearF * farF * dust * uI), 1.0);
  }`;
export function coneMaterial(color, intensity, uH) {
  return new THREE.ShaderMaterial({
    vertexShader: CONE_VS, fragmentShader: CONE_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uI: { value: intensity }, uH: { value: uH } },
  });
}

// ---------------------------------------------------------------- furnace glow (bay backdrop)
const GLOW_FS = /* glsl */`
  uniform float uTime, uHot; uniform vec3 uCold;
  varying vec2 vUv;
  ${NOISE_GLSL}
  void main() {
    vec2 p = vUv;
    float flick = 0.9 + 0.2 * fNoise(vec2(uTime * 2.1, p.x * 4.0)) + 0.06 * sin(uTime * 9.0 + p.x * 11.0);
    float h1 = fFbm(vec2(p.x * 4.0, p.y * 2.5 - uTime * 0.25));
    float tongues = smoothstep(0.45, 0.9, fFbm(vec2(p.x * 9.0, p.y * 3.0 - uTime * 0.9)));   // licking flame tongues
    float core = pow(1.0 - p.y, 2.4) * (0.25 + 1.0 * h1 + 0.6 * tongues) * flick;               // hottest at the furnace floor
    float veins = smoothstep(0.58, 0.82, fFbm(vec2(p.x * 7.0 + 3.0, p.y * 16.0 - uTime * 0.35))) * (1.0 - p.y);
    core += veins * 0.8;                                                      // molten streaks
    vec3 c = mix(vec3(0.16, 0.02, 0.004), vec3(1.0, 0.3, 0.045), smoothstep(0.08, 0.6, core));
    c = mix(c, vec3(1.0, 0.7, 0.32), smoothstep(0.7, 1.3, core));
    float lum = 0.22 + 2.1 * core;
    c = mix(uCold * (0.4 + h1) * 0.8, c * lum, uHot);                          // uHot 0 = the cold white evacuation gate
    gl_FragColor = vec4(c, 1.0);
  }`;
function glowMaterial(hot, cold) {
  return new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: GLOW_FS, toneMapped: false, fog: false,
    uniforms: { uTime: { value: 0 }, uHot: { value: hot }, uCold: { value: new THREE.Color(cold) } },
  });
}

// ---------------------------------------------------------------- dust motes (only visible inside the lamp shafts)
const MOTE_VS = /* glsl */`
  uniform float uTime; uniform vec4 uLamps[16]; uniform int uN; uniform vec2 uRange; uniform float uPx;
  attribute float aSeed;
  varying float vB;
  void main() {
    vec3 p = position;
    p.y = mod(p.y + uTime * (0.12 + 0.18 * aSeed), ${LAMP_Y.toFixed(1)}) + 0.2;
    p.x += sin(uTime * 0.31 + aSeed * 40.0) * 1.2; p.z += cos(uTime * 0.27 + aSeed * 23.0) * 1.2;
    float b = 0.0;
    for (int i = 0; i < 16; i++) {
      if (i >= uN) break;
      vec4 L = uLamps[i];
      float depth = (L.y - p.y) / ${LAMP_Y.toFixed(1)};                       // 0 at the lamp, 1 at the floor
      float R = 0.4 + 6.8 * depth;
      float dist = length(p.xz - L.xz);
      b += step(0.0, depth) * smoothstep(R, R * 0.35, dist) * (1.0 - 0.45 * depth);
    }
    vB = min(b, 1.0) * (0.45 + 0.9 * fract(aSeed * 91.7 + uTime * 0.25 * (0.3 + aSeed)));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uPx * (1.0 + aSeed) / -mv.z, 1.5, 7.0);
  }`;
const MOTE_FS = /* glsl */`
  varying float vB;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.0, r);
    gl_FragColor = vec4(vec3(1.0, 0.86, 0.62) * a * vB * 2.4, 1.0);
  }`;

// ---------------------------------------------------------------- furnace embers (drift through the whole arena)
// Stateless: every ember is a pure function of (seed, time); the volume wraps around the focus so the hero is always
// inside a cloud of rising sparks.
const EMBER_VS = /* glsl */`
  uniform float uTime, uPx; uniform vec3 uFocus;
  attribute float aSeed;
  varying float vB;
  void main() {
    float s = aSeed, life = 5.0 + 6.0 * fract(s * 7.31), ph = fract(uTime / life + s * 13.7);
    vec3 p = position;
    p.xz += vec2(-0.35, -0.9) * ph * life * (0.5 + fract(s * 3.1)) + vec2(sin(uTime * 0.7 + s * 50.0), cos(uTime * 0.6 + s * 31.0)) * 0.8 * ph;
    p.y = 0.2 + ph * (3.0 + 7.0 * fract(s * 5.7));
    p.xz = mod(p.xz - uFocus.xz + 45.0, 90.0) - 45.0 + uFocus.xz;
    vB = smoothstep(0.0, 0.08, ph) * (1.0 - smoothstep(0.55, 1.0, ph)) * (0.45 + 0.55 * step(0.5, fract(uTime * (3.0 + 4.0 * fract(s * 9.1)) + s * 20.0)));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uPx * (0.6 + fract(s * 17.0)) / -mv.z, 1.5, 5.0);
  }`;
const EMBER_FS = /* glsl */`
  varying float vB;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    gl_FragColor = vec4(mix(vec3(1.0, 0.28, 0.04), vec3(1.0, 0.7, 0.3), 1.0 - r) * smoothstep(1.0, 0.2, r) * vB * 4.0, 1.0);
  }`;


// ---------------------------------------------------------------- floor smoke (soft billboards hugging the ground)
// Stateless like the embers: puffs drift on a wrapping 120 m field around the focus. Each billboard fades to nothing at
// the floor plane (no hard intersection line), near the camera (no wall of grey in a close-up) and with distance; warm
// near the furnace wall (+z), cold smoke elsewhere. ?smoke=0 turns it off, ?smoke=k scales the density.
const SMOKE_VS = /* glsl */`
  uniform float uTime; uniform vec3 uFocus;
  attribute float aSeed; attribute vec2 aCorner;
  varying vec2 vUv; varying float vSeed, vH, vD, vSteep; varying vec3 vC;
  void main() {
    float s = aSeed, size = 5.0 + 8.0 * fract(s * 5.3);
    vec3 c = position;
    c.xz += vec2(-0.22, -0.4) * uTime * (0.4 + fract(s * 3.7));
    c.xz = mod(c.xz - uFocus.xz + 60.0, 120.0) - 60.0 + uFocus.xz;
    c.y = 0.4 + size * 0.2 * fract(s * 9.1);
    vec4 mv = viewMatrix * vec4(c, 1.0);
    vD = -mv.z;
    mv.xy += aCorner * size * 0.5;
    vH = c.y + aCorner.y * size * 0.5 * viewMatrix[1][1];
    vUv = aCorner; vSeed = s; vC = c;
    vSteep = (cameraPosition.y - c.y) / max(length(cameraPosition - c), 1e-3);   // looking down on a billboard = a flat grey cloud on the floor
    gl_Position = projectionMatrix * mv;
  }`;
const SMOKE_FS = /* glsl */`
  uniform float uTime, uK;
  varying vec2 vUv; varying float vSeed, vH, vD, vSteep; varying vec3 vC;
  ${NOISE_GLSL}
  void main() {
    float a = vSeed * 40.0, ca = cos(a), sa = sin(a);
    vec2 p = mat2(ca, -sa, sa, ca) * vUv;
    float n = fFbm(p * 1.7 + vSeed * 31.0 + vec2(uTime * 0.03, -uTime * 0.02));
    float body = smoothstep(0.32, 0.85, n) * smoothstep(1.0, 0.25, length(vUv));
    float al = body * smoothstep(0.0, 1.1, vH) * smoothstep(2.0, 7.0, vD) * (1.0 - smoothstep(60.0, 130.0, vD)) * 0.34 * uK * (1.0 - smoothstep(0.25, 0.55, vSteep));
    float warm = smoothstep(5.0, 70.0, vC.z);
    vec3 col = mix(vec3(0.035, 0.05, 0.065), vec3(0.55, 0.2, 0.07), warm * (0.5 + 0.5 * n));
    gl_FragColor = vec4(col, al);
  }`;


// ---------------------------------------------------------------- practical lamp pool
/** A fixed pool of real point lights that follows the focus from lamp to lamp: the 3 nearest lamps are lit, slots
 *  cross-fade so a swap never pops, and the light count never changes (no shader recompiles). lamps: [{ x, y, z, cool,
 *  color?, cd? }] (color/cd override the foundry's cool/warm white and 1500 cd). */
export function createLampPool(scene, lamps, { size = 4, lit = 3, reach = 46 } = {}) {
  const pool = [];
  for (let i = 0; i < size; i++) {
    const l = new THREE.PointLight(0xbfe9ff, 0, reach, 2); l.position.set(0, 10, 0); scene.add(l);
    pool.push({ light: l, lamp: -1, w: 0, target: 0 });
  }
  const dist2 = lamps.map(() => 0), order = lamps.map((_, i) => i);
  return {
    update(dt, focus, t) {
      for (let i = 0; i < lamps.length; i++) dist2[i] = (lamps[i].x - focus.x) ** 2 + (lamps[i].z - focus.z) ** 2;
      order.sort((a, b) => dist2[a] - dist2[b]);
      const want = order.slice(0, lit);
      for (const s of pool) s.target = want.includes(s.lamp) ? 1 : 0;
      for (const li of want) {
        if (pool.some((s) => s.lamp === li)) continue;
        const free = pool.reduce((a, s) => (s.w < a.w ? s : a), pool[0]);          // dimmest slot takes the new lamp
        if (free.w < 0.05) {
          const L = lamps[li];
          free.lamp = li; free.light.position.set(L.x, L.y - 1, L.z);
          free.light.color.set(L.color ?? (L.cool ? 0xbfe9ff : 0xffc890)); free.target = 1;
        }
      }
      for (const s of pool) {
        s.w += (s.target - s.w) * Math.min(1, dt * 3.5);
        s.light.intensity = (s.lamp >= 0 ? lamps[s.lamp].cd ?? 1500 : 0) * s.w * (0.97 + 0.03 * Math.sin(t * 31 + s.lamp));
      }
    },
  };
}

// ================================================================= the set
export function buildFoundry(scene, ctx) {
  const { sun, hemi, rim, sky, lightDir } = ctx;
  const H = HALL;
  const steel = [], cols = [], glow = [];

  // ---- floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(H * 2, H * 2), floorMaterial());
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);

  // ---- walls: far wall (+z) has three furnace bays, camera-side wall (−z) the evacuation gate, side walls ribs + strip
  const WALL = 0x161d24, RIB = 0x232c35;
  const bays = [-36, 0, 36], BW = 20, BH = 15;
  const spans = [[-H, bays[0] - BW / 2], [bays[0] + BW / 2, bays[1] - BW / 2], [bays[1] + BW / 2, bays[2] - BW / 2], [bays[2] + BW / 2, H]];
  for (const [a, b] of spans) steel.push(boxGeo(b - a, WALL_Y, 4, (a + b) / 2, WALL_Y / 2, H + 2, WALL));
  for (const x of bays) {
    steel.push(boxGeo(BW + 0.1, WALL_Y - BH, 4, x, BH + (WALL_Y - BH) / 2, H + 2, 0x1b232b));   // lintel
    steel.push(boxGeo(1.6, BH, 1.6, x - BW / 2, BH / 2, H - 0.6, RIB), boxGeo(1.6, BH, 1.6, x + BW / 2, BH / 2, H - 0.6, RIB));
    steel.push(boxGeo(BW + 3, 1.4, 1.8, x, BH + 0.7, H - 0.7, RIB));
    glow.push(boxGeo(BW - 1, 0.35, 0.3, x, BH - 0.3, H - 1.6, 0xff7a2a, 6));                      // lintel light bar
    // gantry silhouettes inside the bay, against the glow
    steel.push(boxGeo(BW - 2, 0.9, 1.1, x, 11.5, H + 0.6, 0x0a0d10), boxGeo(1, 11.5, 1, x - BW / 4, 5.7, H + 0.6, 0x0a0d10), boxGeo(1, 11.5, 1, x + BW / 4, 5.7, H + 0.6, 0x0a0d10));
    steel.push(boxGeo(3, 4.5, 3, x + 2, 2.25, H + 1.4, 0x0a0d10), boxGeo(2, 2.4, 2, x - 4.5, 1.2, H + 1.2, 0x0a0d10));
  }
  const gate = 0, GW = 16, GH = 14;                                                              // evacuation gate (−z)
  for (const [a, b] of [[-H, gate - GW / 2], [gate + GW / 2, H]]) steel.push(boxGeo(b - a, WALL_Y, 4, (a + b) / 2, WALL_Y / 2, -H - 2, WALL));
  steel.push(boxGeo(GW + 0.1, WALL_Y - GH, 4, gate, GH + (WALL_Y - GH) / 2, -H - 2, 0x1b232b));
  glow.push(boxGeo(GW - 1, 0.35, 0.3, gate, GH - 0.3, -H + 0.9, 0x9fe8ff, 5));
  for (const sgn of [-1, 1]) {                                                                   // side walls
    steel.push(boxGeo(4, WALL_Y, H * 2, sgn * (H + 2), WALL_Y / 2, 0, WALL));
    glow.push(boxGeo(0.25, 0.35, H * 1.7, sgn * (H - 0.2), 7, 0, 0x4cc8e0, 1.1));
    for (let z = -H + 9; z < H - 4; z += 22) steel.push(boxGeo(2.2, WALL_Y, 2.2, sgn * (H - 1.1), WALL_Y / 2, z, RIB));
  }
  for (let x = -H + 9; x < H - 4; x += 22) { steel.push(boxGeo(2.2, WALL_Y, 2.2, x, WALL_Y / 2, H - 1.1, RIB)); steel.push(boxGeo(2.2, WALL_Y, 2.2, x, WALL_Y / 2, -H + 1.1, RIB)); }

  // ---- roof + trusses + skylight strips
  steel.push(boxGeo(H * 2, 1, H * 2, 0, WALL_Y + 0.5, 0, 0x0b0f13));
  for (let z = -H + 11; z < H; z += 22) steel.push(boxGeo(H * 2, 1.6, 1.4, 0, WALL_Y - 1.2, z, 0x1a222a));
  for (const x of [-60, -30, 0, 30, 60]) steel.push(boxGeo(1.4, 1.2, H * 2, x, WALL_Y - 0.9, 0, 0x1a222a));
  for (const x of [-45, -15, 15, 45]) glow.push(boxGeo(5, 0.2, H * 1.5, x, WALL_Y - 0.15, 0, 0x9fdcec, 0.9));

  // ---- columns ring (cast shadows)
  const colGeo = [];
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12 + 0.13, r = 52 + (i % 3) * 5, x = Math.sin(a) * r, z = Math.cos(a) * r, ry = a;
    const amber = i % 3 === 0;
    colGeo.push(boxGeo(3, WALL_Y - 1, 3, x, (WALL_Y - 1) / 2, z, 0x151c22, 1, ry));
    colGeo.push(boxGeo(4.2, 1.6, 4.2, x, 0.8, z, 0x2a333b, 1, ry));
    // hazard band on the plinth + a light strip on the face that looks at the arena
    colGeo.push(boxGeo(4.25, 0.45, 4.25, x, 1.55, z, 0xd69a14, 0.7, ry));
    const cx = x - Math.sin(a) * 1.55, cz = z - Math.cos(a) * 1.55;
    glow.push(boxGeo(0.34, 15 + (i % 4) * 2.5, 0.12, cx, 9 + (i % 4) * 1.2, cz, amber ? 0xff9a3a : 0x6fe6ff, amber ? 2.6 : 1.1, ry));
    glow.push(boxGeo(1.6, 0.14, 0.1, cx, 2.2, cz, amber ? 0xff9a3a : 0x6fe6ff, amber ? 2.2 : 1.1, ry));
  }

  // ---- hanging lamps
  const lampPos = [];
  for (const x of [-30, 30]) for (const z of [-44, -16, 12, 40, 66]) lampPos.push([x, z]);
  lampPos.push([0, 2], [0, 54]);
  const lamps = lampPos.map(([x, z], i) => ({ x, z, y: LAMP_Y, cool: i % 3 !== 1 }));
  FLOOR_LIGHTS.length = 0;
  for (const L of lamps) { const c = tint(L.cool ? 0xcfefff : 0xffc890, 7); FLOOR_LIGHTS.push({ x: L.x, y: L.y, z: L.z, r: c[0], g: c[1], b: c[2] }); }
  const lampGroup = new THREE.Group(); scene.add(lampGroup);
  const coneMats = [];
  for (const L of lamps) {
    steel.push(boxGeo(0.14, WALL_Y - LAMP_Y - 0.5, 0.14, L.x, (WALL_Y + LAMP_Y) / 2, L.z, 0x0a0d10));          // chain
    steel.push(boxGeo(2.2, 0.9, 2.2, L.x, L.y + 0.45, L.z, 0x10161b));                                            // housing
    glow.push(boxGeo(1.7, 0.12, 1.7, L.x, L.y - 0.02, L.z, L.cool ? 0xd8f6ff : 0xffd7a0, 9));                     // lens
    const h = L.y;
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 7.2, h, 32, 1, true), coneMat(L));
    cone.position.set(L.x, h / 2, L.z); cone.renderOrder = 2; lampGroup.add(cone);
  }
  function coneMat(L) { const m = coneMaterial(L.cool ? 0x7fd4f0 : 0xffb070, 0.12, L.y); coneMats.push(m); return m; }

  // ---- bake the static geometry
  scene.add(new THREE.Mesh(merged(steel), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.6, flatShading: true })));
  const colMesh = new THREE.Mesh(merged(colGeo), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.55, flatShading: true }));
  colMesh.castShadow = colMesh.receiveShadow = true; scene.add(colMesh);
  scene.add(new THREE.Mesh(merged(glow), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));

  // ---- furnace + gate backdrops
  const glowMats = [];
  for (const x of bays) {
    const m = glowMaterial(1, 0x000000); glowMats.push(m);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), m); p.position.set(x, BH / 2, H - 0.2); p.rotation.y = Math.PI; scene.add(p);
  }
  const gm = glowMaterial(0, 0xbfe8ff); glowMats.push(gm);
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(GW, GH), gm); gp.position.set(gate, GH / 2, -H + 0.2); scene.add(gp);

  // ---- dust motes in the shafts
  const MN = 2400, mp = new Float32Array(MN * 3), ms = new Float32Array(MN);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < MN; i++) { mp[i * 3] = (rnd() - 0.5) * 120; mp[i * 3 + 1] = rnd() * LAMP_Y; mp[i * 3 + 2] = -50 + rnd() * 130; ms[i] = rnd(); }
  const mg = new THREE.BufferGeometry();
  mg.setAttribute('position', new THREE.BufferAttribute(mp, 3)); mg.setAttribute('aSeed', new THREE.BufferAttribute(ms, 1));
  const lampU = Array.from({ length: 16 }, (_, i) => lamps[i] ? new THREE.Vector4(lamps[i].x, lamps[i].y, lamps[i].z, 0) : new THREE.Vector4());
  const moteMat = new THREE.ShaderMaterial({
    vertexShader: MOTE_VS, fragmentShader: MOTE_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uTime: { value: 0 }, uLamps: { value: lampU }, uN: { value: lamps.length }, uRange: { value: new THREE.Vector2() }, uPx: { value: 22 } },
  });
  const motes = new THREE.Points(mg, moteMat); motes.frustumCulled = false; motes.renderOrder = 3; scene.add(motes);

  // ---- embers
  const EN = 900, ep = new Float32Array(EN * 3), es = new Float32Array(EN);
  for (let i = 0; i < EN; i++) { ep[i * 3] = (rnd() - 0.5) * 90; ep[i * 3 + 1] = 0; ep[i * 3 + 2] = (rnd() - 0.5) * 90; es[i] = rnd(); }
  const eg = new THREE.BufferGeometry();
  eg.setAttribute('position', new THREE.BufferAttribute(ep, 3)); eg.setAttribute('aSeed', new THREE.BufferAttribute(es, 1));
  const emberMat = new THREE.ShaderMaterial({
    vertexShader: EMBER_VS, fragmentShader: EMBER_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uTime: { value: 0 }, uPx: { value: 16 }, uFocus: { value: new THREE.Vector3() } },
  });
  const embers = new THREE.Points(eg, emberMat); embers.frustumCulled = false; embers.renderOrder = 3; scene.add(embers);

  // ---- floor smoke
  const SMOKE_K = new URLSearchParams(location.search).has('smoke') ? Number(new URLSearchParams(location.search).get('smoke')) : 1;
  const SN = 64, sPos = new Float32Array(SN * 12), sSeed = new Float32Array(SN * 4), sCorner = new Float32Array(SN * 8), sIdx = [];
  for (let i = 0; i < SN; i++) {
    const x = (rnd() - 0.5) * 120, z = (rnd() - 0.5) * 120, sd = rnd();
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([cx, cy], q) => {
      sPos.set([x, 0, z], (i * 4 + q) * 3); sSeed[i * 4 + q] = sd; sCorner.set([cx, cy], (i * 4 + q) * 2);
    });
    sIdx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); sg.setAttribute('aSeed', new THREE.BufferAttribute(sSeed, 1)); sg.setAttribute('aCorner', new THREE.BufferAttribute(sCorner, 2));
  sg.setIndex(sIdx);
  const smokeMat = new THREE.ShaderMaterial({
    vertexShader: SMOKE_VS, fragmentShader: SMOKE_FS, transparent: true, depthWrite: false, toneMapped: false, fog: false,
    uniforms: { uTime: { value: 0 }, uFocus: { value: new THREE.Vector3() }, uK: { value: SMOKE_K } },
  });
  const smoke = new THREE.Mesh(sg, smokeMat); smoke.frustumCulled = false; smoke.renderOrder = 2; smoke.visible = SMOKE_K > 0; scene.add(smoke);

  // ---- lights: furnace key (shadow caster) is `sun`, cool fill is `rim`, practical pool follows the hero
  const lampPool = createLampPool(scene, lamps);
  const tmp = new THREE.Vector3();
  let t = 0;

  return {
    sun, hemi, fires: [], banners: [], sunDir: ctx.sunDir, lightDir, lamps,
    update(dt, focus) {
      t += dt;
      const step = 2 * SHADOW.half / SHADOW.res;
      tmp.set(Math.round((focus.x + SHADOW.lead.x) / step) * step, 0, Math.round((focus.z + SHADOW.lead.z) / step) * step);
      sun.target.position.copy(tmp);
      sun.position.copy(lightDir).multiplyScalar(70).add(tmp);
      sky.material.uniforms.uTime.value = t;
      // furnace key breathes a little (the fires are not steady)
      sun.intensity = ctx.sunBase * (1 + 0.035 * Math.sin(t * 7.1) + 0.03 * Math.sin(t * 13.7 + 1.3));
      for (const m of coneMats) m.uniforms.uTime.value = t;
      for (const m of glowMats) m.uniforms.uTime.value = t;
      moteMat.uniforms.uTime.value = t; emberMat.uniforms.uTime.value = t; emberMat.uniforms.uFocus.value.copy(focus);
      smokeMat.uniforms.uTime.value = t; smokeMat.uniforms.uFocus.value.copy(focus);
      lampPool.update(dt, focus, t);
    },
  };
}
