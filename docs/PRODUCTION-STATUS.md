# EXO production status

## Target

The full game vision remains in `GAME-VISION.md`. The ideal art reference remains `art/art-direction.png`. Target: polished technological exosuits, readable close-range action, robot crowds and demanding bosses, distinct class builds and mission-earned upgrades. Keep supernatural/demonic material out; do not invent theological mechanics.

## Current milestone: voxel Vanguard on the shared rig

Implemented: Vanguard is a ~24k-voxel hero built from the front/side/back sheet views (`tools/vanguard/`: `vanguard_parts.py` envelope boxes, `voxelize.py` silhouette carve + colour + side-view shift + mirror, `export_game.py` RLE per rig joint into `src/heroes/vanguard-data.js`, `diffview.py` ref-vs-model mismatch images). It uses the same rig, IK and clips as the other heroes via a per-hero `rigDim`; grips, stance and pivots are set on vertical limb chains. The earlier skinned mesh remains available as `VANGUARD_SKINNED` in `src/heroes/exosuit.js`.

Locomotion: run rebuilt (lance at the right hip, upright torso). Contact sheets of guard, dodge, jump, hurt, n1-n6 and c1-c6 reviewed on the voxel body with no gross clipping or lost grips; combat-core tests pass (5/5).

Rebuild: edit parts, then `python3 voxelize.py && python3 export_game.py` (see `tools/vanguard/README.md`).

Not art-final: head/ear-disc and pauldron shapes are stepped approximations; side/back silhouettes differ from the sheet in places (the sheet poses the right arm and spear); hips read slightly wide-stanced; overdrive/musou have no dedicated body pose; the inferred back design is unreviewed by art.

## Gates toward the complete game

1. **Character acceptance:** Ash plays this rigged suit. Fix observed grip, clipping, silhouette and readability defects. Close the source-surface/art-final gap before replicating the process across all classes.
2. **One complete mission:** modular industrial room kit, intentional arena connections, meaningful regular-enemy roles, elite reward, build-related upgrade choice, boss, extraction and replay. Preserve existing combat feel while making target priority matter.
3. **Replayable layouts:** assemble authored rooms with seeded variation and explicit connectivity, navigability, spawn and boss-arena checks. Avoid arbitrary random clutter in combat lanes.
4. **Build identity:** adapt existing class/move foundations. Striker is short-range, spacing/timing-sensitive and rewarding; other classes retain distinct range/control/defence identities. Upgrade choices modify mechanics rather than only multiplying damage.
5. **Production polish:** VFX/audio readability, accessibility, camera/input comfort, save/progression, performance budgets, measured LODs and device qualification. Expand areas and classes only with validated assets and encounters.

These are sequencing gates toward the full vision, not a reduced replacement for it. Do not start broad class generation while the character pipeline is still visually provisional.

## Reusable workflow

Local skill: `trellis-combat-assets` in `~/.codex/skills`. It records the demonstrated rigging failure modes and acceptance checks. Reproducible scripts stay versioned with the game under `tools/assets`; the skill points to them instead of maintaining a divergent copy. No first-generation visual success guarantee is made.
