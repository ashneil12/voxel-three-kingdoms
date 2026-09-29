// Inject Idle / Walk / Attack_Spear (numeric source: reports/clips.json) into the static articulated GLB.
// Blender space (Z up, forward -Y) -> glTF space (Y up, forward +Z): (x,y,z)_b -> (x, z, -y)_g for vectors and quaternions.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS), doc = await io.read(`${root}/assets/output/robot_static.glb`);
const clips = JSON.parse(readFileSync(`${root}/reports/clips.json`, 'utf8'));
const nodes = new Map(doc.getRoot().listNodes().map(n => [n.getName(), n]));
const buf = doc.getRoot().listBuffers()[0];
// Blender XYZ euler (radians) -> quaternion [x,y,z,w] in Blender axes, then remap to glTF
function quat([ex, ey, ez]) {
  const q = (a, ax) => { const s = Math.sin(a / 2); return ax === 0 ? [s, 0, 0, Math.cos(a / 2)] : ax === 1 ? [0, s, 0, Math.cos(a / 2)] : [0, 0, s, Math.cos(a / 2)]; };
  const mul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
  const r = mul(mul(q(ez, 2), q(ey, 1)), q(ex, 0));              // R = Rz * Ry * Rx (Blender XYZ euler)
  return [r[0], r[2], -r[1], r[3]];
}
for (const [name, c] of Object.entries(clips)) {
  const anim = doc.createAnimation(name);
  const times = new Float32Array(c.frames).map((_, i) => i / c.fps);
  const tIn = doc.createAccessor(name + '_t').setType('SCALAR').setArray(times).setBuffer(buf);
  for (const [jn, rots] of Object.entries(c.joints)) {
    const node = nodes.get(jn); if (!node) throw new Error('missing node ' + jn);
    const out = new Float32Array(c.frames * 4);
    let prev = null;
    rots.forEach((r, i) => {                                     // keep quaternions on one hemisphere so slerp takes the short way
      let q = quat(r); if (prev && q[0] * prev[0] + q[1] * prev[1] + q[2] * prev[2] + q[3] * prev[3] < 0) q = q.map(v => -v);
      out.set(q, i * 4); prev = q;
    });
    const s = doc.createAnimationSampler().setInput(tIn).setOutput(doc.createAccessor().setType('VEC4').setArray(out).setBuffer(buf)).setInterpolation('LINEAR');
    anim.addSampler(s); anim.addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath('rotation').setSampler(s));
  }
  const pel = nodes.get('pelvis_joint'), tr = new Float32Array(c.frames * 3);
  c.pelvis.forEach((p, i) => tr.set([p[0], p[2], -p[1]], i * 3));
  const s = doc.createAnimationSampler().setInput(tIn).setOutput(doc.createAccessor().setType('VEC3').setArray(tr).setBuffer(buf)).setInterpolation('LINEAR');
  anim.addSampler(s); anim.addChannel(doc.createAnimationChannel().setTargetNode(pel).setTargetPath('translation').setSampler(s));
  console.log('clip', name, c.frames, 'frames', (c.frames / c.fps).toFixed(2) + 's');
}
await io.write(`${root}/assets/output/robot_rigged.glb`, doc);
console.log('WROTE robot_rigged.glb', doc.getRoot().listAnimations().map(a => a.getName()).join(','));
