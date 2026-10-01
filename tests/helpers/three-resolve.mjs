// Node test hook: resolve the bare 'three' specifier (and 'three/addons/...') to the vendored copy, the same mapping
// index.html's import map gives the browser, so render-side modules can be imported in node tests.
const ROOT = new URL('../../vendor/three/', import.meta.url);
export async function resolve(specifier, context, next) {
  if (specifier === 'three') return { url: new URL('three.module.js', ROOT).href, shortCircuit: true };
  if (specifier.startsWith('three/addons/')) return { url: new URL('addons/' + specifier.slice(13), ROOT).href, shortCircuit: true };
  return next(specifier, context);
}
