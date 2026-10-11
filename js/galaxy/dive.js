/* ============================================================
   Reusable "dive into a gas giant" scene: a sky gradient,
   cloud layers scrolling upward as we sink, lightning, a depth
   meter, and stage toasts. Planet-specific extras (diamond rain,
   a metallic ocean, …) hook in through onStage / extraUpdate.
   ============================================================ */
export function createDive(api, o){
  const { THREE, rand, makeCanvas, canvasTexture, softTex, LOW } = api;
  const group = new THREE.Group(); group.visible = false; api.scene.add(group);
  const fog = new THREE.Fog(o.fog, 12, 75);

  {
    const c = makeCanvas(4, 256), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    o.sky.forEach((col, i) => g.addColorStop(i / (o.sky.length - 1), col));
    x.fillStyle = g; x.fillRect(0, 0, 4, 256);
    group.add(new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16),
      new THREE.MeshBasicMaterial({ map: canvasTexture(c), side: THREE.BackSide, fog: false, depthWrite: false })));
  }
  const hemi = new THREE.HemisphereLight(o.hemi[0], o.hemi[1], 1.6); group.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d0, 1); sun.position.set(10, 30, 20); group.add(sun);

  const cloudTex = softTex();
  const clouds = [];
  for (let i = 0; i < (LOW ? 34 : 56); i++) {
    const tint = new THREE.Color(o.cloudColors[i % o.cloudColors.length]).offsetHSL(rand(-.02, .02), 0, rand(-.06, .06));
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, color: tint, transparent: true, opacity: rand(.45, .75), depthWrite: false }));
    const sc = rand(14, 30); s.scale.set(sc, sc * .7, 1);
    group.add(s); clouds.push(s);
  }
  const scatter = (s, y) => {
    let x, z; do { x = rand(-38, 38); z = rand(-38, 30); } while (Math.abs(x) < 5 && Math.abs(z) < 5);
    s.position.set(x, y, z);
  };

  const bolt = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 3), 3)),
    new THREE.LineBasicMaterial({ color: o.boltColor || 0xfffbe0, fog: false }));
  bolt.visible = false; group.add(bolt);

  let depth = 0, stage = 0, boltT = 2.5, boltLife = 0, shown = -1;

  function reset() {
    depth = 0; stage = 0; boltT = 2.5; boltLife = 0; shown = -1;
    clouds.forEach(s => scatter(s, rand(-70, 28)));
    if (o.onReset) o.onReset();
    setTimeout(() => api.toast(o.toasts()[0]), 800);
  }

  function update(dt, t) {
    depth += dt * (o.speed || 1100);
    const km = Math.round(depth / 100) * 100;
    if (km !== shown) { shown = km; api.setDepth(api.T().depth(km)); }
    const st = depth > o.stages[1] ? 2 : depth > o.stages[0] ? 1 : 0;
    if (st > stage) { stage = st; api.toast(o.toasts()[st]); if (o.onStage) o.onStage(st); }
    for (const s of clouds) { s.position.y += dt * 9; if (s.position.y > 30) scatter(s, s.position.y - 100); }
    if (stage >= 1) {
      boltT -= dt;
      if (boltT <= 0) {
        boltT = rand(1.6, 4.2); boltLife = .22;
        const arr = bolt.geometry.attributes.position.array;
        let x = rand(-30, 30), z = rand(-40, -15), y = 28;
        for (let i = 0; i < 14; i++) { arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z; x += rand(-3, 3); z += rand(-1.5, 1.5); y -= rand(3, 5.5); }
        bolt.geometry.attributes.position.needsUpdate = true;
        setTimeout(api.thunder, rand(120, 500));
      }
    }
    if (boltLife > 0) {
      boltLife -= dt; bolt.visible = boltLife > 0 && (boltLife > .16 || boltLife < .08);
      hemi.intensity = 1.6 + (bolt.visible ? 2.6 : 0);
    } else { bolt.visible = false; hemi.intensity = 1.6; }
    if (o.extraUpdate) o.extraUpdate(dt, t, depth, stage);
  }

  return { group, fog, reset, update };
}
