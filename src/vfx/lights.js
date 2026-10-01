// Combat lighting (render-only): a fixed pool of point lights that fire off the same event bus the sparks use, so every
// hit, KO, parry and Overdrive actually lights the floor, the crowd and the suit around it (and the post's floor mirror
// picks the flash up as a reflection). The pool size never changes — idle slots sit at intensity 0 — so materials never
// recompile and the per-fragment light count stays constant.
import * as THREE from 'three';
import { on } from '../core/events.js';

const SLOTS = 6;
const FLASH_K = 0.4;
// [colour (linear-ish rgb), peak intensity (cd), reach (m), life (s)]
const WARM = [1.0, 0.5, 0.18], COOL = [0.35, 0.8, 1.0], HOT = [1.0, 0.38, 0.1], RED = [1.0, 0.12, 0.08], WHITE = [1.0, 0.95, 0.85];

export function createCombatLights(scene, game) {
  const slots = Array.from({ length: SLOTS }, () => {
    const light = new THREE.PointLight(0xffffff, 0, 10, 2);
    scene.add(light);
    return { light, t: 1, life: 1, peak: 0, ex: 1 };
  });
  // Overdrive aura: follows the hero while the Musou/Overdrive plays
  const aura = new THREE.PointLight(0x6fd8ff, 0, 16, 2); scene.add(aura);
  let auraK = 0;

  let frameHits = 0, hitFrame = -1;
  function flash(x, y, z, [r, g, b], peak, reach, life, ex = 2) {
    peak *= FLASH_K;                                                     // tuned for impact, not a white-out at 2 m
    // merge into a live flash that is close by (sweeps through a crowd should read as one bright burst, not six)
    let pick = null, min = Infinity;
    for (const s of slots) {
      const live = s.t < s.life;
      const d2 = (s.light.position.x - x) ** 2 + (s.light.position.z - z) ** 2;
      if (live && d2 < 1.2 && s.t < 0.05 && s.peak >= peak * 0.6) { s.peak = Math.max(s.peak, peak); return; }
      const e = live ? s.peak * (1 - s.t / s.life) ** s.ex : -1;       // weakest (or idle) slot gets replaced
      if (e < min) { min = e; pick = s; }
    }
    if (min > peak * 0.9) return;                                       // everything live is brighter: drop this one
    pick.light.position.set(x, y, z); pick.light.color.setRGB(r, g, b); pick.light.distance = reach;
    pick.peak = peak; pick.life = life; pick.t = 0; pick.ex = ex;
  }

  on('hit', (e) => {
    if (game.frame !== hitFrame) { hitFrame = game.frame; frameHits = 0; }
    if (++frameHits > 3) return;
    const cool = e.heavy || e.move === 'musou';
    flash(e.x, e.y + 0.2, e.z, cool ? COOL : WARM, e.heavy ? 70 : 34, e.heavy ? 12 : 9, e.heavy ? 0.22 : 0.14, 2.2);
  });
  on('ko', (e) => flash(e.x, e.y + 0.3, e.z, HOT, e.officer ? 120 : 52, e.officer ? 14 : 10, e.officer ? 0.5 : 0.3, 1.8));
  on('hero:parry', (e) => flash(e.x, e.y, e.z, COOL, 150, 16, 0.32, 2));
  on('hero:block', (e) => flash(e.x, e.y, e.z, COOL, 45, 8, 0.15, 2));
  // a swarm lands blows every few frames: rate-limit so damage flickers instead of tinting the whole crowd red
  let hurtAt = -1e9;
  on('hero:hurt', (e) => {
    if (game.frame - hurtAt < 14) return;
    hurtAt = game.frame;
    flash(e.x, e.y, e.z, RED, e.armored ? 22 : 48, 7, 0.2, 2);
  });
  on('hero:guardbreak', (e) => flash(e.x, 1.2, e.z, WARM, 80, 10, 0.3, 2));
  on('land', (e) => { if (e.hard) flash(e.x, 0.5, e.z, WHITE, 60, 9, 0.2, 2); });
  let atkAt = -1e9;
  on('enemy:attack', (e) => {
    if (e.feint || game.frame - atkAt < 10 && !e.officer) return;
    atkAt = game.frame;
    flash(e.x, e.y, e.z, RED, e.officer ? 40 : 14, 6, 0.12, 2);
  });
  on('boss:warn', (e) => flash(e.x, 1.4, e.z, RED, 70, 16, 0.5, 1.2));
  on('boss:strike', (e) => flash(e.x, 1.0, e.z, HOT, 260, 24, 0.45, 2));
  on('boss:hit', (e) => flash(e.x, e.y, e.z, e.heavy ? COOL : WARM, e.heavy ? 90 : 45, 11, 0.2, 2));
  on('musou:start', (e) => flash(e.x, 1.2, e.z, COOL, 130, 20, 0.6, 1.5));
  on('musou:burst', (e) => flash(e.x, 1.5, e.z, [0.45, 0.95, 1.0], 240, 26, 0.6, 2));   // the musou view already whites out: light, don't add to the veil

  let last = performance.now();
  return {
    update() {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      for (const s of slots) {
        if (s.t >= s.life) { s.light.intensity = 0; continue; }
        s.t += dt;
        s.light.intensity = s.t >= s.life ? 0 : s.peak * (1 - s.t / s.life) ** s.ex;
      }
      const h = game.hero, on = h.state === 'musou' ? 1 : 0;
      auraK += (on - auraK) * Math.min(1, dt * (on ? 6 : 3));
      aura.intensity = auraK * 120 * (0.85 + 0.15 * Math.sin(now * 0.03));
      aura.position.set(h.x, h.y + 1.4, h.z);
    },
  };
}
