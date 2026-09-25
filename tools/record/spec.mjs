// storyboard: every segment is one page load; script keyed by sim frame after the start (60 per second)
const HIDE = "for (const s of ['.h-intro']) { const e = document.querySelector(s); if (e) e.style.display = 'none'; } const r = document.getElementById('result'); if (r) r.remove();";
function heroScript({ charge = 3 } = {}) {
  const s = [[0, 'down', 'KeyW'], [44, 'up', 'KeyW']];
  for (let f = 48; f <= 48 + 12 * 13; f += 12) s.push([f, 'press', 'KeyJ']);                     // full string, mashed
  for (let k = 0; k < charge; k++) s.push([262 + k * 12, 'press', 'KeyJ']);                     // Jx n then K → Cn+1
  s.push([262 + charge * 12, 'press', 'KeyK']);
  s.push([420, 'press', 'Space'], [428, 'press', 'KeyJ'], [440, 'press', 'KeyJ'], [452, 'press', 'KeyJ'], [468, 'press', 'KeyK']);   // air string + jump charge
  s.push([545, 'eval', 'game.hero.musou = game.hero.musouMax; game.hero.iframes = 60;'], [548, 'press', 'KeyI']);
  s.push(...[30, 200, 400, 540].map((f) => [f, 'eval', 'game.hero.hp = game.hero.hpMax;']));
  return s;
}
const hero = (name, h, stage, charge) => ({ name, url: `?hero=${h}&stage=${stage}`, frames: 400, setup: HIDE, script: heroScript({ charge }) });
const path = (a, b, T = 300) => `const u = Math.min(1, r / ${T}), s = u * u * (3 - 2 * u), A = ${JSON.stringify(a)}, B = ${JSON.stringify(b)}; return A.map((v, i) => v + (B[i] - v) * s);`;
const fight = [];
for (let f = 20; f < 600; f += 13) fight.push([f, 'press', f % 91 === 0 ? 'KeyK' : 'KeyJ']);
fight.push(...[100, 300, 500].map((f) => [f, 'eval', 'game.hero.hp = game.hero.hpMax;']));
const HUDOFF = HIDE + " document.getElementById('hud').style.visibility = 'hidden';";

export const segments = [
  hero('zhaoyun', 'zhaoyun', 'changban', 2),
  hero('guanyu', 'guanyu', 'hulao', 3),
  hero('zhangfei', 'zhangfei', 'changban', 2),
  hero('zhugeliang', 'zhugeliang', 'chibi', 3),
  hero('lubu', 'lubu', 'chibi', 2),
  { name: 'boss', url: '?hero=zhangfei&stage=hulao&boss&enemies=120', frames: 420, setup: HIDE, script: [
    [0, 'down', 'KeyW'], [30, 'up', 'KeyW'],
    [64, 'eval', 'const B = game.boss, h = game.hero; B.x = h.x + Math.sin(h.yaw) * 9; B.z = h.z + Math.cos(h.yaw) * 9; B.st = "chase"; B.stT = 0;'],
    ...Array.from({ length: 22 }, (_, i) => [90 + i * 13, 'press', i === 9 ? 'KeyK' : 'KeyJ']),
    ...[120, 260, 400, 520, 600].map((f) => [f, 'eval', 'game.hero.hp = game.hero.hpMax;']),
    [420, 'eval', 'const B = game.boss, h = game.hero; B.hp = Math.min(B.hp, 1600); h.musou = h.musouMax; h.iframes = 90; h.yaw = Math.atan2(B.x - h.x, B.z - h.z); B.x = h.x + Math.sin(h.yaw) * 3.2; B.z = h.z + Math.cos(h.yaw) * 3.2;'],
    [424, 'press', 'KeyI'],
    [560, 'eval', 'const B = game.boss; if (B.alive()) B.hp = Math.min(B.hp, 60);'],
    ...Array.from({ length: 8 }, (_, i) => [640 + i * 12, 'press', 'KeyJ']),
  ] },
  { name: 'fly_changban', url: '?hero=zhaoyun&stage=changban', frames: 170, setup: HUDOFF, script: fight, cam: path([6, 2.6, -9, 0, 1.4, 6, 50], [-34, 16, 18, -12, 6, 96, 55]) },
  { name: 'fly_hulao', url: '?hero=guanyu&stage=hulao', frames: 170, setup: HUDOFF, script: fight, cam: path([0, 3, -16, 0, 2, 20, 55], [4, 24, 34, -8, 9, 104, 55]) },
  { name: 'fly_chibi', url: '?hero=zhugeliang&stage=chibi', frames: 170, setup: HUDOFF, script: fight, cam: path([-36, 4, 30, -14, 4, 72, 55], [30, 8, 38, 18, 5, 76, 55]) },
];
