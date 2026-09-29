# EXO production status

## Target

The full game vision remains in `GAME-VISION.md`. The ideal art reference remains `art/art-direction.png`. Target: polished technological exosuits, readable close-range action, robot crowds and demanding bosses, distinct class builds and mission-earned upgrades. Keep supernatural/demonic material out; do not invent theological mechanics.

## Current milestone: skinned Vanguard, revised locomotion

Implemented: one smoothly skinned 78k-triangle armour mesh on the shared combat rig (geodesic joint blends, hip/knee/elbow cuts measured from the source, bridge-triangle removal, offline weights, hashed manifest); authored grip gloves, neck gasket, boots and lance; dark limb cores; afterimages and glow rim baked/skinned from the posed mesh; studio contact sheets and skin-weight view; metallic environment lighting in both renderers.

Locomotion: run rebuilt. The lance is now carried at the right hip, tip forward-up, instead of trailing behind the head; torso upright with a smaller lean, hips higher so the knees are not permanently crouched, less spear sway. The dodge roll keeps the lance forward so it flows out of the new carry. Attack clips are unchanged.

Verified: prepared GLB passes 2,323 sampled poses with a stretch check (`npm run verify`), combat-core tests, studio contact sheets of run, dodge, n1, c1 and idle, and a real game session (deploy, run, dodge; no console errors). Not verified: player feel, attack pose quality beyond the sampled sheets, guard/parry, boss and enemy interaction, mobile performance.

Not art-final: remaining source noise in the paint, the inferred back design, spear-blade carry clipping through enemies (visual only), thin dark limb cores where the generator left gaps.

## Gates toward the complete game

1. **Character acceptance:** Ash plays this rigged suit. Fix observed grip, clipping, silhouette and readability defects. Close the source-surface/art-final gap before replicating the process across all classes.
2. **One complete mission:** modular industrial room kit, intentional arena connections, meaningful regular-enemy roles, elite reward, build-related upgrade choice, boss, extraction and replay. Preserve existing combat feel while making target priority matter.
3. **Replayable layouts:** assemble authored rooms with seeded variation and explicit connectivity, navigability, spawn and boss-arena checks. Avoid arbitrary random clutter in combat lanes.
4. **Build identity:** adapt existing class/move foundations. Striker is short-range, spacing/timing-sensitive and rewarding; other classes retain distinct range/control/defence identities. Upgrade choices modify mechanics rather than only multiplying damage.
5. **Production polish:** VFX/audio readability, accessibility, camera/input comfort, save/progression, performance budgets, measured LODs and device qualification. Expand areas and classes only with validated assets and encounters.

These are sequencing gates toward the full vision, not a reduced replacement for it. Do not start broad class generation while the character pipeline is still visually provisional.

## Reusable workflow

Local skill: `trellis-combat-assets` in `~/.codex/skills`. It records the demonstrated rigging failure modes and acceptance checks. Reproducible scripts stay versioned with the game under `tools/assets`; the skill points to them instead of maintaining a divergent copy. No first-generation visual success guarantee is made.
