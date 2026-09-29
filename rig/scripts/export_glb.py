"""Steps 14-15: reset to the rest pose, save 08_export_ready.blend, export the STATIC articulated hierarchy as GLB.
(Animation tracks are injected from reports/clips.json by scripts/add_animations.mjs so clip data stays deterministic.)"""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from common import *
from rigdef import *
bpy.ops.wm.open_mainfile(filepath=f"{ROOT}/assets/working/07_animated.blend")
for o in bpy.data.objects:
    if o.animation_data: o.animation_data_clear()
    if o.type == 'EMPTY' and not o.name.startswith("weapon_socket"): o.rotation_mode = 'XYZ'; o.rotation_euler = (0, 0, 0)
bpy.data.objects["pelvis_joint"].location = tuple(np.array(PIV["waist"]) * [1, 1, 0] + [0, 0, PIV["hip"]["L"][2]])
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=f"{ROOT}/assets/working/08_export_ready.blend")
bpy.ops.object.select_all(action='DESELECT')
out = f"{ROOT}/assets/output/robot_static.glb"
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=False, export_yup=True, use_selection=False,
    export_apply=False, export_cameras=False, export_lights=False, export_extras=False, export_image_format='AUTO')
print("EXPORTED", out, os.path.getsize(out))
