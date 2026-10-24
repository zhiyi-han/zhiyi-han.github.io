import { buildOrbit } from './orbit.js?v=318caff1';
import { buildSurface } from './surface.js?v=318caff1';

export function createPluto(api){
  const { THREE, rand, makeCanvas, canvasTexture, rockyTex } = api;
  const names = {
    explorePluto:['🤎 Explore Pluto!','🤎 進入冥王星探險！'],
    heart:["Pluto's Heart",'冥王星的心'], charon:['Charon','卡戎'], newhorizons:['New Horizons','新視野號'],
    landPluto:['Land on the Heart','登陸心形平原'], plutoGround:['Pluto','冥王星'],
    icemountains:['Ice Mountains','冰山'], charonSky:['Charon in the Sky','天上的卡戎'], bluehaze:['Blue Sky Haze','藍色天空'],
  };
  const facts = {
    heart:["The heart on Pluto is a giant plain of frozen nitrogen ice. It's called Tombaugh Regio, after Clyde Tombaugh, who discovered Pluto.",
      "冥王星上的心形是一大片冰凍的氮冰平原。它叫「湯博區」，是用發現冥王星的湯博先生來命名的。"],
    charon:["Charon is Pluto's biggest moon — half as wide as Pluto! They always face each other as they spin, like two friends holding hands.",
      "卡戎是冥王星最大的衛星——有冥王星一半那麼闊！它們轉的時候總是面對著面，就像兩個手拉手的好朋友。"],
    newhorizons:["The New Horizons spacecraft flew past Pluto in 2015. It travelled for nine and a half years to get here!",
      "新視野號太空船在 2015 年飛過冥王星。它飛了九年半才到達這裡！"],
    plutoGround:["We landed on Pluto's heart! The ground is frozen nitrogen that slowly bubbles up into these big cells. The Sun is just a tiny bright star from here.",
      "我們登陸冥王星的心形平原了！地上的氮冰會慢慢翻上來，變成一格一格的形狀。從這裡看，太陽只是一顆小小的亮星。"],
    icemountains:["These mountains are made of water ice — in Pluto's cold, ice is as hard as rock! Some are more than 3 km tall.",
      "這些山是用水冰做的——在冥王星這麼冷的地方，冰硬得像石頭一樣！有些山超過 3 公里高。"],
    charonSky:["Charon never moves in Pluto's sky — it stays in exactly the same spot all the time!",
      "卡戎在冥王星的天空上從來不會移動——它一直停在同一個位置！"],
    bluehaze:["Pluto has a thin blue haze high up in its sky — a little bit like Earth's blue sky!",
      "冥王星的高空有一層薄薄的藍色霧氣——有一點像地球的藍天！"],
  };

  const R = 10;
  const ptex = (() => {
    const c = makeCanvas(1024, 512), x = c.getContext('2d');
    x.fillStyle = '#c9a483'; x.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 140; i++) { x.globalAlpha = rand(.15, .4); x.fillStyle = ['#a37b5a', '#e0c4a6', '#7a4a32'][i%3]; x.beginPath(); x.arc(rand(0, 1024), rand(0, 512), rand(6, 30), 0, 7); x.fill(); }
    x.globalAlpha = .7; x.fillStyle = '#5a3424'; x.fillRect(0, 280, 1024, 40);
    x.globalAlpha = 1; x.fillStyle = '#f4ebdf';
    const cx = 600, cy = 270, s = 85;
    x.beginPath(); x.moveTo(cx, cy + s);
    x.bezierCurveTo(cx - s*1.3, cy - s*.1, cx - s*.6, cy - s*1.1, cx, cy - s*.35);
    x.bezierCurveTo(cx + s*.6, cy - s*1.1, cx + s*1.3, cy - s*.1, cx, cy + s);
    x.fill();
    return canvasTexture(c);
  })();
  const charonTex = rockyTex('#9a948e', ['#7a746e', '#b8b2ac'], 60, x => {
    x.globalAlpha = .7; x.fillStyle = '#7a3a2a'; x.fillRect(0, 0, 512, 34); x.globalAlpha = 1;
  });
  const HEART = [600/1024, 250/512];
  let surf;
  const o = buildOrbit(api, {
    key: 'pluto', planet: 'pluto', icon: '🤎', R, tex: ptex, tilt: [.1, 0, .25], spin: 0, tapDest: 'heart',
    spots: [ { id: 'heart', em: '💗', uv: HEART, h: 1.55, camDist: 18, label: true } ],
    moons: [ { id: 'charon', em: '🌑', tex: charonTex, r: 5, d: 30, sp: .12, a0: .5, camDist: 24 } ],
    update: (dt, t) => {
      /* Pluto and Charon are tidally locked: the heart always faces away from Charon */
      o.planet.rotation.y = heartPhase - o.moons.charon.a - Math.PI;
      o.moons.charon.mesh.rotation.y = -o.moons.charon.a + Math.PI/2;
      nh.position.set(Math.sin(t*.023)*60, 8, 26); nh.rotation.y += dt*.15;
    },
    maxDist: 160, viewMul: 7,
  });
  const hd = o.dirOf(HEART), heartPhase = Math.atan2(hd.z, hd.x);
  const nh = (() => {
    const g = new THREE.Group();
    const white = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 }), gold = new THREE.MeshLambertMaterial({ color: 0xd9a441 }), grey = new THREE.MeshLambertMaterial({ color: 0x8a8f98 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, .5, 1.2), gold); g.add(body);
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.1, .3, .35, 18), white); dish.position.y = .5; g.add(dish);
    const rtg = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 1.6, 8), grey); rtg.rotation.z = Math.PI/2; rtg.position.set(1.4, -.1, .3); g.add(rtg);
    o.group.add(g);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    hit.userData.dest = 'newhorizons'; g.add(hit); o.pick.push(hit);
    return g;
  })();
  const NH_OFF = new THREE.Vector3(3.5, 2, 5);
  o.addDest('newhorizons', { name: () => api.nm('newhorizons'), em: '🛰️',
    target: out => out.copy(nh.position).add(NH_OFF), center: out => out.copy(nh.position),
    focus: out => out.copy(nh.position), camDist: 12, fact: () => api.fact('newhorizons') },
    add => add(api.nm('newhorizons'), out => out.copy(nh.position).setY(nh.position.y + 3.5), '', 'newhorizons'));
  o.addDest('landPluto', { name: () => api.nm('landPluto'), em: '🛬',
    target: out => o.onPlanet(hd, 1.15, out), center: out => out.set(0, 0, 0),
    focus: out => o.onPlanet(hd, 1.15, out), camDist: 10,
    onArrive: () => { surf.land(); return true; } });

  /* ---- on the heart (Sputnik Planitia) ---- */
  const cells = [...Array(46)].map(() => [rand(-120, 120), rand(-120, 120)]);
  const mountains = (() => {
    const g = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(new THREE.ConeGeometry(rand(5, 9), rand(10, 18), 6), new THREE.MeshLambertMaterial({ color: i%2 ? 0xe8ddd0 : 0xcbb7a2, flatShading: true }));
      m.position.set(rand(-12, 12), 4, rand(-8, 8)); m.rotation.y = rand(0, 3); g.add(m);
    }
    return g;
  })();
  const hazeRing = (() => {
    const c = makeCanvas(4, 128), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(90,140,255,0)'); g.addColorStop(.55, 'rgba(110,160,255,.55)'); g.addColorStop(1, 'rgba(110,160,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 4, 128);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(260, 260, 70, 40, 1, true),
      new THREE.MeshBasicMaterial({ map: canvasTexture(c), transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    m.position.y = 22; return m;
  })();
  const HAZE_DIR = new THREE.Vector3(.8, 0, -.6).normalize();
  surf = buildSurface(api, {
    key: 'plutoSurface', icon: '💗', title: 'plutoGround', place: 'pluto',
    sky: {}, sun: { pos: [140, 40, -170], size: 4 }, sunI: 1.5, hemi: [0xd8dcff, 0x5a4a40], hemiI: 1.4,
    ground: [.08, .3, .82], craters: 0, hAmp: .8,
    groundTint: (col, x, z) => {
      let d1 = 1e9, d2 = 1e9;
      for (const [cx, cz] of cells) { const d = Math.hypot(x - cx, z - cz); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
      if (d2 - d1 < 1.6) col.offsetHSL(0, .05, -.14);
    },
    rocks: { n: 40, color: 0xbfa890 }, hills: { color: 0xcbb7a2, hmin: 12, hmax: 26 },
    objects: [ { id: 'icemountains', em: '🏔️', obj: mountains, pos: [-26, -30], hitR: 14, view: { side: 30, height: 10, cy: 7, camDist: 44, labelY: 22 } } ],
    skyBody: { id: 'charonSky', em: '🌑', pos: [110, 80, -170], r: 22, tex: charonTex },
    dests: {
      bluehaze: { name: () => api.nm('bluehaze'), em: '🌫️',
        target: out => out.copy(HAZE_DIR).multiplyScalar(-6).setY(3.5), center: out => out.copy(HAZE_DIR).multiplyScalar(200).setY(20),
        focus: out => out.copy(HAZE_DIR).multiplyScalar(14).setY(8), camDist: 16, phi: 1.5, thetaOff: .15, fact: () => api.fact('bluehaze') },
    },
    takeoff: () => api.switchMode('pluto', () => {
      o.onPlanet(hd, 1.6, api.ship.position); api.ship.lookAt(0, 0, 0);
      api.setView({ follow: v => v.set(0, 0, 0), tDist: 50, phi: 1.15 });
    }),
  });
  surf.group.add(hazeRing);

  return { planet: 'pluto', exploreLabel: 'explorePluto', enter: o.enter, names, facts,
    modes: { pluto: o.mode, plutoSurface: surf.mode } };
}
