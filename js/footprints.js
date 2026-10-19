/* ============================================================
   Max 的足跡 · Max's Footprints

   A cartoon globe with the places Max has lived (Oxford before he was
   born, Bristol for his first year, Hong Kong since) and the places he
   has travelled to. "Play" flies along his journey; from Hong Kong you
   can dive straight down into Max's World (index.html?from=earth).
   Only cities are shown, and ages instead of dates.
   ============================================================ */
import * as THREE from 'three';
import { rand, makeCanvas, canvasTexture } from './helpers.js';
import { createNarrator, textKey } from './narrator.js';

const $ = s => document.querySelector(s);
const SAVE_KEY = 'maxworld.v1';   /* shares the language choice with Max's World */
const saved = (() => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; } })();
let lang = saved.lang || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');

/* ---------------- places ---------------- */
const HOMES = [
  { id:'oxford', lon:-1.26, lat:51.75, icon:'🤰', dy:-6,
    when:{ en:'Before he was born', zh:'出生之前' }, age:{ en:'Age −1', zh:'-1～0 歲' },
    name:{ en:'Oxford, UK', zh:'英國牛津' },
    text:{ en:"Before Max was born, Mum was expecting him here in Oxford — a city of old colleges and lots of bookshops.",
           zh:'Max 出生之前，媽媽懷着他住在英國牛津——一個有很多古老學院和書店的城市。' } },
  { id:'bristol', lon:-2.59, lat:51.45, icon:'👶', dy:26,
    when:{ en:'His first year', zh:'第一年' }, age:{ en:'Age 0–1', zh:'0～1 歲' },
    name:{ en:'Bristol, UK', zh:'英國布里斯托' },
    text:{ en:"Max spent his very first year in Bristol, a harbour city with a famous bridge high above a river gorge.",
           zh:'Max 人生的第一年在英國布里斯托度過——那裏有一座高高架在河谷上的大橋。' } },
  { id:'hk', lon:114.17, lat:22.30, icon:'🏠', dy:0, enter:true,
    when:{ en:'Since he was one', zh:'一歲到現在' }, age:{ en:'Age 1 – now', zh:'1 歲～現在' },
    name:{ en:'Hong Kong', zh:'香港' },
    text:{ en:"Since he was one, Max has grown up in Hong Kong — mountains, islands, ferries and trams. This is where Max's World is!",
           zh:'一歲開始，Max 在香港長大——有山、有海島、有渡輪和叮叮車。Max\'s World 就在這裏！' } },
];
const TRIPS = [
  { id:'seoul', lon:126.98, lat:37.57, name:{ en:'Seoul, Korea', zh:'韓國首爾' },
    text:{ en:'In Seoul Max visited Lotte World and the COEX Aquarium — and drew them both!', zh:'在首爾，滿滿去了樂天世界和 COEX 水族館，回來還把它們都畫了下來！' },
    links:[ { href:'./?from=earth&art=lotte', en:'🎨 Lotte World', zh:'🎨 樂天世界' }, { href:'./?from=earth&art=aquarium', en:'🎨 COEX Aquarium', zh:'🎨 COEX 水族館' } ] },
  { id:'taiwan', lon:121.56, lat:25.03, dy:30, name:{ en:'Taiwan', zh:'台灣' },
    text:{ en:'In Taiwan the family explored bookshops and picked out favourite books together.', zh:'在台灣，一家人逛了很多書店，一起挑選喜歡的書。' } },
  { id:'shenzhen', lon:114.06, lat:22.54, dy:-22, name:{ en:'Shenzhen', zh:'深圳' },
    text:{ en:'In Shenzhen Max finished the Spartan Kids race — he jumped into the mud, got up after falling, and won his medal!', zh:'在深圳，滿滿完成了 Spartan Kids 小勇士賽——跳進泥坑，跌倒了再爬起來，拿到了完賽獎牌！' } },
  { id:'cambridge', lon:0.12, lat:52.2, dy:-22, name:{ en:'Cambridge, UK', zh:'英國劍橋' },
    text:{ en:'In Cambridge, Max explored more bookshops and libraries.', zh:'在英國劍橋，滿滿也去逛了書店和圖書館。' } },
  { id:'gaoligong', lon:98.49, lat:25.02, dy:-20, name:{ en:'Gaoligong Mountains', zh:'騰沖高黎貢山' },
    text:{ en:'In the Gaoligong Mountains, Max hiked through ancient forest high up in the mountains with Dad.', zh:'在騰沖高黎貢山，滿滿跟着爸爸徒步穿越高山上的原始森林。' } },
  { id:'dali', lon:100.23, lat:25.6, dy:-40, name:{ en:'Dali', zh:'大理' },
    text:{ en:'Before he turned four, Max joined a five-day outdoor camp on Cangshan Mountain in Dali — running, climbing and exploring!', zh:'不到四歲，滿滿就在大理蒼山參加了五天戶外營，在山林裏奔跑、攀爬、探索。' } },
  { id:'banna', lon:100.8, lat:22.0, dy:6, name:{ en:'Xishuangbanna', zh:'西雙版納' },
    text:{ en:'In Xishuangbanna, Max put on his rain boots and walked into the tropical rainforest to look for plants and animals.', zh:'在西雙版納，滿滿穿上雨靴，走進熱帶雨林探索動植物。' } },
  { id:'kashgar', lon:75.99, lat:39.47, name:{ en:'Kashgar, Xinjiang', zh:'新疆喀什' },
    text:{ en:'Max has even been all the way to Kashgar in Xinjiang — a city and landscape very different from Hong Kong.', zh:'滿滿還去過很遠很遠的新疆喀什，看見了和香港很不一樣的城市和風景。' } },
];
const ALL = [...HOMES, ...TRIPS];

const UI = {
  en:{ title:"Max's Footprints", back:"Max's World", play:'Play', playSub:'his story', travel:'Travels', travelSub:'places he went',
       enter:"🏝️ Fly into Max's World", lang:'中文', next:'Next ▶', tripsTitle:'Places Max has been',
       tripsText:'Tap a star to see what Max did there.' },
  zh:{ title:'Max 的足跡', back:'Max 的小世界', play:'播放', playSub:'Max 的故事', travel:'旅行', travelSub:'去過的地方',
       enter:'🏝️ 飛進 Max 的小世界', lang:'EN', next:'下一站 ▶', tripsTitle:'Max 去過的地方',
       tripsText:'點一點星星，看看滿滿在那裏做了甚麼。' },
};
const U = () => UI[lang];
const speechOf = (p, lg) => p.name[lg] + (lg === 'zh' ? '。' : '. ') + p.text[lg];

/* ---------------- scene ---------------- */
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('#scene').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .01, 200);
/* tall phone screens: keep the same side-to-side view as a wide screen */
const fitFov = () => { const a = innerWidth / innerHeight; camera.aspect = a; camera.fov = a < 1 ? Math.min(80, 2 * Math.atan(Math.tan(20 * Math.PI / 180) / a) * 180 / Math.PI) : 40; camera.updateProjectionMatrix(); };
fitFov();
camera.position.set(0, 0, 3.4);
scene.add(new THREE.AmbientLight(0xffffff, .9));
const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-2, 1.5, 3); scene.add(key);

/* stars */
{
  const N = 1800, pos = new Float32Array(N * 3), v = new THREE.Vector3();
  for (let i = 0; i < N; i++) { v.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(40, 70)); pos.set([v.x, v.y, v.z], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color:0xffffff, size:1.8, sizeAttenuation:false, transparent:true, opacity:.85 })));
}

/* cartoon world map (lon/lat outlines, simplified) */
const LAND = [
  ['#6fbf5a', [[-168,66],[-162,70],[-140,70],[-120,72],[-95,72],[-82,68],[-75,62],[-64,60],[-56,52],[-66,45],[-70,42],[-76,35],[-81,31],[-80,25],[-83,29],[-90,30],[-97,26],[-97,20],[-92,18],[-87,21],[-84,15],[-79,9],[-83,8],[-92,14],[-105,20],[-110,24],[-117,32],[-124,40],[-124,48],[-130,55],[-140,60],[-152,58],[-165,60]]],
  ['#eef4f8', [[-55,60],[-42,60],[-20,70],[-20,80],[-40,83],[-65,80],[-58,75]]],
  ['#5daf4f', [[-80,10],[-72,12],[-62,10],[-50,0],[-35,-6],[-38,-15],[-41,-23],[-48,-26],[-58,-35],[-65,-42],[-68,-52],[-72,-50],[-74,-40],[-71,-30],[-71,-18],[-76,-14],[-81,-5],[-80,0]]],
  ['#7cc45e', [[-9,37],[-9,43],[-1,46],[-4,48],[2,51],[8,54],[12,54],[20,55],[28,60],[30,70],[45,68],[60,70],[70,73],[80,73],[100,77],[115,74],[130,71],[140,72],[160,70],[170,67],[180,66],[178,62],[165,60],[160,52],[155,50],[150,59],[142,59],[138,54],[141,48],[135,43],[130,42],[129,35.5],[126.5,34.5],[126,37],[125,39],[122,40],[121,39],[118,38],[120,35],[122,31],[121,28],[119,25],[116,23],[113,22],[110,21],[108,21],[106,18],[109,12],[107,10],[105,9],[103,10],[101,13],[100,8],[103,1.5],[101,3],[98,8],[98,16],[94,17],[92,22],[88,22],[85,20],[80,15],[80,10],[77,8],[73,16],[72,21],[67,25],[62,25],[57,26],[56,24],[59,22],[55,17],[52,16],[45,13],[43,16],[39,22],[35,28],[34,31],[35,36],[30,36],[27,37],[26,40],[23,40],[23,37],[21,38],[20,40],[19,42],[13,45],[16,41],[18,40],[16,38],[12,38],[12,42],[10,44],[7,43],[3,43],[0,39],[-2,37],[-6,36]]],
  ['#d9c27a', [[35,28],[39,22],[43,16],[45,13],[52,16],[55,17],[59,22],[56,24],[50,26],[48,30],[44,30],[38,31]]],   /* Arabian desert */
  ['#7cc45e', [[5,58],[8,58],[11,59],[12,56],[13,55],[18,60],[22,65],[25,65.5],[28,70],[24,71],[15,69],[8,63],[5,61]]],
  ['#7cc45e', [[-5.7,50],[1.5,51],[1.7,52.8],[0,53.5],[-1.5,55],[-2,56],[-1.8,57.5],[-3.5,58.6],[-5,58.6],[-6,57],[-5.5,55.5],[-4.8,54.8],[-3.3,54.4],[-3.2,53.4],[-4.6,53.3],[-4.3,52.3],[-5.2,51.7],[-3.3,51.4]]],
  ['#7cc45e', [[-6,52],[-6.2,54],[-7.5,55.3],[-10,54],[-10.2,52],[-8,51.5]]],
  ['#a8b84e', [[-17,21],[-16,28],[-10,30],[-6,35.8],[10,37],[11,33],[20,31],[25,32],[32,31],[34,28],[37,22],[43,12],[51,12],[48,5],[40,-3],[39,-10],[40,-16],[35,-22],[33,-27],[28,-33],[20,-35],[17,-30],[12,-17],[13,-8],[9,-1],[9,4],[5,6],[-4,5],[-8,4],[-13,8],[-17,14]]],
  ['#dcc67c', [[-16,20],[-15,27],[-8,30],[0,32],[10,32],[20,30],[30,30],[33,24],[30,18],[20,16],[10,17],[0,18],[-10,17]]],   /* Sahara */
  ['#7cc45e', [[44,-25],[47,-25],[50,-15],[49,-12],[44,-17]]],
  ['#7cc45e', [[130.9,33.9],[132,35],[136,36],[140,38],[141.5,41],[142,40],[141,36],[140,35],[137,34.5],[135,33.7],[132,33],[131,31]]],
  ['#7cc45e', [[140,41.5],[141,45.5],[145,44],[143,42]]],
  ['#7cc45e', [[120.1,23],[121,25.3],[121.9,25],[121,22],[120.7,21.9]]],
  ['#7cc45e', [[108.6,19.2],[110,20.1],[111,19.6],[110,18.2],[108.7,18.5]]],
  ['#5daf4f', [[109,1],[112,3],[117,7],[119,5],[118,1],[116,-4],[110,-3]]],
  ['#5daf4f', [[95,5.5],[98,4],[104,-2],[106,-6],[102,-4],[97,2]]],
  ['#5daf4f', [[105,-6],[114,-7],[114,-8.5],[106,-7.5]]],
  ['#5daf4f', [[120,18],[122,18],[124,12],[126,7],[124,7],[122,11],[120,14]]],
  ['#5daf4f', [[131,-1],[141,-2.5],[150,-10],[141,-9],[137,-5]]],
  ['#d8b56a', [[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-19],[153,-26],[151,-33],[146,-39],[140,-38],[135,-35],[130,-32],[115,-34],[113,-26]]],
  ['#7cc45e', [[173,-35],[178,-38],[175,-41.5],[171,-44],[167,-46],[169,-43],[172,-40]]],
  ['#eef4f8', [[-180,-70],[180,-70],[180,-90],[-180,-90]]],
];
function mapTexture(){
  const W = 2048, H = 1024, c = makeCanvas(W, H), x = c.getContext('2d');
  const og = x.createLinearGradient(0, 0, 0, H); og.addColorStop(0, '#5aa7e6'); og.addColorStop(.5, '#3b8fd8'); og.addColorStop(1, '#5aa7e6');
  x.fillStyle = og; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 3;   /* gentle wave lines */
  for (let y = 40; y < H; y += 46) { x.beginPath(); for (let px = 0; px <= W; px += 16) x.lineTo(px, y + Math.sin(px / 60 + y) * 5); x.stroke(); }
  const P = ([lon, lat]) => [(lon + 180) / 360 * W, (90 - lat) / 180 * H];
  LAND.forEach(([col, pts]) => {
    x.beginPath(); pts.forEach((p, i) => { const [px, py] = P(p); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath();
    x.fillStyle = col; x.fill();
    x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 3; x.stroke();
  });
  return canvasTexture(c);
}
const globe = new THREE.Group(); scene.add(globe);
globe.rotation.order = 'XYZ';
globe.add(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshLambertMaterial({ map:mapTexture() })));
{ /* soft atmosphere glow */
  const c = makeCanvas(256, 256), x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 88, 128, 128, 128);
  g.addColorStop(0, 'rgba(120,190,255,.55)'); g.addColorStop(1, 'rgba(120,190,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:canvasTexture(c), transparent:true, depthWrite:false }));
  s.scale.set(2.95, 2.95, 1); s.renderOrder = -1; scene.add(s);
}
/* lon/lat -> point on the unit sphere, matching SphereGeometry's texture layout */
function surf(lon, lat, r = 1){
  const ph = (lon + 180) * Math.PI / 180, th = lat * Math.PI / 180;
  return new THREE.Vector3(-Math.cos(ph) * Math.cos(th) * r, Math.sin(th) * r, Math.sin(ph) * Math.cos(th) * r);
}

/* pins */
ALL.forEach(p => {
  p.v = surf(p.lon, p.lat);
  const home = HOMES.includes(p);
  const g = new THREE.Group(); g.position.copy(p.v); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.v); globe.add(g);
  const h = home ? .05 : .025;
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(.003, .003, h, 6), new THREE.MeshBasicMaterial({ color:0xffffff })); stick.position.y = h / 2; g.add(stick);
  const head = new THREE.Mesh(new THREE.SphereGeometry(home ? .014 : .009, 14, 10), new THREE.MeshBasicMaterial({ color:home ? 0xff7a3d : 0xffcf5c })); head.position.y = h; g.add(head);
  p.tip = new THREE.Vector3(0, h, 0); p.pin = g;
  const b = document.createElement('button'); b.className = 'lbl ' + (home ? 'home' : 'trip');
  b.onclick = () => focusPlace(p, true);
  $('#labels').appendChild(b); p.el = b;
});

/* the journey: Oxford -> Bristol -> Hong Kong, drawn as an arc that grows */
function arcPoints(a, b, lift, n = 80){
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n; out.push(a.clone().lerp(b, t).normalize().multiplyScalar(1 + Math.sin(Math.PI * t) * lift + .004)); }
  return out;
}
const legs = [[0, 1, .015], [1, 2, .32]].map(([i, j, lift]) => {
  const pts = arcPoints(HOMES[i].v, HOMES[j].v, lift);
  const geo = new THREE.BufferGeometry().setFromPoints(pts); geo.setDrawRange(0, 0);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color:0xffcf5c, transparent:true, opacity:.95 }));
  globe.add(line); return { pts, geo, n:pts.length };
});
const plane = (() => {
  const c = makeCanvas(64, 64), x = c.getContext('2d'); x.font = '48px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('✈️', 32, 34);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:canvasTexture(c), transparent:true, depthTest:false })); s.scale.set(.09, .09, 1); s.visible = false; globe.add(s); return s;
})();
let legAnim = null;   /* { leg, t0, then } */
function drawLeg(k, then){ legAnim = { leg:legs[k], t0:performance.now(), then }; plane.visible = true; }
function showLegs(upto){ legs.forEach((l, k) => l.geo.setDrawRange(0, k < upto ? l.n : 0)); }

/* ---------------- camera: turn the globe to face a place ---------------- */
const view = { yaw:0, pitch:.35, dist:3.4, tYaw:null, tPitch:null, tDist:3.4, spin:true };
function faceAngles(v){
  const yaw = Math.atan2(-v.x, v.z);
  const z1 = -v.x * Math.sin(yaw) + v.z * Math.cos(yaw);
  return [yaw, Math.atan2(v.y, z1)];
}
function aimAt(lon, lat, dist){
  const [y, p] = faceAngles(surf(lon, lat));
  let d = y - view.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
  view.tYaw = view.yaw + d; view.tPitch = p; view.tDist = dist; view.spin = false;
}

/* ---------------- card + narration ---------------- */
let soundOn = true, current = null, playing = false, waitSpeech = false;
/* while playing, the next leg starts when the narration finishes by itself (not when it is cut off) */
const narrator = createNarrator({ getLang:() => lang, isSoundOn:() => soundOn,
  onSpeaking:on => { $('#speak').classList.toggle('on', on); if (!on && playing && waitSpeech) { waitSpeech = false; setTimeout(playNext, 900); } } });
const quiet = () => { waitSpeech = false; narrator.stop(); };
function showCard(p){
  current = p;
  const home = HOMES.includes(p);
  $('#cwhen').textContent = home ? `${p.icon} ${p.age[lang]} · ${p.when[lang]}` : '⭐';
  $('#ctitle').textContent = p.name[lang];
  $('#ctext').textContent = p.text[lang];
  const acts = $('#cacts'); acts.innerHTML = '';
  if (p.enter) { const b = document.createElement('button'); b.className = 'big'; b.textContent = U().enter; b.onclick = enterWorld; acts.appendChild(b); }
  (p.links || []).forEach(l => { const a = document.createElement('a'); a.href = l.href; a.textContent = l[lang]; acts.appendChild(a); });
  if (playing && !p.enter) { const n = document.createElement('button'); n.className = 'alt'; n.textContent = U().next; n.onclick = () => { quiet(); playNext(); }; acts.appendChild(n); }
  $('#card').style.display = 'block';
  ALL.forEach(q => q.el.classList.toggle('on', q === p));
}
function hideCard(){ $('#card').style.display = 'none'; current = null; quiet(); ALL.forEach(q => q.el.classList.remove('on')); }
$('#cardx').onclick = () => { playing = false; hideCard(); };

let stage = 'all';
function focusPlace(p, fromTap){
  if (fromTap) playing = false;
  const home = HOMES.includes(p);
  stage = home ? p.id : 'trips';
  aimAt(p.lon, p.lat + (innerWidth < 560 ? -4 : -3), home && p.id !== 'hk' ? 1.6 : (home ? 2.0 : 2.15));
  if (home) showLegs(HOMES.indexOf(p));
  showCard(p); markStage();
  quiet(); waitSpeech = playing; narrator.speak(speechOf(p, lang));
}

/* play: Oxford -> (fly) -> Bristol -> (fly) -> Hong Kong */
let playStep = 0;
function play(){
  playing = true; playStep = 0; showLegs(0);
  focusPlace(HOMES[0]);
  if (!soundOn) setTimeout(playNext, 6000);
}
function playNext(){
  if (!playing) return;
  playStep++;
  if (playStep > 2) { playing = false; return; }
  const k = playStep - 1;
  hideCard();
  aimAt((HOMES[k].lon + HOMES[k + 1].lon) / 2, (HOMES[k].lat + HOMES[k + 1].lat) / 2, k === 0 ? 1.6 : 2.9);
  drawLeg(k, () => { if (!playing) return; focusPlace(HOMES[k + 1]); if (!soundOn && playStep < 2) setTimeout(playNext, 6000); });
}

/* dive from Hong Kong down into Max's World */
let diving = false;
function enterWorld(){
  if (diving) return; diving = true; playing = false;
  quiet(); $('#card').style.display = 'none';
  aimAt(HOMES[2].lon, HOMES[2].lat, 1.04);
  setTimeout(() => $('#flash').classList.add('on'), 900);
  setTimeout(() => { location.href = './?from=earth'; }, 1800);
}
addEventListener('pageshow', e => { if (e.persisted && diving) { diving = false; $('#flash').classList.remove('on'); aimAt(HOMES[2].lon, HOMES[2].lat, 2.0); } });

/* ---------------- stage bar ---------------- */
function stageBtn(id, top, sub, cls, fn){
  const b = document.createElement('button'); b.className = 'st ' + (cls || ''); b.dataset.id = id;
  b.innerHTML = `<small></small><b></b>`; b.querySelector('small').textContent = top; b.querySelector('b').textContent = sub;
  b.onclick = fn; return b;
}
function buildStages(){
  const bar = $('#stages'); bar.innerHTML = '';
  bar.appendChild(stageBtn('play', '▶ ' + U().play, U().playSub, 'play', play));
  HOMES.forEach(p => bar.appendChild(stageBtn(p.id, p.age[lang], p.icon + ' ' + p.name[lang].replace(/^英國|, UK$/, ''), '', () => focusPlace(p, true))));
  bar.appendChild(stageBtn('trips', '✈️ ' + U().travel, U().travelSub, '', showTrips));
  markStage();
}
function markStage(){ document.querySelectorAll('.st').forEach(b => b.classList.toggle('on', b.dataset.id === stage)); }
function showTrips(){
  playing = false; stage = 'trips'; markStage(); hideCard(); showLegs(0);
  aimAt(100, 33, 2.75);
  $('#cwhen').textContent = '✈️'; $('#ctitle').textContent = U().tripsTitle; $('#ctext').textContent = U().tripsText;
  $('#cacts').innerHTML = ''; $('#card').style.display = 'block';
}

/* ---------------- language / sound ---------------- */
function setLang(l){
  lang = l;
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; s.lang = l; localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) {}
  document.documentElement.lang = l === 'zh' ? 'zh-HK' : 'en';
  $('#title').textContent = '🌍 ' + U().title; $('#backtxt').textContent = U().back; $('#lang').textContent = U().lang;
  ALL.forEach(p => { p.el.innerHTML = HOMES.includes(p) ? `<b>${p.icon}</b>` : '⭐ '; p.el.append(p.name[lang].replace(/^英國|, UK$/, '')); });
  buildStages();
  if (current) showCard(current);
}
$('#lang').onclick = () => { quiet(); setLang(lang === 'zh' ? 'en' : 'zh'); };
$('#speak').onclick = () => { narrator.unlock(); if (narrator.isSpeaking()) narrator.stop(); else if (current) narrator.speak(speechOf(current, lang), true); };
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => narrator.unlock(), { once:true, capture:true }));

/* ---------------- drag to turn, wheel / pinch to zoom ---------------- */
let drag = null, pinch = 0;
const cv = renderer.domElement;
cv.addEventListener('pointerdown', e => { drag = { x:e.clientX, y:e.clientY }; view.spin = false; view.tYaw = view.tPitch = null; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => {
  if (!drag) return;
  const k = 2.2 * (view.dist - 1) / innerHeight;
  view.yaw += (e.clientX - drag.x) * k; view.pitch = Math.max(-1.3, Math.min(1.3, view.pitch + (e.clientY - drag.y) * k));
  drag = { x:e.clientX, y:e.clientY };
});
cv.addEventListener('pointerup', () => { drag = null; });
cv.addEventListener('wheel', e => { view.tDist = Math.max(1.35, Math.min(4.5, view.tDist * (1 + e.deltaY * .001))); }, { passive:true });
cv.addEventListener('touchmove', e => {
  if (e.touches.length !== 2) return;
  const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  if (pinch) view.tDist = Math.max(1.35, Math.min(4.5, view.tDist * pinch / d)); pinch = d;
}, { passive:true });
cv.addEventListener('touchend', () => { pinch = 0; });

/* ---------------- loop ---------------- */
const clock = new THREE.Clock(), _w = new THREE.Vector3(), _n = new THREE.Vector3(), _c = new THREE.Vector3();
function tick(){
  const dt = Math.min(clock.getDelta(), .05);
  if (view.spin) view.yaw += dt * .08;
  if (view.tYaw != null) { view.yaw += (view.tYaw - view.yaw) * Math.min(1, dt * 2.6); view.pitch += (view.tPitch - view.pitch) * Math.min(1, dt * 2.6); }
  view.dist += (view.tDist - view.dist) * Math.min(1, dt * (diving ? 1.8 : 2.4));
  globe.rotation.set(view.pitch, view.yaw, 0);
  camera.position.set(0, 0, view.dist); camera.lookAt(0, 0, 0);
  if (legAnim) {
    const e = Math.min(1, (performance.now() - legAnim.t0) / 2600);   /* wall-clock, so slow devices still finish on time */
    const L = legAnim.leg, i = Math.max(1, Math.floor(e * (L.n - 1)));
    L.geo.setDrawRange(0, i + 1); plane.position.copy(L.pts[i]).multiplyScalar(1.01);
    if (e >= 1) { const f = legAnim.then; legAnim = null; plane.visible = false; f && f(); }
  }
  /* labels: follow their pins, hide on the far side and when zoomed out of their cluster */
  ALL.forEach(p => {
    _w.copy(p.tip); p.pin.localToWorld(_w);
    _n.copy(p.v).applyQuaternion(globe.quaternion);
    const facing = _n.dot(_c.copy(camera.position).sub(_w).normalize());
    const trip = !HOMES.includes(p);
    /* travel stars show in the travel view; the homes give way to them there */
    const show = facing > .25 && (trip ? stage === 'trips' || current === p : stage !== 'trips' || current === p) && !diving;
    p.el.classList.toggle('hide', !show);
    if (show) { _w.project(camera); p.el.style.left = ((_w.x + 1) / 2 * innerWidth) + 'px'; p.el.style.top = ((1 - _w.y) / 2 * innerHeight + (p.dy || 0)) + 'px'; }
  });
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); fitFov(); });

/* for tools/make_voice.py: copy(JSON.stringify(__earth.voiceLines())) -> earth_lines.json */
window.__earth = { voiceLines:() => ['en', 'zh'].flatMap(lg => ALL.map(p => { const text = speechOf(p, lg); return { id:'earth:' + p.id, lang:lg, key:textKey(text), text }; })) };

setLang(lang);
/* start facing Europe and Asia, a little tilted, slowly turning */
{ const [y, p] = faceAngles(surf(60, 35)); view.yaw = y; view.pitch = p; }
tick();
