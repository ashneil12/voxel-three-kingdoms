import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from common import *
blend = sys.argv[sys.argv.index("--") + 1]; out = sys.argv[sys.argv.index("--") + 2]
bpy.ops.wm.open_mainfile(filepath=f"{ROOT}/assets/working/{blend}")
D = math.radians
READY = {"shoulder_R": (-38, 0, 8), "elbow_R": (-100, 0, 0), "wrist_R": (10, 0, 0), "shoulder_L": (-20, 0, -6), "elbow_L": (-70, 0, 0)}
for k, v in READY.items(): bpy.data.objects[k].rotation_mode = 'XYZ'; bpy.data.objects[k].rotation_euler = tuple(D(a) for a in v)
bpy.context.view_layer.update()
for v in ("front34", "right", "front"): shoot(f"{ROOT}/renders/{out}_{v}.png", v, target=(0, -0.05, 0.05), scale=1.3, size=(700, 900))
