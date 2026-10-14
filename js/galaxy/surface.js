/* ============================================================
   Generic "land on the surface" mode: bumpy ground with real
   crater dips, rocks, far hills, a sky (black with stars, or a
   coloured gradient with fog), a sun, an optional big body in
   the sky, and landmark objects you can fly to.
   ============================================================ */
export function buildSurface(api, c){
  const { THREE, LOW, rand, makeCanvas, canvasTexture, GLOW, hitMat } = api;
  const nm = id => api.nm(id), fact = id => api.fact(id);
  const group = new THREE.Group(); group.visible = false; api.scene.add(group);
  const black = !c.sky.colors;
  let fog = null;
  if (!black) {
    fog = new THREE.Fog(c.sky.fog, c.sky.near ?? 40, c.sky.far ?? 190);
    const cv = makeCanvas(4, 256), x = cv.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    c.sky.colors.forEach((col, i) => g.addColorStop(i/(c.sky.colors.length - 1), col));
    x.fillStyle = g; x.fillRect(0, 0, 4, 256);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16),
      new THREE.MeshBasicMaterial({ map: canvasTexture(cv), side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -2; group.add(sky);
  }

  /* sun */
  const SUN = new THREE.Vector3(...c.sun.pos);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: c.sun.color ?? 0xfff6e0, transparent: true, fog: false, depthWrite: false }));
  sun.scale.set(c.sun.size, c.sun.size, 1); sun.position.copy(SUN); group.add(sun);
  if (c.sun.halo) {
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: c.sun.halo, transparent: true, opacity: c.sun.haloOpacity ?? .45,
      blending: THREE.AdditiveBlending, fog: false, depthWrite: false }));
    h.scale.set(c.sun.size*3.2, c.sun.size*3.2, 1); h.position.copy(SUN); group.add(h);
  }
  group.add(new THREE.HemisphereLight(c.hemi[0], c.hemi[1], c.hemiI ?? 1.2));
  const sunLight = new THREE.DirectionalLight(0xfff4e8, c.sunI ?? 2.4);
  sunLight.position.copy(SUN).normalize().multiplyScalar(50); group.add(sunLight);

  /* ground with crater dips */
  const craters = [];
  for (let i = 0; i < (c.craters ?? 0); i++) {
    const a = rand(0, Math.PI*2), d = rand(14, 95), r = Math.random() < .2 ? rand(5, 9) : rand(1.5, 4);
    craters.push({ x: Math.cos(a)*d, z: Math.sin(a)*d, r, depth: r*.28 });
  }
  (c.bigCraters || []).forEach(k => craters.push({ x: k[0], z: k[1], r: k[2], depth: k[2]*.3 }));
  const hAmp = c.hAmp ?? 2.5;
  const heightAt = (x, z) => {
    const d = Math.hypot(x, z), k = Math.min(1, Math.max(0, (d - 18)/40));
    let h = k*hAmp*(Math.sin(x*.05)*1.2 + Math.sin(z*.07 + 1.3) + Math.sin((x + z)*.11)*.5) + Math.sin(x*.3)*Math.sin(z*.27)*.15;
    for (const cr of craters) {
      const dd = Math.hypot(x - cr.x, z - cr.z);
      if (dd < cr.r*1.6) {
        if (dd < cr.r) h -= cr.depth*(1 - (dd/cr.r)**2);
        h += cr.depth*.45*Math.exp(-(((dd - cr.r)/(cr.r*.22))**2));
      }
    }
    return h;
  };
  {
    const seg = LOW ? 70 : 110;
    const geo = new THREE.PlaneGeometry(320, 320, seg, seg); geo.rotateX(-Math.PI/2);
    const p = geo.attributes.position, cols = new Float32Array(p.count*3), col = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = heightAt(x, z);
      p.setY(i, y);
      const [hh, ss, ll] = c.ground;
      col.setHSL(hh + rand(-.01, .01), ss, ll + y*.015 + rand(-.035, .035));
      if (c.groundTint) c.groundTint(col, x, z, y);
      cols[i*3] = col.r; cols[i*3+1] = col.g; cols[i*3+2] = col.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    group.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
  }
  if (c.hills) {
    for (let i = 0; i < 14; i++) {
      const a = i/14*Math.PI*2 + rand(-.15, .15), r = rand(120, 150);
      const hill = new THREE.Mesh(new THREE.ConeGeometry(rand(18, 34), rand(c.hills.hmin ?? 10, c.hills.hmax ?? 24), 7),
        new THREE.MeshLambertMaterial({ color: c.hills.color, flatShading: true }));
      hill.position.set(Math.cos(a)*r, 2, Math.sin(a)*r); hill.rotation.y = rand(0, 3); group.add(hill);
    }
  }
  if (c.rocks) {
    const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: c.rocks.color, flatShading: true }),
      LOW ? Math.round(c.rocks.n*.6) : c.rocks.n);
    const o = new THREE.Object3D();
    for (let i = 0; i < rocks.count; i++) {
      let x, z; do { x = rand(-90, 90); z = rand(-90, 90); } while (Math.hypot(x, z) < 6);
      const s = Math.random() < .1 ? rand(.8, 1.5) : rand(.15, .55);
      o.position.set(x, heightAt(x, z) + s*.3, z); o.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3)); o.scale.set(s, s*rand(.5, .9), s);
      o.updateMatrix(); rocks.setMatrixAt(i, o.matrix);
    }
    group.add(rocks);
  }

  const pick = [];
  const dests = {}, order = [], labelFns = [];
  const SIDE = new THREE.Vector3(.55, 0, .83).normalize();

  /* landmarks */
  (c.objects || []).forEach(ob => {
    const [x, z] = ob.pos;
    ob.obj.position.set(x, heightAt(x, z) + (ob.lift || 0), z);
    group.add(ob.obj);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(ob.hitR ?? 3, 8, 6), hitMat);
    hit.position.y = ob.view.cy ?? 1.5; hit.userData.dest = ob.id; ob.obj.add(hit); pick.push(hit);
    const v = ob.view, P = ob.obj.position;
    dests[ob.id] = { name: () => nm(ob.id), em: ob.em,
      target: out => out.copy(P).addScaledVector(SIDE, v.side ?? 7).setY(P.y + (v.height ?? 4.5)),
      center: out => out.copy(P).setY(P.y + (v.cy ?? 1.5)),
      focus: out => out.copy(P).setY(P.y + (v.cy ?? 1.5)).addScaledVector(SIDE, (v.side ?? 7)*.3),
      camDist: v.camDist ?? 15, phi: v.phi ?? 1.15, fact: () => fact(ob.id), onArrive: ob.onArrive };
    order.push(ob.id);
    labelFns.push(add => add(nm(ob.id), out => out.copy(P).setY(P.y + (v.labelY ?? 5)), '', ob.id));
  });

  /* something to look up at: the sun itself, or a big planet/moon in the sky */
  const lookUp = (id, em, pos) => {
    const dir = pos.clone().setY(0).normalize();
    /* tilt the camera up toward the object, without dipping below the ground */
    const elev = Math.atan2(pos.y - 9, Math.hypot(pos.x, pos.z));
    const phi = Math.min(2.0, Math.PI/2 + elev*.85);
    dests[id] = { name: () => nm(id), em,
      target: out => out.copy(dir).multiplyScalar(-6).setY(3.5),
      center: out => out.copy(pos),
      focus: out => out.copy(dir).multiplyScalar(14).setY(9),
      camDist: 16, phi, thetaOff: .15, fact: () => fact(id) };
    order.push(id);
  };
  if (c.sunDest) { sun.userData.dest = c.sunDest.id; pick.push(sun); lookUp(c.sunDest.id, c.sunDest.em, SUN, c.sunDest.phi); }
  if (c.skyBody) {
    const b = c.skyBody, pos = new THREE.Vector3(...b.pos);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(b.r, 40, 28), new THREE.MeshLambertMaterial({ map: b.tex, fog: false }));
    mesh.position.copy(pos); if (b.tilt) mesh.rotation.z = b.tilt; group.add(mesh);
    if (b.ring) { const ring = b.ring(); ring.position.copy(pos); group.add(ring); }
    mesh.userData.dest = b.id; pick.push(mesh);
    lookUp(b.id, b.em, pos, b.phi);
    labelFns.push(add => add(nm(b.id), out => out.copy(pos).setY(pos.y + b.r + 6), '', b.id));
    b.mesh = mesh;
  }
  for (const id in (c.dests || {})) { dests[id] = c.dests[id]; order.push(id); }
  dests.takeoff = { name: () => api.T().flyUp, em: '🚀', action: c.takeoff };
  order.push('takeoff');

  function update(dt, t){
    (c.objects || []).forEach(ob => { if (ob.update) ob.update(dt, t, ob.obj); });
    if (c.skyBody) c.skyBody.mesh.rotation.y += dt*.02;
    if (c.update) c.update(dt, t);
  }
  function land(){
    api.switchMode(c.key, () => {
      api.ship.position.set(4, 9, 22); api.ship.lookAt(0, 0, 0);
      api.setView({ follow: o => o.set(0, 2, 0), target: [0, 2, 0], dist: 40, tDist: 30, phi: 1.2, theta: .5 });
      setTimeout(() => api.showRawCard(() => ({ icon: c.icon, title: nm(c.title), text: fact(c.title) })), 900);
    }, c.icon + ' ' + nm(c.title));
  }
  const mode = {
    group, fog, dist: [4, 120], shipScale: 1, flyDist: 18, noStars: !black, pick, update, dests, order,
    where: id => c.icon + ' ' + nm(c.place) + (id ? ' · ' + dests[id].name() : ''),
    labels: add => labelFns.forEach(f => f(add)),
  };
  return { group, mode, land, heightAt, dests, sun };
}
