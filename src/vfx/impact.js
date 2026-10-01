// Impact layer for metal-on-metal combat (render-only, listens on the event bus like vfx.js):
//  - hot sparks: thin streaks that fly off the contact point, fall, BOUNCE on the floor and cool from white-yellow to
//    dull red, so a hit leaves a short shower skittering across the wet floor instead of only a radial flash
//  - scorch marks: where a machine is cut down, a dark burn on the floor with a glowing rim that cools and fades
// Budgeted per frame like vfx.js (a sweep through 30 soldiers must not turn into a firework). ?impact=0 turns it off.
import * as THREE from 'three';
import { on } from '../core/events.js';

const Q = new URLSearchParams(location.search);
const ON = Q.get('impact') !== '0';
const SN = 900, DN = 40;

const SPARK_VS = /* glsl */`
  attribute vec4 aS;            // x: heat 0..1, y: streak length (m), z: alive, w: seed
  attribute vec3 aV;            // velocity (world)
  varying float vHeat, vAlong;
  void main() {
    vHeat = aS.x; vAlong = position.y;
    vec3 c = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 v = aV; float sp = length(v); vec3 d = sp > 1e-3 ? v / sp : vec3(0.0, 1.0, 0.0);
    // camera-facing ribbon along the velocity: tail behind the head by the streak length
    vec3 toCam = normalize(cameraPosition - c), side = normalize(cross(d, toCam) + 1e-5);
    float w = 0.018 + 0.026 * aS.x;                                   // hot sparks are fat, cooling ones thin out
    vec3 p = c - d * (aS.y * position.y) + side * position.x * w;
    gl_Position = aS.z > 0.5 ? projectionMatrix * viewMatrix * vec4(p, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
  }`;
const SPARK_FS = /* glsl */`
  varying float vHeat, vAlong;
  void main() {
    vec3 hot = vec3(3.2, 2.4, 1.3), warm = vec3(2.2, 0.75, 0.15), cold = vec3(0.6, 0.08, 0.02);
    vec3 c = vHeat > 0.5 ? mix(warm, hot, (vHeat - 0.5) * 2.0) : mix(cold, warm, vHeat * 2.0);
    gl_FragColor = vec4(c * (1.0 - 0.75 * vAlong), 1.0);          // head bright, tail fades
  }`;

const SCORCH_VS = /* glsl */`
  attribute vec2 aD;            // x: age 0..1, y: seed
  varying vec2 vUv; varying vec2 vD;
  void main() { vUv = uv; vD = aD; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); }`;
const SCORCH_FS = /* glsl */`
  varying vec2 vUv; varying vec2 vD;
  float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 p = vUv * 2.0 - 1.0; float a = atan(p.y, p.x), r = length(p);
    float edge = 0.72 + 0.09 * sin(a * 5.0 + vD.y * 30.0) + 0.06 * sin(a * 13.0 + vD.y * 7.0);   // ragged outline
    float burn = smoothstep(edge, edge * 0.45, r) * (0.75 + 0.25 * h(floor(p * 9.0) + vD.y));
    float age = vD.x, fade = 1.0 - smoothstep(0.55, 1.0, age);
    float rim = smoothstep(edge * 0.62, edge * 0.8, r) * smoothstep(edge * 0.95, edge * 0.8, r);
    float cracks = step(0.86, h(floor(p * 14.0) + vD.y * 3.0)) * burn;          // a few embers left in the burn
    float hot = exp(-age * 14.0);                                                // the edge cools in under a second
    vec3 glow = vec3(1.5, 0.38, 0.06) * (rim * 0.55 + cracks * 0.7) * hot;
    gl_FragColor = vec4(glow, burn * 0.7 * fade);                               // darken by alpha, glow additive-ish
  }`;

export function createImpact(scene, game) {
  if (!ON) return { update() {} };
  // ---- sparks
  const sg = new THREE.InstancedBufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
  sg.setIndex([0, 1, 2, 0, 2, 3]);
  const aS = new THREE.InstancedBufferAttribute(new Float32Array(SN * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const aV = new THREE.InstancedBufferAttribute(new Float32Array(SN * 3), 3).setUsage(THREE.DynamicDrawUsage);
  sg.setAttribute('aS', aS); sg.setAttribute('aV', aV);
  const sparkMesh = new THREE.InstancedMesh(sg, new THREE.ShaderMaterial({ vertexShader: SPARK_VS, fragmentShader: SPARK_FS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide }), SN);
  sparkMesh.frustumCulled = false; sparkMesh.renderOrder = 6; scene.add(sparkMesh);
  const S = { x: new Float32Array(SN), y: new Float32Array(SN), z: new Float32Array(SN), vx: new Float32Array(SN), vy: new Float32Array(SN),
    vz: new Float32Array(SN), life: new Float32Array(SN), max: new Float32Array(SN), bounces: new Uint8Array(SN) };
  let sNext = 0, seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const spark = (x, y, z, vx, vy, vz, life) => {
    const i = sNext; sNext = (sNext + 1) % SN;
    S.x[i] = x; S.y[i] = y; S.z[i] = z; S.vx[i] = vx; S.vy[i] = vy; S.vz[i] = vz; S.life[i] = S.max[i] = life; S.bounces[i] = 0;
  };
  /** n sparks from (x,y,z), biased along the blow direction (dx,dz) and up */
  const shower = (x, y, z, n, dx, dz, spd) => {
    const l = Math.hypot(dx, dz) || 1, fx = dx / l, fz = dz / l;
    for (let k = 0; k < n; k++) {
      const a = (rnd() - 0.5) * 2.4, ca = Math.cos(a), sa = Math.sin(a), s = spd * (0.45 + 0.75 * rnd());
      spark(x, y, z, (fx * ca - fz * sa) * s, (0.4 + rnd() * 1.1) * spd * 0.55, (fz * ca + fx * sa) * s, 0.5 + rnd() * 0.7);
    }
  };

  // ---- scorch decals
  const dg = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
  const aD = new THREE.InstancedBufferAttribute(new Float32Array(DN * 2), 2).setUsage(THREE.DynamicDrawUsage);
  dg.setAttribute('aD', aD);
  // colour: dst * (1 - a) + glow; alpha channel untouched (the floor's alpha tag drives the post's floor mirror)
  const decalMesh = new THREE.InstancedMesh(dg, new THREE.ShaderMaterial({ vertexShader: SCORCH_VS, fragmentShader: SCORCH_FS,
    transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor }), DN);
  decalMesh.frustumCulled = false; decalMesh.renderOrder = 1; scene.add(decalMesh);
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < DN; i++) decalMesh.setMatrixAt(i, ZERO);
  const D = { age: new Float32Array(DN).fill(1), life: new Float32Array(DN).fill(1) };
  let dNext = 0;
  const scorch = (x, z, r, life = 9) => {
    const i = dNext; dNext = (dNext + 1) % DN;
    q.setFromAxisAngle(up, rnd() * 6.283);
    decalMesh.setMatrixAt(i, m4.compose(new THREE.Vector3(x, 0.012, z), q, new THREE.Vector3(r, 1, r)));
    decalMesh.instanceMatrix.needsUpdate = true;
    D.age[i] = 0; D.life[i] = life; aD.array[i * 2 + 1] = rnd();
  };

  // ---- events (budgeted per frame)
  let frame = -1, n = 0;
  const budget = () => { if (game.frame !== frame) { frame = game.frame; n = 0; } return ++n; };
  on('hit', (e) => {
    const k = budget(); if (k > 8) return;
    shower(e.x, e.y, e.z, (e.heavy ? 18 : 11) - (k > 4 ? 6 : 0), e.dx, e.dz, e.heavy ? 8 : 6.5);
  });
  on('ko', (e) => {
    const k = budget(); if (k > 10) return;
    shower(e.x, e.y + 0.2, e.z, e.officer ? 22 : 12, e.dx, e.dz, 6);
    scorch(e.x + (e.dx || 0) * 0.6, e.z + (e.dz || 0) * 0.6, e.officer ? 2.4 : 1.5 + rnd() * 0.5);
  });
  on('boss:strike', (e) => { shower(e.x, 0.6, e.z, 26, 1, 0, 8); scorch(e.x, e.z, 3.4, 12); });
  on('land', (e) => { if (e.hard) scorch(e.x, e.z, 2.2, 6); });

  let last = performance.now();
  return {
    update() {
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      let live = 0;
      for (let i = 0; i < SN; i++) {
        if (S.life[i] <= 0) { aS.array[i * 4 + 2] = 0; continue; }
        live++;
        S.life[i] -= dt;
        S.vy[i] -= 14 * dt;
        const f = 1 - 1.2 * dt; S.vx[i] *= f; S.vz[i] *= f;
        S.x[i] += S.vx[i] * dt; S.y[i] += S.vy[i] * dt; S.z[i] += S.vz[i] * dt;
        if (S.y[i] < 0.01 && S.vy[i] < 0) {                     // skitter on the floor
          S.y[i] = 0.01; S.bounces[i]++;
          S.vy[i] *= S.bounces[i] < 3 ? -0.38 : 0; S.vx[i] *= 0.7; S.vz[i] *= 0.7;
        }
        const heat = Math.max(0, S.life[i] / S.max[i]);
        sparkMesh.setMatrixAt(i, m4.makeTranslation(S.x[i], S.y[i], S.z[i]));
        const sp = Math.hypot(S.vx[i], S.vy[i], S.vz[i]);
        aS.array[i * 4] = heat; aS.array[i * 4 + 1] = Math.min(0.6, sp * 0.055); aS.array[i * 4 + 2] = S.life[i] > 0 ? 1 : 0;
        aV.array[i * 3] = S.vx[i]; aV.array[i * 3 + 1] = S.vy[i]; aV.array[i * 3 + 2] = S.vz[i];
      }
      if (live || sparkMesh.userData.wasLive) { sparkMesh.instanceMatrix.needsUpdate = true; aS.needsUpdate = true; aV.needsUpdate = true; }
      sparkMesh.userData.wasLive = live > 0;
      let anyD = false;
      for (let i = 0; i < DN; i++) {
        if (D.age[i] >= 1) continue;
        D.age[i] = Math.min(1, D.age[i] + dt / D.life[i]); aD.array[i * 2] = D.age[i]; anyD = true;
        if (D.age[i] >= 1) { decalMesh.setMatrixAt(i, ZERO); decalMesh.instanceMatrix.needsUpdate = true; }
      }
      if (anyD) aD.needsUpdate = true;
    },
  };
}
