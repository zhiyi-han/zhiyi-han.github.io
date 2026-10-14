import { buildOrbit } from './orbit.js';
import { createDive } from './dive.js';
import { buildSurface } from './surface.js';

export function createUranus(api){
  const { THREE, rand, makeCanvas, canvasTexture, rockyTex, bandTex } = api;
  const names = {
    exploreUranus:['🩵 Explore Uranus!','🩵 進入天王星探險！'],
    sideways:['Rolling on its Side','側躺著轉'], urings:['Dark Rings','黑色光環'],
    miranda:['Miranda','米蘭達'], ariel:['Ariel','艾瑞爾'], titania:['Titania','泰坦妮亞'],
    udive:['Dive into Uranus','潛入天王星'],
    landMiranda:['Land on Miranda','登陸米蘭達'], miGround:['Miranda','米蘭達'],
    veronarupes:['The Tallest Cliff','最高的懸崖'], uranusSky:['Uranus in the Sky','天上的天王星'],
  };
  const facts = {
    sideways:["Uranus is tipped over on its side, so it rolls around the Sun like a ball! Scientists think a giant crash long ago knocked it over.",
      "天王星是側躺著的，所以它像一個球一樣滾著繞太陽轉！科學家認為很久以前一次大碰撞把它撞倒了。"],
    urings:["Uranus has 13 thin rings. They're dark like charcoal, so they're very hard to see.",
      "天王星有 13 條細細的光環。它們黑得像炭一樣，所以很難看見。"],
    miranda:["Miranda looks like a patchwork quilt, and it has the tallest cliff in the solar system — about 20 km high! If you fell off, you'd fall for about 12 minutes.",
      "米蘭達看起來像一張拼布被子，它還有太陽系最高的懸崖——大約 20 公里高！如果掉下去，要掉大約 12 分鐘。"],
    ariel:["Ariel is the brightest of Uranus's moons, with long cracked valleys across its icy face.",
      "艾瑞爾是天王星最亮的衛星，冰冷的表面有很多長長的裂谷。"],
    titania:["Titania is Uranus's biggest moon. It's covered with giant canyons and icy cliffs.",
      "泰坦妮亞是天王星最大的衛星。上面有很多巨大的峽谷和冰崖。"],
    udive:["Diving into Uranus! It's the coldest planet of all — minus 224°C! And some of its clouds smell like rotten eggs!",
      "潛入天王星！這是所有行星裡最冷的——零下 224 度！而且有些雲聞起來像臭雞蛋！"],
  };
  Object.assign(facts, {
    miGround:["We landed on Miranda! It looks like a jigsaw puzzle of different pieces glued together.",
      "我們登陸米蘭達了！它看起來像一塊塊不同的拼圖黏在一起。"],
    veronarupes:["This is Verona Rupes, the tallest cliff in the solar system — about 20 km high! Gravity is so weak that if you jumped off, you'd float down for about 12 minutes.",
      "這是維羅納斷崖，太陽系最高的懸崖——大約 20 公里高！這裡引力很弱，如果跳下去，要慢慢飄大約 12 分鐘才到底。"],
    uranusSky:["Uranus fills the sky! See how its rings stand up and down? That's because Uranus lies on its side.",
      "天王星把天空都填滿了！看到它的光環是直立的嗎？因為天王星是側躺著的。"],
  });
  const TOASTS = {
    en:["🩵 Freezing cold clouds — the coldest air of any planet!","💨 Pee-yew! These clouds smell like rotten eggs!","🌊 A deep hot ocean of water and ammonia!"],
    zh:["🩵 冷冰冰的雲——所有行星裡最冷的空氣！","💨 好臭呀！這些雲聞起來像臭雞蛋！","🌊 一個又深又熱的水和氨的海洋！"],
  };

  const R = 15;
  let o;
  const patch = () => {
    const c = makeCanvas(512, 256), x = c.getContext('2d');
    x.fillStyle = '#b9b4ad'; x.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 14; i++) {
      x.fillStyle = ['#8d8780', '#d6d1ca', '#a29b93'][i%3]; x.globalAlpha = .7;
      x.beginPath(); const cx = rand(0, 512), cy = rand(30, 226);
      for (let k = 0; k < 6; k++) { const a = k/6*Math.PI*2; x.lineTo(cx + Math.cos(a)*rand(25, 55), cy + Math.sin(a)*rand(18, 40)); }
      x.fill();
      x.globalAlpha = .5; x.strokeStyle = '#6f6962'; x.lineWidth = 2;
      for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(cx - 40, cy - 20 + k*9); x.lineTo(cx + 40, cy - 14 + k*9); x.stroke(); }
    }
    x.globalAlpha = 1; return canvasTexture(c);
  };
  o = buildOrbit(api, {
    key: 'uranus', planet: 'uranus', icon: '🩵', R, tex: bandTex(['#c3f1f3', '#b2e7ec', '#c8f3f4', '#a9e1e8', '#bdeff1'], 8),
    tilt: [.15, 0, 1.71], spin: .04, tapDest: 'sideways',
    spots: [ { id: 'sideways', em: '🎳', space: [.4, .45, 4.6], camDist: 78, thetaOff: .1 } ],
    moons: [
      { id: 'miranda', em: '🧩', tex: patch(), r: 1.1, d: 34, sp: .09, a0: .6 },
      { id: 'ariel', em: '✨', tex: rockyTex('#d9d6d0', ['#a9a49d', '#f0ede8'], 40, x => {
          x.strokeStyle = '#7d7871'; x.lineWidth = 3;
          for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(rand(0, 512), rand(20, 236)); x.lineTo(rand(0, 512), rand(20, 236)); x.stroke(); }
        }), r: 1.4, d: 44, sp: .065, a0: 2.4 },
      { id: 'titania', em: '🏔️', tex: rockyTex('#a39a92', ['#7a726a', '#c8c0b6'], 60), r: 1.9, d: 60, sp: .045, a0: 4.3 },
    ],
  });
  /* 13 thin, dark rings */
  const ringGroup = new THREE.Group(); o.tilt.add(ringGroup);
  for (let i = 0; i < 13; i++) {
    const rr = R*(1.6 + i*.045);
    const ring = api.makeRing(rr, rr + (i === 12 ? .5 : .14), api.ringTex(() => .9, [70, 75, 82]), i === 12 ? .9 : .55, 96);
    ringGroup.add(ring);
  }
  const ringHit = api.makeRing(R*1.55, R*2.3, api.ringTex(() => 0, [0, 0, 0]), 0, 32);
  ringHit.userData.dest = 'urings'; ringGroup.add(ringHit); o.pick.push(ringHit);
  o.addDest('urings', { name: () => api.nm('urings'), em: '⭕',
    target: out => o.tilt.localToWorld(out.set(R*1.9, 2, R*.9)),
    center: out => o.tilt.localToWorld(out.set(R*1.9, 0, 0)),
    focus: out => o.tilt.localToWorld(out.set(R*1.8, 0, 0)), camDist: 26, fact: () => api.fact('urings') });

  const DIVE = new THREE.Vector3(.3, .2, .93).normalize();
  o.addDest('udive', { name: () => api.nm('udive'), em: '🌀',
    target: out => out.copy(DIVE).multiplyScalar(R*1.15), center: out => out.set(0, 0, 0),
    focus: out => out.copy(DIVE).multiplyScalar(R*1.15), camDist: 15,
    onArrive: () => { diveIn(); return true; } });

  const mir = o.moons.miranda;
  o.addDest('landMiranda', { name: () => api.nm('landMiranda'), em: '🛬',
    target: out => mir.mesh.getWorldPosition(out).addScaledVector(o.LD, 1.1*1.3).setY(out.y + 1),
    center: out => mir.mesh.getWorldPosition(out), focus: out => mir.mesh.getWorldPosition(out), camDist: 9,
    onArrive: () => { miSurf.land(); return true; } });

  /* ---- landing on Miranda ---- */
  const cliff = (() => {
    const g = new THREE.Group();
    const shape = new THREE.Shape(); shape.moveTo(-40, 0);
    for (let x = -40; x <= 40; x += 8) shape.lineTo(x, 34 + rand(-4, 6));
    shape.lineTo(40, 0); shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 10, bevelEnabled: false });
    g.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x9a948d, flatShading: true })));
    g.rotation.y = .35; return g;
  })();
  const miSurf = buildSurface(api, {
    key: 'mirandaSurface', icon: '🧩', title: 'miGround', place: 'miranda',
    sky: {}, sun: { pos: [150, 40, -160], size: 5 }, sunI: 1.8, hemi: [0xd0e8ee, 0x3a3a3a], hemiI: 1.3,
    ground: [.08, .06, .6], craters: 16, hAmp: 1.6,
    groundTint: (col, x, z) => { const k = Math.sin(x*.12 + z*.04)*Math.sin(z*.1 - x*.05); if (k > .45) col.offsetHSL(0, 0, -.12); else if (k < -.55) col.offsetHSL(0, 0, .08); },
    rocks: { n: 90, color: 0x7d7871 }, hills: { color: 0x9a948d },
    objects: [ { id: 'veronarupes', em: '🧗', obj: cliff, pos: [-30, 48], hitR: 30, view: { side: 46, height: 22, cy: 20, camDist: 80, phi: 1.3, labelY: 44 } } ],
    skyBody: { id: 'uranusSky', em: '🩵', pos: [90, 90, -170], r: 46, tex: o.planet.material.map, tilt: 1.71,
      ring: () => { const g = new THREE.Group(); g.rotation.z = 1.71;
        [1.6, 1.7, 1.8, 2.1].forEach(k => g.add(api.makeRing(46*k, 46*k + .8, api.ringTex(() => .9, [80, 85, 92]), .7, 96)));
        return g; } },
    takeoff: () => api.switchMode('uranus', () => {
      mir.mesh.getWorldPosition(api.ship.position).addScaledVector(o.LD, 6); api.ship.lookAt(0, 0, 0);
      api.setView({ tDist: 18, phi: 1.15 }); api.parkAt('miranda');
    }),
  });

  /* ---- the dive ---- */
  const oceanMat = new THREE.MeshPhongMaterial({ color: 0x3fb6c8, emissive: 0x0c4a5a, shininess: 80, transparent: true, opacity: 0 });
  const ocean = new THREE.Mesh(new THREE.CircleGeometry(90, 48), oceanMat); ocean.rotation.x = -Math.PI/2;
  let oceanY = -70;
  const dive = createDive(api, {
    sky: ['#e6fbfc', '#9fdfe8', '#3d8ea6', '#123a52'], fog: 0x8fd2dc, hemi: [0xe8fbff, 0x1d4a5a],
    cloudColors: ['#e6fbfc', '#bfeef2', '#9fdde4', '#ffffff'], boltColor: 0xe6f8ff,
    stages: [4000, 10000],
    toasts: () => TOASTS[api.L() ? 'zh' : 'en'],
    onReset: () => { oceanY = -70; oceanMat.opacity = 0; ocean.position.y = oceanY; },
    onStage: st => { if (st === 1) api.tone(196, 0, .6, 'sawtooth', .03); },
    extraUpdate: (dt, t, depth, stage) => {
      if (stage >= 2) {
        oceanY += (-9 - oceanY)*(1 - Math.exp(-dt*.35));
        oceanMat.opacity = Math.min(.9, oceanMat.opacity + dt*.4);
        ocean.position.y = oceanY + Math.sin(t*1.2)*.3;
      }
    },
  });
  dive.group.add(ocean);
  function diveIn(){
    api.switchMode('uranusInside', () => {
      api.ship.position.set(0, 0, 0); api.ship.lookAt(0, -10, 3);
      api.setView({ follow: v => v.copy(api.ship.position), target: [0, 0, 0], dist: 10, tDist: 9, phi: 1.2, theta: .6 });
      dive.reset();
      api.showRawCard(() => ({ icon: '🌀', title: api.nm('udive'), text: api.fact('udive') }));
    }, '🌀 ' + api.nm('udive'));
  }
  function leaveInside(){
    api.switchMode('uranus', () => {
      api.ship.position.copy(DIVE).multiplyScalar(R*1.5); api.ship.lookAt(0, 0, 0);
      api.setView({ follow: v => v.set(0, 0, 0), tDist: 80, phi: 1.15 });
    });
  }

  return { planet: 'uranus', exploreLabel: 'exploreUranus', enter: o.enter, names, facts,
    modes: {
      uranus: o.mode,
      mirandaSurface: miSurf.mode,
      uranusInside: { group: dive.group, fog: dive.fog, dist: [4, 30], shipScale: 1, noStars: true, depth: true, burn: true, engine: .25,
        hover: api.hoverDown, update: dive.update, pick: [],
        dests: { up: { name: () => api.T().flyUp, em: '⬆️', action: leaveInside } }, order: ['up'],
        where: () => '🌀 ' + api.nm('udive') },
    } };
}
