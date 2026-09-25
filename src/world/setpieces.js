// Stage set pieces (render-only), chosen by STAGE.set:
//   'river' 赤壁 — a broad river between the arena and the far bank's fortress: rippling dark water with firelight
//                  glinting on it, a muddy bank, and a line of chained warships (連環船), several ablaze.
//   'pass'  虎牢關 — towering rock walls on both flanks that close in on the gate: a pass funnelling to Hulao.
// blocked(x, z) tells the dressing where not to stand troops and banners.
import * as THREE from 'three';
import { makeRng } from '../core/rng.js';
import { boxesGeometry, shade } from '../core/voxel.js';
import { noise2 } from './terrain.js';
import { STAGE } from '../stages/index.js';

export const SET = STAGE.set || null;
export const RIVER = { z0: 49, z1: 95 };   // the near bank just past the arena rim (46 m), in the default view
const lit = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, flatShading: true });

/** Rock wall edge |x| on side s (+1 / −1) at depth z: wide open over the arena, closing on the gate past z 40. */
function edge(s, z) {
  const far = s > 0 ? 12 : 34, u = Math.min(1, Math.max(0, (z - 40) / 60));
  return 50 + (far - 50) * u * u * (3 - 2 * u);
}
export function blocked(x, z) {
  if (SET === 'river') return z > RIVER.z0 - 3 && z < RIVER.z1 + 1;
  if (SET === 'pass') return Math.abs(x) > edge(Math.sign(x) || 1, z) - 3;
  return false;
}

// ---------------------------------------------------------------- 赤壁: river and fleet
function waterMesh() {
  const W = 700, D = RIVER.z1 - RIVER.z0;
  const geo = new THREE.PlaneGeometry(W, D, 280, 32).rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x14243a, roughness: 0.2, metalness: 0.3 });
  const uTime = { value: 0 };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = 'uniform float uTime;\nvarying vec3 vWPos;\n' + sh.vertexShader
      .replace('#include <beginnormal_vertex>', `
        vec3 wp0 = (modelMatrix * vec4(position, 1.0)).xyz;
        float wa = sin(wp0.x * 0.35 + uTime * 1.1) * 0.5 + sin(wp0.z * 0.6 - uTime * 0.8 + wp0.x * 0.12) * 0.5;
        float dx = cos(wp0.x * 0.35 + uTime * 1.1) * 0.175 + cos(wp0.z * 0.6 - uTime * 0.8 + wp0.x * 0.12) * 0.03;
        float dz = cos(wp0.z * 0.6 - uTime * 0.8 + wp0.x * 0.12) * 0.15;
        vec3 objectNormal = normalize(vec3(-dx * 0.25, 1.0, -dz * 0.25));`)
      .replace('#include <begin_vertex>', 'vec3 transformed = vec3(position.x, position.y + wa * 0.12, position.z);\nvWPos = wp0;');
    sh.fragmentShader = 'uniform float uTime;\nvarying vec3 vWPos;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      // firelight glinting on the ripples: sparse bright ridges, warm
      float gl = pow(max(0.0, sin(vWPos.x * 1.3 + uTime * 1.7) * sin(vWPos.z * 2.1 - uTime * 1.2 + sin(vWPos.x * 0.2))), 8.0);
      totalEmissiveRadiance += vec3(1.0, 0.42, 0.12) * gl * 0.9 + vec3(0.03, 0.07, 0.13);`);
  };
  const m = new THREE.Mesh(geo, mat);
  m.position.set(0, 0.16, (RIVER.z0 + RIVER.z1) / 2);
  m.receiveShadow = true;
  return { mesh: m, uTime };
}

/** A war junk broadside to the arena: stepped hull, raised bow and stern castles, a two-storey deck house, mast, yard
 *  and a battened sail (charred when burning). Returns fire spots on its deck. */
function ship(b, r, x, z, yaw, s, burning) {
  const c = Math.cos(yaw), sn = Math.sin(yaw);
  const at = (lx, ly, lz) => [x + lx * c + lz * sn, ly, z - lx * sn + lz * c];
  const put = (w, h, d, lx, ly, lz, col) => b.push({ s: [w * s, h * s, d * s], p: at(lx * s, ly * s, lz * s), r: [0, yaw, 0], c: col });
  const wood = burning ? 0x5a3a24 : 0x6e4a2e, woodD = burning ? 0x3a2416 : 0x4a3220, red = burning ? 0x7a2a1a : 0x9a3020;
  put(18, 1.2, 4.2, 0, 0.4, 0, woodD);                               // keel band at the waterline
  put(20, 1.4, 5.2, 0, 1.5, 0, wood);                                // hull
  put(21, 0.4, 5.6, 0, 2.3, 0, red);                                 // gunwale
  put(4, 2.2, 5.2, 8.6, 3.2, 0, wood); put(3, 1.6, 5.4, -9.2, 3, 0, wood);   // stern and bow castles
  put(7, 2.4, 4.2, 1.5, 3.6, 0, wood); put(8, 0.4, 5.2, 1.5, 4.9, 0, 0x2a2426);   // deck house + roof
  put(5, 1.8, 3.4, 1.5, 6, 0, wood); put(6, 0.4, 4.2, 1.5, 7.1, 0, 0x2a2426);
  put(0.5, 15, 0.5, -3, 9.5, 0, woodD);                              // mast
  put(0.3, 0.3, 7.5, -3, 15.5, 0, woodD);                            // yard
  const sail = burning ? [0x2a1a14, 0x3a2418] : [0xc4b08a, 0xa8966e];
  for (let k = 0; k < 6; k++) {                                       // battened sail panels (burnt ones have holes)
    if (burning && r.chance(0.35)) continue;
    put(0.15, 1.35, 6.5 - k * 0.25, -3.1, 14.6 - k * 1.45, 0, sail[k & 1]);
  }
  for (let k = -4; k <= 4; k++) put(0.15, 0.9, 0.15, k * 2, 2.9, 2.5, woodD);   // rail posts
  const fires = [];
  if (burning) for (const lx of [-6, 1.5, 7]) if (r.chance(0.8)) fires.push([...at(lx * s, 2.6 * s, r.range(-1, 1) * s)].map((v, i) => (i === 1 ? 2.6 * s : v)).concat(r.range(1.2, 1.7), false));   // no smoke column: it would hide the fleet
  return fires;
}

function buildRiver(scene) {
  const r = makeRng(303), b = [], fires = [];
  // muddy bank along the arena side: dark stones and reeds
  for (let x = -300; x < 300; x += 1.6) {
    const w = r.range(1, 2.4);
    b.push({ s: [w, r.range(0.25, 0.6), r.range(1.2, 2.6)], p: [x, 0.12, RIVER.z0 + r.range(-0.8, 0.6)], r: [0, r.range(-0.3, 0.3), 0], c: shade(0x3a3028, r.range(0.7, 1.1)) });
    if (r.chance(0.5)) b.push({ s: [0.08, r.range(0.8, 1.6), 0.08], p: [x + r.range(-0.6, 0.6), 0.6, RIVER.z0 - r.range(0, 1.5)], r: [r.range(-0.2, 0.2), 0, r.range(-0.2, 0.2)], c: 0x4a4a2a });
  }
  // the chained fleet: two staggered lines, iron chains between neighbours; most of the near line burns
  const hulls = [];
  for (let i = 0; i < 9; i++) {
    const x = -130 + i * 30 + r.range(-3, 3), z = i & 1 ? 80 : 62, yaw = r.range(-0.08, 0.08), s = r.range(0.95, 1.1);   // broadside (hull along x)
    fires.push(...ship(b, r, x, z, yaw, s, r.chance(z < 75 ? 0.75 : 0.5)));
    hulls.push([x, z]);
  }
  for (let i = 0; i + 1 < hulls.length; i++) {                         // 連環: chains ship to ship
    const [x0, z0] = hulls[i], [x1, z1] = hulls[i + 1], n = 14;
    for (let k = 1; k < n; k++) {
      const u = k / n, sag = Math.sin(u * Math.PI) * 0.9;
      b.push({ s: [0.5, 0.25, 0.25], p: [x0 + (x1 - x0) * u, 2.2 - sag, z0 + (z1 - z0) * u], r: [0, Math.atan2(z1 - z0, x1 - x0) + (k & 1) * 1.57, 0], c: 0x2a2a2e });
    }
  }
  const m = new THREE.Mesh(boxesGeometry(b), lit());
  m.castShadow = true; m.receiveShadow = true;
  const water = waterMesh();
  scene.add(m, water.mesh);
  // the burning ships light the water and the bank (a few point lights, flickering)
  const lights = fires.filter((_, i) => i % 2 === 0).slice(0, 6).map(([x, y, z]) => {
    const l = new THREE.PointLight(0xff7a2a, 260, 46, 1.6); l.position.set(x, y + 4, z); scene.add(l); return l;
  });
  return { fires, update(t) { water.uTime.value = t; lights.forEach((l, i) => { l.intensity = 230 + Math.sin(t * (9 + i * 1.7) + i) * 40 + Math.sin(t * 5.3 + i) * 30; }); } };
}

// ---------------------------------------------------------------- 虎牢關: rock walls of the pass
function buildPass(scene) {
  const b = [], S = 4;
  const strata = [0x4e3e30, 0x5e4a38, 0x423428, 0x68523e, 0x4a3a2c];   // dark enough to hold their layers in the bright noon look
  for (const s of [1, -1]) {
    for (let z = -180; z < 106; z += S) {
      const e = edge(s, z);
      for (let k = 0; k < 11; k++) {
        const x = s * (e + k * S + S / 2), n = noise2(x * 0.05, z * 0.05, 11), n2 = noise2(x * 0.2, z * 0.2, 12);
        const h = Math.min(58, 7 + k * 4.4 + n * 14 + n2 * 4) * (z > 96 ? 0.85 : 1);
        // rock in horizontal strata (stacked slabs, each a little in or out), a mossy cap on top
        let y = 0, i = 0;
        while (y < h - 0.5) {
          const th = Math.min(h - y, 3 + ((i * 7 + k * 3 + Math.round(z)) % 3)), inset = ((i + k) % 3) * 0.25;
          b.push({ s: [S - inset, th, S - inset * 0.5], p: [x, y + th / 2, z + S / 2], c: shade(strata[(i + Math.round(n * 5)) % strata.length], 0.85 + n2 * 0.3) });
          y += th; i++;
        }
        b.push({ s: [S + 0.2, 0.6, S + 0.2], p: [x, h + 0.3, z + S / 2], c: shade(0x4a5a2c, 0.85 + n2 * 0.3) });
        if (k === 0 && n2 > 0.55) b.push({ s: [1.4, 1, 1.6], p: [x - s * 1.8, 0.5, z + S / 2 + 0.6], c: shade(0x7a6c5c, 0.9) });   // fallen rocks at the foot
      }
    }
  }
  const m = new THREE.Mesh(boxesGeometry(b), lit());
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m);
  return { fires: [], update() {} };
}

export function buildSetpiece(scene) {
  if (SET === 'river') return buildRiver(scene);
  if (SET === 'pass') return buildPass(scene);
  return { fires: [], update() {} };
}
