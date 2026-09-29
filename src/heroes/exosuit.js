// A compact pilot rig for the robot-arena demo. It uses the existing spear animation
// and hit windows; the visible weapon is a powered industrial staff.
import { B, vox } from '../hero/model.js';
import { SUIT_DEFAULT } from './suit-design.js';

const V = 0.0135;
const C = { core: 0x111c27, plate: 0x46647a, light: 0x9acbdb, dark: 0x263b4b,
  joint: 0x17232c, orange: 0xffa644, white: 0xe0eff0, steel: 0x8296a0 };

function build(col = C) {
  const p = {
    hips: [B([-13,-10,-9],[13,6,9],col.core), B([-16,-3,-11],[16,5,11],col.plate), B([-4,-1,11],[4,5,14],col.orange)],
    spine: [B([-11,-7,-9],[11,17,9],col.core), B([-13,-2,-11],[13,17,11],col.dark), B([-9,1,11],[9,12,14],col.plate)],
    chest: [B([-15,-5,-11],[15,20,11],col.core), B([-19,0,-13],[19,19,13],col.plate),
      B([-14,4,13],[14,18,16],col.dark), B([-9,7,16],[9,15,18],col.light),
      B([-3,9,18],[3,13,19],col.orange), B([-12,1,-14],[12,17,-11],col.steel)],
    neck: [B([-5,-3,-5],[5,6,5],col.joint), B([-6,0,-6],[6,4,6],col.steel)],
  };
  for (const s of ['L', 'R']) {
    p['upperArm'+s] = [B([-7,-23,-7],[7,3,7],col.core), B([-9,-20,-9],[9,-3,9],col.plate), B([-4,-22,9],[4,-6,11],col.light)];
    p['foreArm'+s] = [B([-6,-26,-6],[6,2,6],col.joint), B([-9,-23,-9],[9,-4,9],col.plate), B([-8,-23,9],[8,-9,12],col.steel)];
    p['hand'+s] = [B([-6,-7,-6],[6,5,6],col.core), B([-6,-7,5],[6,2,8],col.steel)];
    p['thigh'+s] = [B([-8,-37,-8],[8,3,8],col.core), B([-10,-33,-10],[10,-8,10],col.plate), B([-5,-28,10],[5,-12,12],col.light)];
    p['shin'+s] = [B([-7,-34,-7],[7,4,7],col.joint), B([-9,-30,-9],[9,-4,9],col.plate), B([-8,-6,7],[8,4,12],col.steel)];
    p['foot'+s] = [B([-8,-5,-10],[8,5,14],col.core), B([-9,-5,5],[9,2,16],col.plate)];
  }
  const head = [B([-8,0,-8],[8,16,8],col.core), B([-9,5,-9],[9,17,9],col.plate),
    B([-8,4,8],[8,12,11],col.dark), B([-7,7,11],[7,11,12],col.light),
    B([-3,14,9],[3,17,11],col.orange)];
  const weapon = [{ geo: vox([
    B([-2,-2,-38],[2,2,118],col.core), B([-3,-3,-33],[3,3,-27],col.steel),
    B([-3,-3,90],[3,3,98],col.orange), B([-4,-4,114],[4,4,136],col.steel),
    B([-8,-3,136],[8,3,151],col.plate), B([-5,-2,151],[5,2,165],col.steel),
  ], 0.012, { jitter: 0.02 }), mat: 'metal' }];
  return { parts: p, head, weapon, bv: V };
}

const face = [
  '....................', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....',
  '...GGGggggggggGGG...', '...GGgTTTTTTTTgGG...', '...GGgTwwwwwwTgGG...',
  '...GGgTwwwwwwTgGG...', '...GGgTTTTTTTTgGG...', '...GGGGGGGGGGGGGG...',
  '....GGGggggggGGG....', '.....GGGGGGGGGG.....', '......GGGGGGGG......',
  '......GGGGGGGG......', '.....GGGGGGGGGG.....', '....GGGGGGGGGGGG....',
  '....GGGGGGGGGGGG....', '....GGGGGGGGGGGG....', '.....GGGGGGGGGG.....',
  '......GGGGGGGG......', '....................',
];
const pal = { G:'#46647a', g:'#263b4b', T:'#17232c', w:'#9acbdb' };

export const EXOSUIT = {
  id:'exosuit', zh:'EXO-01', en:'EXO-01', seal:'PILOT', weapon:'POWER STAFF', role:'ARMORED RESPONSE',
  sub:'ONE PILOT · ONE LAST LINE', copy:'HOLD THE<br>LINE', tagline:'Break the machine assault. Protect the people behind you.',
  cut:{ sub:'EXO-01 OVERDRIVE', seal:'OVERDRIVE' },
  lines:{ open:['EXO-01 deployed.','The evacuation is behind us. Hold the line.'],
    musou:['OVERDRIVE','Overdrive engaged.'] },
  face, pal, build:()=>build(), chains:()=>[],
};

export const WARDEN = {
  ...EXOSUIT, id:'warden', zh:'WARDEN', en:'WARDEN', seal:'COMMAND', role:'COMMAND UNIT',
  build:()=>build({ ...C, plate:0x7b3440, dark:0x492631, light:0xff9a76, orange:0xffd07a }),
};

export const VANGUARD = {
  ...EXOSUIT, id:'vanguard', zh:'EXO-01', en:'VANGUARD', seal:'PILOT',
  weapon:'POWER LANCE', role:'ARMORED RESPONSE',
  sub:'BUILT TO HOLD THE LINE', cut:{ sub:'VANGUARD OVERDRIVE', seal:'OVERDRIVE' },
  face, pal:{ G:'#d9d3c4', g:'#42647c', T:'#202d37', w:'#ffab55' },
  proceduralSuit:true, generatedSuit:true, suitDesign:SUIT_DEFAULT,
};
