# Vanguard rig-friendly asset brief (for TRELLIS 2)

Goal: replace the single fused A-pose shell with clean rigid parts that match one style, so the rig only has to
rotate solid pieces around real mechanical joints. Keep the current Vanguard as the visual reference
(`docs/art/art-direction.png`, `docs/art/production-pilot/`).

## Rules for every image

- Same suit design, colours (ivory armour, blue panels, dark understructure, amber signal light), grime level and lighting in every image.
- Plain light-grey background, soft even light, no cast shadows on the background, orthographic-looking camera (no wide-angle distortion).
- Neutral pose, nothing touching: arms 30-40 degrees out from the torso, hands open or as specified, legs shoulder-width apart, feet flat. Generate one pose only; do not draw a dynamic pose.
- Elbow, knee, hip, shoulder and wrist mechanisms clearly visible as separate dark joint pieces (cylinder or ball), so cuts land on them.
- Symmetric where the design is symmetric; state asymmetries (the sensor pod, the "07" mark) explicitly.

## Assets, in priority order

1. **Lance (weapon).** Straight shaft on the Z axis, butt end left, blade end right, laid horizontal, side view then top view. Grip section with ribbed rings, two steel collars, amber accent, power receiver and blade as in the concept. Shaft radius about 2.5 percent of length. Generate alone.
2. **Fists (x2, gripping).** Closed gauntlet fist as if wrapping a 4 cm shaft, viewed from front, back, thumb side and pinky side, with a short wrist cuff. Fingers curl around an invisible cylinder whose axis is the vertical of the image. Left and right are mirrors: generate one and mirror it.
3. **Forearm + gauntlet (x2).** Elbow joint to wrist cuff only, hanging straight down in the image, views: outer, inner, front, back. One solid piece with a clear elbow pivot at the top and wrist cuff at the bottom. Mirror for the other side.
4. **Upper arm + shoulder joint.** Pauldron plus bicep sleeve to elbow, hanging straight down, four views.
5. **Body without arms.** Head, neck, torso, pelvis, both legs, boots. Arms removed at the shoulder ball, shoulder ball socket visible. Views: front, three-quarter front, side, three-quarter back, back. The back view must be drawn on purpose (heat sinks, back shells, power pack), not left to inference.

## Multi-view input

TRELLIS 2 accepts several images of one object. For each asset above give front, side, back and one three-quarter view drawn from the SAME design sheet, and generate all views in one image-model session so proportions agree. Reject any view set where a part changes shape between views.

## Acceptance before it reaches the game

Run each result through the same checks the current Vanguard uses: measure joint landmarks against a height grid, budget under 60k triangles per body and under 10k for a fist, no floating shards (component count), consistent texel density across parts (the lance and the fist must not look sharper than the body). Attach as rigid pieces on the named rig joints; keep `npm run verify` green.
