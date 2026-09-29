"""Topology-aware joint cutting for the fused TRELLIS mesh (runs in rig/.venv, not Blender).

A joint cut is the minimum-perimeter closed loop that separates a proximal region from a distal region inside a small
window around the joint (graph min-cut on the triangle dual graph, capacity = shared-edge length). On a robot that loop
falls on the narrow mechanical joint, not through the middle of an armour plate. The pivot is the centre of that loop.
"""
import numpy as np, trimesh, scipy.sparse as sp
from collections import deque
from scipy.sparse.csgraph import maximum_flow
import os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MASTER = f"{ROOT}/assets/master/robot_master.glb"

def n2m(p):
    """Landmark in the 1.72-tall normalised source space -> master space (1.0 tall, feet at y=-0.5, glTF axes)."""
    p = np.asarray(p, float)
    return np.array([p[0] / 1.72, p[1] / 1.72 - 0.5, p[2] / 1.72])

class Mesh:
    def __init__(self, path=MASTER):
        m = trimesh.load(path, force='mesh', process=False)
        self.V = np.asarray(m.vertices, np.float64); self.F = np.asarray(m.faces, np.int64)
        key = np.round(self.V * 1e5).astype(np.int64)
        _, inv = np.unique(key, axis=0, return_inverse=True)
        self.inv = inv.ravel(); self.W = self.inv[self.F]                    # welded vertex ids per face
        self.C = self.V[self.F].mean(1)                                       # face centroids
        self.nverts_w = self.inv.max() + 1
        Wp = np.zeros((self.nverts_w, 3)); Wp[self.inv] = self.V; self.Wp = Wp
        e = np.stack([self.W[:, [0, 1]], self.W[:, [1, 2]], self.W[:, [2, 0]]], 1).reshape(-1, 2)
        fid = np.repeat(np.arange(len(self.F)), 3)
        lo, hi = e.min(1), e.max(1)
        order = np.lexsort((hi, lo)); lo, hi, fid = lo[order], hi[order], fid[order]
        same = (lo[1:] == lo[:-1]) & (hi[1:] == hi[:-1])
        i = np.nonzero(same)[0]
        self.ea, self.eb = fid[i], fid[i + 1]                                 # dual edges (manifold pairs)
        self.eu, self.ev = lo[i], hi[i]                                       # the shared mesh edge (welded ids)
        self.elen = np.linalg.norm(self.Wp[self.eu] - self.Wp[self.ev], axis=1)

def cut(mesh, center, axis_up, a=0.03, R=0.09, lateral=None, bias=None):
    """Return dict(prox=bool mask over ALL faces (True = proximal side; only ROI faces are meaningful),
    roi=bool mask, pivot=xyz, radius=float, loop=(edge midpoints), cut_edges=(u,v arrays))."""
    center = np.asarray(center, float); up = np.asarray(axis_up, float); up /= np.linalg.norm(up)
    d = mesh.C - center
    t = d @ up
    lat = np.linalg.norm(d - np.outer(t, up), axis=1)
    roi = (np.linalg.norm(d, axis=1) < R) & ((lateral is None) | (lat < (lateral if lateral else 9)))
    ids = np.nonzero(roi)[0]; loc = -np.ones(len(mesh.F), np.int64); loc[ids] = np.arange(len(ids))
    S, T = len(ids), len(ids) + 1
    m = roi[mesh.ea] & roi[mesh.eb]
    a_, b_, w = loc[mesh.ea[m]], loc[mesh.eb[m]], (mesh.elen[m] * 1e6).astype(np.int64) + 1
    if bias is not None:
        w = (w * bias(0.5 * (mesh.C[mesh.ea[m]] + mesh.C[mesh.eb[m]]))).astype(np.int64) + 1
    INF = 10 ** 9
    tt = t[ids]
    seedP, seedD = np.nonzero(tt > a)[0], np.nonzero(tt < -a)[0]
    rows = np.concatenate([a_, b_, np.full(len(seedP), S), np.full(len(seedD), T)])
    cols = np.concatenate([b_, a_, seedP, seedD])
    caps = np.concatenate([w, w, np.full(len(seedP), INF), np.full(len(seedD), INF)])
    # sink edges: seedD -> T
    rows = np.concatenate([rows[:-len(seedD)] if len(seedD) else rows, seedD]); cols = np.concatenate([cols[:-len(seedD)] if len(seedD) else cols, np.full(len(seedD), T)]); caps = np.concatenate([caps[:-len(seedD)] if len(seedD) else caps, np.full(len(seedD), INF)])
    n = len(ids) + 2
    G = sp.csr_matrix((np.minimum(caps, 2 ** 31 - 1).astype(np.int32), (rows, cols)), shape=(n, n))
    res = maximum_flow(G, S, T)
    resid = (G - res.flow).tocsr(); resid.data[resid.data < 0] = 0; resid.eliminate_zeros()
    seen = np.zeros(n, bool); seen[S] = True; dq = deque([S])
    indptr, indices = resid.indptr, resid.indices
    while dq:
        u = dq.popleft()
        for v in indices[indptr[u]:indptr[u + 1]]:
            if not seen[v]: seen[v] = True; dq.append(v)
    prox = np.zeros(len(mesh.F), bool); prox[ids] = seen[:len(ids)]
    # cut edges = dual edges crossing prox/dist inside ROI
    ia, ib = mesh.ea[m], mesh.eb[m]
    cross = prox[ia] != prox[ib]
    cu, cv = mesh.eu[m][cross], mesh.ev[m][cross]
    mid = 0.5 * (mesh.Wp[cu] + mesh.Wp[cv]); L = mesh.elen[m][cross]
    pivot = (mid * L[:, None]).sum(0) / L.sum()
    dd = np.linalg.norm(mid - pivot, axis=1); radius = float(dd.mean()); rmax = float(dd.max())
    cut_pts=np.unique(np.concatenate([mesh.Wp[cu], mesh.Wp[cv]]), axis=0)
    return dict(prox=prox, roi=roi, pivot=pivot, radius=radius, cut_u=cu, cut_v=cv, cut_pts=cut_pts, rmax=rmax, perimeter=float(L.sum()), maxflow=res.flow_value / 1e6, mid=mid)

def distal_region(mesh, r, seed_point):
    """All faces on the distal side of a completed cut: connected component (dual graph minus cut edges) of the face
    nearest `seed_point`. Raises if the cut loop is not closed (the region would leak into the body)."""
    m = ~(np.isin(mesh.eu, [0]) & False)
    crossing = r["prox"][mesh.ea] != r["prox"][mesh.eb]
    crossing &= r["roi"][mesh.ea] & r["roi"][mesh.eb]
    keep = ~crossing
    n = len(mesh.F)
    G = sp.coo_matrix((np.ones(keep.sum()), (mesh.ea[keep], mesh.eb[keep])), shape=(n, n))
    ncomp, lab = sp.csgraph.connected_components(G, directed=False)
    seed = int(np.argmin(np.linalg.norm(mesh.C - np.asarray(seed_point), axis=1)))
    return lab == lab[seed]


def cut_masks(mesh, roi, seed_S, seed_T, center):
    """Min-perimeter cut inside `roi` (bool over faces) separating seed_S faces (proximal) from seed_T faces (distal).
    Returns dict(prox, roi, pivot, radius, rmax, cut_pts, perimeter, crossing (bool over dual edges))."""
    ids = np.nonzero(roi)[0]; loc = -np.ones(len(mesh.F), np.int64); loc[ids] = np.arange(len(ids))
    S, T = len(ids), len(ids) + 1
    m = roi[mesh.ea] & roi[mesh.eb]
    a_, b_, w = loc[mesh.ea[m]], loc[mesh.eb[m]], (mesh.elen[m] * 1e6).astype(np.int64) + 1
    INF = 2 ** 30
    sP = np.nonzero(seed_S[ids])[0]; sD = np.nonzero(seed_T[ids])[0]
    rows = np.concatenate([a_, b_, np.full(len(sP), S), sD]); cols = np.concatenate([b_, a_, sP, np.full(len(sD), T)])
    caps = np.concatenate([w, w, np.full(len(sP), INF), np.full(len(sD), INF)])
    n = len(ids) + 2
    G = sp.csr_matrix((np.minimum(caps, 2 ** 31 - 1).astype(np.int32), (rows, cols)), shape=(n, n))
    res = maximum_flow(G, S, T)
    resid = (G - res.flow).tocsr(); resid.data[resid.data < 0] = 0; resid.eliminate_zeros()
    seen = np.zeros(n, bool); seen[S] = True; dq = deque([S]); ip, ix = resid.indptr, resid.indices
    while dq:
        u = dq.popleft()
        for v in ix[ip[u]:ip[u + 1]]:
            if not seen[v]: seen[v] = True; dq.append(v)
    prox = np.zeros(len(mesh.F), bool); prox[ids] = seen[:len(ids)]
    crossing = np.zeros(len(mesh.ea), bool)
    crossing[np.nonzero(m)[0]] = prox[mesh.ea[m]] != prox[mesh.eb[m]]
    cu, cv = mesh.eu[crossing], mesh.ev[crossing]
    mid = 0.5 * (mesh.Wp[cu] + mesh.Wp[cv]); L = mesh.elen[crossing]
    pivot = (mid * L[:, None]).sum(0) / L.sum(); dd = np.linalg.norm(mid - pivot, axis=1)
    return dict(prox=prox, roi=roi, pivot=pivot, radius=float(dd.mean()), rmax=float(dd.max()), cut_pts=np.unique(np.concatenate([mesh.Wp[cu], mesh.Wp[cv]]), axis=0),
                perimeter=float(L.sum()), crossing=crossing, flow=res.flow_value / 1e6)

def norm_coords(mesh):
    """Face centroids in the 1.72-tall normalised space the landmarks are measured in (x right-of-character-left, y up, z forward)."""
    c = mesh.C
    return np.stack([c[:, 0] * 1.72, (c[:, 1] + .5) * 1.72, c[:, 2] * 1.72], 1)

def seg_dist(P, a, b):
    """Distance from points P to segment a-b."""
    a = np.asarray(a, float); b = np.asarray(b, float); ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + np.outer(t, ab)), axis=1)
