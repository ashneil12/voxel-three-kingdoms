# Vanguard local reconstruction pilot — 2026-09-28

## Decision

Promising visual reconstruction; **not yet an animation-ready or game-ready character**. Proceed with one cleanup/rigging experiment before the full character-art batch. Keep ideal art quality; change the reference format, not the ambition.

The new neutral A-pose model is visibly more faithful in layered armour form and limb separation than the earlier armed-pose baseline. Pose, source design, generation resolution and texture resolution all changed, so this is not a controlled pose-only comparison.

## Verified result

| | Existing armed baseline | New unarmed A-pose |
|---|---:|---:|
| Triangles | 199,804 | 376,667 |
| Embedded texture sizes | 2 × 1024² | 2 × 2048² |
| GLB bytes | 9,392,832 | 31,497,856 |
| Meshes / nodes | 1 / 2 | 1 / 2 |
| Skins / animations | 0 / 0 | 0 / 0 |

New generation completed locally with exit code 0. Tool-reported generation and baking time: 686.1 seconds, excluding initial pipeline loading. Imported successfully into the project's Three.js version, with no captured browser errors. Front, both sides, back, three-quarter, and front/rear clay views were inspected. Render-download control was verified against actual downloaded PNGs.

GLB SHA-256: `5b3fcc2b6f373a22ce73609a3a881fba4a9d80ab18556fe141cf408ffd105505`.

## Visual findings

- Broad silhouette, helmet/ear pods, chest layering, shoulder armour, knee discs and boot shapes survive the reconstruction well enough to justify further work.
- Clear arm/torso and leg gaps; no weapon baked into the hand. Fingers and thumb silhouettes are more useful than the original closed armed pose, but are not proven deformation-ready.
- Small panel seams and bevels remain softer/noisier than the ideal image. Some fine detail comes from textures rather than clean geometry.
- Rear armour is coherent enough for inspection, but is inferred rather than matched to an approved rear reference.
- Rear thighs, waist and joint interiors show irregular/sliver-like surfaces in clay. Topological manifoldness and watertightness were not measured; visual inspection is not a topology certificate.
- The amber visor is not a functioning emissive game effect. Material separation, emission masks, and controlled roughness need production work.
- No semantic limb/armour/weapon nodes, skeleton, skin weights or animation clips. The mesh cannot simply replace the procedural animated rig as-is.
- No mobile performance acceptance, LOD work, combat animation, or game integration was attempted in this pilot. The current playable suit is unchanged by the pilot.

## What this tells us to make next

1. Approve a rear and side design for this exact suit, using the front as the identity anchor. Keep them as separate consistent views, not a collage passed into this single-image CLI.
2. Prove cleanup and animation on this suit: repair noisy joint geometry; lower the runtime density; build skeleton/weights or rigid armour attachments; test a deep elbow bend, raised arm, crouch, stride and weapon grip. Automated rigging is a possibility, not a validated capability of this setup.
3. Generate the lance separately, with a clear grip and no character or motion trail.
4. Only after these checks, expand to the five-class production collection in `ART-PRODUCTION.md`. Striker is the priority new class, with boxing-specific hands, guard and footwork.
5. Generate VFX as separate staged sequences, not baked costume features: anticipation, contact, dissipation. Keep sparks, dust, trails and fragments separable.

## Reproduce

Local installation: `/Users/ash/Projects/trellis-silicon`, port revision `d6a082581fa1bb235acc816c11093c923d61c7b9`; upstream submodule `75fbf0183001ed9876c8dbb35de6b68552ee08bd`.

From that installation, using a fresh output prefix to preserve this pilot:

```sh
HF_HUB_OFFLINE=1 BAKE_MAX_FACES=400000 .venv/bin/trellis-silicon \
  '/Users/ash/Projects/boxin game?/voxel-three-kingdoms/docs/art/production-pilot/vanguard-a-pose.png' \
  --pipeline-type 1024_cascade --texture-size 2048 --seed 42 \
  --output '/path/to/new-output-prefix'
```

The default low-VRAM mode was retained. No installation changes were needed. The new image prompt is saved in `reference-brief.md`; inspect metadata with `python3 inspect_glb.py vanguard-a-pose-hq.glb`.

Open the live local review at `http://localhost:8765/docs/art/production-pilot/`. The original armed model remains selectable for comparison. This viewer is a review tool, not an integrated game character.
