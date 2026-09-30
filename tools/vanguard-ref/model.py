"""Transforms shared by the spec builder, the diff tool and the game export.

local boxes (parts.py)  --world()-->  T-pose world boxes (reference pose: arms out, legs in an A-stance)
                        --game_local()-->  hanging joint-local boxes for the EXO rig
"""
import math
import parts as P

def _mirror_box(b):
    x0, y0, z0, x1, y1, z1 = b
    return (-x1, y0, z0, -x0, y1, z1)

def expanded():
    """Every part with its right-side twin: list of dict(id, joint (with L/R side), box (local), c, side)."""
    out = []
    for p in P.PARTS:
        j = p["joint"]
        if p["id"].endswith("_L"):
            out.append(dict(p, joint=j + ("L" if j in P.MIRRORED else ""), side=1))
            out.append(dict(p, id=p["id"][:-2] + "_R", joint=j + ("R" if j in P.MIRRORED else ""), box=_mirror_box(p["box"]), side=-1))
        else:
            out.append(dict(p, side=0))
    return out

def base_joint(j):
    return j[:-1] if j[-1] in "LR" and j not in ("spear",) and j[:-1] in P.MIRRORED else j

def world_box(p):
    """T-pose world box (continuous coords, end-exclusive) of an expanded part."""
    j = p["joint"]; bj = base_joint(j); side = p.get("side") or 1
    x0, y0, z0, x1, y1, z1 = p["box"]          # right-side twins carry an x-mirrored local box
    px, py, pz = P.PIVOT[bj]
    mir = bj in P.MIRRORED and side == -1
    if mir:                                   # write each transform once, for the +x side, then mirror the world box
        x0, x1 = -x1, -x0
    if bj in P.ARM:
        wx0, wx1 = px - y1, px - y0; wy0, wy1 = py + x0, py + x1
    elif bj in P.LEG:
        yc = py + (y0 + y1) / 2
        sh = round((P.PIVOT["thigh"][1] - yc) * P.SPLAY)
        wx0, wx1 = px + x0 + sh, px + x1 + sh; wy0, wy1 = py + y0, py + y1
    else:
        wx0, wx1 = px + x0, px + x1; wy0, wy1 = py + y0, py + y1
    if mir:
        wx0, wx1 = -wx1, -wx0
    return (wx0, wy0, pz + z0, wx1, wy1, pz + z1)

def world_boxes(skip_spear=True):
    out = []
    for p in expanded():
        if skip_spear and p["joint"] == "spear":
            continue
        if p["joint"] == "spear":
            x0, y0, z0, x1, y1, z1 = p["box"]; px, py, pz = P.PIVOT["spear"]
            # spear stands vertical at the character's right in the T-pose views (tip up)
            w = (px + x0, py + z0, pz + y0, px + x1, py + z1, pz + y1)
        else:
            w = world_box(p)
        out.append(dict(id=p["id"], joint=p["joint"], c=p["c"], box=w, note=p.get("note", "")))
    return out

def rasterize(boxes):
    vox = {}
    for b in boxes:
        x0, y0, z0, x1, y1, z1 = b["box"]
        for x in range(math.floor(x0 + 1e-6), math.ceil(x1 - 1e-6)):
            for y in range(math.floor(y0 + 1e-6), math.ceil(y1 - 1e-6)):
                for z in range(math.floor(z0 + 1e-6), math.ceil(z1 - 1e-6)):
                    vox[(x, y, z)] = b["c"]
    return vox

def game_boxes():
    """Hanging joint-local boxes per game joint (right side = mirrored left). joint -> [(x0,y0,z0,x1,y1,z1,c)]"""
    out = {}
    for p in expanded():
        out.setdefault(p["joint"], []).append(p["box"] + (p["c"],))
    return out

if __name__ == "__main__":
    wb = world_boxes(); v = rasterize(wb)
    ys = [k[1] for k in v]; xs = [k[0] for k in v]
    print(len(P.PARTS), "parts", len(wb), "boxes", len(v), "voxels; x", min(xs), max(xs), "y", min(ys), max(ys))
