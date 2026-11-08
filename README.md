# Forja — registro de entrenamientos para iOS 15+

App propia para registrar entrenamientos de gimnasio. Todas las funciones incluidas, sin suscripción, sin anuncios y sin cuenta. Idiomas: español e inglés (según el idioma del iPhone, o en Ajustes → Forja → Idioma).

## Funciones

- **Entrenamiento en vivo**: series con peso/reps, columna «Anterior» (lo que hiciste la última vez), marcar series ✓ (rellena con lo anterior si lo dejas vacío), tipos de serie (calentamiento, drop set, al fallo), RPE, notas por ejercicio y por entrenamiento, superseries, reordenar ejercicios, minimizar y reanudar.
- **Temporizador de descanso** automático al completar una serie, con ±15 s, configurable por ejercicio, y notificación aunque la app esté en segundo plano.
- **Rutinas** con carpetas, duplicar, editar, y **programas predefinidos** (cuerpo completo, torso/pierna, empuje/tirón/pierna, en casa).
- **Historial** con buscador, **calendario** mensual, editar entrenamientos pasados, repetir, guardar como rutina y compartir el resumen.
- **Récords personales (PR)** automáticos, resumen al terminar.
- **Ejercicios**: más de 70 incluidos y personalizados; por cada uno, 1RM estimado, peso máximo, mejor serie, mejor peso por repeticiones, gráfica de progreso e historial.
- **Progreso**: volumen y entrenamientos por semana, series por músculo, racha semanal, objetivo semanal y medidas corporales con gráfica.
- **Herramientas**: calculadora de 1RM, calculadora de discos y calculadora de series de calentamiento.
- **Datos**: importar el CSV de Hevy, exportar en CSV, copia de seguridad JSON (a iCloud Drive, Google Drive, correo…) y restaurarla.

> No incluye funciones que necesitan un servidor (red social o sincronización en la nube): todo se guarda en tu iPhone. Usa la copia de seguridad.

## Pasar tus datos desde Hevy

1. En Hevy: **Perfil → Ajustes → Exportar e importar datos → Exportar entrenamientos**. Guarda el `.csv` en Archivos o en Google Drive.
2. En Forja: **Perfil → Importar CSV de Hevy** y elige el archivo.

Los ejercicios más comunes se emparejan con los de Forja. El resto se crea como ejercicio personalizado; puedes editarlos después.

## Cómo obtener el .ipa (sin Mac)

Un `.ipa` solo se puede compilar con Xcode en macOS. GitHub te presta un Mac gratis:

1. Crea una cuenta en github.com y un **repositorio nuevo** (puede ser privado).
2. Sube **todo el contenido de esta carpeta** (incluida la carpeta oculta `.github`). Puedes arrastrarlo en «Add file → Upload files», o con GitHub Desktop.
3. Ve a la pestaña **Actions**. El flujo «Compilar IPA» se ejecuta solo (o pulsa «Run workflow»). Tarda unos 5–10 minutos.
4. Cuando termine con ✓ verde, entra en la ejecución y descarga el artefacto **Forja-ipa** (un .zip que contiene `Forja.ipa`).

Si sale ❌ rojo, copia el error del registro y pásamelo para corregirlo.

## Instalar en el iPhone (iOS 15)

El `.ipa` sale **sin firmar**. Elige una opción:

- **TrollStore** (si tu iPhone con iOS 15 es compatible): instalación permanente, no caduca.
- **Sideloadly** (Windows): conecta el iPhone por cable, arrastra el `.ipa` e inicia sesión con tu Apple ID. Con un Apple ID gratuito, la app **caduca a los 7 días** y hay que volver a instalarla (los datos se conservan si usas el mismo Apple ID).
- **AltStore**: igual que Sideloadly, y se renueva sola por Wi‑Fi.

Después ve a Ajustes → General → VPN y gestión de dispositivos y confía en tu perfil de desarrollador.

## Licencia y aviso

Código bajo licencia MIT (ver `LICENSE`).

**Aviso:** Forja es un proyecto independiente. No está afiliado, patrocinado ni respaldado por Hevy ni por ninguna otra aplicación. Los nombres mencionados pertenecen a sus respectivos dueños y solo se usan para describir la compatibilidad de importación.

## Estructura

- `project.yml`: definición del proyecto (XcodeGen genera el `.xcodeproj`).
- `Sources/`: código SwiftUI (iOS 15.0 como mínimo).
- `Sources/en.lproj/Localizable.strings`: traducción al inglés.
- `.github/workflows/build-ipa.yml`: compilación automática del `.ipa`.
