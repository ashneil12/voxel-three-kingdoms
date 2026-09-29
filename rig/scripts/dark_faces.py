import sys, os, numpy as np, trimesh, json; sys.path.insert(0, os.path.dirname(__file__))
from seglib import *
m = trimesh.load(MASTER, force='mesh', process=False)
img = np.asarray(m.visual.material.baseColorTexture.convert('RGB')).astype(float) / 255
uv = m.visual.uv[m.faces].mean(1)
h, w, _ = img.shape
px = img[np.clip(((1 - uv[:, 1]) * (h - 1)).astype(int), 0, h - 1), np.clip((uv[:, 0] * (w - 1)).astype(int), 0, w - 1)]
lum = px @ [.2126, .7152, .0722]
np.save(f"{ROOT}/reports/face_lum.npy", lum)
M = Mesh(); C = M.C
seg = json.load(open(f"{ROOT}/reports/segmentation.json"))
for j in ["neck","waist","shoulder_R","elbow_R","wrist_R","hip_R","knee_R","ankle_R"]:
    p = np.array(seg["pivots"][j]); d = np.linalg.norm(C - p, axis=1)
    sel = (d < .085) & (lum < .12)
    c = C[sel]
    print(j, "pivot", p.round(3), "dark faces", int(sel.sum()), "median", np.median(c, 0).round(3) if len(c) else None,
          "x-range", (c[:,0].min().round(3), c[:,0].max().round(3)) if len(c) else None)
