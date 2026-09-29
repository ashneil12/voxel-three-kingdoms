// Prepared rigid armour shares the game's combat rig. Source-pose conversion and simplification
// happen in tools/assets/prepare-vanguard.mjs, never while loading a browser scene.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export const GENERATED_SUIT_URL = './assets/vanguard/vanguard-combat.glb';
let cached;
export function loadGeneratedSuit() {
  cached ||= fetch('./assets/vanguard/build-report.json', {cache:'no-cache'}).then(async response => {
    if(!response.ok)throw new Error(`Asset manifest unavailable (${response.status})`);
    const report=await response.json();
    if(!/^[a-f0-9]{64}$/.test(report.sha256))throw new Error('Invalid asset revision');
    return new GLTFLoader().loadAsync(`${GENERATED_SUIT_URL}?v=${report.sha256.slice(0,16)}`);
  }).catch(error => { cached=null; throw error; });
  return cached;
}
export function buildGeneratedSuit(rig, gltf) {
  let source=null;
  gltf.scene.traverse(o=>{if(o.isSkinnedMesh)source=o;});
  if(!source)throw new Error('Prepared armour has no skinned mesh');
  // The GLB's joint nodes are only names + inverse-bind matrices: the rig's own joints drive the mesh.
  const bones=source.skeleton.bones.map(b=>{
    const joint=b.userData.joint || b.name;
    if(!rig.joints[joint]) throw new Error(`Prepared armour names an unknown joint: ${joint}`);
    return rig.joints[joint];
  });
  const skeleton=new THREE.Skeleton(bones,source.skeleton.boneInverses.map(m=>m.clone()));
  const material=source.material;material.vertexColors=false;material.needsUpdate=true;
  const cleanMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.3,side:THREE.DoubleSide});
  const mesh=new THREE.SkinnedMesh(source.geometry,material);
  mesh.name='generated:armour';
  // identity bind matrix: skinned world position = jointWorld · inverseBind · vertex, wherever the mesh is parented
  mesh.bind(skeleton,new THREE.Matrix4());
  mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.userData.cleanMaterial=cleanMaterial;
  rig.root.add(mesh);
  const meshes={'generated:armour':mesh},roots=[mesh],seamMaterial=new THREE.MeshStandardMaterial({color:0x17212a,roughness:.7,metalness:.25});
  const triangles=source.geometry.index.count/3;
  // dark limb cores hide the interior where generated hands/feet were removed
  for(const side of ['L','R']) for(const [joint,length,radius] of [['upperArm',.29,.056],['foreArm',.27,.06],['thigh',.44,.075],['shin',.44,.066]]) {
    const geometry=new THREE.CylinderGeometry(radius,radius,length,12);
    geometry.translate(0,-length/2,0);
    const core=new THREE.Mesh(geometry,seamMaterial);core.name='joint-cover-'+joint+side;
    rig.joints[joint+side].add(core);roots.push(core);meshes[core.name]=core;
  }
  return {meshes,roots,seamMaterial,cleanMaterial,triangles,skinned:mesh};
}
export function attachGeneratedSuit(rig, model) {
  model.assetState='loading';model.fallbackMeshes={...model.meshes};
  model.ready=loadGeneratedSuit().then(gltf=>{
    if(model.cancelled)return null;
    const built=buildGeneratedSuit(rig,gltf),retained={};
    for(const [name,mesh] of Object.entries(model.fallbackMeshes)) {
      const keep=['weapon','handL','handR','footL','footR'].some(j=>mesh.parent===rig.joints[j]) ||
        mesh.parent===rig.joints.neck && (mesh.userData.studioMaterial || mesh.material)===model.materials.dark;
      mesh.visible=keep;if(keep)retained[name]=mesh;
    }
    model.meshes={...retained,...built.meshes};model.generated=built;
    model.generatedStats={triangles:built.triangles,parts:built.roots.length};
    model.assetState='ready';model.revision=(model.revision||0)+1;return built;
  }).catch(error=>{model.assetState='failed';model.assetError=error;console.error('Vanguard asset load failed',error);return null;});
  return model;
}
export function disposeGeneratedSuit(model) {
  model.cancelled=true;
  if(model.generated){for(const part of model.generated.roots){part.removeFromParent();if(part.name.startsWith('joint-cover'))part.geometry.dispose();}
    model.generated.seamMaterial.dispose();model.generated.cleanMaterial.dispose();model.generated=null;}
  if(model.fallbackMeshes)model.meshes=model.fallbackMeshes;
}
