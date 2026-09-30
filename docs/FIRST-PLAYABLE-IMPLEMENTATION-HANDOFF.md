# Future autonomous implementation brief
Prepared 30 September 2026. DORMANT: reference preparation does not authorize executing this build. Start only when Ash asks to build the first playable.

## Objective
Deliver the first playable specified in FIRST-PLAYABLE-PRODUCTION.md using the supplied reference pack and the full vision. End-to-end means a playable local mission, consistent characters and props, meaningful combat/reward/boss flow, usable camera/controls, validation and a reproducible launch. Do not silently narrow the full game's destination or expand this milestone into every mode.

## Read order
1. Current user/AGENTS instructions; inspect Git state and preserve unrelated work.
2. GAME-VISION.md, GAME-DESIGN-EXPANDED.md, FIRST-PLAYABLE-PRODUCTION.md.
3. assets/reference/first-playable/manifest.json, GENERATION-LOG.md, ART-REVIEW.md.
4. MODEL-VIEWER.md and current game source.
5. /Users/ash/.img2/SETUP-LOCAL.md, the symlinked img2threejs skill and its required stage-specific references; animated-character profile for moving rigs.
6. Current DEMO.md and historical production notes, recognizing their representation conflicts.

Source inventory was read on 30 September; paths and local tool versions may drift. Resolve repo identity before edits. Do not assert old browser/playtest evidence as verification of new work.

## Phase A — baseline and contracts
Identify which Vanguard representation Ash accepted and which currently loads in the game. The art preparation pass did not settle that by runtime comparison. Compare available source and real renders against the locked sheet; do not automatically replace the current suit or claim the TRELLIS-derived showcase is a new procedural mesh.
Record current combat controls, hit windows, guard/parry behavior, lock-on/camera and save behavior before changes.
Create a bounded requirements-to-code-to-evidence checklist for every phase. Preserve existing notices and licenses.

For each asset, expand its sheet/board into discrete asset specs. A catalog image is not a single scene-sized mesh. Use stable IDs matching the manifest, measured/proposed scale, local axes, named components, pivots, sockets, collision and material groups. Keep separate weapons attachable.
Use the pipeline's intake to determine suitability. Neutral views are construction evidence; action poses guide range/clearance. Do not feed an entire multi-panel sheet into a single-view solver as if it were one object. Choose/crop an authoritative view and keep the other panels as evidence. Log inferred hidden geometry.

## Phase B — prove the character adapter
Reuse existing viewer surfaces. Start with Vanguard baseline and a simple Grunt as the first new enemy. Establish one deterministic geometry/material/rig factory contract shared by viewer and runtime. Use bounded seed-based variation only after the base works.
Keep hard armour plates attached to intended joints with deliberate clearance; skin flexible connectors only where needed. Avoid silently moving an entire merged mesh into arbitrary joint spaces.
Use the actual img2threejs state/checklist. Initialize animated-character for moving subjects if no run exists; resume existing state with next.py. Do not copy the skill or pretend its gates passed.
Stages: silhouette/proportions → component hierarchy → form/material → motion/contact → optimization. Capture front, side, rear, opposite side and gameplay-distance views; play idle/run/turn/dodge/guard/attack/hurt/death as appropriate. Reject spikes, detached plates, grip loss, floating feet and severe joint collisions.
Freeze accepted geometry before additive binding where the active profile requires it, verify bind parity, and measure clips. Treat missing measurements as unverified. Keep pipeline hard stops explicit; no unbounded reconstruction loops.
Use evidence to establish triangle/draw-call/texture/rig budgets. Manifest complexity labels are relative design targets, not measured budgets.

## Phase C — environment and role-based enemies
Build the modular industrial kit and small outpost. Define consistent dimensions and collision primitives independently of decorative meshes. Preserve combat lanes and camera sightlines. Destructibles produce bounded pooled debris; debris never silently blocks mission progression.
Add Grunt, Gunner, Shield Carrier and Repair Drone, then Hunter and Enforcer.
Animation events drive active hitboxes/projectiles. Keep telegraph, active and recovery windows explicit. Enemy role logic belongs in simulation, not visual animation callbacks alone.
- Grunt: simple readable melee approach, windup, strike and recovery.
- Gunner: pre-fire tell, constrained lane, reposition after firing.
- Shield: frontal protection with vulnerable flank/rear; shield does not follow targets instantaneously.
- Repair: support enemy allies only; visible interruptible link, no hero healing implied by concept art.
- Hunter: anticipatory crouch/boost, committed dash strike, exploitable cooling recovery.
- Enforcer: component-aware shield/ram/reactor behavior, readable phase sequences and limited stagger.
Bound concurrent major attacks and prevent invisible immediate off-screen damage.

## Phase D — mission and reward
Connect authored spaces: outpost/deploy → opening crowd → shield/support formation → optional hunter branch → upgrade choice → escalation → boss → extraction/results/replay.
The optional branch must be skippable without making completion impossible.
Offer compatible reward choices with a fallback. First-slice module examples:
- Propulsion: movement opportunity after a defined successful evade or shorter bounded dash recovery.
- Capacitor: bounded impact storage from guard, consumed by one deliberate attack.
- Lance coil: a specific heavy branch gains a controlled secondary effect.
- Targeting: a marked/exposed component receives a conditional advantage.
Specify trigger, duration, cap, consumption, exclusions and boss interaction. A proc cannot recursively trigger itself. No dead option requiring an unequipped skill. Solo upgrade selection pauses threats safely.
Implement success/failure/retry and exactly-once reward claims. A short slice need not invent a complete account service or live economy. If persistent unlocks are included, use a versioned local save and handle old/corrupt data without silent progress destruction.

## Phase E — combat presentation and controls
Preserve existing useful input muscle memory. Optional lock-on assists targeted skills and frames the boss. Camera movement works without mouse and yields to manual input. Mobile-informed readability/button counts are required; a full mobile release is outside this milestone.
Effects originate from actual sockets/contact locations. No dragon damage with the dragon merely hidden. Telegraphed danger remains visible beneath player effects. Separate enemy warning hue/shape from cosmetic player trails.
HUD exposes health, guard, overdrive, relevant abilities, boss state, upgrade choice and optional target bracket. Use the generated HUD as hierarchy inspiration, not pixel-perfect generated text or a mandate to replace working interactions.

## Phase F — acceptance and handoff
Complete focused source tests, real browser load/render, motion and interaction checks at the actual game route. Record viewport/device/settings and representative crowd/boss performance. Do not claim desktop/mobile FPS from geometry counts alone.
Ash prefers handling feel playtesting. Automated interaction/visual checks establish functional evidence; clearly leave subjective balance/feel for Ash rather than calling it accepted.
Verify:
- New models match major reference identity features at gameplay distance and useful close views.
- Weapons grip and hit what the simulation says; no deformation explosions or load-pose dependence.
- All enemy roles can be countered by Vanguard; no infinite boss stun or unavoidable overlap.
- Optional encounter, upgrade, boss, defeat, extraction and replay work with no progression softlock.
- Camera needs no mouse; UI remains readable at representative smaller viewport.
- Repeated restart does not duplicate input listeners, rewards, objects or resource allocations.
- No unexpected paid API/cloud dependencies, new viewer or external service account.
Report the actual runnable URL/launch, changed scope, tests/runtime evidence, performance limits and remaining subjective review. Update DEMO/production status with evidence only after implementation.

## Implementation order
Vanguard baseline/adapter → Grunt → modular arena → Gunner → Shield → Repair → formation encounter → Hunter → upgrade system → Enforcer → mission completion → VFX/HUD/audio → integration/performance.
An asset may be worked on earlier for dependency reasons; do not parallelize edits to shared rig/render modules without explicit ownership.

## Non-goals of this milestone
Four additional playable frames, campaign-wide progression, full procedural world generation, co-op/PvP networking, shop/account services, generic editor development, full mobile certification and paid cloud pipelines. Their long-term design remains preserved.

## Future starter prompt
“Use docs/FIRST-PLAYABLE-IMPLEMENTATION-HANDOFF.md in /Users/ash/Projects/boxin game?/vg-game to build the first playable end to end. Read the manifest and art review first; reuse the current viewers and img2threejs pipeline; preserve existing work and the complete vision. Continue through actual playable acceptance, recording evidence and any unavoidable blockers.”
