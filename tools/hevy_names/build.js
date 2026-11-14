// Genera Resources/hevy_names.json: nombre de Hevy (inglés o español, normalizado) → ejercicio de Forja.
// Uso: node tools/hevy_names/build.js   (desde Forja-iOS). Traducciones en es_table.js.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..'), T = require('./es_table.js');
const swift = fs.readFileSync(path.join(root, 'Sources/HevyImporter.swift'), 'utf8');
const base = [...swift.matchAll(/^\s*"([^"]+)": "([^"]+)",$/gm)].map(x => [x[1], x[2]]);
const extra = JSON.parse(fs.readFileSync(path.join(root, 'Resources/hevy_extra.json'), 'utf8'));
const all = base.concat(extra.flatMap(e => e.hevy.map(h => [h.toLowerCase(), e.name])));
// Igual que ExerciseMatcher.normalize: sin tildes, minúsculas, solo letras y números separados por un espacio
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const split = en => { const r = en.match(/^(.*?)\s*\(([^)]*)\)\s*$/); return r ? [r[1], r[2]] : [en, null]; };
const out = {}, missing = [];
// prioridad: 0 inglés exacto, 1 traducción exacta, 2 nombre sin equipo (si es ambiguo, el de barra)
function put(k, v, p) { k = norm(k); if (k && !(out[k] && out[k].p <= p)) out[k] = { v, p }; }
for (const [en, f] of all) put(en, f, 0);
for (const [en, f] of all) {
  const [b, e] = split(en), es = T.bases[b];
  if (!es || (e && !T.equipment[e])) { missing.push(en); continue; }
  for (const x of es) e ? T.equipment[e].forEach(q => put(x + ' ' + q, f, 1)) : put(x, f, 1);
}
const byBase = {};
for (const [en, f] of all) { const [b, e] = split(en); if (e) (byBase[b] = byBase[b] || []).push([e, f]); }
for (const b in byBase) {
  const v = byBase[b], pick = v.find(x => x[0] === 'barbell') || (v.length === 1 ? v[0] : null);
  if (pick) [b].concat(T.bases[b] || []).forEach(x => put(x, pick[1], 2));
}
if (missing.length) { console.error('Sin traducción:', missing.join(' | ')); process.exit(1); }
const flat = {}; for (const k of Object.keys(out).sort()) flat[k] = out[k].v;
fs.writeFileSync(path.join(root, 'Resources/hevy_names.json'), JSON.stringify(flat));
// Comprobación: cada nombre inglés de Hevy da su ejercicio, y unos títulos en español típicos
const check = { 'Press de Banca (Barra)': 'bench press (barbell)', 'Jalón al Pecho (Polea)': 'lat pulldown (cable)', 'Sentadilla (Barra)': 'squat (barbell)',
  'Curl de Bíceps (Mancuerna)': 'bicep curl (dumbbell)', 'Peso Muerto Rumano (Barra)': 'romanian deadlift (barbell)', 'Elevación Lateral (Mancuerna)': 'lateral raise (dumbbell)',
  'Prensa de Piernas (Máquina)': 'leg press (machine)', 'Dominadas': 'pull up', 'Remo Sentado en Polea': 'seated cable row - v grip (cable)' };
const nm = Object.fromEntries(all);
let bad = all.filter(([en, f]) => flat[norm(en)] !== f).map(([en]) => en);
for (const [es, en] of Object.entries(check)) if (nm[en] !== undefined && flat[norm(es)] !== nm[en]) bad.push(es + ' → ' + flat[norm(es)] + ' (esperado ' + nm[en] + ')');
if (bad.length) { console.error('FALLA:', bad.join(' | ')); process.exit(1); }
console.log('hevy_names.json:', Object.keys(flat).length, 'nombres →', new Set(Object.values(flat)).size, 'ejercicios. OK');
