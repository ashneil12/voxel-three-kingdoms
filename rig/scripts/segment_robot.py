"""Segment the fused TRELLIS mesh into rigid parts by min-perimeter joint cuts. Runs in rig/.venv.
Output: reports/segmentation.npz (per-face part id, part names, pivots) + reports/segmentation.json."""
import sys, os, json, numpy as np; sys.path.insert(0, os.path.dirname(__file__))
from seglib import *
from scipy.spatial import cKDTree
M = Mesh(); N = norm_coords(M)
cuts = {}
def add(name, r, note=""):
    cuts[name] = r; print(f"{name:12s} pivot {r['pivot'].round(4)} perim {r['perimeter']:.3f} prox {int((r['prox'] & r['roi']).sum())} roi {int(r['roi'].sum())} {note}")

def roi_sphere(center_n, R_n): return np.linalg.norm(N - np.asarray(center_n), axis=1) < R_n

def band_cut(name, c_n, up_n, a, L, T=None, note=""):
    """Slab cut: everything beyond +-a along `up` inside lateral radius L is a terminal, so the min-perimeter loop must
    cross the whole limb cross-section (including bridging strips) within the slab |t|<a."""
    T = T or a + .07
    c = np.asarray(c_n, float); up = np.asarray(up_n, float); up = up / np.linalg.norm(up)
    d = N - c; t = d @ up; lat = np.linalg.norm(d - np.outer(t, up), axis=1)
    roi = (abs(t) < T) & (lat < L)
    add(name, cut_masks(M, roi, roi & (t > a), roi & (t < -a), None), f"seeds {int((roi&(t>a)).sum())}/{int((roi&(t<-a)).sum())}")

band_cut("waist", [0, 1.11, 0], [0, 1, 0], .05, .27)
for side, s in (("R", -1), ("L", 1)):
    xs = N[:, 0] * s
    roi = roi_sphere([s * .20, 1.30, 0], .22)
    torso = roi & (xs < .13) & (N[:, 1] > 1.12) & (N[:, 1] < 1.42)
    arm = roi & ((seg_dist(N, [s * .27, 1.30, 0], [s * .339, 1.193, -.05]) < .06) | ((xs > .22) & (N[:, 1] > 1.26) & (N[:, 1] < 1.5)) | ((xs > .27) & (N[:, 1] < 1.2)))
    add(f"shoulder_{side}", cut_masks(M, roi, torso & ~arm, arm, None), f"seeds {int((torso&~arm).sum())}/{int(arm.sum())}")
    band_cut(f"elbow_{side}", [s * .339, 1.193, -.053], [-s * .114, .117, 0], .05, .18)
    band_cut(f"wrist_{side}", [s * .44, .925, 0], [-s * .12, .27, 0], .04, .17)
    band_cut(f"hip_{side}", [s * .13, .885, 0], [-s * .075, .305, 0], .05, .24)
    band_cut(f"knee_{side}", [s * .205, .58, 0], [-s * .07, .44, 0], .05, .24)
    band_cut(f"ankle_{side}", [s * .275, .16, 0], [-s * .03, .42, 0], .04, .26)
def components():
    barrier = np.zeros(len(M.ea), bool)
    for name, r in cuts.items():
        barrier |= (r["prox"][M.ea] != r["prox"][M.eb]) & r["roi"][M.ea] & r["roi"][M.eb]
    n = len(M.F); keep = ~barrier
    G = sp.coo_matrix((np.ones(keep.sum()), (M.ea[keep], M.eb[keep])), shape=(n, n))
    return sp.csgraph.connected_components(G, directed=False)
# ---- neck last, inside the torso+head component only (pauldrons already belong to the arms)
_, comp0 = components()
tree0 = cKDTree(N); _, f_torso = tree0.query([0, 1.30, -.05])
in_body = comp0 == comp0[f_torso]
d = N - np.array([0, 1.465, -.03]); t = d[:, 1]; lat = np.linalg.norm(d[:, [0, 2]], axis=1)
roi = in_body & (abs(t) < .10) & (lat < .32)
add("neck", cut_masks(M, roi, roi & (t > .03), roi & (t < -.03), None), f"seeds {int((roi&(t>.03)).sum())}/{int((roi&(t<-.03)).sum())}")
ncomp, comp = components()
sizes = np.bincount(comp)
print("components:", ncomp, "largest:", sorted(sizes, reverse=True)[:22])
anchors = {"head": [0, 1.62, 0], "torso": [0, 1.30, -.05], "pelvis": [0, .99, 0]}
for side, s in (("R", -1), ("L", 1)):
    anchors.update({f"upper_arm_{side}": [s * .31, 1.42, 0], f"forearm_{side}": [s * .39, 1.02, 0], f"hand_{side}": [s * .46, .84, .02],
                    f"thigh_{side}": [s * .19, .74, 0], f"shin_{side}": [s * .24, .38, 0], f"foot_{side}": [s * .28, .05, 0]})
names = list(anchors)
n = len(M.F); part = -np.ones(n, int); tree = cKDTree(N)
for k, nm in enumerate(names):
    _, fi = tree.query(anchors[nm]); c = comp[fi]
    print(f"anchor {nm:12s} face comp size {sizes[c]:6d}  (owned by {[names[j] for j in range(k) if part[np.nonzero(comp==c)[0][0]]==j] if part[np.nonzero(comp==c)[0][0]]>=0 else '-'})")
    part[comp == c] = k
un = part < 0
print("unlabelled faces before crumbs:", int(un.sum()), "in", len(np.unique(comp[un])), "components")
# floating crumbs that were ALREADY disconnected in the master (the dark specks) are dropped; slivers split off by a cut
# are attached to the nearest labelled part so no hole is left
W = M.W; nvw = M.nverts_w
vg = sp.coo_matrix((np.ones(3 * n), (np.r_[W[:, 0], W[:, 1], W[:, 2]], np.r_[W[:, 1], W[:, 2], W[:, 0]])), shape=(nvw, nvw))
_, vcomp = sp.csgraph.connected_components(vg, directed=False)
crumb = vcomp[W[:, 0]] != np.bincount(vcomp).argmax()          # not connected to the robot even through a shared vertex
print('dropping master crumbs (already floating):', int(crumb.sum()), 'faces')
un2 = un & ~crumb
if un2.any():
    lab_tree = cKDTree(N[~un]); _, nn = lab_tree.query(N[un2]); part[un2] = part[~un][nn]
part[crumb] = -1
print({nm: int((part == k).sum()) for k, nm in enumerate(names)})
piv = {k[:]: v["pivot"].tolist() for k, v in cuts.items()}
rad = {k: v["radius"] for k, v in cuts.items()}
np.savez(f"{ROOT}/reports/segmentation.npz", part=part, centroids=M.C, names=np.array(names), **{f"cut_{k}": v["cut_pts"] for k, v in cuts.items()})
json.dump({"names": names, "pivots": piv, "radius": rad, "counts": {nm: int((part == k).sum()) for k, nm in enumerate(names)}}, open(f"{ROOT}/reports/segmentation.json", "w"), indent=1)
