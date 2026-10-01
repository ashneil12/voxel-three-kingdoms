// Battles. A stage sets the time of day (sky palette, sun/moon direction, light colours, default post look), the enemy
// army (banner character, name, soldier colours, the four named officers) and its intro banner, plus per-hero opening
// lines. The active stage is picked by ?stage=<id> (the title menu reloads with it); the sky and haze are compiled into
// shaders at boot, which is why a stage change reloads.

import { DEMO } from '../heroes/index.js';

const CLASSIC_STAGES = [
  {
    id: 'changban', zh: '長坂坡', en: 'CHANGBAN', seal: '長坂', time: '黃昏', look: 'dusk',
    intro: ['<em>長坂坡</em>之戰', 'Battle of Changban — break through Cao Cao\'s pursuit'],
    enemy: { ch: '魏', army: '魏軍', en: 'Wei', officers: [['夏侯恩', 'XIAHOU EN'], ['晏明', 'YAN MING'], ['淳于導', 'CHUNYU DAO'], ['張郃', 'ZHANG HE']] },
    ally: { ch: '蜀', label: '蜀' },
    sky: {},   // the defaults in world/sky.js are this golden hour
    light: {},
    lines: {},
  },
  {
    id: 'hulao', zh: '虎牢關', en: 'HULAO GATE', seal: '虎牢', time: '白晝', look: 'bright', set: 'pass',
    intro: ['<em>虎牢關</em>之戰', 'Battle of Hulao Gate — the coalition storms Dong Zhuo\'s pass'],
    enemy: { ch: '董', army: '董卓軍', en: 'Dong Zhuo\'s', band: 0x7a3aa0, cloth: 0x3e2a52,
      officers: [['華雄', 'HUA XIONG'], ['李傕', 'LI JUE'], ['郭汜', 'GUO SI'], ['高順', 'GAO SHUN']] },
    // 三英戰呂布: Lü Bu rides out of the gate as the boss (boss/boss.js); playing Lü Bu, Guan Yu comes for you instead
    boss: { id: 'lubu', intro: ['三英戰呂布', 'THE THREE HEROES AGAINST LÜ BU'], alt: { id: 'guanyu', intro: ['武聖 關雲長', 'GUAN YU RIDES OUT'] } },
    ally: { ch: '漢', label: '聯' },
    sky: {
      sunElev: 0.62, sunAz: 0.5, haze: 0xa9b6c8, hazeWarm: 0xd6ccb4, glow: 0xfff2d8, skyMid: 0x9ab8dc, skyTop: 0x4c7cc0,
      hznSun: 0xe8e0c8, hznAway: 0xc4d0e0, cloudRose: 0xeef0f6, cloudShade: 0xa4aec4, cloudLit: 0xffffff,
      dustLit: 0xd6c8aa, dustShade: 0x9aa4b6, apCool: 0x98a8cc, sunCore: [3.2, 3.1, 2.8],
    },
    light: { hemi: [0xc8d8ff, 0x9a8a74, 2.5], sun: [0xfff4e4, 4.0], rim: [0xfff2dc, 0.5], fire: 0.6 },
    lines: {
      zhaoyun: ['常山趙子龍在此，董賊休得猖狂！', 'Zhao Zilong of Changshan is here. Dong Zhuo\'s lackeys, stand down!'],
      guanyu: ['溫酒之間，斬汝華雄！', 'I will take Hua Xiong\'s head before the wine grows cold!'],
      zhangfei: ['三姓家奴休走！燕人張飛在此！', 'Stand and fight, servant of three fathers! Zhang Fei of Yan is here!'],
      lubu: ['天下諸侯，無一人是我呂布對手！', 'Of all the lords under heaven, not one can match me!'],
      zhugeliang: ['董卓暴虐，天下共討之！', 'Dong Zhuo\'s tyranny ends here — all under heaven rise against him!'],
    },
  },
  {
    id: 'chibi', zh: '赤壁', en: 'RED CLIFFS', seal: '赤壁', time: '夜戰', look: 'night', set: 'river',
    intro: ['<em>赤壁</em>之戰', 'Battle of Red Cliffs — the fire attack burns through the night'],
    enemy: { ch: '曹', army: '曹軍', en: 'Cao', band: 0x2a5ad0, cloth: 0x22305a,
      officers: [['蔡瑁', 'CAI MAO'], ['張允', 'ZHANG YUN'], ['于禁', 'YU JIN'], ['曹仁', 'CAO REN']] },
    ally: { ch: '吳', label: '吳' },
    sky: {
      sunElev: 0.2, sunAz: -0.5, haze: 0x1e2436, hazeWarm: 0x4a5270, glow: 0x9aaad0, skyMid: 0x1c2238, skyTop: 0x080c1a,
      hznSun: 0x5a5a78, hznAway: 0x8a3a1e, cloudRose: 0x3a2a30, cloudShade: 0x12141e, cloudLit: 0x8a9ab8,
      dustLit: 0x5a3a2a, dustShade: 0x1a1e2c, apCool: 0x3a4a7a, sunCore: [2.4, 2.6, 3.0], dust: 0.1,
    },
    light: { hemi: [0x5a6a9a, 0x6a3418, 1.7], sun: [0xa8bcec, 2.0], rim: [0xff7a3a, 1.6], fire: 1.8, fires: 14 },
    post: { exposure: 1.18, skyGain: 0.3, farGain: 0.42 },
    lines: {
      zhugeliang: ['東風已借，火攻曹賊，正在今夜！', 'The east wind is ours. Tonight we burn Cao Cao\'s fleet!'],
      zhaoyun: ['軍師有令，趁火破敵！', 'The strategist\'s orders — strike while the fire rages!'],
      guanyu: ['曹賊兵敗，關某在此候之！', 'Cao Cao\'s army breaks — and Guan Yu awaits them here!'],
      zhangfei: ['燒得好！燕人張飛來也！', 'What a blaze! Here comes Zhang Fei of Yan!'],
    },
  },
];
const FOUNDRY = {
  id:'foundry', set:'foundry', zh:'THE FOUNDRY', en:'FOUNDRY', seal:'01', time:'EVACUATION', look:'foundry',
  intro:['<em>HOLD THE LINE</em>', 'Keep the machines away from the evacuation route'],
  enemy:{ ch:'AI', army:'MACHINE LEGION', en:'Machine', band:0xe65b46, cloth:0x3b454f,
    officers:[['SCOUT','SCOUT'],['BREAKER','BREAKER'],['HUNTER','HUNTER'],['SENTINEL','SENTINEL']] },
  ally:{ ch:'EXO', label:'PILOT' },
  boss:{ id:'warden', intro:['WARDEN ONLINE','COMMAND UNIT APPROACHING'] },
  sky:{ sunElev:0.24, sunAz:-0.35, haze:0x242f3d, hazeWarm:0x545e69, glow:0xffa76a,
    skyMid:0x334253, skyTop:0x101d2b, hznSun:0xb47d60, hznAway:0x536478,
    cloudRose:0x78818a, cloudShade:0x333f4a, cloudLit:0xa8b8c3, dustLit:0xb99d83,
    dustShade:0x687b87, apCool:0x7197b0, sunCore:[2.4,1.6,1.2] },
  // furnace key from the far wall (low: long shadows run toward the camera), cool fill from the camera side
  light:{ hemi:[0x4a5668,0x1a1410,1.0], sun:[0xffb27a,1.5], rim:[0xa4c4e0,0.8], dir:[0.3,0.5,0.8], rimDir:[-0.55,0.6,-0.55], fire:0.4 },
  lines:{},
};
// Lighting test beds for the EXO demo: the same machine legion and boss in other environments, so the suit, materials
// and post can be judged under daylight, golden hour, moonlight and neon. Day / dusk / night reuse the classic outdoor
// sets (sky, sun, castle, terrain, fires) with their skies and lights; the city is its own night set (world/city.js).
// demo post caps: bloom only on real lights, small near-field blur, HDR clamp (combat flashes up close stay sparks, not blobs)
const DEMO_POST = { bloom: 0.45, bloomThreshold: 1.8, bloomRadius: 0.1, nearBlur: 10, hdrClamp: 2.0, aeStrength: 0.5, aeMin: 0.65, aeMax: 1.5,
  volume: 0.2, volumeDensity: 0.006, volumeHeight: 10, volumeAnisotropy: 0.5 };
const demoOn = (classic, over) => ({ ...FOUNDRY, look: classic.look, set: classic.set, sky: classic.sky, light: { ...classic.light, ...over.light },
  ...over, post: { ...classic.post, ...over.post, ...DEMO_POST, aeKey: over.aeKey } });
const [CHANGBAN, HULAO, CHIBI] = CLASSIC_STAGES;
const DEMO_STAGES = [
  FOUNDRY,
  demoOn(HULAO, { aeKey: 0.13, post: { cloud: 0.4 }, light: { bounce: 0.55 }, id: 'day', zh: 'OPEN GROUND', seal: '02', time: 'MIDDAY', intro: ['<em>HOLD THE PASS</em>', 'Full sun on the mountain pass'] }),
  demoOn(CHANGBAN, { aeKey: 0.165, post: { cloud: 0.22, cloudWind: [1.4, 0, 0.6] }, light: { bounce: 0.7 }, id: 'dusk', zh: 'GOLDEN HOUR', seal: '03', time: 'DUSK', intro: ['<em>HOLD THE ROAD</em>', 'Low sun over the plain'] }),
  demoOn(CHIBI, { aeKey: 0.03, post: { ...CHIBI.post, exposure: 1.42 }, id: 'night', zh: 'RIVER NIGHT', seal: '04', time: 'NIGHT', intro: ['<em>HOLD THE RIVER</em>', 'Moonlight and fire on the water'] }),
  { ...FOUNDRY, id: 'city', set: 'city', zh: 'NEON CITY', seal: '05', time: 'NIGHT', look: 'city',
    intro: ['<em>HOLD THE STREET</em>', 'Rain-soaked downtown under neon'],
    sky: { ...FOUNDRY.sky, haze: 0x161a2a, hazeWarm: 0x2a2140, glow: 0xff5ab4, skyMid: 0x1a1d33, skyTop: 0x07081a,
      hznSun: 0x6a3a6a, hznAway: 0x26405a, sunCore: [1.6, 1.4, 2.2] },
    // cool moon key from high behind, magenta/cyan neon fills, low ambient: the street lamps and signs do the work
    light: { hemi: [0x34406a, 0x120c14, 0.8], sun: [0x9ab0ff, 0.9], rim: [0xff4fae, 0.9], dir: [-0.35, 0.75, 0.55], rimDir: [0.6, 0.4, -0.6], fire: 0 },
  },
];
export const STAGES = DEMO ? DEMO_STAGES : CLASSIC_STAGES;
const pick = new URLSearchParams(location.search).get('stage');
export const STAGE = STAGES.find((s) => s.id === pick) || STAGES[0];
