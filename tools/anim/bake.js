// Precalcula colisiones con la malla real y las guarda en forja3d.js (var BAKED = {...})
// - cojines/soportes fijos: se desplazan lo justo para que el cuerpo apoye sin hundirse (5 mm de compresión)
// - pesas sostenidas: desvío de la mano por fase para que la pesa roce el cuerpo sin atravesarlo
const fs = require('fs');
const F = 'C:/Users/sinbr/Desktop/2026/4.- Manual Diseño Operaciones + IA/Claude/Primer Proyecto/Forja-iOS/Resources/forja3d.js';
globalThis.FORJA3D_NO_BAKE = 1;
const load = require('./nodemodel.js');
const only = process.argv[2] ? process.argv[2].split(',') : null;
const combos = only || require('./combos.json');
const N = 21, COMP = 0.005;
load(() => {
  const T = THREE, V = (x, y, z) => new T.Vector3(x, y, z);
  const BAKED = {}, log = [];
  combos.forEach(it => {
    const [key, eq] = it.split(':');
    const st = FORJA3D.createStage(key, eq), d = st.def;
    let body = null; st.scene.traverse(o => { if (o.isSkinnedMesh && o.geometry.attributes.position.count > 5000) body = o; });
    const bones = body.skeleton.bones.map(b => b.name.replace(/^mixamorig[:_]?/, ''));
    const g = body.geometry, P = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, n = P.count;
    const dom = new Array(n);
    for (let i = 0; i < n; i++) { let best = 0, bw = -1; [[si.getX(i), sw.getX(i)], [si.getY(i), sw.getY(i)], [si.getZ(i), sw.getZ(i)], [si.getW(i), sw.getW(i)]].forEach(p => { if (p[1] > bw) { bw = p[1]; best = p[0]; } }); dom[i] = bones[best] || ''; }
    const isHand = dom.map(b => /Hand/.test(b)), side = dom.map(b => b.indexOf('Left') === 0 ? 'L' : (b.indexOf('Right') === 0 ? 'R' : ''));
    const isFore = dom.map(b => /ForeArm/.test(b));
    const phases = Array.from({ length: N }, (_, i) => i / (N - 1));
    const pos = new Float32Array(n * 3), v = new T.Vector3();
    function skin(ph) { st.update(ph); st.scene.updateMatrixWorld(true); for (let i = 0; i < n; i++) { v.fromBufferAttribute(P, i); body.boneTransform(i, v); v.applyMatrix4(body.matrixWorld); pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z; } return st.state.j; }
    function info(m) {
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      const s = new T.Vector3().setFromMatrixScale(m.matrixWorld);
      return { m, bb: m.geometry.boundingBox, s, inv: m.matrixWorld.clone().invert(), ty: m.geometry.type };
    }
    const lp = new T.Vector3();
    // penetración (m) de un punto en una pieza; devuelve también la profundidad por eje
    function penOf(o, x, y, z, out) {
      lp.set(x, y, z).applyMatrix4(o.inv); const b = o.bb;
      const dx = Math.min(lp.x - b.min.x, b.max.x - lp.x) * o.s.x, dy = Math.min(lp.y - b.min.y, b.max.y - lp.y) * o.s.y, dz = Math.min(lp.z - b.min.z, b.max.z - lp.z) * o.s.z;
      if (dx <= 0 || dy <= 0 || dz <= 0) return 0;
      let pen = Math.min(dx, dy, dz);
      if (/Cylinder/.test(o.ty)) { const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, r = (b.max.x - b.min.x) / 2; pen = Math.min((r - Math.hypot(lp.x - cx, lp.z - cz)) * o.s.x, dy); }
      else if (/Sphere/.test(o.ty)) { const c = b.getCenter(new T.Vector3()), r = (b.max.x - b.min.x) / 2; pen = (r - lp.distanceTo(c)) * o.s.x; }
      else if (/Tube|Torus|Circle|Plane/.test(o.ty)) return 0;
      if (out) { out.l = lp.clone(); }
      return pen > 0 ? pen : 0;
    }
    const meshes = st.state.meshList;
    // ---- piezas fijas
    const snap = ph => { st.update(ph); st.scene.updateMatrixWorld(true); return meshes.map(m => m.matrixWorld.elements.slice()); };
    const s0 = snap(0), s1 = snap(0.5), s2 = snap(0.77);
    const held = new Set(); (st.state.held || []).forEach(h => h.traverse(o => held.add(o)));
    const statics = [];
    meshes.forEach((m, idx) => {
      if (held.has(m) || !m.visible) return;
      const same = s0[idx].every((e, k) => Math.abs(e - s1[idx][k]) < 1e-6 && Math.abs(e - s2[idx][k]) < 1e-6);
      if (!same) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      const sz = m.geometry.boundingBox.getSize(new T.Vector3()).multiply(new T.Vector3().setFromMatrixScale(m.matrixWorld));
      if (sz.x > 6 || sz.z > 6) return;
      if (m.material && m.material.transparent && m.material.opacity < 0.5) return;
      if (m.userData && m.userData.noBake) return;
      if (/Box/.test(m.geometry.type)) statics.push({ idx, m, sz });
    });
    const need = statics.map(() => ({ plus: 0, minus: 0 }));
    const infos = () => statics.map(s => { s.m.updateMatrixWorld(true); return info(s.m); });
    let inf = infos();
    const axOf = o => { const e = [o.bb.max.x - o.bb.min.x, o.bb.max.y - o.bb.min.y, o.bb.max.z - o.bb.min.z].map((q, k) => q * [o.s.x, o.s.y, o.s.z][k]); return e.indexOf(Math.min(...e)); };
    inf.forEach((o, k) => { statics[k].ax = axOf(o); });
    phases.forEach(ph => {
      const j = skin(ph);
      // el cuerpo apoya por la cara del cojín que mira hacia la cadera
      const bodySide = inf.map((o, k) => { const c = ['x', 'y', 'z'][statics[k].ax]; const h = j.hip.clone().applyMatrix4(o.inv); return h[c] > (o.bb.min[c] + o.bb.max[c]) / 2 ? 1 : -1; });
      for (let i = 0; i < n; i++) {
        if (isHand[i] && j.handMode[side[i]] !== 'flat') continue;
        const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
        inf.forEach((o, si2) => {
          const out = {}; const p = penOf(o, x, y, z, out); if (!p) return;
          const c = ['x', 'y', 'z'][statics[si2].ax], sc = [o.s.x, o.s.y, o.s.z][statics[si2].ax];
          const bs = bodySide[si2];
          const deep = (bs > 0 ? o.bb.max[c] - out.l[c] : out.l[c] - o.bb.min[c]) * sc;
          if (deep > 0.12) return; // extremidad que pasa por el costado: no se resuelve moviendo el cojín
          if (bs > 0) need[si2].plus = Math.max(need[si2].plus, deep); else need[si2].minus = Math.max(need[si2].minus, deep);
        });
      }
    });
    const pads = [];
    statics.forEach((s, k) => {
      const nd = need[k], fromPlus = nd.plus >= nd.minus, amt = Math.max(nd.plus, nd.minus) - COMP;
      if (amt < 0.003) return;
      if (amt > 0.07) { log.push('  ' + it + ': cojín #' + s.idx + ' sin mover (contacto de canto, ' + (amt * 100).toFixed(1) + ' cm)'); return; }
      const shift = Math.min(amt, 0.07);
      const e = [V(1, 0, 0), V(0, 1, 0), V(0, 0, 1)][s.ax].applyQuaternion(s.m.quaternion).multiplyScalar((fromPlus ? -1 : 1) * shift);
      s.m.position.add(e);
      pads.push([s.idx, +e.x.toFixed(4), +e.y.toFixed(4), +e.z.toFixed(4)]);
      log.push(`  ${it}: cojín #${s.idx} (${s.sz.x.toFixed(2)}x${s.sz.y.toFixed(2)}x${s.sz.z.toFixed(2)}) movido ${(shift * 100).toFixed(1)} cm${amt > 0.07 ? ' (TOPE, revisar)' : ''}`);
    });
    // ---- pesas sostenidas
    let H = null;
    const barMode = eq === 'barbell' || (eq === 'machine' && d.smith);
    const items = (st.state.held || []);
    if (items.length && !barMode) {
      const who = items.length === 2 ? [['L'], ['R']] : items.map(() => d.load === 'handR' ? ['R'] : d.load === 'handL' ? ['L'] : ['L', 'R']);
      H = phases.map(() => [0, 0, 0, 0, 0, 0]);
      for (let pass = 0; pass < 7; pass++) {
        st._setHOff(H.map(r => r.map(x => Math.round(x))));
        let moved = 0;
        phases.forEach((ph, pi) => {
          const j = skin(ph);
          items.forEach((h, hi) => {
            const parts = []; h.traverse(o => { if (o.isMesh) { o.updateMatrixWorld(true); parts.push(info(o)); } });
            const hc = new T.Box3().setFromObject(h).getCenter(new T.Vector3());
            let best = 0; const cen = new T.Vector3(); let cn = 0;
            for (let i = 0; i < n; i++) {
              if (isHand[i]) continue;
              const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
              if (isFore[i] && who[hi].some(k => Math.hypot(x - j.hand[k].x, y - j.hand[k].y, z - j.hand[k].z) < 0.12)) continue;
              if (Math.hypot(x - hc.x, y - hc.y, z - hc.z) > 0.35) continue;
              let p = 0; parts.forEach(o => { p = Math.max(p, penOf(o, x, y, z)); });
              if (p > 0) { best = Math.max(best, p); cen.x += x; cen.y += y; cen.z += z; cn++; }
            }
            if (best > 0.003) {
              cen.multiplyScalar(1 / cn);
              const dir = hc.clone().sub(cen); if (dir.lengthSq() < 1e-8) dir.set(0, 0, 1);
              // mancuernas colgando a los costados: se apartan hacia fuera (brazos verticales), nunca hacia atrás
              if (d.load === 'hands' && items.length === 2 && (/^curl/.test(key) || key === 'chestSupportedRow' || key === 'walk' || key === 'curl' || key === 'calf' || key === 'lunge' || key === 'shrug' || key === 'deadlift' || key === 'rdl')) dir.set(0, 0, hc.z >= 0 ? 1 : -1);
              // elevaciones frontales: las mancuernas cuelgan delante de los muslos y se apartan hacia delante
              if ((key === 'frontRaise' || key === 'lateral') && items.length === 2) dir.copy(j.fwd).setY(0);
              dir.normalize();
              const add = dir.multiplyScalar((best + 0.004) * 1000);
              who[hi].forEach(k => { const o = k === 'L' ? 0 : 3; H[pi][o] += add.x; H[pi][o + 1] += add.y; H[pi][o + 2] += add.z; });
              moved++;
            }
          });
        });
        // suavizado temporal (sin reducir picos: máximo local y luego promedio)
        const Hs = H.map((r, i) => r.map((x, c) => { const a = H[Math.max(0, i - 1)][c], b = H[Math.min(N - 1, i + 1)][c]; const cand = [a, x, b]; return cand.reduce((m, q) => Math.abs(q) > Math.abs(m) ? q : m, 0); }));
        H = Hs.map((r, i) => r.map((x, c) => 0.25 * Hs[Math.max(0, i - 1)][c] + 0.5 * x + 0.25 * Hs[Math.min(N - 1, i + 1)][c]));
        if (!moved) break;
      }
      const mx = Math.max(...H.map(r => Math.max(...r.map(Math.abs))));
      if (mx < 2) H = null; else log.push(`  ${it}: manos desviadas hasta ${(mx / 10).toFixed(1)} cm`);
    }
    // ---- barras y agarres: rodean la cabeza / el cuerpo con holgura (o el cuerpo se aparta de una barra fija)
    let Bo = null;
    const armsBar = d.A && d.A.arms && d.A.arms.bar;
    const handleLoad = ['pulldown', 'pushdown', 'seatedRow', 'facePull'].indexOf(d.load) >= 0;
    const fixedBar = (d.scene || []).indexOf('pullFrame') >= 0;
    const doBar = key !== 'skullCrusher' && (!d.keys || d.bakeBar) && !armsBar && (fixedBar || handleLoad || (eq === 'barbell' && ['bar', 'handsFront', 'hands'].indexOf(d.load) >= 0));
    if (doBar) {
      const clrOf = pn => /Head|Neck/.test(pn) ? 0.042 : (/Spine|Hips|Shoulder|UpLeg|Leg$/.test(pn) ? 0.017 : 0);
      const clr = dom.map(clrOf);
      const Hb = phases.map(() => [0, 0, 0, 0, 0, 0]), Bb = phases.map(() => [0, 0]);
      const base = H ? H.map(r => r.slice()) : phases.map(() => [0, 0, 0, 0, 0, 0]);
      for (let pass = 0; pass < 9; pass++) {
        st._setHOff(base.map((r, i) => r.map((x, c) => Math.round(x + Hb[i][c]))));
        st._setBOff(Bb.map(r => r.map(x => Math.round(x))));
        let moved = 0;
        phases.forEach((ph, pi) => {
          const j = skin(ph);
          const a = j.hand.L.clone(), b = j.hand.R.clone(), ax = b.clone().sub(a).normalize();
          const ext = d.load === 'pulldown' ? 0.55 : 0.3;
          const A = a.clone().sub(ax.clone().multiplyScalar(ext)), B = b.clone().add(ax.clone().multiplyScalar(ext)), AB = B.clone().sub(A), L2 = AB.lengthSq();
          let worst = 0, wdir = null;
          for (let i = 0; i < n; i++) {
            if (!clr[i]) continue;
            const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
            if (Math.hypot(x - j.hand.L.x, y - j.hand.L.y, z - j.hand.L.z) < 0.11 || Math.hypot(x - j.hand.R.x, y - j.hand.R.y, z - j.hand.R.z) < 0.11) continue;
            const t = Math.max(0, Math.min(1, ((x - A.x) * AB.x + (y - A.y) * AB.y + (z - A.z) * AB.z) / L2));
            const cx = A.x + AB.x * t, cy = A.y + AB.y * t, cz = A.z + AB.z * t;
            const dd = Math.hypot(cx - x, cy - y, cz - z), viol = clr[i] - dd;
            if (viol > worst) worst = viol;
          }
          // la barra rodea el cuerpo por delante (en el press francés, hacia la coronilla)
          wdir = (key === 'skullCrusher' ? j.up.clone() : j.fwd.clone()); wdir.sub(ax.clone().multiplyScalar(wdir.dot(ax))).normalize();
          if (worst > 0.002) {
            const amt = (worst + 0.003) * 1000;
            if (fixedBar) { Bb[pi][0] -= wdir.x * amt; Bb[pi][1] -= wdir.y * amt; }
            else { [0, 3].forEach(o => { Hb[pi][o] += wdir.x * amt; Hb[pi][o + 1] += wdir.y * amt; Hb[pi][o + 2] += wdir.z * amt * 0; }); }
            moved++;
          }
        });
        const sm = (M2) => { const S = M2.map((r, i) => r.map((x, c) => [M2[Math.max(0, i - 1)][c], x, M2[Math.min(N - 1, i + 1)][c]].reduce((m, q) => Math.abs(q) > Math.abs(m) ? q : m, 0))); return S.map((r, i) => r.map((x, c) => 0.25 * S[Math.max(0, i - 1)][c] + 0.5 * x + 0.25 * S[Math.min(N - 1, i + 1)][c])); };
        const h2 = sm(Hb), b2 = sm(Bb); h2.forEach((r, i) => { Hb[i] = r; }); b2.forEach((r, i) => { Bb[i] = r; });
        if (!moved) break;
      }
      const mh = Math.max(...Hb.map(r => Math.max(...r.map(Math.abs)))), mb = Math.max(...Bb.map(r => Math.max(...r.map(Math.abs))));
      if (mh >= 2) { H = base.map((r, i) => r.map((x, c) => x + Hb[i][c])); log.push(`  ${it}: barra rodea el cuerpo, desvío hasta ${(mh / 10).toFixed(1)} cm`); }
      if (mb >= 2) { Bo = Bb; log.push(`  ${it}: cuerpo se aparta de la barra fija hasta ${(mb / 10).toFixed(1)} cm`); }
      st._setHOff(H ? H.map(r => r.map(x => Math.round(x))) : null); st._setBOff(null);
    }
    if (pads.length || H || Bo) BAKED[it] = Object.assign({}, pads.length ? { pads } : {}, H ? { h: H.map(r => r.map(x => Math.round(x))) } : {}, Bo ? { b: Bo.map(r => r.map(x => Math.round(x))) } : {});
  });
  let s = fs.readFileSync(F, 'utf8');
  s = s.replace(/var BAKED = [^\n]*; \/\/ se rellena/, 'var BAKED = ' + JSON.stringify(BAKED) + '; // se rellena');
  fs.writeFileSync(F, s);
  console.log(log.join('\n'));
  console.log('combinaciones con ajustes:', Object.keys(BAKED).length, '| tamaño', (JSON.stringify(BAKED).length / 1024).toFixed(1), 'KB');
});
