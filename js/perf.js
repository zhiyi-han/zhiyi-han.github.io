import * as THREE from 'three';

/* ============================================================
   Draw-call reducer: bakes every static, single-material,
   untextured, opaque mesh under `root` into one merged mesh per
   (material, castShadow, receiveShadow) bucket.

   opts.skip       Set of objects whose whole subtree is left alone
                   (animated things: rocket, ducks, flames, …)
   opts.stop       Set of child roots not to descend into
                   (e.g. zone groups that were merged separately)
   opts.skipTagged when true, meshes carrying userData.zone are
                   left alone so tap-to-open keeps working on
                   loose tagged meshes like signposts
   ============================================================ */
export function mergeStatic(root, opts={}){
  const skip=opts.skip||new Set(), stop=opts.stop||new Set();
  const buckets=new Map();
  root.updateWorldMatrix(true,true);
  const inv=new THREE.Matrix4().copy(root.matrixWorld).invert();
  const bake=new THREE.Matrix4();

  (function walk(o){
    if(o!==root && (skip.has(o) || stop.has(o))) return;
    if(o.isMesh) collect(o);
    for(const c of o.children.slice()) walk(c);
  })(root);

  function collect(o){
    const m=o.material;
    if(Array.isArray(m) || m.map || m.transparent) return;
    if(!(m.isMeshLambertMaterial || m.isMeshBasicMaterial || m.isMeshStandardMaterial)) return;
    if(opts.skipTagged && o.userData.zone) return;
    const key=m.uuid+'|'+(o.castShadow?1:0)+'|'+(o.receiveShadow?1:0);
    let b=buckets.get(key);
    if(!b){ b={mat:m,cast:!!o.castShadow,recv:!!o.receiveShadow,geos:[],src:[]}; buckets.set(key,b); }
    const g=o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    bake.multiplyMatrices(inv,o.matrixWorld);
    g.applyMatrix4(bake);
    b.geos.push(g); b.src.push(o);
  }

  let merged=0, removed=0;
  buckets.forEach(b=>{
    if(b.src.length<2) return;                    /* nothing to gain */
    const total=b.geos.reduce((s,g)=>s+g.attributes.position.count,0);
    const geo=new THREE.BufferGeometry();
    for(const name of ['position','normal','uv']){
      if(!b.geos.every(g=>g.attributes[name])) continue;
      const itemSize=b.geos[0].attributes[name].itemSize;
      const arr=new Float32Array(total*itemSize);
      let off=0;
      for(const g of b.geos){ arr.set(g.attributes[name].array,off); off+=g.attributes[name].array.length; }
      geo.setAttribute(name,new THREE.BufferAttribute(arr,itemSize));
    }
    const mesh=new THREE.Mesh(geo,b.mat);
    mesh.castShadow=b.cast; mesh.receiveShadow=b.recv;
    mesh.matrixAutoUpdate=false;
    if(root.userData.zone) mesh.userData.zone=root.userData.zone;
    root.add(mesh);
    b.src.forEach(o=>{ o.parent.remove(o); o.geometry.dispose(); removed++; });
    merged++;
  });
  return {merged, removed};
}
