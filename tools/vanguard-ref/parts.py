"""Vanguard v2 — the model as boxes per rig joint, transcribed from ref/vanguard_ref.png (grids: grid.py / diff.py).

One source of truth for three consumers: build_spec.py (img2threejs spec, T-pose like the reference), diff.py (front / side / back
comparison against the reference grid) and export_game.py (hero data for the EXO game rig, limbs hanging).

Units: 1 voxel = 0.0273 pose units (62 voxels tall; x HERO_SCALE 1.08 => 0.0295 m in game). Joint-local frames:
+x = the character's LEFT (outward for left-side parts; `_L` parts are mirrored automatically to `_R`), +y up, +z forward.
Limb parts hang along -y from their joint; the T-pose transform (arms out, legs in a slight A-stance) is applied only for the spec /
diff (model.py).  Colours: I ivory, N navy, O orange light, K black, D dark grey, B blade blue, S shaft.
Body z is centred on the torso (the reference's head sits ~1.5 voxels forward of it), the head on its own centre.
"""

# world pivots in the T-pose frame (x lateral, y = voxel row above the ground, z forward) -------------------------------
PIVOT = {
    "root": (0, 0, 0), "hips": (0, 37, -1), "spine": (0, 39, -1), "chest": (0, 46, -1), "neck": (0, 55, -1), "head": (0, 57, 0),
    "shoulder": (9, 54, -1),                      # pauldron helper (rides the shoulder, not the arm)
    "upperArm": (8, 49, -1), "foreArm": (19, 49, -1), "hand": (29, 49, -1),   # arm axis row 49 in the T-pose
    "thigh": (4, 35, -1), "shin": (4, 19, -1), "foot": (4, 3, -1),            # legs: rig thigh/shin = 16 voxels each (the reference's are 4 shorter)
    "spear": (-30, 38, 0),
}
SPLAY = 0.20            # A-stance in the reference: x offset per voxel below the hip row
ARM = ("upperArm", "foreArm", "hand")
LEG = ("thigh", "shin", "foot")
MIRRORED = ("shoulder", "upperArm", "foreArm", "hand", "thigh", "shin", "foot")

PARTS = []   # dict(id, joint, box=(x0,y0,z0,x1,y1,z1) local, c)


def P(pid, joint, box, c, note=""):
    PARTS.append(dict(id=pid, joint=joint, box=tuple(box), c=c, note=note))


# ------------------------------------------------------------------ head (chin row 53 = y 0; head-centred z)
P("head_jaw", "head", (-4, 0, -5, 5, 2, 3), "K", "dark lower face plate (rows 53-54)")
P("head_cheek_L", "head", (3, 0, 3, 5, 2, 5), "I", "white cheek guard")
P("head_core", "head", (-5, 2, -6, 6, 7, 3), "I", "white helmet shell (rows 55-59)")
P("head_frame", "head", (-5, 2, 3, 6, 4, 4), "K", "dark visor frame")
P("head_visor", "head", (-4, 2, 4, 4, 4, 5), "O", "orange visor slab (emissive)")
P("head_band", "head", (-5, 4, 3, 6, 7, 5), "I", "white brow band wrapping the front")
P("head_brim", "head", (-4, 5, 5, 5, 8, 7), "I", "brim over the visor")
P("head_dome", "head", (-4, 7, -5, 5, 9, 6), "I", "helmet dome")
P("head_crest", "head", (-2, 6, -3, 3, 10, 3), "N", "navy crest block on top")
P("head_crest_cap", "head", (-1, 10, -3, 2, 11, 1), "N", "crest cap")
P("head_ear_L", "head", (5, 2, -3, 6, 6, 3), "N", "navy ear bearing")
P("head_ear_light_L", "head", (6, 3, -1, 7, 6, 2), "O", "orange ear light (emissive)")
P("head_nape", "head", (-4, 1, -7, 5, 4, -5), "I", "rear neck guard")
P("neck_core", "neck", (-3, -2, -4, 4, 2, 3), "K", "neck collar")

# ------------------------------------------------------------------ chest (joint row 42)
P("chest_core", "chest", (-6, -3, -4, 7, 8, 3), "K", "dark torso core")
P("chest_pec_L", "chest", (4, -1, -4, 7, 7, 5), "I", "white side plate")
P("chest_bar", "chest", (-4, 5, 4, 5, 7, 7), "N", "navy T bar")
P("chest_stem", "chest", (-3, -2, 4, 4, 5, 7), "N", "navy T stem")
P("chest_stem_low", "chest", (-2, -4, 4, 3, -2, 6), "N", "stem taper onto the belly")
P("chest_shell_back_L", "chest", (4, -1, -6, 7, 7, -4), "I", "white back shell")
P("chest_back", "chest", (-4, -2, -8, 5, 7, -6), "N", "navy back plate")
P("chest_back_link", "chest", (-2, -1, -6, 3, 6, -4), "K", "back plate mount")
P("chest_collar", "chest", (-4, 7, -4, 5, 9, 3), "K", "collar")

# ------------------------------------------------------------------ waist / belt / tabards
P("spine_core", "spine", (-5, 0, -4, 6, 7, 4), "K", "dark abdomen")
P("spine_light", "spine", (-1, 2, 4, 1, 4, 5), "O", "orange waist square (emissive)")
P("hips_pelvis", "hips", (-6, -5, -5, 7, 1, 4), "K", "dark pelvis")
P("hips_belt", "hips", (-5, 1, -4, 5, 3, 4), "I", "white belt block")
P("tabard_front", "hips", (-4, -16, 4, 4, 0, 5), "N", "navy front tabard")
P("tabard_front_tip", "hips", (-3, -17, 4, 3, -16, 5), "N", "tabard taper")
P("tabard_front_light_top", "hips", (-2, -2, 5, 2, 0, 6), "O", "orange square under the belt (emissive)")
P("tabard_front_light_low", "hips", (-2, -14, 5, 2, -12, 6), "O", "orange square near the hem (emissive)")
P("tabard_back", "hips", (-4, -16, -8, 4, 0, -7), "N", "navy back tabard")
P("tabard_back_tip", "hips", (-3, -17, -8, 3, -16, -7), "N", "tabard taper")
P("tabard_back_light", "hips", (-2, -14, -9, 2, -12, -8), "O", "orange square (emissive)")

# ------------------------------------------------------------------ shoulders (pauldron helper, joint = shoulder row 50)
P("pauldron_cap_L", "shoulder", (0, -3, -4, 4, 3, 3), "I", "white pauldron cap")
P("pauldron_navy_L", "shoulder", (4, -3, -4, 6, 3, 3), "N", "navy outer rim")
P("pauldron_light_L", "shoulder", (6, -1, -2, 7, 1, 1), "O", "orange light (emissive)")

# ------------------------------------------------------------------ arm (hanging local frames; +x local = T-pose up = outward)
P("upperarm_L", "upperArm", (-3, -10, -3, 2, 0, 3), "K", "dark upper arm")
P("forearm_L", "foreArm", (-3, -6, -3, 4, 0, 4), "I", "white gauntlet")
P("forearm_navy_L", "foreArm", (4, -6, -2, 5, -1, 2), "N", "navy stripe on the gauntlet's top")
P("forearm_cuff_L", "foreArm", (-3, -8, -3, 3, -6, 3), "N", "navy wrist cuff")
P("forearm_wrist_L", "foreArm", (-2, -10, -2, 3, -8, 3), "K", "dark wrist")
P("hand_L", "hand", (-3, -4, -3, 3, 3, 3), "K", "black fist")
P("hand_thumb_L", "hand", (2, -3, -4, 4, 0, -3), "K", "thumb block")

# ------------------------------------------------------------------ leg (hanging local frames; geometry sits outward of the hip axis)
P("thigh_core_L", "thigh", (0, -16, -3, 5, 0, 3), "K", "dark thigh core")
P("thigh_plate_1_L", "thigh", (1, -5, -3, 7, 0, 3), "I", "top thigh plate")
P("thigh_plate_2_L", "thigh", (1, -9, -3, 7, -5, 3), "I", "thigh plate")
P("thigh_plate_3_L", "thigh", (1, -13, -3, 6, -9, 3), "I", "thigh plate")
P("thigh_plate_4_L", "thigh", (2, -16, -3, 6, -13, 3), "I", "thigh plate above the knee")
P("thigh_navy_L", "thigh", (6, -12, -1, 7, -4, 2), "N", "navy side strip")
P("shin_core_L", "shin", (2, -16, -3, 7, 0, 3), "K", "dark shin core")
P("knee_cap_L", "shin", (2, -1, -3, 8, 4, 3), "I", "white knee cap")
P("knee_dark_L", "shin", (1, -6, -3, 7, -1, 3), "K", "dark knee bearing")
P("knee_light_L", "shin", (7, -5, -1, 8, -3, 1), "O", "orange knee light (emissive)")
P("shin_navy_L", "shin", (4, -10, -2, 8, -6, 3), "N", "navy greave panel")
P("shin_plate_in_L", "shin", (2, -10, -3, 4, -6, 3), "I", "inner greave edge")
P("shin_plate_L", "shin", (3, -15, -3, 9, -10, 3), "I", "white greave plate")
P("foot_base_L", "foot", (0, -3, -5, 9, 0, 7), "K", "dark boot base")
P("foot_toe_L", "foot", (2, 0, -1, 9, 3, 7), "I", "white toe cap")
P("foot_trim_L", "foot", (2, -1, 2, 8, 0, 7), "N", "navy trim")
P("foot_heel_L", "foot", (1, 0, -5, 7, 3, -1), "K", "heel")
P("foot_ankle_L", "foot", (2, 3, -3, 7, 5, 3), "K", "ankle")

# ------------------------------------------------------------------ spear (weapon joint: shaft +z; grip at the origin; 81 voxels = DIM.spearButt..spearTip)
P("spear_shaft", "spear", (-1, -1, -10, 1, 1, 56), "K", "dark shaft")
P("spear_butt", "spear", (-2, -2, -12, 2, 2, -9), "D", "grey butt cap")
P("spear_collar_0", "spear", (-2, -2, 20, 2, 2, 22), "I", "white collar")
P("spear_collar_1", "spear", (-2, -2, 24, 2, 2, 26), "O", "orange collar (emissive)")
P("spear_collar_2", "spear", (-2, -2, 28, 2, 2, 30), "N", "navy collar")
P("spear_socket", "spear", (-3, -3, 56, 3, 3, 58), "I", "socket ring")
P("spear_gem", "spear", (-3, -3, 58, 3, 3, 60), "O", "orange gem ring (emissive)")
for k, (w, z0, z1) in enumerate(((4, 60, 62), (3, 62, 64), (3, 64, 66), (2, 66, 68), (2, 68, 70), (1, 70, 72))):
    P(f"spear_blade_{k}", "spear", (-w, -1, z0, w, 1, z1), "B", "stepped blade layer")
