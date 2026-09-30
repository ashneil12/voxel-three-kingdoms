# EXO production status

## Target

The full game vision remains in `GAME-VISION.md`. The ideal art reference remains `art/art-direction.png`. Target: polished technological exosuits, readable close-range action, robot crowds and demanding bosses, distinct class builds and mission-earned upgrades. Keep supernatural/demonic material out; do not invent theological mechanics.

## Current milestone: sheet-reconstructed voxel Vanguard (default), two alternates kept

Default Vanguard (`src/heroes/vanguard-sheet.js`, data `vanguard-data.js`) is the original build: the character sheet's front/side/back views on a 15 px = 1 voxel
grid → silhouette-carved hand-authored envelope → per-region side shift → mirror → RLE voxels per rig joint (`tools/vanguard/`: `vanguard_parts.py`, `voxelize.py`,
`export_game.py`, `diffview.py`), with its own rig proportions (`rigDim`), lengthened legs/torso/forearms (export `STRETCH` table), smaller head, `hipLift`, tuned lighting,
and a two-hand ready run (`run` / `carry` in the hero def). The shared animation clips are the original author's.
Alternates (same studio/game, pick with the URL): `?vanguard=ref` — boxes per joint from the T-pose turnaround through the img2threejs pipeline (`tools/vanguard-ref/`,
unchanged rig, tabard chains); `?vanguard=authored` — hand-authored fine voxels on the original rig. The skinned suit remains the second card.
Ash's call (2026-09-30): the sheet reconstruction was better than both later rebuilds; keep that process.

Studio (`/studio.html`): T-pose design check, secondary motion, contact sheets (`?rows=`), pose editor. Verified: contact sheets of idle/run/n1/n3, combat-core tests 5/5.

Not art-final: helmet profile is still boxier than the reference; no own moveset yet (Vanguard uses Zhao Yun's spear set); detail density ~100 boxes vs 65-275 on the originals; not yet played by Ash with the rebuild.

## Gates toward the complete game

1. **Character acceptance:** Ash plays this rigged suit. Fix observed grip, clipping, silhouette and readability defects. Close the source-surface/art-final gap before replicating the process across all classes.
2. **One complete mission:** modular industrial room kit, intentional arena connections, meaningful regular-enemy roles, elite reward, build-related upgrade choice, boss, extraction and replay. Preserve existing combat feel while making target priority matter.
3. **Replayable layouts:** assemble authored rooms with seeded variation and explicit connectivity, navigability, spawn and boss-arena checks. Avoid arbitrary random clutter in combat lanes.
4. **Build identity:** adapt existing class/move foundations. Striker is short-range, spacing/timing-sensitive and rewarding; other classes retain distinct range/control/defence identities. Upgrade choices modify mechanics rather than only multiplying damage.
5. **Production polish:** VFX/audio readability, accessibility, camera/input comfort, save/progression, performance budgets, measured LODs and device qualification. Expand areas and classes only with validated assets and encounters.

These are sequencing gates toward the full vision, not a reduced replacement for it. Do not start broad class generation while the character pipeline is still visually provisional.

## Reusable workflow

Local skill: `trellis-combat-assets` in `~/.codex/skills`. It records the demonstrated rigging failure modes and acceptance checks. Reproducible scripts stay versioned with the game under `tools/assets`; the skill points to them instead of maintaining a divergent copy. No first-generation visual success guarantee is made.
