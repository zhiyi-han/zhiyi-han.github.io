import * as THREE from 'three';
import { rand, clamp, makeCanvas, canvasTexture } from '../helpers.js?v=0c90647d';
import { createNarrator, textKey, silentWavURL } from '../narrator.js?v=0c90647d';

/* ============================================================
   Max's Galaxy Adventure
   Modes: 'solar'  — the Sun and nine planets, fly between them
          'saturn' — Saturn up close: rings, moons, hexagon storm
          'inside' — diving down through Saturn's clouds
          'galaxy' — the whole Milky Way, with its dark matter halo
   ============================================================ */

const $ = s => document.querySelector(s);
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const LOW = isTouch;

/* =============== prefs (language/sound shared with Max's World) =============== */
const WORLD_KEY='maxworld.v1', GAL_KEY='maxgalaxy.v1';
function readJSON(k){ try{ return JSON.parse(localStorage.getItem(k))||{}; }catch(e){ return {}; } }
function writeJSON(k,o){ try{ localStorage.setItem(k,JSON.stringify(o)); }catch(e){} }
const worldSave=readJSON(WORLD_KEY), galSave=readJSON(GAL_KEY);
let lang = worldSave.lang || (/^zh/i.test(navigator.language||'') ? 'zh' : 'en');
let soundOn = worldSave.sound !== false;
const visited = new Set(galSave.visited||[]);
let celebrated = visited.size>=9;
function savePrefs(){
  const w=readJSON(WORLD_KEY); w.lang=lang; w.sound=soundOn; writeJSON(WORLD_KEY,w);
  writeJSON(GAL_KEY,{visited:[...visited]});
}

/* =============== text =============== */
const NAMES={
  sun:['Sun','太陽'], mercury:['Mercury','水星'], venus:['Venus','金星'], earth:['Earth','地球'], mars:['Mars','火星'],
  jupiter:['Jupiter','木星'], saturn:['Saturn','土星'], uranus:['Uranus','天王星'], neptune:['Neptune','海王星'], pluto:['Pluto','冥王星'],
  galaxy:['Milky Way','銀河系'], darkmatter:['Dark Matter','暗物質'],
  rings:["Saturn's Rings",'土星環'], titan:['Titan','泰坦'], enceladus:['Enceladus','恩克拉多斯'],
  mimas:['Mimas','米瑪斯'], iapetus:['Iapetus','伊阿珀托斯'],
  hexagon:['Hexagon Storm','六邊形風暴'], inside:['Dive into Saturn','潛入土星'],
};
const FACTS={
  sun:["The Sun is a star — a giant ball of super-hot glowing gas. It's so big that about a million Earths could fit inside!",
       "太陽是一顆恆星——一個超級熱、會發光的大氣體球。它大到可以裝下大約一百萬個地球！"],
  mercury:["Mercury is the smallest planet and the closest to the Sun. A year there is only 88 days — you'd have a birthday every three months!",
       "水星是最小的行星，也是離太陽最近的。它的一年只有 88 天——每三個月就可以過一次生日！"],
  venus:["Venus is the hottest planet — even hotter than Mercury! Thick clouds trap the heat like a blanket. It also spins backwards.",
       "金星是最熱的行星，比水星還要熱！厚厚的雲層像被子一樣把熱力困住。它還是倒著轉的呢。"],
  earth:["Earth is our home! It's the only planet we know with oceans, trees, animals… and Max! The Moon goes round and round it.",
       "地球是我們的家！它是我們知道唯一有海洋、樹木、動物……還有 Max 的行星！月亮一直繞著它轉。"],
  mars:["Mars is the red planet — its dust is rusty like an old bike. The biggest volcano in the solar system, Olympus Mons, is on Mars.",
       "火星是紅色的星球——它的沙塵像生鏽的舊單車一樣紅。太陽系最大的火山「奧林帕斯山」就在火星上。"],
  jupiter:["Jupiter is the BIGGEST planet — more than 1,300 Earths could fit inside! The Great Red Spot is a storm bigger than Earth. Can you see its four big moons: Io, Europa, Ganymede and Callisto?",
       "木星是最大的行星——裡面可以放進一千三百多個地球！大紅斑是一個比地球還大的風暴。你看到它的四顆大衛星嗎？木衛一、木衛二、木衛三和木衛四。"],
  saturn:["Saturn has the most beautiful rings, made of ice and rock — some pieces are tiny like sand, some as big as a house! Saturn is so light it could float in a giant bathtub, and it has more than 200 moons.",
       "土星有最漂亮的光環，是由冰塊和石頭組成的——有些小得像沙粒，有些大得像房子！土星很輕，放進一個超大浴缸裡會浮起來。它還有超過 200 顆衛星。"],
  uranus:["Uranus is an ice giant that rolls around the Sun on its side, like a ball rolling across the floor!",
       "天王星是一顆冰巨星，它是側躺著繞太陽轉的，就像在地上滾的球！"],
  neptune:["Neptune is deep blue and the windiest planet — its winds blow faster than a jet plane! It's so far away that one year there lasts 165 Earth years.",
       "海王星是深藍色的，也是風最大的行星——風速比噴射機還快！它離我們好遠，那裡的一年等於地球的 165 年。"],
  pluto:["Pluto used to be called the ninth planet. Now scientists call it a dwarf planet — but it's still our friend! Look, it has a big heart on it!",
       "冥王星以前被叫做第九大行星，現在科學家叫它矮行星——但它仍然是我們的好朋友！看，它身上有一個大大的心形！"],
  galaxy:["Our Sun is just one of hundreds of billions of stars in the Milky Way galaxy. We live out in one of its spiral arms!",
       "太陽只是銀河系裡數千億顆恆星的其中一顆。我們住在銀河系的一條旋臂上！"],
  darkmatter:["Dark matter is invisible! We can't see it or touch it, but its gravity works like glue that holds whole galaxies together. Scientists think there is about five times more dark matter than all the stars, planets and gas put together!",
       "暗物質是看不見的！我們看不到也摸不到它，但它的引力就像膠水一樣，把整個銀河系黏在一起。科學家認為，暗物質大約是所有恆星、行星和氣體加起來的五倍！"],
  rings:["Saturn's rings are billions of chunks of ice. We're flying through the Cassini Division — a gap in the rings so wide our Moon could fit through!",
       "土星環是由數十億塊冰組成的。我們正在穿越「卡西尼縫」——光環之間的大空隙，寬到連月亮都可以穿過去！"],
  titan:["Titan is Saturn's biggest moon — bigger than the planet Mercury! It's wrapped in thick orange haze and has lakes made of liquid gas, not water.",
       "泰坦是土星最大的衛星——比水星還要大！它被厚厚的橙色霧氣包住，上面的湖泊不是水，而是液態的天然氣。"],
  enceladus:["Enceladus is a snowball moon that shoots giant fountains of water into space! A secret ocean is hiding under its ice.",
       "恩克拉多斯是一顆雪球衛星，會向太空噴出巨大的水柱噴泉！它的冰層下面藏著一個秘密海洋。"],
  mimas:["Mimas has one gigantic crater that makes it look like it has one huge eye!",
       "米瑪斯上有一個超大的隕石坑，看起來就像一隻大眼睛！"],
  iapetus:["Iapetus has two colours: one side is dark like coffee, the other is bright like snow!",
       "伊阿珀托斯有兩種顏色：一邊黑得像咖啡，另一邊白得像雪！"],
  hexagon:["At Saturn's north pole there's a giant storm shaped like a hexagon — it has six sides! It's wider than two Earths.",
       "土星北極有一個六邊形的巨大風暴——它有六條邊！比兩個地球加起來還要寬。"],
  inside:["Diving into Saturn! There's no ground to land on — just thicker and thicker clouds, giant lightning, and maybe… diamond rain!",
       "潛入土星！這裡沒有地面可以降落——只有越來越厚的雲、巨大的閃電，還可能……下鑽石雨！"],
};
const UI={
  en:{
    title:"Max's Galaxy Adventure", tag:"Hop in Max's spaceship! Visit all nine planets and the Sun, land on amazing worlds, and find the invisible dark matter.",
    start:"🚀 Blast off!", back:"Max's World", backFull:"← Back to Max's World", home:"🏠 Back to Max's World", footprints:"🗺️ Max's Footprints on Earth", plutoStory:"📖 Max's story: Is Pluto Still There?",
    visited:n=>`🪐 ${n}/9 planets visited`, fav:n=>n===1?"⭐ Max's #1 favourite planet!":`⭐ Max's #${n} favourite planet!`,
    exploreSaturn:"🪐 Explore inside Saturn!", toSolar:"Solar System", galaxy:"Milky Way", dm:"Dark Matter",
    warp:"Warp speed! 🚀", flying:n=>`Flying to ${n}…`, here:"☀️ We are here!", allDone:"🎉 All nine planets!",
    dmOn:"👓 Ghost glasses ON — now you can see dark matter!", dmOff:"Dark matter is hiding again 👻",
    depth:km=>`⬇️ Depth: ${km.toLocaleString('en')} km`, flyUp:"Fly back up", ship:"🚀 Max",
    tapHint:"Tap a planet to fly there!", satHint:"Tap a place to explore Saturn!",
    insideToasts:["☁️ Clouds made of ammonia ice!","⚡ Giant lightning storms!","💎 It might rain diamonds down here!"],
  },
  zh:{
    title:"Max 的銀河大冒險", tag:"坐上 Max 的太空船！飛去九大行星和太陽，降落在神奇的星球上，再找找看不見的暗物質。",
    start:"🚀 出發！", back:"Max 的小世界", backFull:"← 回到 Max 的小世界", home:"🏠 回到 Max 的小世界", footprints:"🗺️ 看看 Max 在地球上的足跡", plutoStory:"📖 聽滿滿的故事：冥王星還在嗎？",
    visited:n=>`🪐 已到訪 ${n}/9 顆行星`, fav:n=>n===1?"⭐ Max 最喜歡的行星！":`⭐ Max 第${'一二三四五六七八九'[n-1]}喜歡的行星！`,
    exploreSaturn:"🪐 進入土星探險！", toSolar:"太陽系", galaxy:"銀河系", dm:"暗物質",
    warp:"超光速飛行！🚀", flying:n=>`正在飛往${n}……`, here:"☀️ 我們在這裡！", allDone:"🎉 九大行星全部去過啦！",
    dmOn:"👓 戴上「幽靈眼鏡」——現在看得見暗物質了！", dmOff:"暗物質又躲起來了 👻",
    depth:km=>`⬇️ 深度：${km.toLocaleString('en')} 公里`, flyUp:"飛回太空", ship:"🚀 Max",
    tapHint:"點一下行星，就會飛過去！", satHint:"點一個地方，開始土星探險！",
    insideToasts:["☁️ 氨冰組成的雲！","⚡ 超巨大的閃電風暴！","💎 這裡可能在下鑽石雨！"],
  },
};
const T=()=>UI[lang];
const L=()=>lang==='zh'?1:0;
const nm=id=>NAMES[id][L()];
const fact=id=>FACTS[id][L()];
const PLANETS=['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','pluto'];

/* =============== textures =============== */
function glowTex(){
  const c=makeCanvas(64,64), x=c.getContext('2d');
  const g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.25,'rgba(255,255,255,.8)');
  g.addColorStop(.6,'rgba(255,255,255,.18)'); g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g; x.fillRect(0,0,64,64);
  return canvasTexture(c);
}
const GLOW=glowTex();

function bandTex(cols, streaks=18, spot=null){
  const c=makeCanvas(512,256), x=c.getContext('2d');
  const h=256/cols.length;
  cols.forEach((col,i)=>{ x.fillStyle=col; x.fillRect(0,i*h,512,h+1); });
  x.globalAlpha=.35;
  for(let i=0;i<streaks;i++){
    x.strokeStyle=cols[(Math.random()*cols.length)|0];
    x.lineWidth=rand(1.5,5);
    const y0=rand(8,248), amp=rand(1,4), fq=(1+((Math.random()*4)|0))*Math.PI*2/512, ph=rand(0,6);
    x.beginPath();
    for(let px=0;px<=512;px+=8){ const y=y0+Math.sin(px*fq+ph)*amp; px ? x.lineTo(px,y) : x.moveTo(px,y); }
    x.stroke();
  }
  x.globalAlpha=1;
  if(spot){
    x.fillStyle=spot[0]; x.beginPath(); x.ellipse(spot[2],spot[3],spot[4],spot[5],0,0,7); x.fill();
    x.fillStyle=spot[1]; x.beginPath(); x.ellipse(spot[2],spot[3],spot[4]*.62,spot[5]*.62,0,0,7); x.fill();
  }
  return canvasTexture(c);
}
function rockyTex(base, spots, n=40, extra=null){
  const c=makeCanvas(512,256), x=c.getContext('2d');
  x.fillStyle=base; x.fillRect(0,0,512,256);
  for(let i=0;i<n;i++){
    x.globalAlpha=rand(.15,.45); x.fillStyle=spots[i%spots.length];
    x.beginPath(); x.arc(rand(0,512),rand(20,236),rand(3,22),0,7); x.fill();
  }
  x.globalAlpha=1;
  if(extra) extra(x);
  return canvasTexture(c);
}
function heartPath(x,cx,cy,s){
  x.beginPath(); x.moveTo(cx,cy+s);
  x.bezierCurveTo(cx-s*1.3,cy-s*.1,cx-s*.6,cy-s*1.1,cx,cy-s*.35);
  x.bezierCurveTo(cx+s*.6,cy-s*1.1,cx+s*1.3,cy-s*.1,cx,cy+s);
  x.fill();
}
function earthTex(){
  const c=makeCanvas(512,256), x=c.getContext('2d');
  x.fillStyle='#2a6fc9'; x.fillRect(0,0,512,256);
  [[90,95],[150,170],[270,80],[300,150],[400,110],[440,185],[60,180]].forEach(([cx,cy],k)=>{
    for(let i=0;i<16;i++){
      x.fillStyle=Math.random()<.18?'#c8a96a':(k%2?'#4fa64a':'#3f9142');
      x.beginPath(); x.arc(cx+rand(-30,30),cy+rand(-20,20),rand(8,20),0,7); x.fill();
    }
  });
  x.fillStyle='#f4f8fb'; x.fillRect(0,0,512,14); x.fillRect(0,242,512,14);
  x.globalAlpha=.55; x.fillStyle='#ffffff';
  for(let i=0;i<26;i++){ x.beginPath(); x.ellipse(rand(0,512),rand(25,231),rand(18,46),rand(3,7),0,0,7); x.fill(); }
  x.globalAlpha=1;
  return canvasTexture(c);
}
function sunTex(){
  const c=makeCanvas(256,128), x=c.getContext('2d');
  x.fillStyle='#ffb22e'; x.fillRect(0,0,256,128);
  const cols=['#ffd65a','#ff8f1f','#ffe08a'];
  for(let i=0;i<420;i++){ x.globalAlpha=.25; x.fillStyle=cols[i%3]; x.beginPath(); x.arc(rand(0,256),rand(0,128),rand(2,8),0,7); x.fill(); }
  x.globalAlpha=1;
  return canvasTexture(c);
}
function twoToneTex(){
  const c=makeCanvas(256,128), x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,256,0);
  g.addColorStop(0,'#3b2a1e'); g.addColorStop(.42,'#3b2a1e'); g.addColorStop(.58,'#ece7dd'); g.addColorStop(1,'#ece7dd');
  x.fillStyle=g; x.fillRect(0,0,256,128);
  return canvasTexture(c);
}
function ringAlpha(R){   /* R measured in Saturn radii */
  if(R<1.22||R>2.28) return 0;
  if(R<1.53) return .22+.06*Math.sin(R*90);
  if(R<1.94) return .82+.12*Math.sin(R*140);
  if(R<2.04) return .03;
  if(R>2.205&&R<2.22) return 0;
  return .55+.1*Math.sin(R*110);
}
function ringTex(alphaFn, rgb){
  const c=makeCanvas(512,4), x=c.getContext('2d');
  for(let px=0;px<512;px++){
    const a=alphaFn(px/511), k=rand(.9,1.05);
    x.fillStyle=`rgba(${(rgb[0]*k)|0},${(rgb[1]*k)|0},${(rgb[2]*k)|0},${a.toFixed(3)})`;
    x.fillRect(px,0,1,4);
  }
  return canvasTexture(c);
}
function makeRing(inner, outer, tex, opacity=1, segs=128){
  const geo=new THREE.RingGeometry(inner,outer,segs,1);
  const pos=geo.attributes.position, uv=geo.attributes.uv, v=new THREE.Vector3();
  for(let i=0;i<pos.count;i++){ v.fromBufferAttribute(pos,i); uv.setXY(i,(v.length()-inner)/(outer-inner),.5); }
  uv.needsUpdate=true;
  const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));
  m.rotation.x=-Math.PI/2;
  return m;
}
function softTex(){
  const c=makeCanvas(128,128), x=c.getContext('2d');
  for(let i=0;i<9;i++){
    const cx=rand(36,92), cy=rand(40,88), r=rand(22,40);
    const g=x.createRadialGradient(cx,cy,0,cx,cy,r);
    g.addColorStop(0,'rgba(255,255,255,.55)'); g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=g; x.fillRect(0,0,128,128);
  }
  return canvasTexture(c);
}
const gauss=()=>(Math.random()+Math.random()+Math.random()+Math.random()-2)*1.73;
function randDir(v){ do{ v.set(rand(-1,1),rand(-1,1),rand(-1,1)); }while(v.lengthSq()>1||v.lengthSq()<1e-4); return v.normalize(); }

/* =============== renderer / scene =============== */
let renderer;
try{
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
}catch(e){
  $('#fallback').style.display='flex';
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, LOW?1.75:2));
renderer.setSize(innerWidth,innerHeight);
$('#scene').appendChild(renderer.domElement);
const scene=new THREE.Scene();
const SPACE_BG=new THREE.Color(0x05071a);
scene.background=SPACE_BG;
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.05,5000);
/* tall phone screens are very narrow: widen the view so the planet AND the ship both fit */
function fitFov(){ const a=innerWidth/innerHeight; camera.fov=a<1?Math.min(78,55+(1-a)*42):55; camera.aspect=a; camera.updateProjectionMatrix(); }
fitFov();
scene.add(new THREE.AmbientLight(0xffffff,.42));

/* =============== starfield (all modes except inside Saturn) =============== */
const stars=new THREE.Group(); scene.add(stars);
{
  const v=new THREE.Vector3(), axis=new THREE.Vector3(1,0,0);
  const layer=(n,size,opacity,band)=>{
    const pos=new Float32Array(n*3), col=new Float32Array(n*3);
    for(let i=0;i<n;i++){
      if(band){
        const a=rand(0,Math.PI*2);
        v.set(Math.cos(a),gauss()*.09,Math.sin(a)).normalize().applyAxisAngle(axis,.95);
      }else randDir(v);
      v.multiplyScalar(rand(1400,1800));
      pos[i*3]=v.x; pos[i*3+1]=v.y; pos[i*3+2]=v.z;
      const k=Math.random(), b=rand(.55,1);
      const c=k<.15?[1,.85,.7]:k<.3?[.75,.85,1]:[1,1,1];
      col[i*3]=c[0]*b; col[i*3+1]=c[1]*b; col[i*3+2]=c[2]*b;
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    stars.add(new THREE.Points(geo,new THREE.PointsMaterial({size,sizeAttenuation:false,vertexColors:true,map:GLOW,
      transparent:true,opacity,depthWrite:false,fog:false})));
  };
  layer(LOW?1600:2600,2.4,.9,false);
  layer(220,4.2,1,false);
  layer(LOW?1800:3200,2,.45,true);   /* the Milky Way band across the sky */
}

/* =============== Max's spaceship (orange + grey, like the rocket) =============== */
const ship=new THREE.Group(), flame=new THREE.Group();
{
  const orange=new THREE.MeshLambertMaterial({color:0xe8863a}), grey=new THREE.MeshLambertMaterial({color:0x9aa2ad}),
        dark=new THREE.MeshLambertMaterial({color:0x5a6270});
  const along=m=>{ m.rotation.x=Math.PI/2; return m; };
  ship.add(along(new THREE.Mesh(new THREE.CylinderGeometry(.36,.42,1.6,16),orange)));
  const belt=along(new THREE.Mesh(new THREE.CylinderGeometry(.425,.425,.16,16),grey)); belt.position.z=-.35; ship.add(belt);
  const nose=along(new THREE.Mesh(new THREE.ConeGeometry(.36,.75,16),grey)); nose.position.z=1.17; ship.add(nose);
  const noz=along(new THREE.Mesh(new THREE.CylinderGeometry(.24,.34,.3,14),dark)); noz.position.z=-.95; ship.add(noz);
  for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3-Math.PI/2;
    const f=new THREE.Mesh(new THREE.BoxGeometry(.06,.5,.42),grey);
    f.position.set(Math.cos(a)*.48,Math.sin(a)*.48,-.62); f.rotation.z=a-Math.PI/2; ship.add(f);
  }
  /* Max in the cockpit */
  const head=new THREE.Mesh(new THREE.SphereGeometry(.16,14,10),new THREE.MeshLambertMaterial({color:0xf7d9bc,emissive:0xffd8b5,emissiveIntensity:.25}));
  head.position.set(0,.36,.2); ship.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.168,14,8,0,Math.PI*2,0,Math.PI*.5),new THREE.MeshLambertMaterial({color:0x24201d}));
  hair.position.copy(head.position); hair.rotation.x=-.25; ship.add(hair);
  [-1,1].forEach(sd=>{
    const e=new THREE.Mesh(new THREE.SphereGeometry(.024,6,5),new THREE.MeshBasicMaterial({color:0x24262e}));
    e.position.set(sd*.055,.36,.355); ship.add(e);
  });
  const dome=new THREE.Mesh(new THREE.SphereGeometry(.27,16,10,0,Math.PI*2,0,Math.PI/2),
    new THREE.MeshPhongMaterial({color:0xbfe8ff,transparent:true,opacity:.35,shininess:90,depthWrite:false}));
  dome.position.set(0,.3,.2); ship.add(dome);
  const f1=new THREE.Mesh(new THREE.ConeGeometry(.26,.9,12),new THREE.MeshBasicMaterial({color:0xffb703,transparent:true,opacity:.9}));
  f1.rotation.x=-Math.PI/2; f1.position.z=-.45;
  const f2=new THREE.Mesh(new THREE.ConeGeometry(.13,.55,10),new THREE.MeshBasicMaterial({color:0xfff3c4}));
  f2.rotation.x=-Math.PI/2; f2.position.z=-.28;
  flame.add(f1,f2); flame.position.z=-1.1; flame.visible=false; ship.add(flame);
  scene.add(ship);
}

/* =============== SOLAR SYSTEM =============== */
const solarGroup=new THREE.Group(); scene.add(solarGroup);
solarGroup.add(new THREE.PointLight(0xfff4e0,3.4,0,0));
const SEG=LOW?28:44;
const sphere=(r,seg=SEG)=>new THREE.SphereGeometry(r,seg,Math.round(seg*.65));
const BODY_DEFS=[
  {id:'sun',     r:5,    d:0,  color:'#ffb22e', em:'☀️', tex:()=>sunTex()},
  {id:'mercury', r:.55,  d:11, color:'#a8a39c', fav:8, tex:()=>rockyTex('#a8a39c',['#7d7872','#c9c4bd'],70)},
  {id:'venus',   r:.95,  d:15.5,color:'#e3c78f', fav:6, tex:()=>bandTex(['#e8cf9a','#dcbf86','#efdcae','#d9b77a','#e6cc94'],30)},
  {id:'earth',   r:1,    d:21, color:'#2f7fd6', tex:earthTex, tilt:.41},
  {id:'mars',    r:.7,   d:27, color:'#c1502e', fav:7, tex:()=>rockyTex('#c1502e',['#8e3418','#d9774a','#6e2a14'],45,x=>{
                    x.fillStyle='#f4f1ea'; x.fillRect(0,0,512,12); x.fillRect(0,244,512,12); })},
  {id:'jupiter', r:3,    d:40, color:'#d9b48a', fav:2, tex:()=>bandTex(['#e9d6b5','#c99b6c','#f2e3c8','#b98352','#e8d1ae','#c4925f','#f0e0c4','#bf8d5d','#e5cfaa'],26,['#c8603f','#de8664',330,150,30,16])},
  {id:'saturn',  r:2.5,  d:54, color:'#e3cd96', fav:1, em:'🪐', tilt:.47, tex:()=>bandTex(['#ecdcae','#ddc48e','#f2e6c2','#cfb27a','#e7d4a2','#d8be86','#f3e7c6','#ccad74','#e2cd99','#ecdcae'],22)},
  {id:'uranus',  r:1.55, d:66, color:'#a9e4ea', fav:5, tilt:1.71, tex:()=>bandTex(['#b8eef0','#a9e4ea','#bff1f2','#a2dde6'],6)},
  {id:'neptune', r:1.5,  d:76, color:'#3d6fd8', fav:4, tilt:.49, tex:()=>bandTex(['#3d6fd8','#3563c9','#4a7fe0','#2f58b8','#4174d6'],14,['#24408f','#2f4fa0',300,110,26,14])},
  {id:'pluto',   r:.38,  d:85, color:'#c9a483', fav:3, tex:()=>rockyTex('#c9a483',['#a37b5a','#e0c4a6'],30,x=>{ x.fillStyle='#f3e6d2'; heartPath(x,300,140,42); })},
];
const bodies={};
const PICK={solar:[],saturn:[],galaxy:[],inside:[]};
const hitMat=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
BODY_DEFS.forEach(b=>{
  const g=new THREE.Group(); solarGroup.add(g);
  const tilt=new THREE.Group(); tilt.rotation.z=b.tilt||0; g.add(tilt);
  const mat=b.id==='sun' ? new THREE.MeshBasicMaterial({map:b.tex()}) : new THREE.MeshLambertMaterial({map:b.tex()});
  const mesh=new THREE.Mesh(sphere(b.r, b.r>2?SEG+12:SEG),mat);
  mesh.userData.dest=b.id; tilt.add(mesh); PICK.solar.push(mesh);
  if(b.r<1.3){
    const hit=new THREE.Mesh(new THREE.SphereGeometry(Math.max(1.5,b.r*2.2),8,6),hitMat);
    hit.userData.dest=b.id; g.add(hit); PICK.solar.push(hit);
  }
  bodies[b.id]={...b, g, tilt, mesh, a:rand(0,Math.PI*2), speed:b.d?4.2/Math.pow(b.d,1.5):0, moons:[]};
  if(b.d){
    const pts=[]; for(let i=0;i<=128;i++){ const a=i/128*Math.PI*2; pts.push(new THREE.Vector3(Math.cos(a)*b.d,0,Math.sin(a)*b.d)); }
    solarGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({color:b.fav?0xffc861:0x5a6ea8,transparent:true,opacity:b.fav?.55:.32})));
  }
});
{
  const sg=bodies.sun.g;
  const glow1=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffb43a,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  glow1.scale.set(24,24,1); sg.add(glow1);
  const glow2=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xff8a2a,transparent:true,opacity:.45,blending:THREE.AdditiveBlending,depthWrite:false}));
  glow2.scale.set(46,46,1); sg.add(glow2);
}
const addMoon=(bid,r,d,sp,tex)=>{
  const m=new THREE.Mesh(sphere(r,16),new THREE.MeshLambertMaterial({map:tex}));
  bodies[bid].g.add(m); bodies[bid].moons.push({m,d,sp,a:rand(0,6)});
};
addMoon('earth',.27,1.9,.8,rockyTex('#b9b9b9',['#8d8d8d','#d8d8d8'],50));
addMoon('jupiter',.22,4.0,1.1,rockyTex('#e6c74a',['#c9762a','#3a2a1e','#f2de8a'],40));
addMoon('jupiter',.2,4.8,.85,rockyTex('#e8dcc4',['#a8774e','#f4ece0'],30));
addMoon('jupiter',.3,5.8,.6,rockyTex('#9c8f80',['#6f6458','#c8bcae'],40));
addMoon('jupiter',.27,6.9,.42,rockyTex('#5e564e',['#e8e2da','#3e3832'],50));
bodies.saturn.tilt.add(makeRing(2.5*1.22,2.5*2.28,ringTex(t=>ringAlpha(1.22+t*1.06),[226,208,170])));
bodies.uranus.tilt.add(makeRing(1.55*1.6,1.55*1.75,ringTex(()=>.35,[190,230,240]),.8,64));

/* asteroid belt between Mars and Jupiter */
const belt=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshLambertMaterial({color:0x8d8077}),LOW?380:760);
{
  const o=new THREE.Object3D();
  for(let i=0;i<belt.count;i++){
    const a=rand(0,Math.PI*2), r=rand(31,35.5);
    o.position.set(Math.cos(a)*r,rand(-.6,.6),Math.sin(a)*r);
    o.rotation.set(rand(0,6),rand(0,6),rand(0,6));
    const s=rand(.06,.22); o.scale.set(s,s*rand(.6,1),s);
    o.updateMatrix(); belt.setMatrixAt(i,o.matrix);
  }
  solarGroup.add(belt);
}

/* dark matter "ghost dust" all around the solar system */
function dmCloud(n, place, size, attenuate){
  const pos=new Float32Array(n*3), col=new Float32Array(n*3), v=new THREE.Vector3();
  for(let i=0;i<n;i++){
    place(v,i);
    pos[i*3]=v.x; pos[i*3+1]=v.y; pos[i*3+2]=v.z;
    const k=Math.random();
    const c=k<.5?[.55,.35,1]:k<.8?[.35,.45,1]:[.8,.4,.95];
    col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  const p=new THREE.Points(geo,new THREE.PointsMaterial({size,sizeAttenuation:attenuate,vertexColors:true,map:GLOW,transparent:true,
    opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
  p.visible=false;
  return p;
}
const dmSolar=(()=>{
  const clumps=[...Array(22)].map(()=>randDir(new THREE.Vector3()).multiplyScalar(rand(15,110)).multiply(new THREE.Vector3(1,.35,1)));
  return dmCloud(LOW?900:1500,(v,i)=>{
    if(i%5<2){ v.copy(clumps[i%clumps.length]).add(new THREE.Vector3(gauss()*6,gauss()*3,gauss()*6)); }
    else { randDir(v).multiplyScalar(Math.cbrt(Math.random())*120); v.y*=.4; }
  },LOW?6:7,false);
})();
solarGroup.add(dmSolar);

/* =============== SATURN UP CLOSE =============== */
const SATR=20, GAP_R=SATR*1.99;
const satGroup=new THREE.Group(); satGroup.visible=false; scene.add(satGroup);
const satLight=new THREE.DirectionalLight(0xfff4e0,3.2); satLight.position.set(120,50,90); satGroup.add(satLight);
const LDIR=satLight.position.clone().normalize();
const satTilt=new THREE.Group(); satTilt.rotation.set(.12,0,.38); satGroup.add(satTilt);
const saturnBig=new THREE.Mesh(sphere(SATR,LOW?48:72),new THREE.MeshLambertMaterial({
  map:bandTex(['#ecdcae','#ddc48e','#f2e6c2','#cfb27a','#e7d4a2','#d8be86','#f3e7c6','#ccad74','#e2cd99','#ecdcae'],34)}));
saturnBig.userData.dest='inside'; satTilt.add(saturnBig); PICK.saturn.push(saturnBig);
/* the north-pole hexagon: a six-sided cap hugging the sphere */
const hexCap=(()=>{
  const c=makeCanvas(32,128), x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,128);
  g.addColorStop(0,'#4f6f98'); g.addColorStop(.5,'#7f93a8'); g.addColorStop(.8,'#c9ad78');
  g.addColorStop(.88,'#fbf2d6'); g.addColorStop(.94,'#d9bf8a'); g.addColorStop(1,'#e6d2a0');
  x.fillStyle=g; x.fillRect(0,0,32,128);
  const m=new THREE.Mesh(new THREE.SphereGeometry(SATR*1.026,6,6,0,Math.PI*2,0,.36),
    new THREE.MeshLambertMaterial({map:canvasTexture(c),polygonOffset:true,polygonOffsetFactor:-2}));
  m.userData.dest='hexagon'; PICK.saturn.push(m);
  satTilt.add(m); return m;
})();
const ringPlane=makeRing(SATR*1.22,SATR*2.28,ringTex(t=>ringAlpha(1.22+t*1.06),[226,208,170]),.82,LOW?96:160);
ringPlane.userData.dest='rings'; satTilt.add(ringPlane); PICK.saturn.push(ringPlane);
/* billions of ice chunks — well, a couple of thousand */
const ringChunks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshLambertMaterial({color:0xffffff}),LOW?1300:2600);
{
  const o=new THREE.Object3D(), col=new THREE.Color();
  let i=0, guard=0;
  while(i<ringChunks.count && guard++<ringChunks.count*30){
    const R=rand(1.22,2.28);
    if(Math.random()>ringAlpha(R)) continue;
    const a=rand(0,Math.PI*2);
    o.position.set(Math.cos(a)*R*SATR,rand(-.16,.16),Math.sin(a)*R*SATR);
    o.rotation.set(rand(0,6),rand(0,6),rand(0,6));
    const s=Math.random()<.05?rand(.35,.6):rand(.06,.26); o.scale.set(s,s*rand(.6,1),s);
    o.updateMatrix(); ringChunks.setMatrixAt(i,o.matrix);
    col.setHSL(rand(.08,.12),rand(.1,.35),rand(.72,.92)); ringChunks.setColorAt(i,col);
    i++;
  }
  ringChunks.count=i;
  satTilt.add(ringChunks);
}
/* Saturn's moons */
const satMoons={};
const addSatMoon=(id,r,d,sp,a0,tex,extra)=>{
  const g=new THREE.Group(); satTilt.add(g);
  const mesh=new THREE.Mesh(sphere(r,28),new THREE.MeshLambertMaterial({map:tex}));
  mesh.userData.dest=id; g.add(mesh); PICK.saturn.push(mesh);
  const hit=new THREE.Mesh(new THREE.SphereGeometry(Math.max(r*2.2,3),8,6),hitMat); hit.userData.dest=id; g.add(hit); PICK.saturn.push(hit);
  satMoons[id]={g,mesh,r,d,sp,a:a0};
  if(extra) extra(g,r);
};
addSatMoon('titan',2.8,84,.03,.9,bandTex(['#e0a04a','#d9963f','#e6a955','#d48e3a'],8),(g,r)=>{
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r*1.12,24,16),
    new THREE.MeshLambertMaterial({color:0xe8a050,transparent:true,opacity:.28,depthWrite:false})));
});
let geyser=null;
addSatMoon('enceladus',1.15,60,.07,2.2,rockyTex('#f4f8fb',['#d6e6f2','#ffffff','#bcd4e6'],30,x=>{
  x.strokeStyle='#7fb3dc'; x.lineWidth=3;
  for(let i=0;i<4;i++){ x.beginPath(); x.moveTo(140+i*60,236); x.lineTo(180+i*60,222); x.stroke(); }
}),(g,r)=>{
  const n=70, pos=new Float32Array(n*3);
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({size:.5,map:GLOW,color:0xdff2ff,transparent:true,opacity:.85,
    blending:THREE.AdditiveBlending,depthWrite:false}));
  g.add(pts);
  geyser={pts,r,parts:[...Array(n)].map(()=>({t:Math.random(),sp:rand(.25,.5),dx:rand(-.35,.35),dz:rand(-.35,.35)}))};
});
addSatMoon('mimas',1.0,52,.11,4.1,rockyTex('#bdbab5',['#8f8c88','#d6d3cf'],40,x=>{
  x.fillStyle='#8a8781'; x.beginPath(); x.arc(150,128,40,0,7); x.fill();
  x.fillStyle='#b3b0ab'; x.beginPath(); x.arc(150,128,9,0,7); x.fill();
}));
addSatMoon('iapetus',1.4,108,.02,5.4,twoToneTex());

/* =============== INSIDE SATURN =============== */
const insideGroup=new THREE.Group(); insideGroup.visible=false; scene.add(insideGroup);
const insideFog=new THREE.Fog(0xc99a5a,12,75);
{
  const c=makeCanvas(4,256), x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,256);
  g.addColorStop(0,'#f6dfa8'); g.addColorStop(.5,'#c9944e'); g.addColorStop(1,'#4a2e18');
  x.fillStyle=g; x.fillRect(0,0,4,256);
  insideGroup.add(new THREE.Mesh(new THREE.SphereGeometry(300,24,16),
    new THREE.MeshBasicMaterial({map:canvasTexture(c),side:THREE.BackSide,fog:false,depthWrite:false})));
}
const insideHemi=new THREE.HemisphereLight(0xffe7b0,0x6b4423,1.6); insideGroup.add(insideHemi);
const insideSun=new THREE.DirectionalLight(0xfff0d0,1); insideSun.position.set(10,30,20); insideGroup.add(insideSun);
const CLOUD_TEX=softTex();
const clouds=[];
for(let i=0;i<(LOW?34:56);i++){
  const tint=new THREE.Color().setHSL(rand(.07,.1),rand(.35,.6),rand(.6,.85));
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:CLOUD_TEX,color:tint,transparent:true,opacity:rand(.45,.75),depthWrite:false}));
  const sc=rand(14,30); s.scale.set(sc,sc*.7,1);
  insideGroup.add(s); clouds.push(s);
}
function scatterCloud(s,y){
  let x,z; do{ x=rand(-38,38); z=rand(-38,30); }while(Math.abs(x)<5&&Math.abs(z)<5);
  s.position.set(x,y,z);
}
const bolt=new THREE.Line(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(14*3),3)),
  new THREE.LineBasicMaterial({color:0xfffbe0,fog:false}));
bolt.visible=false; insideGroup.add(bolt);
const diamonds=new THREE.InstancedMesh(new THREE.OctahedronGeometry(.6,0),
  new THREE.MeshPhongMaterial({color:0xe6fbff,emissive:0x5aa8d6,shininess:140,specular:0xffffff,flatShading:true}),90);
const diamondSpot=()=>new THREE.Vector3(rand(-9,9),0,rand(-9,7));
const diamondData=[...Array(diamonds.count)].map(()=>({p:diamondSpot().setY(rand(-40,25)),r:rand(0,6),sp:rand(8,14)}));
diamonds.visible=false; insideGroup.add(diamonds);

/* =============== THE MILKY WAY =============== */
const galaxyGroup=new THREE.Group(); galaxyGroup.visible=false; scene.add(galaxyGroup);
{
  const N=LOW?5500:10000, pos=new Float32Array(N*3), col=new Float32Array(N*3);
  const cCore=new THREE.Color(1,.86,.62), cArm=new THREE.Color(.62,.74,1), cPink=new THREE.Color(1,.55,.8), c=new THREE.Color(), v=new THREE.Vector3();
  for(let i=0;i<N;i++){
    let x,y,z;
    if(i<N*.2){
      const r=Math.abs(gauss())*9; randDir(v); x=v.x*r; y=v.y*r*.6; z=v.z*r; c.copy(cCore);
    }else{
      const arm=i%2, r=8+Math.pow(Math.random(),.85)*92;
      const a=r*.06+arm*Math.PI+gauss()*.2, j=gauss()*(3.5+r*.08);
      x=Math.cos(a)*r-Math.sin(a)*j; z=Math.sin(a)*r+Math.cos(a)*j; y=gauss()*(1.7-r/100);
      c.copy(cCore).lerp(cArm,clamp(r/55,0,1)); if(Math.random()<.04) c.copy(cPink);
    }
    const b=rand(.55,1);
    pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z;
    col[i*3]=c.r*b; col[i*3+1]=c.g*b; col[i*3+2]=c.b*b;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  galaxyGroup.add(new THREE.Points(geo,new THREE.PointsMaterial({size:1.7,vertexColors:true,map:GLOW,transparent:true,
    blending:THREE.AdditiveBlending,depthWrite:false})));
}
const sunMarker=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffe26a,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
sunMarker.scale.set(7,7,1); sunMarker.position.set(Math.cos(3.6)*60,0,Math.sin(3.6)*60);
sunMarker.userData.dest='solarBack'; galaxyGroup.add(sunMarker); PICK.galaxy.push(sunMarker);
const sunRing=new THREE.Mesh(new THREE.RingGeometry(3.2,3.8,40),new THREE.MeshBasicMaterial({color:0xffd166,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
sunRing.rotation.x=-Math.PI/2; sunRing.position.copy(sunMarker.position); galaxyGroup.add(sunRing);
const dmHalo=dmCloud(LOW?1400:2400,(v,i)=>{
  if(i%6===0){ randDir(v).multiplyScalar(rand(60,150)); v.add(new THREE.Vector3(gauss()*7,gauss()*7,gauss()*7)); }
  else { randDir(v).multiplyScalar(170*Math.pow(Math.random(),1.4)); v.y*=.8; }
},9,true);
galaxyGroup.add(dmHalo);

/* =============== audio (all synthesized) =============== */
let actx=null, master=null, engineGain=null, padGain=null, noiseBuf=null;
function ensureAudio(){
  try{
    if(!actx){
      actx=new (window.AudioContext||window.webkitAudioContext)();
      master=actx.createGain(); master.gain.value=soundOn?1:0; master.connect(actx.destination);
    }
    if(actx.state==='suspended') actx.resume();
  }catch(e){}
}
function unlockIOS(){
  try{
    const au=new Audio(silentWavURL());
    au.loop=true; au.volume=.01; au.setAttribute('playsinline',''); au.play().catch(()=>{});
  }catch(e){}
}
function getNoise(){
  if(!noiseBuf){
    noiseBuf=actx.createBuffer(1,actx.sampleRate*2,actx.sampleRate);
    const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  }
  return noiseBuf;
}
function tone(f,t0,dur,type='sine',vol=.1){
  if(!actx) return;
  const o=actx.createOscillator(), g=actx.createGain(), T0=actx.currentTime+t0;
  o.type=type; o.frequency.value=f;
  g.gain.setValueAtTime(0,T0); g.gain.linearRampToValueAtTime(vol,T0+.02); g.gain.exponentialRampToValueAtTime(.001,T0+dur);
  o.connect(g); g.connect(master); o.start(T0); o.stop(T0+dur+.05);
}
function noiseHit(dur,type,f0,f1,vol){
  if(!actx) return;
  const s=actx.createBufferSource(); s.buffer=getNoise();
  const fl=actx.createBiquadFilter(); fl.type=type; fl.Q.value=1.2;
  const g=actx.createGain(), T0=actx.currentTime;
  fl.frequency.setValueAtTime(f0,T0); fl.frequency.exponentialRampToValueAtTime(f1,T0+dur);
  g.gain.setValueAtTime(0,T0); g.gain.linearRampToValueAtTime(vol,T0+.05); g.gain.exponentialRampToValueAtTime(.001,T0+dur);
  s.connect(fl); fl.connect(g); g.connect(master); s.start(T0); s.stop(T0+dur+.05);
}
const chime=()=>{ tone(784,0,.3); tone(1175,.1,.4); };
const fanfare=()=>[523,659,784,1047,1318].forEach((f,i)=>tone(f,i*.12,.32,'triangle',.11));
const whoosh=()=>noiseHit(.8,'bandpass',300,2600,.18);
const thunder=()=>noiseHit(1.6,'lowpass',420,90,.5);
function startEngine(){
  if(engineGain||!actx) return;
  const s=actx.createBufferSource(); s.buffer=getNoise(); s.loop=true;
  const lp=actx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=320;
  const hum=actx.createOscillator(); hum.type='sawtooth'; hum.frequency.value=55;
  const hg=actx.createGain(); hg.gain.value=.25;
  engineGain=actx.createGain(); engineGain.gain.value=0;
  s.connect(lp); hum.connect(hg); hg.connect(lp); lp.connect(engineGain); engineGain.connect(master);
  s.start(); hum.start();
}
function setEngine(v){ if(engineGain) engineGain.gain.setTargetAtTime(v*.16,actx.currentTime,.25); }
const CHORDS=[[130.81,196,329.63],[110,164.81,261.63],[87.31,130.81,220],[98,146.83,246.94]];
function startPad(){
  if(padGain||!actx) return;
  padGain=actx.createGain(); padGain.gain.value=0;
  const lp=actx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=900;
  padGain.connect(lp); lp.connect(master);
  const oscs=CHORDS[0].map(f=>{ const o=actx.createOscillator(); o.type='sine'; o.frequency.value=f; o.connect(padGain); o.start(); return o; });
  padGain.gain.setTargetAtTime(.035,actx.currentTime,2);
  let ci=0;
  setInterval(()=>{ if(actx.state!=='running') return; ci=(ci+1)%CHORDS.length; oscs.forEach((o,i)=>o.frequency.setTargetAtTime(CHORDS[ci][i],actx.currentTime,1.2)); },8000);
  const PENTA=[1046.5,1174.7,1318.5,1568,1760,2093];
  setInterval(()=>{ if(actx.state==='running' && Math.random()<.45) tone(PENTA[(Math.random()*PENTA.length)|0],0,.9,'sine',.025); },3500);
}
document.addEventListener('visibilitychange',()=>{
  if(!actx) return;
  if(document.hidden) actx.suspend(); else actx.resume();
});

/* =============== small UI helpers =============== */
function toast(msg){
  const el=$('#toast'); el.textContent=msg; el.style.opacity=1;
  clearTimeout(el._t); el._t=setTimeout(()=>el.style.opacity=0,2600);
}
function bigMsg(msg,dur=1800){
  const el=$('#bigmsg'); el.textContent=msg; el.classList.add('show');
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),dur);
}
let warping=false;
function warp(cb,label){
  if(warping) return;
  warping=true; whoosh();
  $('#warptxt').textContent=label||T().warp;
  $('#warp').classList.add('on');
  setTimeout(()=>{
    try{ cb(); }
    finally{ setTimeout(()=>{ $('#warp').classList.remove('on'); warping=false; },350); }
  },550);
}

/* =============== camera =============== */
const cam={theta:.6,phi:1.0,dist:150,tDist:150,tPhi:null,tTheta:null,target:new THREE.Vector3(),tTarget:new THREE.Vector3()};
let follow=null, lastDrag=-1e9;
const clampDist=d=>clamp(d,MODES[mode].dist[0],MODES[mode].dist[1]);
const angDiff=(a,b)=>{ let d=(b-a)%(Math.PI*2); if(d>Math.PI) d-=Math.PI*2; if(d<-Math.PI) d+=Math.PI*2; return d; };
function updateCamera(dt){
  if(follow) follow(cam.tTarget);
  cam.target.lerp(cam.tTarget,1-Math.exp(-dt*4));
  cam.dist+=(cam.tDist-cam.dist)*(1-Math.exp(-dt*2.6));
  if(cam.tPhi!=null) cam.phi+=(cam.tPhi-cam.phi)*(1-Math.exp(-dt*2));
  if(cam.tTheta!=null) cam.theta+=angDiff(cam.theta,cam.tTheta)*(1-Math.exp(-dt*2));
  if((!started||MODES[mode].autoSpin) && performance.now()-lastDrag>3000) cam.theta+=dt*.04;
  const sp=Math.sin(cam.phi);
  camera.position.set(cam.target.x+cam.dist*sp*Math.sin(cam.theta),cam.target.y+cam.dist*Math.cos(cam.phi),cam.target.z+cam.dist*sp*Math.cos(cam.theta));
  camera.lookAt(cam.target);
  /* when the info card covers the bottom of a tall screen, slide the view up so the subject stays visible */
  const want=(cardH&&innerHeight>innerWidth)?Math.min(cardH*.5,innerHeight*.24):0;
  viewShift+=(want-viewShift)*(1-Math.exp(-dt*5));
  if(viewShift>.5) camera.setViewOffset(innerWidth,innerHeight,0,viewShift,innerWidth,innerHeight);
  else if(camera.view&&camera.view.enabled) camera.clearViewOffset();
}
let viewShift=0, cardH=0;

/* =============== destinations =============== */
const _ap=new THREE.Vector3();
function approach(center,r,out){
  _ap.copy(center).negate(); _ap.y=0;
  if(_ap.lengthSq()<1e-6) _ap.set(0,0,1);
  _ap.normalize();
  return out.copy(center).addScaledVector(_ap,r*2.3+.7).setY(center.y+r*.55+.35);
}
function approachDir(center,r,dir,out){ return out.copy(center).addScaledVector(dir,r*2.4+1.4).setY(center.y+r*.5+.6); }
const sunDir=new THREE.Vector3(0,0,1);
let ringA=0;
const _f=new THREE.Vector3();

const DEST={solar:{},saturn:{},galaxy:{},inside:{}};
BODY_DEFS.forEach(b=>{
  const B=bodies[b.id];
  const target=out=> b.id==='sun' ? out.copy(sunDir).multiplyScalar(13).setY(3) : approach(B.g.position,b.r,out);
  DEST.solar[b.id]={
    name:()=>nm(b.id), dot:b.color, em:b.em, fav:b.fav, planet:b.id!=='sun',
    target, center:out=>out.copy(B.g.position),
    focus:out=>{ target(_f); return out.copy(B.g.position).lerp(_f,.3); },
    camDist:b.id==='sun'?34:b.r*4.2+3.2,
    fact:()=>fact(b.id),
    actions: ()=>{
      const a=[];
      if(EXPLORE[b.id]) a.push({label:EXPLORE[b.id].label(),fn:EXPLORE[b.id].enter});
      if(b.id==='earth') a.push({label:T().footprints,href:'earth.html'},{label:T().home,href:'./?from=galaxy',alt:true});
      if(b.id==='pluto') a.push({label:T().plutoStory,href:'stories.html#s02',alt:true});   /* Max's own story about Pluto */
      return a.length?a:null;
    },
  };
});
DEST.solar.galaxyGo={name:()=>T().galaxy,em:'🌌',action:enterGalaxy};
DEST.galaxy.solarBack={name:()=>T().toSolar,em:'☀️',action:leaveGalaxy};
DEST.galaxy.dmChip={name:()=>T().dm,em:'👻',isOn:()=>dmOn,action:toggleDM};

const moonDest=(id,em)=>{
  const M=satMoons[id];
  const center=out=>M.mesh.getWorldPosition(out);
  const target=out=>approachDir(center(out),M.r,LDIR,out);
  return { name:()=>nm(id), em, target, center,
    focus:out=>{ target(_f); return center(out).lerp(_f,.3); },
    camDist:M.r*5+6, fact:()=>fact(id) };
};
const ringPoint=(a,out)=>satTilt.localToWorld(out.set(Math.cos(a)*GAP_R,0,Math.sin(a)*GAP_R));
DEST.saturn.rings={ name:()=>nm('rings'), em:'💫', target:out=>ringPoint(ringA,out), center:out=>out.set(0,0,0),
  focus:out=>out.copy(ship.position), camDist:9, phi:1.25, cruise:true, fact:()=>fact('rings') };
DEST.saturn.titan=moonDest('titan','🟠');
DEST.saturn.enceladus=moonDest('enceladus','❄️');
DEST.saturn.mimas=moonDest('mimas','👁️');
DEST.saturn.iapetus=moonDest('iapetus','☯️');
DEST.saturn.hexagon={ name:()=>nm('hexagon'), em:'🔷',
  target:out=>satTilt.localToWorld(out.set(0,SATR*1.55,SATR*.35)),
  center:out=>satTilt.localToWorld(out.set(0,SATR,0)),
  focus:out=>satTilt.localToWorld(out.set(0,SATR,0)), camDist:36, phi:.5, fact:()=>fact('hexagon') };
const DIVE=new THREE.Vector3(0,Math.sin(.6),Math.cos(.6));
DEST.saturn.inside={ name:()=>nm('inside'), em:'🌀',
  target:out=>satTilt.localToWorld(out.copy(DIVE).multiplyScalar(SATR*1.12)),
  center:out=>out.set(0,0,0),
  focus:out=>satTilt.localToWorld(out.copy(DIVE).multiplyScalar(SATR*1.12)), camDist:16, dive:true, fact:()=>fact('inside') };
DEST.saturn.solarFromSat={ name:()=>T().toSolar, em:'☀️', action:leaveSaturn };
DEST.inside.flyUp={ name:()=>T().flyUp, em:'⬆️', action:leaveInside };

const ORDER={
  solar:['sun',...PLANETS,'galaxyGo'],
  saturn:['rings','titan','enceladus','mimas','iapetus','hexagon','inside','solarFromSat'],
  inside:['flyUp'],
  galaxy:['solarBack','dmChip'],
};

/* =============== state =============== */
let mode='solar', at=null, started=false, dmOn=false, dmLevel=0;
const shipState={phase:'idle',from:new THREE.Vector3(),t:0,dur:3,dest:null,cruiseA:0};
const _a=new THREE.Vector3(), _b=new THREE.Vector3(), _c=new THREE.Vector3(), _end=new THREE.Vector3(),
      _ctrl=new THREE.Vector3(), _ahead=new THREE.Vector3(), _lv=new THREE.Vector3();
const _dummy=new THREE.Object3D();

function bezier(p0,p1,p2,k,out){
  const u=1-k;
  return out.set(u*u*p0.x+2*u*k*p1.x+k*k*p2.x, u*u*p0.y+2*u*k*p1.y+k*k*p2.y, u*u*p0.z+2*u*k*p1.z+k*k*p2.z);
}

function travelTo(id){
  if(!started||warping) return;
  const d=DEST[mode][id]; if(!d) return;
  if(d.action){ d.action(); return; }
  if(at===id && shipState.phase!=='flying'){
    if(d.fact){ showDestCard(id); return; }
    if(d.onArrive){ arrive(id); return; }
  }
  pendingTok++;
  hideCard();
  if(id==='sun') sunDir.copy(ship.position).setY(0).normalize();
  if(id==='rings'){ satTilt.worldToLocal(_a.copy(ship.position)); ringA=Math.atan2(_a.z,_a.x); }
  shipState.phase='flying'; shipState.dest=id; shipState.t=0; shipState.from.copy(ship.position);
  d.target(_b);
  const dist=ship.position.distanceTo(_b);
  shipState.dur=clamp(1.8+dist*(mode==='solar'?.045:.03),2,7.5);
  at=null;
  setWhere(T().flying(d.name()));
  follow=o=>o.copy(ship.position);
  cam.tDist=clampDist(MODES[mode].flyDist??16); cam.tPhi=1.15; cam.tTheta=null;
  setEngine(1); whoosh();
  markActive(id);
}

function arrive(id){
  const d=DEST[mode][id];
  shipState.phase=d.cruise?'cruise':'idle'; at=id;
  setEngine(d.cruise?.35:0);
  follow=o=>d.focus(o);
  d.focus(_a); d.target(_b);
  cam.tTheta=Math.atan2(_b.x-_a.x,_b.z-_a.z)+(d.thetaOff??.55);
  cam.tPhi=d.phi??1.12; cam.tDist=clampDist(d.camDist);
  if(d.cruise){
    satTilt.worldToLocal(_a.copy(ship.position)); shipState.cruiseA=Math.atan2(_a.z,_a.x);
    ringPoint(shipState.cruiseA+.03,_c);
    cam.tTheta=Math.atan2(ship.position.x-_c.x,ship.position.z-_c.z);
  }
  setWhere(whereFor(id));
  if(d.dive){ diveIn(); return; }
  if(d.onArrive && d.onArrive()===true) return;
  if(mode==='solar' && d.fav){ bigMsg(T().fav(d.fav),2200); fanfare(); }
  else chime();
  if(d.planet && !visited.has(id)){
    visited.add(id); savePrefs(); updateCount(); buildBar();
    if(visited.size>=9 && !celebrated){ celebrated=true; setTimeout(()=>{ bigMsg(T().allDone,3200); fanfare(); },2300); }
  }
  markActive(id);
  showDestCard(id);
}

function updateShip(dt,t){
  const flying=shipState.phase==='flying';
  if(flying){
    const d=DEST[mode][shipState.dest];
    shipState.t+=dt;
    const e=Math.min(shipState.t/shipState.dur,1);
    const k=e<.5?2*e*e:1-Math.pow(-2*e+2,2)/2;
    d.target(_end);
    _ctrl.copy(shipState.from).add(_end).multiplyScalar(.5);
    _ctrl.y+=shipState.from.distanceTo(_end)*.18+1;
    bezier(shipState.from,_ctrl,_end,k,ship.position);
    bezier(shipState.from,_ctrl,_end,Math.min(k+.02,1),_ahead);
    if(_ahead.distanceToSquared(ship.position)>1e-8) ship.lookAt(_ahead);
    if(e>=1) arrive(shipState.dest);
  }else if(shipState.phase==='cruise'){
    shipState.cruiseA+=dt*.045;
    ringPoint(shipState.cruiseA,ship.position);
    ringPoint(shipState.cruiseA+.02,_ahead);
    ship.lookAt(_ahead);
  }else if(MODES[mode].hover){
    MODES[mode].hover(dt,t);
  }else if(at && DEST[mode][at] && DEST[mode][at].target){
    const d=DEST[mode][at];
    d.target(_b); _b.y+=Math.sin(t*1.6)*.12*ship.scale.x;
    ship.position.lerp(_b,1-Math.exp(-dt*4));
    d.center(_c);
    _dummy.position.copy(ship.position); _dummy.lookAt(_c);
    ship.quaternion.slerp(_dummy.quaternion,1-Math.exp(-dt*3));
  }
  const burning=flying||shipState.phase==='cruise'||!!MODES[mode].burn;
  flame.visible=burning;
  if(burning){ const f=1+Math.sin(t*40)*.18; flame.scale.set(1,1,f*(flying?1.2:.7)); }
}

/* =============== modes =============== */
function setMode(m){
  mode=m;
  const M=MODES[m];
  for(const k in MODES) MODES[k].group.visible=k===m;
  stars.visible=!M.noStars;
  scene.background=M.noStars?null:SPACE_BG;
  scene.fog=M.fog||null;
  ship.visible=!M.noShip;
  ship.scale.setScalar(M.shipScale);
  shipState.phase='idle'; at=null; setEngine(M.engine||0);
  $('#dmbtn').style.display=M.dm?'':'none';
  $('#depth').style.display=M.depth?'block':'none';
  $('#count').style.display=M.count?'block':'none';
  cam.tDist=clampDist(cam.tDist);
  if(M.onEnter) M.onEnter();
  hideCard(); buildBar(); buildLabels(); setWhere(whereFor(null));
}
/* switch to another mode through the warp curtain; setup() runs while hidden */
function switchMode(m,setup,label){
  hideCard();
  warp(()=>{ setMode(m); if(setup) setup(); },label);
}
function backToSolar(pid){
  switchMode('solar',()=>{
    at=pid; markActive(pid);
    DEST.solar[pid].target(ship.position);
    follow=o=>DEST.solar[pid].focus(o);
    cam.tDist=DEST.solar[pid].camDist; cam.tPhi=1.12;
    setWhere(whereFor(pid));
  });
}
function parkAt(id){
  const d=DEST[mode][id]; if(!d) return;
  at=id; shipState.phase='idle'; follow=o=>d.focus(o);
  markActive(id); setWhere(whereFor(id));
}
function setView(o){
  if(o.follow) follow=o.follow;
  if(o.target) cam.target.set(o.target[0],o.target[1],o.target[2]);
  if(o.dist!=null) cam.dist=o.dist;
  if(o.tDist!=null) cam.tDist=o.tDist;
  cam.tPhi=o.phi??cam.tPhi;
  cam.tTheta=o.theta??null;
}
function hoverDown(dt,t){   /* ship hangs nose-down while sinking through clouds */
  ship.position.set(Math.sin(t*.7)*.3,Math.sin(t*1.3)*.2,0);
  _dummy.position.copy(ship.position); _dummy.lookAt(Math.sin(t*.5)*1.5,-10,3);
  ship.quaternion.slerp(_dummy.quaternion,1-Math.exp(-dt*3));
}
function enterSaturn(){
  switchMode('saturn',()=>{
    ship.position.set(0,14,118); ship.lookAt(0,0,0);
    follow=o=>o.set(0,0,0);
    cam.target.set(0,0,0); cam.dist=150; cam.tDist=125; cam.tPhi=1.2; cam.tTheta=.25;
    bigMsg('🪐 '+nm('saturn'),1800);
    setTimeout(()=>toast(T().satHint),1500);
  });
}
function leaveSaturn(){ backToSolar('saturn'); }
let depthKm=0, insideStage=0, boltT=2, boltLife=0, depthShown=-1;
function diveIn(){
  warp(()=>{
    setMode('inside');
    ship.position.set(0,0,0); ship.lookAt(0,-10,3);
    follow=o=>o.copy(ship.position);
    cam.target.set(0,0,0); cam.dist=10; cam.tDist=9; cam.tPhi=1.2; cam.tTheta=.6;
    depthKm=0; insideStage=0; boltT=2.5; diamonds.visible=false;
    clouds.forEach(s=>scatterCloud(s,rand(-70,28)));
    showRawCard(()=>({icon:'🌀',title:nm('inside'),text:fact('inside')}));
    setTimeout(()=>toast(T().insideToasts[0]),800);
  },'🌀 '+nm('inside'));
}
function leaveInside(){
  hideCard();
  warp(()=>{
    setMode('saturn');
    satTilt.localToWorld(ship.position.copy(DIVE).multiplyScalar(SATR*1.4));
    ship.lookAt(0,0,0);
    follow=o=>o.set(0,0,0);
    cam.tDist=90; cam.tPhi=1.15;
  });
}
function enterGalaxy(){
  hideCard();
  warp(()=>{
    setMode('galaxy');
    follow=o=>o.set(0,0,0);
    cam.target.set(0,0,0); cam.dist=300; cam.tDist=230; cam.tPhi=.95; cam.tTheta=null;
    setTimeout(()=>showRawCard(()=>({icon:'🌌',title:nm('galaxy'),text:fact('galaxy'),
      actions:[{label:'👻 '+T().dm,fn:toggleDM,alt:true}]})),700);
  },'🌌 '+nm('galaxy'));
}
function leaveGalaxy(){
  hideCard();
  warp(()=>{
    setMode('solar');
    const id=lastSolarAt||'earth';
    at=id; markActive(id);
    DEST.solar[id].target(ship.position);
    follow=o=>DEST.solar[id].focus(o);
    cam.target.copy(bodies[id].g.position); cam.dist=60; cam.tDist=DEST.solar[id].camDist; cam.tPhi=1.12;
    setWhere(whereFor(id));
  });
}
let lastSolarAt='earth';
function toggleDM(){
  dmOn=!dmOn;
  $('#dmbtn').classList.toggle('on',dmOn);
  toast(dmOn?T().dmOn:T().dmOff);
  if(dmOn){
    showRawCard(()=>({icon:'👻',title:nm('darkmatter'),text:fact('darkmatter')}));
    [523,659,880].forEach((f,i)=>tone(f*2,i*.09,.5,'sine',.05));
  }else tone(440,0,.35,'sine',.05);
  buildBar();
}

/* =============== mode registry =============== */
const MODES={
  solar:{ group:solarGroup, dist:[2.5,260], shipScale:.38, flyDist:6, dm:true, count:true, update:updateSolar,
    where:id=>id?'📍 '+DEST.solar[id].name():'☀️ '+T().toSolar,
    labels:add=>BODY_DEFS.forEach(b=>{
      const B=bodies[b.id];
      add(nm(b.id)+(b.fav?' ⭐':''),out=>{ out.copy(B.g.position); out.y+=b.r*1.25+.35; return out; },b.fav?'fav':'',b.id);
    }) },
  saturn:{ group:satGroup, dist:[6,280], shipScale:1, update:updateSaturn,
    where:id=>'🪐 '+nm('saturn')+(id?' · '+DEST.saturn[id].name():''),
    labels:add=>{
      Object.keys(satMoons).forEach(id=>{
        const M=satMoons[id];
        add(nm(id),out=>{ M.mesh.getWorldPosition(out); out.y+=M.r*1.4+.6; return out; },'',id);
      });
      add(nm('hexagon'),out=>satTilt.localToWorld(out.set(0,SATR*1.12,0)),'','hexagon');
    } },
  inside:{ group:insideGroup, dist:[4,30], shipScale:1, noStars:true, fog:insideFog, depth:true, burn:true, engine:.25,
    hover:hoverDown, update:updateInside, where:()=>'🌀 '+nm('inside') },
  galaxy:{ group:galaxyGroup, dist:[60,520], shipScale:1, noShip:true, dm:true, autoSpin:true, update:updateGalaxy,
    where:()=>'🌌 '+nm('galaxy'),
    labels:add=>add(T().here,out=>{ sunMarker.getWorldPosition(out); out.y+=4; return out; },'fav','solarBack') },
};
/* planets with a deep-exploration mode: solar card shows an "Explore" button */
const EXPLORE={ saturn:{ label:()=>T().exploreSaturn, enter:enterSaturn } };

/* plug-in explorers (js/galaxy/jupiter.js, mars.js) get this toolbox */
const api={
  THREE, scene, ship, LOW, rand, gauss, clamp, randDir, makeCanvas, canvasTexture, sphere,
  bandTex, rockyTex, softTex, ringTex, makeRing, GLOW, hitMat, approachDir,
  tone, noiseHit, thunder, whoosh, chime, toast, bigMsg, hoverDown,
  L, T, nm, fact, switchMode, backToSolar, setView, travelTo, showRawCard,
  setDepth:s=>{ $('#depth').textContent=s; }, getAt:()=>at, getMode:()=>mode, getPhase:()=>shipState.phase, parkAt,
};
function registerExplorer(ex){
  Object.assign(NAMES,ex.names); Object.assign(FACTS,ex.facts);
  for(const m in ex.modes){
    const M=ex.modes[m];
    MODES[m]=M; DEST[m]=M.dests; ORDER[m]=M.order; PICK[m]=M.pick||[];
  }
  if(ex.planet && !EXPLORE[ex.planet]) EXPLORE[ex.planet]={ label:()=>nm(ex.exploreLabel), enter:ex.enter };
}
/* Explorers are loaded on demand: nothing is downloaded or built until Max
   taps "Explore" on that planet, which keeps phone start-up fast. */
const LAZY=[
  { planet:'jupiter', file:'./jupiter.js?v=0c90647d', fn:'createJupiter', label:['🟠 Explore Jupiter!','🟠 進入木星探險！'] },
  { planet:'mars',    file:'./mars.js?v=0c90647d',    fn:'createMars',    label:['🔴 Explore Mars!','🔴 進入火星探險！'] },
  { planet:'mercury', file:'./mercury.js?v=0c90647d', fn:'createMercury', label:['⚪ Explore Mercury!','⚪ 進入水星探險！'] },
  { planet:'venus',   file:'./venus.js?v=0c90647d',   fn:'createVenus',   label:['🟡 Explore Venus!','🟡 進入金星探險！'] },
  { planet:'earth',   file:'./earth.js?v=0c90647d',   fn:'createEarth',   label:['🌍 Explore Earth & the Moon!','🌍 探索地球和月亮！'] },
  { planet:'uranus',  file:'./uranus.js?v=0c90647d',  fn:'createUranus',  label:['🩵 Explore Uranus!','🩵 進入天王星探險！'] },
  { planet:'neptune', file:'./neptune.js?v=0c90647d', fn:'createNeptune', label:['🔵 Explore Neptune!','🔵 進入海王星探險！'] },
  { planet:'pluto',   file:'./pluto.js?v=0c90647d',   fn:'createPluto',   label:['🤎 Explore Pluto!','🤎 進入冥王星探險！'] },
  { planet:'sun',     file:'./sun.js?v=0c90647d',     fn:'createSun',     label:['☀️ Fly close to the Sun!','☀️ 飛近太陽！'] },
];
const loaded={}, retries={};
let pendingTok=0;   /* bumped by every new request, so a slow load can't hijack a later choice */
function loadModule(file,fn,make){
  if(!loaded[file]){
    const slow=setTimeout(()=>toast(L()?'🚀 準備中……':'🚀 Getting ready…'),180);
    /* a failed module fetch is cached by the browser for the page's life: retry under a fresh URL */
    const n=retries[file]||0, url=n?file+(file.includes('?')?'&':'?')+'r='+n:file;
    loaded[file]=import(url).then(m=>{ clearTimeout(slow); const ex=make(m[fn]); registerExplorer(ex); return ex; })
      .catch(e=>{ clearTimeout(slow); delete loaded[file]; retries[file]=n+1; toast(L()?'哎呀，載入失敗，請再試一次':'Oops, could not load — please try again'); throw e; });
  }
  return loaded[file];
}
LAZY.forEach(z=>{
  EXPLORE[z.planet]={ label:()=>z.label[L()], enter:()=>{
    if(warping) return;
    const tok=++pendingTok;
    loadModule(z.file,z.fn,f=>f(api)).then(ex=>{
      if(tok!==pendingTok||warping||mode!=='solar'||at!==z.planet) return;
      ex.enter();
    }).catch(()=>{});
  } };
});
/* Saturn's explorer lives in this file, so its (lazy) Titan landing is hooked in by hand */
NAMES.landTitan=['Land on Titan','登陸泰坦'];
{
  const tm=satMoons.titan.mesh;
  DEST.saturn.landTitan={ name:()=>nm('landTitan'), em:'🛬',
    target:out=>tm.getWorldPosition(out).addScaledVector(LDIR,2.8*1.3).setY(out.y+1),
    center:out=>tm.getWorldPosition(out), focus:out=>tm.getWorldPosition(out), camDist:12,
    onArrive:()=>{
      const tok=++pendingTok;
      loadModule('./titan.js?v=0c90647d','createTitan',f=>f(api,tm,LDIR)).then(t=>{
        if(tok===pendingTok && mode==='saturn' && at==='landTitan') t.land();
      }).catch(()=>{ if(at==='landTitan'){ at=null; markActive(null); } });
      return true;
    } };
  ORDER.saturn.splice(ORDER.saturn.indexOf('solarFromSat'),0,'landTitan');
}
/* once the game is running, quietly fetch explorer code in the background
   (download only — scenes are still built on first visit) */
function prefetchExplorers(){
  const files=[...LAZY.map(z=>z.file),'./titan.js?v=0c90647d'];
  const next=()=>{ const f=files.shift(); if(!f) return; import(f).catch(()=>{}).finally(()=>setTimeout(next,400)); };
  setTimeout(next,4000);
}

/* =============== DOM: bar, card, labels, top info =============== */
function buildBar(){
  const bar=$('#bar'); bar.innerHTML='';
  ORDER[mode].forEach(id=>{
    const d=DEST[mode][id];
    const b=document.createElement('button');
    b.className='chip'+(d.fav?' fav':'')+(id===at||(d.isOn&&d.isOn())?' active':'');
    b.dataset.id=id;
    let html=d.em?`<span class="em">${d.em}</span>`:`<span class="dot" style="background:${d.dot}"></span>`;
    html+=`<span>${d.name()}</span>`;
    if(d.fav) html+=`<span class="badge">⭐${d.fav}</span>`;
    if(d.planet&&visited.has(id)) html+='<span class="ck">✓</span>';
    b.innerHTML=html;
    b.onclick=()=>travelTo(id);
    bar.appendChild(b);
  });
}
function markActive(id){
  document.querySelectorAll('#bar .chip').forEach(c=>{
    const d=DEST[mode][c.dataset.id];
    c.classList.toggle('active',c.dataset.id===id||!!(d&&d.isOn&&d.isOn()));
    if(c.dataset.id===id) c.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});
  });
}
/* =============== read-aloud (Max is five — he listens, we read) =============== */
let cardSpeech='';
const narrator=createNarrator({
  getLang:()=>lang, isSoundOn:()=>soundOn,
  onSpeaking:on=>{
    $('#cardspeak').classList.toggle('on',on);
    if(master && soundOn) master.gain.setTargetAtTime(on?.35:1,actx.currentTime,.2);   /* duck the music while talking */
  },
});
const stopSpeech=()=>narrator.stop();
function speakCard(force){ narrator.speak(cardSpeech,force); }
const unlockSpeech=()=>narrator.unlock();
$('#cardspeak').onclick=()=>{ if(narrator.isSpeaking()) stopSpeech(); else { ensureAudio(); speakCard(true); } };

let cardRender=null;
function renderCard(spec){
  cardSpeech=spec.title+(lang==='zh'?'。':'. ')+spec.text;
  const icon=$('#cicon');
  icon.innerHTML=spec.icon?spec.icon:`<span class="cdot" style="background:${spec.dot}"></span>`;
  $('#ctitle').textContent=spec.title;
  const badge=$('#cbadge');
  if(spec.badge){ badge.style.display='inline-block'; badge.textContent=spec.badge; } else badge.style.display='none';
  $('#ctext').textContent=spec.text;
  const acts=$('#cacts'); acts.innerHTML='';
  (spec.actions||[]).forEach(a=>{
    const el=document.createElement(a.href?'a':'button');
    el.className='act'+(a.alt?' alt':''); el.textContent=a.label;
    if(a.href) el.href=a.href; else el.onclick=a.fn;
    acts.appendChild(el);
  });
  $('#card').style.display='block';
  cardH=$('#card').offsetHeight;
}
function showDestCard(id){
  const d=DEST[mode][id]; if(!d||!d.fact) return;
  const m=mode;
  cardRender=()=>{
    const dd=DEST[m][id];
    renderCard({icon:dd.em,dot:dd.dot,title:dd.name(),text:dd.fact(),
      badge:dd.fav?T().fav(dd.fav):null, actions:dd.actions?dd.actions():null});
  };
  cardRender(); speakCard();
}
function showRawCard(fn){ cardRender=()=>renderCard(fn()); cardRender(); speakCard(); }
function hideCard(){ $('#card').style.display='none'; cardRender=null; cardH=0; stopSpeech(); }
$('#cardx').onclick=hideCard;

function whereFor(id){ return MODES[mode].where(id); }
function setWhere(s){ $('#where').textContent=s; }
function updateCount(){ $('#count').textContent=T().visited(visited.size); }

let labels=[];
function buildLabels(){
  const host=$('#labels'); host.innerHTML=''; labels=[];
  const add=(text,get,cls,dest)=>{
    const el=document.createElement('div'); el.className='plabel '+(cls||''); el.textContent=text;
    if(dest) el.onclick=()=>travelTo(dest);
    host.appendChild(el); labels.push({el,get,vis:false});
  };
  if(MODES[mode].labels) MODES[mode].labels(add);
  if(!MODES[mode].noShip) add(T().ship,out=>{ out.copy(ship.position); out.y+=ship.scale.x*.9+.25; return out; },'ship');
}
function positionLabels(){
  const W=innerWidth, H=innerHeight, hudTop=H>W?150:96;   /* keep labels clear of the top status pills */
  for(const l of labels){
    l.get(_lv).project(camera);
    const sy=(-_lv.y*.5+.5)*H;
    if(_lv.z>1||Math.abs(_lv.x)>1.1||Math.abs(_lv.y)>1.1||sy<hudTop){
      if(l.vis){ l.el.style.display='none'; l.vis=false; }
      continue;
    }
    if(!l.vis){ l.el.style.display='block'; l.vis=true; }
    l.el.style.transform=`translate(${((_lv.x*.5+.5)*W).toFixed(1)}px,${((-_lv.y*.5+.5)*H).toFixed(1)}px) translate(-50%,-100%)`;
  }
}

function applyLang(){
  document.documentElement.lang=lang==='zh'?'zh-Hant':'en';
  $('#otitle').textContent=T().title; $('#otag').textContent=T().tag;
  $('#startbtn').textContent=T().start; $('#obck').textContent=T().backFull;
  $('#backtxt').textContent=T().back;
  $('#langbtn').textContent=lang==='en'?'中文':'EN';
  document.querySelectorAll('.olang button').forEach(b=>b.classList.toggle('on',b.dataset.l===lang));
  buildBar(); buildLabels(); updateCount();
  setWhere(shipState.phase==='flying'?T().flying(DEST[mode][shipState.dest].name()):whereFor(at));
  if(cardRender){ cardRender(); speakCard(); }
}
$('#langbtn').onclick=()=>{ lang=lang==='en'?'zh':'en'; savePrefs(); applyLang(); };
document.querySelectorAll('.olang button').forEach(b=>b.onclick=()=>{ lang=b.dataset.l; savePrefs(); applyLang(); });
function updateSndBtn(){ $('#sndbtn').textContent=soundOn?'🔊':'🔇'; }
$('#sndbtn').onclick=()=>{
  soundOn=!soundOn; ensureAudio();
  if(master) master.gain.setTargetAtTime(soundOn?1:0,actx.currentTime,.1);
  if(soundOn) chime(); else stopSpeech();
  updateSndBtn(); savePrefs();
};
$('#dmbtn').onclick=toggleDM;

/* =============== input: drag to look, pinch/wheel to zoom, tap to fly =============== */
const cv=renderer.domElement;
const ptrs=new Map(); let pinch0=0, moved=0, downT=0, downXY=null;
const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
cv.addEventListener('pointerdown',e=>{
  cv.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1){ moved=0; downT=performance.now(); downXY={x:e.clientX,y:e.clientY}; }
  if(ptrs.size===2){ const [a,b]=[...ptrs.values()]; pinch0=Math.hypot(a.x-b.x,a.y-b.y); moved=99; }
});
cv.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId); if(!p) return;
  const dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY;
  if(ptrs.size===1){
    moved+=Math.abs(dx)+Math.abs(dy);
    if(moved>6){
      cam.theta-=dx*.0055; cam.phi=clamp(cam.phi-dy*.0045,.12,2.95);
      cam.tTheta=cam.tPhi=null; lastDrag=performance.now();
    }
  }else if(ptrs.size===2){
    const [a,b]=[...ptrs.values()], d=Math.hypot(a.x-b.x,a.y-b.y);
    if(pinch0>0&&d>0){ cam.tDist=clampDist(cam.tDist*pinch0/d); cam.dist=cam.tDist; }
    pinch0=d; lastDrag=performance.now();
  }
});
const ptrUp=e=>{
  if(!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if(ptrs.size===0&&moved<=6&&performance.now()-downT<450&&downXY) pick(downXY.x,downXY.y);
  if(ptrs.size<2) pinch0=0;
};
cv.addEventListener('pointerup',ptrUp);
cv.addEventListener('pointercancel',e=>{ ptrs.delete(e.pointerId); pinch0=0; });
cv.addEventListener('wheel',e=>{ e.preventDefault(); cam.tDist=clampDist(cam.tDist*(1+e.deltaY*.0012)); lastDrag=performance.now(); },{passive:false});
cv.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('gesturestart',e=>e.preventDefault());
function pick(x,y){
  if(!started) return;
  ndc.set(x/innerWidth*2-1,-(y/innerHeight)*2+1);
  ray.setFromCamera(ndc,camera);
  for(const h of ray.intersectObjects(PICK[mode],false)){
    const id=h.object.userData.dest;
    if(id){ travelTo(id); return; }
  }
}
addEventListener('keydown',e=>{ if(e.code==='Escape') hideCard(); });
addEventListener('resize',()=>{
  fitFov();
  renderer.setSize(innerWidth,innerHeight);
});

/* =============== per-mode updates =============== */
function updateSolar(dt){
  for(const id in bodies){
    const B=bodies[id];
    if(B.d){ B.a+=B.speed*dt; B.g.position.set(Math.cos(B.a)*B.d,0,Math.sin(B.a)*B.d); }
    B.mesh.rotation.y+=dt*(id==='sun'?.05:.3);
    for(const m of B.moons){ m.a+=m.sp*dt; m.m.position.set(Math.cos(m.a)*m.d,0,Math.sin(m.a)*m.d); }
  }
  belt.rotation.y+=dt*.015;
  dmSolar.rotation.y+=dt*.01;
  if(at) lastSolarAt=at;
}
function updateSaturn(dt){
  saturnBig.rotation.y+=dt*.05; hexCap.rotation.y+=dt*.05;
  ringChunks.rotation.y+=dt*.02; ringPlane.rotation.z+=dt*.02;
  for(const id in satMoons){
    const M=satMoons[id]; M.a+=M.sp*dt*.3;
    M.g.position.set(Math.cos(M.a)*M.d,0,Math.sin(M.a)*M.d);
  }
  if(geyser){
    const arr=geyser.pts.geometry.attributes.position.array, r=geyser.r;
    geyser.parts.forEach((p,i)=>{
      p.t+=dt*p.sp; if(p.t>1) p.t-=1;
      const s=p.t*r*4.5;
      arr[i*3]=p.dx*s; arr[i*3+1]=-r-s; arr[i*3+2]=p.dz*s;
    });
    geyser.pts.geometry.attributes.position.needsUpdate=true;
  }
}
const _o=new THREE.Object3D();
function updateInside(dt,t){
  depthKm+=dt*1100;
  const shown=Math.round(depthKm/100)*100;
  if(shown!==depthShown){ depthShown=shown; $('#depth').textContent=T().depth(shown); }
  const stage=depthKm>11000?2:depthKm>4500?1:0;
  if(stage>insideStage){ insideStage=stage; toast(T().insideToasts[stage]); if(stage===2){ diamonds.visible=true; tone(1568,0,.6,'sine',.05); tone(2093,.12,.7,'sine',.04); } }
  for(const s of clouds){ s.position.y+=dt*9; if(s.position.y>30) scatterCloud(s,s.position.y-100); }
  if(insideStage>=1){
    boltT-=dt;
    if(boltT<=0){
      boltT=rand(1.6,4.2); boltLife=.22;
      const arr=bolt.geometry.attributes.position.array;
      let x=rand(-30,30), z=rand(-40,-15), y=28;
      for(let i=0;i<14;i++){ arr[i*3]=x; arr[i*3+1]=y; arr[i*3+2]=z; x+=rand(-3,3); z+=rand(-1.5,1.5); y-=rand(3,5.5); }
      bolt.geometry.attributes.position.needsUpdate=true;
      setTimeout(thunder,rand(120,500));
    }
  }
  if(boltLife>0){
    boltLife-=dt; bolt.visible=boltLife>0&&(boltLife>.16||boltLife<.08);
    insideHemi.intensity=1.6+(bolt.visible?2.6:0);
  }else{ bolt.visible=false; insideHemi.intensity=1.6; }
  if(diamonds.visible){
    diamondData.forEach((d,i)=>{
      d.p.y-=dt*(d.sp-9)+dt*2; d.r+=dt*2;
      if(d.p.y<-45){ d.p.copy(diamondSpot()).setY(rand(22,30)); }
      _o.position.copy(d.p); _o.rotation.set(d.r,d.r*.7,0); _o.scale.setScalar(1);
      _o.updateMatrix(); diamonds.setMatrixAt(i,_o.matrix);
    });
    diamonds.instanceMatrix.needsUpdate=true;
    if(Math.random()<dt*.6) tone(rand(1800,2600),0,.25,'sine',.02);
  }
}
function updateGalaxy(dt,t){
  galaxyGroup.rotation.y+=dt*.025;
  const s=1+Math.sin(t*3)*.25; sunRing.scale.set(s,s,s);
  sunRing.material.opacity=.5+Math.sin(t*3)*.3;
}
function updateDM(dt,t){
  dmLevel+=((dmOn?1:0)-dmLevel)*(1-Math.exp(-dt*2.5));
  const breathe=.85+Math.sin(t*1.3)*.15;
  dmSolar.material.opacity=dmLevel*.55*breathe; dmSolar.visible=dmLevel>.01;
  dmHalo.material.opacity=dmLevel*.32*breathe; dmHalo.visible=dmLevel>.01;
}

/* =============== main loop =============== */
const clock=new THREE.Clock(); let time=0;
function tick(){
  requestAnimationFrame(tick);
  const dt=Math.min(clock.getDelta(),.05); time+=dt;
  MODES[mode].update(dt,time);
  updateShip(dt,time);
  updateDM(dt,time);
  updateCamera(dt);
  renderer.render(scene,camera);
  positionLabels();
}

/* =============== start =============== */
function begin(){
  if(started) return;
  started=true;
  ensureAudio(); unlockIOS(); unlockSpeech(); startPad(); startEngine(); prefetchExplorers();
  $('#overlay').style.opacity=0;
  setTimeout(()=>$('#overlay').style.display='none',600);
  at='earth'; markActive('earth');
  if(!visited.has('earth')){ visited.add('earth'); savePrefs(); }
  updateCount(); buildBar();
  DEST.solar.earth.target(ship.position);
  follow=o=>DEST.solar.earth.focus(o);
  cam.tDist=DEST.solar.earth.camDist; cam.tPhi=1.12;
  DEST.solar.earth.focus(_a); DEST.solar.earth.target(_b);
  cam.tTheta=Math.atan2(_b.x-_a.x,_b.z-_a.z)+.55;
  setWhere(whereFor('earth'));
  chime();
  /* galaxy.html#pluto (e.g. from Max's Pluto story) flies straight to that planet */
  const goal=location.hash.slice(1);
  if(PLANETS.includes(goal) && goal!=='earth'){ setTimeout(()=>travelTo(goal),1400); return; }
  setTimeout(()=>{ if(mode==='solar'&&at==='earth'&&shipState.phase!=='flying') showDestCard('earth'); toast(T().tapHint); },1600);
}
$('#startbtn').onclick=begin;

updateSolar(0);
DEST.solar.earth.target(ship.position);
ship.scale.setScalar(MODES.solar.shipScale);
updateSndBtn();
setMode('solar');
applyLang();
tick();

/* every card's spoken text, for tools/make_voice.py (loads all explorers first) */
async function voiceLines(){
  await Promise.all([...LAZY.map(z=>loadModule(z.file,z.fn,f=>f(api))), loadModule('./titan.js?v=0c90647d','createTitan',f=>f(api,satMoons.titan.mesh,LDIR))]);
  const out=[];
  for(const id in FACTS){
    if(!NAMES[id]) continue;
    ['en','zh'].forEach((lg,i)=>{
      const text=NAMES[id][i]+(lg==='zh'?'。':'. ')+FACTS[id][i];
      out.push({id,lang:lg,key:textKey(text),text});
    });
  }
  return out;
}
const BOOT_MS=Math.round(performance.now());
window.__galaxy={ voiceLines, travelTo, setMode, state:()=>({mode,at,phase:shipState.phase,visited:[...visited],dmOn}),
  info:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
    geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,bootMs:BOOT_MS}) };
