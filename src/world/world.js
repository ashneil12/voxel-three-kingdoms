// Battlefield, as in the concept: a low golden-hour sun in frame between the castle's corner tower and the watchtowers
// on the open flank (the gameplay camera's frame top is only ≈ 5° above level), sun-aware aerial haze (warm
// toward the sun, mauve away), voxel cobbled plaza + road to the gate, stone curtain wall with bastions, gatehouse and
// watchtowers, 魏/蜀 banners with cloth motion, fires with smoke columns and embers, the Wei camp ring, and layered
// mountains. Render-only: never touches sim state; all animation is a pure function of render time.
import * as THREE from 'three';
import { SUN_DIR, HAZE, installHaze, createSky } from './sky.js';
import { buildTerrain } from './terrain.js';
import { buildCastle } from './castle.js';
import { buildDressing } from './dressing.js';
import { STAGE } from '../stages/index.js';
import { buildSetpiece, blocked } from './setpieces.js';
import { buildFoundry } from './foundry.js';
import { buildCity, createCityEnv } from './city.js';
import { createFoundryEnv } from './foundry.js';

export const ARENA_RADIUS = 46;
// sun shadow: a ±24 m box around the focus at 4096² ≈ 1.2 cm texels, fine enough for the suit's plates to shadow each
// other (armour overlap is most of the art target's form). ?fx=low drops to 2048² over ±28 m.
const LOW_FX = new URLSearchParams(location.search).get('fx') === 'low';
export const SHADOW = LOW_FX ? { half: 28, res: 2048, lead: { x: 0, z: 0 } } : { half: 24, res: 4096, lead: { x: 0, z: 0 } };
/** Aim the shadow box where the camera looks: centre it `k` of its half-size ahead of the focus along the camera's ground
 *  heading, so shadows reach ~1.5x further down the screen and nothing behind the lens wastes texels. */
export function leadShadow(camera, k = 0.5) {
  const e = camera.matrixWorld.elements, fx = -e[8], fz = -e[10], l = Math.hypot(fx, fz) || 1;
  SHADOW.lead.x = fx / l * SHADOW.half * k; SHADOW.lead.z = fz / l * SHADOW.half * k;
}          // sim clamps hero/crowd inside this
// castle wall face (sim clamps, minimap and the castle set): far enough back that its skyline (wall top, towers, sun
// gap) fits under the gameplay frame's top edge
export const WALL_Z = 100;
export const GATE_X = -10;
// burning barricades/carts at the arena rim: [x, y, z, scale] (ground scorch + fire + wreck)
const FIELD_FIRES = [[-40, 0, 24, 1.3], [38, 0, -24, 1.2], [-22, 0, -44, 1.4], [30, 0, 36, 1.1], [-47, 0, -8, 1.0], [50, 0, 10, 1.3]];
// fire-attack stages ring the field with more blazes (evenly spread past the arena rim)
for (let i = FIELD_FIRES.length; i < (STAGE.light.fires || 0); i++) {
  const a = i * 2.39996, r = 44 + (i % 3) * 5;
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  if (!blocked(x, z)) FIELD_FIRES.push([x, 0, Math.min(z, 80), 1 + (i % 4) * 0.15]);
}
const L = STAGE.light, FIRE_K = L.fire ?? 1;
// key light: from behind-left of the wall-facing view, higher than the visible sun so the ground reads (hard shadows
// fall toward the camera, soldiers get a warm rim)
const LIGHT_DIR = new THREE.Vector3(...(L.dir || [0.5, 0.58, 0.64])).normalize();

installHaze();

export function createWorld(scene) {
  scene.background = HAZE.clone();
  scene.fog = new THREE.Fog(HAZE.clone(), 28, 240);   // clear fight disc; ≈ 6 % at the wall, 15 % at the towers, 70 % at 250 m (sky.js)
  const sky = createSky();
  scene.add(sky);

  const hemi = new THREE.HemisphereLight(...(L.hemi || [0xaeaac6, 0x8e7a6e, 2.0]));  // cool mauve sky fill (neutral enough that shaded brown stone stays brown, not rose), dust bounce
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(...(L.sun || [0xffdcc0, 3.5]));
  // ground bounce (any outdoor stage, `light.bounce` 0..1): sunlight reflected off the sunlit ground tints the sky fill's
  // ground half, so undersides (chins, arm bottoms, the soldiers' shaded fronts) pick up warm light instead of grey
  if (L.bounce) {
    const ground = new THREE.Color(STAGE.sky?.dustLit ?? 0xb99d83), sunC = sun.color.clone().multiplyScalar(Math.min(1.5, sun.intensity / 3));
    hemi.groundColor.lerp(ground.multiply(sunC), L.bounce);
    hemi.intensity *= 1 + 0.25 * L.bounce;
  }
  sun.castShadow = true;
  sun.shadow.mapSize.set(SHADOW.res, SHADOW.res);
  const sc = sun.shadow.camera;
  sc.left = -SHADOW.half; sc.right = SHADOW.half; sc.top = SHADOW.half; sc.bottom = -SHADOW.half; sc.near = 1; sc.far = 160;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.012;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(...(L.rim || [0xffb07a, 1.2]));            // warm back/rim light from the visible sun
  rim.position.copy(L.rimDir ? new THREE.Vector3(...L.rimDir).normalize() : SUN_DIR).multiplyScalar(100);
  scene.add(rim);

  if (STAGE.set === 'city') {
    return buildCity(scene, { sun, hemi, rim, sky, lightDir: LIGHT_DIR, sunDir: SUN_DIR, sunBase: (L.sun || [0, 3.5])[1] });
  }
  if (STAGE.set === 'foundry') {
    return buildFoundry(scene, { sun, hemi, rim, sky, lightDir: LIGHT_DIR, sunDir: SUN_DIR, sunBase: (L.sun || [0, 3.5])[1] });
  }

  buildTerrain(scene, GATE_X, FIELD_FIRES);
  const castle = buildCastle(scene, { wallZ: WALL_Z, gateX: GATE_X });
  const setpiece = buildSetpiece(scene);                            // 赤壁 river + fleet, 虎牢關 rock walls (setpieces.js)
  const dressing = buildDressing(scene, { wallZ: WALL_Z, gateX: GATE_X, castle, fieldFires: FIELD_FIRES, extraFires: setpiece.fires, blocked });

  // fire glow on the gate and on the two nearest field fires
  const fireLights = [[GATE_X - 6.5, 2.2, WALL_Z - 3.5], [GATE_X + 7, 2.2, WALL_Z - 3.5], [-40, 2, 24]].map(([x, y, z]) => {
    const l = new THREE.PointLight(0xff8a3a, 30, 11, 2); l.position.set(x, y, z); scene.add(l); return l;
  });

  const tmp = new THREE.Vector3();
  let t = 0;
  return {
    sun, hemi, fires: dressing.fires, banners: dressing.cloths, sunDir: SUN_DIR, lightDir: LIGHT_DIR,
    update(dt, focus) {
      t += dt;
      // shadow frustum follows the focus (snapped to texels to avoid shimmer)
      const step = 2 * SHADOW.half / SHADOW.res;
      tmp.set(Math.round((focus.x + SHADOW.lead.x) / step) * step, 0, Math.round((focus.z + SHADOW.lead.z) / step) * step);
      sun.target.position.copy(tmp);
      sun.position.copy(LIGHT_DIR).multiplyScalar(70).add(tmp);
      sky.material.uniforms.uTime.value = t;
      dressing.update(t);
      setpiece.update(t);
      castle.update(t);
      fireLights.forEach((l, i) => { l.intensity = FIRE_K * (28 + Math.sin(t * (13 + i * 3.1) + i) * 5 + Math.sin(t * 7.3 + i * 2) * 4); });
    },
  };
}

/**
 * Image-based light for the current stage (what the suit's armour reflects and is softly lit by): the Foundry and the
 * city have hand-placed light panels; the outdoor stages get a sky dome built from their own sky palette and sun, so
 * the hero picks up blue skylight at noon, gold at dusk and moonlit blue at night. Returns { scene, intensity }.
 */
export function createStageEnv() {
  if (STAGE.set === 'foundry') return { scene: createFoundryEnv(), intensity: 0.8 };
  if (STAGE.set === 'city') return { scene: createCityEnv(), intensity: 0.9 };
  const S = STAGE.sky || {}, s = new THREE.Scene();
  const top = new THREE.Color(S.skyTop ?? 0x5d5a78), mid = new THREE.Color(S.skyMid ?? 0xa98f9c), hzn = new THREE.Color(S.haze ?? 0x9e8c98);
  const ground = new THREE.Color(S.dustShade ?? 0x6a5a50).multiplyScalar(0.45);
  const geo = new THREE.SphereGeometry(50, 48, 24), pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 50;
    if (y > 0.25) c.copy(mid).lerp(top, Math.min(1, (y - 0.25) / 0.6));
    else if (y > 0) c.copy(hzn).lerp(mid, y / 0.25);
    else c.copy(hzn).lerp(ground, Math.min(1, -y / 0.15));
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  s.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const core = S.sunCore || [3.2, 2.6, 2.0];
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(5, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(core[0], core[1], core[2]).multiplyScalar(4), toneMapped: false }));
  sunDisc.position.copy(SUN_DIR).multiplyScalar(45); sunDisc.lookAt(0, 0, 0); s.add(sunDisc);
  return { scene: s, intensity: 0.7 };
}
