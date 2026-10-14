import { buildOrbit } from './orbit.js';
import { buildSurface } from './surface.js';

export function createNeptune(api){
  const { THREE, rand, makeCanvas, canvasTexture, GLOW, LOW, sphere, bandTex } = api;
  const names = {
    exploreNeptune:['🔵 Explore Neptune!','🔵 進入海王星探險！'],
    darkspot:['Great Dark Spot','大黑斑'], winds:['Super Winds','超級大風'], nrings:["Neptune's Rings",'海王星環'],
    triton:['Triton','崔頓'], voyager:['Voyager 2','航行者 2 號'],
    landTriton:['Land on Triton','登陸崔頓'], tritonGround:['Triton','崔頓'],
    geyser:['Ice Geysers','冰噴泉'], neptuneSky:['Neptune in the Sky','天上的海王星'],
  };
  const facts = {
    darkspot:["Neptune once had a giant storm called the Great Dark Spot — as big as the whole Earth! Storms on Neptune come and go.",
      "海王星曾經有一個叫「大黑斑」的巨大風暴——跟整個地球一樣大！海王星的風暴來了又去。"],
    winds:["Neptune has the fastest winds in the whole solar system — over 2,000 km/h! That's faster than a jet plane. Watch the white clouds zoom!",
      "海王星有整個太陽系最快的風——每小時超過 2,000 公里！比噴射機還要快。看那些白雲飛得多快！"],
    nrings:["Neptune has faint rings too — and they have lumpy bright bits called 'arcs'!",
      "海王星也有暗暗的光環——上面還有一團團亮亮的「環弧」！"],
    triton:["Triton goes around Neptune backwards — the only big moon that does! It's so cold that nitrogen freezes into pink-ish ice.",
      "崔頓是倒著繞海王星轉的——是唯一這樣轉的大衛星！它冷到連氮氣都會結成粉紅色的冰。"],
    voyager:["Voyager 2 is the only spacecraft that has ever visited Neptune — it flew past in 1989, and it's still flying out into deep space today!",
      "航行者 2 號是唯一探訪過海王星的太空船——它在 1989 年飛過這裡，到今天還在飛向遙遠的太空！"],
    tritonGround:["We landed on Triton! The ground is frozen nitrogen, and it's one of the coldest places in the solar system — minus 235°C!",
      "我們登陸崔頓了！地上是冰凍的氮，這裡是太陽系最冷的地方之一——零下 235 度！"],
    geyser:["Triton's geysers shoot dark dust 8 km up into the sky — then the thin wind blows the dust sideways like a flag!",
      "崔頓的冰噴泉把黑色的塵土噴到 8 公里高——然後稀薄的風把塵土吹向一邊，像一面旗！"],
    neptuneSky:["Look up — giant blue Neptune fills the sky! From Triton it looks huge.",
      "抬頭看——巨大的藍色海王星把天空都填滿了！從崔頓看，它好大好大。"],
  };

  const R = 15;
  const ntex = bandTex(['#3d6fd8', '#3563c9', '#4a7fe0', '#2f58b8', '#4174d6', '#3b6bd2'], 18, ['#1f3680', '#2a4596', 512*.4, 256*.6, 30, 16]);
  let surf;
  const tritonTex = (() => {
    const c = makeCanvas(512, 256), x = c.getContext('2d');
    x.fillStyle = '#e8d6cc'; x.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 160; i++) { x.globalAlpha = rand(.2, .45); x.fillStyle = ['#c9b0a6', '#f4e8e2', '#b89a90'][i%3]; x.beginPath(); x.arc(rand(0, 512), rand(0, 256), rand(4, 14), 0, 7); x.fill(); }
    x.globalAlpha = .55; x.fillStyle = '#f7d9d4'; x.fillRect(0, 160, 512, 96);
    x.globalAlpha = 1; return canvasTexture(c);
  })();
  const o = buildOrbit(api, {
    key: 'neptune', planet: 'neptune', icon: '🔵', R, tex: ntex, tilt: [.1, 0, .49], spin: .045, tapDest: 'darkspot',
    spots: [
      { id: 'darkspot', em: '⚫', uv: [.4, .6], h: 1.45, camDist: 26, label: true },
      { id: 'winds', em: '💨', space: [-1.6, .6, 2.6], camDist: 46 },
    ],
    moons: [ { id: 'triton', em: '🩷', tex: tritonTex, r: 2.6, d: 62, sp: -.06, a0: 1.4, lift: 10, camDist: 20 } ],
    update: (dt, t) => {
      scooters.forEach(s => { s.a += dt*s.sp; s.m.position.set(Math.cos(s.a)*R*1.03*s.k, s.y, Math.sin(s.a)*R*1.03*s.k); s.m.rotation.y = -s.a; });
      voyager.position.set(-110 + ((t*1.6) % 220), 18, 52); voyager.rotation.y += dt*.1;
    },
    maxDist: 220,
  });
  /* fast white "scooter" clouds streaking around */
  const scooters = [];
  for (let i = 0; i < 9; i++) {
    const y = rand(-.6, .6)*R, k = Math.sqrt(1 - (y/(R*1.03))**2);
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .85 }));
    m.scale.set(.3, .25, rand(2, 3.6));
    o.tilt.add(m); scooters.push({ m, a: rand(0, 6), sp: rand(.5, .9), y, k });
  }
  /* faint rings with bright arcs */
  const ringG = new THREE.Group(); o.tilt.add(ringG);
  ringG.add(api.makeRing(R*1.7, R*1.78, api.ringTex(() => .5, [120, 140, 170]), .5, 96));
  ringG.add(api.makeRing(R*2.3, R*2.36, api.ringTex(() => .6, [140, 160, 190]), .6, 96));
  for (let i = 0; i < 4; i++) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(R*2.33, .18, 6, 24, .25), new THREE.MeshBasicMaterial({ color: 0xd8e4ff }));
    arc.rotation.x = Math.PI/2; arc.rotation.z = 1 + i*.3; ringG.add(arc);
  }
  const ringHit = api.makeRing(R*1.6, R*2.5, api.ringTex(() => 0, [0, 0, 0]), 0, 32);
  ringHit.userData.dest = 'nrings'; ringG.add(ringHit); o.pick.push(ringHit);
  o.addDest('nrings', { name: () => api.nm('nrings'), em: '💫',
    target: out => o.tilt.localToWorld(out.set(Math.cos(1.2)*R*2.33, 2.5, Math.sin(1.2)*R*2.33)),
    center: out => o.tilt.localToWorld(out.set(Math.cos(1.2)*R*2.33, 0, Math.sin(1.2)*R*2.33)),
    focus: out => o.tilt.localToWorld(out.set(Math.cos(1.2)*R*2.33, 0, Math.sin(1.2)*R*2.33)), camDist: 18, phi: .95,
    fact: () => api.fact('nrings') });
  /* Voyager 2 drifting past */
  const voyager = (() => {
    const g = new THREE.Group();
    const white = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 }), grey = new THREE.MeshLambertMaterial({ color: 0x8a8f98 }), gold = new THREE.MeshLambertMaterial({ color: 0xd9a441 });
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.8, .4, .5, 20), white); g.add(dish);
    const bus = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, .5, 10), gold); bus.position.y = -.55; g.add(bus);
    const boom1 = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 4, 6), grey); boom1.rotation.z = Math.PI/2; boom1.position.set(2, -.6, 0); g.add(boom1);
    const rtg = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .9, 8), grey); rtg.rotation.z = Math.PI/2; rtg.position.set(-1.6, -.6, 0); g.add(rtg);
    const mag = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 6, 5), grey); mag.position.set(0, -1, 2.6); mag.rotation.x = Math.PI/2.4; g.add(mag);
    o.group.add(g);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(3.5, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    hit.userData.dest = 'voyager'; g.add(hit); o.pick.push(hit);
    return g;
  })();
  const V_OFF = new THREE.Vector3(4, 2, 6);
  o.addDest('voyager', { name: () => api.nm('voyager'), em: '📡',
    target: out => out.copy(voyager.position).add(V_OFF),
    center: out => out.copy(voyager.position),
    focus: out => out.copy(voyager.position), camDist: 14, fact: () => api.fact('voyager') },
    add => add(api.nm('voyager'), out => out.copy(voyager.position).setY(voyager.position.y + 4), '', 'voyager'));
  const tri = o.moons.triton;
  o.addDest('landTriton', { name: () => api.nm('landTriton'), em: '🛬',
    target: out => tri.mesh.getWorldPosition(out).addScaledVector(o.LD, 2.6*1.3).setY(out.y + 1),
    center: out => tri.mesh.getWorldPosition(out), focus: out => tri.mesh.getWorldPosition(out), camDist: 12,
    onArrive: () => { surf.land(); return true; } });

  /* ---- on Triton ---- */
  const geysers = (() => {
    const g = new THREE.Group(), list = [];
    [[0, 0], [9, -6], [-7, -10]].forEach(([gx, gz], k) => {
      const n = LOW ? 70 : 120, pos = new Float32Array(n*3);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const p = new THREE.Points(geo, new THREE.PointsMaterial({ map: GLOW, color: 0x3a3232, size: 3, transparent: true, opacity: .6, depthWrite: false }));
      p.position.set(gx, 0, gz); g.add(p);
      const vent = new THREE.Mesh(new THREE.CircleGeometry(1, 12), new THREE.MeshBasicMaterial({ color: 0x2a2424 }));
      vent.rotation.x = -Math.PI/2; vent.position.set(gx, .08, gz); g.add(vent);
      list.push({ geo, parts: [...Array(n)].map(() => ({ t: Math.random(), sp: rand(.12, .2), j: rand(-.5, .5), k: rand(-.5, .5) })), ph: k });
    });
    g.userData.list = list; return g;
  })();
  surf = buildSurface(api, {
    key: 'tritonSurface', icon: '🩷', title: 'tritonGround', place: 'triton',
    sky: {}, sun: { pos: [150, 60, -150], size: 6 }, sunI: 1.6, hemi: [0xbfd0ff, 0x4a3a40], hemiI: 1.3,
    ground: [.02, .35, .78], craters: 8, hAmp: 1.5,
    groundTint: (col, x, z) => { const k = Math.sin(x*.6)*Math.sin(z*.6); if (k > .55) col.offsetHSL(0, -.1, -.08); },
    rocks: { n: 70, color: 0xb59a92 }, hills: { color: 0xd9c4bc, hmin: 6, hmax: 14 },
    objects: [
      { id: 'geyser', em: '🌋', obj: geysers, pos: [6, -14], hitR: 9, view: { side: 22, height: 10, cy: 12, camDist: 44, phi: 1.3, labelY: 30 },
        update: (dt, t, g) => {
          g.userData.list.forEach(gy => {
            const arr = gy.geo.attributes.position.array;
            gy.parts.forEach((p, i) => {
              p.t += dt*p.sp; if (p.t > 1) p.t -= 1;
              const h = Math.min(p.t*1.6, 1)*24, drift = Math.max(0, p.t - .55)*36;
              arr[i*3] = drift + p.j*(1.3 + drift*.3); arr[i*3+1] = h + p.j*1.2; arr[i*3+2] = p.k*(1.2 + drift*.3) + drift*.25;
            });
            gy.geo.attributes.position.needsUpdate = true;
          });
        } },
    ],
    skyBody: { id: 'neptuneSky', em: '🔵', pos: [-90, 85, -170], r: 42, tex: ntex, tilt: .49, phi: 1.32 },
    takeoff: () => api.switchMode('neptune', () => {
      tri.mesh.getWorldPosition(api.ship.position).addScaledVector(o.LD, 9);
      api.ship.lookAt(0, 0, 0);
      api.setView({ follow: v => tri.mesh.getWorldPosition(v), tDist: 26, phi: 1.15 });
    }),
  });

  return { planet: 'neptune', exploreLabel: 'exploreNeptune', enter: o.enter, names, facts,
    modes: { neptune: o.mode, tritonSurface: surf.mode } };
}
