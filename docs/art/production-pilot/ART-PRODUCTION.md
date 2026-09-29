# Ideal art → usable game assets

Status: static reconstruction pilot reviewed; see `REVIEW.md`. Cleanup, rigging and game acceptance remain pending. This is a production-art brief, not a claim that the generated model is game-ready.

## Direction

Use the ideal reference's sculpted ivory armour, petrol-blue panels, charcoal mechanisms, amber functional lights, restrained wear, and physically plausible joints. No voxel fallback, supernatural effects, demonic motifs, or gore. Heroism comes from people and engineered equipment.

The first pilot is Vanguard because there is already a comparable model. Striker remains the personal-favourite class: compact boxing stance, free footwork, short reach, readable guard, powerful piston gauntlets, and precision counters. Do not quietly turn Striker into a ranged energy caster.

## Separate three kinds of reference

1. **Asset input:** one isolated subject, neutral pose, uncluttered background or clean alpha, complete silhouette, no text, effects, weapon occlusion, or cast shadow merged into the asset. One view per image. This local TRELLIS CLI conditions on one image; a turnaround collage is not a multi-view reconstruction input.
2. **Design turnaround:** consistent front, side, back, and three-quarter views, plus joint and material close-ups. These are design constraints and review evidence. Unseen surfaces generated from one image remain inferred until checked against an approved design. Independently generated views can contradict one another.
3. **Experience target:** action compositions, arena vistas, lighting moods, and VFX sequences. These establish the finished game's ambition, but should not be fed directly into the character reconstructor.

## Proposed ideal collection, after the pilot review

| Family | Required references |
|---|---|
| Vanguard, Breaker, Bastion, Conductor, Striker | Individual neutral full-body input; consistent turnaround; helmet, hands, joints, back mechanism; material palette; combat silhouette at gameplay scale |
| Weapons and devices | Separate isolated assets; attachment/grip orientation; deployed and stored state; moving parts; contact/attack purpose |
| Striker combat | Guard, jab, cross, hook, uppercut, slip, pivot, dash, perfect counter; readable anticipation/contact/recovery; no giant ranged punches |
| Robot enemies | Swarm, shield, repair, ranged, demolition, hunter; front/back design and size lineup; threat cues; weak points; disabled state without gore |
| Elites and bosses | Distinct silhouettes, exposed mechanisms, phase changes, telegraphed attacks, damage states; separate detachable components |
| Five regions | Industrial city, overgrown solar site, desert excavation, coastal shipyard, machine factory; arena overview and gameplay-camera view; modular architecture/prop kits |
| Workshop / settlement | Warm human refuge, repair bay, loadout station, community spaces; usable paths and readable interaction points |
| VFX | Per-effect anticipation, contact, dissipation; scale and duration notes; mechanical source; ground marks, sparks, dust, fragments, trails and warning shapes separated |
| Interface | Build selection, mission upgrades, class identity, threat/guard feedback; legibility at desktop and small-screen sizes |

Do not generate the whole collection before validating one complete asset route. Volume is not useful if source poses, materials or detail scale are incompatible with the pipeline.

## Model acceptance gates

- Inspect front, both sides, rear and close-ups in Three.js under consistent light.
- Inspect clay geometry: distinguish real armour form from painted highlights, seams and shadows.
- Check silhouette, proportions, thin parts, gaps, holes, merged hands and armour, and invented rear surfaces.
- Record actual triangles, textures, nodes, skins, bones and animation clips. A GLB loading successfully does not establish riggability.
- Before game replacement: repair/retopologize as needed; separate equipment; build a skeleton; assign weights or rigid armour attachments; verify shoulder, elbow, hip and knee motion; test combat poses and weapon grip.
- Produce a measured lower-detail game asset and LODs. A 400k-triangle review mesh is not an agreed mobile runtime budget.
- Keep the existing playable suit until a new asset passes animation and game integration checks.

## Current local pipeline constraints

TRELLIS.2 produces a textured static reconstruction, not a semantically separated, rigged suit. More input pixels and more generated triangles do not guarantee clean topology or faithful hidden surfaces. The pilot compares a new unarmed A-pose input with the existing armed-pose baseline, but also changes generation quality: any improvement cannot be attributed to pose alone.

Keep component licenses/provenance with the pipeline. The local README identifies different terms for TRELLIS, DINOv3 and RMBG; commercial clearance has not been established by this pilot. A transparent input can bypass the background-removal step in the inspected preprocessing implementation, but does not settle every dependency's terms.
