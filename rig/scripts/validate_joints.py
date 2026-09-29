"""Step 8: rotate every joint on its own and render it (rest vs test pose) from two views. Saves renders/validation/joint_*.png."""
import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from common import *
from rigdef import *
blend = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "05_rigged.blend"
bpy.ops.wm.open_mainfile(filepath=f"{ROOT}/assets/working/{blend}")
D = math.radians
def rot(name, x=0, y=0, z=0):
    o = bpy.data.objects[name]; o.rotation_mode = 'XYZ'; o.rotation_euler = (D(x), D(y), D(z))
def reset_pose():
    for o in bpy.data.objects:
        if o.type == 'EMPTY': o.rotation_mode = 'XYZ'; o.rotation_euler = (0, 0, 0)
    bpy.context.view_layer.update()
TESTS = {   # joint: [(label, {joint: (x,y,z)}), ...]   (X = flexion axis; negative X swings a hanging limb forward)
    "neck": [("yaw", {"neck_joint": (0, 0, 40)}), ("nod", {"neck_joint": (25, 0, 0)})],
    "waist": [("twist", {"torso_joint": (0, 0, 30)}), ("bend", {"torso_joint": (-25, 0, 0)})],
    "shoulderR": [("fwd", {"shoulder_R": (-70, 0, 0)}), ("out", {"shoulder_R": (0, 0, 45)}), ("back", {"shoulder_R": (40, 0, 0)})],
    "elbowR": [("flex", {"elbow_R": (-90, 0, 0)})],
    "wristR": [("flex", {"wrist_R": (-50, 0, 0)}), ("side", {"wrist_R": (0, 0, 30)})],
    "hipR": [("fwd", {"hip_R": (-60, 0, 0)}), ("back", {"hip_R": (30, 0, 0)}), ("out", {"hip_R": (0, 0, -30)})],
    "kneeR": [("flex", {"knee_R": (80, 0, 0)})],
    "ankleR": [("flex", {"ankle_R": (-25, 0, 0)}), ("point", {"ankle_R": (25, 0, 0)})],
}
FOCUS = {"neck": (0, 0, .36), "waist": (0, 0, .12), "shoulderR": (-.1, -.03, .3), "elbowR": (-.19, -.03, .15), "wristR": (-.26, 0, .05),
         "hipR": (-.07, 0, .02), "kneeR": (-.13, 0, -.18), "ankleR": (-.16, 0, -.4)}
os.makedirs(f"{ROOT}/renders/validation", exist_ok=True)
for jn, tests in TESTS.items():
    for label, rots in [("rest", {})] + tests:
        reset_pose()
        for k, v in rots.items(): rot(k, *v)
        bpy.context.view_layer.update()
        for view, size in (("front34", 480), ("left", 480), ("front", 480)):
            fx, fy, fz = FOCUS[jn]
            shoot(f"{ROOT}/renders/validation/joint_{jn}_{label}_{view}.png", view if view != "left" else "right", target=(fx, fy, fz), scale=0.75, size=(size, size))
print("JOINT TESTS DONE")
