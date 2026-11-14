  // ================= Lote 8 (Hevy): pecho, hombros y empujes =================
  (function () {
    function arms(k, fn) { eachArm(k, function (a) { return Object.assign(a, fn(a)); }); }
    // ---- Press de banca ----
    // Press apretando mancuernas / hexagonal: las mancuernas juntas, agarre neutro, se aprietan durante todo el recorrido
    variant('benchSqueeze', 'bench', { load: 'hands', s: ['pecsU', 'triceps', 'deltsF'] }); arms('benchSqueeze', function () { return { gw: 0.065, palm: 'neu' }; });
    // Agarre ancho: más pectoral, menos tríceps
    variant('benchWide', 'bench', { s: ['pecsU', 'deltsF'] }); arms('benchWide', function () { return { gw: 0.48 }; });
    // Con los pies arriba: caderas y rodillas a 90º en el aire, sin impulso de piernas
    variant('benchFeetUp', 'bench', { A: { legs: { th: 178, sh: 94, fw: 0.14, footRel: 10 } }, B: { legs: { th: 178, sh: 94, fw: 0.14, footRel: 10 } } });
    // Larsen: piernas estiradas y pies despegados del suelo
    variant('benchLarsen', 'bench', { s: ['pecsU', 'triceps', 'abs'], A: { legs: { th: 98, sh: 98, fw: 0.14, footRel: 15 } }, B: { legs: { th: 98, sh: 98, fw: 0.14, footRel: 15 } } });
    // Press de tríceps con codos abiertos (Tate): mancuernas arriba con las palmas hacia los pies; bajan al pecho abriendo los codos
    variant('tatePress', 'bench', { load: 'hands', p: ['triceps'], s: ['pecs'],
      A: { arms: { ik: [-0.29, 1.0], gw: 0.2, palm: 'pro', pole: [0, 0.2, 1] } }, B: { arms: { ik: [-0.3, 0.74], gw: 0.11, palm: 'pro', pole: [0, 0.2, 1] } } });
    variant('declineSmith', 'decline', { smith: true });
    // ---- Press de pie / máquina ----
    var ST = { hip: STAND, torso: 0, legs: { ik: [0, ANK], fw: 0.15 } };
    // Press con disco (Svend): el disco apretado entre las palmas delante del pecho y empuje al frente
    variant('svendPress', 'frontRaise', { load: 'plate', plateAtHands: 'squeeze', p: ['pecs'], s: ['deltsF', 'triceps'],
      A: Object.assign({}, ST, { arms: { relC: [0.37, -0.13], gw: 0.022, palm: [0, 0, -1], pole: [-0.5, -1, 0.3] } }), B: Object.assign({}, ST, { arms: { relC: [0.5, -0.11], gw: 0.022, palm: [0, 0, -1], pole: [-0.5, -1, 0.3] } }) });
    // Press de pecho con banda: la banda rodea la espalda por detrás de los hombros
    variant('bandChestPress', 'frontRaise', { load: 'none', bands: [['backL', 'handL'], ['backR', 'handR']], p: ['pecs'], s: ['deltsF', 'triceps'],
      A: Object.assign({}, ST, { arms: { relC: [0.15, -0.13], gw: 0.21, palm: 'neu', pole: [-1, -0.4, 0.4] } }), B: Object.assign({}, ST, { arms: { relC: [0.52, -0.1], gw: 0.17, palm: 'neu', pole: [-1, -0.4, 0.4] } }) });
    // Press declinado en máquina: los agarres bajan en diagonal hacia la parte baja del pecho
    variant('chestPressDecline', 'chestPress', { s: ['triceps', 'deltsF'], A: { arms: { ik: [0.05, 0.8], gw: 0.27, pole: [-1, -0.5, 0.45], palm: [0, 0, -1] } }, B: { arms: { ik: [0.31, 0.76], gw: 0.24, pole: [-1, -0.5, 0.45], palm: [0, 0, -1] } } });
    // Press envolvente: los agarres convergen delante del pecho
    variant('chestPressConverge', 'chestPress', { B: { arms: { ik: [0.32, 0.9], gw: 0.1, pole: [-1, -0.5, 0.45], palm: [0, 0, -1] } } });
    // ---- Aperturas ----
    // Con banda: anclada detrás a la altura de los hombros; abrir y cerrar con los codos apenas flexionados
    variant('bandFly', 'cableFly', { load: 'none', stack: false, twinPos: null, bands: [[[-0.6, 1.36, -0.55], 'handL'], [[-0.6, 1.36, 0.55], 'handR']], s: ['pecsU', 'deltsF'],
      A: Object.assign({}, ST, { legsL: null, legsR: null, arms: { relC: [0.0, -0.03], gw: 0.6, palm: [0.4, 0, -1], pole: [-0.4, -1, 0.3], straight: 0.85 } }),
      B: Object.assign({}, ST, { legsL: null, legsR: null, arms: { relC: [0.5, -0.05], gw: 0.07, palm: [0, 0, -1], pole: [-0.4, -1, 0.3], straight: 0.85 } }) });
    // Aperturas en banco declinado: manos sobre el pecho que abren en arco
    variant('flyDecline', 'decline', { load: 'hands', p: ['pecs'], s: ['deltsF'],
      A: { arms: { relC: [0.52, -0.05], gw: 0.1, palm: [0, 0, -1], pole: [0.2, -0.3, 1] } }, B: { arms: { relC: [0.15, -0.05], gw: 0.56, palm: [0, 1, -0.3], pole: [0.2, -0.3, 1] } } });
    // En TRX: inclinado hacia delante con el cuerpo recto; los brazos se abren y el cuerpo baja, se cierran y sube
    var TRXA = [1.15, 2.35, 0];
    variant('trxFly', 'cableFly', { load: 'none', stack: false, twinPos: null, trx: TRXA, p: ['pecs'], s: ['deltsF', 'abs'], cam: { az: 40 },
      A: { hip: [-0.12, 0.93], torso: 22, head: -6, legsL: null, legsR: null, legs: { ik: [-0.3, ANK], fw: 0.12, foot: 15 }, arms: { relC: [0.5, -0.02], gw: 0.08, palm: [0, 0, -1], pole: [-0.4, -1, 0.3], straight: 0.85 } },
      B: { hip: [-0.05, 0.86], torso: 32, head: -6, legsL: null, legsR: null, legs: { ik: [-0.3, ANK], fw: 0.12, foot: 25 }, arms: { relC: [0.12, -0.03], gw: 0.56, palm: [0, 0.4, -1], pole: [-0.4, -1, 0.3], straight: 0.85 } } });
    // Sentado en polea: sentado entre las dos poleas a media altura
    variant('cableFlySeated', 'cableFly', { scene: ['stool'], pulleyY: 1.05, s: ['pecsU', 'deltsF'],
      A: { hip: [-0.04, 0.52], torso: 2, legsL: null, legsR: null, legs: { ik: [0.36, ANK], fw: 0.16 }, arms: { ik: [0.08, 0.98, 0.6], pole: [-1, 0.35, 0.55], palm: [0.4, -0.1, -1] } },
      B: { hip: [-0.04, 0.52], torso: 2, legsL: null, legsR: null, legs: { ik: [0.36, ANK], fw: 0.16 }, arms: { ik: [0.44, 0.92, 0.07], pole: [-0.6, 0.1, 0.9], palm: [0, 0, -1] } } });
    // Cruce de polea a una mano: polea alta a la derecha; la mano cruza por delante del cuerpo
    variant('cableFlyOne', 'cableFly', { side: 'R', load: 'cableR', twinPos: null, towerPos: [0.05, 0.95], anchor: [0.05, 2.05, 0.88], cam: { az: 120 },
      A: { armsR: { ik: [0.12, 1.42, 0.62], pole: [-1, 0.35, 0.55], palm: [0.4, -0.1, -1] }, armsL: { ik: [0.06, 1.03, -0.22], palm: 'neu', pole: [-0.3, 0, -1] }, arms: null },
      B: { armsR: { ik: [0.44, 1.02, -0.06], pole: [-0.6, 0.1, 0.9], palm: [0, 0, -1] }, armsL: { ik: [0.06, 1.03, -0.22], palm: 'neu', pole: [-0.3, 0, -1] }, arms: null } });
    // Estiramiento de pectoral en el marco de una puerta: antebrazo derecho vertical apoyado, el tronco gira hacia el otro lado
    variant('pecStretch', 'frontRaise', { side: 'R', load: 'none', stack: false, p: ['pecs'], s: ['deltsF'], boxes: [[0.07, 2.1, 0.47, 0.06, 0.1, 0, 1]], cam: { az: 70 },
      A: Object.assign({}, ST, { twist: 6, armsR: { ik: [-0.03, 1.66, 0.45], palm: [1, 0, 0], pole: [-0.3, -1, 0.6] }, armsL: { rel: [0.03, HANG, 0.05], palm: 'neu' }, arms: null }),
      B: Object.assign({}, ST, { twist: 20, armsR: { ik: [-0.05, 1.66, 0.45], palm: [1, 0, 0], pole: [-0.3, -1, 0.6] }, armsL: { rel: [0.03, HANG, 0.05], palm: 'neu' }, arms: null }) });
    // Vuelta al mundo con mancuernas: tumbado, los brazos estirados giran en arco de la cadera a por encima de la cabeza
    (function () {
      function aw(up, fwd, gw) { return { arms: { relC: [fwd, up], gw: gw, palm: 'sup', pole: [0, 1, 0.4], straight: 0.85 } }; }
      var b0 = P.fly.A, base = { hip: b0.hip, torso: b0.torso, legs: b0.legs };
      variant('aroundWorldDb', 'fly', { A: null, B: null, s: ['deltsF', 'lats'], period: 4200,
        keys: [[0, Object.assign({}, base, aw(-0.44, 0.12, 0.26))], [0.25, Object.assign({}, base, aw(0.02, 0.1, 0.62))], [0.5, Object.assign({}, base, aw(0.5, 0.12, 0.2))], [0.75, Object.assign({}, base, aw(0.02, 0.1, 0.62))], [1, Object.assign({}, base, aw(-0.44, 0.12, 0.26))]] });
    })();
    // ---- Hombro ----
    variant('plateOverhead', 'frontRaise', { load: 'plate', plateAtHands: 'grip', s: ['deltsS', 'traps'], A: { arms: { ua: 24, fa: 26, palm: 'neu' } }, B: { arms: { ua: 172, fa: 174, palm: 'neu' } } });
    variant('frontRaisePlate', 'frontRaise', { load: 'plate', plateAtHands: 'grip' }); arms('frontRaisePlate', function (a) { return { palm: 'neu', ua: Math.max(a.ua, 24), fa: Math.max(a.fa, 26) }; });
    variant('frontRaiseBand', 'frontRaise', { load: 'none', bands: [['footL', 'handL'], ['footR', 'handR']] });
    variant('lateralRaiseBand', 'lateralRaise', { load: 'none', stack: false, bands: [['footR', 'handL'], ['footL', 'handR']] });
    variant('lateralRaiseSeated', 'lateralRaise', { scene: ['stool'], stack: false, A: { hip: [-0.04, 0.52], legs: { ik: [0.36, ANK], fw: 0.16 } }, B: { hip: [-0.04, 0.52], legs: { ik: [0.36, ANK], fw: 0.16 } } });
    // Elevaciones frontales en TRX: inclinado hacia atrás de cara al anclaje; al subir los brazos estirados el cuerpo se endereza
    variant('trxFrontRaise', 'frontRaise', { load: 'none', stack: false, trx: [1.25, 2.35, 0], s: ['deltsS', 'abs', 'traps'], cam: { az: 40 },
      A: { hip: [-0.24, 0.87], torso: -24, head: 8, legs: { ik: [0.12, ANK], fw: 0.12 }, arms: { relC: [0.52, 0.0], gw: 0.12, palm: 'pro', straight: 0.95 } },
      B: { hip: [-0.13, 0.94], torso: -10, head: 4, legs: { ik: [0.12, ANK], fw: 0.12 }, arms: { relC: [0.18, 0.5], gw: 0.14, palm: 'pro', straight: 0.95 } } });
    // Estiramiento de deltoides: el brazo derecho cruza por delante del pecho y la mano izquierda lo sujeta por encima del codo
    variant('deltStretch', 'frontRaise', { side: 'R', load: 'none', stack: false, p: ['deltsR'], s: ['deltsS', 'traps'], cam: { az: 50 },
      A: Object.assign({}, ST, { armsR: { ik: [0.16, 1.32, -0.44], palm: [0, 0, -1], pole: [0.6, -0.3, 0], straight: 1 }, armsL: { ik: [0.24, 1.3, -0.02], palm: [0, 0, 1], pole: [0, -1, -0.3] }, arms: null }),
      B: Object.assign({}, ST, { armsR: { ik: [0.14, 1.32, -0.47], palm: [0, 0, -1], pole: [0.6, -0.3, 0], straight: 1 }, armsL: { ik: [0.22, 1.3, -0.01], palm: [0, 0, 1], pole: [0, -1, -0.3] }, arms: null }) });
    // Separación de banda: brazos estirados delante a la altura de los hombros; la banda se abre hasta tocar el pecho
    variant('bandPullApart', 'frontRaise', { load: 'none', bands: [['handL', 'handR']], p: ['deltsR'], s: ['traps', 'deltsS'],
      A: Object.assign({}, ST, { arms: { relC: [0.52, -0.06], gw: 0.15, palm: 'pro', straight: 0.95 } }), B: Object.assign({}, ST, { arms: { relC: [0.12, -0.06], gw: 0.6, palm: 'pro', straight: 0.95 } }) });
    // Estiramiento de bíceps: brazos estirados por detrás, manos juntas y palmas hacia abajo; pecho abierto
    variant('bicepStretch', 'frontRaise', { load: 'none', stack: false, p: ['biceps'], s: ['deltsF', 'pecs'], cam: { az: 60 },
      A: Object.assign({}, ST, { arms: { ik: [-0.22, 0.82], gw: 0.06, palm: [0, -1, 0], pole: [-0.3, 0, 1], straight: 0.95 } }), B: Object.assign({}, ST, { torso: 4, arms: { ik: [-0.28, 0.9], gw: 0.05, palm: [0, -1, 0], pole: [-0.3, 0, 1], straight: 0.95 } }) });
    // Flexión lateral sin peso: manos en la cadera; el tronco se inclina hacia la derecha y vuelve
    variant('sideBend', 'sideBendDb', { load: 'none',
      A: { lean: -6, armsL: null, armsR: null, arms: { ik: [0.04, 1.03], gw: 0.22, palm: 'neu', pole: [-0.2, 0, 1] } }, B: { lean: 30, armsL: null, armsR: null, arms: { ik: [0.04, 1.03], gw: 0.22, palm: 'neu', pole: [-0.2, 0, 1] } } });
    // Landmine 180: brazos estirados sujetando el extremo de la barra; arco de un lado al otro girando el tronco
    (function () {
      function lm(x, y, z, tw) { return { hip: STAND, torso: 2, twist: tw, legs: { ik: [0, ANK], fw: 0.19 }, armsR: { ik: [x, y, z + 0.035], palm: [0, -0.4, -1], straight: 0.9 }, armsL: { ik: [x, y, -(z - 0.035)], palm: [0, -0.4, -1], straight: 0.9 } }; }
      var Rr = lm(0.26, 0.98, 0.42, -50), Mm = lm(0.5, 1.32, 0, 0), Ll = lm(0.26, 0.98, -0.42, 50);
      variant('landmine180', 'lateralRaise', { load: 'landmine', minePivot: [1.55, 0.07, 0], mineBoth: true, mineOver: 0.15, minePlateR: 0.16, stack: false, bakeBar: false, p: ['obliques'], s: ['abs', 'deltsF'], A: null, B: null, period: 3200, cam: { az: 70 },
        keys: [[0, Mm], [0.25, Rr], [0.5, Mm], [0.75, Ll], [1, Mm]] });
    })();
    // Leñador de abajo arriba en polea: polea baja a la derecha; desde fuera de la rodilla derecha hasta encima del hombro izquierdo
    (function () {
      function hands(x, y, z) { return { armsR: { ik: [x, y, z + 0.035], palm: [0, -0.3, -1], straight: 0.9, pole: [0, -1, 0.3] }, armsL: { ik: [x, y, -(z - 0.035)], palm: [0, -0.3, -1], straight: 0.9, pole: [0, -1, 0.3] } }; }
      function lg(lf) { return { legsR: { ik: [0.0, ANK, 0.22], fw: 0.22, toe: 10 }, legsL: lf ? { ik: [-0.02, ANK + 0.045, 0.22], fw: 0.22, foot: 32, toe: -28 } : { ik: [0.0, ANK, 0.22], fw: 0.22, toe: 10, foot: 0 } }; }
      var lo = Object.assign({ hip: [-0.08, 0.76], torso: 42, head: 12, twist: -40 }, lg(false), hands(0.3, 0.68, 0.3));
      var md = Object.assign({ hip: [-0.02, 0.9], torso: 14, head: 0, twist: 0 }, lg(false), hands(0.42, 1.18, -0.1));
      var hi = Object.assign({ hip: [0, 0.95], torso: 0, head: -10, twist: 38 }, lg(true), hands(0.34, 1.6, -0.3));
      variant('woodchopLowHigh', 'woodchop', { anchor: [0.1, 0.16, 0.88], keys: [[0, lo], [0.1, lo], [0.27, md], [0.45, hi], [0.55, hi], [0.78, md], [0.95, lo], [1, lo]] });
      cam2('woodchopLowHigh', 40, 12);
    })();
    // Rotación de tronco en máquina: sentado con las piernas fijas; gira el tronco a un lado sujetando las asas
    variant('torsoRotationMachine', 'lateralRaise', { load: 'grips', stack: true, scene: ['seatBack'], machinePos: [-0.75, -0.55, 0], p: ['obliques'], s: ['abs'], cam: { az: 60, y: 0.9 },
      A: { hip: [-0.06, 0.52], torso: -2, twist: 0, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { relC: [0.4, -0.14], gw: 0.2, palm: 'neu', pole: [-1, -0.4, 0.4] } },
      B: { hip: [-0.06, 0.52], torso: -2, twist: 20, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { relC: [0.4, -0.14], gw: 0.2, palm: 'neu', pole: [-1, -0.4, 0.4] } } });
    // ---- Por encima de la cabeza ----
    // Flexiones en pino (contra la pared) y pino: el cuerpo entero invertido (giro de 180º); las manos fijas en el suelo
    (function () {
      function hs(hipY, st, hx, pl) { return { hip: [0, hipY], torso: 0, head: 6, roll: [180, 0, 2.07, 0], legs: { th: 0, sh: 0, fw: 0.08, foot: 20 }, arms: { ik: [hx == null ? 0.02 : hx, 1.95], gw: 0.27, palm: [0, -1, 0], pole: pl || [0.4, -1, 0.5], straight: st, hand: 'flat', flatDir: [1, 0, 0.1] } }; }
      var W = [[-0.22, 2.6, 0, 0.08, 1.4, 2.6, 1]];
      variant('hspu', 'ohp', { load: 'none', stack: false, p: ['deltsF', 'triceps'], s: ['deltsS', 'traps', 'abs'], boxes: W, A: hs(0.97, 1, 0.05), B: hs(1.22, 0, -0.06, [-0.3, -1, 1.2]), cam: { az: 55, y: 1.0 } });
      variant('handstand', 'ohp', { load: 'none', stack: false, p: ['deltsF', 'abs'], s: ['triceps', 'traps', 'forearms'], boxes: W, A: hs(0.97, 1), B: hs(0.985, 1), cam: { az: 55, y: 1.0 } });
    })();
    // Press de hombro con kettlebell (a una mano): desde la posición de rack hasta el bloqueo arriba; la otra mano en la cadera
    (function () {
      var b = { hip: STAND, torso: 0, legs: { ik: [0, ANK], fw: 0.14 } }, rk = relIk(b, [0.15, -0.1]), up = relIk(b, [0.02, 0.5]);
      var free = { ik: [0.04, 1.03, 0.22], palm: 'neu', pole: [-0.2, 0, 1] };
      variant('kbPress', 'ohp', { side: 'R', load: 'kb', kbHand: ['R', 'rack'], stack: false, p: ['deltsF'], s: ['triceps', 'deltsS', 'abs'],
        A: Object.assign({}, b, { armsR: { ik: [rk[0], rk[1], 0.1], palm: 'neu', pole: [0.3, -1, 0.15] }, armsL: free, arms: null, kbRack: 1 }),
        B: Object.assign({}, b, { armsR: { ik: [up[0], up[1], 0.17], palm: 'neu', pole: [0, -1, 0.5], straight: 1 }, armsL: free, arms: null, kbRack: 1 }) });
    })();
    // Olímpicos derivados: arrancada colgante, arrancada de potencia, envión en tijera y press bajo la barra
    (function () {
      var S = P.snatch.keys, D1 = S[10][1], S2 = S[3][1], S3 = S[4][1], S4 = S[5][1], S5 = S[6][1], S6 = S[8][1];
      variant('hangSnatch', 'snatch', { keys: [[0, D1], [0.08, D1], [0.16, S2], [0.21, S3], [0.27, S4], [0.35, S5], [0.42, S5], [0.55, S6], [0.64, S6], [0.82, D1], [1, D1]] });
      var p5 = cloneP(S5); p5.hip = [-0.12, 0.74]; p5.torso = 12; p5.legs = { ik: [-0.02, ANK], fw: 0.18, toe: 15 };
      var s0 = shoAt(p5); p5.arms = cloneP(S6.arms); p5.arms.ik = relIk(p5, [-0.06, 0.5]);
      variant('powerSnatch', 'snatch', { keys: S.map(function (k) { return [k[0], k[1] === S5 ? p5 : k[1]]; }) });
      var C = P.cleanJerk.keys, C6 = C[7][1], dip = C[9][1], drv = C[10][1], spl = C[11][1], rec = C[13][1], lck = C[14][1];
      variant('splitJerk', 'cleanJerk', { thumb: 0.32, period: 4200, keys: [[0, C6], [0.1, C6], [0.2, dip], [0.26, drv], [0.33, spl], [0.42, spl], [0.52, rec], [0.62, lck], [0.7, lck], [0.85, C6], [1, C6]] });
      variant('pressUnder', 'snatch', { s: ['deltsF', 'triceps', 'traps'], thumb: 0.5, period: 3600, keys: [[0, S6], [0.1, S6], [0.45, S5], [0.55, S5], [0.9, S6], [1, S6]] });
    })();
    // ---- Flexiones ----
    var PU = P.pushup;
    function pu(k, A, B, ov) { variant(k, 'pushup', Object.assign({ A: A, B: B }, ov || {})); }
    // A una mano: pies muy abiertos, la mano bajo el pecho y la otra a la espalda
    pu('pushupOneArm', { hip: [-0.08, 0.44], torso: 68, twist: 8, legs: { ik: [-0.92, 0.207], fw: 0.3, foot: 65, pole: [0, -1, 0] }, armsR: { ik: [0.33, 0.06, 0.07], pole: [-1, 0.3, 0.6], hand: 'flat', flatDir: [1, 0, 0.15] }, armsL: { relC: [-0.08, -0.4], gw: 0.12, palm: [0, 1, 0], pole: [0, 1, 0.3] }, arms: null },
      { hip: [-0.03, 0.3], torso: 80, twist: 12, legs: { ik: [-0.92, 0.207], fw: 0.3, foot: 65, pole: [0, -1, 0] }, armsR: { ik: [0.33, 0.06, 0.07], pole: [-1, 0.3, 0.6], hand: 'flat', flatDir: [1, 0, 0.15] }, armsL: { relC: [-0.08, -0.4], gw: 0.12, palm: [0, 1, 0], pole: [0, 1, 0.3] }, arms: null },
      { side: 'R', both: ['abs', 'obliques'], s: ['triceps', 'deltsF', 'abs', 'obliques'] });
    // Agarre cerrado: manos bajo los hombros y codos pegados al cuerpo
    pu('pushupClose', cloneP(PU.A), cloneP(PU.B), { p: ['triceps', 'pecs'], s: ['deltsF', 'abs'] }); arms('pushupClose', function () { return { gw: 0.17, pole: [-1, 0.15, 0.12] }; });
    // De rodillas: rodillas en el suelo y cuerpo recto de las rodillas a los hombros
    pu('pushupKnee', { hip: [-0.06, 0.3], torso: 60, legs: { th: -60, sh: -95, fw: 0.1, foot: 80 }, arms: cloneP(PU.A.arms) }, { hip: [-0.03, 0.2], torso: 73, legs: { th: -72, sh: -95, fw: 0.1, foot: 80 }, arms: cloneP(PU.A.arms) });
    // En anillas: las manos sobre las anillas a unos centímetros del suelo
    pu('pushupRings', { hip: [-0.08, 0.5], torso: 64, legs: cloneP(PU.A.legs), arms: { ik: [0.33, 0.16], gw: 0.27, pole: [-1, 0.3, 0.45], palm: [0, 0, -1] } }, { hip: [-0.03, 0.34], torso: 78, legs: cloneP(PU.A.legs), arms: { ik: [0.33, 0.16], gw: 0.27, pole: [-1, 0.3, 0.45], palm: [0, 0, -1] } }, { rings: 2.4 });
    // En pica: cadera alta en V invertida; la cabeza baja hacia el suelo entre las manos
    pu('pikePushup', { hip: [-0.22, 0.78], torso: 124, head: 20, legs: { ik: [-0.68, ANK], fw: 0.12, foot: 25, pole: [0, -1, 0.15] }, arms: { ik: [0.3, 0.06], gw: 0.27, pole: [-1, 0.3, 0.45], hand: 'flat', flatDir: [1, 0, 0.15] } },
      { hip: [-0.2, 0.74], torso: 134, head: 24, legs: { ik: [-0.68, ANK], fw: 0.12, foot: 25, pole: [0, -1, 0.15] }, arms: { ik: [0.3, 0.06], gw: 0.27, pole: [-1, 0.3, 0.45], hand: 'flat', flatDir: [1, 0, 0.15] } }, { p: ['deltsF', 'triceps'], s: ['pecsU', 'traps'], cam: { az: 30, y: 0.5 } });
    // Perro boca abajo: cadera alta, piernas y brazos estirados, talones hacia el suelo (se mantiene respirando)
    pu('downDog', { hip: [-0.22, 0.85], torso: 128, head: 30, legs: { ik: [-0.68, ANK], fw: 0.12, foot: 12, pole: [0, -1, 0.15] }, arms: { ik: [0.38, 0.06], gw: 0.27, pole: [-1, 0.3, 0.45], hand: 'flat', flatDir: [1, 0, 0.15], straight: 1 } },
      { hip: [-0.24, 0.87], torso: 126, head: 30, legs: { ik: [-0.68, ANK], fw: 0.12, foot: 12, pole: [0, -1, 0.15] }, arms: { ik: [0.38, 0.06], gw: 0.27, pole: [-1, 0.3, 0.45], hand: 'flat', flatDir: [1, 0, 0.15], straight: 1 } }, { p: ['hams', 'calves'], s: ['deltsF', 'lats'], cam: { az: 30, y: 0.5 } });
  })();
