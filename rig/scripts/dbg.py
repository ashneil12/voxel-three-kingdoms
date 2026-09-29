import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from common import *
reset(); src = import_master()
d = np.load(f"{ROOT}/reports/elbow_labels.npz")
lab = np.zeros(len(src.data.polygons), int); lab[d["distal_R"]] = 1
parts = split_by_label(src, lab, ["body", "fore"])
o = parts["fore"]; keys = __import__("common")._keys(gltf_to_blender(d["cutpts_R"]))
bm = bmesh.new(); bm.from_mesh(o.data)
q = lambda v: tuple(np.round(np.array(v.co) * 1e5).astype(np.int64))
b = [e for e in bm.edges if e.is_boundary]
hit = [e for e in b if q(e.verts[0]) in keys and q(e.verts[1]) in keys]
h1 = [e for e in b if q(e.verts[0]) in keys or q(e.verts[1]) in keys]
print("faces", len(bm.faces), "boundary", len(b), "both in keys", len(hit), "either", len(h1), "keys", len(keys))
print(list(keys)[:2], q(b[0].verts[0]))
