import sys; sys.path.insert(0, __import__('os').path.dirname(__file__))
from common import *
reset(); import_master()
for v in VIEWS: shoot(f"{ROOT}/renders/master_{v}.png", v, target=(0, 0, 0), scale=1.15)
print("RENDERED")
