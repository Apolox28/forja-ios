// Pruebas v4: pies, barra-piernas, alcance de manos y colisiones cuerpo-equipo
const path = require('path'); const dir = process.argv[2];
global.THREE = require(path.join(dir, 'Resources', 'three.min.js')); globalThis.window = globalThis; global.requestAnimationFrame = () => {};
require(path.join(dir, 'Resources', 'forja3d.js'));
const F = globalThis.FORJA3D, THREE = global.THREE, C = F._test.C;
function segDist2D(p, a, b) { const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1e-9; let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2; t = Math.max(0, Math.min(1, t)); return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t)); }
const phases = Array.from({ length: 41 }, (_, i) => i / 40);
const only = process.argv[3] ? process.argv[3].split(',') : null;
const problems = [], rows = [];
const eqOf = { deadlift: 'barbell', rdl: 'barbell', row: 'barbell', squat: 'barbell', goodMorning: 'barbell', bench: 'barbell', incline: 'barbell', ohp: 'barbell', hipThrust: 'barbell', shrug: 'barbell', uprightRow: 'barbell', skullCrusher: 'barbell', preacherCurl: 'barbell',
  legPress: 'machine', legExt: 'machine', legCurl: 'machine', chestPress: 'machine', seatedCalf: 'machine', pulldown: 'cable', seatedRow: 'cable', facePull: 'cable', pushdown: 'cable', cableFly: 'cable', gluteKickback: 'cable', abduction: 'cable', rowErg: 'machine', swing: 'kettlebell' };
const floorPatterns = ['squat', 'frontSquat', 'deadlift', 'rdl', 'goodMorning', 'lunge', 'row', 'ohp', 'lateralRaise', 'frontRaise', 'uprightRow', 'curl', 'shrug', 'walk', 'jumpingJack', 'swing', 'jumpRope', 'facePull', 'pushdown', 'gluteKickback', 'abduction', 'cableFly', 'pushup', 'plank'];

// segmentos del cuerpo con radios algo menores que el real (se permite el contacto)
function bodySamples(j) {
  const out = [];
  function seg(a, b, r, n, name) { for (let i = 0; i <= n; i++) out.push({ p: a.clone().lerp(b, i / n), r, name }); }
  seg(j.hip, j.shoC, 0.095, 6, "tronco"); out.push({ p: j.head, r: 0.08, name: "cabeza" });
  ['L', 'R'].forEach(k => { seg(j.hipJ[k], j.knee[k], 0.058, 5, "muslo"+k); seg(j.knee[k], j.ank[k], 0.042, 5, "pierna"+k); seg(j.sho[k], j.el[k], 0.038, 3, "brazo"+k); seg(j.el[k], j.hand[k], 0.032, 3, "antebrazo"+k); });
  return out;
}
F.patterns.forEach(key => {
  if (only && !only.includes(key)) return;
  const st = F.createStage(key, eqOf[key] || 'dumbbell');
  let minFoot = 9, minBarLeg = 9, minBelt = 9, worstReach = 0, worstPen = 0, penWhere = '';
  st.scene.updateMatrixWorld(true);
  const obbs = st.state.solids.map(m => { m.updateMatrixWorld(true); m.geometry.computeBoundingBox(); return { inv: m.matrixWorld.clone().invert(), box: m.geometry.boundingBox, s: new THREE.Vector3().setFromMatrixScale(m.matrixWorld) }; });
  phases.forEach(ph => {
    st.update(ph); const j = st.state.j;
    ['L', 'R'].forEach(k => {
      const fu = j.footUp[k], fd = j.footDir[k], a = j.ank[k];
      const heel = a.clone().add(fu.clone().multiplyScalar(-C.ANK + 0.008)).add(fd.clone().multiplyScalar(-0.03));
      const toe = a.clone().add(fu.clone().multiplyScalar(-C.ANK + 0.012)).add(fd.clone().multiplyScalar(0.16));
      minFoot = Math.min(minFoot, heel.y, toe.y);
      if (key === 'run') minBelt = Math.min(minBelt, Math.min(heel.y, toe.y) - 0.14);
      if (j.tgt && j.tgt[k] && !j.tgt[k].straight) worstReach = Math.max(worstReach, j.hand[k].distanceTo(j.tgt[k].p));
    });
    if (['deadlift', 'rdl', 'row'].includes(key)) {
      const hm = j.hand.L.clone().add(j.hand.R).multiplyScalar(0.5);
      ['L', 'R'].forEach(k => { minBarLeg = Math.min(minBarLeg, segDist2D(hm, j.knee[k], j.ank[k]) - 0.06, segDist2D(hm, j.hipJ[k], j.knee[k]) - 0.085); });
    }
    // colisiones cuerpo-equipo
    bodySamples(j).forEach(s => {
      obbs.forEach(o => {
        const lp = s.p.clone().applyMatrix4(o.inv), b = o.box;
        const rx = s.r / o.s.x, ry = s.r / o.s.y, rz = s.r / o.s.z;
        const dx = Math.min(lp.x - (b.min.x - rx), (b.max.x + rx) - lp.x), dy = Math.min(lp.y - (b.min.y - ry), (b.max.y + ry) - lp.y), dz = Math.min(lp.z - (b.min.z - rz), (b.max.z + rz) - lp.z);
        if (dx > 0 && dy > 0 && dz > 0) { const pen = Math.min(dx * o.s.x, dy * o.s.y, dz * o.s.z); if (pen > worstPen) { worstPen = pen; penWhere = s.name + ', fase ' + ph.toFixed(2); } }
      });
    });
  });
  rows.push(`${key}: pie ${minFoot.toFixed(3)} | alcance ${worstReach.toFixed(3)} | choque ${worstPen.toFixed(3)}${minBarLeg < 9 ? ' | barra ' + minBarLeg.toFixed(3) : ''}${minBelt < 9 ? ' | cinta ' + minBelt.toFixed(3) : ''}`);
  if (floorPatterns.includes(key) && minFoot < -0.015) problems.push(`${key}: pie atraviesa el suelo (${minFoot.toFixed(3)})`);
  if (minBarLeg < -0.005) problems.push(`${key}: barra atraviesa la pierna (${minBarLeg.toFixed(3)})`);
  if (minBelt < -0.015) problems.push(`${key}: pie atraviesa la cinta (${minBelt.toFixed(3)})`);
  if (worstReach > 0.025) problems.push(`${key}: la mano no llega al agarre (${worstReach.toFixed(3)} m)`);
  if (worstPen > 0.02) problems.push(`${key}: el cuerpo atraviesa el equipo (${worstPen.toFixed(3)} m, ${penWhere})`);
});
console.log(rows.join('\n'));
console.log(problems.length ? '\nPROBLEMAS (' + problems.length + '):\n' + problems.join('\n') : '\nSIN PROBLEMAS');
