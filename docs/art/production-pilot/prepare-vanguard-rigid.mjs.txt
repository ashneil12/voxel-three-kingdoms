import { NodeIO } from '@gltf-transform/core';
import { weld, compactPrimitive, prune } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import * as THREE from '../../vendor/three/three.module.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('.',import.meta.url)));

const input = '../../docs/art/production-pilot/vanguard-a-pose-hq.glb';
const output = '../../assets/vanguard/vanguard-combat.glb';
const io = new NodeIO(), doc = await io.read(input), root = doc.getRoot();
const prim = root.listMeshes()[0].listPrimitives()[0], material = prim.getMaterial();
const pos = prim.getAttribute('POSITION').getArray(), nor = prim.getAttribute('NORMAL').getArray();
const uv = prim.getAttribute('TEXCOORD_0').getArray(), idx = prim.getIndices().getArray();
const min = prim.getAttribute('POSITION').getMin([]), max = prim.getAttribute('POSITION').getMax([]);
const scale = 1.72 / (max[1] - min[1]), cx = (max[0] + min[0]) / 2, cz = (max[2] + min[2]) / 2;
const p = new Float32Array(pos.length);
for (let i=0;i<pos.length;i+=3) { p[i]=(pos[i]-cx)*scale;p[i+1]=(pos[i+1]-min[1])*scale;p[i+2]=(pos[i+2]-cz)*scale; }
// Optional authored factory-paint regions. Original textures remain available for comparison.
const palette=['#d7d0bd','#405f72','#263038','#76818a'].map(c=>new THREE.Color(c));

// Measured against the source in its normalised A-pose. These are asset-specific landmarks,
// never a universal humanoid template. +X is the character's left, +Z is forward.
const landmarks = {
  shoulder: [.225,1.355,0], elbow:[.32,1.15,0], wrist:[.44,.92,.015],
  hip:[.13,.97,0], knee:[.205,.60,.01], ankle:[.275,.17,0],
};
function region(x,y,z) {
  const a=Math.abs(x), s=x>=0?'L':'R';
  if(a>.31 && y<.91 && y>.55) return null; // includes fingertips below the wrist band
  if(y>1.475 && a<.23) return 'head';
  if(y>1.44 && a<.085) return 'neck';
  // A diagonal boundary separates the torso from the sloping arms.
  const armEdge = y>1.28 ? .21 : y>1.17 ? .26 : .28;
  if(a>armEdge && y>.72) {
    if(y>1.28) return 'shoulder'+s;
    if(y>1.17) return 'upperArm'+s;
    if(y>.91) return 'foreArm'+s;
    return null; // authored gripping gloves replace the open source hands
  }
  if(y>1.165) return 'chest';
  if(y>1.095) return 'spine';
  if(y>.875 && (a<.14 || y>1.03)) return 'hips';
  if(y>.67) return 'thigh'+s;
  if(y>.21) return 'shin'+s;
  return 'foot'+s;
}
const transforms={};
const V=a=>new THREE.Vector3(...a);
function frame(name,origin,end,length,xz=1) {
  const q=end?new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,-1,0),V(end).sub(V(origin)).normalize()):new THREE.Quaternion();
  const sy=end?length/V(end).distanceTo(V(origin)):1;
  transforms[name]={origin:V(origin),q:q.invert(),scale:new THREE.Vector3(xz,sy,xz)};
}
frame('hips',[0,.98,0]);frame('spine',[0,1.01,0]);frame('chest',[0,1.19,0]);frame('neck',[0,1.43,0]);frame('head',[0,1.475,0]);
for(const [s,sign] of [['L',1],['R',-1]]) {
  const mirror=a=>[a[0]*sign,a[1],a[2]];
  const sh=mirror(landmarks.shoulder),el=mirror(landmarks.elbow),wr=mirror(landmarks.wrist);
  const hip=mirror(landmarks.hip),knee=mirror(landmarks.knee),ankle=mirror(landmarks.ankle);
  frame('shoulder'+s,sh);
  frame('upperArm'+s,sh,el,.29);
  frame('foreArm'+s,el,wr,.27);
  frame('thigh'+s,hip,knee,.44);
  frame('shin'+s,knee,ankle,.44);
  frame('foot'+s,ankle);transforms['foot'+s].scale.set(1,.8,1);
}
const regions=new Map();
let omitted=0;
const v=new THREE.Vector3(),n=new THREE.Vector3();
const signal=new THREE.Color('#ffad3e');
function factoryPaint(name,v,n) {
  let colour=0;
  const x=Math.abs(v.x), y=v.y, z=v.z;
  if(name==='head')colour=y>.175?1:(z>.065&&y<.115&&x<.09)?2:0;
  else if(name==='neck'||name==='spine'||name.startsWith('upperArm'))colour=2;
  else if(name==='chest')colour=z>.055&&x<.185?1:z<-.03?0:2;
  else if(name==='hips')colour=x<.065&&z>.035?0:2;
  else if(name.startsWith('shoulder'))colour=y<-.075?1:0;
  else if(name.startsWith('foreArm'))colour=x>.065?1:z<-.05?2:0;
  else if(name.startsWith('thigh'))colour=z<-.045?2:x>.08?1:0;
  else if(name.startsWith('shin'))colour=y>-.075?2:z<-.05?2:x>.07?1:0;
  else if(name.startsWith('foot'))colour=z>.03&&y>-.025?0:3;
  if(name==='head'&&z>.09&&y>.115&&y<.132&&x<.08)return signal;
  return palette[colour];
}
for(let i=0;i<idx.length;i+=3) {
  const a=idx[i]*3,b=idx[i+1]*3,c=idx[i+2]*3;
  const name=region((p[a]+p[b]+p[c])/3,(p[a+1]+p[b+1]+p[c+1])/3,(p[a+2]+p[b+2]+p[c+2])/3);
  if(!name || ['neck','footL','footR'].includes(name)){omitted++;continue;}
  let g=regions.get(name);if(!g){g={positions:[],normals:[],uvs:[],colours:[],indices:[],map:new Map()};regions.set(name,g);}
  const f=transforms[name];
  for(let k=0;k<3;k++) {
    const vi=idx[i+k];let out=g.map.get(vi);
    if(out===undefined){out=g.positions.length/3;g.map.set(vi,out);
      v.fromArray(p,vi*3).sub(f.origin).applyQuaternion(f.q).multiply(f.scale);g.positions.push(v.x,v.y,v.z);
      n.fromArray(nor,vi*3).applyQuaternion(f.q).divide(f.scale).normalize();g.normals.push(n.x,n.y,n.z);
      g.uvs.push(uv[vi*2],uv[vi*2+1]);const paint=factoryPaint(name,v,n);g.colours.push(paint.r,paint.g,paint.b);}
    g.indices.push(out);
  }
}
// UV seams duplicate vertices, so find physical connectivity by position before rejecting
// detached reconstruction crumbs. Splitting by GLB indices alone mistakes UV charts for parts.
let removedCrumbs=0;
for(const [regionName,g] of regions) {
  const parent=new Int32Array(g.positions.length/3),same=new Map();
  const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
  for(let i=0;i<parent.length;i++) {
    parent[i]=i;const key=[0,1,2].map(k=>Math.round(g.positions[i*3+k]*100000)).join(',');
    if(same.has(key))parent[i]=find(same.get(key));else same.set(key,i);
  }
  for(let i=0;i<g.indices.length;i+=3){const a=find(g.indices[i]);for(let k=1;k<3;k++)parent[find(g.indices[i+k])]=a;}
  const counts=new Map();for(let i=0;i<g.indices.length;i+=3){const r=find(g.indices[i]);counts.set(r,(counts.get(r)||0)+1);}
  if(process.env.ASSET_COMPONENT_AUDIT)console.log(regionName,[...counts.values()].sort((a,b)=>b-a).slice(0,12));
  const kept=[];for(let i=0;i<g.indices.length;i+=3){if(counts.get(find(g.indices[i]))<250){removedCrumbs++;continue;}kept.push(g.indices[i],g.indices[i+1],g.indices[i+2]);}
  g.indices=kept;
}
for(const node of [...root.listNodes()])node.dispose();
for(const mesh of [...root.listMeshes()])mesh.dispose();
const buffer=root.listBuffers()[0],scene=root.listScenes()[0];
for(const [name,g] of regions){
  const acc=(type,array)=>doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
  const primitive=doc.createPrimitive().setMaterial(material)
    .setAttribute('POSITION',acc('VEC3',new Float32Array(g.positions)))
    .setAttribute('NORMAL',acc('VEC3',new Float32Array(g.normals)))
    .setAttribute('TEXCOORD_0',acc('VEC2',new Float32Array(g.uvs)))
    .setAttribute('COLOR_0',acc('VEC3',new Float32Array(g.colours)))
    .setIndices(acc('SCALAR',new Uint32Array(g.indices)));
  scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(primitive)).setExtras({joint:name}));
}
await MeshoptSimplifier.ready;
await doc.transform(weld());
for(const mesh of root.listMeshes()) for(const part of mesh.listPrimitives()) {
  const positions=part.getAttribute('POSITION').getArray(), normals=part.getAttribute('NORMAL').getArray(), uvs=part.getAttribute('TEXCOORD_0').getArray();
  const attributes=new Float32Array(positions.length/3*5);
  for(let i=0;i<positions.length/3;i++)attributes.set([...normals.subarray(i*3,i*3+3),...uvs.subarray(i*2,i*2+2)],i*5);
  const indices=part.getIndices().getArray();
  const [reduced]=MeshoptSimplifier.simplifyWithAttributes(indices,positions,3,attributes,5,[.1,.1,.1,.5,.5],null,Math.floor(indices.length*.17/3)*3,.012,['RegularizeLight']);
  part.getIndices().setArray(reduced);compactPrimitive(part);
}
await doc.transform(prune());
// Preserve original encoded atlases: re-encoding increased bytes with no pixel benefit,
// and downsampling tightly packed charts without rebaking gutters harms paint fidelity.
await mkdir('../../assets/vanguard',{recursive:true});
const bytes=await io.writeBinary(doc);
await writeFile(output,bytes);
const report={schemaVersion:1,source:input,sourceSha256:createHash('sha256').update(await readFile(input)).digest('hex'),output,sourceTriangles:idx.length/3,omittedReplacedTriangles:omitted,removedCrumbTriangles:removedCrumbs,
  replacementRegions:['hands','neck','footL','footR'],
  outputTriangles:root.listMeshes().reduce((a,m)=>a+m.listPrimitives().reduce((s,p)=>s+p.getIndices().getCount()/3,0),0),
  parts:root.listNodes().map(n=>({joint:n.getName(),triangles:n.getMesh()?.listPrimitives()[0].getIndices().getCount()/3})),
  bytes:bytes.byteLength,sha256:createHash('sha256').update(bytes).digest('hex'),landmarks,
  method:'Rigid armour in combat-joint local coordinates. Authored grip gloves, neck gasket, upper arms and boots replace unreliable source regions. Optional factory-paint vertex colours. No runtime skin classification.'};
await writeFile('../../assets/vanguard/build-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
