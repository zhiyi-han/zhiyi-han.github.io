import { buildOrbit } from './orbit.js?v=318caff1';
import { buildSurface } from './surface.js?v=318caff1';

export function createVenus(api){
  const { THREE, rand, makeCanvas, canvasTexture, GLOW, LOW, sphere } = api;
  const names = {
    exploreVenus:['🟡 Explore Venus!','🟡 進入金星探險！'],
    acidclouds:['Acid Clouds','酸雲'], backwards:['Spins Backwards','倒著轉'],
    landVenus:['Land on Venus','登陸金星'], venusGround:['Venus','金星'],
    venera:['Venera Lander','金星號著陸器'], vvolcano:['Volcano','火山'], orangesky:['Orange Sky','橙色天空'],
  };
  const facts = {
    acidclouds:["Venus is wrapped in thick clouds made of acid. The clouds race all the way around the planet in just four days!",
      "金星被厚厚的酸雲包住。這些雲只要四天就可以繞金星飛一圈！"],
    backwards:["Venus spins backwards and super slowly — one day on Venus is longer than its whole year!",
      "金星是倒著轉的，而且轉得超級慢——金星上的一天，比它的一年還要長！"],
    venusGround:["We landed on Venus! It's hotter than an oven — 465°C — and the air is so heavy it feels like being 900 metres deep under the sea.",
      "我們登陸金星了！這裡比焗爐還要熱——攝氏 465 度——空氣重得像在海底 900 米深的地方。"],
    venera:["The Venera 13 lander from the Soviet Union landed on Venus in 1982. It took the first colour photos of Venus — and survived 127 minutes in the heat!",
      "蘇聯的金星 13 號著陸器在 1982 年降落金星。它拍下了第一批金星的彩色照片——還在高溫下撐了 127 分鐘！"],
    vvolcano:["Venus has more volcanoes than any other planet — over a thousand big ones!",
      "金星的火山比任何行星都多——大火山就有一千多座！"],
    orangesky:["The sky on Venus is orange, and the Sun is just a fuzzy glow behind the thick clouds.",
      "金星的天空是橙色的，太陽躲在厚厚的雲後面，只是一團朦朧的光。"],
  };

  const tex = (() => {
    const c = makeCanvas(1024, 512), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#f2dfae'); g.addColorStop(.5, '#e3c78f'); g.addColorStop(1, '#efd9a6');
    x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 90; i++) {
      x.globalAlpha = rand(.12, .3); x.strokeStyle = ['#c9a265', '#f7e8c4', '#d6b47a'][i%3]; x.lineWidth = rand(4, 14);
      const y0 = rand(40, 472); x.beginPath();
      for (let px = 0; px <= 1024; px += 16) x.lineTo(px, y0 + Math.sin(px*.012 + i)*rand(6, 20) + (px - 512)*.04*Math.sign(y0 - 256));
      x.stroke();
    }
    x.globalAlpha = 1;
    return canvasTexture(c);
  })();

  let surf;
  const o = buildOrbit(api, {
    key: 'venus', planet: 'venus', icon: '🟡', R: 14, tex, tilt: [.05, 0, .05], spin: -.008, tapDest: 'acidclouds',
    spots: [
      { id: 'acidclouds', em: '☁️', uv: [.55, .45], h: 1.45, camDist: 24 },
      { id: 'backwards', em: '🔄', space: [1.9, .7, 1.6], camDist: 40 },
    ],
    update: (dt) => { cloudShell.rotation.y += dt*.09; },
  });
  /* a faster-moving cloud shell over the planet: the 4-day super-winds */
  const cloudShell = (() => {
    const c = makeCanvas(512, 256), x = c.getContext('2d');
    for (let i = 0; i < 70; i++) {
      x.globalAlpha = rand(.15, .35); x.fillStyle = '#fff6dc';
      x.beginPath(); x.ellipse(rand(0, 512), rand(20, 236), rand(30, 90), rand(4, 10), rand(-.2, .2), 0, 7); x.fill();
    }
    const m = new THREE.Mesh(sphere(14*1.025, LOW ? 40 : 56), new THREE.MeshLambertMaterial({ map: canvasTexture(c), transparent: true, depthWrite: false }));
    o.planet.parent.add(m); return m;
  })();
  o.addDest('landVenus', { name: () => api.nm('landVenus'), em: '🛬',
    target: out => o.tilt.localToWorld(out.set(0, .3, .95).multiplyScalar(14*1.12)), center: out => out.set(0, 0, 0),
    focus: out => o.tilt.localToWorld(out.set(0, .3, .95).multiplyScalar(14*1.12)), camDist: 13,
    onArrive: () => { surf.land(); return true; } });

  /* ---- Venera 13 ---- */
  const venera = (() => {
    const g = new THREE.Group();
    const metal = new THREE.MeshLambertMaterial({ color: 0xc9ccd2 }), dark = new THREE.MeshLambertMaterial({ color: 0x4a4f58 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, .22, 8, 20), dark); ring.rotation.x = Math.PI/2; ring.position.y = .25; g.add(ring);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.1, 1.4, 14), metal); body.position.y = 1.1; g.add(body);
    const brake = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, .1, 20), metal); brake.position.y = 2; g.add(brake);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(.8, 14, 10, 0, Math.PI*2, 0, Math.PI/2), metal); dome.position.y = 2.05; g.add(dome);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.4, 6), dark); ant.position.y = 3.3; g.add(ant);
    for (let i = 0; i < 6; i++) {
      const a = i/6*Math.PI*2, p = new THREE.Mesh(new THREE.BoxGeometry(.5, .06, .9), metal);
      p.position.set(Math.cos(a)*1.9, .3, Math.sin(a)*1.9); p.rotation.y = -a + Math.PI/2; p.rotation.x = -.3; g.add(p);
    }
    g.scale.setScalar(1.4); return g;
  })();
  const volcano = (() => {
    const g = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(26, 14, 10), new THREE.MeshLambertMaterial({ color: 0x6e3a22, flatShading: true }));
    cone.position.y = 6; g.add(cone);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xff7a2a, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(14, 9, 1); glow.position.y = 13.5; g.add(glow);
    return g;
  })();
  surf = buildSurface(api, {
    key: 'venusSurface', icon: '🟡', title: 'venusGround', place: 'venus',
    sky: { colors: ['#b35a1c', '#d9822e', '#efa64a', '#f2b45a', '#7a3a18'], fog: 0xd98a3a, near: 18, far: 120 },
    sun: { pos: [-120, 90, -160], size: 40, color: 0xffe3a0, halo: 0xffc070, haloOpacity: .4 },
    sunI: 1.4, hemi: [0xffc88a, 0x5a2a14], hemiI: 1.5,
    ground: [.06, .45, .3], craters: 6, hAmp: 2,
    groundTint: (col, x, z) => { if (Math.abs(Math.sin(x*.4) + Math.sin(z*.37)) < .12) col.offsetHSL(0, 0, -.08); },
    rocks: { n: 120, color: 0x3e2a1e }, hills: { color: 0x8a4a26 },
    objects: [
      { id: 'venera', em: '🛰️', obj: venera, pos: [8, -4], hitR: 3.5, view: { side: 8, height: 4, cy: 2, camDist: 14, labelY: 6 } },
      { id: 'vvolcano', em: '🌋', obj: volcano, pos: [-38, -52], hitR: 16, view: { side: 30, height: 12, cy: 8, camDist: 44, labelY: 18 } },
    ],
    sunDest: { id: 'orangesky', em: '🟠' },
    takeoff: () => api.switchMode('venus', () => {
      o.tilt.localToWorld(api.ship.position.set(0, .3, .95).multiplyScalar(14*1.4)); api.ship.lookAt(0, 0, 0);
      api.setView({ follow: v => v.set(0, 0, 0), tDist: 70, phi: 1.15 });
    }),
  });

  return { planet: 'venus', exploreLabel: 'exploreVenus', enter: o.enter, names, facts,
    modes: { venus: o.mode, venusSurface: surf.mode } };
}
