# Progreso de las animaciones 3D

Actualizado: 2026-11-13.

## Ejercicios extra de Hevy (`Resources/hevy_extra.json`)

**219 de 219 tienen animación.** Todos pasan las pruebas de choques, rangos humanos y coherencia.

| Lote | Grupo | Archivo |
|---|---|---|
| 8 | Pecho y hombros | `variants_b8.js` |
| 9 | Brazos y fondos | `variants_b9.js` |
| 10 | Espalda | `variants_b10.js` |
| 11 | Piernas y glúteos | `variants_b11.js` |
| 12 | Core, cuello, cardio y actividades | `variants_b12.js` |

Cada lote tiene un `map_bN.json` con los nombres de Hevy que usa.

## Reutilizan una animación parecida

Estos ejercicios usan la animación de otro movimiento casi igual. Se pueden hacer propios más adelante.

| Ejercicio | Animación que usa |
|---|---|
| Encogimientos en Smith | Encogimientos |
| Encogimientos en polea | Encogimientos |
| Glute ham raise | Curl nórdico |
| Hip thrust en Smith | Hip thrust |
| Sentadilla hack con barra | Sentadilla hack en máquina |
| Esquí | SkiErg |
| Calentamiento | Jumping jacks |
| Aeróbic | Jumping jacks |
| HIIT | Burpee |
| Crunch declinado | Sit-up en el suelo |
| Libélula | Dragon flag |

## Ahora: arreglar los pendientes de «revisar después»

Lo actualizo al terminar cada paso.

| Paso | Estado |
|---|---|
| 1. Prueba completa de las 504 combinaciones: salen 31 avisos en 26 ejercicios | ✅ |
| 2. Fondos en banco: hombro 27° más allá del límite | ✅ |
| 3. Natación: hombro 18° de más al final de la brazada (recobro más abierto, codo alto) | ✅ |
| 4. HSPU (muñeca +14°), fondos en el suelo (+5°), halo (+6°), curl inclinado (+4°) · spiderman (+5°) | ✅ |
| 5. Pesas que tocan el cuerpo: remo al mentón con mancuernas (3 cm), hip thrust a una pierna (2,5 cm), nórdico (1,7 cm), cuello con peso (1,6 cm) | ✅ |
| 6. Manos que no llegan: burpee, toques de hombro, navaja en TRX; cabeza del dragon flag | ✅ |
| 7. Pequeños (+0° a +3°): turkish get-up, frog pump, búlgara, flexión lateral, remo TRX, cargada, tirón de cargada, fondos, man maker, polea a una mano | ✅ |
| 8. Prueba completa otra vez: 0 avisos (504 combinaciones: sin choques, rangos humanos y coherencia OK) | ✅ |
| 9. Miniaturas, commit y push | ✅ |

## Cómo verlo

- Miniaturas: `Resources/thumbs`.
- Historial: `git log --oneline -- Resources/forja3d.js`.
- Pendientes de revisar: `tools/anim/REVISAR-DESPUES.md`.
