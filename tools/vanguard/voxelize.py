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
PROJECT = os.environ.get('PROJECT', '0') == '1'   # 0 = hand-authored colours only (shape still carved from the views)
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
        z = -i - 1
        if -14 <= z <= 16:
            side[(z, j)] = classify(c)
    for k in list(side):
        if k[1] > 76:
            side[k] = "bg"
    front, back, side = (fill_holes(despeckle(m)) for m in (front, back, side))
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
    ENV = 0
    env = set()
    for pt, (x0, y0, z0, x1, y1, z1) in boxes:
        for x in range(int(np.floor(x0)) - ENV, int(np.ceil(x1)) + ENV):
            if x < 0:
                continue
            for y in range(int(np.floor(y0)) - ENV, int(np.ceil(y1)) + ENV):
                for z in range(int(np.floor(z0)) - ENV, int(np.ceil(z1)) + ENV):
                    env.add((x, y, z))

    occ = set()
    for (x, y, z) in env:
        if fg(front, (x, y)) and fg(back, (x, y)) and fg(side, (z, y)):
            occ.add((x, y, z))

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
    for pt, (x0, y0, z0, x1, y1, z1) in sorted(boxes, key=lambda pb: -(pb[1][3] - pb[1][0]) * (pb[1][4] - pb[1][1]) * (pb[1][5] - pb[1][2])):
        for x in range(int(np.floor(x0)), int(np.ceil(x1))):
            for y in range(int(np.floor(y0)), int(np.ceil(y1))):
                for z in range(int(np.floor(z0)), int(np.ceil(z1))):
                    hand_col[(x, y, z)] = pt["color"]           # small boxes are written last so they win
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
            return c if (hand in ("K", "D") or dark_region(m, *k)) else None
        return c                                             # I
    col = {}
    for v in occ:
        x, y, z = v
        hand = hand_col.get(v, "K")
        c = None
        if v in vis["front"]:
            c = take(front, (x, y), hand, v=v)
        if c is None and v in vis["back"]:
            c = take(back, (x, y), hand, v=v)
        if c is None and v in vis["side"]:
            c = take(side, (z, y), hand, accents_only=True, v=v)
        col[v] = (c or hand) if PROJECT else hand
    # ---- joint assignment: nearest hand part by box-distance
    def dist(box, v):
        x0, y0, z0, x1, y1, z1 = box
        d = 0.0
        for a, lo, hi in ((v[0] + .5, x0, x1), (v[1] + .5, y0, y1), (v[2] + .5, z0, z1)):
            d += max(lo - a, 0, a - hi) ** 2
        return d
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
    Path(HERE / "vox").mkdir(exist_ok=True)
    json.dump(allv, open(HERE / "vox/vanguard_voxels.json", "w"))
    from collections import Counter
    print("voxels", len(allv), Counter(v[3] for v in allv), Counter(v[4] for v in allv).most_common(6))


if __name__ == "__main__":
    main()
