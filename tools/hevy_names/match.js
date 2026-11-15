// Reconocimiento por fichas: el mismo algoritmo que HevyImporter.tokens(_:) en Swift.
const V = require('./vocab.js');
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const sing = w => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) ? w.slice(0, -1) : w;
const stop = new Set(V.stop), equip = new Set(V.equip);
function tokens(title) {
  let n = ' ' + norm(title) + ' ';
  for (const [a, b] of V.phrases) n = n.split(' ' + a + ' ').join(' ' + b + ' ');
  const out = new Set();
  for (const w of n.split(' ')) {
    if (!w || stop.has(w)) continue;
    const own = k => Object.hasOwn(V.words, k) ? V.words[k] : undefined;
    const m = own(w) ?? own(sing(w)) ?? w;
    for (const t of m.split(' ')) if (t && !stop.has(t)) out.add(sing(t));
  }
  const all = [...out].sort();
  return { move: all.filter(t => !equip.has(t)).join(' '), eq: all.filter(t => equip.has(t)).join(' ') || '-' };
}
// candidatos = { equipo: ejercicio }. Sin equipo pedido: peso corporal, barra o el único; equipo que no existe: no se adivina.
function pick(c, eq) {
  if (!c) return null;
  if (c[eq]) return c[eq];
  const keys = Object.keys(c);
  if (eq === '-') return c['bodyweight'] ?? c['barbell'] ?? (keys.length === 1 ? c[keys[0]] : null);
  return c['-'] ?? null;
}
module.exports = { norm, tokens, pick };
