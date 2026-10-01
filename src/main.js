// Boot + fixed 60 Hz loop. Sim modules (hero, combat, crowd, musou, camera control yaw) advance only in step();
// render-side modules read sim state in render() and never write it.
import * as THREE from 'three';
import { stabilizeEmissiveEdges } from './lighting/materials.js';
import { rng, vrng } from './core/rng.js';
import { emit } from './core/events.js';
import { createInput } from './core/input.js';
import { createPost } from './post/post.js';
import { createWorld, createStageEnv, leadShadow, SHADOW } from './world/world.js';
import { createHero, createHeroView, updateAnim } from './hero/hero.js';
import { MOVES } from './hero/moves.js';
import { createCrowd, CROWD } from './crowd/crowd.js';
import { createCrowdView } from './crowd/view.js';
import { createCombat } from './combat/combat.js';
import { createMusou } from './musou/musou.js';
import { createMusouView } from './musou/view.js';
import { createCamSim, createCameraRig } from './camera/camera.js';
import { createVfx } from './vfx/vfx.js';
import { createCombatLights } from './vfx/lights.js';
import { createSignatureFx } from './vfx/signature.js';
import { createChargeFx } from './vfx/charge.js';
import { createHud, paintPortrait } from './ui/hud.js';
import { HERO, HEROES, DEMO } from './heroes/index.js';
import { WARDEN } from './heroes/exosuit.js';
import { STAGE, STAGES } from './stages/index.js';
import { createBoss, BOSS } from './boss/boss.js';
import { createBossView } from './boss/view.js';
import { createAudio } from './audio/audio.js';
import { createPickups } from './ui/pickups.js';
import { on } from './core/events.js';
import { createImpact } from './vfx/impact.js';
import { createQualityGovernor } from './core/quality.js';
import { P as POST_P } from './post/post.js';

const params = new URLSearchParams(location.search);
const ENEMIES = Math.max(0, Math.min(2000, params.get('enemies') ? Number(params.get('enemies')) | 0 : DEMO ? 72 : 300));
if (DEMO) {
  BOSS.hp = 850;
  BOSS.poise = 140;
  BOSS.arriveKOs = 60;
  BOSS.earliest = params.has('boss') ? 0 : 60 * 70;
  if (!params.has('boss')) BOSS.arrive = 60 * 115;
}

const canvas = document.getElementById('c');
let vw = innerWidth, vh = innerHeight, renderScale = 1;   // renderScale < 1 only when the quality governor drops to tier 3

const post = createPost({ canvas, width: vw, height: vh });
const scene = new THREE.Scene();
const world = createWorld(scene);
post.configureWorld?.(world, scene);
stabilizeEmissiveEdges(scene);   // furnace/gate glow: pow() of a negative base at MSAA edge samples is NaN
if (DEMO) {
  const pmrem = new THREE.PMREMGenerator(post.renderer), env = createStageEnv();
  scene.environment = pmrem.fromScene(env.scene, .04).texture;
  scene.environmentIntensity = env.intensity;
  pmrem.dispose();
}

// ---- sim
const game = { frame: 0, roundFrame: 0, hitstop: 0, freeze: 0 };
game.cam = createCamSim();
game.hero = createHero(game);
game.crowd = createCrowd(game, ENEMIES);
game.combat = createCombat(game);
game.musou = createMusou(game);
// stage boss (虎牢關): Lü Bu — or Guan Yu when the player is Lü Bu
const bossCfg = STAGE.boss && (STAGE.boss.id === HERO.id ? STAGE.boss.alt : STAGE.boss);
game.boss = bossCfg ? createBoss(game, HEROES.find((h) => h.id === bossCfg.id) || (DEMO ? WARDEN : null)) : null;
if (DEMO) on('boss:enter', () => game.crowd.reset());
const input = createInput();
const pickups = createPickups(game, scene);   // meat buns: heal on pickup (ui/pickups.js)
if (params.has('debug') || params.has('rec')) Object.assign(window, { game, scene, post, world });   // debug: inspect sim state from the console

// ---- render side
const heroView = createHeroView(scene, game.hero);
const crowdView = createCrowdView(scene, game);
const camRig = createCameraRig(game, vw, vh);
const vfx = createVfx(scene, game, world);
const combatLights = createCombatLights(scene, game);   // pooled point lights fired by hits / KOs / parries / Overdrive
const impact = createImpact(scene, game);                // hot sparks that bounce + scorch marks (src/vfx/impact.js)
const quality = createQualityGovernor({ P: POST_P, sun: world.sun, shadow: SHADOW, setScale: (k) => { renderScale = k; post.setSize(Math.round(vw * k), Math.round(vh * k)); } });
if (params.has('debug')) window.quality = quality;
const sigFx = createSignatureFx(scene, game, vfx, camRig.camera);   // per-hero projectiles, beams, roar (render-only)
const chargeFx = HERO.anim === 'fan' ? null : createChargeFx(scene, game, camRig.camera, heroView);   // charge-hold glow at the blade
const bossView = game.boss ? createBossView(scene, game, vfx, { bossIntro: bossCfg.intro }) : null;
if (params.has('debug')) window.camRig = camRig;
const musouView = createMusouView(scene, game, camRig.camera);   // musou part: grade, dragon, cut-in (render-only)
// hud part: camera passed so officer name/HP tags can be projected over their heads (read-only)
const hud = createHud(document.getElementById('hud'), game, { camera: camRig.camera });
createAudio(game);

// debug: ?preview=<move id | musou clip id> freezes the hero in that move at window.previewT (0..1) — pose sheets
const PREVIEW = params.get('preview');
if (PREVIEW) window.previewT = 0;
function previewStep() {
  const h = game.hero, m = MOVES[PREVIEW];
  Object.assign(h, { x: 0, y: 0, z: 0, yaw: 0, grounded: true });
  if (m) Object.assign(h, { state: 'attack', move: PREVIEW, moveT: Math.round(window.previewT * m.frames), moveSeq: 1 });
  else if (PREVIEW === 'idle') Object.assign(h, { state: 'idle', move: null, stateT: Math.round(window.previewT * 149) });
  else Object.assign(h, { state: 'musou', move: null, musouClip: PREVIEW, musouT: window.previewT });
  updateAnim(h); h.anim.blendF = h.anim.blendN;
  game.frame++;
}
function step() {
  if (PREVIEW) { previewStep(); return; }
  if (window.__onStep) window.__onStep(game.frame);          // recordings (?rec): scripted input keyed by sim frame
  const inp = input.sample();
  if (DEMO && !params.has('boss')) {
    if (game.roundFrame === 60 * 30) {
      CROWD.engaged = 54; CROWD.wave = [12, 18];
      emit('demo:phase', { title: 'SECOND WAVE', detail: 'More machines are converging.' });
    } else if (game.roundFrame === 60 * 60) {
      CROWD.engaged = 68; CROWD.wave = [15, 22];
      emit('demo:phase', { title: 'FINAL PUSH', detail: 'Hold until the command unit arrives.' });
    }
  }
  game.cam.step(game, inp);
  game.hero.step(inp);
  game.combat.step();
  game.crowd.step();
  pickups.step();
  if (game.boss) game.boss.step();
  game.musou.step();
  game.frame++;
  game.roundFrame++;
  vfx.afterStep();
}

let lastRenderFrame = 0;
function render() {
  const dt = Math.min(10, Math.max(0, (game.frame - lastRenderFrame) / 60));
  lastRenderFrame = game.frame;
  heroView.update(Math.min(dt, 0.1));
  crowdView.update(dt);
  vfx.update(dt);
  combatLights.update();
  impact.update();
  sigFx.update(dt);
  pickups.update();
  if (chargeFx) chargeFx.update(dt);
  if (bossView) bossView.update(dt);
  camRig.update(dt);
  leadShadow(camRig.camera);
  world.update(dt, camRig.focus);
  musouView.update(dt);
  post.flash(vfx.flash);
  post.render(scene, camRig.camera, game.frame / 60, camRig.focus, world.sunDir, world.sun);   // post-fx: DoF focus + haze sun
  hud.update();
}

// ---- result card: 戰死 when the hero falls (restart / back to hero select), 勝利 when the stage boss is defeated
const result = (() => {
  const el = document.createElement('div');
  el.id = 'result'; el.hidden = true;
  el.innerHTML = `<div class="big"></div><div class="en"></div><div class="stats"></div><div class="btns"><button data-a="retry">${DEMO ? 'RETRY' : '再戰'}<small>RETRY · Enter</small></button><button data-a="menu">${DEMO ? 'MENU' : '選將'}<small>MENU · Esc</small></button><button data-a="go">${DEMO ? 'CONTINUE' : '繼續'}<small>CONTINUE</small></button></div>`;
  document.body.appendChild(el);
  const [big, en, stats] = el.children, cont = el.querySelector('[data-a="go"]');
  let maxCombo = 0, open = false, t0 = 0;
  on('hit', () => { maxCombo = Math.max(maxCombo, game.hero.combo); });
  on('scenario', () => { maxCombo = 0; });
  const show = (win, delay) => setTimeout(() => {
    if (open || (!win && game.hero.state !== 'dead')) return;
    big.textContent = DEMO ? (win ? 'AREA SECURE' : 'SUIT DOWN') : win ? '勝利' : '戰死'; en.textContent = win ? 'VICTORY' : 'MISSION FAILED';
    el.classList.toggle('win', win); cont.hidden = !win;
    const s = Math.round((game.frame - t0) / 60);
    stats.innerHTML = `<span>${DEMO ? 'ROBOTS DISABLED' : '擊破'} <b>${game.hero.kos}</b></span><span>${DEMO ? 'BEST COMBO' : '最大連擊'} <b>${maxCombo}</b></span><span>${DEMO ? 'TIME' : '時間'} <b>${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</b></span>`;
    el.hidden = false; open = true; hudEl.hidden = true;
  }, delay);
  on('hero:death', () => show(false, 1800));
  on('boss:defeat', () => show(true, 3200));
  const act = (a) => {
    if (!open) return;
    if (a === 'retry') start();
    else if (a === 'menu') { start(); setPaused(true); }
    else { r.hide(); }
  };
  el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { e.stopPropagation(); act(b.dataset.a); } });
  const r = {
    get open() { return open; }, act,
    hide() { el.hidden = true; open = false; if (!paused) hudEl.hidden = false; t0 = game.frame; },
  };
  return r;
})();

function start() {
  rng.seed(1); vrng.seed(7936);
  result.hide();
  game.roundFrame = 0;
  if (DEMO) { CROWD.engaged = 42; CROWD.wave = [8, 13]; }
  game.hero.reset();
  game.crowd.reset(); game.combat.reset(); game.musou.reset(); game.cam.reset(0);
  if (game.boss) game.boss.reset(), game.boss.st = 'off';
  heroView.reset();
  game.crowd.spawnArmy(Math.min(DEMO ? 36 : ENEMIES, game.crowd.grunts));
  if (params.has('musou')) game.hero.musou = game.hero.musouMax;   // debug: start with a full gauge
  emit('scenario', { name: 'arena' });
}

addEventListener('resize', () => {
  vw = innerWidth; vh = innerHeight;
  post.setSize(Math.round(vw * renderScale), Math.round(vh * renderScale));
  camRig.resize(vw, vh);
  render();
});

// ---- start / pause menu (index.html #menu): the sim waits while it is open
const menu = document.getElementById('menu'), go = document.getElementById('go'), hudEl = document.getElementById('hud');
if (DEMO) {
  document.title = 'EXO: HOLD THE LINE — combat demo';
  menu.querySelector('.t').innerHTML = 'EXO <i>HOLD THE LINE</i>';
  menu.querySelector('.en').textContent = 'A POWERED SUIT AGAINST THE MACHINE LEGION';
  menu.querySelector('.links').style.display = 'none';
  const studioLink = document.createElement('a');
  studioLink.href = './studio.html'; studioLink.textContent = 'OPEN SUIT STUDIO'; studioLink.className = 'studio-link';
  menu.appendChild(studioLink);
  const labels = ['MOVE','ATTACK','HEAVY','JUMP','BOOST DODGE','OVERDRIVE','CAMERA'];
  menu.querySelectorAll('table td:first-child').forEach((td, i) => { td.innerHTML = labels[i]; });
  menu.querySelector('table tr:nth-child(3)').insertAdjacentHTML('afterend',
    '<tr><td>GUARD / PARRY</td><td><kbd>F</kbd> hold to block · tap just before impact to stun</td></tr><tr><td>LOCK TARGET</td><td><kbd>Tab</kbd> toggle · camera follows the target</td></tr>');
  menu.querySelector('table tr:last-child td:last-child').innerHTML = '<kbd>C</kbd> auto on/off · <kbd>Q</kbd><kbd>E</kbd> or drag for manual look';
  go.innerHTML = 'DEPLOY <small>START</small>';
  menu.querySelector('.hint').textContent = 'J attack · K heavy · F guard/parry · Tab lock · C camera mode · Shift dodge · I overdrive · Esc pause';
  const style = document.createElement('style');
  style.textContent = `
    #menu { background:linear-gradient(90deg,rgba(5,14,22,.96) 0%,rgba(5,14,22,.86) 43%,rgba(5,14,22,.05) 90%); color:#d9e9ee; font-family:Arial,sans-serif; }
    #menu .t { font:800 clamp(48px,7vw,96px)/1 Arial,sans-serif; letter-spacing:-.05em; color:#f0f7f8; }
    #menu .t i { writing-mode:horizontal-tb; vertical-align:baseline; background:none; box-shadow:none; margin-left:.1em; padding:0; font:700 .28em/1 Arial,sans-serif; letter-spacing:.16em; color:#81ccdc; }
    #menu .en { max-width:590px; font:700 14px/1.4 Arial,sans-serif; letter-spacing:.24em; color:#81ccdc; }
    #menu .sub { max-width:600px; color:#c9dbe2; font:500 16px/1.4 Arial,sans-serif; letter-spacing:.02em; }
    #menu table { border-color:#60b7cd; }
    #menu td:first-child { color:#81ccdc; font:700 14px/1.2 Arial,sans-serif; letter-spacing:.08em; }
    #menu .heroes button { background:rgba(22,43,55,.78); box-shadow:0 0 0 1px #587989; }
    #menu .heroes button.on { background:rgba(34,72,87,.9); box-shadow:0 0 0 2px #75c7db; }
    #menu .heroes button b,#menu .stages button b { font-family:Arial,sans-serif; letter-spacing:.06em; }
    #menu #go { background:#81ccdc; color:#0e2732; font:800 24px/1 Arial,sans-serif; letter-spacing:.12em; box-shadow:0 4px 18px #07141b; }
    #menu .hint { max-width:610px; letter-spacing:.02em; color:#b3cad2; }
    #menu table { margin-top:1.1rem; font-size:1.5rem; }
    #menu td { padding:.26rem 1.2rem; }
    #menu #go { margin-top:1.2rem; }
    #menu .studio-link { position:absolute; right:2.4rem; top:2.4rem; padding:.75rem 1rem; color:#d7f1f4;
      background:rgba(18,43,54,.9); border:1px solid #80c8d8; border-radius:.35rem; text-decoration:none;
      font:700 1.2rem/1 Arial,sans-serif; letter-spacing:.1em; }
    #menu .studio-link:hover { background:#315767; }
    #hud .h-intro .zh,#hud .h-player .name { font-family:Arial,sans-serif; font-weight:800; letter-spacing:-.03em; }
    #hud .h-intro .seal { display:none; }
    #hud .h-guard { position:absolute; left:15%; bottom:2.1rem; width:30%; display:flex; align-items:center; gap:.7rem; font:700 1.15rem/1 Arial,sans-serif; color:#a6c9d4; letter-spacing:.08em; }
    #hud .h-guard .track { position:relative; height:.75rem; flex:1; background:#12212b; box-shadow:0 0 0 1px #628695; }
    #hud .h-guard .track i { position:absolute; inset:0; transform-origin:left center; background:linear-gradient(90deg,#4f91a8,#ace8f1); }
    #hud .h-guard.active { color:#ecf9fc; }
    #hud .h-guard.broken .track i { background:#e06b4f; }
    #hud .h-guard span { min-width:8rem; text-align:right; font-size:.95rem; }
    #hud .h-lock { left:0; top:0; opacity:0; display:flex; flex-direction:column; align-items:center; width:0; height:0; color:#a7e7f0; font:800 1.1rem/1 Arial,sans-serif; letter-spacing:.1em; text-shadow:0 1px 5px #06141b; }
    #hud .h-lock span { font:700 5rem/1 Arial,sans-serif; transform:translate(-50%,-50%); text-shadow:0 0 1rem #56c6dc; }
    #hud .h-lock b { position:absolute; top:2.6rem; transform:translateX(-50%); white-space:nowrap; padding:.2rem .5rem; background:rgba(6,23,32,.65); }
    #hud .h-camera-mode { right:2.4%; top:25.4rem; font:700 1.05rem/1 Arial,sans-serif; letter-spacing:.1em; color:#aedbe5; background:rgba(6,23,32,.55); padding:.4rem .55rem; }
  `;
  document.head.appendChild(style);
}
// hero select: one card per officer; picking another reloads with ?hero=<id> (the model is built at boot)
// … and one per battle (?stage=<id>; the sky is compiled at boot too)
const pick = (key, id, cur) => { if (id === cur) return; const q = new URLSearchParams(location.search); q.set(key, id); location.search = q; };
const pickHero = (id) => pick('hero', id, HERO.id), pickStage = (id) => pick('stage', id, STAGE.id);
document.getElementById('tagline').textContent = HERO.tagline;
const card = (row, on, html, fn) => {
  const b = document.createElement('button');
  b.className = on ? 'on' : '';
  b.innerHTML = html;
  b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
  document.getElementById(row).appendChild(b);
  return b;
};
for (const h of HEROES) paintPortrait(card('heroes', h === HERO, `<canvas width="20" height="20"></canvas><span><b>${h.zh}</b><small>${h.weapon}</small><small>${h.role}</small></span>`, () => pickHero(h.id)).firstChild, h);
for (const s of STAGES) card('stages', s === STAGE, `<span><b>${s.zh}</b><small>${s.time} · ${s.enemy.army}</small></span>`, () => pickStage(s.id));
let paused;
const setPaused = (v) => { paused = v; menu.hidden = !v; hudEl.hidden = v; input.sample(); };   // sample(): drop keys pressed on the menu
go.addEventListener('click', () => setPaused(false));
addEventListener('keydown', (e) => {
  if (result.open) { if (e.code === 'Enter' || e.code === 'NumpadEnter') result.act('retry'); else if (e.code === 'Escape') result.act('menu'); return; }
  if (e.code === 'Escape') setPaused(!paused);
  else if (paused && (e.code === 'Enter' || e.code === 'NumpadEnter')) setPaused(false);
  else if (paused && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
    const i = HEROES.indexOf(HERO) + (e.code === 'ArrowLeft' ? -1 : 1);
    pickHero(HEROES[(i + HEROES.length) % HEROES.length].id);
  } else if (paused && (e.code === 'ArrowUp' || e.code === 'ArrowDown')) {
    const i = STAGES.indexOf(STAGE) + (e.code === 'ArrowUp' ? -1 : 1);
    pickStage(STAGES[(i + STAGES.length) % STAGES.length].id);
  }
});
addEventListener('blur', () => setPaused(true));

// ---- loop
let acc = 0, last = performance.now();
const frame = (now) => {
  requestAnimationFrame(frame);
  // clamp at 0 too: the first rAF timestamp can precede the performance.now() taken at module init
  acc += Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  if (paused) { acc = 0; input.sample(); quality.reset(); return; }
  if (!PREVIEW) quality.tick(now);
  let n = 0;
  while (acc >= 1 / 60 && n < 4) { step(); acc -= 1 / 60; n++; }
  if (n === 4) acc = 0;
  render();
};

start();
setPaused(!PREVIEW);
if (PREVIEW) document.getElementById('hud').hidden = true;
render();
requestAnimationFrame(frame);
