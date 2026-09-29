import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { applyRoll } from './hero/anims/locomotion.js';
import { createRig, HERO_SCALE, POSE_SIZE, P } from './hero/rig.js';
import { createProceduralSuit } from './hero/procedural-suit.js';
import { attachGeneratedSuit, disposeGeneratedSuit } from './hero/generated-suit.js?v=prepared-8';
import { SUIT_DEFAULT, suitDesign, loadSuitDesign, saveSuitDesign, SUIT_STORAGE_KEY } from './heroes/suit-design.js';
import { sampleAnim } from './hero/hero.js';
import './musou/musou.js'; // registers the existing overdrive clips

const $ = (q) => document.querySelector(q);
const canvas = $('#preview');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
scene.environment = pmrem.fromScene(room, .04).texture;
scene.environmentIntensity = .7; room.dispose(); pmrem.dispose();
scene.background = new THREE.Color(0xd7d0c5);
scene.fog = new THREE.Fog(0xd7d0c5, 9, 22);
const hemi = new THREE.HemisphereLight(0xf2f1ed, 0x827c72, 2.4); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffebd5, 3.6);
key.position.set(-3, 6, 5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -2.8; key.shadow.camera.right = 2.8; key.shadow.camera.top = 3; key.shadow.camera.bottom = -2;
key.shadow.normalBias=.018; key.shadow.bias=0;
key.shadow.blurSamples = 8; key.shadow.radius = 3;
scene.add(key);
const rim = new THREE.DirectionalLight(0xc7deed, 2.1); rim.position.set(4, 3, -4); scene.add(rim);
const fill = new THREE.DirectionalLight(0xffffff, 1.1); fill.position.set(4,2,5); scene.add(fill);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(100,100),
  new THREE.MeshStandardMaterial({ color: 0xc9c2b7, roughness: .91 }));
floor.rotation.x=-Math.PI/2; floor.position.y = .003; floor.receiveShadow = true; scene.add(floor);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
const orbit = { yaw: -.38, pitch: 0.10, radius: 4.65 };
const target = new THREE.Vector3(-.49, 1.00, 0);
function updateCamera() {
  const h = Math.cos(orbit.pitch) * orbit.radius;
  camera.position.set(target.x+Math.sin(orbit.yaw) * h, target.y + Math.sin(orbit.pitch) * orbit.radius, Math.cos(orbit.yaw) * h);
  camera.lookAt(target);
}
updateCamera();
const views = { angle: [-.38, .10, 4.65], front: [0, .06, 4.45], side: [Math.PI / 2, .08, 4.2],
  back: [Math.PI, .08, 4.2], detail: [-.30,.03,1.85], game: [.28, .55, 6.7],
  art: [-.36, .045, 4.30], artfront: [-.05, .04, 4.05], arthead: [-.45, .06, 1.30] };
// ?capture=<view> sets a deterministic framing for repeatable screenshots; ?target=x,y,z overrides the look-at.
const qs = new URLSearchParams(location.search);
if (qs.get('capture') && views[qs.get('capture')]) {
  [orbit.yaw, orbit.pitch, orbit.radius] = views[qs.get('capture')];
  if (qs.get('capture').startsWith('art')) target.set(qs.get('capture') === 'arthead' ? 0 : -.12, qs.get('capture') === 'arthead' ? 1.52 : .98, 0);
  updateCamera();
  // Clean frame for repeatable screenshots: drop the panels and labels.
  document.querySelector('aside').style.display = 'none';
  document.body.style.gridTemplateColumns = '1fr';
  for (const sel of ['.overlay', '.hint']) document.querySelector(sel).style.display = 'none';
}
$('#camera').addEventListener('change', (e) => {
  [orbit.yaw, orbit.pitch, orbit.radius] = views[e.target.value];
  target.set(e.target.value==='detail'?0:e.target.value==='angle'?-.49:0,e.target.value==='detail'?1.48:1,0); updateCamera();
});
let dragging = false, px = 0, py = 0;
canvas.addEventListener('pointerdown', (e) => { dragging = true; px = e.clientX; py = e.clientY; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('pointercancel', () => { dragging = false; });
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  orbit.yaw += (e.clientX - px) * 0.008; orbit.pitch = Math.max(-0.25, Math.min(1.15, orbit.pitch + (e.clientY - py) * 0.006));
  px = e.clientX; py = e.clientY; updateCamera();
});
canvas.addEventListener('wheel', (e) => { e.preventDefault(); orbit.radius = Math.max(2.6, Math.min(8, orbit.radius * Math.exp(e.deltaY * 0.001))); updateCamera(); }, { passive: false });

const rig = createRig(); scene.add(rig.root);
const pose = new Float32Array(POSE_SIZE), root = new THREE.Vector3();
let design = loadSuitDesign(), model, selected = null, playing = false, t = 0.2, last = performance.now();
const showcase=P({hips:[0,.92,0],hipsR:[0,-6,0],spine:[2,2,0],chest:[1,3,0],head:[3,-9,0],
  footL:[.27,.075,.10,0,16],footR:[-.28,.075,-.08,0,-18],
  spear:[-.05,1.08,.11,-48,-33,10],gripR:.3,lfree:1,armL:[2,0,10,18]});
const status = (value) => { $('#status').textContent = value; };
const clay = new THREE.MeshStandardMaterial({color:0x829195,roughness:.8,metalness:0,side:THREE.DoubleSide});
function updateSurface() {
  for (const mesh of Object.values(model.meshes)) {
    mesh.userData.studioMaterial ||= mesh.material;
    mesh.material = $('#surface').value === 'clay' ? clay : $('#surface').value === 'clean' && mesh.userData.cleanMaterial ? mesh.userData.cleanMaterial : mesh.userData.studioMaterial;
  }
}
const control = (key) => $(`[data-key="${key}"]`);
function syncControls() {
  for (const [key, value] of Object.entries(design)) {
    control(key).value = value;
    const out = $(`[data-out="${key}"]`); if (out) out.value = Number(value).toFixed(2);
  }
}
function disposeModel() {
  if (!model) return;
  disposeGeneratedSuit(model);
  for (const mesh of Object.values(model.meshes)) {
    mesh.parent.remove(mesh); mesh.geometry.dispose();
  }
  for (const material of Object.values(model.materials)) material.dispose();
}
function showParts() {
  const list = $('#part-list'); list.replaceChildren();
  const names = Object.keys(model.meshes).sort();
  for (const name of names) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = name.replaceAll('-', ' ');
    button.setAttribute('role', 'option'); button.setAttribute('aria-selected', String(selected === name));
    button.addEventListener('click', () => { selected = selected === name ? null : name; highlight(); showParts(); });
    list.appendChild(button);
  }
}
function highlight() {
  for (const [name, mesh] of Object.entries(model.meshes)) {
    mesh.visible = !selected || name === selected;
  }
}
function rebuild() {
  disposeModel();
  model = createProceduralSuit(rig, design, { editable: true });
  const generated = $('#representation').value === 'generated';
  for (const input of document.querySelectorAll('[data-key]')) input.disabled = generated;
  $('#save').disabled = generated;
  $('#reset').disabled = generated;
  $('#export').disabled = generated;
  $('#metrics').textContent = generated ? 'Loading generated suit…' : `${model.stats.parts} authored parts · ${Math.round(model.stats.triangles/1000)}k triangles`;
  if (generated) {
    const current = attachGeneratedSuit(rig, model);
    current.ready.then((skin) => {
      if (current !== model) return;
      if(selected && !model.meshes[selected])selected=null;
      updateSurface();
      showParts(); highlight();
      $('#metrics').textContent = skin ? `${Math.round(model.generatedStats.triangles / 1000)}k armour triangles · prepared combat rig` : 'Generated suit unavailable';
      status(skin ? 'Prepared armour follows the game rig. Inspect motion with the action and timeline controls.' : 'Generated suit could not load. Code-built suit remains visible.');
    });
  } else status('Code-built suit is editable. Save its settings to use them in the game with ?suit=procedural.');
  if (selected && !model.meshes[selected]) selected = null;
  highlight(); showParts();
  updateSurface();
}
syncControls(); rebuild();
$('#representation').addEventListener('change', () => { selected = null; rebuild(); });
$('#surface').addEventListener('change', updateSurface);
for (const input of document.querySelectorAll('[data-key]')) input.addEventListener('input', () => {
  design = suitDesign({ ...design, [input.dataset.key]: input.value });
  const out = $(`[data-out="${input.dataset.key}"]`); if (out) out.value = Number(input.value).toFixed(2);
  rebuild(); status('Preview updated. Save to use this design in the game.');
});
$('#all-parts').addEventListener('click', () => { selected = null; highlight(); showParts(); });
$('#save').addEventListener('click', () => {
  try { design = saveSuitDesign(design); status('Saved for this browser. Open the game or reload it to see the suit.'); }
  catch (error) { status(`Could not save: ${error.message}`); }
});
$('#reset').addEventListener('click', () => {
  localStorage.removeItem(SUIT_STORAGE_KEY); design = suitDesign(SUIT_DEFAULT); selected = null;
  syncControls(); rebuild(); status('Restored the original Vanguard design in the studio and game.');
});
$('#export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ version: 1, design }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = 'vanguard-suit-design.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  status('Exported a portable design preset.');
});
$('#screenshot').addEventListener('click', async () => {
  renderer.render(scene, camera);
  const image=canvas.toDataURL('image/png'),name=`vanguard-${$('#representation').value}-${$('#surface').value}-${$('#camera').value}-${$('#action').value}-${Math.round(t*100)}.png`;
  if(['localhost','127.0.0.1'].includes(location.hostname)&&location.port==='8767') {
    try {
      const response=await fetch('/__studio_capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,name})});
      if(!response.ok)throw new Error(`Capture failed (${response.status})`);
      const saved=await response.json();status(`Saved engine render: ${saved.path}`);return;
    } catch(error){status(error.message);return;}
  }
  const a=document.createElement('a');a.href=image;a.download=name;a.click();
  status('PNG download requested. Use tools/serve.py for verified project-local captures.');
});
$('#play').addEventListener('click', () => { playing = true; status('Motion playing.'); });
$('#pause').addEventListener('click', () => { playing = false; status('Motion paused for inspection.'); });
$('#timeline').addEventListener('input', (e) => { playing = false; t = Number(e.target.value) / 100; $('#time').value = `${e.target.value}%`; });
$('#action').addEventListener('change', () => { t = 0; $('#timeline').value = '0'; $('#time').value = '0%'; });

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  if (playing) {
    t = (t + dt * ($('#action').value === 'idle' || $('#action').value === 'run' ? 0.28 : 0.42)) % 1;
    $('#timeline').value = String(Math.round(t * 100)); $('#time').value = `${Math.round(t * 100)}%`;
  }
  if($('#action').value==='showcase')pose.set(showcase);else sampleAnim($('#action').value, t, 0.65, pose);
  rig.root.scale.setScalar(1);
  rig.apply(pose, root, 0); rig.root.scale.setScalar(HERO_SCALE);
  applyRoll(rig, {id: $('#action').value, t});
  rig.root.updateMatrixWorld(true);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
