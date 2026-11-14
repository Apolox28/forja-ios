  // ================= Lote 11 (Hevy): piernas y glúteos =================
  (function () {
    // copia las claves de una variante y cambia los brazos de cada postura
    function kmap(k, fn) { P[k].keys = P[k].keys.map(function (kv) { var p = cloneP(kv[1]); ['arms', 'armsL', 'armsR'].forEach(function (n) { if (p[n]) p[n] = fn(cloneP(p[n]), n, p); }); return [kv[0], p]; }); }
    function mid(a, b) { return { hip: [(a.hip[0] + b.hip[0]) / 2, (a.hip[1] + b.hip[1]) / 2], torso: (a.torso + b.torso) / 2 }; }
    var SA = P.squat.A, SB = P.squat.B, BACK = { bar: 'back' };
    // ---- Sentadillas ----
    // Con pausa: abajo se queda quieta un segundo y sube
    variant('squatPause', 'squat', { A: null, B: null, period: 4200, keys: [[0, SA], [0.3, SB], [0.58, SB], [0.84, SA], [1, SA]] });
    // Con cinturón en máquina: el peso cuelga del cinturón entre las piernas; los brazos libres al frente
    var PL = { ik: [0.02, ANK], fw: 0.3, toe: 22 };
    variant('beltSquat', 'squatBW', { beltPlate: true, s: ['glutes', 'adductors'], 
      A: { hip: STAND, torso: 4, legs: PL }, B: { hip: [-0.2, 0.6], torso: 30, head: -14, legs: PL } });
    // Sumo: pies muy abiertos y puntas hacia fuera, tronco más vertical
    var SUMO = { ik: [0.02, ANK], fw: 0.3, toe: 30 };
    var GOB = P.frontSquat.A.arms;
    function sumo(o) { return variant(o.k, o.base, Object.assign({ p: ['quads', 'adductors', 'glutes'], s: ['hams'] }, o.d, {
      A: { hip: STAND, torso: 2, legs: SUMO, arms: o.arms }, B: { hip: [-0.13, 0.55], torso: 22, head: -10, legs: SUMO, arms: o.arms } })); }
    sumo({ k: 'sumoSquat', base: 'squatBW', d: {}, arms: GOB });
    sumo({ k: 'sumoSquatDb', base: 'squatBW', d: { load: 'goblet' }, arms: GOB });
    sumo({ k: 'sumoSquatKb', base: 'squatBW', d: { load: 'kb' }, arms: { relC: [0.12, -0.5], gw: 0.05, palm: 'pro', pole: [0, -1, 0.25] } });
    sumo({ k: 'sumoSquatBar', base: 'squat', d: {}, arms: BACK });
    // Overhead squat: barra por encima de la cabeza con agarre ancho y brazos bloqueados; tronco erguido
    variant('ohSquat', 'squat', { load: 'bar', bakeBar: true, scene: [], smith: false, p: ['quads', 'glutes'], s: ['deltsF', 'trapsU', 'abs', 'triceps'], cam: { az: 35 },
      A: { hip: STAND, torso: 2, legs: { ik: [0.02, ANK], fw: 0.17, toe: 12 }, arms: { rel: [-0.02, 0.56, 0.24], straight: 1, palm: 'pro' } },
      B: { hip: [-0.17, 0.5], torso: 22, head: -8, legs: { ik: [0.02, ANK], fw: 0.17, toe: 12 }, arms: { rel: [-0.14, 0.54, 0.24], straight: 1, palm: 'pro' } } });
    // En TRX: las asas delante, el cuerpo algo inclinado hacia atrás para ayudarse
    variant('trxSquat', 'squatBW', { trx: [1.15, 2.35, 0], cam: { az: 40 },
      A: { hip: [-0.04, 0.97], torso: -4, legs: { ik: [0.02, ANK], fw: 0.16 }, arms: { relC: [0.42, 0.06], gw: 0.2, palm: 'neu', straight: 0.9 } },
      B: { hip: [-0.3, 0.5], torso: 22, head: -10, legs: { ik: [0.02, ANK], fw: 0.16 }, arms: { relC: [0.45, 0.12], gw: 0.2, palm: 'neu', straight: 0.95 } } });
    // Con banda: la banda pisada y las manos a la altura de los hombros
    var SHO = { ua: 22, fa: 148, palm: 'neu' };
    variant('bandSquat', 'squatBW', { bands: [['footL', 'handL'], ['footR', 'handR']], A: { arms: SHO }, B: { arms: SHO } });
    // Pistol asistida: agarrada a las asas del TRX
    variant('pistolAssisted', 'pistol', { trx: [1.05, 2.35, 0], A: { arms: { relC: [0.42, 0.06], gw: 0.18, palm: 'neu', straight: 0.9 } }, B: { arms: { relC: [0.44, 0.14], gw: 0.18, palm: 'neu', straight: 0.95 } } });
    // Sissy con peso: un disco abrazado contra el pecho
    variant('sissySquatWeighted', 'sissySquat', { load: 'plate', plateAtHands: 'grip', A: { arms: { relC: [0.27, -0.04], gw: 0.17, palm: 'neu', pole: [0, -1, 0.25] } }, B: { arms: { relC: [0.27, -0.04], gw: 0.17, palm: 'neu', pole: [0, -1, 0.25] } } });
    // Sentadilla con remo: de cara a la polea; abajo con los brazos estirados, al subir rema hacia el abdomen
    variant('squatRow', 'facePull', { pulleyY: 0.9, p: ['quads', 'lats'], s: ['glutes', 'deltsR', 'biceps'], A: null, B: null, period: 3600, cam: { az: 30 },
      keys: (function () {
        var lg = { ik: [0.02, ANK], fw: 0.16 }, ext = { relC: [0.52, -0.12], gw: 0.08, pole: [-0.5, -1, 0.6], palm: 'neu' }, row = { relC: [0.17, -0.26], gw: 0.12, pole: [-0.5, -1, 0.6], palm: 'neu' };
        var D = { hip: [-0.24, 0.52], torso: 30, head: -12, legs: lg, legsL: null, legsR: null, arms: ext }, U = { hip: [-0.05, 0.97], torso: 0, legs: lg, legsL: null, legsR: null, arms: ext }, R = Object.assign({}, U, { torso: -4, arms: row });
        return [[0, D], [0.1, D], [0.34, U], [0.5, R], [0.6, R], [0.76, U], [1, D]];
      })() });
    // Pasos laterales con banda en las rodillas: semisentadilla, paso a la derecha, junta, paso a la izquierda, junta
    (function () {
      var H = function (z) { return [-0.12, 0.84, z]; }, ar = { rel: [0.1, HANG + 0.06, 0.08], palm: 'neu' };
      function ps(hz, l, r) { return { hip: H(hz), torso: 12, head: -6, legsL: { ik: [0.02, l[0], l[1]], fw: 0.1 }, legsR: { ik: [0.02, r[0], r[1]], fw: 0.1 }, arms: ar }; }
      var S0 = ps(0, [ANK, 0.13], [ANK, 0.13]), RL = ps(0.04, [ANK, 0.15], [0.15, 0.2]), S1 = ps(0.085, [ANK, 0.215], [ANK, 0.215]);
      var LL = ps(0.13, [0.15, 0.11], [ANK, 0.17]), S2 = ps(0.17, [ANK, 0.04], [ANK, 0.13]);
      variant('bandLateralWalk', 'squatBW', { bands: [['kneeL', 'kneeR']], p: ['gluteMed'], s: ['glutes', 'quads'], A: null, B: null, period: 3600, cam: { az: 80 },
        keys: [[0, S0], [0.1, RL], [0.2, S1], [0.3, LL], [0.4, S2], [0.5, S2], [0.6, LL], [0.7, S1], [0.8, RL], [0.9, S0], [1, S0]] });
    })();
    // Snowboard: postura ancha y flexionada sobre la tabla; el peso pasa de canto de puntas a canto de talones
    (function () {
      var lg = { ik: [0.02, ANK + 0.025], fw: 0.27, toe: 10 }, ar = { rel: [0.12, -0.4, 0.22], palm: 'pro', straight: 0.9 };
      var T = { hip: [-0.1, 0.83], torso: 20, head: -10, twist: 8, legs: lg, arms: ar }, Hh = { hip: [-0.2, 0.8], torso: 6, head: -4, twist: -8, legs: lg, arms: ar };
      variant('snowboard', 'squatBW', { boxes: [[0.03, 0.025, 0, 0.3, 1.45]], p: ['quads', 'glutes'], s: ['calves', 'abs', 'adductors'], A: null, B: null, period: 3400, cam: { az: 50 },
        keys: [[0, T], [0.42, Hh], [0.58, Hh], [1, T]] });
    })();
    // ---- Zancadas ----
    var RK = P.reverseLunge.keys;
    variant('splitSquat', 'reverseLunge', { keys: [[0, RK[3][1]], [0.42, RK[4][1]], [0.55, RK[4][1]], [1, RK[3][1]]] });
    variant('reverseLungeBW', 'reverseLunge', { load: 'none' });
    variant('reverseLungeBar', 'reverseLunge', { load: 'back' }); kmap('reverseLungeBar', function () { return { bar: 'back' }; });
    variant('lungeBW', 'lunge', { load: 'none' });
    variant('lungeOverhead', 'lunge', { load: 'hands', s: ['glutes', 'deltsF', 'abs'] }); kmap('lungeOverhead', function () { return { rel: [-0.01, 0.56, 0.1], straight: 1, palm: 'neu' }; });
    variant('walkingLungeBW', 'lungeAlt', { load: 'none' });
    variant('walkingLungeBag', 'lungeAlt', { load: 'medball' }); kmap('walkingLungeBag', function () { return { relC: [0.3, -0.06], gw: 0.3, palm: 'neu', pole: [0, -1, 0.3] }; });
    variant('lateralLungeBW', 'lateralLunge', { load: 'none' });
    variant('stepUpBW', 'stepUp', { load: 'none' });
    // Zancada cruzada (reverencia): la pierna de atrás cruza por detrás de la delantera
    (function () {
      var ar = { rel: [0.02, HANG, 0.06], palm: 'neu' };
      function cp(hip, tor, l, r) { return { hip: hip, torso: tor, legsL: { ik: l.slice(0, 3), fw: 0.12, foot: l[3] || 0 }, legsR: { ik: r.slice(0, 3), fw: 0.12, foot: r[3] || 0 }, arms: ar }; }
      var S = cp([STAND[0], STAND[1], 0], 0, [0, ANK, 0.12], [0, ANK, 0.12]);
      var RU = cp([-0.03, 0.95, -0.03], 4, [0.04, ANK, 0.12], [-0.2, 0.18, 0.0, 20]), RB = cp([-0.1, 0.6, -0.05], 12, [0.1, ANK, 0.12], [-0.4, 0.1, -0.08, 45]);
      var LU = cp([-0.03, 0.95, 0.03], 4, [-0.2, 0.18, 0.0, 20], [0.04, ANK, 0.12]), LB = cp([-0.1, 0.6, 0.05], 12, [-0.4, 0.1, -0.08, 45], [0.1, ANK, 0.12]);
      variant('curtsyLunge', 'lunge', { side: null, load: 'hands', p: ['glutes', 'gluteMed', 'quads'], s: ['adductors'], A: null, B: null, period: 4400, cam: { az: 25 },
        keys: [[0, S], [0.08, S], [0.16, RU], [0.28, RB], [0.36, RB], [0.44, RU], [0.5, S], [0.58, S], [0.66, LU], [0.78, LB], [0.86, LB], [0.94, LU], [1, S]] });
    })();
    // Zancada con salto: cambio de pierna en el aire
    (function () {
      var ar = { rel: [0.06, HANG + 0.04, 0.06], palm: 'neu' };
      function jp(hip, l, r) { return { hip: hip, torso: 6, legsL: { ik: l.slice(0, 3), fw: 0.12, foot: l[3] || 0 }, legsR: { ik: r.slice(0, 3), fw: 0.12, foot: r[3] || 0 }, arms: ar }; }
      var BR = jp([-0.05, 0.56], [-0.42, 0.1, 0.11, 45], [0.33, ANK, 0.11]), BL = jp([-0.05, 0.56], [0.33, ANK, 0.11], [-0.42, 0.1, 0.11, 45]);
      var AR = jp([-0.04, 1.06], [-0.12, 0.3, 0.11, 30], [0.14, 0.34, 0.11, 10]), AL = jp([-0.04, 1.06], [0.14, 0.34, 0.11, 10], [-0.12, 0.3, 0.11, 30]);
      variant('jumpLunge', 'lunge', { side: null, load: 'none', p: ['quads', 'glutes'], s: ['calves', 'hams'], A: null, B: null, period: 2600, cam: { az: 70 },
        keys: [[0, BR], [0.12, BR], [0.27, AR], [0.42, BL], [0.56, BL], [0.71, AL], [0.86, BR], [1, BR]] });
    })();
    // ---- Gemelos ----
    variant('calfBar', 'calf', { load: 'back', A: { arms: BACK }, B: { arms: BACK } });
    variant('calfSingleBW', 'calfDbSingle', { load: 'none', A: { armsR: { rel: [0.02, HANG, 0.05], palm: 'neu' } }, B: { armsR: { rel: [0.02, HANG, 0.05], palm: 'neu' } } });
    variant('calfSingleBar', 'calfDbSingle', { load: 'back', boxes: null, A: { armsR: BACK, armsL: BACK }, B: { armsR: BACK, armsL: BACK } });
    // ---- Glúteos ----
    variant('hipThrustBW', 'hipThrust', { load: 'none', A: { arms: P.hipThrustMachine.A.arms }, B: { arms: P.hipThrustMachine.B.arms } });
    variant('gluteBridgeSingle', 'gluteBridge', { side: 'L', both: ['abs'],
      A: { legs: null, legsL: P.gluteBridge.A.legs, legsR: { th: 118, sh: 118, fw: 0.15 } }, B: { legs: null, legsL: P.gluteBridge.B.legs, legsR: { th: 142, sh: 142, fw: 0.15 } } });
    variant('gluteBridgeBarPartial', 'gluteBridgeBar', { A: Object.assign({}, P.gluteBridgeBar.A, mid(P.gluteBridgeBar.A, P.gluteBridgeBar.B)) });
    // ---- Balanceos y potencia ----
    variant('dbSnatch', 'kbSnatch', { kbHand: null, load: 'handR' });
    // Lanzamiento de balón al suelo: balón arriba con los brazos estirados y golpe al suelo con flexión de cadera
    (function () {
      var lg = { ik: [0.0, ANK], fw: 0.17 };
      function sb(hip, tor, hd, h) { return { hip: hip, torso: tor, head: hd, legs: lg, arms: { ik: h, gw: 0.13, palm: 'neu', pole: [0, -1, 0.4] } }; }
      var UP = sb(STAND, -4, 6, [0.12, 1.86]), HI = sb([-0.02, 0.95], 4, 4, [0.4, 1.62]), MID = sb([-0.04, 0.95], 16, 0, [0.42, 1.25]), BOT = sb([-0.24, 0.52], 55, -16, [0.36, 0.42]), F1 = sb([-0.02, 0.96], 2, 2, [0.32, 1.8]), RISE = sb([-0.14, 0.8], 26, -6, [0.3, 0.9]);
      variant('ballSlam', 'squatBW', { load: 'medball', p: ['lats', 'abs'], s: ['deltsF', 'glutes', 'triceps'], A: null, B: null, period: 2400, thumb: 0.15, cam: { az: 60 },
        keys: [[0, UP], [0.14, UP], [0.2, F1], [0.28, MID], [0.38, BOT], [0.52, BOT], [0.7, RISE], [0.86, HI], [1, UP]] });
    })();
    variant('uprightRowKb', 'uprightRow', { load: 'kb', stack: false });
    // ---- Sentadilla + press ----
    (function () {
      var lg = { ik: [0.02, ANK], fw: 0.16 }, free = { rel: [0.05, HANG + 0.02, 0.12], palm: 'neu' };
      function tk(hip, tor, a) { return { hip: hip, torso: tor, legs: lg, armsR: a, armsL: free, kbRack: 1 }; }
      var rk = { relC: [0.15, 0.03], gw: 0.3, palm: 'neu', pole: [0.3, -1, 0.15] }, up = { relC: [0.02, 0.62], gw: 0.34, palm: 'neu', pole: [0, -1, 0.5], straight: 1 };
      var R = tk([-0.02, 0.97], 2, rk), Q = tk([-0.2, 0.52], 24, rk), U = tk([-0.02, 0.97], 0, up);
      variant('thrusterKb', 'kbPress', { p: ['quads', 'deltsF'], s: ['glutes', 'triceps', 'abs'], A: null, B: null, period: 3200, thumb: 0.5,
        keys: [[0, R], [0.08, R], [0.3, Q], [0.38, Q], [0.56, R], [0.68, U], [0.78, U], [1, R]] });
    })();
    (function () {
      var lg = { ik: [0.04, ANK], fw: 0.16 }, A = P.landminePress.A, B = P.landminePress.B;
      var R = Object.assign({}, A, { legs: lg, legsL: null, legsR: null, hip: [-0.02, 0.95], torso: 12 }), Q = Object.assign({}, R, { hip: [-0.17, 0.76], torso: 8, head: -4 }), U = Object.assign({}, B, { legs: lg, legsL: null, legsR: null, hip: [-0.02, 0.95], torso: 12, armsR: Object.assign({}, B.armsR, { relC: [0.41, 0.27] }) });
      variant('landmineSquatPress', 'landminePress', { p: ['quads', 'deltsF'], s: ['glutes', 'triceps', 'pecs'], A: null, B: null, period: 3600, thumb: 0.5,
        keys: [[0, R], [0.08, R], [0.3, Q], [0.38, Q], [0.58, R], [0.72, U], [0.8, U], [1, R]] });
    })();
  })();
