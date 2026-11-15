  // ================= Lote 6: cardio y cuerpo completo =================
  // Caminar: marcha natural con braceo opuesto a las piernas
  variant('walkFree', 'walk', { cyclic: 'walk2', load: 'none', p: ['quads', 'glutes', 'calves'], s: ['hams', 'tibialis'], period: 1150, gait: {}, cam: { az: 30 } });
  // Cinta inclinada: pasos algo más cortos, tronco ligeramente adelante; trabajan más glúteos, isquios y gemelos
  variant('treadmillIncline', 'walk', { cyclic: 'walk2', load: 'none', scene: ['treadmill'], p: ['glutes', 'calves', 'hams'], s: ['quads'], period: 1200, gait: { belt: true, incline: 12, lean: 3, stride: 0.9 }, cam: { az: 28 } });
  // Senderismo: mochila a la espalda, manos en las correas y tronco algo adelantado
  variant('hike', 'walk', { cyclic: 'walk2', load: 'none', backpack: true, p: ['quads', 'glutes', 'calves'], s: ['hams', 'abs'], period: 1250, gait: { lean: 6, stride: 0.95 }, cam: { az: 35 } });
  // Correr al aire libre: la misma zancada de la cinta, sobre el suelo
  variant('runOutdoor', 'run', { scene: [], belt: false, period: 720, cam: { az: 30 } });
  // Elíptica: zancada elíptica con los talones apoyados; empuja y tira de las asas al ritmo de las piernas
  variant('elliptical', 'walk', { cyclic: 'elliptical', load: 'none', scene: ['elliptical'], p: ['quads', 'glutes'], s: ['hams', 'calves', 'deltsF', 'lats'], period: 1300, cam: { az: 25 } });
  // Escaladora (stepmill): sube peldaño a peldaño con todo el pie apoyado; manos apoyadas suave en las barandillas
  variant('stairClimber', 'walk', { cyclic: 'stair', load: 'none', scene: ['stair'], p: ['glutes', 'quads'], s: ['hams', 'calves'], period: 1400, cam: { az: 20 } });
  // Bicicleta de aire: pedalea y a la vez empuja y tira de las asas (brazo contrario a la pierna que empuja)
  variant('airBike', 'bike', { scene: ['airbike'], p: ['quads', 'glutes'], s: ['deltsF', 'lats', 'triceps', 'biceps', 'calves'], period: 1100, bikeFit: { hip: [-0.3, 0.98], torso: 12, air: true, hands: [0.12, 1.15] }, cam: { az: 28 } });
  // Ciclismo en carretera: tronco inclinado unos 45°, manos en las manetas y codos algo flexionados
  variant('roadCycling', 'bike', { scene: ['roadbike'], p: ['quads', 'glutes'], s: ['hams', 'calves'], period: 1000, bikeFit: { hip: [-0.3, 0.98], torso: 48, head: -22, hands: [0.43, 1.0], gw: 0.2, palm: 'neu', pole: [-0.2, -1, 0.4] }, cam: { az: 20 } });
  // Empuje de trineo: tronco a ~50°, brazos casi estirados en los postes y zancadas de empuje con la punta del pie
  variant('sledPush', 'walk', { cyclic: 'sled', load: 'none', scene: ['sledPush'], p: ['quads', 'glutes'], s: ['calves', 'hams', 'deltsF', 'triceps', 'abs'], period: 1300, cam: { az: 25 } });
  // Natación (crol): brazada alterna con codo alto, rolido del cuerpo y patada de seis tiempos
  variant('swim', 'walk', { cyclic: 'swim', load: 'none', scene: ['pool'], p: ['lats', 'delts'], s: ['triceps', 'pecs', 'abs', 'glutes', 'quads'], period: 1800, cam: { az: 20, el: 24, y: 0.5, dist: 0.85 } });

  // ---------------- Kettlebell a una mano (derecha) ----------------
  (function () {
    var lg = { ik: [0.0, ANK], fw: 0.2 }, free = { rel: [0.05, HANG + 0.02, 0.12], palm: 'neu' };
    function kp(hip, tor, hand, pole, rack, head, free2) { return { hip: hip, torso: tor, head: head || -tor * 0.35, legs: lg, armsR: { ik: hand, straight: rack < 0.3 || hand[1] > 1.6 ? 1 : 0, palm: 'neu', pole: pole }, armsL: free2 || free, kbRack: rack }; }
    // Swing a una mano: la pesa pasa alta entre las piernas, cadera atrás, y el golpe de cadera la lleva a la altura del pecho
    var H = kp([-0.27, 0.73], 60, [-0.16, 0.56, 0.02], [-1, 0.2, 0.3], 0), M = kp([-0.08, 0.92], 18, [0.25, 0.78, 0.04], [-0.3, -1, 0.3], 0), T = kp(STAND, -2, [0.52, 1.25, 0.06], [-0.3, -1, 0.3], 0);
    variant('kbSwingOne', 'swing', { side: 'R', both: ['glutes', 'hams', 'lowback'], kbHand: ['R', 'hang'], A: null, B: null, s: ['delts', 'lowback', 'abs', 'forearms'], period: 1700, thumb: 0.5,
      keys: [[0, H], [0.2, M], [0.42, T], [0.52, T], [0.72, M], [0.92, H], [1, H]] });
    // Cargada con kettlebell: desde la pasada entre las piernas, la pesa sube pegada al cuerpo y gira alrededor de la mano hasta la posición de rack
    var C1 = kp([-0.08, 0.93], 16, [0.14, 0.92, 0.06], [0.2, -1, 0.3], 0.25), C2 = kp(STAND, 0, (function () { var b = { hip: STAND, torso: 0, legs: lg }; var r = relIk(b, [0.15, -0.1]); return [r[0], r[1], 0.1]; })(), [0.3, -1, 0.15], 1, 0);
    variant('kbClean', 'swing', { side: 'R', both: ['glutes', 'hams', 'abs'], kbHand: ['R', 'hang'], A: null, B: null, p: ['glutes', 'hams', 'deltsF'], s: ['biceps', 'forearms', 'traps', 'abs'], period: 2200, thumb: 0.45,
      keys: [[0, H], [0.08, H], [0.24, C1], [0.36, C2], [0.56, C2], [0.7, C1], [0.88, H], [1, H]] });
    // Arrancada con kettlebell: desde la pasada, tirón alto pegado al cuerpo y bloqueo por encima de la cabeza con la pesa sobre el antebrazo
    var S0 = kp([-0.03, 0.96], 4, [0.3, 0.9, 0.05], [-0.3, -1, 0.3], 0.1);
    var S1 = kp([-0.05, 0.95], 10, [0.22, 1.12, 0.1], [0.2, -1, 0.6], 0.4), S2 = kp(STAND, -1, (function () { var b = { hip: STAND, torso: -1, legs: lg }; var r = relIk(b, [0.02, 0.52]); return [r[0], r[1], 0.17]; })(), [0, -1, 0.5], 1, 0);
    variant('kbSnatch', 'swing', { side: 'R', both: ['glutes', 'hams', 'abs'], kbHand: ['R', 'hang'], A: null, B: null, p: ['glutes', 'hams', 'delts'], s: ['traps', 'triceps', 'forearms', 'abs'], period: 2300, thumb: 0.45,
      keys: [[0, H], [0.08, H], [0.17, S0], [0.25, S1], [0.36, S2], [0.54, S2], [0.65, S1], [0.74, S0], [0.88, H], [1, H]] });
  })();
  // Pull-through en polea: de espaldas a la polea baja, cuerda entre las piernas; bisagra de cadera y extensión con glúteos
  variant('pullThrough', 'swing', { load: 'facePull', rope: true, stack: true, towerPos: [-1.05, 0], anchor: [-0.97, 0.16, 0], kbHand: null, p: ['glutes', 'hams'], s: ['lowback', 'adductors'], cam: { az: 40 },
    A: { hip: [-0.22, 0.76], torso: 62, head: -18, legs: { ik: [0.0, ANK], fw: 0.21 }, arms: { ik: [-0.1, 0.52], gw: 0.035, straight: 1, palm: 'neu' } },
    B: { hip: STAND, torso: -1, head: 0, legs: { ik: [0.0, ANK], fw: 0.21 }, arms: { ik: [0.13, 0.76], gw: 0.035, straight: 1, palm: 'neu' } } });

  // ---------------- Olímpicos con barra ----------------
  (function () {
    var K = P.powerClean.keys, ft = { ik: [-0.04, ANK], fw: 0.13 };
    // las piernas se definen por separado en todas las fases para poder abrir la tijera del envión sin mezclar modos
    function sep(p, L, R) { var q = cloneP(p); delete q.legs; q.legsL = L || cloneP(ft); q.legsR = R || cloneP(ft); return q; }
    // salida desde el suelo con la espalda a ~60° (cadera por encima de las rodillas) y primer tirón manteniendo ese ángulo
    var C0 = sep({ hip: [-0.26, 0.575], torso: 63, head: -19, arms: { ik: [0.082, 0.225], gw: 0.25, palm: 'pro' } }), C1 = sep({ hip: [-0.28, 0.76], torso: 60, head: -18, arms: { ik: [0.075, 0.45], gw: 0.25, palm: 'pro' } }), C2 = sep(K[3][1]), C3 = sep(K[4][1]), C4 = sep(K[5][1]), C5 = sep(K[6][1]), C6 = sep(K[7][1]);
    function rackAt(base, rc, pole, st) { var q = cloneP(base); q.arms = { ik: relIk(base, rc), gw: 0.25, palm: 'pro', pole: pole || [0.4, -1, 0.5], straight: st ? 1 : 0 }; return q; }
    var stand = sep({ hip: STAND, torso: 0 });
    // Cargada y press: cargada de potencia a los hombros y press estricto por encima de la cabeza
    var Pm = rackAt(stand, [0.11, 0.3]), Pt = rackAt(stand, [0.03, 0.5], null, true);
    variant('cleanPress', 'deadlift', { cam: { az: 68, el: 8 }, p: ['glutes', 'quads', 'delts'], s: ['traps', 'triceps', 'hams', 'abs'], bakeBar: true, thumb: 0.57, period: 6200,
      keys: [[0, C0], [0.05, C0], [0.14, C1], [0.2, C2], [0.23, C3], [0.27, C4], [0.31, C5], [0.37, C6], [0.43, C6], [0.5, Pm], [0.57, Pt], [0.63, Pt], [0.7, Pm], [0.77, C6], [0.84, C2], [0.92, C1], [1, C0]] });
    // Envión: cargada, flexión corta de rodillas, impulso y recepción en tijera con la barra bloqueada; junta los pies y baja
    var dip = rackAt(sep({ hip: [-0.03, 0.9], torso: 2 }), [0.19, 0.06], [1, 0.5, 0.3]), drive = rackAt(sep({ hip: [0, 0.99], torso: 0 }), [0.12, 0.3]);
    var spL = { ik: [0.36, ANK], fw: 0.13 }, spR = { ik: [-0.5, 0.15], fw: 0.13, foot: 38 };
    var split = rackAt(sep({ hip: [-0.05, 0.8], torso: 0 }, spL, spR), [0.0, 0.52], null, true);
    var rec1 = rackAt(sep({ hip: [-0.1, 0.92], torso: 0 }, { ik: [0.12, ANK], fw: 0.13 }, spR), [0.0, 0.52], null, true);
    var lock = rackAt(sep({ hip: [0.0, 0.97], torso: 0 }, { ik: [0.12, ANK], fw: 0.13 }, { ik: [0.1, ANK], fw: 0.13 }), [0.02, 0.52], null, true);
    variant('cleanJerk', 'deadlift', { cam: { az: 68, el: 8 }, p: ['glutes', 'quads', 'delts'], s: ['traps', 'triceps', 'hams', 'abs'], bakeBar: true, thumb: 0.58, period: 7000,
      keys: [[0, C0], [0.05, C0], [0.13, C1], [0.18, C2], [0.21, C3], [0.25, C4], [0.29, C5], [0.34, C6], [0.4, C6], [0.46, dip], [0.5, drive], [0.55, split], [0.6, split], [0.66, rec1], [0.72, lock], [0.76, lock], [0.83, C6], [0.89, C2], [0.95, C1], [1, C0]] });
  })();
  // Arrancada: agarre ancho, tirón desde el suelo, triple extensión, tirón por debajo y recepción en sentadilla con la barra bloqueada encima de la cabeza
  (function () {
    var GW = 0.42, lp = { ik: [-0.04, ANK], fw: 0.14 }, lc = { ik: [-0.02, ANK], fw: 0.2, toe: 15 };
    function sp(hip, tor, bar, legs, extra, st) { return Object.assign({ hip: hip, torso: tor, head: -tor * 0.3, legs: legs || lp, arms: { ik: bar, gw: GW, palm: 'pro', straight: st === false ? 0 : 1 } }, extra || {}); }
    function over(b, rc) { var q = cloneP(b); q.arms = { ik: relIk(b, rc), gw: GW, palm: 'pro', straight: 1 }; return q; }
    var S0 = sp([-0.27, 0.53], 64, [0.082, 0.225]), S1 = sp([-0.29, 0.72], 62, [0.075, 0.45]), S2 = sp([-0.12, 0.9], 18, [0.05, 0.78]);
    var S3 = sp([0.0, 1.03], -6, [0.04, 0.93], { ik: [-0.04, ANK + 0.05], fw: 0.14, foot: 30 }, { shr: 0.05 });
    var S4 = sp([-0.06, 0.8], 8, [0.03, 1.38], lc, { arms: null }, false); S4.arms = { ik: [0.03, 1.38], gw: GW, palm: 'pro', straight: 0, pole: [0, 1, 1] };
    var S5 = over({ hip: [-0.2, 0.46], torso: 24, head: -4, legs: lc }, [-0.12, 0.49]), S6 = over({ hip: STAND, torso: 0, legs: lp }, [-0.03, 0.51]);
    var D1 = sp([-0.03, 0.95], 5, [0.05, 0.8]);
    variant('snatch', 'deadlift', { p: ['glutes', 'quads', 'traps'], s: ['hams', 'delts', 'triceps', 'lowback', 'abs'], bakeBar: true, thumb: 0.5, period: 6500, cam: { az: 68, el: 8 },
      keys: [[0, S0], [0.05, S0], [0.15, S1], [0.22, S2], [0.26, S3], [0.31, S4], [0.38, S5], [0.45, S5], [0.56, S6], [0.64, S6], [0.74, D1], [0.86, S1], [0.95, S0], [1, S0]] });
  })();

  // ---------------- Peso corporal: burpee, flexión con palmada, caminata del oso ----------------
  (function () {
    function hd(x, y, gw, dir, palm) { return { ik: [x, y], gw: gw, hand: 'flat', flatDir: dir, flatPalm: palm || [0, -1, 0], pole: [-1, 0.3, 0.45] }; }
    var floor = function (x, gw) { return hd(x, 0.06, gw || 0.29, [1, 0, 0.15]); };
    var LS = { ik: [0, ANK], fw: 0.14 }, LP = { ik: [-0.92, 0.207], fw: 0.1, foot: 65, pole: [0.6, -1, 0.15] }; // boca abajo la rodilla se dobla hacia el suelo
    // Burpee: de pie, cuclillas con manos al suelo, pies atrás a plancha, pecho al suelo, plancha, pies adelante, salto con palmada arriba
    var B0 = { hip: STAND, torso: 0, legs: LS, arms: hd(0.03, 0.9, 0.22, [0, -1, 0.05], [-0.2, 0, -1]) };
    var B1 = { hip: [-0.08, 0.44], torso: 72, head: -18, legs: { ik: [0, ANK], fw: 0.15, pole: [1, -0.3, 0.25] }, arms: floor(0.28, 0.24) };
    var B2 = { hip: [-0.08, 0.425], torso: 68, head: -8, legs: LP, arms: floor(0.33) }, B3 = { hip: [-0.03, 0.25], torso: 82, head: -6, legs: LP, arms: floor(0.33) };
    var BJ = { hip: [-0.1, 0.46], torso: 72, head: -14, legs: { ik: [-0.48, 0.26], fw: 0.12, foot: 50, pole: [0.8, -1, 0.2] }, arms: floor(0.31, 0.26) }; // salto de pies: los pies despegan del suelo
    var Bu0 = { hip: [-0.06, 0.72], torso: 34, head: -6, legs: { ik: [0, ANK], fw: 0.15, pole: [1, -0.1, 0.25] } }, Bu = Object.assign({ arms: at(Bu0, 0.15, -1, 0.22, [0.15, -1, 0], [-0.3, 0, -1]) }, Bu0); // se incorpora con las manos despegando del suelo
    // mano a 0,48 m del hombro en la dirección indicada (siempre alcanzable)
    function at(b, dx, dy, gw, dir, palm) { var s0 = shoAt(b), n = Math.hypot(dx, dy); return hd(s0.x + dx / n * 0.48, s0.y + dy / n * 0.48, gw, dir, palm); }
    var Bd0 = { hip: [-0.07, 0.72], torso: 40, head: -10, legs: { ik: [0, ANK], fw: 0.15, pole: [1, -0.1, 0.25] } }, Bd = Object.assign({ arms: at(Bd0, 0.25, -1, 0.23, [0.3, -1, 0], [-0.3, 0, -1]) }, Bd0); // bajando: las manos van al suelo a la vez que el cuerpo
    var Br0 = { hip: [-0.09, 0.6], torso: 56, head: -12, legs: { ik: [0, ANK], fw: 0.15, pole: [1, -0.2, 0.25] } }, Br = Object.assign({ arms: at(Br0, 0.2, -1, 0.23, [0.3, -1, 0], [-0.3, 0, -1]) }, Br0);
    var Ba = { hip: STAND, torso: 0, legs: LS, arms: hd(0.04, 1.42, 0.69, [0, 0.1, 1], [0, -1, 0]) }; // al bajar, los brazos estirados abren por los lados
    var B6 = { hip: [0, 1.07], torso: -2, legs: { ik: [0, ANK + 0.1], fw: 0.12, foot: 32, pole: [1, 0.1, 0.2] }, arms: hd(0.08, 1.98, 0.05, [0.15, 1, 0], [0, 0, -1]) };
    variant('burpee', 'pushup', { p: ['quads', 'pecs', 'glutes'], s: ['triceps', 'deltsF', 'abs', 'calves', 'hams'], A: null, B: null, liftAt: null, period: 3200, thumb: 0.36, cam: { az: 35, y: 1.0, dist: 1.2 },
      keys: [[0, B0], [0.07, B0], [0.12, Bd], [0.16, B1], [0.21, BJ], [0.27, B2], [0.36, B3], [0.45, B2], [0.5, BJ], [0.56, B1], [0.585, Br], [0.61, Bu], [0.67, B6], [0.73, Ba], [0.8, B0], [1, B0]] });
    // Flexión con palmada: bajada controlada, empuje explosivo que despega las manos, palmada delante del pecho y recepción
    var CT = { hip: [-0.08, 0.415], torso: 69, legs: LP, arms: floor(0.33) }, CB = { hip: [-0.03, 0.27], torso: 81, legs: LP, arms: floor(0.33) };
    var CA = { hip: [-0.06, 0.56], torso: 60, legs: LP, arms: hd(0.24, 0.42, 0.03, [1, 0.4, 0], [0, 0, -1]) };
    variant('pushupClap', 'pushup', { p: ['pecs', 'triceps'], s: ['deltsF', 'abs'], A: null, B: null, liftAt: null, period: 2400, thumb: 0.55,
      keys: [[0, CT], [0.1, CT], [0.36, CB], [0.44, CB], [0.54, CT], [0.62, CA], [0.7, CT], [0.8, CB], [0.88, CT], [0.94, CT], [1, CT]] });
  })();
  // Caminata del oso: a cuatro apoyos con las rodillas a unos centímetros del suelo y la espalda plana; avanza mano y pie contrarios a la vez
  (function () {
    var HX = -0.2, HY = 0.52, ST = 0.09, LIFT = 0.06;
    function hand(dx, up) { return { ik: [HX + 0.48 + dx, 0.072 + up], gw: 0.22, hand: 'flat', flatDir: [1, 0, 0.1], pole: [-1, 0.3, 0.45] }; }
    function foot(dx, up) { return { ik: [HX - 0.36 + dx, 0.13 + up], fw: 0.13, foot: 60, pole: [0.6, -1, 0] }; }
    // fase a: avanza la mano derecha y el pie izquierdo; fase b: lo contrario
    function bc(sR, sL, uR, uL) { return { hip: [HX, HY], torso: 82, head: -30, armsR: hand(sR * ST, uR), armsL: hand(-sR * ST, uL), legsL: foot(sR * ST, uR), legsR: foot(-sR * ST, uL) }; }
    var A = bc(-1, 1, 0, 0), M1 = bc(0, 0, LIFT, 0), B = bc(1, -1, 0, 0), M2 = bc(0, 0, 0, LIFT);
    variant('bearCrawl', 'pushup', { p: ['quads', 'deltsF', 'abs'], s: ['triceps', 'pecs', 'glutes', 'hipFlex'], A: null, B: null, liftAt: null, period: 1500, thumb: 0.0, cam: { az: 30, y: 0.4 },
      keys: [[0, A], [0.25, M1], [0.5, B], [0.75, M2], [1, A]] });
  })();
  // ---------------- Con mancuernas desde el suelo: devil press y man maker ----------------
  (function () {
    function dh(x, y, gw, pole, st) { return { ik: [x, y], gw: gw, palm: 'neu', pole: pole || [-1, 0.3, 0.45], straight: st ? 1 : 0 }; }
    var LP = { ik: [-0.92, 0.207], fw: 0.11, foot: 65, pole: [0.6, -1, 0.15] }, LQ = { ik: [0, ANK], fw: 0.17, pole: [1, -0.3, 0.25] };
    var Dq = { hip: [-0.11, 0.5], torso: 72, head: -16, legs: LQ, arms: dh(0.3, 0.1, 0.2) };                 // cuclillas con las manos en las mancuernas
    var Dj = { hip: [-0.1, 0.47], torso: 72, head: -14, legs: { ik: [-0.48, 0.26], fw: 0.12, foot: 50, pole: [0.8, -1, 0.2] }, arms: dh(0.31, 0.1, 0.2) };
    var Dp = { hip: [-0.08, 0.46], torso: 68, head: -8, legs: LP, arms: dh(0.33, 0.1, 0.2) };                // plancha sobre las mancuernas
    var Dc = { hip: [-0.03, 0.24], torso: 84, head: -6, legs: LP, arms: dh(0.33, 0.1, 0.2) };                // pecho al suelo
    var Dh = { hip: [-0.25, 0.68], torso: 62, head: -18, legs: LQ, arms: dh(0.0, 0.42, 0.27, [-1, 0.2, 0.4], true) };   // bisagra: las mancuernas por fuera de las piernas, a la altura de las rodillas
    var Dt = { hip: [-0.08, 0.9], torso: 14, head: -4, legs: LQ, arms: dh(0.26, 0.86, 0.21, [-0.6, -1, 0.4]) };                 // las mancuernas pasan por delante de los muslos
    var Dd = { hip: [-0.02, 0.95], torso: 6, head: 0, legs: LQ, arms: dh(0.26, 1.17, 0.21, [0.2, -1, 0.6]) };   // impulso de cadera: suben pegadas al cuerpo
    var stand = { hip: STAND, torso: 0, legs: LQ }, Do = Object.assign({}, stand, { arms: { ik: relIk(stand, [0.03, 0.5]), gw: 0.22, palm: 'neu', pole: [0, -1, 0.5], straight: 1 } });
    variant('devilPress', 'pushup', { load: 'hands', p: ['glutes', 'delts', 'quads'], s: ['pecs', 'triceps', 'hams', 'abs', 'traps'], A: null, B: null, liftAt: null, period: 5200, thumb: 0.62, cam: { az: 35, y: 0.95, dist: 1.2 },
      keys: [[0, Dq], [0.08, Dj], [0.15, Dp], [0.24, Dc], [0.33, Dp], [0.4, Dj], [0.47, Dq], [0.54, Dh], [0.59, Dt], [0.64, Dd], [0.7, Do], [0.76, Do], [0.82, Dd], [0.87, Dt], [0.93, Dh], [1, Dq]] });
    // Man maker: flexión sobre las mancuernas, remo con cada brazo, pies adelante, cargada a los hombros, sentadilla frontal y press (thruster)
    var row = function (side) { var q = cloneP(Dp); q.arms = null; var up = dh(0.12, 0.36, 0.2, [-1, 0.6, 0.6]); q['arms' + side] = up; q['arms' + (side === 'R' ? 'L' : 'R')] = dh(0.33, 0.1, 0.2); q.twist = side === 'R' ? 6 : -6; return q; };
    var both = function (p) { var q = cloneP(p); if (q.twist == null) q.twist = 0; if (!q.arms) { delete q.arms; return q; } var a = q.arms; delete q.arms; q.armsL = cloneP(a); q.armsR = cloneP(a); if (q.twist == null) q.twist = 0; return q; };
    var rack = function (b) { var q = cloneP(b), r = relIk(b, [0.19, 0.03]); q.arms = dh(r[0], r[1], 0.2, [0.4, -1, 0.3]); return q; };
    var Mr = rack(stand), Mfs = rack({ hip: [-0.17, 0.52], torso: 18, head: -4, legs: LQ });
    var Mm = { hip: [0, 0.99], torso: 0, legs: LQ, arms: dh.apply(null, relIk(stand, [0.08, 0.3]).concat([0.21, [0.3, -1, 0.5]])) };
    var seq = [[0, Dp], [0.07, Dc], [0.14, Dp], [0.2, row('R')], [0.26, Dp], [0.32, row('L')], [0.38, Dp], [0.44, Dj], [0.5, Dq], [0.57, Dd], [0.62, Mr], [0.69, Mfs], [0.75, Mm], [0.8, Do], [0.85, Do], [0.9, Mr], [0.95, Dq], [1, Dp]];
    variant('manMaker', 'pushup', { load: 'hands', p: ['pecs', 'lats', 'quads', 'delts'], s: ['triceps', 'biceps', 'glutes', 'abs', 'deltsR'], A: null, B: null, liftAt: null, period: 9000, thumb: 0.2, cam: { az: 35, y: 0.95, dist: 1.2 },
      keys: seq.map(function (k) { return [k[0], both(k[1])]; }) });
  })();
