import { chromium } from 'playwright';
import fs from 'fs';
const img = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const BR = "'Xingkai SC','STXingkai',serif", KAI = "'Kaiti SC','STKaiti',serif", SANS = "'Avenir Next','PingFang SC',sans-serif";
const seal = (t, sz = 34) => `<span style="display:inline-block;vertical-align:middle;font:700 ${sz}px/1.05 ${BR};writing-mode:vertical-rl;padding:${sz * 0.25}px ${sz * 0.18}px;border-radius:5px;background:#b3261e;color:#f8e6d2;box-shadow:inset 0 0 0 3px #b3261e,inset 0 0 0 5px rgba(248,230,210,.75)">${t}</span>`;
const heroes = [
  ['zhaoyun', '趙雲', '常山', '龍膽亮銀槍', '槍術 · 迅捷', 'ZHAO YUN', '常山龍膽・青龍衝陣'],
  ['guanyu', '關羽', '武聖', '青龍偃月刀', '重刀 · 剛猛', 'GUAN YU', '青龍偃月・天斬'],
  ['zhangfei', '張飛', '燕人', '丈八蛇矛', '蠻力 · 怒吼', 'ZHANG FEI', '燕人咆哮'],
  ['zhugeliang', '諸葛亮', '臥龍', '白羽扇', '羽扇 · 遠程', 'ZHUGE LIANG', '東風・八陣'],
  ['lubu', '呂布', '飛將', '方天畫戟', '無雙 · 霸體', 'LÜ BU', '天下無雙・神鬼亂舞'],
];
const pages = {};
for (const [id, zh, sl, wp, role, en, mu] of heroes) {
  pages[`name_${id}`] = `<div style="position:absolute;left:0;top:190px;width:900px;height:390px;background:linear-gradient(90deg,rgba(10,6,4,.82),rgba(10,6,4,.55) 60%,rgba(10,6,4,0))"></div>
    <div style="position:absolute;left:110px;top:225px;color:#f7f1e8">
      <div style="font:700 170px/1 ${BR};letter-spacing:14px;text-shadow:7px 8px 0 rgba(0,0,0,.6)">${zh}${seal(sl, 40)}</div>
      <div style="font:600 26px/1 ${SANS};letter-spacing:.7em;margin:18px 0 0 8px;opacity:.85">${en}</div>
      <div style="font:600 44px/1 ${KAI};letter-spacing:8px;margin-top:34px;color:#ffe7a3">${wp}<span style="color:#f4ead8;opacity:.8;margin-left:28px;font-size:36px">${role}</span></div></div>`;
  pages[`mu_${id}`] = `<div style="position:absolute;left:50%;bottom:270px;transform:translateX(-50%);padding:14px 46px;background:linear-gradient(90deg,rgba(10,6,4,0),rgba(10,6,4,.78) 18%,rgba(10,6,4,.78) 82%,rgba(10,6,4,0));white-space:nowrap;color:#fff4e0">
      <span style="font:700 34px/1 ${KAI};color:#f2c14e;letter-spacing:6px">真・無雙</span><span style="font:700 60px/1 ${BR};letter-spacing:8px;margin-left:26px;text-shadow:3px 4px 0 rgba(0,0,0,.6)">${mu}</span></div>`;
}
const section = (big, sub) => `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(transparent 36%,rgba(10,6,4,.72) 44%,rgba(10,6,4,.72) 58%,transparent 66%)">
  <div style="font:700 150px/1 ${BR};letter-spacing:26px;color:#fff4e0;text-shadow:7px 8px 0 rgba(0,0,0,.6),0 0 50px rgba(200,40,20,.55)">${big}</div>
  <div style="font:600 30px/1 ${SANS};letter-spacing:.55em;margin-top:24px;color:#f2dcb8">${sub}</div></div>`;
pages.sec_heroes = section('五將群英', 'FIVE HEROES · EACH WITH THEIR OWN MOVES & MUSOU');
pages.sec_boss = section('三英戰呂布', 'BOSS BATTLE · HULAO GATE');
pages.sec_stages = section('三處戰場', 'THREE BATTLEFIELDS');
const place = (zh, t, en) => `<div style="position:absolute;left:110px;bottom:120px;color:#f7f1e8;text-shadow:5px 6px 0 rgba(0,0,0,.6)">
  <div style="font:700 130px/1 ${BR};letter-spacing:14px">${zh}<span style="font:700 44px/1 ${KAI};margin-left:30px;letter-spacing:6px;color:#ffe7a3">${t}</span></div>
  <div style="font:600 26px/1 ${SANS};letter-spacing:.6em;margin:16px 0 0 8px;opacity:.85">${en}</div></div>`;
pages.pl_changban = place('長坂坡', '黃昏 · 魏軍', 'CHANGBAN · DUSK');
pages.pl_hulao = place('虎牢關', '白晝 · 董卓軍', 'HULAO GATE · DAY');
pages.pl_chibi = place('赤壁', '夜戰 · 火攻連環船', 'RED CLIFFS · NIGHT');
pages.sel = `<div style="position:absolute;right:90px;bottom:90px;font:700 64px/1 ${BR};color:#fff4e0;letter-spacing:10px;text-shadow:5px 6px 0 rgba(0,0,0,.6)">選將 · 選戰場</div>`;
// full-frame cards
const card = (bg, extra) => `<img src="${img(bg)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,rgba(10,6,4,.45),rgba(10,6,4,.9))"></div>
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#f7f1e8">
    <div style="font:700 250px/1 ${BR};letter-spacing:26px;text-shadow:9px 11px 0 rgba(0,0,0,.6)">體素三國${seal('群英', 54)}</div>
    <div style="font:600 36px/1 ${SANS};letter-spacing:.7em;margin-top:30px;opacity:.9">VOXEL THREE KINGDOMS</div>${extra}</div>`;
pages.title = card('/tmp/og/bg-lb-1900.png', `<div style="font:500 46px/1 ${KAI};letter-spacing:10px;margin-top:56px;color:#f2dcb8">一人獨闖千軍</div>`);
pages.end = card('/tmp/og/bg-gy-1900.png', `<div style="font:500 44px/1 ${KAI};letter-spacing:8px;margin-top:50px;color:#f2dcb8">五位武將 · 三處戰場 · 各有招式與無雙</div>
  <div style="margin-top:56px;font:700 44px/1 ${SANS};color:#1a120d;background:linear-gradient(#ffe7a3,#f2c14e 55%,#c98a22);padding:22px 44px;border-radius:10px;box-shadow:0 0 0 3px #5a3a10,0 12px 30px rgba(0,0,0,.5)">▶ voxel-three-kingdoms.vercel.app</div>
  <div style="font:500 28px/1 ${SANS};margin-top:26px;opacity:.75;letter-spacing:.15em">瀏覽器即玩 · 無需安裝 · PLAY IN YOUR BROWSER</div>`);
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
for (const [k, html] of Object.entries(pages)) {
  const full = k === 'title' || k === 'end';
  await p.setContent(`<body style="margin:0;width:1920px;height:1080px;position:relative;overflow:hidden;background:${full ? '#140d0a' : 'transparent'}">${html}</body>`);
  await p.waitForTimeout(250);
  await p.screenshot({ path: `/tmp/rec/cap/${k}.png`, omitBackground: !full });
}
await b.close(); console.log(Object.keys(pages).length, 'captions');
