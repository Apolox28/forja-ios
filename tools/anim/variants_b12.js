  // ================= Lote 12 (Hevy): core, cuello, cardio y actividades =================
  (function () {
    function kv(list) { return list; }
    var CA = P.crunch.A, CB = P.crunch.B;
    var PLATE = { relC: [0.26, -0.03], gw: 0.17, palm: 'neu', pole: [0, -1, 0.25] };
    // ---- Abdominales tumbado ----
    variant('crunchWeighted', 'crunch', { load: 'plate', plateAtHands: 'grip', stack: false, machinePos: null, A: { arms: PLATE }, B: { arms: PLATE } });
    variant('sitUpWeighted', 'sitUp', { load: 'plate', plateAtHands: 'grip', A: { arms: PLATE }, B: { arms: PLATE } });
    variant('crunchOblique', 'crunch', { p: ['obliques'], s: ['abs'], stack: false, machinePos: null, A: null, B: null, period: 3600,
      keys: [[0, CA], [0.22, Object.assign({}, CB, { twist: 24, torso: -70 })], [0.42, CA], [0.5, CA], [0.72, Object.assign({}, CB, { twist: -24, torso: -70 })], [0.92, CA], [1, CA]] });
    // Toques de talón: hombros despegados; inclinación lateral para tocar un talón y luego el otro
    (function () {
      var arm = { ua: 95, fa: 95, palm: [0, 0, 1] }, b = { hip: CA.hip, torso: -68, head: 10, legs: CA.legs };
      variant('heelTouch', 'crunch', { p: ['obliques'], s: ['abs'], stack: false, machinePos: null, A: null, B: null, period: 1800, cam: { y: 0.35, az: 60 },
        keys: [[0, Object.assign({ lean: 16, arms: arm }, b)], [0.5, Object.assign({ lean: -16, arms: arm }, b)], [1, Object.assign({ lean: 16, arms: arm }, b)]] });
    })();
    variant('russianTwistBW', 'russianTwist', { load: 'none' });
    // Rodillas al pecho tumbado: las rodillas dobladas suben hasta encima de la cadera
    variant('lyingKneeRaise', 'legRaise', { A: { legs: { th: 104, sh: 86, footRel: 20 } }, B: { legs: { th: 196, sh: 118, footRel: 20 } } });
    // Patadas de aleteo y tijeras: piernas estiradas alternando arriba y abajo cerca del suelo
    (function () {
      function fl(a, b) { return { hip: [0, 0.145], torso: -84, head: 8, legsL: { th: a, sh: a + 1, footRel: 25 }, legsR: { th: b, sh: b + 1, footRel: 25 }, legs: null, arms: P.legRaise.A.arms }; }
      variant('flutterKick', 'legRaise', { p: ['hipFlex', 'abs'], s: ['quads'], A: null, B: null, period: 900, keys: [[0, fl(100, 118)], [0.5, fl(118, 100)], [1, fl(100, 118)]] });
      variant('scissorKick', 'legRaise', { p: ['hipFlex', 'abs'], s: ['quads', 'adductors'], A: null, B: null, period: 1400, keys: [[0, fl(98, 138)], [0.5, fl(138, 98)], [1, fl(98, 138)]] });
    })();
    // Toques de pies: piernas verticales; los hombros se despegan y las manos suben a las puntas
    variant('toeTouch', 'legRaise', { p: ['abs'], s: ['hipFlex'], A: { torso: -90, head: 0, legs: { th: 176, sh: 177, footRel: 25 }, arms: { ua: 168, fa: 168, palm: [0, 1, 0] } },
      B: { torso: -60, head: 14, legs: { th: 176, sh: 177, footRel: 25 }, arms: { ua: 158, fa: 158, palm: [0, 1, 0] } } });
    // Balanceo hueco: posición de hollow que se mece de los hombros a la zona lumbar
    variant('hollowRock', 'hollowHold', { period: 1600,
      A: { hip: [0, 0.15], torso: -70, head: 8, legs: { th: 104, sh: 105, footRel: 25 }, arms: { ua: 236, fa: 238, palm: [0, 1, 0] } },
      B: { hip: [0, 0.15], torso: -82, head: 4, legs: { th: 122, sh: 123, footRel: 25 }, arms: { ua: 256, fa: 258, palm: [0, 1, 0] } } });
    // Pilates (el "cien"): hollow con las piernas a 45º y bombeo corto de brazos
    variant('pilates', 'legRaise', { p: ['abs'], s: ['hipFlex', 'obliques'], period: 800, cam: { y: 0.4, az: 50 },
      A: { hip: [0, 0.145], torso: -66, head: 14, legs: { th: 132, sh: 133, footRel: 25 }, arms: { ua: 98, fa: 98, palm: [0, -1, 0] } },
      B: { hip: [0, 0.145], torso: -66, head: 14, legs: { th: 132, sh: 133, footRel: 25 }, arms: { ua: 88, fa: 88, palm: [0, -1, 0] } } });
    // ---- Cuello ----
    variant('neckFlexion', 'crunch', { p: ['neck'], s: [], stack: false, machinePos: null, cam: { y: 0.3, az: 60 }, period: 2600,
      A: { torso: -90, head: 10, arms: { ua: 88, fa: 88, palm: [0, -1, 0] } }, B: { torso: -90, head: -38, arms: { ua: 88, fa: 88, palm: [0, -1, 0] } } });
    variant('neckFlexionWeighted', 'neckFlexion', { load: 'plate', plateAtHands: 'grip', B: { torso: -90, head: -28 },
      A: { arms: { relC: [0.28, 0.32], gw: 0.17, palm: 'neu', pole: [0, 1, 0.5] } }, B: { arms: { relC: [0.28, 0.32], gw: 0.17, palm: 'neu', pole: [0, 1, 0.5] } } });
    variant('neckExtension', 'superman', { p: ['neck'], s: ['trapsU'], cam: { y: 0.3, az: 55 }, period: 2600,
      A: { torso: 89, head: -2, legs: P.superman.A.legs, arms: P.superman.A.arms }, B: { torso: 89, head: -32, legs: P.superman.A.legs, arms: P.superman.A.arms } });
    // ---- Barra: dragon flag, L-sit y front lever ----
    (function () {
      // cuerpo rígido apoyado en los hombros sobre el banco; las manos agarran el banco detrás de la cabeza
      var SH = [-0.45, 0.65], L = 0.36;
      function df(a) { var r = a * Math.PI / 180; return { hip: [SH[0] + L * Math.cos(r), SH[1] + L * Math.sin(r)], torso: -90 - a, head: 6 + a * 0.75, legs: { th: 90 + a, sh: 91 + a, footRel: 25, fw: 0.08 }, arms: { ik: [-0.6, 0.43], gw: 0.32, palm: 'neu', pole: [0, 1, 0.3] } }; }
      variant('dragonFlag', 'bench', { load: 'none', scene: [], boxes: [[-0.05, 0.45, 0, 1.25, 0.3]], p: ['abs'], s: ['hipFlex', 'obliques', 'lats'], A: null, B: null, period: 4200, thumb: 0.3, cam: { az: 70, y: 0.6 },
        keys: [[0, df(55)], [0.12, df(55)], [0.55, df(14)], [0.64, df(14)], [1, df(55)]] });
    })();
    variant('lSit', 'legRaise', { p: ['hipFlex', 'abs'], s: ['triceps', 'quads'], boxes: [[0.0, 0.26, 0.26, 0.3, 0.05], [0.0, 0.26, -0.26, 0.3, 0.05]], scene: [], cam: { az: 60, y: 0.4 },
      A: { hip: [-0.02, 0.33], torso: 0, head: 0, legs: { th: 90, sh: 91, footRel: 25, fw: 0.08 }, arms: { ik: [0.0, 0.27], gw: 0.5, hand: 'flat', flatDir: [1, 0, 0], straight: 1 } },
      B: { hip: [-0.02, 0.335], torso: -2, head: 0, legs: { th: 92, sh: 93, footRel: 25, fw: 0.08 }, arms: { ik: [0.0, 0.27], gw: 0.5, hand: 'flat', flatDir: [1, 0, 0], straight: 1 } } });
    (function () {
      var S = [0, 1.7], L = 0.36, ar = { ik: [0.0, 2.22], gw: 0.4, straight: 1, palm: 'pro' };
      function fl(t) { var r = t * Math.PI / 180; return { hip: [S[0] - L * Math.sin(r), S[1] - L * Math.cos(r)], torso: t, head: t < -45 ? 10 : 4, legs: { th: -t, sh: 1 - t, footRel: 25, fw: 0.06 }, arms: ar }; }
      variant('frontLever', 'hangLeg', { p: ['lats', 'abs'], s: ['deltsR', 'triceps', 'lowback'], cam: { az: 70 }, A: fl(-88), B: fl(-90) });
      variant('frontLeverRaise', 'hangLeg', { p: ['lats', 'abs'], s: ['deltsR', 'triceps'], A: null, B: null, period: 3600, cam: { az: 70 },
        keys: [[0, fl(-4)], [0.1, fl(-4)], [0.45, fl(-88)], [0.58, fl(-88)], [0.92, fl(-4)], [1, fl(-4)]] });
    })();
    // ---- Cuadrupedia ----
    (function () {
      var hip = [-0.3, 0.52], tor = 84, knee = { th: 0, sh: -90, fw: 0.11, footRel: 60 };
      var sup = { ik: [0.22, 0.06], gw: 0.3, hand: 'flat', flatDir: [1, 0, 0], pole: [-1, 0.3, 0.3] };
      function q(o) { return Object.assign({ hip: hip, torso: tor, head: -14, legsL: knee, legsR: knee, armsL: sup, armsR: sup }, o); }
      // Hidrante: la rodilla derecha se abre hacia el lado sin girar el tronco
      variant('fireHydrant', 'plank', { side: 'R', p: ['gluteMed'], s: ['glutes'], cam: { az: 50, y: 0.4 },
        A: q({ legsR: { ik: [-0.72, 0.1, 0.11], fw: 0.11, foot: 30, pole: [0, -1, 0] } }), B: q({ legsR: { ik: [-0.66, 0.25, 0.22], fw: 0.11, foot: 30, pole: [0, -1, 0.6] } }) });
      // Patada de glúteo (burro): la rodilla doblada a 90º sube hasta que el muslo queda horizontal
      variant('donkeyKick', 'plank', { side: 'R', p: ['glutes'], s: ['hams'], cam: { az: 20, y: 0.4 },
        A: q({}), B: q({ legsR: { th: -92, sh: -182, fw: 0.11, footRel: 60 } }) });
      // Bird dog: brazo derecho al frente y pierna izquierda atrás
      variant('birdDog', 'plank', { both: ['abs', 'lowback', 'glutes'], p: ['lowback', 'glutes'], s: ['abs', 'deltsF'], cam: { az: 30, y: 0.4 },
        A: q({ armsR: { ua: 10, fa: 30, palm: [0, 0, -1] }, legsL: knee }), B: q({ armsR: { ua: 92, fa: 92, palm: [0, 0, -1] }, legsL: { th: -90, sh: -90, fw: 0.11, footRel: 30 } }) });
    })();
    // ---- En posición de flexión ----
    (function () {
      var PA = P.pushup.A, arms = PA.arms;
      function up(o) { return Object.assign({}, PA, o); }
      // Toques de hombro: desde arriba, una mano toca el hombro contrario
      var S3 = Object.assign({}, arms, { ik: [arms.ik[0], arms.ik[1], arms.gw / 2] }); delete S3.gw;
      var tR = { armsL: S3, armsR: { ik: [0.3, 0.36, -0.1], palm: 'pro', pole: [-0.3, -1, 0.4], hand: 'flat', flatDir: [0.3, 0, -1] }, arms: null, twist: 0 };
      var tL = { armsR: S3, armsL: { ik: [0.3, 0.36, -0.1], palm: 'pro', pole: [-0.3, -1, 0.4], hand: 'flat', flatDir: [0.3, 0, -1] }, arms: null, twist: 0 };
      var b0 = { armsL: arms, armsR: arms, arms: null }; var t0 = null;
      t0 = { armsL: S3, armsR: S3, arms: null };
      variant('shoulderTap', 'pushup', { p: ['abs', 'deltsF'], s: ['obliques', 'triceps', 'pecs'], A: null, B: null, liftAt: null, period: 2000, thumb: 0.25, cam: { az: 50, y: 0.4 },
        keys: [[0, up(t0)], [0.2, up(tR)], [0.4, up(t0)], [0.5, up(t0)], [0.7, up(tL)], [0.9, up(t0)], [1, up(t0)]] });
      // Remo renegado: en plancha sobre mancuernas, rema con un brazo y luego con el otro
      var DA = { ik: [0.33, 0.11], gw: 0.29, palm: 'neu', pole: [-1, 0.3, 0.45] }; b0 = { armsL: DA, armsR: DA, arms: null };
      var rR = { armsL: DA, armsR: { ik: [0.05, 0.36], gw: 0.29, palm: 'neu', pole: [-1, 0.6, 0.2] }, arms: null, twist: -6 };
      var rL = { armsR: DA, armsL: { ik: [0.05, 0.36], gw: 0.29, palm: 'neu', pole: [-1, 0.6, 0.2] }, arms: null, twist: 6 };
      variant('renegadeRow', 'pushup', { load: 'hands', p: ['lats', 'abs'], s: ['deltsR', 'biceps', 'obliques'], A: null, B: null, liftAt: null, period: 2800, thumb: 0.25, cam: { az: 40, y: 0.4 },
        keys: [[0, up(b0)], [0.25, up(rR)], [0.5, up(b0)], [0.75, up(rL)], [1, up(b0)]] });
      // Spiderman: la rodilla derecha va hacia el codo derecho por fuera
      var LP = PA.legs, sp = { legsL: LP, legsR: { ik: [-0.58, 0.22, 0.02], fw: 0.1, foot: 20, pole: [0.5, 0, 0.8] }, legs: null }, s0 = { legsL: LP, legsR: Object.assign({}, LP), legs: null };
      var spL = { legsR: LP, legsL: { ik: [-0.58, 0.22, 0.02], fw: 0.1, foot: 20, pole: [0.5, 0, 0.8] }, legs: null }, s0L = s0;
      variant('spiderman', 'pushup', { p: ['abs', 'obliques', 'hipFlex'], s: ['deltsF', 'pecs'], A: null, B: null, liftAt: null, period: 2400, thumb: 0.25, cam: { az: 60, y: 0.4 },
        keys: [[0, up(s0)], [0.25, up(sp)], [0.5, up(s0)], [0.75, up(spL)], [1, up(s0L)]] });
      // Navaja en TRX: pies en las correas, las rodillas van al pecho
      var fT = { ik: [-0.98, 0.45], fw: 0.1, foot: 40, pole: [0, -1, 0] }, fK = { ik: [-0.34, 0.5], fw: 0.1, foot: 40, pole: [0, -1, 0] };
      variant('trxJackknife', 'pushup', { trxFeet: [-1.15, 2.35, 0], p: ['abs', 'hipFlex'], s: ['deltsF', 'quads'], A: null, B: null, liftAt: null, period: 2400, cam: { az: 40, y: 0.5 },
        keys: [[0, up({ hip: [-0.105, 0.505], torso: 83, legs: fT })], [0.12, up({ hip: [-0.105, 0.505], torso: 83, legs: fT })], [0.45, up({ hip: [-0.06, 0.58], torso: 92, legs: fK })], [0.6, up({ hip: [-0.06, 0.58], torso: 92, legs: fK })], [1, up({ hip: [-0.105, 0.505], torso: 83, legs: fT })]] });
    })();
    // Plancha invertida: boca arriba, manos bajo los hombros, cuerpo recto apoyado en los talones
    variant('reversePlank', 'plank', { p: ['glutes', 'lowback'], s: ['hams', 'deltsR', 'triceps'], cam: { az: 30, y: 0.35 },
      A: { hip: [-0.04, 0.43], torso: -66, head: 10, legs: { ik: [0.86, 0.09], fw: 0.1, foot: -50, pole: [0, 1, 0] }, arms: { ik: [-0.36, 0.12], gw: 0.34, hand: 'flat', flatDir: [1, 0, 0], straight: 1, pole: [1, 0, 0.3] } },
      B: { hip: [-0.04, 0.435], torso: -66, head: 10, legs: { ik: [0.86, 0.09], fw: 0.1, foot: -50, pole: [0, 1, 0] }, arms: { ik: [-0.36, 0.12], gw: 0.34, hand: 'flat', flatDir: [1, 0, 0], straight: 1, pole: [1, 0, 0.3] } } });
    // ---- De pie: estiramientos, yoga, boxeo, rodillas altas, patinaje ----
    var ST = { ik: [0, ANK], fw: 0.14 };
    variant('stretching', 'squatBW', { p: ['hams', 'lowback'], s: ['lats', 'calves'], period: 5000, cam: { az: 60 },
      A: { hip: STAND, torso: 0, head: 6, legs: ST, arms: { ua: 176, fa: 176, palm: [0, 0, -1] } },
      B: { hip: [-0.2, 0.9], torso: 92, head: -20, legs: ST, arms: { ua: 2, fa: 2, palm: [0, 0, -1] } } });
    // Yoga: guerrero II con respiración (rodilla delantera doblada, brazos en cruz)
    variant('yoga', 'squatBW', { p: ['quads', 'glutes', 'adductors'], s: ['deltsS', 'abs'], period: 5000, cam: { az: 70 },
      A: { hip: [0, 0.86, 0], torso: 0, head: 0, legsR: { ik: [0.42, ANK, 0.13], fw: 0.12, toe: 0 }, legsL: { ik: [-0.42, ANK, 0.13], fw: 0.12, toe: 60 }, legs: null, arms: { ua: 90, fa: 90, plane: 'f', palm: [0, -1, 0] }, twist: -20 },
      B: { hip: [0.02, 0.83, 0], torso: 0, head: 0, legsR: { ik: [0.42, ANK, 0.13], fw: 0.12, toe: 0 }, legsL: { ik: [-0.42, ANK, 0.13], fw: 0.12, toe: 60 }, legs: null, arms: { ua: 92, fa: 92, plane: 'f', palm: [0, -1, 0] }, twist: -22 } });
    // Boxeo: guardia, jab de izquierda y directo de derecha con giro de cadera
    (function () {
      var lg = { L: { ik: [0.16, ANK, 0.12], fw: 0.12, toe: 10 }, R: { ik: [-0.2, ANK, 0.13], fw: 0.12, toe: 30 } };
      var gL = { ik: [0.22, 1.42, 0.1], palm: 'neu', pole: [0, -1, 0.3] }, gR = { ik: [0.18, 1.4, 0.06], palm: 'neu', pole: [0, -1, 0.3] };
      function bx(o) { return Object.assign({ hip: [-0.02, 0.92], torso: 6, head: -4, legsL: lg.L, legsR: lg.R, armsL: gL, armsR: gR, twist: -10 }, o); }
      var G = bx({}), J = bx({ armsL: { ik: [0.55, 1.38, 0.08], palm: 'pro', pole: [0, -1, 0.3] }, twist: -16 }), C = bx({ armsR: { ik: [0.55, 1.38, -0.02], palm: 'pro', pole: [0, -1, 0.3] }, twist: 14 });
      variant('boxing', 'squatBW', { p: ['deltsF', 'triceps'], s: ['obliques', 'pecs', 'calves'], A: null, B: null, period: 1800, cam: { az: 50 },
        keys: [[0, G], [0.12, J], [0.26, G], [0.42, C], [0.58, G], [1, G]] });
    })();
    // Rodillas altas: carrera en el sitio con las rodillas a la altura de la cadera
    (function () {
      var st = { ik: [0.02, ANK + 0.02], fw: 0.12, foot: 15 }, upK = { th: 92, sh: 6, fw: 0.12, foot: 20 };
      function hk(r) { return { hip: [0, 1.0], torso: -2, head: 0, legsR: r ? upK : { th: 2, sh: 2, fw: 0.12 }, legsL: r ? { th: 2, sh: 2, fw: 0.12 } : upK, armsR: { ua: r ? -30 : 50, fa: r ? 60 : 100, palm: 'neu' }, armsL: { ua: r ? 50 : -30, fa: r ? 100 : 60, palm: 'neu' } }; }
      variant('highKnees', 'squatBW', { p: ['hipFlex', 'quads'], s: ['calves', 'abs', 'glutes'], A: null, B: null, period: 700, thumb: 0.0, cam: { az: 70 },
        keys: [[0, hk(true)], [0.5, hk(false)], [1, hk(true)]] });
    })();
    // Patinaje: zancadas laterales de patinador, apoyo en una pierna y la otra cruza por detrás
    (function () {
      function sk(r) { var s = r ? 1 : -1; return { hip: [-0.1, 0.78, 0.2 * s], torso: 32, head: -12, twist: 10 * s,
        legsR: { ik: r ? [0.04, ANK, 0.12] : [-0.36, 0.2, -0.1], fw: 0.12, foot: r ? 0 : 40 }, legsL: { ik: r ? [-0.36, 0.2, -0.1] : [0.04, ANK, 0.12], fw: 0.12, foot: r ? 40 : 0 },
        armsR: { ua: r ? -20 : 40, fa: 20, palm: 'neu', plane: 'f' }, armsL: { ua: r ? 40 : -20, fa: 20, palm: 'neu', plane: 'f' } }; }
      var M = { hip: [-0.05, 0.92, 0], torso: 22, head: -8, legsR: { ik: [-0.1, 0.16, 0.1], fw: 0.12, foot: 20 }, legsL: { ik: [-0.1, 0.16, 0.1], fw: 0.12, foot: 20 }, armsR: { ua: 10, fa: 20, palm: 'neu', plane: 'f' }, armsL: { ua: 10, fa: 20, palm: 'neu', plane: 'f' } };
      variant('skating', 'squatBW', { p: ['quads', 'glutes', 'gluteMed'], s: ['adductors', 'calves'], A: null, B: null, period: 2000, thumb: 0.15, cam: { az: 80 },
        keys: [[0, sk(true)], [0.2, sk(true)], [0.35, M], [0.5, sk(false)], [0.7, sk(false)], [0.85, M], [1, sk(true)]] });
    })();
    // Arrastre de trineo: arnés con correas al trineo de detrás; marcha inclinada hacia delante
    variant('sledDrag', 'walk', { load: 'none', p: ['quads', 'glutes'], s: ['calves', 'hams', 'abs'], bands: [['backL', [-1.5, 0.2, -0.18]], ['backR', [-1.5, 0.2, 0.18]]], boxes: [[-1.65, 0.22, 0, 0.45, 0.6]], period: 1300, cam: { az: 40, dist: 1.3 } });
    // Vuelta al mundo con kettlebell: la pesa rodea la cintura pasando de una mano a otra delante y detrás
    (function () {
      var lg = { ik: [0, ANK], fw: 0.18 };
      function h(x, y, z, pole) { return { ik: [x, y, z], palm: 'neu', pole: pole || [0, -1, 0.3] }; }
      var RST = h(0.05, 0.86, 0.22), F = h(0.27, 0.97, 0.03), S = h(0.03, 0.97, 0.33, [-0.3, -1, 0.5]), Bk = h(-0.25, 1.0, 0.04, [-0.5, -1, 0.2]);
      function w(o) { return Object.assign({ hip: STAND, torso: 2, legs: lg }, o); }
      variant('kbAroundWorld', 'swing', { kbHand: ['R', 'hang'], p: ['obliques', 'abs'], s: ['deltsF', 'forearms', 'lowback'], A: null, B: null, period: 3200, thumb: 0.25, cam: { az: 40 },
        keys: [[0, w({ armsR: F, armsL: F, kbH: 'R' })], [0.25, w({ armsR: S, armsL: RST, kbH: 'R' })], [0.48, w({ armsR: Bk, armsL: Bk, kbH: 'R' })], [0.52, w({ armsR: Bk, armsL: Bk, kbH: 'L' })], [0.75, w({ armsR: RST, armsL: S, kbH: 'L' })], [0.97, w({ armsR: F, armsL: F, kbH: 'L' })], [1, w({ armsR: F, armsL: F, kbH: 'R' })]] });
    })();
    // Tumbado de lado (sobre el lado derecho): almeja y elevación lateral de pierna con la pierna de arriba (izquierda)
    (function () {
      var R0 = [90, 0, 0.17, 0, -90], hd = { rel: [0.14, 0.28, -0.22], palm: 'neu', pole: [0, -1, 0.3] }, top = { rel: [0.24, -0.36, 0.08], palm: 'pro' };
      function sl(o) { return Object.assign({ hip: [0, 0.97], torso: 0, head: 0, lean: -14, roll: R0, armsR: hd, armsL: top }, o); }
      var kb = { ik: [0.02, 0.35, 0.07], fw: 0.07, pole: [1, 0, 0], foot: 10 };
      variant('clamshell', 'plank', { side: 'L', p: ['gluteMed'], s: ['glutes'], scene: ['mat'], cam: { az: 12, el: 28, y: 0.3 },
        A: sl({ legsR: kb, legsL: kb }), B: sl({ legsR: kb, legsL: { ik: [0.02, 0.35, 0.07], fw: 0.07, pole: [1, 0, 1.3], foot: 10 } }) });
      var st = { ik: [0, ANK, 0.07], fw: 0.07, foot: 0 };
      variant('sideLegRaise', 'plank', { side: 'L', p: ['gluteMed'], s: ['glutes', 'obliques'], scene: ['mat'], cam: { az: 12, el: 28, y: 0.3 },
        A: sl({ legsR: st, legsL: st }), B: sl({ legsR: st, legsL: { ik: [0, 0.36, 0.6], fw: 0.07, foot: 0 } }) });
    })();
  })();
