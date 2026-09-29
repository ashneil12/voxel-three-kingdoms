import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { NodeIO } from '@gltf-transform/core';
registerHooks({resolve(specifier,context,next){
  if(specifier==='three')return next(new URL('../../vendor/three/three.module.js',import.meta.url).href,context);
  if(specifier.startsWith('three/addons/'))return next(new URL('../../vendor/three/addons/'+specifier.slice(13),import.meta.url).href,context);
  return next(specifier,context);
}});
globalThis.location={search:'?hero=vanguard'};
const THREE=await import('three');
const {createRig,POSE_SIZE,sampleClip,HERO_SCALE}=await import('../../src/hero/rig.js');
const {ATTACK_CLIPS}=await import('../../src/hero/anims/attacks.js');
const {LOCO_CLIPS,runPose,rollPose,applyRoll,createDodgeGhosts}=await import('../../src/hero/anims/locomotion.js');
const {buildGeneratedSuit}=await import('../../src/hero/generated-suit.js');
const path=new URL('../../assets/vanguard/vanguard-combat.glb',import.meta.url);
const doc=await new NodeIO().read(fileURLToPath(path)), scene=new THREE.Group();
let triangles=0;
for(const node of doc.getRoot().listNodes()) {
  const primitive=node.getMesh().listPrimitives()[0],g=new THREE.BufferGeometry();
  const positions=primitive.getAttribute('POSITION').getArray(),indices=primitive.getIndices().getArray();
  assert.ok(positions.every(Number.isFinite));assert.ok(indices.every(i=>i<positions.length/3));
  g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setIndex(new THREE.BufferAttribute(indices,1));
  const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial());mesh.name=node.getName();scene.add(mesh);triangles+=indices.length/3;
}
assert.ok(triangles<160000,`Close-up armour exceeds 160k budget: ${triangles}`);
const rig=createRig(),built=buildGeneratedSuit(rig,{scene});
assert.equal(scene.children.length,14);assert.equal(built.triangles,triangles);
const pose=new Float32Array(POSE_SIZE),zero=new THREE.Vector3(),clips={...LOCO_CLIPS,...ATTACK_CLIPS};
let poses=0;
for(const id of [...Object.keys(clips),'run','dodge'])for(let step=0;step<=100;step++) {
  const t=step/100;
  if(id==='run')runPose(t,1,pose);else if(id==='dodge')rollPose(t,pose);else sampleClip(clips[id],t,pose);
  rig.root.scale.setScalar(1);rig.apply(pose,zero,0);rig.root.scale.setScalar(HERO_SCALE);applyRoll(rig,{id,t});rig.root.updateMatrixWorld(true);
  for(const mesh of Object.values(built.meshes)) {
    assert.ok(mesh.matrixWorld.elements.every(Number.isFinite),`${id} ${t}: nonfinite transform`);
    const p=new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld);assert.ok(p.length()<5,`${id} ${t}: detached part`);
    // Rigid parts must preserve angles and use uniform scale, including dodge squash.
    const scale=new THREE.Vector3().setFromMatrixScale(mesh.matrixWorld);
    assert.ok(scale.x>.7&&scale.x<1.5&&scale.y>.7&&scale.y<1.5&&scale.z>.7&&scale.z<1.5);
  }
  poses++;
}
// Loading after an arbitrary pose must produce the same local geometry as loading at rest.
const later=buildGeneratedSuit(createRig(),{scene});
for(const key of Object.keys(built.meshes).filter(k=>k.startsWith('generated:')))
  assert.equal(built.meshes[key].geometry,later.meshes[key].geometry);
// Disposing afterimages must remove every added render object without disposing shared geometry.
const ghostScene=new THREE.Scene(),ghosts=createDodgeGhosts(ghostScene,{meshes:built.meshes});
assert.ok(ghostScene.children.length>0);ghosts.dispose();assert.equal(ghostScene.children.length,0);
const report=JSON.parse(await readFile(new URL('../../assets/vanguard/build-report.json',import.meta.url)));
assert.equal(report.outputTriangles,triangles);
const bytes=await readFile(path);
assert.equal(report.sha256,createHash('sha256').update(bytes).digest('hex'));
assert.equal(report.bytes,bytes.byteLength);
const badScene=new THREE.Group(),unknown=new THREE.Group();unknown.name='unknownJoint';badScene.add(unknown);
const cleanRig=createRig(),before=cleanRig.root.children.length;
assert.throws(()=>buildGeneratedSuit(cleanRig,{scene:badScene}),/unknown joint/);
assert.equal(cleanRig.root.children.length,before);
console.log(`PASS: ${triangles} armour triangles; ${poses} sampled poses; ${scene.children.length} joint mappings; pose-independent attachment; afterimage cleanup. Visual seam quality still requires studio inspection.`);
