// Hero voxel model builder, shared by every playable officer. A hero definition (src/heroes/*.js) authors its parts in
// voxel units; they are rasterised into a grid and meshed with exposed faces only plus per-vertex ambient occlusion
// (lamellar gaps, folds and seams darken). One mesh per rig joint. The hero material gets a camera fill + warm rim so
// the hero reads in a dark crowd.
import * as THREE from 'three';
import { hash01 } from '../core/rng.js';
import { shade } from '../core/voxel.js';
import { voxelSurface } from './voxel-surface.js';
import { numParam } from '../core/params.js';
import { createProceduralSuit } from './procedural-suit.js';
import { attachGeneratedSuit } from './generated-suit.js?v=skin-2';
import { loadSuitDesign } from '../heroes/suit-design.js';

export const V = 0.025;          // body voxel (m); spear 0.02/0.012, blade 0.011
export const HV = 0.0175;        // head voxel: 13-voxel head ≈ 0.23 m (× HERO_SCALE) → ≈ 7.5 heads tall

// ---------------------------------------------------------------- voxel mesher with AO
const FACES = [
  { n: [1, 0, 0], v: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
  { n: [-1, 0, 0], v: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { n: [0, 1, 0], v: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { n: [0, -1, 0], v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 0, 1], v: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { n: [0, 0, -1], v: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
];
const _col = new THREE.Color();

/**
 * boxes: { a:[x,y,z], b:[x,y,z] (voxel units, integers, b exclusive), c: 0xRRGGBB | -1 (carve) | fn(x,y,z) → colour|null,
 * paint?: only recolour existing voxels }. Later boxes win. Vertex = (voxel + off) * v.
 */
export function vox(boxes, v = V, { off = [0, 0, 0], jitter = 0.05, ao = 0.42 } = {}) {
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const b of boxes) if (!b.paint && b.c !== -1) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], b.a[k]); mx[k] = Math.max(mx[k], b.b[k]); }
  const o = mn.map((m) => m - 1), n = mx.map((m, k) => m - mn[k] + 2);        // 1-voxel empty border for neighbour tests
  const grid = new Int32Array(n[0] * n[1] * n[2]).fill(-1);
  const id = (i, j, k) => i + n[0] * (j + n[1] * k);
  for (const b of boxes) {
    for (let z = Math.max(b.a[2], o[2]); z < Math.min(b.b[2], o[2] + n[2]); z++)
      for (let y = Math.max(b.a[1], o[1]); y < Math.min(b.b[1], o[1] + n[1]); y++)
        for (let x = Math.max(b.a[0], o[0]); x < Math.min(b.b[0], o[0] + n[0]); x++) {
          const g = id(x - o[0], y - o[1], z - o[2]);
          if (b.paint && grid[g] < 0) continue;
          const c = typeof b.c === 'function' ? b.c(x, y, z) : b.c;
          if (c == null) continue;
          grid[g] = c;
        }
  }
  const full = (i, j, k) => i >= 0 && j >= 0 && k >= 0 && i < n[0] && j < n[1] && k < n[2] && grid[id(i, j, k)] >= 0 ? 1 : 0;
  // plates: per face direction, greedy-merge coplanar exposed faces of one palette colour into rectangles. Geometry stays one
  // quad per voxel (per-vertex AO), but each vertex also carries its position inside the plate so the surface shader can
  // bevel / chip the PLATE edge instead of every voxel edge.
  const plate = FACES.map((f) => {
    const sA = f.n[0] ? 0 : f.n[1] ? 1 : 2;
    const A0 = f.n[0] ? 1 : 0, A1 = f.n[2] ? 1 : 2;
    const map = new Int32Array(n[0] * n[1] * n[2]).fill(-1), rects = [];
    const c3 = [0, 0, 0];
    const expo = (c) => { const [i, j, k] = c; return i > 0 && j > 0 && k > 0 && i < n[0] - 1 && j < n[1] - 1 && k < n[2] - 1 && grid[id(i, j, k)] >= 0 && !full(i + f.n[0], j + f.n[1], k + f.n[2]); };
    const ok = (c, col) => expo(c) && map[id(c[0], c[1], c[2])] < 0 && grid[id(c[0], c[1], c[2])] === col;
    for (let sl = 1; sl < n[sA] - 1; sl++) for (let b = 1; b < n[A1] - 1; b++) for (let a = 1; a < n[A0] - 1; a++) {
      c3[sA] = sl; c3[A0] = a; c3[A1] = b;
      if (!expo(c3) || map[id(c3[0], c3[1], c3[2])] >= 0) continue;
      const col = grid[id(c3[0], c3[1], c3[2])];
      let w = 1, h = 1;
      const t = [...c3];
      while (a + w < n[A0] - 1 && (t[A0] = a + w, ok(t, col))) w++;
      t[A0] = a;
      grow: while (b + h < n[A1] - 1) {
        t[A1] = b + h;
        for (let q = 0; q < w; q++) { t[A0] = a + q; if (!ok(t, col)) break grow; }
        h++;
      }
      const rid = rects.length;
      rects.push([a, b, w, h, hash01(a + o[A0], b + o[A1], sl * 7 + sA * 3 + (f.n[0] + f.n[1] + f.n[2] > 0 ? 1 : 0))]);
      for (let bb = 0; bb < h; bb++) for (let aa = 0; aa < w; aa++) { t[A0] = a + aa; t[A1] = b + bb; t[sA] = sl; map[id(t[0], t[1], t[2])] = rid; }
    }
    return { map, rects, A0, A1 };
  });
  const pos = [], nor = [], col = [], idx = [], vuv = [], vsz = [];
  const AO = [1 - ao, 1 - ao * 0.6, 1 - ao * 0.25, 1];
  const lv = [0, 0, 0, 0];
  for (let k = 1; k < n[2] - 1; k++) for (let j = 1; j < n[1] - 1; j++) for (let i = 1; i < n[0] - 1; i++) {
    const c = grid[id(i, j, k)];
    if (c < 0) continue;
    const vh = hash01(i + o[0], j + o[1], k + o[2]);
    _col.set(shade(c, 1 - jitter / 2 + vh * jitter));
    for (let fi = 0; fi < 6; fi++) {
      const f = FACES[fi], [nx, ny, nz] = f.n;
      if (full(i + nx, j + ny, k + nz)) continue;
      const pl = plate[fi], rc = pl.rects[pl.map[id(i, j, k)]], cell = [i, j, k];
      const ax = f.n[0] ? [1, 2] : f.n[1] ? [0, 2] : [0, 1];
      const base = pos.length / 3;
      f.v.forEach((cv, q) => {
        const p = [i + nx, j + ny, k + nz];
        const s1 = [...p], s2 = [...p];
        s1[ax[0]] += cv[ax[0]] ? 1 : -1; s2[ax[1]] += cv[ax[1]] ? 1 : -1;
        const cc = [...s1]; cc[ax[1]] += cv[ax[1]] ? 1 : -1;
        const a = full(...s1), b = full(...s2);
        lv[q] = a && b ? 0 : 3 - a - b - full(...cc);
        pos.push((i + o[0] + cv[0] + off[0]) * v, (j + o[1] + cv[1] + off[1]) * v, (k + o[2] + cv[2] + off[2]) * v);
        nor.push(nx, ny, nz);
        vuv.push(cell[pl.A0] + cv[pl.A0] - rc[0], cell[pl.A1] + cv[pl.A1] - rc[1], 1 + rc[4]);
        vsz.push(rc[2], rc[3]);
        const m = AO[lv[q]];
        col.push(_col.r * m, _col.g * m, _col.b * m);
      });
      if (lv[0] + lv[2] < lv[1] + lv[3]) idx.push(base, base + 1, base + 3, base + 1, base + 2, base + 3);
      else idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('vuv', new THREE.Float32BufferAttribute(vuv, 3));
  g.setAttribute('vsz', new THREE.Float32BufferAttribute(vsz, 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}


// ---------------------------------------------------------------- authoring helpers (voxel units)
export const B = (a, b, c, paint) => ({ a, b, c, paint });
export const md = (a, m) => ((a % m) + m) % m;
export const P = (a, b, c) => ({ a, b, c, paint: true });
/** Mirror a box for the right side (parts authored with +x = outward); c2 = 2 × mirror plane (1 for off −0.5 parts). */
export const mirX = (bx, sx, c2 = 0) => (sx > 0 ? bx : { ...bx, a: [c2 - bx.b[0], bx.a[1], bx.a[2]], b: [c2 - bx.a[0], bx.b[1], bx.b[2]] });


/**
 * Lamellar armour: a volume made of horizontal rows (rowH voxels tall) of small plates (pw voxels wide, staggered per row,
 * one dark seam voxel between plates). Each row's lowest voxel is a bright lip that sticks out by one voxel on x and z
 * (the rows overlap like scales; AO darkens under every lip) and the voxel tucked under the next lip is shaded, so every
 * row reads as plates with dark gaps. `trim` colours the lip of the lowest row; `jag` knocks out every 3rd voxel of it.
 */
export function lamellar(a, b, { base = 0xdcdee2, rowH = 3, pw = 4, trim = null, jag = false, lipX = true, lipZ = true } = {}) {
  const out = [], dark = shade(base, 0.6), tuck = shade(base, 0.8), hi = shade(base, 1.04);
  const seam = (x, y, z) => md(x + z + (Math.floor((y - a[1]) / rowH) & 1) * (pw >> 1), pw) === 0;
  out.push(B(a, b, (x, y, z) => (seam(x, y, z) ? dark : (y - a[1]) % rowH === rowH - 1 ? tuck : base)));
  for (let y = a[1]; y < b[1]; y += rowH) {
    const bottom = y === a[1];
    out.push(B([a[0] - (lipX ? 1 : 0), y, a[2] - (lipZ ? 1 : 0)], [b[0] + (lipX ? 1 : 0), y + 1, b[2] + (lipZ ? 1 : 0)],
      (x, yy, z) => (bottom && jag && md(x + z, 3) === 0 ? null : bottom && trim != null ? trim : seam(x, yy, z) ? dark : hi)));
  }
  return out;
}


// ---------------------------------------------------------------- material
/**
 * Hero-only lighting on top of the scene lights (the camera usually sees his back, which the low sun leaves in shade):
 * a soft cool fill from the camera's upper left and a warm Fresnel rim on faces seen edge-on. Split-toned like the
 * concept: peach rim/sun, blue-grey fill. Added after lighting and faded out where the surface is already bright, so
 * it lifts the shade side without blowing sunlit armour into the bloom. Does not touch the scene or other materials.
 */
// ?rig=0 drops the camera-relative key, ?rig=k scales it
const HERO_KEY = numParam('rig', 1, 0, 3) * 0.6;
export function heroLook(mat, fill = 0.4, rim = 0.9, glow = 0) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uHeroFill = { value: fill };
    sh.uniforms.uHeroRim = { value: rim };
    sh.uniforms.uHeroGlow = { value: glow };
    sh.fragmentShader = `uniform float uHeroFill, uHeroRim, uHeroGlow;\n#define HERO_KEY ${HERO_KEY.toFixed(3)}\n` + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      // saturated orange/gold vertex colours (visor, lights, trim) glow so the bloom pass picks them up
      float heroOg = smoothstep(0.5, 0.75, vColor.r) * smoothstep(0.42, 0.18, vColor.b) * smoothstep(0.2, 0.32, vColor.g);
      totalEmissiveRadiance += vec3(1.0, 0.5, 0.1) * heroOg * uHeroGlow * 2.6;
      diffuseColor.rgb *= 1.0 - 0.75 * heroOg * step(0.01, uHeroGlow);   // lit orange paint washes to cream: let the light itself carry the colour
      float heroNdv = abs(dot(normal, normalize(vViewPosition)));
      float heroFl = max(dot(normal, normalize(vec3(-0.4, 0.55, 0.75))), 0.0) * 0.8 + 0.2;
      // camera-relative warm key from the upper right (the art target's key): lives in the hero shader, not in a scene
      // light, so it shapes the suit from every chase angle without throwing hot specular blobs on the wet floor
      float heroKy = max(dot(normal, normalize(vec3(0.55, 0.6, 0.6))), 0.0);
      vec3 heroExtra = diffuseColor.rgb * (uHeroFill * heroFl * vec3(0.78, 0.84, 1.0) + HERO_KEY * heroKy * vec3(1.0, 0.76, 0.52)
        + uHeroRim * pow(1.0 - heroNdv, 2.5) * vec3(1.0, 0.7, 0.45));`).replace('#include <opaque_fragment>', `
      // soft sheen from the same key: bevelled plate edges catch a warm line, flat faces stay matte
      vec3 heroH = normalize(normalize(vec3(0.55, 0.6, 0.6)) + normalize(-vViewPosition));
      float heroSp = pow(max(dot(normal, heroH), 0.0), 28.0) * HERO_KEY * 0.32 * (1.0 - roughnessFactor * 0.6);
      outgoingLight += (heroExtra + vec3(1.0, 0.82, 0.62) * heroSp) * (1.0 - smoothstep(0.2, 0.85, dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722))));
      #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => `hero-look-${fill}-${rim}-${glow}`;
  return mat;
}


/**
 * def.build() → { parts: { joint: boxes } (body voxels V), head: boxes (head voxels HV), pauldrons?: (sx) → boxes,
 * weapon: [{ geo, mat: 'body' | 'metal' | 'blade' | Material }] } — weapon geometry sits on the weapon joint
 * (shaft +Z, origin = rear grip).
 */
export function createHeroModel(rig, def) {
  if (def.proceduralSuit) {
    const model = createProceduralSuit(rig, loadSuitDesign());
    return def.generatedSuit && new URLSearchParams(location.search).get('suit') !== 'procedural'
      ? attachGeneratedSuit(rig, model) : model;
  }
  // integration r1: albedo × 0.8 so the ivory lamellar keeps its scale rows under the environment's light + post-fx grade
  // (at 1.0 the armour clipped to flat white)
  const mc = def.matColor ?? 0.8;
  const built = def.build();
  const bv = built.bv || V;           // bv: body voxel size (default V). Fine-voxel heroes author every part centred on the joint
  const mkBody = (vox, fill = def.fill ?? 0.4, rim = def.rim ?? 0.9, glow = def.glow ?? 0) => voxelSurface(heroLook(new THREE.MeshStandardMaterial({ color: new THREE.Color(mc, mc, mc), vertexColors: true, roughness: 0.58, metalness: 0.08, flatShading: true }), fill, rim, glow), { vox });
  const mat = mkBody(bv);
  const mats = {
    body: mat,
    metal: voxelSurface(heroLook(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.55, flatShading: true }), 0.25, 0.6), { vox: bv, wear: 0.7 }),
    blade: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.22, metalness: 0.65, flatShading: true, emissive: 0xcfe4ff, emissiveIntensity: 0.32 }),
  };
  const meshes = {};
  const add = (parent, geo, name, m = mat) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh);
    meshes[name] = mesh;
    return mesh;
  };
  for (const [joint, boxes] of Object.entries(built.parts)) {
    const odd = !built.bv && /foreArm|thigh|shin/.test(joint);       // odd-width parts: centre them
    add(rig.joints[joint], vox(boxes, bv, { off: odd ? [-0.5, 0, -0.5] : [0, 0, 0], jitter: built.bv ? 0.035 : 0.05 }), joint);
  }
  let headMat = mkBody(built.hv || HV);
  if (built.headLook) {
    const look = built.headLook;
    headMat = voxelSurface(heroLook(headMat.clone(), look.fill, look.rim, look.glow), { vox: built.hv || HV });
    headMat.color.setRGB(look.matColor, look.matColor, look.matColor);
    headMat.roughness = look.roughness;
  }
  add(rig.joints.head, vox(built.head, built.hv || HV, { off: built.headOff || [-0.5, 0, 0], jitter: 0.04 }), 'head', headMat);   // hv: finer head voxels for detailed faces
  // pauldrons ride on a helper under each shoulder; secondary.js turns it halfway with the upper arm
  if (built.pauldrons) for (const [s, sx] of [['R', -1], ['L', 1]]) {
    const pd = new THREE.Object3D();
    pd.name = 'pauldron' + s;
    rig.joints['shoulder' + s].add(pd);
    rig.joints['pauldron' + s] = pd;
    const boxes = built.pauldrons(sx);
    if (boxes.length) add(pd, vox(boxes, bv), 'pauldron' + s);           // [] = no pauldron on that side (asymmetric armour)
  }
  built.weapon.forEach((w, i) => add(rig.joints.weapon, w.geo, 'weapon' + i, typeof w.mat === 'string' ? mats[w.mat] : w.mat || mat));
  return { meshes, material: mat };
}
