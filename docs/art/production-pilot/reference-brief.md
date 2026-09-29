# Vanguard production reference pilot

This pilot tests the local TRELLIS.2 image-to-mesh route before generating the full ideal art collection. The earlier procedural suit and the Hermes helmet experiment are retained separately.

## Input

`vanguard-a-pose.png` is an AI-generated ideal-quality reference derived from the **left-hand** suit in `../art-direction.png`. It depicts one unarmed suit with an almost frontal camera, relaxed A-pose, visible hands, and gaps between limbs. It is concept art, not an engine render or proof of rig readiness.

The image is a proposed production design. Back, palms, soles and obscured joint interiors are not specified by it. Generated reconstruction of those areas is inference.

## Purpose of the experiment

- Preserve the original suit's ivory armour, petrol blue panels, amber visor, articulated mechanical frame and layered construction.
- Test silhouette and disconnected limb spaces without a weapon touching the hand.
- Inspect the resulting mesh from the front, side and rear, and inspect its skeleton, materials and topology.
- Use results to choose the reference format for all five classes, environments, props and effects.

## Existing local baseline

Hermes generated `/Users/ash/Projects/trellis-silicon/mech-07.glb` from a posed, armed suit reference using the default 512 pipeline. Inspection confirms one mesh, one primitive, 199,804 triangles, baked colour and metallic/roughness textures, no skins and no animations. It is a useful visual asset but has no separate semantic weapon/limb objects or animation rig.

## Generation prompt

Use case: stylized-concept.
Asset type: clean production reference for local image-to-3D reconstruction of an animation-ready game character.
Input image 1 is STYLE AND CHARACTER DESIGN REFERENCE, not an edit target. Reconstruct the LEFT-HAND IDEAL ART DIRECTION suit as one full-body neutral character reference. Use only that left suit's premium detailed design, never the simpler code-built right suit.
Subject: the same human-operated Vanguard exosuit: ivory ceramic-painted armour, muted petrol blue breastplate and outer forearm panels, graphite articulated mechanical underframe, concentric circular ear pods, compact enclosed sloped helmet with very thin amber V visor, sculpted sloped shoulder pauldrons, narrow layered waist, pistons, articulated gauntlets with five clear fingers per hand, shaped thigh armour, circular knee mechanisms, layered shin plates and segmented boots. Faithfully preserve the reference's heroic adult proportions and carefully designed layered surfaces.
Pose and camera: a symmetrical relaxed A-pose, front view with only a very slight 10-degree three-quarter turn, head upright and facing with torso, both arms straight and lowered about 35 degrees away from torso, palms angled forward, fingers relaxed and separately readable, legs straight and feet shoulder-width apart. Full body entirely visible including fingertips and both boot soles. Large clean negative-space gaps between hands and hips, arms and torso, and between legs. Balanced natural human anatomy within the suit, no bent combat pose.
Lighting and backdrop: uniform plain light warm-grey background, evenly lit neutral studio, soft minimal contact shadow, no pedestal. Model fills roughly 85 percent of image height with generous margins. Premium stylised 3D game character realism with subtle paint scuffs, sharp bevels and panel seams; physically plausible construction and restrained metal highlights. Maximum ideal art quality.
Constraints: ONE suit only, ONE view only, no weapon or shield or handheld prop, no accessories floating outside the body, no scenery, no inset views, no labels, no text, no concept-sheet layout, no floor grid, no dramatic glow, no motion trails, no spiritual imagery or occult symbols, no horns. This will be the actual input image to a single-image 3D model generator, so silhouette separation and clear joint structure matter.
