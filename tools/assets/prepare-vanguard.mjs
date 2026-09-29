// Vanguard preparation: one smoothly skinned armour mesh bound to the combat rig's joints.
//
// The generated source is a single unrigged A-pose mesh. We (1) drop the regions replaced by authored parts and
// detached crumbs, (2) simplify the WHOLE mesh once (no per-region cuts, so no cracks), (3) label every vertex with the
// combat joint it belongs to, (4) turn the hard labels into narrow geodesic blends around each joint, and (5) write a
// glTF skin whose inverse-bind matrices convert source A-pose space into each joint's rest frame (limb along -Y).
// At runtime the rig's own joints are the bones, so the mesh follows every pose the combat animation produces.
import { NodeIO } from '@gltf-transform/core';
import { prune } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import * as THREE from '../../vendor/three/three.module.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('.', import.meta.url)));

const input = '../../docs/art/production-pilot/vanguard-a-pose-hq.glb';
const output = '../../assets/vanguard/vanguard-combat.glb';
const io = new NodeIO(), doc = await io.read(input), root = doc.getRoot();
const prim = root.listMeshes()[0].listPrimitives()[0], material = prim.getMaterial();
const pos = prim.getAttribute('POSITION').getArray(), nor = prim.getAttribute('NORMAL').getArray();
const uv = prim.getAttribute('TEXCOORD_0').getArray(), idx = prim.getIndices().getArray();
const min = prim.getAttribute('POSITION').getMin([]), max = prim.getAttribute('POSITION').getMax([]);
const scale = 1.72 / (max[1] - min[1]), cx = (max[0] + min[0]) / 2, cz = (max[2] + min[2]) / 2;
const nv = pos.length / 3;
const P = new Float32Array(pos.length);
for (let i = 0; i < pos.length; i += 3) { P[i] = (pos[i] - cx) * scale; P[i + 1] = (pos[i + 1] - min[1]) * scale; P[i + 2] = (pos[i + 2] - cz) * scale; }

const palette = ['#d7d0bd', '#405f72', '#263038', '#76818a'].map(c => new THREE.Color(c));
const signal = new THREE.Color('#ffad3e');

// Measured against the source in its normalised A-pose. +X is the character's left, +Z is forward.
const landmarks = {
  shoulder: [.225, 1.355, 0], elbow: [.32, 1.15, 0], wrist: [.44, .92, .015],
  hip: [.13, .97, 0], knee: [.205, .60, .01], ankle: [.275, .17, 0],
};
// Region boundaries (source y). Knee/elbow boundaries sit at the pivots so plates bend around the right place.
const CUT = { hip: +(process.env.CUT_HIP ?? .93), elbow: +(process.env.CUT_ELBOW ?? 1.15), knee: +(process.env.CUT_KNEE ?? .61) };
const BLEND = { hip: +(process.env.BLEND_HIP ?? .008), limb: +(process.env.BLEND_LIMB ?? .022), torso: +(process.env.BLEND_TORSO ?? .03) };

const OMIT = new Set(['neck', 'footL', 'footR', null]);
function region(x, y, z) {
  const a = Math.abs(x), s = x >= 0 ? 'L' : 'R';
  if (a > .31 && y < .91 && y > .55) return null;                // open source hands (authored gloves replace them)
  if (y > 1.475 && a < .23) return 'head';
  if (y > 1.44 && a < .085) return 'neck';
  const armEdge = y > 1.28 ? .21 : y > 1.17 ? .26 : .28;
  if (a > armEdge && y > .72) {
    if (y > 1.28) return 'shoulder' + s;
    if (y > CUT.elbow + .02) return 'upperArm' + s;
    if (y > .91) return 'foreArm' + s;
    return null;
  }
  if (y > 1.165) return 'chest';
  if (y > 1.095) return 'spine';
  if (y > CUT.hip || (y > .875 && a < .14)) return 'hips';
  if (y > CUT.knee) return 'thigh' + s;
  if (y > .21) return 'shin' + s;
  return 'foot' + s;
}
// vertices next to a hole may fall in an omitted region; give them the nearest structural joint instead
function vertexRegion(x, y, z) {
  const r = region(x, y, z), a = Math.abs(x), s = x >= 0 ? 'L' : 'R';
  if (r === null) return 'foreArm' + s;
  if (r === 'neck') return y > 1.46 ? 'head' : 'chest';
  return r;
}

// ---------------------------------------------------------------- rest frames (source → joint rest space)
const V = a => new THREE.Vector3(...a);
const frames = {};
function frame(name, origin, end, length, xz = 1) {
  const q = end ? new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), V(end).sub(V(origin)).normalize()) : new THREE.Quaternion();
  const sy = end ? length / V(end).distanceTo(V(origin)) : 1;
  frames[name] = { origin: V(origin), q: q.invert(), scale: new THREE.Vector3(xz, sy, xz) };
}
frame('hips', [0, .98, 0]); frame('spine', [0, 1.01, 0]); frame('chest', [0, 1.19, 0]); frame('neck', [0, 1.43, 0]); frame('head', [0, 1.475, 0]);
for (const [s, sign] of [['L', 1], ['R', -1]]) {
  const m = a => [a[0] * sign, a[1], a[2]];
  frame('shoulder' + s, m(landmarks.shoulder));
  frame('upperArm' + s, m(landmarks.shoulder), m(landmarks.elbow), .29);
  frame('foreArm' + s, m(landmarks.elbow), m(landmarks.wrist), .27);
  frame('thigh' + s, m(landmarks.hip), m(landmarks.knee), .44);
  frame('shin' + s, m(landmarks.knee), m(landmarks.ankle), .44);
  frame('foot' + s, m(landmarks.ankle)); frames['foot' + s].scale.set(1, .8, 1);
}
const JOINTS = ['hips', 'spine', 'chest', 'neck', 'head', 'shoulderL', 'upperArmL', 'foreArmL', 'thighL', 'shinL', 'footL',
  'shoulderR', 'upperArmR', 'foreArmR', 'thighR', 'shinR', 'footR'];
const jointIndex = new Map(JOINTS.map((n, i) => [n, i]));
const torsoLike = n => /^(hips|spine|chest|neck|head|shoulder)/.test(n);

// ---------------------------------------------------------------- 1. keep triangles, reject crumbs
const cen = (i, k) => (P[idx[i] * 3 + k] + P[idx[i + 1] * 3 + k] + P[idx[i + 2] * 3 + k]) / 3;
let omitted = 0;
let keep = [];
for (let i = 0; i < idx.length; i += 3) {
  if (OMIT.has(region(cen(i, 0), cen(i, 1), cen(i, 2)))) { omitted++; continue; }
  keep.push(idx[i], idx[i + 1], idx[i + 2]);
}
// physical connectivity by position (UV seams duplicate vertices)
const q5 = (x, y, z) => `${Math.round(x * 1e5)},${Math.round(y * 1e5)},${Math.round(z * 1e5)}`;
{
  const parent = new Int32Array(nv), same = new Map();
  const find = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  for (let i = 0; i < nv; i++) { parent[i] = i; const k = q5(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); if (same.has(k)) parent[i] = find(same.get(k)); else same.set(k, i); }
  for (let i = 0; i < keep.length; i += 3) { const a = find(keep[i]); for (let k = 1; k < 3; k++) parent[find(keep[i + k])] = a; }
  const counts = new Map(); for (let i = 0; i < keep.length; i += 3) { const r = find(keep[i]); counts.set(r, (counts.get(r) || 0) + 1); }
  const kept = []; let crumbs = 0;
  for (let i = 0; i < keep.length; i += 3) { if (counts.get(find(keep[i])) < 400) { crumbs++; continue; } kept.push(keep[i], keep[i + 1], keep[i + 2]); }
  keep = kept; var removedCrumbs = crumbs;
}

// ---------------------------------------------------------------- 2. simplify the whole mesh once
await MeshoptSimplifier.ready;
const attrs = new Float32Array(nv * 5);
for (let i = 0; i < nv; i++) attrs.set([nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2], uv[i * 2], uv[i * 2 + 1]], i * 5);
const TARGET = +(process.env.TARGET_TRIS ?? 80000);
const [reduced] = MeshoptSimplifier.simplifyWithAttributes(new Uint32Array(keep), P, 3, attrs, 5, [.1, .1, .1, .5, .5], null,
  Math.min(keep.length, TARGET * 3), +(process.env.SIMPLIFY_ERROR ?? .01), (process.env.SIMPLIFY_FLAGS || 'Permissive,RegularizeLight').split(','));
// compact
const remap = new Map(), outIdx = [], SP = [], SN = [], SU = [];
for (const vi of reduced) {
  let o = remap.get(vi);
  if (o === undefined) { o = SP.length / 3; remap.set(vi, o); SP.push(P[vi * 3], P[vi * 3 + 1], P[vi * 3 + 2]); SN.push(nor[vi * 3], nor[vi * 3 + 1], nor[vi * 3 + 2]); SU.push(uv[vi * 2], uv[vi * 2 + 1]); }
  outIdx.push(o);
}
const n = SP.length / 3;

// ---------------------------------------------------------------- 3. labels and geodesic blend weights
const nodeOf = new Int32Array(n), nodeMap = new Map();
for (let i = 0; i < n; i++) { const k = q5(SP[i * 3], SP[i * 3 + 1], SP[i * 3 + 2]); let id = nodeMap.get(k); if (id === undefined) { id = nodeMap.size; nodeMap.set(k, id); } nodeOf[i] = id; }
const nn = nodeMap.size, nodePos = new Float32Array(nn * 3), nodeLabel = new Array(nn);
for (let i = 0; i < n; i++) nodePos.set([SP[i * 3], SP[i * 3 + 1], SP[i * 3 + 2]], nodeOf[i] * 3);
for (let i = 0; i < nn; i++) nodeLabel[i] = jointIndex.get(vertexRegion(nodePos[i * 3], nodePos[i * 3 + 1], nodePos[i * 3 + 2]));
// Bridge triangles between joints that are not neighbours in the skeleton (e.g. one thigh to the other, forearm to hip)
// are surface noise from the generator; they would stretch into spikes as the limbs part, so they are deleted.
const LINKS = [['hips', 'spine'], ['spine', 'chest'], ['chest', 'neck'], ['neck', 'head'], ['chest', 'head'], ['hips', 'chest']];
for (const s of ['L', 'R']) LINKS.push(['chest', 'shoulder' + s], ['chest', 'upperArm' + s], ['shoulder' + s, 'upperArm' + s], ['upperArm' + s, 'foreArm' + s],
  ['hips', 'thigh' + s], ['thigh' + s, 'shin' + s], ['shin' + s, 'foot' + s], ['spine', 'shoulder' + s]);
const linked = new Set(); for (const [a, b] of LINKS) { linked.add(jointIndex.get(a) * 32 + jointIndex.get(b)); linked.add(jointIndex.get(b) * 32 + jointIndex.get(a)); }
{
  let removed = 0; const kept = [];
  for (let i = 0; i < outIdx.length; i += 3) {
    const l = [0, 1, 2].map(k => nodeLabel[nodeOf[outIdx[i + k]]]);
    const ok = [[0, 1], [1, 2], [0, 2]].every(([x, y]) => l[x] === l[y] || linked.has(l[x] * 32 + l[y]));
    if (ok) kept.push(outIdx[i], outIdx[i + 1], outIdx[i + 2]); else removed++;
  }
  outIdx.length = 0; for (const v of kept) outIdx.push(v); var bridgeTriangles = removed;
}
const adj = Array.from({ length: nn }, () => new Map());
for (let i = 0; i < outIdx.length; i += 3) for (let k = 0; k < 3; k++) {
  const a = nodeOf[outIdx[i + k]], b = nodeOf[outIdx[i + (k + 1) % 3]]; if (a === b) continue;
  const d = Math.hypot(nodePos[a * 3] - nodePos[b * 3], nodePos[a * 3 + 1] - nodePos[b * 3 + 1], nodePos[a * 3 + 2] - nodePos[b * 3 + 2]);
  adj[a].set(b, d); adj[b].set(a, d);
}
class Heap { // binary min-heap of [d, node]
  constructor() { this.a = []; }
  push(d, v) { const a = this.a; a.push([d, v]); let i = a.length - 1; while (i) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() { const a = this.a, top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top; }
  get size() { return this.a.length; }
}
const MAXD = .06;
const dist = JOINTS.map((_, j) => {          // geodesic distance to each joint's region, only kept within MAXD
  const d = new Float32Array(nn).fill(Infinity), h = new Heap();
  for (let i = 0; i < nn; i++) if (nodeLabel[i] === j) { d[i] = 0; h.push(0, i); }
  while (h.size) { const [dd, v] = h.pop(); if (dd > d[v]) continue; for (const [w, l] of adj[v]) { const nd = dd + l; if (nd < d[w] && nd < MAXD) { d[w] = nd; h.push(nd, w); } } }
  return d;
});
const nodeJ = new Uint16Array(nn * 4), nodeW = new Float32Array(nn * 4);
for (let i = 0; i < nn; i++) {
  const c = [];
  for (let j = 0; j < JOINTS.length; j++) {
    const d = dist[j][i]; if (!isFinite(d)) continue;
    const A = JOINTS[j], B = JOINTS[nodeLabel[i]];
    const W = (A === 'hips' && B.startsWith('thigh')) || (B === 'hips' && A.startsWith('thigh')) ? BLEND.hip : torsoLike(A) && torsoLike(B) ? BLEND.torso : BLEND.limb;
    const w = j === nodeLabel[i] ? 1 : Math.max(0, 1 - d / W);
    if (w > 0.02) c.push([j, w]);
  }
  c.sort((a, b) => b[1] - a[1]); const top = c.slice(0, 4), sum = top.reduce((s, x) => s + x[1], 0);
  top.forEach(([j, w], k) => { nodeJ[i * 4 + k] = j; nodeW[i * 4 + k] = w / sum; });
}

// ---------------------------------------------------------------- 4. factory paint (optional clean look) from hard labels
function factoryPaint(name, v) {
  let colour = 0;
  const x = Math.abs(v.x), y = v.y, z = v.z;
  if (name === 'head') colour = y > .175 ? 1 : (z > .065 && y < .115 && x < .09) ? 2 : 0;
  else if (name === 'neck' || name === 'spine' || name.startsWith('upperArm')) colour = 2;
  else if (name === 'chest') colour = z > .055 && x < .185 ? 1 : z < -.03 ? 0 : 2;
  else if (name === 'hips') colour = x < .065 && z > .035 ? 0 : 2;
  else if (name.startsWith('shoulder')) colour = y < -.075 ? 1 : 0;
  else if (name.startsWith('foreArm')) colour = x > .065 ? 1 : z < -.05 ? 2 : 0;
  else if (name.startsWith('thigh')) colour = z < -.045 ? 2 : x > .08 ? 1 : 0;
  else if (name.startsWith('shin')) colour = y > -.075 ? 2 : z < -.05 ? 2 : x > .07 ? 1 : 0;
  else if (name.startsWith('foot')) colour = z > .03 && y > -.025 ? 0 : 3;
  if (name === 'head' && z > .09 && y > .115 && y < .132 && x < .08) return signal;
  return palette[colour];
}
const colours = new Float32Array(n * 3), tmp = new THREE.Vector3();
for (let i = 0; i < n; i++) {
  const name = JOINTS[nodeLabel[nodeOf[i]]], f = frames[name];
  tmp.set(SP[i * 3], SP[i * 3 + 1], SP[i * 3 + 2]).sub(f.origin).applyQuaternion(f.q).multiply(f.scale);
  colours.set(factoryPaint(name, tmp).toArray(), i * 3);
}

// ---------------------------------------------------------------- 5. write the skinned glb
for (const node of [...root.listNodes()]) node.dispose();
for (const mesh of [...root.listMeshes()]) mesh.dispose();
const buffer = root.listBuffers()[0], scene = root.listScenes()[0];
const acc = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
const jointsArr = new Uint16Array(n * 4), weightsArr = new Float32Array(n * 4);
for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { jointsArr[i * 4 + k] = nodeJ[nodeOf[i] * 4 + k]; weightsArr[i * 4 + k] = nodeW[nodeOf[i] * 4 + k]; }
const primitive = doc.createPrimitive().setMaterial(material)
  .setAttribute('POSITION', acc('VEC3', new Float32Array(SP)))
  .setAttribute('NORMAL', acc('VEC3', new Float32Array(SN)))
  .setAttribute('TEXCOORD_0', acc('VEC2', new Float32Array(SU)))
  .setAttribute('COLOR_0', acc('VEC3', colours))
  .setAttribute('JOINTS_0', acc('VEC4', jointsArr))
  .setAttribute('WEIGHTS_0', acc('VEC4', weightsArr))
  .setIndices(acc('SCALAR', new Uint32Array(outIdx)));
const jointNodes = JOINTS.map(name => doc.createNode(name).setExtras({ joint: name }));
const inverse = new Float32Array(JOINTS.length * 16), M = new THREE.Matrix4(), M2 = new THREE.Matrix4();
JOINTS.forEach((name, i) => {
  const f = frames[name];
  M.makeScale(f.scale.x, f.scale.y, f.scale.z).multiply(M2.makeRotationFromQuaternion(f.q)).multiply(new THREE.Matrix4().makeTranslation(-f.origin.x, -f.origin.y, -f.origin.z));
  M.toArray(inverse, i * 16);
});
const skin = doc.createSkin('vanguard').setInverseBindMatrices(acc('MAT4', inverse));
jointNodes.forEach(node => { scene.addChild(node); skin.addJoint(node); });
const meshNode = doc.createNode('vanguard-armour').setMesh(doc.createMesh('vanguard-armour').addPrimitive(primitive)).setSkin(skin);
scene.addChild(meshNode);

await doc.transform(prune());
const bytes = await io.writeBinary(doc);
await mkdir('../../assets/vanguard', { recursive: true });
await writeFile(output, bytes);
const perJoint = JOINTS.map((name, j) => ({ joint: name, dominantVertices: nodeLabel.filter(l => l === j).length }));
const blended = [...Array(nn).keys()].filter(i => nodeW[i * 4 + 1] > 0).length;
const report = {
  schemaVersion: 2, source: input, sourceSha256: createHash('sha256').update(await readFile(input)).digest('hex'), output,
  representation: 'smooth-skinned single mesh bound to combat rig joints',
  sourceTriangles: idx.length / 3, omittedReplacedTriangles: omitted, removedCrumbTriangles: removedCrumbs,
  replacementRegions: ['hands', 'neck', 'footL', 'footR'], outputTriangles: outIdx.length / 3, outputVertices: n, removedBridgeTriangles: bridgeTriangles,
  blendedNodes: blended, totalNodes: nn, cuts: CUT, blend: BLEND, joints: perJoint,
  bytes: bytes.byteLength, sha256: createHash('sha256').update(bytes).digest('hex'), landmarks,
  method: 'One armour mesh, geodesic joint-blend skin weights, inverse-bind = source A-pose to joint rest frame. Authored gloves, neck gasket and boots stay rigid. No runtime classification.',
};
await writeFile('../../assets/vanguard/build-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, joints: undefined, landmarks: undefined }, null, 2));
