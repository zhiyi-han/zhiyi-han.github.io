/* ============================================================
   Max 的足跡 · Max's Footprints

   A cartoon globe with the places Max has lived (Oxford before he was
   born, Bristol for his first year, Hong Kong since) and the places he
   has travelled to. "Play" flies along his journey; from Hong Kong you
   can dive straight down into Max's World (index.html?from=earth).
   Only cities are shown, and ages instead of dates.
   ============================================================ */
import * as THREE from 'three';
import { rand, makeCanvas, canvasTexture } from './helpers.js?v=0c90647d';
import { seen } from './progress.js?v=0c90647d';
import { createNarrator, textKey } from './narrator.js?v=0c90647d';

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
  { id:'taiwan', lon:120.6, lat:23.6, dy:30, name:{ en:'Taiwan', zh:'台灣' },
    text:{ en:'In Taiwan, Max visited Taichung, Tainan and the little island of Xiaoliuqiu — and explored lots of bookshops with the family.',
           zh:'在台灣，滿滿去了台中、台南和小琉球，還和家人逛了很多書店，一起挑選喜歡的書。' } },
  { id:'shenzhen', lon:114.06, lat:22.54, dy:-22, name:{ en:'Shenzhen', zh:'深圳' },
    text:{ en:'In Shenzhen Max finished the Spartan Kids race — he jumped into the mud, got up after falling, and won his medal!', zh:'在深圳，滿滿完成了 Spartan Kids 小勇士賽——跳進泥坑，跌倒了再爬起來，拿到了完賽獎牌！' } },
  { id:'uk', lon:-0.13, lat:51.51, dy:-22, name:{ en:'Around the UK', zh:'英國各地' },
    text:{ en:'Besides Oxford and Bristol, where he lived, Max has been to Cambridge, Birmingham and London — exploring bookshops, libraries and big cities.',
           zh:'除了住過的牛津和布里斯托，滿滿還去過劍橋、伯明翰和倫敦——逛書店和圖書館，看看不同的城市。' } },
  { id:'tengchong', lon:98.49, lat:25.02, dy:-20, name:{ en:'Tengchong, Yunnan', zh:'雲南騰沖' },
    text:{ en:"In Tengchong the family explored lots of places. The best was the Gaoligong Mountains — a long, steep climb through ancient forest that's a real challenge for a little kid, and Max climbed almost all of it by himself. Amazing!",
           zh:'在雲南騰沖，滿滿一家逛了很多地方。最值得說的是高黎貢山——山路又長又陡，穿過高山上的原始森林，對小朋友來說很有挑戰，可是滿滿差不多全程都是自己爬上去的，真棒！' } },
  { id:'dali', lon:100.23, lat:25.6, dy:-40, name:{ en:'Dali', zh:'大理' },
    text:{ en:'Before he turned four, Max joined a five-day outdoor camp on Cangshan Mountain in Dali — running, climbing and exploring!', zh:'不到四歲，滿滿就在大理蒼山參加了五天戶外營，在山林裏奔跑、攀爬、探索。' } },
  { id:'banna', lon:100.8, lat:22.0, dy:6, name:{ en:'Xishuangbanna', zh:'西雙版納' },
    text:{ en:'In Xishuangbanna, Max put on his rain boots and walked into the tropical rainforest to look for plants and animals.', zh:'在西雙版納，滿滿穿上雨靴，走進熱帶雨林探索動植物。' } },
  { id:'nanchang', lon:115.89, lat:28.68, dy:-8, name:{ en:'Nanchang, Jiangxi', zh:'江西南昌' },
    text:{ en:'Max has also travelled to Nanchang in Jiangxi.', zh:'滿滿也去過江西南昌旅行。' } },
  { id:'macau', lon:113.54, lat:22.19, dy:2, name:{ en:'Macau', zh:'澳門' },
    text:{ en:'Max has been to Macau, just across the water from Hong Kong.', zh:'滿滿去過澳門——就在香港的對岸，坐船很快就到。' } },
  { id:'hainan', lon:109.8, lat:19.2, dy:34, name:{ en:'Hainan', zh:'海南' },
    text:{ en:'Max has been to Hainan, a big tropical island in the south of China, with sunshine and the sea.', zh:'滿滿去過海南——中國南邊的大海島，有陽光，有大海。' } },
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
scene.add(new THREE.AmbientLight(0xffffff, .55));
scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x1a2a55, .35));
const key = new THREE.DirectionalLight(0xfff6e8, 2.1); key.position.set(-2.2, 1.6, 3); scene.add(key);   /* sun from the front left: soft day/dusk shading */

/* stars: faint dust, a Milky Way band, and a few bright tinted ones */
{
  const v = new THREE.Vector3();
  const layer = (n, size, opacity, place, tint) => {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      place(v); pos.set([v.x, v.y, v.z], i * 3);
      const c = tint ? tint() : [1, 1, 1]; col.set(c, i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size, sizeAttenuation:false, vertexColors:true, transparent:true, opacity, depthWrite:false })));
  };
  const any = v => v.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(40, 70));
  const ax = new THREE.Vector3(.3, 1, .2).normalize(), u = new THREE.Vector3(1, -.3, 0).normalize(), w = ax.clone().cross(u);
  const band = v => { const a = rand(0, Math.PI * 2), off = (rand(-1, 1) + rand(-1, 1) + rand(-1, 1)) * .07;
    v.copy(u).multiplyScalar(Math.cos(a)).addScaledVector(w, Math.sin(a)).addScaledVector(ax, off).normalize().multiplyScalar(rand(50, 70)); };
  layer(1600, 1.3, .75, any);
  layer(2600, 1.1, .45, band, () => { const k = rand(.6, 1); return [k * .85, k * .85, k]; });
  layer(220, 2.8, .95, any, () => [[1, .92, .8], [.8, .88, 1], [1, 1, 1]][Math.floor(rand(0, 3))]);
}

/* cartoon world map (lon/lat outlines, simplified) */
const LAND = [
  ['#6fbf5a', [[-168,66],[-162,70],[-140,70],[-120,72],[-95,72],[-82,68],[-75,62],[-64,60],[-56,52],[-66,45],[-70,42],[-76,35],[-81,31],[-80,25],[-83,29],[-90,30],[-97,26],[-97,20],[-92,18],[-87,21],[-84,15],[-79,9],[-83,8],[-92,14],[-105,20],[-110,24],[-117,32],[-124,40],[-124,48],[-130,55],[-140,60],[-152,58],[-165,60]]],
  ['#eef4f8', [[-55,60],[-42,60],[-20,70],[-20,80],[-40,83],[-65,80],[-58,75]]],
  ['#5daf4f', [[-80,10],[-72,12],[-62,10],[-50,0],[-35,-6],[-38,-15],[-41,-23],[-48,-26],[-58,-35],[-65,-42],[-68,-52],[-72,-50],[-74,-40],[-71,-30],[-71,-18],[-76,-14],[-81,-5],[-80,0]]],
  ['#7cc45e', [[-9,37],[-9,43],[-1,46],[-4,48],[2,51],[8,54],[12,54],[20,55],[28,60],[30,70],[45,68],[60,70],[70,73],[80,73],[100,77],[115,74],[130,71],[140,72],[160,70],[170,67],[180,66],[178,62],[165,60],[160,52],[155,50],[150,59],[142,59],[138,54],[141,48],[135,43],[130,42],[129,35.5],[126.5,34.5],[126,37],[125,39],[122,40],[121,39],[118,38],[120,35],[122,31],[121,28],[119,25],[116,23],[113,22],[110,21],[108,21],[106,18],[109,12],[107,10],[105,9],[103,10],[101,13],[100,8],[103,1.5],[101,3],[98,8],[98,16],[94,17],[92,22],[88,22],[85,20],[80,15],[80,10],[77,8],[73,16],[72,21],[67,25],[62,25],[57,26],[56,24],[59,22],[55,17],[52,16],[45,13],[43,16],[39,22],[35,28],[34,31],[35,36],[30,36],[27,37],[26,40],[23,40],[23,37],[21,38],[20,40],[19,42],[13,45],[16,41],[18,40],[16,38],[12,38],[12,42],[10,44],[7,43],[3,43],[0,39],[-2,37],[-6,36]]],
  ['#7cc45e', [[5,58],[8,58],[11,59],[12,56],[13,55],[18,60],[22,65],[25,65.5],[28,70],[24,71],[15,69],[8,63],[5,61]]],
  ['#7cc45e', [[-5.7,50],[1.5,51],[1.7,52.8],[0,53.5],[-1.5,55],[-2,56],[-1.8,57.5],[-3.5,58.6],[-5,58.6],[-6,57],[-5.5,55.5],[-4.8,54.8],[-3.3,54.4],[-3.2,53.4],[-4.6,53.3],[-4.3,52.3],[-5.2,51.7],[-3.3,51.4]]],
  ['#7cc45e', [[-6,52],[-6.2,54],[-7.5,55.3],[-10,54],[-10.2,52],[-8,51.5]]],
  ['#a8b84e', [[-17,21],[-16,28],[-10,30],[-6,35.8],[10,37],[11,33],[20,31],[25,32],[32,31],[34,28],[37,22],[43,12],[51,12],[48,5],[40,-3],[39,-10],[40,-16],[35,-22],[33,-27],[28,-33],[20,-35],[17,-30],[12,-17],[13,-8],[9,-1],[9,4],[5,6],[-4,5],[-8,4],[-13,8],[-17,14]]],
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
/* extra tints painted over the land: deserts, mountains */
const TINTS = [
  ['rgba(222,196,128,.95)', [[-16,20],[-15,27],[-8,30],[0,31],[10,31],[20,29],[30,29],[33,24],[30,18],[20,16],[10,17],[0,18],[-10,17]]],    /* Sahara */
  ['rgba(222,196,128,.95)', [[36,28],[39,22],[44,16],[52,17],[55,19],[57,23],[50,26],[47,29],[43,30],[38,30]]],                              /* Arabia */
  ['rgba(214,184,118,.9)',  [[119,-20],[130,-18],[138,-20],[140,-27],[134,-30],[124,-30],[118,-26]]],                                          /* Australian outback */
  ['rgba(222,200,140,.9)',  [[77,37],[84,36.5],[90,38],[88,41],[80,41],[76,39.5]]],                                                           /* Taklamakan, by Kashgar */
  ['rgba(214,196,140,.85)', [[96,40],[106,38],[114,41],[112,45],[102,46],[95,44]]],                                                            /* Gobi */
  ['rgba(150,120,96,.8)',   [[73,35],[80,33],[88,29],[95,28],[100,31],[98,35],[90,36],[80,36.5],[74,37]]],                                     /* Himalaya / Tibet */
  ['rgba(150,120,96,.7)',   [[-75,-5],[-72,-15],[-69,-22],[-70,-35],[-72,-45],[-74,-45],[-73,-30],[-75,-15],[-78,-5]]],                       /* Andes */
  ['rgba(150,120,96,.6)',   [[-124,58],[-115,52],[-108,42],[-106,35],[-110,33],[-114,40],[-120,50],[-128,58]]],                                 /* Rockies */
];
/* a smooth closed path through lon/lat points (curves through the midpoints) */
function smoothPath(x, pts, P){
  const q = pts.map(P), n = q.length;
  x.beginPath();
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(q[n - 1], q[0]); x.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const m = mid(q[i], q[(i + 1) % n]); x.quadraticCurveTo(q[i][0], q[i][1], m[0], m[1]); }
  x.closePath();
}
/* real coastlines: Natural Earth 1:110m land (public domain), TopoJSON from world-atlas@2 */
async function loadCoasts(){
  try{
    const t = await (await fetch('assets/geo/land-110m.json?v=0c90647d')).json();
    const [sx, sy] = t.transform.scale, [tx, ty] = t.transform.translate;
    const arcs = t.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
    const arc = i => i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
    const ring = ids => ids.flatMap((i, k) => k ? arc(i).slice(1) : arc(i));
    const geoms = t.objects.land.type === 'GeometryCollection' ? t.objects.land.geometries : [t.objects.land];
    /* polygons as [outer ring, ...holes] (holes are inland seas such as the Caspian) */
    const unwrap = r => {
      const out = []; let off = 0, prev = null;
      for (const [lon, lat] of r) {
        if (prev !== null) { const d = lon + off - prev; if (d > 180) off -= 360; else if (d < -180) off += 360; }
        prev = lon + off; out.push([prev, lat]);
      }
      return out;
    };
    const polys = [];
    const shiftBy = (r, d) => d ? r.map(([lon, lat]) => [lon + d, lat]) : r;
    const span = r => { let a = Infinity, b = -Infinity; r.forEach(([lon]) => { if (lon < a) a = lon; if (lon > b) b = lon; }); return [a, b]; };
    geoms.forEach(g => (g.type === 'Polygon' ? [g.arcs] : g.arcs).forEach(poly => {
      let [outer, ...holes] = poly.map(r => unwrap(ring(r)));
      /* bring the outline back to around -180..180, then move each hole onto the same lap of the globe */
      let [a, b] = span(outer); const k = Math.round(((a + b) / 2) / 360) * 360; outer = shiftBy(outer, -k); a -= k; b -= k;
      holes = holes.map(h => { const [ha, hb] = span(h), c = (ha + hb) / 2; return shiftBy(h, Math.round(((a + b) / 2 - c) / 360) * 360); });
      polys.push([outer, ...holes]);
    }));
    return polys;
  }catch(e){ return null; }
}
const COASTS = await loadCoasts();
/* trace all land onto a canvas: real coastlines if loaded (drawn at -360/0/+360 so date-line rings wrap), else the hand-drawn shapes */
function landPath(x, P){
  if (!COASTS) { LAND.forEach(([, pts]) => { const q = pts.map(P), n = q.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], m0 = mid(q[n - 1], q[0]);
    x.moveTo(m0[0], m0[1]); for (let i = 0; i < n; i++) { const m = mid(q[i], q[(i + 1) % n]); x.quadraticCurveTo(q[i][0], q[i][1], m[0], m[1]); } x.closePath(); }); return; }
  [-360, 0, 360].forEach(sh => COASTS.forEach(poly => poly.forEach(r => { r.forEach(([lon, lat], k) => { const [px, py] = P([lon + sh, lat]); k ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); })));
}
function fillLand(x, P){   /* one shape at a time: overlapping rings never cancel out */
  if (!COASTS) { LAND.forEach(([, pts]) => { smoothPath(x, pts, P); x.fill(); }); }
  else [-360, 0, 360].forEach(sh => COASTS.forEach(poly => {
    x.beginPath();
    poly.forEach(r => { r.forEach(([lon, lat], k) => { const [px, py] = P([lon + sh, lat]); k ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); });
    x.fill('evenodd');   /* outer ring filled, inland seas left open */
  }));
  const [, top] = P([0, -79]), [, bot] = P([0, -90]); x.fillRect(0, top, 99999, bot - top);   /* Antarctica down to the pole */
}
function strokeLand(x, P){
  if (!COASTS) { LAND.forEach(([, pts]) => { smoothPath(x, pts, P); x.stroke(); }); return; }
  x.beginPath(); landPath(x, P); x.stroke();
}
/* colour map, specular (shiny sea) and bump (raised land) */
function mapTextures(){
  const W = 2048, H = 1024, P = ([lon, lat]) => [(lon + 180) / 360 * W, (90 - lat) / 180 * H];
  const c = makeCanvas(W, H), x = c.getContext('2d');
  /* ocean: deep blue, a little lighter toward the poles, with soft swirls */
  const og = x.createLinearGradient(0, 0, 0, H);
  og.addColorStop(0, '#4f86c6'); og.addColorStop(.25, '#1f5fae'); og.addColorStop(.5, '#174f9e'); og.addColorStop(.75, '#1f5fae'); og.addColorStop(1, '#4f86c6');
  x.fillStyle = og; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    const cx = rand(0, W), cy = rand(H * .16, H * .84), r = rand(20, 90), g = x.createRadialGradient(cx, cy, 0, cx, cy, r);   /* none near the poles, where the map gets stretched */
    g.addColorStop(0, `rgba(${Math.random() < .5 ? '40,110,190' : '18,70,150'},.35)`); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  /* shallow water: a pale turquoise shelf along every coast */
  x.save(); x.shadowColor = 'rgba(120,225,235,.9)'; x.shadowBlur = 22; x.fillStyle = 'rgba(120,225,235,.85)';
  fillLand(x, P); x.restore();
  /* land: coloured by latitude (ice, tundra, forest, grassland, jungle), then cut to the
     coastlines with a mask filled one shape at a time (so overlapping shapes never cancel out) */
  const lc = makeCanvas(W, H), lx = lc.getContext('2d');
  const lg = lx.createLinearGradient(0, 0, 0, H), at = lat => (90 - lat) / 180;
  [[90,'#f4f8fb'],[72,'#e6efe9'],[64,'#9cc59a'],[52,'#5f9f55'],[38,'#7fb45b'],[25,'#9cbd62'],[12,'#4e9a46'],[0,'#3f8f40'],[-12,'#4e9a46'],[-25,'#9cbd62'],[-40,'#79b058'],[-58,'#9cc59a'],[-66,'#f4f8fb'],[-90,'#f4f8fb']]
    .forEach(([lat, col]) => lg.addColorStop(at(lat), col));
  lx.fillStyle = lg; lx.fillRect(0, 0, W, H);
  lx.filter = 'blur(6px)';
  TINTS.forEach(([col, pts]) => { smoothPath(lx, pts, P); lx.fillStyle = col; lx.fill(); });
  lx.filter = 'none';
  for (let i = 0; i < 9000; i++) { lx.fillStyle = Math.random() < .5 ? 'rgba(0,40,0,.07)' : 'rgba(255,255,220,.06)'; lx.fillRect(rand(0, W), rand(0, H), rand(1, 4), rand(1, 4)); }
  const mc = makeCanvas(W, H), mx = mc.getContext('2d'); mx.fillStyle = '#000';
  fillLand(mx, P);
  lx.globalCompositeOperation = 'destination-in'; lx.drawImage(mc, 0, 0);
  x.drawImage(lc, 0, 0);
  /* white coastline */
  x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = 1.8; x.lineJoin = 'round';
  strokeLand(x, P);
  /* masks: sea shines, land is raised a little */
  const sm = makeCanvas(W / 2, H / 2), sx = sm.getContext('2d');
  sx.fillStyle = '#fff'; sx.fillRect(0, 0, W / 2, H / 2); sx.fillStyle = '#000';
  const P2 = p => P(p).map(v => v / 2);
  fillLand(sx, P2);
  const bm = makeCanvas(W / 2, H / 2), bx = bm.getContext('2d');
  bx.fillStyle = '#000'; bx.fillRect(0, 0, W / 2, H / 2); bx.filter = 'blur(3px)'; bx.fillStyle = '#9a9a9a';
  fillLand(bx, P2);
  bx.fillStyle = '#ffffff'; TINTS.slice(5).forEach(([, pts]) => { smoothPath(bx, pts, P2); bx.fill(); });
  const tex = canvasTexture(c), spec = new THREE.CanvasTexture(sm), bump = new THREE.CanvasTexture(bm);
  return { tex, spec, bump };
}
/* clouds: soft streaks, more along the equator and the storm belts */
function cloudTexture(){
  const W = 1024, H = 512, c = makeCanvas(W, H), x = c.getContext('2d');
  for (let i = 0; i < 420; i++) {
    const band = [.5, .3, .7, .2, .8][i % 5], cy = (band + rand(-.08, .08)) * H, cx = rand(0, W), rx = rand(14, 60), ry = rx * rand(.25, .55);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.save(); x.translate(cx, cy); x.scale(rx, ry); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore();
  }
  return canvasTexture(c);
}
const globe = new THREE.Group(); scene.add(globe);
globe.rotation.order = 'XYZ';
{
  const { tex, spec, bump } = mapTextures();
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), new THREE.MeshPhongMaterial({
    map:tex, specularMap:spec, specular:new THREE.Color(0x6688aa), shininess:28, bumpMap:bump, bumpScale:.012 })));
}
const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.014, 96, 64),
  new THREE.MeshLambertMaterial({ map:cloudTexture(), transparent:true, opacity:.6, depthWrite:false }));
globe.add(clouds);
{ /* atmosphere: a blue rim that glows brighter toward the edge */
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.09, 64, 48), new THREE.ShaderMaterial({
    side:THREE.BackSide, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    vertexShader:'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader:'varying vec3 vN; void main(){ float i = pow(clamp(0.68 - dot(vN, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.4); gl_FragColor = vec4(0.36, 0.66, 1.0, 1.0) * i; }' }));
  scene.add(atmo);
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
  const ring = new THREE.Mesh(new THREE.RingGeometry(home ? .016 : .011, home ? .022 : .015, 32),
    new THREE.MeshBasicMaterial({ color:home ? 0xff7a3d : 0xffcf5c, transparent:true, opacity:.9, side:THREE.DoubleSide, depthWrite:false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .002; g.add(ring); p.ring = ring;
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
  seen('footprints', p.id, ALL.length);   /* for the Explorer Passport */
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
  aimAt(100, 16, 2.75);   /* the busy South China corner sits above the card */
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
  clouds.rotation.y += dt * .006;
  clouds.material.opacity = Math.max(0, Math.min(.6, (view.dist - 1.45) * .45));   /* clear the clouds when zoomed in on a place */
  const now = performance.now() / 1000;
  ALL.forEach((p, i) => { const k = (now * .6 + i * .37) % 1; p.ring.scale.setScalar(1 + k * 2.4); p.ring.material.opacity = .9 * (1 - k); });
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
