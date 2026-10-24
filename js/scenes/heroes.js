/* ============================================================
   Hero Base — Max's favourite heroes as action-figure look-alikes
   (own models and paintings: no official artwork, no logos).

     Bee Car       yellow racer  ⇄ robot      (tap: transform)
     Truck Captain red/blue truck ⇄ robot     (tap: transform)
     Iron Flyer    red & gold armour          (tap: fly / blast)
     Shield Hero   blue suit, star shield     (tap: throw shield)
     Web Kid       red & blue web suit        (tap: web swing)
     Thor          thunder god, red cape      (tap: lightning / hammer throw)
     Monkey King   Sun Wukong (public domain) (tap: cloud / staff / 72 changes)

   Heroes are taller than Max, with heroic proportions, a signature
   stance, metal / car-paint / cloth materials with relief maps, lit
   by their own small environment map and stage spotlights; they
   turn their heads to follow Max. Each hero's holder carries
   userData.onTap; game.js calls it when Max is close.
   scene.update(dt,t) runs every frame.
   ============================================================ */
import * as THREE from 'three';
import { clamp, makeCanvas, canvasTexture, rand } from '../helpers.js';
import { DETAIL, figMat } from './hero-materials.js';

const TAU=Math.PI*2, H=Math.PI/2;
const ease=k=>k*k*(3-2*k);
const lerp=(a,b,k)=>a+(b-a)*k;
const basic=c=>new THREE.MeshBasicMaterial({color:c});

/* what each hero says when tapped: [English, Cantonese, who] — each hero has
   their own neural voice (tools/make_voice.py records them; see scene.lines) */
const L={
  beeBot:  ['Transform! Bee Car, robot mode!','變身！黃蜂車，機械人模式！','bee'],
  beeCar:  ['Back to car mode — vroom!','變返跑車——轟轟！','bee'],
  truckBot:['Team, let\'s roll! Truck Captain is here!','隊員們，出發！卡車隊長嚟啦！','truck'],
  truckCar:['Truck mode — honk honk!','變返大卡車——叭叭！','truck'],
  elitaBot:['Elita-1, ready to lead!','艾麗塔一號，準備出發！','elita'],
  elitaCar:["Elita-1, motorcycle mode — let's go!",'艾麗塔一號，變返電單車，出發！','elita'],
  megatronBot:['Megatron, robot mode!','威震天，機械人模式！','megatron'],
  megatronCar:['Megatron, tank mode!','威震天，坦克模式！','megatron'],
  ironFly: ['Iron Flyer — blast off!','鐵甲飛俠——起飛！','iron'],
  ironZap: ['Power hands — zap!','能量手掌——發射！','iron'],
  shield:  ['Shield, go! Bounce, bounce — and back!','盾牌，飛！彈呀彈——飛返嚟！','shield'],
  web:     ['Web, go! Swing time!','蛛網發射！盪呀盪！','web'],
  thorBolt:['By the power of thunder — lightning, come!','雷神之力——閃電，嚟！','thor'],
  thorThrow:['Hammer, fly! And come back to me!','雷神之鎚，飛！再飛返嚟！','thor'],
  cloud:   ['Somersault cloud, come! Off we fly!','筋斗雲，嚟！飛呀！','monkey'],
  staff:   ['Magic staff — grow, grow, GROW!','金箍棒——變大，變大，變大！','monkey'],
  change:  ['Seventy-two changes — poof! Can you guess?','七十二變——變！估吓我變咗乜嘢？','monkey'],
};
const VOICE={
  bee:    { en:{voice:'en-US-ChristopherNeural',pitch:'+12Hz',rate:'+6%'}, zh:{voice:'zh-HK-WanLungNeural',pitch:'+10Hz',rate:'+6%'} },
  truck:  { en:{voice:'en-GB-RyanNeural',pitch:'-22Hz',rate:'-12%'},       zh:{voice:'zh-HK-WanLungNeural',pitch:'-18Hz',rate:'-12%'} },
  elita:  { en:{voice:'en-US-JennyNeural',pitch:'+0Hz',rate:'+0%'}, zh:{voice:'zh-HK-HiuGaaiNeural',pitch:'+0Hz',rate:'+0%'} },
  megatron:{en:{voice:'en-US-GuyNeural',pitch:'-25Hz',rate:'-10%'},zh:{voice:'zh-HK-WanLungNeural',pitch:'-22Hz',rate:'-10%'}},
  iron:   { en:{voice:'en-US-GuyNeural',pitch:'+0Hz',rate:'+4%'},          zh:{voice:'zh-HK-WanLungNeural',pitch:'+0Hz',rate:'+4%'} },
  shield: { en:{voice:'en-US-BrianNeural',pitch:'-6Hz',rate:'-4%'},        zh:{voice:'zh-HK-WanLungNeural',pitch:'-8Hz',rate:'-4%'} },
  web:    { en:{voice:'en-US-AndrewNeural',pitch:'+18Hz',rate:'+10%'},     zh:{voice:'zh-HK-WanLungNeural',pitch:'+22Hz',rate:'+10%'} },
  thor:   { en:{voice:'en-GB-ThomasNeural',pitch:'-12Hz',rate:'-8%'},      zh:{voice:'zh-HK-WanLungNeural',pitch:'-12Hz',rate:'-8%'} },
  monkey: { en:{voice:'en-GB-RyanNeural',pitch:'+26Hz',rate:'+12%'},       zh:{voice:'zh-HK-WanLungNeural',pitch:'+28Hz',rate:'+12%'} },
};

let C=null;            /* ctx from game.js: { THREE, mat, renderer, maxPos, sfx, say, burst } */
let zoneG=null;        /* the zone's root group */
let ENV=null;          /* small studio environment map for shiny materials */
const DT={};           /* tiling surface details, built once in build() */
const heroes=[];

/* ---------- materials ---------- */
function makeEnv(renderer){
  const pm=new THREE.PMREMGenerator(renderer), s=new THREE.Scene();
  const c=makeCanvas(4,256), x=c.getContext('2d'), gr=x.createLinearGradient(0,0,0,256);
  gr.addColorStop(0,'#bfe3ff'); gr.addColorStop(.45,'#ffffff'); gr.addColorStop(.55,'#d8e6d0'); gr.addColorStop(1,'#5b6b4a');
  x.fillStyle=gr; x.fillRect(0,0,4,256);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  s.add(new THREE.Mesh(new THREE.SphereGeometry(10,32,16),new THREE.MeshBasicMaterial({map:t,side:THREE.BackSide})));
  [[0,9,0,8],[7,4,5,3],[-7,3,-4,3],[0,2,-9,4]].forEach(([px,py,pz,sz])=>{   /* soft-box highlights, one behind for rim light */
    const p=new THREE.Mesh(new THREE.PlaneGeometry(sz,sz),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));
    p.position.set(px,py,pz); p.lookAt(0,0,0); s.add(p); });
  const tex=pm.fromScene(s,.03).texture; pm.dispose(); return tex;
}
const std=(o)=>{ const {bump,...params}=o; const m=new THREE.MeshStandardMaterial({envMap:ENV,envMapIntensity:1,...params});
  if(o.map && o.bump!==false && !o.bumpMap){ m.bumpMap=o.map; m.bumpScale=o.bump??.012; }   /* painted detail gets relief */
  return m; };
const metal=(color,o={})=>std({color,metalness:.75,roughness:.28,...o});
const paint=(color,o={})=>std({color,metalness:.35,roughness:.3,...o});
const cloth=(color,o={})=>std({color,metalness:0,roughness:.78,envMapIntensity:.35,...o});
const glow=(color)=>new THREE.MeshBasicMaterial({color});

/* ---------- tiny mesh helpers ---------- */
function mesh(parent,geo,m,x=0,y=0,z=0,shadow=true){
  const o=new THREE.Mesh(geo,m); o.position.set(x,y,z); o.castShadow=shadow; parent.add(o); return o;
}
const box=(p,w,h,d,m,x,y,z)=>mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
const ball=(p,r,m,x,y,z,seg=16)=>mesh(p,new THREE.SphereGeometry(r,seg,Math.round(seg*.75)),m,x,y,z);
const cyl=(p,r1,r2,h,m,x,y,z,seg=14)=>mesh(p,new THREE.CylinderGeometry(r1,r2,h,seg),m,x,y,z);
const caps=(p,r,len,m,x,y,z)=>mesh(p,new THREE.CapsuleGeometry(r,len,6,16),m,x,y,z);
/* a limb segment that tapers (r1 at the top, r2 at the bottom) with rounded ends */
function limb(p,r1,r2,len,m,x,y,z){
  const g=new THREE.Group(); g.position.set(x,y,z); p.add(g);
  cyl(g,r1,r2,len,m,0,0,0,18); ball(g,r1,m,0,len/2,0,16); ball(g,r2,m,0,-len/2,0,16);
  return g;
}
function shapeMesh(parent,shape,m,x,y,z,depth){
  const geo=depth?new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:12}):new THREE.ShapeGeometry(shape,12);
  return mesh(parent,geo,m,x,y,z,false);
}

function outline(points){const sh=new THREE.Shape();points.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));sh.closePath();return sh;}
function curvedPanel(parent,shape,material,zAt,offset=0){
  const flat=new THREE.ShapeGeometry(shape,16),src=flat.index?flat.toNonIndexed():flat;
  const a=src.getAttribute('position'),out=[];
  const emit=(A,B,C,u,v)=>{const x=A[0]+u*(B[0]-A[0])+v*(C[0]-A[0]),y=A[1]+u*(B[1]-A[1])+v*(C[1]-A[1]);out.push(x,y,zAt(x,y)+offset);};
  const n=5;
  for(let t=0;t<a.count;t+=3){const A=[a.getX(t),a.getY(t)],B=[a.getX(t+1),a.getY(t+1)],C=[a.getX(t+2),a.getY(t+2)];
    for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){
      emit(A,B,C,i/n,j/n);emit(A,B,C,(i+1)/n,j/n);emit(A,B,C,i/n,(j+1)/n);
      if(i+j<n-1){emit(A,B,C,(i+1)/n,j/n);emit(A,B,C,(i+1)/n,(j+1)/n);emit(A,B,C,i/n,(j+1)/n);}
    }
  }
  const normals=[];
  for(let i=0;i<out.length;i+=3){const x=out[i],y=out[i+1],e=.0001,dx=(zAt(x+e,y)-zAt(x-e,y))/(2*e),dy=(zAt(x,y+e)-zAt(x,y-e))/(2*e),len=Math.hypot(dx,dy,1);normals.push(-dx/len,-dy/len,1/len);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(out,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));flat.dispose();if(src!==flat)src.dispose();
  return mesh(parent,geo,material);
}
function roundedBox(parent,w,h,d,bevel,material,x=0,y=0,z=0){
  const sh=outline([[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]]);
  const geo=new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:8});geo.translate(0,0,-d/2);
  return mesh(parent,geo,material,x,y,z);
}
function clothCape(parent,material,top,length,halfTop,halfBottom){
  const pos=[],uv=[],ind=[],nx=28,ny=18;
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const u=i/nx,v=j/ny,w=lerp(halfTop,halfBottom,v);pos.push((u*2-1)*w,-v*length,-.055-Math.sin(u*Math.PI)*.09+Math.sin(u*Math.PI*10)*.013*v);uv.push(u,1-v);}
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;ind.push(a,b,a+1,b,b+1,a+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(ind);geo.computeVertexNormals();return mesh(parent,geo,material,0,top,-.09);
}

function starShape(R,r){
  const s=new THREE.Shape();
  for(let i=0;i<10;i++){ const a=Math.PI/2+i*Math.PI/5, q=i%2?r:R; i?s.lineTo(Math.cos(a)*q,Math.sin(a)*q):s.moveTo(Math.cos(a)*q,Math.sin(a)*q); }
  return s;
}
function starPath(x,cx,cy,R,r,rot=-Math.PI/2){ x.beginPath(); for(let i=0;i<10;i++){ const a=rot+i*Math.PI/5, q=i%2?r:R; x.lineTo(cx+Math.cos(a)*q,cy+Math.sin(a)*q); } x.closePath(); }
function texOf(w,h,draw,rep){
  const c=makeCanvas(w,h); draw(c.getContext('2d'),w,h); const t=canvasTexture(c);
  if(rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rep[0],rep[1]); }
  return t;
}
/* soft shading baked into a texture: darker toward the bottom, a highlight band near the top */
function shade(x,w,h,k=.18){
  const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,`rgba(255,255,255,${k*.6})`); g.addColorStop(.35,'rgba(255,255,255,0)'); g.addColorStop(1,`rgba(0,0,0,${k})`);
  x.fillStyle=g; x.fillRect(0,0,w,h);
}

/* ---------- sound effects (built on game.js' synth helpers) ---------- */
const fx={
  whir(){ for(let i=0;i<8;i++) C.sfx.noiseHit(i*.12,.05,1500+i*220,6,.11); C.sfx.blip(180,900,0,1,'square',.035); C.sfx.note(523,1.15,.2); C.sfx.note(784,1.25,.3); },
  vroom(){ C.sfx.blip(90,240,0,.5,'sawtooth',.06); C.sfx.blip(240,120,.5,1.2,'sawtooth',.05); },
  honk(){ C.sfx.note(233,0,.35,'square',.05); C.sfx.note(294,0,.35,'square',.04); C.sfx.note(233,.45,.55,'square',.05); C.sfx.note(294,.45,.55,'square',.04); },
  whoosh(v=.14){ C.sfx.noiseHit(0,.7,700,.7,v); C.sfx.noiseHit(.15,.6,1200,.8,v*.6); },
  zap(){ C.sfx.blip(1800,300,0,.35,'sawtooth',.06); C.sfx.noiseHit(0,.25,2600,1.5,.1); },
  ping(){ C.sfx.note(1568,0,.25,'triangle',.1); C.sfx.note(2093,.05,.3,'triangle',.07); },
  thwip(){ C.sfx.blip(2400,400,0,.14,'sawtooth',.05); C.sfx.noiseHit(0,.1,3200,2,.09); },
  poof(){ C.sfx.noiseHit(0,.35,800,.6,.2); C.sfx.note(1046,.05,.2,'sine',.06); },
  grow(){ C.sfx.blip(160,1100,0,.9,'triangle',.08); },
  chime(){ [784,988,1175,1568].forEach((f,i)=>C.sfx.note(f,i*.08,.3,'sine',.07)); },
  thunder(){ C.sfx.noiseHit(0,.25,2400,1,.22); C.sfx.noiseHit(.05,1.8,120,.5,.3); C.sfx.noiseHit(.3,1.4,70,.4,.25); C.sfx.blip(90,40,.05,1.2,'sawtooth',.06); },
  crackle(){ for(let i=0;i<6;i++) C.sfx.noiseHit(i*.07,.05,3000+i*300,4,.07); },
};

/* Articulated figure: smooth lathed body profiles and crisp suit colours.
   The existing armature names are preserved for every special move. */
/* Lathed silhouette profiles keep suit edges crisp and joints continuous.
   Geometry is intentionally modest so all seven figures work on phones. */
function figure(spec,o={}){
  const K=spec.cols,M=spec.mats,W=o.bulk||1,g=new THREE.Group();
  const colored=(geo,colorAt)=>{
    const pos=geo.getAttribute('position'),cols=new Float32Array(pos.count*3),col=new THREE.Color();
    for(let i=0;i<pos.count;i++){col.set(colorAt(pos.getY(i),pos.getX(i),pos.getZ(i)));col.toArray(cols,i*3);}
    geo.setAttribute('color',new THREE.BufferAttribute(cols,3));return geo;
  };
  const profile=(parent,points,depth,mat,colorAt)=>{
    let profilePoints=(points[0][1]>points.at(-1)[1]?[...points].reverse():points).map(([r,y])=>new THREE.Vector2(r,y));
    if(o.refined)profilePoints=new THREE.SplineCurve(profilePoints).getPoints(48).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y));
    const geo=new THREE.LatheGeometry(profilePoints,o.refined?36:28);
    geo.scale(1,1,depth);colored(geo,colorAt);return mesh(parent,geo,mat);
  };
  const torso=new THREE.Group();torso.position.y=1.48;g.add(torso);
  const torsoMesh=profile(torso,[[0,.89],[.125,.91],[.17,.98],[.15,1.06],[.14,1.16],[.19,1.29],[.24,1.39],[.23,1.48],[.19,1.55],[.08,1.61],[.065,1.69],[0,1.7]],.64,M.torso,
    y=>y>1.61?K.neck:y>1.25?K.chest:y>1.04?K.belly:y>.99?K.belt:K.pelvis);
  torsoMesh.position.y=-1.48;torsoMesh.scale.x=W;
  const head=new THREE.Group();head.position.y=1.83;g.add(head);
  const skull=profile(head,[[0,-.17],[.07,-.15],[.11,-.1],[.137,-.025],[.14,.05],[.118,.12],[.07,.16],[0,.175]],.89,M.head,
    (y,x,z)=>o.face==='open'?(z>.05&&y<(o.cowl?.012:.09)?(y<-.095?K.jaw:K.face):K.skull):K.skull);
  const eyes=[];
  if(o.face==='open'){
    [-1,1].forEach(sd=>{
      const e=new THREE.Group();e.position.set(sd*.054,.018,.119);head.add(e);eyes.push(e);
      const white=ball(e,.024,std({color:0xfffaf3,roughness:.4}),0,0,.007,16);white.scale.set(1.15,o.heroFace?.48:.7,.5);
      ball(e,o.heroFace?.0095:.012,std({color:K.iris||0x4477a2,roughness:.4}),0,0,.021,12).scale.z=.35;
      ball(e,o.heroFace?.0048:.006,glow(0x162335),0,0,.025,10).scale.z=.3;
      ball(e,.0028,glow(0xffffff),-.003,.004,.029,6);
      const br=box(head,.055,.009,.012,cloth(K.hair||0x5b3927),sd*.054,.05,.128);br.rotation.z=sd*(o.heroFace?.08:-.12);
      if(!o.heroFace)ball(head,.024,cloth(K.face),sd*.087,-.025,.097,16).scale.set(1,.8,.6);
    });
    if(o.heroFace){
      curvedPanel(head,outline([[-.009,.022],[.009,.022],[.019,-.037],[.011,-.046],[-.011,-.046],[-.019,-.037]]),cloth(K.face),(x,y)=>.128+.028*Math.exp(-x*x/.00012)*Math.exp(-(y+.025)*(y+.025)/.0012));
    }else ball(head,.017,cloth(K.face),0,-.015,.143,16).scale.set(.65,1.3,1);
    if(o.heroFace){
      const lip=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.025,-.075,.122),new THREE.Vector3(0,-.08,.13),new THREE.Vector3(.025,-.075,.122));
      mesh(head,new THREE.TubeGeometry(lip,12,.0022,5),cloth(0x805448));
    }else{const mouth=mesh(head,new THREE.TorusGeometry(.021,.0035,6,18,Math.PI),cloth(0x854e40),0,-.073,.12);mouth.rotation.z=Math.PI;}
  }
  const arms=[],elbows=[],hands=[],legs=[],knees=[],feet=[];
  [-1,1].forEach(sd=>{
    const sh=new THREE.Group();
    // Spider-Man's shoulders move with his leaning chest, not independently.
    sh.position.set(sd*.235*W,o.continuousArms?-.01:1.47,0);
    (o.continuousArms?torso:g).add(sh);
    profile(sh,[[0,.08],[.075,.06],[.09,0],[.075,-.13],[.061,-.26],[.05,-.31],[0,-.33]],.9,M.arm,y=>y>-.08?K.deltoid:K.upper);
    const el=new THREE.Group();el.position.y=-.32;sh.add(el);
    profile(el,[[0,.035],[.051,.02],[.071,-.08],[.06,-.18],[.046,-.26],[0,-.3]],.85,M.arm,y=>y<-.22?K.cuff:K.fore);
    const fist=new THREE.Group();fist.position.set(0,-.32,0);el.add(fist);
    if(o.continuousArms){
      // Overlapping round joints cover the taper ends through the full bend.
      const joint=(parent,r,color,y=0)=>{
        const geo=colored(new THREE.SphereGeometry(r,20,14),()=>color);
        const part=mesh(parent,geo,M.arm,0,y,0);part.scale.z=.9;return part;
      };
      joint(sh,.078,K.deltoid);
      joint(el,.056,K.fore);
      joint(fist,.045,K.cuff,.017);
      joint(fist,.057,K.hand,-.018).scale.set(.85,1,.75);
    }else box(fist,.092,.105,.085,cloth(K.hand),0,-.018,.008);
    for(let i=0;i<4;i++)ball(fist,.013,cloth(K.hand),-.033+i*.022,-.048,.039,8).scale.y=1.2;
    ball(fist,.022,cloth(K.hand),-sd*.048,-.015,.037,10).scale.y=1.3;
    arms.push(sh);elbows.push(el);hands.push(fist);
    const hip=new THREE.Group();hip.position.set(sd*.113*W,.94,0);g.add(hip);
    profile(hip,[[0,.06],[.084,.04],[.098,-.06],[.085,-.23],[.061,-.4],[0,-.43]],.9,M.leg,()=>K.thigh);
    const kn=new THREE.Group();kn.position.y=-.43;hip.add(kn);
    const bh=o.bootH||.2,top=-.43+bh;
    profile(kn,[[0,.035],[.06,.02],[.078,-.09],[.069,-.2],[.047,-.36],[0,-.4]],.85,M.leg,y=>y<top?K.boot:K.shin);
    const ft=new THREE.Group();ft.position.y=-.4;kn.add(ft);
    const boot=ball(ft,.075,cloth(K.boot),0,-.025,.055,18);boot.scale.set(.85,.65,1.75);
    legs.push(hip);knees.push(kn);feet.push(ft);
  });
  return {g,torso,pelvis:torso,head,skull,eyes,arms,elbows,hands,legs,knees,feet,look:0,lookX:0};
}
/* a signature standing pose: feet apart, one leg forward, a little twist */
function stance(c,o={}){
  const fw=o.forward??.1, sp=o.spread??.1;
  c.legs[0].rotation.x=fw; c.legs[1].rotation.x=-fw*.6; c.legs[0].rotation.z=-sp; c.legs[1].rotation.z=sp;
  c.feet[0].rotation.y=.12; c.feet[1].rotation.y=-.12;
  c.torso.rotation.y=o.twist||0;
  c.arms[0].rotation.z=-.14-(o.armsOut||0); c.arms[1].rotation.z=.14+(o.armsOut||0);
  c.arms[0].rotation.x=o.armL??.05; c.arms[1].rotation.x=o.armR??.05;
  c.elbows[0].rotation.x=o.elbowL??-.25; c.elbows[1].rotation.x=o.elbowR??-.25;
}
/* keep a hero alive while standing: breathing, weight shift, and the head follows Max */
const _lp=new THREE.Vector3();
function alive(c,holder,root,t,ph=0){
  c.torso.scale.y=1+Math.sin(t*1.8+ph)*.012;
  root.rotation.z=Math.sin(t*.9+ph)*.012;
  const p=holder.worldToLocal(_lp.copy(C.maxPos())).sub(root.position);
  const d=Math.hypot(p.x,p.z);
  let yaw=0, pitch=0;
  if(d<8){ yaw=Math.atan2(p.x,p.z)-root.rotation.y; while(yaw>Math.PI) yaw-=TAU; while(yaw<-Math.PI) yaw+=TAU;
    yaw=clamp(yaw,-1.05,1.05); pitch=clamp(Math.atan2(1.95-(p.y+1.0),d)*.8,-.25,.45); }
  else yaw=Math.sin(t*.5+ph)*.15;
  c.look=lerp(c.look,yaw,.08); c.lookX=lerp(c.lookX,pitch,.08);
  c.head.rotation.y=c.look; c.head.rotation.x=c.lookX;
  c.torso.rotation.y=c.look*.18;
  c.eyes.forEach(e=>{ e.rotation.y=c.look*.3; e.rotation.x=c.lookX*.4; });
}
const _hw=new THREE.Vector3();
const handLocal=(c,i,holder)=>holder.worldToLocal(c.hands[i].getWorldPosition(_hw).clone());
/* a front-projected decal canvas: x −0.5..0.5 → u, y 0.85..1.75 → v (top of canvas = top of torso) */
function decal(draw){ const c=makeCanvas(512,512), x=c.getContext('2d'); x.translate(256,512*(1+.85/.9)); x.scale(512,-512/.9); draw(x); return canvasTexture(c); }
const DECAL_RECT=[-.5,.85,1,.9];

/* ===================================================================
   TRANSFORMERS — every part has a car pose and a robot pose; the morph
   interpolates them with a little stagger so it unfolds piece by piece
   =================================================================== */
function part(parent,car,bot,build){
  const p=new THREE.Group(); build(p); parent.add(p);
  const norm=q=>({ p:q.p||[0,0,0], r:q.r||[0,0,0], s:Array.isArray(q.s)?q.s:[q.s??1,q.s??1,q.s??1] });
  p.userData.car=norm(car); p.userData.bot={...norm(bot), d:bot.d||0};
  return p;
}
function pose(p,k){
  const a=p.userData.car, b=p.userData.bot, e=ease(clamp((k-b.d)/.55,0,1));
  p.position.set(lerp(a.p[0],b.p[0],e),lerp(a.p[1],b.p[1],e),lerp(a.p[2],b.p[2],e));
  p.rotation.set(lerp(a.r[0],b.r[0],e),lerp(a.r[1],b.r[1],e),lerp(a.r[2],b.r[2],e));
  p.scale.set(Math.max(.001,lerp(a.s[0],b.s[0],e)),Math.max(.001,lerp(a.s[1],b.s[1],e)),Math.max(.001,lerp(a.s[2],b.s[2],e)));
}
let TIRE, CHROME, GLASS, DARK;
function wheel(p,r,w){
  const spin=new THREE.Group(); p.add(spin);
  cyl(spin,r,r,w,TIRE,0,0,0,24);
  const tread=new THREE.Mesh(new THREE.TorusGeometry(r*.97,w*.18,6,24),TIRE); tread.rotation.x=H; spin.add(tread);
  cyl(spin,r*.62,r*.62,w+.01,CHROME,0,0,0,20);
  for(let i=0;i<5;i++){ const s=box(spin,r*.14,w+.02,r*1.1,DARK,0,0,0); s.rotation.y=i*TAU/5; }
  cyl(spin,r*.18,r*.18,w+.03,CHROME,0,0,0,12);
  p.userData.spin=spin;
}

/* a car-body piece: a side profile [z,y] extruded across the car's width */
function side(parent,pts,width,m,x=0,y=0,z=0,hole){
  const sh=new THREE.Shape(); pts.forEach(([a,b],i)=>i?sh.lineTo(a,b):sh.moveTo(a,b));
  if(hole) hole(sh);
  const g=new THREE.ExtrudeGeometry(sh,{depth:width,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:2,curveSegments:16});
  g.rotateY(-H); g.translate(width/2,0,0);
  return mesh(parent,g,m,x,y,z);
}
/* a fender: a panel with a round wheel arch cut out of its lower edge */
function fender(parent,m,len,h,r){
  const sh=new THREE.Shape();
  sh.moveTo(-len/2,-h/2); sh.lineTo(-r,-h/2); sh.absarc(0,-h/2,r,Math.PI,0,true); sh.lineTo(len/2,-h/2);
  sh.lineTo(len/2,h/2-.02); sh.quadraticCurveTo(len/2,h/2,len/2-.04,h/2); sh.lineTo(-len/2+.04,h/2); sh.quadraticCurveTo(-len/2,h/2,-len/2,h/2-.02); sh.lineTo(-len/2,-h/2);
  const g=new THREE.ExtrudeGeometry(sh,{depth:.16,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2,curveSegments:18});
  g.rotateY(-H); g.translate(.08,0,0);
  return mesh(parent,g,m);
}
function buildBeeCar(){
  const Y=paint(0xffc31a), K=paint(0x1d1e24,{roughness:.45}), glass=GLASS, gray=metal(0x8d939c);
  const m=new THREE.Group(), parts=[], wheels=[];
  const P=(car,bot,b)=>{ const q=part(m,car,bot,b); parts.push(q); return q; };
  [-1,1].forEach(sd=>{
    /* lower body halves → legs */
    P({p:[sd*.21,.3,0]},{p:[sd*.17,.43,0],r:[H,0,0],s:[.62,1,.56]},q=>{ box(q,.42,.2,1.46,Y,0,0,0); box(q,.3,.04,1.2,K,0,.11,0); box(q,.4,.05,1.36,K,0,-.11,0); box(q,.3,.07,.02,K,-sd*.04,.02,.735); });
    /* front fenders with wheel arches → arms; the black fist is the front bumper */
    P({p:[sd*.36,.38,.5]},{p:[sd*.6,1.1,.04],r:[H,0,sd*-.12],d:.18},q=>{ fender(q,Y,.56,.22,.2); box(q,.15,.08,.08,K,-sd*.01,-.06,.3); box(q,.05,.05,.3,gray,sd*.07,.06,0); });
    /* rear fenders → shoulder pads */
    P({p:[sd*.36,.38,-.5]},{p:[sd*.58,1.42,0],s:[1.15,.7,.7],d:.28},q=>fender(q,Y,.56,.22,.2));
    /* doors → wings on the back */
    P({p:[sd*.43,.5,-.02]},{p:[sd*.34,1.48,-.28],r:[.35,0,sd*-.65],d:.34},q=>{ box(q,.03,.16,.44,Y,0,0,0); box(q,.035,.012,.3,K,0,.02,0); });
    [[.5,[sd*.36,.25,0],[0,0,H]],[-.5,[sd*.3,1.22,-.24],[H,0,0]]].forEach(([z,bp,br])=>{
      const w=P({p:[sd*.47,.2,z],r:[0,0,H]},{p:bp,r:br,d:.05},q=>wheel(q,.19,.13)); wheels.push(w);
    });
    P({p:[sd*.28,.48,.77],r:[-.15,0,0]},{p:[sd*.22,1.05,.27],d:.2},q=>{ box(q,.17,.06,.03,glow(0xfff6c8),0,0,0); box(q,.19,.08,.02,K,0,0,-.01); });
    /* side windows ride with the cabin; mirrors fold away */
    P({p:[sd*.4,.62,.12]},{p:[sd*.3,1.62,.1],s:.001,d:.1},q=>{ box(q,.08,.05,.05,K,0,0,0); });
  });
  /* trunk + spoiler → hips */
  P({p:[0,.48,-.58]},{p:[0,.86,0],d:.1},q=>{
    side(q,[[-.18,-.07],[.18,-.07],[.18,.07],[-.15,.06],[-.18,.02]],.84,Y);
    [-1,1].forEach(sd=>box(q,.16,.05,.02,glow(0xff3a3a),sd*.3,0,-.19));
    box(q,.8,.025,.1,K,0,.11,-.13); [-1,1].forEach(sd=>box(q,.03,.05,.04,K,sd*.34,.085,-.13));
  });
  /* cabin roof with sloped glass → upper body */
  P({p:[0,.6,-.12]},{p:[0,1.18,-.03],r:[H,0,0],d:.15},q=>{
    side(q,[[.3,-.04],[.08,.14],[-.16,.14],[-.3,-.02]],.78,Y);
    const rear=new THREE.Mesh(new THREE.PlaneGeometry(.66,.2),glass); rear.position.set(0,.06,-.24); rear.rotation.x=H+.63; rear.rotation.y=Math.PI; q.add(rear);
    [-1,1].forEach(sd=>{ const sw=new THREE.Shape(); sw.moveTo(.24,-.02); sw.lineTo(.07,.12); sw.lineTo(-.14,.12); sw.lineTo(-.25,-.01); sw.lineTo(.24,-.02);
      const w=new THREE.Mesh(new THREE.ShapeGeometry(sw),glass); w.rotation.y=sd*H; w.position.x=sd*.406; q.add(w); });
  });
  /* windscreen → belly window */
  P({p:[0,.65,.19],r:[-.68,0,0]},{p:[0,1.03,.12],s:[.7,.75,1],d:.2},q=>box(q,.7,.28,.012,glass,0,0,0));
  /* Split the hood into two chest plates, with the car stripes preserved. */
  [-1,1].forEach(sd=>P({p:[sd*.21,.47,.5]},{p:[sd*.17,1.32,.18],r:[H,sd*.12,sd*-.18],s:[.9,.85,.72],d:.2},q=>{
    side(q,[[-.25,-.07],[.26,-.07],[.28,-.02],[.26,.03],[-.25,.08]],.42,Y);
    const st=box(q,.08,.008,.52,K,-sd*.06,.075,0);st.rotation.x=.1;
    box(q,.16,.045,.025,glow(0xffedbc),0,-.015,.285);
  }));
  [-1,1].forEach(sd=>{
    P({p:[0,.3,0],s:0},{p:[sd*.19,.47,.02],d:.2},q=>{
      const calf=cyl(q,.095,.12,.5,gray,0,0,0,12);
      const panel=ball(q,.13,Y,0,-.04,.055,18);panel.scale.set(.8,1.9,.65);
      box(q,.2,.11,.3,K,0,-.3,.08);box(q,.2,.055,.19,Y,0,-.265,.14);
      ball(q,.07,CHROME,0,.26,.05,14);
    });
    P({p:[0,.4,0],s:0},{p:[sd*.49,1.18,.02],d:.3},q=>{
      cyl(q,.07,.075,.32,gray,0,0,0,12);
      const pa=ball(q,.11,Y,0,-.19,.025,18);pa.scale.set(.8,1.35,.8);
      box(q,.13,.11,.12,K,0,-.34,.025);
    });
  });
  P({p:[0,.7,-.1],s:0},{p:[0,1.72,0],d:.45},q=>{
    const shell=ball(q,.19,Y,0,0,0,24);shell.scale.set(.9,1,.85);
    [-1,1].forEach(sd=>{const cheek=box(q,.065,.14,.045,Y,sd*.12,-.04,.12);cheek.rotation.z=sd*-.2;});
    box(q,.26,.17,.03,metal(0x2a2c33),0,-.03,.165);
    box(q,.22,.05,.04,metal(0xb8bec8),0,-.1,.17);
    [-1,1].forEach(sd=>{ box(q,.08,.045,.02,glow(0x7de8ff),sd*.065,.01,.182); const horn=box(q,.05,.2,.08,Y,sd*.19,.16,0); horn.rotation.z=sd*-.25; });
    box(q,.08,.1,.24,K,0,.19,.0);
  });
  return { m, parts, wheels };
}

function buildTruck(){
  const R=paint(0xc8141c), B=paint(0x1c3fa8), S=CHROME, glass=GLASS, D=DARK;
  const m=new THREE.Group(), parts=[], wheels=[];
  const P=(car,bot,b)=>{ const q=part(m,car,bot,b); parts.push(q); return q; };
  [-1,1].forEach(sd=>{
    P({p:[sd*.25,.34,-.12]},{p:[sd*.2,.5,0],r:[H,0,0],s:[.66,1,.55]},q=>{ box(q,.48,.28,1.7,B,0,0,0); box(q,.3,.04,1.3,S,0,.15,0); box(q,.5,.06,1.6,D,0,-.14,0); });
    P({p:[sd*.36,.9,-.48]},{p:[sd*.7,1.36,0],r:[H,0,sd*-.1],d:.18},q=>{ box(q,.22,.24,.62,R,0,0,0); box(q,.24,.24,.18,B,0,0,.38); box(q,.02,.14,.4,glass,sd*.115,.03,-.05); });
    P({p:[sd*.5,.36,-.2],r:[H,0,0]},{p:[sd*.66,1.72,0],r:[0,0,H],d:.28},q=>{ cyl(q,.11,.11,.42,S,0,0,0,18); [-.16,.16].forEach(y=>cyl(q,.115,.115,.03,D,0,y,0,18)); });
    P({p:[sd*.42,1.32,-.02]},{p:[sd*.34,1.98,-.24],d:.32},q=>{ cyl(q,.05,.05,.6,S,0,0,0,14); cyl(q,.065,.065,.06,D,0,.3,0,14); });
    [[.6,[sd*.48,.3,0],[0,0,H]],[-.66,[sd*.36,1.42,-.34],[H,0,0]]].forEach(([z,bp,br])=>{
      const w=P({p:[sd*.52,.22,z],r:[0,0,H]},{p:bp,r:br,d:.05},q=>wheel(q,.22,.15)); wheels.push(w);
    });
    P({p:[sd*.33,.58,.96]},{p:[sd*.3,.98,.32],d:.2},q=>{ box(q,.14,.1,.03,glow(0xfff6c8),0,0,0); box(q,.16,.12,.02,S,0,0,-.01); });
    P({p:[sd*.52,1.0,.36]},{p:[sd*.4,1.7,.1],s:.001,d:.1},q=>{ box(q,.04,.18,.1,S,0,0,0); });
  });
  P({p:[0,.56,-.84]},{p:[0,1.0,0],d:.1},q=>{ box(q,.9,.2,.4,S,0,0,0); box(q,.6,.08,.42,D,0,0,0); });
  P({p:[0,.86,.2]},{p:[0,1.44,0],d:.15},q=>{
    box(q,.96,.62,.6,R,0,0,0);
    [-1,1].forEach(sd=>{ box(q,.37,.27,.02,glass,sd*.21,.1,.305); box(q,.4,.3,.01,S,sd*.21,.1,.3); });
    box(q,.98,.06,.62,S,0,-.31,0);
    box(q,.9,.05,.5,R,0,.33,0);
    [-1,0,1].forEach(i=>box(q,.06,.04,.04,glow(0xffb340),i*.18,.33,.27));
  });
  P({p:[0,.56,.74]},{p:[0,1.02,.16],s:[1,.9,.6],d:.1},q=>{
    box(q,.9,.3,.44,R,0,0,0);
    box(q,.52,.24,.02,S,0,0,.225);
    for(let i=-3;i<=3;i++) box(q,.025,.2,.025,D,i*.065,0,.234);
    box(q,.94,.08,.06,S,0,-.16,.2);
  });
  [-1,1].forEach(sd=>{
    P({p:[0,.3,0],s:0},{p:[sd*.2,.27,.055],d:.15},q=>{
      box(q,.23,.13,.38,B,0,-.15,.08);box(q,.24,.045,.3,S,0,-.225,.1);
      box(q,.19,.27,.045,B,0,.06,.15);
      for(let i=0;i<3;i++)box(q,.13,.016,.02,S,0,.01+i*.06,.18);
    });
    P({p:[0,.7,0],s:0},{p:[sd*.59,1.42,.04],d:.25},q=>{
      ball(q,.085,D,0,.12,0,16);box(q,.17,.28,.17,R,0,-.04,.015);
      box(q,.17,.13,.18,B,0,-.23,.015);
      for(let i=0;i<3;i++)box(q,.026,.02,.02,S,-.045+i*.045,-.25,.112);
    });
  });
  P({p:[0,.8,-.2],s:0},{p:[0,2.02,0],d:.45},q=>{
    const shell=ball(q,.19,B,0,0,0,24);shell.scale.set(.86,1,.85);
    [-1,1].forEach(sd=>box(q,.045,.17,.18,B,sd*.14,-.015,.015));
    box(q,.22,.14,.03,metal(0xc9d0da),0,-.09,.168);
    for(let i=-1;i<=1;i++) box(q,.015,.1,.01,D,i*.05,-.09,.185);
    box(q,.2,.07,.02,metal(0x2a2c33),0,.03,.17);
    [-1,1].forEach(sd=>{ box(q,.07,.035,.02,glow(0x7de8ff),sd*.055,.035,.18); cyl(q,.025,.035,.3,B,sd*.2,.17,0,10); box(q,.06,.16,.2,B,sd*.18,0,0); });
    box(q,.07,.12,.06,B,0,.21,.12);
  });
  return { m, parts, wheels };
}

/* Transformers One Elita-1: one front wheel, two rear wheels; no car shell. */
function buildElita(){
  const pink=paint(0xe94b88),deep=paint(0x9d2454),white=paint(0xffdce6),silver=metal(0xc4cbd6),blue=glow(0x70eaff);
  const glass=std({color:0x236176,metalness:.45,roughness:.12});
  const m=new THREE.Group(),parts=[],wheels=[];
  const P=(car,bot,b)=>{const q=part(m,car,bot,b);parts.push(q);return q;};
  const hidden={p:[0,.34,0],s:0};
  // Lofted cross-sections give the bike curved, tapered skins rather than extruded boxes.
  function shell(q,stations,material){
    const center=new THREE.CatmullRomCurve3(stations.map(([z,y])=>new THREE.Vector3(z,y,0)),false,'centripetal');
    const size=new THREE.CatmullRomCurve3(stations.map(([z,y,w,h])=>new THREE.Vector3(w,h,0)),false,'catmullrom',.2);
    const pos=[],idx=[],n=48,rings=24;
    for(let j=0;j<=n;j++){
      const c=center.getPoint(j/n),r=size.getPoint(j/n),w=Math.max(.001,r.x),h=Math.max(.001,r.y);
      for(let i=0;i<=rings;i++){const t=i/rings*TAU;pos.push(w*Math.cos(t),c.y+h*Math.sin(t),c.x);}
    }
    for(let j=0;j<n;j++)for(let i=0;i<rings;i++){const a=j*(rings+1)+i,b=a+rings+1;idx.push(a,a+1,b,a+1,b+1,b);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();
    return mesh(q,geo,material);
  }
  function cowl(q,r,width){
    const sh=new THREE.Shape();sh.absarc(0,0,r,.05,Math.PI-.05,false);sh.absarc(0,0,r-.032,Math.PI-.05,.05,true);sh.closePath();
    const geo=new THREE.ExtrudeGeometry(sh,{depth:width,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:3,curveSegments:32});geo.rotateY(-H);geo.translate(width/2,0,0);return mesh(q,geo,pink);
  }
  P({p:[0,.34,-.04]},{p:[0,1.35,-.2],r:[H,0,0],s:[.75,.8,.58],d:.15},q=>{
    shell(q,[[-.68,-.015,.001,.001],[-.48,.015,.09,.06],[-.18,.005,.125,.075],[.13,.015,.14,.095],[.37,.055,.105,.08],[.55,.035,.001,.001]],deep);
    shell(q,[[-.43,.075,.001,.001],[-.29,.09,.07,.012],[-.04,.09,.075,.015],[.1,.1,.001,.001]],white);
    [-1,1].forEach(sd=>{const rail=cyl(q,.018,.018,.6,silver,sd*.11,-.035,-.13);rail.rotation.x=H;});
  });
  // A low swept nose, small inset windscreen and tucked bars retain a racing-bike silhouette.
  P({p:[0,.405,.39]},{p:[0,1.49,-.23],r:[-.15,0,0],s:[.8,.9,.75],d:.3},q=>{
    shell(q,[[-.3,.005,.001,.001],[-.15,.055,.12,.055],[.04,.04,.15,.065],[.25,-.035,.1,.045],[.43,-.085,.001,.001]],pink);
    shell(q,[[-.14,.104,.001,.001],[-.08,.112,.08,.009],[.055,.09,.087,.008],[.14,.055,.001,.001]],glass);
    shell(q,[[.22,-.012,.001,.001],[.28,-.033,.072,.009],[.34,-.049,.001,.001]],blue);
    const handle=cyl(q,.014,.014,.32,deep,0,.075,-.18);handle.rotation.z=H;
    [-1,1].forEach(sd=>{const grip=cyl(q,.021,.021,.065,DARK,sd*.158,.075,-.18);grip.rotation.z=H;});
  });
  // Split swept nose blades flank the wheel, echoing the film's Cybertronian fairing.
  [-1,1].forEach(sd=>P({p:[sd*.12,.425,.53]},
    {p:[sd*.25,1.38,-.22],r:[.2,sd*.15,sd*-.2],s:[.7,.8,.75],d:.27},q=>{
      shell(q,[[-.35,.015,.001,.001],[-.18,.035,.06,.045],[.08,0,.065,.032],[.32,-.10,.04,.018],[.5,-.13,.001,.001]],pink);
      shell(q,[[-.23,.06,.001,.001],[-.12,.077,.025,.008],[.04,.037,.025,.007],[.2,-.04,.001,.001]],white);
    }));
  const fw=P({p:[0,.23,.72],r:[0,0,H]},{p:[0,1.42,-.28],r:[H,0,0],s:.75,d:.08},q=>wheel(q,.23,.135));wheels.push(fw);
  P({p:[0,.23,.72]},{p:[0,1.42,-.28],r:[H,0,0],s:.75,d:.08},q=>cowl(q,.255,.12));
  [-1,1].forEach(sd=>{
    P({p:[sd*.103,.31,.635],r:[-.5,0,0]},{p:[sd*.32,1.45,-.06],r:[.2,0,sd*.2],s:[.8,.75,.8],d:.2},q=>{
      cyl(q,.023,.027,.235,silver,0,0,0);
      shell(q,[[-.075,.025,.001,.001],[-.045,.03,.044,.06],[.055,.045,.035,.045],[.11,.04,.001,.001]],pink);
    });
    // Swept side fairings wrap the rear tires; they become slim calf armour in robot mode.
    P({p:[sd*.158,.315,-.48]},{p:[sd*.145,.34,.055],r:[H,0,0],s:[.9,.8,.9],d:.12},q=>{
      shell(q,[[-.44,.025,.001,.001],[-.3,.075,.065,.055],[-.13,.085,.09,.08],[.08,.04,.078,.09],[.22,-.015,.045,.06],[.31,-.045,.001,.001]],pink);
      shell(q,[[-.36,.065,.001,.001],[-.21,.132,.035,.009],[-.08,.145,.035,.008],[.035,.12,.001,.001]],white);
      const tail=mesh(q,new THREE.SphereGeometry(1,16,8),glow(0xff646f),0,.038,-.345);tail.scale.set(.038,.014,.018);
    });
    const w=P({p:[sd*.185,.205,-.63],r:[0,0,H]},{p:[sd*.18,.36,-.13],r:[0,0,H],s:.8,d:.06},q=>wheel(q,.205,.1));wheels.push(w);
    P({p:[sd*.185,.205,-.63]},{p:[sd*.18,.36,-.13],r:[0,0,0],s:.8,d:.06},q=>cowl(q,.231,.115));
    // Rear stabilizer fins sweep back, then rotate outward to become her shoulder caps.
    P({p:[sd*.13,.385,-.48],r:[0,0,sd*-.14]},{p:[sd*.335,1.51,0],r:[0,0,sd*-.23],d:.28},q=>{
      shell(q,[[-.28,.1,.001,.001],[-.19,.1,.043,.05],[-.08,.04,.065,.035],[.1,0,.065,.035],[.19,-.02,.001,.001]],pink);
      const sh=new THREE.Shape();sh.moveTo(-.23,.055);sh.quadraticCurveTo(-.2,.13,-.18,.19);sh.quadraticCurveTo(-.15,.21,-.13,.16);sh.lineTo(-.06,.035);sh.closePath();
      const geo=new THREE.ExtrudeGeometry(sh,{depth:.04,bevelEnabled:true,bevelSize:.01,bevelThickness:.009,bevelSegments:3,curveSegments:16});geo.rotateY(-H);geo.translate(.02,0,0);mesh(q,geo,white);
    });
    P(hidden,{p:[sd*.13,.78,0],r:[0,0,-sd*.035],d:.16},q=>{
      ball(q,.085,silver,0,.14,0);limb(q,.075,.068,.2,white,0,-.015,0);ball(q,.075,deep,0,-.17,.015);
    });
    P(hidden,{p:[sd*.145,.35,0],d:.15},q=>{
      cyl(q,.06,.07,.43,silver,0,.02,-.03);roundedBox(q,.2,.11,.31,.025,white,0,-.245,.08);
      roundedBox(q,.18,.045,.16,.012,pink,0,-.185,.15);roundedBox(q,.13,.08,.05,.018,white,0,.2,.13);
    });
    P(hidden,{p:[sd*.32,1.47,0],r:[0,0,sd*.12],d:.2},q=>{
      ball(q,.095,silver,0,0,0);limb(q,.067,.059,.21,white,sd*.045,-.18,0);ball(q,.067,deep,sd*.06,-.32,.015);
      roundedBox(q,.14,.23,.15,.03,pink,sd*.07,-.46,.035);roundedBox(q,.105,.11,.115,.018,white,sd*.075,-.625,.04);
      for(let i=0;i<3;i++)box(q,.02,.012,.006,deep,sd*.075-.03+i*.03,-.64,.101);
    });
  });
  P(hidden,{p:[0,1.43,0],d:.15},q=>{
    roundedBox(q,.38,.34,.23,.045,deep);
    shapeMesh(q,outline([[-.235,.15],[.235,.15],[.17,-.12],[0,-.18],[-.17,-.12]]),pink,0,.02,.13,.045);
    [-1,1].forEach(sd=>{const collar=roundedBox(q,.16,.045,.025,.01,white,sd*.1,.13,.185);collar.rotation.z=sd*.17;});
    shapeMesh(q,outline([[-.16,.04],[0,-.02],[.16,.04],[.13,-.035],[0,-.085],[-.13,-.035]]),deep,0,.02,.18,.012);
    roundedBox(q,.06,.045,.018,.009,silver,0,.09,.2);cyl(q,.07,.07,.11,silver,0,.25,0);
  });
  P(hidden,{p:[0,1.12,0],d:.12},q=>{
    cyl(q,.11,.13,.23,deep,0,.055,0,12);
    for(let i=0;i<3;i++)roundedBox(q,.15,.022,.025,.006,silver,0,.03+i*.055,.13);
    roundedBox(q,.31,.14,.23,.03,white,0,-.13,0);
    shapeMesh(q,outline([[-.14,.07],[.14,.07],[.08,-.075],[-.08,-.075]]),pink,0,-.13,.13,.018);
  });
  P(hidden,{p:[0,1.83,.015],d:.42},q=>{
    const shell=ball(q,.168,pink,0,0,0,28);shell.scale.set(.86,1,.88);
    const face=outline([[-.095,.06],[.095,.06],[.103,-.025],[.065,-.115],[0,-.137],[-.065,-.115],[-.103,-.025]]);
    curvedPanel(q,face,white,(x,y)=>.153-.8*x*x-.4*y*y);
    [-1,1].forEach(sd=>{
      shapeMesh(q,outline([[sd*.014,.027],[sd*.083,.039],[sd*.074,.008],[sd*.024,-.004]]),deep,0,0,.164,.006);
      shapeMesh(q,outline([[sd*.022,.023],[sd*.074,.03],[sd*.067,.013],[sd*.026,.006]]),blue,0,0,.173);
      const cheek=roundedBox(q,.045,.13,.09,.014,pink,sd*.117,-.045,.105);cheek.rotation.z=-sd*.2;
      shapeMesh(q,outline([[-.025,-.12],[.025,-.1],[.035,.12],[0,.17],[-.035,.1]]),pink,sd*.13,.07,-.015,.07);
      roundedBox(q,.05,.13,.095,.012,white,sd*.153,-.01,-.015);
    });
    shapeMesh(q,outline([[-.05,.095],[-.04,.18],[0,.215],[.04,.18],[.05,.095],[0,.06]]),deep,0,0,.07,.085);
    shapeMesh(q,outline([[-.026,.14],[-.023,.18],[0,.198],[.023,.18],[.026,.14]]),pink,0,0,.161,.012);
    const nose=mesh(q,new THREE.ConeGeometry(.018,.055,4),white,0,-.018,.169);nose.rotation.x=.3;
    roundedBox(q,.045,.008,.006,.003,deep,0,-.073,.155);
    roundedBox(q,.052,.014,.009,.004,white,0,-.101,.15);
  });
  return {m,parts,wheels};
}

/* Megatron's four tread pods unfold into calf and shoulder armour. */
function buildMegatron(){
  const silver=metal(0xa6aeb9,{roughness:.35}),edge=metal(0xd7dde4),gray=paint(0x454b55),dark=paint(0x242731),red=glow(0xff573d);
  const m=new THREE.Group(),parts=[],wheels=[];
  const P=(car,bot,b)=>{const q=part(m,car,bot,b);parts.push(q);return q;};
  const hidden={p:[0,.3,-.15],s:0};
  function tread(q){
    side(q,[[-.31,-.09],[-.22,-.18],[.22,-.18],[.31,-.09],[.31,.09],[.22,.18],[-.22,.18],[-.31,.09]],.22,TIRE);
    side(q,[[-.25,-.07],[-.18,-.12],[.18,-.12],[.25,-.07],[.25,.07],[.18,.12],[-.18,.12],[-.25,.07]],.235,gray);
    for(const sd of [-1,1])for(const z of [-.19,0,.19]){
      const roller=cyl(q,.083,.083,.015,silver,sd*.125,0,z,14);roller.rotation.z=H;
      const hub=cyl(q,.027,.027,.018,dark,sd*.138,0,z,10);hub.rotation.z=H;
    }
    for(let i=0;i<20;i++){
      const t=i/20*TAU,z=.3*Math.cos(t),y=.17*Math.sin(t),pad=box(q,.245,.04,.07,dark,0,y,z);
      pad.rotation.x=Math.atan2(.17*Math.cos(t),-.3*Math.sin(t));
    }
  }
  // Low angular hull and pointed front glacis become the chest/backpack.
  P({p:[0,.38,0]},{p:[0,1.47,-.11],r:[H,0,0],s:[.8,.75,.5],d:.15},q=>{
    side(q,[[-.67,-.11],[.72,-.11],[.72,-.01],[.4,.12],[-.51,.13],[-.67,.02]],.66,silver);
    [-1,1].forEach(sd=>roundedBox(q,.055,.035,.025,.008,red,sd*.23,.015,.73));
    for(let i=0;i<4;i++)roundedBox(q,.34,.012,.025,.005,gray,0,.15,-.3-i*.065);
  });
  P({p:[0,.57,-.16]},{p:[0,1.48,.04],r:[H,0,0],s:[.9,.7,.63],d:.2},q=>{
    side(q,[[-.3,-.08],[.32,-.08],[.23,.13],[-.22,.13]],.55,silver);
    roundedBox(q,.28,.025,.19,.015,gray,0,.15,-.06);
  });
  P(hidden,{p:[0,1.49,.07],d:.2},q=>{
    roundedBox(q,.53,.34,.26,.045,silver);
    shapeMesh(q,outline([[-.3,.15],[-.07,.08],[0,.02],[.07,.08],[.3,.15],[.23,-.1],[0,-.17],[-.23,-.1]]),edge,0,.03,.15,.04);
    shapeMesh(q,outline([[-.18,.03],[0,-.035],[.18,.03],[.12,-.05],[0,-.09],[-.12,-.05]]),gray,0,.04,.2,.012);
    roundedBox(q,.1,.04,.015,.007,paint(0x8b2434),0,.125,.2);cyl(q,.085,.085,.13,dark,0,.25,-.025);
  });
  P(hidden,{p:[0,1.12,0],d:.15},q=>{
    roundedBox(q,.28,.22,.23,.025,dark);
    for(let i=0;i<3;i++)roundedBox(q,.24,.03,.03,.006,gray,0,-.065+i*.065,.13);
    roundedBox(q,.43,.16,.28,.025,silver,0,-.18,0);
    roundedBox(q,.12,.09,.03,.009,gray,0,-.18,.16);
  });
  [-1,1].forEach(sd=>{
    for(const front of [true,false])P({p:[sd*.45,.21,front?.38:-.38]},
      {p:front?[sd*.26,.36,-.035]:[sd*.4,1.56,-.12],r:front?[H,0,0]:[0,0,sd*-.17],s:front?[.9,.8,1]:[.85,.8,.8],d:front?.09:.25},tread);
    P(hidden,{p:[sd*.19,.79,0],d:.17},q=>{
      ball(q,.1,dark,0,.12,0);roundedBox(q,.2,.32,.2,.025,silver,0,-.055,0);
      ball(q,.087,gray,0,-.23,.02);roundedBox(q,.19,.08,.04,.016,edge,0,-.23,.125);
    });
    P(hidden,{p:[sd*.2,.34,0],d:.13},q=>{
      roundedBox(q,.22,.4,.2,.025,gray,0,.045,0);
      shapeMesh(q,outline([[-.13,.23],[.13,.23],[.1,-.18],[-.1,-.18]]),silver,0,.045,.115,.04);
      roundedBox(q,.27,.12,.38,.028,dark,0,-.25,.085);roundedBox(q,.25,.06,.25,.015,edge,0,-.195,.15);
    });
    P(hidden,{p:[sd*.4,1.5,0],r:[0,0,sd*.07],d:.25},q=>{
      ball(q,.105,dark,0,.04,0);limb(q,.082,.075,.22,silver,sd*.055,-.17,0);
      ball(q,.08,dark,sd*.065,-.34,0);roundedBox(q,.2,.27,.2,.025,gray,sd*.08,-.48,.015);
      roundedBox(q,.15,.12,.16,.02,dark,sd*.085,-.68,.03);
      for(let i=0;i<3;i++)box(q,.027,.014,.01,silver,sd*.085-.044+i*.044,-.69,.118);
    });
  });
  // The same barrel travels from the tank turret to the right forearm.
  P({p:[0,.58,.65],r:[H,0,0]},{p:[-.57,1.07,.08],r:[0,0,0],d:.3},q=>{
    cyl(q,.075,.09,.52,dark,0,0,0,16);cyl(q,.105,.105,.1,gray,0,-.1,0,16);
    cyl(q,.095,.095,.045,silver,0,.28,0,16);cyl(q,.065,.065,.048,dark,0,.284,0,16);
    cyl(q,.03,.03,.05,glow(0xff9a67),0,.285,0,12);
    roundedBox(q,.075,.12,.065,.01,gray,0,.02,-.09);
  });
  P(hidden,{p:[0,1.97,0],d:.43},q=>{
    const helmet=outline([[-.18,-.1],[-.19,.13],[-.11,.22],[.11,.22],[.19,.13],[.18,-.1],[.11,-.16],[-.11,-.16]]);
    shapeMesh(q,helmet,silver,0,0,-.13,.27);
    curvedPanel(q,outline([[-.113,.065],[.113,.065],[.105,-.065],[.06,-.155],[-.06,-.155],[-.105,-.065]]),edge,(x,y)=>.154-.55*x*x-.2*y*y);
    shapeMesh(q,outline([[-.13,.08],[0,.045],[.13,.08],[.105,.015],[0,-.003],[-.105,.015]]),dark,0,0,.164,.01);
    [-1,1].forEach(sd=>{
      shapeMesh(q,outline([[sd*.018,.04],[sd*.1,.062],[sd*.086,.023],[sd*.025,.013]]),red,0,0,.18);
      roundedBox(q,.04,.2,.1,.012,gray,sd*.152,-.018,.105);
      const brow=roundedBox(q,.12,.033,.025,.008,silver,sd*.07,.082,.175);brow.rotation.z=sd*.14;
    });
    shapeMesh(q,outline([[-.016,.018],[.016,.018],[.023,-.045],[0,-.055],[-.023,-.045]]),silver,0,0,.17,.023);
    roundedBox(q,.075,.009,.01,.003,dark,0,-.092,.159);
    shapeMesh(q,outline([[-.065,-.12],[0,-.15],[.065,-.12],[.04,-.175],[-.04,-.175]]),silver,0,0,.15,.015);
    roundedBox(q,.09,.08,.02,.012,gray,0,.145,.15);
  });
  return {m,parts,wheels};
}

function makeTransformer(kind,holder){
  const built=({bee:buildBeeCar,truck:buildTruck,elita:buildElita,megatron:buildMegatron})[kind]();
  const root=new THREE.Group(); holder.add(root); root.add(built.m);
  built.m.scale.setScalar(kind==='truck'?1.3:kind==='megatron'?1.18:kind==='elita'?1.2:1.22);
  const h={ kind, holder, root, ...built, k:1, target:1, phase:'idle', t:0 };
  built.parts.forEach(p=>pose(p,1));
  h.tap=()=>{
    if(h.phase!=='idle') return;
    h.target=h.k<.5?1:0; h.phase='morph'; h.t=0; fx.whir();
    C.say(L[kind+(h.target?'Bot':'Car')]);
  };
  h.update=(dt,t)=>{
    if(h.phase==='morph'){
      h.t+=dt; const q=clamp(h.t/1.4,0,1);
      h.k=h.target?q:1-q;
      root.position.y=Math.sin(Math.PI*q)*.55;
      root.rotation.y=ease(q)*TAU;
      h.parts.forEach(p=>pose(p,h.k));
      if(q>=1){ root.rotation.y=0; root.position.y=0;
        if(h.target){ h.phase='pose'; h.t=0; C.burst(root,14); }
        else { h.phase='drive'; h.t=0; kind==='truck'?fx.honk():fx.vroom(); } }
    }else if(h.phase==='pose'){            /* robot: proud little hop */
      h.t+=dt; root.position.y=Math.abs(Math.sin(h.t*7))*.12*(1-h.t/1);
      if(h.t>1){ h.phase='idle'; root.position.y=0; }
    }else if(h.phase==='drive'){           /* car: a quick loop and back to its spot */
      h.t+=dt; const R=(kind==='elita'||kind==='megatron')?.7:1.4, f=ease(clamp(h.t/2.2,0,1))*TAU;
      root.position.set(R-Math.cos(f)*R,0,Math.sin(f)*R);
      root.rotation.y=f;
      h.wheels.forEach(w=>w.userData.spin.rotation.y-=dt*14);
      if(h.t>=2.2){ h.phase='idle'; root.position.set(0,0,0); root.rotation.y=0; }
    }else{
      root.position.y = h.k>.5 ? Math.sin(t*2+holder.id)*.015 : 0;
    }
  };
  return h;
}

/* ===================================================================
   IRON FLYER — red & gold armour: gold faceplate with glowing eyes,
   chest light, panel seams, rocket boots
   =================================================================== */
function makeIron(holder){
  const red=0xb5121b, gold=0xd9a23a, dark=0x8e0d14;
  /* decal: gold chest frame and abdomen plates on the red suit */
  const dec=decal(x=>{
    x.fillStyle='#ad1620';x.fillRect(-.3,.9,.6,.7);
    x.strokeStyle='#d2a04b';x.lineWidth=.012;
    [-1,1].forEach(sd=>{x.beginPath();x.moveTo(sd*.06,1.57);x.lineTo(sd*.155,1.54);x.lineTo(sd*.18,1.50);x.stroke();});
    for(let i=0;i<4;i++){const y=1.28-i*.07,w=.11-i*.008;x.fillStyle=i%2?'#b7222c':'#9e1420';x.beginPath();x.moveTo(-w,y);x.lineTo(w,y);x.lineTo(w*.87,y-.055);x.lineTo(-w*.87,y-.055);x.closePath();x.fill();x.strokeStyle='#671d25';x.lineWidth=.003;x.stroke();}
  });
  const mats={ torso:figMat({metalness:.75,roughness:.3,envMap:ENV,decal:dec,decalRect:DECAL_RECT,detail:DT.panels,detailScale:2.5,detailMix:.12}),
    head:figMat({metalness:.75,roughness:.25,envMap:ENV}), arm:figMat({metalness:.75,roughness:.3,envMap:ENV,detail:DT.panels,detailScale:4,detailMix:.12}), leg:figMat({metalness:.75,roughness:.3,envMap:ENV,detail:DT.panels,detailScale:4,detailMix:.12}) };
  const c=figure({ cols:{ pelvis:dark, belt:gold, belly:red, chest:red, side:red, back:red, neck:dark, deltoid:red, upper:gold, fore:red, cuff:gold, hand:red, thigh:gold, shin:red, boot:red,
    skull:red, brow:red, face:gold, jaw:gold, ear:red, hair:red }, mats },{ face:'helmet', bootH:.2, continuousArms:true, refined:true });
  const root=new THREE.Group(); holder.add(root); root.add(c.g);
  stance(c,{forward:.08,spread:.14,armsOut:.22,armL:.12,armR:.12,elbowL:-.2,elbowR:-.2});
  c.skull.visible=false;
  const redM=metal(red,{roughness:.27}),goldM=metal(0xd4a553,{roughness:.34}),seamM=metal(0x4d2827,{roughness:.55});
  const shellPoints=[[0,-.17],[.06,-.155],[.105,-.115],[.137,-.035],[.147,.045],[.128,.123],[.078,.17],[0,.183]];
  const shellGeo=new THREE.LatheGeometry(shellPoints.map(([x,y])=>new THREE.Vector2(x,y)),40);shellGeo.scale(1,1,.92);mesh(c.head,shellGeo,redM);
  const zFace=(x,y)=>.157-.23*x*x-.65*x*x/(.18*.18)*.04-.24*y*y-.9*Math.max(0,y-.07)-.45*Math.max(0,-y-.06);
  const maskOutline=[[-.073,.134],[.073,.134],[.102,.105],[.116,.041],[.096,-.009],[.098,-.06],[.06,-.129],[.039,-.142],[-.039,-.142],[-.06,-.129],[-.098,-.06],[-.096,-.009],[-.116,.041],[-.102,.105]];
  const shellZ=(x,y)=>{
    let r=0;
    for(let i=1;i<shellPoints.length;i++)if(y>=shellPoints[i-1][1]&&y<=shellPoints[i][1]){const a=shellPoints[i-1],b=shellPoints[i];r=lerp(a[0],b[0],(y-a[1])/(b[1]-a[1]));break;}
    return Math.sqrt(Math.max(0,r*r-x*x))*.92+.001;
  };
  const maskSides=[];
  for(let i=0;i<maskOutline.length;i++){
    const a=maskOutline[i],b=maskOutline[(i+1)%maskOutline.length],A=[a[0],a[1],zFace(...a)],B=[b[0],b[1],zFace(...b)],C=[b[0],b[1],Math.min(zFace(...b),shellZ(...b))],D=[a[0],a[1],Math.min(zFace(...a),shellZ(...a))];
    maskSides.push(...A,...B,...C,...A,...C,...D);
  }
  const maskEdgeGeo=new THREE.BufferGeometry();maskEdgeGeo.setAttribute('position',new THREE.Float32BufferAttribute(maskSides,3));maskEdgeGeo.computeVertexNormals();mesh(c.head,maskEdgeGeo,metal(0xc79849,{roughness:.38,side:THREE.DoubleSide}));
  const mask=outline(maskOutline);
  const eyePoints=sd=>[[sd*.019,.032],[sd*.097,.043],[sd*.102,.023],[sd*.028,.014]];
  [-1,1].forEach(sd=>{const hole=new THREE.Path();eyePoints(sd).forEach(([x,y],i)=>i?hole.lineTo(x,y):hole.moveTo(x,y));hole.closePath();mask.holes.push(hole);});
  curvedPanel(c.head,mask,goldM,zFace);
  // Thin red brow bridge and cheek rails give the helmet depth in side view.
  curvedPanel(c.head,outline([[-.025,.173],[.025,.173],[.023,.137],[0,.125],[-.023,.137]]),redM,(x,y)=>Math.min(zFace(x,y),.151-Math.max(0,y-.13)*2.25),.002);
  [-1,1].forEach(sd=>{
    const eye=outline(eyePoints(sd));
    curvedPanel(c.head,eye,glow(0xbfefff),zFace,-.003);
    const brow=outline([[sd*.015,.04],[sd*.102,.052],[sd*.112,.061],[sd*.038,.054]]);curvedPanel(c.head,brow,goldM,zFace,.004);
    curvedPanel(c.head,outline([[sd*.115,.038],[sd*.13,.008],[sd*.12,-.074],[sd*.062,-.143],[sd*.055,-.127],[sd*.097,-.055],[sd*.095,-.006]]),redM,zFace,.003);
    curvedPanel(c.head,outline([[sd*.073,-.016],[sd*.099,-.035],[sd*.058,-.099],[sd*.045,-.096]]),metal(0xc28b3d,{roughness:.36}),zFace,.001);
    const ear=cyl(c.head,.029,.029,.018,redM,sd*.145,.005,-.005,24);ear.rotation.z=H;
    const shoulder=ball(c.arms[sd<0?0:1],.094,redM,0,.025,0,24);shoulder.scale.set(1.08,.7,1);
    const thigh=ball(c.legs[sd<0?0:1],.08,redM,0,-.13,.053,20);thigh.scale.set(.82,1.8,.5);
    const knee=ball(c.knees[sd<0?0:1],.062,goldM,0,0,.04,20);knee.scale.set(.9,1,.5);
  });
  curvedPanel(c.head,outline([[-.031,-.082],[.031,-.082],[.031,-.086],[-.031,-.086]]),seamM,zFace,.002);
  [-1,1].forEach(sd=>curvedPanel(c.head,outline([[sd*.038,-.1],[sd*.047,-.108],[sd*.041,-.119],[sd*.033,-.114]]),metal(0xba8740),zFace,.002));
  // Red pectoral shells and layered abdominal plates replace the toy-like gold grid.
  const breast=new THREE.Group();breast.position.y=-1.48;c.torso.add(breast);
  [-1,1].forEach(sd=>curvedPanel(breast,outline([[sd*.014,1.53],[sd*.155,1.54],[sd*.216,1.48],[sd*.19,1.367],[sd*.078,1.35],[sd*.018,1.397]]),redM,(x,y)=>.179-.8*x*x));
  /* chest light */
  const core=cyl(c.g,.052,.052,.02,glow(0xcff8ff),0,1.42,.205,28); core.rotation.x=H;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.065,.012,8,28),metal(0xd8dde4)); ring.position.set(0,1.42,.218); c.g.add(ring);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:texOf(64,64,(x)=>{ const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(200,250,255,1)'); g.addColorStop(1,'rgba(160,240,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); }),transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending}));
  halo.scale.set(.24,.24,1); halo.position.set(0,1.42,.23); c.g.add(halo);
  c.hands.forEach(hd=>{ cyl(hd,.028,.028,.01,glow(0xcff8ff),0,-.045,.03,14); });
  const flames=c.feet.map(f=>{ const g=new THREE.Group(); g.position.set(0,-.05,.03); f.add(g);
    const a=mesh(g,new THREE.ConeGeometry(.065,.46,12),glow(0xffa21f),0,-.22,0,false); a.rotation.x=Math.PI;
    const b=mesh(g,new THREE.ConeGeometry(.034,.3,10),glow(0xfff3c4),0,-.14,0,false); b.rotation.x=Math.PI;
    g.visible=false; return g; });
  const beams=c.hands.map(hd=>{ const b=mesh(hd,new THREE.CylinderGeometry(.04,.04,1,10),new THREE.MeshBasicMaterial({color:0x9ff3ff,transparent:true,opacity:.85}),0,0,0,false); b.visible=false; return b; });
  const h={ holder, root, c, phase:'idle', t:0, n:0 };
  h.tap=()=>{
    if(h.phase!=='idle') return;
    if(h.n++%2===0){ h.phase='fly'; h.t=0; fx.whoosh(.16); C.say(L.ironFly); }
    else { h.phase='blast'; h.t=0; C.say(L.ironZap); }
  };
  const rest=()=>{ root.position.set(0,0,0); root.rotation.set(0,0,0); stance(c,{forward:.08,spread:.14,armsOut:.22,armL:.12,armR:.12,elbowL:-.2,elbowR:-.2}); };
  h.update=(dt,t)=>{
    const flying=h.phase==='fly';
    flames.forEach(f=>{ f.visible=flying; f.scale.y=1+Math.sin(t*40)*.2; });
    halo.material.opacity=.3+Math.sin(t*3)*.08;
    if(flying){
      h.t+=dt; const T=6;
      const up=ease(clamp(h.t/1,0,1)), down=ease(clamp((h.t-(T-1))/1,0,1));
      const f=ease(clamp((h.t-1)/(T-2),0,1))*TAU, R=3.4;
      const y=4.2*up*(1-down), mid=h.t>1&&h.t<T-1, k=Math.min(up,1-down);
      root.position.set(Math.sin(f)*R,y,R-Math.cos(f)*R);
      root.rotation.y = mid ? Math.atan2(Math.cos(f),Math.sin(f)) : 0;
      root.rotation.x = 1.1*k*(mid?1:.3);
      c.arms[1].rotation.x=-3.0*k; c.arms[0].rotation.x=.5*k; c.arms[0].rotation.z=.6*k+.14;
      c.legs.forEach((l,i)=>l.rotation.x=(i?.2:-.15)*k);
      c.head.rotation.x=-.5*k;
      if(Math.floor(h.t*2)!==Math.floor((h.t-dt)*2)) fx.whoosh(.06);
      if(h.t>=T){ h.phase='idle'; rest(); c.head.rotation.x=0; C.burst(root,12); }
    }else if(h.phase==='blast'){
      h.t+=dt;
      const raise=ease(clamp(h.t/.35,0,1));
      c.arms.forEach(a=>{ a.rotation.x=-H*raise; });
      c.elbows.forEach(e=>e.rotation.x=-.2*(1-raise));
      const on=h.t>.4&&h.t<1.4;
      beams.forEach(b=>{ b.visible=on; if(on){ const L2=4*clamp((h.t-.4)/.2,0,1); b.scale.set(1+Math.sin(t*50)*.2,L2,1+Math.sin(t*50)*.2); b.position.y=-L2/2; } });
      if(h.t>.4 && h.t-dt<=.4) fx.zap();
      if(h.t>.9 && h.t-dt<=.9) fx.zap();
      if(h.t>1.8){ h.phase='idle'; rest(); beams.forEach(b=>b.visible=false); }
    }else{
      alive(c,holder,root,t,1);
      root.position.y=Math.sin(t*1.6)*.012;
    }
  };
  return h;
}

/* ===================================================================
   SHIELD HERO — blue scaled suit, white star, striped middle, winged
   helmet with a bare jaw, a round star shield
   =================================================================== */
function shieldTex(){
  return texOf(512,512,(x)=>{
    [['#c01a22',256],['#f4f4f4',206],['#c01a22',158],['#1f3f9a',112]].forEach(([c,r])=>{ x.fillStyle=c; x.beginPath(); x.arc(256,256,r,0,TAU); x.fill(); });
    x.fillStyle='#f4f4f4'; starPath(x,256,260,108,42); x.fill();
    const g=x.createRadialGradient(180,160,20,256,256,256); g.addColorStop(0,'rgba(255,255,255,.3)'); g.addColorStop(1,'rgba(0,0,0,.18)');
    x.fillStyle=g; x.beginPath(); x.arc(256,256,256,0,TAU); x.fill();
  });
}
function wingShape(){ const s=new THREE.Shape(); s.moveTo(0,0); s.lineTo(.09,.03); s.lineTo(.07,.05); s.lineTo(.1,.07); s.lineTo(.065,.085); s.lineTo(.08,.11); s.lineTo(0,.06); s.lineTo(0,0); return s; }
function makeShield(holder){
  const blue=0x22408f, red=0xc01a22, white=0xf4f4f4, skin=0xf0c49c, brown=0x6b4524;
  const dec=decal(x=>{
    x.fillStyle='#f4f4f4'; x.beginPath(); for(let i=0;i<10;i++){ const a=Math.PI/2+i*Math.PI/5, q=i%2?.04:.1; x.lineTo(Math.cos(a)*q,1.44+Math.sin(a)*q); } x.closePath(); x.fill();
    for(let i=0;i<7;i++){ x.fillStyle=i%2?'#f4f4f4':'#c01a22'; x.fillRect(-.112+i*.032,1.0,.032,.2); }
    x.fillStyle='#6b4524'; x.fillRect(-.3,.98,.6,.065); x.fillStyle='#c9a24a'; x.fillRect(-.03,.985,.06,.055);
    [-.2,-.12,.1,.18].forEach(px=>{ x.fillStyle='#8a5a30'; x.fillRect(px,.975,.05,.075); });
  });
  const mats={ torso:figMat({roughness:.7,envMap:ENV,decal:dec,decalRect:DECAL_RECT,detail:DT.scales,detailScale:5,detailMode:2,detailMix:.125}),
    head:figMat({roughness:.65,envMap:ENV}), arm:figMat({roughness:.7,envMap:ENV}), leg:figMat({roughness:.7,envMap:ENV,detail:DT.scales,detailScale:5,detailMode:2,detailMix:.4}) };
  const c=figure({ cols:{ pelvis:blue, belt:brown, belly:blue, chest:blue, side:blue, back:blue, neck:skin, deltoid:blue, upper:blue, fore:red, cuff:red, hand:red, thigh:blue, shin:blue, boot:red,
    skull:blue, brow:blue, face:skin, jaw:skin, ear:skin, hair:0x5a3a1a, iris:0x4a6fb0 }, mats },{ face:'open', cowl:true, heroFace:true, bootH:.26, bulk:1.06, continuousArms:true, refined:true });
  const root=new THREE.Group(); holder.add(root); root.add(c.g);
  const restShieldPose=()=>stance(c,{forward:.12,spread:.16,twist:.05,armL:-.25,armR:.08,elbowL:-.9,elbowR:-.3});
  restShieldPose();c.arms[0].rotation.z=-.4;
  const cowl=mesh(c.head,new THREE.SphereGeometry(.143,28,20,0,TAU,0,1.66),cloth(blue),0,.015,-.008);cowl.scale.set(1,1.05,.91);
  [-1,1].forEach(sd=>{
    const mask=box(c.head,.06,.027,.022,cloth(blue),sd*.055,.05,.125);mask.rotation.z=sd*-.1;
    const cheek=box(c.head,.028,.061,.025,cloth(blue),sd*.101,-.015,.09);cheek.rotation.y=sd*.45;
  });
  const badge=texOf(128,128,x=>{x.fillStyle='#fff';x.font='900 100px sans-serif';x.textAlign='center';x.fillText('A',64,104);});
  mesh(c.head,new THREE.PlaneGeometry(.07,.072),new THREE.MeshBasicMaterial({map:badge,transparent:true,depthWrite:false}),0,.09,.12,false);
  const whiteM=cloth(white);
  [-1,1].forEach(sd=>{ const w=shapeMesh(c.head,wingShape(),whiteM,sd*.14,.0,-.01,.008);
    w.rotation.y=sd>0?-H+.25:H-.25; w.rotation.z=.35; w.scale.setScalar(.9); if(sd<0) w.scale.x*=-1; });
  box(c.head,.2,.012,.03,cloth(0x1a3275),0,-.125,.02);   /* chin strap */
  const mkShield=()=>{
    const shield=new THREE.Group(),R=.315,rings=18,sides=64,pos=[],uv=[],indices=[];
    for(let j=0;j<=rings;j++)for(let i=0;i<=sides;i++){
      const radius=j/rings*R,a=i/sides*TAU,x=Math.cos(a)*radius,y=Math.sin(a)*radius;
      pos.push(x,y,.064*(1-radius*radius/(R*R)));uv.push(.5+x/(R*2),.5+y/(R*2));
    }
    for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;indices.push(a,b,b+1,a,b+1,a+1);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
    mesh(shield,geo,metal(0xffffff,{map:shieldTex(),roughness:.36,metalness:.42,bump:false}));
    const back=cyl(shield,R*.97,R*.97,.017,metal(0x788798,{roughness:.55}),0,0,-.014,64);back.rotation.x=H;
    mesh(shield,new THREE.TorusGeometry(R,.009,10,64),metal(0xd8e2eb,{roughness:.3}));
    // Leather retainers sit behind the plate, between the forearm and shield.
    for(const y of [-.075,.075]){roundedBox(shield,.12,.022,.026,.005,cloth(0x694c36),0,y,-.05);box(shield,.022,.022,.085,cloth(0x694c36),-.052,y,-.08);box(shield,.022,.022,.085,cloth(0x694c36),.052,y,-.08);}
    return shield;
  };
  const armShield=mkShield();armShield.position.set(-.02,-.21,.195);armShield.rotation.set(.45,-.12,0);c.elbows[0].add(armShield);
  const flyShield=mkShield();flyShield.visible=false;holder.add(flyShield);
  const h={holder,root,c,shieldMount:armShield,thrownShield:flyShield,phase:'idle',t:0,path:null};
  const tmp=new THREE.Vector3(),catchAt=()=>holder.worldToLocal(armShield.getWorldPosition(new THREE.Vector3()));
  const catchRotation=()=>holder.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(armShield.getWorldQuaternion(new THREE.Quaternion()));
  const catchNormal=()=>new THREE.Vector3(0,0,1).applyQuaternion(catchRotation());
  const spinAxis=new THREE.Vector3(0,0,1);
  h.tap=()=>{if(h.phase!=='idle')return;h.phase='throw';h.t=0;h.path=null;C.say(L.shield);};
  h.update=(dt,t)=>{
    if(h.phase==='throw'){
      h.t+=dt;
      const wind=ease(clamp(h.t/.3,0,1));
      c.arms[0].rotation.x=h.t<.3?-.25-1.45*wind:-1.7+1.45*ease(clamp((h.t-.3)/.45,0,1));
      c.arms[0].rotation.z=-.4;c.torso.rotation.y=h.t<.3?-.2*wind:-.2*(1-ease(clamp((h.t-.3)/.45,0,1)));
      if(h.t>=.3){
        if(!h.path){
          const start=catchAt(),zp=(x,y,z)=>holder.worldToLocal(zoneG.localToWorld(new THREE.Vector3(x,y,z)));
          h.releaseRotation=catchRotation();
          // Leave outside the left shoulder, then approach the catching arm from in front.
          h.path=[start,start.clone().add(new THREE.Vector3(-.75,.3,.45)),zp(3,1.7,.4),zp(-3,2,-.2),start.clone(),start.clone()];fx.whoosh(.08);
        }
        armShield.visible=false;flyShield.visible=true;
        const seg=.5,u=(h.t-.3)/seg,i=Math.floor(u);
        if(i>=h.path.length-1){h.phase='idle';flyShield.visible=false;armShield.visible=true;restShieldPose();c.arms[0].rotation.z=-.4;fx.ping();return;}
        const approach=catchAt().addScaledVector(catchNormal(),.9);
        const a=i===h.path.length-2?approach:h.path[i],b=i===h.path.length-2?catchAt():i===h.path.length-3?approach:h.path[i+1],f=ease(u-i);
        tmp.lerpVectors(a,b,f);tmp.y+=Math.sin(f*Math.PI)*(i===0||i===h.path.length-2?0:.22);flyShield.position.copy(tmp);
        const blend=ease(clamp((u-1)/(h.path.length-3),0,1));
        flyShield.quaternion.copy(h.releaseRotation).slerp(catchRotation(),blend).multiply(new THREE.Quaternion().setFromAxisAngle(spinAxis,t*18));
        const prevI=Math.floor((h.t-dt-.3)/seg);if(i!==prevI&&i>0){fx.ping();C.burst(flyShield,6);}
      }
    }else alive(c,holder,root,t,2);
  };

  return h;
}

/* ===================================================================
   WEB KID — red & blue web suit with raised web lines, big 3D lenses
   =================================================================== */
function lensShape(sd){ const s=new THREE.Shape(); s.moveTo(-sd*.028,-.045); s.quadraticCurveTo(sd*.053,-.045,sd*.048,.057); s.quadraticCurveTo(sd*.012,.04,-sd*.028,-.045); return s; }
function makeWeb(holder,anchorLocal){
  const red=0xc8141e, blue=0x1d3f9e;
  const web=p=>figMat({roughness:.72,envMap:ENV,detail:DT.web,detailScale:p||6,detailMode:1,detailMix:.45});
  const mats={ torso:web(5), head:web(7), arm:web(7), leg:web(6) };
  const c=figure({ cols:{ pelvis:blue, belt:blue, belly:red, chest:red, side:blue, back:red, neck:red, deltoid:red, upper:red, fore:red, cuff:red, hand:red, thigh:blue, shin:blue, boot:red,
    skull:red, brow:red, face:red, jaw:red, ear:red }, mats },{ face:'mask', bootH:.3, bulk:.94, continuousArms:true, refined:true });
  const root=new THREE.Group(); holder.add(root); root.add(c.g);
  /* 3D lenses: white lens on a black rim, angled up and out */
  [-1,1].forEach(sd=>{
    const rim=shapeMesh(c.head,lensShape(sd),cloth(0x121218,{roughness:.5}),sd*.058,.035,.142); rim.scale.set(1.25,1.25,1); rim.rotation.y=sd*.4; rim.rotation.z=sd*-.35;
    const lens=shapeMesh(c.head,lensShape(sd),std({color:0xffffff,roughness:.25,metalness:.1}),sd*.06,.037,.15); lens.rotation.y=sd*.4; lens.rotation.z=sd*-.35;
  });
  const black=cloth(0x111827);
  const emblem=new THREE.Group();emblem.position.y=-1.48;c.torso.add(emblem);
  const abdomen=ball(emblem,.024,black,0,1.36,.151,14);abdomen.scale.set(.75,1.8,.4);
  ball(emblem,.015,black,0,1.41,.16,12);
  [-1,1].forEach(sd=>{for(let i=0;i<4;i++){
    const pts=[new THREE.Vector3(sd*.009,1.39-i*.013,.16),new THREE.Vector3(sd*(.055+i*.009),1.44-i*.047,.14),new THREE.Vector3(sd*(.07+i*.01),1.49-i*.068,.12)];
    mesh(emblem,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),8,.004,5),black);
  }});
  for(let i=0;i<10;i++){
    const a=i/10*TAU,points=[];
    for(let j=0;j<=12;j++){const k=j/12,px=Math.cos(a)*.12*k,py=-.025+Math.sin(a)*.15*k;const z=.127*Math.sqrt(Math.max(.05,1-px*px/.0225-(py-.005)*(py-.005)/.04))+.004;points.push(new THREE.Vector3(px,py,z));}
    mesh(c.head,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),16,.0017,4),black);
  }
  /* A balanced ready stance: both forearms visible and naturally bent. */
  const crouch=k=>{ root.position.y=-.1*k; c.legs[0].rotation.x=-.5*k; c.legs[1].rotation.x=-.2*k; c.legs.forEach((l,i)=>l.rotation.z=(i?-1:1)*-.14*k);
    c.knees.forEach(n=>n.rotation.x=.75*k); c.feet.forEach(f=>f.rotation.x=-.25*k); c.torso.rotation.x=.3*k;
    c.arms[0].rotation.x=-.25*k; c.arms[0].rotation.z=-.25*k-.14; c.elbows[0].rotation.x=-.85*k;
    c.arms[1].rotation.x=-.1*k; c.arms[1].rotation.z=.2*k+.14; c.elbows[1].rotation.x=-.65*k; };
  crouch(1);
  const line=mesh(holder,new THREE.CylinderGeometry(.012,.012,1,6),glow(0xf4f4f4),0,0,0,false); line.visible=false;
  const h={ holder, root, c, phase:'idle', t:0 };
  const up=new THREE.Vector3(0,1,0), d=new THREE.Vector3();
  const setLine=(from,to)=>{ d.subVectors(to,from); const Ln=d.length(); line.position.copy(from).addScaledVector(d,.5); line.quaternion.setFromUnitVectors(up,d.normalize()); line.scale.set(1,Ln,1); };
  const HANG=2.05, Lw=.9;
  h.tap=()=>{ if(h.phase!=='idle') return; h.phase='web'; h.t=0; h.a=anchorLocal(holder); fx.thwip(); C.say(L.web); };
  h.update=(dt,t)=>{
    if(h.phase!=='web'){ alive(c,holder,root,t,3); root.position.y=-.1+Math.sin(t*2.4)*.01; return; }
    h.t+=dt; const a=h.a;
    crouch(0); c.arms[1].rotation.x=-2.9; c.arms[0].rotation.x=-.4; c.torso.rotation.x=0;
    const hangBase=new THREE.Vector3(a.x,a.y-Lw-HANG,a.z);
    if(h.t<.3){                       /* shoot the web */
      line.visible=true; const hp=handLocal(c,1,holder);
      setLine(hp,hp.clone().lerp(a,h.t/.3));
    }else if(h.t<1){                  /* zip up */
      const f=ease((h.t-.3)/.7);
      root.position.lerpVectors(new THREE.Vector3(0,0,0),hangBase,f);
      root.position.y+=Math.sin(f*Math.PI)*.6;
      setLine(handLocal(c,1,holder),a);
    }else if(h.t<3.6){                /* swing */
      const th=Math.sin((h.t-1)*3.2)*.7*Math.min(1,(3.6-h.t)*1.2+.2), R=Lw+HANG;
      root.position.set(a.x+Math.sin(th)*R,a.y-Math.cos(th)*R,a.z);
      root.rotation.z=th;
      c.legs.forEach((l,i)=>l.rotation.x=Math.sin((h.t-1)*3.2+i)*.4);
      setLine(handLocal(c,1,holder),a);
      if(Math.floor((h.t-1)*3.2/Math.PI)!==Math.floor((h.t-dt-1)*3.2/Math.PI)) fx.whoosh(.05);
    }else if(h.t<4.3){                /* let go, flip and drop home */
      if(line.visible){ line.visible=false; fx.thwip(); }
      const f=ease((h.t-3.6)/.7);
      root.position.lerpVectors(hangBase,new THREE.Vector3(0,0,0),f); root.position.y+=Math.sin(f*Math.PI)*.8;
      root.rotation.z=lerp(root.rotation.z,0,.2); root.rotation.x=f*TAU;
    }else{
      h.phase='idle'; root.rotation.set(0,0,0); crouch(1); C.burst(root,10);
    }
  };
  return h;
}

/* ===================================================================
   THOR — the Norse thunder god: dark armour with silver discs, red
   cape, long golden hair and beard, and his short-handled hammer
   =================================================================== */
function hammer(parent){
  const g=new THREE.Group(); parent.add(g);
  const steel=metal(0x9aa6b1,{roughness:.38});
  roundedBox(g,.245,.145,.145,.012,steel,0,.235,0);
  [-1,1].forEach(sd=>{
    roundedBox(g,.012,.12,.12,.005,metal(0x667585),sd*.13,.235,0);
    const rune=box(g,.003,.075,.008,metal(0x4d5966),sd*.137,.235,0);rune.rotation.x=.3;
  });
  cyl(g,.018,.021,.29,cloth(0x553827),0,.015,0,18);
  for(let i=0;i<9;i++)cyl(g,.022,.022,.008,cloth(0x916744),0,-.112+i*.03,0,18);
  cyl(g,.025,.025,.016,steel,0,-.14,0,18);
  const strap=mesh(g,new THREE.TorusGeometry(.034,.004,6,20),cloth(0x543a2b),0,-.18,0);strap.scale.y=1.3;

  return g;
}
function bolt(from,to,mat){
  const pts=[], n=9;
  for(let i=0;i<=n;i++){ const k=i/n, p=from.clone().lerp(to,k); if(i>0&&i<n){ p.x+=rand(-.35,.35); p.z+=rand(-.35,.35); } pts.push(p); }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,'catmullrom',.1),40,.034,5),mat);
}
function makeThor(holder){
  const dark=0x24262e, plate=0x363b47, silver=0xc4cad4, skin=0xd7ac8b, hair=0x88673e, beard=0x886848;
  const dec=decal(x=>{
    x.fillStyle='#3a404d'; x.beginPath(); x.moveTo(-.19,1.58); x.lineTo(.19,1.58); x.lineTo(.16,1.3); x.lineTo(-.16,1.3); x.closePath(); x.fill();
    x.strokeStyle='rgba(150,160,180,.5)'; x.lineWidth=.004; x.beginPath(); x.moveTo(0,1.58); x.lineTo(0,1.0); x.stroke();
    x.fillStyle='#5a3a22'; x.fillRect(-.3,.97,.6,.07); x.fillStyle='#b8bec8'; x.fillRect(-.035,.975,.07,.06);
  });
  const mats={ torso:figMat({metalness:.5,roughness:.5,envMap:ENV,decal:dec,decalRect:DECAL_RECT,detail:DT.mail,detailScale:9,detailMode:3,detailMix:.7}),
    head:figMat({roughness:.7,envMap:ENV}), arm:figMat({metalness:.3,roughness:.6,envMap:ENV,detail:DT.leather,detailScale:6,detailMix:.6}), leg:figMat({metalness:.2,roughness:.65,envMap:ENV,detail:DT.leather,detailScale:6,detailMix:.6}) };
  const c=figure({ cols:{ pelvis:dark, belt:0x5a3a22, belly:plate, chest:plate, side:dark, back:dark, neck:skin, deltoid:skin, upper:skin, fore:skin, cuff:silver, hand:skin, thigh:dark, shin:dark, boot:0x1a1b22,
    skull:skin, brow:skin, face:skin, jaw:skin, ear:skin, hair:0xa8742e, iris:0x3d7fd0 }, mats },{ face:'open', heroFace:true, bootH:.28, bulk:1.12, continuousArms:true, refined:true });
  const root=new THREE.Group(); holder.add(root); root.add(c.g);
  stance(c,{forward:.12,spread:.16,twist:-.08,armL:.1,armR:.25,elbowL:-.3,elbowR:-.5});
  const beardM=cloth(beard,{roughness:.95,transparent:true,opacity:.5,depthWrite:false}),silverM=metal(silver,{roughness:.34});
  const faceZ=(x,y)=>.129-.8*x*x-.45*(y+.02)*(y+.02);
  const beardShape=outline([[-.089,-.079],[-.073,-.113],[-.042,-.14],[.042,-.14],[.073,-.113],[.089,-.079],[.07,-.091],[.041,-.119],[-.041,-.119],[-.07,-.091]]);
  curvedPanel(c.head,beardShape,beardM,faceZ,.002);
  [-1,1].forEach(sd=>curvedPanel(c.head,outline([[sd*.003,-.055],[sd*.022,-.055],[sd*.037,-.063],[sd*.032,-.067],[sd*.009,-.062]]),beardM,faceZ,.005));
  [-1,1].forEach(sd=>{
    cyl(c.elbows[sd<0?0:1],.059,.048,.15,metal(0x697483),0,-.21,0,24);
    for(const y of [-.145,-.19,-.25])cyl(c.elbows[sd<0?0:1],.061,.061,.009,silverM,0,y,0,24);
  });
  [[1.50,.17,.046],[1.38,.16,.041],[1.26,.145,.035]].forEach(([y,z,r])=>[-1,1].forEach(sd=>{const disc=cyl(c.g,r,r,.012,silverM,sd*.105,y,z,28);disc.rotation.x=H;}));
  const hairM=cloth(hair,{roughness:.85}),highlightM=cloth(0xb08c59,{roughness:.86});
  // Follow the actual skull surface, with a curved, off-centre hairline.
  // A spherical cap left a straight overhanging fringe like a headdress.
  const scalp=c.skull.geometry,scalpPos=scalp.getAttribute('position'),scalpNormal=scalp.getAttribute('normal'),scalpIndex=scalp.index,hairPositions=[],hairNormals=[];
  const hairline=v=>{const front=Math.min(1,Math.max(0,v.p.z)/.13);return v.p.y-(-.1+.21*Math.pow(front,1.7)+.012*v.p.x/.14);};
  const scalpVertex=i=>({p:new THREE.Vector3().fromBufferAttribute(scalpPos,i),n:new THREE.Vector3().fromBufferAttribute(scalpNormal,i)});
  const intersection=(a,b)=>{
    let lo=0,hi=1;const sign=hairline(a)>0;
    for(let i=0;i<16;i++){const k=(lo+hi)/2,p=a.p.clone().lerp(b.p,k);if((hairline({p})>0)===sign)lo=k;else hi=k;}
    const k=(lo+hi)/2;return{p:a.p.clone().lerp(b.p,k),n:a.n.clone().lerp(b.n,k).normalize()};
  };
  const hairVertex=v=>{hairPositions.push(v.p.x*1.025,v.p.y*1.015,v.p.z*1.025);hairNormals.push(v.n.x,v.n.y,v.n.z);};
  for(let i=0;i<scalpIndex.count;i+=3){
    const tri=[0,1,2].map(j=>scalpVertex(scalpIndex.getX(i+j))),poly=[];
    for(let j=0;j<3;j++){const a=tri[(j+2)%3],b=tri[j],insideA=hairline(a)>0,insideB=hairline(b)>0;if(insideA!==insideB)poly.push(intersection(a,b));if(insideB)poly.push(b);}
    for(let j=1;j<poly.length-1;j++){hairVertex(poly[0]);hairVertex(poly[j]);hairVertex(poly[j+1]);}
  }
  const crownGeo=new THREE.BufferGeometry();crownGeo.setAttribute('position',new THREE.Float32BufferAttribute(hairPositions,3));crownGeo.setAttribute('normal',new THREE.Float32BufferAttribute(hairNormals,3));mesh(c.head,crownGeo,hairM);
  // Locks sweep away from an off-centre part and stay behind the cheeks.
  for(let i=0;i<16;i++){
    const a=Math.PI+i/15*Math.PI,x=Math.cos(a),z=Math.sin(a);
    const pts=[new THREE.Vector3(x*.085,.14,z*.07-.02),new THREE.Vector3(x*.143,.055,z*.12-.015),new THREE.Vector3(x*.15,-.11,z*.14-.025),new THREE.Vector3(x*.158,-.235+(i%3)*.009,z*.12-.03),new THREE.Vector3(x*.145,-.285+(i%4)*.012,z*.10-.04)];
    mesh(c.head,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,.014+(i%3)*.002,8),i%4===0?highlightM:hairM);
  }
  for(let i=0;i<5;i++){
    const k=i/4,pts=[new THREE.Vector3(-.055+k*.018,.145,.082-k*.012),new THREE.Vector3(.012+k*.035,.176,.045-k*.025),new THREE.Vector3(.107+k*.008,.116,-.009-k*.023),new THREE.Vector3(.132,.025,-.05-k*.015)];
    mesh(c.head,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),18,.012,8),i%2?hairM:highlightM);
  }
  [-1,1].forEach(sd=>{
    const pts=[new THREE.Vector3(sd*.095,.1,.065),new THREE.Vector3(sd*.139,.012,.015),new THREE.Vector3(sd*.147,-.12,-.025),new THREE.Vector3(sd*.148,-.23,-.045)];
    mesh(c.head,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),18,.017,8),hairM);
  });
  const cape=clothCape(c.g,cloth(0x982d36,{side:THREE.DoubleSide,roughness:.88}),1.56,1.3,.235,.39);
  [-1,1].forEach(sd=>cyl(c.g,.04,.04,.02,silverM,sd*.22,1.55,.13,14).rotation.x=H);
  const ham=hammer(c.hands[1]);ham.rotation.set(.1,0,-1.12);
  const fly=hammer(holder); fly.visible=false;
  const boltM=new THREE.MeshBasicMaterial({color:0xa8d4ff,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false});
  const flash=new THREE.Sprite(new THREE.SpriteMaterial({map:texOf(64,64,(x)=>{ const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(235,245,255,1)'); g.addColorStop(1,'rgba(160,200,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); }),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
  flash.scale.set(1.6,1.6,1); holder.add(flash);
  let bolts=[];
  const clearBolts=()=>{ bolts.forEach(b=>{ holder.remove(b); b.geometry.dispose(); }); bolts=[]; };
  const h={ holder, root, c, phase:'idle', t:0, n:0, path:null };
  const tmp=new THREE.Vector3();
  const rest=()=>{ root.position.y=0; stance(c,{forward:.12,spread:.16,twist:-.08,armL:.1,armR:.25,elbowL:-.3,elbowR:-.5}); };
  h.tap=()=>{
    if(h.phase!=='idle') return;
    h.t=0;
    if(h.n++%2===0){ h.phase='bolt'; C.say(L.thorBolt); }
    else { h.phase='throw'; C.say(L.thorThrow);
      const s=handLocal(c,1,holder);
      const zp=(x,y,z)=>holder.worldToLocal(zoneG.localToWorld(new THREE.Vector3(x,y,z)));
      h.path=[s,zp(0,2.4,2.2),zp(2.6,1.8,.4),s.clone()]; }
  };
  h.update=(dt,t)=>{
    cape.rotation.x=-.06+Math.sin(t*1.3)*.035; cape.scale.z=1+Math.sin(t*1.1+1)*.03;
    if(h.phase==='bolt'){
      h.t+=dt;
      const up=ease(clamp(h.t/.4,0,1)), down=ease(clamp((h.t-2.2)/.4,0,1)), k=up*(1-down);
      c.arms[1].rotation.x=.25-3.2*k; c.elbows[1].rotation.x=-.5*(1-k); c.arms[1].rotation.z=-.14;
      c.head.rotation.x=-.4*k; root.position.y=.25*k; cape.rotation.x-=.3*k;
      if(h.t>.45 && h.t<2.1){
        if(Math.floor(h.t*12)!==Math.floor((h.t-dt)*12)){
          clearBolts();
          const top=handLocal(c,1,holder).add(new THREE.Vector3(0,.3,0));
          for(let i=0;i<2;i++){ const b=bolt(top.clone().add(new THREE.Vector3(rand(-1.5,1.5),7,rand(-1.5,1.5))),top,boltM); holder.add(b); bolts.push(b); }
          const arc=bolt(top,new THREE.Vector3(rand(-.4,.4),rand(.8,1.4),rand(-.2,.3)),boltM); holder.add(arc); bolts.push(arc);
          flash.position.copy(top); flash.material.opacity=rand(.5,1);
        }
        if(h.t-dt<=.45) fx.thunder();
        if(Math.floor(h.t*3)!==Math.floor((h.t-dt)*3)) fx.crackle();
      }else{ if(bolts.length) clearBolts(); flash.material.opacity*=.85; }
      if(h.t>=2.6){ h.phase='idle'; clearBolts(); flash.material.opacity=0; rest(); c.head.rotation.x=0; }
    }else if(h.phase==='throw'){
      h.t+=dt;
      const wind=clamp(h.t/.3,0,1);
      c.arms[1].rotation.x = h.t<.3 ? .25-2.6*wind : -1.6;
      c.torso.rotation.y = h.t<.3 ? -.4*wind : -.1;
      if(h.t>=.3){
        ham.visible=false; fly.visible=true;
        const seg=.55, u=(h.t-.3)/seg, i=Math.floor(u);
        if(i>=h.path.length-1){ h.phase='idle'; fly.visible=false; ham.visible=true; rest(); fx.thunder(); C.burst(root,10); return; }
        const a=h.path[i], b=h.path[i+1], f=ease(u-i);
        tmp.lerpVectors(a,b,f); tmp.y+=Math.sin(f*Math.PI)*.3;
        fly.position.copy(tmp); fly.rotation.set(t*16,0,H);
        if(Math.floor(h.t*4)!==Math.floor((h.t-dt)*4)) fx.whoosh(.09);
      }
    }else{
      alive(c,holder,root,t,5);
    }
  };
  return h;
}

/* ===================================================================
   MONKEY KING (Sun Wukong) — golden armour, phoenix-feather cap,
   red cape, tiger-skin skirt, magic staff and flying cloud
   =================================================================== */
function tigerTex(){
  return texOf(512,128,(x)=>{
    x.fillStyle='#e8902a'; x.fillRect(0,0,512,128);
    x.fillStyle='#24180f';
    for(let i=0;i<28;i++){ x.beginPath(); const X=i*18+5; x.moveTo(X,0); x.quadraticCurveTo(X+10,40,X+3,88); x.lineTo(X+8,0); x.closePath(); x.fill(); }
    x.fillStyle='#f6e2b8'; x.fillRect(0,112,512,16);
  });
}
function featherTex(){ return texOf(256,16,(x)=>{ for(let i=0;i<16;i++){ x.fillStyle=i%2?'#f2e6c8':'#7a3a1e'; x.fillRect(i*16,0,16,16); } }); }
function cloudPuff(parent){
  const g=new THREE.Group(); parent.add(g);
  const w=std({color:0xfffaf0,roughness:.9,envMapIntensity:.6}), p=std({color:0xffe0ef,roughness:.9,envMapIntensity:.6});
  [[0,0,0,.5],[.45,.04,.1,.38],[-.45,.03,-.05,.4],[.14,.14,-.3,.34],[-.18,.12,.3,.36],[.3,.1,-.15,.3]].forEach(([x,y,z,r],i)=>{ const b=ball(g,r,i%2?p:w,x,y,z,16); b.scale.y=.55; });
  const tail=ball(g,.24,w,-.9,.02,0,12); tail.scale.set(1.5,.5,.8);
  const tail2=ball(g,.14,w,-1.25,.06,.05,10); tail2.scale.set(1.4,.5,.8);
  return g;
}
function makeMonkey(holder){
  const fur=0x6b4320, gold=0xd9a52a, redC=0xb31a1a, dark=0x24222c, peach=0xf6d7b0;
  const dec=decal(x=>{
    x.fillStyle='#b31a1a'; x.fillRect(-.3,1.0,.6,.06);
    x.strokeStyle='#e9c24a'; x.lineWidth=.014; x.beginPath(); x.arc(0,1.4,.085,0,TAU); x.stroke();
  });
  const mats={ torso:figMat({metalness:.6,roughness:.4,envMap:ENV,decal:dec,decalRect:DECAL_RECT,detail:DT.scales,detailScale:7,detailMix:.6}),
    head:figMat({roughness:.75,envMap:ENV}), arm:figMat({metalness:.4,roughness:.5,envMap:ENV}), leg:figMat({roughness:.7,envMap:ENV}) };
  const c=figure({ cols:{ pelvis:redC, belt:redC, belly:gold, chest:gold, side:gold, back:gold, neck:fur, deltoid:gold, upper:redC, fore:gold, cuff:gold, hand:fur, thigh:dark, shin:dark, boot:0x16161c,
    skull:fur, brow:peach, face:peach, jaw:peach, ear:peach, hair:0x4a2a10, iris:0xf2b51e }, mats },{ face:'open', bootH:.22, bulk:.96 });
  const root=new THREE.Group(); holder.add(root); root.add(c.g);
  stance(c,{forward:.2,spread:.18,twist:.12,armL:-.2,armR:.3,elbowL:-.6,elbowR:-1.3});
  const goldM=metal(gold,{roughness:.3}), furM=cloth(fur);
  /* muzzle, big round ears */
  const muzzle=ball(c.head,.065,cloth(peach),0,-.06,.125,16); muzzle.scale.set(1.2,.7,.6);
  [-1,1].forEach(sd=>{ const e=ball(c.head,.05,furM,sd*.15,.0,-.02,14); e.scale.set(.45,1,.9); ball(c.head,.03,cloth(peach),sd*.155,0,-.01,10).scale.set(.4,1,.8); });
  /* golden headband + phoenix-wing crown + two long pheasant feathers */
  const band=new THREE.Mesh(new THREE.TorusGeometry(.15,.012,8,40),goldM); band.rotation.x=H-.15; band.position.y=.06; c.head.add(band);
  mesh(c.head,new THREE.SphereGeometry(.158,32,12,0,TAU,0,.95),goldM,0,.012,-.008);
  ball(c.head,.022,std({color:0xd8182a,metalness:.2,roughness:.15}),0,.105,.14,12);
  [-1,1].forEach(sd=>{ const w=mesh(c.head,new THREE.ConeGeometry(.04,.16,4),goldM,sd*.15,.1,-.02); w.rotation.z=sd*-1.1; w.scale.z=.3; });
  const fTex=featherTex();
  [-1,1].forEach(sd=>{
    const pts=[]; for(let i=0;i<=12;i++){ const k=i/12; pts.push(new THREE.Vector3(sd*(.05+k*.38),.13+k*1.05-k*k*.35,.06-k*.62)); }
    mesh(c.head,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,.011,6),cloth(0xffffff,{map:fTex,bump:false}),0,0,0,false);
  });
  /* chest mirror, cape, tiger-skin skirt, tail */
  const mirrorM=cyl(c.g,.07,.07,.015,metal(0xe8eef4,{roughness:.1,metalness:1}),0,1.4,.16,28); mirrorM.rotation.x=H;
  const cape=mesh(c.g,new THREE.CylinderGeometry(.27,.4,1.05,24,1,true,Math.PI*.62,Math.PI*.76),cloth(0xa8141a,{side:THREE.DoubleSide,roughness:.7}),0,1.02,-.03);
  const skirt=mesh(c.g,new THREE.CylinderGeometry(.22,.29,.3,28,1,true),cloth(0xffffff,{map:tigerTex(),side:THREE.DoubleSide,bump:false}),0,.82,0); skirt.scale.z=.85;
  const tp=[]; for(let i=0;i<=12;i++){ const k=i/12; tp.push(new THREE.Vector3(Math.sin(k*3)*.15,.86+k*.55+Math.sin(k*4)*.08,-.18-k*.4)); }
  mesh(c.g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tp),24,.025,8),furM,0,0,0);
  /* the magic staff (red with gold ends), resting on the right shoulder */
  const staff=new THREE.Group(); c.hands[1].add(staff); staff.rotation.x=-.9; staff.rotation.z=.3;
  const LEN=1.6;
  const pole=cyl(staff,.026,.026,LEN,std({color:0xa8141a,metalness:.3,roughness:.35}),0,0,0,14);
  const capT=cyl(staff,.034,.034,.18,goldM,0,LEN/2-.06,0,14), capB=cyl(staff,.034,.034,.18,goldM,0,-LEN/2+.06,0,14);
  const cloud=cloudPuff(holder); const CLOUD_HOME=new THREE.Vector3(-1.05,.3,.25); cloud.position.copy(CLOUD_HOME);
  const forms=[];
  { const f=new THREE.Group(); cyl(f,.1,.15,.8,cloth(0x7a5232),0,.4,0,10); [[0,1.2,.5],[.28,.95,.34],[-.28,.98,.34],[0,.9,.3]].forEach(([x,y,r])=>ball(f,r,cloth(0x4f9e4c),x,y,0,14)); forms.push(f); }
  { const f=new THREE.Group(), bm=cloth(0x4f8fe0); const b=ball(f,.26,bm,0,1.1,0,16); b.scale.set(1,.85,1.25); ball(f,.16,bm,0,1.32,.22,14);
    const bk=mesh(f,new THREE.ConeGeometry(.05,.15,8),cloth(0xffa32e),0,1.31,.42); bk.rotation.x=H;
    [-1,1].forEach(sd=>{ ball(f,.025,glow(0x16161c),sd*.07,1.36,.35,8); });
    f.userData.wings=[-1,1].map(sd=>{ const w=mesh(f,new THREE.CircleGeometry(.3,3),cloth(0x8fc0ff,{side:THREE.DoubleSide}),sd*.24,1.15,0,false); w.rotation.x=-H; return w; });
    forms.push(f); }
  { const f=new THREE.Group(), pm=std({color:0xffa8a0,roughness:.6,envMapIntensity:.5}); const pch=ball(f,.46,pm,0,.48,0,24); pch.scale.y=1.05;
    const tip=mesh(f,new THREE.ConeGeometry(.14,.24,12),pm,0,.96,0); tip.rotation.x=.2;
    [-1,1].forEach(sd=>{ const l=ball(f,.16,cloth(0x5cb56f),sd*.16,.96,0,10); l.scale.set(1,.3,.55); });
    [-1,1].forEach(sd=>ball(f,.035,glow(0x16161c),sd*.14,.56,.42,10));
    const sm=new THREE.Mesh(new THREE.TorusGeometry(.07,.014,6,14,Math.PI),glow(0x6a2a1a)); sm.rotation.z=Math.PI; sm.position.set(0,.42,.44); f.add(sm);
    forms.push(f); }
  forms.forEach(f=>{ f.visible=false; holder.add(f); });

  const h={ holder, root, c, phase:'idle', t:0, n:0, form:null };
  const wp=new THREE.Vector3(), lp=new THREE.Vector3(), prev=new THREE.Vector3();
  const ridePos=(f,out)=>{
    holder.localToWorld(lp.set(0,0,0));
    const a=Math.atan2(lp.z,lp.x)+f;
    wp.set(Math.cos(a)*24,8,Math.sin(a)*24);
    return holder.worldToLocal(out.copy(wp));
  };
  const resetStaff=()=>{ staff.rotation.set(-.9,0,.3); pole.scale.y=1; pole.position.y=0; capT.position.y=LEN/2-.06; };
  const rest=()=>{ root.position.set(0,0,0); root.rotation.set(0,0,0); stance(c,{forward:.2,spread:.18,twist:.12,armL:-.2,armR:.3,elbowL:-.6,elbowR:-1.3}); };
  h.tap=()=>{
    if(h.phase!=='idle') return;
    const k=h.n++%3; h.t=0;
    if(k===0){ h.phase='cloud'; fx.chime(); C.say(L.cloud); }
    else if(k===1){ h.phase='staff'; fx.grow(); C.say(L.staff); }
    else { h.phase='change'; h.form=forms[Math.floor(rand(0,forms.length))]; fx.poof(); C.say(L.change); }
  };
  h.update=(dt,t)=>{
    cape.rotation.x=-.05+Math.sin(t*1.5+2)*.03;
    if(h.phase==='cloud'){
      h.t+=dt; const T=10, A=1.4, D=1.4;
      if(h.t<.5){ cloud.position.lerpVectors(CLOUD_HOME,new THREE.Vector3(0,-.05,0),ease(h.t/.5)); root.position.y=Math.sin(h.t/.5*Math.PI)*.5; }
      else{
        let p;
        if(h.t<.5+A){ const f=ease((h.t-.5)/A); p=ridePos(0,new THREE.Vector3()).multiplyScalar(f); }
        else if(h.t<T-D){ p=ridePos(ease((h.t-.5-A)/(T-D-.5-A))*TAU,new THREE.Vector3()); }
        else { const f=ease(clamp((h.t-(T-D))/D,0,1)); p=ridePos(TAU,new THREE.Vector3()).multiplyScalar(1-f); }
        prev.copy(root.position); root.position.copy(p);
        const dx=p.x-prev.x, dz=p.z-prev.z; if(dx*dx+dz*dz>1e-6) root.rotation.y=Math.atan2(dx,dz);
        cloud.position.copy(p).add(new THREE.Vector3(0,-.05,0));
        c.arms[0].rotation.x=-.6; c.arms[1].rotation.x=-1.2; c.legs.forEach(l=>l.rotation.x=-.9); c.knees.forEach(k=>k.rotation.x=1.3);
        if(Math.floor(h.t*1.5)!==Math.floor((h.t-dt)*1.5)) fx.whoosh(.05);
      }
      if(h.t>=T){ h.phase='idle'; rest(); c.knees.forEach(k=>k.rotation.x=0); cloud.position.copy(CLOUD_HOME); fx.chime(); }
    }else if(h.phase==='staff'){
      h.t+=dt;
      const k=ease(clamp(h.t/.3,0,1));
      c.arms[1].rotation.x=.3-3.1*k; c.elbows[1].rotation.x=-1.3*(1-k); staff.rotation.x=-.9*(1-k); staff.rotation.z=.3*(1-k);
      const grow = h.t<1 ? ease(clamp((h.t-.2)/.8,0,1)) : h.t<2 ? 1 : 1-ease(clamp((h.t-2)/.6,0,1));
      const s=1+grow*4;
      pole.scale.y=s; pole.position.y=LEN/2*(s-1); capT.position.y=LEN*s-LEN/2-.06;
      if(h.t>2.6){ staff.rotation.z=(h.t-2.6)*14; c.arms[1].rotation.x=-1.4; }
      if(h.t>=3.8){ h.phase='idle'; resetStaff(); rest(); }
    }else if(h.phase==='change'){
      h.t+=dt;
      if(h.t<.15){ root.scale.setScalar(1-h.t/.15*.99); }
      else if(h.t<3){ root.visible=false; h.form.visible=true; h.form.scale.setScalar(Math.min(1,(h.t-.15)/.2));
        if(h.t-dt<.15) C.burst(root,16);
        if(h.form.userData.wings){ h.form.userData.wings.forEach((w,i)=>w.rotation.y=Math.sin(t*20)*.7*(i?1:-1)); h.form.position.y=.2+Math.sin(t*4)*.15; }
        else h.form.rotation.y=Math.sin(t*3)*.15; }
      else { if(h.form.visible){ h.form.visible=false; root.visible=true; fx.poof(); C.burst(root,16); }
        root.scale.setScalar(Math.min(1,(h.t-3)/.2+.01));
        if(h.t>3.25){ h.phase='idle'; root.scale.setScalar(1); h.form.position.y=0; } }
    }else{
      alive(c,holder,root,t,4);
      cloud.position.y=CLOUD_HOME.y+Math.sin(t*1.6)*.06;
    }
  };
  return h;
}

/* ===================================================================
   the zone itself: a glossy stage with spotlights, a banner arch
   (Web Kid's swing bar)
   =================================================================== */
function bannerTex(){
  return texOf(512,128,(x)=>{
    x.fillStyle='#24346e'; x.fillRect(0,0,512,128);
    x.strokeStyle='#ffd23f'; x.lineWidth=8; x.strokeRect(8,8,496,112);
    x.textAlign='center'; x.textBaseline='middle'; x.fillStyle='#ffd23f';
    x.font='900 54px "Baloo 2",sans-serif'; x.fillText('★ HERO BASE ★',256,46);
    x.fillStyle='#ffffff'; x.font='900 40px "Noto Sans TC","PingFang TC",sans-serif'; x.fillText('滿滿英雄基地',256,98);
  });
}
const ARCH_Z=-4.6, ARCH_H=3.9, ARCH_W=6;

export const heroesScene = {
  id:'herobase',
  angle:225,
  color:0xe0483a,
  content:{
    en:{ icon:'🦸', t:'Hero Base', sub:'Max\'s super friends',
      body:"Max loves Optimus Prime, Bumblebee and Elita-1! Meet them and their powerful rival Megatron, alongside Iron Man, Thor, Captain America, Spider-Man and Sun Wukong the Monkey King. Here they are as cartoon friends: a yellow racer, a pink motorcycle, a big red-and-blue truck and a silver tank that all turn into robots, a red-and-gold flyer, Thor the thunder god with his magic hammer, a hero with a bouncing star shield, a web-swinging kid, and the Monkey King with his magic staff and flying cloud. On the lawn to the right of the stage, the glowing Ultra Tower opens Max's Ultra family cards. Real heroes are brave and kind and help others — just like Max. Tap a hero to see their super power!",
      chips:['Brave hearts','Helping others','Tap to transform!'] },
    zh:{ icon:'🦸', t:'英雄基地', sub:'Max 的超級好朋友',
      body:"Max 最喜歡擎天柱、大黃蜂和艾麗塔！在這裏，還可以認識他們強大的對手威震天，以及鋼鐵俠、雷神索爾、美國隊長、蜘蛛俠和齊天大聖孫悟空。在這裏，他們變成了卡通好朋友：會變身機械人的黃色跑車、粉紅電單車和紅藍大卡車、銀灰色坦克、紅金色的飛行俠、拿着神鎚召喚閃電的雷神、拿着星星盾牌的英雄、會盪蛛網的小俠，還有拿着金箍棒、踩着筋斗雲的美猴王。舞台右邊草地上發光的奧特光之塔，可以走進去看 Max 的奧特曼家族卡片。真正的英雄勇敢又善良，會幫助別人——就像 Max 一樣。點一點英雄，看看他們的超能力吧！",
      chips:['勇敢的心','幫助別人','點我變身！'] },
  },
  build(z, ctx){
    C=ctx; heroes.length=0;
    ENV=makeEnv(ctx.renderer);
    for(const k in DETAIL) DT[k]=DETAIL[k]();
    TIRE=std({color:0x1b1b1f,roughness:.85,envMapIntensity:.3}); CHROME=metal(0xe2e6ec,{metalness:1,roughness:.16});
    GLASS=std({color:0x223348,metalness:.2,roughness:.05,envMapIntensity:1.4}); DARK=metal(0x2a2c33,{roughness:.4});
    const g=new THREE.Group(); zoneG=g;
    /* glossy round stage with a gold rim and a star */
    const stage=mesh(g,new THREE.CylinderGeometry(4.7,4.9,.16,56),std({color:0x3a4663,metalness:.25,roughness:.32,envMapIntensity:.8}),0,.08,-1);
    stage.receiveShadow=true;
    const rim=new THREE.Mesh(new THREE.TorusGeometry(4.75,.07,8,64),metal(0xffd23f,{roughness:.3})); rim.rotation.x=H; rim.position.set(0,.17,-1); g.add(rim);
    const star=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(1.1,.45),{depth:.02,bevelEnabled:false}),metal(0xffd23f,{roughness:.3}));
    star.rotation.x=-H; star.position.set(0,.17,-1.4); g.add(star);
    /* banner arch at the back */
    [-1,1].forEach(sd=>{ cyl(g,.14,.18,ARCH_H,C.mat(0xc8202c),sd*ARCH_W/2,ARCH_H/2,ARCH_Z,12); ball(g,.22,C.mat(0xffd23f),sd*ARCH_W/2,ARCH_H+.12,ARCH_Z,12); });
    const bar=cyl(g,.1,.1,ARCH_W,C.mat(0x2a52b8),0,ARCH_H,ARCH_Z,10); bar.rotation.z=H;
    const ban=new THREE.Mesh(new THREE.BoxGeometry(3.2,.8,.06),[C.mat(0x24346e),C.mat(0x24346e),C.mat(0x24346e),C.mat(0x24346e),new THREE.MeshLambertMaterial({map:bannerTex()}),C.mat(0x24346e)]);
    ban.position.set(0,ARCH_H-.55,ARCH_Z); ban.castShadow=true; g.add(ban);
    [-1,1].forEach(sd=>cyl(g,.015,.015,.2,C.mat(0x3a3f4a),sd*1.4,ARCH_H-.1,ARCH_Z,4));
    /* stage spotlights on the arch: warm from the sides, cool from the middle */
    [[-2.6,0xfff0d8],[0,0xdfeeff],[2.6,0xfff0d8]].forEach(([x,col])=>{
      const sp=new THREE.SpotLight(col,26,13,.5,.8,1.5); sp.position.set(x,ARCH_H+.3,ARCH_Z+.6);
      sp.target.position.set(x*.7,1.1,-2.6); g.add(sp); g.add(sp.target);
      const lamp=cyl(g,.1,.14,.2,C.mat(0x2a2c33),x,ARCH_H+.2,ARCH_Z+.3,10); lamp.rotation.x=.9;
    });

    /* nine characters on a spaced arc, facing the middle of the zone */
    const order=['web','iron','thor','bee','elita','truck','megatron','shield','monkey'];
    const widths=[.7,.7,.65,1.5,.9,1.85,1.3,.7,.9],gap=.24,total=widths.reduce((a,b)=>a+b,0)+gap*(order.length-1);let cursor=-total/2;
    const animated=[];
    order.forEach((id,i)=>{
      const a=(cursor+widths[i]/2)*3/total;cursor+=widths[i]+gap;
      const holder=new THREE.Group();
      holder.position.set(Math.sin(a)*4.05,.16,-1-Math.cos(a)*3.1);
      holder.lookAt(0,.16,1.2);
      g.add(holder);
      let h;
      if(id==='bee'||id==='truck'||id==='elita'||id==='megatron'){ h=makeTransformer(id,holder); holder.rotation.y+=(id==='elita'||id==='megatron')?0:.5*(id==='bee'?-1:1); }
      else if(id==='iron') h=makeIron(holder);
      else if(id==='shield') h=makeShield(holder);
      else if(id==='thor') h=makeThor(holder);
      else if(id==='web') h=makeWeb(holder,hd=>hd.worldToLocal(g.localToWorld(new THREE.Vector3(-ARCH_W/2+1,ARCH_H,ARCH_Z))));
      else h=makeMonkey(holder);
      holder.userData.heroId=id;
      holder.userData.onTap=()=>h.tap();
      holder.traverse(o=>{ if(o.isMesh && !o.material.isMeshBasicMaterial) o.castShadow=true; });
      heroes.push(h); animated.push(holder);
    });
    g.userData.animated=animated;   /* keep these out of the static mesh merge */
    window.__heroes={ holders:animated, heroes };   /* for tinkering in the console */
    return g;
  },
  update(dt,t){ heroes.forEach(h=>h.update(dt,t)); },
  /* every spoken line with its hero's voice, for tools/make_voice.py */
  lines(){ const out=[]; for(const k in L) ['en','zh'].forEach((lang,i)=>out.push({ id:'heroes:'+k, lang, text:L[k][i], ...VOICE[L[k][2]][lang] })); return out; },
};
