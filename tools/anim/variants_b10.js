  // ================= Lote 10 (Hevy): espalda =================
  (function () {
    var ST = { hip: STAND, torso: 0, legs: { ik: [0, ANK], fw: 0.14 } };
    function st(o) { return Object.assign({}, ST, o); }
    // ---- Jalones ----
    // Estiramiento de dorsal: manos en un poste delante, cadera atrás y brazos estirados por encima
    variant('latStretch', 'pulldown', { load: 'none', stack: false, scene: [], p: ['lats'], s: ['deltsR', 'triceps'], boxes: [[0.475, 1.9, 0, 0.04, 0.04, 0, 1]], cam: { az: 40 },
      A: { hip: [-0.3, 0.88], torso: 62, head: -20, legs: { ik: [0, ANK], fw: 0.15 }, arms: { ik: [0.435, 1.12], gw: 0.11, palm: 'neu', straight: 1 } },
      B: { hip: [-0.36, 0.84], torso: 72, head: -24, legs: { ik: [0, ANK], fw: 0.15 }, arms: { ik: [0.435, 1.08], gw: 0.11, palm: 'neu', straight: 1 } } });
    // Jalón con banda (sentado) y de rodillas: la banda anclada en alto delante; los codos bajan hacia los costados
    var BH = [[[0.25, 2.3, -0.3], 'handL'], [[0.25, 2.3, 0.3], 'handR']];
    variant('bandPulldown', 'pulldown', { load: 'none', stack: false, scene: ['stool'], bands: BH });
    variant('bandPulldownKneel', 'pulldown', { load: 'none', stack: false, scene: [], bands: BH,
      A: { hip: [-0.08, 0.55], torso: -4, legs: { th: 2, sh: -88, fw: 0.12, foot: 80 } }, B: { hip: [-0.08, 0.55], torso: -14, legs: { th: 2, sh: -88, fw: 0.12, foot: 80 } } });
    // Jalón con brazos rectos con cuerda
    variant('straightArmPulldownRope', 'straightArmPulldown', { load: 'facePull', rope: true, anchor: [0.72, 2.12, 0] });
    eachArm('straightArmPulldownRope', function (a) { a.gw = 0.07; a.palm = 'neu'; return a; });
    // Pullover en máquina: sentado, los brazos bajan en arco desde detrás de la cabeza hasta delante del tronco
    variant('pulloverMachine', 'pulldown', { load: 'grips', scene: ['seatBack'], machinePos: [-0.75, -0.55, 0], p: ['lats'], s: ['pecs', 'triceps'], cam: { az: 50 },
      A: { hip: [-0.06, 0.52], torso: -6, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { relC: [-0.05, 0.5], gw: 0.22, palm: 'neu', pole: [-0.5, 1, 0.3], straight: 0.8 } },
      B: { hip: [-0.06, 0.52], torso: -6, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { relC: [0.42, -0.12], gw: 0.22, palm: 'neu', pole: [-0.5, -1, 0.3], straight: 0.8 } } });
    // Remo alto isolateral en máquina: agarres arriba y delante; tira hacia abajo y atrás hasta el pecho
    variant('highRowMachine', 'pulldown', { load: 'grips', scene: ['seatBack'], machinePos: [0.8, -0.6, 0], s: ['traps', 'biceps', 'deltsR'], cam: { az: 40 },
      A: { hip: [-0.06, 0.52], torso: 7, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { relC: [0.42, 0.34], gw: 0.25, palm: 'neu', pole: [-1, -0.5, 0.4] } },
      B: { hip: [-0.06, 0.52], torso: 6, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { relC: [0.17, 0.0], gw: 0.25, palm: 'neu', pole: [-1, -0.5, 0.4] } } });
    // ---- Dominadas ----
    var PA = P.pullup.A, PB = P.pullup.B;
    // Gironda (al esternón): el cuerpo se inclina atrás y el esternón llega a la barra
    variant('pullupSternum', 'pullup', { B: { hip: [0.14, 1.62], torso: -34, head: 12 } });
    // Con banda: la banda cuelga de la barra y pasa bajo los pies
    variant('pullupBand', 'pullup', { bands: [[[0, 2.2, -0.05], 'footL'], [[0, 2.2, 0.05], 'footR']], A: { legs: { rel: [-0.02, -0.86], fw: 0.06 } }, B: { legs: { rel: [-0.02, -0.86], fw: 0.06 } } });
    // Con kipping: balanceo arco-hueco y golpe de cadera que lleva la barbilla sobre la barra
    (function () {
      var arms = cloneP(PA.arms), arch = { hip: [-0.14, 1.33], torso: 12, head: -6, legs: { rel: [-0.3, -0.78], fw: 0.06 }, arms: arms };
      var hollow = { hip: [0.1, 1.36], torso: -14, head: 4, legs: { rel: [0.18, -0.82], fw: 0.06 }, arms: arms }, top = cloneP(PB); top.hip = [-0.11, top.hip[1]];
      variant('kippingPullup', 'pullup', { A: null, B: null, period: 2400, thumb: 0.5, keys: [[0, PA], [0.12, arch], [0.27, hollow], [0.42, top], [0.52, top], [0.66, hollow], [0.8, arch], [1, PA]] });
    })();
    variant('pullupRings', 'pullup', { rings: 2.95 }); eachArm('pullupRings', function (a) { a.gw = 0.24; a.palm = 'neu'; a.ik = [0, 2.14]; return a; });
    // Escapulares: colgado con los brazos estirados; solo bajan y se juntan las escápulas (el cuerpo sube unos centímetros)
    variant('scapPullup', 'pullup', { s: ['lats', 'deltsR'], p: ['traps'], A: { hip: PA.hip, shr: 0.04 }, B: { hip: [PA.hip[0], PA.hip[1] + 0.05], torso: -3, shr: -0.03 } });
    eachArm('scapPullup', function (a) { a.straight = 1; return a; });
    // Negativas: arriba de un salto y bajada muy lenta
    var PBh = Object.assign({}, PB, { hip: [PB.hip[0] - 0.06, PB.hip[1]], torso: -14 });
    variant('negativePullup', 'pullup', { A: null, B: null, period: 5000, thumb: 0.2, keys: [[0, PBh], [0.08, PBh], [0.82, Object.assign({}, PA, { hip: [PA.hip[0] - 0.07, PA.hip[1] + 0.075], torso: -6 })], [0.9, Object.assign({}, PA, { hip: [PA.hip[0] - 0.07, PA.hip[1] + 0.075], torso: -6 })], [1, PBh]] });
    // Muscle up: tirón explosivo, transición con el pecho por encima de la barra, fondo y extensión de brazos
    (function () {
      var arms = { ik: [0.0, 2.22], gw: 0.36, palm: 'pro', pole: [0.2, -1, 0.7] };
      var pull = { hip: [-0.17, 1.7], torso: -12, head: 8, legs: { rel: [-0.15, -0.82], fw: 0.06 }, arms: arms };
      var tr = { hip: [-0.35, 1.9], torso: 34, head: -10, legs: { rel: [-0.2, -0.82], fw: 0.06 }, arms: Object.assign({}, arms, { pole: [-1, 0.5, 0.4] }) };
      var dip = { hip: [-0.34, 1.98], torso: 26, head: -10, legs: { rel: [-0.18, -0.84], fw: 0.06 }, arms: Object.assign({}, arms, { pole: [-1, 0.5, 0.4] }) };
      var sup = { hip: [-0.14, 2.28], torso: 8, head: 0, legs: { rel: [-0.12, -0.86], fw: 0.06 }, arms: Object.assign({}, arms, { pole: [-1, 0.5, 0.4] }) };
      variant('muscleUp', 'pullup', { p: ['lats', 'triceps'], s: ['pecs', 'biceps', 'deltsF', 'abs'], A: null, B: null, period: 4200, thumb: 0.5, cam: { az: 40, y: 1.6 },
        keys: [[0, PA], [0.1, PA], [0.24, pull], [0.33, tr], [0.42, dip], [0.52, sup], [0.6, sup], [0.72, dip], [0.82, pull], [1, PA]] });
    })();
    // Escalada: de cara a la pared con presas; alterna el alcance de manos y pies
    (function () {
      var holds = [[0.2, 1.95, -0.25], [0.2, 2.07, 0.22], [0.2, 1.75, 0.25], [0.2, 0.5, -0.16], [0.2, 0.75, 0.15], [0.2, 0.35, 0.18], [0.2, 2.35, -0.2]];
      var bx = [[0.26, 2.8, 0, 0.06, 1.6, 2.8, 1]].concat(holds.map(function (h) { return [h[0] - 0.01, h[1] - 0.06, h[2], 0.06, 0.08, 0.04, 1]; }));
      function cl(hipY, tor, l, r, fl, fr) { return { hip: [-0.13, hipY], torso: tor, head: -14, armsL: { ik: [l[0], l[1], -l[2]], palm: [1, 0, 0], pole: [-0.5, -1, -0.3] }, armsR: { ik: [r[0], r[1], r[2]], palm: [1, 0, 0], pole: [-0.5, -1, 0.3] }, legsL: { ik: [fl[0], fl[1], -fl[2]], fw: 0.15, foot: 0, pole: [0.5, 0, -1] }, legsR: { ik: [fr[0], fr[1], fr[2]], fw: 0.15, foot: 0, pole: [0.5, 0, 1] } }; }
      var A = cl(1.1, -4, [0.14, 1.93, -0.25], [0.17, 1.74, 0.25], [0.03, 0.52, -0.2], [0.03, 0.37, 0.2]);
      var B = cl(1.24, -4, [0.14, 1.93, -0.25], [0.14, 2.06, 0.22], [0.03, 0.52, -0.2], [0.03, 0.77, 0.15]);
      variant('climbing', 'pullup', { scene: [], boxes: bx, p: ['lats', 'forearms'], s: ['biceps', 'quads', 'calves', 'deltsR'], A: null, B: null, period: 3600, cam: { az: 35, el: 8, y: 1.3 },
        keys: [[0, A], [0.4, B], [0.6, B], [1, A]] });
    })();
    // ---- Remos ----
    var CS = P.chestSupportedRow;
    // Encogimiento Kelso: boca abajo en el banco inclinado, brazos estirados; solo se juntan las escápulas
    variant('kelsoShrug', 'chestSupportedRow', { p: ['traps'], s: ['deltsR'], load: 'bar', A: { arms: { ik: CS.A.arms.ik.slice(0, 2), gw: 0.26, palm: 'pro', straight: 1 } }, B: { arms: { ik: [CS.A.arms.ik[0] - 0.03, CS.A.arms.ik[1] + 0.05], gw: 0.26, palm: 'pro', straight: 1 } } });
    // Pájaros con pecho apoyado: brazos que se abren a los lados con los codos casi rectos
    variant('reverseFlyChest', 'chestSupportedRow', { p: ['deltsR'], s: ['traps', 'deltsS'], A: { arms: { ua: 6, fa: 12, plane: 'f', palm: 'neu' } }, B: { arms: { ua: 76, fa: 88, plane: 'f', palm: [0, -1, 0] } } });
    // Remo bajo en TRX: inclinado hacia atrás de cara al anclaje; el pecho sube hasta las manos con los codos atrás
    variant('trxRow', 'row', { load: 'none', trx: [1.25, 2.35, 0], cam: { az: 40 },
      A: { hip: [-0.27, 0.83], torso: -30, head: 8, legs: { ik: [0.14, ANK], fw: 0.12 }, arms: { relC: [0.52, 0.0], gw: 0.12, palm: 'neu', straight: 0.95, pole: [-1, -0.5, 0.4] } },
      B: { hip: [-0.15, 0.91], torso: -14, head: 4, legs: { ik: [0.14, ANK], fw: 0.12 }, arms: { relC: [0.18, -0.04], gw: 0.2, palm: 'neu', pole: [-1, -0.5, 0.4] } } });
    // Remo gorila con kettlebells: bisagra con las rodillas flexionadas; rema una mientras la otra apoya en el suelo
    (function () {
      var b = { hip: [-0.2, 0.62], torso: 66, head: -24, legs: { ik: [0, ANK], fw: 0.32, toe: 14 } };
      var low = { ik: [0.13, 0.3, 0.1], palm: 'neu', pole: [-1, 0.5, 0.4] }, up = { ik: [-0.04, 0.55, 0.14], palm: 'neu', pole: [-1, 0.6, 0.4] };
      variant('gorillaRow', 'row', { load: 'kb2', A: null, B: null, period: 3200, s: ['deltsR', 'biceps', 'glutes'],
        keys: [[0, Object.assign({ armsL: low, armsR: low }, b)], [0.25, Object.assign({ armsL: low, armsR: up }, b)], [0.5, Object.assign({ armsL: low, armsR: low }, b)], [0.75, Object.assign({ armsL: up, armsR: low }, b)], [1, Object.assign({ armsL: low, armsR: low }, b)]] });
    })();
    variant('bandRow', 'row', { load: 'none', bands: [['footL', 'handL'], ['footR', 'handR']] });
    variant('rowDb', 'row', { load: 'hands' }); eachArm('rowDb', function (a) { a.gw = 0.2; a.palm = 'neu'; return a; });
    // ---- Remo sentado ----
    var SRM = P.seatedRowMachine;
    variant('lowRowMachine', 'seatedRowMachine', { A: { arms: { relC: [0.46, -0.24], gw: 0.19, palm: 'neu', pole: [-1, -0.45, 0.6] } }, B: { arms: { relC: [0.12, -0.32], gw: 0.21, palm: 'neu', pole: [-1, -0.45, 0.6] } } });
    variant('seatedRowWide', 'seatedRow', { handleW: 0.7, s: ['deltsR', 'traps', 'biceps'] }); eachArm('seatedRowWide', function (a) { a.gw = 0.3; a.palm = 'pro'; return a; });
    variant('seatedRowBar', 'seatedRow', { handleW: 0.5 }); eachArm('seatedRowBar', function (a) { a.gw = 0.2; a.palm = 'pro'; return a; });
    // Pájaro a una mano en polea: polea a la altura del hombro en el lado contrario; el brazo estirado abre hacia atrás
    variant('reverseFlyCableOne', 'reverseFlyCable', { side: 'R', load: 'cableR', twinPos: null, towerPos: [0.25, -0.95], anchor: [0.25, 1.42, -0.88], cam: { az: 60 },
      A: { hip: STAND, torso: 0, legs: { ik: [0, ANK], fw: 0.15 }, armsR: { ik: [0.45, 1.36, -0.12], palm: [0, 0, -1], straight: 0.9 }, armsL: { rel: [0.03, HANG, 0.06], palm: 'neu' }, arms: null },
      B: { hip: STAND, torso: 0, legs: { ik: [0, ANK], fw: 0.15 }, armsR: { ik: [0.0, 1.36, 0.62], palm: [0, 0, -1], straight: 0.9 }, armsL: { rel: [0.03, HANG, 0.06], palm: 'neu' }, arms: null } });
    // ---- Lumbar ----
    // Extensión lumbar en máquina: sentado con el respaldo en la espalda alta; el tronco se extiende hacia atrás
    variant('backExtMachine', 'hyperext', { scene: ['stool'], backPad: true, stack: true, machinePos: [-0.75, -0.55, 0], cam: { az: 60 },
      A: { hip: [-0.06, 0.52], torso: 30, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { relC: [0.15, -0.07], gw: -0.07, pole: [0, -1, 0.5], palm: 'neu' } },
      B: { hip: [-0.06, 0.52], torso: -12, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { relC: [0.15, -0.07], gw: -0.07, pole: [0, -1, 0.5], palm: 'neu' } } });
    // Peso muerto rumano a una pierna con barra
    variant('singleLegRdlBar', 'singleLegRdl', { load: 'bar' });
    eachArm('singleLegRdlBar', function (a) { return { rel: [0.04, HANG, 0.08], palm: 'pro' }; });
    // Hiperextensión inversa: tumbado boca abajo con la cadera en el borde; las piernas estiradas suben atrás
    variant('reverseHyper', 'hyperext', { scene: [], boxes: [[0.41, 0.86, 0, 0.62, 0.42]], p: ['glutes', 'hams'], s: ['lowback'], cam: { az: 30 },
      A: { hip: [-0.02, 1.03], torso: 90, head: -10, legs: { th: -4, sh: -4, fw: 0.1, foot: 30 }, arms: { ik: [0.66, 0.9], gw: 0.2, palm: 'pro' } },
      B: { hip: [-0.02, 1.03], torso: 90, head: -10, legs: { th: -88, sh: -88, fw: 0.1, foot: 70 }, arms: { ik: [0.66, 0.9], gw: 0.2, palm: 'pro' } } });
    // ---- Peso muerto y tirones ----
    variant('bandDeadlift', 'deadlift', { load: 'none', bands: [['footL', 'handL'], ['footR', 'handR']] });
    variant('deadliftSmith', 'deadlift', { smith: true });
    var K = P.powerClean.keys, C0 = K[0][1], C1 = K[2][1], C2 = K[3][1], C3 = K[4][1], C4 = K[5][1], C5 = K[6][1], C6 = K[7][1];
    // Cargada (en sentadilla): recepción en sentadilla frontal profunda
    var cq = { hip: [-0.15, 0.5], torso: 22, head: -8, legs: { ik: [-0.04, ANK], fw: 0.16, toe: 15 } }; cq.arms = { ik: relIk(cq, [0.19, 0.06]), gw: 0.25, palm: 'pro', pole: [1, 0.5, 0.3] };
    variant('squatClean', 'powerClean', { keys: [[0, C0], [0.06, C0], [0.16, C1], [0.23, C2], [0.27, C3], [0.32, C4], [0.4, cq], [0.48, cq], [0.6, C6], [0.68, C6], [0.78, C2], [0.9, C1], [1, C0]] });
    variant('hangClean', 'powerClean', { keys: [[0, C2], [0.08, C2], [0.15, C3], [0.21, C4], [0.28, C5], [0.38, C6], [0.5, C6], [0.7, C2], [1, C2]] });
    var jump = cloneP(C3); jump.hip = [0.0, 1.06]; jump.arms = cloneP(C3.arms); jump.arms.ik = [C3.arms.ik[0], C3.arms.ik[1] + 0.07]; jump.legs = { ik: [-0.04, ANK + 0.08], fw: 0.13, foot: 30 }; jump.shr = 0.06;
    variant('jumpShrug', 'powerClean', { s: ['quads', 'calves', 'glutes'], p: ['traps'], keys: [[0, C2], [0.12, C2], [0.28, jump], [0.42, C2], [0.5, C1], [0.62, C2], [1, C2]] });
    var hp = cloneP(C3); hp.arms = { ik: relIk(C3, [0.16, -0.06]), gw: 0.22, palm: 'pro', pole: [0, 1, 0.8] };
    variant('highPull', 'powerClean', { p: ['traps', 'deltsS'], s: ['glutes', 'hams', 'quads'], keys: [[0, C0], [0.06, C0], [0.18, C1], [0.26, C2], [0.32, C3], [0.4, hp], [0.5, hp], [0.62, C2], [0.8, C1], [1, C0]] });
    variant('cleanPull', 'powerClean', { p: ['glutes', 'hams', 'traps'], s: ['quads', 'lowback'], keys: [[0, C0], [0.08, C0], [0.22, C1], [0.32, C2], [0.4, C3], [0.5, C3], [0.62, C2], [0.82, C1], [1, C0]] });
  })();
