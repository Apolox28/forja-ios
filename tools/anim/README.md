# Herramientas de animación 3D (forja3d.js)

1. Escribe un lote en `variants_bN.js` y su mapa de nombres en `map_bN.json`.
2. Añádelo con `node add_batch.js variants_bN.js map_bN.json`, que reemplaza el lote si ya existe.
3. Aplícalo con `node apply_variants.js`: inserta el lote en `Resources/forja3d.js` y regenera `ExerciseAnimations.swift`.
4. Prueba: `node bake.js` (siempre el bake completo) y, después, `meshtest.js`, `physics_test2.js`, `coherence.js` y `headclear.js`.
5. Revisa a ojo en las dos vistas: `bash sheet.sh out.png "clave:equipo,..." "0,0.5" 1|2`.
6. Genera las miniaturas: `node make_thumbs.js .`, después `msedge --dump-dom thumbs3d.html` y por último extrae las imágenes a `Resources/thumbs`.
