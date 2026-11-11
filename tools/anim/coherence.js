// Comprueba que cada extremidad use el mismo modo (ik / rel / relC / ua / th / ball / bar...) en todas las poses
require('./nodemodel.js');
const P = FORJA3D._test.P;
const ARM = ['ik', 'rel', 'relC', 'temple', 'ua', 'bar', 'hold'], LEG = ['ik', 'rel', 'th', 'ball'];
function mode(o, list) { if (!o) return '-'; for (const m of list) if (o[m] != null) return m; return '?' + Object.keys(o).join('/'); }
function footMode(o) { if (!o) return '-'; return o.footRel != null ? 'rel' : (o.foot != null ? 'abs' : 'auto'); }
let bad = 0;
Object.keys(P).forEach(function (k) {
  const d = P[k], poses = d.keys ? d.keys.map(q => q[1]) : [d.A, d.B].filter(Boolean);
  if (!poses.length) return;
  const sig = {};
  poses.forEach(function (f) {
    ['L', 'R'].forEach(function (s) {
      const a = f['arms' + s] || f.arms, l = f['legs' + s] || f.legs;
      const e = { ['arm' + s]: mode(a, ARM), ['leg' + s]: mode(l, LEG), ['foot' + s]: footMode(l), ['hip']: f.hip ? f.hip.length : 0 };
      Object.keys(e).forEach(function (q) { (sig[q] = sig[q] || new Set()).add(e[q]); });
    });
  });
  const msgs = Object.keys(sig).filter(q => sig[q].size > 1 && !(q.startsWith('foot') && [...sig[q]].every(v => v !== 'rel') )).map(q => q + ': ' + [...sig[q]].join(' vs '));
  if (msgs.length) { bad++; console.log(k + ' -> ' + msgs.join(' | ')); }
});
console.log(bad ? 'INCOHERENTES: ' + bad : 'COHERENTE');
