// Numeric debug / tuning URL parameters (?vox=, ?rig=, ?ae=, ?rain=, ?smoke=). The value comes from whoever wrote the URL:
// a non-number must not reach a shader (`#define HERO_KEY NaN` fails to compile, a NaN exposure is a black frame) and a
// huge one must not size an allocation (?rain=1e9). Missing / unparsable -> `def`; otherwise clamped to [min, max].
export function numParam(name, def, min, max, search = globalThis.location?.search ?? '') {
  const q = new URLSearchParams(search);
  if (!q.has(name)) return def;
  const n = Number(q.get(name));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
}
