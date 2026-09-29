# Vanguard asset pipeline

## Representation

The playable Vanguard uses prepared rigid textured armour attached to the existing IK combat rig. The generated source is retained at `docs/art/production-pilot/vanguard-a-pose-hq.glb`. The rejected runtime skin experiment is preserved as `docs/art/production-pilot/hermes-skin-experiment.js`.

Runtime asset: `assets/vanguard/vanguard-combat.glb`. Source metadata and measured joint landmarks: `assets/vanguard/build-report.json`. The source has no authored skeleton or animations. This implementation deliberately uses mechanical articulation; it is not a general automatic humanoid skinning system.

The build retains 12 generated joint regions, removes detached tiny components, converts source A-pose coordinates into destination joint coordinates, then performs attribute-aware simplification. Authored gloves, upper-arm connectors, neck gasket and boots replace unreliable source regions. The gloves grip the existing powered lance. Narrow dark limb cores cover the interior without placing the old suit inside the new one. The source helmet, pauldrons, torso, forearm and leg armour supply the major visible surfaces.

## Rebuild

Node 22.23+ was used for the verification script's module resolution hooks.

```sh
cd tools/assets
npm ci
npm run vanguard
npm run verify
node --test ../../tests/combat-core.test.mjs
```

The build is offline and takes seconds once dependencies are installed. No Blender or paid generation service is needed for this preparation pass. `prepare-vanguard.mjs` also works when invoked by its path from the repository root. The runtime reads the build report and versions its asset URL by the output SHA automatically. The verification script checks actual file bytes and hash against that report. Do not overwrite the untouched source.

Current measured generated armour output: **128,717 triangles / 22,480,520 bytes**, from **376,667 source triangles / 31,497,856 source bytes**. Original 2048px atlases are retained: downsampling tightly packed UV charts without rebaking gutters harmed the paint. Authored replacement parts, lance, cores, shadows and afterimages add rendering cost; this figure is not total scene geometry. A lower-detail mobile LOD and compressed/rebaked texture delivery remain future work. Mobile performance has not been accepted.

## Motion and lifecycle checks

`verify-vanguard.mjs` loads the actual prepared GLB, validates indices/finite attributes and a 160k armour budget, attaches the named parts to the actual rig, samples 2,323 locomotion/attack poses, checks finite bounded transforms, checks pose-independent attachment and afterimage disposal. It does not judge seam aesthetics or collision balance.

Studio: `/studio.html`. The generated suit is the default. Code-built fallback: select it in the studio or open the game with `?suit=procedural`. The procedural paint and shape controls intentionally do not change the baked GLB. Vanguard uses the new asset; other classes remain unchanged.

The studio also offers clay inspection and an optional authored factory-paint preview on the same geometry. The factory-paint preview is not the game's default and does not establish art approval. Individual generated parts can be isolated. Saved PNG names include representation, surface, camera, action and timeline position to keep evidence distinguishable.

Inspect front, side, back and gameplay distance. Sample idle, run, guard, wide sweep, heavy launcher, spin, overdrive and dodge; inspect transitions as well as midpoints. The studio now applies gameplay's whole-body dodge transform. Keep renders of the actual engine, not concept illustrations, as evidence.

## Lessons from the failed integrations

- Source-space vertices attached to target bones still retain A-pose offsets. Convert into each joint frame before attachment.
- Asynchronous loading must not capture the current combat pose as its bind pose.
- Splitting a plate across independently rotating regions exposes cracks. Move the partition boundary around the whole plate.
- Finger remnants below the wrist band were incorrectly assigned to legs. Remove the full source-hand footprint.
- Oversized fallback understructure can occlude the new face and pauldrons. Retain only purpose-built gloves/weapon and narrow internal connectors.
- UV seams limited ordinary simplification to roughly 155k triangles. Attribute-aware permissive reduction reached the actual 59k result; texture and silhouette still require review.
- Metallic materials need environment lighting in the game as well as the studio.
- Browser caching concealed edits during iteration. Version the generated asset and changed module imports and verify visible revision metrics.

## Remaining quality limits

The generated source contains rough surface detail and inferred rear armour. This build does not establish that those details match the ideal concept exactly. Rigid partition seams are visible close up, especially around the hip/shoulder interfaces. A clean art-final asset will need region-specific surface repair or replacement of defective plates. Do not mass-generate all classes until this standard is accepted by Ash in motion.
