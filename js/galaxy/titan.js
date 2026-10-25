import { buildSurface } from './surface.js?v=6d9d6096';

/* Landing on Saturn's moon Titan: orange haze, a methane lake,
   the Huygens probe, slow-falling methane rain. */
export function createTitan(api, titanMesh, LD){
  const { THREE, rand, LOW, GLOW } = api;
  const names = {
    landTitan:['Land on Titan','登陸泰坦'], tiGround:['Titan','泰坦'],
    methanelake:['Methane Lake','甲烷湖'], huygens:['Huygens Probe','惠更斯號'], flyTitan:['Fly like a Bird','像小鳥一樣飛'],
  };
  const facts = {
    tiGround:["We landed on Titan! The air is thick and orange, and it's so cold that the pebbles here are made of ice.",
      "我們登陸泰坦了！這裡的空氣又厚又橙，冷到連地上的小石頭都是冰做的。"],
    methanelake:["This is a lake — but not of water! It's filled with liquid methane, the same gas people burn for cooking, turned into liquid by the freezing cold.",
      "這是一個湖——但裡面不是水！是液態的甲烷，就是人們煮飯用的那種氣體，在超級寒冷中變成了液體。"],
    huygens:["The Huygens probe landed on Titan in 2005 — the farthest place any spacecraft has ever landed!",
      "惠更斯號在 2005 年降落泰坦——是太空船降落過最遠的地方！"],
    flyTitan:["On Titan, raindrops are made of methane and fall slowly like snowflakes. The air is so thick and gravity so weak that you could fly by flapping wings strapped to your arms!",
      "泰坦的雨點是甲烷做的，會像雪花一樣慢慢飄下來。這裡空氣很厚、引力很弱，綁上翅膀拍一拍就可以飛起來！"],
  };

  const lake = (() => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CircleGeometry(30, 40),
      new THREE.MeshPhongMaterial({ color: 0x1a1a26, specular: 0xd08a40, shininess: 90 }));
    m.rotation.x = -Math.PI/2; g.add(m); return g;
  })();
  const huygens = (() => {
    const g = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1.4, 20, 12), new THREE.MeshLambertMaterial({ color: 0xe0dcd4 }));
    shell.scale.y = .45; shell.position.y = .6; g.add(shell);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.4, .12, 8, 24), new THREE.MeshLambertMaterial({ color: 0xc8742a }));
    rim.rotation.x = Math.PI/2; rim.position.y = .6; g.add(rim);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, .4, 12), new THREE.MeshLambertMaterial({ color: 0xd9a441 }));
    top.position.y = 1.1; g.add(top);
    g.scale.setScalar(1.5); return g;
  })();
  /* slow, big methane raindrops */
  const rainN = LOW ? 260 : 420, rainPos = new Float32Array(rainN*3);
  const rain = [...Array(rainN)].map(() => ({ x: rand(-40, 40), y: rand(0, 40), z: rand(-40, 30), sp: rand(1.6, 2.6) }));
  const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainPts = new THREE.Points(rainGeo, new THREE.PointsMaterial({ map: GLOW, color: 0xffd7a0, size: .5, transparent: true, opacity: .7, depthWrite: false }));

  const surf = buildSurface(api, {
    key: 'titanSurface', icon: '🟠', title: 'tiGround', place: 'titan',
    sky: { colors: ['#b8742e', '#d0893a', '#dfa055', '#e3aa5e', '#6e3e18'], fog: 0xc8873e, near: 10, far: 95 },
    sun: { pos: [-120, 80, -170], size: 26, color: 0xffd9a0, halo: 0xffb060, haloOpacity: .3 },
    sunI: 1.1, hemi: [0xffcf90, 0x4a2a14], hemiI: 1.5,
    ground: [.07, .42, .33], craters: 3, hAmp: 2.2,
    rocks: { n: 150, color: 0xd8c8b0 }, hills: { color: 0x8a5428 },
    objects: [
      { id: 'methanelake', em: '🌊', obj: lake, pos: [-34, -26], lift: .25, hitR: 14, view: { side: 26, height: 9, cy: 0, camDist: 38, phi: 1.1, labelY: 6 } },
      { id: 'huygens', em: '🛸', obj: huygens, pos: [7, -4], hitR: 3, view: { side: 7, height: 3.5, cy: 1, camDist: 11, labelY: 4 } },
    ],
    dests: {
      flyTitan: { name: () => api.nm('flyTitan'), em: '🕊️',
        target: out => out.set(0, 16, 10), center: out => out.set(0, 6, 0), focus: out => out.set(0, 10, 0),
        camDist: 22, phi: 1.3, fact: () => api.fact('flyTitan') },
    },
    update: dt => {
      rain.forEach((p, i) => {
        p.y -= dt*p.sp; if (p.y < 0) { p.y = 40; p.x = rand(-40, 40); p.z = rand(-40, 30); }
        rainPos[i*3] = p.x; rainPos[i*3+1] = p.y; rainPos[i*3+2] = p.z;
      });
      rainGeo.attributes.position.needsUpdate = true;
    },
    takeoff: () => api.switchMode('saturn', () => {
      titanMesh.getWorldPosition(api.ship.position).addScaledVector(LD, 9); api.ship.lookAt(0, 0, 0);
      api.setView({ tDist: 24, phi: 1.15 }); api.parkAt('titan');
    }),
  });
  surf.group.add(rainPts);

  return { names, facts, land: surf.land, modes: { titanSurface: surf.mode } };
}
