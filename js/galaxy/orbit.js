/* ============================================================
   Generic "planet up close" mode: a big textured planet in a
   tilted frame, orbiting moons, surface spots / poles / space
   viewpoints as destinations, plus a "back to Solar System" chip.
   Planet modules add their own extras through addDest().
   ============================================================ */
export function buildOrbit(api, c){
  const { THREE, LOW, sphere, hitMat } = api;
  const nm = id => api.nm(id), fact = id => api.fact(id);
  const R = c.R;
  const group = new THREE.Group(); group.visible = false; api.scene.add(group);
  const light = new THREE.DirectionalLight(0xfff4e0, c.light ?? 3.2); light.position.set(120, 40, 90); group.add(light);
  const LD = light.position.clone().normalize();
  const tilt = new THREE.Group(); tilt.rotation.set(...(c.tilt || [.1, 0, .2])); group.add(tilt);
  const pick = [];
  const planet = new THREE.Mesh(sphere(R, LOW ? 48 : 72), new THREE.MeshLambertMaterial({ map: c.tex }));
  planet.userData.dest = c.tapDest; tilt.add(planet); pick.push(planet);

  const dirOf = ([u, v]) => {
    const p = u*Math.PI*2, t = v*Math.PI;
    return new THREE.Vector3(-Math.cos(p)*Math.sin(t), Math.cos(t), Math.sin(p)*Math.sin(t));
  };
  const onPlanet = (dir, h, out) => planet.localToWorld(out.copy(dir).multiplyScalar(R*h));
  const _f = new THREE.Vector3();
  const dests = {}, order = [], labelFns = [];

  (c.spots || []).forEach(s => {
    let target, center, focus, phi = s.phi;
    if (s.pole) {
      const p = s.pole;
      target = out => tilt.localToWorld(out.set(0, p*R*1.5, R*.3));
      center = out => tilt.localToWorld(out.set(0, p*R, 0));
      focus = center; phi = phi ?? (p > 0 ? .5 : 2.55);
    } else if (s.space) {
      target = out => out.set(s.space[0]*R, s.space[1]*R, s.space[2]*R);
      center = out => out.set(0, 0, 0); focus = center;
    } else {
      const dir = dirOf(s.uv);
      target = out => onPlanet(dir, s.h ?? 1.45, out);
      center = out => onPlanet(dir, 1, out);
      focus = out => onPlanet(dir, 1.04, out);
    }
    dests[s.id] = { name: () => nm(s.id), em: s.em, target, center, focus, camDist: s.camDist ?? R*1.3 + 6, phi,
      thetaOff: s.thetaOff, fact: () => fact(s.id), onArrive: s.onArrive };
    order.push(s.id);
    if (s.label) labelFns.push(add => add(nm(s.id), out => { center(out); out.y += R*.12 + 1; return out; }, '', s.id));
  });

  const moons = {};
  (c.moons || []).forEach(m => {
    const g = new THREE.Group(); tilt.add(g);
    const mesh = m.mesh || new THREE.Mesh(sphere(m.r, 28), new THREE.MeshLambertMaterial({ map: m.tex }));
    mesh.userData.dest = m.id; g.add(mesh); pick.push(mesh);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(Math.max(m.r*2.3, 2.6), 8, 6), hitMat);
    hit.userData.dest = m.id; g.add(hit); pick.push(hit);
    const M = moons[m.id] = { g, mesh, r: m.r, d: m.d, sp: m.sp, a: m.a0 ?? 0, lift: m.lift || 0 };
    if (m.extra) m.extra(g, mesh, M);
    const center = out => mesh.getWorldPosition(out);
    const target = out => api.approachDir(center(out), m.r, LD, out);
    dests[m.id] = { name: () => nm(m.id), em: m.em, target, center,
      focus: out => { target(_f); return center(out).lerp(_f, .3); }, camDist: m.camDist ?? m.r*5 + 6,
      fact: () => fact(m.id), onArrive: m.onArrive };
    order.push(m.id);
    labelFns.push(add => add(nm(m.id), out => { center(out); out.y += m.r*1.5 + .6; return out; }, '', m.id));
  });

  dests.back = { name: () => api.T().toSolar, em: '☀️', action: () => api.backToSolar(c.planet) };
  order.push('back');
  function addDest(id, d, label){
    dests[id] = d;
    order.splice(order.length - 1, 0, id);
    if (label) labelFns.push(label);
  }

  function update(dt, t){
    planet.rotation.y += dt*(c.spin ?? .03);
    for (const id in moons) {
      const M = moons[id]; M.a += M.sp*dt*.3;
      M.g.position.set(Math.cos(M.a)*M.d, Math.sin(M.a)*M.lift, Math.sin(M.a)*M.d);
    }
    if (c.update) c.update(dt, t);
  }
  function enter(){
    api.switchMode(c.key, () => {
      api.ship.position.set(0, R*.55, R*5.6); api.ship.lookAt(0, 0, 0);
      api.setView({ follow: o => o.set(0, 0, 0), target: [0, 0, 0], dist: R*7.5, tDist: R*(c.viewMul ?? 6.2), phi: 1.2, theta: .3 });
      api.bigMsg(c.icon + ' ' + nm(c.planet), 1800);
      setTimeout(() => api.toast(api.L() ? `點一個地方，開始${nm(c.planet)}探險！` : `Tap a place to explore ${nm(c.planet)}!`), 1500);
    });
  }
  const mode = {
    group, dist: [4, c.maxDist ?? R*14], shipScale: 1, pick, update, dests, order,
    where: id => c.icon + ' ' + nm(c.planet) + (id ? ' · ' + dests[id].name() : ''),
    labels: add => labelFns.forEach(f => f(add)),
  };
  return { group, tilt, planet, R, LD, dests, order, onPlanet, dirOf, moons, pick, mode, enter, addDest };
}
