# EXO: Hold the Line — expanded design
Date: 30 September 2026. Design discussion consolidated for Ash.
Authority: GAME-VISION.md retains the complete-game vision. This document develops the proposals from the subsequent conversation; exact timings, counts and balance values are provisional. FIRST-PLAYABLE-PRODUCTION.md bounds the first milestone. No feature described here is claimed implemented.

## Experience and session loop
Deploy with an enjoyable fighting style, recover technology that changes it, overcome purposeful robot formations, defeat a commanding machine, return with lasting discoveries. Combat should be immediately satisfying and increasingly expressive with mastery. Skilled players can tackle difficulty above their expected equipment strength.

An occupied industrial district opens with approachable melee groups. Shield carriers protect repair drones while gunners cover lanes. An optional propulsion hunter offers movement technology. A chosen upgrade changes the approach to the Factory Enforcer. The return to a warm workshop produces both tangible rewards and a reason to try another build.

## Pilot and five frames
One continuing resistance pilot learns and customizes different exosuits. A frame is a recognizable combat identity, not a color swap. Keep all five foundations in the complete vision.

| Frame | Foundation | Play identity | Skill demand | Build directions |
| --- | --- | --- | --- | --- |
| Vanguard | Zhao Yun | Lance reach, thrusts, vaults and sweeps | Spacing and safe engagement paths | Precision duelist, mobile lancer, crowd control |
| Breaker | Guan Yu | Powered heavy blade, armor fracture, committed impact | Timing larger openings | Charged strikes, demolition, cleaves |
| Bastion | Zhang Fei | Hold ground, shoulder charge, store pressure and counter | Guard economy and avoiding encirclement | Counter, juggernaut, disruption |
| Conductor | Zhuge Liang | Drones, projectors, electrical links and space control | Preparation while remaining active | Drones, chaining, concentrated beams |
| Striker | Lu Bu, substantially reworked | Short-range boxing, footwork, fast advancing combinations | Distance, timing, maintaining pressure safely | Counter boxer, sustained combo, burst |

Striker is Ash's preferred close-combat fantasy. Lu Bu's aggression is inspiration; halberd-sized hitboxes must not survive beneath gauntlet animations. Striker requires new motion and contact shapes. Bastion is planted and forceful; Striker is mobile and precise. All frames must be viable solo, including against essential encounter mechanics.

## Combat grammar
Shared vocabulary: basic attack, heavy branch, evade, guard/counter, two proposed skill slots, overdrive and optional lock-on. Preserve the source game's feel and manageable controls. The existing demo also has jump; retain it until a deliberate design decision replaces it.

Basic strings have branches rather than endless identical attacks. Striker examples: early heavy body blow damages stability; late heavy uppercut rewards a longer opening; evade-to-attack re-enters at a new angle; counter-to-heavy commits to a punish. Each frame interprets the same inputs with distinct rhythm.

Fast moves can permit defensive cancels; powerful finishers retain commitment. Define cancellation windows explicitly against simulation frames and attack events. Ordinary movement and attacks do not continuously consume a resource that prevents participation. Major opportunities use bounded resources.

Hit feedback combines anticipation, physical contact, brief local hit-stop where appropriate, readable reactions, sound and restrained VFX. Damage timing follows actual weapon contact. Crowd launches must not make important targets unreachable or hide boss warnings.

## Defense and fairness
Guard: frontal damage mitigation consuming stability, with chip damage and increased drain from heavy pressure. Recovery requires releasing guard; flank/rear attacks remain a positioning concern.
Evade: limited/recovering charges or an equivalent bounded system, primarily movement and angle control.
Counter: one short deliberate activation window. Continuing to hold returns to ordinary guard. Re-tapping cannot continually refresh perfect timing without cost/cooldown.
Ordinary machines can stagger from a counter. Boss counters contribute stability damage, interrupt a designated move or expose a brief opening; full boss stagger requires sufficient pressure. Use temporary resistance after a major stagger to prevent indefinite shutdown.

Separate blockable attacks, guard breakers and area hazards by motion, shape and sound, not color alone. Prevent unavoidable stun chains, overlapping full-screen tells, unseen immediate fire and excessive simultaneous major attackers. Accessibility timing assists may change difficulty but must be disclosed in challenge records where relevant.

## Resources
Health measures survival; guard/stability measures defensive pressure; reactor/overdrive rewards combat participation. Frame-specific mechanics should first reuse clear indicators and passive behavior rather than adding numerous bars. Exact values and recovery curves require playtesting.

## Persistent loadout
Proposed slots: frame, weapon variant within its family, two skills, one defensive system, three behavior modules. Counts remain tunable.
Frame supplies base movement and attacks. Weapon variant changes selected branches and handling. Skills provide intentional tools. Modules create interactions: marking, impact storage, energy conversion, stagger, movement or discharge.
Share general technology where compatible; retain frame-specific movement/weapon modules. No unrestricted animation mixing. Powerful options need tradeoffs, caps and explicit proc rules. A triggered effect must not retrigger itself indefinitely.

A build should be explainable in one sentence: absorb impact and spend it on a counter; tag priority machines and chain discharge through their formation; evade precisely to empower a close-range finisher.

## Mission upgrades
Significant foes, objectives and optional challenges supply technology with identifiable origins. Propulsion hunter → mobility; shield lieutenant → defense; artillery → discharge; targeting machine → weak-point interaction.
At milestones offer a small choice, provisionally three: direct loadout synergy, compatible new interaction, broadly useful fallback. Offer limited rerolls or salvage when all choices are undesirable. Route previews communicate reward families without promising an exact item.

Early upgrades establish a behavior; later ones specialize it. Striker example: timed evade stores one charge → heavy consumes charge → choose focused or spreading impact → stability break improves evade recovery. Temporary choices evolve the run rather than adding many buttons.
Ordinary kills supply modest salvage, energy and occasional recovery. Pause solo combat safely during a major reward choice; eventual co-op needs a separate shared reward/pause design.

## Enemy formations
Melee grunts pressure space and die satisfyingly. Shield carriers protect useful targets. Repair drones sustain allies. Gunners cover lanes. Propulsion hunters punish awareness failures and expose long recoveries. Additional complete-game roles can include spotters, demolition machines and suppressors.
Every tactical problem needs multiple answers. Vanguard reaches/circles, Breaker fractures, Bastion displaces, Conductor disrupts, Striker bypasses to eliminate support. These are advantages, not class gates.
Increase difficulty through composition, coordination and new move relationships plus bounded stat growth. Do not turn every basic enemy into a durable elite.

## Missions and procedural structure
Rhythm: arrival → momentum → tactical formation → route choice → reward → escalation → culminating encounter → extraction.
Objectives change priorities: disable defended relays; recover a moving machine; intercept a convoy; hold evacuation space; hunt a specialist.
Use authored combat spaces assembled into seeded routes. Vary connections, cover, encounters, hazards and reward placement. Validate reachability, traversable width, spawn safety, objective access, camera visibility and boss room suitability. Unbounded random clutter is not procedural quality.

Complete regions: industrial city, overgrown solar installation, desert excavation, coastal shipyard and machine manufacturing centre. Give each region distinct topology and threats, not only palettes.
Support short contracts and longer optional expeditions. Solo suspend/resume should preserve run state, seed and reward choices; loading must not duplicate rewards.

## Bosses
Factory Enforcer: large industrial chassis, shield assembly, hydraulic pile-driver, exposed rear power system. Component damage changes behavior and openings. Repair support is an occasional priority problem.
All frames earn opportunities: Striker exploits short gaps, Breaker larger commitments, Vanguard exposed components, Bastion designated counters, Conductor predictable space.
Phases build new sequences from readable attacks. Avoid frequent forced waiting and blanket invulnerability. Adds must serve a tactical purpose rather than compensate for a weak boss design.

## Permanent progression, farming and failure
Three axes: equipment discoveries, frame mastery and challenge/world access. Numerical growth is bounded so skill remains meaningful. Show likely sources of desired components; repeated attempts yield crafting progress.
Duplicates can salvage automatically. Free loadout changes, saved builds and a training space encourage experimentation.
Proposed failure rule: permanent gear, blueprints and earned mastery remain; temporary upgrades reset; checkpoint-secured rewards remain; unbanked salvage and completion rewards create stakes. No permanent equipment destruction or corpse-run obligation by default.
Reward handling needs stable IDs, versioned saves and one-time claim records. Explain defeat outcomes before deployment.

## Hub, world and values
A welcoming workshop supports both walkable atmosphere and direct menus. Rescued engineers, repaired facilities and returning residents make success visible. Story is brief, environmental and optional where practical.
Protect people, restore communities and use strength responsibly. Spectacular powers come from engineering. No demonic/occult imagery, divine intervention systems or theology-as-power progression. Optional respectful faith references are not assumed requirements.
No mandatory daily chores, aggressive monetization or online services as core design dependencies.

## Presentation and accessibility
Priorities: silhouette → animation → material/light separation → equipment/effects → micro-detail. Frame identity must survive gameplay distance.
Code-built 3D is the current preferred route (30 September production brief); sprite/2.5D is a fallback. Preserve older experiments and the earlier ideal-art images as history.
Camera works without a mouse, assists travel and optional lock-on, yields to manual adjustment, avoids cover occlusion. Controller and eventual mobile inputs inform button count and readable UI.
Include remapping, effects/shake intensity, readable contrast, shape-based tells and adjustable UI size. Do not claim mobile acceptance without measured device tests.
Audio: motor loading, mechanical locks, contact, directionally useful warning sounds, distinct successful block/counter feedback.

## Complete range of play
Campaign introduces systems and world; expeditions vary routes and rewards; boss challenges test mastery; endless defense supports sustained crowd combat. Eventual co-op rewards complementary openings while every frame remains solo-capable. PvP boxing remains a separate direction. Co-op requires explicit networking, authority, save/reward and difficulty design before implementation.

## Outstanding design decisions
Exact timings, stats, module counts, active-skill layout, mission duration, reward retention proportions, interaction caps, save schema, difficulty scaling and co-op authority remain proposals. Implement selected first-slice defaults only under the later build task, measure them and record revisions rather than retroactively claiming prior agreement.
