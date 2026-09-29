#!/bin/sh
# Rebuild the articulated robot from the untouched TRELLIS master. Needs: Blender (macOS app path below), uv, node.
set -e
cd "$(dirname "$0")"
[ -d .venv ] || { uv venv .venv -q && uv pip install -q --python .venv/bin/python numpy scipy trimesh pillow networkx; }
[ -d node_modules ] || npm install --silent
.venv/bin/python scripts/segment_robot.py         # min-perimeter joint cuts -> reports/segmentation.npz (+ pivots json)
scripts/run.sh scripts/build_rig.py               # 03_segmented, 04_hierarchy, 05_rigged
scripts/run.sh scripts/weapon_socket.py           # 06_weapon_socket (spear + sockets)
scripts/run.sh scripts/animate_robot.py           # 07_animated + reports/clips.json
scripts/run.sh scripts/export_glb.py              # 08_export_ready + robot_static.glb
node scripts/add_animations.mjs                   # robot_rigged.glb (Idle, Walk, Attack_Spear)
scripts/run.sh scripts/validate_asset.py          # reports/validation.json
echo "done: assets/output/robot_rigged.glb  (view: python3 ../tools/serve.py, open /rig/tests/index.html)"
