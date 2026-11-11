// Rangos articulares humanos: marca posturas imposibles (rodilla al revés, hiperextensión de cadera u hombro, muñeca rota...)
// Límites (grados, adulto entrenado; AAOS/ExRx): rodilla 0–155, cadera flexión ≤ 140 · extensión ≤ 30 · abducción ≤ 55,
// hombro extensión ≤ 65, codo 0–155, muñeca ≤ 80, cuello ≤ 60, giro del tronco ≤ 50
// uso: node romtest.js [clave:equipo,...]  (sin argumentos: toda la biblioteca)
require('./nodemodel.js');
const t = FORJA3D._test, P = t.P, T = THREE;
const list = process.argv[2] ? process.argv[2].split(',').map(c => c.split(':')[0]) : [...new Set(require('./combos_used.json').map(c => c.split(':')[0]))];
const deg = r => r * 180 / Math.PI;
const ang = (a, b) => deg(a.angleTo(b));
let bad = 0;
for (const k of list) {
  const d = P[k]; if (!d) { console.log(k, 'no existe'); continue; }
  const worst = {};
  const note = (name, v, ph) => { if (!worst[name] || v > worst[name][0]) worst[name] = [v, ph]; };
  for (let i = 0; i <= 40; i++) {
    const ph = i / 40, f = t.poseAt(d, ph).f, j = t.solve(f);
    const up = j.up, fwd = j.fwd, side = j.side;
    if (Math.abs(f.twist || 0) > 50) note('giro del tronco', Math.abs(f.twist) - 50, ph);
    if (Math.abs(f.head || 0) > 60) note('cuello', Math.abs(f.head) - 60, ph);
    for (const s of ['L', 'R']) {
      const sg = s === 'R' ? 1 : -1;
      // rodilla: flexión y sentido (la rodilla no puede doblarse hacia delante)
      const th = j.knee[s].clone().sub(j.hipJ[s]), sh = j.ank[s].clone().sub(j.knee[s]);
      const kf = ang(th, sh);
      if (kf > 155) note('rodilla ' + s + ' > 155°', kf - 155, ph);
      const n = th.clone().cross(sh);
      if (kf > 15 && n.dot(side) > 0.35 * n.length()) note('rodilla ' + s + ' al revés', kf, ph);
      // cadera: flexión / extensión / abducción respecto a la pelvis (marco del tronco)
      const tu = th.clone().normalize(), down = up.clone().negate();
      const fl = deg(Math.atan2(tu.dot(fwd), tu.dot(down))); // + flexión, − extensión
      const ab = deg(Math.asin(Math.max(-1, Math.min(1, tu.dot(side) * sg))));
      if (fl > 150) note('cadera ' + s + ' flexión > 150°', fl - 150, ph); // el tronco es rígido: incluye la flexión lumbar
      if (fl < -30 && ab < 30) note('cadera ' + s + ' extensión > 30°', -fl - 30, ph);
      if (ab > 55) note('cadera ' + s + ' abducción > 55°', ab - 55, ph);
      if (ab < -30) note('cadera ' + s + ' cruza > 30°', -ab - 30, ph);
      // hombro: extensión por detrás del cuerpo
      const ua = j.el[s].clone().sub(j.sho[s]).normalize(), fa = j.hand[s].clone().sub(j.el[s]);
      const ext = deg(Math.atan2(-ua.dot(fwd), -ua.dot(up)));
      if (ua.dot(fwd) < 0 && ua.dot(up) < 0.2 && ext > 65 && ext < 150 && ua.dot(side) * sg < 0.3) note('hombro ' + s + ' extensión > 65°', ext - 65, ph);
      const ef = ang(ua, fa);
      if (ef > 155) note('codo ' + s + ' > 155°', ef - 155, ph);
      if (j.handDir && j.handDir[s]) { const wr = ang(fa, j.handDir[s]); if (wr > 90) note('muñeca ' + s + ' > 90°', wr - 90, ph); } // con carga sobre la mano (flexiones) la muñeca llega a ~90°
    }
  }
  const keys = Object.keys(worst);
  if (keys.length) { bad++; console.log(k + ': ' + keys.map(q => q + ' (+' + worst[q][0].toFixed(0) + '°, fase ' + worst[q][1].toFixed(2) + ')').join(' | ')); }
}
console.log(bad ? 'POSTURAS A REVISAR: ' + bad : 'RANGOS HUMANOS OK');
