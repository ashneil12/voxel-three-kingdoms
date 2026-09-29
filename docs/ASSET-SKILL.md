---
name: trellis-combat-assets
description: Prepare static TRELLIS armour meshes for articulated Three.js combat characters, including offline joint-space conversion, reduction, integration, and motion acceptance. Use for generated exosuit or robot assets; not organic skinning or concept-image generation alone.
---

# Generated armour into combat

Treat a neural GLB as a static reconstruction, not a ready character. A convincing front render says nothing about its back, articulation, weapon grip, or frame cost. Preserve the source and make derived runtime assets reproducibly.

## Choose the representation

Armour is rigid, but a generated GLB is one fused surface with no real joints, so neither pure rigid cutting nor automatic whole-body skinning works:

- **Rigid pieces per joint** (first EXO attempt) leave cracks and spikes at every bent joint, because the generator never made gaps to hide the cuts.
- **Automatic nearest-bone skin weights** stretch plates and collapse joints.
- **What worked:** one mesh, weights from *measured joint boundaries* with very narrow *geodesic* (surface-distance) blends: about 2 cm at elbows and knees, under 1 cm at hips and shoulders, so almost every plate stays rigid and only the seam bends. Hip/skirt plates belong to the pelvis, not the thigh.

Measure the source's axes, scale and joint landmarks from an orthographic render with a height grid (the studio landmark tool). Put each cut at the mechanical pivot, not the visual edge of a plate. The source A-pose and rig joint frames must be related explicitly: inverse-bind = fit-length scale * inverse bone-frame rotation * translate(-pivot). Never derive attachment from whatever pose is active when an async load finishes. Keep engineered hands, feet, neck gasket and weapon when the source has open fingers or the wrong weapon.

**Change the generation stage first when you can:** generate the asset in a neutral pose with clear gaps between arms and torso and between thighs, and visibly distinct elbow, knee and hip mechanisms. Fused limbs are the root cause of most rigging pain.

## Build and inspect

- Bake classification, weights, component cleanup and reduction offline into a glTF skin whose joint nodes are named after rig joints. Runtime builds a SkinnedMesh with the rig's own joints as bones and an identity bind matrix; no runtime classification.
- Simplify the WHOLE mesh once (with the permissive flag to get past UV seams). Per-region simplification opens cracks at the borders.
- Delete bridge triangles between joints that are not skeleton neighbours (thigh to thigh, forearm to hip): generator noise that becomes long spikes when limbs part.
- Afterimages and glow shells must use the skinned pose: bake snapshots of the posed vertices; use detached skinned clones for scaled shells.
- Connectivity must weld positions across UV seams before detecting islands. Small UV charts are not necessarily loose fragments. Component thresholds are asset-specific and may remove legitimate details.
- Measure actual output triangles and bytes. UV seams can prevent ordinary simplification from reaching its requested ratio. Attribute-aware permissive simplification can help, but compare textured output and silhouette afterward. Never label a requested ratio as an achieved budget.
- Preserve material colour space and provide appropriate image-based lighting in both studio and game. Check for overlapping hidden fallback geometry before blaming the source mesh.
- Compare textured and clay views to distinguish baked paint noise from geometry defects. Preserve dense UV atlases until gutters are rebaked; naive downsampling can bleed dark texels into light armour. Replace genuinely unreliable mechanical interfaces with authored components when that preserves the intended design more reliably than deforming them.
- Shared cached geometry/materials belong to the asset cache. Per-instance disposal removes attachments and disposes only instance-owned geometry. Cancel stale loads before attaching. Rebuild trails/afterimages when the model changes.
- Confirm the browser is showing the current asset revision. Use content-versioned asset URLs during iteration; stale module caches can make correct edits appear ineffective.

## Acceptance

Verify across the complete clip set: finite skinned vertices and a triangle-edge stretch limit (about 6x rest length, looser for the dodge roll), weights summing to 1, pose-independent loading, budgets, failed-load fallback, instance cleanup. Review real engine contact sheets (`studio.html?sheet=<action>:<view>:<n>`, add `&surface=weights` to see joint blends). Locomotion clips are sampled by stride phase in radians, not 0..1. Inspect front, side, back and game-distance views in idle, running, guard, an extended strike, spin and dodge. Studio dodge must include the same root rotation/squash as gameplay, not just limb poses. Inspect the real game renderer too; match lighting sufficiently to expose differences.

Mechanical tests do not establish visual quality or combat feel. Save actual rendered evidence and report source surface artifacts separately. A skill can prevent known integration errors; it cannot guarantee a clean first neural generation. Do not promote an artifact to final art merely because it renders.

## Existing EXO implementation

When continuing Ash's EXO project, read `docs/ASSET-PIPELINE.md` and `docs/PRODUCTION-STATUS.md` in `/Users/ash/Projects/boxin game?/voxel-three-kingdoms` first. Its `tools/assets/prepare-vanguard.mjs` (skinning build; the old rigid one is kept as a .txt in docs/art/production-pilot) contains measured Vanguard-specific cuts and constants (`CUT_*`, `BLEND_*`), not a reusable humanoid classifier. Use `npm ci`, `npm run vanguard`, and `npm run verify` in that tools directory. Preserve the untouched source and the failed experiment as comparison evidence. Adjust landmarks and validate a new asset instead of blindly applying Vanguard's thresholds.
