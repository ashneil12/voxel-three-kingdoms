# EXO production status

## Target

The full game vision remains in `GAME-VISION.md`. The ideal art reference remains `art/art-direction.png`. Target: polished technological exosuits, readable close-range action, robot crowds and demanding bosses, distinct class builds and mission-earned upgrades. Keep supernatural/demonic material out; do not invent theological mechanics.

## Current milestone: usable Vanguard

Implemented: offline-generated armour preparation; 12 rigid generated joint regions and authored mechanical replacements; 47k-triangle generated armour; authored weapon grip; existing combat animation integration; asynchronous fallback/cancellation; rebuilt dodge afterimages; studio part/clay/paint inspection using game dodge transforms; metallic environment lighting in both renderers; revisioned asset loading from a hashed manifest.

Verified: the prepared GLB passes 2,323 sampled poses and asset/lifecycle checks; existing five combat-core tests pass. Browser studio inspections covered running, guard/back, wide sweep and dodge. A game deployment smoke check loaded the suit without recorded console errors. These checks are not a player evaluation of feel or full encounter acceptance.

Not art-final: remaining source noise, close-up cut seams and uncertain inferred back design. Not mobile-qualified: no mobile LOD/performance evidence. The full ideal game is not complete.

## Gates toward the complete game

1. **Character acceptance:** Ash plays this rigged suit. Fix observed grip, clipping, silhouette and readability defects. Close the source-surface/art-final gap before replicating the process across all classes.
2. **One complete mission:** modular industrial room kit, intentional arena connections, meaningful regular-enemy roles, elite reward, build-related upgrade choice, boss, extraction and replay. Preserve existing combat feel while making target priority matter.
3. **Replayable layouts:** assemble authored rooms with seeded variation and explicit connectivity, navigability, spawn and boss-arena checks. Avoid arbitrary random clutter in combat lanes.
4. **Build identity:** adapt existing class/move foundations. Striker is short-range, spacing/timing-sensitive and rewarding; other classes retain distinct range/control/defence identities. Upgrade choices modify mechanics rather than only multiplying damage.
5. **Production polish:** VFX/audio readability, accessibility, camera/input comfort, save/progression, performance budgets, measured LODs and device qualification. Expand areas and classes only with validated assets and encounters.

These are sequencing gates toward the full vision, not a reduced replacement for it. Do not start broad class generation while the character pipeline is still visually provisional.

## Reusable workflow

Local skill: `trellis-combat-assets` in `~/.codex/skills`. It records the demonstrated rigging failure modes and acceptance checks. Reproducible scripts stay versioned with the game under `tools/assets`; the skill points to them instead of maintaining a divergent copy. No first-generation visual success guarantee is made.
