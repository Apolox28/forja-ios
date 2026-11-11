// Distancia mínima entre la barra/agarre y la cabeza-cuello-tronco (malla real), fase por fase
const load = require('./nodemodel.js');
const combos = (process.argv[2] || 'pulldown:cable,pullup:none,ohp:barbell,skullCrusher:barbell,uprightRow:barbell,shrug:barbell,frontSquat:dumbbell,pushdown:cable,ohExt:dumbbell').split(',');
load(() => {
  const T = THREE;
  combos.forEach(it => {
    const [key, eq] = it.split(':');
    const st = FORJA3D.createStage(key, eq);
    let body; st.scene.traverse(o => { if (o.isSkinnedMesh && o.geometry.attributes.position.count > 5000) body = o; });
    const bones = body.skeleton.bones.map(b => b.name.replace(/^mixamorig[:_]?/, ''));
    const g = body.geometry, P = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    const part = new Array(P.count);
    for (let i = 0; i < P.count; i++) { let best = 0, bw = -1; [[si.getX(i), sw.getX(i)], [si.getY(i), sw.getY(i)], [si.getZ(i), sw.getZ(i)], [si.getW(i), sw.getW(i)]].forEach(p => { if (p[1] > bw) { bw = p[1]; best = p[0]; } }); part[i] = bones[best]; }
    const rows = [];
    let worst = { d: 9 };
    for (let f = 0; f <= 40; f++) {
      const ph = f / 40; st.update(ph); st.scene.updateMatrixWorld(true);
      const j = st.state.j;
      // segmentos de la carga: barra entre las manos (o mancuerna en hm)
      const a = j.hand.L.clone(), b = j.hand.R.clone();
      const dir = b.clone().sub(a); const L = dir.length(); dir.normalize();
      const ext = /pulldown/.test(key) ? 0.55 : 0.3; // la barra sobresale de las manos
      const A = a.clone().sub(dir.clone().multiplyScalar(ext)), B = b.clone().add(dir.clone().multiplyScalar(ext));
      const v = new T.Vector3();
      let best = 9, who = '';
      for (let i = 0; i < P.count; i += 2) {
        const pn = part[i]; if (/Hand|ForeArm/.test(pn)) continue;
        v.fromBufferAttribute(P, i); body.boneTransform(i, v); v.applyMatrix4(body.matrixWorld);
        if (v.distanceTo(j.hand.L) < 0.11 || v.distanceTo(j.hand.R) < 0.11) continue;
        const ab = B.clone().sub(A), t = Math.max(0, Math.min(1, v.clone().sub(A).dot(ab) / ab.lengthSq()));
        const d = v.distanceTo(A.clone().add(ab.multiplyScalar(t)));
        if (d < best) { best = d; who = pn; }
      }
      if (best < worst.d) worst = { d: best, ph, who };
      rows.push(best);
    }
    console.log(`${it}: mínima ${(worst.d * 100).toFixed(1)} cm (${worst.who}, fase ${worst.ph.toFixed(3)})  ${(/Head|Neck/.test(worst.who) ? worst.d < 0.03 : worst.d < 0.013) ? '<- ATRAVIESA' : 'ok'}`);
  });
});
