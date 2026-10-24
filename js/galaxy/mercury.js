import { buildOrbit } from './orbit.js?v=318caff1';
import { buildSurface } from './surface.js?v=318caff1';

export function createMercury(api){
  const { THREE, rand, makeCanvas, canvasTexture } = api;
  const names = {
    exploreMercury:['⚪ Explore Mercury!','⚪ 進入水星探險！'],
    caloris:['Caloris Basin','卡路里斯盆地'], hotcold:['Hot & Cold','又熱又凍'], icepole:['Hidden Ice','隱藏的冰'],
    landMercury:['Land on Mercury','登陸水星'], mercuryGround:['Mercury','水星'],
    bigsun:['The Giant Sun','超大的太陽'], freshcrater:['Fresh Crater','新的隕石坑'], scarp:['Giant Cliff','巨大懸崖'],
  };
  const facts = {
    caloris:["Caloris Basin is a giant crater made when a huge space rock crashed into Mercury long ago. Hong Kong could fit inside it more than a thousand times!",
      "卡路里斯盆地是很久以前一塊巨大太空石撞上水星留下的大坑。它大到可以放進一千多個香港！"],
    hotcold:["Mercury has no blanket of air. The sunny side is hot enough to melt lead — 430°C! But the night side is freezing: minus 180°C!",
      "水星沒有空氣做被子。向著太陽的一面熱到可以熔化鉛——攝氏 430 度！但晚上那一面冷到零下 180 度！"],
    icepole:["Surprise! Even though Mercury is closest to the Sun, there's ice hiding in dark craters at its poles where sunlight never reaches.",
      "驚喜！雖然水星離太陽最近，但它兩極的黑暗隕石坑裡藏著冰，因為那裡永遠照不到陽光。"],
    mercuryGround:["We landed on Mercury! There's no air here, so the sky is black even in the daytime — and you can see stars next to the Sun!",
      "我們登陸水星了！這裡沒有空氣，所以白天天空也是黑色的——還可以在太陽旁邊看到星星！"],
    bigsun:["From Mercury, the Sun looks about three times bigger than it does from Earth — and much, much brighter!",
      "在水星上看，太陽大約比在地球上看到的大三倍——而且亮得多得多！"],
    freshcrater:["This crater is young and fresh — the bright stripes around it are rock that splashed out when a space rock hit!",
      "這是一個很新的隕石坑——周圍一條條亮亮的線，是太空石撞下來時濺出來的石頭！"],
    scarp:["Mercury is shrinking! As its insides cooled down, it wrinkled like a raisin and made giant cliffs like this one.",
      "水星正在縮小！它裡面慢慢變冷，表面就像提子乾一樣起皺，形成了這樣的大懸崖。"],
  };

  /* ---- grey cratered planet with the big Caloris ring ---- */
  const tex = (() => {
    const c = makeCanvas(1024, 512), x = c.getContext('2d');
    x.fillStyle = '#a8a39c'; x.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 260; i++) {
      const r = Math.random() < .1 ? rand(14, 34) : rand(3, 12), cx = rand(0, 1024), cy = rand(20, 492);
      x.globalAlpha = rand(.25, .5); x.fillStyle = '#7d7872'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
      x.globalAlpha = rand(.2, .45); x.strokeStyle = '#d3cec7'; x.lineWidth = Math.max(1, r*.18); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke();
    }
    x.globalAlpha = 1;
    x.fillStyle = '#c4b49a'; x.beginPath(); x.arc(1024*.3, 512*.33, 62, 0, 7); x.fill();
    x.strokeStyle = '#8a7f72'; x.lineWidth = 7; x.beginPath(); x.arc(1024*.3, 512*.33, 62, 0, 7); x.stroke();
    x.strokeStyle = '#8a7f72'; x.lineWidth = 3; x.beginPath(); x.arc(1024*.3, 512*.33, 40, 0, 7); x.stroke();
    return canvasTexture(c);
  })();

  let surf;
  const o = buildOrbit(api, {
    key: 'mercury', planet: 'mercury', icon: '⚪', R: 12, tex, tilt: [.05, 0, .02], spin: .02, tapDest: 'caloris',
    spots: [
      { id: 'caloris', em: '🕳️', uv: [.3, .33], h: 1.5, camDist: 20, label: true },
      { id: 'hotcold', em: '🌗', space: [-1.5, .35, 2.0], camDist: 34 },
      { id: 'icepole', em: '🧊', pole: 1, camDist: 22 },
    ],
  });
  o.addDest('landMercury', { name: () => api.nm('landMercury'), em: '🛬',
    target: out => o.planet.localToWorld(out.set(0, .35, .94).multiplyScalar(12*1.12)), center: out => out.set(0, 0, 0),
    focus: out => o.planet.localToWorld(out.set(0, .35, .94).multiplyScalar(12*1.12)), camDist: 12,
    onArrive: () => { surf.land(); return true; } });

  /* ---- on the surface ---- */
  const scarp = (() => {
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(9, 0); shape.lineTo(3, 6); shape.lineTo(0, 6.5);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 70, bevelEnabled: false }); geo.translate(-4, -.5, -35);
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x8f8a83, flatShading: true }));
    const g = new THREE.Group(); m.rotation.y = .6; g.add(m); return g;
  })();
  const marker = new THREE.Group();
  surf = buildSurface(api, {
    key: 'mercurySurface', icon: '⚪', title: 'mercuryGround', place: 'mercury',
    sky: {}, sun: { pos: [-150, 70, -170], size: 95, halo: 0xfff0c0, haloOpacity: .35 },
    sunI: 3.4, hemi: [0xdcd6cc, 0x3a3632], hemiI: .9,
    ground: [.08, .05, .52], craters: 30, bigCraters: [[16, -12, 8]], hAmp: 1.8,
    groundTint: (col, x, z) => {
      const dx = x - 16, dz = z - 12*-1, d = Math.hypot(dx, dz);
      if (d > 8 && d < 40) { const a = Math.atan2(dz, dx); if (Math.abs(Math.sin(a*7)) > .9) col.offsetHSL(0, 0, .14*(1 - d/40)); }
    },
    rocks: { n: 160, color: 0x6f6a64 }, hills: { color: 0x8a857e },
    objects: [
      { id: 'freshcrater', em: '💥', obj: marker, pos: [16, -12], hitR: 8, view: { side: 14, height: 9, cy: 0, camDist: 26, phi: .9, labelY: 4 } },
      { id: 'scarp', em: '⛰️', obj: scarp, pos: [-24, -20], hitR: 8, view: { side: 16, height: 7, cy: 3, camDist: 30, labelY: 9 } },
    ],
    sunDest: { id: 'bigsun', em: '☀️' },
    takeoff: () => api.switchMode('mercury', () => {
      o.planet.localToWorld(api.ship.position.set(0, .35, .94).multiplyScalar(12*1.4)); api.ship.lookAt(0, 0, 0);
      api.setView({ follow: v => v.set(0, 0, 0), tDist: 60, phi: 1.15 });
    }),
  });

  return { planet: 'mercury', exploreLabel: 'exploreMercury', enter: o.enter, names, facts,
    modes: { mercury: o.mode, mercurySurface: surf.mode } };
}
