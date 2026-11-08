// Forja — motor de animación de ejercicios.
// FORJA.draw(ctx, sizePx, pattern, equipment, phase0to1, muscleOverride?)
// FORJA.animate(canvas, pattern, equipment, periodMs?, muscleOverride?)
(function (global) {
  'use strict';
  var L = { torso: 0.27, ua: 0.14, fa: 0.13, th: 0.19, sh: 0.19, foot: 0.07 };
  var GROUND = 0.885;
  function rad(a) { return a * Math.PI / 180; }
  function D(a) { return [Math.sin(rad(a)), Math.cos(rad(a))]; }
  function add(p, v, s) { return [p[0] + v[0] * s, p[1] + v[1] * s]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function len(v) { return Math.hypot(v[0], v[1]); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  var COL = {
    skin: '#f4f5f7', skinFar: '#c3c8d1', line: 'rgba(40,44,54,0.55)', bg1: '#262830', bg2: '#15161b',
    floor: 'rgba(255,255,255,0.05)', metal: '#a3aab6', metalDark: '#59606d', plate: '#2a2d35',
    plateRim: '#565d6a', pad: '#3a4050', padTop: '#4a5163', accent: '#ff8a3d',
    primary: 'rgba(232,58,58,0.82)', secondary: 'rgba(250,140,60,0.62)', cable: '#dfe3ea'
  };

  // =====================================================================
  //  PATRONES
  //  view: 'side' (defecto) o 'front'
  //  frames: [A, B]  A = inicio, B = posición de trabajo
  //  p / s: músculos principales / secundarios
  //  load: dónde va la carga  ·  scene: soportes fijos  ·  stack: torre de pesas
  // =====================================================================
  var P = {
    // ---------- Piernas ----------
    squat: { p: ['quads', 'glutes'], s: ['hams', 'lowback', 'abs'], load: 'shoulders', scene: ['rack'], smith: true,
      frames: [{ anchor: 'feet', ax: 0.5, ay: 0.86, torso: 8, ua: -40, fa: 170, th: 0, sh: 0 },
               { anchor: 'feet', ax: 0.5, ay: 0.86, torso: 40, ua: -15, fa: 165, th: 84, sh: -32 }] },
    frontSquat: { p: ['quads'], s: ['glutes', 'abs'], load: 'chest',
      frames: [{ anchor: 'feet', ax: 0.5, ay: 0.86, torso: 4, ua: 35, fa: 175, th: 0, sh: 0 },
               { anchor: 'feet', ax: 0.5, ay: 0.86, torso: 22, ua: 55, fa: 178, th: 88, sh: -32 }] },
    lunge: { p: ['quads', 'glutes'], s: ['hams'], load: 'hands', smith: true,
      frames: [{ anchor: 'hip', ax: 0.5, ay: 0.47, torso: 0, ua: 0, fa: 0, th: 15, sh: 0, th2: -12, sh2: -15 },
               { anchor: 'hip', ax: 0.5, ay: 0.6, torso: 0, ua: 0, fa: 0, th: 82, sh: -5, th2: -25, sh2: -88 }] },
    legPress: { p: ['quads', 'glutes'], s: ['hams'], load: 'machine', scene: ['legPressFrame'],
      frames: [{ anchor: 'hip', ax: 0.42, ay: 0.72, torso: -55, ua: 30, fa: 60, th: 150, sh: 60 },
               { anchor: 'hip', ax: 0.42, ay: 0.72, torso: -55, ua: 30, fa: 60, th: 115, sh: 110 }] },
    legExt: { p: ['quads'], load: 'machine', stack: true, scene: ['seatBack'],
      frames: [{ anchor: 'hip', ax: 0.42, ay: 0.6, torso: -12, ua: 15, fa: 40, th: 88, sh: 5 },
               { anchor: 'hip', ax: 0.42, ay: 0.6, torso: -12, ua: 15, fa: 40, th: 88, sh: 88 }] },
    legCurl: { p: ['hams'], s: ['calves'], load: 'machine', stack: true, scene: ['legCurlBench'],
      frames: [{ anchor: 'hip', ax: 0.44, ay: 0.6, torso: -92, prone: true, ua: -10, fa: -80, th: 92, sh: 92 },
               { anchor: 'hip', ax: 0.44, ay: 0.6, torso: -92, prone: true, ua: -10, fa: -80, th: 92, sh: 190 }] },
    calf: { p: ['calves'], load: 'hands', stack: true, scene: ['calfBlock'],
      frames: [{ anchor: 'toes', ax: 0.585, ay: 0.845, torso: 0, ua: 0, fa: 0, th: 0, sh: 0, foot: 70 },
               { anchor: 'toes', ax: 0.585, ay: 0.845, torso: 0, ua: 0, fa: 0, th: 0, sh: 0, foot: 140 }] },
    seatedCalf: { p: ['calves'], load: 'machine', stack: true, scene: ['seatLow', 'calfBlockSeated'],
      frames: [{ anchor: 'toes', ax: 0.66, ay: 0.82, torso: 0, ua: 40, fa: 90, th: 90, sh: 0, foot: 75 },
               { anchor: 'toes', ax: 0.66, ay: 0.82, torso: 0, ua: 40, fa: 90, th: 84, sh: 0, foot: 140 }] },
    hipThrust: { p: ['glutes'], s: ['hams', 'quads'], load: 'hip', stack: true, scene: ['lowBench'],
      frames: [{ anchor: 'feet', ax: 0.74, ay: 0.86, torso: -60, ua: 120, fa: 110, th: 50, sh: -12 },
               { anchor: 'feet', ax: 0.74, ay: 0.86, torso: -95, ua: 150, fa: 120, th: 90, sh: 0 }] },
    gluteKickback: { p: ['glutes'], s: ['hams'], load: 'ankle', stack: true, scene: ['mat'],
      frames: [{ anchor: 'hip', ax: 0.6, ay: 0.6, torso: -90, prone: true, ua: 0, fa: 0, th: 0, sh: 90, th2: 0, sh2: 90 },
               { anchor: 'hip', ax: 0.6, ay: 0.6, torso: -90, prone: true, ua: 0, fa: 0, th: 115, sh: 160, th2: 0, sh2: 90 }] },
    // ---------- Bisagra ----------
    deadlift: { p: ['glutes', 'hams', 'lowback'], s: ['quads', 'traps', 'forearms', 'lats'], load: 'hands',
      frames: [{ anchor: 'feet', ax: 0.48, ay: 0.86, torso: 60, ua: 4, fa: 0, th: 58, sh: -24 },
               { anchor: 'feet', ax: 0.48, ay: 0.86, torso: 2, ua: 0, fa: 0, th: 0, sh: 0 }], liftAt: 1 },
    rdl: { p: ['hams', 'glutes'], s: ['lowback'], load: 'hands',
      frames: [{ anchor: 'feet', ax: 0.48, ay: 0.86, torso: 2, ua: 0, fa: 0, th: 0, sh: 0 },
               { anchor: 'feet', ax: 0.48, ay: 0.86, torso: 80, ua: 6, fa: 3, th: 26, sh: -6 }] },
    goodMorning: { p: ['hams', 'lowback'], s: ['glutes'], load: 'shoulders',
      frames: [{ anchor: 'feet', ax: 0.48, ay: 0.86, torso: 2, ua: -40, fa: 170, th: 0, sh: 0 },
               { anchor: 'feet', ax: 0.48, ay: 0.86, torso: 80, ua: -10, fa: 175, th: 22, sh: -8 }] },
    hyperext: { p: ['lowback', 'glutes'], s: ['hams'], load: 'chest', scene: ['hyperBench'],
      frames: [{ anchor: 'hip', ax: 0.42, ay: 0.4, torso: 200, prone: true, ua: 200, fa: 150, th: 48, sh: 48 },
               { anchor: 'hip', ax: 0.42, ay: 0.4, torso: -48, prone: true, ua: -20, fa: -150, th: 48, sh: 48 }] },
    swing: { p: ['glutes', 'hams'], s: ['delts', 'lowback', 'abs'], load: 'hands',
      frames: [{ anchor: 'feet', ax: 0.5, ay: 0.86, torso: 60, ua: -25, fa: -25, th: 45, sh: -18 },
               { anchor: 'feet', ax: 0.5, ay: 0.86, torso: -3, ua: 95, fa: 95, th: 0, sh: 0 }] },
    // ---------- Pecho ----------
    bench: { p: ['pecs'], s: ['triceps', 'delts'], load: 'hands', scene: ['flatBench', 'benchRack'], smith: true,
      frames: [{ anchor: 'hip', ax: 0.64, ay: 0.6, torso: -90, ua: 180, fa: 180, th: 72, sh: -5 },
               { anchor: 'hip', ax: 0.64, ay: 0.6, torso: -90, ua: 80, fa: 178, th: 72, sh: -5 }], liftAt: 0 },
    incline: { p: ['pecs', 'delts'], s: ['triceps'], load: 'hands', scene: ['inclineBench'], smith: true,
      frames: [{ anchor: 'hip', ax: 0.62, ay: 0.66, torso: -58, ua: 148, fa: 150, th: 75, sh: -5 },
               { anchor: 'hip', ax: 0.62, ay: 0.66, torso: -58, ua: 50, fa: 160, th: 75, sh: -5 }], liftAt: 0 },
    fly: { p: ['pecs'], s: ['delts'], load: 'hands', scene: ['flatBench'],
      frames: [{ anchor: 'hip', ax: 0.64, ay: 0.6, torso: -90, ua: 178, fa: 178, th: 72, sh: -5 },
               { anchor: 'hip', ax: 0.64, ay: 0.6, torso: -90, ua: 105, fa: 125, th: 72, sh: -5 }], liftAt: 0 },
    pullover: { p: ['lats', 'pecs'], s: ['triceps'], load: 'hands', scene: ['flatBench'],
      frames: [{ anchor: 'hip', ax: 0.64, ay: 0.6, torso: -90, ua: 178, fa: 178, th: 72, sh: -5 },
               { anchor: 'hip', ax: 0.64, ay: 0.6, torso: -90, ua: -78, fa: -76, th: 72, sh: -5 }], liftAt: 0 },
    chestPress: { p: ['pecs'], s: ['triceps', 'delts'], load: 'machine', stack: true, scene: ['seatBack'],
      frames: [{ anchor: 'hip', ax: 0.38, ay: 0.64, torso: -6, ua: -60, fa: 90, th: 85, sh: 5 },
               { anchor: 'hip', ax: 0.38, ay: 0.64, torso: -6, ua: 88, fa: 90, th: 85, sh: 5 }] },
    cableFly: { p: ['pecs'], s: ['delts'], load: 'cableHigh', stack: true,
      frames: [{ anchor: 'feet', ax: 0.47, ay: 0.86, torso: 14, ua: -55, fa: -30, th: 10, sh: -6, th2: -10, sh2: -6 },
               { anchor: 'feet', ax: 0.47, ay: 0.86, torso: 14, ua: 60, fa: 70, th: 10, sh: -6, th2: -10, sh2: -6 }] },
    dip: { p: ['triceps', 'pecs'], s: ['delts'], load: 'none', scene: ['dipStation'],
      frames: [{ anchor: 'hands', ax: 0.5, ay: 0.5, torso: 5, ua: 0, fa: 0, th: 30, sh: -85 },
               { anchor: 'hands', ax: 0.5, ay: 0.5, torso: 20, ua: -105, fa: -5, th: 30, sh: -85 }], liftAt: 0 },
    pushup: { p: ['pecs', 'triceps'], s: ['delts', 'abs'], load: 'none',
      frames: [{ anchor: 'hands', ax: 0.3, ay: 0.86, torso: -76, prone: true, ua: 0, fa: 0, th: 78, sh: 78 },
               { anchor: 'hands', ax: 0.3, ay: 0.86, torso: -82, prone: true, ua: 95, fa: -30, th: 82, sh: 82 }], liftAt: 0 },
    // ---------- Espalda ----------
    row: { p: ['lats', 'traps'], s: ['biceps', 'delts', 'lowback'], load: 'hands',
      frames: [{ anchor: 'feet', ax: 0.52, ay: 0.86, torso: 68, ua: 0, fa: 0, th: 30, sh: -12 },
               { anchor: 'feet', ax: 0.52, ay: 0.86, torso: 68, ua: -72, fa: -5, th: 30, sh: -12 }] },
    dbRow: { p: ['lats'], s: ['biceps', 'traps'], load: 'hands', scene: ['rowBench'],
      frames: [{ anchor: 'feet', ax: 0.6, ay: 0.86, torso: 80, ua: 0, fa: 0, ua2: 5, fa2: 5, th: 20, sh: -10, th2: 75, sh2: -95 },
               { anchor: 'feet', ax: 0.6, ay: 0.86, torso: 80, ua: -80, fa: -3, ua2: 5, fa2: 5, th: 20, sh: -10, th2: 75, sh2: -95 }] },
    pulldown: { p: ['lats'], s: ['biceps', 'traps'], load: 'cableHigh', stack: true, scene: ['pulldownSeat'],
      frames: [{ anchor: 'hip', ax: 0.42, ay: 0.66, torso: -10, ua: 168, fa: 172, th: 88, sh: 5 },
               { anchor: 'hip', ax: 0.42, ay: 0.66, torso: -16, ua: -25, fa: 165, th: 88, sh: 5 }] },
    pullup: { p: ['lats'], s: ['biceps', 'forearms'], load: 'none', scene: ['pullFrame'],
      frames: [{ anchor: 'hands', ax: 0.5, ay: 0.2, torso: 0, ua: 180, fa: 180, th: 20, sh: -110 },
               { anchor: 'hands', ax: 0.5, ay: 0.2, torso: -8, ua: 15, fa: 172, th: 25, sh: -110 }] },
    seatedRow: { p: ['lats', 'traps'], s: ['biceps'], load: 'cableFront', stack: true, scene: ['rowSeat'],
      frames: [{ anchor: 'hip', ax: 0.34, ay: 0.8, torso: 12, ua: 85, fa: 88, th: 84, sh: 78 },
               { anchor: 'hip', ax: 0.34, ay: 0.8, torso: -6, ua: -45, fa: 90, th: 84, sh: 78 }] },
    facePull: { p: ['delts', 'traps'], s: ['biceps'], load: 'cableFront', stack: true,
      frames: [{ anchor: 'feet', ax: 0.42, ay: 0.86, torso: -4, ua: 92, fa: 92, th: 4, sh: -2 },
               { anchor: 'feet', ax: 0.42, ay: 0.86, torso: -4, ua: -78, fa: 172, th: 4, sh: -2 }] },
    // ---------- Hombros ----------
    ohp: { p: ['delts'], s: ['triceps', 'traps'], load: 'hands', stack: true,
      frames: [{ anchor: 'feet', ax: 0.5, ay: 0.86, torso: 0, ua: 25, fa: 178, th: 0, sh: 0 },
               { anchor: 'feet', ax: 0.5, ay: 0.86, torso: -3, ua: 172, fa: 178, th: 0, sh: 0 }] },
    frontRaise: { p: ['delts'], s: ['traps'], load: 'hands', stack: true,
      frames: [{ anchor: 'feet', ax: 0.47, ay: 0.86, torso: 0, ua: 6, fa: 8, th: 0, sh: 0 },
               { anchor: 'feet', ax: 0.47, ay: 0.86, torso: 0, ua: 90, fa: 93, th: 0, sh: 0 }] },
    // ---------- Brazos ----------
    curl: { p: ['biceps'], s: ['forearms'], load: 'hands', stack: true,
      frames: [{ anchor: 'feet', ax: 0.47, ay: 0.86, torso: 0, ua: 0, fa: 0, th: 0, sh: 0 },
               { anchor: 'feet', ax: 0.47, ay: 0.86, torso: 0, ua: 8, fa: 150, th: 0, sh: 0 }] },
    preacherCurl: { p: ['biceps'], s: ['forearms'], load: 'hands', stack: true, scene: ['preacherPad'],
      frames: [{ anchor: 'hip', ax: 0.38, ay: 0.64, torso: 14, ua: 48, fa: 60, th: 88, sh: 5 },
               { anchor: 'hip', ax: 0.38, ay: 0.64, torso: 14, ua: 48, fa: 165, th: 88, sh: 5 }] },
    pushdown: { p: ['triceps'], load: 'cableHigh', stack: true,
      frames: [{ anchor: 'feet', ax: 0.44, ay: 0.86, torso: 12, ua: -5, fa: 115, th: 8, sh: -4 },
               { anchor: 'feet', ax: 0.44, ay: 0.86, torso: 12, ua: -5, fa: 5, th: 8, sh: -4 }] },
    ohExt: { p: ['triceps'], load: 'hands', stack: true, liftAt: 0,
      frames: [{ anchor: 'feet', ax: 0.47, ay: 0.86, torso: 0, ua: 172, fa: 178, th: 0, sh: 0 },
               { anchor: 'feet', ax: 0.47, ay: 0.86, torso: 0, ua: 168, fa: 25, th: 0, sh: 0 }] },
    skullCrusher: { p: ['triceps'], load: 'hands', scene: ['flatBench'], liftAt: 0,
      frames: [{ anchor: 'hip', ax: 0.64, ay: 0.6, torso: -90, ua: 168, fa: 172, th: 72, sh: -5 },
               { anchor: 'hip', ax: 0.64, ay: 0.6, torso: -90, ua: 168, fa: -72, th: 72, sh: -5 }] },
    kickback: { p: ['triceps'], load: 'hands', stack: true, scene: ['rowBench'],
      frames: [{ anchor: 'feet', ax: 0.6, ay: 0.86, torso: 80, ua: -88, fa: 0, ua2: 5, fa2: 5, th: 20, sh: -10, th2: 75, sh2: -95 },
               { anchor: 'feet', ax: 0.6, ay: 0.86, torso: 80, ua: -88, fa: -92, ua2: 5, fa2: 5, th: 20, sh: -10, th2: 75, sh2: -95 }] },
    // ---------- Core ----------
    plank: { p: ['abs'], s: ['delts', 'glutes'], load: 'none', scene: ['mat'],
      frames: [{ anchor: 'hip', ax: 0.55, ay: 0.72, torso: -78, prone: true, ua: 0, fa: -90, th: 99, sh: 99 },
               { anchor: 'hip', ax: 0.55, ay: 0.705, torso: -78, prone: true, ua: 0, fa: -90, th: 99, sh: 99 }] },
    crunch: { p: ['abs'], load: 'none', stack: true, scene: ['mat'],
      frames: [{ anchor: 'hip', ax: 0.56, ay: 0.83, torso: -90, ua: 90, fa: 90, th: 150, sh: 20 },
               { anchor: 'hip', ax: 0.56, ay: 0.83, torso: -48, ua: 110, fa: 110, th: 150, sh: 20 }] },
    legRaise: { p: ['abs'], load: 'none', scene: ['mat'],
      frames: [{ anchor: 'hip', ax: 0.5, ay: 0.83, torso: -90, ua: 92, fa: 92, th: 95, sh: 95 },
               { anchor: 'hip', ax: 0.5, ay: 0.83, torso: -90, ua: 92, fa: 92, th: 175, sh: 178 }] },
    hangLeg: { p: ['abs'], s: ['forearms'], load: 'none', scene: ['pullFrame'],
      frames: [{ anchor: 'hands', ax: 0.45, ay: 0.12, torso: 0, ua: 180, fa: 180, th: 15, sh: -100 },
               { anchor: 'hands', ax: 0.45, ay: 0.12, torso: -8, ua: 180, fa: 180, th: 95, sh: 90 }] },
    // ---------- Cardio ----------
    run: { p: ['quads', 'hams', 'calves', 'glutes'], load: 'none',
      frames: [{ anchor: 'hip', ax: 0.5, ay: 0.5, torso: 8, ua: -40, fa: 60, ua2: 40, fa2: 120, th: 35, sh: -10, th2: -30, sh2: -80 },
               { anchor: 'hip', ax: 0.5, ay: 0.5, torso: 8, ua: 40, fa: 120, ua2: -40, fa2: 60, th: -30, sh: -80, th2: 35, sh2: -10 }], linear: true },
    walk: { p: ['forearms', 'traps'], s: ['quads', 'calves'], load: 'hands',
      frames: [{ anchor: 'hip', ax: 0.5, ay: 0.47, torso: 0, ua: -6, fa: -4, ua2: 6, fa2: 4, th: 20, sh: 5, th2: -18, sh2: -35 },
               { anchor: 'hip', ax: 0.5, ay: 0.47, torso: 0, ua: 6, fa: 4, ua2: -6, fa2: -4, th: -18, sh: -35, th2: 20, sh2: 5 }], linear: true },
    bike: { p: ['quads', 'calves'], s: ['hams', 'glutes'], custom: 'bike' },
    rowErg: { p: ['lats', 'quads'], s: ['hams', 'biceps', 'lowback'], custom: 'rowErg' },
    // ---------- Vista frontal ----------
    lateralRaise: { view: 'front', p: ['delts'], s: ['traps'], load: 'hands', stack: true,
      frames: [{ ay: 0.47, ua: 8, fa: 10, th: 4, sh: 3 }, { ay: 0.47, ua: 86, fa: 90, th: 4, sh: 3 }] },
    shrug: { view: 'front', p: ['traps'], s: ['forearms'], load: 'hands', stack: true,
      frames: [{ ay: 0.47, ua: 6, fa: 4, th: 4, sh: 3, shr: 0 }, { ay: 0.47, ua: 6, fa: 4, th: 4, sh: 3, shr: 0.035 }] },
    uprightRow: { view: 'front', p: ['delts', 'traps'], s: ['biceps'], load: 'barFront', stack: true,
      frames: [{ ay: 0.47, ua: 10, fa: -12, th: 4, sh: 3 }, { ay: 0.47, ua: 92, fa: -48, th: 4, sh: 3 }] },
    abduction: { view: 'front', p: ['glutes'], load: 'ankle', stack: true,
      frames: [{ ay: 0.47, ua: 12, fa: 8, th: 3, sh: 2, thR: 3, shR: 2 }, { ay: 0.47, ua: 12, fa: 8, th: 3, sh: 2, thR: 38, shR: 38 }] },
    jumpingJack: { view: 'front', p: ['delts', 'calves'], s: ['quads', 'glutes'], load: 'none',
      frames: [{ ay: 0.47, ua: 8, fa: 6, th: 3, sh: 2 }, { ay: 0.44, ua: 168, fa: 172, th: 18, sh: 16 }] },
    jumpRope: { view: 'front', p: ['calves'], s: ['delts', 'forearms'], load: 'rope', linear: true,
      frames: [{ ay: 0.47, ua: 18, fa: 50, th: 3, sh: 2 }, { ay: 0.43, ua: 18, fa: 50, th: 3, sh: 2 }] },
  };
  // Alias de compatibilidad
  P.lateral = P.frontRaise;

  // =====================================================================
  //  CINEMÁTICA
  // =====================================================================
  function mix(a, b, t) {
    var r = {}, k;
    for (k in a) r[k] = a[k];
    for (k in b) if (r[k] == null) r[k] = b[k];
    for (k in r) {
      if (typeof r[k] !== 'number') continue;
      var base = k.length > 1 && (k.slice(-1) === '2' || k.slice(-1) === 'R') ? k.slice(0, -1) : null;
      var av = a[k] != null ? a[k] : (base && a[base] != null ? a[base] : b[k]);
      var bv = b[k] != null ? b[k] : (base && b[base] != null ? b[base] : a[k]);
      r[k] = lerp(av, bv, t);
    }
    return r;
  }

  function limbFront(a, b, prone) {
    var d = sub(b, a), l = len(d) || 1e-6;
    var f = [d[1] / l, -d[0] / l];
    return prone ? [-f[0], -f[1]] : f;
  }

  function solveSide(p) {
    var t = [Math.sin(rad(p.torso)), -Math.cos(rad(p.torso))];
    var ua2 = p.ua2 == null ? p.ua : p.ua2, fa2 = p.fa2 == null ? p.fa : p.fa2;
    var th2 = p.th2 == null ? p.th : p.th2, sh2 = p.sh2 == null ? p.sh : p.sh2;
    var foot = p.foot == null ? p.sh + 90 : p.foot;
    var foot2 = p.foot == null ? sh2 + 90 : p.foot;
    var hip;
    if (p.anchor === 'feet') {
      var a0 = [p.ax, p.ay], k0 = add(a0, D(p.sh), -L.sh); hip = add(k0, D(p.th), -L.th);
    } else if (p.anchor === 'toes') {
      var toe0 = [p.ax, p.ay], an0 = add(toe0, D(foot), -L.foot), kn0 = add(an0, D(p.sh), -L.sh); hip = add(kn0, D(p.th), -L.th);
    } else if (p.anchor === 'hands') {
      var h0 = [p.ax, p.ay], e0 = add(h0, D(p.fa), -L.fa), s0 = add(e0, D(p.ua), -L.ua); hip = add(s0, t, -L.torso);
    } else hip = [p.ax, p.ay];
    var j = { view: 'side', t: t, hip: hip, prone: !!p.prone };
    j.sho = add(hip, t, L.torso);
    j.head = add(j.sho, t, 0.088);
    j.el = add(j.sho, D(p.ua), L.ua); j.hand = add(j.el, D(p.fa), L.fa);
    j.el2 = add(j.sho, D(ua2), L.ua); j.hand2 = add(j.el2, D(fa2), L.fa);
    j.knee = add(hip, D(p.th), L.th); j.ank = add(j.knee, D(p.sh), L.sh); j.toe = add(j.ank, D(foot), L.foot);
    j.knee2 = add(hip, D(th2), L.th); j.ank2 = add(j.knee2, D(sh2), L.sh); j.toe2 = add(j.ank2, D(foot2), L.foot);
    var fr = [-t[1], t[0]];
    j.front = p.prone ? [-fr[0], -fr[1]] : fr;
    return j;
  }

  // Dos huesos: devuelve la articulación intermedia (rodilla/codo)
  function ik(root, target, l1, l2, bend) {
    var d = sub(target, root), dist = Math.min(len(d), l1 + l2 - 1e-4);
    var base = Math.atan2(d[1], d[0]);
    var c = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
    var a = Math.acos(Math.max(-1, Math.min(1, c)));
    var ang = base + bend * a;
    return [root[0] + Math.cos(ang) * l1, root[1] + Math.sin(ang) * l1];
  }
  function endFrom(root, mid, target, l2) {
    var d = sub(target, mid), l = len(d) || 1e-6;
    return [mid[0] + d[0] / l * l2, mid[1] + d[1] / l * l2];
  }

  function solveCustom(kind, phase, u) {
    var j = { view: 'side', prone: false };
    if (kind === 'bike') {
      var torso = 28;
      j.hip = [0.42, 0.5];
      j.t = [Math.sin(rad(torso)), -Math.cos(rad(torso))];
      j.sho = add(j.hip, j.t, L.torso); j.head = add(j.sho, j.t, 0.088);
      var bar = [0.7, 0.42];
      j.el = ik(j.sho, bar, L.ua, L.fa, -1); j.hand = endFrom(j.sho, j.el, bar, L.fa);
      j.el2 = j.el; j.hand2 = j.hand;
      var crank = [0.5, 0.74], r = 0.065, th = phase * Math.PI * 2;
      var pd = [crank[0] + Math.cos(th) * r, crank[1] + Math.sin(th) * r];
      var pd2 = [crank[0] - Math.cos(th) * r, crank[1] - Math.sin(th) * r];
      j.ank = [pd[0] - 0.02, pd[1] - 0.02]; j.ank2 = [pd2[0] - 0.02, pd2[1] - 0.02];
      j.knee = ik(j.hip, j.ank, L.th, L.sh, -1); j.knee2 = ik(j.hip, j.ank2, L.th, L.sh, -1);
      j.toe = add(j.ank, [0.95, 0.3], L.foot); j.toe2 = add(j.ank2, [0.95, 0.3], L.foot);
      j.pedals = [pd, pd2, crank];
    } else if (kind === 'rowErg') {
      // Tirón: piernas (0–0.55), tronco (0.35–0.75), brazos (0.55–1)
      function seg(a, b) { return ease(Math.max(0, Math.min(1, (u - a) / (b - a)))); }
      var legs = seg(0, 0.55), back = seg(0.35, 0.75), arms = seg(0.55, 1);
      var foot = [0.74, 0.79];
      j.hip = [lerp(0.58, 0.36, legs), 0.75];
      var tAng = lerp(25, -22, back);
      j.t = [Math.sin(rad(tAng)), -Math.cos(rad(tAng))];
      j.sho = add(j.hip, j.t, L.torso); j.head = add(j.sho, j.t, 0.088);
      j.ank = foot; j.ank2 = foot;
      j.knee = ik(j.hip, j.ank, L.th, L.sh, -1); j.knee2 = j.knee;
      j.toe = add(foot, [0.6, -0.8], L.foot); j.toe2 = j.toe;
      var reach = [j.sho[0] + 0.26, j.sho[1] + 0.07];
      var pulled = [j.sho[0] + 0.07, j.sho[1] + 0.13];
      var hand = [lerp(reach[0], pulled[0], arms), lerp(reach[1], pulled[1], arms)];
      j.el = ik(j.sho, hand, L.ua, L.fa, 1); j.hand = endFrom(j.sho, j.el, hand, L.fa);
      j.el2 = j.el; j.hand2 = j.hand;
      j.handle = j.hand;
    }
    var fr = [-j.t[1], j.t[0]]; j.front = fr;
    return j;
  }

  // Vista frontal
  var FW = { sho: 0.1, hip: 0.055 };
  function solveFront(p) {
    var cx = 0.5, hipY = p.ay, shoY = hipY - L.torso - (p.shr || 0);
    var j = { view: 'front', cx: cx, hipY: hipY, shoY: shoY, shr: p.shr || 0 };
    j.head = [cx, shoY - 0.085 + (p.shr || 0) * 0.3];
    j.neck = [cx, shoY - 0.02];
    function side(s, uaA, faA, thA, shA) {
      var sho = [cx + s * FW.sho, shoY], hip = [cx + s * FW.hip, hipY];
      var el = [sho[0] + s * Math.sin(rad(uaA)) * L.ua, sho[1] + Math.cos(rad(uaA)) * L.ua];
      var hand = [el[0] + s * Math.sin(rad(faA)) * L.fa, el[1] + Math.cos(rad(faA)) * L.fa];
      var knee = [hip[0] + s * Math.sin(rad(thA)) * L.th, hip[1] + Math.cos(rad(thA)) * L.th];
      var ank = [knee[0] + s * Math.sin(rad(shA)) * L.sh, knee[1] + Math.cos(rad(shA)) * L.sh];
      return { sho: sho, hip: hip, el: el, hand: hand, knee: knee, ank: ank };
    }
    j.L = side(-1, p.ua, p.fa, p.th, p.sh);
    j.R = side(1, p.uaR == null ? p.ua : p.uaR, p.faR == null ? p.fa : p.faR, p.thR == null ? p.th : p.thR, p.shR == null ? p.sh : p.shR);
    // Si las piernas no se separan, los pies están en el suelo
    var lowest = Math.max(j.L.ank[1], j.R.ank[1]);
    j.ground = lowest;
    return j;
  }

  // =====================================================================
  //  DIBUJO BÁSICO
  // =====================================================================
  function widthAt(k, s) {
    for (var i = 0; i < k.length - 1; i++) {
      var a = k[i], b = k[i + 1];
      if (s <= b[0]) { var u = (s - a[0]) / (b[0] - a[0]); u = (1 - Math.cos(u * Math.PI)) / 2; return lerp(a[1], b[1], u); }
    }
    return k[k.length - 1][1];
  }
  function limbPath(ctx, S, a, b, knots) {
    var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1e-6;
    var n = [-dy / l, dx / l], N = 16, left = [], right = [], i;
    for (i = 0; i <= N; i++) {
      var s = i / N, w = widthAt(knots, s) / 2, c = [a[0] + dx * s, a[1] + dy * s];
      left.push([c[0] + n[0] * w, c[1] + n[1] * w]); right.push([c[0] - n[0] * w, c[1] - n[1] * w]);
    }
    var an = Math.atan2(n[1], n[0]), r0 = widthAt(knots, 0) / 2, r1 = widthAt(knots, 1) / 2;
    ctx.beginPath();
    ctx.moveTo(left[0][0] * S, left[0][1] * S);
    for (i = 1; i <= N; i++) ctx.lineTo(left[i][0] * S, left[i][1] * S);
    ctx.arc(b[0] * S, b[1] * S, r1 * S, an, an - Math.PI, true);
    for (i = N; i >= 0; i--) ctx.lineTo(right[i][0] * S, right[i][1] * S);
    ctx.arc(a[0] * S, a[1] * S, r0 * S, an + Math.PI, an, true);
    ctx.closePath();
  }
  var SHADE = {};
  SHADE[COL.skin] = ['#ffffff', '#f1f2f5', '#cdd2da'];
  SHADE[COL.skinFar] = ['#cfd3db', '#b8bdc7', '#969ca8'];
  var LIGHT = [-0.55, -0.83];
  function shadedFill(ctx, S, a, b, w, fill) {
    var pal = SHADE[fill];
    if (!pal) return fill;
    var d = sub(b, a), l = len(d) || 1e-6, n = [-d[1] / l, d[0] / l];
    if (n[0] * LIGHT[0] + n[1] * LIGHT[1] < 0) n = [-n[0], -n[1]];
    var m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    var g = ctx.createLinearGradient((m[0] + n[0] * w) * S, (m[1] + n[1] * w) * S, (m[0] - n[0] * w) * S, (m[1] - n[1] * w) * S);
    g.addColorStop(0, pal[0]); g.addColorStop(0.45, pal[1]); g.addColorStop(1, pal[2]);
    return g;
  }
  function limb(ctx, S, a, b, knots, fill, lw) {
    limbPath(ctx, S, a, b, knots);
    var maxW = 0; for (var i = 0; i < knots.length; i++) maxW = Math.max(maxW, knots[i][1]);
    ctx.fillStyle = shadedFill(ctx, S, a, b, maxW / 2, fill); ctx.fill();
    ctx.lineWidth = lw * 0.75; ctx.strokeStyle = COL.line; ctx.lineJoin = 'round'; ctx.stroke();
  }
  function blob(ctx, S, c, rx, ry, rot, fill, lw) {
    ctx.beginPath(); ctx.ellipse(c[0] * S, c[1] * S, rx * S, ry * S, rot, 0, Math.PI * 2);
    var pal = SHADE[fill];
    if (pal) {
      var g = ctx.createRadialGradient((c[0] + LIGHT[0] * rx * 0.5) * S, (c[1] + LIGHT[1] * ry * 0.5) * S, rx * 0.1 * S, c[0] * S, c[1] * S, Math.max(rx, ry) * S);
      g.addColorStop(0, pal[0]); g.addColorStop(0.6, pal[1]); g.addColorStop(1, pal[2]);
      ctx.fillStyle = g;
    } else ctx.fillStyle = fill;
    ctx.fill();
    if (lw) { ctx.lineWidth = lw * 0.75; ctx.strokeStyle = COL.line; ctx.stroke(); }
  }
  // --- Silueta única: primero el contorno de todas las piezas, luego el relleno encima ---
  function partPath(ctx, S, p) {
    if (p.k === 'limb') limbPath(ctx, S, p.a, p.b, p.knots);
    else if (p.k === 'blob') { ctx.beginPath(); ctx.ellipse(p.c[0] * S, p.c[1] * S, p.rx * S, p.ry * S, p.rot || 0, 0, Math.PI * 2); }
    else if (p.k === 'path') p.fn(ctx, S);
  }
  function partFill(ctx, S, p, fill) {
    if (p.k === 'limb') { var mw = 0; p.knots.forEach(function (k) { mw = Math.max(mw, k[1]); }); return shadedFill(ctx, S, p.a, p.b, mw / 2, fill); }
    if (p.k === 'blob') {
      var pal = SHADE[fill]; if (!pal) return fill;
      var g = ctx.createRadialGradient((p.c[0] + LIGHT[0] * p.rx * 0.5) * S, (p.c[1] + LIGHT[1] * p.ry * 0.5) * S, p.rx * 0.1 * S, p.c[0] * S, p.c[1] * S, Math.max(p.rx, p.ry) * S);
      g.addColorStop(0, pal[0]); g.addColorStop(0.6, pal[1]); g.addColorStop(1, pal[2]); return g;
    }
    return p.grad ? p.grad(ctx, S) : fill;
  }
  function renderGroup(ctx, S, parts, fill, lw) {
    ctx.lineJoin = 'round';
    parts.forEach(function (p) { partPath(ctx, S, p); ctx.lineWidth = lw * 1.5; ctx.strokeStyle = 'rgba(28,31,38,0.7)'; ctx.stroke(); });
    parts.forEach(function (p) { partPath(ctx, S, p); ctx.fillStyle = partFill(ctx, S, p, fill); ctx.fill(); });
  }
  var KF_TH = [[0, 0.094], [0.35, 0.09], [1, 0.062]];
  function softSpot(ctx, S, c, rx, ry, rot, color) {
    var clear = color.replace(/[\d.]+\)$/, '0)');
    ctx.save();
    ctx.translate(c[0] * S, c[1] * S); ctx.rotate(rot || 0); ctx.scale(rx * S, ry * S);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, color); g.addColorStop(0.55, color); g.addColorStop(1, clear);
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }
  function L_(a, b, knots) { return { k: 'limb', a: a, b: b, knots: knots }; }
  function B_(c, rx, ry, rot) { return { k: 'blob', c: c, rx: rx, ry: ry, rot: rot || 0 }; }

  // --- Relieve: líneas de separación muscular y brillos ---
  function ptOn(a, b, knots, front, sAt, off) {
    var d = sub(b, a), w = widthAt(knots, Math.max(0, Math.min(1, sAt))) / 2;
    return [a[0] + d[0] * sAt + front[0] * w * off, a[1] + d[1] * sAt + front[1] * w * off];
  }
  function detail(ctx, S, a, b, knots, front, pts, alpha, wmul) {
    var P = pts.map(function (q) { return ptOn(a, b, knots, front, q[0], q[1]); });
    ctx.beginPath(); ctx.moveTo(P[0][0] * S, P[0][1] * S);
    for (var i = 1; i < P.length - 1; i++) {
      var mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2;
      ctx.quadraticCurveTo(P[i][0] * S, P[i][1] * S, mx * S, my * S);
    }
    var last = P[P.length - 1]; ctx.lineTo(last[0] * S, last[1] * S);
    ctx.strokeStyle = 'rgba(70,78,94,' + (alpha || 0.32) + ')'; ctx.lineWidth = (wmul || 1) * S * 0.0042; ctx.lineCap = 'round'; ctx.stroke();
  }
  function sheen(ctx, S, a, b, knots, front, sAt, off, rx, ry, alpha) {
    var c = ptOn(a, b, knots, front, sAt, off), d = sub(b, a), rot = Math.atan2(d[1], d[0]);
    var g = ctx.createRadialGradient(c[0] * S, c[1] * S, 0, c[0] * S, c[1] * S, rx * S);
    g.addColorStop(0, 'rgba(255,255,255,' + (alpha || 0.9) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.ellipse(c[0] * S, c[1] * S, rx * S, ry * S, rot, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  }
  function shadow(ctx, S, a, b, knots, front, sAt, off, rx, ry, alpha) {
    var c = ptOn(a, b, knots, front, sAt, off), d = sub(b, a), rot = Math.atan2(d[1], d[0]);
    var g = ctx.createRadialGradient(c[0] * S, c[1] * S, 0, c[0] * S, c[1] * S, rx * S);
    g.addColorStop(0, 'rgba(120,128,145,' + (alpha || 0.35) + ')'); g.addColorStop(1, 'rgba(120,128,145,0)');
    ctx.beginPath(); ctx.ellipse(c[0] * S, c[1] * S, rx * S, ry * S, rot, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  }
  // Anatomía visible en perfil
  function sideAnatomyBody(ctx, S, j) {
    var tf = j.front;
    // Torso: pectoral, abdominales, dorsal y oblicuo
    sheen(ctx, S, j.hip, j.sho, K.torso, tf, 0.78, 0.55, 0.06, 0.035, 0.8);
    detail(ctx, S, j.hip, j.sho, K.torso, tf, [[0.6, 0.96], [0.63, 0.62], [0.74, 0.22]], 0.38, 1.1);
    [0.2, 0.31, 0.42].forEach(function (q) { detail(ctx, S, j.hip, j.sho, K.torso, tf, [[q, 0.97], [q + 0.012, 0.8], [q + 0.02, 0.62]], 0.28); });
    detail(ctx, S, j.hip, j.sho, K.torso, tf, [[0.12, 0.62], [0.32, 0.38], [0.52, 0.32]], 0.2);
    detail(ctx, S, j.hip, j.sho, K.torso, tf, [[0.86, -0.45], [0.62, -0.72], [0.38, -0.9]], 0.32, 1.1);
    shadow(ctx, S, j.hip, j.sho, K.torso, tf, 0.55, -0.6, 0.08, 0.03, 0.25);
    // Muslo: cuádriceps, vasto interno, isquios y pliegue del glúteo
    var ft = limbFront(j.hip, j.knee, j.prone);
    sheen(ctx, S, j.hip, j.knee, K.th, ft, 0.42, 0.45, 0.065, 0.028, 0.8);
    detail(ctx, S, j.hip, j.knee, K.th, ft, [[0.18, 0.25], [0.5, 0.08], [0.82, 0.22]], 0.3);
    detail(ctx, S, j.hip, j.knee, K.th, ft, [[0.68, 0.92], [0.86, 0.5], [0.97, 0.65]], 0.34);
    detail(ctx, S, j.hip, j.knee, K.th, ft, [[0.3, -0.45], [0.62, -0.35], [0.9, -0.5]], 0.25);
    detail(ctx, S, j.hip, j.knee, K.th, ft, [[0.0, -0.98], [0.12, -0.62], [0.22, -0.3]], 0.3);
    // Rodilla
    detail(ctx, S, j.knee, j.ank, K.sh, limbFront(j.knee, j.ank, j.prone), [[-0.08, 0.95], [0.02, 0.7], [0.1, 0.92]], 0.25);
    // Pierna: gemelo y tibia
    var fs = limbFront(j.knee, j.ank, j.prone);
    sheen(ctx, S, j.knee, j.ank, K.sh, fs, 0.28, -0.45, 0.05, 0.024, 0.7);
    detail(ctx, S, j.knee, j.ank, K.sh, fs, [[0.08, -0.2], [0.3, -0.5], [0.58, -0.62]], 0.32);
    detail(ctx, S, j.knee, j.ank, K.sh, fs, [[0.18, 0.55], [0.5, 0.5], [0.82, 0.45]], 0.16);
  }
  function sideAnatomyArm(ctx, S, j, el, hand) {
    var fa = limbFront(j.sho, el, j.prone);
    sheen(ctx, S, j.sho, el, K.ua, fa, 0.12, 0.2, 0.04, 0.03, 0.85);
    detail(ctx, S, j.sho, el, K.ua, fa, [[0.42, 0.95], [0.3, 0.25], [0.4, -0.92]], 0.34, 1.1);
    detail(ctx, S, j.sho, el, K.ua, fa, [[0.45, -0.08], [0.66, -0.16], [0.9, -0.05]], 0.3);
    sheen(ctx, S, j.sho, el, K.ua, fa, 0.62, 0.45, 0.04, 0.02, 0.7);
    var ff = limbFront(el, hand, j.prone);
    detail(ctx, S, el, hand, K.fa, ff, [[0.06, 0.45], [0.3, 0.2], [0.62, -0.1]], 0.28);
    sheen(ctx, S, el, hand, K.fa, ff, 0.22, 0.3, 0.035, 0.018, 0.6);
  }

  // Cabeza realista de perfil: cráneo, mandíbula, nariz y oreja suaves
  function headSide(ctx, S, j, fill, lw) {
    var up = j.t, fr = j.front, rot = Math.atan2(up[1], up[0]) + Math.PI / 2;
    blob(ctx, S, j.head, 0.046, 0.054, rot, fill, lw);
    var jaw = add(add(j.head, fr, 0.022), up, -0.03);
    blob(ctx, S, jaw, 0.03, 0.024, rot, fill, 0);
    var nose = add(add(j.head, fr, 0.047), up, -0.006);
    ctx.beginPath();
    ctx.moveTo((nose[0] - fr[0] * 0.012 + up[0] * 0.012) * S, (nose[1] - fr[1] * 0.012 + up[1] * 0.012) * S);
    ctx.lineTo((nose[0] + fr[0] * 0.006) * S, (nose[1] + fr[1] * 0.006) * S);
    ctx.lineTo((nose[0] - fr[0] * 0.012 - up[0] * 0.01) * S, (nose[1] - fr[1] * 0.012 - up[1] * 0.01) * S);
    ctx.fillStyle = '#eef0f3'; ctx.fill();
    var hair = add(add(j.head, up, 0.012), fr, -0.008);
    ctx.beginPath(); ctx.ellipse(hair[0] * S, hair[1] * S, 0.046 * S, 0.044 * S, rot, Math.PI, Math.PI * 2);
    ctx.fillStyle = 'rgba(140,148,160,0.35)'; ctx.fill();
    blob(ctx, S, add(j.head, fr, -0.006), 0.009, 0.014, rot, 'rgba(180,186,196,0.55)', 0);
  }
  function fist(ctx, S, el, hand, fill, lw) {
    var d = sub(hand, el), rot = Math.atan2(d[1], d[0]);
    blob(ctx, S, add(hand, [d[0] / (len(d) || 1), d[1] / (len(d) || 1)], 0.006), 0.03, 0.023, rot, fill, lw);
  }
  // Franja muscular dentro de un segmento (lado delantero +1 o trasero −1)
  function muscleStrip(ctx, S, a, b, knots, front, sideSign, s0, s1, frac, color) {
    var d = sub(b, a), N = 14, outer = [], inner = [], i;
    var n = [front[0] * sideSign, front[1] * sideSign];
    for (i = 0; i <= N; i++) {
      var s = lerp(s0, s1, i / N), w = widthAt(knots, Math.max(0, Math.min(1, s))) / 2;
      var c = [a[0] + d[0] * s, a[1] + d[1] * s];
      var bump = Math.sin(Math.PI * i / N);
      var o = w * 0.9, inn = w * 0.9 - frac * 2 * w * bump;
      outer.push([c[0] + n[0] * o, c[1] + n[1] * o]);
      inner.push([c[0] + n[0] * inn, c[1] + n[1] * inn]);
    }
    ctx.beginPath();
    ctx.moveTo(outer[0][0] * S, outer[0][1] * S);
    for (i = 1; i <= N; i++) ctx.lineTo(outer[i][0] * S, outer[i][1] * S);
    for (i = N; i >= 0; i--) ctx.lineTo(inner[i][0] * S, inner[i][1] * S);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }
  function circle(ctx, S, c, r, fill, stroke, lw) {
    ctx.beginPath(); ctx.arc(c[0] * S, c[1] * S, r * S, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function ellipse(ctx, S, c, rx, ry, rot, fill) {
    ctx.beginPath(); ctx.ellipse(c[0] * S, c[1] * S, rx * S, ry * S, rot, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
  }
  function rect(ctx, S, x, y, w, h, fill, r) {
    ctx.beginPath();
    if (ctx.roundRect && r) ctx.roundRect(x * S, y * S, w * S, h * S, r * S); else ctx.rect(x * S, y * S, w * S, h * S);
    ctx.fillStyle = fill; ctx.fill();
  }
  function line(ctx, S, a, b, color, w) {
    ctx.beginPath(); ctx.moveTo(a[0] * S, a[1] * S); ctx.lineTo(b[0] * S, b[1] * S);
    ctx.strokeStyle = color; ctx.lineWidth = w * S; ctx.lineCap = 'round'; ctx.stroke();
  }
  function rotRect(ctx, S, cx, cy, ang, x, y, w, h, fill, r) {
    ctx.save(); ctx.translate(cx * S, cy * S); ctx.rotate(ang); rect(ctx, S, x, y, w, h, fill, r); ctx.restore();
  }

  var K = {
    torso: [[0, 0.125], [0.3, 0.112], [0.72, 0.172], [0.92, 0.165], [1, 0.14]],
    neck: [[0, 0.06], [1, 0.055]],
    ua: [[0, 0.082], [0.18, 0.07], [0.55, 0.074], [1, 0.05]],
    fa: [[0, 0.056], [0.3, 0.06], [1, 0.04]],
    th: [[0, 0.108], [0.35, 0.102], [1, 0.064]],
    sh: [[0, 0.064], [0.3, 0.07], [1, 0.042]],
    foot: [[0, 0.046], [1, 0.04]]
  };

  // =====================================================================
  //  EQUIPAMIENTO
  // =====================================================================
  function plates(ctx, S, c, lw) {
    var R = 0.098;
    circle(ctx, S, [c[0] + 0.016, c[1] - 0.006], R, '#1c1e24', COL.plateRim, lw);
    circle(ctx, S, c, R, COL.plate, COL.plateRim, lw * 1.3);
    circle(ctx, S, c, R * 0.72, null, '#3a3f4a', lw);
    circle(ctx, S, c, R * 0.22, '#3a3f4a', null, 0);
    circle(ctx, S, c, 0.016, COL.metal, COL.line, lw * 0.6);
  }
  function dumbbellEnd(ctx, S, c, far, lw) {
    var r = 0.058, col = far ? '#1d1f25' : COL.plate;
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 6 + i * Math.PI / 3, x = (c[0] + Math.cos(a) * r) * S, y = (c[1] + Math.sin(a) * r) * S;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = COL.plateRim; ctx.stroke();
    circle(ctx, S, c, 0.014, COL.metal, null, 0);
  }
  function kettlebell(ctx, S, hand, lw) {
    var c = [hand[0], hand[1] + 0.06];
    ctx.beginPath(); ctx.arc(hand[0] * S, (hand[1] + 0.02) * S, 0.03 * S, Math.PI * 1.05, Math.PI * 1.95);
    ctx.lineWidth = 0.012 * S; ctx.strokeStyle = COL.plate; ctx.stroke();
    circle(ctx, S, c, 0.055, COL.plate, COL.plateRim, lw);
  }
  // Torre de pesas fija; los discos suben con «lift»
  function weightStack(ctx, S, x, lift, lw) {
    var top = 0.1, bottom = GROUND;
    rect(ctx, S, x - 0.06, top - 0.014, 0.12, 0.018, COL.metalDark, 0.004);
    rect(ctx, S, x - 0.055, top, 0.012, bottom - top, COL.metalDark);
    rect(ctx, S, x + 0.043, top, 0.012, bottom - top, COL.metalDark);
    line(ctx, S, [x, top + 0.01], [x, bottom - 0.24 - lift], COL.metal, 0.004);
    var n = 10, h = 0.022, y0 = bottom - 0.012 - n * h - lift;
    for (var i = 0; i < n; i++) rect(ctx, S, x - 0.042, y0 + i * h, 0.084, h - 0.004, COL.accent, 0.003);
    circle(ctx, S, [x + 0.05, y0 + (n - 1) * h + h / 2], 0.008, COL.metal, null, 0);
    circle(ctx, S, [x, top - 0.005], 0.02, COL.metalDark, COL.line, lw * 0.6);
    return [x, top - 0.005];
  }
  function pulley(ctx, S, p, lw) { circle(ctx, S, p, 0.02, COL.metalDark, COL.line, lw * 0.6); circle(ctx, S, p, 0.006, COL.metal, null, 0); }
  function label(ctx, S, text) {
    ctx.font = '700 ' + Math.round(0.052 * S) + 'px -apple-system, system-ui, sans-serif';
    var w = ctx.measureText(text).width + 0.04 * S, h = 0.075 * S, x = 0.04 * S, y = 0.04 * S;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, h / 2); else ctx.rect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,138,61,0.16)'; ctx.fill();
    ctx.fillStyle = COL.accent; ctx.textBaseline = 'middle'; ctx.fillText(text, x + 0.02 * S, y + h / 2 + 1);
  }

  // Soportes fijos (siempre se calculan con la postura A → no se mueven)
  function scene(ctx, S, names, a, lw) {
    (names || []).forEach(function (n) {
      if (n === 'rack') {
        rect(ctx, S, 0.2, 0.12, 0.025, GROUND - 0.12, COL.metalDark);
        rect(ctx, S, 0.78, 0.12, 0.025, GROUND - 0.12, COL.metalDark);
        rect(ctx, S, 0.2, 0.12, 0.605, 0.02, COL.metalDark);
        rect(ctx, S, 0.19, a.sho[1] + 0.02, 0.045, 0.012, COL.metal);
      }
      if (n === 'flatBench' || n === 'benchRack') {
        if (n === 'benchRack') { rect(ctx, S, 0.17, 0.25, 0.022, GROUND - 0.25, COL.metalDark); rect(ctx, S, 0.15, 0.3, 0.06, 0.014, COL.metal); }
        else {
          rect(ctx, S, 0.17, 0.635, 0.6, 0.055, COL.pad, 0.02); rect(ctx, S, 0.17, 0.635, 0.6, 0.02, COL.padTop, 0.01);
          rect(ctx, S, 0.24, 0.69, 0.03, GROUND - 0.69, COL.metalDark); rect(ctx, S, 0.66, 0.69, 0.03, GROUND - 0.69, COL.metalDark);
        }
      }
      if (n === 'inclineBench') {
        rotRect(ctx, S, a.hip[0], a.hip[1] + 0.045, rad(-32), -0.34, -0.02, 0.36, 0.05, COL.pad, 0.02);
        rect(ctx, S, a.hip[0] - 0.05, a.hip[1] + 0.03, 0.17, 0.05, COL.pad, 0.02);
        rect(ctx, S, a.hip[0] - 0.02, a.hip[1] + 0.08, 0.03, GROUND - a.hip[1] - 0.08, COL.metalDark);
      }
      if (n === 'lowBench') {
        rect(ctx, S, 0.08, 0.6, 0.26, 0.055, COL.pad, 0.02);
        rect(ctx, S, 0.14, 0.655, 0.03, GROUND - 0.655, COL.metalDark); rect(ctx, S, 0.27, 0.655, 0.03, GROUND - 0.655, COL.metalDark);
      }
      if (n === 'rowBench') {
        var bx = a.hand2[0] - 0.12, by = a.hand2[1] + 0.03;
        rect(ctx, S, bx, by, 0.42, 0.05, COL.pad, 0.02);
        rect(ctx, S, bx + 0.05, by + 0.05, 0.03, GROUND - by - 0.05, COL.metalDark);
        rect(ctx, S, bx + 0.32, by + 0.05, 0.03, GROUND - by - 0.05, COL.metalDark);
      }
      if (n === 'pullFrame') {
        rect(ctx, S, 0.1, a.hand[1] - 0.012, 0.8, 0.024, COL.metal, 0.01);
        rect(ctx, S, 0.1, a.hand[1], 0.022, GROUND - a.hand[1], COL.metalDark); rect(ctx, S, 0.878, a.hand[1], 0.022, GROUND - a.hand[1], COL.metalDark);
      }
      if (n === 'dipStation') {
        rect(ctx, S, a.hand[0] - 0.14, a.hand[1] + 0.012, 0.26, 0.026, COL.metal, 0.01);
        rect(ctx, S, a.hand[0] + 0.09, a.hand[1] + 0.03, 0.026, GROUND - a.hand[1] - 0.03, COL.metalDark);
      }
      if (n === 'calfBlock') rect(ctx, S, a.toe[0] - 0.05, a.toe[1] + 0.012, 0.2, GROUND - a.toe[1] - 0.012, COL.pad, 0.008);
      if (n === 'calfBlockSeated') rect(ctx, S, a.toe[0] - 0.04, a.toe[1] + 0.012, 0.14, GROUND - a.toe[1] - 0.012, COL.pad, 0.008);
      if (n === 'seatLow') {
        rect(ctx, S, a.hip[0] - 0.1, a.hip[1] + 0.035, 0.2, 0.045, COL.pad, 0.015);
        rect(ctx, S, a.hip[0] - 0.02, a.hip[1] + 0.08, 0.03, GROUND - a.hip[1] - 0.08, COL.metalDark);
      }
      if (n === 'mat') rect(ctx, S, 0.08, GROUND - 0.012, 0.84, 0.014, '#2f5d8a', 0.006);
      if (n === 'rowSeat') {
        rect(ctx, S, a.hip[0] - 0.09, a.hip[1] + 0.035, 0.16, 0.04, COL.pad, 0.015);
        rect(ctx, S, a.hip[0] - 0.12, a.hip[1] + 0.075, 0.6, 0.02, COL.metalDark);
        rect(ctx, S, a.ank[0] + 0.02, a.ank[1] - 0.09, 0.025, 0.12, COL.metalDark, 0.008);
      }
      if (n === 'pulldownSeat') {
        rect(ctx, S, a.hip[0] - 0.1, a.hip[1] + 0.035, 0.2, 0.045, COL.pad, 0.015);
        rect(ctx, S, a.hip[0] - 0.02, a.hip[1] + 0.08, 0.03, GROUND - a.hip[1] - 0.08, COL.metalDark);
        rect(ctx, S, a.knee[0] - 0.02, a.knee[1] - 0.075, 0.07, 0.035, COL.pad, 0.015);
      }
      if (n === 'seatBack') {
        rect(ctx, S, a.hip[0] - 0.1, a.hip[1] + 0.035, 0.22, 0.05, COL.pad, 0.018);
        rotRect(ctx, S, a.hip[0] - 0.07, a.hip[1] + 0.04, rad(-10), -0.03, -0.3, 0.05, 0.3, COL.pad, 0.018);
        rect(ctx, S, a.hip[0] - 0.02, a.hip[1] + 0.085, 0.035, GROUND - a.hip[1] - 0.085, COL.metalDark);
      }
      if (n === 'legCurlBench') {
        rect(ctx, S, 0.12, 0.635, 0.62, 0.05, COL.pad, 0.02);
        rect(ctx, S, 0.2, 0.685, 0.03, GROUND - 0.685, COL.metalDark); rect(ctx, S, 0.62, 0.685, 0.03, GROUND - 0.685, COL.metalDark);
      }
      if (n === 'legPressFrame') {
        rotRect(ctx, S, a.hip[0], a.hip[1] + 0.04, rad(-55), -0.02, -0.03, 0.3, 0.05, COL.pad, 0.02);
        rect(ctx, S, a.hip[0] - 0.12, a.hip[1] + 0.05, 0.24, 0.045, COL.pad, 0.018);
        rect(ctx, S, a.hip[0] - 0.08, a.hip[1] + 0.095, 0.62, 0.02, COL.metalDark);
        line(ctx, S, [a.hip[0] + 0.1, a.hip[1] + 0.09], [0.97, 0.18], COL.metalDark, 0.016);
      }
      if (n === 'preacherPad') {
        rotRect(ctx, S, a.el[0], a.el[1] + 0.035, rad(-42), -0.16, 0, 0.18, 0.045, COL.pad, 0.018);
        rect(ctx, S, a.el[0] - 0.08, a.el[1] + 0.05, 0.03, GROUND - a.el[1] - 0.05, COL.metalDark);
        rect(ctx, S, a.hip[0] - 0.1, a.hip[1] + 0.035, 0.2, 0.045, COL.pad, 0.015);
      }
      if (n === 'hyperBench') {
        rotRect(ctx, S, a.hip[0] + 0.02, a.hip[1] + 0.02, rad(40), -0.06, 0, 0.12, 0.05, COL.pad, 0.02);
        line(ctx, S, [a.hip[0] + 0.03, a.hip[1] + 0.06], [a.ank[0] + 0.02, GROUND], COL.metalDark, 0.018);
        rotRect(ctx, S, a.ank[0], a.ank[1] + 0.01, rad(40), -0.02, 0, 0.09, 0.03, COL.metal, 0.01);
      }
    });
  }

  // =====================================================================
  //  MÚSCULOS
  // =====================================================================
  function muscleColor(name, M) {
    if (M.p.indexOf(name) >= 0) return COL.primary;
    if (M.s.indexOf(name) >= 0) return COL.secondary;
    return null;
  }
  function sideMuscles(ctx, S, j, M, near) {
    var c, fr;
    var legs = near ? [[j.hip, j.knee, j.ank]] : [[j.hip, j.knee2, j.ank2]];
    legs.forEach(function (lg) {
      fr = limbFront(lg[0], lg[1], j.prone);
      if ((c = muscleColor('quads', M))) muscleStrip(ctx, S, lg[0], lg[1], K.th, fr, 1, 0.12, 0.9, 0.36, c);
      if ((c = muscleColor('hams', M))) muscleStrip(ctx, S, lg[0], lg[1], K.th, fr, -1, 0.15, 0.88, 0.34, c);
      var fs = limbFront(lg[1], lg[2], j.prone);
      if ((c = muscleColor('calves', M))) muscleStrip(ctx, S, lg[1], lg[2], K.sh, fs, -1, 0.06, 0.62, 0.4, c);
    });
    if (!near) return;
    var tf = j.front, tb = [-tf[0], -tf[1]];
    var torsoEnd = j.sho;
    if ((c = muscleColor('pecs', M))) muscleStrip(ctx, S, j.hip, torsoEnd, K.torso, tf, 1, 0.6, 0.96, 0.3, c);
    if ((c = muscleColor('abs', M))) muscleStrip(ctx, S, j.hip, torsoEnd, K.torso, tf, 1, 0.1, 0.58, 0.26, c);
    if ((c = muscleColor('lats', M))) muscleStrip(ctx, S, j.hip, torsoEnd, K.torso, tf, -1, 0.38, 0.9, 0.42, c);
    if ((c = muscleColor('lowback', M))) muscleStrip(ctx, S, j.hip, torsoEnd, K.torso, tf, -1, 0.04, 0.4, 0.3, c);
    if ((c = muscleColor('traps', M))) {
      muscleStrip(ctx, S, j.hip, torsoEnd, K.torso, tf, -1, 0.82, 1.04, 0.32, c);
    }
  }
  function armMuscles(ctx, S, j, M, el, hand) {
    var c, fr = limbFront(j.sho, el, j.prone);
    if ((c = muscleColor('biceps', M))) muscleStrip(ctx, S, j.sho, el, K.ua, fr, 1, 0.25, 0.92, 0.42, c);
    if ((c = muscleColor('triceps', M))) muscleStrip(ctx, S, j.sho, el, K.ua, fr, -1, 0.12, 0.88, 0.42, c);
    var ff = limbFront(el, hand, j.prone);
    if ((c = muscleColor('forearms', M))) muscleStrip(ctx, S, el, hand, K.fa, ff, 1, 0.04, 0.62, 0.42, c);
  }

  // =====================================================================
  //  FIGURA DE PERFIL
  // =====================================================================
  function drawSide(ctx, S, key, def, j, a, eq, M, lift, lw) {
    var load = def.load || 'none';
    var hasStack = (eq === 'cable' || (eq === 'machine' && def.stack) || load === 'cableHigh' || load === 'cableFront' || load === 'machine');
    var smith = eq === 'machine' && def.smith;
    var useCable = eq === 'cable' || load === 'cableHigh' || load === 'cableFront';
    var stackX = 0.9;

    scene(ctx, S, def.scene, a, lw);
    if (smith) {
      var sx = (load === 'shoulders' ? a.sho[0] : a.hand[0]);
      rect(ctx, S, sx - 0.13, 0.08, 0.018, GROUND - 0.08, COL.metalDark);
      rect(ctx, S, sx + 0.11, 0.08, 0.018, GROUND - 0.08, COL.metalDark);
      rect(ctx, S, sx - 0.13, 0.08, 0.258, 0.016, COL.metalDark);
    }

    var topPulley = null;
    if (hasStack && !smith) topPulley = weightStack(ctx, S, stackX, lift * 0.11, lw);
    if (useCable && topPulley) {
      var anchor;
      if (load === 'cableHigh' || key === 'pushdown' || key === 'pulldown' || key === 'ohExt' || key === 'cableFly' || key === 'crunch') anchor = [a.hand[0] + 0.03, 0.1];
      else if (load === 'cableFront' || key === 'chestPress' || key === 'seatedRow' || key === 'facePull' || key === 'row') anchor = [stackX - 0.05, a.hand[1]];
      else anchor = [stackX - 0.05, GROUND - 0.06];
      if (key === 'cableFly') anchor = [0.12, 0.16];
      line(ctx, S, topPulley, anchor, COL.cable, 0.005);
      pulley(ctx, S, anchor, lw);
      var target = load === 'ankle' ? j.ank : j.hand;
      line(ctx, S, anchor, target, COL.cable, 0.006);
    }

    // Lado lejano
    renderGroup(ctx, S, [L_(j.hip, j.knee2, K.th), L_(j.knee2, j.ank2, K.sh), L_(j.ank2, j.toe2, K.foot)], COL.skinFar, lw);
    sideMuscles(ctx, S, j, M, false);
    if (eq === 'dumbbell' && load === 'hands' && !useCable) dumbbellEnd(ctx, S, j.hand2, true, lw);
    var fd2 = sub(j.hand2, j.el2), fl2 = len(fd2) || 1;
    renderGroup(ctx, S, [B_(add(j.sho, j.t, -0.01), 0.041, 0.039), L_(j.sho, j.el2, K.ua), L_(j.el2, j.hand2, K.fa),
      B_(add(j.hand2, [fd2[0] / fl2, fd2[1] / fl2], 0.006), 0.03, 0.023, Math.atan2(fd2[1], fd2[0]))], COL.skinFar, lw);

    // Barra (detrás del brazo cercano)
    var bar = eq === 'barbell' || smith;
    if (bar && !useCable) {
      if (load === 'shoulders') plates(ctx, S, [j.sho[0] - 0.01, j.sho[1] - 0.005], lw);
      else if (load === 'hip') plates(ctx, S, [j.hip[0] + 0.01, j.hip[1] - 0.075], lw);
      else if (load === 'chest') plates(ctx, S, [j.sho[0] + 0.03, j.sho[1] + 0.01], lw);
      else if (load === 'hands') plates(ctx, S, j.hand, lw);
    }

    // Bicicleta / remo (estructura)
    if (key === 'bike' && j.pedals) {
      line(ctx, S, [0.4, 0.56], [0.5, 0.74], COL.metalDark, 0.02);
      line(ctx, S, [0.5, 0.74], [0.68, 0.45], COL.metalDark, 0.02);
      line(ctx, S, [0.68, 0.45], [0.72, 0.41], COL.metal, 0.014);
      rect(ctx, S, 0.33, 0.535, 0.13, 0.03, COL.pad, 0.012);
      line(ctx, S, [0.28, GROUND], [0.5, 0.74], COL.metalDark, 0.02);
      line(ctx, S, [0.72, GROUND], [0.5, 0.74], COL.metalDark, 0.02);
      circle(ctx, S, j.pedals[2], 0.03, COL.metal, COL.line, lw);
      line(ctx, S, j.pedals[0], j.pedals[1], COL.metal, 0.012);
    }
    if (key === 'rowErg') {
      rect(ctx, S, 0.12, 0.81, 0.78, 0.03, COL.metalDark, 0.01);
      rect(ctx, S, j.hip[0] - 0.07, 0.775, 0.14, 0.035, COL.pad, 0.012);
      circle(ctx, S, [0.86, 0.66], 0.085, '#2b2f38', COL.plateRim, lw * 1.3);
      circle(ctx, S, [0.86, 0.66], 0.03, COL.metalDark, null, 0);
      rotRect(ctx, S, 0.74, 0.79, rad(-50), -0.01, -0.06, 0.03, 0.1, COL.metal, 0.01);
      line(ctx, S, [0.86, 0.66], j.hand, COL.cable, 0.005);
      rect(ctx, S, 0.84, 0.74, 0.04, GROUND - 0.74, COL.metalDark);
    }

    // Cuerpo
    var upv = j.t, rotH = Math.atan2(upv[1], upv[0]) + Math.PI / 2;
    var nose = add(add(j.head, j.front, 0.047), upv, -0.006);
    renderGroup(ctx, S, [
      B_(add(j.hip, j.front, -0.028), 0.052, 0.05),
      L_(j.hip, j.sho, K.torso),
      L_(add(j.sho, j.t, -0.01), add(j.sho, j.t, 0.065), [[0, 0.075], [0.5, 0.06], [1, 0.056]]),
      B_(j.head, 0.046, 0.054, rotH),
      B_(add(add(j.head, j.front, 0.022), upv, -0.03), 0.03, 0.024, rotH),
      { k: 'path', fn: function (c, SS) {
        c.beginPath();
        c.moveTo((nose[0] - j.front[0] * 0.014 + upv[0] * 0.013) * SS, (nose[1] - j.front[1] * 0.014 + upv[1] * 0.013) * SS);
        c.lineTo((nose[0] + j.front[0] * 0.006) * SS, (nose[1] + j.front[1] * 0.006) * SS);
        c.lineTo((nose[0] - j.front[0] * 0.014 - upv[0] * 0.011) * SS, (nose[1] - j.front[1] * 0.014 - upv[1] * 0.011) * SS);
        c.closePath(); }, grad: function () { return '#f2f3f6'; } },
      L_(j.hip, j.knee, K.th), L_(j.knee, j.ank, K.sh), L_(j.ank, j.toe, K.foot)
    ], COL.skin, lw);
    // Pelo corto y oreja
    var hair = add(add(j.head, upv, 0.012), j.front, -0.008);
    ctx.beginPath(); ctx.ellipse(hair[0] * S, hair[1] * S, 0.046 * S, 0.044 * S, rotH, Math.PI, Math.PI * 2);
    ctx.fillStyle = 'rgba(120,128,142,0.35)'; ctx.fill();
    blob(ctx, S, add(j.head, j.front, -0.006), 0.009, 0.014, rotH, 'rgba(170,178,190,0.45)', 0);
    var gc = muscleColor('glutes', M);
    if (gc) softSpot(ctx, S, add(j.hip, j.front, -0.04), 0.05, 0.048, 0, gc);
    sideMuscles(ctx, S, j, M, true);
    sideAnatomyBody(ctx, S, j);

    // Elementos móviles de las máquinas
    if (key === 'legExt' || key === 'legCurl') circle(ctx, S, [j.ank[0], j.ank[1] + (key === 'legExt' ? -0.04 : 0)], 0.035, COL.pad, COL.line, lw);
    if (key === 'gluteKickback' && useCable) circle(ctx, S, j.ank, 0.022, COL.metalDark, COL.line, lw);
    if (key === 'seatedCalf') rect(ctx, S, j.knee[0] - 0.08, j.knee[1] - 0.075, 0.12, 0.035, COL.pad, 0.012);
    if (key === 'legPress') {
      var mid = [(j.toe[0] + j.ank[0]) / 2 + 0.02, (j.toe[1] + j.ank[1]) / 2 - 0.02], dd = sub(j.ank, j.toe);
      rotRect(ctx, S, mid[0], mid[1], Math.atan2(dd[1], dd[0]) + Math.PI / 2, -0.1, -0.02, 0.2, 0.03, COL.metal, 0.008);
      plates(ctx, S, [j.ank[0] + 0.1, j.ank[1] - 0.09], lw);
    }

    // Brazo cercano
    var fd = sub(j.hand, j.el), fl = len(fd) || 1;
    renderGroup(ctx, S, [B_(add(j.sho, j.t, -0.01), 0.042, 0.04), L_(j.sho, j.el, K.ua), L_(j.el, j.hand, K.fa),
      B_(add(j.hand, [fd[0] / fl, fd[1] / fl], 0.006), 0.03, 0.023, Math.atan2(fd[1], fd[0]))], COL.skin, lw);
    armMuscles(ctx, S, j, M, j.el, j.hand);
    var dc = muscleColor('delts', M);
    if (dc) softSpot(ctx, S, add(j.sho, j.t, -0.012), 0.045, 0.042, 0, dc);
    sideAnatomyArm(ctx, S, j, j.el, j.hand);

    // Carga en las manos
    if (load === 'hands' || load === 'chest') {
      if (eq === 'dumbbell' && !useCable) dumbbellEnd(ctx, S, j.hand, false, lw);
      if (eq === 'kettlebell') kettlebell(ctx, S, j.hand, lw);
    }
    if (useCable) rect(ctx, S, j.hand[0] - 0.018, j.hand[1] - 0.008, 0.036, 0.016, COL.metal, 0.006);
    if (key === 'chestPress' || (key === 'ohp' && eq === 'machine')) line(ctx, S, j.hand, [j.hand[0], j.hand[1] - 0.12], COL.metal, 0.014);
    if (key === 'pulldown' && useCable) line(ctx, S, [j.hand[0] - 0.08, j.hand[1]], [j.hand[0] + 0.08, j.hand[1]], COL.metal, 0.012);
  }

  // =====================================================================
  //  FIGURA FRONTAL
  // =====================================================================
  function drawFront(ctx, S, key, def, j, a, eq, M, lift, lw, phase) {
    var load = def.load || 'none';
    var useCable = eq === 'cable';
    var hasStack = useCable || (eq === 'machine' && def.stack);
    var c;
    var topPulley = hasStack ? weightStack(ctx, S, 0.9, lift * 0.11, lw) : null;

    var hy = j.hipY + 0.02, sy = j.shoY, cx = j.cx;
    function torsoFn(ctx2, SS) {
      ctx2.beginPath();
      ctx2.moveTo((cx - 0.075) * SS, (hy + 0.01) * SS);
      ctx2.quadraticCurveTo((cx - 0.058) * SS, (hy - 0.1) * SS, (cx - 0.078) * SS, (sy + 0.15) * SS);
      ctx2.quadraticCurveTo((cx - 0.118) * SS, (sy + 0.06) * SS, (cx - 0.112) * SS, (sy - 0.005) * SS);
      ctx2.quadraticCurveTo((cx - 0.065) * SS, (sy - 0.045) * SS, (cx - 0.03) * SS, (sy - 0.05) * SS);
      ctx2.lineTo((cx + 0.03) * SS, (sy - 0.05) * SS);
      ctx2.quadraticCurveTo((cx + 0.065) * SS, (sy - 0.045) * SS, (cx + 0.112) * SS, (sy - 0.005) * SS);
      ctx2.quadraticCurveTo((cx + 0.118) * SS, (sy + 0.06) * SS, (cx + 0.078) * SS, (sy + 0.15) * SS);
      ctx2.quadraticCurveTo((cx + 0.058) * SS, (hy - 0.1) * SS, (cx + 0.075) * SS, (hy + 0.01) * SS);
      ctx2.closePath();
    }
    function torsoGrad(ctx2, SS) {
      var tg = ctx2.createLinearGradient((cx - 0.12) * SS, 0, (cx + 0.12) * SS, 0);
      tg.addColorStop(0, '#d3d7de'); tg.addColorStop(0.32, '#ffffff'); tg.addColorStop(0.7, '#eef0f3'); tg.addColorStop(1, '#cbd0d8');
      return tg;
    }
    var body = [B_([cx, j.hipY + 0.008], 0.088, 0.052)];
    ['L', 'R'].forEach(function (sd) {
      var sp = j[sd], sg = sd === 'L' ? -1 : 1;
      body.push(L_(sp.hip, sp.knee, KF_TH), L_(sp.knee, sp.ank, K.sh), L_(sp.ank, [sp.ank[0] + sg * 0.035, sp.ank[1] + 0.012], K.foot));
    });
    body.push({ k: 'path', fn: torsoFn, grad: torsoGrad });
    body.push(L_([cx, sy + 0.01], j.neck, [[0, 0.075], [0.6, 0.062], [1, 0.058]]));
    body.push(B_([j.head[0] - 0.045, j.head[1] + 0.006], 0.008, 0.015), B_([j.head[0] + 0.045, j.head[1] + 0.006], 0.008, 0.015));
    body.push(B_(j.head, 0.044, 0.054));
    renderGroup(ctx, S, body, COL.skin, lw);
    // Pelo
    ctx.beginPath(); ctx.ellipse(j.head[0] * S, (j.head[1] - 0.012) * S, 0.045 * S, 0.044 * S, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fillStyle = 'rgba(120,128,142,0.35)'; ctx.fill();

    // Músculos trabajados (frente)
    ['L', 'R'].forEach(function (sd) {
      var sp = j[sd], sg = sd === 'L' ? -1 : 1;
      if ((c = muscleColor('quads', M))) {
        var m = [lerp(sp.hip[0], sp.knee[0], 0.5), lerp(sp.hip[1], sp.knee[1], 0.5)];
        softSpot(ctx, S, m, 0.075, 0.03, Math.atan2(sp.knee[1] - sp.hip[1], sp.knee[0] - sp.hip[0]), c);
      }
      if ((c = muscleColor('calves', M))) {
        var m2 = [lerp(sp.knee[0], sp.ank[0], 0.3) + sg * 0.012, lerp(sp.knee[1], sp.ank[1], 0.3)];
        softSpot(ctx, S, m2, 0.05, 0.016, Math.atan2(sp.ank[1] - sp.knee[1], sp.ank[0] - sp.knee[0]), c);
      }
      // Anatomía de piernas: separación del cuádriceps, rodilla y gemelo
      var fq = [sg * -1 * Math.cos(Math.atan2(sp.knee[1] - sp.hip[1], sp.knee[0] - sp.hip[0]) + Math.PI / 2), 0];
      var nrm = (function () { var d = sub(sp.knee, sp.hip), l = len(d) || 1; return [-d[1] / l * sg, d[0] / l * sg]; })();
      detail(ctx, S, sp.hip, sp.knee, K.th, nrm, [[0.15, -0.2], [0.5, -0.05], [0.85, -0.25]], 0.26);
      detail(ctx, S, sp.hip, sp.knee, K.th, nrm, [[0.62, -0.95], [0.84, -0.55], [0.96, -0.7]], 0.3);
      sheen(ctx, S, sp.hip, sp.knee, K.th, nrm, 0.42, 0.2, 0.06, 0.026, 0.75);
      var nrm2 = (function () { var d = sub(sp.ank, sp.knee), l = len(d) || 1; return [-d[1] / l * sg, d[0] / l * sg]; })();
      detail(ctx, S, sp.knee, sp.ank, K.sh, nrm2, [[-0.05, -0.5], [0.04, 0], [-0.05, 0.5]], 0.24);
      detail(ctx, S, sp.knee, sp.ank, K.sh, nrm2, [[0.12, 0.85], [0.3, 0.55], [0.55, 0.7]], 0.24);
    });
    if ((c = muscleColor('glutes', M))) {
      softSpot(ctx, S, [cx - 0.072, j.hipY - 0.005], 0.026, 0.04, 0, c);
      softSpot(ctx, S, [cx + 0.072, j.hipY - 0.005], 0.026, 0.04, 0, c);
    }
    if ((c = muscleColor('pecs', M))) { softSpot(ctx, S, [cx - 0.05, sy + 0.05], 0.048, 0.03, 0, c); softSpot(ctx, S, [cx + 0.05, sy + 0.05], 0.048, 0.03, 0, c); }
    if ((c = muscleColor('abs', M))) for (var r = 0; r < 3; r++) for (var q = -1; q <= 1; q += 2) rect(ctx, S, cx + (q < 0 ? -0.04 : 0.006), sy + 0.11 + r * 0.045, 0.034, 0.038, c, 0.01);
    if ((c = muscleColor('traps', M))) {
      ctx.beginPath(); ctx.moveTo((cx - 0.03) * S, (sy - 0.05) * S); ctx.lineTo((cx - 0.1) * S, (sy - 0.008) * S); ctx.lineTo((cx - 0.03) * S, (sy + 0.005) * S); ctx.closePath(); ctx.fillStyle = c; ctx.fill();
      ctx.beginPath(); ctx.moveTo((cx + 0.03) * S, (sy - 0.05) * S); ctx.lineTo((cx + 0.1) * S, (sy - 0.008) * S); ctx.lineTo((cx + 0.03) * S, (sy + 0.005) * S); ctx.closePath(); ctx.fill();
    }
    // Anatomía del torso: pectorales, esternón, abdominales, oblicuos y clavículas
    function crv(pts, alpha, wm) {
      ctx.beginPath(); ctx.moveTo(pts[0][0] * S, pts[0][1] * S);
      for (var i = 1; i < pts.length - 1; i++) { var mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0] * S, pts[i][1] * S, mx * S, my * S); }
      var lp = pts[pts.length - 1]; ctx.lineTo(lp[0] * S, lp[1] * S);
      ctx.strokeStyle = 'rgba(70,78,94,' + alpha + ')'; ctx.lineWidth = (wm || 1) * S * 0.0042; ctx.lineCap = 'round'; ctx.stroke();
    }
    [-1, 1].forEach(function (sg) {
      crv([[cx + sg * 0.004, sy + 0.088], [cx + sg * 0.05, sy + 0.1], [cx + sg * 0.09, sy + 0.035]], 0.38, 1.1);
      crv([[cx + sg * 0.02, sy - 0.03], [cx + sg * 0.06, sy - 0.022], [cx + sg * 0.1, sy - 0.012]], 0.2);
      crv([[cx + sg * 0.072, sy + 0.12], [cx + sg * 0.058, hy - 0.06], [cx + sg * 0.03, hy - 0.005]], 0.28);
      crv([[cx + sg * 0.112, sy + 0.01], [cx + sg * 0.095, sy + 0.08], [cx + sg * 0.078, sy + 0.14]], 0.2);
      var gg = ctx.createRadialGradient((cx + sg * 0.045) * S, (sy + 0.04) * S, 0, (cx + sg * 0.045) * S, (sy + 0.04) * S, 0.05 * S);
      gg.addColorStop(0, 'rgba(255,255,255,0.85)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.ellipse((cx + sg * 0.045) * S, (sy + 0.04) * S, 0.05 * S, 0.03 * S, 0, 0, Math.PI * 2); ctx.fillStyle = gg; ctx.fill();
    });
    crv([[cx, sy + 0.02], [cx, sy + 0.1], [cx, hy - 0.035]], 0.3);
    for (var rr = 0; rr < 3; rr++) { var yy = sy + 0.145 + rr * 0.045; crv([[cx - 0.038, yy], [cx - 0.018, yy + 0.006], [cx, yy]], 0.24); crv([[cx, yy], [cx + 0.018, yy + 0.006], [cx + 0.038, yy]], 0.24); }

    // Cuerda (detrás)
    if (load === 'rope') {
      var ang = phase * Math.PI * 2, ry = 0.36 * Math.cos(ang);
      ctx.beginPath();
      ctx.ellipse(cx * S, (j.L.hand[1] + ry * 0.5 + 0.18) * S, (j.R.hand[0] - j.L.hand[0]) / 2 * S, Math.abs(ry) * 0.5 * S + 1, 0, Math.cos(ang) > 0 ? 0 : Math.PI, Math.cos(ang) > 0 ? Math.PI : Math.PI * 2);
      ctx.strokeStyle = '#ff8a3d'; ctx.lineWidth = 0.008 * S; ctx.stroke();
    }

    // Barra delante (remo al mentón)
    var barFront = (load === 'barFront' && (eq === 'barbell' || eq === 'machine')) || (key === 'shrug' && eq === 'barbell');
    if (useCable) {
      ['L', 'R'].forEach(function (sd) {
        var s = j[sd], anchor = [sd === 'L' ? 0.08 : 0.92, GROUND - 0.05];
        if (key === 'uprightRow' || key === 'shrug') anchor = [0.5, GROUND - 0.05];
        pulley(ctx, S, anchor, lw);
        line(ctx, S, anchor, load === 'ankle' ? s.ank : s.hand, COL.cable, 0.005);
      });
      if (topPulley) line(ctx, S, topPulley, [0.92, GROUND - 0.05], COL.cable, 0.004);
    }

    // Brazos
    ['L', 'R'].forEach(function (sd) {
      var s = j[sd], sg = sd === 'L' ? -1 : 1;
      var fdx = sub(s.hand, s.el), flx = len(fdx) || 1;
      renderGroup(ctx, S, [B_(s.sho, 0.044, 0.041), L_(s.sho, s.el, K.ua), L_(s.el, s.hand, K.fa),
        B_(add(s.hand, [fdx[0] / flx, fdx[1] / flx], 0.006), 0.03, 0.023, Math.atan2(fdx[1], fdx[0]))], COL.skin, lw);
      var an = (function () { var d = sub(s.el, s.sho), l = len(d) || 1; return [d[1] / l * sg, -d[0] / l * sg]; })();
      detail(ctx, S, s.sho, s.el, K.ua, an, [[0.4, 0.95], [0.28, 0.2], [0.38, -0.95]], 0.34, 1.1);
      detail(ctx, S, s.sho, s.el, K.ua, an, [[0.45, 0.3], [0.68, 0.25], [0.9, 0.35]], 0.26);
      sheen(ctx, S, s.sho, s.el, K.ua, an, 0.1, 0.0, 0.04, 0.03, 0.85);
      if ((c = muscleColor('delts', M))) softSpot(ctx, S, s.sho, 0.048, 0.045, 0, c);
      if ((c = muscleColor('biceps', M))) {
        var m = [lerp(s.sho[0], s.el[0], 0.6), lerp(s.sho[1], s.el[1], 0.6)];
        softSpot(ctx, S, m, 0.045, 0.02, Math.atan2(s.el[1] - s.sho[1], s.el[0] - s.sho[0]), c);
      }
      if ((c = muscleColor('forearms', M))) {
        var m3 = [lerp(s.el[0], s.hand[0], 0.35), lerp(s.el[1], s.hand[1], 0.35)];
        softSpot(ctx, S, m3, 0.04, 0.018, Math.atan2(s.hand[1] - s.el[1], s.hand[0] - s.el[0]), c);
      }
      if (eq === 'dumbbell' && load === 'hands') dumbbellEnd(ctx, S, s.hand, false, lw);
      if (eq === 'kettlebell' && load === 'hands') kettlebell(ctx, S, s.hand, lw);
      if (load === 'ankle' && sd === 'R' && (eq === 'machine' || eq === 'band' || eq === 'none')) {}
    });
    if (barFront || (key === 'shrug' && eq === 'machine')) {
      var y = (j.L.hand[1] + j.R.hand[1]) / 2;
      rect(ctx, S, 0.06, y - 0.008, 0.88, 0.016, COL.metal, 0.006);
      [0.08, 0.11, 0.89, 0.86].forEach(function (x) { rect(ctx, S, x - 0.012, y - 0.1, 0.024, 0.2, COL.plate, 0.006); });
      circle(ctx, S, j.L.hand, 0.03, COL.skin, COL.line, lw);
      circle(ctx, S, j.R.hand, 0.03, COL.skin, COL.line, lw);
    }
    if (load === 'ankle') circle(ctx, S, j.R.ank, 0.022, COL.metalDark, COL.line, lw);
  }

  // =====================================================================
  //  ESCENA COMPLETA
  // =====================================================================
  var MUSCLE_MAP = { chest: 'pecs', back: 'lats', shoulders: 'delts', biceps: 'biceps', triceps: 'triceps', forearms: 'forearms',
    quads: 'quads', hamstrings: 'hams', glutes: 'glutes', calves: 'calves', core: 'abs' };

  function labelFor(def, eq, key) {
    var load = def.load || 'none';
    if (eq === 'cable' || load === 'cableHigh' || load === 'cableFront') return 'MÁX';
    if (eq === 'machine') return def.smith ? '100 kg' : 'MÁX';
    if (load === 'machine') return 'MÁX';
    if (eq === 'barbell') return '100 kg';
    if (eq === 'dumbbell') return (key === 'dbRow' || key === 'kickback') ? '40 kg' : '2 × 40 kg';
    if (eq === 'kettlebell') return '40 kg';
    return '';
  }

  // Ritmo: subida (0–0.38), pausa, bajada lenta (0.48–0.9), pausa
  function tempo(phase, linear) {
    if (linear) return 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
    if (phase < 0.38) return ease(phase / 0.38);
    if (phase < 0.48) return 1;
    if (phase < 0.9) return 1 - ease((phase - 0.48) / 0.42);
    return 0;
  }

  function draw(ctx, size, key, equipment, phase, muscleOverride) {
    var def = P[key] || P.curl;
    var S = size, lw = Math.max(1, size * 0.006);
    var eq = equipment || 'none';
    var u = tempo(phase, def.linear);
    var M = { p: (def.p || []).slice(), s: (def.s || []).slice() };
    if (muscleOverride && MUSCLE_MAP[muscleOverride]) {
      var mm = MUSCLE_MAP[muscleOverride];
      if (M.p.indexOf(mm) < 0) { M.s = M.s.concat(M.p); M.p = [mm]; }
    }
    var liftAt = def.liftAt == null ? 1 : def.liftAt;
    var lift = liftAt === 1 ? u : 1 - u;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, S, S);
    var g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, COL.bg1); g.addColorStop(1, COL.bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = COL.floor; ctx.fillRect(0, GROUND * S, S, S);

    var Z = 0.86;
    ctx.translate(0.5 * S * (1 - Z), GROUND * S * (1 - Z)); ctx.scale(Z, Z);

    if (def.view === 'front') {
      var jf = solveFront(mix(def.frames[0], def.frames[1], u));
      var af = solveFront(def.frames[0]);
      // Ajuste al suelo
      var dy = GROUND - 0.005 - jf.ground;
      if (key !== 'jumpingJack' && key !== 'jumpRope') {
        ctx.translate(0, dy * S);
      } else {
        ctx.translate(0, (GROUND - 0.005 - af.ground) * S);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath();
      ctx.ellipse(0.5 * S, (af.ground + 0.012) * S, 0.17 * S, 0.016 * S, 0, 0, Math.PI * 2); ctx.fill();
      drawFront(ctx, S, key, def, jf, af, eq, M, lift, lw, phase);
    } else {
      var j, a;
      if (def.custom) { j = solveCustom(def.custom, phase, u); a = j; }
      else { j = solveSide(mix(def.frames[0], def.frames[1], u)); a = solveSide(def.frames[0]); }
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath();
      ctx.ellipse(a.ank[0] * S, (GROUND + 0.012) * S, 0.17 * S, 0.016 * S, 0, 0, Math.PI * 2); ctx.fill();
      drawSide(ctx, S, key, def, j, a, eq, M, lift, lw);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var text = labelFor(def, eq, key);
    if (text) label(ctx, S, text);
    ctx.restore();
  }

  function animate(canvas, key, equipment, period, muscleOverride) {
    var ctx = canvas.getContext('2d'), dpr = global.devicePixelRatio || 1;
    var T = (period || 3000), start = null, size = 0;
    function frame(ts) {
      if (start === null) start = ts;
      var w = canvas.clientWidth || 300;
      if (w !== size) { size = w; canvas.width = size * dpr; canvas.height = size * dpr; }
      draw(ctx, size * dpr, key, equipment, ((ts - start) % T) / T, muscleOverride);
      global.requestAnimationFrame(frame);
    }
    global.requestAnimationFrame(frame);
  }

  global.FORJA = { draw: draw, animate: animate, patterns: Object.keys(P).filter(function (k) { return k !== 'lateral'; }) };
})(window);
