"""Step 9: separate spear object + weapon sockets. The hand geometry is untouched; the socket orientation is solved so the
spear is held across the fist in the 'ready' pose (right hand). Saves 06_weapon_socket.blend."""
import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from common import *
from rigdef import *
from mathutils import Vector, Matrix, Euler
bpy.ops.wm.open_mainfile(filepath=f"{ROOT}/assets/working/05_rigged.blend")
D = math.radians
def mat(name, color, metal=0.7, rough=0.4, emit=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = color; b.inputs["Metallic"].default_value = metal; b.inputs["Roughness"].default_value = rough
    if emit: b.inputs["Emission Color"].default_value = emit; b.inputs["Emission Strength"].default_value = 1.5
    m.diffuse_color = color; return m
M_SHAFT = mat("spear_shaft", (0.05, 0.065, 0.08, 1)); M_STEEL = mat("spear_steel", (0.5, 0.55, 0.58, 1), .9, .3)
M_BLADE = mat("spear_blade", (0.58, 0.6, 0.6, 1), .8, .3); M_AMBER = mat("spear_amber", (1, .55, .12, 1), 0, .4, (1, .5, .1, 1))
parts = []
def cyl(r, z0, z1, m, name):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=z1 - z0, location=(0, 0, (z0 + z1) / 2), vertices=20)
    o = bpy.context.active_object; o.name = name; o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    parts.append(o); return o
# lance in master units (robot is 1.0 tall): +Z tip, origin at the grip
cyl(.0115, -.16, 1.02, M_SHAFT, "shaft")
cyl(.017, -.175, -.14, M_STEEL, "butt_cap"); cyl(.0185, -.14, -.125, M_AMBER, "butt_ring")
for z in (0.36, 0.60, 0.68): cyl(.0185, z, z + .022, M_STEEL, f"collar_{z}"); cyl(.0195, z + .022, z + .03, M_AMBER, f"collar_ring_{z}")
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, .80)); r = bpy.context.active_object; r.scale = (.05, .04, .13); r.name = "receiver"; r.data.materials.append(M_SHAFT); parts.append(r)
# blade: broad leaf, extruded
import bmesh
me = bpy.data.meshes.new("blade"); bm = bmesh.new()
pts = [(-.035, 0.0), (.035, 0.0), (.06, .06), (.05, .16), (0, .27), (-.05, .16), (-.06, .06)]
vs = [bm.verts.new((0, x, 1.02 + z)) for x, z in pts]; f = bm.faces.new(vs)
res = bmesh.ops.extrude_face_region(bm, geom=[f]); v2 = [e for e in res["geom"] if isinstance(e, bmesh.types.BMVert)]
bmesh.ops.translate(bm, vec=(.014, 0, 0), verts=v2); bmesh.ops.translate(bm, vec=(-.007, 0, 0), verts=list(bm.verts))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
bl = bpy.data.objects.new("blade", me); bpy.context.scene.collection.objects.link(bl); me.materials.append(M_BLADE); parts.append(bl)
bpy.ops.object.select_all(action='DESELECT')
for p in parts: p.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join(); spear = bpy.context.active_object; spear.name = "spear"; spear.data.name = "spear_mesh"

hand = bpy.data.objects["hand_R"]
sock = empty("weapon_socket_R", PIV["wrist"]["R"] + np.array([0, 0, -.045]), hand)     # palm centre ~4.5 cm below the wrist pivot
sockL = empty("weapon_socket_L", PIV["wrist"]["L"] + np.array([0, 0, -.045]), bpy.data.objects["hand_L"])
# ready pose (right arm): upper arm forward, elbow flexed, so the fist sits in front of the chest
def pose(d):
    for o in bpy.data.objects:
        if o.type == 'EMPTY' and not o.name.startswith('weapon_socket'): o.rotation_mode = 'XYZ'; o.rotation_euler = (0, 0, 0)
    for k, v in d.items(): bpy.data.objects[k].rotation_euler = tuple(D(a) for a in v)
    bpy.context.view_layer.update()
READY = {"shoulder_R": (-38, 0, 8), "elbow_R": (-100, 0, 0), "wrist_R": (10, 0, 0)}
pose(READY)
hw = hand.matrix_world.to_3x3().normalized()
want = Vector((0.0, -0.18, 1.0)).normalized()                 # spear axis in world: up, leaning slightly forward
# solve socket rotation so socket +Z (spear axis) == want in the ready pose: q_local = hw^-1 * align
align = want.to_track_quat('Z', 'Y').to_matrix()
local = hw.inverted() @ align
sock.rotation_mode = 'XYZ'; sock.rotation_euler = local.to_euler()
bpy.context.view_layer.update()
spear.parent = sock; spear.matrix_parent_inverse = Matrix.Identity(4); spear.location = (0, 0, 0); spear.rotation_euler = (0, 0, 0)
pose({})
bpy.ops.wm.save_as_mainfile(filepath=f"{ROOT}/assets/working/06_weapon_socket.blend")
print("SOCKET DONE", tuple(round(math.degrees(a), 1) for a in sock.rotation_euler))
