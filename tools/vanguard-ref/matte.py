"""Matte the figure out of each reference view (colour classes → largest connected blob → closing) and write
ref/<view>_matte.png (figure on flat grey #6d6f78) + ref/<view>_mask.png. The views sit on a busy sunset arena, so the
admission gate cannot isolate a silhouette from the raw crops."""
import colorsys, sys
import numpy as np
from PIL import Image
from collections import deque
def classes(rgb):
    a = rgb.astype(float) / 255; r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(-1); mn = a.min(-1); d = mx - mn + 1e-9; s = d / (mx + 1e-9)
    h = np.zeros_like(mx)
    m = mx == r; h[m] = ((g - b)[m] / d[m]) % 6
    m = mx == g; h[m] = (b - r)[m] / d[m] + 2
    m = mx == b; h[m] = (r - g)[m] / d[m] + 4
    h = h * 60; v = mx
    O = (s > 0.7) & (v > 0.7) & (h >= 18) & (h < 48)
    N = (h >= 205) & (h <= 255) & (s > 0.45) & (v > 0.22)
    I = (v > 0.68) & (s < 0.45) & (h >= 12) & (h <= 58)
    K = (v < 0.27) & ((s < 0.22) | ((h >= 200) & (h <= 300) & (s < 0.6)))
    return O | N | I | K
def largest(mask, seed_box):
    H, W = mask.shape; lab = np.zeros((H, W), np.int32); best = (0, 0); n = 0
    for y0 in range(H):
        for x0 in range(W):
            if mask[y0, x0] and not lab[y0, x0]:
                n += 1; q = deque([(y0, x0)]); lab[y0, x0] = n; cnt = 0
                while q:
                    y, x = q.popleft(); cnt += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not lab[yy, xx]:
                            lab[yy, xx] = n; q.append((yy, xx))
                if cnt > best[0]: best = (cnt, n)
    return lab == best[1]
def dilate(m, k):
    out = m.copy()
    for _ in range(k):
        o = out.copy(); o[1:] |= out[:-1]; o[:-1] |= out[1:]; o[:, 1:] |= out[:, :-1]; o[:, :-1] |= out[:, 1:]; out = o
    return out
def erode(m, k): return ~dilate(~m, k)
for view in ('front', 'left', 'back', 'right'):
    im = np.asarray(Image.open(f'ref/{view}.png').convert('RGB'))
    m = classes(im)
    m[:, :6] = False; m[:, -6:] = False
    m[455:] = False
    m = erode(dilate(m, 3), 3)            # close small gaps (cells are ~6 px)
    m = largest(m, None)
    m = dilate(erode(m, 4), 4) & m          # opening: drop poles / fence strands still attached to the feet
    m = largest(m, None)
    m = erode(dilate(m, 2), 2)
    out = np.full_like(im, (109, 111, 120)); out[m] = im[m]
    Image.fromarray(out).save(f'ref/{view}_matte.png'); Image.fromarray((m * 255).astype(np.uint8)).save(f'ref/{view}_mask.png')
    ys, xs = np.nonzero(m); print(view, xs.min(), xs.max(), ys.min(), ys.max(), int(m.sum()))
