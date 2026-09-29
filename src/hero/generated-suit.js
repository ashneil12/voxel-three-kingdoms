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
  for(const source of gltf.scene.children) {
    const joint=source.userData.joint || source.name;
    if(!rig.joints[joint]) throw new Error(`Prepared armour names an unknown joint: ${joint}`);
  }
  const meshes={}, roots=[], seamMaterial=new THREE.MeshStandardMaterial({color:0x17212a,roughness:.7,metalness:.25});
  const cleanMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.3,side:THREE.DoubleSide});
  let triangles=0;
  for(const source of gltf.scene.children) {
    const joint=source.userData.joint || source.name;
    const part=source.clone(true);
    part.traverse(mesh=>{if(!mesh.isMesh)return;mesh.castShadow=true;mesh.receiveShadow=true;
      mesh.material.vertexColors=false;mesh.material.needsUpdate=true;
      mesh.userData.cleanMaterial=cleanMaterial;
      meshes[`generated:${joint}:${Object.keys(meshes).length}`]=mesh;
      triangles+=(mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count)/3;});
    rig.joints[joint].add(part);roots.push(part);
  }
  for(const side of ['L','R']) for(const [joint,length,radius] of [['upperArm',.29,.045],['foreArm',.27,.046],['thigh',.44,.057],['shin',.44,.05]]) {
    const geometry=new THREE.CylinderGeometry(radius,radius,length,12);
    geometry.translate(0,-length/2,0);
    const core=new THREE.Mesh(geometry,seamMaterial);core.name='joint-cover-'+joint+side;
    rig.joints[joint+side].add(core);roots.push(core);meshes[core.name]=core;
  }
  return {meshes,roots,seamMaterial,cleanMaterial,triangles};
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
