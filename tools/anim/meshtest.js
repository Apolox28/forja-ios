// Colisiones con la malla real: vértices de la piel (ya deformados por el esqueleto) contra equipo fijo y pesas
// uso: node meshtest.js [patrón:equipo,...]
const load = require('./nodemodel.js');
const only = process.argv[2] ? process.argv[2].split(',') : null;
const combos = only || require('./combos.json');
load(() => {
  const T = THREE, out = [], probs = [];
  const v = new T.Vector3(), lp = new T.Vector3();
  combos.forEach(it => {
    const [key, eq] = it.split(':');
    const st = FORJA3D.createStage(key, eq);
    st.scene.updateMatrixWorld(true);
    const solids = new Set(st.state.solids || []);
    let body = null; st.scene.traverse(o => { if (o.isSkinnedMesh && o.geometry.attributes.position.count > 5000) body = o; });
    if (!body) { out.push(it + ': sin modelo'); return; }
    const bones = body.skeleton.bones.map(b => b.name.replace(/^mixamorig[:_]?/, ''));
    const g = body.geometry, P = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    // vértices de mano/antebrazo distal: pueden tocar agarres y pesas
    const handV = new Uint8Array(P.count), foreV = new Uint8Array(P.count);
    for (let i = 0; i < P.count; i++) {
      let best = 0, bw = -1; for (let c = 0; c < 4; c++) { const w = sw.getComponent ? sw.getComponent(i, c) : [sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)][c]; if (w > bw) { bw = w; best = [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)][c]; } }
      handV[i] = /Hand/.test(bones[best]) ? 1 : 0; foreV[i] = /ForeArm/.test(bones[best]) ? 1 : 0;
    }
    let worst = 0, where = '', worstFloor = 0, floorWhere = '';
    for (let f = 0; f <= 10; f++) {
      const ph = f / 10; st.update(ph); st.scene.updateMatrixWorld(true);
      const objs = [];
      st.scene.traverse(o => {
        if (!o.isMesh || o.isSkinnedMesh || !o.geometry || !o.visible) return;
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        const bb = o.geometry.boundingBox, sz = bb.getSize(new T.Vector3());
        const s = new T.Vector3().setFromMatrixScale(o.matrixWorld);
        if (sz.x * s.x > 6 || sz.z * s.z > 6) return; // suelo / fondo
        if (o.material && o.material.transparent && o.material.opacity < 0.5) return;
        objs.push({ o, inv: o.matrixWorld.clone().invert(), bb, s, solid: solids.has(o), name: o.name || (solids.has(o) ? 'equipo' : 'pesa') });
      });
      for (let i = 0; i < P.count; i += 2) {
        v.fromBufferAttribute(P, i); body.boneTransform(i, v); v.applyMatrix4(body.matrixWorld);
        if (v.y < worstFloor) { worstFloor = v.y; floorWhere = bones[si.getX(i)] + ' fase ' + ph.toFixed(1); }
        for (const ob of objs) {
          if (!ob.solid && handV[i]) continue; // la mano sí agarra pesas
          if (!ob.solid && foreV[i] && (v.distanceTo(st.state.j.hand.L) < (st.def.load === 'overhead' ? 0.2 : 0.12) || v.distanceTo(st.state.j.hand.R) < (st.def.load === 'overhead' ? 0.2 : 0.12))) continue; // muñeca junto al agarre (sobre la cabeza el disco inferior apoya en las muñecas)
          if (ob.solid && handV[i] && ob.grip) continue;
          lp.copy(v).applyMatrix4(ob.inv); const b = ob.bb;
          const dx = Math.min(lp.x - b.min.x, b.max.x - lp.x) * ob.s.x, dy = Math.min(lp.y - b.min.y, b.max.y - lp.y) * ob.s.y, dz = Math.min(lp.z - b.min.z, b.max.z - lp.z) * ob.s.z;
          if (dx > 0 && dy > 0 && dz > 0) {
            let pen = Math.min(dx, dy, dz);
            const ty = ob.o.geometry.type;
            if (/Cylinder/.test(ty)) { const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, r = (b.max.x - b.min.x) / 2; const rr = Math.hypot(lp.x - cx, lp.z - cz); pen = Math.min((r - rr) * ob.s.x, dy); }
            else if (/Sphere/.test(ty)) { const c = b.getCenter(new T.Vector3()), r = (b.max.x - b.min.x) / 2; pen = (r - lp.distanceTo(c)) * ob.s.x; }
            else if (/Tube|Torus/.test(ty)) pen = 0;
            if (pen <= 0) continue;
            if (pen > worst) { worst = pen; const wp = new T.Vector3().setFromMatrixPosition(ob.o.matrixWorld); const sz = ob.bb.getSize(new T.Vector3()).multiply(ob.s); where = (ob.solid ? 'equipo ' : 'pesa ') + (ob.o.geometry.type.replace('Geometry', '')) + ' [' + [sz.x, sz.y, sz.z].map(x => x.toFixed(2)).join('x') + ' en ' + [wp.x, wp.y, wp.z].map(x => x.toFixed(2)).join(',') + ']' + ', hueso ' + bones[si.getX(i)] + ', fase ' + ph.toFixed(1); }
          }
        }
      }
    }
    out.push(`${it}: choque ${(worst * 100).toFixed(1)} cm${worst > 0 ? ' (' + where + ')' : ''} | suelo ${(worstFloor * 100).toFixed(1)} cm${worstFloor < 0 ? ' (' + floorWhere + ')' : ''}`);
    if (worstFloor < -0.02) probs.push(`${it}: se hunde en el suelo ${(-worstFloor * 100).toFixed(1)} cm (${floorWhere})`);
    if (worst > 0.015) probs.push(`${it}: ${(worst * 100).toFixed(1)} cm (${where})`);
  });
  console.log(out.join('\n'));
  console.log(probs.length ? '\nATRAVIESA (' + probs.length + '):\n' + probs.join('\n') : '\nSIN CHOQUES');
});
