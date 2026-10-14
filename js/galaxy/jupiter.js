import { createDive } from './dive.js';
import { buildSurface } from './surface.js';

/* ============================================================
   Jupiter up close: the Great Red Spot, the four big moons
   (Io's volcanoes!), the never-ending northern lights, the
   secret dusty rings, and a dive down to the liquid-metal ocean.
   ============================================================ */
export function createJupiter(api){
  const { THREE, rand, gauss, LOW, sphere, bandTex, rockyTex, GLOW, hitMat, makeCanvas, canvasTexture } = api;
  const nm = id => api.nm(id), fact = id => api.fact(id);

  const names = {
    exploreJupiter:['🟠 Explore Jupiter!','🟠 進入木星探險！'],
    redspot:['Great Red Spot','大紅斑'], io:['Io','木衛一'], europa:['Europa','木衛二'],
    ganymede:['Ganymede','木衛三'], callisto:['Callisto','木衛四'], aurora:['Northern Lights','北極光'],
    jrings:["Jupiter's Rings",'木星環'], jdive:['Dive into Jupiter','潛入木星'],
    landEuropa:['Land on Europa','登陸木衛二'], euGround:['Europa','木衛二'],
    europlume:['Water Fountain','水柱噴泉'], ridges:['Ice Ridges','冰脊'], jupSky:['Jupiter in the Sky','天上的木星'],
  };
  const facts = {
    redspot:["The Great Red Spot is a giant storm bigger than the whole Earth! People have watched it spinning for more than 150 years.",
      "大紅斑是一個比整個地球還要大的超級風暴！人們已經看著它轉了超過 150 年。"],
    io:["Io is the most volcanic place in the solar system! Its volcanoes shoot giant fountains high into space. It's yellow and orange because of sulfur.",
      "木衛一是整個太陽系火山最多的地方！它的火山會把巨大的噴泉噴到太空中。它是黃色和橙色的，因為表面有很多硫磺。"],
    europa:["Europa is covered in cracked ice, like a frozen pond. Underneath is a huge salty ocean with more water than all of Earth's oceans put together!",
      "木衛二表面是裂開的冰，像結了冰的池塘。冰下面有一個巨大的鹹水海洋，水比地球所有海洋加起來還要多！"],
    ganymede:["Ganymede is the biggest moon in the whole solar system — even bigger than the planet Mercury! It's the only moon with its own magnetic field.",
      "木衛三是整個太陽系最大的衛星——比水星還要大！它是唯一有自己磁場的衛星。"],
    callisto:["Callisto has more craters than almost anywhere else — it looks like a giant ball covered in polka dots!",
      "木衛四身上的隕石坑幾乎比任何地方都多——看起來就像一個佈滿圓點的大球！"],
    aurora:["Jupiter has the biggest northern lights in the solar system — bigger than the whole Earth! And they glow all the time.",
      "木星有太陽系最大的北極光——比整個地球還要大！而且它們一直都在發光。"],
    jrings:["Surprise — Jupiter has rings too! They're made of fine dust, so thin and dark that they're very hard to see.",
      "驚喜——木星也有光環！它們是由很細的塵埃組成的，又薄又暗，所以很難看見。"],
    jdive:["Diving into Jupiter! Its colourful stripes are clouds racing around the planet. Deep down, everything is squeezed so hard that hydrogen gas turns into liquid metal!",
      "潛入木星！那些彩色的條紋是繞著木星飛奔的雲。在很深很深的地方，壓力大到連氫氣都會變成液態金屬！"],
  };
  Object.assign(facts, {
    euGround:["We landed on Europa! The ice here may be many kilometres thick — and underneath is a giant salty ocean.",
      "我們登陸木衛二了！這裡的冰層可能有好幾公里厚——冰下面是一個巨大的鹹水海洋。"],
    europlume:["Scientists think Europa may spray giant fountains of water from its hidden ocean, out through cracks in the ice!",
      "科學家認為，木衛二可能會把秘密海洋的水，從冰的裂縫裡噴出一條條巨大的水柱！"],
    ridges:["Long double ridges and reddish-brown cracks crisscross Europa's ice, like lines on a cracked eggshell!",
      "長長的雙冰脊和紅褐色的裂縫在木衛二的冰面上交錯，就像裂開的蛋殼上的花紋！"],
    jupSky:["Look up — giant Jupiter fills Europa's sky, Great Red Spot and all!",
      "抬頭看——巨大的木星把木衛二的天空都填滿了，連大紅斑都看得見！"],
  });
  const TOASTS = {
    en:["🟠 Stripes of colourful clouds!","⚡ Lightning flashes in the storms!","🪩 An ocean of liquid metal hydrogen!"],
    zh:["🟠 一條條彩色的雲帶！","⚡ 風暴裡閃電在閃！","🪩 液態金屬氫組成的海洋！"],
  };

  /* ---------------- Jupiter up close ---------------- */
  const JR = 22;
  const group = new THREE.Group(); group.visible = false; api.scene.add(group);
  const light = new THREE.DirectionalLight(0xfff4e0, 3.2); light.position.set(120, 40, 90); group.add(light);
  const LD = light.position.clone().normalize();
  const tilt = new THREE.Group(); tilt.rotation.set(.08, 0, .05); group.add(tilt);
  const pick = [];

  /* the red spot sits at texture (u,v) = (.62,.62) → about 22° south */
  const SPOT_U = .62, SPOT_V = .62;
  const planet = new THREE.Mesh(sphere(JR, LOW ? 48 : 72), new THREE.MeshLambertMaterial({
    map: bandTex(['#e9d6b5','#c99b6c','#f2e3c8','#b98352','#e8d1ae','#c4925f','#f0e0c4','#bf8d5d','#e5cfaa','#d4ad85'], 40,
      ['#c25a3a','#e08a66', SPOT_U*512, SPOT_V*256, 36, 19]) }));
  planet.userData.dest = 'redspot'; tilt.add(planet); pick.push(planet);
  const phi = SPOT_U*Math.PI*2, th = SPOT_V*Math.PI;
  const SPOT_DIR = new THREE.Vector3(-Math.cos(phi)*Math.sin(th), Math.cos(th), Math.sin(phi)*Math.sin(th));
  const spotPoint = (out, h) => planet.localToWorld(out.copy(SPOT_DIR).multiplyScalar(JR*h));

  /* faint dusty rings */
  const rings = api.makeRing(JR*1.4, JR*1.81, api.ringTex(t => .1 + .08*Math.sin(t*18) + (t > .75 ? .06 : 0), [170,140,110]), .75, LOW ? 80 : 128);
  rings.userData.dest = 'jrings'; tilt.add(rings); pick.push(rings);

  /* never-ending northern lights */
  const auroraMats = [];
  const aurora = new THREE.Group(); aurora.position.y = JR*.955; tilt.add(aurora);
  [[JR*.28, .55, 0x8f7bff], [JR*.33, .4, 0x6fffc8], [JR*.24, .3, 0xff8fd8]].forEach(([r, tube, col]) => {
    const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false });
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 48), m);
    t.rotation.x = Math.PI/2; aurora.add(t); auroraMats.push(m);
  });
  const auroraHit = new THREE.Mesh(new THREE.CylinderGeometry(JR*.36, JR*.36, 3, 16), hitMat);
  auroraHit.userData.dest = 'aurora'; aurora.add(auroraHit); pick.push(auroraHit);

  /* the four Galilean moons */
  const moons = {};
  const addMoon = (id, r, d, sp, a0, tex, extra) => {
    const g = new THREE.Group(); tilt.add(g);
    const mesh = new THREE.Mesh(sphere(r, 28), new THREE.MeshLambertMaterial({ map: tex }));
    mesh.userData.dest = id; g.add(mesh); pick.push(mesh);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(Math.max(r*2.2, 3), 8, 6), hitMat);
    hit.userData.dest = id; g.add(hit); pick.push(hit);
    moons[id] = { g, mesh, r, d, sp, a: a0 };
    if (extra) extra(g, r);
  };
  const crackTex = () => {
    const c = makeCanvas(512, 256), x = c.getContext('2d');
    x.fillStyle = '#efe6d6'; x.fillRect(0, 0, 512, 256);
    x.strokeStyle = 'rgba(176,122,74,.75)';
    for (let i = 0; i < 46; i++) {
      x.lineWidth = rand(1, 3);
      x.beginPath(); let px = rand(0, 512), py = rand(10, 246); x.moveTo(px, py);
      for (let k = 0; k < 5; k++) { px += rand(-60, 60); py += rand(-25, 25); x.lineTo(px, py); }
      x.stroke();
    }
    return canvasTexture(c);
  };
  let plumes = null;
  addMoon('io', 1.6, 40, .09, .4, rockyTex('#e8c84a', ['#d9862a','#3a2a1e','#f6e08a','#c9552a'], 80), (g, r) => {
    const vents = [new THREE.Vector3(.5, .7, .5).normalize(), new THREE.Vector3(-.7, .2, .7).normalize()];
    const n = 90, pos = new Float32Array(n*3);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: .45, map: GLOW, color: 0xffe08a, transparent: true, opacity: .9,
      blending: THREE.AdditiveBlending, depthWrite: false })));
    const side = new THREE.Vector3();
    plumes = { geo, r, parts: [...Array(n)].map((_, i) => {
      const v = vents[i % 2];
      side.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).cross(v).normalize();
      return { v, s: side.clone(), t: Math.random(), sp: rand(.35, .6) };
    }) };
  });
  addMoon('europa', 1.4, 54, .065, 2.1, crackTex());
  addMoon('ganymede', 2.1, 70, .045, 3.6, rockyTex('#9c8f80', ['#6f6458','#c8bcae','#857766'], 70));
  addMoon('callisto', 1.9, 88, .03, 5.2, rockyTex('#5e564e', ['#e8e2da','#3e3832','#d0c8bc'], 170));

  const _f = new THREE.Vector3();
  const moonDest = (id, em) => {
    const M = moons[id];
    const center = out => M.mesh.getWorldPosition(out);
    const target = out => api.approachDir(center(out), M.r, LD, out);
    return { name: () => nm(id), em, target, center,
      focus: out => { target(_f); return center(out).lerp(_f, .3); }, camDist: M.r*5+6, fact: () => fact(id) };
  };
  const RING_A = 1.1;
  const DIVE = new THREE.Vector3(0, Math.sin(.45), Math.cos(.45));
  const dests = {
    redspot: { name: () => nm('redspot'), em: '🔴',
      target: out => spotPoint(out, 1.45), center: out => spotPoint(out, 1),
      focus: out => spotPoint(out, 1.05), camDist: 26, fact: () => fact('redspot') },
    io: moonDest('io', '🌋'), europa: moonDest('europa', '🧊'),
    ganymede: moonDest('ganymede', '🌑'), callisto: moonDest('callisto', '⚫'),
    aurora: { name: () => nm('aurora'), em: '🌈',
      target: out => tilt.localToWorld(out.set(0, JR*1.5, JR*.35)),
      center: out => tilt.localToWorld(out.set(0, JR*.96, 0)),
      focus: out => tilt.localToWorld(out.set(0, JR, 0)), camDist: 34, phi: .5, fact: () => fact('aurora') },
    jrings: { name: () => nm('jrings'), em: '💫',
      target: out => tilt.localToWorld(out.set(Math.cos(RING_A)*JR*1.62, 1.6, Math.sin(RING_A)*JR*1.62)),
      center: out => tilt.localToWorld(out.set(Math.cos(RING_A)*JR*1.62, 0, Math.sin(RING_A)*JR*1.62)),
      focus: out => tilt.localToWorld(out.set(Math.cos(RING_A)*JR*1.62, 0, Math.sin(RING_A)*JR*1.62)),
      camDist: 16, phi: .95, fact: () => fact('jrings') },
    jdive: { name: () => nm('jdive'), em: '🌀',
      target: out => tilt.localToWorld(out.copy(DIVE).multiplyScalar(JR*1.12)), center: out => out.set(0, 0, 0),
      focus: out => tilt.localToWorld(out.copy(DIVE).multiplyScalar(JR*1.12)), camDist: 16, fact: () => fact('jdive'),
      onArrive: () => { diveIn(); return true; } },
    landEuropa: { name: () => nm('landEuropa'), em: '🛬',
      target: out => moons.europa.mesh.getWorldPosition(out).addScaledVector(LD, 1.4*1.3).setY(out.y + 1),
      center: out => moons.europa.mesh.getWorldPosition(out), focus: out => moons.europa.mesh.getWorldPosition(out), camDist: 10,
      onArrive: () => { euSurf.land(); return true; } },
    back: { name: () => api.T().toSolar, em: '☀️', action: () => api.backToSolar('jupiter') },
  };

  function update(dt, t){
    planet.rotation.y += dt*.03;
    rings.rotation.z += dt*.01;
    for (const id in moons) { const M = moons[id]; M.a += M.sp*dt*.3; M.g.position.set(Math.cos(M.a)*M.d, 0, Math.sin(M.a)*M.d); }
    auroraMats.forEach((m, i) => { m.opacity = .45 + .3*Math.sin(t*(1.3 + i*.4) + i*2); });
    aurora.rotation.y += dt*.2;
    aurora.scale.setScalar(1 + .04*Math.sin(t*1.7));
    if (plumes) {
      const arr = plumes.geo.attributes.position.array, r = plumes.r;
      plumes.parts.forEach((p, i) => {
        p.t += dt*p.sp; if (p.t > 1) p.t -= 1;
        const h = 4*p.t*(1 - p.t)*r*2.4, spread = p.t*r*1.3;
        arr[i*3]   = p.v.x*(r + h) + p.s.x*spread;
        arr[i*3+1] = p.v.y*(r + h) + p.s.y*spread;
        arr[i*3+2] = p.v.z*(r + h) + p.s.z*spread;
      });
      plumes.geo.attributes.position.needsUpdate = true;
    }
  }

  function enter(){
    api.switchMode('jupiter', () => {
      api.ship.position.set(0, 12, 125); api.ship.lookAt(0, 0, 0);
      api.setView({ follow: o => o.set(0, 0, 0), target: [0, 0, 0], dist: 160, tDist: 135, phi: 1.2, theta: .3 });
      api.bigMsg('🟠 ' + nm('jupiter'), 1800);
      setTimeout(() => api.toast(api.L() ? '點一個地方，開始木星探險！' : 'Tap a place to explore Jupiter!'), 1500);
    });
  }

  /* ---------------- diving into Jupiter ---------------- */
  const metalMat = new THREE.MeshPhongMaterial({ color: 0xc8d4e6, emissive: 0x3a5a88, specular: 0xffffff, shininess: 110,
    transparent: true, opacity: 0 });
  const metal = (() => {
    const c = makeCanvas(256, 256), x = c.getContext('2d');
    x.fillStyle = '#b8c6dc'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 70; i++) {
      x.strokeStyle = `rgba(255,255,255,${rand(.2, .6).toFixed(2)})`; x.lineWidth = rand(1, 3);
      x.beginPath(); x.ellipse(rand(0, 256), rand(0, 256), rand(10, 40), rand(3, 9), 0, 0, 7); x.stroke();
    }
    const tex = canvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(6, 6);
    metalMat.map = tex;
    const m = new THREE.Mesh(new THREE.CircleGeometry(90, 48), metalMat);
    m.rotation.x = -Math.PI/2; return m;
  })();
  let metalY = -70;
  const dive = createDive(api, {
    sky: ['#f3e2c4', '#c98f62', '#7a4a3a', '#2c3a58'], fog: 0xc99470, hemi: [0xffe7c8, 0x5a3a30],
    cloudColors: ['#f2e3c8', '#d9b48a', '#b9764a', '#ffffff', '#c99b6c'],
    stages: [4500, 11000],
    toasts: () => TOASTS[api.L() ? 'zh' : 'en'],
    onReset: () => { metalY = -70; metalMat.opacity = 0; metal.position.y = metalY; },
    onStage: st => { if (st === 2) { api.tone(523, 0, .8, 'sine', .05); api.tone(784, .15, .9, 'sine', .04); } },
    extraUpdate: (dt, t, depth, stage) => {
      if (stage >= 2) {
        metalY += (-9 - metalY)*(1 - Math.exp(-dt*.35));
        metalMat.opacity = Math.min(.92, metalMat.opacity + dt*.4);
        metalMat.map.offset.set(Math.sin(t*.3)*.2, t*.05);
        metal.position.y = metalY + Math.sin(t*1.4)*.25;
      }
    },
  });
  dive.group.add(metal);
  function diveIn(){
    api.switchMode('jupInside', () => {
      api.ship.position.set(0, 0, 0); api.ship.lookAt(0, -10, 3);
      api.setView({ follow: o => o.copy(api.ship.position), target: [0, 0, 0], dist: 10, tDist: 9, phi: 1.2, theta: .6 });
      dive.reset();
      api.showRawCard(() => ({ icon: '🌀', title: nm('jdive'), text: fact('jdive') }));
    }, '🌀 ' + nm('jdive'));
  }
  function leaveInside(){
    api.switchMode('jupiter', () => {
      tilt.localToWorld(api.ship.position.copy(DIVE).multiplyScalar(JR*1.4));
      api.ship.lookAt(0, 0, 0);
      api.setView({ follow: o => o.set(0, 0, 0), tDist: 95, phi: 1.15 });
    });
  }

  /* ---------------- landing on Europa ---------------- */
  const plume = (() => {
    const g = new THREE.Group(), n = LOW ? 120 : 200, pos = new Float32Array(n*3);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.add(new THREE.Points(geo, new THREE.PointsMaterial({ map: GLOW, color: 0xe6f6ff, size: 2.4, transparent: true, opacity: .7,
      blending: THREE.AdditiveBlending, depthWrite: false })));
    g.userData = { geo, parts: [...Array(n)].map(() => ({ t: Math.random(), sp: rand(.18, .3), a: rand(0, 6), s: rand(.3, 1) })) };
    return g;
  })();
  const ridges = (() => {
    const g = new THREE.Group();
    const shape = new THREE.Shape(); shape.moveTo(-1.6, 0); shape.lineTo(0, 1.6); shape.lineTo(1.6, 0);
    [-2.2, 2.2].forEach(dx => {
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 34, bevelEnabled: false }); geo.translate(dx, -.3, -17);
      g.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0xc9a48a, flatShading: true })));
    });
    g.rotation.y = .7; return g;
  })();
  const euSurf = buildSurface(api, {
    key: 'europaSurface', icon: '🧊', title: 'euGround', place: 'europa',
    sky: {}, sun: { pos: [160, 50, -150], size: 9 }, sunI: 2.2, hemi: [0xd8ecff, 0x4a4040], hemiI: 1.2,
    ground: [.56, .25, .84], craters: 4, hAmp: 1.2,
    groundTint: (col, x, z) => {
      if (Math.abs(Math.sin(x*.13 + z*.05)) < .05 || Math.abs(Math.sin(z*.11 - x*.03 + 1)) < .04 || Math.abs(Math.sin(x*.07 - z*.09 + 2)) < .035)
        col.setHSL(.06, .4, .55);
    },
    rocks: { n: 60, color: 0xc8d8e8 }, hills: { color: 0xd0e2f0, hmin: 5, hmax: 12 },
    objects: [
      { id: 'europlume', em: '⛲', obj: plume, pos: [8, -12], hitR: 8, view: { side: 24, height: 12, cy: 14, camDist: 46, phi: 1.3, labelY: 34 },
        update: (dt, t, g) => {
          const arr = g.userData.geo.attributes.position.array;
          g.userData.parts.forEach((p, i) => {
            p.t += dt*p.sp; if (p.t > 1) p.t -= 1;
            const h = 4*p.t*(1 - p.t)*30, r = p.t*7*p.s;
            arr[i*3] = Math.cos(p.a)*r; arr[i*3+1] = h; arr[i*3+2] = Math.sin(p.a)*r;
          });
          g.userData.geo.attributes.position.needsUpdate = true;
        } },
      { id: 'ridges', em: '〰️', obj: ridges, pos: [-30, 12], hitR: 8, view: { side: 14, height: 7, cy: 1, camDist: 22, labelY: 4 } },
    ],
    skyBody: { id: 'jupSky', em: '🟠', pos: [-80, 95, -190], r: 55, tex: planet.material.map },
    takeoff: () => api.switchMode('jupiter', () => {
      moons.europa.mesh.getWorldPosition(api.ship.position).addScaledVector(LD, 7); api.ship.lookAt(0, 0, 0);
      api.setView({ tDist: 20, phi: 1.15 }); api.parkAt('europa');
    }),
  });

  return {
    planet: 'jupiter', exploreLabel: 'exploreJupiter', enter, names, facts,
    modes: {
      jupiter: {
        group, dist: [6, 300], shipScale: 1, pick, update, dests,
        order: ['redspot','io','europa','ganymede','callisto','aurora','jrings','jdive','landEuropa','back'],
        where: id => '🟠 ' + nm('jupiter') + (id ? ' · ' + dests[id].name() : ''),
        labels: add => {
          Object.keys(moons).forEach(id => {
            const M = moons[id];
            add(nm(id), out => { M.mesh.getWorldPosition(out); out.y += M.r*1.4 + .6; return out; }, '', id);
          });
          add(nm('redspot'), out => { spotPoint(out, 1.08); out.y += 2.5; return out; }, '', 'redspot');
          add(nm('aurora'), out => tilt.localToWorld(out.set(0, JR*1.12, 0)), '', 'aurora');
        },
      },
      europaSurface: euSurf.mode,
      jupInside: {
        group: dive.group, fog: dive.fog, dist: [4, 30], shipScale: 1, noStars: true, depth: true, burn: true, engine: .25,
        hover: api.hoverDown, update: dive.update, pick: [],
        dests: { up: { name: () => api.T().flyUp, em: '⬆️', action: leaveInside } }, order: ['up'],
        where: () => '🌀 ' + nm('jdive'),
      },
    },
  };
}
