import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { applyRoll } from './hero/anims/locomotion.js';
import { createRig, HERO_SCALE, POSE_SIZE, P, CH } from './hero/rig.js';
import { createProceduralSuit } from './hero/procedural-suit.js';
import { createHeroModel } from './hero/model.js';
import { HERO } from './heroes/index.js';   // also merges the hero's rig proportions into DIM before the rig below is built
import { attachGeneratedSuit, disposeGeneratedSuit } from './hero/generated-suit.js?v=skin-2';
import { SUIT_DEFAULT, suitDesign, loadSuitDesign, saveSuitDesign, SUIT_STORAGE_KEY } from './heroes/suit-design.js';
import { sampleAnim } from './hero/hero.js';
import { createSecondary } from './hero/secondary.js';
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
const weightMat = new THREE.MeshBasicMaterial({ vertexColors: true });
const JOINT_HUES = { hips: 0, spine: 30, chest: 60, neck: 90, head: 120, shoulderL: 150, upperArmL: 180, foreArmL: 210, thighL: 240, shinL: 270, footL: 300,
  shoulderR: 165, upperArmR: 195, foreArmR: 225, thighR: 255, shinR: 285, footR: 315 };
function weightColours(mesh) {   // each vertex = weight-blended joint hue, so blend zones read as gradients
  if (mesh.userData.weightColour) return mesh.userData.weightColour;
  const g = mesh.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, out = new Float32Array(si.count * 3), c = new THREE.Color();
  const hues = mesh.skeleton.bones.map((b) => { const h = JOINT_HUES[b.name] ?? 0; return new THREE.Color().setHSL(h / 360, .85, .5); });
  for (let i = 0; i < si.count; i++) {
    let r = 0, gg = 0, b = 0;
    for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (!w) continue; const col = hues[si.getComponent(i, k)]; r += col.r * w; gg += col.g * w; b += col.b * w; }
    out.set([r, gg, b], i * 3);
  }
  return (mesh.userData.weightColour = new THREE.BufferAttribute(out, 3));
}
function updateSurface() {
  const mode = $('#surface').value;
  for (const mesh of Object.values(model.meshes)) {
    mesh.userData.studioMaterial ||= mesh.material;
    if (mesh.isSkinnedMesh) {
      mesh.userData.paint ||= mesh.geometry.attributes.color;
      mesh.geometry.setAttribute('color', mode === 'weights' ? weightColours(mesh) : mesh.userData.paint);
    }
    mesh.material = mode === 'weights' && mesh.isSkinnedMesh ? weightMat : mode === 'clay' ? clay : mode === 'clean' && mesh.userData.cleanMaterial ? mesh.userData.cleanMaterial : mesh.userData.studioMaterial;
  }
}
const control = (key) => $(`[data-key="${key}"]`);
function syncControls() {
  for (const [key, value] of Object.entries(design)) {
    control(key).value = value;
    const out = $(`[data-out="${key}"]`); if (out) out.value = Number(value).toFixed(2);
  }
}
let sec = null;                                    // spring chains (tabard, hair, tassels) + pauldron swing, as in the game
function disposeSecondary() { if (sec) for (const c of sec.chains) for (const m of c.meshes) { scene.remove(m); m.geometry.dispose(); } sec = null; }
function disposeModel() {
  disposeSecondary();
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
  if ($('#representation').value === 'voxel') {
    model = createHeroModel(rig, HERO); model.materials = {}; model.ready = Promise.resolve();
    if (HERO.chains) sec = createSecondary(scene, rig, model.material, HERO);
    for (const input of document.querySelectorAll('[data-key]')) input.disabled = true;
    for (const id of ['#save', '#reset', '#export']) $(id).disabled = true;
    $('#metrics').textContent = `${HERO.en} · voxel hero model on the game rig`;
    status('The hero voxel model the game uses, on the shared combat rig (same code path as index.html).');
    highlight(); showParts(); updateSurface(); return;
  }
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
syncControls(); if (qs.get('surface')) $('#surface').value = qs.get('surface'); rebuild();
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


// ---- pose editor: freeze the current frame of any action, tweak every rig channel with sliders, copy the result as a P({...}) spec
// to paste into the clip (anims/attacks.js, anims/locomotion.js, rig.js STANCE). Angles are shown in degrees.
const D2R = Math.PI / 180;
const FIELDS = [   // [spec field, first channel, labels..., (kind)] ; kind: m = metres, d = degrees, g = grip/blend
  ['hips', CH.hips, [['x', 'm', -0.5, 0.5], ['y', 'm', 0.4, 1.2], ['z', 'm', -0.6, 0.6]]],
  ['hipsR', CH.hipsR, [['pitch', 'd', -60, 60], ['yaw', 'd', -90, 90], ['roll', 'd', -40, 40]]],
  ['spine', CH.spine, [['pitch', 'd', -40, 40], ['yaw', 'd', -60, 60], ['roll', 'd', -30, 30]]],
  ['chest', CH.chest, [['pitch', 'd', -40, 40], ['yaw', 'd', -60, 60], ['roll', 'd', -30, 30]]],
  ['head', CH.head, [['pitch', 'd', -45, 45], ['yaw', 'd', -80, 80], ['roll', 'd', -30, 30]]],
  ['footL', CH.footL, [['x', 'm', -0.7, 0.7], ['y', 'm', 0, 0.8], ['z', 'm', -1, 1], ['pitch', 'd', -60, 80], ['yaw', 'd', -90, 90]]],
  ['footR', CH.footR, [['x', 'm', -0.7, 0.7], ['y', 'm', 0, 0.8], ['z', 'm', -1, 1], ['pitch', 'd', -60, 80], ['yaw', 'd', -90, 90]]],
  ['spear', CH.spear, [['x', 'm', -0.8, 0.8], ['y', 'm', 0, 2], ['z', 'm', -0.8, 0.8], ['yaw', 'd', -180, 180], ['elev', 'd', -180, 180], ['roll', 'd', -180, 180]]],
  ['gripR', CH.gripR, [['slide', 'g', -0.3, 1]]], ['gripL', CH.gripL, [['slide', 'g', -0.3, 1]]], ['lfree', CH.lfree, [['free arm', 'g', 0, 1]]],
  ['armL', CH.armL, [['sh rx', 'd', -180, 180], ['sh ry', 'd', -180, 180], ['sh rz', 'd', -180, 180], ['elbow', 'd', 0, 150]]],
];
let edit = null;                                   // Float32Array while editing, else null
const pe = $('#pose-editor');
for (const [field, ch, items] of FIELDS) {
  const g = document.createElement('div'); g.className = 'pgroup'; g.innerHTML = `<b>${field}</b>`;
  items.forEach(([label, kind, lo, hi], i) => {
    const step = kind === 'd' ? 1 : 0.005, l = document.createElement('label');
    l.innerHTML = `<span>${label}</span><input type="range" min="${lo}" max="${hi}" step="${step}" data-ch="${ch + i}" data-kind="${kind}"><output></output>`;
    g.append(l);
  });
  pe.append(g);
}
const sliders = [...pe.querySelectorAll('input[type=range]')];
function syncSliders() {
  for (const el of sliders) { const v = edit[el.dataset.ch] / (el.dataset.kind === 'd' ? D2R : 1); el.value = v; el.nextElementSibling.textContent = (+v).toFixed(el.dataset.kind === 'd' ? 0 : 2); }
}
pe.addEventListener('input', (e) => {
  const el = e.target; if (!edit || el.dataset.ch === undefined) return;
  const v = Number(el.value); edit[el.dataset.ch] = v * (el.dataset.kind === 'd' ? D2R : 1);
  el.nextElementSibling.textContent = v.toFixed(el.dataset.kind === 'd' ? 0 : 2);
});
function poseSpec(p) {
  const r = (v, d) => +(v / (d ? D2R : 1)).toFixed(d ? 0 : 3), out = [];
  for (const [field, ch, items] of FIELDS) { const v = items.map(([, kind], i) => r(p[ch + i], kind === 'd')); out.push(`${field}: ${v.length === 1 ? v[0] : `[${v.join(', ')}]`}`); }
  return `P({ ${out.join(', ')} })`;
}
$('#edit-on').addEventListener('click', () => {
  playing = false; edit = new Float32Array(pose); syncSliders(); pe.hidden = false; $('#edit-on').hidden = true; $('#edit-off').hidden = false; $('#edit-copy').hidden = false;
  status('Pose frozen — drag the sliders, then Copy as code.');
});
$('#edit-off').addEventListener('click', () => { edit = null; pe.hidden = true; $('#edit-on').hidden = false; $('#edit-off').hidden = true; $('#edit-copy').hidden = true; status('Back to the clip.'); });
$('#edit-copy').addEventListener('click', async () => {
  const code = poseSpec(edit); try { await navigator.clipboard.writeText(code); status('Copied pose spec to the clipboard.'); } catch { status(code); }
  console.log(code);
});
window.__studio = { rig, get model() { return model; }, THREE };
window.__studioPose = { spec: () => edit && poseSpec(edit), set: (ch, v) => { if (edit) edit[ch] = v; } };

// One studio frame of an action: pose, rig, dive-roll pitch, then the secondary motion. `tpose` is a design check against
// the T-pose reference (arms straight out, lance hidden); `settle` runs the chains to rest (contact-sheet stills).
const TPOSE = P({ hips: [0, 1.0, 0], hipsR: [0, 0, 0], spine: [0, 0, 0], chest: [0, 0, 0], head: [0, 0, 0],
  footL: [0.11, 0.075, 0, 0, 0], footR: [-0.11, 0.075, 0, 0, 0], spear: [-0.3, 1, 0, 0, -90, 0], gripR: 0, gripL: 0.5, lfree: 1, armL: [0, 0, 0, 0] });
const ZAXIS = new THREE.Vector3(0, 0, 1);
function stage(act, tt, k, dt, settle) {
  if (edit) pose.set(edit);
  else if (act === 'tpose') pose.set(TPOSE);
  else if (act === 'showcase') pose.set(showcase);
  else sampleAnim(act, act === 'run' ? tt * Math.PI * 2 : tt, k, pose);
  rig.root.scale.setScalar(1); rig.apply(pose, root, 0); rig.root.scale.setScalar(HERO_SCALE);
  applyRoll(rig, { id: act, t: tt });
  const tp = act === 'tpose' && !edit;
  rig.joints.weapon.visible = !tp;
  if (tp) for (const [s, sx] of [['L', 1], ['R', -1]]) {
    rig.joints['upperArm' + s].quaternion.setFromAxisAngle(ZAXIS, sx * Math.PI / 2);
    rig.joints['foreArm' + s].quaternion.identity(); rig.joints['hand' + s].quaternion.identity();
  }
  rig.root.updateMatrixWorld(true);
  if (sec) { if (settle) { sec.reset(); for (let i = 0; i < 90; i++) sec.update(1 / 60); } else sec.update(dt); }
  if (tp) for (const s of ['L', 'R']) rig.joints['pauldron' + s]?.quaternion.identity();   // design check: pauldrons at rest
  if (tp) rig.root.updateMatrixWorld(true);
}

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
  const act = $('#action').value;
  stage(act, t, act === 'run' ? 1 : 0.65, playing ? dt : 0, false);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

// ?sheet=<action>:<view>:<count> renders a contact sheet of engine frames across the action (for reviewing motion);
// ?rows=idle,run,n1,...&view=angle&n=6 stacks several actions, one row each.
if (qs.get('sheet') || qs.get('rows')) {
  const rowsList = qs.get('rows') ? qs.get('rows').split(',') : [qs.get('sheet').split(':')[0]];
  const cam = qs.get('view') || (qs.get('sheet') ? qs.get('sheet').split(':')[1] : 'side') || 'side';
  const N = Number(qs.get('n') || (qs.get('sheet') ? qs.get('sheet').split(':')[2] : 8) || 8);
  const cols = qs.get('rows') ? N : Math.min(N, 4), rows = qs.get('rows') ? rowsList.length : Math.ceil(N / cols);
  const CW = Number(qs.get('cw') || 400), CH = Number(qs.get('ch') || 520), sheet = document.createElement('canvas');
  sheet.width = CW * cols; sheet.height = CH * rows;
  Object.assign(sheet.style, { position: 'fixed', inset: '0', zIndex: 99, width: '100vw', background: '#fff' });
  const ctx = sheet.getContext('2d');
  Promise.resolve(model.ready).then(() => {
    [orbit.yaw, orbit.pitch, orbit.radius] = views[cam]; target.set(cam === 'detail' ? 0 : -.1, cam === 'detail' ? 1.48 : .95, 0);
    if (qs.get('ty')) target.y = Number(qs.get('ty')); if (qs.get('tx')) target.x = Number(qs.get('tx')); if (qs.get('r')) orbit.radius = Number(qs.get('r')); if (qs.get('yaw')) orbit.yaw = Number(qs.get('yaw')); updateCamera();
    renderer.setSize(CW, CH, false); camera.aspect = CW / CH; camera.updateProjectionMatrix();
    rowsList.forEach((act, r) => {
      for (let i = 0; i < (qs.get('rows') ? N : N); i++) {
        const tt = i / N, idx = qs.get('rows') ? i : i, cx = (qs.get('rows') ? i : i % cols) * CW, cy = (qs.get('rows') ? r : Math.floor(i / cols)) * CH;
        stage(act, tt, Number(qs.get('k') ?? 1), 0, true);
        if (qs.get('focus')) { const f = new THREE.Vector3(); rig.joints[qs.get('focus')].getWorldPosition(f); target.copy(f); updateCamera(); }
        renderer.render(scene, camera);
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, cx, cy, CW, CH);
        ctx.fillStyle = '#000'; ctx.font = '20px monospace'; ctx.fillText(`${act} ${tt.toFixed(2)}`, cx + 8, cy + 22);
      }
    });
    document.body.appendChild(sheet); window.sheetDone = true;
  });
}
