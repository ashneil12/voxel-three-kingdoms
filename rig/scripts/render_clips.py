"""Render key frames of each clip (NLA track) from a .blend: renders/validation/clip_<name>_<frame>_<view>.png"""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from common import *
blend = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "07_animated.blend"
bpy.ops.wm.open_mainfile(filepath=f"{ROOT}/assets/working/{blend}")
for o in bpy.data.objects:
    if o.animation_data: o.animation_data_clear()      # NLA would override the numeric poses applied below
import json
clips = json.load(open(f"{ROOT}/reports/clips.json"))
LEN = {"Idle": 60, "Walk": 30, "Attack_Spear": 45}
def solo(name):
    for o in bpy.data.objects:
        if o.animation_data:
            for tr in o.animation_data.nla_tracks: tr.mute = (tr.name != name)
os.makedirs(f"{ROOT}/renders/validation", exist_ok=True)
for name, n in LEN.items():
    step = n // 6
    for f in range(0, n, step):
        apply_clip_frame(clips, name, f)
        for view in ("front34", "right"):
            shoot(f"{ROOT}/renders/validation/clip_{name}_{f + 1:03d}_{view}.png", view, target=(0, -0.05, 0.05), scale=1.3, size=(420, 540))
print("CLIPS RENDERED")
