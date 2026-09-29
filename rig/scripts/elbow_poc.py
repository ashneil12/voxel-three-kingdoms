import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from common import *
from mathutils import Vector
reset(); src = import_master()
d = np.load(f"{ROOT}/reports/elbow_labels.npz")
check_order(src, d["centroids"])
dark = dark_material()
# labels: 0 = rest, 1 = forearm+hand R, 2 = forearm+hand L
lab = np.zeros(len(src.data.polygons), int); lab[d["distal_R"]] = 1; lab[d["distal_L"]] = 2
parts = split_by_label(src, lab, ["body", "forearm_hand_R", "forearm_hand_L"])
bpy.data.objects.remove(src)
cuts = {"body": np.concatenate([d["cutpts_R"], d["cutpts_L"]]), "forearm_hand_R": d["cutpts_R"], "forearm_hand_L": d["cutpts_L"]}
for nm, o in parts.items(): print(nm, len(o.data.polygons))
rig = {}
for side, sgn in [("R", -1), ("L", 1)]:
    piv = gltf_to_blender(d[f"pivot_{side}"]); rad = float(d[f"radius_{side}"])
    j = empty(f"elbow_{side}", piv)
    parent_keep(parts[f"forearm_hand_{side}"], j)
    # joint ball hides the wedge that opens when the forearm folds
    bpy.ops.mesh.primitive_uv_sphere_add(radius=rad * 1.1, location=piv, segments=24, ring_count=16)
    ball = bpy.context.active_object; ball.name = f"elbow_ball_{side}"; ball.data.materials.append(dark)
    for f in ball.data.polygons: f.use_smooth = True
    parent_keep(ball, parts["body"])
    # hinge axis: forearm direction x character-forward (-Y in Blender)
    fdir = Vector(gltf_to_blender(n2m_wrist := [0, 0, 0])) if False else None
    rig[side] = (j, piv)
wr = {"R": gltf_to_blender(np.array([-.44, .92, .015]) / 1.72 - [0, .5, 0]), "L": gltf_to_blender(np.array([.44, .92, .015]) / 1.72 - [0, .5, 0])}
def bend(deg):
    for side, (j, piv) in rig.items():
        v = Vector(wr[side] - piv).normalized(); axis = v.cross(Vector((0, -1, 0))).normalized()
        j.rotation_mode = 'AXIS_ANGLE'; j.rotation_axis_angle = (math.radians(deg), axis.x, axis.y, axis.z)
    bpy.context.view_layer.update()
for deg in (0, 45, 90):
    bend(deg)
    shoot(f"{ROOT}/renders/elbow_{deg}_front34.png", "front34", target=(0, 0, 0.05), scale=1.15, size=(700, 900))
    shoot(f"{ROOT}/renders/elbow_{deg}_left.png", "left", target=(0.0, -0.05, 0.12), scale=0.55, size=(700, 700))
    shoot(f"{ROOT}/renders/elbow_{deg}_right.png", "right", target=(0.0, -0.05, 0.12), scale=0.55, size=(700, 700))
bend(0); bpy.ops.wm.save_as_mainfile(filepath=f"{ROOT}/assets/working/02_elbow_test.blend")
print("POC DONE")
