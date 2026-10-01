// Quality governor: keeps the frame rate on slower GPUs by stepping the expensive passes down, never up (no oscillation).
// It watches real frame intervals while the game is being played; if the median of the last 120 frames is slower than
// ~48 fps it drops one tier, then waits 3 s before judging again. Tiers are cumulative:
//   1  light shafts off, plate-scale contact AO off
//   2  floor reflections off, AO off, sun shadow map 4096 -> 2048
//   3  render at 75% resolution (the canvas is CSS-scaled with pixelated upsampling: reads as chunkier voxels)
// ?quality=auto (default) | high (tier 0, locked) | low (tier 3, locked) | 0..3 (that tier, locked).
const QUALITY_MODE = () => new URLSearchParams(globalThis.location?.search ?? '').get('quality') || 'auto';
const SLOW_MS = 21, WINDOW = 120, COOLDOWN = 180, MAX_TIER = 3;

/** P: post params (live), sun: the shadow-casting light, shadow: world.js SHADOW (res is updated in place), setScale(k):
 *  render-resolution scale, mode: 'auto' | 'high' | 'low' | '0'..'3' (default: ?quality=). */
export function createQualityGovernor({ P, sun, shadow, setScale, mode = QUALITY_MODE() }) {
  const MODE = mode;
  let tier = 0, cooldown = COOLDOWN, last = 0;
  const dts = [];
  const apply = (t) => {
    if (t >= 1) { P.volume = 0; P.aoContact = 0; }
    if (t >= 2) {
      P.ssr = 0; P.ao = 0;
      if (shadow && shadow.res > 2048) {   // shadow optional: a caller on the old signature must not crash on tier 2
        shadow.res = 2048;
        sun.shadow.map?.dispose(); sun.shadow.map = null;
        sun.shadow.mapSize.set(2048, 2048); sun.shadow.needsUpdate = true;
      }
    }
    if (t >= 3) setScale(0.75);
    tier = t;
    if (t > 0) console.info(`[quality] tier ${t}${MODE === 'auto' ? ' (auto: frames were slower than ' + SLOW_MS + ' ms)' : ''}`);
  };
  const fixed = MODE === 'high' ? 0 : MODE === 'low' ? MAX_TIER : /^[0-3]$/.test(MODE) ? Number(MODE) : null;
  if (fixed) apply(fixed);
  return {
    get tier() { return tier; },
    /** call once per rendered frame while playing (not paused, not in a menu) */
    tick(now) {
      if (fixed !== null || tier >= MAX_TIER) return;
      const dt = last ? now - last : 0; last = now;
      if (dt <= 0 || dt > 250) return;                       // tab switches / hitches are not the GPU's fault
      if (cooldown > 0) { cooldown--; return; }
      dts.push(dt); if (dts.length > WINDOW) dts.shift();
      if (dts.length < WINDOW) return;
      const sorted = [...dts].sort((a, b) => a - b), median = sorted[WINDOW >> 1];
      if (median > SLOW_MS) { apply(tier + 1); dts.length = 0; cooldown = COOLDOWN; }
    },
    /** paused / menu: forget the timing so a resumed game is judged fresh */
    reset() { last = 0; dts.length = 0; },
  };
}
