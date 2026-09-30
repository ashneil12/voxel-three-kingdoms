"""Analysis-by-synthesis: project the model (T-pose) to front / back / left / right on the reference's own voxel grid and compare
with the matted reference views.  Writes renders/diff_<view>.png (reference | model | mismatch) and prints the counts.

usage: /usr/bin/python3 diff.py [--fit]   (--fit searches x/z/y offsets per view; otherwise the stored OFFSETS are used)
"""
import sys, json, colorsys
import numpy as np
from PIL import Image, ImageDraw
import model as M

PITCH = 6.2
CFG = {'front': dict(x0=0, cx=240.5, gy=452), 'left': dict(x0=480, cx=620, gy=452), 'back': dict(x0=768, cx=968, gy=452), 'right': dict(x0=1152, cx=1350, gy=452)}
OFFSETS = json.load(open('offsets.json')) if __import__('os').path.exists('offsets.json') else {}
COL = {'I': (240, 215, 170), 'N': (30, 70, 160), 'O': (255, 150, 30), 'K': (40, 38, 44), 'D': (80, 78, 88), 'B': (110, 170, 240), 'S': (40, 38, 44), '.': (225, 225, 225)}
BG = np.array([109, 111, 120])

def classify(rgb):
    if np.abs(rgb - BG).sum() < 12: return '.'
    r, g, b = (float(v) / 255 for v in rgb); h, s, v = colorsys.rgb_to_hsv(r, g, b); hd = h * 360
    if s > 0.7 and v > 0.7 and 18 <= hd < 48: return 'O'
    if 195 <= hd <= 262 and s > 0.42 and v > 0.2: return 'N'
    if v > 0.66 and s < 0.5 and 12 <= hd <= 58: return 'I'
    if v < 0.3: return 'K'
    return 'K' if v < 0.45 else 'I'

def ref_grid(view):
    im = np.asarray(Image.open(f'ref/{view}_matte.png').convert('RGB')).astype(float)
    c = CFG[view]; g = {}
    for j in range(0, 70):
        yc = c['gy'] - (j + 0.5) * PITCH
        for i in range(-42, 43):
            xc = c['cx'] - c['x0'] + i * PITCH
            xa, xb, ya, yb = int(xc - 2), int(xc + 2), int(yc - 2), int(yc + 2)
            if xa < 0 or ya < 0 or xb >= im.shape[1] or yb >= im.shape[0]: continue
            g[(i, j)] = classify(np.median(im[ya:yb + 1, xa:xb + 1].reshape(-1, 3), axis=0))
    return g

SPLIT = 39                      # rows at/above the hips shift by the upper-body offset (the rig's legs are 4 voxels longer than the reference's)
def project(vox, view, dx=0, dz=0, dyu=0, dyl=0):
    g = {}
    best = {}
    for (x, y, z), c in vox.items():
        dy = dyu if y >= SPLIT else dyl
        if view == 'front': key, depth = (x + dx, y + dy), z
        elif view == 'back': key, depth = (-x + dx - 1, y + dy), -z
        elif view == 'left': key, depth = (z + dz, y + dy), x            # face toward image right, viewer at +x
        else: key, depth = (-z + dz - 1, y + dy), -x                      # right view: face toward image left
        if key not in best or depth > best[key]: best[key] = depth; g[key] = c
    return g

def score(ref, mod):
    sil = col = 0; n = 0
    keys = set(k for k, v in ref.items() if v != '.') | set(mod)
    for k in keys:
        r = ref.get(k, '.'); m = mod.get(k, '.')
        if (r == '.') != (m == '.'): sil += 1
        elif r != m and r != '.': col += 1
        n += 1
    return sil, col

def render(ref, mod, name):
    W = 86; H = 66; S = 8
    img = Image.new('RGB', (W * S * 3 + 20, H * S), (255, 255, 255)); d = ImageDraw.Draw(img)
    for gi, g in enumerate((ref, mod)):
        for (i, j), c in g.items():
            if -43 <= i < 43 and 0 <= j < H:
                x = (i + 43) * S + gi * (W * S + 10); y = (H - 1 - j) * S
                d.rectangle([x, y, x + S - 1, y + S - 1], fill=COL.get(c, COL['.']))
    for (i, j) in set(list(ref) + list(mod)):
        r = ref.get((i, j), '.'); m = mod.get((i, j), '.')
        if r != m and not (r == '.' and m == '.'):
            x = (i + 43) * S + 2 * (W * S + 10); y = (H - 1 - j) * S
            silh = (r == '.') != (m == '.')
            d.rectangle([x, y, x + S - 1, y + S - 1], fill=(255, 60, 60) if silh else (255, 200, 0))
    img.save(f'renders/diff_{name}.png')

if __name__ == '__main__':
    import os; os.makedirs('renders', exist_ok=True)
    vox = M.rasterize(M.world_boxes())
    fit = '--fit' in sys.argv
    total = [0, 0]
    for view in ('front', 'back', 'left', 'right'):
        ref = ref_grid(view)
        if fit or view not in OFFSETS:
            best = None
            for dx in range(-4, 5):
                for dyu in range(-6, 1):
                    s = score(ref, project(vox, view, dx, dx, dyu, 0)); t = s[0] + s[1] * 0.5
                    if best is None or t < best[0]: best = (t, dx, dyu)
            OFFSETS[view] = [best[1], best[2]]
        dx, dy = OFFSETS[view]
        mod = project(vox, view, dx, dx, dy, 0)
        sil, col = score(ref, mod); total[0] += sil; total[1] += col
        nref = sum(1 for v in ref.values() if v != '.')
        print(f'{view:6s} offset x {dx:+d} upper-y {dy:+d}  silhouette mismatch {sil:4d}  colour mismatch {col:4d}  (ref cells {nref})')
        render(ref, mod, view)
    json.dump(OFFSETS, open('offsets.json', 'w'))
    print('total', total)
