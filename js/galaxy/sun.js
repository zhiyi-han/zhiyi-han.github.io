/* ============================================================
   Flying close to the Sun: sunspots, a giant prominence loop,
   a solar flare that goes off when you arrive, the shimmering
   corona, the solar wind, and the Parker Solar Probe.
   ============================================================ */
export function createSun(api){
  const { THREE, rand, LOW, makeCanvas, canvasTexture, GLOW, hitMat } = api;
  const nm = id => api.nm(id), fact = id => api.fact(id);
  const names = {
    exploreSun:['☀️ Fly close to the Sun!','☀️ 飛近太陽！'],
    sunspots:['Sunspots','太陽黑子'], prominence:['Prominence','日珥'], flare:['Solar Flare','太陽閃焰'],
    corona:['The Corona','日冕'], parker:['Parker Solar Probe','帕克太陽探測器'],
  };
  const facts = {
    sunspots:["Sunspots are cooler, darker patches on the Sun — but they're still super hot! Many of them are bigger than the whole Earth.",
      "太陽黑子是太陽上比較涼、比較暗的地方——但它們還是超級熱！很多黑子比整個地球還要大。"],
    prominence:["This giant glowing loop is a prominence — a fountain of hot gas held up by the Sun's magnetism. Lots of Earths could fit underneath it!",
      "這個巨大的發光圓拱叫做日珥——是被太陽磁力托起來的熱氣體噴泉。它下面可以放進好多個地球！"],
    flare:["BOOM! A solar flare is a giant flash of energy from the Sun. When that energy reaches Earth, it can make beautiful northern lights!",
      "轟！太陽閃焰是太陽爆發出來的巨大能量。這些能量到達地球的時候，可以變成美麗的北極光！"],
    corona:["The Sun's glowing outer layer is called the corona. It's millions of degrees — even hotter than the surface below it! Scientists are still working out why.",
      "太陽發光的最外層叫做日冕。它有幾百萬度——比下面的表面還要熱！科學家還在研究為甚麼。"],
    parker:["The Parker Solar Probe is the fastest thing people have ever built, and it has flown closer to the Sun than any other spacecraft! A big heat shield keeps it cool.",
      "帕克太陽探測器是人類造過最快的東西，也是飛得最接近太陽的太空船！它有一面大大的隔熱盾牌保護自己。"],
  };

  const R = 30;
  const group = new THREE.Group(); group.visible = false; api.scene.add(group);
  group.add(new THREE.PointLight(0xfff0d0, 4, 0, 0));
  const pick = [];

  /* granulated surface with sunspot groups */
  const SPOTS = [[.32, .42], [.36, .45], [.6, .58], [.63, .55]];
  const tex = (() => {
    const W = 1024, H = 512, c = makeCanvas(W, H), x = c.getContext('2d');
    x.fillStyle = '#ffa828'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < (LOW ? 2200 : 3600); i++) {
      x.globalAlpha = rand(.2, .45); x.fillStyle = ['#ffd25a', '#ff9420', '#ffe08a', '#ff8410'][i%4];
      x.beginPath(); x.arc(rand(0, W), rand(0, H), rand(3, 9), 0, 7); x.fill();
    }
    x.globalAlpha = 1;
    SPOTS.forEach(([u, v], k) => {
      const cx = u*W, cy = v*H, r = k%2 ? 14 : 22;
      x.fillStyle = '#c4580e'; x.beginPath(); x.arc(cx, cy, r*1.7, 0, 7); x.fill();
      x.fillStyle = '#3a1a08'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
    });
    return canvasTexture(c);
  })();
  const sun = new THREE.Mesh(api.sphere(R, LOW ? 48 : 72), new THREE.MeshBasicMaterial({ map: tex }));
  sun.userData.dest = 'sunspots'; group.add(sun); pick.push(sun);
  const dirOf = ([u, v]) => { const p = u*Math.PI*2, t = v*Math.PI; return new THREE.Vector3(-Math.cos(p)*Math.sin(t), Math.cos(t), Math.sin(p)*Math.sin(t)); };
  const onSun = (dir, h, out) => sun.localToWorld(out.copy(dir).multiplyScalar(R*h));

  /* corona glow */
  const coronas = [[R*4.2, 0xffb43a, .9], [R*7, 0xff8a2a, .45], [R*11, 0xff7020, .18]].map(([s, col, op]) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
    sp.scale.set(s, s, 1); group.add(sp); return { sp, op, s };
  });

  /* prominence loops standing on the surface */
  const loops = [];
  const addLoop = (dir, size, col) => {
    const g = new THREE.Group();
    g.position.copy(dir).multiplyScalar(R*.97);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(size, size*.12, 10, 40, Math.PI), mat);
    g.add(arch);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(size, size*.3, 8, 40, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(halo);
    sun.add(g); loops.push({ g, mat, ph: rand(0, 6) });
    return g;
  };
  const PROM = dirOf([.48, .3]);
  const mainLoop = addLoop(PROM, 9, 0xff7a2a);
  const hit = new THREE.Mesh(new THREE.SphereGeometry(10, 8, 6), hitMat); hit.position.y = 6; hit.userData.dest = 'prominence'; mainLoop.add(hit); pick.push(hit);
  addLoop(dirOf([.15, .62]), 6, 0xff9a3a); addLoop(dirOf([.78, .4]), 5, 0xff8a30); addLoop(dirOf([.9, .7]), 7, 0xff7020);

  /* solar wind streaming outward */
  const windN = LOW ? 260 : 450, windPos = new Float32Array(windN*3);
  const windParts = [...Array(windN)].map(() => ({ d: api.randDir(new THREE.Vector3()), r: rand(R, R*6), sp: rand(10, 22) }));
  const windGeo = new THREE.BufferGeometry(); windGeo.setAttribute('position', new THREE.BufferAttribute(windPos, 3));
  group.add(new THREE.Points(windGeo, new THREE.PointsMaterial({ map: GLOW, color: 0xffd28a, size: .9, transparent: true, opacity: .55,
    blending: THREE.AdditiveBlending, depthWrite: false })));

  /* the flare: a flash plus a burst of particles */
  const FLARE = dirOf([.61, .56]);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  sun.add(flash); flash.position.copy(FLARE).multiplyScalar(R*1.02);
  const burstN = 160, burstPos = new Float32Array(burstN*3);
  const burstGeo = new THREE.BufferGeometry(); burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
  const burstMat = new THREE.PointsMaterial({ map: GLOW, color: 0xfff0b0, size: 1.6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  sun.add(new THREE.Points(burstGeo, burstMat));
  const burst = [...Array(burstN)].map(() => ({ v: new THREE.Vector3() }));
  let flareT = -1;
  function boom(){
    flareT = 0;
    const side = new THREE.Vector3();
    burst.forEach(b => {
      side.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(.7);
      b.v.copy(FLARE).add(side).normalize().multiplyScalar(rand(8, 22));
    });
    api.noiseHit(1.4, 'lowpass', 1600, 120, .45);
    [784, 988, 1175, 1568].forEach((f, i) => api.tone(f, .05 + i*.06, .6, 'sine', .04));
  }

  /* Parker Solar Probe swinging past */
  const parker = (() => {
    const g = new THREE.Group();
    const white = new THREE.MeshLambertMaterial({ color: 0xf4f4f4, emissive: 0x444444 }), grey = new THREE.MeshLambertMaterial({ color: 0x8a8f98 }),
          panel = new THREE.MeshLambertMaterial({ color: 0x2a3c78, emissive: 0x101830 });
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, .25, 24), white); shield.rotation.z = Math.PI/2; g.add(shield);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1, 1), grey); body.position.x = -1; g.add(body);
    [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(.6, .05, 1.2), panel); p.position.set(-1, 0, s*1.1); g.add(p); });
    const h = new THREE.Mesh(new THREE.SphereGeometry(3.5, 8, 6), hitMat); h.userData.dest = 'parker'; g.add(h); pick.push(h);
    group.add(g); return g;
  })();
  let parkerA = 2;

  const _f = new THREE.Vector3(), _d = new THREE.Vector3();
  const spotDest = (id, em, dir, h, camDist) => ({ name: () => nm(id), em,
    target: out => onSun(dir, h, out), center: out => onSun(dir, 1, out), focus: out => onSun(dir, 1.05, out), camDist, fact: () => fact(id) });
  const SPOT_DIR = dirOf(SPOTS[0]);
  const dests = {
    sunspots: spotDest('sunspots', '⚫', SPOT_DIR, 1.45, 34),
    /* look at the loop side-on so the arch stands out against space */
    prominence: { name: () => nm('prominence'), em: '🌈',
      target: out => mainLoop.localToWorld(out.set(0, 9, 30)),
      center: out => mainLoop.localToWorld(out.set(0, 6, 0)),
      focus: out => mainLoop.localToWorld(out.set(0, 6, 0)),
      camDist: 46, thetaOff: 0,
      get phi(){ mainLoop.localToWorld(_d.set(0, 9, 30)); mainLoop.localToWorld(_f.set(0, 6, 0)); _d.sub(_f).normalize(); return Math.acos(Math.max(-.95, Math.min(.95, _d.y))); },
      fact: () => fact('prominence') },
    flare: { ...spotDest('flare', '💥', FLARE, 1.55, 40), onArrive: () => { boom(); } },
    corona: { name: () => nm('corona'), em: '✨', target: out => out.set(R*2.6, R*1.4, R*5.2), center: out => out.set(0, 0, 0),
      focus: out => out.set(0, 0, 0), camDist: R*9, fact: () => fact('corona') },
    parker: { name: () => nm('parker'), em: '🛰️',
      target: out => out.copy(parker.position).add(_d.copy(parker.position).normalize().multiplyScalar(5)).setY(parker.position.y + 2),
      center: out => out.copy(parker.position), focus: out => out.copy(parker.position), camDist: 14, fact: () => fact('parker') },
    back: { name: () => api.T().toSolar, em: '☀️', action: () => api.backToSolar('sun') },
  };

  function update(dt, t){
    sun.rotation.y += dt*.02;
    coronas.forEach((c, i) => { const k = 1 + .05*Math.sin(t*(.7 + i*.3) + i); c.sp.scale.set(c.s*k, c.s*k, 1); });
    loops.forEach(l => { l.mat.opacity = .65 + .25*Math.sin(t*1.5 + l.ph); l.g.scale.setScalar(1 + .06*Math.sin(t*.8 + l.ph)); });
    windParts.forEach((p, i) => {
      p.r += dt*p.sp; if (p.r > R*6.5) p.r = R*1.02;
      windPos[i*3] = p.d.x*p.r; windPos[i*3+1] = p.d.y*p.r; windPos[i*3+2] = p.d.z*p.r;
    });
    windGeo.attributes.position.needsUpdate = true;
    if (flareT >= 0) {
      flareT += dt;
      const k = flareT;
      flash.material.opacity = Math.max(0, 1 - k/1.6);
      const s = 10 + k*60; flash.scale.set(s, s, 1);
      burstMat.opacity = Math.max(0, 1 - k/3);
      burst.forEach((b, i) => {
        burstPos[i*3] = FLARE.x*R*1.02 + b.v.x*k; burstPos[i*3+1] = FLARE.y*R*1.02 + b.v.y*k; burstPos[i*3+2] = FLARE.z*R*1.02 + b.v.z*k;
      });
      burstGeo.attributes.position.needsUpdate = true;
      if (k > 3.2) flareT = -1;
    }
    /* Parker on a stretched orbit that dives close to the Sun */
    parkerA += dt*.12;
    const r = R*(1.9 + 1.4*(1 + Math.cos(parkerA))/2);
    parker.position.set(Math.cos(parkerA)*r, Math.sin(parkerA*.5)*6, Math.sin(parkerA)*r);
    parker.lookAt(0, 0, 0); parker.rotateY(-Math.PI/2);
  }
  function enter(){
    api.switchMode('sunUp', () => {
      api.ship.position.set(R*.6, R*.5, R*6); api.ship.lookAt(0, 0, 0);
      api.setView({ follow: o => o.set(0, 0, 0), target: [0, 0, 0], dist: R*9, tDist: R*7, phi: 1.2, theta: .3 });
      api.bigMsg('☀️ ' + nm('sun'), 1800);
      setTimeout(() => api.toast(api.L() ? '點一個地方，飛近太陽看看！' : 'Tap a place to fly close to the Sun!'), 1500);
    });
  }
  return {
    planet: 'sun', exploreLabel: 'exploreSun', enter, names, facts,
    modes: { sunUp: {
      group, dist: [8, R*16], shipScale: 1, pick, update, dests,
      order: ['sunspots', 'prominence', 'flare', 'corona', 'parker', 'back'],
      where: id => '☀️ ' + nm('sun') + (id ? ' · ' + dests[id].name() : ''),
      labels: add => {
        add(nm('sunspots'), out => { onSun(SPOT_DIR, 1.06, out); out.y += 3; return out; }, '', 'sunspots');
        add(nm('prominence'), out => { onSun(PROM, 1.5, out); out.y += 3; return out; }, '', 'prominence');
        add(nm('parker'), out => out.copy(parker.position).setY(parker.position.y + 4), '', 'parker');
      },
    } },
  };
}
