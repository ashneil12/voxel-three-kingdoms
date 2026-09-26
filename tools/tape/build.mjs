// On-chain (TapeOut / TapeKit) bundle: one minified game.js with three tree-shaken in,
// index.html, icon and HUD font — every byte on chain costs gas, so ship as few as we can.
// Usage (from this folder): npm i esbuild && node build.mjs
// Output: ../../dist/voxel-three-kingdoms-tape/ (upload this folder), .zip, and tape-manifest.txt (not uploaded).
import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

const root = path.resolve(import.meta.dirname, '../..');
const dist = path.join(root, 'dist');
const out = path.join(dist, 'voxel-three-kingdoms-tape');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

await build({
  entryPoints: [path.join(root, 'src/main.js')],
  outfile: path.join(out, 'game.js'),
  bundle: true, format: 'esm', minify: true, target: 'es2022', charset: 'utf8', legalComments: 'eof',
  alias: { 'three/addons': path.join(root, 'vendor/three/addons'), three: path.join(root, 'vendor/three/three.module.js') },
});

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html
  .replace(/<script type="importmap">[\s\S]*?<\/script>\n/, '')
  .replace('src="./src/main.js"', 'src="./game.js"')
  .replace('url(./src/ui/brush.woff2)', 'url(./brush.woff2)')
  // absolute off-chain URLs (share card) — gateways serve a bootstrap page to crawlers anyway
  .replace(/<meta (property|name)="(og:url|og:image[^"]*|twitter:image)"[^>]*>\n/g, '');
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.copyFileSync(path.join(root, 'icon.png'), path.join(out, 'icon.png'));
fs.copyFileSync(path.join(root, 'src/ui/brush.woff2'), path.join(out, 'brush.woff2'));

// macOS drops AppleDouble "._*" files next to everything on exFAT/FAT drives (like this repo's) — never upload those
const junk = (f) => f.startsWith('.');
for (const f of fs.readdirSync(out)) if (junk(f)) fs.rmSync(path.join(out, f));

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2' };
const rows = fs.readdirSync(out).filter((f) => !junk(f)).sort().map((f) => {
  const b = fs.readFileSync(path.join(out, f));
  return { f, size: b.length, mime: MIME[path.extname(f)], sha: crypto.createHash('sha256').update(b).digest('hex') };
});
const total = rows.reduce((s, r) => s + r.size, 0);
const lines = rows.map((r) => `${r.f}\t${r.size}\t${r.mime}\t${r.sha}`);
fs.writeFileSync(path.join(dist, 'tape-manifest.txt'),
  `# path\tbytes\tcontent-type\tsha256   (total ${total} bytes, ${Math.ceil(total / 24000)}+ chunks of 24000)\n${lines.join('\n')}\n`);
fs.rmSync(path.join(dist, 'voxel-three-kingdoms-tape.zip'), { force: true });
execFileSync('zip', ['-qrX', '../voxel-three-kingdoms-tape.zip', '.', '-x', '.*', '*/.*'], { cwd: out });
console.log(lines.join('\n') + `\ntotal ${total} bytes`);
