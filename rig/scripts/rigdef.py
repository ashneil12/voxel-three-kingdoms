"""Rig definition shared by build/animate/validate scripts (Blender space: Z up, character faces -Y, left = +X)."""
import json, os, numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SEG = json.load(open(f"{ROOT}/reports/segmentation.json"))
NAMES = SEG["names"]

def g2b(p):  # glTF (x, y, z) -> Blender (x, -z, y)
    return np.array([p[0], -p[2], p[1]], float)

def sym(nm):
    """Robot is left/right symmetric: mirror-average the L/R cut centroids so both sides pivot identically."""
    r, l = g2b(SEG["pivots"][nm + "_R"]), g2b(SEG["pivots"][nm + "_L"])
    x, y, z = (abs(r[0]) + abs(l[0])) / 2, (r[1] + l[1]) / 2, (r[2] + l[2]) / 2
    return {"R": np.array([-x, y, z]), "L": np.array([x, y, z])}

PIV = {}
for nm in ("shoulder", "elbow", "wrist", "hip", "knee", "ankle"):
    PIV[nm] = sym(nm)
PIV["waist"] = g2b(SEG["pivots"]["waist"]); PIV["neck"] = g2b(SEG["pivots"]["neck"])
PIV["waist"][0] = 0; PIV["neck"][0] = 0
# Hand-tuned overrides (Blender space), filled in after visual joint tests; None = use the cut centroid
OVERRIDE = json.load(open(f"{ROOT}/scripts/pivot_override.json")) if os.path.exists(f"{ROOT}/scripts/pivot_override.json") else {}
for k, v in OVERRIDE.items():
    nm, side = k.rsplit("_", 1) if k.rsplit("_", 1)[-1] in ("L", "R") else (k, None)
    if side: PIV[nm][side] = np.array(v, float)
    else: PIV[k] = np.array(v, float)
# joint filler ball radius (master units)
BALL = {"neck": .032, "shoulder": .03, "elbow": .022, "wrist": .02, "hip": .042, "knee": .03, "ankle": .034}
