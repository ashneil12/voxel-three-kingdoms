import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const $=s=>document.querySelector(s), canvas=$('#preview');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#ded7cd');
const pmrem=new THREE.PMREMGenerator(renderer), room=new RoomEnvironment();
const env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.75;room.dispose();pmrem.dispose();
const key=new THREE.DirectionalLight('#fff0df',2.1);key.position.set(-3,5,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-2;key.shadow.camera.right=2;key.shadow.camera.top=3;key.shadow.camera.bottom=-2;key.shadow.normalBias=.018;scene.add(key);
const fill=new THREE.HemisphereLight('#e7edf3','#999389',1.25);scene.add(fill);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#ded7cd',roughness:1}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;floor.position.y=-.008;scene.add(floor);
const camera=new THREE.PerspectiveCamera(34,1,.01,100);const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.enablePan=true;controls.autoRotateSpeed=1;controls.minDistance=1.2;controls.maxDistance=9;
const loader=new GLTFLoader();let subject=null,token=0,materials=[];const clay=new THREE.MeshStandardMaterial({color:'#7c8587',roughness:.8,metalness:0,side:THREE.DoubleSide});
const models={pilot:{url:'vanguard-a-pose-hq.glb',reference:'vanguard-a-pose.png'},baseline:{url:'baseline-posed.glb',reference:'baseline-input.png'}};
const viewAngles={front:0,right:Math.PI/2,back:Math.PI,left:-Math.PI/2,threequarter:.45};let currentView='threequarter';
function view(name){currentView=name;const yaw=viewAngles[name]??0;controls.autoRotate=false;$('#spin').setAttribute('aria-pressed','false');controls.target.set(0,.98,0);const distance=camera.aspect<.8?5.6:($('#model').value==='pilot'?3.65:4.35);camera.position.set(Math.sin(yaw)*distance,1.30,Math.cos(yaw)*distance);controls.update();}
function dispose(o){const textures=new Set(),mats=new Set();o.traverse(m=>{if(!m.isMesh)return;m.geometry.dispose();for(const material of Array.isArray(m.material)?m.material:[m.material])if(material!==clay)mats.add(material);if(m.userData.originalMaterial)mats.add(m.userData.originalMaterial);});for(const m of mats){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose();}textures.forEach(t=>t.dispose());}
function surface(){if(!subject)return;subject.traverse(o=>{if(!o.isMesh)return;o.material=$('#surface').value==='clay'?clay:o.userData.originalMaterial;o.userData.originalMaterial.wireframe=$('#surface').value==='wire';});}
async function load(name){const id=++token;$('#status').textContent='Loading local model…';const entry=models[name];$('#reference').src=entry.reference;$('#download').href=entry.url;
try{const gltf=await loader.loadAsync(entry.url);if(id!==token){dispose(gltf.scene);return;}if(subject){scene.remove(subject);dispose(subject);}subject=gltf.scene;
const raw=new THREE.Box3().setFromObject(subject),size=raw.getSize(new THREE.Vector3()),center=raw.getCenter(new THREE.Vector3());
const scale=1.9/size.y;subject.scale.multiplyScalar(scale);subject.position.set(-center.x*scale,-raw.min.y*scale,-center.z*scale);
let tris=0,meshes=0,bones=0;materials=[];subject.traverse(o=>{if(o.isBone)bones++;if(o.isMesh){meshes++;tris+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;o.castShadow=true;o.receiveShadow=true;o.userData.originalMaterial=o.material;materials.push(o.material);}});scene.add(subject);surface();view('threequarter');
$('#stats').textContent=`${Math.round(tris).toLocaleString()} triangles · ${meshes} mesh · ${bones} bones\n${gltf.animations.length} animation clips · displayed at 1.9 m height`;
$('#status').textContent='Loaded. Inspect textured and clay views; a rendered mesh alone does not establish animation readiness.';
document.body.dataset.ready=name;
}catch(error){$('#status').textContent=`Model unavailable: ${error.message}. The high-quality generation may still be running.`;$('#stats').textContent='No model loaded';console.error(error);}}
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>view(b.dataset.view));
$('#model').addEventListener('change',()=>load($('#model').value));$('#surface').addEventListener('change',surface);
$('#spin').addEventListener('click',()=>{controls.autoRotate=!controls.autoRotate;$('#spin').setAttribute('aria-pressed',String(controls.autoRotate));});
$('#capture').addEventListener('click',()=>{renderer.render(scene,camera);const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download=`vanguard-${$('#model').value}-${currentView}-${$('#surface').value}.png`;a.click();$('#status').textContent='Saved current Three.js render.';});
function resize(){renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);camera.aspect=canvas.clientWidth/canvas.clientHeight;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(canvas);resize();
const requested=new URLSearchParams(location.search).get('model');$('#model').value=requested in models?requested:'pilot';load($('#model').value);
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
