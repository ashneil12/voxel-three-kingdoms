import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from common import *
bpy.ops.wm.open_mainfile(filepath=f"{ROOT}/assets/working/07_animated.blend")
for o in bpy.data.objects:
    if o.animation_data:
        for tr in o.animation_data.nla_tracks: tr.mute = (tr.name != "Walk")
for f in (1, 6, 11, 16, 21, 26):
    bpy.context.scene.frame_set(f)
    print("F", f, {n: [round(math.degrees(a), 1) for a in bpy.data.objects[n].rotation_euler][0] for n in ("hip_L", "knee_L", "ankle_L", "hip_R", "knee_R")}, "pelvis z", round(bpy.data.objects["pelvis_joint"].location.z, 3))
