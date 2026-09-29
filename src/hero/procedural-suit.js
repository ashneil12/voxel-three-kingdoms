// One asset, two representations: inspectable parts or joint/material batches.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { suitDesign } from '../heroes/suit-design.js';
import { shell, outline, chamferBox, cable, finish } from './suit-geometry.js';

export function createProceduralSuit(rig, designInput, { editable = false } = {}) {
  const d=suitDesign(designInput), parts=[], meshes={}, groups=new Map();
  const mat=(color,roughness,metalness,paint=false)=>finish(new THREE.MeshStandardMaterial({color,roughness,metalness}),paint);
  const blue=new THREE.Color(d.accent);
  const m={shell:mat(d.shell,.57,.3,true),accent:mat(d.accent,.46,.45,true),accentShade:mat(blue.clone().multiplyScalar(.76),.5,.44,true),
    dark:mat(d.dark,.68,.35),steel:mat(d.steel,.33,.72),
    rubber:mat('#10191d',.86,.05),mark:mat('#454b4d',.72,.1),
    signal:new THREE.MeshStandardMaterial({color:d.signal,emissive:d.signal,emissiveIntensity:.75,roughness:.32,metalness:.25}),
    visor:new THREE.MeshStandardMaterial({color:'#ff9d3c',emissive:'#ff7a1a',emissiveIntensity:.85,roughness:.24}),
    visorHot:new THREE.MeshStandardMaterial({color:'#ffd27a',emissive:'#ffb457',emissiveIntensity:1.2,roughness:.2})};
  const add=(joint,name,geometry,material,pos=[0,0,0],rot=[0,0,0],scale=[1,1,1])=>{
    if(!rig.joints[joint]) throw new Error(`Missing suit joint ${joint}`);
    const transform=new THREE.Matrix4().compose(new THREE.Vector3(...pos),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),new THREE.Vector3(...scale));
    const record={joint,name,geometry,material,transform}; parts.push(record);
    if(editable){const mesh=new THREE.Mesh(geometry,m[material]); mesh.name=name; transform.decompose(mesh.position,mesh.quaternion,mesh.scale);
      mesh.castShadow=true; mesh.receiveShadow=true; rig.joints[joint].add(mesh); meshes[name]=mesh;
    }else{const key=`${joint}:${material}`; if(!groups.has(key))groups.set(key,[]); groups.get(key).push(record);}
  };
  const block=(j,n,w,h,z,ma,p,r)=>add(j,n,chamferBox(w,h,z,Math.min(w,h,z)*.14),ma,p,r);
  const plate=(j,n,pts,depth,ma,p,r)=>add(j,n,outline(pts,depth),ma,p,r);
  const cylinder=(j,n,r,h,ma,p,rot=[0,0,Math.PI/2])=>add(j,n,new THREE.CylinderGeometry(r,r,h,16),ma,p,rot);
  const sphere=(j,n,r,ma,p)=>add(j,n,new THREE.SphereGeometry(r,16,12),ma,p);
  const bolt=(j,n,p,rot=[Math.PI/2,0,0])=>cylinder(j,n,.008,.006,'steel',p,rot);
  const rib=(j,n,p,w=.15)=>{for(let i=0;i<5;i++)block(j,`${n}-${i}`,w,.012,.095,'rubber',[p[0],p[1]+i*.018,p[2]]);};
  const ring=(j,n,r,t,ma,p,rot=[0,Math.PI/2,0])=>add(j,n,new THREE.TorusGeometry(r,t,6,24),ma,p,rot);
  const seam=(j,n,points,p)=>plate(j,n,points,.003,'dark',p);

  // ---- torso: dark core under a layered ivory cuirass; blue sternum shield with the warn triangle;
  // segmented abdomen; broad pelvis with ivory skirting. (v2, matched to the art sheet)
  add('chest','torso-core',shell([[-.18,.29,.235],[0,.375,.315],[.12,.355,.30],[.205,.275,.25]]),'dark');
  plate('chest','sternum-shield',[[-.085,.235],[0,.252],[.085,.235],[.096,.10],[.062,.0],[0,-.032],[-.062,.0],[-.096,.10]].map(([x,y])=>[x*d.chest,y]),.055,'accent',[0,0,.145]);
  plate('chest','sternum-keystone',[[-.032,.032],[.032,.032],[.038,-.035],[0,-.062],[-.038,-.035]],.018,'accentShade',[0,.092,.182]);
  plate('chest','unit-chevron',[[-.036,.019],[.036,.019],[0,-.018]],.007,'signal',[0,.208,.19]);
  seam('chest','upper-chest-seam',[[-.125,.202],[-.05,.211],[-.048,.206],[-.125,.197]],[0,0,.146]);
  seam('chest','upper-chest-seam-right',[[.125,.202],[.05,.211],[.048,.206],[.125,.197]],[0,0,.146]);
  for(const [side,s] of [['L',1],['R',-1]]){
    plate('chest',`pec-plate-${side}`,[[s*.072,.248],[s*.148,.222],[s*.198,.132],[s*.188,.02],[s*.138,-.048],[s*.082,-.008],[s*.075,.12]].map(([x,y])=>[x*d.chest,y]),.085*d.armour,'shell',[0,.018,.072],[-.1,-s*.32,0]);
    seam('chest',`pec-seam-${side}`,[[s*.085,-.012],[s*.135,-.045],[s*.135,-.052],[s*.085,-.02]],[0,.012,.128]);
    seam('chest',`pec-seam-upper-${side}`,[[s*.08,.155],[s*.135,.132],[s*.136,.125],[s*.081,.148]],[0,.02,.139]);
    for(const t of [.055,.115,.175])bolt('chest',`pec-bolt-${side}-${t}`,[s*(.09+t*.45),.19-t*.85,.15]);
    plate('chest',`rib-panel-${side}`,[[s*.14,-.055],[s*.198,-.02],[s*.21,-.125],[s*.155,-.168],[s*.118,-.118]],.06,'shell',[0,-.01,.07],[0,-s*.32,0]);
    plate('chest',`rib-blue-${side}`,[[s*.152,-.128],[s*.205,-.09],[s*.208,-.168],[s*.162,-.185]],.05,'accentShade',[0,-.01,.075],[0,-s*.32,0]);
    block('chest',`clavicle-rail-${side}`,.125,.042,.095,'shell',[s*.128,.242,.045],[0,0,s*.30]);
    block('chest',`collar-vent-${side}`,.06,.02,.05,'dark',[s*.058,.262,.075],[0,0,s*.2]);
    bolt('chest',`chest-fastener-${side}`,[s*.19,.075,.135]);
    add('chest',`back-shell-${side}`,shell([[-.13,.13,.09],[.02,.19,.16],[.15,.155,.10]]),'shell',[s*.135,.03,-.185]);
    for(let i=0;i<4;i++)block('chest',`heat-sink-${side}-${i}`,.07,.013,.016,'dark',[s*.135,-.075+i*.031,-.24]);
    block('chest',`back-amber-${side}`,.034,.017,.016,'signal',[s*.135,.085,-.235]);
    add('spine',`waist-hydraulics-${side}`,cable([[s*.13,.16,-.01],[s*.165,.05,.03],[s*.1,-.06,.03]],.02),'dark');
    cylinder('spine',`waist-piston-${side}`,.012,.13,'steel',[s*.135,.03,.06],[0,0,-s*.26]);
  }
  add('spine','abdominal-core',shell([[-.03,.245,.205],[.075,.30,.26],[.175,.30,.255],[.27,.26,.22]]),'dark');
  for(let i=0;i<3;i++)block('spine',`floating-ab-plate-${i}`,.195-i*.014,.05,.115,'dark',[0,.035+i*.062,.075],[.1,0,0]);
  for(let i=0;i<3;i++){const w=.148-i*.012;
    block('spine',`ab-keystone-${i}`,w,.028,.02,'rubber',[0,.03+i*.062,.135]);}
  block('spine','back-spine-guard',.115,.24,.05,'accent',[0,.06,-.155]);
  add('spine','back-spine-vent',shell([[-.02,.075,.03],[.16,.085,.035]]),'dark',[0,.02,-.19]);
  add('hips','pelvic-cage',shell([[-.13,.235,.24],[-.02,.335,.30],[.095,.30,.26]]),'dark');
  plate('hips','pelvis-keystone',[[-.075,.075],[.075,.075],[.086,-.045],[.05,-.112],[-.05,-.112],[-.086,-.045]],.07,'shell',[0,0,.135]);
  plate('hips','pelvis-keystone-lower',[[-.04,-.05],[.04,-.05],[.045,-.09],[0,-.115],[-.045,-.09]],.03,'accentShade',[0,0,.16]);
  for(const [side,s] of [['L',1],['R',-1]]){
    plate('hips',`hip-skirt-${side}`,[[-.075,.095],[.075,.08],[.115,-.03],[.085,-.115],[.015,-.14],[-.065,-.09]],.055,'shell',[s*.135,-.015,.045],[0,s*.38,-s*.06]);
    plate('hips',`hip-skirt-blue-${side}`,[[-.04,-.062],[.042,-.05],[.058,-.1],[-.002,-.118],[-.052,-.095]],.03,'accentShade',[s*.132,-.03,.05],[0,s*.38,-s*.06]);
    block('hips',`belt-float-${side}`,.10,.06,.125,'shell',[s*.148,.035,.035],[0,s*.2,s*.22]);
    bolt('hips',`belt-stud-${side}`,[s*.15,.045,.115]);
    bolt('hips',`skirt-stud-upper-${side}`,[s*.155,.035,.09]);
    bolt('hips',`skirt-stud-lower-${side}`,[s*.175,-.075,.05]);
    cylinder('hips',`hip-drive-${side}`,.068,.055,'steel',[s*.165,-.075,0]);
    ring('hips',`hip-seal-${side}`,.062,.011,'rubber',[s*.195,-.075,0]);
  }
  cylinder('neck','neck-core',.078,.13,'dark',[0,.01,0],[0,0,0]);
  cylinder('neck','neck-seal',.088,.013,'steel',[0,-.03,0],[0,0,0]);
  add('neck','collar-ring',shell([[-.1,.185,.15,0,.01],[-.045,.205,.175,0,.013],[.005,.185,.155,0,.008]]),'shell');
  plate('neck','front-throat-guard',[[-.06,.036],[.06,.036],[.068,-.018],[.036,-.044],[-.036,-.044],[-.068,-.018]],.03,'shell',[0,-.012,.065]);
  for(const s of [-1,1])block('neck',`side-neck-armour-${s}`,.05,.058,.10,'shell',[s*.098,-.028,-.012],[0,0,s*.18]);

  // Helmet v4: tall smooth ivory dome (longer front-back than wide), blue crown band, brow band over
  // a recessed amber visor with a slim nose ridge, shadowed mouth, rounded jaw, disc ear pods.
  add('head','helmet-understructure',shell([[.02,.14,.16],[.09,.185,.20,0,.006],[.19,.18,.195,0,0]]),'dark');
  add('head','helmet-dome',shell([[.03,.155,.185,0,.006],[.075,.187,.216,0,.012],[.12,.202,.234,0,.014],[.165,.209,.242,0,.012],[.21,.203,.234,0,.006],[.248,.176,.20,0,-.002],[.272,.126,.14,0,-.007],[.286,.074,.08,0,-.009]]),'shell');
  add('head','crown-blue-band',shell([[.165,.15,.10,0,-.026],[.215,.14,.094,0,-.025],[.25,.108,.078,0,-.023],[.272,.062,.046,0,-.021]]),'accent');
  plate('head','brow-band',[[-.096,.03],[-.04,.04],[0,.044],[.04,.04],[.096,.03],[.098,-.002],[0,-.014],[-.098,-.002]],.022,'shell',[0,.176,.114],[-.1,0,0]);
  plate('head','brow-peak',[[-.016,.01],[.016,.01],[0,-.02]],.024,'shell',[0,.156,.128]);
  plate('head','visor-recess',[[-.092,.042],[.092,.042],[.092,-.038],[-.092,-.038]],.02,'rubber',[0,.134,.108]);
  plate('head','visor-band',[[-.088,.022],[-.028,.009],[0,.003],[.028,.009],[.088,.022],[.09,-.007],[.057,-.022],[0,-.03],[-.057,-.022],[-.09,-.007]],.012,'visor',[0,.133,.12]);
  plate('head','visor-core',[[-.076,.008],[.076,.008],[.078,-.004],[.048,-.015],[-.048,-.015],[-.078,-.004]],.006,'visorHot',[0,.132,.127]);
  plate('head','nose-ridge',[[-.011,.032],[.011,.032],[.013,-.028],[-.013,-.028]],.012,'shell',[0,.136,.13]);
  plate('head','mouth-shadow',[[-.07,.02],[.07,.02],[.064,-.02],[-.064,-.02]],.018,'rubber',[0,.1,.11]);
  plate('head','mouth-band',[[-.075,.014],[.075,.014],[.07,-.012],[-.07,-.012]],.014,'dark',[0,.094,.112]);
  plate('head','jaw-guard',[[-.066,.044],[.066,.044],[.08,-.004],[.05,-.05],[.018,-.058],[-.018,-.058],[-.05,-.05],[-.08,-.004]],.046,'shell',[0,.072,.09]);
  plate('head','chin-accent',[[-.026,.01],[.026,.01],[.022,-.008],[-.022,-.008]],.007,'accent',[0,.058,.108]);
  for(const [side,s] of [['L',1],['R',-1]]){
    plate('head',`cheek-armour-${side}`,[[s*.04,.062],[s*.088,.082],[s*.102,.02],[s*.082,-.02],[s*.052,-.046],[s*.036,-.006]],.05,'shell',[0,.115,.086]);
    seam('head',`cheek-seam-${side}`,[[s*.052,-.02],[s*.088,.004],[s*.088,-.001],[s*.052,-.025]],[0,.112,.106]);
    cylinder('head',`ear-housing-${side}`,.062,.05,'dark',[s*.098,.158,.006]);
    ring('head',`ear-metal-rim-${side}`,.05,.011,'steel',[s*.126,.158,.006]);
    cylinder('head',`ear-cap-${side}`,.036,.012,'dark',[s*.133,.158,.006]);
    cylinder('head',`ear-hub-dot-${side}`,.013,.01,'steel',[s*.14,.158,.006]);
    bolt('head',`temple-stud-a-${side}`,[s*.07,.222,.094]);
    bolt('head',`temple-stud-b-${side}`,[s*.086,.2,.1]);
  }

  for(const [side,s] of [['L',1],['R',-1]]){
    const shoulder=`shoulder${side}`, upper=`upperArm${side}`, fore=`foreArm${side}`, hand=`hand${side}`, thigh=`thigh${side}`, shin=`shin${side}`, foot=`foot${side}`;
    // --- pauldron: angular layered cap over the shoulder ball, blue lower band, rim bolts, 07 decal
    sphere(shoulder,`shoulder-ball-${side}`,.095,'rubber',[s*.012,-.035,0]);
    cylinder(shoulder,`shoulder-rotor-${side}`,.075,.14,'steel',[s*.048,-.03,0]);
    add(shoulder,`pauldron-underlay-${side}`,shell([[-.08,.16,.10],[.02,.2,.125],[.07,.15,.10]]),'dark',[s*.082,-.02,0],[0,0,s*.2]);
    // two stacked plates: a big ivory cap and a blue-grey lower band with a steel lip
    add(shoulder,`pauldron-shell-${side}`,shell([[-.075,.315,.15,0,.008],[.005,.35*d.shoulder,.175*d.armour,0,.012],[.07,.315*d.shoulder,.165*d.armour,0,.006],[.12,.21,.115,0,-.006]]),'shell',[s*.103,.005,0],[0,0,s*.30]);
    add(shoulder,`pauldron-cap-edge-${side}`,shell([[-.095,.325,.155],[-.07,.34,.163]]),'shell',[s*.102,0,.002],[0,0,s*.30]);
    add(shoulder,`pauldron-blue-band-${side}`,shell([[-.185,.30,.155],[-.072,.33,.168]]),'accentShade',[s*.098,-.075,0],[0,0,s*.30]);
    add(shoulder,`pauldron-edge-${side}`,shell([[-.2,.305,.158],[-.182,.317,.164]]),'steel',[s*.096,-.082,-.002],[0,0,s*.30]);
    block(shoulder,`pauldron-top-inset-${side}`,.09,.038,.11,'shell',[s*.1,.1,-.012],[.05,0,s*.26]);
    // 07 decal on the outer face
    add(shoulder,`unit-zero-${side}`,new THREE.TorusGeometry(.019,.0055,4,16),'mark',[s*.185,.058,.045],[0,s*.5,0],[0.9,1.2,1]);
    block(shoulder,`unit-zero-bar-${side}`,.007,.026,.004,'mark',[s*.199,.058,.033],[0,s*.5,0]);
    block(shoulder,`unit-seven-top-${side}`,.04,.0075,.004,'mark',[s*.162,.09,.06],[0,s*.5,0]);
    block(shoulder,`unit-seven-diag-${side}`,.0085,.038,.004,'mark',[s*.147,.071,.057],[0,s*.5,s*.5]);
    block(shoulder,`shoulder-warning-${side}`,.046,.022,.013,'signal',[s*.205,-.024,.072],[0,s*.45,0]);
    for(let i=0;i<3;i++)block(shoulder,`shoulder-lower-vent-${side}-${i}`,.021,.0075,.019,'dark',[s*(.048+i*.033),-.128,.112]);
    for(const t of [-.02,.06,.13])bolt(shoulder,`pauldron-cap-bolt-${side}-${t}`,[s*(.1+t*.5),.0,.148]);
    // --- upper arm: dark sleeve, small ivory outer plate, blue shoulder band, elbow bellows
    cylinder(upper,`bicep-core-${side}`,.066,.25,'dark',[0,-.15,0],[0,0,0]);
    block(upper,`upper-band-${side}`,.115,.055,.125,'accent',[0,-.045,-.005],[0,0,s*.06]);
    block(upper,`upper-arm-side-plate-${side}`,.042,.145,.135,'shell',[s*.082,-.145,.008],[0,0,s*.08]);
    for(let i=0;i<2;i++)block(upper,`bicep-mechanism-${side}-${i}`,.017,.05,.022,'steel',[s*.05,-.2+i*.08,.085]);
    rib(upper,`elbow-bellows-${side}`,[0,-.265,.02],.10);
    // --- elbow and forearm: steel elbow pod, tapered gauntlet, big blue outer panel
    cylinder(fore,`elbow-axle-${side}`,.052,.16,'dark',[0,0,0]);
    ring(fore,`elbow-ring-${side}`,.045,.009,'steel',[s*.09,0,0]);
    cylinder(fore,`elbow-pod-${side}`,.04,.02,'shell',[s*.088,0,0],[0,0,Math.PI/2]);
    cylinder(fore,`elbow-pod-core-${side}`,.017,.014,'steel',[s*.1,0,0],[0,0,Math.PI/2]);
    cylinder(fore,`forearm-frame-${side}`,.058,.21,'rubber',[0,-.145,0],[0,0,0]);
    add(fore,`gauntlet-armour-${side}`,shell([[-.265,.135,.14,0,.02],[-.215,.19,.20,0,.032],[-.065,.215,.225,0,.022],[-.018,.145,.152,0,.01]]),'shell',[0,0,0],[-.08,0,0]);
    plate(fore,`forearm-blue-panel-${side}`,[[-.072,.08],[.018,.11],[.072,.018],[.028,-.072],[-.072,-.076],[-.096,-.018]],.03,'accent',[s*.1,-.12,-.01],[0,s*Math.PI/2,0]);
    plate(fore,`forearm-inset-${side}`,[[-.043,.075],[.04,.1],[.05,-.048],[.015,-.088],[-.04,-.06]],.008,'shell',[0,-.135,.15]);
    seam(fore,`forearm-plate-seam-${side}`,[[-.068,-.215],[.068,-.215],[.068,-.219],[-.068,-.219]],[0,0,.125]);
    plate(fore,`forearm-service-hatch-${side}`,[[-.036,.03],[.036,.03],[.043,-.024],[-.043,-.024]],.006,'accentShade',[0,-.088,.152]);
    block(fore,`wrist-warning-${side}`,.04,.018,.012,'signal',[s*.032,-.232,.11]);
    bolt(fore,`forearm-bolt-a-${side}`,[s*.062,-.06,.138]);
    bolt(fore,`forearm-bolt-b-${side}`,[s*.075,-.185,.10]);
    cylinder(fore,`wrist-cuff-${side}`,.056,.05,'steel',[0,-.27,0],[0,0,0]);
    // --- hand: gripping glove, shaft channel along local Z
    cylinder(hand,`wrist-seal-${side}`,.052,.05,'steel',[0,.045,0],[0,0,0]);
    ring(hand,`wrist-ring-${side}`,.049,.009,'rubber',[0,.058,0],[Math.PI/2,0,0]);
    block(hand,`palm-core-${side}`,.088,.075,.11,'dark',[0,-.016,0]);
    block(hand,`hand-backplate-${side}`,.034,.048,.098,'shell',[s*-.036,.02,0],[0,0,-.32]);
    block(hand,`hand-backridge-${side}`,.046,.019,.088,'shell',[s*-.023,.042,-.012],[0,0,-.32]);
    for(let f=0;f<4;f++){
      const z=(f-1.5)*.028;
      block(hand,`finger-knuckle-${side}-${f}`,.026,.03,.025,'steel',[-.034,.026,z],[0,0,-.6]);
      block(hand,`finger-middle-${side}-${f}`,.025,.029,.025,'dark',[-.038,-.012,z],[0,0,-1.3]);
      block(hand,`finger-tip-${side}-${f}`,.024,.027,.025,'steel',[-.015,-.037,z],[0,0,-2.0]);
    }
    block(hand,`thumb-${side}`,.029,.027,.029,'dark',[s*.036,.026,.016],[0,0,s*1.0]);
    block(hand,`thumb-tip-${side}`,.027,.025,.027,'dark',[s*.013,.042,.04],[0,0,s*1.65]);
    // --- leg: femur, layered thigh plates, inner blue panel
    sphere(thigh,`hip-bearing-${side}`,.086,'rubber',[0,-.02,0]);
    cylinder(thigh,`femur-${side}`,.068,.345,'dark',[0,-.21,0],[0,0,0]);
    add(thigh,`thigh-shell-${side}`,shell([[-.365,.135,.15,0,.02],[-.30,.185,.205,0,.035],[-.125,.228,.235,0,.028],[-.05,.16,.175,0,.006]]),'shell');
    plate(thigh,`thigh-front-plate-${side}`,[[-.052,-.02],[.052,-.012],[.045,-.115],[-.008,-.15],[-.05,-.105]],.03,'shell',[0,-.23,.115],[.06,0,0]);
    seam(thigh,`thigh-armour-seam-${side}`,[[-.062,-.292],[.064,-.292],[.064,-.296],[-.062,-.296]],[0,0,.125]);
    seam(thigh,`thigh-edge-seam-${side}`,[[-.075,-.14],[.075,-.15],[.075,-.155],[-.075,-.145]],[0,0,.12]);
    for(const t of [-.1,-.16,-.22])bolt(thigh,`thigh-row-bolt-${side}-${t}`,[s*.092,t,.09]);
    add(thigh,`outer-thigh-panel-${side}`,shell([[-.29,.05,.145],[-.115,.072,.185],[-.06,.055,.145]]),'accent',[s*.10,0,-.005]);
    plate(thigh,`inner-thigh-blue-${side}`,[[-.05,-.03],[.045,0],[.06,-.085],[.005,-.15],[-.06,-.10]],.045,'accent',[s*-.108,-.20,.02],[0,-s*Math.PI/2,0]);
    plate(thigh,`upper-thigh-chevron-${side}`,[[s*.007,-.07],[s*.072,-.082],[s*.055,-.115],[s*.008,-.121]],.009,'accentShade',[0,0,.118]);
    cylinder(thigh,`outer-hip-axle-${side}`,.05,.032,'steel',[s*.115,-.045,0]);
    ring(thigh,`outer-hip-black-seal-${side}`,.042,.008,'rubber',[s*.134,-.045,0]);
    block(thigh,`thigh-bottom-latch-${side}`,.072,.045,.024,'accent',[0,-.335,.125],[.12,0,0]);
    for(const t of [.10,.17])bolt(thigh,`thigh-bolt-${side}-${t}`,[s*.088,-t,.10]);
    rib(thigh,`knee-bellows-${side}`,[0,-.40,.025],.10);
    // --- knee and shin: drum joint on the outer side, front plate, calf shell
    sphere(shin,`knee-socket-${side}`,.078,'dark',[0,-.005,0]);
    cylinder(shin,`knee-front-bearing-${side}`,.05,.036,'steel',[0,0,.072],[Math.PI/2,0,0]);
    ring(shin,`knee-front-seal-${side}`,.038,.009,'rubber',[0,0,.098],[0,0,0]);
    cylinder(shin,`knee-side-drum-${side}`,.06,.042,'steel',[s*.072,0,0]);
    ring(shin,`knee-drum-rim-${side}`,.05,.012,'dark',[s*.094,0,0]);
    cylinder(shin,`knee-drum-core-${side}`,.042,.014,'dark',[s*.1,0,0]);
    ring(shin,`knee-drum-inner-${side}`,.028,.009,'steel',[s*.105,0,0]);
    plate(shin,`knee-cap-${side}`,[[-.052,.05],[.052,.05],[.064,-.014],[.032,-.058],[-.034,-.056],[-.06,-.012]],.028,'shell',[0,.008,.082],[.12,0,0]);
    cylinder(shin,`calf-frame-${side}`,.06,.33,'dark',[0,-.22,0],[0,0,0]);
    add(shin,`shin-armour-${side}`,shell([[-.41,.14,.15,0,.02],[-.335,.185,.20,0,.045],[-.13,.228,.235,0,.042],[-.07,.165,.175,0,.025]]),'shell');
    add(shin,`calf-shell-${side}`,shell([[-.345,.125,.10,0,-.09],[-.175,.185,.145,0,-.089],[-.085,.14,.10,0,-.085]]),'accent');
    plate(shin,`shin-blue-inner-${side}`,[[-.045,.005],[.035,.015],[.04,-.055],[-.035,-.07]],.03,'accentShade',[s*-.06,-.09,.13],[0,-s*.3,0]);
    block(shin,`shin-recess-${side}`,.068,.085,.024,'dark',[0,-.175,.16],[.07,0,0]);
    block(shin,`shin-access-panel-${side}`,.052,.052,.012,'steel',[0,-.181,.178]);
    block(shin,`shin-warning-${side}`,.026,.011,.007,'signal',[0,-.15,.19]);
    seam(shin,`shin-upper-parting-${side}`,[[-.074,-.114],[.077,-.114],[.077,-.119],[-.074,-.119]],[0,0,.145]);
    plate(shin,`shin-side-lock-${side}`,[[s*.055,-.265],[s*.079,-.263],[s*.075,-.308],[s*.057,-.31]],.012,'accentShade',[0,0,.128]);
    for(const x of [-1,1]){
      cylinder(shin,`calf-piston-${side}-${x}`,.01,.21,'steel',[x*.082,-.265,-.022],[0,0,x*.11]);
      block(shin,`ankle-latch-${side}-${x}`,.031,.052,.074,'dark',[x*.072,-.382,.045]);
    }
    bolt(shin,`shin-bolt-${side}`,[s*.06,-.16,.135]);
    for(const t of [-.13,-.19,-.25])bolt(shin,`shin-row-bolt-${side}-${t}`,[s*.098,t,.06]);
    // --- foot: chunky layered boot with side disc, ivory toe cap and blue wedge
    cylinder(foot,`ankle-axle-${side}`,.046,.17,'steel',[0,.02,0]);
    cylinder(foot,`ankle-side-disc-${side}`,.038,.03,'steel',[s*.095,.02,0]);
    ring(foot,`ankle-disc-rim-${side}`,.03,.008,'dark',[s*.112,.02,0]);
    add(foot,`boot-sole-${side}`,shell([[-.062,.18,.30,0,.075],[-.024,.205,.335,0,.085],[.014,.178,.30,0,.085]]),'rubber');
    add(foot,`boot-upper-${side}`,shell([[-.022,.19,.285,0,.088],[.058,.175,.25,0,.05],[.11,.115,.145,0,0]]),'shell');
    block(foot,`boot-toe-cap-${side}`,.17,.048,.075,'shell',[0,.004,.215],[.12,0,0]);
    plate(foot,`boot-toe-blue-${side}`,[[-.07,.028],[.07,.028],[.058,-.03],[-.058,-.03]],.02,'accentShade',[0,.012,.252],[.5,0,0]);
    block(foot,`toe-accent-${side}`,.03,.014,.01,'signal',[0,.052,.232],[.3,0,0]);
    for(const x of [-1,1])block(foot,`toe-bumper-${side}-${x}`,.032,.04,.06,'steel',[x*.075,-.03,.215]);
    block(foot,`instep-band-${side}`,.172,.026,.075,'accent',[0,.062,.085],[-.3,0,0]);
    block(foot,`heel-block-${side}`,.145,.085,.06,'dark',[0,-.014,-.088]);
    bolt(foot,`boot-bolt-a-${side}`,[s*.088,.045,.06]);
    bolt(foot,`boot-bolt-b-${side}`,[s*.082,.02,-.05]);
  }
  // Shaft/tip positions preserve the combat rig's +Z hit/trail contract. Butt shortened to 0.28
  // behind the origin (matches the art sheet: a short butt section above the grip).
  const axial=[Math.PI/2,0,0];
  cylinder('weapon','staff',.021,1.72,'dark',[0,0,.57],axial);
  cylinder('weapon','butt-cap',.029,.055,'steel',[0,0,-.275],axial);
  cylinder('weapon','butt-ring',.03,.012,'signal',[0,0,-.24],axial);
  for(let i=0;i<8;i++)cylinder('weapon',`grip-ring-${i}`,.025,.010,'rubber',[0,0,-.12+i*.047],axial);
  for(const z of [.60,1.10,1.23]){
    cylinder('weapon',`shaft-collar-${z}`,.037,.05,'steel',[0,0,z],axial);
    cylinder('weapon',`shaft-orange-${z}`,.038,.014,'signal',[0,0,z+.023],axial);
  }
  block('weapon','power-receiver',.119,.095,.28,'dark',[0,0,1.34]);
  block('weapon','receiver-top-plate',.106,.027,.235,'steel',[0,.064,1.34]);
  block('weapon','receiver-light',.038,.023,.105,'signal',[.066,0,1.35]);
  add('weapon','receiver-cable',cable([[-.03,-.018,1.12],[-.095,-.04,1.02],[-.17,-.042,1.17],[-.13,-.018,1.39]],.011),'rubber');
  const blade=outline([[-.085,1.38],[.035,1.42],[.27,1.72],[.03,1.98],[-.20,1.65],[-.19,1.47]],.052,.007); blade.rotateX(Math.PI/2); add('weapon','lance-blade',blade,'steel');
  const ridge=outline([[-.045,1.42],[.02,1.45],[.16,1.7],[.02,1.87],[-.13,1.62]],.02,.003); ridge.rotateX(Math.PI/2); add('weapon','blade-ridge',ridge,'dark',[0,.04,0]);
  const ridgeFace=outline([[-.03,1.46],[.012,1.49],[.11,1.68],[.015,1.8],[-.09,1.62]],.014,.002); ridgeFace.rotateX(Math.PI/2); add('weapon','blade-ridge-face',ridgeFace,'steel',[0,.048,0]);
  const inset=outline([[-.05,1.47],[.013,1.50],[.17,1.71],[.02,1.88],[-.12,1.64]],.012,.003); inset.rotateX(Math.PI/2);add('weapon','blade-inset',inset,'dark',[0,.035,0]);
  const edge=outline([[-.19,1.47],[-.20,1.65],[.03,1.98],[.27,1.72],[.245,1.705],[.03,1.925],[-.175,1.64],[-.168,1.485]],.013,.002);edge.rotateX(Math.PI/2);add('weapon','amber-cutting-edge',edge,'visor',[0,.025,0]);
  for(const z of [1.27,1.41])bolt('weapon',`receiver-stud-${z}`,[0,.083,z],[0,0,0]);
  if(!editable)for(const [key,records]of groups){
    const [joint,material]=key.split(':');const prepared=records.map(({geometry,transform})=>{const g=geometry.index?geometry.toNonIndexed():geometry.clone();g.applyMatrix4(transform);g.deleteAttribute('uv');return g;});
    const geometry=mergeGeometries(prepared);prepared.forEach(g=>g.dispose());if(!geometry)throw new Error(`Cannot merge ${key}`);
    const mesh=new THREE.Mesh(geometry,m[material]);mesh.name=key;mesh.castShadow=true;mesh.receiveShadow=true;rig.joints[joint].add(mesh);meshes[key]=mesh;
  }
  const stats={parts:parts.length,triangles:Object.values(meshes).reduce((n,o)=>n+(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3,0),draws:Object.keys(meshes).length};
  if(!editable)parts.forEach(p=>p.geometry.dispose());
  return {meshes,material:m.shell,materials:m,parts:editable?parts:[],stats};
}
