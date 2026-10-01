// Painted-block surface for voxel heroes (art target: assets/reference/first-playable/lighting/). Reads the per-face `vuv`
// attribute written by vox() (u, v inside the voxel face, 1 + per-voxel hash) and adds, on top of whatever the material
// already does: a bevelled edge (bump from the face-edge distance), chipped paint that exposes dark steel / rust at edges,
// fine speckle and grime streaks, and per-block roughness variation. Geometry without `vuv` (spear, blade) is untouched.
// ?vox=0 turns it off; ?vox=<n> scales the strength.
const Q = new URLSearchParams(location.search);
const AMT = Q.has('vox') ? Number(Q.get('vox')) : 1;

const VERT_PARS = 'attribute vec3 vuv;\nattribute vec2 vsz;\nvarying vec2 vVsz;\nvarying vec3 vVuv;\nvarying vec3 vVoxPos;\n';
const FRAG_PARS = `varying vec2 vVsz;
varying vec3 vVuv;
varying vec3 vVoxPos;
uniform vec4 uVox;   // bevel, chip/wear, grime, speckle
float vxh(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vxn(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(vxh(i), vxh(i + vec3(1, 0, 0)), f.x), mix(vxh(i + vec3(0, 1, 0)), vxh(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(vxh(i + vec3(0, 0, 1)), vxh(i + vec3(1, 0, 1)), f.x), mix(vxh(i + vec3(0, 1, 1)), vxh(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
vec3 vxBump(vec3 pos, vec3 n, vec2 d, float fd) {
  vec3 sx = dFdx(pos), sy = dFdy(pos);
  vec3 r1 = cross(sy, n), r2 = cross(n, sx);
  float det = dot(sx, r1) * fd;
  if (abs(det) < 1e-12) return n;                       // degenerate derivatives (silhouette / helper pixels): keep the flat normal
  vec3 g = sign(det) * (d.x * r1 + d.y * r2), b = abs(det) * n - g;
  float l = dot(b, b);
  return l > 1e-24 ? b * inversesqrt(l) : n;
}
float vxEdge, vxChip, vxN, vxOn;
`;

export function voxelSurface(mat, { bevel = 1, wear = 1, grime = 1, speck = 1, vox = 0.025 } = {}) {
  if (!AMT) return mat;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    sh.uniforms.uVox = { value: [bevel * AMT, wear * AMT, grime * AMT, speck * AMT] };
    sh.vertexShader = VERT_PARS + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vVuv = vuv; vVsz = vsz; vVoxPos = position / ' + vox.toFixed(5) + ';');
    sh.fragmentShader = FRAG_PARS + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        vxOn = step(0.5, vVuv.z);
        vec2 vq = min(vVuv.xy, vVsz - vVuv.xy);
        float ve = min(vq.x, vq.y);              // distance to the plate edge, in voxels
        float vpl = smoothstep(2.0, 4.5, max(vVsz.x, vVsz.y)) * smoothstep(2.0, 4.0, min(vVsz.x, vVsz.y));   // only real plates get a bevel / chips: thin lamellae stay clean
        float vbw = clamp(min(vVsz.x, vVsz.y) * 0.3, 0.12, 0.7);   // bevel width follows the plate: thin lamellae keep a narrow lip
        float vfw = max(fwidth(ve), 1e-4);
        float vk = 1.0 - smoothstep(0.15, 0.6, vfw);                 // fade the bevel / chips out once a voxel is only a few px
        vxEdge = (1.0 - smoothstep(0.0, vbw, ve)) * vk * vxOn * vpl;
        float vh = vVuv.z * 91.7;
        float nA = vxn(vVoxPos * 0.8 + vh), nB = vxn(vVoxPos * 1.9 + vh * 1.7), nC = vxn(vVoxPos * 0.22 + 3.1);
        vxN = nA;
        vxChip = clamp(vxEdge * smoothstep(0.5, 0.7, nA + (nB - 0.5) * 0.5), 0.0, 1.0) * uVox.y;
        float vlum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        vec3 vbare = mix(vec3(0.12, 0.115, 0.11), vec3(0.06, 0.055, 0.06), smoothstep(0.08, 0.4, vlum));   // bare steel stays dark on dark paint
        vbare = mix(vbare, vec3(0.5, 0.22, 0.07), smoothstep(0.6, 0.85, nC) * 0.55 * step(0.12, vlum));   // rust in the chips
        diffuseColor.rgb = mix(diffuseColor.rgb, vbare, vxChip);
        float vg = (smoothstep(0.35, 0.8, nC) * 0.45 + smoothstep(0.55, 0.9, vxn(vec3(vVoxPos.x * 1.7, vVoxPos.y * 0.2, vVoxPos.z * 1.7) + vh)) * 0.35) * uVox.z * 0.6 * vxOn;
        diffuseColor.rgb *= 1.0 - vg * (0.45 + 0.2 * (1.0 - clamp(vVoxPos.y * 0.02 + 0.5, 0.0, 1.0)));
        diffuseColor.rgb *= 1.0 + (nB - 0.5) * 0.06 * uVox.w * vxOn + (vVuv.z - 1.5) * 0.08 * vxOn;   // per-plate tone
        diffuseColor.rgb += vxEdge * (1.0 - vxChip) * 0.015 * uVox.x;   // lit-edge catch on painted corners`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + (vxN - 0.5) * 0.3 * vxOn + vxChip * 0.1, 0.3, 1.0);   // matte: chips and edges never sparkle`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          float vbe = min(min(vVuv.x, vVsz.x - vVuv.x), min(vVuv.y, vVsz.y - vVuv.y));
          float vbw2 = clamp(min(vVsz.x, vVsz.y) * 0.3, 0.12, 0.7);
          float vbh = smoothstep(0.0, vbw2, vbe);
          float hgt = (vbh * 0.5) * vxOn * smoothstep(2.0, 4.5, max(vVsz.x, vVsz.y)) * smoothstep(2.0, 4.0, min(vVsz.x, vVsz.y)) * (1.0 - smoothstep(0.15, 0.6, fwidth(vbe)));
          normal = vxBump(-vViewPosition, normal, vec2(dFdx(hgt), dFdy(hgt)) * uVox.x * 0.12, faceDirection);
        }`);
  };
  mat.customProgramCacheKey = () => (prevKey ? prevKey.call(mat) : '') + `|vox${AMT}-${bevel}-${wear}-${grime}-${speck}-${vox}`;
  return mat;
}
