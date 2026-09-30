"""Assemble object-sculpt-spec.json from the transcribed parts (vanguard_parts.py) on top of the pipeline scaffold.

Run with the pipeline python (3.10+):  /opt/homebrew/bin/python3 build_spec.py
"""
import copy, json, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import parts as VP
import model as M

HERE = Path(__file__).parent
S = 0.0295   # metres per voxel (0.0273 pose units × HERO_SCALE 1.08; 63-67 voxels tall ≈ 1.9 m)

scaffold = json.load(open(HERE / "scaffold-spec.json"))
spec = copy.deepcopy(scaffold)
proto = copy.deepcopy(scaffold["componentTree"][0])          # scaffold root = per-component template

# ---------------------------------------------------------------- materials
PBR = {  # measured by extract_pbr_evidence on reference crops (evidence/*.report.json)
    "ivory":  dict(color="#F0D7AE", rough=0.5, metal=0.05, sec=["#D9BC90", "#F8E8CC"]),
    "navy":   dict(color="#1E4AA0", rough=0.5, metal=0.08, sec=["#153A80", "#2F5FBC"]),
    "orange": dict(color="#FF9628", rough=0.35, metal=0.0, sec=["#FFB13E", "#FFD060"], emissive="#FF8A1E", ei=1.6),
    "black":  dict(color="#28262C", rough=0.6, metal=0.2, sec=["#1A181E", "#3A363F"]),
    "dark":   dict(color="#4A4852", rough=0.6, metal=0.2, sec=["#36343C", "#5A5862"]),
    "blade":  dict(color="#6AA8F0", rough=0.25, metal=0.1, sec=["#4F8AD0", "#A8D0FF"], emissive="#6AA8F0", ei=0.9),
    "shaft":  dict(color="#2A282E", rough=0.55, metal=0.15, sec=["#1C1A20", "#3A383E"]),
}
COLOR_KEY = {"I": "ivory", "N": "navy", "O": "orange", "K": "black", "D": "dark", "B": "blade", "S": "shaft"}
base_mat = scaffold["materials"][0]
materials = []
for mid, p in PBR.items():
    m = copy.deepcopy(base_mat)
    m.update(id=mid, name=mid.capitalize() + " voxel armour", baseColor=p["color"], color=p["color"])
    m["albedo"] = dict(dominant=p["color"], secondary=p["sec"], samplingNotes="Sampled from flat-lit voxel faces of the reference sheet; face shading differs per orientation, so the base is the mid tone.")
    m["colorVariation"] = dict(palette=[p["color"]] + p["sec"], pattern="uniform", amplitude=0.05, heightCorrelation=0.0)
    m["roughness"] = dict(base=p["rough"], variation=0.05, map="independent-procedural-field", localResponse="slightly lower roughness on bevelled voxel edges")
    m["metalness"] = dict(base=p["metal"], variation=0.02)
    for fld in ("normal", "bump", "displacement", "surfaceFrequencyBands", "textureProjection", "textureResolution", "referencePbr"):
        m.pop(fld, None)
    m["textureless"] = dict(declared=True, evidence=[f"evidence/{mid}.report.json: flat colour zones on voxel faces, no grain/print/pores in the sheet", "front/side/back views"])
    m["flatShading"] = True
    m["localOverrides"] = [dict(id=f"{mid}-voxel-edge-wear", description="Faint edge lightening on bevelled voxel corners; flat colour otherwise (no texture).", confidence=0.5)]
    m["wear"] = dict(edgeWear=0.06, scratches=[], chips=[])
    m["dirt"] = dict(amount=0.0, cavityBias=0.0, color="#2A2622")
    if "emissive" in p:
        m["emissive"] = p["emissive"]; m["emissiveIntensity"] = p["ei"]
        m["localOverrides"].append(dict(id="orange-emissive-glow", description="Orange light panels glow: visor, ear discs, joint bearings, belt/pauldron/knee squares.", confidence=0.85))
    materials.append(m)
spec["materials"] = materials

# ---------------------------------------------------------------- components
def hexrgba(h):
    h = h.lstrip("#"); r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4)); return f"rgba({r}, {g}, {b}, 1.0)"

def recipe(mat, note):
    p = PBR[mat]
    return dict(dominantAlbedo=hexrgba(p["color"]), secondaryAlbedo=hexrgba(p["sec"][0]), materialClass="plastic" if mat in ("ivory", "navy", "orange") else "metal",
                materialClassConfidence=0.7, evidence=["front", "side", "back"], samplingNotes=note)

def component(cid, name, level, role, parent, center_local, size, mat, note="", pivot_local=None, emissive=False, importance=0.6):
    c = copy.deepcopy(proto)
    c.update(id=cid, name=name, level=level, role=role, importance=importance, confidence=0.7, parent=parent, material=mat, materialLayers=[mat], fidelityTier="blockout")
    c["topologyClass"] = "assembled-solid"
    c["topologyRationale"] = "Rigid voxel-style armour block; hard-surface, no organic continuity, articulates as a rigid piece about its joint."
    c["primitive"] = "box"
    c["geometryDescriptor"] = dict(topologyIntent="chamfered box, voxel-art block", edgeTreatment=dict(type="rounded", bevelRadius=0.12, segments=2),
                                  deformationStack=[], uvStrategy="generated procedural coordinates", normalStrategy="vertex normals from generated geometry")
    c["dimensions"] = dict(width=round(size[0] * S, 5), height=round(size[1] * S, 5), depth=round(size[2] * S, 5), units="metres", confidence=0.7)
    c["transform"] = dict(position=[round(v * S, 5) for v in center_local], rotation=[0, 0, 0])   # no "scale": dimensions drive the box size
    c["colorMaterialRecipe"] = recipe(mat, note or "Flat voxel colour from the reference sheet.")
    ap = c["actionProfile"]
    ap["animationRole"] = "joint" if level == "macro" and role in ("joint",) else ("part" if level != "macro" else "segment")
    pl = pivot_local if pivot_local is not None else (0, 0, 0)
    ap["pivot"] = dict(mode="explicit", localPosition=[round(v * S, 5) for v in pl], axis=[1, 0, 0], confidence=0.65)
    ap["transformChannels"] = dict(translate=True, rotate=True, scale=False, bend=False, twist=False, detach=(level != "macro"), visibility=True, materialState=bool(emissive))
    ap["collider"] = dict(type="box", offset=[0, 0, 0], scale=[1, 1, 1], isTrigger=False, notes="Coarse proxy; refine after first render.")
    ap["sockets"] = []
    c["attachment"] = None
    if re.search(r"arm|socket", cid):
        c["attachment"] = dict(parentId=parent, parentSocket=f"{parent}-socket", localStart=[0, round(size[1] * S / 2, 5), 0], localEnd=[0, round(-size[1] * S / 2, 5), 0],
                               contactType="overlap", embedDepth=0.004, gapTolerance=0.004, evidenceRefs=["front"])
    c["localFeatures"] = [dict(id=f"{cid}-feature", description=note or name, confidence=0.65, level=level if level != "macro" else "meso", evidence=["front"])]
    c["evidenceRefs"] = ["front", "side", "back"]
    c["details"] = []
    return c

comps = []
# joint tree (T-pose world pivots; legs include the A-stance splay). Parts hang off these rigid nodes.
def leg_pivot(j, side):
    base = VP.PIVOT[j]; sh = round((VP.PIVOT["thigh"][1] - base[1]) * VP.SPLAY)
    return (side * (base[0] + sh), base[1], base[2])
JOINTS = {"root": (None, (0, 0, 0)), "hips": ("root", VP.PIVOT["hips"]), "spine": ("hips", VP.PIVOT["spine"]), "chest": ("spine", VP.PIVOT["chest"]),
          "neck": ("chest", VP.PIVOT["neck"]), "head": ("neck", VP.PIVOT["head"]), "spear": ("root", VP.PIVOT["spear"])}
for s_, sd in (("L", 1), ("R", -1)):
    JOINTS["shoulder" + s_] = ("chest", (sd * VP.PIVOT["shoulder"][0],) + VP.PIVOT["shoulder"][1:])
    JOINTS["upperArm" + s_] = ("shoulder" + s_, (sd * VP.PIVOT["upperArm"][0],) + VP.PIVOT["upperArm"][1:])
    JOINTS["foreArm" + s_] = ("upperArm" + s_, (sd * VP.PIVOT["foreArm"][0],) + VP.PIVOT["foreArm"][1:])
    JOINTS["hand" + s_] = ("foreArm" + s_, (sd * VP.PIVOT["hand"][0],) + VP.PIVOT["hand"][1:])
    JOINTS["thigh" + s_] = ("hips", leg_pivot("thigh", sd)); JOINTS["shin" + s_] = ("thigh" + s_, leg_pivot("shin", sd)); JOINTS["foot" + s_] = ("shin" + s_, leg_pivot("foot", sd))
joints = JOINTS
for jid, (jparent, piv) in joints.items():
    if jparent is None:
        local = (0, 0, 0)
    else:
        pp = joints[jparent][1]; local = tuple(piv[i] - pp[i] for i in range(3))
    role = "root" if jid == "root" else "joint"
    c = component("root" if jid == "root" else f"joint_{jid}", "Vanguard" if jid == "root" else f"{jid} pivot", "macro" if jid in ("root", "hips", "chest", "head", "spear") else "meso",
                  role, None if jid == "root" else (f"joint_{joints[jid][0]}" if joints[jid][0] != "root" else "root"), local, (0.4, 0.4, 0.4), "black",
                  note=f"Rigid articulation pivot for {jid}.", importance=0.9)
    c["actionProfile"]["animationRole"] = "root" if jid == "root" else "joint"
    c["actionProfile"]["pivot"]["mode"] = "explicit"
    if jid == "spear":
        c["actionProfile"]["sockets"] = [dict(id="grip", localPosition=[0, 0, 0], purpose="right-hand grip")]
    comps.append(c)
jl = {jid: (f"joint_{jid}" if jid != "root" else "root") for jid in joints}
LEVEL = lambda pid: "micro" if re.search(r"light|gem|thumb|collar|cap$|taper|tip|trim|wrist|link", pid) else ("macro" if re.search(r"core|pelvis|chest_bar|chest_stem$|head_core|shaft", pid) else "meso")
for wb in M.world_boxes(skip_spear=False):
    x0, y0, z0, x1, y1, z1 = wb["box"]
    cx, cy, cz = (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2
    piv = joints[wb["joint"]][1]
    center_local = (cx - piv[0], cy - piv[1], cz - piv[2])
    size = (x1 - x0, y1 - y0, z1 - z0)
    mat = COLOR_KEY[wb["c"]]
    em = mat in ("orange", "blade")
    comps.append(component(wb["id"], wb["id"].replace("_", " "), LEVEL(wb["id"]), "armor" if not em else "emissive", jl[wb["joint"]], center_local, size, mat, note=wb["note"] or wb["id"], emissive=em))
comps[0]["dimensions"] = dict(width=0.001, height=0.001, depth=0.001, units="metres", confidence=1.0)
for c in comps:
    if c["role"] in ("root", "joint"):
        c["dimensions"] = dict(width=0.004, height=0.004, depth=0.004, units="metres", confidence=1.0)
        c["localFeatures"] = [dict(id=f"{c['id']}-pivot", description="Articulation pivot marker.", confidence=0.8, level="meso", evidence=["front"])]
spec["componentTree"] = comps

# ---------------------------------------------------------------- assessment, review targets, evidence
oc = spec["preSpecAssessment"]["objectClass"]
oc.update(primaryType="lean voxel-style armoured pilot (T-pose) with power spear", primaryDomain="hybrid",
          formLanguage=["voxel-block", "hard-edged-box", "stepped-armour-plates", "lean-hard-surface"],
          structureKind=["rigid-articulated-humanoid", "jointed-limbs", "attached-weapon", "hanging-tabard-panels"],
          motionPotential=["idle-breathing", "walk-run-cycle", "spear-thrust", "dodge-roll", "visor-and-light-glow-pulse"],
          materialFamilies=["painted-ivory-armour", "navy-armour-panels", "near-black-mechanical-frame", "emissive-orange-lights", "emissive-blue-blade"],
          notes="Vanguard T-pose turnaround (front / left / back / right + detail crops + spear + palette). Voxel-art look built from hard boxes; rigid parts per joint; the views sit on a busy sunset arena so the figure is matted out (ref/*_matte.png).")
cx = spec["preSpecAssessment"]["complexity"]
cx["tier"] = "complex"
cx["scores"] = dict(silhouetteComplexity=3, componentCount=3, hierarchyDepth=3, repetitionDensity=3, materialLayerCount=3, localDetailDensity=3, occlusionRisk=2, actionReadinessNeed=3)
n_macro = sum(1 for c in comps if c["level"] == "macro"); n_meso = sum(1 for c in comps if c["level"] == "meso"); n_micro = sum(1 for c in comps if c["level"] == "micro")
cx["estimatedCounts"] = dict(macroComponents=n_macro, mesoComponents=n_meso, microFeatureGroups=max(6, n_micro), materialLayers=len(materials), repetitionSystems=4)
cx["reasoning"] = ["Humanoid of %d rigid boxes over %d joints: head, torso, pelvis + tabards, two arms (pauldron / upper arm / gauntlet / fist), two legs (stepped thigh plates / knee / greave / boot), spear." % (len(comps), len(joints)),
                   "Repetition: left/right mirrored limbs and lights, stepped thigh plates, stepped blade layers, shaft collars.",
                   "Occlusion: back and underside come from the back/side views; hidden inner faces are black cores."]
spec["preSpecAssessment"]["anatomy"].update(applies=True, styleHeads=6.0, confidence=0.65,
                                            note="Lean armoured proportions: head ~0.17 of height, wide flat pauldrons, narrow waist, long legs. No face landmarks (visor only).")
spec["preSpecAssessment"]["anatomy"]["proportions"] = dict(headUnit=11.0, torso=22.0, legs=32.0, shoulderWidth=34.0, hipWidth=16.0)
spec["preSpecAssessment"]["anatomy"]["pose"] = dict(type="t-pose-a-stance-legs", jointAngles={"shoulderL": 90, "hipL": 11})
spec["preSpecAssessment"]["anatomy"]["faceLandmarks"] = dict(eyeLine=0.9, eyeSpacing=0.0, noseBase=0.0, mouthLine=0.0, hairline=0.0)
spec["preSpecAssessment"]["anatomy"]["features"] = ["orange visor band", "ear bearings with orange lights", "navy T chest plate"]

spec["suitability"] = "pass"
spec["scores"] = dict(object_isolation=2, silhouette_readability=3, depth_inference=3, primitive_decomposition=3, material_procedurality=3, occlusion_risk=2, interaction_fit=3)
spec["silhouette"] = dict(boundingShape="lean humanoid in a T-pose: wide flat pauldrons, narrow dark waist, legs in a slight A-stance; spear taller than the head",
                          aspectRatios=["width:height ~ 1.05:1 in the T-pose (arms out)", "head:body ~ 1:6"],
                          symmetry="bilateral left/right",
                          dominantCurves=["hard stepped voxel edges on every plate"],
                          negativeSpaces=["gap between the legs below the tabard", "gap between the arms and the torso", "visor recess"],
                          landmarks=["orange visor band at ~90% height", "navy T chest plate", "navy tabard with orange squares", "orange pauldron and knee lights", "stepped blue blade above the head"])
spec["viewEvidence"] = [
    dict(id="front", view="primary", imageRegion=dict(x=0, y=0, width=1, height=1, units="normalized"), observations=["Front view, arms out, legs in a slight A-stance."], confidence=0.85),
    dict(id="side", view="secondary", imageRegion=dict(x=0, y=0, width=1, height=1, units="normalized"), observations=["Left side view: thin depth, orange ear light and pauldron light, tabard edges as thin navy strips."], confidence=0.8),
    dict(id="back", view="secondary", imageRegion=dict(x=0, y=0, width=1, height=1, units="normalized"), observations=["Back view: navy back plate, white helmet rear, tabard back panel with one orange square."], confidence=0.8),
    dict(id="right", view="secondary", imageRegion=dict(x=0, y=0, width=1, height=1, units="normalized"), observations=["Right side view mirrors the left."], confidence=0.75),
]
spec["referenceCamera"] = dict(solved=False, fovDegrees=30.0, aspect=0.665, orientation=dict(yaw=0.0, pitch=2.0, roll=0.0), positionHint=[0, 1.0, 5.2],
                               note="The views are near-orthographic renders; review renders use a long lens and matched framing, not a solved camera.")
spec["coordinateFrame"] = dict(front="+Z (visor faces +Z)", up="+Y", left="+X (character's left)", scaleReference=f"1 voxel = {S} m; 67 voxels tall ~ 1.97 m")
spec["featureReviewTargets"] = [
    dict(id="helmet-visor", name="White helmet with navy crest block, white brow band, orange visor slab and orange ear lights on navy bearings", tier="critical", passIds=["blockout", "form-refinement"], minimumScore=0.75, mustPass=True, componentRefs=["head_core", "head_visor", "head_crest", "head_ear_light_L"], evidenceRefs=["front", "side"]),
    dict(id="chest-tabard", name="White side plates with a navy T plate; dark waist with an orange square; navy tabards with orange squares", tier="critical", passIds=["structural-pass", "form-refinement"], minimumScore=0.75, mustPass=True, componentRefs=["chest_bar", "chest_stem", "tabard_front", "tabard_front_light_top"], evidenceRefs=["front", "back"]),
    dict(id="pauldrons-arms", name="Flat white pauldron caps with navy rim and orange light, dark upper arms, white gauntlets with navy cuffs, black fists", tier="critical", passIds=["structural-pass", "form-refinement"], minimumScore=0.7, mustPass=True, componentRefs=["pauldron_cap_L", "forearm_L", "hand_L"], evidenceRefs=["front", "side"]),
    dict(id="legs-joints", name="Stepped white thigh plates with a navy strip, white knee guard over a dark bearing with orange light, navy greave panel, wide boots", tier="important", passIds=["structural-pass", "material-pass"], minimumScore=0.7, mustPass=False, componentRefs=["thigh_plate_1_L", "knee_cap_L", "shin_navy_L", "foot_toe_L"], evidenceRefs=["front", "side"]),
    dict(id="spear", name="Dark spear with orange and white collars and a stepped sky-blue blade on an orange gem", tier="important", passIds=["structural-pass", "form-refinement"], minimumScore=0.7, mustPass=False, componentRefs=["spear_shaft", "spear_blade_1", "spear_gem"], evidenceRefs=["front"]),
]
spec["featureReviewTargets"] += [
    dict(id="anatomy-proportion", name="Lean proportions: small head, wide flat pauldrons, narrow waist, long legs", tier="important", passIds=["blockout", "form-refinement"], minimumScore=0.7, mustPass=False, componentRefs=["head_core", "chest_core", "thigh_plate_1_L"], evidenceRefs=["front", "side"]),
    dict(id="face-landmark-placement", name="Visor band at ~90% height, ear lights at the temple line", tier="important", passIds=["form-refinement"], minimumScore=0.7, mustPass=False, componentRefs=["head_visor", "head_ear_L"], evidenceRefs=["front", "side"]),
    dict(id="pose-silhouette", name="T-pose arms level with the pauldrons' lower edge, legs in a slight A-stance", tier="important", passIds=["blockout"], minimumScore=0.7, mustPass=False, componentRefs=["root"], evidenceRefs=["front"]),
    dict(id="outfit-and-palette", name="White / navy / orange / near-black blocking, sky-blue blade", tier="important", passIds=["material-pass"], minimumScore=0.7, mustPass=False, componentRefs=["chest_bar", "tabard_front"], evidenceRefs=["front"]),
]
spec["repetitionSystems"] = [
    dict(id="limb-mirror", kind="mirror-array", count=2, pitch=1.0, axis="+X", target="forearm_L", realization="Left limb parts authored once; right parts are mirrored boxes across x=0.", evidence=["front"], confidence=0.8, buildsGeometry=True, instances=2),
    dict(id="light-squares", kind="mirror-array", count=2, pitch=1.0, axis="+X", target="pauldron_light_L", realization="Orange emissive lights mirrored left/right.", evidence=["front"], confidence=0.8, buildsGeometry=True, instances=2),
    dict(id="thigh-steps", kind="linear-array", count=4, pitch=0.25, axis="-Y", target="thigh_plate_1_L", realization="Four stepped white thigh plates.", evidence=["front"], confidence=0.8, buildsGeometry=True, instances=4),
    dict(id="blade-steps", kind="linear-array", count=5, pitch=0.1, axis="+Y", target="spear_blade_0", realization="Five stepped blade layers narrowing toward the tip.", evidence=["front"], confidence=0.8, buildsGeometry=True, instances=5),
]
spec["lightingFromPhoto"] = [
    dict(role="key", direction="front-left, ~35 deg elevation, low sun", colorTemp="warm", intensity="moderate", evidence=["front"]),
    dict(role="fill", direction="cool ambient from the sky", colorTemp="cool-violet", intensity="low", evidence=["front"]),
    dict(role="rim", direction="behind and above", colorTemp="warm", intensity="low", evidence=["side"]),
    dict(role="environment", direction="dusk sky with warm horizon", colorTemp="warm-violet", intensity="low", note="Soft IBL. ACES filmic tone mapping, exposure ~1.0 (tone mapping intent); orange lights are emissive, bloom optional.", evidence=["front"]),
    dict(role="contact-shadow", direction="straight down", colorTemp="neutral", intensity="moderate", note="Soft contact shadow / ground shadow under the boots on a dark floor plane.", evidence=["front"]),
]
spec["assumptions"] = ["Hidden top/bottom of the boots and inner limb faces are dark cores.", "The rig's legs are 4 voxels longer than the reference's (hips lower in the reference): the model is ~6% taller than the image.", "Arms are authored hanging and rotated into the T-pose for this spec; the pauldron sits above the arm axis as in the reference."]

# detail inventory: every detail maps to a component.localFeatures id
det = []
def D(did, desc, comp, prio="important", kind="contour"):
    det.append(dict(id=did, description=desc, priority=prio, componentRef=comp, materialRef=[c["material"] for c in comps if c["id"] == comp][0], evidenceRef="front/side/back", confidence=0.75, realization="unreported", kind=kind,
                    mapsTo=dict(ref=f"{comp}/{comp}-feature")))
D("visor-slab", "Orange emissive visor slab across the face", "head_visor", "critical", "emissive")
D("ear-lights", "Orange ear lights on navy bearings", "head_ear_light_L", "critical", "emissive")
D("crest-block", "Navy crest block and white brim/band on the helmet", "head_crest", "critical", kind="contour")
D("chest-t-plate", "Navy T-shaped chest plate", "chest_bar", "critical", kind="contour")
D("waist-square", "Orange square on the dark abdomen", "spine_light", "important", "emissive")
D("tabard-lights", "Orange squares on the navy tabard (belt and hem)", "tabard_front_light_top", "critical", "emissive")
D("pauldron-step", "Flat white pauldron cap with navy rim and orange light", "pauldron_cap_L", "critical", kind="ridge")
D("forearm-stripe", "Navy stripe and cuff on the white gauntlet", "forearm_navy_L", "important", kind="seam")
D("black-fist", "Black fist with thumb block", "hand_L", "important", kind="groove")
D("thigh-steps", "Stepped white thigh plates with a navy side strip", "thigh_plate_2_L", "critical", kind="ridge")
D("knee-guard", "White knee guard over a dark bearing with orange light", "knee_cap_L", "critical", kind="contour")
D("knee-light", "Orange light on the outer side of the knee bearing", "knee_light_L", "important", "emissive")
D("greave-panel", "Navy panel on the white greave", "shin_navy_L", "important", kind="seam")
D("boot", "Dark boot with white toe cap and navy trim", "foot_toe_L", "important", kind="contour")
D("back-plate", "Navy back plate standing off the torso", "chest_back", "important", kind="contour")
D("spear-blade", "Stepped sky-blue blade on an orange gem", "spear_blade_1", "critical", kind="ridge")
D("spear-collars", "White and orange collars along the dark shaft", "spear_collar_0", "important", kind="ridge")
spec["preSpecAssessment"]["detailInventory"].update(scanMethod="component-zones", targetMinDetails=10, details=det)
spec["qualityContract"]["minimumSpecDepth"].update(macroComponents=3, mesoComponents=8, microFeatureGroups=5, materialLayers=3, repetitionSystems=1, reviewViewpoints=4)
spec["performanceBudget"]["targetTriangles"] = 40000
spec["proceduralStrategy"] = spec.get("proceduralStrategy", [])

json.dump(spec, open(HERE / "object-sculpt-spec.json", "w"), indent=1)
print("components", len(comps), "macro", n_macro, "meso", n_meso, "micro", n_micro, "materials", len(materials))
