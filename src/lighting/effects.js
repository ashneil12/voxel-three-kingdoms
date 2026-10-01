// Half-resolution contact shading and shadow-map-aware participating media.
// Uses the r186 native PCF shadow depth sampler. This is single scattering, not GI.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
const VS = 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const DEPTH = /* glsl */`
  uniform sampler2D tDepth; uniform mat4 uProjInv;
  vec3 pointAt(vec2 uv) {
    vec4 p=uProjInv*vec4(uv*2.-1.,texture2D(tDepth,uv).r*2.-1.,1.);
    return p.xyz/p.w;
  }
`;
const AO = /* glsl */`
  varying vec2 vUv;
  uniform mat4 uProj; uniform vec2 uTexel; uniform float uRadius; uniform int uSamples;
  ${DEPTH}
  void main(){
    if(texture2D(tDepth,vUv).r>=.99999){gl_FragColor=vec4(1.,1.,1.,5000.);return;}
    vec3 p=pointAt(vUv), l=pointAt(vUv-vec2(uTexel.x,0.)),r=pointAt(vUv+vec2(uTexel.x,0.));
    vec3 b=pointAt(vUv-vec2(0.,uTexel.y)),t=pointAt(vUv+vec2(0.,uTexel.y));
    vec3 dx=abs(r.z-p.z)<abs(p.z-l.z)?r-p:p-l,dy=abs(t.z-p.z)<abs(p.z-b.z)?t-p:p-b;
    vec3 n=normalize(cross(dx,dy));if(dot(n,p)>0.)n=-n;
    vec3 tangent=normalize(abs(n.y)<.99?cross(n,vec3(0.,1.,0.)):cross(n,vec3(1.,0.,0.)));
    vec3 bitangent=cross(n,tangent);
    float angle=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))*6.2831853;
    float occ=0.;
    for(int i=0;i<24;i++){
      if(i>=uSamples)break;
      float u=(float(i)+.5)/float(uSamples),radius=sqrt(u),phi=float(i)*2.39996323+angle;
      vec3 sampleP=p+(tangent*(radius*cos(phi))+bitangent*(radius*sin(phi))+n*sqrt(1.-u))*uRadius*(.25+.75*u);
      vec4 c=uProj*vec4(sampleP,1.);vec2 uv=c.xy/c.w*.5+.5;
      if(c.w<=0.||any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))continue;
      float z=pointAt(uv).z;
      occ+=step(sampleP.z+max(.015,uRadius*.04),z)*(1.-smoothstep(uRadius*.5,uRadius*2.,abs(z-p.z)));
    }
    float visibility=1.-clamp(occ/float(uSamples),0.,.75);
    gl_FragColor=vec4(vec3(visibility),-p.z);
  }
`;
const FILTER = /* glsl */`
  varying vec2 vUv; uniform sampler2D tInput; uniform vec2 uStep;
  void main(){
    vec4 center=texture2D(tInput,vUv);vec3 total=vec3(0.);float weight=0.;
    for(int i=-2;i<=2;i++){
      vec4 v=texture2D(tInput,vUv+float(i)*uStep);
      float w=exp(-float(i*i)*.45-abs(v.a-center.a)/max(.03,center.a*.006));
      total+=v.rgb*w;weight+=w;
    }
    gl_FragColor=vec4(total/max(weight,1e-5),center.a);
  }
`;
const VOLUME = /* glsl */`
  precision highp sampler2DShadow;
  varying vec2 vUv; uniform sampler2DShadow tShadow;
  uniform mat4 uCamWorld,uShadowMatrix; uniform vec3 uCamPos,uLightDir,uLightColor;
  uniform float uDensity,uHeight,uAnisotropy; uniform int uSteps;
  ${DEPTH}
  void main(){
    vec3 p=pointAt(vUv);float depth=-p.z, travel=min(length(p),100.);
    vec3 ray=normalize(mat3(uCamWorld)*p);
    float g=uAnisotropy,mu=dot(ray,uLightDir);
    float phase=(1.-g*g)/pow(max(1.+g*g-2.*g*mu,.01),1.5);
    float stepSize=travel/float(uSteps),transmittance=1.;vec3 scatter=vec3(0.);
    float jitter=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
    for(int i=0;i<32;i++){
      if(i>=uSteps)break;
      vec3 wp=uCamPos+ray*(float(i)+jitter)*stepSize;
      float density=uDensity*exp(-max(wp.y,0.)/uHeight), extinction=1.-exp(-density*stepSize);
      vec4 s=uShadowMatrix*vec4(wp,1.);vec3 uv=s.xyz/s.w;
      float visibility=0.;
      if(all(greaterThan(uv,vec3(0.)))&&all(lessThan(uv,vec3(1.)))){
        visibility=texture(tShadow,vec3(uv.xy,uv.z-.0005));
        vec2 edge=min(uv.xy,1.-uv.xy);visibility*=smoothstep(0.,.06,min(edge.x,edge.y));
      }
      scatter+=transmittance*extinction*visibility*uLightColor*phase*.16;
      transmittance*=1.-extinction;
    }
    gl_FragColor=vec4(scatter,depth);
  }
`;

export function createLightingEffects(renderer, depthTexture) {
  const target=()=>new THREE.WebGLRenderTarget(2,2,{type:THREE.HalfFloatType,depthBuffer:false});
  const raw=target(),ping=target(),ao=target(),volume=target(),reflection=target();
  const material=(shader,uniforms)=>new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:shader,uniforms,depthTest:false,depthWrite:false,toneMapped:false});
  const depthUniforms=()=>({tDepth:{value:depthTexture},uProjInv:{value:new THREE.Matrix4()}});
  const aoQuad=new FullScreenQuad(material(AO,{...depthUniforms(),uProj:{value:new THREE.Matrix4()},uTexel:{value:new THREE.Vector2()},uRadius:{value:.55},uSamples:{value:20}}));
  const filterQuad=new FullScreenQuad(material(FILTER,{tInput:{value:null},uStep:{value:new THREE.Vector2()}}));
  const volumeQuad=new FullScreenQuad(material(VOLUME,{...depthUniforms(),tShadow:{value:null},uCamWorld:{value:new THREE.Matrix4()},uShadowMatrix:{value:new THREE.Matrix4()},uCamPos:{value:new THREE.Vector3()},uLightDir:{value:new THREE.Vector3()},uLightColor:{value:new THREE.Color()},uDensity:{value:.012},uHeight:{value:12},uAnisotropy:{value:.35},uSteps:{value:24}}));
  let width=2,height=2;
  return {
    aoTexture:ao.texture,volumeTexture:volume.texture,reflectionTexture:reflection.texture,
    setSize(w,h){width=w;height=h;for(const rt of [raw,ping,ao,volume,reflection])rt.setSize(w,h);aoQuad.material.uniforms.uTexel.value.set(1/(w*2),1/(h*2));},
    filterReflection(texture){
      const f=filterQuad.material.uniforms;f.tInput.value=texture;f.uStep.value.set(1/width,0);renderer.setRenderTarget(ping);filterQuad.render(renderer);
      f.tInput.value=ping.texture;f.uStep.value.set(0,1/height);renderer.setRenderTarget(reflection);filterQuad.render(renderer);
    },
    render(camera,sun,settings,quality){
      if(settings.ao>0&&settings.denoiseAO>0){
        const u=aoQuad.material.uniforms;u.uProjInv.value.copy(camera.projectionMatrixInverse);u.uProj.value.copy(camera.projectionMatrix);u.uRadius.value=settings.aoRadius;u.uSamples.value=quality.aoSamples;
        renderer.setRenderTarget(raw);aoQuad.render(renderer);
        const f=filterQuad.material.uniforms;f.tInput.value=raw.texture;f.uStep.value.set(1/width,0);renderer.setRenderTarget(ping);filterQuad.render(renderer);
        f.tInput.value=ping.texture;f.uStep.value.set(0,1/height);renderer.setRenderTarget(ao);filterQuad.render(renderer);
      }
      const shadow=sun?.shadow;
      const hasVolume=settings.volume>0&&sun?.castShadow&&shadow?.map?.depthTexture;
      if(hasVolume){
        const u=volumeQuad.material.uniforms;
        u.uProjInv.value.copy(camera.projectionMatrixInverse);u.uCamWorld.value.copy(camera.matrixWorld);u.uCamPos.value.copy(camera.position);
        u.tShadow.value=shadow.map.depthTexture;u.uShadowMatrix.value.copy(shadow.matrix);
        u.uLightDir.value.subVectors(sun.position,sun.target.position).normalize();u.uLightColor.value.copy(sun.color).multiplyScalar(sun.intensity);
        u.uDensity.value=settings.volumeDensity;u.uHeight.value=settings.volumeHeight;u.uAnisotropy.value=settings.volumeAnisotropy;u.uSteps.value=quality.volumeSteps;
        renderer.setRenderTarget(volume);volumeQuad.render(renderer);
      }
      return Boolean(hasVolume);
    },
    dispose(){for(const q of [aoQuad,filterQuad,volumeQuad]){q.material.dispose();q.dispose();}for(const rt of [raw,ping,ao,volume,reflection])rt.dispose();},
  };
}
