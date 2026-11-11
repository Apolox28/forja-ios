  // ================= Lote 5: core =================
  (function () {
    var SUP = { hip: [0, 0.145], torso: -90 };
    var SIDEA = { ua: 88, fa: 88, palm: [0, -1, 0] };
    function sup(o) { return Object.assign({}, SUP, o); }
    // Abdominales completos (sit-up): tumbado con rodillas flexionadas, el tronco sube hasta sentarse; flexores de cadera y recto abdominal
    variant('sitUp', 'crunch', { p: ['hipFlex', 'abs'], s: ['obliques', 'quads'], stack: false, machinePos: null, cam: { y: 0.4, az: 30 },
      A: { hip: [0, 0.133], torso: -90, head: 0 }, B: { hip: [0, 0.133], torso: -14, head: 6 } });
    // Abdominales en V (V-up): brazos por detrás de la cabeza y piernas estiradas; suben a la vez hasta tocar las espinillas
    variant('vUp', 'legRaise', { p: ['abs', 'hipFlex'], s: ['obliques', 'quads'],
      A: sup({ legs: { th: 86, sh: 87, footRel: 25 }, arms: { ua: 266, fa: 266, palm: [0, 1, 0] } }),
      B: { hip: [0, 0.145], torso: -42, head: 8, legs: { th: 134, sh: 135, footRel: 25 }, arms: { ua: 128, fa: 130, palm: [0, 1, 0] } } });
    // Dead bug: brazos al techo y caderas/rodillas a 90º; baja brazo y pierna contrarios sin despegar la zona lumbar
    (function () {
      var TT = { th: 180, sh: 92, footRel: 10 }, EXT = { th: 102, sh: 102, footRel: 10 }, UP = { ua: 178, fa: 178, palm: [0, 0, 1] }, OV = { ua: 252, fa: 252, palm: [0, 0, 1] };
      var rest = sup({ armsL: UP, armsR: UP, legsL: TT, legsR: TT }), r = sup({ armsL: UP, armsR: OV, legsL: EXT, legsR: TT }), l = sup({ armsL: OV, armsR: UP, legsL: TT, legsR: EXT });
      variant('deadBug', 'legRaise', { p: ['abs'], s: ['obliques', 'hipFlex'], A: null, B: null, thumb: 0.25,
        keys: [[0, rest], [0.06, rest], [0.25, r], [0.32, r], [0.5, rest], [0.56, rest], [0.75, l], [0.82, l], [1, rest]] });
    })();
    // Hollow hold: hombros y piernas despegados del suelo, brazos estirados por detrás de la cabeza (isométrico)
    variant('hollowHold', 'legRaise', { p: ['abs'], s: ['hipFlex', 'obliques', 'quads'],
      A: { hip: [0, 0.145], torso: -77, head: 6, legs: { th: 109, sh: 110, footRel: 25 }, arms: { ua: 248, fa: 250, palm: [0, 1, 0] } },
      B: { hip: [0, 0.145], torso: -75, head: 7, legs: { th: 112, sh: 113, footRel: 25 }, arms: { ua: 247, fa: 249, palm: [0, 1, 0] } } });
    // Crunch bicicleta: hombros despegados, codo hacia la rodilla contraria mientras la otra pierna se estira
    (function () {
      var bent = { th: 206, sh: 118, footRel: 15 }, ext = { th: 116, sh: 117, footRel: 15 }, mid = { th: 160, sh: 116, footRel: 15 };
      var T = { temple: 1, pole: [0.3, 0.2, 1], palm: [0, 0, -1] };
      var lk = { hip: [0, 0.14], torso: -66, head: 10, twist: 34, legsL: bent, legsR: ext, arms: T }, rk = { hip: [0, 0.14], torso: -66, head: 10, twist: -34, legsL: ext, legsR: bent, arms: T };
      var mm = { hip: [0, 0.14], torso: -70, head: 10, twist: 0, legsL: mid, legsR: mid, arms: T };
      variant('bicycleCrunch', 'legRaise', { p: ['obliques', 'abs'], s: ['hipFlex'], A: null, B: null, thumb: 0.0, period: 2000,
        keys: [[0, lk], [0.08, lk], [0.25, mm], [0.42, rk], [0.58, rk], [0.75, mm], [0.92, lk], [1, lk]] });
    })();
    // Giros rusos: sentado con el tronco inclinado atrás y los pies despegados; el balón va de un lado a otro girando el tronco
    (function () {
      var lg = { th: 128, sh: 62, footRel: 20, fw: 0.1 };
      var ar = { relC: [0.31, -0.12], gw: 0.135, palm: 'neu', pole: [0, -1, 0.6] };
      var b = { hip: [0, 0.135], torso: -46, head: 12, legs: lg, arms: ar };
      variant('russianTwist', 'legRaise', { load: 'medball', p: ['obliques'], s: ['abs', 'hipFlex'], cam: { az: 70, y: 0.4 },
        A: Object.assign({ twist: 42 }, b), B: Object.assign({ twist: -42 }, b) });
    })();
    // Crunch inverso: caderas y rodillas a 90º; la pelvis se enrolla y las rodillas van hacia el pecho; los hombros no se mueven
    (function () {
      var sh0 = V(-SPINE, 0.145, 0), hb = V(-0.05, 0.25, 0), up = sh0.clone().sub(hb).normalize();
      variant('reverseCrunch', 'legRaise', { p: ['abs'], s: ['obliques', 'hipFlex'],
        A: sup({ legs: { th: 176, sh: 96, footRel: 15 }, arms: SIDEA }),
        B: { hip: [hb.x, hb.y], torso: Math.atan2(up.x, up.y) * 180 / Math.PI, legs: { th: 214, sh: 128, footRel: 15 }, arms: SIDEA } });
    })();
    // Colgado: rodillas al pecho (rodillas flexionadas) y toes to bar (piernas estiradas hasta la barra)
    variant('hangKnee', 'hangLeg', { s: ['forearms', 'obliques'],
      B: { hip: [0.02, 1.34], torso: -10, legs: { th: 112, sh: 14, footRel: 20 }, arms: { ik: [0.0, 2.22], gw: 0.4, straight: 1, palm: 'pro' } } });
    variant('toesToBar', 'hangLeg', { p: ['abs', 'hipFlex'], s: ['lats', 'forearms', 'obliques'], cam: { az: 40 },
      A: { hip: [-0.02, 1.32], torso: 0, legs: { th: 4, sh: 2, footRel: 20 }, arms: { ik: [0.0, 2.22], gw: 0.44, straight: 1, palm: 'pro' } },
      B: { hip: [0.15, 1.27], torso: -40, head: 14, legs: { th: 183, sh: 183, footRel: 20 }, arms: { ik: [0.0, 2.22], gw: 0.44, straight: 1, palm: 'pro' } } });

    // De rodillas (crunch en polea y rueda): la rodilla apoyada y el muslo inclinado "a" grados hacia delante
    function kneel(kx, a, torso, arms, head) { return { hip: [kx + TH * Math.sin(rad(a)), 0.1 + TH * Math.cos(rad(a))], torso: torso, head: head || 0, legs: { th: -a, sh: -90, fw: 0.12, foot: 90 }, arms: arms }; }
    // Crunch en polea: de rodillas frente a la polea alta, cuerda junto a la cabeza; la cadera quieta y la columna se flexiona (codos hacia los muslos)
    var TR = { temple: 1, pole: [1, -0.5, 0.35], palm: [0, 0, -1] };
    variant('cableCrunch', 'crunch', { p: ['abs'], s: ['obliques'], load: 'facePull', rope: true, stack: true, scene: ['towerFront'], machinePos: null, anchor: [0.72, 2.12, 0], cam: { az: 20, y: 0.6 },
      A: kneel(-0.38, 4, 22, TR, 6), B: kneel(-0.38, 10, 78, TR, 22) });
    // Rueda abdominal: de rodillas, la rueda rueda hacia delante hasta estirar el cuerpo y vuelve; abdomen firme
    (function () {
      var a1 = { ik: [0.14, 0.1], gw: 0.125, straight: 1, palm: 'pro' }, a2 = { ik: [0.86, 0.1], gw: 0.125, straight: 1, palm: 'pro' };
      variant('abWheel', 'crunch', { p: ['abs'], s: ['lats', 'obliques', 'hipFlex', 'deltsF'], load: 'abWheel', stack: false, machinePos: null, scene: ['mat'], cam: { az: 25, y: 0.35 },
        A: kneel(-0.45, 14, 66, a1, -14), B: kneel(-0.45, 60, 81, a2, -6) });
    })();
    // Crunch en máquina: sentado, asas junto a los hombros y almohadilla en el pecho; flexiona el tronco hacia los muslos
    (function () {
      var ar = { relC: [0.17, 0.08], gw: 0.21, palm: 'neu', pole: [0.3, -1, 0.6] }, lg = { ik: [0.42, ANK], fw: 0.14 };
      variant('machineCrunch', 'crunch', { p: ['abs'], s: ['obliques'], load: 'none', stack: true, scene: ['seatBack'], machinePos: [-0.7, -0.6, 0], frontPad: [0.41, 0.205], cam: { az: 55, y: 0.75 },
        A: { hip: [-0.08, 0.56], torso: -4, head: 0, legs: lg, arms: ar }, B: { hip: [-0.08, 0.56], torso: 36, head: 10, legs: lg, arms: ar } });
    })();

    // Plancha lateral: apoyo en el antebrazo derecho con el codo bajo el hombro y el cuerpo recto (todo el cuerpo girado de lado)
    (function () {
      function sp(th, dy) {
        var c = Math.cos(rad(th)), s = Math.sin(rad(th));
        return { hip: [0, 0.97], torso: 0, roll: [th, 0, dy, 0, -90], legs: { ik: [0, ANK], fw: 0.07 },
          armsR: { rel: [FA * 0.98, -c * UA * 0.98, s * UA * 0.98], pole: [0, -c, s], palm: [0, 0, 1] }, armsL: { ua: 6, fa: 6, plane: 'f', palm: 'neu' } };
      }
      variant('sidePlank', 'plank', { side: 'R', p: ['obliques'], s: ['abs', 'gluteMed', 'deltsS'], scene: [], cam: { az: 15, el: 12, y: 0.32 }, A: sp(75, 0.09), B: sp(75.8, 0.088) });
    })();
    // Plancha con peso: un disco sobre la parte alta de la espalda
    variant('plankWeighted', 'plank', { backPlate: [0.3, 0.014], cam: { y: 0.3, az: 10, el: 6 } });
    // Escaladores: plancha alta con los brazos estirados; las rodillas van al pecho alternando rápido
    (function () {
      var arms = P.pushup.A.arms, back = { ik: [-0.92, 0.207], fw: 0.1, foot: 65, pole: [0.6, -1, 0] }, fr = { ik: [-0.2, 0.17], fw: 0.1, foot: 40, pole: [1, 0.12, 0] };
      var r = { hip: [-0.08, 0.44], torso: 70, legsL: back, legsR: fr, arms: arms }, l = { hip: [-0.08, 0.44], torso: 70, legsL: fr, legsR: back, arms: arms };
      // el cambio de piernas es un pequeño salto: los dos pies despegan al cruzarse
      var sw = { ik: [-0.5, 0.36], fw: 0.1, foot: 50, pole: [1, -0.05, 0] }, m = { hip: [-0.08, 0.44], torso: 70, legsL: sw, legsR: sw, arms: arms };
      variant('mountainClimber', 'pushup', { p: ['abs', 'hipFlex'], s: ['deltsF', 'quads', 'obliques'], A: null, B: null, period: 900, thumb: 0.0,
        keys: [[0, r], [0.25, m], [0.5, l], [0.75, m], [1, r]] });
    })();
  })();
  cam2('sidePlank', 172, 16);
  cam2('machineCrunch', 92, 12);
  // Levantamiento turco: de tumbado a de pie con la pesa rusa siempre vertical sobre el hombro derecho, y vuelta
  (function () {
    var KB = { ua: 180, fa: 180, palm: 'pro' };
    function lh(x, y, z, st, dir) { return { ik: [x, y, z], hand: 'flat', flatDir: dir || [-0.8, 0, 0.6], pole: [0, -1, 0.3], straight: st ? 1 : 0, palm: 'neu' }; }
    function tg(hip, tor, tw, lL, lR, aL, head) { return { hip: hip, torso: tor, twist: tw, head: head || 0, legsL: lL, legsR: lR, armsL: aL, armsR: KB }; }
    var RB = { ik: [0.42, ANK, 0.14], fw: 0.14, foot: 0 };
    var P1 = tg([0, 0.145], -90, 0, { ik: [0.84, ANK, 0.36], fw: 0.14, foot: -88 }, RB, lh(-0.28, 0.06, 0.46, 1, [0.5, 0, 1]));
    var P2 = tg([0, 0.145], -58, 22, { ik: [0.84, ANK, 0.36], fw: 0.14, foot: -88 }, RB, Object.assign(lh(-0.24, 0.06, 0.42, 0, [0.4, 0, 1]), { pole: [-0.4, -0.15, 1] }), 8);
    var P3 = tg([0, 0.145], -32, 28, { ik: [0.84, ANK, 0.36], fw: 0.14, foot: -88 }, RB, lh(-0.32, 0.06, 0.4, 1), 8);
    var P4 = tg([0.08, 0.45], -72, 26, { ik: [0.84, ANK, 0.36], fw: 0.14, foot: -70 }, RB, lh(-0.36, 0.06, 0.4, 1), 10);
    var P4b = tg([0.0, 0.43], -70, 22, { ik: [0.02, 0.13, 0.24], fw: 0.14, foot: 20, pole: [0.4, 0.3, 1] }, RB, lh(-0.4, 0.06, 0.4, 1), 10);
    var P6 = tg([-0.1, 0.55], 0, 0, { ik: [-0.52, 0.11, 0.13], fw: 0.14, foot: 90, pole: [0.2, -1, 0] }, RB, lh(-0.1, 0.6, 0.28, 0));
    var P6b = tg([0.14, 0.84], 6, 0, { ik: [-0.42, ANK + 0.04, 0.13], fw: 0.14, foot: 45, pole: [0.2, -1, 0] }, RB, lh(0.15, 0.74, 0.25, 0));
    var P7 = tg([0.4, 0.97], 0, 0, { ik: [0.42, ANK, 0.13], fw: 0.14, foot: 0 }, { ik: [0.42, ANK, 0.13], fw: 0.14, foot: 0 }, lh(0.42, 0.87, 0.24, 0));
    variant('turkishGetUp', 'swing', { load: 'kb', kbHand: ['R', 'rack'], scene: ['mat'], p: ['deltsF', 'abs', 'glutes'], s: ['obliques', 'deltsS', 'triceps', 'quads'], A: null, B: null, thumb: 0.32, period: 9000, cam: { az: 25, y: 0.6 },
      keys: [[0, P1], [0.06, P1], [0.14, P2], [0.22, P3], [0.3, P4], [0.37, P4b], [0.45, P6], [0.52, P6b], [0.58, P7], [0.64, P7], [0.7, P6b], [0.76, P6], [0.83, P4b], [0.88, P4], [0.93, P3], [0.97, P2], [1, P1]] });
  })();
