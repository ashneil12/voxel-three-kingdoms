# EXO production status

## Target

The full game vision remains in `GAME-VISION.md`. The ideal art reference remains `art/art-direction.png`. Target: polished technological exosuits, readable close-range action, robot crowds and demanding bosses, distinct class builds and mission-earned upgrades. Keep supernatural/demonic material out; do not invent theological mechanics.

## Current milestone: Vanguard authored the original heroes' way

Vanguard (EXO-01) is now built like the original officers (`src/heroes/vanguard.js`): hand-authored fine voxels (1.25 cm body,
1.52 cm head) centred on the shared rig at its own proportions, so the shared spear moveset, two-hand IK grips and spring
chains fit him exactly as they fit Zhao Yun. Design follows the clean, lean T-pose reference: rounded ivory helmet with a
stepped navy crest and wraparound orange visor, layered navy chest plate with an orange chevron, lean dark waist, layered
ivory/navy hip plates on the thighs, chunky gauntlets, navy tabards front and back as spring chains. Run: his own two-hand
ready carry and run style (`run` / `carry` in the hero def); the shared clips are back to the original author's.
The sheet-reconstructed voxel model stays available as `?vanguard=sheet` for comparison; the skinned suit as the second card.

Studio (`/studio.html`): T-pose design check, secondary motion (tabards, pauldron swing), contact sheets (`?rows=`), pose
editor. Verified: contact sheets of idle/run/n1-n3/guard, scripted in-game run (combo, heavy, dodge, jump attack,
overdrive) with no console errors, combat-core tests 5/5.

Skills written from studying the original code: `voxel-hero-design` and `voxel-hero-animation` (`~/.claude/skills`, linked into
Claude and Codex): body budget measured on all five originals, detail/chain recipes, the strike recipe, timing tables.

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
