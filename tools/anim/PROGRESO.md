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

## Cómo verlo

- Miniaturas: `Resources/thumbs`.
- Historial: `git log --oneline -- Resources/forja3d.js`.
- Pendientes de revisar: `tools/anim/REVISAR-DESPUES.md`.
