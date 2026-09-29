import sys, os, json, numpy as np; sys.path.insert(0, os.path.dirname(__file__))
from seglib import *
M = Mesh()
out = {}
for name, sgn in [("R", -1), ("L", 1)]:
    elbow = n2m([sgn * .32, 1.15, 0]); sh = n2m([sgn * .225, 1.355, 0]); wrist = n2m([sgn * .44, .92, .015])
    r = cut(M, elbow, sh - elbow, a=0.03, R=0.10)
    D = distal_region(M, r, wrist)
    print(name, "pivot", r["pivot"].round(4), "radius", round(r["radius"], 4), "distal faces", int(D.sum()), "of", len(M.F))
    out[f"distal_{name}"] = D; out[f"cutpts_{name}"] = r["cut_pts"]; out[f"pivot_{name}"] = r["pivot"]; out[f"radius_{name}"] = r["radius"]; out[f"rmax_{name}"] = r["rmax"]; print(name,"rmax",round(r["rmax"],4))
np.savez(f"{ROOT}/reports/elbow_labels.npz", centroids=M.C, **out)
