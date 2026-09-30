"""Sample the reference's views on the model's own voxel grid (pitch ~6.2 px) → class grids + debug images.
usage: python3 grid.py  (writes ref/grid_<view>.png and ref/grid_<view>.txt)"""
import colorsys, numpy as np
from PIL import Image, ImageDraw
im = np.asarray(Image.open('ref/vanguard_ref.png').convert('RGB')).astype(float)
PITCH = 6.2
VIEWS = {'front': (0, 480), 'left': (480, 768), 'back': (768, 1152), 'right': (1152, 1536)}
def classify(rgb):
    r, g, b = (float(v) / 255 for v in rgb); h, s, v = colorsys.rgb_to_hsv(r, g, b); hd = h * 360
    if s > 0.72 and v > 0.7 and 20 <= hd < 48: return 'O'
    if 205 <= hd <= 255 and s > 0.5 and v > 0.25: return 'N'
    if v > 0.72 and s < 0.42 and 15 <= hd <= 55: return 'I'
    if v < 0.26 and s < 0.5: return 'K'
    return '.'
def sample(cx, gy, x0, x1, y0, y1):
    """cells centred on column cx (cell 0 spans cx±pitch/2), row 0 = ground row above gy."""
    out = {}
    nx0 = int((x0 - cx) / PITCH) - 1; nx1 = int((x1 - cx) / PITCH) + 1
    for j in range(0, int((gy - y0) / PITCH) + 2):
        for i in range(nx0, nx1):
            xc = cx + i * PITCH; yc = gy - (j + 0.5) * PITCH
            xa, xb, ya, yb = int(xc - 2), int(xc + 2), int(yc - 2), int(yc + 2)
            if xa < 0 or ya < 0 or yb >= im.shape[0]: continue
            out[(i, j)] = classify(np.median(im[ya:yb + 1, xa:xb + 1].reshape(-1, 3), axis=0))
    return out
if __name__ == '__main__':
    import sys
    cfg = {'front': dict(cx=240.5, gy=452), 'left': dict(cx=620, gy=452), 'back': dict(cx=968, gy=452), 'right': dict(cx=1350, gy=452)}
    COL = {'I': (240, 215, 170), 'N': (30, 70, 160), 'O': (255, 150, 30), 'K': (40, 38, 44), '.': (230, 230, 230)}
    for name, c in cfg.items():
        x0, x1 = VIEWS[name]
        g = sample(c['cx'], c['gy'], x0 + 5, x1 - 5, 40, c['gy'])
        ii = [i for (i, j) in g]; W = max(ii) - min(ii) + 1; H = max(j for (i, j) in g) + 1
        S = 12; img = Image.new('RGB', (W * S + 40, H * S + 20), (255, 255, 255)); d = ImageDraw.Draw(img)
        lines = []
        for j in range(H - 1, -1, -1):
            row = ''
            for i in range(min(ii), max(ii) + 1):
                c2 = g.get((i, j), '.'); row += c2
                d.rectangle([40 + (i - min(ii)) * S, (H - 1 - j) * S, 40 + (i - min(ii) + 1) * S - 1, (H - j) * S - 1], fill=COL[c2])
            lines.append(f'{j:3d} {row}')
            if j % 5 == 0: d.text((2, (H - 1 - j) * S), str(j), fill=(0, 0, 0))
        open(f'ref/grid_{name}.txt', 'w').write(f'# cols {min(ii)}..{max(ii)} (0 = centre column)\n' + '\n'.join(lines))
        img.save(f'ref/grid_{name}.png')
        print(name, W, H, min(ii), max(ii))
