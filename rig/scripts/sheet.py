import sys, glob, os
from PIL import Image, ImageDraw
V = "renders/validation"
def sheet(joint, out=None, views=("front34", "left", "front")):
    labels = []
    for f in sorted(glob.glob(f"{V}/joint_{joint}_*_{views[0]}.png")):
        labels.append(os.path.basename(f)[len(f"joint_{joint}_"):-len(f"_{views[0]}.png")])
    labels = ["rest"] + [l for l in labels if l != "rest"]
    ims = [[Image.open(f"{V}/joint_{joint}_{l}_{v}.png").convert("RGB") for v in views] for l in labels]
    w, h = ims[0][0].size
    s = Image.new("RGB", (w * len(views), h * len(labels)), "white"); d = ImageDraw.Draw(s)
    for r, row in enumerate(ims):
        for c, im in enumerate(row): s.paste(im, (c * w, r * h))
        d.text((6, r * h + 6), f"{joint} {labels[r]}", fill=(0, 0, 0))
    s.save(out or f"{V}/sheet_{joint}.png"); return out or f"{V}/sheet_{joint}.png"
if __name__ == "__main__":
    for j in sys.argv[1:]: print(sheet(j))
