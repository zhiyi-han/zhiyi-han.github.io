import * as THREE from 'three';
import { SITE_URL, AVATAR, ARTWORKS, I18N } from './i18n.js';
import { rand, clamp, lerpAngle, makeCanvas, canvasTexture, rr, crayon, crayonCircle } from './helpers.js';
import { EXTRA_SCENES } from './scenes/registry.js';
import { mergeStatic } from './perf.js';
import { createNarrator, textKey, silentWavURL } from './narrator.js';

let lang = 'en';
const T = () => I18N[lang];

/* =============== small helpers =============== */
const $ = s => document.querySelector(s);
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
/* paper background for placeholder drawings */
function paper(ctx,w,h){
  ctx.fillStyle='#fffdf4'; ctx.fillRect(0,0,w,h);
  ctx.globalAlpha=.05;
  for(let i=0;i<200;i++){ ctx.fillStyle=Math.random()<.5?'#c8b890':'#a0a8c0'; ctx.fillRect(rand(0,w),rand(0,h),2,2); }
  ctx.globalAlpha=1;
}

/* =============== ENGINE =============== */
let renderer;
try{
  renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
}catch(e){ $('#fallback').style.display='flex'; throw e; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch?1.75:2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = isTouch ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('#scene').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcdeffd, 62, 140);

const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, .1, 400);

/* sky dome: a sunny day sky, and a night sky that fades in over it */
const skyGrad=(stops)=>{ const c=makeCanvas(4,256), g=c.getContext('2d'), gr=g.createLinearGradient(0,0,0,256);
  stops.forEach(([o,col])=>gr.addColorStop(o,col)); g.fillStyle=gr; g.fillRect(0,0,4,256); return canvasTexture(c); };
const daySky=new THREE.Mesh(new THREE.SphereGeometry(190,24,18), new THREE.MeshBasicMaterial({ fog:false, side:THREE.BackSide,
  map:skyGrad([[0,'#4fb2ef'],[.55,'#a5dcf9'],[.78,'#dff4fd'],[1,'#eafff3']]) }));
scene.add(daySky);
const night=new THREE.Group(); night.visible=false; scene.add(night);
const nightSky=new THREE.Mesh(new THREE.SphereGeometry(188,24,18), new THREE.MeshBasicMaterial({ fog:false, side:THREE.BackSide, transparent:true, opacity:0, depthWrite:false,
  map:skyGrad([[0,'#060a24'],[.45,'#10194a'],[.72,'#27306e'],[.86,'#4a4a8c'],[1,'#5b5a96']]) }));
nightSky.renderOrder=-10;   /* draw the backdrop first so the stars stay on top of it */
night.add(nightSky);
{
  /* stars all over the upper sky, plus a dense Milky Way band across it */
  const N=1400, M=2600, pos=new Float32Array((N+M)*3), col=new Float32Array((N+M)*3), R=180;
  const put=(i,v,c)=>{ pos.set([v.x*R,v.y*R,v.z*R],i*3); col.set(c,i*3); };
  const v=new THREE.Vector3();
  for(let i=0;i<N;i++){
    do{ v.set(rand(-1,1),rand(-.05,1),rand(-1,1)); }while(v.lengthSq()>1||v.lengthSq()<.05);
    v.normalize(); const k=rand(.55,1); put(i,v,[k,k,k*rand(.92,1.08)]);
  }
  const axis=new THREE.Vector3(.35,.25,1).normalize(), u=new THREE.Vector3(1,0,-.35).normalize().cross(axis).normalize(), w=axis.clone().cross(u);
  for(let i=0;i<M;i++){
    const a=rand(0,Math.PI*2), off=(rand(-1,1)+rand(-1,1)+rand(-1,1))*.06;
    v.copy(u).multiplyScalar(Math.cos(a)).addScaledVector(w,Math.sin(a)).addScaledVector(axis,off).normalize();
    if(v.y<-.03) v.y=-v.y;
    const k=rand(.35,.8); put(N+i,v,[k*rand(.8,1),k*rand(.8,1),k]);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('color',new THREE.BufferAttribute(col,3));
  night.add(new THREE.Points(g,new THREE.PointsMaterial({ size:2.2, sizeAttenuation:false, vertexColors:true, fog:false, transparent:true, opacity:0, depthWrite:false })));
  /* soft glow clouds along the band */
  const glow=makeCanvas(128,128), gx=glow.getContext('2d'), rg=gx.createRadialGradient(64,64,0,64,64,64);
  rg.addColorStop(0,'rgba(190,170,255,.55)'); rg.addColorStop(1,'rgba(190,170,255,0)'); gx.fillStyle=rg; gx.fillRect(0,0,128,128);
  const gtex=canvasTexture(glow);
  for(let i=0;i<26;i++){
    const a=i/26*Math.PI*2;
    v.copy(u).multiplyScalar(Math.cos(a)).addScaledVector(w,Math.sin(a)).normalize(); if(v.y<0) continue;
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({ map:gtex, fog:false, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending }));
    sp.position.copy(v).multiplyScalar(175); const sc=rand(30,52); sp.scale.set(sc,sc*.6,1); night.add(sp);
  }
  /* the Moon, and Jupiter + Saturn as bright points */
  const disc=(size,draw)=>{ const c=makeCanvas(size,size); draw(c.getContext('2d'),size);
    return new THREE.Sprite(new THREE.SpriteMaterial({ map:canvasTexture(c), fog:false, transparent:true, opacity:0, depthWrite:false })); };
  const moon=disc(256,(x,S)=>{
    const h=x.createRadialGradient(S/2,S/2,S*.2,S/2,S/2,S/2); h.addColorStop(0,'rgba(255,248,220,.5)'); h.addColorStop(1,'rgba(255,248,220,0)');
    x.fillStyle=h; x.fillRect(0,0,S,S);
    x.fillStyle='#fff6d8'; x.beginPath(); x.arc(S/2,S/2,S*.22,0,7); x.fill();
    x.fillStyle='rgba(200,190,160,.45)'; [[.44,.44,.05],[.56,.55,.035],[.47,.6,.03],[.58,.42,.025]].forEach(([cx,cy,r])=>{ x.beginPath(); x.arc(S*cx,S*cy,S*r,0,7); x.fill(); });
  });
  moon.position.set(52,74,-118); moon.scale.set(40,40,1); night.add(moon);
  const planet=(c1,c2,ring)=>disc(64,(x,S)=>{
    const h=x.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2); h.addColorStop(0,c1); h.addColorStop(.25,c2); h.addColorStop(1,'rgba(0,0,0,0)');
    x.fillStyle=h; x.fillRect(0,0,S,S);
    if(ring){ x.strokeStyle='rgba(255,236,190,.8)'; x.lineWidth=2; x.beginPath(); x.ellipse(S/2,S/2,S*.32,S*.1,-.35,0,7); x.stroke(); } });
  const jup=planet('#fff4e0','rgba(240,205,160,.9)'); jup.position.set(-70,62,-120); jup.scale.set(7,7,1); night.add(jup);
  const sat=planet('#fff8e6','rgba(240,220,170,.85)',true); sat.position.set(-120,48,30); sat.scale.set(8,8,1); night.add(sat);
}

/* lights (sunlight by day, cool moonlight at night) */
const hemi=new THREE.HemisphereLight(0xcfe8ff, 0x86c46f, 1.15); scene.add(hemi);
const amb=new THREE.AmbientLight(0xffffff, .45); scene.add(amb);
const sun = new THREE.DirectionalLight(0xfff2d9, 2.6);
sun.position.set(24,36,14);
sun.castShadow = true;
sun.shadow.mapSize.set(isTouch?1024:2048, isTouch?1024:2048);
sun.shadow.camera.left=-45; sun.shadow.camera.right=45; sun.shadow.camera.top=45; sun.shadow.camera.bottom=-45;
sun.shadow.camera.far=110; sun.shadow.bias=-0.0004;
scene.add(sun);

/* day <-> night: night by the visitor's own clock, or toggled with the 🌙 button */
const DAY={ hemiI:1.15, hemiS:new THREE.Color(0xcfe8ff), hemiG:new THREE.Color(0x86c46f), amb:.45, sunI:2.6, sunC:new THREE.Color(0xfff2d9), fog:new THREE.Color(0xcdeffd) };
const NIGHT={ hemiI:.75, hemiS:new THREE.Color(0x7d8fd8), hemiG:new THREE.Color(0x3a5a48), amb:.32, sunI:1.0, sunC:new THREE.Color(0xb8c8ff), fog:new THREE.Color(0x1c2556) };
let nightK=0, nightGoal=(()=>{ const h=new Date().getHours(); return h>=19||h<6 ? 1 : 0; })();
const nightGlows=[];   /* little lanterns that only shine at night */
function applyNight(k){
  hemi.intensity=THREE.MathUtils.lerp(DAY.hemiI,NIGHT.hemiI,k);
  hemi.color.copy(DAY.hemiS).lerp(NIGHT.hemiS,k); hemi.groundColor.copy(DAY.hemiG).lerp(NIGHT.hemiG,k);
  amb.intensity=THREE.MathUtils.lerp(DAY.amb,NIGHT.amb,k);
  sun.intensity=THREE.MathUtils.lerp(DAY.sunI,NIGHT.sunI,k); sun.color.copy(DAY.sunC).lerp(NIGHT.sunC,k);
  scene.fog.color.copy(DAY.fog).lerp(NIGHT.fog,k);
  night.visible=k>.001;
  night.traverse(o=>{ if(o.material) o.material.opacity=k; });
  nightGlows.forEach(g=>{ g.visible=k>.05; g.material.opacity=k*.8; });
  document.body.classList.toggle('night',k>.5);
}

/* materials helper */
const MAT = {};
function mat(color, opts={}){ const k=color+JSON.stringify(opts); if(!MAT[k]) MAT[k]=new THREE.MeshLambertMaterial({color,...opts}); return MAT[k]; }

/* =============== ISLAND =============== */
const WORLD_R = 34;
const world = new THREE.Group(); scene.add(world);

{ // grass top
  const ground = new THREE.Mesh(new THREE.CircleGeometry(WORLD_R,72), mat(0x82cf70));
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; world.add(ground);
  const rim = new THREE.Mesh(new THREE.RingGeometry(WORLD_R-1.4,WORLD_R,72), mat(0x6cbf5c));
  rim.rotation.x=-Math.PI/2; rim.position.y=.012; rim.receiveShadow=true; world.add(rim);
  // island underside (floating island look)
  const under = new THREE.Mesh(new THREE.CylinderGeometry(WORLD_R,10,16,36,1), mat(0x9a6b45));
  under.position.y=-8.01; world.add(under);
  const dirt = new THREE.Mesh(new THREE.CylinderGeometry(WORLD_R+.02,WORLD_R-2,2.2,36,1), mat(0x7d5638));
  dirt.position.y=-1.11; world.add(dirt);
}

/* zone layout */
const ZONE_R = 21.5;
const zoneDefs = [
  { id:'gallery',  angle:-90,  color:0xe86f9e },
  { id:'numbers',  angle:-39,  color:0xeaa83a },
  { id:'builder',  angle:12,   color:0x9a5fe0 },
  { id:'sports',   angle:63,   color:0x5cb56f },
  { id:'nature',   angle:115,  color:0x3f9e57 },
  { id:'kindness', angle:166,  color:0xe87070 },
  { id:'reading',  angle:218,  color:0x2bb6a0 },
];
/* plug-in scenes (js/scenes/registry.js) join the world here */
EXTRA_SCENES.forEach(s=>{
  zoneDefs.push({ id:s.id, angle:s.angle, color:s.color });
  I18N.en.zones[s.id]=s.content.en;
  I18N.zh.zones[s.id]=s.content.zh;
});
const ZONE_COUNT=zoneDefs.length;
const zones = {};
zoneDefs.forEach(z=>{
  const a = z.angle*Math.PI/180;
  z.pos = new THREE.Vector3(Math.cos(a)*ZONE_R, 0, Math.sin(a)*ZONE_R);
  zones[z.id]=z;
});

/* stepping-stone paths + zone discs */
zoneDefs.forEach(z=>{
  const dir = z.pos.clone().normalize();
  for(let d=5; d<ZONE_R-6; d+=2.3){
    const s = new THREE.Mesh(new THREE.CircleGeometry(rand(.5,.66),18), mat(0xe9d8a6));
    s.rotation.x=-Math.PI/2; s.position.copy(dir).multiplyScalar(d);
    s.position.x+=rand(-.3,.3); s.position.z+=rand(-.3,.3); s.position.y=.015;
    s.receiveShadow=true; world.add(s);
  }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(6.4,48), new THREE.MeshLambertMaterial({color:z.color, transparent:true, opacity:.16}));
  disc.rotation.x=-Math.PI/2; disc.position.copy(z.pos); disc.position.y=.02; world.add(disc);
});

/* center plaza */
{
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(4.6,48), mat(0xf3e2b8));
  plaza.rotation.x=-Math.PI/2; plaza.position.y=.018; plaza.receiveShadow=true; world.add(plaza);
  const ring = new THREE.Mesh(new THREE.RingGeometry(4.6,5.0,48), mat(0xe0c98f));
  ring.rotation.x=-Math.PI/2; ring.position.y=.019; world.add(ring);
}

/* trees / flowers / rocks scattered on the rim */
function puffTree(s=1, col=0x58b368){
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.16*s,.24*s,1.1*s,7), mat(0x8a6242));
  trunk.position.y=.55*s; trunk.castShadow=true; g.add(trunk);
  [[0,1.5,.0,.78],[-.5,1.15,.15,.5],[.48,1.2,-.1,.55],[0,1.9,0,.5]].forEach(p=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(p[3]*s,10,8), mat(col));
    m.position.set(p[0]*s,p[1]*s,p[2]*s); m.castShadow=true; g.add(m);
  });
  return g;
}
function pineTree(s=1){
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.13*s,.2*s,.7*s,7), mat(0x8a6242));
  trunk.position.y=.35*s; trunk.castShadow=true; g.add(trunk);
  [[.95,.7,.9],[.75,.58,1.5],[.52,.46,2.0]].forEach(p=>{
    const cone=new THREE.Mesh(new THREE.ConeGeometry(p[0]*s,p[1]*s+.5*s,9), mat(0x3f9e57));
    cone.position.y=p[2]*s; cone.castShadow=true; g.add(cone);
  });
  return g;
}
const TREE_POS=[[-14,-25,1.2],[8,-28,1],[24,-16,1.1],[30,4,.9],[26,17,1.15],[6,30,1],[-12,28,1.2],[-26,17,1],[-30,-2,1.05],[-24,-16,.95],[16,25,.9],[-4,-31,.9]];
TREE_POS.forEach((p,i)=>{
  const t = i%3===2 ? pineTree(p[2]) : puffTree(p[2], i%2?0x58b368:0x6fc97e);
  t.position.set(p[0],0,p[1]); t.rotation.y=rand(0,6); world.add(t);
});
for(let i=0;i<34;i++){
  const a=rand(0,Math.PI*2), r=rand(6,WORLD_R-2);
  const f=new THREE.Group();
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.24,5), mat(0x4e9e4a)); stem.position.y=.12; f.add(stem);
  const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.09,0), mat([0xf7a8cc,0xffd166,0xffffff,0xf08080,0xb79ced][i%5])); head.position.y=.27; f.add(head);
  f.position.set(Math.cos(a)*r,0,Math.sin(a)*r); world.add(f);
}
for(let i=0;i<9;i++){
  const a=rand(0,Math.PI*2), r=rand(8,WORLD_R-3);
  const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(rand(.2,.45),0), mat(0xb8bcc4));
  rock.position.set(Math.cos(a)*r,.12,Math.sin(a)*r); rock.scale.y=.7; rock.rotation.set(rand(0,3),rand(0,3),0);
  rock.castShadow=true; world.add(rock);
}

/* ---- ambient life: pond & ducks, windmill, rainbow, balloon, butterflies, birds, bushes, mushrooms ---- */
const polar=(aDeg,r)=>{ const a=aDeg*Math.PI/180; return [Math.cos(a)*r, Math.sin(a)*r]; };

/* duck pond (between Nature Trail and Kindness Tree) */
const pondCenter=new THREE.Vector3(...(()=>{const [x,z]=polar(140,13);return [x,0,z];})());
{
  const pond=new THREE.Group();
  const water=new THREE.Mesh(new THREE.CircleGeometry(2.6,24), new THREE.MeshLambertMaterial({color:0x63b8e8}));
  water.rotation.x=-Math.PI/2; water.position.y=.03; pond.add(water);
  const rim=new THREE.Mesh(new THREE.RingGeometry(2.6,3.05,24), mat(0xd9c58f));
  rim.rotation.x=-Math.PI/2; rim.position.y=.025; pond.add(rim);
  [[.9,-.7,.3],[-.6,.9,.22],[-1.4,-.4,.18]].forEach(p=>{
    const lily=new THREE.Mesh(new THREE.CircleGeometry(p[2],10), mat(0x4e9e4a));
    lily.rotation.x=-Math.PI/2; lily.position.set(p[0],.06,p[1]); pond.add(lily);
  });
  pond.position.copy(pondCenter); world.add(pond);
}
const ducks=[];
function duck(s){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.SphereGeometry(.28*s,10,8), mat(0xfffbe8));
  body.scale.set(1.25,.85,1); body.position.y=.2*s; body.castShadow=true; g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.15*s,10,8), mat(0xfffbe8));
  head.position.set(.26*s,.5*s,0); g.add(head);
  const beak=new THREE.Mesh(new THREE.ConeGeometry(.055*s,.15*s,6), mat(0xffa32e));
  beak.rotation.z=-Math.PI/2; beak.position.set(.45*s,.48*s,0); g.add(beak);
  [-1,1].forEach(sd=>{
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.024*s,6,5), new THREE.MeshBasicMaterial({color:0x24262e}));
    eye.position.set(.3*s,.55*s,sd*.09*s); g.add(eye);
  });
  return g;
}
[{r:1.2,sp:.5,ph:0,s:1},{r:1.8,sp:-.35,ph:2.4,s:.72}].forEach(d=>{
  const g=duck(d.s); world.add(g); ducks.push({g,...d});
});

/* windmill (between Number Land and Builder's Corner) */
const millHub=new THREE.Group();
{
  const wm=new THREE.Group();
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(.5,.85,3.4,8), mat(0xf4efe6));
  tower.position.y=1.7; tower.castShadow=true; wm.add(tower);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(.75,.9,8), mat(0xe66a5a));
  roof.position.y=3.85; roof.castShadow=true; wm.add(roof);
  const door=new THREE.Mesh(new THREE.BoxGeometry(.4,.62,.06), mat(0x8a6242));
  door.position.set(0,.32,.83); wm.add(door);
  millHub.position.set(0,3.3,.62); wm.add(millHub);
  for(let i=0;i<4;i++){
    const blade=new THREE.Mesh(new THREE.BoxGeometry(.32,1.7,.05), mat(0xf7f8fa));
    const pv=new THREE.Group(); pv.rotation.z=i*Math.PI/2;
    blade.position.y=1.05; blade.castShadow=true; pv.add(blade); millHub.add(pv);
  }
  const hubCap=new THREE.Mesh(new THREE.SphereGeometry(.14,8,7), mat(0x8a6242)); millHub.add(hubCap);
  const [x,z]=polar(-14,26); wm.position.set(x,0,z); wm.lookAt(0,0,0);
  world.add(wm);
}

/* rainbow (behind the field, between Sports Park and Nature Trail) */
{
  const rb=new THREE.Group();
  [[0xf08080,5.4],[0xffd166,4.95],[0x9ad98f,4.5],[0x8fb9e6,4.05]].forEach(([c,r])=>{
    const arc=new THREE.Mesh(new THREE.TorusGeometry(r,.22,8,36,Math.PI),
      new THREE.MeshLambertMaterial({color:c,transparent:true,opacity:.85}));
    rb.add(arc);
  });
  [-1,1].forEach(sd=>{
    const puffG=new THREE.Group();
    [[0,0,.55],[.45,.2,.4],[-.45,.18,.42]].forEach(p=>{
      const b=new THREE.Mesh(new THREE.SphereGeometry(p[2],10,8), mat(0xffffff));
      b.position.set(p[0],p[1],0); puffG.add(b);
    });
    puffG.position.set(sd*4.7,.15,0); rb.add(puffG);
  });
  const [x,z]=polar(89,29); rb.position.set(x,0,z); rb.lookAt(0,0,0);
  world.add(rb);
}

/* drifting hot-air balloon */
const hab=new THREE.Group();
{
  const envelope=new THREE.Mesh(new THREE.SphereGeometry(1.15,14,12), mat(0xf08080));
  envelope.position.y=2.3; envelope.scale.set(1,1.12,1); envelope.castShadow=true; hab.add(envelope);
  const band=new THREE.Mesh(new THREE.TorusGeometry(1.02,.16,8,18), mat(0xffd166));
  band.rotation.x=Math.PI/2; band.position.y=2.05; hab.add(band);
  const basket=new THREE.Mesh(new THREE.BoxGeometry(.55,.42,.55), mat(0xa9764e));
  basket.position.y=.55; basket.castShadow=true; hab.add(basket);
  [-1,1].forEach(sx=>[-1,1].forEach(sz=>{
    const rope=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.75,4), mat(0xd9c58f));
    rope.position.set(sx*.24,1.12,sz*.24); hab.add(rope);
  }));
  scene.add(hab);
}

/* little birds circling high above */
const birdFlock=new THREE.Group(); scene.add(birdFlock);
const birdY=[];
for(let i=0;i<3;i++){
  const b=new THREE.Group();
  [-1,1].forEach(sd=>{
    const wing=new THREE.Mesh(new THREE.CircleGeometry(.34,3), new THREE.MeshBasicMaterial({color:0x5a6b8c,side:THREE.DoubleSide}));
    wing.position.x=sd*.28; wing.rotation.x=-Math.PI/2; b.add(wing);
  });
  const a=i*2.1, r=25-i*1.6, y=10.5+i*.8;
  b.position.set(Math.cos(a)*r,y,Math.sin(a)*r); birdY.push(y);
  birdFlock.add(b);
}

/* bushes & mushrooms */
for(let i=0;i<10;i++){
  const a=rand(0,Math.PI*2), r=rand(9,WORLD_R-3);
  const bush=new THREE.Group();
  [[0,0,.42],[.36,-.05,.3],[-.34,-.04,.3]].forEach(p=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(p[2],9,7), mat(i%2?0x58b368:0x6fc97e));
    m.position.set(p[0],.26+p[1],0); m.castShadow=true; bush.add(m);
  });
  if(i%3===0) [[.15,.5,.18],[-.2,.42,.05],[.02,.55,-.14]].forEach(p=>{
    const berry=new THREE.Mesh(new THREE.SphereGeometry(.05,6,5), mat(0xe6455a));
    berry.position.set(p[0],p[1],p[2]); bush.add(berry);
  });
  bush.position.set(Math.cos(a)*r,0,Math.sin(a)*r); bush.rotation.y=rand(0,6);
  world.add(bush);
}
for(let i=0;i<8;i++){
  const a=rand(0,Math.PI*2), r=rand(22,WORLD_R-2);
  const mr=new THREE.Group();
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.06,.09,.2,7), mat(0xf6f1e4));
  stem.position.y=.1; mr.add(stem);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.16,9,7,0,Math.PI*2,0,Math.PI*.55), mat(i%2?0xe66a5a:0xeaa83a));
  cap.position.y=.16; mr.add(cap);
  mr.position.set(Math.cos(a)*r,0,Math.sin(a)*r); mr.scale.setScalar(rand(.8,1.3));
  world.add(mr);
}

/* bees humming around two little flower patches */
const beeSwarms=[];
[[40,16],[195,17]].forEach(([aDeg,r])=>{
  const [bx,bz]=polar(aDeg,r);
  const g=new THREE.Group(); g.position.set(bx,0,bz);
  [[.4,.2],[-.35,.45],[.05,-.4],[-.5,-.15]].forEach((o,i)=>{
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.24,5), mat(0x4e9e4a));
    stem.position.set(o[0],.12,o[1]); g.add(stem);
    const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.09,0), mat([0xf7a8cc,0xffd166,0xf08080,0xb79ced][i%4]));
    head.position.set(o[0],.27,o[1]); g.add(head);
  });
  const bees=[];
  for(let i=0;i<3;i++){
    const bee=new THREE.Group();
    const body=new THREE.Mesh(new THREE.SphereGeometry(.09,8,7), mat(0xffd166));
    body.scale.set(1.25,.9,.9); bee.add(body);
    const stripe=new THREE.Mesh(new THREE.SphereGeometry(.093,8,7), mat(0x2b2b33));
    stripe.scale.set(.4,.86,.86); bee.add(stripe);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.05,8,7), mat(0x2b2b33));
    head.position.x=.13; bee.add(head);
    [-1,1].forEach(sd=>{
      const w=new THREE.Mesh(new THREE.CircleGeometry(.07,6),
        new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7,side:THREE.DoubleSide}));
      w.position.set(-.02,.1,sd*.04); w.rotation.x=sd*.7; bee.add(w);
    });
    g.add(bee); bees.push({m:bee,ph:rand(0,6),r:rand(.5,1),h:rand(.7,1.3),sp:rand(2.2,3.4)});
  }
  world.add(g);
  beeSwarms.push({x:bx,z:bz,bees});
});

/* where the rocket heads for when it climbs into the sky (and comes back from) */
const SKY_GATE=new THREE.Vector3(-40,11,-46);

/* rocket that launches from the field into space (orange + grey) */
const ROCKET_PAD=(()=>{const [x,z]=polar(246,14);return new THREE.Vector3(x,0,z);})();
const rocket=new THREE.Group(), rocketFlame=new THREE.Group();
{
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.5,.16,18), mat(0x7d8590));
  pad.position.set(ROCKET_PAD.x,.08,ROCKET_PAD.z); pad.receiveShadow=true; world.add(pad);
  const padRing=new THREE.Mesh(new THREE.TorusGeometry(1.1,.05,6,18), mat(0xe8863a));
  padRing.rotation.x=-Math.PI/2; padRing.position.set(ROCKET_PAD.x,.17,ROCKET_PAD.z); world.add(padRing);

  const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.2,.34,.32,10), mat(0x5a6270));
  nozzle.position.y=.32; rocket.add(nozzle);
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.44,.5,2.1,12), mat(0xe8863a));
  body.position.y=1.5; body.castShadow=true; rocket.add(body);
  const belt=new THREE.Mesh(new THREE.CylinderGeometry(.485,.485,.22,12), mat(0x9aa2ad));
  belt.position.y=1.06; rocket.add(belt);
  const nose=new THREE.Mesh(new THREE.ConeGeometry(.45,.95,12), mat(0x9aa2ad));
  nose.position.y=3.02; nose.castShadow=true; rocket.add(nose);
  for(let i=0;i<3;i++){
    const fin=new THREE.Mesh(new THREE.BoxGeometry(.09,.85,.55), mat(0x7d8590));
    const a=i*Math.PI*2/3;
    fin.position.set(Math.cos(a)*.52,.62,Math.sin(a)*.52);
    fin.rotation.y=-a; fin.rotation.x=.12; fin.castShadow=true;
    rocket.add(fin);
  }
  const ringP=new THREE.Mesh(new THREE.TorusGeometry(.17,.045,8,14), mat(0x9aa2ad));
  ringP.position.set(0,1.85,.47); rocket.add(ringP);
  const glass=new THREE.Mesh(new THREE.CircleGeometry(.15,12), new THREE.MeshLambertMaterial({color:0xbfe4ff}));
  glass.position.set(0,1.85,.472); rocket.add(glass);
  const f1=new THREE.Mesh(new THREE.ConeGeometry(.3,1,10), new THREE.MeshBasicMaterial({color:0xffb703}));
  f1.rotation.x=Math.PI; f1.position.y=-.42; rocketFlame.add(f1);
  const f2=new THREE.Mesh(new THREE.ConeGeometry(.16,.65,8), new THREE.MeshBasicMaterial({color:0xfff3c4}));
  f2.rotation.x=Math.PI; f2.position.y=-.28; rocketFlame.add(f2);
  rocketFlame.position.y=.2; rocketFlame.visible=false; rocket.add(rocketFlame);
  rocket.position.copy(ROCKET_PAD);
  world.add(rocket);
}
let rocketPhase=0, rocketT=0;   /* 0 on the pad, 4 countdown, 1 lift-off, 3 landing */
let riding=false, rocketMarker=null;
const ROCK_UP=new THREE.Vector3(0,1,0);
const ROCK_A0=Math.atan2(ROCKET_PAD.z-SKY_GATE.z, ROCKET_PAD.x-SKY_GATE.x);
const _rp=new THREE.Vector3(), _rd=new THREE.Vector3();
function rocketOrbitPos(a,out){
  const J=SKY_GATE;
  return out.set(J.x+Math.cos(a)*6.5, J.y-1.2, J.z+Math.sin(a)*6.5);
}
rocket.traverse(o=>{ o.userData.portal='rocket'; });
/* boarding: helmet on, countdown 3-2-1, lift-off, then fly on into the Galaxy game */
function boardRocket(){
  if(riding || rocketPhase!==0 || panelOpen || leaving) return;
  riding=true; endTour();
  portalNear=null; $('#hint').style.display='none';
  max.helmet.visible=true;
  rocketPhase=4; rocketT=0; countN=3;
  bigMsg('3',800); ding();
}
let countN=0, leaving=false;
/* fade to space (rocket) or to paper (book), then open the other page */
function leaveTo(url,kind){
  leaving=true; narrator.stop();
  const w=$('#warp'); w.className=kind; w.style.display='flex';
  requestAnimationFrame(()=>requestAnimationFrame(()=>w.classList.add('on')));
  setTimeout(()=>{ location.href=url; },kind==='space'?1000:700);
}
/* places you walk up to and enter: the rocket (Galaxy game) and the Story House door */
const PORTALS=[
  { id:'rocket', at:()=>ROCKET_PAD,  r:2.8, label:()=>'🚀 '+T().rocketHint, go:()=>boardRocket(), ok:()=>!riding&&rocketPhase===0 },
  { id:'story',  at:()=>STORY_DOOR,  r:2.3, label:()=>'📖 '+T().storyHint,  go:()=>enterStories(), ok:()=>!riding },
];
let portalNear=null;
function enterStories(){ if(leaving||panelOpen) return; endTour(); portalNear=null; $('#hint').style.display='none'; ding(); leaveTo('stories.html','book'); }
/* coming back with the browser's Back button restores this page as it was left: tidy up */
addEventListener('pageshow',e=>{
  if(!e.persisted || !leaving) return;
  leaving=false; $('#warp').classList.remove('on'); $('#warp').style.display='none';
  if(riding){
    riding=false; rocketPhase=0; rocketT=0; rocketFlame.visible=false;
    rocket.quaternion.identity(); rocket.position.copy(ROCKET_PAD);
    max.g.position.set(ROCKET_PAD.x,0,ROCKET_PAD.z+1.7); max.g.visible=true; max.helmet.visible=false;
  }
});

/* clouds */
const clouds = new THREE.Group(); scene.add(clouds);
for(let i=0;i<8;i++){
  const cl=new THREE.Group();
  const n=3+Math.floor(rand(0,3));
  for(let j=0;j<n;j++){
    const s=new THREE.Mesh(new THREE.SphereGeometry(rand(1,2.1),9,7), new THREE.MeshLambertMaterial({color:0xffffff}));
    s.position.set(j*1.5-n*.7, rand(-.2,.3), rand(-.6,.6)); s.scale.y=.62; cl.add(s);
  }
  const a=rand(0,Math.PI*2), r=rand(24,60);
  cl.position.set(Math.cos(a)*r, rand(15,26), Math.sin(a)*r);
  clouds.add(cl);
}

/* text sprite helper */
function textSprite(text, opts={}){
  const fs=opts.fs||46, pad=26;
  const c=makeCanvas(4,4), g=c.getContext('2d');
  g.font=`800 ${fs}px "Baloo 2","Noto Sans TC",sans-serif`;
  const w=Math.ceil(g.measureText(text).width)+pad*2, h=fs+pad*1.6;
  c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  if(opts.bg!==null){ ctx.fillStyle=opts.bg||'rgba(255,255,255,.94)'; rr(ctx,2,2,w-4,h-4,h/2-2); ctx.fill();
    if(opts.stroke){ ctx.strokeStyle=opts.stroke; ctx.lineWidth=5; rr(ctx,4,4,w-8,h-8,h/2-4); ctx.stroke(); } }
  ctx.font=`800 ${fs}px "Baloo 2","Noto Sans TC",sans-serif`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle=opts.color||'#2b2b33'; ctx.fillText(text,w/2,h/2+fs*.06);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({ map:canvasTexture(c), transparent:true }));
  const sc=(opts.scale||1)*.011;
  sp.scale.set(w*sc,h*sc,1);
  return sp;
}

/* signpost with bilingual board */
function signpost(en,zh,color){
  const g=new THREE.Group();
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,1.5,8), mat(0x8a6242));
  post.position.y=.75; post.castShadow=true; g.add(post);
  const c=makeCanvas(512,236), ctx=c.getContext('2d');
  ctx.fillStyle='#fffdf6'; rr(ctx,6,6,500,224,34); ctx.fill();
  ctx.strokeStyle='#'+color.toString(16).padStart(6,'0'); ctx.lineWidth=12; rr(ctx,12,12,488,212,28); ctx.stroke();
  ctx.textAlign='center'; ctx.fillStyle='#2b2b33';
  ctx.font='800 64px "Baloo 2",sans-serif'; ctx.fillText(en,256,102);
  ctx.font='900 58px "Noto Sans TC","PingFang TC",sans-serif'; ctx.fillText(zh,256,182);
  const tex=canvasTexture(c);
  const board=new THREE.Mesh(new THREE.BoxGeometry(1.9,.88,.08),
    [mat(0xdccbb0),mat(0xdccbb0),mat(0xdccbb0),mat(0xdccbb0),
     new THREE.MeshLambertMaterial({map:tex}), mat(0xdccbb0)]);
  board.position.y=1.62; board.castShadow=true; g.add(board);
  return g;
}

/* floating emoji marker above each zone */
function emojiSprite(emoji, color=0xffffff, size=160){
  const c=makeCanvas(size,size), ctx=c.getContext('2d');
  ctx.fillStyle='rgba(255,255,255,.96)';
  ctx.beginPath(); ctx.arc(size/2,size/2,size*.44,0,7); ctx.fill();
  ctx.strokeStyle='#'+color.toString(16).padStart(6,'0'); ctx.lineWidth=size*.055;
  ctx.beginPath(); ctx.arc(size/2,size/2,size*.41,0,7); ctx.stroke();
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font=`${size*.52}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.fillText(emoji,size/2,size/2+size*.03);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:canvasTexture(c),transparent:true}));
  sp.scale.set(1.5,1.5,1);
  return sp;
}
const markers=[];
zoneDefs.forEach(z=>{
  const mk=emojiSprite(I18N.en.zones[z.id].icon, z.color);
  mk.position.set(z.pos.x, 4.1, z.pos.z);
  mk.userData.baseY=4.1; mk.userData.ph=rand(0,6);
  scene.add(mk); markers.push(mk);
});

/* artwork textures: paper until Max's drawing has loaded */
const artSrc=(art,full)=>`assets/art/${art.id}${full?'':'-s'}.webp`;
function loadArt(art){
  const c=makeCanvas(512,410); paper(c.getContext('2d'),512,410);
  const tex=canvasTexture(c);
  const img=new Image();
  img.onload=()=>{
    const cc=makeCanvas(640,512), g=cc.getContext('2d');
    const k=Math.max(640/img.width,512/img.height);
    g.drawImage(img,(640-img.width*k)/2,(512-img.height*k)/2,img.width*k,img.height*k);
    tex.image=cc; tex.needsUpdate=true;
  };
  img.src=artSrc(art);
  return tex;
}
/* =============== ZONE BUILDERS =============== */
function tagZone(group, id){ group.traverse(o=>o.userData.zone=id); group.userData.zone=id; }

/* --- welcome sign + balloon at plaza --- */
const welcomeGroup = new THREE.Group();
{
  const sign = signpost("Max's World","歡迎光臨", 0x4f7fe0);
  sign.scale.setScalar(1.25); welcomeGroup.add(sign);
  // red balloon
  const bal = new THREE.Group();
  const b=new THREE.Mesh(new THREE.SphereGeometry(.42,14,12), mat(0xe05454)); b.scale.y=1.12; b.castShadow=true; bal.add(b);
  const knot=new THREE.Mesh(new THREE.ConeGeometry(.08,.14,7), mat(0xc0392b)); knot.position.y=-.5; knot.rotation.x=Math.PI; bal.add(knot);
  const str=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,1.5,4), mat(0xffffff)); str.position.y=-1.3; bal.add(str);
  bal.position.set(1.35,3.4,-.2); welcomeGroup.add(bal); welcomeGroup.userData.balloon=bal;
  welcomeGroup.position.set(0,0,-3.4);   /* board faces +z = spawn side */
  tagZone(welcomeGroup,'welcome');
  world.add(welcomeGroup);
}
zones.welcome = { id:'welcome', pos:new THREE.Vector3(0,0,-3.4), color:0x4f7fe0, radius:4.6 };

/* --- gallery: easels in an arc --- */
function buildGallery(z){
  const g=new THREE.Group();
  const easels=ARTWORKS.filter(a=>a.easel);
  easels.forEach((art,i)=>{
    const e=new THREE.Group();
    // easel legs
    const legMat=mat(0xa9835c);
    [[-.42,.12],[.42,.12]].forEach(p=>{
      const leg=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,1.75,6), legMat);
      leg.position.set(p[0],.85,p[1]); leg.rotation.z=p[0]>0?-.13:.13; leg.castShadow=true; e.add(leg);
    });
    const back=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,1.7,6), legMat);
    back.position.set(0,.83,-.3); back.rotation.x=.3; back.castShadow=true; e.add(back);
    const tray=new THREE.Mesh(new THREE.BoxGeometry(1.1,.06,.12), legMat); tray.position.y=.72; e.add(tray);
    // frame + canvas
    const frame=new THREE.Mesh(new THREE.BoxGeometry(1.34,1.1,.06), mat(0xfff8ec));
    frame.position.y=1.32; frame.rotation.x=-.1; frame.castShadow=true; e.add(frame);
    const pic=new THREE.Mesh(new THREE.PlaneGeometry(1.18,.94),
      new THREE.MeshBasicMaterial({ map:loadArt(art) }));
    pic.position.set(0,1.32,.045); pic.rotation.x=-.1; pic.userData.art=art.id; e.add(pic);
    // arrange in arc facing zone center
    const aa=(i-(easels.length-1)/2)*.42;
    e.position.set(Math.sin(aa)*3.6, 0, -Math.cos(aa)*3.6);
    e.lookAt(0,0,0);
    g.add(e);
  });
  return g;
}

/* --- numbers: cube characters 1..5 --- */
function numberFaceTex(n, base){
  const c=makeCanvas(256,256), ctx=c.getContext('2d');
  ctx.fillStyle=base; ctx.fillRect(0,0,256,256);
  ctx.fillStyle='rgba(255,255,255,.92)';
  ctx.font='800 150px "Baloo 2",sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(String(n),128,140);
  return canvasTexture(c);
}
function buildNumbers(z){
  const g=new THREE.Group();
  const cols=['#e05454','#e08a1e','#eec643','#3f9e57','#4f7fe0'];
  const colsHex=[0xe05454,0xe08a1e,0xeec643,0x3f9e57,0x4f7fe0];
  for(let n=1;n<=5;n++){
    const ch=new THREE.Group(); const s=.62;
    for(let k=0;k<n;k++){
      const isTop=k===n-1;
      let m;
      if(isTop){
        const face=new THREE.MeshLambertMaterial({map:numberFaceTex(n,cols[n-1])});
        m=new THREE.Mesh(new THREE.BoxGeometry(s,s,s),[mat(colsHex[n-1]),mat(colsHex[n-1]),mat(colsHex[n-1]),mat(colsHex[n-1]),face,mat(colsHex[n-1])]);
      }else{
        m=new THREE.Mesh(new THREE.BoxGeometry(s,s,s), mat(colsHex[n-1]));
      }
      m.position.y=s/2+k*s; m.castShadow=true; ch.add(m);
      if(isTop){ // googly eyes
        [[-.14],[.14]].forEach(p=>{
          const w=new THREE.Mesh(new THREE.SphereGeometry(.075,8,7), new THREE.MeshLambertMaterial({color:0xffffff}));
          w.position.set(p[0], s/2+k*s+.16, s/2+.01); ch.add(w);
          const pu=new THREE.Mesh(new THREE.SphereGeometry(.036,7,6), new THREE.MeshLambertMaterial({color:0x222222}));
          pu.position.set(p[0], s/2+k*s+.16, s/2+.075); ch.add(pu);
        });
      }
    }
    ch.position.set(-2.6+ (n-1)*1.25, 0, rand(-.5,.5));
    ch.rotation.y=rand(-.4,.4);
    g.add(ch);
  }
  /* Fourteen — the skateboarder: 2x7 blocks, top 4 green, bottom 10 white */
  {
    const s=.62, f=new THREE.Group();
    const deck=new THREE.Mesh(new THREE.BoxGeometry(1.55,.09,.6), mat(0xffd166));
    deck.position.y=.21; deck.castShadow=true; f.add(deck);
    [[-.55,-.2],[-.55,.2],[.55,-.2],[.55,.2]].forEach(p=>{
      const wl=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.09,10), mat(0x30363f));
      wl.rotation.x=Math.PI/2; wl.position.set(p[0],.1,p[1]); wl.castShadow=true; f.add(wl);
    });
    const baseY=.48;
    /* stubby legs + shoes standing on the deck */
    [-1,1].forEach(sd=>{
      const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.12,4,8), mat(0xf4f4f6));
      leg.position.set(sd*.31,.42,0); leg.castShadow=true; f.add(leg);
      const shoe=new THREE.Mesh(new THREE.SphereGeometry(.115,10,8), mat(0xffffff));
      shoe.position.set(sd*.31,.3,.06); shoe.scale.set(1,.62,1.4); shoe.castShadow=true; f.add(shoe);
    });
    for(let row=0;row<7;row++){
      for(let col=0;col<2;col++){
        const b=new THREE.Mesh(new THREE.BoxGeometry(s*.97,s*.97,s*.97), mat(row>=5?0x3f9e57:0xf4f4f6));
        b.position.set((col-.5)*s, baseY+s/2+row*s, 0);
        b.castShadow=true; f.add(b);
      }
    }
    const nc=makeCanvas(256,128), nx=nc.getContext('2d');
    nx.fillStyle='rgba(255,255,255,.95)';
    nx.font='800 104px "Baloo 2",sans-serif'; nx.textAlign='center'; nx.textBaseline='middle';
    nx.fillText('14',128,66);
    const decal=new THREE.Mesh(new THREE.PlaneGeometry(s*1.7,s*.85),
      new THREE.MeshBasicMaterial({map:canvasTexture(nc),transparent:true}));
    decal.position.set(0, baseY+s/2+5*s, s/2+.005); f.add(decal);
    /* googly eyes low on the white blocks (2nd row from the bottom) */
    const eyeY=baseY+s/2+1*s+.08;
    [[-.16],[.16]].forEach(p=>{
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.078,.012,6,14), mat(0xb9c0cc));
      ring.position.set(p[0], eyeY, s/2+.008); f.add(ring);
      const ew=new THREE.Mesh(new THREE.SphereGeometry(.075,8,7), new THREE.MeshLambertMaterial({color:0xffffff}));
      ew.position.set(p[0], eyeY, s/2+.01); f.add(ew);
      const pu=new THREE.Mesh(new THREE.SphereGeometry(.036,7,6), new THREE.MeshLambertMaterial({color:0x222222}));
      pu.position.set(p[0], eyeY, s/2+.075); f.add(pu);
    });
    /* smiling mouth under the eyes */
    const smile=new THREE.Mesh(new THREE.TorusGeometry(.1,.016,8,16,Math.PI*.72),
      new THREE.MeshBasicMaterial({color:0x24262e}));
    smile.position.set(0, eyeY-.14, s/2+.01);
    smile.rotation.z=Math.PI*1.14;
    f.add(smile);
    /* green arms reaching out from the 3rd white row */
    const armY=baseY+s/2+2*s;
    [-1,1].forEach(sd=>{
      const arm=new THREE.Group();
      const up=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.3,4,8), mat(0x3f9e57));
      up.position.y=-.17; up.castShadow=true; arm.add(up);
      const hand=new THREE.Mesh(new THREE.SphereGeometry(.095,8,7), mat(0x3f9e57));
      hand.position.y=-.36; hand.castShadow=true; arm.add(hand);
      arm.position.set(sd*(s+.02), armY, 0);
      arm.rotation.z=sd*.85;
      f.add(arm);
    });
    /* green skater helmet */
    const helmet=new THREE.Mesh(new THREE.SphereGeometry(.72,16,10,0,Math.PI*2,0,Math.PI*.52), mat(0x2f8547));
    helmet.scale.set(1,.62,.9); helmet.position.set(0, baseY+7*s-.04, 0);
    helmet.castShadow=true; f.add(helmet);
    f.position.set(3.7,0,.15); f.rotation.y=-.22;
    g.add(f);
  }

  // the 604 & 603 camera-code buddies
  const mini=(txt,x,z2)=>{
    const c=makeCanvas(256,140), ctx=c.getContext('2d');
    ctx.fillStyle='#5a6270'; rr(ctx,0,0,256,140,22); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='800 84px "Baloo 2",sans-serif'; ctx.textAlign='center'; ctx.fillText(txt,128,102);
    const m=new THREE.Mesh(new THREE.BoxGeometry(.8,.44,.5),
      [mat(0x5a6270),mat(0x5a6270),mat(0x6a7280),mat(0x4a5260),new THREE.MeshLambertMaterial({map:canvasTexture(c)}),mat(0x5a6270)]);
    m.position.set(x,.22,z2); m.castShadow=true;
    const lens=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.1,12), mat(0x30363f));
    lens.rotation.x=Math.PI/2; lens.position.set(x-.18,.4,z2+.2);
    const gg=new THREE.Group(); gg.add(m); gg.add(lens); return gg;
  };
  g.add(mini('604', 2.2, 1.6)); g.add(mini('603', 3.1, 1.9));
  const heart=textSprite('❤️',{bg:null,fs:60,scale:.7}); heart.position.set(2.65,1.0,1.75); g.add(heart);
  return g;
}

/* --- builder: LEGO-ish flood-control project --- */
function studsOn(mesh, w, d, color, s=1){
  const g=new THREE.Group(); g.add(mesh);
  const bb=new THREE.Box3().setFromObject(mesh); const top=bb.max.y;
  const nx=Math.max(1,Math.round(w/.45)), nz=Math.max(1,Math.round(d/.45));
  for(let i=0;i<nx;i++) for(let j=0;j<nz;j++){
    const st=new THREE.Mesh(new THREE.CylinderGeometry(.11*s,.11*s,.09*s,10), mat(color));
    st.position.set(bb.min.x+(i+.5)*(w/nx), top+.045*s, bb.min.z+(j+.5)*(d/nz));
    g.add(st);
  }
  return g;
}
let waterTexes=[];
function waterTex(){
  const c=makeCanvas(128,128), ctx=c.getContext('2d');
  ctx.fillStyle='#4aa8e8'; ctx.fillRect(0,0,128,128);
  ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=5; ctx.lineCap='round';
  for(let i=0;i<7;i++){ ctx.beginPath(); const y=10+i*18;
    for(let x=0;x<=128;x+=8) x===0?ctx.moveTo(x,y+Math.sin(x/12+i)*4):ctx.lineTo(x,y+Math.sin(x/12+i)*4);
    ctx.stroke(); }
  const t=canvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; waterTexes.push(t); return t;
}
function buildBuilder(z){
  const g=new THREE.Group();
  // base plate
  const plate=new THREE.Mesh(new THREE.BoxGeometry(8.6,.32,6.6), mat(0xaede8a));
  plate.position.y=.16; plate.castShadow=true; plate.receiveShadow=true;
  g.add(studsOn(plate,8.6,6.6,0x9ed07a,1.6));
  // river across
  const rt=waterTex(); rt.repeat.set(5,1);
  const river=new THREE.Mesh(new THREE.BoxGeometry(8.6,.14,1.5), new THREE.MeshLambertMaterial({map:rt}));
  river.position.set(0,.4,.2); g.add(river);
  // dam
  const dam=new THREE.Mesh(new THREE.BoxGeometry(.66,1.1,1.9), mat(0x9aa2ae));
  dam.position.set(-1.6,.8,.2); dam.castShadow=true; g.add(studsOn(dam,.66,1.9,0x8a929e,1));
  // reservoir upstream
  const rt2=waterTex(); rt2.repeat.set(2,2);
  const res=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.25,.16,20), new THREE.MeshLambertMaterial({map:rt2}));
  res.position.set(-3.1,.42,.2); g.add(res);
  // diversion channel
  const rt3=waterTex(); rt3.repeat.set(3,1);
  const div=new THREE.Mesh(new THREE.BoxGeometry(4.4,.12,.8), new THREE.MeshLambertMaterial({map:rt3}));
  div.position.set(1.3,.38,1.9); div.rotation.y=-.5; g.add(div);
  // houses (safe behind dam)
  [[.6,-1.6,0xe05454],[2.1,-2.0,0xe08a1e],[3.4,-1.2,0x4f7fe0]].forEach(h=>{
    const hg=new THREE.Group();
    const body=new THREE.Mesh(new THREE.BoxGeometry(.95,.8,.95), mat(h[2])); body.position.y=.72; body.castShadow=true; hg.add(body);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(.85,.6,4), mat(0xa0522d)); roof.position.y=1.42; roof.rotation.y=Math.PI/4; roof.castShadow=true; hg.add(roof);
    const win=new THREE.Mesh(new THREE.PlaneGeometry(.26,.26), new THREE.MeshLambertMaterial({color:0xfff3b0})); win.position.set(0,.78,.48); hg.add(win);
    hg.position.set(h[0],.3,h[1]); g.add(hg);
  });
  // little worker minifig-ish (yellow head + blue body)
  const fig=new THREE.Group();
  const bodyF=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.34,10), mat(0x4f7fe0)); bodyF.position.y=.5; fig.add(bodyF);
  const headF=new THREE.Mesh(new THREE.SphereGeometry(.14,10,9), mat(0xffd23f)); headF.position.y=.8; fig.add(headF);
  const hat=new THREE.Mesh(new THREE.CylinderGeometry(.15,.17,.08,10), mat(0xe05454)); hat.position.y=.9; fig.add(hat);
  fig.position.set(-1.6,.32,1.5); g.add(fig);
  g.position.y=0; return g;
}

/* --- sports: goal + kickable ball + fencing podium --- */
let ball, goalInfo;
function buildSports(z){
  const g=new THREE.Group();
  // goal
  const goal=new THREE.Group(); const gm=mat(0xffffff);
  const p1=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1.5,8), gm); p1.position.set(-1.5,.75,0);
  const p2=p1.clone(); p2.position.x=1.5;
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,3.12,8), gm); bar.rotation.z=Math.PI/2; bar.position.y=1.5;
  goal.add(p1,p2,bar);
  // net
  const nc=makeCanvas(128,64), nctx=nc.getContext('2d');
  nctx.strokeStyle='rgba(255,255,255,.75)'; nctx.lineWidth=2;
  for(let x=0;x<=128;x+=12){nctx.beginPath();nctx.moveTo(x,0);nctx.lineTo(x,64);nctx.stroke();}
  for(let y=0;y<=64;y+=12){nctx.beginPath();nctx.moveTo(0,y);nctx.lineTo(128,y);nctx.stroke();}
  const net=new THREE.Mesh(new THREE.PlaneGeometry(3,1.5), new THREE.MeshLambertMaterial({map:canvasTexture(nc),transparent:true,side:THREE.DoubleSide}));
  net.position.set(0,.75,-.4); net.rotation.x=.25; goal.add(net);
  goal.position.set(0,0,-3.4); g.add(goal);
  // football
  const bc=makeCanvas(256,256), bctx=bc.getContext('2d');
  bctx.fillStyle='#ffffff'; bctx.fillRect(0,0,256,256);
  [[50,60],[150,40],[210,120],[90,150],[180,200],[30,190],[128,240]].forEach(p=>{
    bctx.fillStyle='#23262e'; bctx.beginPath();
    for(let i=0;i<5;i++){const a=-Math.PI/2+i*Math.PI*2/5; i===0?bctx.moveTo(p[0]+Math.cos(a)*22,p[1]+Math.sin(a)*22):bctx.lineTo(p[0]+Math.cos(a)*22,p[1]+Math.sin(a)*22);}
    bctx.fill();
  });
  ball=new THREE.Mesh(new THREE.SphereGeometry(.34,18,14), new THREE.MeshLambertMaterial({map:canvasTexture(bc)}));
  ball.castShadow=true; ball.position.set(z.pos.x+1.2, .34, z.pos.z+1.2);
  ball.userData.vel=new THREE.Vector3();
  scene.add(ball); // ball lives in scene space
  // fencing podium + trophy + swords
  const pod=new THREE.Group();
  const base=new THREE.Mesh(new THREE.BoxGeometry(1.5,.5,1.1), mat(0xf0e6d8)); base.position.y=.25; base.castShadow=true; pod.add(base);
  const cup=new THREE.Group();
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.05,.09,.3,10), mat(0xd4af37)); stem.position.y=.65; cup.add(stem);
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.24,.1,.3,12), mat(0xffd23f)); bowl.position.y=.92; cup.add(bowl);
  const bbase=new THREE.Mesh(new THREE.BoxGeometry(.3,.08,.3), mat(0xb8860b)); bbase.position.y=.53; cup.add(bbase);
  pod.add(cup);
  // crossed swords
  [-1,1].forEach(sd=>{
    const sw=new THREE.Group();
    const blade=new THREE.Mesh(new THREE.CylinderGeometry(.02,.008,1.1,6), mat(0xc8ccd4)); blade.position.y=.55; sw.add(blade);
    const guard=new THREE.Mesh(new THREE.SphereGeometry(.07,8,7), mat(0x8a92a0)); guard.position.y=.06; sw.add(guard);
    const grip=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.16,6), mat(0x3a3f4a)); grip.position.y=-.05; sw.add(grip);
    sw.position.set(sd*.1,.5,.42); sw.rotation.z=sd*.5; pod.add(sw);
  });
  pod.position.set(2.6,0,-1.4); pod.rotation.y=-.5; g.add(pod);
  // mud pit + hurdle (Spartan!)
  const mud=new THREE.Mesh(new THREE.CircleGeometry(1.1,20), mat(0x8a6242)); mud.rotation.x=-Math.PI/2; mud.position.set(-2.7,.03,1.8); g.add(mud);
  const hurdle=new THREE.Group();
  [[-.7],[.7]].forEach(p=>{ const post=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.6,7), mat(0x8a6242)); post.position.set(p[0],.3,0); hurdle.add(post); });
  const rail=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,1.5,7), mat(0xe08a1e)); rail.rotation.z=Math.PI/2; rail.position.y=.55; hurdle.add(rail);
  hurdle.position.set(-2.7,0,.4); g.add(hurdle);
  // remember goal line (world coords set after placement)
  goalInfo={ zone:z, local:new THREE.Vector3(0,0,-3.4), halfW:1.4, height:1.45 };
  return g;
}

/* --- nature: pines, tent, campfire --- */
let flames=[];
function buildNature(z){
  const g=new THREE.Group();
  [[-2.6,-1.8,1.3],[-3.2,.6,1],[2.8,-2.2,1.2],[3.4,.2,.9],[.5,-3.2,1.1]].forEach(p=>{
    const t=pineTree(p[2]); t.position.set(p[0],0,p[1]); g.add(t);
  });
  // tent
  const tent=new THREE.Group();
  const cloth=new THREE.Mesh(new THREE.ConeGeometry(1.15,1.35,4), mat(0xe08a1e));
  cloth.rotation.y=Math.PI/4; cloth.position.y=.67; cloth.castShadow=true; tent.add(cloth);
  const door=new THREE.Mesh(new THREE.ConeGeometry(.5,.75,4), mat(0x8a5210));
  door.rotation.y=Math.PI/4; door.position.set(0,.38,.62); tent.add(door);
  tent.position.set(2.2,0,1.6); tent.rotation.y=-.6; g.add(tent);
  // campfire
  const fire=new THREE.Group();
  for(let i=0;i<4;i++){ const log=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.9,6), mat(0x6b4523));
    log.rotation.z=Math.PI/2; log.rotation.y=i*Math.PI/4; log.position.y=.08; fire.add(log); }
  [[0,.34,.16,0xff6b35],[.09,.26,.11,0xffa62b],[-.08,.24,.1,0xffd23f]].forEach(f=>{
    const fl=new THREE.Mesh(new THREE.ConeGeometry(f[2],f[1]*1.6,7), new THREE.MeshBasicMaterial({color:f[3]}));
    fl.position.set(f[0],f[1],0); fire.add(fl); flames.push(fl);
  });
  const glow=new THREE.PointLight(0xff8c42,6,7); glow.position.y=.6; fire.add(glow);
  fire.position.set(-.6,0,1.7); g.add(fire);
  // stones around fire
  for(let a=0;a<Math.PI*2;a+=Math.PI/5){
    const st=new THREE.Mesh(new THREE.DodecahedronGeometry(.14,0), mat(0xb8bcc4));
    st.position.set(-.6+Math.cos(a)*.85,.07,1.7+Math.sin(a)*.85); g.add(st);
  }
  return g;
}

/* --- kindness: heart tree + bunting + donation box --- */
let heartMeshes=[];
function heartGeo(s=1){
  const sh=new THREE.Shape();
  sh.moveTo(0,.35*s); sh.bezierCurveTo(0,.6*s,-.5*s,.6*s,-.5*s,.2*s);
  sh.bezierCurveTo(-.5*s,-.1*s,0,-.25*s,0,-.5*s);
  sh.bezierCurveTo(0,-.25*s,.5*s,-.1*s,.5*s,.2*s);
  sh.bezierCurveTo(.5*s,.6*s,0,.6*s,0,.35*s);
  return new THREE.ExtrudeGeometry(sh,{depth:.12*s,bevelEnabled:true,bevelSize:.03*s,bevelThickness:.03*s,bevelSegments:2});
}
function buildKindness(z){
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.3,.42,2.4,9), mat(0x8a6242));
  trunk.position.y=1.2; trunk.castShadow=true; g.add(trunk);
  [[0,3.1,0,1.45],[-1.1,2.7,.3,.85],[1.05,2.75,-.2,.9],[.2,2.6,1.0,.8],[-.3,2.65,-1.0,.8]].forEach(p=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(p[3],11,9), mat(0x6fc97e));
    m.position.set(p[0],p[1],p[2]); m.castShadow=true; g.add(m);
  });
  const hg=heartGeo(.3);
  for(let i=0;i<9;i++){
    const a=i/9*Math.PI*2;
    const h=new THREE.Mesh(hg, mat(i%2?0xe05454:0xf7a8cc));
    h.position.set(Math.cos(a)*rand(1,1.6), rand(1.9,2.6), Math.sin(a)*rand(1,1.6));
    h.rotation.y=rand(0,6); h.userData.sway=rand(0,6); h.castShadow=true;
    g.add(h); heartMeshes.push(h);
  }
  // bunting between two poles
  const poles=[new THREE.Vector3(-3,0,1.6), new THREE.Vector3(3,0,1.9)];
  poles.forEach(p=>{ const po=new THREE.Mesh(new THREE.CylinderGeometry(.05,.06,2.1,7), mat(0x8a6242)); po.position.set(p.x,1.05,p.z); po.castShadow=true; g.add(po); });
  const cols=[0xe05454,0xffd23f,0x4f7fe0,0x3f9e57,0xe08a1e,0x7a4fd0];
  for(let i=0;i<=10;i++){
    const t=i/10;
    const x=THREE.MathUtils.lerp(poles[0].x,poles[1].x,t), zz=THREE.MathUtils.lerp(poles[0].z,poles[1].z,t);
    const y=2.05-Math.sin(t*Math.PI)*.4;
    if(i<10){ const fl=new THREE.Mesh(new THREE.ConeGeometry(.14,.34,3), new THREE.MeshLambertMaterial({color:cols[i%6],side:THREE.DoubleSide}));
      fl.position.set(x+.15,y-.2,zz); fl.rotation.x=Math.PI; g.add(fl); }
  }
  // donation box
  const box=new THREE.Mesh(new THREE.BoxGeometry(.9,.7,.7), mat(0xfff8ec)); box.position.set(1.9,.35,-1.6); box.castShadow=true; g.add(box);
  const hh=new THREE.Mesh(heartGeo(.22), mat(0xe05454)); hh.position.set(1.9,.42,-1.22); g.add(hh);
  const slot=new THREE.Mesh(new THREE.BoxGeometry(.4,.03,.1), mat(0x2b2b33)); slot.position.set(1.9,.72,-1.6); g.add(slot);
  return g;
}

/* --- reading: book stack + open book --- */
function buildReading(z){
  const g=new THREE.Group();
  const cols=[0xe05454,0x4f7fe0,0x3f9e57,0xe08a1e,0x7a4fd0];
  let y=0;
  const sizes=[[2.1,.42,1.5],[1.9,.38,1.35],[1.7,.36,1.2],[1.45,.34,1.05]];
  sizes.forEach((s,i)=>{
    const cover=new THREE.Mesh(new THREE.BoxGeometry(s[0],s[1],s[2]), mat(cols[i]));
    cover.position.y=y+s[1]/2; cover.rotation.y=rand(-.22,.22); cover.castShadow=true;
    const pages=new THREE.Mesh(new THREE.BoxGeometry(s[0]*.92,s[1]*.62,s[2]*1.02), mat(0xfffdf4));
    pages.position.copy(cover.position); pages.rotation.copy(cover.rotation);
    g.add(pages); g.add(cover);
    y+=s[1];
  });
  // open book on top
  const ob=new THREE.Group();
  [-1,1].forEach(sd=>{
    const pg=new THREE.Mesh(new THREE.PlaneGeometry(.75,.55), new THREE.MeshLambertMaterial({color:0xfffdf4,side:THREE.DoubleSide}));
    pg.rotation.x=-Math.PI/2+ .42*sd* -1; pg.rotation.y=0; pg.position.x=sd*.36; pg.rotation.z=sd*-.42;
    ob.add(pg);
  });
  ob.position.y=y+.12; ob.rotation.y=.4; g.add(ob);
  // floating letters
  const abc=textSprite('A B C · 字',{fs:52,scale:1.1,stroke:'#2bb6a0'});
  abc.position.set(0,y+1.35,0); g.add(abc);
  g.userData.absSprite=abc;
  // lamp
  const lampG=new THREE.Group();
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,2.3,8), mat(0x3a3f4a)); pole.position.y=1.15; lampG.add(pole);
  const shade=new THREE.Mesh(new THREE.ConeGeometry(.34,.3,10), mat(0xffd23f)); shade.position.y=2.35; lampG.add(shade);
  const bulb=new THREE.PointLight(0xffe8b0, 5, 6); bulb.position.y=2.2; lampG.add(bulb);
  lampG.position.set(1.9,0,1.3); g.add(lampG);
  return g;
}

/* build all zones + signs */
const builders={ gallery:buildGallery, numbers:buildNumbers, builder:buildBuilder, sports:buildSports, nature:buildNature, kindness:buildKindness, reading:buildReading };
EXTRA_SCENES.forEach(s=>{ builders[s.id]=(z)=>s.build(z,{ THREE, mat }); });
const zoneGroups={};
zoneDefs.forEach(z=>{
  const g=builders[z.id](z);
  g.position.set(z.pos.x,0,z.pos.z);
  g.lookAt(0,0,0);          /* zone content faces plaza */
  tagZone(g,z.id);
  world.add(g); zoneGroups[z.id]=g;
  const sign=signpost(I18N.en.zones[z.id].t, I18N.zh.zones[z.id].t, z.color);
  const sp=z.pos.clone().multiplyScalar(.72);
  sign.position.set(sp.x,0,sp.z);
  sign.lookAt(0,1.6,0);
  tagZone(sign,z.id);
  world.add(sign);
});

/* ---- Story House: a cottage with an open-book roof; its door leads to stories.html ---- */
const STORY_POS=(()=>{const [x,z]=polar(192,14.5);return new THREE.Vector3(x,0,z);})();
const STORY_DIR=new THREE.Vector3(-STORY_POS.x,0,-STORY_POS.z).normalize();   /* door faces the plaza */
const STORY_DOOR=STORY_POS.clone().addScaledVector(STORY_DIR,1.9);
const storyHouse=new THREE.Group();
let storyGlow;
{
  const H=storyHouse, wall=mat(0xfff1d6), trimM=mat(0xc98f5a), wood=mat(0x9a6a43);
  const box=(w,h,d,m,x,y,z)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); o.castShadow=true; o.receiveShadow=true; H.add(o); return o; };
  box(3,2.1,2.4,wall,0,1.05,0);
  box(3.12,.22,2.52,trimM,0,.11,0);
  /* gable ends under the roof */
  const tri=new THREE.Shape(); tri.moveTo(-1.2,0); tri.lineTo(1.2,0); tri.lineTo(0,1.02); tri.lineTo(-1.2,0);
  const gable=new THREE.Mesh(new THREE.ExtrudeGeometry(tri,{depth:2.96,bevelEnabled:false}).translate(0,0,-1.48),wall);
  gable.rotation.y=Math.PI/2; gable.position.y=2.1; H.add(gable);
  /* roof = an open book lying face-down: two covers, page blocks, a round spine */
  [[-1,0x2bb6a0],[1,0xe87070]].forEach(([sd,col])=>{
    const half=new THREE.Group(); half.position.y=3.12; half.rotation.x=sd*.62; H.add(half);
    let coverMat=mat(col);
    if(sd>0){   /* the front cover carries the title, like a real book */
      const c=makeCanvas(512,260), x=c.getContext('2d');
      x.fillStyle='#e87070'; x.fillRect(0,0,512,260);
      x.strokeStyle='#fff3dc'; x.lineWidth=8; rr(x,16,16,480,228,22); x.stroke();
      x.textAlign='center'; x.fillStyle='#fff8ea';
      x.font='900 76px "Noto Sans TC","PingFang TC",sans-serif'; x.fillText('滿滿故事屋',256,122);
      x.font='800 46px "Baloo 2",sans-serif'; x.fillText('★ Story House ★',256,196);
      const side=mat(col);
      coverMat=[side,side,new THREE.MeshLambertMaterial({map:canvasTexture(c)}),side,side,side];
    }
    const cover=new THREE.Mesh(new THREE.BoxGeometry(3.5,.09,1.78),coverMat); cover.position.z=sd*.87; cover.castShadow=true; half.add(cover);
    const pages=new THREE.Mesh(new THREE.BoxGeometry(3.3,.2,1.62),mat(0xfffaf0)); pages.position.set(0,-.14,sd*.8); half.add(pages);
  });
  const spine=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,3.5,12),mat(0x24877a));
  spine.rotation.z=Math.PI/2; spine.position.y=3.14; H.add(spine);
  /* chimney: a stack of books */
  [[0xffd166,.0],[0x4f7fe0,.25],[0xf7a8cc,-.2]].forEach(([c,r],i)=>{ const b=box(.52,.14,.38,mat(c),1.0,2.62+i*.14,-.62); b.rotation.y=r; });
  /* arched door, knob, step */
  const fr=new THREE.Mesh(new THREE.PlaneGeometry(1.04,1.3),trimM); fr.position.set(0,.85,1.206); H.add(fr);
  const frA=new THREE.Mesh(new THREE.CircleGeometry(.52,24,0,Math.PI),trimM); frA.position.set(0,1.5,1.206); H.add(frA);
  const dr=new THREE.Mesh(new THREE.PlaneGeometry(.88,1.22),wood); dr.position.set(0,.84,1.212); H.add(dr);
  const drA=new THREE.Mesh(new THREE.CircleGeometry(.44,24,0,Math.PI),wood); drA.position.set(0,1.45,1.212); H.add(drA);
  const knob=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),mat(0xffd166)); knob.position.set(.27,.9,1.25); H.add(knob);
  box(1.4,.12,.6,trimM,0,.06,1.5);
  /* windows show the picture-book covers */
  const loader=new THREE.TextureLoader();
  const win=(src,x,z,ry)=>{
    const g=new THREE.Group(); g.position.set(x,1.25,z); g.rotation.y=ry; H.add(g);
    const f=new THREE.Mesh(new THREE.PlaneGeometry(.74,.94),trimM); g.add(f);
    const tex=loader.load(src); tex.colorSpace=THREE.SRGBColorSpace;
    const p=new THREE.Mesh(new THREE.PlaneGeometry(.6,.8),new THREE.MeshBasicMaterial({map:tex})); p.position.z=.006; g.add(p);
  };
  win('stories/img/b1/cover.webp',-1.02,1.206,0);
  win('stories/img/b2/cover.webp', 1.02,1.206,0);
  win('stories/img/b3/cover.webp', 1.506,0,Math.PI/2);
  win('stories/img/s01/cover.webp',-1.506,0,-Math.PI/2);
  /* warm glow on the doorstep */
  storyGlow=new THREE.Mesh(new THREE.RingGeometry(.8,.98,40),new THREE.MeshBasicMaterial({color:0xffd166,transparent:true,opacity:.5,side:THREE.DoubleSide}));
  storyGlow.rotation.x=-Math.PI/2; storyGlow.position.set(0,.04,2.1); H.add(storyGlow);
  H.position.copy(STORY_POS); H.rotation.y=Math.atan2(STORY_DIR.x,STORY_DIR.z);
  H.traverse(o=>{ o.userData.portal='story'; });
  world.add(H);
  const sign=signpost(...I18N.en.storySign,0x2bb6a0);
  const sp=STORY_POS.clone().addScaledVector(STORY_DIR,2.2).add(new THREE.Vector3(STORY_DIR.z,0,-STORY_DIR.x).multiplyScalar(2.1));
  sign.position.copy(sp); sign.lookAt(0,1.6,0); world.add(sign);
  const mk=emojiSprite('📖',0x2bb6a0); mk.position.set(STORY_POS.x,4.6,STORY_POS.z);
  mk.userData.baseY=4.6; mk.userData.ph=1.3; scene.add(mk); markers.push(mk);
}
/* the rocket pad gets its own sign + marker so visitors find the Galaxy game */
{
  const toC=new THREE.Vector3(-ROCKET_PAD.x,0,-ROCKET_PAD.z).normalize();
  const sign=signpost(...I18N.en.galaxySign,0x7a4fd0);
  sign.position.copy(ROCKET_PAD).addScaledVector(toC,2.0).add(new THREE.Vector3(toC.z,0,-toC.x).multiplyScalar(-1.9));
  sign.lookAt(0,1.6,0); world.add(sign);
  const mk=emojiSprite('🌌',0x7a4fd0); mk.position.set(ROCKET_PAD.x,5.1,ROCKET_PAD.z);
  mk.userData.baseY=5.1; mk.userData.ph=2.4; scene.add(mk); markers.push(mk); rocketMarker=mk;
}

/* night lights: lanterns by the cottage door, the rocket pad and the plaza, and fireflies */
const glowTex=(()=>{ const c=makeCanvas(64,64), x=c.getContext('2d'), g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,240,180,1)'); g.addColorStop(.25,'rgba(255,210,110,.8)'); g.addColorStop(1,'rgba(255,190,80,0)');
  x.fillStyle=g; x.fillRect(0,0,64,64); return canvasTexture(c); })();
const glowSprite=(size)=>{ const sp=new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, fog:false }));
  sp.scale.set(size,size,1); sp.visible=false; scene.add(sp); return sp; };
{
  const side=new THREE.Vector3(STORY_DIR.z,0,-STORY_DIR.x);
  [-1,1].forEach(sd=>{ const g=glowSprite(.9); g.position.copy(STORY_POS).addScaledVector(STORY_DIR,1.3).addScaledVector(side,sd*.75).setY(1.9); nightGlows.push(g); });
  const w=glowSprite(1.7); w.position.copy(STORY_POS).addScaledVector(STORY_DIR,1.25).setY(1.2); nightGlows.push(w);   /* warm doorway */
  for(let i=0;i<6;i++){ const a=i/6*Math.PI*2, g=glowSprite(.6); g.position.set(ROCKET_PAD.x+Math.cos(a)*1.15,.35,ROCKET_PAD.z+Math.sin(a)*1.15); nightGlows.push(g); }
  /* little lamp posts around the plaza */
  for(let i=0;i<6;i++){
    const a=(i+.5)/6*Math.PI*2, x=Math.cos(a)*5.3, z=Math.sin(a)*5.3;
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.04,.06,1.3,8),mat(0x4a5060)); post.position.set(x,.65,z); post.castShadow=true; world.add(post);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),mat(0xfff3c4)); lamp.position.set(x,1.38,z); world.add(lamp);
    const g=glowSprite(.85); g.position.set(x,1.38,z); nightGlows.push(g);
  }
}
const fireflies=[];
for(let i=0;i<22;i++){
  const a=rand(0,Math.PI*2), r=rand(7,28), s=glowSprite(.55);
  fireflies.push({ s, x:Math.cos(a)*r, z:Math.sin(a)*r, y:rand(.6,2.2), r:rand(.5,1.6), sp:rand(.2,.5)*(i%2?1:-1), ph:rand(0,6) });
  nightGlows.push(s);
}
nightK=nightGoal; applyNight(nightK);

/* ---- perf: bake static meshes into merged buffers (far fewer draw calls).
        Disable with ?nomerge for A/B comparison. ---- */
if(!location.search.includes('nomerge')){
  const skipSet=new Set([
    rocket, storyHouse, millHub, welcomeGroup.userData.balloon,
    ...ducks.map(d=>d.g),
    ...beeSwarms.flatMap(s=>s.bees.map(b=>b.m)),
    ...markers, ...flames, ...heartMeshes,
  ]);
  const zoneRoots=new Set(Object.values(zoneGroups));
  zoneRoots.forEach(g=>mergeStatic(g,{skip:skipSet}));
  mergeStatic(world,{skip:skipSet, stop:zoneRoots, skipTagged:true});
}
scene.updateMatrixWorld(true);
/* interactive glow ring */
const glowRing=new THREE.Mesh(new THREE.RingGeometry(5.6,6.1,48), new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide}));
glowRing.rotation.x=-Math.PI/2; glowRing.position.y=.03; scene.add(glowRing);
/* =============== MAX AVATAR =============== */
function buildAvatar(cfg){
  const g=new THREE.Group();
  const inner=new THREE.Group(); g.add(inner);
  const legs=[], arms=[], eyes=[];
  const std=(color,rough=.7,extra={})=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:0,...extra});
  const skin=std(cfg.skin,.72,{emissive:0xffd8b5,emissiveIntensity:.18});
  const skinShade=std(0xe9b996,.8);
  const shirt=std(cfg.shirt,.82), collarM=std(0xffffff,.75);
  const shorts=std(cfg.shorts,.78), band=std(0x2c3852,.7);
  const hairM=std(cfg.hair,.62);
  const bowM=std(cfg.bow||0x8fb9e6,.5), trim=std(cfg.bow||0x8fb9e6,.6);
  const shoeM=std(cfg.shoes,.55), soleM=std(0xc6d4e6,.7), sockM=std(0xffffff,.85);
  const flat=c=>new THREE.MeshBasicMaterial({color:c});
  const add=(parent,geo,m,x=0,y=0,z=0)=>{ const o=new THREE.Mesh(geo,m); o.position.set(x,y,z); parent.add(o); return o; };

  /* ---- chubby mochi body ---- */
  const BODY_Y=.56, BR=.46, BSX=1.08, BSY=.9;
  const body=add(inner,new THREE.SphereGeometry(BR,48,36),shirt,0,BODY_Y,0); body.scale.set(BSX,BSY,1);
  const pants=add(inner,new THREE.SphereGeometry(BR*1.01,48,20,0,Math.PI*2,Math.PI*.55,Math.PI*.45),shorts,0,BODY_Y,0);
  pants.scale.set(BSX,BSY,1);
  /* waistband */
  const wy=BODY_Y+Math.cos(Math.PI*.55)*BR*BSY, wr=BR*1.012*Math.sin(Math.PI*.55);
  const wb=add(inner,new THREE.TorusGeometry(wr,.022,10,64),band,0,wy,0); wb.rotation.x=Math.PI/2; wb.scale.set(BSX,1,1);
  /* point on the front of the shirt at height y (for buttons) */
  const frontZ=y=>{ const k=(y-BODY_Y)/(BR*BSY); return BR*Math.sqrt(Math.max(0,1-k*k)); };
  [.82,.7,.6].forEach(y=>{
    const b=add(inner,new THREE.SphereGeometry(.024,14,10),trim,0,y,frontZ(y)-.004); b.scale.z=.55;
  });
  /* collar: two rounded points */
  const collarShape=new THREE.Shape();
  collarShape.moveTo(0,0); collarShape.quadraticCurveTo(.07,.005,.15,-.055); collarShape.quadraticCurveTo(.085,-.095,.0,-.07); collarShape.lineTo(0,0);
  [-1,1].forEach(sd=>{
    const geo=new THREE.ExtrudeGeometry(collarShape,{depth:.018,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:3,curveSegments:12});
    const c=add(inner,geo,collarM,sd*.02,.965,frontZ(.93)-.05);
    c.scale.x=sd; c.rotation.x=-.55; c.rotation.y=sd*.32;
  });
  /* ---- powder-blue bow tie, rounded ---- */
  const bow=new THREE.Group();
  const wing=new THREE.Shape();
  wing.moveTo(0,.025); wing.bezierCurveTo(.06,.075,.15,.085,.155,.03); wing.bezierCurveTo(.16,-.02,.16,-.045,.155,-.06);
  wing.bezierCurveTo(.15,-.1,.06,-.07,0,-.025); wing.lineTo(0,.025);
  [-1,1].forEach(sd=>{
    const geo=new THREE.ExtrudeGeometry(wing,{depth:.035,bevelEnabled:true,bevelThickness:.014,bevelSize:.012,bevelSegments:4,curveSegments:16});
    geo.translate(0,0,-.0175);
    const w=new THREE.Mesh(geo,bowM); w.scale.x=sd; w.position.x=sd*.018; bow.add(w);
  });
  const knot=add(bow,new THREE.SphereGeometry(.042,18,14),bowM,0,0,.012); knot.scale.set(.9,1.05,.75);
  bow.position.set(0,.9,frontZ(.9)+.012); bow.rotation.x=.18; inner.add(bow);

  /* ---- arms: puffy sleeve, forearm, mitten hand with thumb ---- */
  [-1,1].forEach(sd=>{
    const arm=new THREE.Group();
    const sl=add(arm,new THREE.SphereGeometry(.1,24,18),shirt,0,-.03,0); sl.scale.set(1,1.15,1);
    const cuff=add(arm,new THREE.TorusGeometry(.075,.014,8,28),trim,0,-.105,0); cuff.rotation.x=Math.PI/2;
    add(arm,new THREE.CapsuleGeometry(.055,.05,6,16),skin,0,-.15,0);
    const hand=add(arm,new THREE.SphereGeometry(.068,22,16),skin,0,-.215,0); hand.scale.set(1,1.05,.85);
    const thumb=add(arm,new THREE.SphereGeometry(.026,12,10),skin,sd*-.045,-.19,.04); thumb.scale.set(1,1.3,1);
    arm.position.set(sd*.45,.74,0); arm.rotation.z=sd*.5; inner.add(arm); arms.push(arm);
  });

  /* ---- legs: pivot at the hip; sock and sneaker ---- */
  [-1,1].forEach(sd=>{
    const leg=new THREE.Group();
    add(leg,new THREE.CapsuleGeometry(.058,.08,6,16),skin,0,-.15,0);
    add(leg,new THREE.CylinderGeometry(.062,.06,.06,20),sockM,0,-.215,0);
    const shoe=new THREE.Group(); shoe.position.set(0,-.255,.035); leg.add(shoe);
    const upper=add(shoe,new THREE.SphereGeometry(.1,28,20),shoeM,0,0,0); upper.scale.set(.95,.62,1.3);
    const sole=add(shoe,new THREE.CylinderGeometry(.1,.1,.03,28),soleM,0,-.042,0); sole.scale.set(.98,1,1.36);
    [.02,.055].forEach(z=>{ const l=add(shoe,new THREE.BoxGeometry(.07,.012,.014),trim,0,.055,z); l.rotation.x=-.35; });
    leg.position.set(sd*.17,.3,.06); inner.add(leg); legs.push(leg);
  });

  /* ---- head ---- */
  const head=new THREE.Group(); head.position.y=1.27; inner.add(head);
  const HS=[1.1,.9,.98], HR=.52;
  const skull=add(head,new THREE.SphereGeometry(HR,56,44),skin); skull.scale.set(...HS);
  /* face surface depth at (x,y) on the head ellipsoid */
  const faceZ=(x,y)=>{ const a=x/(HR*HS[0]), b=y/(HR*HS[1]); return HR*HS[2]*Math.sqrt(Math.max(0,1-a*a-b*b)); };

  /* hair: a cap that hugs the skull — puffy crown, scalloped bangs in front,
     short tufts at the nape, ears left clear, and a cowlick on the crown */
  const hairGeo=new THREE.SphereGeometry(HR,128,72,0,Math.PI*2,0,Math.PI*.72);
  {
    const p=hairGeo.attributes.position, v=new THREE.Vector3();
    const sstep=(a,b,x)=>{ const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); };
    for(let i=0;i<p.count;i++){
      v.fromBufferAttribute(p,i);
      const a=Math.atan2(v.x,v.z);                       /* 0 = facing forward */
      const F=Math.pow((1+Math.cos(a))/2,1.6);            /* 1 at the front, 0 at the back */
      const B=Math.pow((1-Math.cos(a))/2,.8);             /* 1 at the back, 0 at the front */
      let edge=Math.PI*(.4+.22*B);                        /* brow → above the ears → nape */
      edge+=F*Math.PI*.045*Math.abs(Math.sin(a*7.5+.4));  /* bang points */
      edge+=B*B*Math.PI*.035*Math.pow(Math.abs(Math.sin(a*5)),.6);   /* nape tufts */
      const th=Math.min(Math.acos(Math.max(-1,Math.min(1,v.y/HR))),edge);
      const u=th/edge;                                    /* 0 crown … 1 hairline */
      let r=1.075-.07*sstep(.45,1,u);                     /* volume on top, tucked in at the edge */
      r+=.03*F*sstep(.55,.85,u);                          /* fringe sits a touch proud */
      r*=HR;
      v.set(Math.sin(th)*Math.sin(a)*r,Math.cos(th)*r,Math.sin(th)*Math.cos(a)*r);
      p.setXYZ(i,v.x,v.y,v.z);
    }
    hairGeo.computeVertexNormals();
  }
  const hair=add(head,hairGeo,hairM); hair.scale.set(...HS);
  /* cartoon shine */
  const shine=add(head,new THREE.TorusGeometry(.3,.022,8,40,Math.PI*.55),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.22}),0,.33,.28);
  shine.rotation.set(-.95,0,Math.PI*.22);
  /* cowlick: two tapered strands springing from the crown */
  [[-.03,-1,.59],[.04,1,.56]].forEach(([x,sd,h])=>{
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x,.44,-.08),new THREE.Vector3(x+sd*.015,h,-.06),
      new THREE.Vector3(x+sd*.06,h+.035,-.01),new THREE.Vector3(x+sd*.11,h-.01,.03)]);
    const n=14;
    for(let k=0;k<n;k++){
      const t=k/(n-1), rad=.042*(1-t*.8);
      const b=add(head,new THREE.SphereGeometry(rad,12,10),hairM); b.position.copy(curve.getPoint(t));
    }
      });
  /* ears */
  [-1,1].forEach(sd=>{
    const ear=add(head,new THREE.SphereGeometry(.095,20,16),skin,sd*.58,-.08,.02); ear.scale.set(.5,1,.78);
    const inr=add(head,new THREE.SphereGeometry(.05,14,12),skinShade,sd*.6,-.08,.03); inr.scale.set(.35,.8,.6);
  });
  /* eyes: glossy ovals with two highlights (scaled together when blinking) */
  [-1,1].forEach(sd=>{
    const x=sd*.155, y=-.015;
    const eg=new THREE.Group(); eg.position.set(x,y,faceZ(x,y)-.018); eg.rotation.y=sd*.28; head.add(eg); eyes.push(eg);
    const e=add(eg,new THREE.SphereGeometry(.064,28,20),std(0x1b1d24,.22)); e.scale.set(.82,1.12,.45);
    add(eg,new THREE.SphereGeometry(.022,12,10),flat(0xffffff),.017,.03,.026);
    add(eg,new THREE.SphereGeometry(.011,10,8),flat(0xffffff),-.016,-.028,.026);
  });
  /* nose */
  add(head,new THREE.SphereGeometry(.028,14,10),skinShade,0,-.07,faceZ(0,-.07)+.008);
  /* blush */
  const bc=makeCanvas(64,64), bx=bc.getContext('2d'), grd=bx.createRadialGradient(32,32,2,32,32,32);
  grd.addColorStop(0,'rgba(255,140,130,.75)'); grd.addColorStop(1,'rgba(255,140,130,0)');
  bx.fillStyle=grd; bx.fillRect(0,0,64,64);
  const blushM=new THREE.MeshBasicMaterial({map:canvasTexture(bc),transparent:true,depthWrite:false});
  [-1,1].forEach(sd=>{
    const x=sd*.285, y=-.09;
    const b=add(head,new THREE.PlaneGeometry(.2,.13),blushM,x,y,faceZ(x,y)+.006); b.rotation.y=sd*.55;
  });
  /* open happy smile: dark mouth, teeth on top, tongue below */
  const mouth=new THREE.Group(); const my=-.14; mouth.position.set(0,my,faceZ(0,my)+.004); mouth.rotation.x=-.32; head.add(mouth);
  const ms=new THREE.Shape(); ms.moveTo(-.085,0); ms.quadraticCurveTo(0,.018,.085,0); ms.quadraticCurveTo(0,-.13,-.085,0);
  add(mouth,new THREE.ShapeGeometry(ms,24),flat(0x6e2a2c));
  const ts=new THREE.Shape(); ts.moveTo(-.07,.002); ts.quadraticCurveTo(0,.017,.07,.002); ts.lineTo(.062,-.02); ts.quadraticCurveTo(0,-.012,-.062,-.02); ts.lineTo(-.07,.002);
  add(mouth,new THREE.ShapeGeometry(ts,16),flat(0xffffff),0,0,.002);
  const tg=add(mouth,new THREE.CircleGeometry(.04,24),flat(0xf28a8a),0,-.05,.001); tg.scale.set(1.15,.6,1);

  /* name tag */
  const tag=textSprite('MAX ⭐',{fs:40,color:'#4f7fe0',stroke:'#dbe6ff',scale:.62});
  tag.position.y=2.16; g.add(tag);
  g.traverse(o=>{ if(o.isMesh && !(o.material.transparent)) o.castShadow=true; o.userData.zone='welcome'; });
  /* space helmet (worn for the rocket trip to the Galaxy game) */
  const helmet=new THREE.Group(); helmet.visible=false; head.add(helmet);
  const glass=add(helmet,new THREE.SphereGeometry(.76,40,28),
    new THREE.MeshStandardMaterial({color:0xd6ecff,transparent:true,opacity:.24,roughness:.05,metalness:.1,depthWrite:false}),0,.03,.02);
  glass.scale.set(1.04,.98,1.02);
  const collar=add(helmet,new THREE.TorusGeometry(.5,.075,12,44),std(0xf4f6fa,.4),0,-.6,0); collar.rotation.x=Math.PI/2;
  add(helmet,new THREE.CylinderGeometry(.014,.014,.26,8),std(0x9aa2ad,.4),.32,.84,0).rotation.z=-.35;
  add(helmet,new THREE.SphereGeometry(.045,14,10),std(0xe05454,.35),.37,.97,0);
  return { g, inner, legs, arms, head, eyes, helmet };
}
const max=buildAvatar(AVATAR);
max.g.position.set(0,0,2.2);
max.g.rotation.y=Math.PI;   /* face the island centre */
scene.add(max.g);

/* =============== BUTTERFLIES =============== */
const butterflies=[];
[[0xf7a8cc],[0xffd166],[0x9db8f0],[0xffffff],[0xb79ced],[0x9ad98f]].forEach((c,i)=>{
  const b=new THREE.Group();
  const wingG=new THREE.PlaneGeometry(.16,.22);
  const wl=new THREE.Mesh(wingG,new THREE.MeshLambertMaterial({color:c[0],side:THREE.DoubleSide}));
  const wr=wl.clone(); wl.position.x=-.08; wr.position.x=.08;
  b.add(wl); b.add(wr); b.userData={wl,wr,ph:rand(0,20),r:rand(9,19),h:rand(1.2,2.6),sp:rand(.1,.2)};
  scene.add(b); butterflies.push(b);
});

/* =============== CONFETTI =============== */
const confetti=[];
{
  const cols=[0xe05454,0xffd23f,0x4f7fe0,0x3f9e57,0xe08a1e,0x7a4fd0,0xf7a8cc];
  for(let i=0;i<80;i++){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(.09,.13),
      new THREE.MeshBasicMaterial({color:cols[i%7],side:THREE.DoubleSide,transparent:true}));
    m.visible=false; scene.add(m);
    confetti.push({m,vel:new THREE.Vector3(),rot:new THREE.Vector3(rand(1,6),rand(1,6),0),life:0});
  }
}
let confIdx=0;
function burst(pos,n=36,spread=2.6){
  for(let i=0;i<n;i++){
    const p=confetti[confIdx=(confIdx+1)%confetti.length];
    p.m.visible=true; p.m.position.copy(pos); p.m.position.y+=1.2;
    p.vel.set(rand(-spread,spread),rand(2.5,6),rand(-spread,spread));
    p.life=rand(1.1,1.7); p.m.material.opacity=1;
  }
}
function confettiRain(){
  let k=0;
  const iv=setInterval(()=>{
    burst(new THREE.Vector3(max.g.position.x+rand(-4,4),3,max.g.position.z+rand(-4,4)),18,3);
    if(++k>=10) clearInterval(iv);
  },220);
}

/* =============== AUDIO (tiny chimes) =============== */
let actx=null;
function ensureAudio(){ try{ if(!actx) actx=new (window.AudioContext||window.webkitAudioContext)(); if(actx.state==='suspended') actx.resume(); }catch(e){} }

/* mobile audio unlock: WebAudio must be resumed inside a user gesture, and on
   iOS a looping (near-)silent <audio> keeps the session in playback mode so
   sound works even with the ringer switch on silent */
let audioUnlocked=false;
function unlockAudio(){
  ensureAudio();
  if(!actx) return;
  if(actx.state==='suspended') actx.resume();
  if(!audioUnlocked){
    audioUnlocked=true;
    try{
      const s=actx.createBufferSource();
      s.buffer=actx.createBuffer(1,1,22050);
      s.connect(actx.destination); s.start(0);
    }catch(e){}
    try{
      const au=new Audio(silentWavURL());
      au.loop=true; au.volume=.01; au.setAttribute('playsinline','');
      au.play().catch(()=>{ audioUnlocked=false; });
    }catch(e){}
  }
  if(soundOn && started) startMusic();
}
['pointerdown','touchend','click'].forEach(ev=>document.addEventListener(ev,unlockAudio,{passive:true}));
document.addEventListener('visibilitychange',()=>{ if(!document.hidden && actx && actx.state==='suspended') actx.resume(); });
function note(freq,t0,dur=.16,type='triangle',vol=.12){
  if(!actx || !soundOn) return;
  const o=actx.createOscillator(), gn=actx.createGain();
  o.type=type; o.frequency.value=freq;
  gn.gain.setValueAtTime(0,actx.currentTime+t0);
  gn.gain.linearRampToValueAtTime(vol,actx.currentTime+t0+.02);
  gn.gain.exponentialRampToValueAtTime(.001,actx.currentTime+t0+dur);
  o.connect(gn); gn.connect(actx.destination);
  o.start(actx.currentTime+t0); o.stop(actx.currentTime+t0+dur+.05);
}
let soundOn=true;   /* restored from save at boot */
let musicDuck=1;    /* music volume while the narrator talks */
let panelSpeech='';
/* "title. subtitle! body" — only add a full stop where a part doesn't already end with one */
function speechOf(z,lg){
  const zh=lg==='zh';
  const t=[z.t,z.sub,z.body].map((p,i,a)=>i<a.length-1&&!/[。！？!?.]$/.test(p)?p+(zh?'。':'.'):p).join(zh?'':' ');
  return zh ? t : t.replace(/\s*\([\u4e00-\u9fff]+\)/g,'');   /* the English voice can't say 滿滿 — it hears "Mun Mun" */
}
const narrator=createNarrator({
  getLang:()=>lang, isSoundOn:()=>soundOn,
  onSpeaking:on=>{ musicDuck=on?.3:1; $('#panelspeak').classList.toggle('on',on); },
});

/* gentle music-box loop (C pentatonic) + occasional birdsong */
const MELODY=[523.25,0,659.25,0,783.99,0,880,0, 783.99,0,659.25,0,587.33,0,0,0,
              659.25,0,783.99,0,1046.5,0,880,0, 783.99,0,659.25,0,523.25,0,0,0];
const BASSLINE=[261.63,196,220,196];
let musStep=0, musTimer=null;
function startMusic(){
  if(musTimer) return;
  musTimer=setInterval(()=>{
    if(!soundOn || !actx || document.hidden) return;
    const f=MELODY[musStep%MELODY.length];
    if(f) note(f,0,.55,'sine',.042*musicDuck);
    if(musStep%8===0) note(BASSLINE[(musStep>>3)%BASSLINE.length],0,1.1,'triangle',.026*musicDuck);
    musStep++;
  },300);
}
function chirp(vol=.045){
  if(!soundOn || !actx || document.hidden) return;
  const base=rand(1700,2400), n=2+Math.floor(rand(0,3));
  for(let i=0;i<n;i++){
    note(base*rand(.95,1.1), i*.13, .07,'sine',vol);
    note(base*1.3, i*.13+.05, .05,'sine',vol*.66);
  }
}
setInterval(()=>{ if(started && Math.random()<.55) chirp(); },9000);

function updateSndBtn(){ $('#sndbtn').textContent = soundOn ? '🔊' : '🔇'; }
$('#sndbtn').onclick=()=>{
  soundOn=!soundOn;
  if(soundOn){ ensureAudio(); startMusic(); ding(); }
  else { setBeeLevel(0); narrator.stop(); }
  updateSndBtn(); saveGame();
};

const ding=()=>{ note(880,0); note(1318.5,.09,.22); };
const goalSound=()=>{ note(659,0); note(784,.1); note(1047,.2,.3); };
const fanfare=()=>{ [523,659,784,1047,1318].forEach((f,i)=>note(f,i*.12,.28)); };

/* ---- positional ambience: quacks, bees, campfire, butterflies, tree birds ---- */
function blip(f0,f1,t0,dur,type,vol){
  if(!actx || !soundOn) return;
  const o=actx.createOscillator(), g=actx.createGain(), T=actx.currentTime+t0;
  o.type=type;
  o.frequency.setValueAtTime(f0,T);
  o.frequency.exponentialRampToValueAtTime(Math.max(40,f1),T+dur);
  g.gain.setValueAtTime(0,T);
  g.gain.linearRampToValueAtTime(vol,T+.02);
  g.gain.exponentialRampToValueAtTime(.001,T+dur);
  o.connect(g); g.connect(actx.destination);
  o.start(T); o.stop(T+dur+.05);
}
let noiseBuf=null;
function noiseHit(t0,dur,freq,q,vol){
  if(!actx || !soundOn) return;
  if(!noiseBuf){
    noiseBuf=actx.createBuffer(1,actx.sampleRate,actx.sampleRate);
    const d=noiseBuf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  }
  const src=actx.createBufferSource(); src.buffer=noiseBuf; src.loop=true;
  const bp=actx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=freq; bp.Q.value=q;
  const g=actx.createGain(), T=actx.currentTime+t0;
  g.gain.setValueAtTime(0,T);
  g.gain.linearRampToValueAtTime(vol,T+.012);
  g.gain.exponentialRampToValueAtTime(.001,T+dur);
  src.connect(bp); bp.connect(g); g.connect(actx.destination);
  src.start(T); src.stop(T+dur+.05);
}
function quack(vol){
  const n=2+(Math.random()<.4?1:0);
  for(let i=0;i<n;i++) blip(rand(240,290),rand(150,175),i*.19,.13,'sawtooth',vol*rand(.8,1));
}
function crackle(vol){
  const n=1+Math.floor(rand(0,3));
  for(let i=0;i<n;i++) noiseHit(rand(0,.5),rand(.03,.07),rand(900,2400),3,vol*rand(.5,1));
}
function flit(vol){ noiseHit(0,.09,3200,1.6,vol); noiseHit(.11,.07,2800,1.6,vol*.7); }
/* continuous bee hum whose loudness follows proximity */
let beeOsc=null, beeGain=null;
function setBeeLevel(v){
  if(!actx) return;
  if(!beeOsc){
    beeOsc=actx.createOscillator(); beeGain=actx.createGain();
    beeOsc.type='sawtooth'; beeOsc.frequency.value=165;
    const lfo=actx.createOscillator(), lg=actx.createGain();
    lfo.frequency.value=6.2; lg.gain.value=16;
    lfo.connect(lg); lg.connect(beeOsc.frequency); lfo.start();
    beeGain.gain.value=0;
    beeOsc.connect(beeGain); beeGain.connect(actx.destination);
    beeOsc.start();
  }
  beeGain.gain.linearRampToValueAtTime(v,actx.currentTime+.35);
}
setInterval(()=>{
  if(!started || !actx || document.hidden) return;
  if(!soundOn){ setBeeLevel(0); return; }
  const p=max.g.position;
  /* bee hum level = nearest swarm */
  let bv=0;
  beeSwarms.forEach(s=>{
    const d=Math.hypot(p.x-s.x,p.z-s.z);
    if(d<6.5) bv=Math.max(bv,.045*(1-d/6.5)+.006);
  });
  setBeeLevel(bv);
  /* ducks by the pond */
  const dPond=Math.hypot(p.x-pondCenter.x,p.z-pondCenter.z);
  if(dPond<8.5 && Math.random()<.4) quack(.12*(1-dPond/8.5)+.02);
  /* campfire crackle on the Nature Trail */
  const dFire=Math.hypot(p.x-zones.nature.pos.x,p.z-zones.nature.pos.z);
  if(dFire<7.5 && Math.random()<.65) crackle(.1*(1-dFire/7.5)+.01);
  /* butterfly wing flits */
  let bd=1e9;
  butterflies.forEach(b=>{ bd=Math.min(bd,Math.hypot(p.x-b.position.x,p.z-b.position.z)); });
  if(bd<3 && Math.random()<.5) flit(.05*(1-bd/3)+.008);
  /* birdsong is denser near the trees on the rim */
  let td=1e9;
  TREE_POS.forEach(q=>{ td=Math.min(td,Math.hypot(p.x-q[0],p.z-q[1])); });
  if(td<8 && Math.random()<.35) chirp(.07*(1-td/8)+.015);
},800);

/* =============== INPUT =============== */
const keys={};
addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  if(e.code==='KeyE') tryInteract();
  if(e.code==='Space') tryJump();
  if(e.code==='Escape'){ closePanel(); $('#dirwrap').style.display='none'; }
});
addEventListener('keyup',e=>keys[e.code]=false);

/* joystick */
const joy={active:false,id:null,cx:0,cy:0,dx:0,dy:0};
const joyEl=$('#joy'), joyBase=$('#joybase'), joyKnob=$('#joyknob');
if(isTouch){
  document.body.classList.add('touch');
  joyEl.style.display='block'; $('#mbtns').style.display='flex'; $('#actbtn').style.display='flex';
  $('#dpad').style.display='grid';
  document.querySelectorAll('.dbtn').forEach(b=>{
    const k=b.dataset.k;
    const press=e=>{ keys[k]=true; b.classList.add('held'); if(b.setPointerCapture&&e.pointerId!=null)b.setPointerCapture(e.pointerId); e.preventDefault(); };
    const release=()=>{ keys[k]=false; b.classList.remove('held'); };
    b.addEventListener('pointerdown',press);
    b.addEventListener('pointerup',release);
    b.addEventListener('pointercancel',release);
    b.addEventListener('lostpointercapture',release);
    b.addEventListener('contextmenu',e=>e.preventDefault());
  });
  joyEl.addEventListener('touchstart',e=>{
    const t=e.changedTouches[0];
    joy.active=true; joy.id=t.identifier; joy.cx=t.clientX; joy.cy=t.clientY; joy.dx=joy.dy=0;
    joyBase.style.display='block'; joyKnob.style.display='block';
    joyBase.style.left=(joy.cx-55)+'px'; joyBase.style.top=(joy.cy-55)+'px';
    joyKnob.style.left=(joy.cx-26)+'px'; joyKnob.style.top=(joy.cy-26)+'px';
    e.preventDefault();
  },{passive:false});
  joyEl.addEventListener('touchmove',e=>{
    for(const t of e.changedTouches){
      if(t.identifier===joy.id){
        let dx=t.clientX-joy.cx, dy=t.clientY-joy.cy;
        const len=Math.hypot(dx,dy), maxR=48;
        if(len>maxR){ dx*=maxR/len; dy*=maxR/len; }
        joy.dx=dx/maxR; joy.dy=dy/maxR;
        joyKnob.style.left=(joy.cx+dx-26)+'px'; joyKnob.style.top=(joy.cy+dy-26)+'px';
      }
    }
    e.preventDefault();
  },{passive:false});
  const joyEnd=e=>{
    for(const t of e.changedTouches){
      if(t.identifier===joy.id){
        joy.active=false; joy.dx=joy.dy=0;
        joyBase.style.display='none'; joyKnob.style.display='none';
      }
    }
  };
  joyEl.addEventListener('touchend',joyEnd); joyEl.addEventListener('touchcancel',joyEnd);
}

/* orbit drag + pinch + tap on canvas */
const cam={ theta:Math.PI, phi:.60, dist:isTouch?9:7.6, target:new THREE.Vector3() };
const pointers=new Map();
let pinchD0=0, distAtPinch=0, tapInfo=null;
const cv=renderer.domElement;
cv.addEventListener('pointerdown',e=>{
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===1) tapInfo={x:e.clientX,y:e.clientY,t:performance.now()};
  if(pointers.size===2){
    const p=[...pointers.values()];
    pinchD0=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y); distAtPinch=cam.dist;
  }
});
cv.addEventListener('pointermove',e=>{
  const p=pointers.get(e.pointerId); if(!p) return;
  const dx=e.clientX-p.x, dy=e.clientY-p.y;
  p.x=e.clientX; p.y=e.clientY;
  if(pointers.size===1){
    cam.theta-=dx*.0052; cam.phi=clamp(cam.phi-dy*.0038,.25,1.32);
    if(tapInfo && Math.hypot(e.clientX-tapInfo.x,e.clientY-tapInfo.y)>8) tapInfo=null;
  }else if(pointers.size===2){
    const q=[...pointers.values()];
    const d=Math.hypot(q[0].x-q[1].x,q[0].y-q[1].y);
    if(pinchD0>0) cam.dist=clamp(distAtPinch*pinchD0/d,3.5,17);
    tapInfo=null;
  }
});
const prelease=e=>{
  pointers.delete(e.pointerId);
  if(tapInfo && performance.now()-tapInfo.t<420 && pointers.size===0){ handleTap(tapInfo.x,tapInfo.y); }
  if(pointers.size<2) pinchD0=0;
  if(pointers.size===0) tapInfo=null;
};
cv.addEventListener('pointerup',prelease); cv.addEventListener('pointercancel',prelease);
cv.addEventListener('wheel',e=>{ cam.dist=clamp(cam.dist+e.deltaY*.008,3.5,17); e.preventDefault(); },{passive:false});

/* raycast tap */
const raycaster=new THREE.Raycaster();
function handleTap(x,y){
  if(started===false || panelOpen) return;
  raycaster.setFromCamera(new THREE.Vector2(x/innerWidth*2-1, -(y/innerHeight)*2+1), camera);
  const hits=raycaster.intersectObjects([world,max.g],true);
  for(const h of hits){
    let o=h.object, zid=null;
    let ro=h.object;
    while(ro){ if(ro.userData && ro.userData.portal){ const p=PORTALS.find(q=>q.id===ro.userData.portal); if(portalNear===p) p.go(); else toast(T().walkCloser); return; } ro=ro.parent; }
    while(o){ if(o.userData && o.userData.zone){ zid=o.userData.zone; break; } o=o.parent; }
    if(zid){
      const zp=zones[zid].pos;
      if(max.g.position.distanceTo(new THREE.Vector3(zp.x,0,zp.z)) < (zones[zid].radius||6.4)+2.4) openPanel(zid);
      else toast(T().walkCloser);
      return;
    }
  }
}
/* =============== GAME STATE / UI =============== */
let started=false, panelOpen=false, currentPanel=null, celebrated=false;
const visited=new Set();
const SAVE_KEY='maxworld.v1';
function saveGame(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify({lang, visited:[...visited], sound:soundOn})); }catch(e){} }
const state={ vy:0, onGround:true, walkT:0, blink:rand(2,4), moving:false };

/* stars HUD */
const starEls=[];
{
  const wrap=$('#stars');
  for(let i=0;i<ZONE_COUNT;i++){ const s=document.createElement('span'); s.className='st'; s.textContent='★'; wrap.appendChild(s); starEls.push(s); }
  const lbl=document.createElement('span'); lbl.className='lbl'; lbl.id='starlbl'; wrap.appendChild(lbl);
}
function updateStars(){
  starEls.forEach((s,i)=>s.classList.toggle('on', i<visited.size));
  $('#starlbl').textContent=T().explored(visited.size,ZONE_COUNT);
}

function toast(msg){
  const el=$('#toast'); el.textContent=msg; el.style.opacity=1;
  clearTimeout(el._t); el._t=setTimeout(()=>el.style.opacity=0,1900);
}
function bigMsg(msg,dur=1600){
  const el=$('#bigmsg'); el.textContent=msg; el.classList.add('show');
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),dur);
}

/* panel */
function openPanel(id){
  const z=T().zones[id]; if(!z) return;
  currentPanel=id; panelOpen=true;
  $('#panelicon').textContent=z.icon;
  $('#paneltitle').textContent=z.t;
  $('#panelsub').textContent=z.sub;
  $('#panelbody').textContent=z.body;
  const chips=$('#panelchips'); chips.innerHTML='';
  z.chips.forEach(c=>{ const s=document.createElement('span'); s.className='chip'; s.textContent=c; chips.appendChild(s); });
  const gal=$('#panelgal'); gal.innerHTML='';
  if(id==='gallery'){
    ARTWORKS.forEach((a,i)=>{
      const d=document.createElement('div'); d.className='art';
      const img=document.createElement('img'); img.src=artSrc(a); img.alt=a[lang]; img.loading='lazy';
      const cap=document.createElement('div'); cap.className='cap'; cap.textContent=a[lang];
      d.appendChild(img); d.appendChild(cap);
      d.onclick=()=>showArt(i);
      gal.appendChild(d);
    });
  }
  if(id==='welcome'){   /* where Max has lived and travelled */
    const a=document.createElement('a'); a.className='dirtour'; a.href='earth.html';
    a.style.cssText='background:linear-gradient(135deg,#1f6fb8,#3fae6a);text-decoration:none;grid-column:1/-1;margin:0';
    a.textContent=T().footprints; gal.appendChild(a);
  }
  if(id==='reading'){   /* a peek at the Story House shelf */
    [['b1','滿滿和會變色的情緒怪獸'],['b2','滿滿腦子裏的紅黃綠小隊'],['b3','小綠的兩種練習'],['','']].forEach(([b,t])=>{
      const d=document.createElement('a'); d.className='art book'; d.href='stories.html'+(b?'#'+b:'');
      const img=document.createElement('img'); img.src=b?`stories/img/${b}/cover.webp`:'stories/img/s01/cover.webp'; img.alt=t; img.loading='lazy';
      const cap=document.createElement('div'); cap.className='cap'; cap.textContent=b?t:(lang==='zh'?'📖 全部 20 本故事 ▶':'📖 All 20 stories ▶');
      d.appendChild(img); d.appendChild(cap); gal.appendChild(d);
    });
  }
  $('#tournext').style.display = tour.active ? 'block' : 'none';
  if(tour.active) $('#tournext').textContent=T().tourNext;
  $('#panelwrap').style.display='flex';
  panelSpeech=speechOf(z,lang);
  narrator.speak(panelSpeech);
  /* collect star (7 themed zones only) */
  if(id!=='welcome' && !visited.has(id)){
    visited.add(id); updateStars(); saveGame(); ding();
    burst(max.g.position.clone(),30);
    if(visited.size===ZONE_COUNT && !celebrated){
      celebrated=true;
      setTimeout(()=>{ bigMsg(T().allDone,2600); fanfare(); confettiRain(); setTimeout(()=>toast(T().allDoneNext),2800); },600);
    }
  }
}
function closePanel(){
  panelOpen=false; currentPanel=null; $('#panelwrap').style.display='none';
  narrator.stop();
  if(tour.active && !tour.target) nextTourStop();   /* tour: closing a stop's panel moves on */
}

/* auto tour — Max walks zone to zone by himself */
const tour={ active:false, queue:[], target:null, zone:null };
const _tv=new THREE.Vector3();
function updateTourHud(){
  $('#tourhud').textContent = tour.active ? T().tourStop : T().tourBtn;
}
function startTour(){
  tour.active=true;
  tour.queue=[...zoneDefs.map(z=>z.id),'story','rocket'];   /* ends at the Story House, then the rocket */
  tour.zone=null; tour.target=null;
  updateTourHud();
  nextTourStop();
}
function nextTourStop(){
  const id=tour.queue.shift();
  if(!id){ endTour(); toast(T().thanks); return; }
  tour.zone=id;
  if(id==='story'||id==='rocket'){
    const at=id==='story'?STORY_DOOR:ROCKET_PAD;
    tour.target=at.clone().addScaledVector(new THREE.Vector3(-at.x,0,-at.z).normalize(),id==='story'?1.0:2.0);
    return;
  }
  const p=zones[id].pos;
  tour.target=new THREE.Vector3(p.x*.8,0,p.z*.8);
}
function endTour(){ tour.active=false; tour.target=null; tour.zone=null; updateTourHud(); hideInvite(); }
/* tour stop at the Story House / rocket: ask whether to go in */
const inviteSpeech=(k,lg)=>{ const v=I18N[lg].invite[k]; return v.t+(/[。！？!?.]$/.test(v.t)?'':(lg==='zh'?'。':'.'))+(lg==='zh'?'':' ')+v.body; };
function showInvite(k){
  const v=T().invite[k];
  $('#invic').textContent=v.icon; $('#invt').textContent=v.t; $('#invb').textContent=v.body;
  $('#invgo').textContent=v.go; $('#invnext').textContent=v.next;
  $('#invgo').onclick=()=>{ endTour(); k==='story' ? enterStories() : boardRocket(); };
  $('#invnext').onclick=()=>{ hideInvite(); if(k==='rocket'){ endTour(); toast(T().thanks); } else nextTourStop(); };
  $('#invite').style.display='block';
  narrator.speak(inviteSpeech(k,lang));
}
function hideInvite(){ if($('#invite').style.display==='block'){ $('#invite').style.display='none'; narrator.stop(); } }
$('#tournext').onclick=()=>closePanel();
$('#tourhud').onclick=()=>{ tour.active ? endTour() : startTour(); };

/* jump Max to a zone and open its card (map, gallery links) */
function goToZone(id){
  if(panelOpen) closePanel();
  if(id==='welcome') max.g.position.set(0,0,2.2);
  else{ const p=zones[id].pos; max.g.position.set(p.x*.8,0,p.z*.8); }
  state.vy=0;
  setTimeout(()=>openPanel(id),450);
}
/* walk-up places: stand Max by the Story House door or the rocket */
function goToPortal(id){
  if(panelOpen) closePanel();
  const p=id==='story' ? STORY_DOOR.clone().addScaledVector(STORY_DIR,1.0)
                       : ROCKET_PAD.clone().addScaledVector(new THREE.Vector3(-ROCKET_PAD.x,0,-ROCKET_PAD.z).normalize(),2.0);
  max.g.position.set(p.x,0,p.z); state.vy=0;
  const at=id==='story'?STORY_DOOR:ROCKET_PAD;
  max.g.rotation.y=Math.atan2(at.x-p.x,at.z-p.z);
}
/* zone directory — tap the M logo to jump anywhere */
function openDir(){
  $('#dirtitle').textContent=T().dirTitle;
  const list=$('#dirlist'); list.innerHTML='';
  const tb=document.createElement('button'); tb.className='dirtour'; tb.textContent=T().tourBtn;
  tb.onclick=()=>{ $('#dirwrap').style.display='none'; startTour(); };
  list.appendChild(tb);
  [['story',T().owStories,'linear-gradient(135deg,#f0a35e,#e0703a)'],['rocket',T().owGalaxy,'linear-gradient(135deg,#26306e,#7a4fd0)']].forEach(([id,[ic,name],bg])=>{
    const pb=document.createElement('button'); pb.className='dirtour'; pb.style.background=bg;
    pb.textContent=`${ic} ${name}`;
    pb.onclick=()=>{ $('#dirwrap').style.display='none'; goToPortal(id); };
    list.appendChild(pb);
  });
  ['welcome',...zoneDefs.map(z=>z.id)].forEach(id=>{
    const z=T().zones[id];
    const b=document.createElement('button'); b.className='diritem';
    b.innerHTML=`<span class="ic">${z.icon}</span><span>${z.t}</span>`+
      (id==='welcome'?'':`<span class="st2${visited.has(id)?' on':''}">★</span>`);
    b.onclick=()=>{ $('#dirwrap').style.display='none'; goToZone(id); };
    list.appendChild(b);
  });
  const eb=document.createElement('a'); eb.className='dirtour'; eb.href='earth.html';   /* Max's Footprints, last */
  eb.style.cssText='background:linear-gradient(135deg,#1f6fb8,#3fae6a);text-decoration:none;margin-top:10px';
  eb.textContent=T().footprints; list.appendChild(eb);
  $('#dirwrap').style.display='flex';
}
$('#logo').onclick=()=>{ if(started && !panelOpen) openDir(); };
$('#dirwrap').addEventListener('pointerdown',e=>{ if(e.target.id==='dirwrap') $('#dirwrap').style.display='none'; });
$('#panelclose').onclick=closePanel;
$('#panelspeak').onclick=()=>{ if(narrator.isSpeaking()) narrator.stop(); else { ensureAudio(); narrator.speak(panelSpeech,true); } };
$('#panelwrap').addEventListener('pointerdown',e=>{ if(e.target.id==='panelwrap') closePanel(); });
/* lightbox: one drawing at a time, ◀ ▶ / swipe / arrow keys to flip through */
let artAt=0;
function showArt(i){
  artAt=(i+ARTWORKS.length)%ARTWORKS.length;
  const a=ARTWORKS[artAt];
  $('#lbimg').src=artSrc(a,true); $('#lbcap').textContent=`${a[lang]}  ·  ${artAt+1}/${ARTWORKS.length}`;
  const ln=$('#lblink');   /* some drawings lead on to a story or a zone */
  ln.style.display=a.link?'inline-block':'none';
  if(a.link){ ln.textContent=a.link[lang]; ln.href=a.link.href||'#';
    ln.onclick=e=>{ e.stopPropagation(); if(a.link.zone){ e.preventDefault(); $('#lightbox').style.display='none'; goToZone(a.link.zone); } }; }
  $('#lightbox').style.display='flex';
  const nx=new Image(); nx.src=artSrc(ARTWORKS[(artAt+1)%ARTWORKS.length],true);
}
const lbOpen=()=>$('#lightbox').style.display==='flex';
$('#lightbox').onclick=()=>$('#lightbox').style.display='none';
$('#lbprev').onclick=e=>{ e.stopPropagation(); showArt(artAt-1); };
$('#lbnext').onclick=e=>{ e.stopPropagation(); showArt(artAt+1); };
{ let sx=0;
  $('#lightbox').addEventListener('touchstart',e=>{ sx=e.touches[0].clientX; },{passive:true});
  $('#lightbox').addEventListener('touchend',e=>{ const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>50){ e.preventDefault(); showArt(artAt+(dx<0?1:-1)); } });
  addEventListener('keydown',e=>{ if(!lbOpen()) return;
    if(e.key==='ArrowRight'){ showArt(artAt+1); e.stopImmediatePropagation(); }
    else if(e.key==='ArrowLeft'){ showArt(artAt-1); e.stopImmediatePropagation(); }
    else if(e.key==='Escape') $('#lightbox').style.display='none'; },true);
}

/* interact + jump */
let activeZone=null;
function tryInteract(){ if(!started||leaving) return; if(portalNear){ portalNear.go(); return; } if(activeZone) openPanel(activeZone); }
function tryJump(){ if(!started||panelOpen||riding) return; if(state.onGround){ state.vy=6.3; state.onGround=false; } }
$('#actbtn').onclick=()=>tryInteract();
$('#jumpbtn').onclick=()=>tryJump();
$('#hint').onclick=()=>tryInteract();

/* language */
function setLang(l){
  lang=l;
  $('#otag').innerHTML=T().otag;
  $('#octr').innerHTML=isTouch?T().octrMob:T().octrDesk;
  $('#startbtn').textContent=started ? (l==='zh'?'繼續探索':'Keep Exploring') : T().start;
  $('#owt').textContent=T().owTitle;
  /* tolerant on purpose: a card or its text may be missing while a page is mid-update */
  [['#owsto',T().owStories],['#owart',T().owArt],['#owgal',T().owGalaxy]].forEach(([id,v])=>{
    const a=$(id); if(!a||!v) return;
    a.querySelector('.i').textContent=v[0]; a.querySelector('b').textContent=v[1]; a.querySelector('small').textContent=v[2]; });
  if(portalNear) $('#hinttext').textContent=portalNear.label();
  document.querySelectorAll('#olang button').forEach(b=>b.classList.toggle('on',b.dataset.l===l));
  $('#langbtn').textContent = l==='en'?'中文':'EN';
  updateTourHud();
  updateStars();
  if(activeZone) $('#hinttext').textContent=`${T().zones[activeZone].icon} ${T().zones[activeZone].t}`;
  if(panelOpen && currentPanel) openPanel(currentPanel);
  document.documentElement.lang = l==='en'?'en':'zh-Hant';
  saveGame();
}
$('#langbtn').onclick=()=>setLang(lang==='en'?'zh':'en');
const updateNightBtn=()=>{ $('#nightbtn').textContent=nightGoal?'☀️':'🌙'; };
$('#nightbtn').onclick=()=>{ nightGoal=nightGoal?0:1; updateNightBtn(); };
updateNightBtn();
document.querySelectorAll('#olang button').forEach(b=>b.onclick=()=>setLang(b.dataset.l));

/* overlay */
let flyT=1, flyFrom=null;
$('#startbtn').onclick=()=>{
  ensureAudio(); narrator.unlock();
  $('#overlay').style.opacity=0;
  setTimeout(()=>$('#overlay').style.display='none',650);
  if(!started){
    started=true;
    flyT=0; flyFrom={dist:cam.dist,phi:cam.phi,theta:cam.theta};
    ding();
    setTimeout(()=>toast(T().menuTip),2600);
  }
  startMusic();
  $('#tourhud').style.display='flex';
};
/* "Art Gallery" card: start, land Max in the gallery and open its drawings */
$('#owart').onclick=e=>{
  e.preventDefault();
  const first=!started;
  $('#startbtn').click();
  const p=zones.gallery.pos; max.g.position.set(p.x*.82,0,p.z*.82);
  if(first){ flyT=1; cam.dist=isTouch?9.4:7.8; cam.phi=1.02; cam.theta=Math.atan2(-p.x,-p.z); }
  max.g.rotation.y=Math.atan2(p.x,p.z);
  setTimeout(()=>openPanel('gallery'),first?700:300);
};
$('#helpbtn').onclick=()=>{
  $('#startbtn').textContent = lang==='zh'?'繼續探索':'Keep Exploring';
  $('#overlay').style.display='flex';
  requestAnimationFrame(()=>$('#overlay').style.opacity=1);
};

/* =============== MAIN LOOP =============== */
const sportsGroup=zoneGroups.sports;
let prevBallLocalZ=0, goalCooldown=0;
const clock=new THREE.Clock();
let t=0;
let perfChecked=false, perfAcc=0, perfN=0;   /* adaptive quality for low-end devices */
const camTargetSmooth=new THREE.Vector3(0,1.1,2.2);

function tick(){
  requestAnimationFrame(tick);
  const dt=Math.min(clock.getDelta(),.05);
  t+=dt;

  /* ---- avatar movement ---- */
  let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  let iy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
  ix+=joy.dx; iy+=joy.dy;
  const ilen=Math.hypot(ix,iy);
  if(ilen>1){ ix/=ilen; iy/=ilen; }
  const inputMag=Math.min(ilen,1);
  state.moving = started && !panelOpen && !riding && inputMag>.06;

  /* auto tour: user input takes over, otherwise walk to the next stop */
  if(tour.active && state.moving) endTour();
  if(tour.active && !panelOpen && tour.target && flyT>=1){
    const dirv=_tv.subVectors(tour.target,max.g.position); dirv.y=0;
    if(dirv.length()<.45){
      tour.target=null;
      if(tour.zone==='story'||tour.zone==='rocket'){
        const at=tour.zone==='story'?STORY_DOOR:ROCKET_PAD;
        max.g.rotation.y=Math.atan2(at.x-max.g.position.x,at.z-max.g.position.z);
        showInvite(tour.zone);
      }else openPanel(tour.zone);
    }else{
      dirv.normalize();
      const tspeed=3.8;
      max.g.position.addScaledVector(dirv,tspeed*dt);
      max.g.rotation.y=lerpAngle(max.g.rotation.y,Math.atan2(dirv.x,dirv.z),Math.min(1,12*dt));
      state.walkT+=dt*tspeed*2.2;
      state.moving=true;
    }
  }

  if(state.moving && inputMag>.06){
    const fwd=new THREE.Vector3().subVectors(camTargetSmooth,camera.position); fwd.y=0; fwd.normalize();
    const right=new THREE.Vector3().crossVectors(fwd,new THREE.Vector3(0,1,0)).negate();
    const move=new THREE.Vector3().addScaledVector(fwd,-iy).addScaledVector(right,-ix);
    if(move.lengthSq()>0){
      move.normalize();
      const speed=4.4*inputMag;
      max.g.position.addScaledVector(move,speed*dt);
      const r=Math.hypot(max.g.position.x,max.g.position.z);
      if(r>WORLD_R-1.3){ max.g.position.x*=(WORLD_R-1.3)/r; max.g.position.z*=(WORLD_R-1.3)/r; }
      max.g.rotation.y=lerpAngle(max.g.rotation.y,Math.atan2(move.x,move.z),Math.min(1,12*dt));
      state.walkT+=dt*speed*2.2;
      /* kick the ball */
      if(ball){
        const bd=new THREE.Vector3().subVectors(ball.position,max.g.position); bd.y=0;
        if(bd.length()<.95){
          bd.normalize();
          ball.userData.vel.copy(bd.multiplyScalar(speed*1.5+2.2)); ball.userData.vel.y=2.4;
        }
      }
    }
  }else if(!(tour.active && tour.target)){
    state.walkT=0;   /* keep the walk cycle running while the tour is walking */
  }

  /* jump physics */
  if(!state.onGround){
    state.vy-=15.5*dt;
    max.g.position.y+=state.vy*dt;
    if(max.g.position.y<=0){
      max.g.position.y=0; state.onGround=true; state.vy=0;
      max.inner.scale.set(1.14,.8,1.14);
    }
  }
  max.inner.scale.lerp(new THREE.Vector3(1,1,1),Math.min(1,9*dt));

  /* walk / idle animation */
  if(state.moving && state.onGround){
    const w=state.walkT;
    max.legs[0].rotation.x=Math.sin(w)*.7; max.legs[1].rotation.x=-Math.sin(w)*.7;
    max.arms[0].rotation.x=-Math.sin(w)*.55; max.arms[1].rotation.x=Math.sin(w)*.55;
    max.inner.position.y=Math.abs(Math.sin(w*1))*.06;
    max.head.rotation.z=Math.sin(w*.5)*.04;
  }else{
    const e=Math.min(1,8*dt);
    max.legs.forEach(l=>l.rotation.x*= (1-e));
    max.arms.forEach(a=>a.rotation.x*= (1-e));
    max.inner.position.y=Math.sin(t*2.2)*.025+.01;
    max.arms[0].rotation.z=-.5-Math.sin(t*2.2)*.06;
    max.arms[1].rotation.z=.5+Math.sin(t*2.2)*.06;
    if(!state.onGround) max.legs.forEach(l=>l.rotation.x=-.3);
  }
  /* blink */
  state.blink-=dt;
  if(state.blink<0){
    const s=state.blink<-.12 ? 1 : .12;
    max.eyes.forEach(e=>e.scale.y=s);
    if(state.blink<-.12) state.blink=rand(2.2,4.6);
  }

  /* ---- ball physics ---- */
  if(ball){
    const v=ball.userData.vel;
    if(ball.position.y>.34 || v.y>0){ v.y-=13*dt; }
    ball.position.addScaledVector(v,dt);
    if(ball.position.y<.34){ ball.position.y=.34; if(v.y<-1) v.y=-v.y*.42; else v.y=0;
      v.x*=(1-2.4*dt); v.z*=(1-2.4*dt); }
    const br=Math.hypot(ball.position.x,ball.position.z);
    if(br>WORLD_R-1){ const n=new THREE.Vector3(ball.position.x/br,0,ball.position.z/br);
      const d=v.dot(n); if(d>0){ v.addScaledVector(n,-1.6*d); }
      ball.position.x*=(WORLD_R-1)/br; ball.position.z*=(WORLD_R-1)/br; }
    const sp=Math.hypot(v.x,v.z);
    if(sp>.05){ const axis=new THREE.Vector3(0,1,0).cross(new THREE.Vector3(v.x,0,v.z).normalize());
      ball.rotateOnWorldAxis(axis.normalize(),-sp*dt/.34); }
    /* goal detection */
    goalCooldown-=dt;
    const lb=sportsGroup.worldToLocal(ball.position.clone());
    if(goalCooldown<=0 && prevBallLocalZ>-3.1 && lb.z<=-3.1 && Math.abs(lb.x)<1.35 && ball.position.y<1.5){
      goalCooldown=4;
      bigMsg(T().goal,1500); goalSound(); burst(ball.position.clone(),40,3);
    }
    prevBallLocalZ=lb.z;
  }

  /* ---- zone proximity ---- */
  let nearest=null,nd=1e9;
  for(const id in zones){
    const z=zones[id];
    const d=Math.hypot(max.g.position.x-z.pos.x, max.g.position.z-z.pos.z);
    const rr2=(z.radius||6.4);
    if(d<rr2 && d<nd){ nd=d; nearest=id; }
  }
  if(nearest!==activeZone){
    activeZone=nearest;
    if(activeZone){
      $('#hinttext').textContent=`${T().zones[activeZone].icon} ${T().zones[activeZone].t}`;
      $('#hint').style.display='flex';
      $('#hint').querySelector('.key').style.display=isTouch?'none':'inline-block';
      glowRing.material.color.set(zones[activeZone].color||0xffffff);
      glowRing.position.set(zones[activeZone].pos.x,.04,zones[activeZone].pos.z);
      const sc=(zones[activeZone].radius||6.4)/6.1;
      glowRing.scale.set(sc,sc,1);
    }else{
      $('#hint').style.display='none';
    }
  }
  glowRing.material.opacity=activeZone?(.3+Math.sin(t*3.5)*.14):0;

  /* rocket / Story House hint (only when no zone hint is showing) */
  { let near=null;
    if(started && !activeZone && !panelOpen && !leaving){
      for(const p of PORTALS){ const at=p.at(); if(p.ok() && Math.hypot(max.g.position.x-at.x,max.g.position.z-at.z)<p.r){ near=p; break; } }
    }
    if(near!==portalNear){
      portalNear=near;
      if(near){
        $('#hinttext').textContent=near.label();
        $('#hint').style.display='flex';
        $('#hint').querySelector('.key').style.display=isTouch?'none':'inline-block';
      }else if(!activeZone) $('#hint').style.display='none';
    }
  }
  storyGlow.material.opacity=portalNear?.id==='story' ? .9 : .35+Math.sin(t*2.6)*.2;
  /* the cottage is solid: nudge Max back out of its walls */
  { const dx=max.g.position.x-STORY_POS.x, dz=max.g.position.z-STORY_POS.z, d=Math.hypot(dx,dz);
    if(d<2.0 && d>1e-3){ max.g.position.x=STORY_POS.x+dx/d*2.0; max.g.position.z=STORY_POS.z+dz/d*2.0; } }

  /* ---- ambient animations ---- */
  clouds.rotation.y+=dt*.0045;
  if(nightK!==nightGoal){ nightK=nightGoal>nightK?Math.min(nightGoal,nightK+dt/1.6):Math.max(nightGoal,nightK-dt/1.6); applyNight(nightK); }
  if(nightK>0) fireflies.forEach((f,i)=>{ const a=t*f.sp+f.ph;
    f.s.position.set(f.x+Math.cos(a)*f.r, f.y+Math.sin(t*1.3+f.ph)*.35, f.z+Math.sin(a*1.3)*f.r);
    f.s.material.opacity=nightK*(.55+.45*Math.sin(t*3+f.ph)); });

  /* ---- ambient life ---- */
  millHub.rotation.z+=dt*1.1;
  ducks.forEach(d=>{
    const a=t*d.sp+d.ph;
    d.g.position.set(pondCenter.x+Math.cos(a)*d.r,.04+Math.sin(t*2.1+d.ph)*.035,pondCenter.z+Math.sin(a)*d.r);
    d.g.rotation.y=-a+(d.sp>0?0:Math.PI);
  });
  birdFlock.rotation.y+=dt*.07;
  birdFlock.children.forEach((b,i)=>{
    b.position.y=birdY[i]+Math.sin(t*1.2+i*2)*.5;
    b.children[0].rotation.z=Math.sin(t*8+i)*.45;
    b.children[1].rotation.z=-Math.sin(t*8+i)*.45;
  });
  const habA=t*.05+2.2;
  hab.position.set(Math.cos(habA)*23,8.8+Math.sin(t*.42)*.55,Math.sin(habA)*23);
  hab.rotation.y=-habA;
  beeSwarms.forEach(s=>s.bees.forEach(b=>{
    const a=t*b.sp+b.ph;
    b.m.position.set(Math.cos(a)*b.r, b.h+Math.sin(t*7+b.ph)*.09, Math.sin(a)*b.r);
    b.m.rotation.y=-a+Math.PI/2;
  }));
  /* rocket: countdown on the pad -> lift-off -> into the Galaxy game;
     coming back from the Galaxy it glides down from the sky and lands */
  rocketT+=dt;
  if(rocketPhase===4){            /* countdown: Max (helmet on) waits by the rocket, then climbs in */
    max.g.position.set(ROCKET_PAD.x,0,ROCKET_PAD.z+1.7); state.vy=0;
    const n=3-Math.floor(rocketT);
    if(n<countN && n>0){ countN=n; bigMsg(String(n),800); ding(); }
    if(rocketT>2.5) max.g.visible=false;
    const shake=Math.min(1,rocketT/3)*.035;
    rocket.position.set(ROCKET_PAD.x+Math.sin(t*61)*shake,0,ROCKET_PAD.z+Math.cos(t*53)*shake);
    rocketFlame.visible=rocketT>1.8; rocketFlame.scale.set(.6,.5+Math.sin(t*40)*.15,.6);
    if(rocketT>=3){ rocketPhase=1; rocketT=0; bigMsg(T().liftoff,1400); fanfare(); }
  }else if(rocketPhase===1){      /* lift-off up into the sky, then on into space */
    const e=Math.min(rocketT/5,1), k=e*e*(3-2*e);
    rocketOrbitPos(ROCK_A0,_rp);
    rocket.position.lerpVectors(ROCKET_PAD,_rp,k);
    _rd.subVectors(_rp,ROCKET_PAD).normalize();
    _rp.set(0,1,0).lerp(_rd,Math.min(1,e*1.7)).normalize();
    rocket.quaternion.setFromUnitVectors(ROCK_UP,_rp);
    rocketFlame.visible=true; rocketFlame.scale.set(1,1+Math.sin(t*42)*.25,1);
    if(rocketT>2.4 && !leaving) leaveTo('galaxy.html?from=world','space');
  }else if(rocketPhase===3){      /* back from the Galaxy: glide down and land */
    const e=Math.min(rocketT/5.5,1), k=e*e*(3-2*e);
    rocket.position.lerpVectors(rocketOrbitPos(ROCK_A0,_rp),ROCKET_PAD,k);
    _rd.set(-Math.sin(ROCK_A0),0,Math.cos(ROCK_A0)).lerp(ROCK_UP,Math.min(1,e*2.2)).normalize();
    rocket.quaternion.setFromUnitVectors(ROCK_UP,_rd);
    rocketFlame.visible=true; rocketFlame.scale.set(1,.8+Math.sin(t*38)*.2,1);
    if(e>=1){
      rocketPhase=0; rocketT=0;
      rocket.quaternion.identity(); rocket.position.copy(ROCKET_PAD);
      rocketFlame.visible=false;
      riding=false;
      max.g.position.set(ROCKET_PAD.x,0,ROCKET_PAD.z+1.7);
      max.g.visible=true; state.vy=0; burst(max.g.position.clone(),24);
      toast(T().backFromGalaxy);
      setTimeout(()=>{ max.helmet.visible=false; },1800);
    }
  }
  if(riding && rocketPhase!==4){ max.g.position.copy(rocket.position); state.vy=0; }
  if(rocketMarker) rocketMarker.visible=rocketPhase===0;
  markers.forEach(mk=>{ mk.position.y=mk.userData.baseY+Math.sin(t*1.7+mk.userData.ph)*.28; });
  waterTexes.forEach(w=>w.offset.x-=dt*.22);
  flames.forEach((f,i)=>{ f.scale.y=1+Math.sin(t*11+i*2)*.2; f.scale.x=f.scale.z=1+Math.sin(t*13+i)*.1; });
  heartMeshes.forEach(h=>{ h.rotation.y=h.userData.sway+Math.sin(t*1.2+h.userData.sway)*.35; });
  const bal=welcomeGroup.userData.balloon;
  if(bal){ bal.position.y=3.4+Math.sin(t*1.25)*.13; bal.rotation.z=Math.sin(t*.85)*.09; }
  butterflies.forEach(b=>{
    const u=b.userData;
    const px=Math.cos(t*u.sp+u.ph)*u.r, pz=Math.sin(t*u.sp*1.27+u.ph)*u.r*.82;
    const py=u.h+Math.sin(t*1.8+u.ph)*.5;
    b.userData.prev=b.position.clone();
    b.position.set(px,py,pz);
    const dir=new THREE.Vector3().subVectors(b.position,u.prev||b.position);
    if(dir.lengthSq()>1e-6){ b.lookAt(b.position.clone().add(dir)); }
    const flap=Math.sin(t*17+u.ph)*.85;
    u.wl.rotation.set(0,flap,0); u.wr.rotation.set(0,-flap,0);
  });
  /* confetti */
  confetti.forEach(p=>{
    if(!p.m.visible) return;
    p.life-=dt;
    if(p.life<=0){ p.m.visible=false; return; }
    p.vel.y-=8.5*dt;
    p.m.position.addScaledVector(p.vel,dt);
    p.m.rotation.x+=p.rot.x*dt; p.m.rotation.y+=p.rot.y*dt;
    p.m.material.opacity=Math.min(1,p.life*1.4);
  });

  /* ---- camera ---- */
  if(!started){
    cam.theta+=dt*.11; cam.dist=26; cam.phi=.52;
    camTargetSmooth.lerp(new THREE.Vector3(0,1.5,0),Math.min(1,3*dt));
  }else{
    if(flyT<1){
      flyT=Math.min(1,flyT+dt/(flyFrom.dist>100?2.6:1.7));
      const e=1-Math.pow(1-flyT,3);
      cam.dist=THREE.MathUtils.lerp(flyFrom.dist,isTouch?9.4:7.8,e);
      cam.phi=THREE.MathUtils.lerp(flyFrom.phi,1.02,e);
      cam.theta=lerpAngle(flyFrom.theta,0,e);
    }
    const target=max.g.position.clone().add(new THREE.Vector3(0,1.15,0));
    camTargetSmooth.lerp(target,Math.min(1,10*dt));
  }
  const cp=new THREE.Vector3(
    camTargetSmooth.x+cam.dist*Math.sin(cam.phi)*Math.sin(cam.theta),
    camTargetSmooth.y+cam.dist*Math.cos(cam.phi),
    camTargetSmooth.z+cam.dist*Math.sin(cam.phi)*Math.cos(cam.theta)
  );
  camera.position.copy(cp);
  camera.lookAt(camTargetSmooth);

  /* adaptive quality: if the device struggles, lower resolution once */
  if(!perfChecked && started){
    if(t>4 && t<7){ perfAcc+=dt; perfN++; }
    else if(t>=7 && perfN>5){
      perfChecked=true;
      const avg=perfAcc/perfN;
      if(avg>.05){
        /* really struggling: lowest resolution + no shadows */
        renderer.setPixelRatio(1);
        renderer.shadowMap.enabled=false; sun.castShadow=false;
        scene.traverse(o=>{ if(o.material) (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true); });
      }else if(avg>.033){
        renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.35));
      }
    }
  }

  renderer.render(scene,camera);
}

/* resize */
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
cv.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('gesturestart',e=>e.preventDefault());

/* debug/test hooks */
/* every zone card's spoken text, for tools/make_voice.py */
function voiceLines(){
  const out=[];
  ['en','zh'].forEach(lg=>{
    const zs=I18N[lg].zones;
    for(const id in zs){ const z=zs[id], text=speechOf(z,lg); out.push({id:'world:'+id,lang:lg,key:textKey(text),text}); }
    ['story','rocket'].forEach(k=>{ const text=inviteSpeech(k,lg); out.push({id:'world:invite-'+k,lang:lg,key:textKey(text),text}); });
  });
  return out;
}
window.__max={
  voiceLines,
  teleport(id){ const p=zones[id].pos; max.g.position.set(p.x*.82,0,p.z*.82); },
  setPos(x,z){ max.g.position.set(x,0,z); },
  openPanel, closePanel, setLang, cam,
  start(){ $('#startbtn').click(); },
  skipFly(){ flyT=1; },
  state:()=>({ pos:max.g.position.toArray(), visited:[...visited], started, lang }),
  info:()=>({ calls:renderer.info.render.calls, triangles:renderer.info.render.triangles,
              geometries:renderer.info.memory.geometries, pixelRatio:renderer.getPixelRatio() })
};

/* boot: restore saved language + progress */
let saved={};
try{ saved=JSON.parse(localStorage.getItem(SAVE_KEY))||{}; }catch(e){}
(saved.visited||[]).forEach(id=>{ if(zones[id]) visited.add(id); });
if(visited.size>=ZONE_COUNT) celebrated=true;
soundOn = saved.sound!==false;
updateSndBtn();
setLang(saved.lang || (/^zh/i.test(navigator.language||'')?'zh':'en'));
updateStars();
/* back from the Galaxy game or the Story House: skip the intro and carry on
   where Max left — the rocket lands back on its pad, or he steps out of the cottage */
{
  const qs=new URLSearchParams(location.search), from=qs.get('from');
  const art=ARTWORKS.findIndex(a=>a.id===qs.get('art'));   /* ?art=bumblebee: show that drawing */
  if(from==='galaxy' || from==='stories' || from==='earth'){
    history.replaceState(null,'',location.pathname);
    started=true; flyT=1;
    $('#overlay').style.display='none'; $('#tourhud').style.display='flex';
    $('#startbtn').textContent = lang==='zh'?'繼續探索':'Keep Exploring';
    cam.dist=isTouch?9.4:7.8; cam.phi=1.02;
    const wake=()=>{ ensureAudio(); narrator.unlock(); startMusic();
      ['pointerdown','keydown'].forEach(ev=>removeEventListener(ev,wake,true)); };
    ['pointerdown','keydown'].forEach(ev=>addEventListener(ev,wake,true));
    if(from==='earth'){   /* dived down from the globe: drop out of the sky onto the plaza */
      flyT=0; flyFrom={dist:150,phi:.04,theta:0};
      setTimeout(()=>toast(T().backFromEarth),1600);
    }else if(from==='stories'){
      const p=STORY_DOOR.clone().addScaledVector(STORY_DIR,2.6);   /* just outside the door hint, so a stray tap does not go straight back in */
      max.g.position.set(p.x,0,p.z); max.g.rotation.y=Math.atan2(STORY_DIR.x,STORY_DIR.z);
      cam.theta=Math.atan2(STORY_DIR.x,STORY_DIR.z);
      setTimeout(()=>toast(T().backFromStories),400);
    }else{
      riding=true; max.g.visible=false; max.helmet.visible=true;
      rocketPhase=3; rocketT=0;
      cam.theta=Math.atan2(-ROCKET_PAD.x,-ROCKET_PAD.z);
    }
    camTargetSmooth.copy(max.g.position).y+=1.15;
    if(art>=0){ goToZone('gallery'); setTimeout(()=>showArt(art),900); }
  }
}
tick();
