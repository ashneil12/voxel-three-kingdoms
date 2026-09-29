"""Step 11: Idle, Walk, Attack_Spear. Pure joint rotations + pelvis translation; legs solved with analytic 2-bone IK so feet
stay planted. Baked per frame into NLA tracks (one track per clip => one glTF animation per clip). Saves 07_animated.blend."""
import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from common import *
from rigdef import *
bpy.ops.wm.open_mainfile(filepath=f"{ROOT}/assets/working/06_weapon_socket.blend")
D, R2D = math.radians, math.degrees
FPS = 30; bpy.context.scene.render.fps = FPS
JOINTS = [o.name for o in bpy.data.objects if o.type == 'EMPTY' and o.name not in ("robot_root",) and not o.name.startswith("weapon_socket")]
smooth = lambda u: u * u * (3 - 2 * u)
lerp = lambda a, b, u: a + (b - a) * u

# ---- leg IK (analytic, sagittal plane = Blender Y/Z; rotations about X)
def leg_lengths(s):
    H, K, A = PIV["hip"][s], PIV["knee"][s], PIV["ankle"][s]
    t0 = np.array([K[1] - H[1], K[2] - H[2]]); s0 = np.array([A[1] - K[1], A[2] - K[2]])
    return H, A, t0, s0
def leg_solve(s, target_yz, pitch):
    """Return (hip_x, knee_x, ankle_x) radians so the ankle reaches target_yz (relative to the hip pivot) with the foot at `pitch`."""
    H, A, t0, s0 = leg_lengths(s)
    l1, l2 = np.linalg.norm(t0), np.linalg.norm(s0)
    P = np.asarray(target_yz, float); d = min(np.linalg.norm(P), (l1 + l2) * 0.9995)
    th0 = math.atan2(t0[1], t0[0]); ths0 = math.atan2(s0[1], s0[0]); delta = ths0 - th0
    gamma = math.acos(max(-1, min(1, (d * d - l1 * l1 - l2 * l2) / (2 * l1 * l2))))     # interior angle between thigh and shin vectors
    if gamma < 0: gamma = 0
    # rest shin is ~straight (delta ~ 0); knee flexion beta makes gamma = delta + beta, but a flexed knee has the shin swinging BACK (+Y)
    beta = gamma - delta
    thP = math.atan2(P[1], P[0])
    psi = math.atan2(l2 * math.sin(gamma), l1 + l2 * math.cos(gamma))
    tht = thP - psi if False else thP + psi        # shin lies on the +Y (back) side of the hip->ankle line when flexed
    # recompute consistently: thigh direction must satisfy dir(thigh)+dir(shin)=P with shin rotated by +gamma from thigh
    tht = thP - psi
    a1 = tht - th0
    return a1, beta, pitch - a1 - beta

def set_leg(pose, s, ankle_world, pelvis_off, pitch):
    H = PIV["hip"][s]; Hw = H + pelvis_off
    a1, a2, a3 = leg_solve(s, (ankle_world[0] - Hw[1], ankle_world[1] - Hw[2]), pitch)
    pose[f"hip_{s}"] = (R2D(a1), 0, 0); pose[f"knee_{s}"] = (R2D(a2), 0, 0); pose[f"ankle_{s}"] = (R2D(a3), 0, 0)

REST_A = {s: PIV["ankle"][s] for s in "LR"}
def ankle_at(s, dy, lift=0.0):   # ankle target (y, z): rest height + lift, y offset dy (negative = forward)
    return (REST_A[s][1] + dy, REST_A[s][2] + lift)

# ---- clips: t in [0,1) -> ({joint: (x,y,z) degrees}, pelvis offset (x,y,z))
READY_R = (-38, 0, 8, -100, 10)     # shoulder x,z; elbow; wrist  (see weapon_socket.py)
def arms_ready(p, extra=None):
    p["shoulder_R"] = (READY_R[0], 0, READY_R[2]); p["elbow_R"] = (READY_R[3], 0, 0); p["wrist_R"] = (READY_R[4], 0, 0)
    p["shoulder_L"] = (-20, 0, -6); p["elbow_L"] = (-70, 0, 0); p["wrist_L"] = (0, 0, 0)

def idle(t):
    p = {}; s, c = math.sin(2 * math.pi * t), math.cos(2 * math.pi * t)
    arms_ready(p)
    p["shoulder_R"] = (READY_R[0] + .8 * s, 0, READY_R[2]); p["elbow_R"] = (READY_R[3] + 1.2 * c, 0, 0)
    p["shoulder_L"] = (-20 + 1.0 * s, 0, -6); p["elbow_L"] = (-70 + 1.5 * c, 0, 0)
    p["torso_joint"] = (-2 + 1.2 * s, 0, 1.2 * c); p["neck_joint"] = (2 - 1.4 * s, 0, 2.0 * math.sin(2 * math.pi * t + 1))
    off = np.array([0, 0, -0.006 + 0.0015 * s])
    for side, dy in (("L", -0.03), ("R", 0.03)): set_leg(p, side, ankle_at(side, dy), off, 0)
    return p, off

def walk(t):
    p = {}; L = 0.26; phi = t
    arms_ready(p)
    dz = -0.013 + 0.006 * math.cos(4 * math.pi * (phi - 0.15))
    off = np.array([0.0, 0.0, dz]); ph = 2 * math.pi * phi
    for side, phase in (("L", 0.0), ("R", 0.5)):
        q = (phi + phase) % 1.0; base = 0.03 if side == "R" else -0.03
        if q < 0.6:   dy, lift, pitch = -L / 2 + L * (q / 0.6), 0.0, 0.0
        else:
            u = (q - 0.6) / 0.4; e = smooth(u); dy = L / 2 - L * e; lift = 0.05 * math.sin(math.pi * u); pitch = -D(14) * math.sin(math.pi * u)
        set_leg(p, side, ankle_at(side, dy + base * 0.3, lift), off, pitch)
    p["torso_joint"] = (-3 + 1.0 * math.cos(2 * ph), 0, -6 * math.sin(ph)); p["neck_joint"] = (2, 0, 4 * math.sin(ph))
    p["shoulder_L"] = (-20 + 18 * math.cos(ph), 0, -6); p["elbow_L"] = (-45 - 20 * math.cos(ph), 0, 0)
    p["shoulder_R"] = (READY_R[0] + 4 * math.cos(ph + math.pi), 0, READY_R[2]); p["elbow_R"] = (READY_R[3] + 3 * math.cos(2 * ph), 0, 0)
    p["hip_L"] = tuple(p["hip_L"]); return p, off + np.array([0, 0, 0])

def attack(t):
    p = {}; arms_ready(p)
    # keyframed segments in normalised time: windup [0,.2], thrust [.2,.36], hold [.36,.5], recover [.5,1]
    def seg(a, b, x0, x1):
        u = min(1, max(0, (t - a) / (b - a))); return lerp(x0, x1, smooth(u))
    w = smooth(min(1, t / .2)); th = smooth(min(1, max(0, (t - .2) / .16))); rc = smooth(min(1, max(0, (t - .5) / .5)))
    k = w * (1 - th) + th * (1 - rc)          # 0 ready, -1 windup, +1 thrust
    wind = w * (1 - th) * (1 - rc) if t < .2 or t < .36 else 0
    amp_wind = w if t < .2 else (1 - th) if t < .36 else 0
    amp_thrust = th * (1 - rc)
    tz = -26 * amp_wind + 24 * amp_thrust
    p["torso_joint"] = (-2 - 8 * amp_thrust, 0, tz); p["neck_joint"] = (3, 0, -tz * .5)
    sx = lerp(READY_R[0], -60, amp_thrust) + 26 * amp_wind * 0; sx = READY_R[0] + (-14 * amp_wind) + (-22 * amp_thrust)
    ex = READY_R[3] + 20 * amp_wind + 85 * amp_thrust
    wx = READY_R[4] + 17 * amp_thrust
    p["shoulder_R"] = (sx, 0, READY_R[2] - 8 * amp_wind); p["elbow_R"] = (ex, 0, 0); p["wrist_R"] = (wx, 0, 0)
    p["shoulder_L"] = (-20 + 10 * amp_thrust, 0, -6 + 16 * amp_thrust); p["elbow_L"] = (-70 - 15 * amp_thrust, 0, 0)
    off = np.array([0, -0.05 * amp_thrust, -0.006 - 0.02 * amp_thrust])
    fL = -0.03 - 0.22 * amp_thrust; fR = 0.03 + 0.10 * amp_thrust
    set_leg(p, "L", ankle_at("L", fL - (off[1] * 0), 0.0), off, 0); set_leg(p, "R", ankle_at("R", fR, 0.0), off, 0)
    return p, off

import json
CLIPDATA = {}
CLIPS = {"Idle": (60, idle, True), "Walk": (30, walk, True), "Attack_Spear": (45, attack, False)}
bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
sc = bpy.context.scene
for name, (frames, fn, loop) in CLIPS.items():
    nf = frames + (1 if loop else 0)
    CLIPDATA[name] = {'fps': FPS, 'frames': nf, 'loop': loop, 'joints': {jn: [] for jn in JOINTS}, 'pelvis': []}
    for o in bpy.data.objects:
        if o.animation_data: o.animation_data_clear()
    for f in range(frames + (1 if loop else 0)):
        t = (f % frames) / frames if loop else f / (frames - 1)
        pose, off = fn(t)
        for jn in JOINTS:
            o = bpy.data.objects[jn]; o.rotation_mode = 'XYZ'
            r = pose.get(jn, (0, 0, 0)); o.rotation_euler = (D(r[0]), D(r[1]), D(r[2]))
            o.keyframe_insert("rotation_euler", frame=f + 1); CLIPDATA[name]['joints'][jn].append([D(r[0]), D(r[1]), D(r[2])])
        pj = bpy.data.objects["pelvis_joint"]; base = np.array(PIV["waist"]) * [1, 1, 0] + [0, 0, PIV["hip"]["L"][2]]
        pj.location = tuple(base + off); pj.keyframe_insert("location", frame=f + 1); CLIPDATA[name]['pelvis'].append((base + off).tolist())
    for o in bpy.data.objects:
        if o.animation_data and o.animation_data.action:
            act = o.animation_data.action; act.name = f"{name}|{o.name}"
            tr = o.animation_data.nla_tracks.new(); tr.name = name
            st = tr.strips.new(name, 1, act); st.name = name
            o.animation_data.action = None
# reset to rest
for o in bpy.data.objects:
    if o.type == 'EMPTY' and not o.name.startswith('weapon_socket'): o.rotation_euler = (0, 0, 0)
sc.frame_start, sc.frame_end = 1, 61
json.dump(CLIPDATA, open(f'{ROOT}/reports/clips.json', 'w'))
bpy.ops.wm.save_as_mainfile(filepath=f"{ROOT}/assets/working/07_animated.blend")
print("ANIMATED", [(n, f) for n, (f, _, _) in CLIPS.items()])
