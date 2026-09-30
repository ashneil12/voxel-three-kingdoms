"""Voxel detail pass: rebuild the Vanguard at sheet resolution from the front / back / side views.

1. Each view is sampled on the sheet's own voxel grid (15 px per voxel in ref/*_std.png) and every cell is classified
   (I ivory, N navy, O orange, G gold, K black, D dark grey, bg).
2. The left half (x >= 0) is carved as the intersection of the front, back and side silhouettes (the right arm and spear
   in the sheet are posed, so they are never read), limited to a 2-voxel shell around the hand-authored part model so the
   hull cannot fatten limbs where the views cannot see depth.
3. Surface voxels take their colour from the view that sees them (front for +z faces, back for -z, side for +x/-x/top);
   hidden interior is black.  The half is mirrored to make the full character.
Output: vox/vanguard_voxels.json  (list of [x, y, z, class, joint]), grid = 1 voxel per unit, x = character's left.
"""
import colorsys, json, sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
import vanguard_parts as VP

HERE = Path(__file__).parent
import os
PROJECT = os.environ.get('PROJECT', '2')      # 0 hand colours | 1 also project seams/plates | 2 (default) refine accents only   # 0 = hand-authored colours only (shape still carved from the views)
CELL = 15
XR, YR = (-26, 27), (0, 92)


def cell_grid(path, ox=395, oy=1345):
    im = np.asarray(Image.open(path).convert("RGB")).astype(float)
    H, W, _ = im.shape
    g = {}
    for j in range(*YR):
        for i in range(*XR):
            x0 = ox + i * CELL; y1 = oy - j * CELL; y0 = y1 - CELL; x1 = x0 + CELL
            if x0 < 0 or y0 < 0 or x1 > W or y1 > H:
                continue
            g[(i, j)] = np.median(im[y0 + 4:y1 - 4, x0 + 4:x1 - 4].reshape(-1, 3), axis=0)
    return g


SIDE_KEYS = [(0, -3), (12, -3), (20, -1), (30, 4), (40, 4), (52, 2), (68, 1), (90, 1)]   # (y, z shift of the sheet's side view vs the authored model)
def side_shift(y):
    for (y0, s0), (y1, s1) in zip(SIDE_KEYS, SIDE_KEYS[1:]):
        if y0 <= y <= y1:
            return round(s0 + (s1 - s0) * (y - y0) / (y1 - y0))
    return 0


def classify(rgb):
    r, gg, b = (float(v) / 255 for v in rgb)
    h, s, v = colorsys.rgb_to_hsv(r, gg, b)
    hd = h * 360
    if v < 0.45 and (b - r) > 0.035 and s < 0.45 and 190 < hd < 250 and v > 0.09 and not (s > 0.38 and v > 0.3):
        return "bg"                                                # cool dark backdrop
    if s > 0.72 and v > 0.7 and 18 <= hd < 37:
        return "O"
    if s > 0.6 and v > 0.7 and 37 <= hd <= 62:
        return "G"
    if 190 <= hd <= 262 and s > 0.4 and v > 0.2:
        return "N"
    if 6 <= hd <= 52 and s > 0.18 and v > 0.3:
        return "I"                                                 # lit or shaded ivory
    if v < 0.24 or (v < 0.36 and s < 0.22):
        return "K"
    if v < 0.5:
        return "D"
    return "bg"


def class_map(path, ox, xmin, xmax, flip=False):
    """Returns dict[(x,y)] -> class for cells with x in [xmin, xmax); image column i maps to x = -(i) - 1 if flip."""
    g = cell_grid(path, ox=ox)
    out = {}
    for (i, j), c in g.items():
        x = (-i - 1) if flip else i
        if xmin <= x < xmax:
            out[(x, j)] = classify(c)
    return out


def despeckle(m, passes=2):
    """Replace cells that disagree with almost all 8 neighbours (compression / shading noise); features >= 2 cells survive."""
    from collections import Counter
    for _ in range(passes):
        new = dict(m)
        for (x, y), c in m.items():
            nb = [m.get((x + dx, y + dy)) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy)]
            nb = [n for n in nb if n is not None]
            if len(nb) < 5:
                continue
            cnt = Counter(nb)
            top, k = cnt.most_common(1)[0]
            if cnt[c] <= 1 and k >= 5 and top != c:
                new[(x, y)] = top
        m = new
    return m


def drop_small_regions(m, min_area=4, classes=("K", "D", "N", "I", "O", "G")):
    """Connected regions (4-neighbour) of one class smaller than min_area cells are re-labelled with their neighbours' majority class."""
    from collections import Counter, deque
    seen = set(); m = dict(m)
    for start, c in list(m.items()):
        if start in seen or c not in classes:
            continue
        comp = []; dq = deque([start]); seen.add(start)
        while dq:
            x, y = dq.popleft(); comp.append((x, y))
            for d in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + d[0], y + d[1])
                if n not in seen and m.get(n) == c:
                    seen.add(n); dq.append(n)
        if len(comp) < min_area:
            nb = Counter(m.get((x + dx, y + dy)) for x, y in comp for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if m.get((x + dx, y + dy)) not in (None, c))
            if nb:
                for k in comp:
                    m[k] = nb.most_common(1)[0][0]
    return m


def fill_holes(m, passes=3):
    """A background cell with >= 5 figure neighbours is a hole in the figure, not sky: fill it with the neighbours' majority class."""
    from collections import Counter
    for _ in range(passes):
        new = dict(m)
        for (x, y), c in m.items():
            if c != "bg":
                continue
            nb = [m.get((x + dx, y + dy)) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy)]
            fig = [n for n in nb if n not in (None, "bg")]
            if len(fig) >= 5:
                new[(x, y)] = Counter(fig).most_common(1)[0][0]
        m = new
    return m


def main():
    # ---- views (left half only, x in [0, 23))
    front = class_map(HERE / "ref/front_std.png", 395, 0, 23)                 # image-right = +x
    back = class_map(HERE / "ref/back_std.png", 395, 0, 23, flip=True)        # image-right = -x, so image column i -> x = -i-1
    # clean-ups: sheet title text above the head and the neighbouring figure's spear bleeding into the front crop
    for (x, y) in list(front):
        if y > 76 or (x >= 10 and y >= 63) or (x >= 21):
            front[(x, y)] = "bg"
    for (x, y) in list(back):
        if y > 76 or (x >= 10 and y >= 63) or (x >= 24):
            back[(x, y)] = "bg"
    # side view: image-right = -z. z = (395 - px)/15 -> column index i (x0 = 395 + 15 i) covers z in [-(i+1), -i)
    side_grid = cell_grid(HERE / "ref/side_std.png", ox=395)
    side = {}
    for (i, j), c in side_grid.items():
        z = -i - 1 - side_shift(j)                                # measured per body region: the sheet's side view leans relative to the authored model
        if -14 <= z <= 16:
            side[(z, j)] = classify(c)
    for k in list(side):
        if k[1] > 76:
            side[k] = "bg"
    front, back, side = (drop_small_regions(fill_holes(despeckle(m)), int(os.environ.get('MINREG', '5'))) for m in (front, back, side))
    fg = lambda m, k: m.get(k, "bg") != "bg"

    # ---- hand-authored model as a depth envelope
    hand = set()
    boxes = []
    for pt in VP.all_parts():
        if pt["joint"] == "spear":
            continue
        x0, y0, z0, x1, y1, z1 = pt["box"]
        if x1 <= 0:                      # right-hand twins are mirrors of the left parts
            continue
        boxes.append((pt, (max(0, x0), y0, z0, x1, y1, z1)))
    ENV = int(os.environ.get('ENV', '0'))
    env = set()
    EX, EY, EZ = (int(v) for v in os.environ.get('ENVXYZ', '1,1,1').split(','))
    for pt, (x0, y0, z0, x1, y1, z1) in boxes:
        for x in range(int(np.floor(x0)) - EX, int(np.ceil(x1)) + EX):
            if x < 0:
                continue
            for y in range(int(np.floor(y0)) - EY, int(np.ceil(y1)) + EY):
                for z in range(int(np.floor(z0)) - EZ, int(np.ceil(z1)) + EZ):
                    env.add((x, y, z))

    hand_vox = set()
    for pt, (x0, y0, z0, x1, y1, z1) in boxes:
        for x in range(int(np.floor(x0)), int(np.ceil(x1))):
            for y in range(int(np.floor(y0)), int(np.ceil(y1))):
                for z in range(int(np.floor(z0)), int(np.ceil(z1))):
                    if x >= 0:
                        hand_vox.add((x, y, z))
    passes = lambda v: fg(front, (v[0], v[1])) and fg(back, (v[0], v[1])) and fg(side, (v[2], v[1]))
    hand_accent = {(x, y, z) for pt, (x0, y0, z0, x1, y1, z1) in boxes if pt['color'] in ('O', 'G') for x in range(int(np.floor(x0)), int(np.ceil(x1))) for y in range(int(np.floor(y0)), int(np.ceil(y1))) for z in range(int(np.floor(z0)), int(np.ceil(z1))) if x >= 0}
    dark_hand = {(x, y, z) for pt, (x0, y0, z0, x1, y1, z1) in boxes if pt['color'] in ('K', 'D') and pt['id'].startswith(('ear', 'neck', 'face', 'visor', 'helmet_back', 'hand', 'finger')) for x in range(int(np.floor(x0)), int(np.ceil(x1))) for y in range(int(np.floor(y0)), int(np.ceil(y1))) for z in range(int(np.floor(z0)), int(np.ceil(z1))) if x >= 0}
    occ = {v for v in hand_vox if passes(v) or v in hand_accent or (v in dark_hand and fg(side, (v[2], v[1])))}   # black parts read as backdrop in the views, so they are only carved by depth       # authored lights/trim are never carved away
    # envelope voxels beyond the authored boxes are only added where the sheet's silhouette needs them (a cell no authored
    # voxel covers in the front/back or side view); everywhere else they would just bury thin authored details
    cov_f = {(x, y) for (x, y, z) in occ}
    # silhouette-driven extras: ONE voxel per front-view cell no authored voxel covers, at the depth nearest the authored
    # geometry of that row (never a whole slab, which would bury thin authored details behind it)
    rows_z = {}
    for (x, y, z) in hand_vox:
        rows_z.setdefault(y, []).append((x, z))
    cand = {}
    for v in env - hand_vox:
        if passes(v) and (v[0], v[1]) not in cov_f:
            cand.setdefault((v[0], v[1]), []).append(v[2])
    for (x, y), zs in cand.items():
        near = [(abs(x - hx) * 2 + 0, hz) for hx, hz in rows_z.get(y, []) if abs(x - hx) <= 3]
        zc = np.mean([hz for _, hz in near]) if near else 0
        occ.add((x, y, min(zs, key=lambda z: abs(z - zc))))

    # ---- colour: hand-part colour by default; the sheet's own pixels override on the faces each view sees straight on
    def first_hit(direction):
        axis, sign = direction
        rays = {}
        for v in occ:
            rays.setdefault(tuple(v[a] for a in range(3) if a != axis), []).append(v)
        hit = set()
        for vs in rays.values():
            vs.sort(key=lambda v: v[axis] * sign, reverse=True)
            hit.add(vs[0])
        return hit
    vis = {"front": first_hit((2, +1)), "back": first_hit((2, -1)), "side": first_hit((0, +1))}
    hand_col = {}
    hand_owner = {}
    for pt, (x0, y0, z0, x1, y1, z1) in sorted(boxes, key=lambda pb: -(pb[1][3] - pb[1][0]) * (pb[1][4] - pb[1][1]) * (pb[1][5] - pb[1][2])):
        for x in range(int(np.floor(x0)), int(np.ceil(x1))):
            for y in range(int(np.floor(y0)), int(np.ceil(y1))):
                for z in range(int(np.floor(z0)), int(np.ceil(z1))):
                    hand_col[(x, y, z)] = pt["color"]           # small boxes are written last so they win
                    hand_owner[(x, y, z)] = pt["id"]
    near = {}
    for cls in ("N", "O", "G"):
        base = [v for v, c in hand_col.items() if c == cls]
        nz = set()
        for (x, y, z) in base:
            for dx in range(-2, 3):
                for dy in range(-2, 3):
                    for dz in range(-2, 3):
                        nz.add((x + dx, y + dy, z + dz))
        near[cls] = nz
    def hand_near(v):
        if v in hand_col:
            return hand_col[v]
        for r in (1, 2):
            cand = [hand_col[(v[0] + dx, v[1] + dy, v[2] + dz)] for dx in range(-r, r + 1) for dy in range(-r, r + 1) for dz in range(-r, r + 1)
                    if (v[0] + dx, v[1] + dy, v[2] + dz) in hand_col and hand_col[(v[0] + dx, v[1] + dy, v[2] + dz)] in ("I", "K", "D", "N")]
            if cand:
                return max(set(cand), key=cand.count)
        return "K"
    def dark_region(m, x, y):
        nb = [m.get((x + dx, y + dy)) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy)]
        return sum(1 for n in nb if n in ("K", "D")) >= 3
    def take(m, k, hand, accents_only=False, v=None):
        c = m.get(k)
        if c is None or c == "bg":
            return None
        if c in ("N", "O", "G"):
            return c if (v in near[c]) else None          # accents may only refine an accent the authored model already has nearby
        if accents_only:
            return None
        if c in ("K", "D"):
            if PROJECT != '1':
                return None
            if v is not None and v[1] < 10:
                return None                                   # boots: the sheet's toe shading is not armour structure
            return c if (hand in ("K", "D") or dark_region(m, *k)) else None
        return c if PROJECT == '1' else None                  # I
    col = {}
    for v in occ:
        x, y, z = v
        hand = hand_near(v)
        c = None
        if v in hand_accent:
            col[v] = hand; continue
        if v in vis["front"]:
            c = take(front, (x, y), hand, v=v)
        if c is None and v in vis["back"]:
            c = take(back, (x, y), hand, v=v)
        if c is None and v in vis["side"]:
            c = take(side, (z, y), hand, accents_only=True, v=v)
        col[v] = (c or hand) if PROJECT != '0' else hand
    # ---- joint assignment: nearest hand part by box-distance
    def dist(box, v):
        x0, y0, z0, x1, y1, z1 = box
        d = 0.0
        for a, lo, hi in ((v[0] + .5, x0, x1), (v[1] + .5, y0, y1), (v[2] + .5, z0, z1)):
            d += max(lo - a, 0, a - hi) ** 2
        return d
    # panel seams: where two different ivory plates meet, the outermost voxel of the thicker-than-3 plate becomes a dark line
    seam = set()
    if os.environ.get('SEAMS', '1') == '1':
        ext = {}
        for pt, (x0, y0, z0, x1, y1, z1) in boxes:
            ext[pt['id']] = (x1 - x0, y1 - y0, z1 - z0)
        for v in occ:
            if col[v] != 'I':
                continue
            for a, d in ((0, 1), (1, 1), (2, 1), (0, -1), (1, -1), (2, -1)):
                n = list(v); n[a] += d; n = tuple(n)
                if n in occ and col.get(n) == 'I' and hand_owner.get(n) != hand_owner.get(v) and hand_owner.get(v) and hand_owner.get(n):
                    if ext.get(hand_owner[v], (9, 9, 9))[a] >= 4 and (hand_owner[v] > hand_owner[n]):
                        seam.add(v)
        for v in seam:
            col[v] = 'D'
    out = []
    for v in sorted(occ):
        best = min(boxes, key=lambda pb: (dist(pb[1], v), (pb[1][3] - pb[1][0]) * (pb[1][4] - pb[1][1]) * (pb[1][5] - pb[1][2])))
        joint = best[0]["joint"]
        c = col[v]
        out.append([v[0], v[1], v[2], c, joint, best[0]["id"]])
    for row in out:
        if row[4] == 'head' and row[3] == 'G' and 63 <= row[1] <= 70:
            row[3] = 'O'
    # mirror to the right half: joint L -> R
    mir = []
    for x, y, z, c, j, pid in out:
        jr = j[:-1] + "R" if j.endswith("L") else j
        pr = pid[:-1] + "R" if pid.endswith("_L") else pid
        mir.append([-x - 1, y, z, c, jr, pr])
    allv = out + mir
    # coverage report: reference figure cells (front) that the model's silhouette misses / adds
    cover = {(x, y) for (x, y, z) in occ}
    ref_cells = {k for k in front if front[k] != 'bg'}
    print('front silhouette: missing', len(ref_cells - cover), 'extra', len(cover - ref_cells), 'ref', len(ref_cells))
    Path(HERE / "vox").mkdir(exist_ok=True)
    json.dump(allv, open(HERE / "vox/vanguard_voxels.json", "w"))
    from collections import Counter
    print("voxels", len(allv), Counter(v[3] for v in allv), Counter(v[4] for v in allv).most_common(6))


if __name__ == "__main__":
    main()
