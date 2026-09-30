"""Vanguard parts, transcribed from the reference sheet (front / side / back views, 1 voxel = 1 grid cell).

World voxel frame: x = character's LEFT (+), y = up, z = forward. Ground y=0, centred on x=0. Boxes are
(x0, y0, z0, x1, y1, z1). Left-side parts are written for +x and mirrored to -x (right) by `mirror`.
Colour keys: I ivory, N navy, O orange (emissive), K black, D dark grey, G gold, S spear shaft.
Joints are the rigid pivots the rig rotates; every part lists its joint as `parent`.
"""

# joint id: (parent joint, pivot in world voxels)
JOINTS = {
    "root":      (None, (0, 0, 0)),
    "hips":      ("root", (0, 38, 0)),
    "chest":     ("hips", (0, 44, 0)),
    "head":      ("chest", (0, 60, 0)),
    "shoulderL": ("chest", (17, 55, 0)), "shoulderR": ("chest", (-17, 55, 0)),
    "elbowL":    ("shoulderL", (20, 46, 0)), "elbowR": ("shoulderR", (-20, 46, 0)),
    "wristL":    ("elbowL", (18, 36, 2)), "wristR": ("elbowR", (-18, 36, 2)),
    "thighL":    ("hips", (9, 37, 0)), "thighR": ("hips", (-9, 37, 0)),
    "shinL":     ("thighL", (11, 22, 0)), "shinR": ("thighR", (-11, 22, 0)),
    "footL":     ("shinL", (12, 7, -1)), "footR": ("shinR", (-12, 7, -1)),
    "spear":     ("root", (-19.5, 38, 22)),
}

PARTS = []   # dicts: id, name, joint, box, color, level, role, note, emissive


def P(pid, joint, box, color, level="meso", role="armor", note="", emissive=False):
    PARTS.append(dict(id=pid, name=pid.replace("_", " "), joint=joint, box=tuple(float(v) for v in box), color=color,
                      level=level, role=role, note=note, emissive=emissive))


def mirror(box):
    x0, y0, z0, x1, y1, z1 = box
    return (-x1, y0, z0, -x0, y1, z1)


def PM(pid, joint_base, box, color, **kw):
    """Add a left part (joint_base + 'L') and its mirrored right twin (joint_base + 'R')."""
    P(pid + "_L", joint_base + "L", box, color, **kw)
    P(pid + "_R", joint_base + "R", mirror(box), color, **kw)


def PMj(pid, joint_l, joint_r, box, color, **kw):
    P(pid + "_L", joint_l, box, color, **kw)
    P(pid + "_R", joint_r, mirror(box), color, **kw)


# ------------------------------------------------------------------ hips / waist / tabard
P("hips_core", "hips", (-9, 36, -6, 9, 44, 5), "K", level="macro", role="pelvis", note="black pelvis core")
P("waist_plate", "hips", (-3, 40, 4, 3, 44.5, 6.5), "I", note="ivory belt block, front centre")
P("waist_light", "hips", (-1, 41.3, 6.5, 1, 43.3, 7.2), "O", level="micro", role="emissive", emissive=True, note="orange belt square")
for s, sgn in (("L", 1), ("R", -1)):
    x0, x1 = (8.5, 11.5) if sgn > 0 else (-11.5, -8.5)
    P(f"hip_cube_{s}", "hips", (x0, 41, -1, x1, 44.5, 3), "I", level="micro", role="detail", note="small ivory cube at the hip")
P("tabard_front", "hips", (-5.5, 24.5, 5, 5.5, 40, 7), "N", level="macro", role="tabard", note="navy front panel")
P("tabard_cross_v", "hips", (-1, 26, 7, 1, 30, 7.6), "G", level="micro", role="detail", note="gold cross, vertical bar")
P("tabard_cross_h", "hips", (-2.5, 27.2, 7, 2.5, 28.8, 7.6), "G", level="micro", role="detail", note="gold cross, horizontal bar")
P("tabard_trim_front", "hips", (-5.5, 24, 5, 5.5, 25.2, 7.4), "G", level="micro", role="detail", note="gold hem trim")
P("tabard_back", "hips", (-6, 24.5, -8.5, 6, 40, -6.5), "N", level="macro", role="tabard", note="navy back panel")
P("tabard_trim_back", "hips", (-6, 24, -8.5, 6, 25.2, -6.4), "G", level="micro", role="detail", note="gold hem trim back")

# ------------------------------------------------------------------ chest
P("chest_core", "chest", (-10, 44, -8, 10, 60, 5), "K", level="macro", role="torso", note="black torso core")
P("chest_front", "chest", (-5.5, 46, 5, 5.5, 55.5, 7), "N", level="macro", role="chest-plate", note="navy breastplate")
P("chest_front_low", "chest", (-4, 44.2, 5, 4, 46, 6.2), "N", note="breastplate taper")
P("chest_top_bar", "chest", (-4.5, 55.5, 5, 4.5, 57.6, 7), "I", note="ivory collar bar")
P("chest_slot", "chest", (-2.6, 51, 7, 2.6, 52.6, 7.8), "O", level="micro", role="emissive", emissive=True, note="orange chest slot on the navy plate")
for s, sgn in (("L", 1), ("R", -1)):
    a, b = sorted((sgn * 5.5, sgn * 11))
    P(f"pec_{s}", "chest", (a, 47.5, 3, b, 57, 7), "I", note="ivory pectoral plate")
    a, b = sorted((sgn * 7, sgn * 9.6))
    P(f"pec_light_{s}", "chest", (a, 50, 7, b, 53, 7.7), "O", level="micro", role="emissive", emissive=True, note="orange pec square")
    a, b = sorted((sgn * 6.2, sgn * 7.8))
    P(f"collar_light_{s}", "chest", (a, 57, 4, b, 58.6, 5.6), "O", level="micro", role="emissive", emissive=True, note="orange collar square")
    a, b = sorted((sgn * 5.5, sgn * 10.5))
    P(f"back_plate_{s}", "chest", (a, 46, -10.5, b, 58, -7), "I", note="ivory back plate")
P("yoke", "chest", (-9.5, 57, -6, 9.5, 60, 4), "I", note="ivory shoulder yoke")
P("back_navy", "chest", (-5.5, 46, -10.5, 5.5, 58, -8), "N", note="navy back plate")
P("back_slit", "chest", (-1, 47, -11.2, 1, 54, -10.4), "O", level="micro", role="emissive", emissive=True, note="orange spine slit")

# ------------------------------------------------------------------ head
P("neck", "head", (-3, 58.5, -2, 3, 62, 4), "K", level="meso", role="neck", note="black neck")
P("helmet_core", "head", (-7, 64, -6, 7, 70, 9.5), "I", level="macro", role="helmet", note="ivory helmet shell, mid band")
P("helmet_low", "head", (-5.5, 61.5, -5.5, 5.5, 64, 3), "I", note="helmet lower rear shell")
P("helmet_top", "head", (-6, 70, -6, 6, 72.6, 9), "I", note="helmet upper shell")
P("helmet_dome", "head", (-5, 72.4, -5, 5, 73.8, 7.5), "I", note="helmet crown")
P("helmet_cap", "head", (-3.6, 72.6, -3.5, 3.6, 75, 6), "N", note="navy crest cap")
for i, (z0, z1) in enumerate(((-4.5, -2.4), (-1.6, 0.5), (1.3, 3.4), (4.2, 6.3))):
    P(f"crest_ridge_{i}", "head", (-3.0, 74.6, z0, 3.0, 76.2 + (0.5 if i in (1, 2) else 0), z1), "N", note="raised crest ridge (stepped)")
P("crest_side_L", "head", (5.6, 69.2, -5, 6.6, 73, 6), "N", note="navy side stripe, left")
P("crest_side_R", "head", (-6.6, 69.2, -5, -5.6, 73, 6), "N", note="navy side stripe, right")
P("helmet_band", "head", (-3, 70.5, 2, 3, 72, 9.6), "N", note="navy brow band")
P("helmet_jaw", "head", (-5, 60.4, 2.5, 5, 64, 10), "I", note="ivory jaw")
P("face_dark", "head", (-3.5, 60.6, 8, 3.5, 65, 10.2), "K", note="black face plate")
P("visor", "head", (-5.8, 64, 9.6, 5.8, 66.2, 11.3), "O", level="macro", role="visor", emissive=True, note="orange visor slit")
P("visor_surround", "head", (-6.4, 63, 8.6, 6.4, 67, 10.2), "K", note="visor recess")
for s, sgn in (("L", 1), ("R", -1)):
    a, b = sorted((sgn * 7, sgn * 10))
    P(f"ear_{s}", "head", (a, 63.8, -4, b, 70, 3.6), "K", note="dark octagonal ear disc")
    P(f"ear_cap_{s}", "head", (a, 62.6, -2.4, b, 71.2, 2), "K", note="ear disc top/bottom flats (octagon)")
    a, b = sorted((sgn * 9.6, sgn * 10.8))
    P(f"ear_light_{s}", "head", (a, 65.2, -2, b, 68.6, 1.4), "O", level="micro", role="emissive", emissive=True, note="orange ear core")
    P(f"ear_light_cap_{s}", "head", (a, 65.8, -2.7, b, 68, 2.1), "O", level="micro", role="emissive", emissive=True, note="ear core flats (octagon)")
P("helmet_back_slit", "head", (-1.2, 63, -7, 1.2, 69, -5.8), "O", level="micro", role="emissive", emissive=True, note="orange rear slit")
P("helmet_back_dark", "head", (-3, 61.5, -6.6, 3, 71, -5.6), "K", note="rear dark panel")

# ------------------------------------------------------------------ arms (rest = hanging)
for s, sgn in (("L", 1), ("R", -1)):
    def xr(a, b, sgn=sgn):
        return tuple(sorted((sgn * a, sgn * b)))
    # pauldron
    a, b = xr(10, 20)
    P(f"pauldron_{s}", "shoulder" + s, (a, 53, -6, b, 58, 8), "I", level="macro", role="pauldron", note="ivory pauldron mass")
    a2, b2 = xr(12.5, 20.6)
    P(f"pauldron_top_{s}", "shoulder" + s, (a2, 58, -5.5, b2, 62, 7.5), "I", note="pauldron top slab")
    a, b = xr(11.5, 18)
    P(f"pauldron_low_{s}", "shoulder" + s, (a, 49.5, -3, b, 53, 6), "I", note="pauldron lower step")
    a, b = xr(13, 17.5)
    P(f"pauldron_low2_{s}", "shoulder" + s, (a, 46.5, -1, b, 49.5, 4), "I", note="pauldron bottom step")
    a, b = xr(14.5, 19.5)
    P(f"pauldron_navy_{s}", "shoulder" + s, (a, 53, 6, b, 60, 8.7), "N", note="navy pauldron panel")
    a, b = xr(19.8, 21.2)
    P(f"pauldron_side_{s}", "shoulder" + s, (a, 50, -4, b, 58, 4), "N", note="navy pauldron flank")
    a, b = xr(19.6, 20.6)
    P(f"pauldron_light_{s}", "shoulder" + s, (a, 53.5, 5, b, 56, 7), "O", level="micro", role="emissive", emissive=True, note="orange pauldron square")
    # upper arm + elbow
    a, b = xr(13, 18)
    P(f"upper_arm_{s}", "shoulder" + s, (a, 42.5, -3, b, 50, 3), "I", level="macro", role="upper-arm", note="ivory upper arm (was black)")
    a, b = xr(12.6, 18.4)
    P(f"upper_arm_band_{s}", "shoulder" + s, (a, 46.4, -3.6, b, 48.6, 3.6), "N", note="navy upper-arm band")
    a, b = xr(14, 17)
    P(f"upper_arm_bit_{s}", "shoulder" + s, (a, 45, 2.5, b, 47.5, 4.5), "I", level="micro", role="detail", note="small ivory bit on the upper arm")
    a, b = xr(13.5, 19.5)
    P(f"elbow_{s}", "elbow" + s, (a, 41.5, -4, b, 46.5, 4), "I", level="macro", role="elbow", note="ivory elbow block (was black)")
    a, b = xr(19.4, 20.6)
    P(f"elbow_ring_{s}", "elbow" + s, (a, 42.4, -2.6, b, 45.6, 2.6), "K", level="meso", role="bearing", note="dark elbow bearing disc")
    P(f"elbow_ring_cap_{s}", "elbow" + s, (a, 41.6, -1.4, b, 46.4, 1.4), "K", note="bearing disc flats (octagon)")
    a, b = xr(20.5, 21.3)
    P(f"elbow_light_{s}", "elbow" + s, (a, 43.2, -1.2, b, 44.8, 1.2), "O", level="micro", role="emissive", emissive=True, note="orange elbow bearing light")
    # forearm
    a, b = xr(12.5, 21.5)
    P(f"forearm_{s}", "elbow" + s, (a, 37, -4.5, b, 46, 8), "I", level="macro", role="forearm", note="ivory forearm armor")
    a3, b3 = xr(14.5, 21)
    P(f"forearm_top_{s}", "elbow" + s, (a3, 46, -3, b3, 48, 6), "I", note="forearm top step")
    a3, b3 = xr(14, 20.5)
    P(f"forearm_cuff_{s}", "elbow" + s, (a3, 35, -3.5, b3, 37, 7), "I", note="forearm cuff")
    a, b = xr(21.6, 22.8)
    P(f"forearm_light_{s}", "elbow" + s, (a, 38.6, 0.6, b, 40.2, 3.6), "O", level="micro", role="emissive", emissive=True, note="orange gauntlet slot")
    a, b = xr(21.4, 22.6)
    P(f"forearm_navy_{s}", "elbow" + s, (a, 39.5, -2, b, 45, 3.5), "N", note="navy forearm panel")
    a, b = xr(17, 21)
    P(f"forearm_front_{s}", "elbow" + s, (a, 37, 7.6, b, 44, 8.6), "I", level="micro", role="detail", note="forearm front step")
    # hand: a small dark glove under an ivory knuckle plate (the reference's fists are small), fingers as stepped blocks
    a, b = xr(15, 19.6)
    P(f"hand_{s}", "wrist" + s, (a, 29.6, -1.5, b, 35.4, 5.6), "K", level="macro", role="hand", note="small black fist")
    a, b = xr(14.6, 20)
    P(f"hand_knuckle_{s}", "wrist" + s, (a, 34, -2, b, 37, 5.6), "I", note="ivory knuckle plate")
    a, b = xr(15.4, 19.2)
    for i, (za, zb) in enumerate(((4.6, 6.6), (2.8, 4.8))):
        P(f"finger_{s}_{i}", "wrist" + s, (a, 29.4, za, b, 33, zb), "D", level="micro", role="detail", note="finger block")

# ------------------------------------------------------------------ legs
for s, sgn in (("L", 1), ("R", -1)):
    def xr(a, b, sgn=sgn):
        return tuple(sorted((sgn * a, sgn * b)))
    # thigh
    a, b = xr(7, 13)
    P(f"thigh_core_{s}", "thigh" + s, (a, 23, -5, b, 38, 4), "K", level="macro", role="thigh", note="dark thigh core")
    a, b = xr(6, 15.5)
    a, b = xr(8, 15.5)
    P(f"thigh_armor_{s}", "thigh" + s, (a, 34, -5, b, 39.5, 6), "I", level="macro", role="thigh-armor", note="ivory thigh armor, upper block")
    a, b = xr(6.5, 14.5)
    P(f"thigh_armor_mid_{s}", "thigh" + s, (a, 30, -5, b, 34, 6), "I", note="thigh armor mid step")
    a, b = xr(7.5, 13.5)
    P(f"thigh_armor_low_{s}", "thigh" + s, (a, 27, -4.5, b, 30, 5.5), "I", note="thigh armor lower step")
    a, b = xr(7.5, 14.5)
    P(f"thigh_front_{s}", "thigh" + s, (a, 29, 5.5, b, 38, 7.4), "I", note="thigh armor front step")
    # (no navy thigh strips: outer or rear, they swing out as flat slabs when the leg moves; navy stays on the knee caps and tabards)
    a, b = xr(9.5, 13)
    P(f"thigh_light_{s}", "thigh" + s, (a, 31, 7.3, b, 32.4, 8.1), "O", level="micro", role="emissive", emissive=True, note="orange thigh slot")
    a, b = xr(8, 15)
    P(f"thigh_lower_{s}", "thigh" + s, (a, 23.2, -4, b, 28.4, 5), "I", note="lower thigh plate")
    # knee (on shin joint)
    a, b = xr(7, 14.5)
    P(f"knee_cap_{s}", "shin" + s, (a, 20, 3, b, 26.5, 8), "N", level="macro", role="knee-cap", note="navy knee cap")
    a, b = xr(9.6, 12.2)
    P(f"knee_light_{s}", "shin" + s, (a, 22, 8, b, 24.6, 8.6), "O", level="micro", role="emissive", emissive=True, note="orange knee square")
    a, b = xr(15, 17.6)
    P(f"knee_ring_{s}", "shin" + s, (a, 18, -4, b, 25, 3), "K", level="meso", role="bearing", note="dark knee bearing")
    a, b = xr(17.4, 18.4)
    P(f"knee_ring_light_{s}", "shin" + s, (a, 20.4, -1.6, b, 22.4, 0.4), "O", level="micro", role="emissive", emissive=True, note="orange knee bearing light")
    a, b = xr(8, 15)
    P(f"knee_inner_{s}", "shin" + s, (a, 19, -4, b, 23, 3), "K", note="dark inner knee")
    # shin
    a, b = xr(9, 14.5)
    P(f"shin_core_{s}", "shin" + s, (a, 8, -3, b, 20, 4), "K", level="macro", role="shin", note="dark shin core")
    a, b = xr(9, 16.5)
    P(f"shin_front_{s}", "shin" + s, (a, 10, 3, b, 19, 7), "I", note="ivory shin front plate")
    a, b = xr(8, 17)
    P(f"shin_upper_{s}", "shin" + s, (a, 15, -4, b, 20.5, 4), "I", note="ivory shin upper plate")
    a, b = xr(9.5, 15)
    P(f"shin_lower_{s}", "shin" + s, (a, 8, -3, b, 14, 5), "I", note="ivory shin lower plate")
    # foot
    a, b = xr(8, 20.5)
    P(f"sole_{s}", "foot" + s, (a, 0, -8, b, 3, 15), "K", level="macro", role="foot", note="black boot sole")
    a, b = xr(9, 19.5)
    P(f"toe_{s}", "foot" + s, (a, 3, 4, b, 6.5, 13), "I", note="ivory toe cap")
    a, b = xr(10, 18.5)
    P(f"instep_{s}", "foot" + s, (a, 3, -3, b, 8.5, 6), "I", note="ivory instep")
    a, b = xr(10, 17)
    P(f"heel_{s}", "foot" + s, (a, 3, -8, b, 6, -3), "I", note="ivory heel")
    a, b = xr(16.5, 19)
    P(f"ankle_ring_{s}", "foot" + s, (a, 4.5, -4, b, 10, 2), "K", level="meso", role="bearing", note="dark ankle bearing")
    a, b = xr(18.8, 19.8)
    P(f"ankle_light_{s}", "foot" + s, (a, 6.5, -2, b, 8.5, 0), "O", level="micro", role="emissive", emissive=True, note="orange ankle light")

# ------------------------------------------------------------------ spear (own root, authored vertical; pivot = grip)
P("spear_shaft", "spear", (-1, 0, -1, 1, 64, 1), "S", level="macro", role="weapon-shaft", note="dark spear shaft")
for i, (y0, y1) in enumerate(((58.6, 61.4), (33.4, 36.2), (11.5, 15.5), (0, 2))):
    P(f"spear_collar_{i}", "spear", (-1.7, y0, -1.7, 1.7, y1, 1.7), "I", level="meso", role="weapon-collar", note="ivory shaft collar")
P("spear_socket", "spear", (-2.2, 62, -2.2, 2.2, 66, 2.2), "K", level="meso", role="weapon-blade", note="dark blade socket")
P("spear_core_navy", "spear", (-1.2, 66, -1.2, 1.2, 80, 1.2), "N", level="meso", role="weapon-blade", note="navy blade core")
P("spear_gem", "spear", (-0.9, 66.5, -1.5, 0.9, 73, 1.5), "O", level="micro", role="emissive", emissive=True, note="orange blade gem")
for i, (y0, y1, hw, hz) in enumerate(((66, 72, 3.9, 1.7), (72, 77, 3.0, 1.5), (77, 82, 2.2, 1.3), (82, 85, 1.4, 1.0), (85, 87.4, 0.7, 0.6))):
    P(f"spear_blade_{i}", "spear", (-hw, y0, -hz, hw, y1, hz), "I", level="meso", role="weapon-blade", note="ivory blade layer")
    if i in (1, 2, 3):
        P(f"spear_blade_navy_{i}", "spear", (-hw * 0.32, y0 + 0.2, -hz - 0.3, hw * 0.32, y1 - 0.2, hz + 0.3), "N", level="micro", role="weapon-blade", note="navy blade stripe")


def all_parts():
    return PARTS
