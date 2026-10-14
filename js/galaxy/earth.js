import { buildOrbit } from './orbit.js';
import { buildSurface } from './surface.js';

export function createEarth(api){
  const { THREE, rand, makeCanvas, canvasTexture, GLOW, LOW, sphere, rockyTex } = api;
  const names = {
    exploreEarth:['🌍 Explore Earth & the Moon!','🌍 探索地球和月亮！'],
    hk:['Hong Kong — Max\'s home!','香港——Max 的家！'], iss:['Space Station','國際太空站'], moon:['The Moon','月亮'],
    landMoon:['Land on the Moon','登陸月球'], moonGround:['The Moon','月球'],
    apollo:['Apollo 11','阿波羅 11 號'], footprints:['Footprints','腳印'], earthrise:['Earth in the Sky','天上的地球'],
  };
  const facts = {
    hk:["This is Hong Kong — where Max lives! It's a big city by the sea, on the south coast of China.",
      "這裡是香港——Max 住的地方！它是一個在中國南邊海岸的海邊大城市。"],
    iss:["Astronauts live on the International Space Station! It zooms around Earth 16 times every day — so they see 16 sunrises every day!",
      "太空人住在國際太空站上！它每天繞地球飛 16 圈——所以太空人每天可以看 16 次日出！"],
    moon:["The Moon is Earth's best friend. It always shows us the same face, and its gravity pulls the ocean to make the tides go up and down.",
      "月亮是地球最好的朋友。它總是用同一面對著我們，它的引力會拉動海水，讓潮水漲漲退退。"],
    moonGround:["We landed on the Moon! There's no air, so the sky is black. You'd be six times lighter here — you could jump super high!",
      "我們登陸月球了！這裡沒有空氣，所以天空是黑色的。在這裡你會輕六倍——可以跳得超級高！"],
    apollo:["In 1969, Apollo 11 landed on the Moon! Neil Armstrong and Buzz Aldrin were the very first people to walk on it.",
      "1969 年，阿波羅 11 號登陸月球！岩士唐和艾德林是第一批在月球上走路的人。"],
    footprints:["There's no wind or rain on the Moon, so the astronauts' footprints can stay here for millions of years!",
      "月球上沒有風也沒有雨，所以太空人的腳印可以留在這裡幾百萬年！"],
    earthrise:["Look — that's our Earth, hanging in the black sky! From the Moon, Earth looks about four times bigger than the Moon looks from Earth.",
      "看——那是我們的地球，掛在黑色的天空上！從月球看，地球大約比我們看到的月亮大四倍。"],
  };

  /* ---- cartoon world map with (roughly) real continents ---- */
  const W = 1024, H = 512, ll = (lon, lat) => [(lon + 180)/360*W, (90 - lat)/180*H];
  const earthTex = (() => {
    const c = makeCanvas(W, H), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2d74cf'); g.addColorStop(.5, '#2a6fc9'); g.addColorStop(1, '#2d74cf');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const land = (pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach((p, i) => { const [px, py] = ll(p[0], p[1]); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); x.fill(); };
    const green = '#4fa64a';
    land([[-165,65],[-140,70],[-95,72],[-75,62],[-60,50],[-80,25],[-97,18],[-105,22],[-118,32],[-125,48],[-140,58]], green);
    land([[-80,10],[-60,8],[-35,-7],[-40,-22],[-58,-38],[-70,-55],[-75,-40],[-80,-5]], '#58ad4c');
    land([[-10,36],[-10,58],[10,62],[30,70],[60,72],[100,77],[140,72],[170,66],[160,58],[140,50],[130,40],[122,30],[120,22],[108,12],[104,2],[98,15],[90,22],[80,8],[72,20],[58,25],[50,30],[35,32],[28,40],[10,44],[0,40]], green);
    land([[-17,15],[-10,30],[10,37],[32,31],[43,12],[51,12],[40,-15],[32,-30],[20,-35],[12,-18],[9,4],[-8,5]], '#9cb24a');
    land([[114,-22],[130,-12],[142,-11],[153,-27],[146,-39],[132,-32],[115,-34]], '#c8a96a');
    land([[-55,60],[-20,70],[-30,83],[-60,80]], '#eef4f8');
    land([[130,31],[141,36],[142,44],[136,37]], green);
    land([[95,5],[120,0],[140,-5],[130,-9],[105,-7]], green);
    x.fillStyle = '#c8a96a';                                            /* deserts */
    [[20,24,26,10],[45,23,12,6],[-110,36,6,4],[135,-25,12,6]].forEach(([lo,la,rx,ry]) => { const [px,py] = ll(lo,la); x.beginPath(); x.ellipse(px,py,rx*W/360,ry*H/180,0,0,7); x.fill(); });
    x.fillStyle = '#f4f8fb'; x.fillRect(0, 0, W, 16); x.fillRect(0, H - 34, W, 34);
    return canvasTexture(c);
  })();
  const HK = [(114.2 + 180)/360, (90 - 22.3)/180];

  let surf;
  const moonTex = rockyTex('#b9b9b9', ['#8d8d8d', '#d8d8d8', '#7a7a7a'], 90);
  const iss = (() => {
    const g = new THREE.Group();
    const grey = new THREE.MeshLambertMaterial({ color: 0xd8dbe0 }), panel = new THREE.MeshLambertMaterial({ color: 0x2a3c78, emissive: 0x0a1430 });
    const truss = new THREE.Mesh(new THREE.BoxGeometry(3.2, .12, .12), grey); g.add(truss);
    [-1.3, -.8, .8, 1.3].forEach(x0 => [-1, 1].forEach(s => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(.38, .02, .95), panel); p.position.set(x0, 0, s*.62); g.add(p);
    }));
    const mod = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 1.2, 10), grey); mod.rotation.x = Math.PI/2; g.add(mod);
    const mod2 = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .7, 10), grey); mod2.position.z = -.75; mod2.rotation.x = Math.PI/2; g.add(mod2);
    return g;
  })();
  const o = buildOrbit(api, {
    key: 'earth', planet: 'earth', icon: '🌍', R: 14, tex: earthTex, tilt: [.12, 0, .41], spin: .025, tapDest: 'hk',
    spots: [ { id: 'hk', em: '🏠', uv: HK, h: 1.4, camDist: 22, label: true } ],
    moons: [
      { id: 'iss', em: '🛰️', mesh: iss, r: 1.2, d: 14*1.3, sp: 1.2, a0: 1, lift: 4, camDist: 9 },
      { id: 'moon', em: '🌕', tex: moonTex, r: 3.8, d: 62, sp: .05, a0: 2.4, camDist: 20 },
    ],
    update: (dt) => { clouds.rotation.y += dt*.035; pinGlow.material.opacity = .6 + .4*Math.sin(performance.now()*.005); },
    maxDist: 220,
  });
  /* clouds + a glowing pin on Hong Kong */
  const clouds = (() => {
    const c = makeCanvas(512, 256), x = c.getContext('2d');
    for (let i = 0; i < 80; i++) { x.globalAlpha = rand(.25, .55); x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(rand(0, 512), rand(20, 236), rand(14, 40), rand(3, 7), 0, 0, 7); x.fill(); }
    const m = new THREE.Mesh(sphere(14*1.02, LOW ? 40 : 56), new THREE.MeshLambertMaterial({ map: canvasTexture(c), transparent: true, depthWrite: false }));
    o.tilt.add(m); return m;
  })();
  const hkDir = o.dirOf(HK);
  const pin = new THREE.Group();
  pin.position.copy(hkDir).multiplyScalar(14); pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), hkDir);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.2, 8), new THREE.MeshLambertMaterial({ color: 0xffffff })); stick.position.y = 1.1; pin.add(stick);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.5, 12, 10), new THREE.MeshLambertMaterial({ color: 0xe8455a, emissive: 0x6a1020 })); head.position.y = 2.3; pin.add(head);
  const pinGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffd166, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  pinGlow.scale.set(3.5, 3.5, 1); pinGlow.position.y = 2.3; pin.add(pinGlow);
  o.planet.add(pin);
  const moonM = o.moons.moon;
  o.addDest('landMoon', { name: () => api.nm('landMoon'), em: '🛬',
    target: out => moonM.mesh.getWorldPosition(out).addScaledVector(o.LD, 3.8*1.25).setY(out.y + 1),
    center: out => moonM.mesh.getWorldPosition(out),
    focus: out => moonM.mesh.getWorldPosition(out), camDist: 14,
    onArrive: () => { surf.land(); return true; } });

  /* ---- on the Moon ---- */
  const lander = (() => {
    const g = new THREE.Group();
    const gold = new THREE.MeshLambertMaterial({ color: 0xd9a441 }), grey = new THREE.MeshLambertMaterial({ color: 0xb8bcc4 }), dark = new THREE.MeshLambertMaterial({ color: 0x3a3e46 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.2, 8), gold); base.position.y = 1.5; g.add(base);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.3, 1.6), grey); top.position.y = 2.75; top.rotation.y = .4; g.add(top);
    const win = new THREE.Mesh(new THREE.BoxGeometry(.4, .4, .05), dark); win.position.set(.3, 2.9, .82); win.rotation.y = .4; g.add(win);
    for (let i = 0; i < 4; i++) {
      const a = i*Math.PI/2 + Math.PI/4;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.9, 6), grey);
      leg.position.set(Math.cos(a)*1.6, .85, Math.sin(a)*1.6); leg.rotation.set(Math.sin(a)*.5, 0, -Math.cos(a)*.5); g.add(leg);
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .08, 10), grey); pad.position.set(Math.cos(a)*2.05, .05, Math.sin(a)*2.05); g.add(pad);
    }
    /* the flag */
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 3.2, 6), grey); pole.position.set(3.6, 1.6, .6); g.add(pole);
    const fc = makeCanvas(96, 64), fx = fc.getContext('2d');
    for (let i = 0; i < 7; i++) { fx.fillStyle = i%2 ? '#ffffff' : '#c8283c'; fx.fillRect(0, i*64/7, 96, 64/7 + 1); }
    fx.fillStyle = '#2a3c78'; fx.fillRect(0, 0, 40, 32);
    fx.fillStyle = '#ffffff'; for (let i = 0; i < 12; i++) { fx.beginPath(); fx.arc(5 + (i%4)*10, 5 + Math.floor(i/4)*10, 1.6, 0, 7); fx.fill(); }
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1), new THREE.MeshLambertMaterial({ map: canvasTexture(fc), side: THREE.DoubleSide }));
    flag.position.set(4.35, 2.7, .6); g.add(flag);
    g.scale.setScalar(1.2); return g;
  })();
  const steps = (() => {
    const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: 0x55585e });
    for (let i = 0; i < 18; i++) {
      const f = new THREE.Mesh(new THREE.CircleGeometry(.22, 8), m);
      f.rotation.x = -Math.PI/2; f.scale.set(1, 1.7, 1);
      f.position.set(Math.sin(i*.35)*2.2 + (i%2 ? .35 : -.35), .06, -i*.85);
      g.add(f);
    }
    return g;
  })();
  surf = buildSurface(api, {
    key: 'moonSurface', icon: '🌕', title: 'moonGround', place: 'moon',
    sky: {}, sun: { pos: [170, 90, -120], size: 34 }, sunI: 3, hemi: [0xdedede, 0x2a2a2a], hemiI: .8,
    ground: [0, 0, .58], craters: 40, bigCraters: [[-22, 18, 9]], hAmp: 1.6,
    rocks: { n: 150, color: 0x7a7a7a }, hills: { color: 0x9a9a9a, hmin: 6, hmax: 16 },
    objects: [
      { id: 'apollo', em: '🚀', obj: lander, pos: [6, -6], hitR: 4, view: { side: 9, height: 4, cy: 2.5, camDist: 15, labelY: 6.5 } },
      { id: 'footprints', em: '👣', obj: steps, pos: [10, 2], hitR: 5, view: { side: 7, height: 6, cy: 0, camDist: 13, phi: .8, labelY: 2.5 } },
    ],
    skyBody: { id: 'earthrise', em: '🌍', pos: [-120, 70, -170], r: 18, tex: earthTex, tilt: .41 },
    takeoff: () => api.switchMode('earth', () => {
      moonM.mesh.getWorldPosition(api.ship.position).addScaledVector(o.LD, 10);
      api.ship.lookAt(0, 0, 0);
      api.setView({ tDist: 30, phi: 1.15 }); api.parkAt('moon');
    }),
  });

  return { planet: 'earth', exploreLabel: 'exploreEarth', enter: o.enter, names, facts,
    modes: { earth: o.mode, moonSurface: surf.mode } };
}
