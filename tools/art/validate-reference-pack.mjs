import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pack = path.join(root, 'assets/reference/first-playable');
const manifest = JSON.parse(fs.readFileSync(path.join(pack, 'manifest.json'), 'utf8'));
const errors = [];
const ids = new Set();
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
for (const asset of manifest.assets) {
  if (ids.has(asset.id)) errors.push(`Duplicate ID: ${asset.id}`);
  ids.add(asset.id);
  const file = path.resolve(pack, asset.reference);
  if (!file.startsWith(pack + path.sep)) { errors.push(`Escaping path: ${asset.id}`); continue; }
  if (!fs.existsSync(file)) { errors.push(`Missing reference: ${asset.id}`); continue; }
  const bytes = fs.readFileSync(file);
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') errors.push(`Not PNG: ${asset.id}`);
  if (hash(bytes) !== asset.sha256) errors.push(`Hash mismatch: ${asset.id}`);
  if (bytes.readUInt32BE(16) !== asset.width || bytes.readUInt32BE(20) !== asset.height) errors.push(`Dimension mismatch: ${asset.id}`);
  if (!['reference-only-existing-baseline-unverified', 'not-started'].includes(asset.implementationStatus)) errors.push(`Unexpected implementation claim: ${asset.id}`);
  for (const sub of asset.constituents || []) {
    if (ids.has(sub.id)) errors.push(`Duplicate constituent ID: ${sub.id}`);
    ids.add(sub.id);
  }
}
const anchor = fs.readFileSync(path.join(pack, 'characters/01_vanguard_character-sheet.png'));
const anchorCopy = fs.readFileSync(path.join(root, 'docs/art/first-playable/style-reference-vanguard.png'));
if (hash(anchor) !== manifest.lockedAnchorSha256 || hash(anchor) !== hash(anchorCopy)) errors.push('Locked anchor mismatch');
for (const doc of manifest.requiredDocuments) if (!fs.existsSync(path.join(root, doc))) errors.push(`Missing document: ${doc}`);
console.log(JSON.stringify({ ok: errors.length === 0, referenceImages: manifest.assets.length, namedIdsIncludingConstituents: ids.size, scope: 'file integrity and metadata only; visual review is separate', errors }, null, 2));
process.exitCode = errors.length ? 1 : 0;
