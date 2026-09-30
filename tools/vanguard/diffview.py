"""Front/back/side class-map comparison: reference (cleaned) | model (front-most voxel colour per cell) | mismatch."""
import json, sys, os
from pathlib import Path
from PIL import Image, ImageDraw
sys.path.insert(0, str(Path(__file__).parent))
import voxelize as V
COL = {'I': (240, 207, 166), 'N': (30, 70, 160), 'O': (255, 149, 40), 'G': (240, 178, 50), 'K': (35, 32, 38), 'D': (70, 66, 76), 'bg': (20, 24, 32), None: (20, 24, 32)}
rows = json.load(open(Path(__file__).parent / 'vox/vanguard_voxels.json'))
left = [r for r in rows if r[0] >= 0]
def front_proj(axis):
    best = {}
    for x, y, z, c, j, p in left:
        key = (x, y) if axis == 'front' else ((x, y) if axis == 'back' else (z, y))
        d = z if axis == 'front' else (-z if axis == 'back' else x)
        if key not in best or d > best[key][0]:
            best[key] = (d, c)
    return {k: v[1] for k, v in best.items()}
def refmap(kind):
    if kind == 'front':
        m = V.class_map(Path('ref/front_std.png'), 395, 0, 23)
        for k in list(m):
            if k[1] > 76 or (k[0] >= 10 and k[1] >= 63) or k[0] >= 21: m[k] = 'bg'
    elif kind == 'back':
        m = V.class_map(Path('ref/back_std.png'), 395, 0, 23, flip=True)
        for k in list(m):
            if k[1] > 76 or (k[0] >= 10 and k[1] >= 63) or k[0] >= 24: m[k] = 'bg'
    else:
        g = V.cell_grid(Path('ref/side_std.png'), ox=395); m = {}
        for (i, j), c in g.items():
            z = -i - 1 - V.side_shift(j)
            if -14 <= z <= 16 and j <= 76: m[(z, j)] = V.classify(c)
    return V.fill_holes(V.despeckle(m))
def panel(kind):
    ref = refmap(kind); mod = front_proj(kind)
    xs = [k[0] for k in list(ref) + list(mod)]; ys = [k[1] for k in list(ref) + list(mod)]
    x0, x1, y0, y1 = min(xs), max(xs), 0, 80
    S = 10; W = (x1 - x0 + 1) * S; H = (y1 - y0 + 1) * S
    out = Image.new('RGB', (W * 3 + 20, H), (10, 10, 10))
    stats = [0, 0]
    for idx in range(3):
        px = out.load()
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                r = ref.get((x, y), 'bg'); r = 'bg' if r is None else r; m = mod.get((x, y), 'bg')
                if idx == 0: c = COL[r]
                elif idx == 1: c = COL[m]
                else:
                    if (r == 'bg') != (m == 'bg'): c = (255, 0, 0) if m != 'bg' else (255, 255, 0); stats[0] += 1   # red: model extra, yellow: model missing
                    elif r != m and r != 'bg': c = (255, 0, 255); stats[1] += 1                                    # magenta: colour differs
                    else: c = (40, 40, 40) if r == 'bg' else COL[m]
                for dx in range(S):
                    for dy in range(S):
                        X = idx * (W + 10) + (x - x0) * S + dx; Y = (y1 - y) * S + dy
                        if 0 <= Y < H: px[X, Y] = c
    return out, stats
for kind in ('front', 'back', 'side'):
    im, st = panel(kind); im.save(f'vox/diff_{kind}.png'); print(kind, im.size, 'silhouette mismatches', st[0], 'colour mismatches', st[1])
