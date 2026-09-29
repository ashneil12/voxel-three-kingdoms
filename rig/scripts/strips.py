from PIL import Image, ImageDraw
import glob, os
for name in ("Idle","Walk","Attack_Spear"):
    for view in ("right","front34"):
        fs=sorted(glob.glob(f"renders/validation/clip_{name}_*_{view}.png"))
        ims=[Image.open(f).convert("RGB") for f in fs]
        w,h=ims[0].size; s=Image.new("RGB",(w*len(ims),h),"white"); d=ImageDraw.Draw(s)
        for i,(im,f) in enumerate(zip(ims,fs)): s.paste(im,(i*w,0)); d.text((i*w+6,6),os.path.basename(f).split("_")[-2],fill=(0,0,0))
        s.save(f"renders/validation/strip_{name}_{view}.png")
