// MSAA can interpolate a plane's edge UV slightly outside [0, 1]. A fractional
// power of the resulting negative value becomes NaN and poisons bloom/DOF.
// Repair only the known Foundry glow shader, without changing its authored light.
export function stabilizeEmissiveEdges(scene) {
  let repaired = 0;
  const seen = new Set();
  scene.traverse((object) => {
    for (const material of [object.material].flat().filter(Boolean)) {
      if (seen.has(material)) continue;
      seen.add(material);
      if (!material.isShaderMaterial || !material.uniforms?.uHot) continue;
      const source = material.fragmentShader;
      const bounded = source.replace('pow(1.0 - p.y, 2.4)', 'pow(max(1.0 - p.y, 0.0), 2.4)');
      if (bounded === source) continue;
      material.fragmentShader = bounded;
      material.needsUpdate = true;
      repaired++;
    }
  });
  return repaired;
}
