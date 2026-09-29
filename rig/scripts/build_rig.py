"""Steps 03-05: split the master by the segmentation labels, build the rigid joint hierarchy, add joint fillers.
Saves 03_segmented.blend, 04_hierarchy.blend, 05_rigged.blend."""
import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from common import *
from rigdef import *
reset(); src = import_master()
d = np.load(f"{ROOT}/reports/segmentation.npz", allow_pickle=True)
check_order(src, d["centroids"])
names = [str(n) for n in d["names"]]
lab = d["part"].copy(); lab[lab < 0] = len(names)             # dropped crumbs -> an extra label that is deleted
parts = split_by_label(src, lab, names + ["_crumbs"])
bpy.data.objects.remove(src); bpy.data.objects.remove(parts.pop("_crumbs"))
for nm, o in parts.items():
    o.name = nm; o.data.name = nm + "_mesh"; print(nm, len(o.data.polygons))
bpy.ops.wm.save_as_mainfile(filepath=f"{ROOT}/assets/working/03_segmented.blend")

dark = dark_material()
J = {}
def joint(name, loc, parent):
    e = empty(name, loc, parent); J[name] = e; return e
root = empty("robot_root", (0, 0, 0)); J["robot_root"] = root
pelvis_j = joint("pelvis_joint", PIV["waist"] * [1, 1, 0] + [0, 0, PIV["hip"]["L"][2]], root)   # sits between the hips, at hip height
torso_j = joint("torso_joint", PIV["waist"], pelvis_j)
neck_j = joint("neck_joint", PIV["neck"], torso_j)
parent_keep(parts["pelvis"], pelvis_j); parent_keep(parts["torso"], torso_j); parent_keep(parts["head"], neck_j)
for s in ("L", "R"):
    sh = joint(f"shoulder_{s}", PIV["shoulder"][s], torso_j); el = joint(f"elbow_{s}", PIV["elbow"][s], sh)
    wr = joint(f"wrist_{s}", PIV["wrist"][s], el)
    parent_keep(parts[f"upper_arm_{s}"], sh); parent_keep(parts[f"forearm_{s}"], el); parent_keep(parts[f"hand_{s}"], wr)
    hp = joint(f"hip_{s}", PIV["hip"][s], pelvis_j); kn = joint(f"knee_{s}", PIV["knee"][s], hp); an = joint(f"ankle_{s}", PIV["ankle"][s], kn)
    parent_keep(parts[f"thigh_{s}"], hp); parent_keep(parts[f"shin_{s}"], kn); parent_keep(parts[f"foot_{s}"], an)
bpy.ops.wm.save_as_mainfile(filepath=f"{ROOT}/assets/working/04_hierarchy.blend")

def ball(name, radius, loc, parent):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=loc, segments=24, ring_count=16)
    b = bpy.context.active_object; b.name = name; b.data.materials.append(dark)
    for f in b.data.polygons: f.use_smooth = True
    parent_keep(b, parent); return b
# fillers ride with the PROXIMAL part so they stay put while the distal part folds around them
ball("filler_neck", BALL["neck"], PIV["neck"], torso_j)
for s in ("L", "R"):
    ball(f"filler_shoulder_{s}", BALL["shoulder"], PIV["shoulder"][s], torso_j)
    ball(f"filler_elbow_{s}", BALL["elbow"], PIV["elbow"][s], J[f"shoulder_{s}"])
    ball(f"filler_wrist_{s}", BALL["wrist"], PIV["wrist"][s], J[f"elbow_{s}"])
    ball(f"filler_hip_{s}", BALL["hip"], PIV["hip"][s], pelvis_j)
    ball(f"filler_knee_{s}", BALL["knee"], PIV["knee"][s], J[f"hip_{s}"])
    ball(f"filler_ankle_{s}", BALL["ankle"], PIV["ankle"][s], J[f"knee_{s}"])
# waist: a flat disc plug
bpy.ops.mesh.primitive_cylinder_add(radius=.075, depth=.06, location=PIV["waist"], vertices=32)
w = bpy.context.active_object; w.name = "filler_waist"; w.data.materials.append(dark); parent_keep(w, pelvis_j)
bpy.ops.wm.save_as_mainfile(filepath=f"{ROOT}/assets/working/05_rigged.blend")
print("RIG BUILT", len(bpy.data.objects))
