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
const doc=await new NodeIO().read(fileURLToPath(path));
const node=doc.getRoot().listNodes().find(n=>n.getMesh()),primitive=node.getMesh().listPrimitives()[0],skin=node.getSkin();
assert.ok(skin,'armour must be skinned');
const positions=primitive.getAttribute('POSITION').getArray(),indices=primitive.getIndices().getArray();
const skinIndex=primitive.getAttribute('JOINTS_0').getArray(),skinWeight=primitive.getAttribute('WEIGHTS_0').getArray();
assert.ok(positions.every(Number.isFinite));assert.ok(indices.every(i=>i<positions.length/3));
const triangles=indices.length/3,jointNames=skin.listJoints().map(j=>j.getName());
assert.ok(triangles<160000,`Close-up armour exceeds 160k budget: ${triangles}`);
for(let i=0;i<positions.length/3;i++){let sum=0;for(let k=0;k<4;k++){sum+=skinWeight[i*4+k];assert.ok(skinIndex[i*4+k]<jointNames.length);}
  assert.ok(Math.abs(sum-1)<1e-3,`vertex ${i} weights sum to ${sum}`);}
// Rebuild the loader's result (SkinnedMesh + bones + inverse binds) without needing a browser texture decoder.
const geometry=new THREE.BufferGeometry();
geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setIndex(new THREE.BufferAttribute(indices,1));
geometry.setAttribute('skinIndex',new THREE.BufferAttribute(new Uint16Array(skinIndex),4));geometry.setAttribute('skinWeight',new THREE.BufferAttribute(skinWeight,4));
const bones=jointNames.map(name=>{const b=new THREE.Bone();b.name=name;return b;});
const inverses=Array.from({length:jointNames.length},(_,i)=>new THREE.Matrix4().fromArray(skin.getInverseBindMatrices().getArray(),i*16));
const scene=new THREE.Group(),source=new THREE.SkinnedMesh(geometry,new THREE.MeshBasicMaterial());
source.add(...bones);source.bind(new THREE.Skeleton(bones,inverses));scene.add(source);
const rig=createRig(),built=buildGeneratedSuit(rig,{scene});
assert.equal(built.triangles,triangles);
const pose=new Float32Array(POSE_SIZE),zero=new THREE.Vector3(),clips={...LOCO_CLIPS,...ATTACK_CLIPS};
const mesh=built.skinned,vertex=new THREE.Vector3(),count=positions.length/3;
const world=new Float32Array(positions.length);
const skinWorld=()=>{for(let i=0;i<count;i++){vertex.fromArray(positions,i*3);mesh.applyBoneTransform(i,vertex).applyMatrix4(mesh.matrixWorld);vertex.toArray(world,i*3);}};
const edgeSample=[];for(let i=0;i<indices.length;i+=3*7)edgeSample.push([indices[i],indices[i+1]]);
// rest edge lengths in the rest pose define what "stretched" means
rig.apply(clips.idle?sampleClip(clips.idle,0,pose):pose,zero,0);rig.root.updateMatrixWorld(true);skinWorld();
const restEdge=edgeSample.map(([a,b])=>Math.hypot(world[a*3]-world[b*3],world[a*3+1]-world[b*3+1],world[a*3+2]-world[b*3+2]));
let poses=0,worst=0;const worstBy={};
for(const id of [...Object.keys(clips),'run','dodge'])for(let step=0;step<=100;step++) {
  const t=step/100;
  if(id==='run')runPose(t*Math.PI*2,1,pose);else if(id==='dodge')rollPose(t,pose);else sampleClip(clips[id],t,pose);
  rig.root.scale.setScalar(1);rig.apply(pose,zero,0);rig.root.scale.setScalar(HERO_SCALE);applyRoll(rig,{id,t});rig.root.updateMatrixWorld(true);
  if(step%4===0){
    skinWorld();
    for(let i=0;i<world.length;i++)assert.ok(Number.isFinite(world[i]),`${id} ${t}: nonfinite skinned vertex`);
    for(let e=0;e<edgeSample.length;e++){
      const [a,b]=edgeSample[e],len=Math.hypot(world[a*3]-world[b*3],world[a*3+1]-world[b*3+1],world[a*3+2]-world[b*3+2]);
      const ratio=len/Math.max(.004,restEdge[e]*HERO_SCALE);worst=Math.max(worst,ratio);
      const limit=id==='dodge'?12:6;
      worstBy[id]=Math.max(worstBy[id]||0,ratio);
      if(!(len<.5||ratio<limit)){const top=v=>[0,1,2,3].map(k=>jointNames[skinIndex[v*4+k]]+':'+skinWeight[v*4+k].toFixed(2)).join(' ');
        assert.fail(`${id} ${t}: stretched triangle edge ${len.toFixed(2)}m (${ratio.toFixed(1)}x rest, rest ${restEdge[e].toFixed(3)}m) between [${top(a)}] and [${top(b)}] at rest ${Array.from(positions.slice(a*3,a*3+3)).map(v=>v.toFixed(2))}`);}
    }
  }
  for(const m of Object.values(built.meshes)){assert.ok(m.matrixWorld.elements.every(Number.isFinite),`${id} ${t}: nonfinite transform`);}
  poses++;
}
// Loading after an arbitrary pose must produce the same geometry as loading at rest.
const later=buildGeneratedSuit(createRig(),{scene});assert.equal(built.skinned.geometry,later.skinned.geometry);
// Afterimages: bake a posed snapshot, then remove every added render object without disposing shared geometry.
const ghostScene=new THREE.Scene(),ghosts=createDodgeGhosts(ghostScene,{meshes:built.meshes});
assert.ok(ghostScene.children.length>0);
rollPose(.3,pose);rig.apply(pose,zero,0);rig.root.updateMatrixWorld(true);
ghosts.update({state:'dodge',stateT:5,dodgeSeq:1,x:0,y:0,z:0,move:null,vy:0},rig,1/60);
const baked=ghostScene.children.find(c=>c.isMesh&&!c.isSkinnedMesh&&c.visible&&c.geometry.attributes.position.count===count);
assert.ok(baked&&Array.from(baked.geometry.attributes.position.array.slice(0,300)).some(v=>v!==0),'afterimage snapshot was not baked from the skinned pose');
ghosts.dispose();assert.equal(ghostScene.children.length,0);
const report=JSON.parse(await readFile(new URL('../../assets/vanguard/build-report.json',import.meta.url)));
assert.equal(report.outputTriangles,triangles);
const bytes=await readFile(path);
assert.equal(report.sha256,createHash('sha256').update(bytes).digest('hex'));
assert.equal(report.bytes,bytes.byteLength);
const badGeometry=geometry.clone(),badBone=new THREE.Bone();badBone.name='unknownJoint';const badMesh=new THREE.SkinnedMesh(badGeometry,new THREE.MeshBasicMaterial());badMesh.add(badBone);badMesh.bind(new THREE.Skeleton([badBone],[new THREE.Matrix4()]));const badScene=new THREE.Group();badScene.add(badMesh);
const cleanRig=createRig(),before=cleanRig.root.children.length;
assert.throws(()=>buildGeneratedSuit(cleanRig,{scene:badScene}),/unknown joint/);
assert.equal(cleanRig.root.children.length,before);
console.log(Object.entries(worstBy).map(([k,v])=>k+':'+v.toFixed(1)).join(' '));console.log(`PASS: ${triangles} skinned armour triangles; ${poses} sampled poses (max edge stretch ${worst.toFixed(1)}x); ${jointNames.length} joints; afterimage bake and cleanup. Visual quality still requires studio inspection.`);
