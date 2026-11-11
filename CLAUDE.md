# Forja iOS — reglas para Claude

App iOS 15 de entrenamiento (tipo Hevy, se instala con TrollStore). Responder en español, directo.

## Animaciones 3D (ahorro de tokens)
- `Resources/forja3d.js` pesa ~300 KB (three.js **r149** + `body.glb`). **Nunca leerlo entero**: buscar la función o clave con Grep y leer solo ese rango.
- `tools/anim/variants*.js` también son grandes: leer solo el lote que se toca.
- No actualizar three.js ni pasar a WebGPU/TSL aunque las skills de three.js lo sugieran.
- Pipeline en `tools/anim/README.md`: lote `variants_bN.js` + `map_bN.json` → `node add_batch.js` → `node apply_variants.js` → `node bake.js` (siempre completo).
- Orden de verificación: primero las pruebas numéricas (`bash tools/anim/check1.sh "clave:equipo"`); **solo cuando pasen**, un render con `sheet.sh` en las dos vistas. No renderizar para depurar lo que las pruebas ya detectan.
- Revisar una hoja de render una vez por intento, a escala reducida.
- Imprimir solo resúmenes (PASS/FAIL y el valor que falla), no volcar la salida completa de las pruebas.

## Calidad exigida (no negociable)
Movimiento humanamente posible (sin hombros, codos ni rodillas que "exploten"), técnica real, músculos bien pintados, cero clipping ni pies bajo el suelo, ambas vistas. Verificar y corregir cada animación antes de pasar a la siguiente. Pendientes viejos en `tools/anim/REVISAR-DESPUES.md`.

## Git
- Push con `git -c http.sslBackend=schannel push` (Avast intercepta HTTPS).
- Otra sesión publica las versiones (compilaciones > 32): avisarle cuando se empujen animaciones; no tocar `forja3d.js` desde la sesión del importador sin avisar.
