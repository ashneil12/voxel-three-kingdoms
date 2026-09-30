# First playable — production decisions and art handoff
Date: 30 September 2026. This task produces references and documentation only.

## Authority and scope
GAME-VISION.md remains the complete-game creative reference; GAME-DESIGN-EXPANDED.md records the detailed follow-up discussion. This document defines one milestone without shrinking the five-frame destination.
The supplied production brief is archived at art/first-playable/user-supplied-production-brief.txt as user-supplied planning material. Its factual claims were checked where practical, not copied as runtime evidence.
Locked style anchor: ../assets/reference/first-playable/characters/01_vanguard_character-sheet.png. Exact original also at art/first-playable/style-reference-vanguard.png. Do not regenerate or alter this source.

Production workspace for this pack: /Users/ash/Projects/boxin game?/vg-game. At inventory, it is a clean Git checkout with origin ashneil12/voxel-three-kingdoms and contains the current EXO documents, studio and demo. The neighboring voxel-three-kingdoms checkout remains separate. Recheck paths and Git state before future implementation.

## Current production choice
Use code-built Three.js geometry and img2threejs reconstruction guidance, with animation considered from component hierarchy onward. Preserve clear joints and weapon sockets. Improve proportions, silhouette, motion, materials, lighting and VFX before tiny surface detail.
The attached sheet is a style/construction anchor, not a command to reproduce every tiny voxel. Boxes, wedges, extruded/tapered armour and limited cylindrical joints can produce deliberate stylisation.
Full TRELLIS hero integration, rigid partitions, mesh-to-voxel and smoothing experiments have documented or user-reported quality/animation failures. Retain them as historical work; do not make them prerequisites. Sprites remain fallback. Cloud GPUs and Blender are not required for this chosen route.

Evidence caveat: the brief says a current code-built Vanguard proves the architecture. Local files show several representations: the game studio defaults to voxel; an editable procedural suit remains available; the showcase Vanguard is explicitly a TRELLIS-surface-derived TypeScript model marked placeholder in its registry. Their existence is verified from source, but this art pass does not certify a final accepted pure-procedural Vanguard or runtime motion. Do not convert the brief's optimism into a false acceptance claim.

## First-slice experience
Vanguard enters an occupied industrial district, clears approachable melee pressure, confronts a shield/gunner/repair formation, can pursue a propulsion hunter, gains one compatible mission upgrade, confronts a Factory Enforcer, and extracts/replays.
Only Vanguard must be production-ready for this milestone. Breaker, Bastion, Conductor and Striker retain their full long-term identities; their absence from this reference pack does not remove them from the game.
The reference pack covers six enemy roles, detachable equipment, district/outpost kits, machine/cover props, four upgrade families, two effect boards and one restrained HUD board.

## Proposed playable defaults for later execution
These are starting parameters, not calibrated balance:
- One authored district route with an optional specialist branch and reusable room connections.
- Grunts, gunners, shields and repair drones establish formation combat; optional hunter supplies movement technology.
- One reward event with three compatible choices; four concept module families exist so fallback selection has variety.
- Boss has shield, pile-driver and rear power system, clear windup/active/recovery, and finite stability.
- Retain working movement, lance combo, heavy branches, guard/counter, dodge, lock-on and optional assisted camera.
- Extract to a lightweight results/replay flow. Full inventory, campaign progression and networking are later milestones.
- Proposed short mission target 8–12 minutes; calibrate from actual play, not a hard design guarantee.

## Reference hierarchy
1. Locked original Vanguard governs hero style and silhouette.
2. Named neutral turnarounds govern construction; action/scenic panels convey motion/mood.
3. Per-asset manifest construction notes resolve ambiguous joints and left/right conflicts explicitly.
4. Dedicated weapon boards govern equipment details, preserving character-sheet silhouette and proportion.
5. GAME-DESIGN-EXPANDED.md governs behavior; illustrative repair beams hitting a hero do not authorize enemy healing of players.
Dimensions printed by image generation are illustrative. Relative scale in manifest is a proposed normalization, not measured CAD.

## Art review versus production acceptance
Every image gets a visual review for family fit, silhouette, buildable major forms, view consistency, articulation and noisy detail. Reference acceptance is not a 3D gate or Ash's final art approval.
Generated sheets can contain inferred rear details, markings drift and pose anomalies. Log them; correct structural contradictions or declare the precise construction authority. Never claim perfect orthographic consistency.
All new runtime assets remain not-started. Later implementation must validate genuine scene renders, motion, weapon contact, collision, performance and lifecycle.

## Delivery index
- Art manifest: ../assets/reference/first-playable/manifest.json
- Prompts and source provenance: ../assets/reference/first-playable/prompts.json and GENERATION-LOG.md
- Pack gallery/contact sheet: ../assets/reference/first-playable/README.md
- Existing viewer instructions: MODEL-VIEWER.md
- Later implementation brief: FIRST-PLAYABLE-IMPLEMENTATION-HANDOFF.md
- Expanded mechanics: GAME-DESIGN-EXPANDED.md

## Stop boundary
Do not implement characters, rigging, enemies, missions, upgrades, boss, environment code, combat changes, new viewers, Blender or RunPod in this art pass. The future implementation brief is dormant until Ash asks to build.
