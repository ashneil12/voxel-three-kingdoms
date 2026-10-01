// Neon City (EXO lighting test bed): a rain-soaked downtown intersection at night.
//  - the arena is an open plaza of wet asphalt (shared floor material, wet mask and screen-space mirror with the Foundry)
//  - towers on a ring of city blocks; every face carries a procedural window grid (lit warm / cool / dark per window)
//  - neon: vertical sign strips and billboards in magenta / cyan / amber on the faces that look at the plaza
//  - street lamps on the kerb ring feed the floor's analytic lamp reflections and the practical point-light pool
//  - rain streaks around the focus, low haze; the moon is the (weak, cool) shadow-casting key
// Render-only. Everything animates as a pure function of render time.
import * as THREE from 'three';
import { NOISE_GLSL, FLOOR_LIGHTS } from './floor-glsl.js';
import { SHADOW } from './world.js';
import { boxGeo, merged, tint, floorMaterial, coneMaterial, createLampPool } from './foundry.js';

const R_KERB = 46, LAMP_Y = 9;

// ---------------------------------------------------------------- environment map (IBL for the suit)
export function createCityEnv() {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(60, 30, 60), new THREE.MeshBasicMaterial({ color: 0x05060c, side: THREE.BackSide })));
  const panel = (w, h, x, y, z, ry, hex, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(x, y, z); m.rotation.y = ry; s.add(m);
  };
  panel(8, 16, -24, 9, 29, 0, 0xff3fa8, 4);        // magenta signage
  panel(8, 16, 22, 9, 29, 0, 0x37e0ff, 4);         // cyan signage
  panel(30, 6, 0, 4, -29, 0, 0xffb066, 1.6);       // warm shopfronts behind the camera
  panel(30, 10, -29, 12, 0, Math.PI / 2, 0x3a5aa0, 1.4);   // cool window walls
  panel(30, 10, 29, 12, 0, Math.PI / 2, 0x6a4a8a, 1.4);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x1a2240).multiplyScalar(1.2), side: THREE.DoubleSide }));
  sky.position.y = 14.5; sky.rotation.x = Math.PI / 2; s.add(sky);
  return s;
}

// ---------------------------------------------------------------- towers: concrete + procedural windows
function towerMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.1 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWP; varying vec3 vWN;\nfloat gWin, gPane; vec3 gWinC;\n${NOISE_GLSL}`)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        {
          vec3 n = abs(vWN);
          gWin = 0.0; gPane = 0.0; gWinC = vec3(0.0);
          if (n.y < 0.5) {
            vec2 uv = vec2(n.x > n.z ? vWP.z : vWP.x, vWP.y);
            vec2 cell = floor(uv / vec2(1.8, 3.0)), f = fract(uv / vec2(1.8, 3.0));
            float pane = step(0.14, f.x) * step(f.x, 0.86) * step(0.22, f.y) * step(f.y, 0.82) * step(4.0, vWP.y);
            float h = fHash(cell + floor(vWP.xz / 31.0) * 7.0), floorLit = fHash(vec2(cell.y, floor(vWP.x / 23.0 + vWP.z / 29.0)));
            float lit = step(0.7, h * 0.7 + floorLit * 0.45);
            gWinC = mix(vec3(1.0, 0.72, 0.42), vec3(0.62, 0.8, 1.0), step(0.7, fHash(cell * 1.7 + 3.0))) * (0.6 + 0.8 * fHash(cell + 9.1));
            vec2 pu = clamp((f - vec2(0.14, 0.22)) / vec2(0.72, 0.6), 0.0, 1.0);
            float blinds = fHash(cell + 5.3) > 0.55 ? 0.35 + 0.65 * step(0.45, fract(pu.y * 7.0)) : 1.0;   // slatted blinds
            float grad = mix(0.45, 1.15, pu.y) * (1.0 - 0.35 * smoothstep(0.3, 0.5, abs(pu.x - 0.5)));    // ceiling light, darker sides
            gWin = pane * lit * grad * blinds; gPane = pane;
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.02, 0.025, 0.035), pane);   // glass: dark when unlit
          }
        }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.12, gPane);   // glass catches the neon')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += gWinC * gWin * 0.42;');
  };
  m.customProgramCacheKey = () => 'city-tower';
  return m;
}

// ---------------------------------------------------------------- signs (billboards + shopfronts)
// Not flat white cards: banded panels with a scrolling bar, darker frame edge and a faint flicker, so they read as lit
// screens / shop windows and stay below the bloom threshold except their brightest band.
const SIGN_VS = /* glsl */`
  attribute vec3 color; varying vec3 vC; varying vec2 vUv; varying float vSeed;
  void main() { vC = color; vUv = uv; vSeed = fract(dot(position.xz, vec2(0.137, 0.071)));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SIGN_FS = /* glsl */`
  uniform float uTime; varying vec3 vC; varying vec2 vUv; varying float vSeed;
  void main() {
    vec2 e = min(vUv, 1.0 - vUv);
    float frame = smoothstep(0.02, 0.07, min(e.x, e.y));
    float bands = 0.55 + 0.45 * step(0.5, fract(vUv.y * (2.0 + floor(vSeed * 4.0)) + vSeed));
    float bar = smoothstep(0.08, 0.0, abs(fract(vUv.x * 0.5 - uTime * (0.05 + 0.1 * vSeed)) - 0.5) - 0.18);
    float flick = 0.94 + 0.06 * sin(uTime * (7.0 + 9.0 * vSeed) + vSeed * 40.0);
    gl_FragColor = vec4(vC * (0.18 + frame * (0.5 * bands + 0.6 * bar)) * flick, 1.0);
  }`;

// ---------------------------------------------------------------- rain (stateless streaks around the focus)
const RAIN_VS = /* glsl */`
  uniform float uTime; uniform vec3 uFocus;
  attribute float aSeed; attribute float aEnd;
  varying float vA;
  void main() {
    vec3 p = position;
    float sp = 15.0 + 6.0 * fract(aSeed * 7.3);
    p.y = 22.0 - mod(uTime * sp + aSeed * 97.0, 22.0);
    p.xz = mod(p.xz - uFocus.xz + 22.0, 44.0) - 22.0 + uFocus.xz;   // wrap the DROP once, then build its streak:
    p += vec3(0.18, -0.55, 0.05) * aEnd;                          // wrapping each end separately drew 44 m lines across the screen
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vA = (1.0 - smoothstep(18.0, 40.0, -mv.z)) * smoothstep(0.8, 3.0, -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const RAIN_FS = /* glsl */`
  varying float vA;
  void main() { gl_FragColor = vec4(vec3(0.55, 0.62, 0.78) * vA * 0.5, 1.0); }`;

// ================================================================= the set
export function buildCity(scene, ctx) {
  const { sun, hemi, sky, lightDir } = ctx;
  const Q = new URLSearchParams(location.search);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // ---- floor (wet asphalt plaza + streets)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), floorMaterial('asphalt'));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  // ---- city blocks: towers on a grid outside the plaza, leaving the four streets open
  const towers = [], glow = [], props = [], signs = [];
  const STREET = 9;                                     // half-width of the avenues on the x / z axes
  for (let gx = -6; gx <= 6; gx++) for (let gz = -6; gz <= 6; gz++) {
    const cx = gx * 24, cz = gz * 24;
    if (Math.abs(cx) < STREET + 10 || Math.abs(cz) < STREET + 10) continue;       // avenues
    const d = Math.hypot(cx, cz);
    if (d < 62 || d > 170) continue;
    const w = 12 + rnd() * 8, dd = 12 + rnd() * 8, h = 18 + rnd() * (d < 90 ? 40 : 85);
    const shade = [0x2a2d34, 0x24272e, 0x30323a, 0x1f2229][Math.floor(rnd() * 4)];
    towers.push(boxGeo(w, h, dd, cx, h / 2, cz, shade));
    towers.push(boxGeo(w + 0.6, 0.8, dd + 0.6, cx, h + 0.4, cz, 0x15171c));        // parapet
    // neon on the face that looks at the plaza
    const fx = Math.abs(cx) > Math.abs(cz), sgn = Math.sign(fx ? cx : cz);
    const fc = (fx ? cx - sgn * (w / 2 + 0.15) : cz - sgn * (dd / 2 + 0.15));
    const NEON = [0xff3fa8, 0x37e0ff, 0xffa84a, 0x9b6bff];
    if (rnd() < 0.75) {
      const col = NEON[Math.floor(rnd() * NEON.length)], sh = 6 + rnd() * 10, sy = 6 + rnd() * Math.min(20, h - 12);
      const off = (rnd() - 0.5) * (fx ? dd : w) * 0.6;
      glow.push(fx ? boxGeo(0.25, sh, 1.1, fc, sy + sh / 2, cz + off, col, 7) : boxGeo(1.1, sh, 0.25, cx + off, sy + sh / 2, fc, col, 7));
    }
    if (rnd() < 0.5) {                                                            // billboard
      const col = NEON[Math.floor(rnd() * NEON.length)], by = 10 + rnd() * Math.min(25, h - 14);
      signs.push(fx ? boxGeo(0.2, 3.2, 7, fc, by, cz, col, 2.0) : boxGeo(7, 3.2, 0.2, cx, by, fc, col, 2.0));
      props.push(fx ? boxGeo(0.3, 3.6, 7.4, fc + sgn * 0.12, by, cz, 0x0a0b10) : boxGeo(7.4, 3.6, 0.3, cx, by, fc + sgn * 0.12, 0x0a0b10));
    }
    // warm shopfront band at street level
    signs.push(fx ? boxGeo(0.2, 2.6, dd * 0.8, fc, 1.9, cz, 0xffc27a, 1.1) : boxGeo(w * 0.8, 2.6, 0.2, cx, 1.9, fc, 0xffc27a, 1.1));
    props.push(fx ? boxGeo(1.6, 0.25, dd * 0.85, fc - sgn * 0.8, 3.5, cz, 0x111318) : boxGeo(w * 0.85, 0.25, 1.6, cx, 3.5, fc - sgn * 0.8, 0x111318));   // awning
  }
  // kerb ring + low barriers so the plaza edge reads
  for (let i = 0; i < 48; i++) {
    const a = i / 48 * Math.PI * 2;
    if (Math.abs(Math.sin(a * 2)) < 0.22) continue;                               // avenue openings
    props.push(boxGeo(6.2, 0.22, 0.5, Math.sin(a) * (R_KERB + 0.6), 0.11, Math.cos(a) * (R_KERB + 0.6), 0x3a3d44, 1, a));
  }

  // ---- street lamps on the kerb ring (floor reflections + practical pool)
  const lamps = [];
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2 + 0.26, x = Math.sin(a) * (R_KERB + 2), z = Math.cos(a) * (R_KERB + 2);
    const warm = i % 2 === 0;
    lamps.push({ x, y: LAMP_Y, z, cool: !warm, color: warm ? 0xffb070 : 0xa8d8ff, cd: 520 });
    props.push(boxGeo(0.22, LAMP_Y, 0.22, x, LAMP_Y / 2, z, 0x1a1c22), boxGeo(1.6, 0.3, 0.6, x, LAMP_Y + 0.1, z, 0x15171c, 1, a));
    glow.push(boxGeo(1.2, 0.08, 0.4, x, LAMP_Y - 0.06, z, warm ? 0xffc890 : 0xd0ecff, 7, a));
  }
  // signal lights + a couple of neon arches over the avenues for the camera to frame
  for (const [x, z, ry] of [[0, 60, 0], [0, -60, 0], [60, 0, Math.PI / 2], [-60, 0, Math.PI / 2]]) {
    glow.push(boxGeo(18, 0.35, 0.35, x, 13, z, 0xff3fa8, 2.4, ry));
    props.push(boxGeo(0.5, 13, 0.5, x + (ry ? 0 : -9), 6.5, z + (ry ? -9 : 0), 0x1a1c22), boxGeo(0.5, 13, 0.5, x + (ry ? 0 : 9), 6.5, z + (ry ? 9 : 0), 0x1a1c22));
  }
  FLOOR_LIGHTS.length = 0;
  for (const L of lamps) { const c = tint(L.color, 3); FLOOR_LIGHTS.push({ x: L.x, y: L.y, z: L.z, r: c[0], g: c[1], b: c[2] }); }

  // ---- bake
  const tm = new THREE.Mesh(merged(towers), towerMaterial()); tm.castShadow = tm.receiveShadow = true; scene.add(tm);
  const pm = new THREE.Mesh(merged(props), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.4, flatShading: true }));
  pm.castShadow = pm.receiveShadow = true; scene.add(pm);
  scene.add(new THREE.Mesh(merged(glow), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));
  const signMat = new THREE.ShaderMaterial({ vertexShader: SIGN_VS, fragmentShader: SIGN_FS, toneMapped: false, uniforms: { uTime: { value: 0 } } });
  scene.add(new THREE.Mesh(merged(signs), signMat));

  // lamp cones (thin rain-lit shafts)
  const coneMats = [];
  for (const L of lamps) {
    const m = coneMaterial(L.cool ? 0x9fd6ff : 0xffb070, 0.1, LAMP_Y); coneMats.push(m);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 4.2, LAMP_Y, 24, 1, true), m);
    cone.position.set(L.x, LAMP_Y / 2, L.z); cone.renderOrder = 2; scene.add(cone);
  }

  // ---- rain
  const RAIN = Q.has('rain') ? Number(Q.get('rain')) : 1;
  const RN = Math.round(2600 * RAIN), rp = new Float32Array(RN * 6), rs = new Float32Array(RN * 2), re = new Float32Array(RN * 2);
  for (let i = 0; i < RN; i++) {
    const x = (rnd() - 0.5) * 44, z = (rnd() - 0.5) * 44, sd = rnd();
    rp.set([x, 0, z, x, 0, z], i * 6); rs[i * 2] = rs[i * 2 + 1] = sd; re[i * 2] = 0; re[i * 2 + 1] = 1;
  }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); rg.setAttribute('aSeed', new THREE.BufferAttribute(rs, 1)); rg.setAttribute('aEnd', new THREE.BufferAttribute(re, 1));
  const rainMat = new THREE.ShaderMaterial({ vertexShader: RAIN_VS, fragmentShader: RAIN_FS, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false, uniforms: { uTime: { value: 0 }, uFocus: { value: new THREE.Vector3() } } });
  const rain = new THREE.LineSegments(rg, rainMat); rain.frustumCulled = false; rain.renderOrder = 3; rain.visible = RN > 0; scene.add(rain);

  const lampPool = createLampPool(scene, lamps, { reach: 26 });
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
      for (const m of coneMats) m.uniforms.uTime.value = t;
      signMat.uniforms.uTime.value = t;
      rainMat.uniforms.uTime.value = t; rainMat.uniforms.uFocus.value.copy(focus);
      lampPool.update(dt, focus, t);
    },
  };
}
