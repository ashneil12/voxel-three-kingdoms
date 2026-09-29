// Experimental deformation of the single-mesh TRELLIS Vanguard. The existing combat rig remains
// the pose authority. This is a visual production test, not an authored skin or a final LOD.
//
// Binding: every triangle is assigned to ONE rig joint (nearest bone capsule, then a per-triangle
// majority vote) and vertices are duplicated at joint borders, so no triangle is ever stretched
// across a bend. This replaced an earlier per-vertex x/y threshold map that split islands at
// arbitrary heights and flung pieces out as spikes when the shoulder/hip joints moved.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createRig } from './rig.js';

export const GENERATED_SUIT_URL = './docs/art/production-pilot/vanguard-a-pose-hq.glb';
const HEIGHT = 1.72; // rig-space height; HERO_SCALE brings it to approximately 1.86 m
const JOINTS = ['hips', 'spine', 'chest', 'neck', 'head',
  'shoulderL', 'upperArmL', 'foreArmL', 'handL', 'shoulderR', 'upperArmR', 'foreArmR', 'handR',
  'thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR'];

const PARENT = {
  hips: null, spine: 'hips', chest: 'spine', neck: 'chest', head: 'neck',
  shoulderL: 'chest', upperArmL: 'shoulderL', foreArmL: 'upperArmL', handL: 'foreArmL',
  shoulderR: 'chest', upperArmR: 'shoulderR', foreArmR: 'upperArmR', handR: 'foreArmR',
  thighL: 'hips', shinL: 'thighL', footL: 'shinL', thighR: 'hips', shinR: 'thighR', footR: 'shinR',
};

// Influence radius per bone: bigger for thick volumes (pelvis, chest, thigh), smaller for slim
// ones (neck, wrist), so a point near two bones picks the volume it visually belongs to.
const RADIUS = {
  hips: 1.15, spine: 1.0, chest: 1.05, neck: 0.85, head: 1.0,
  shoulderL: 0.95, upperArmL: 0.95, foreArmL: 0.9, handL: 0.8,
  shoulderR: 0.95, upperArmR: 0.95, foreArmR: 0.9, handR: 0.8,
  thighL: 1.0, shinL: 0.95, footL: 0.9, thighR: 1.0, shinR: 0.95, footR: 0.9,
};

/** Bone capsules in bind-rig world space. Each joint owns the segment it actually drives:
 *  chain bones span parent→child (pelvis extends down past the hips joint), leaves get a stub.
 *  Arms are measured FROM THE MESH: the GLB is an A-pose while the rig rest pose is arms-down,
 *  so rig-derived arm capsules sit where the arm isn't and pull forearm islands onto the hand. */
function boneCapsules(bindRig, geometry) {
  const w = {};
  bindRig.root.updateMatrixWorld(true);
  for (const name of JOINTS) w[name] = bindRig.joints[name].getWorldPosition(new THREE.Vector3());
  const capsules = JOINTS.map((name) => {
    const p = w[name], parent = PARENT[name] ? w[PARENT[name]] : null;
    const child = JOINTS.find((m) => PARENT[m] === name);
    let a = p, b;
    if (name === 'hips') { a = p.clone().setY(p.y - 0.2); b = w.spine; }
    else if (name === 'head') b = p.clone().setY(p.y + 0.3);            // helmet is tall; give it reach
    else if (name === 'footL' || name === 'footR') b = p.clone().add(new THREE.Vector3(0, -0.04, 0.16)); // ankle → toe
    else if (child) b = w[child].clone().addScaledVector(w[child].clone().sub(p), 0.06);
    else b = p.clone().addScaledVector(parent ? p.clone().sub(parent) : new THREE.Vector3(0, -1, 0), 0.55);
    return { name, a, b, radius: RADIUS[name] };
  });
  const byName = Object.fromEntries(capsules.map((c) => [c.name, c]));
  for (const side of ['L', 'R']) {
    const arm = measureArm(geometry, side, byName['upperArm' + side].a);
    if (!arm) continue;
    for (const [joint, seg] of Object.entries(arm)) byName[joint + side].a.copy(seg[0]), byName[joint + side].b.copy(seg[1]);
  }
  return capsules;
}

/** Arm chain measured along the mesh's actual A-posed arm: shoulder joint → widest hand vertex. */
function measureArm(geometry, side, shoulder) {
  const position = geometry.getAttribute('position');
  const sign = side === 'L' ? 1 : -1;
  let best = 0.18, tip = null;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i);
    if (sign * x < best || y > 1.18 || y < 0.5) continue;
    best = sign * x; tip = new THREE.Vector3(x, y, position.getZ(i));
  }
  if (!tip) return null;
  const A = shoulder.clone(), B = tip.clone();
  const at = (t) => A.clone().addScaledVector(B.clone().sub(A), t);
  return {
    upperArm: [A.clone(), at(0.48)],
    foreArm: [at(0.44), at(0.86)],
    hand: [at(0.82), B.clone().addScaledVector(B.clone().sub(A), 0.08)],
  };
}

const _ab = new THREE.Vector3(), _ap = new THREE.Vector3(), _proj = new THREE.Vector3();
/** Scaled point→segment distance. */
function capsuleDistance(point, capsule) {
  _ab.subVectors(capsule.b, capsule.a);
  _ap.subVectors(point, capsule.a);
  const t = THREE.MathUtils.clamp(_ap.dot(_ab) / Math.max(_ab.lengthSq(), 1e-9), 0, 1);
  _proj.copy(capsule.a).addScaledVector(_ab, t);
  return point.distanceTo(_proj) / capsule.radius;
}

// Rubber-joint band (scaled-distance units): vertices where the nearest two bones — and only a
// parent/child pair — are within this band get a two-bone blend, which keeps the wrist/elbow/knee
// seams closed when a limb rotates far. Everything else stays rigid to one bone.
const BLEND_BAND = 0.35;

/** Per-vertex skinning weights: {b1, b2 (or -1), w1} — rigid single-bone outside the blend band. */
function assignBones(geometry, capsules) {
  const position = geometry.getAttribute('position');
  const count = position.count;
  const bones = new Uint8Array(count * 2);
  const weights = new Float32Array(count);
  const _p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    _p.set(position.getX(i), position.getY(i), position.getZ(i));
    let b1 = 0, b2 = -1, d1 = Infinity, d2 = Infinity;
    for (let c = 0; c < capsules.length; c++) {
      const d = capsuleDistance(_p, capsules[c]);
      if (d < d1) { d2 = d1; b2 = b1; d1 = d; b1 = c; }
      else if (d < d2) { d2 = d; b2 = c; }
    }
    let w1 = 1;
    const adjacent = b2 >= 0 && (PARENT[capsules[b1].name] === capsules[b2].name || PARENT[capsules[b2].name] === capsules[b1].name);
    if (adjacent && d2 - d1 < BLEND_BAND) {
      const t = THREE.MathUtils.clamp((d2 - d1) / BLEND_BAND, 0, 1);   // 0 at the seam, 1 at the band edge
      w1 = 0.5 + 0.5 * t;
    } else {
      b2 = -1;
    }
    bones[i * 2] = b1; bones[i * 2 + 1] = b2 < 0 ? 0 : b2;
    weights[i] = w1;
  }
  return { bones, weights };
}

/** Whole-island snap: the TRELLIS mesh is a patchwork of tens of thousands of shells. A small
 *  shell (plate, bolt, sliver) must move as ONE piece, or parts of it drift off as debris during
 *  a pose. Islands at or above the cutoff keep the per-vertex rigid/blend treatment. */
const ISLAND_SNAP_MAX = 900; // vertices
function snapSmallIslands(geometry, skin) {
  const position = geometry.getAttribute('position');
  const index = geometry.index;
  const count = index ? index.count : position.count;
  const parent = new Int32Array(position.count);
  for (let i = 0; i < parent.length; i++) parent[i] = i;
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  for (let t = 0; t < count; t += 3) {
    const a = index ? index.getX(t) : t, b = index ? index.getX(t + 1) : t + 1, c = index ? index.getX(t + 2) : t + 2;
    const ra = find(a), rb = find(b), rc = find(c);
    if (rb !== ra) parent[rb] = ra;
    if (rc !== ra) parent[rc] = ra;
  }
  const groups = new Map();
  for (let i = 0; i < position.count; i++) {
    const r = find(i);
    let g = groups.get(r);
    if (!g) { g = { verts: [], tally: new Map() }; groups.set(r, g); }
    g.verts.push(i);
    const b1 = skin.bones[i * 2];
    g.tally.set(b1, (g.tally.get(b1) || 0) + 1);
  }
  let snapped = 0;
  for (const g of groups.values()) {
    if (g.verts.length >= ISLAND_SNAP_MAX) continue;
    let best = 0, bestN = -1;
    for (const [b, n] of g.tally) if (n > bestN) { bestN = n; best = b; }
    for (const i of g.verts) { skin.bones[i * 2] = best; skin.bones[i * 2 + 1] = 0; skin.weights[i] = 1; }
    snapped++;
  }
  return { islands: groups.size, snapped };
}

function normalise(source) {
  source.updateMatrixWorld(true);
  const origin = source.getObjectByProperty('isMesh', true);
  if (!origin) throw new Error('Generated suit GLB contains no mesh');
  const geometry = origin.geometry.clone().applyMatrix4(origin.matrixWorld);
  const bounds = new THREE.Box3().setFromBufferAttribute(geometry.getAttribute('position'));
  const size = bounds.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('Generated suit has invalid bounds');
  const centre = bounds.getCenter(new THREE.Vector3()), scale = HEIGHT / size.y;
  geometry.translate(-centre.x, -bounds.min.y, -centre.z);
  geometry.scale(scale, scale, scale);
  return { geometry, material: origin.material };
}

// One triangle is rigid when all its corners carry the same single bone; at a rubber band it
// blends its averaged corner weights over two bones. Vertices are duplicated per (vertex, bone
// pair), so a rigid plate is never stretched across a bend and a band deforms smoothly.
function rigidRegionGeometry(source, skin) {
  const position = source.getAttribute('position'), normal = source.getAttribute('normal'), uv = source.getAttribute('uv');
  const srcIndex = source.index;
  const count = srcIndex ? srcIndex.count : position.count;
  const index = [], positions = [], normals = [], uvs = [], skinIndices = [], skinWeights = [];
  const vertexMap = new Map(), regionCounts = {};
  for (let t = 0; t < count; t += 3) {
    const ids = [0, 1, 2].map((k) => srcIndex ? srcIndex.getX(t + k) : t + k);
    // accumulate corner weights, then keep the two strongest bones
    const acc = new Map();
    for (const id of ids) {
      const b1 = skin.bones[id * 2], b2 = skin.bones[id * 2 + 1], w1 = skin.weights[id];
      acc.set(b1, (acc.get(b1) || 0) + w1 / 3);
      if (w1 < 1) acc.set(b2, (acc.get(b2) || 0) + (1 - w1) / 3);
    }
    const ranked = [...acc.entries()].sort((a, b) => b[1] - a[1]);
    const ba = ranked[0][0];
    const bb = ranked.length > 1 && ranked[1][1] >= 0.08 ? ranked[1][0] : -1;
    const total = bb < 0 ? ranked[0][1] : ranked[0][1] + ranked[1][1];
    const wa = bb < 0 ? 1 : ranked[0][1] / Math.max(1e-6, total);
    const region = JOINTS[ba] + (bb >= 0 ? '+' + JOINTS[bb] : '');
    regionCounts[region] = (regionCounts[region] || 0) + 1;
    for (const sourceId of ids) {
      const key = sourceId * (JOINTS.length * JOINTS.length) + ba * JOINTS.length + (bb < 0 ? 0 : bb);
      let id = vertexMap.get(key);
      if (id === undefined) {
        id = positions.length / 3;
        vertexMap.set(key, id);
        positions.push(position.getX(sourceId), position.getY(sourceId), position.getZ(sourceId));
        normals.push(normal.getX(sourceId), normal.getY(sourceId), normal.getZ(sourceId));
        uvs.push(uv.getX(sourceId), uv.getY(sourceId));
        skinIndices.push(ba, bb < 0 ? 0 : bb, 0, 0);
        if (bb < 0) skinWeights.push(1, 0, 0, 0);
        else skinWeights.push(wa, 1 - wa, 0, 0);
      }
      index.push(id);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  geometry.setIndex(index);
  geometry.computeBoundingSphere();
  geometry.userData.regionCounts = regionCounts;
  return geometry;
}

export function buildGeneratedSuit(rig, gltf) {
  const source = normalise(gltf.scene);
  // Bind against a canonical rig so an in-flight pose cannot leak into the bind matrices.
  const bindRig = createRig();
  const capsules = boneCapsules(bindRig, source.geometry);
  const vertexBone = assignBones(source.geometry, capsules);
  const skinStats = snapSmallIslands(source.geometry, vertexBone);
  const geometry = rigidRegionGeometry(source.geometry, vertexBone), material = source.material;
  source.geometry.dispose();
  const bones = JOINTS.map((name) => {
    const bone = new THREE.Bone();
    bone.name = `suit-${name}`;
    rig.joints[name].add(bone);
    return bone;
  });
  bindRig.root.updateMatrixWorld(true);
  const inverses = JOINTS.map((name) => bindRig.joints[name].matrixWorld.clone().invert());
  rig.root.updateMatrixWorld(true);
  const skin = new THREE.SkinnedMesh(geometry, material);
  skin.name = 'Vanguard generated suit — experimental skin';
  skin.castShadow = true;
  skin.receiveShadow = true;
  skin.frustumCulled = false; // bind-pose bounds do not include the combat pose range
  rig.root.add(skin);
  skin.bind(new THREE.Skeleton(bones, inverses), new THREE.Matrix4());
  skin.userData.regionCounts = geometry.userData.regionCounts;
  skin.userData.islandStats = skinStats;
  return skin;
}

let cached;
export function loadGeneratedSuit() {
  cached ||= new GLTFLoader().loadAsync(GENERATED_SUIT_URL).catch((error) => { cached = null; throw error; });
  return cached;
}

export function attachGeneratedSuit(rig, model) {
  model.assetState = 'loading';
  model.ready = loadGeneratedSuit().then((gltf) => {
    if (model.cancelled) return null;
    const skin = buildGeneratedSuit(rig, gltf);
    for (const mesh of Object.values(model.meshes)) if (mesh.parent !== rig.joints.weapon) mesh.visible = false;
    model.generatedMesh = skin;
    model.assetState = 'ready';
    return skin;
  }).catch((error) => {
    model.assetState = 'failed';
    model.assetError = error;
    console.error('Generated suit unavailable; procedural suit remains active', error);
    return null;
  });
  return model;
}

export function disposeGeneratedSuit(model) {
  model.cancelled = true;
  const skin = model.generatedMesh;
  if (!skin) return;
  skin.parent?.remove(skin);
  for (const bone of skin.skeleton.bones) bone.parent?.remove(bone);
  skin.geometry.dispose();
  model.generatedMesh = null;
}
