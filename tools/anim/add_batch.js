// Añade (o reemplaza) un lote de variantes en variants.js y su mapa de nombres
// uso: node add_batch.js variants_bN.js map_bN.json
const fs = require('fs');
const [, , vfile, mfile] = process.argv;
let v = fs.readFileSync('variants.js', 'utf8');
const add = fs.readFileSync(vfile, 'utf8');
const tag = '// lote ' + vfile;
const ti = v.indexOf(tag);
if (ti >= 0) {
  const nx = v.indexOf('\n  // lote ', ti + tag.length);
  v = v.slice(0, v.lastIndexOf('\n', ti)) + (nx >= 0 ? v.slice(nx) : '');
}
v = v.replace(/\s+$/, '') + '\n\n  ' + tag + '\n' + add;
fs.writeFileSync('variants.js', v);
const m = JSON.parse(fs.readFileSync('variants_map.json', 'utf8'));
Object.assign(m, JSON.parse(fs.readFileSync(mfile, 'utf8')));
fs.writeFileSync('variants_map.json', JSON.stringify(m, null, 2));
console.log('mapa:', Object.keys(m).length);
