import sys, os, colorsys; sys.path.insert(0, os.path.dirname(__file__))
from common import *
import common
reset(); o = import_master()
d = np.load(f"{ROOT}/reports/segmentation.npz", allow_pickle=True)
check_order(o, d["centroids"])
part = d["part"]; names = list(d["names"])
me = o.data
attr = me.color_attributes.new("seg", 'FLOAT_COLOR', 'CORNER')
cols = np.array([colorsys.hsv_to_rgb((i * 0.61803) % 1, 0.75, 0.95) + (1,) for i in range(len(names))])
starts = np.empty(len(me.polygons), np.int32); me.polygons.foreach_get("loop_start", starts)
tot = np.empty(len(me.polygons), np.int32); me.polygons.foreach_get("loop_total", tot)
loopcol = np.zeros((len(me.loops), 4), np.float32)
for f in range(len(me.polygons)): loopcol[starts[f]:starts[f] + tot[f]] = cols[part[f]]
attr.data.foreach_set("color", loopcol.ravel())
common.COLOR_TYPE = 'VERTEX'
for v in ("front", "back", "front34"): shoot(f"{ROOT}/renders/seg_{v}.png", v, target=(0, 0, 0), scale=1.15)
print("legend", list(zip(names, [tuple(round(c, 2) for c in cc[:3]) for cc in cols])))
