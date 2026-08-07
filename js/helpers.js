import * as THREE from 'three';

/* Max's World — small shared helpers */
export const rand = (a,b) => a + Math.random()*(b-a);
export const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
export const lerpAngle = (a,b,t) => { let d=(b-a)%(Math.PI*2); if(d>Math.PI)d-=Math.PI*2; if(d<-Math.PI)d+=Math.PI*2; return a+d*t; };

export function makeCanvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
export function canvasTexture(c){ const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t; }

/* rounded-rect helper */
export function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

/* crayon-style stroke */
export function crayon(ctx, pts, color, width=7, passes=2){
  ctx.lineCap='round'; ctx.lineJoin='round';
  for(let p=0;p<passes;p++){
    ctx.strokeStyle=color; ctx.globalAlpha = p===0 ? .85 : .35;
    ctx.lineWidth = width * (p===0?1:.7);
    ctx.beginPath();
    pts.forEach((pt,i)=>{
      const jx = pt[0]+rand(-1.5,1.5)*(p+1), jy = pt[1]+rand(-1.5,1.5)*(p+1);
      i===0 ? ctx.moveTo(jx,jy) : ctx.lineTo(jx,jy);
    });
    ctx.stroke();
  }
  ctx.globalAlpha=1;
}
export function crayonCircle(ctx,cx,cy,r,color,width=7,fill=null){
  if(fill){ ctx.fillStyle=fill; ctx.globalAlpha=.5; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill(); ctx.globalAlpha=1; }
  const pts=[]; for(let a=0;a<=Math.PI*2+.2;a+=.35) pts.push([cx+Math.cos(a)*r, cy+Math.sin(a)*r]);
  crayon(ctx,pts,color,width);
}

