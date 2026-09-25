// usage: node rec.mjs <spec.mjs> <segment> <video|audio> [outdir]
// video: virtual clock, 30 fps, one screenshot per frame (1920x1080) · audio: real time, records the game's own mix
import { chromium } from 'playwright';
import fs from 'fs';
const [specFile, segName, mode, outRoot = '/tmp/rec'] = process.argv.slice(2);
const { segments } = await import(specFile);
const seg = segments.find((s) => s.name === segName);
const out = `${outRoot}/${segName}`; fs.mkdirSync(out, { recursive: true });
const VIDEO = mode === 'video', W = VIDEO ? 1920 : 960, H = VIDEO ? 1080 : 540;
const b = await chromium.launch({ channel: 'chrome', headless: true,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: W, height: H } });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
if (VIDEO) await p.addInitScript(() => {
  let vt = 0; const q = [];
  window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
  performance.now = () => vt;
  window.__tick = (ms) => { vt += ms; for (const cb of q.splice(0)) cb(vt); };
});
else await p.addInitScript(() => {
  const oc = AudioNode.prototype.connect;
  window.__chunks = [];
  AudioNode.prototype.connect = function (dst, ...a) {
    const r = oc.call(this, dst, ...a);
    if (dst instanceof AudioDestinationNode && this.context instanceof AudioContext) {
      const c = this.context;
      if (!c.__msd) {
        c.__msd = c.createMediaStreamDestination();
        const rec = window.__recorder = new MediaRecorder(c.__msd.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 });
        rec.ondataavailable = (e) => window.__chunks.push(e.data);
        rec.start(200); window.__recT0 = performance.now();
      }
      oc.call(this, c.__msd);
    }
    return r;
  };
});
await p.goto(`http://127.0.0.1:18770/${seg.url}${seg.url.includes('?') ? '&' : '?'}rec`);
await p.waitForTimeout(2500);
// scripted input keyed by sim frame (relative to the first step after the start), optional camera path
await p.evaluate(({ script, cam, setup }) => {
  let f0 = null; window.__map = [];
  const camFn = cam ? new Function('r', cam) : null;
  window.__onStep = (f) => {
    if (f0 === null) { f0 = f; window.__tF0 = performance.now(); if (setup) new Function('game', setup)(window.game); }
    const r = f - f0; window.__r = r;
    if (r % 30 === 0) window.__map.push([r, performance.now()]);
    for (const [at, type, code] of script) if (at === r) {
      if (type === 'eval') new Function('game', code)(window.game);
      else dispatchEvent(new KeyboardEvent(type === 'up' ? 'keyup' : 'keydown', { code, key: code, bubbles: true }));
      if (type === 'press') setTimeout(() => {}, 0), queueMicrotask(() => dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true })));
    }
    if (camFn) window.__view = camFn(r); else window.__view = null;
  };
}, { script: seg.script || [], cam: seg.cam || null, setup: seg.setup || null });
await p.keyboard.press('KeyX');                                  // wakes the audio (bank bakes while we wait)
await p.waitForTimeout(VIDEO ? 200 : 5000);
await p.keyboard.press('Enter');
const N = seg.frames;                                           // video frames at 30 fps (= 2 sim frames each)
if (VIDEO) {
  for (let i = 0; i < N; i++) {
    await p.evaluate(() => window.__tick(1000 / 30 + 0.001));
    fs.writeFileSync(`${out}/f${String(i).padStart(5, '0')}.jpg`, await p.screenshot({ type: 'jpeg', quality: 92 }));
    if (i % 60 === 0) process.stdout.write(`${i} `);
  }
} else {
  await p.waitForFunction((n) => (window.__r || 0) >= n, N * 2 + 30, { timeout: 0, polling: 100 });
  const b64 = await p.evaluate(() => new Promise((res) => {
    const r = window.__recorder; r.onstop = async () => { const blob = new Blob(window.__chunks, { type: 'audio/webm' });
      const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode(...buf.subarray(i, i + 32768)); res(btoa(s)); };
    r.stop(); }));
  fs.writeFileSync(`${out}/audio.webm`, Buffer.from(b64, 'base64'));
  const meta = await p.evaluate(() => ({ recT0: window.__recT0, tF0: window.__tF0, map: window.__map }));
  fs.writeFileSync(`${out}/audio.json`, JSON.stringify(meta));
  const m = meta.map, slope = (m.at(-1)[1] - m[0][1]) / (m.at(-1)[0] - m[0][0]);
  console.log(`offset ${((meta.tF0 - meta.recT0) / 1000).toFixed(3)}s  ms/simframe ${slope.toFixed(3)} (ideal 16.667)`);
}
const st = await p.evaluate(() => `kos ${window.game.hero.kos} hp ${window.game.hero.hp} pos ${window.game.hero.x.toFixed(2)},${window.game.hero.z.toFixed(2)}`);
console.log(`\n${segName} ${mode}: ${st} ${errs.slice(0, 3).join('; ') || 'no errors'}`);
await b.close();
