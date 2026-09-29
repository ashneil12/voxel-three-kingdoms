// Meat buns (肉包, sim + view): an officer KO always drops one, and so does every 40th grunt KO; the hero picks a bun up
// by walking over it and heals. Buns bob and spin, and vanish after 30 s. The sim part is deterministic (steps with
// the fixed loop, no RNG); the view is a small voxel bun per slot.
import * as THREE from 'three';
import { on, emit } from '../core/events.js';
import { boxesGeometry } from '../core/voxel.js';
import { DEMO } from '../heroes/index.js';

const HEAL = { officer: 120, grunt: 60 }, LIFE = 60 * 30, R = 1.1, EVERY = 40, N = 12;

export function createPickups(game, scene) {
  const buns = [];                                         // { x, z, v, t }
  let gruntKOs = 0;
  on('ko', (e) => {
    if (e.officer) buns.push({ x: e.x, z: e.z, v: HEAL.officer, t: 0 });
    else if (++gruntKOs % EVERY === 0) buns.push({ x: e.x, z: e.z, v: HEAL.grunt, t: 0 });
    if (buns.length > N) buns.shift();
  });
  on('scenario', () => { buns.length = 0; gruntKOs = 0; });

  // view: a steamed bun (white dome, pleated top, a red dot) on a plate
  const geo = boxesGeometry(DEMO ? [
    { s:[0.45,0.14,0.38], p:[0,0.16,0], c:0x263846 },
    { s:[0.32,0.08,0.3], p:[0,0.27,0], c:0x83d6e8 },
    { s:[0.12,0.05,0.33], p:[0,0.34,0], c:0xffaa61 },
  ] : [
    { s: [0.5, 0.2, 0.5], p: [0, 0.1, 0], c: 0xf2ece0 }, { s: [0.42, 0.12, 0.42], p: [0, 0.26, 0], c: 0xf6f1e6 },
    { s: [0.26, 0.08, 0.26], p: [0, 0.36, 0], c: 0xfaf6ee }, { s: [0.08, 0.04, 0.08], p: [0, 0.41, 0], c: 0xd0321f },
    { s: [0.66, 0.04, 0.66], p: [0, 0.0, 0], c: 0x8a5a2a },
  ]);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, emissive: 0xffe6b0, emissiveIntensity: 0.35, flatShading: true });
  const mesh = new THREE.InstancedMesh(geo, mat, N);
  mesh.frustumCulled = false;
  scene.add(mesh);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd070, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  const glow = new THREE.InstancedMesh(new THREE.RingGeometry(0.55, 0.8, 24).rotateX(-Math.PI / 2), glowMat, N);
  glow.frustumCulled = false;
  scene.add(glow);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

  return {
    step() {
      const h = game.hero;
      for (let i = buns.length - 1; i >= 0; i--) {
        const b = buns[i];
        if (++b.t > LIFE) { buns.splice(i, 1); continue; }
        if (h.state !== 'dead' && h.hp < h.hpMax && h.y < 1 && Math.hypot(h.x - b.x, h.z - b.z) < R) {
          h.heal(b.v); emit('pickup', { x: b.x, z: b.z, v: b.v }); buns.splice(i, 1);
        }
      }
    },
    update() {
      const t = game.frame / 60;
      for (let i = 0; i < N; i++) {
        const b = buns[i];
        if (!b) { mesh.setMatrixAt(i, ZERO); glow.setMatrixAt(i, ZERO); continue; }
        const blink = b.t > LIFE - 180 && (b.t >> 3) & 1 ? 0 : 1;            // blinks for the last 3 s
        mesh.setMatrixAt(i, m.compose(p.set(b.x, 0.25 + 0.08 * Math.sin(t * 3 + i), b.z), q.setFromAxisAngle(up, t * 1.5 + i), s.setScalar(1.3 * blink)));
        glow.setMatrixAt(i, m.compose(p.set(b.x, 0.05, b.z), q.identity(), s.setScalar((1 + 0.1 * Math.sin(t * 5 + i)) * blink)));
      }
      mesh.instanceMatrix.needsUpdate = true; glow.instanceMatrix.needsUpdate = true;
    },
  };
}
