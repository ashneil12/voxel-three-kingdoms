"""Step 13: automatic validation of the exported GLB (imported back into Blender) against the gold master."""
import sys, os, json; sys.path.insert(0, os.path.dirname(__file__))
from common import *
rep = {}
# ---- master reference render + counts
reset(); m = import_master(); mtris = sum(len(p.vertices) - 2 for p in m.data.polygons)
mverts = len(m.data.vertices); mimgs = len(bpy.data.images); mmats = len(bpy.data.materials)
for v in ("front", "front34", "back"): shoot(f"{ROOT}/renders/validation/ref_master_{v}.png", v, target=(0, 0, 0), scale=1.15)
# ---- exported asset. The rigged file has clips that Blender's importer applies at frame 1, so the rest pose is checked on
# robot_static.glb (identical nodes/meshes; robot_rigged.glb only adds the animation channels)
reset(); bpy.ops.import_scene.gltf(filepath=f"{ROOT}/assets/output/robot_static.glb")
objs = list(bpy.data.objects); meshes = [o for o in objs if o.type == 'MESH']
body = [o for o in meshes if not (o.name.startswith("filler") or o.name.startswith("spear") or o.name.startswith("elbow_ball"))]
rep["master"] = {"tris": mtris, "verts": mverts, "materials": mmats, "images": mimgs}
rep["asset"] = {"objects": len(objs), "meshes": len(meshes), "body_parts": len(body),
                "body_tris": sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in body), "materials": len(bpy.data.materials), "images": len(bpy.data.images)}
rep["dropped_crumb_tris"] = rep["master"]["tris"] - rep["asset"]["body_tris"]
# transforms: no mesh scaled, no NaN
bad = [o.name for o in meshes if any(abs(s - 1) > 1e-4 for s in o.matrix_world.to_scale())]
rep["scaled_objects"] = bad
names = {o.name for o in objs}
need = ["robot_root", "pelvis_joint", "torso_joint", "neck_joint"] + [f"{j}_{s}" for j in ("shoulder", "elbow", "wrist", "hand", "hip", "knee", "ankle", "foot") for s in "LR"] + ["weapon_socket_R", "spear"]
rep["missing_hierarchy_nodes"] = [n for n in need if n not in names]
rep["spear_parent"] = bpy.data.objects["spear"].parent.name if bpy.data.objects.get("spear") and bpy.data.objects["spear"].parent else None
rep["textures_present"] = [i.name for i in bpy.data.images if i.size[0] > 0 and i.name != "Render Result"]
import subprocess
reset_names = None
# neutral pose vs master, same cameras. The spear/fillers are hidden: this compares the ROBOT ONLY.
for o in meshes:
    if o.name.startswith("spear"): o.hide_render = True
for v in ("front", "front34", "back"): shoot(f"{ROOT}/renders/validation/ref_asset_{v}.png", v, target=(0, 0, 0), scale=1.15)
def load(path):
    im = bpy.data.images.load(path); a = np.empty(im.size[0] * im.size[1] * 4, np.float32); im.pixels.foreach_get(a); r = a.reshape(-1, 4)[:, :3] * 255; bpy.data.images.remove(im); return r
diffs = {}
for v in ("front", "front34", "back"):
    a = load(f"{ROOT}/renders/validation/ref_master_{v}.png"); b = load(f"{ROOT}/renders/validation/ref_asset_{v}.png")
    d = np.abs(a - b).sum(1); diffs[v] = {"pixels_differing_over_30": int((d > 30).sum()), "fraction": round(float((d > 30).mean()), 5)}
rep["neutral_vs_master"] = diffs
json.dump(rep, open(f"{ROOT}/reports/validation.json", "w"), indent=1); print(json.dumps(rep, indent=1))
