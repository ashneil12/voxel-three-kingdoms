# Rigid articulated Vanguard (original TRELLIS mesh, no remesh, no skinning)

Goal: take the untouched TRELLIS GLB and make it animatable without changing how it looks.

- Gold master: `assets/master/robot_master.glb` (read-only, sha256 `5b3fcc2b…`, identical to `docs/art/production-pilot/vanguard-a-pose-hq.glb`). Never edited.
- Result: `assets/output/robot_rigged.glb` — 15 rigid parts (376,560 of the master's 376,667 triangles, original material + texture), joint pivots as nodes, a separate spear on `weapon_socket_R`, clips **Idle**, **Walk**, **Attack_Spear**.
- Rebuild everything in about 10 seconds: `./run_all.sh` (Blender app, `uv`, `node`). View it: `python3 ../tools/serve.py`, open `http://localhost:8767/rig/tests/index.html` (buttons for each clip; `?clip=Walk&t=0.3&view=right` freezes a frame).

## What the master turned out to be

`reports/inspect.json`: one mesh, 415,490 vertices / 376,667 triangles, one material, **one connected component** (plus five floating specks of about 100 faces total) — so "Separate by Loose Parts" gives nothing. The whole robot is a single fused shell, and about 364k of its edges are open texture-chart seams in Blender.

## How it is cut (this is the important part)

Planar cuts through a fused shell slice through armour plates. Instead, each joint is a **minimum-perimeter cut**: inside a slab around the joint, everything beyond ±a along the limb axis is a terminal, and a graph min-cut on the triangle dual graph (edge weight = shared-edge length) finds the shortest closed loop that separates the two sides. On this robot that loop lands on the narrow mechanical joint (the black bearing/collar), not through a plate. The loop's centre is the pivot (`scripts/seglib.py`, `scripts/segment_robot.py`).

Fourteen cuts (neck, waist, shoulder, elbow, wrist, hip, knee, ankle x2) give 15 parts: head, torso, pelvis, upper arm + pauldron, forearm, hand, thigh, shin, foot (L and R). The pauldron rides with the upper arm; the neck cut is made last, inside the torso+head component only. Only the 107 faces of the five floating specks were dropped; every other triangle is kept exactly (`reports/validation.json`).

Gaps: the master is a hollow shell, so a folded joint would show its inside. Each joint gets a small dark filler ball (sphere, cylinder for the waist) parented to the proximal part. Fillers are hidden inside the joint at rest; no exterior armour is replaced. Pivot overrides: hips only (`scripts/pivot_override.json`, from the dark bearing faces).

## Hierarchy

`robot_root > pelvis_joint (pelvis) > torso_joint (torso) > neck_joint (head) | shoulder_L/R (upper arm) > elbow (forearm) > wrist (hand) > weapon_socket_R > spear`, and `pelvis_joint > hip (thigh) > knee (shin) > ankle (foot)`. All motion is node rotation plus pelvis translation. Nothing deforms.

## Animation

`scripts/animate_robot.py` bakes numeric poses to `reports/clips.json` (source of truth). Legs use analytic 2-bone IK so planted feet stay planted (walk treadmill, lunge in the attack). `scripts/add_animations.mjs` writes those tracks into the GLB (Blender space to glTF axes). Blender's NLA/slotted-action export was not used (clip data stays deterministic).

## Validation (`reports/validation.json`, `renders/validation/`)

- Triangle count of the 15 parts + 107 dropped specks = master count. Materials/texture present. No scaled meshes. All expected nodes present, spear parented to the socket.
- Neutral pose vs master, same cameras: 0.5 to 0.7 percent of pixels differ (the filler balls and the dropped specks).
- Every joint tested on its own (`renders/validation/sheet_*.jpg`); elbow gate at 45/90 degrees (`renders/elbow_poc_sheet.jpg`); clips as strips (`strip_*.jpg`).
- Three.js: loads, 3 clips play (17 tracks each), spear follows the hand, texture present (`renders/threejs/sheet.jpg`).

## Known limits (honest)

- The master hands are open. The spear passes through/next to the palm; the grip is cheated, as agreed. A gripping fist needs a generation-stage change.
- The spear is primitives (shaft, collars, flat blade), not TRELLIS. Its blade is crude.
- Cut loops are not closed rings (the shell has real openings), so there are no cap faces; the filler ball hides the opening. At extreme angles a sliver of interior can show.
- Poses are a first pass: walk is a stiff mechanical stride, the right-hand grip angle is fixed by the socket, the left hand does not hold the spear.
- Not integrated into the game yet. The old skinned build lives on `exo`; engineered arms on `exo-authored-arms`.
