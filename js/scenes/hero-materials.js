/* Surface details for articulated hero figures. */
import * as THREE from 'three';
import { makeCanvas, canvasTexture } from '../helpers.js';

/* ---------- tiling surface details (grey = multiply) ---------- */
function tile(draw){ const c=makeCanvas(256,256), x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,256,256); draw(x); const t=canvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.colorSpace=THREE.NoColorSpace; return t; }
export const DETAIL={
  web:()=>tile(x=>{ x.strokeStyle='#2a0a10'; x.lineWidth=5;
    for(let i=0;i<=256;i+=32){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,256); x.stroke(); }
    for(let j=0;j<=256;j+=32){ x.beginPath(); for(let i=0;i<=256;i+=32){ const y=j+10; i?x.quadraticCurveTo(i-16,y+8,i,y):x.moveTo(0,y); } x.stroke(); } }),
  scales:()=>tile(x=>{ x.strokeStyle='#223'; x.lineWidth=3; for(let y=0;y<=272;y+=16) for(let i=-16;i<272;i+=32){ x.beginPath(); x.arc(i+(Math.round(y/16)%2)*16,y,16,0,Math.PI); x.stroke(); } }),
  panels:()=>tile(x=>{ x.strokeStyle='#3a0808'; x.lineWidth=4; x.strokeRect(8,8,112,112); x.strokeRect(136,8,112,112); x.strokeRect(8,136,240,112); x.fillStyle='#000'; x.globalAlpha=.08; x.fillRect(0,0,128,128); x.globalAlpha=1; }),
  mail:()=>tile(x=>{ for(let y=0;y<256;y+=12) for(let i=0;i<256;i+=12){ x.fillStyle=((y/12)%2)?'#cfd3da':'#9aa0a8'; x.beginPath(); x.arc(i+((y/12)%2)*6,y,5,0,7); x.fill(); } x.globalAlpha=.5; x.fillStyle='#fff'; x.fillRect(0,0,256,256); x.globalAlpha=1; }),
  leather:()=>tile(x=>{ for(let i=0;i<900;i++){ x.fillStyle=`rgba(0,0,0,${Math.random()*.12})`; x.fillRect(Math.random()*256,Math.random()*256,3,3); } }),
};

/* ---------- material: vertex colours + decal + tri-planar detail ---------- */
export function figMat(p={}){
  const m=new THREE.MeshStandardMaterial({ vertexColors:true, metalness:p.metalness??0, roughness:p.roughness??.7,
    envMap:p.envMap||null, envMapIntensity:p.envMapIntensity??(p.metalness>.4?1:.4), side:THREE.FrontSide });
  const detail=p.detail||null, decal=p.decal||null;
  const U={ uDetail:{value:detail}, uDetailScale:{value:p.detailScale||3}, uDetailMode:{value:p.detailMode??0}, uDetailMix:{value:detail?(p.detailMix??1):0},
    uDecal:{value:decal}, uDecalOn:{value:decal?1:0}, uDecalRect:{value:new THREE.Vector4(...(p.decalRect||[-.5,.85,1,.9]))} };
  m.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,U);
    sh.vertexShader=sh.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 vObj; varying vec3 vObjN;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvObj=position; vObjN=normal;');
    sh.fragmentShader=sh.fragmentShader
      .replace('#include <common>',`#include <common>
varying vec3 vObj; varying vec3 vObjN;
uniform sampler2D uDetail; uniform float uDetailScale; uniform float uDetailMode; uniform float uDetailMix;
uniform sampler2D uDecal; uniform float uDecalOn; uniform vec4 uDecalRect;`)
      .replace('#include <color_fragment>',`#include <color_fragment>
{
  vec3 n=normalize(vObjN);
  if(uDecalOn>.5 && n.z>0.05){
    vec2 duv=vec2((vObj.x-uDecalRect.x)/uDecalRect.z,(vObj.y-uDecalRect.y)/uDecalRect.w);
    if(duv.x>0.0&&duv.x<1.0&&duv.y>0.0&&duv.y<1.0){
      vec4 d=texture2D(uDecal,duv);
      diffuseColor.rgb=mix(diffuseColor.rgb,d.rgb,d.a*smoothstep(0.05,0.35,n.z));
    }
  }
  if(uDetailMix>0.0){
    vec3 w=abs(n); w=w*w; w/=(w.x+w.y+w.z);
    float dx=texture2D(uDetail,vObj.yz*uDetailScale).r, dy=texture2D(uDetail,vObj.xz*uDetailScale).r, dz=texture2D(uDetail,vObj.xy*uDetailScale).r;
    float d=dx*w.x+dy*w.y+dz*w.z;
    float mask=1.0;
    if(uDetailMode>0.5&&uDetailMode<1.5) mask=smoothstep(0.0,0.15,vColor.r-vColor.b);       /* red parts only */
    else if(uDetailMode>1.5&&uDetailMode<2.5) mask=smoothstep(0.0,0.15,vColor.b-vColor.r);  /* blue parts only */
    else if(uDetailMode>2.5) mask=smoothstep(0.0,0.1,0.35-max(vColor.r,max(vColor.g,vColor.b)));   /* dark parts only */
    diffuseColor.rgb*=mix(1.0,d,mask*uDetailMix);
  }
}`);
    m.userData.shader=sh;
  };
  m.customProgramCacheKey=()=>'fig'+(detail?1:0)+(decal?1:0)+(p.detailMode??0);
  return m;
}
