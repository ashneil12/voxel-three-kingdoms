"""Shared Blender helpers. Blender space: master is 1.0 tall, feet at z=-0.5, character faces -Y, character's left = +X."""
import bpy, os, math, mathutils
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MASTER = f"{ROOT}/assets/master/robot_master.glb"

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def import_master():
    bpy.ops.import_scene.gltf(filepath=MASTER)
    return [o for o in bpy.data.objects if o.type == 'MESH'][0]

COLOR_TYPE = 'TEXTURE'
VIEWS = {  # name: (azimuth deg from -Y toward +X, elevation deg)
    "front": (0, 4), "left": (90, 4), "right": (-90, 4), "back": (180, 4), "front34": (35, 8), "rear34": (145, 8)}

def setup_render(w=700, h=900, engine='BLENDER_WORKBENCH'):
    sc = bpy.context.scene
    sc.render.engine = engine
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.film_transparent = False
    sh = sc.display.shading
    sh.light = 'STUDIO'; sh.color_type = COLOR_TYPE; sh.show_shadows = False; sh.show_cavity = False
    sh.background_type = 'VIEWPORT'; sh.background_color = (0.83, 0.82, 0.79)
    sc.view_settings.view_transform = 'Standard'
    sc.render.image_settings.file_format = 'PNG'
    if not sc.camera:
        cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
    sc.camera.data.type = 'ORTHO'
    return sc

def shoot(path, view="front", target=(0, 0, 0), scale=1.15, size=(700, 900), pose_note=None):
    sc = setup_render(*size)
    cam = sc.camera
    az, el = [math.radians(v) for v in VIEWS[view]] if isinstance(view, str) else [math.radians(v) for v in view]
    d = 6.0
    tx, ty, tz = target
    cam.location = (tx + d * math.sin(az) * math.cos(el), ty - d * math.cos(az) * math.cos(el), tz + d * math.sin(el))
    direction = mathutils.Vector((tx, ty, tz)) - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    cam.data.ortho_scale = scale
    cam.data.clip_start, cam.data.clip_end = 0.1, 50
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)

import numpy as np, bmesh

def gltf_to_blender(p):
    p = np.asarray(p, float); return np.array([p[..., 0], -p[..., 2], p[..., 1]]).T if p.ndim > 1 else np.array([p[0], -p[2], p[1]])

def face_centroids(obj):
    me = obj.data; n = len(me.polygons); c = np.empty(n * 3); me.polygons.foreach_get("center", c); return c.reshape(-1, 3)

def check_order(obj, centroids_gltf):
    """Blender import must keep the glTF face order so numpy labels map 1:1."""
    cb = face_centroids(obj); exp = gltf_to_blender(centroids_gltf)
    err = np.abs(cb - exp).max()
    assert cb.shape == exp.shape and err < 1e-4, f"face order/space mismatch (max err {err})"

def split_by_label(obj, labels, names):
    """Split `obj` (faces labelled 0..k-1) into k objects named `names`; each keeps materials/UVs."""
    me = obj.data
    out = {}
    for k, nm in enumerate(names):
        bm = bmesh.new(); bm.from_mesh(me)
        bm.faces.ensure_lookup_table()
        kill = [f for f in bm.faces if labels[f.index] != k]
        bmesh.ops.delete(bm, geom=kill, context='FACES')
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
        nme = bpy.data.meshes.new(nm); bm.to_mesh(nme); bm.free()
        for mat in me.materials: nme.materials.append(mat)
        o = bpy.data.objects.new(nm, nme); bpy.context.scene.collection.objects.link(o)
        out[nm] = o
    return out

def _keys(p):
    return set(map(tuple, np.round(np.asarray(p) * 1e5).astype(np.int64)))

def cap_boundaries(obj, mat, cut_pts_gltf):
    """Fill only the NEW cut loops (open boundary edges whose endpoints lie on the cut) with faces using `mat`.
    Holes that already exist in the master are left exactly as they were. Returns faces added."""
    keys = _keys(gltf_to_blender(np.asarray(cut_pts_gltf)))
    bm = bmesh.new(); bm.from_mesh(obj.data)
    q = lambda v: tuple(np.round(np.array(v.co) * 1e5).astype(np.int64))
    # the import splits vertices along texture-chart seams; weld ONLY the vertices on the cut so the loop closes
    bmesh.ops.remove_doubles(bm, verts=[v for v in bm.verts if q(v) in keys], dist=1e-6)
    edges = [e for e in bm.edges if e.is_boundary and q(e.verts[0]) in keys and q(e.verts[1]) in keys]
    if not edges: bm.free(); return 0
    res = bmesh.ops.holes_fill(bm, edges=edges, sides=100000)
    new = res["faces"]
    idx = obj.data.materials.find(mat.name)
    if idx < 0: obj.data.materials.append(mat); idx = len(obj.data.materials) - 1
    for f in new: f.material_index = idx
    bm.to_mesh(obj.data); bm.free()
    return len(new)

def dark_material(name="joint_dark", color=(0.035, 0.04, 0.045, 1)):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color; bsdf.inputs["Metallic"].default_value = 0.8; bsdf.inputs["Roughness"].default_value = 0.45
    m.diffuse_color = color
    return m

def empty(name, loc, parent=None):
    e = bpy.data.objects.new(name, None); e.empty_display_type = 'ARROWS'; e.empty_display_size = 0.02
    bpy.context.scene.collection.objects.link(e); e.location = loc
    bpy.context.view_layer.update()
    if parent: e.parent = parent; e.matrix_parent_inverse = parent.matrix_world.inverted()
    return e

def parent_keep(child, parent):
    bpy.context.view_layer.update()
    child.parent = parent; child.matrix_parent_inverse = parent.matrix_world.inverted()


def apply_clip_frame(clips, name, f):
    """Pose the rig from reports/clips.json (the numeric source of truth for the animation) at integer frame f."""
    c = clips[name]; f = f % c["frames"] if c["loop"] else min(f, c["frames"] - 1)
    for jn, rots in c["joints"].items():
        o = bpy.data.objects[jn]; o.rotation_mode = 'XYZ'; o.rotation_euler = tuple(rots[f])
    bpy.data.objects["pelvis_joint"].location = tuple(c["pelvis"][f])
    bpy.context.view_layer.update()
