# Vanguard asset pipeline

## Representation

The playable Vanguard is **one smoothly skinned armour mesh** bound to the existing IK combat rig. The generated source stays at `docs/art/production-pilot/vanguard-a-pose-hq.glb`. The earlier rigid cut-and-attach build is kept as `docs/art/production-pilot/prepare-vanguard-rigid.mjs.txt` for reference (its cracks at knees, hips and shoulders are why it was replaced).

Runtime asset: `assets/vanguard/vanguard-combat.glb` (glTF skin: 17 joint nodes named after rig joints + inverse-bind matrices). Metadata and measured joint landmarks: `assets/vanguard/build-report.json`. At runtime `generated-suit.js` builds a `SkinnedMesh` whose bones are the rig's own joints, with an identity bind matrix, so no runtime classification or bind pose capture exists.

Build (`tools/assets/prepare-vanguard.mjs`): drop triangles in regions replaced by authored parts (hands, neck, feet) and detached crumbs; simplify the **whole** mesh once (no per-region cuts, so no cracks); label each vertex with its joint from measured boundaries (`CUT` constants: hip, knee, elbow); convert hard labels to narrow **geodesic blends** around each boundary (surface distance, so an arm never bleeds into the torso beside it); delete bridge triangles between joints that are not skeleton neighbours (surface noise that spikes when limbs part); write inverse-bind matrices that take source A-pose space into each joint's rest frame (limb along -Y, limb length fitted to the rig). Authored gloves, neck gasket, boots and lance stay rigid. Dark limb cores hide the interior where the hands and feet were removed.

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

Current measured armour output: see `build-report.json` (about 78k triangles / 21.6 MB, from 376,667 source triangles). Original 2048px atlases are retained: downsampling tightly packed UV charts without rebaking gutters harmed the paint. Authored replacement parts, lance, cores, shadows and afterimages add rendering cost; this figure is not total scene geometry. A lower-detail mobile LOD and compressed/rebaked texture delivery remain future work. Mobile performance has not been accepted.

## Motion and lifecycle checks

`verify-vanguard.mjs` loads the actual prepared GLB and checks: skin present, joint indices valid, per-vertex weights sum to 1, 160k triangle budget; then binds it to the real rig, samples 2,323 locomotion/attack/roll poses and (every 4th) skins every vertex and rejects non-finite positions and any triangle edge stretched more than 6x (12x in the dodge roll) beyond its rest length. It also checks pose-independent loading, that dodge afterimages bake from the skinned pose and dispose cleanly, and the manifest hash. It does not judge seam aesthetics or collision balance.

Contact sheets of real engine frames: `/studio.html?sheet=<action>:<view>:<count>` (optional `&surface=weights|clay|clean`, `&ty= &tx= &r= &yaw=` framing). `surface=weights` colours each vertex by its joint blend, which is the fast way to see a mislabelled region. Note `run` is sampled by stride phase, not 0..1.

Studio: `/studio.html`. The generated suit is the default. Code-built fallback: select it in the studio or open the game with `?suit=procedural`. The procedural paint and shape controls intentionally do not change the baked GLB. Vanguard uses the new asset; other classes remain unchanged.

The studio also offers clay inspection and an optional authored factory-paint preview on the same geometry. The factory-paint preview is not the game's default and does not establish art approval. Individual generated parts can be isolated. Saved PNG names include representation, surface, camera, action and timeline position to keep evidence distinguishable.

Inspect front, side, back and gameplay distance. Sample idle, run, guard, wide sweep, heavy launcher, spin, overdrive and dodge; inspect transitions as well as midpoints. The studio now applies gameplay's whole-body dodge transform. Keep renders of the actual engine, not concept illustrations, as evidence.

## Lessons from the failed integrations

- Cutting one mesh into rigid per-joint pieces leaves visible cracks and spikes at every bent joint; skin one mesh with narrow geodesic blends instead, and keep hip/skirt plates on the pelvis (a wide blend there shears them in kicks and rolls).
- Simplify the whole mesh once. Simplifying per region lets the borders collapse differently and opens cracks. The `Permissive` flag is needed to get past UV seams.
- Bridge triangles between non-neighbouring joints (thigh to thigh, forearm to hip) come from the generator and become long spikes: delete them.
- The run pose is driven by stride phase in radians; sampling it 0..1 shows a fraction of one step.

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
