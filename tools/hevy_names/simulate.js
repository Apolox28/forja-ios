// Simula el importador (HevyImporter + ExerciseMatcher) sobre una lista de títulos de ejercicio.
// Uso: node tools/hevy_names/simulate.js archivo.csv|nombres.json   → imprime título → ejercicio de Forja [vía]
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const swift = fs.readFileSync(path.join(root, 'Sources/HevyImporter.swift'), 'utf8');
const nameMap = Object.fromEntries([...swift.matchAll(/^\s*"([^"]+)": "([^"]+)",$/gm)].map(x => [x[1], x[2]]));
for (const e of JSON.parse(fs.readFileSync(path.join(root, 'Resources/hevy_extra.json'), 'utf8'))) for (const h of e.hevy) nameMap[h.toLowerCase()] ??= e.name;
const H = JSON.parse(fs.readFileSync(path.join(root, 'Resources/hevy_names.json'), 'utf8')), hevy = H.exact, M = require('./match.js');
const concepts = JSON.parse(fs.readFileSync(path.join(root, 'Resources/exercise_concepts.json'), 'utf8'));
const EQ = [['barbell', ['barbell', 'barra', 'ez bar', 'olympic', 'olimpica']], ['dumbbell', ['dumbbell', 'mancuerna', 'db']],
  ['machine', ['machine', 'maquina', 'smith', 'hammer strength', 'iso lateral', 'isolateral', 'plate loaded']], ['cable', ['cable', 'polea']],
  ['band', ['band', 'banda', 'elastic', 'elastica', 'liga']], ['kettlebell', ['kettlebell', 'pesa rusa', 'kb']],
  ['bodyweight', ['bodyweight', 'peso corporal', 'sin peso', 'body weight', 'calistenia']]];
function has(n, ph) { const w = n.split(' '), p = norm(ph).split(' '); if (!p[0] || w.length < p.length) return false;
  for (let s = 0; s <= w.length - p.length; s++) if (p.every((x, j) => { const t = w[s + j]; return t === x || t === x + 's' || t === x + 'es' || (x.length >= 5 && t.startsWith(x)); })) return true; return false; }
function eqOf(n) { const pad = ' ' + n + ' '; for (const [e, ws] of EQ) for (const w of ws) if (pad.includes(' ' + w + ' ') || (w.length > 4 && n.includes(w))) return e; return null; }
function holds(c, n, eq) { return c.split('|').some(alt => alt.split('+').every(p => p.startsWith('eq:') ? (p.slice(3) === 'none' ? eq === null : eq === p.slice(3)) : has(n, p))); }
function matcher(t) { const n = norm(t), eq = eqOf(n);
  for (const c of concepts) { if (!c.alts.some(a => a.every(x => has(n, x)))) continue; if (c.not && c.not.some(x => has(n, x))) continue;
    for (const r of c.rules || []) if (r.length === 2 && holds(r[0], n, eq)) return r[1]; return c.name; } return null; }
function resolve(t) {
  if (Object.hasOwn(nameMap, t.toLowerCase())) return [nameMap[t.toLowerCase()], 'inglés'];
  if (Object.hasOwn(hevy, norm(t))) return [hevy[norm(t)], 'tabla'];
  const tk = M.tokens(t), byTok = M.pick(Object.hasOwn(H.moves, tk.move) ? H.moves[tk.move] : null, tk.eq); if (byTok) return [byTok, 'fichas'];
  const i = t.indexOf('('); if (i > 0 && hevy[norm(t.slice(0, i))]) return [hevy[norm(t.slice(0, i))], 'tabla sin equipo'];
  const m = matcher(t); return m ? [m, 'APROXIMADO'] : [t, 'NUEVO'];
}
module.exports = { resolve, norm };
if (require.main === module) {
  const f = process.argv[2], txt = fs.readFileSync(f, 'utf8');
  let names;
  if (f.endsWith('.json')) names = JSON.parse(txt);
  else { const rows = txt.split(/\r?\n/).map(l => (l.match(/("([^"]|"")*"|[^,]*)(,|$)/g) || []).map(c => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')));
    const ix = rows[0].indexOf('exercise_title'); names = [...new Set(rows.slice(1).filter(r => r[ix]).map(r => r[ix]))].sort(); }
  for (const t of names) { const [r, via] = resolve(t); console.log(t + '  →  ' + r + '  [' + via + ']'); }
}
