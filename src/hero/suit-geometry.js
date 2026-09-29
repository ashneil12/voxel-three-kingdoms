import * as THREE from 'three';

// Twelve-sided armour sections: broad fields, stepped corner facets, a genuine
// changing cross-section along the bone. Unlike an extrusion, these read in profile.
export function shell(sections) {
  const positions = [], indices = [];
  const profile=[[-.53,1],[.53,1],[.84,.87],[1,.52],[1,-.52],[.84,-.87],[.53,-1],[-.53,-1],[-.84,-.87],[-1,-.52],[-1,.52],[-.84,.87]];
  const sides=profile.length;
  for (const [y, w, depth, cx = 0, cz = 0] of sections) {
    for (const [x, z] of profile)
      positions.push(cx + x * w / 2, y, cz + z * depth / 2);
  }
  for (let r = 0; r < sections.length - 1; r++) for (let i = 0; i < sides; i++) {
    const a = r * sides + i, b = r * sides + (i + 1) % sides, c = a + sides, d = b + sides;
    indices.push(a,b,c,b,d,c);
  }
  for (let i = 1; i < sides-1; i++) { indices.push(0,i+1,i); const e=(sections.length-1)*sides; indices.push(e,e+i,e+i+1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); g.setIndex(indices);
  const flat = g.toNonIndexed(); g.dispose(); flat.computeVertexNormals(); return flat;
}
export function outline(points, depth = .02, bevel = .004) {
  const s = new THREE.Shape(); points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y)); s.closePath();
  const g = new THREE.ExtrudeGeometry(s,{depth, bevelEnabled:bevel>0, bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,steps:1,curveSegments:1});
  g.translate(0,0,-depth/2); return g;
}
export function chamferBox(w,h,d,b=.015) {
  return shell([[-h/2,w-b*2,d-b*2],[-h/2+b,w,d],[h/2-b,w,d],[h/2,w-b*2,d-b*2]]);
}
export function cable(points, radius=.008) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),16,radius,6,false);
}

// Analytic, object-space paint variation: deterministic in studio/game and no bitmap
// downloads. Camera fill is deliberately small; paint remains lit, not self-illuminated.
export function finish(material, painted = false) {
  material.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 vSuitLocal;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSuitLocal = position;');
    shader.fragmentShader = 'varying vec3 vSuitLocal;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      ${painted ? `float grain = fract(sin(dot(floor(vSuitLocal*1800.0),vec3(12.9898,78.233,41.31)))*43758.5453);
      float scratch = step(.982,fract(sin(dot(floor(vSuitLocal*vec3(230.,2200.,230.)),vec3(12.98,78.23,41.31)))*43758.5453));
      diffuseColor.rgb *= .94 + grain*.09;
      diffuseColor.rgb = mix(diffuseColor.rgb,vec3(.16,.18,.19),scratch*.24);` : ''}`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `outgoingLight += diffuseColor.rgb * .105;
      #include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=>`suit-finish-v2-${painted}`;
  return material;
}
