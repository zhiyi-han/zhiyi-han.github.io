/* ============================================================
   Mars, two ways:
   'mars'        — orbit the red planet: Olympus Mons, Valles
                   Marineris, the polar ice cap, Phobos and Deimos
   'marsSurface' — land! Perseverance rover, the Ingenuity
                   helicopter, a dust devil, and a blue sunset
   ============================================================ */
export function createMars(api){
  const { THREE, rand, LOW, sphere, rockyTex, GLOW, hitMat, makeCanvas, canvasTexture } = api;
  const nm = id => api.nm(id), fact = id => api.fact(id);

  const names = {
    exploreMars:['🔴 Explore Mars!','🔴 進入火星探險！'],
    olympus:['Olympus Mons','奧林帕斯山'], valles:['Valles Marineris','水手號峽谷'], marsPole:['Polar Ice Cap','極地冰帽'],
    phobos:['Phobos','火衛一'], deimos:['Deimos','火衛二'], land:['Land on Mars','登陸火星'],
    rover:['Perseverance Rover','毅力號探測車'], ingenuity:['Ingenuity Helicopter','機智號直升機'],
    dustdevil:['Dust Devil','塵捲風'], sunset:['Blue Sunset','藍色日落'], takeoff:['Fly back up','飛回太空'],
  };
  const facts = {
    olympus:["Olympus Mons is the biggest volcano in the whole solar system — more than twice as tall as Mount Everest, and as wide as a whole country!",
      "奧林帕斯山是整個太陽系最大的火山——比珠穆朗瑪峰高兩倍多，闊得像一整個國家！"],
    valles:["Valles Marineris is a giant canyon about 4,000 km long — like flying from Hong Kong to Beijing and back again!",
      "水手號峽谷是一個超級大峽谷，大約有 4,000 公里長——就像從香港飛到北京再飛回來那麼遠！"],
    marsPole:["Mars has white ice caps at its poles, made of frozen water and frozen carbon dioxide — 'dry ice', like the smoky ice at magic shows!",
      "火星兩極有白色的冰帽，是由冰凍的水和冰凍的二氧化碳——也就是「乾冰」——組成的，就像魔術表演裡會冒煙的冰！"],
    phobos:["Phobos is a lumpy moon shaped like a potato. It's slowly creeping closer to Mars — far in the future it may break apart into a ring!",
      "火衛一是一顆凹凸不平、像薯仔一樣的衛星。它正慢慢靠近火星——很久很久以後，它可能會碎成一個光環！"],
    deimos:["Deimos is Mars's tiny moon. Its gravity is so weak that a really big jump could send you floating off into space!",
      "火衛二是火星的小衛星。它的引力很弱，用力一跳就可能飄到太空去！"],
    land:["We landed on Mars! The ground is covered in red dust and rocks, and the sky is a butterscotch colour. Tap the rover, the helicopter, or the dust devil!",
      "我們登陸火星了！地上鋪滿紅色的塵土和石頭，天空是奶油糖一樣的顏色。點一下探測車、直升機或者塵捲風吧！"],
    rover:["This is the Perseverance rover! It's as big as a car, has 23 cameras, and is searching for signs that tiny living things once lived on Mars.",
      "這是毅力號探測車！它跟一架汽車差不多大，有 23 部相機，正在尋找火星上曾經有微小生物的證據。"],
    ingenuity:["Ingenuity was the first helicopter ever to fly on another planet! The little helicopter made 72 flights on Mars.",
      "機智號是第一架在其他星球上飛行的直升機！這架小直升機在火星上飛了 72 次。"],
    dustdevil:["Whoosh! A dust devil is a spinning tornado of dust. On Mars they can grow taller than Mount Everest!",
      "呼——！塵捲風是一個旋轉的塵土龍捲風。火星上的塵捲風可以比珠穆朗瑪峰還要高！"],
    sunset:["On Mars the daytime sky is butterscotch — but at sunset the sky around the Sun glows BLUE! It's the opposite of Earth.",
      "火星白天的天空是奶油糖色的——但日落的時候，太陽周圍的天空會發出藍光！剛好跟地球相反。"],
  };

  /* ---------------- Mars from orbit ---------------- */
  const MR = 16;
  const group = new THREE.Group(); group.visible = false; api.scene.add(group);
  const light = new THREE.DirectionalLight(0xfff4e0, 3.2); light.position.set(110, 50, 90); group.add(light);
  const LD = light.position.clone().normalize();
  const tilt = new THREE.Group(); tilt.rotation.set(.1, 0, .44); group.add(tilt);
  const pick = [];

  const W = 1024, H = 512;
  const SPOTS = { olympus: [.2, .4], valles: [.36, .54], land: [.48, .44] };
  const marsTex = (() => {
    const c = makeCanvas(W, H), x = c.getContext('2d');
    x.fillStyle = '#c1502e'; x.fillRect(0, 0, W, H);
    const blot = (cols, n, rmin, rmax, a) => {
      for (let i = 0; i < n; i++) {
        x.globalAlpha = rand(a[0], a[1]); x.fillStyle = cols[i % cols.length];
        x.beginPath(); x.ellipse(rand(0, W), rand(30, H - 30), rand(rmin, rmax), rand(rmin, rmax)*.7, rand(0, 3), 0, 7); x.fill();
      }
    };
    blot(['#8e3418', '#d9774a', '#a8421f', '#b5532c'], 220, 8, 60, [.12, .35]);
    x.globalAlpha = .55; x.fillStyle = '#6e2a14';                         /* Syrtis Major dark region */
    x.beginPath(); x.ellipse(W*.78, H*.45, 60, 110, .3, 0, 7); x.fill();
    x.globalAlpha = .5; x.fillStyle = '#e09a6a';                          /* Hellas basin */
    x.beginPath(); x.ellipse(W*.8, H*.72, 70, 44, 0, 0, 7); x.fill();
    x.globalAlpha = 1;
    /* Valles Marineris: a long dark gash with bright rims */
    const vx = W*SPOTS.valles[0], vy = H*SPOTS.valles[1];
    x.lineCap = 'round';
    x.strokeStyle = '#e8946a'; x.lineWidth = 16; x.beginPath(); x.moveTo(vx - 80, vy - 6); x.lineTo(vx + 80, vy + 8); x.stroke();
    x.strokeStyle = '#5a200e'; x.lineWidth = 9;  x.beginPath(); x.moveTo(vx - 78, vy - 6); x.lineTo(vx - 20, vy - 1); x.lineTo(vx + 30, vy + 4); x.lineTo(vx + 78, vy + 8); x.stroke();
    /* Olympus Mons + the three Tharsis volcanoes */
    const ox = W*SPOTS.olympus[0], oy = H*SPOTS.olympus[1];
    x.fillStyle = '#7a3018'; x.beginPath(); x.arc(ox, oy, 34, 0, 7); x.fill();
    x.fillStyle = '#d98a5c'; x.beginPath(); x.arc(ox, oy, 28, 0, 7); x.fill();
    x.fillStyle = '#8e3418'; x.beginPath(); x.arc(ox, oy, 8, 0, 7); x.fill();
    [[.25, .46], [.27, .5], [.29, .54]].forEach(([u, v]) => {
      x.fillStyle = '#d98a5c'; x.beginPath(); x.arc(W*u, H*v, 12, 0, 7); x.fill();
      x.fillStyle = '#8e3418'; x.beginPath(); x.arc(W*u, H*v, 4, 0, 7); x.fill();
    });
    /* polar caps */
    x.fillStyle = '#f6f2ea';
    x.beginPath(); x.moveTo(0, 0); for (let px = 0; px <= W; px += 32) x.lineTo(px, 30 + Math.sin(px*.03)*9 + rand(-4, 4)); x.lineTo(W, 0); x.fill();
    x.beginPath(); x.moveTo(0, H); for (let px = 0; px <= W; px += 32) x.lineTo(px, H - 16 - Math.sin(px*.025)*6); x.lineTo(W, H); x.fill();
    return canvasTexture(c);
  })();
  const planet = new THREE.Mesh(sphere(MR, LOW ? 48 : 72), new THREE.MeshLambertMaterial({ map: marsTex }));
  planet.userData.dest = 'land'; tilt.add(planet); pick.push(planet);
  const dirOf = ([u, v]) => {
    const p = u*Math.PI*2, t = v*Math.PI;
    return new THREE.Vector3(-Math.cos(p)*Math.sin(t), Math.cos(t), Math.sin(p)*Math.sin(t));
  };
  const DIRS = { olympus: dirOf(SPOTS.olympus), valles: dirOf(SPOTS.valles), land: dirOf(SPOTS.land) };
  const onPlanet = (dir, h, out) => planet.localToWorld(out.copy(dir).multiplyScalar(MR*h));

  /* Olympus Mons gets a real bump so it stands out from orbit */
  {
    const g = new THREE.Group();
    g.position.copy(DIRS.olympus).multiplyScalar(MR*.985);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), DIRS.olympus);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3.4, 24, 12, 0, Math.PI*2, 0, Math.PI/2), new THREE.MeshLambertMaterial({ color: 0xc8693f }));
    dome.scale.y = .32; g.add(dome);
    const cal = new THREE.Mesh(new THREE.CircleGeometry(.75, 18), new THREE.MeshLambertMaterial({ color: 0x7a3018 }));
    cal.rotation.x = -Math.PI/2; cal.position.y = 1.1; g.add(cal);
    dome.userData.dest = 'olympus'; pick.push(dome);
    planet.add(g);
  }

  /* lumpy little moons */
  const lumpy = (r, seed) => {
    const geo = new THREE.IcosahedronGeometry(r, 2);
    const p = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const k = 1 + .14*Math.sin(v.x*3.1 + seed) + .1*Math.sin(v.y*4.3 + seed*2) + .08*Math.sin(v.z*5.7);
      v.multiplyScalar(k); p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  };
  const moons = {};
  const addMoon = (id, r, d, sp, a0, scale, seed) => {
    const g = new THREE.Group(); tilt.add(g);
    const mesh = new THREE.Mesh(lumpy(r, seed), new THREE.MeshLambertMaterial({ map: rockyTex('#8c7a6a', ['#5e5045', '#a8988a'], 60), flatShading: true }));
    mesh.scale.set(...scale); mesh.userData.dest = id; g.add(mesh); pick.push(mesh);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(Math.max(r*2.4, 2.6), 8, 6), hitMat);
    hit.userData.dest = id; g.add(hit); pick.push(hit);
    moons[id] = { g, mesh, r, d, sp, a: a0 };
  };
  addMoon('phobos', 1.25, 27, .32, .8, [1.35, 1, .9], 1.3);
  addMoon('deimos', .75, 42, .1, 3.9, [1.2, 1, 1], 4.1);

  const _f = new THREE.Vector3();
  const moonDest = (id, em) => {
    const M = moons[id];
    const center = out => M.mesh.getWorldPosition(out);
    const target = out => api.approachDir(center(out), M.r, LD, out);
    return { name: () => nm(id), em, target, center,
      focus: out => { target(_f); return center(out).lerp(_f, .3); }, camDist: M.r*6+6, fact: () => fact(id) };
  };
  const spotDest = (id, em, h, camDist) => ({ name: () => nm(id), em,
    target: out => onPlanet(DIRS[id], h, out), center: out => onPlanet(DIRS[id], 1, out),
    focus: out => onPlanet(DIRS[id], 1.04, out), camDist, fact: () => fact(id) });
  const dests = {
    olympus: spotDest('olympus', '🌋', 1.5, 22),
    valles: spotDest('valles', '🏜️', 1.42, 22),
    marsPole: { name: () => nm('marsPole'), em: '🧊',
      target: out => tilt.localToWorld(out.set(0, MR*1.5, MR*.3)), center: out => tilt.localToWorld(out.set(0, MR, 0)),
      focus: out => tilt.localToWorld(out.set(0, MR, 0)), camDist: 28, phi: .5, fact: () => fact('marsPole') },
    phobos: moonDest('phobos', '🥔'), deimos: moonDest('deimos', '🪨'),
    land: { name: () => nm('land'), em: '🛬',
      target: out => onPlanet(DIRS.land, 1.12, out), center: out => out.set(0, 0, 0),
      focus: out => onPlanet(DIRS.land, 1.12, out), camDist: 14,
      onArrive: () => { landOnMars(); return true; } },
    back: { name: () => api.T().toSolar, em: '☀️', action: () => api.backToSolar('mars') },
  };

  function update(dt){
    planet.rotation.y += dt*.025;
    for (const id in moons) { const M = moons[id]; M.a += M.sp*dt*.3; M.g.position.set(Math.cos(M.a)*M.d, 0, Math.sin(M.a)*M.d); M.mesh.rotation.y += dt*.2; }
  }
  function enter(){
    api.switchMode('mars', () => {
      api.ship.position.set(0, 10, 95); api.ship.lookAt(0, 0, 0);
      api.setView({ follow: o => o.set(0, 0, 0), target: [0, 0, 0], dist: 120, tDist: 95, phi: 1.2, theta: .3 });
      api.bigMsg('🔴 ' + nm('mars'), 1800);
      setTimeout(() => api.toast(api.L() ? '點一個地方，開始火星探險！' : 'Tap a place to explore Mars!'), 1500);
    });
  }

  /* ---------------- on the surface ---------------- */
  const sGroup = new THREE.Group(); sGroup.visible = false; api.scene.add(sGroup);
  const DAY = { fog: new THREE.Color(0xe2b98c) }, DUSK = { fog: new THREE.Color(0x5a4a66) };
  const fog = new THREE.Fog(DAY.fog.clone(), 40, 190);
  const skyMesh = (cols, r, transparent) => {
    const c = makeCanvas(4, 256), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    cols.forEach((col, i) => g.addColorStop(i/(cols.length - 1), col));
    x.fillStyle = g; x.fillRect(0, 0, 4, 256);
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16),
      new THREE.MeshBasicMaterial({ map: canvasTexture(c), side: THREE.BackSide, fog: false, depthWrite: false, transparent, opacity: transparent ? 0 : 1 }));
    m.renderOrder = transparent ? -1 : -2;
    sGroup.add(m); return m;
  };
  skyMesh(['#b98059', '#d9a675', '#ebc79c', '#ebc79c', '#a8603c'], 300, false);
  const dusk = skyMesh(['#1d2140', '#3a3a62', '#7a5a6e', '#b37a5c', '#5a3a30'], 290, true);
  const SUN_POS = new THREE.Vector3(-170, 58, -150);
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xfff6e0, transparent: true, fog: false, depthWrite: false }));
  sunSprite.scale.set(26, 26, 1); sunSprite.position.copy(SUN_POS); sGroup.add(sunSprite);
  sunSprite.userData.dest = 'sunset';
  const blueHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0x6fa8ff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, fog: false, depthWrite: false }));
  blueHalo.scale.set(110, 80, 1); blueHalo.position.copy(SUN_POS); sGroup.add(blueHalo);
  const sHemi = new THREE.HemisphereLight(0xffe2c0, 0x7a3a22, 1.5); sGroup.add(sHemi);
  const sSun = new THREE.DirectionalLight(0xfff0d8, 2.2); sSun.position.copy(SUN_POS).normalize().multiplyScalar(50); sGroup.add(sSun);

  /* rolling red ground, flat around the landing site */
  const heightAt = (x, z) => {
    const d = Math.hypot(x, z), k = Math.min(1, Math.max(0, (d - 18)/40));
    return k*(Math.sin(x*.05)*3 + Math.sin(z*.07 + 1.3)*2.4 + Math.sin((x + z)*.11)*1.2) + Math.sin(x*.3)*Math.sin(z*.27)*.18;
  };
  {
    const seg = LOW ? 70 : 110;
    const geo = new THREE.PlaneGeometry(320, 320, seg, seg); geo.rotateX(-Math.PI/2);
    const p = geo.attributes.position, cols = new Float32Array(p.count*3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = heightAt(x, z);
      p.setY(i, y);
      c.setHSL(.04 + rand(-.008, .008), .55, .38 + y*.02 + rand(-.03, .03));
      cols[i*3] = c.r; cols[i*3+1] = c.g; cols[i*3+2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    sGroup.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
    /* far hills */
    for (let i = 0; i < 14; i++) {
      const a = i/14*Math.PI*2 + rand(-.15, .15), r = rand(120, 150);
      const hill = new THREE.Mesh(new THREE.ConeGeometry(rand(18, 34), rand(10, 24), 7), new THREE.MeshLambertMaterial({ color: 0xa65a3a, flatShading: true }));
      hill.position.set(Math.cos(a)*r, 2, Math.sin(a)*r); hill.rotation.y = rand(0, 3); sGroup.add(hill);
    }
    /* rocks */
    const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0x6e3a24, flatShading: true }), LOW ? 110 : 180);
    const o = new THREE.Object3D();
    for (let i = 0; i < rocks.count; i++) {
      let x, z; do { x = rand(-90, 90); z = rand(-90, 90); } while (Math.hypot(x, z) < 6);
      const s = Math.random() < .1 ? rand(.8, 1.5) : rand(.15, .55);
      o.position.set(x, heightAt(x, z) + s*.3, z); o.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3)); o.scale.set(s, s*rand(.5, .9), s);
      o.updateMatrix(); rocks.setMatrixAt(i, o.matrix);
    }
    sGroup.add(rocks);
  }

  /* Perseverance */
  const rover = new THREE.Group(), wheels = [];
  {
    const white = new THREE.MeshLambertMaterial({ color: 0xe8e4dc }), grey = new THREE.MeshLambertMaterial({ color: 0x8a8f98 }),
          dark = new THREE.MeshLambertMaterial({ color: 0x2e3138 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, .5, 2.2), white); body.position.y = .95; rover.add(body);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.5, .08, 2.1), grey); deck.position.y = 1.24; rover.add(deck);
    [-1, 1].forEach(sd => {
      [-.85, 0, .85].forEach(z => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .28, 14), dark);
        w.rotation.z = Math.PI/2; w.position.set(sd*1.02, .32, z); rover.add(w); wheels.push(w);
      });
      const rocker = new THREE.Mesh(new THREE.BoxGeometry(.08, .08, 1.9), grey); rocker.position.set(sd*.95, .7, 0); rocker.rotation.x = .08*sd; rover.add(rocker);
    });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, 1.3, 8), white); mast.position.set(.45, 1.9, .8); rover.add(mast);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.5, .26, .3), white); head.position.set(.45, 2.62, .82); rover.add(head);
    [-.11, .11].forEach(dx => {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .08, 10), dark);
      lens.rotation.x = Math.PI/2; lens.position.set(.45 + dx, 2.62, .99); rover.add(lens);
    });
    const arm1 = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, .9), grey); arm1.position.set(-.45, .9, 1.45); arm1.rotation.x = .3; rover.add(arm1);
    const arm2 = new THREE.Mesh(new THREE.BoxGeometry(.24, .24, .24), white); arm2.position.set(-.45, .7, 1.9); rover.add(arm2);
    const rtg = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .7, 10), dark); rtg.rotation.x = 1; rtg.position.set(0, 1.25, -1.25); rover.add(rtg);
    rover.scale.setScalar(1.5);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 3), hitMat); hit.position.y = 1.2; hit.userData.dest = 'rover'; rover.add(hit);
    sGroup.add(rover);
  }
  /* Ingenuity */
  const heli = new THREE.Group(), rotors = [];
  {
    const gold = new THREE.MeshLambertMaterial({ color: 0xd9a441 }), grey = new THREE.MeshLambertMaterial({ color: 0x9aa2ad }),
          dark = new THREE.MeshLambertMaterial({ color: 0x2e3138 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(.45, .38, .45), gold); heli.add(box);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .9, 6), grey); mast.position.y = .55; heli.add(mast);
    [.42, .62].forEach((y, i) => {
      const r = new THREE.Group(); r.position.y = y;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(2.4, .03, .16), dark); r.add(blade);
      heli.add(r); rotors.push({ r, dir: i ? -1 : 1 });
    });
    const panel = new THREE.Mesh(new THREE.BoxGeometry(.7, .04, .4), new THREE.MeshLambertMaterial({ color: 0x2a3c78 })); panel.position.y = 1.02; heli.add(panel);
    for (let i = 0; i < 4; i++) {
      const a = i*Math.PI/2 + Math.PI/4;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .8, 5), grey);
      leg.position.set(Math.cos(a)*.35, -.45, Math.sin(a)*.35); leg.rotation.set(Math.sin(a)*.5, 0, -Math.cos(a)*.5); heli.add(leg);
    }
    heli.scale.setScalar(1.5);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 6), hitMat); hit.userData.dest = 'ingenuity'; heli.add(hit);
    sGroup.add(heli);
  }
  /* a wandering dust devil */
  const devil = new THREE.Group();
  const devilParts = [];
  {
    const n = LOW ? 260 : 420, pos = new Float32Array(n*3);
    for (let i = 0; i < n; i++) devilParts.push({ h: Math.random(), a: rand(0, Math.PI*2), sp: rand(2.5, 4.5), j: rand(.8, 1.2) });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    devil.add(new THREE.Points(geo, new THREE.PointsMaterial({ map: GLOW, color: 0xd9a070, size: 1.1, transparent: true, opacity: .55, depthWrite: false })));
    devil.userData.geo = geo;
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(3, 1.5, 20, 10), hitMat); hit.position.y = 10; hit.userData.dest = 'dustdevil'; devil.add(hit);
    sGroup.add(devil);
  }
  const sPick = [];
  sGroup.traverse(o => { if (o.userData.dest) sPick.push(o); });

  let roverA = 0, heliA = 2, devilA = 3.4, duskK = 0, windT = 4;
  const SIDE = new THREE.Vector3(.55, 0, .83).normalize();
  const sDests = {
    rover: { name: () => nm('rover'), em: '🚙',
      target: out => out.copy(rover.position).addScaledVector(SIDE, 7).setY(rover.position.y + 4.5),
      center: out => out.copy(rover.position).setY(rover.position.y + 1.5),
      focus: out => out.copy(rover.position).setY(rover.position.y + 1.5).addScaledVector(SIDE, 2), camDist: 15, phi: 1.15, fact: () => fact('rover') },
    ingenuity: { name: () => nm('ingenuity'), em: '🚁',
      target: out => out.copy(heli.position).addScaledVector(SIDE, 5).setY(heli.position.y + 1.2),
      center: out => out.copy(heli.position),
      focus: out => out.copy(heli.position).addScaledVector(SIDE, 1.5), camDist: 11, phi: 1.2, fact: () => fact('ingenuity') },
    dustdevil: { name: () => nm('dustdevil'), em: '🌪️',
      target: out => out.copy(devil.position).addScaledVector(SIDE, 13).setY(devil.position.y + 7),
      center: out => out.copy(devil.position).setY(devil.position.y + 8),
      focus: out => out.copy(devil.position).setY(devil.position.y + 8).addScaledVector(SIDE, 4), camDist: 30, phi: 1.25,
      fact: () => fact('dustdevil'), onArrive: () => { api.noiseHit(2.2, 'bandpass', 400, 1600, .22); } },
    sunset: { name: () => nm('sunset'), em: '🌅',
      target: out => out.copy(SUN_POS).setY(0).normalize().multiplyScalar(-6).setY(3.5),
      center: out => out.copy(SUN_POS),
      focus: out => out.copy(SUN_POS).setY(0).normalize().multiplyScalar(14).setY(9), camDist: 16, phi: 1.52, thetaOff: .15,
      fact: () => fact('sunset'),
      onArrive: () => { [392, 494, 587, 784].forEach((f, i) => api.tone(f, i*.18, 1.2, 'sine', .04)); } },
    takeoff: { name: () => nm('takeoff'), em: '🚀', action: takeOff },
  };

  function surfaceUpdate(dt, t){
    roverA += dt*.07;
    const rx = Math.cos(roverA)*10, rz = Math.sin(roverA)*10;
    rover.position.set(rx, heightAt(rx, rz), rz);
    rover.rotation.y = -roverA;
    wheels.forEach(w => { w.rotation.x += dt*1.5; });
    heliA += dt*.35;
    heli.position.set(-8 + Math.cos(heliA)*5, 3.8 + Math.sin(t*1.6)*.5, 7 + Math.sin(heliA)*3);
    heli.rotation.y = -heliA;
    rotors.forEach(r => { r.r.rotation.y += dt*28*r.dir; });
    devilA += dt*.04;
    const dx = Math.cos(devilA)*34, dz = Math.sin(devilA)*34 - 10;
    devil.position.set(dx, heightAt(dx, dz), dz);
    const arr = devil.userData.geo.attributes.position.array;
    devilParts.forEach((p, i) => {
      p.a += dt*p.sp; p.h += dt*.06; if (p.h > 1) p.h -= 1;
      const r = (.6 + p.h*3.2)*p.j, y = p.h*20;
      arr[i*3] = Math.cos(p.a)*r; arr[i*3+1] = y; arr[i*3+2] = Math.sin(p.a)*r;
    });
    devil.userData.geo.attributes.position.needsUpdate = true;
    /* blue sunset while we're parked there */
    const want = api.getAt() === 'sunset' ? 1 : 0;
    duskK += (want - duskK)*(1 - Math.exp(-dt*.9));
    dusk.material.opacity = duskK;
    blueHalo.material.opacity = duskK*.75;
    sunSprite.material.color.setRGB(1, .96 - duskK*.1, .88 - duskK*.15);
    fog.color.copy(DAY.fog).lerp(DUSK.fog, duskK);
    sHemi.intensity = 1.5 - duskK*.8; sSun.intensity = 2.2 - duskK*1.4;
    /* the Martian wind */
    windT -= dt;
    if (windT <= 0) { windT = rand(5, 9); api.noiseHit(3, 'lowpass', 500, 180, .07); }
  }

  function landOnMars(){
    api.switchMode('marsSurface', () => {
      duskK = 0;
      api.ship.position.set(4, 9, 22); api.ship.lookAt(0, 0, 0);
      api.setView({ follow: o => o.set(0, 2, 0), target: [0, 2, 0], dist: 40, tDist: 30, phi: 1.2, theta: .5 });
      setTimeout(() => { if (api.getMode() === 'marsSurface' && !api.getAt() && api.getPhase() !== 'flying')
        api.showRawCard(() => ({ icon: '🛬', title: nm('land'), text: fact('land') })); }, 900);
    }, '🛬 ' + nm('land'));
  }
  function takeOff(){
    api.switchMode('mars', () => {
      onPlanet(DIRS.land, 1.45, api.ship.position);
      api.ship.lookAt(0, 0, 0);
      api.setView({ follow: o => o.set(0, 0, 0), tDist: 70, phi: 1.15 });
    }, '🚀 ' + nm('mars'));
  }

  return {
    planet: 'mars', exploreLabel: 'exploreMars', enter, names, facts,
    modes: {
      mars: {
        group, dist: [5, 240], shipScale: 1, pick, update, dests,
        order: ['olympus','valles','marsPole','phobos','deimos','land','back'],
        where: id => '🔴 ' + nm('mars') + (id ? ' · ' + dests[id].name() : ''),
        labels: add => {
          Object.keys(moons).forEach(id => {
            const M = moons[id];
            add(nm(id), out => { M.mesh.getWorldPosition(out); out.y += M.r*1.6 + .6; return out; }, '', id);
          });
          add(nm('olympus'), out => { onPlanet(DIRS.olympus, 1.08, out); out.y += 1.5; return out; }, '', 'olympus');
          add(nm('valles'), out => { onPlanet(DIRS.valles, 1.04, out); out.y += 1.5; return out; }, '', 'valles');
        },
      },
      marsSurface: {
        group: sGroup, fog, dist: [4, 120], shipScale: 1, flyDist: 18, noStars: true, pick: sPick, update: surfaceUpdate,
        dests: sDests, order: ['rover','ingenuity','dustdevil','sunset','takeoff'],
        where: id => '🛬 ' + nm('mars') + (id ? ' · ' + sDests[id].name() : ''),
        labels: add => {
          add(nm('rover'), out => out.copy(rover.position).setY(rover.position.y + 5), '', 'rover');
          add(nm('ingenuity'), out => out.copy(heli.position).setY(heli.position.y + 2.4), '', 'ingenuity');
          add(nm('dustdevil'), out => out.copy(devil.position).setY(devil.position.y + 22), '', 'dustdevil');
        },
      },
    },
  };
}
