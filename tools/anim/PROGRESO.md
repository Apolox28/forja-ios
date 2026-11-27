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

## Ejercicios nuevos (desde el 22-11)

- **Lote 13** (15) y **lote 14** (9): 24 ejercicios nuevos con animación. La biblioteca pasa de 457 a 481.
- **Dónde se añaden:** las fichas van en `Resources/hevy_extra.json` (nombre, nombre en inglés, músculo, equipo, tipo, patrón, pasos y consejo); `map_bN.json` asigna cada nombre a su animación.
- **Cómo trabajar:**
  - Copia de trabajo de `main` en `../Forja-main`. La carpeta Forja-iOS es de otra sesión (rama `mejoras-entreno`): no tocarla.
  - Herramientas en el scratchpad, con dos scripts nuevos:
    - `node add_extras.js new_bN.json map_bN.json`: añade las fichas sin duplicar y escribe el mapa.
    - `node newlist.js new_bN.json`: saca la lista «clave:equipo» para las pruebas.
  - `sheet.sh` y las miniaturas lanzan Edge desde PowerShell; desde Git Bash no arranca.
- **Ojo:** `gw` es la distancia de cada mano al centro, no el ancho total del agarre.
- **Siguientes candidatos:**
  - remo Kroc;
  - peso muerto con déficit y con pausa;
  - press Bradford y press cubano;
  - elevación lateral inclinada;
  - curl de concentración en polea;
  - pronación y supinación de muñeca;
  - agarre de discos;
  - sentadilla con barra de seguridad;
  - zancada con déficit;
  - subida lateral al cajón;
  - gemelos sentado con mancuerna;
  - hip thrust con banda;
  - plancha Copenhague;
  - escaladores cruzados;
  - rotación externa tumbado.
