// Charge-hold effect for the weapon-led heroes (Guan Yu, Zhang Fei, Lü Bu): while a charge attack is winding up (the
// telegraph before its first active frame) energy gathers at the blade — a bright core, a halo and rising motes that
// grow with the hold, in the hero's style colour. Reads sim state only.
import * as THREE from 'three';
import { HERO } from '../heroes/index.js';
import { MOVES } from '../hero/moves.js';

export function createChargeFx(scene, game, camera, heroView) {
  const col = HERO.style?.charge || HERO.style?.fx?.proj || [1.0, 1.6, 2.2];
  const N = 26;
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(...col), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const cg = cv.getContext('2d'), gr = cg.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  cg.fillStyle = gr; cg.fillRect(0, 0, 64, 64);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), color: new THREE.Color(col[0] * 0.7, col[1] * 0.7, col[2] * 0.7), transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  const motes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.1, 0.1),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(...col), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), N);
  motes.frustumCulled = false;
  const g = new THREE.Group();
  g.add(core, halo, motes);
  g.visible = false;
  scene.add(g);
  const rim = new THREE.PointLight(new THREE.Color(...col), 0, 9, 2);
  scene.add(rim);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  let e = 0, t = 0;
  const tip = new THREE.Vector3();
  return {
    update(dt) {
      t += dt;
      const h = game.hero;
      const m = h.state === 'attack' && h.move && MOVES[h.move];
      // charge wind-up only: from the start of the hold to the first active frame (the tell), on the ground
      const on = !!m && h.move[0] === 'c' && h.moveT < m.tell && !m.air && h.y < 0.4;
      const want = on ? Math.min(1, 0.25 + h.moveT / Math.max(1, m.tell)) : 0;
      e += (want - e) * Math.min(1, dt * (on ? 6 : 10));
      g.visible = e > 0.02;
      rim.intensity = e * 26;
      if (!g.visible) return;
      heroView.bladeCentre(tip);                                         // the blade as rendered
      const k = 0.24 + e * 0.5;
      core.position.copy(tip); core.scale.setScalar(k * (1 + 0.12 * Math.sin(t * 22)));
      core.material.opacity = e * 0.85;
      halo.position.copy(tip);
      halo.quaternion.copy(camera.quaternion);
      halo.scale.setScalar(k * 5);
      halo.material.opacity = e * 0.6;
      rim.position.copy(tip);
      for (let i = 0; i < N; i++) {
        const a = i * 2.39996, r = k * (0.7 + 0.5 * Math.sin(i * 3.1)), u = ((t * 0.9 + i / N) % 1);
        const y = -k * 1.4 + u * k * 3.2, sc = k * 0.16 * (1 - u * 0.6);
        p.set(tip.x + Math.cos(a + t * 3) * r, tip.y + y, tip.z + Math.sin(a + t * 3) * r);
        m4.compose(p, q, s.setScalar(sc));
        motes.setMatrixAt(i, m4);
      }
      motes.instanceMatrix.needsUpdate = true;
      motes.material.opacity = e * 0.9;
    },
  };
}
