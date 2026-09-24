// Secondary motion (render-only): verlet spring chains authored per hero (src/heroes/*.js: hair, ribbons, tassels,
// apron, cape, beard) plus the pauldrons, which turn halfway with the upper arms. Chains are anchored to rig joints and simulated in world space
// with gravity, gusting wind, drag, a pull toward the rest direction (in the anchor's frame) and sphere colliders on
// the body (head, chest, hips, thighs, knees). Segment meshes are voxel slabs placed in world space every frame.
// Visual state only — never touches the sim.
import * as THREE from 'three';
import { HV } from './model.js';

const _a = new THREE.Vector3(), _r = new THREE.Vector3(), _t = new THREE.Vector3(), _q = new THREE.Quaternion();
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _m = new THREE.Matrix4();
const _c = new THREE.Vector3(), _d = new THREE.Vector3();

function chain(scene, mat, joint, { anchor, rest, n, len, seg, stiff = 0.12, drag = 0.08, grav = 1, wind = 1, face = [0, 0, -1], hit = [], cone = 100, sway = 0 }) {
  const meshes = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(seg(i, n), mat);
    m.castShadow = true;
    m.matrixAutoUpdate = false;
    scene.add(m);
    meshes.push(m);
  }
  const p = Array.from({ length: n + 1 }, () => new THREE.Vector3());
  const o = Array.from({ length: n + 1 }, () => new THREE.Vector3());
  const anchorV = new THREE.Vector3(...anchor), restV = new THREE.Vector3(...rest).normalize(), faceV = new THREE.Vector3(...face);
  const cosC = Math.cos(cone * Math.PI / 180), sinC = Math.sin(cone * Math.PI / 180);
  let init = false;
  const ph = anchor[0] * 7 + anchor[1] * 3 + n;                   // per-chain gust phase
  return {
    meshes, p,
    reset() { init = false; },
    /** cols: { name: {c: Vector3, r} } — this chain collides with the ones listed in `hit` (name or [name, extraR]). */
    update(dt, t, cols, back) {
      joint.updateWorldMatrix(true, false);
      joint.getWorldQuaternion(_q);
      _a.copy(anchorV).applyMatrix4(joint.matrixWorld);
      _r.copy(restV).applyQuaternion(_q);
      // the wind also leans the rest direction (stiff chains would otherwise never drift at idle)
      if (sway) {
        const gust = 0.55 + 0.3 * Math.sin(t * 1.7 + ph) + 0.15 * Math.sin(t * 3.7 + ph * 2);
        _r.addScaledVector(back, sway * gust);
        _r.x += sway * 0.5 * Math.sin(t * 1.1 + ph); _r.z += sway * 0.5 * Math.cos(t * 0.8 + ph);
        _r.normalize();
      }
      if (!init || p[0].distanceToSquared(_a) > 4) {
        for (let i = 0; i <= n; i++) { p[i].copy(_a).addScaledVector(_r, len * i); o[i].copy(p[i]); }
        init = true;
      }
      const steps = dt > 0 ? Math.max(1, Math.min(6, Math.round(dt * 120))) : 0;   // dt 0 = paused: no motion
      const h = steps ? dt / steps : 0;
      for (let s = 0; s < steps; s++) {
        // anchor moves along its path within the frame (sub-stepped), so fast swings pull the chain smoothly
        p[0].lerpVectors(o[0], _a, (s + 1) / steps);
        for (let i = 1; i <= n; i++) {
          _t.subVectors(p[i], o[i]).multiplyScalar(1 - drag);
          o[i].copy(p[i]);
          p[i].add(_t);
          p[i].y -= 9.8 * grav * h * h;
          // wind streams behind the hero with slow gusts and a lateral sway
          const g = 0.75 + 0.45 * Math.sin(t * 1.7 + i * 0.6) + 0.25 * Math.sin(t * 4.3 + i * 1.3);
          const w = wind * g * 5 * h * h * i / n;
          p[i].addScaledVector(back, w);
          p[i].x += Math.sin(t * 1.1 + i * 0.4) * w * 0.35;
        }
        for (let it = 0; it < 2; it++) for (let i = 1; i <= n; i++) {
          _t.copy(p[i - 1]).addScaledVector(_r, len);
          p[i].lerp(_t, stiff);
          _t.subVectors(p[i], p[i - 1]).normalize();
          // cone limit around the rest direction: cloth and hair swing wide but never flip over the anchor
          const ct = _t.dot(_r);
          if (ct < cosC) {
            _c.copy(_t).addScaledVector(_r, -ct);
            if (_c.lengthSq() < 1e-8) _c.set(1, 0, 0);
            _t.copy(_r).multiplyScalar(cosC).addScaledVector(_c.normalize(), sinC);
          }
          p[i].copy(p[i - 1]).addScaledVector(_t, len);
          for (const k of hit) {
            const [name, extra] = Array.isArray(k) ? k : [k, 0];
            const cl = cols[name], R = cl.r + extra;
            _c.subVectors(p[i], cl.c);
            const dc = _c.length();
            if (dc < R) p[i].copy(cl.c).addScaledVector(_c, R / (dc || 1e-6));
          }
        }
      }
      o[0].copy(_a);
      // orient segments: local -Y along the chain, local Z toward the joint's face direction
      _z.copy(faceV).applyQuaternion(_q);
      for (let i = 0; i < n; i++) {
        _y.subVectors(p[i], p[i + 1]).normalize();
        _t.copy(_z).addScaledVector(_y, -_z.dot(_y));
        if (_t.lengthSq() < 1e-6) _t.set(1, 0, 0);
        _t.normalize();
        _x.crossVectors(_y, _t);
        _m.makeBasis(_x, _y, _t).setPosition(p[i]);
        meshes[i].matrix.copy(_m);
        meshes[i].matrixWorldNeedsUpdate = true;
      }
    },
  };
}

// ---------------------------------------------------------------- assembly
/** def.chains() → [{ joint, anchor, rest, n, len, seg, ...chain options }] — the hero's cloth, hair and tassels. */
export function createSecondary(scene, rig, mat, def) {
  const j = rig.joints;
  const chains = [];
  const add = (joint, o) => { const c = chain(scene, mat, joint, o); chains.push(c); return c; };
  for (const o of def.chains()) add(j[o.joint], o);

  const cols = {};
  for (const k of ['head', 'chest', 'hips', 'thighL', 'thighR', 'kneeL', 'kneeR']) cols[k] = { c: new THREE.Vector3(), r: 0 };
  const setCol = (k, joint, x, y, z, r) => { cols[k].c.set(x, y, z).applyMatrix4(joint.matrixWorld); cols[k].r = r; };
  const back = new THREE.Vector3(), _bq = new THREE.Quaternion(), DOWN = new THREE.Vector3(0, -1, 0);
  let t = 0;
  return {
    chains,
    reset() { for (const c of chains) c.reset(); },
    update(dt) {
      t += dt;
      // pauldrons: swing (no twist) halfway toward the upper arm's direction, in shoulder (= chest) space
      for (const s of ['L', 'R']) {
        const pd = j['pauldron' + s];
        if (!pd) continue;
        _d.set(0, -1, 0).applyQuaternion(j['upperArm' + s].quaternion);
        _q.setFromUnitVectors(DOWN, _d);
        pd.quaternion.identity().slerp(_q, 0.5);
      }
      j.root.updateMatrixWorld(true);
      setCol('head', j.head, 0, 7 * HV, 0, 7.4 * HV);
      setCol('chest', j.chest, 0, 0.08, 0, 0.19);
      setCol('hips', j.hips, 0, -0.06, 0, 0.155);
      for (const s of ['L', 'R']) {
        setCol('thigh' + s, j['thigh' + s], 0, -0.22, 0, 0.095);
        setCol('knee' + s, j['shin' + s], 0, -0.02, 0, 0.09);
      }
      back.set(0, 0.15, -1).applyQuaternion(j.root.getWorldQuaternion(_bq));
      for (const c of chains) c.update(dt, t, cols, back);
    },
  };
}
