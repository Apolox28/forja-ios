// Aplica las variantes: inserta variants.js en forja3d.js, genera ExerciseAnimations.swift y combos.json
const fs = require('fs'), path = require('path');
const ROOT = 'C:/Users/sinbr/Desktop/2026/4.- Manual Diseño Operaciones + IA/Claude/Primer Proyecto/Forja-iOS/';
const SP = __dirname;
// 1) motor
const F = ROOT + 'Resources/forja3d.js';
let s = fs.readFileSync(F, 'utf8');
const vjs = fs.readFileSync(path.join(SP, 'variants.js'), 'utf8');
const A = '  // <<VARIANTES', B = '  // VARIANTES>>';
if (s.indexOf(A) < 0) {
  const anchor = "  toeOut('squat', 15);";
  const i = s.indexOf(anchor); if (i < 0) throw new Error('ancla');
  const eol = s.indexOf('\n', s.indexOf('\n', i) + 1); // tras la línea de cam2
  s = s.slice(0, eol + 1) + A + '\n' + B + '\n' + s.slice(eol + 1);
}
s = s.slice(0, s.indexOf(A)) + A + '\n' + vjs.trimEnd() + '\n' + s.slice(s.indexOf(B));
fs.writeFileSync(F, s);
// 2) tabla Swift (nombre del ejercicio -> animación)
const map = JSON.parse(fs.readFileSync(path.join(SP, 'variants_map.json'), 'utf8'));
const keys = Object.keys(map).sort();
const swift = `import Foundation

// Generado: animación propia de cada ejercicio de la biblioteca (variante de su patrón de movimiento).
extension ExerciseSeed {
    static let animationByName: [String: String] = [
${keys.map(k => `        ${JSON.stringify(k)}: ${JSON.stringify(map[k])},`).join('\n')}
    ]

    /// Clave de animación: la variante del ejercicio o, si no tiene, su patrón de movimiento.
    static func animationKey(for exercise: Exercise) -> String {
        animationByName[exercise.name.lowercased()]
            ?? ExerciseMatcher.catalogName(for: exercise.name).flatMap { animationByName[$0.lowercased()] }
            ?? pattern(for: exercise).rawValue
    }
}
`;
fs.writeFileSync(ROOT + 'Sources/ExerciseAnimations.swift', swift);
// 3) combinaciones para miniaturas y pruebas (a partir del catálogo)
const seed = fs.readFileSync(ROOT + 'Sources/ExerciseSeed.swift', 'utf8');
const cat = seed.slice(seed.indexOf('static let catalog'));
const eqMap = { barbell: 'barbell', dumbbell: 'dumbbell', kettlebell: 'kettlebell', cable: 'cable', machine: 'machine', bodyweight: 'none', band: 'none', other: 'none' };
const combos = new Set(JSON.parse(fs.readFileSync(path.join(SP, 'combos.json'), 'utf8')));
const used = [];
for (const m of cat.matchAll(/\("([^"]+)", \.(\w+), \.(\w+), \.(\w+), \.(\w+)\)/g)) {
  const key = map[m[1].toLowerCase()] || m[5];
  const c = key + ':' + eqMap[m[3]];
  combos.add(c); used.push(c);
}
// ejercicios de Hevy añadidos (Resources/hevy_extra.json): mismo criterio de combinación
const hx = JSON.parse(fs.readFileSync(ROOT + 'Resources/hevy_extra.json', 'utf8'));
for (const x of hx) { const key = map[x.name.toLowerCase()] || x.pattern; const c = key + ':' + (eqMap[x.equipment] || 'none'); combos.add(c); used.push(c); }
fs.writeFileSync(path.join(SP, 'combos.json'), JSON.stringify([...combos]));
fs.writeFileSync(path.join(SP, 'combos_used.json'), JSON.stringify([...new Set(used)]));
console.log('variantes en el mapa:', keys.length, '| combinaciones:', combos.size, '| usadas por la biblioteca:', new Set(used).size);
