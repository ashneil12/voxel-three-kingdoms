"""Step 3: inspect the gold master. Reports counts, dimensions and connected components (by welded position)."""
import bpy, bmesh, json, os, numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=f"{ROOT}/assets/master/robot_master.glb")
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
rep = {"objects": len(bpy.data.objects), "meshes": len(meshes), "materials": len(bpy.data.materials), "images": len(bpy.data.images)}
o = meshes[0]; me = o.data
rep["verts"] = len(me.vertices); rep["tris"] = sum(len(p.vertices) - 2 for p in me.polygons)
rep["dimensions"] = list(o.dimensions); rep["origin"] = list(o.location); rep["rotation"] = list(o.rotation_euler); rep["scale"] = list(o.scale)
# components by welded positions
n = len(me.vertices); co = np.empty(n * 3, dtype=np.float32); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
key = np.round(co * 1e5).astype(np.int64); _, inv = np.unique(key, axis=0, return_inverse=True)
inv = inv.ravel(); m = inv.max() + 1
loops = np.empty(len(me.loops), dtype=np.int32); me.loops.foreach_get("vertex_index", loops)
starts = np.empty(len(me.polygons), dtype=np.int32); me.polygons.foreach_get("loop_start", starts)
tot = np.empty(len(me.polygons), dtype=np.int32); me.polygons.foreach_get("loop_total", tot)
parent = np.arange(m)
def find(x):
    while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
    return x
for s, t in zip(starts, tot):
    a = find(inv[loops[s]])
    for k in range(1, t):
        b = find(inv[loops[s + k]])
        if a != b: parent[b] = a
comp = np.array([find(i) for i in range(m)])[inv]           # component id per vertex
ids, counts = np.unique(comp, return_counts=True)
order = np.argsort(-counts)
rep["components"] = int(len(ids)); rep["largest_components_verts"] = counts[order][:20].tolist()
rep["components_over_1000_verts"] = int((counts > 1000).sum()); rep["components_under_50_verts"] = int((counts < 50).sum())
big = []
for i in order[:24]:
    sel = co[comp == ids[i]]; big.append({"verts": int(counts[i]), "min": sel.min(0).round(3).tolist(), "max": sel.max(0).round(3).tolist()})
rep["big_components"] = big
json.dump(rep, open(f"{ROOT}/reports/inspect.json", "w"), indent=1)
print("DONE", rep["verts"], rep["tris"], rep["components"], rep["components_over_1000_verts"])
