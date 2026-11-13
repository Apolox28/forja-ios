  // ================= Lote 9 (Hevy): brazos y fondos =================
  (function () {
    var ST = { hip: STAND, torso: 0, legs: { ik: [0, ANK], fw: 0.14 } }, HANGR = { rel: [0.03, HANG, 0.06], palm: 'neu' };
    function st(o) { return Object.assign({}, ST, o); }
    var dn = { ua: 2, fa: 4, palm: 'sup' }, up = { ua: 10, fa: 150, palm: 'sup' };
    // Curl a una mano con mancuerna: solo el brazo derecho; el izquierdo relajado
    variant('curlOne', 'curl', { side: 'R', load: 'handR', A: st({ armsR: dn, armsL: HANGR, arms: null }), B: st({ armsR: up, armsL: HANGR, arms: null }) });
    // Curl alto en polea: entre dos poleas a la altura de los hombros, brazos en cruz; los antebrazos se doblan hacia las orejas
    variant('cableCurlHigh', 'cableFly', { p: ['biceps'], s: ['brachiorad', 'deltsS'], pulleyY: 1.48, cam: { az: 70 },
      A: st({ legsL: null, legsR: null, arms: { ua: 86, fa: 92, plane: 'f', palm: [0, 1, 0] } }), B: st({ legsL: null, legsR: null, arms: { ua: 86, fa: 205, plane: 'f', palm: [0, 1, 0] } }) });
    // Curl arrastrado: la barra sube pegada al cuerpo y los codos van hacia atrás
    variant('curlDrag', 'curl', { s: ['brachiorad', 'deltsR'], A: st({ arms: { ik: [0.06, 0.82], gw: 0.21, palm: 'sup', pole: [-1, -0.6, 0.3] } }), B: st({ arms: { ik: [0.13, 1.18], gw: 0.21, palm: 'sup', pole: [-1, -0.6, 0.3] } }) });
    // Curl camarero: una mancuerna en vertical sujeta con las dos palmas bajo el disco de arriba
    var hp = function (fw, upv, gw, palm) { return { relC: [fw, upv], gw: gw, palm: palm, pole: [0, -1, 0.25] }; };
    variant('curlWaiter', 'curl', { load: 'goblet', A: st({ arms: hp(0.2, -0.45, 0.035, 'sup') }), B: st({ arms: hp(0.3, -0.06, 0.035, 'sup') }) });
    // Curl con disco: agarrado por los lados a las 3 y a las 9
    variant('curlPlate', 'curl', { load: 'plate', plateAtHands: 'grip', A: st({ arms: hp(0.22, -0.44, 0.16, 'neu') }), B: st({ arms: hp(0.32, -0.04, 0.16, 'neu') }) });
    // Curl con kettlebell: las dos manos en el asa
    variant('curlKb', 'curl', { load: 'kb', A: st({ arms: hp(0.12, -0.5, 0.05, 'sup') }), B: st({ arms: hp(0.3, -0.06, 0.05, 'sup') }) });
    // Concentrado con agarre inverso (prono): braquiorradial
    variant('concentrationCurlRev', 'concentrationCurl', { p: ['brachiorad'], s: ['biceps', 'forearmExt'] });
    eachArm('concentrationCurlRev', function (a, f, n) { if (n === 'armsR') a.palm = 'pro'; return a; });
    // Curl cruzado (martillo): cada mancuerna sube cruzando hacia el hombro contrario, alternando
    (function () {
      var hang = { ik: [0.04, 0.89, 0.23], palm: 'neu', pole: [0, -1, 0.3] }, x = { ik: [0.24, 1.2, -0.02], palm: 'neu', pole: [0.3, -1, 0.3] };
      var R0 = st({ armsR: hang, armsL: hang }), R1 = st({ armsR: x, armsL: hang }), L1 = st({ armsR: hang, armsL: x });
      variant('curlCross', 'curl', { p: ['brachiorad', 'biceps'], s: ['forearms'], A: null, B: null, period: 4000, keys: [[0, R0], [0.22, R1], [0.48, R0], [0.72, L1], [0.98, R0], [1, R0]] });
    })();
    // Curl de bíceps en TRX: de cara al anclaje, inclinado hacia atrás; al doblar los codos el cuerpo sube
    variant('trxCurl', 'curl', { load: 'none', stack: false, trx: [1.25, 2.35, 0], s: ['brachiorad', 'deltsR', 'abs'], cam: { az: 40 },
      A: { hip: [-0.26, 0.84], torso: -28, head: 8, legs: { ik: [0.14, ANK], fw: 0.12 }, arms: { relC: [0.52, 0.05], gw: 0.12, palm: 'sup', straight: 0.95, pole: [0, -1, 0.3] } },
      B: { hip: [-0.16, 0.91], torso: -14, head: 4, legs: { ik: [0.14, ANK], fw: 0.12 }, arms: { relC: [0.2, 0.27], gw: 0.14, palm: 'sup', pole: [0.4, -1, 0.3] } } });
    // Curl en polea a una mano: polea baja delante, solo el brazo derecho
    variant('curlCableOne', 'curl', { side: 'R', load: 'cableR', towerPos: [0.85, 0.12], anchor: [0.78, 0.14, 0.14], A: st({ armsR: dn, armsL: HANGR, arms: null }), B: st({ armsR: up, armsL: HANGR, arms: null }) });
    // Curl martillo con banda: la banda pisada con los dos pies
    variant('curlHammerBand', 'curlHammer', { load: 'none', stack: false, bands: [['footL', 'handL'], ['footR', 'handR']] });
    // Curl Zottman: sube con las palmas arriba, gira arriba a palmas abajo y baja así; gira de nuevo abajo
    variant('curlZottman', 'curl', { load: 'hands', p: ['biceps', 'brachiorad'], s: ['forearmExt'], A: null, B: null, period: 4200,
      keys: [[0, st({ arms: { ua: 2, fa: 4, palm: 'sup' } })], [0.38, st({ arms: { ua: 10, fa: 144, palm: 'sup' } })], [0.48, st({ arms: { ua: 10, fa: 144, palm: 'pro' } })], [0.9, st({ arms: { ua: 2, fa: 4, palm: 'pro' } })], [1, st({ arms: { ua: 2, fa: 4, palm: 'sup' } })]] });
    // Curl de muñeca por detrás con barra: la barra cuelga detrás de los glúteos; solo se mueven las muñecas
    variant('wristCurlBehind', 'curl', { p: ['forearmFlex'], s: ['forearms'], cam: { az: -130, el: 10 },
      A: st({ arms: { rel: [-0.07, HANG + 0.02, 0.0], palm: 'pro', wrist: 0 } }), B: st({ arms: { rel: [-0.07, HANG + 0.02, 0.0], palm: 'pro', wrist: 55 } }) });
    // Rodillo de muñecas: brazos estirados al frente; las muñecas giran alternando y la cuerda se enrolla
    variant('wristRoller', 'curl', { load: 'none', stack: false, wristRoller: true, p: ['forearmFlex', 'forearmExt'], s: ['deltsF'], A: null, B: null, period: 1400, cam: { az: 60 },
      keys: [[0, st({ armsR: { relC: [0.5, -0.05], gw: 0.2, palm: 'pro', straight: 0.95, wrist: 35 }, armsL: { relC: [0.5, -0.05], gw: 0.2, palm: 'pro', straight: 0.95, wrist: -30 } })],
        [0.5, st({ armsR: { relC: [0.5, -0.05], gw: 0.2, palm: 'pro', straight: 0.95, wrist: -30 }, armsL: { relC: [0.5, -0.05], gw: 0.2, palm: 'pro', straight: 0.95, wrist: 35 } })],
        [1, st({ armsR: { relC: [0.5, -0.05], gw: 0.2, palm: 'pro', straight: 0.95, wrist: 35 }, armsL: { relC: [0.5, -0.05], gw: 0.2, palm: 'pro', straight: 0.95, wrist: -30 } })]] });
    // ---- Tríceps por encima de la cabeza ----
    // Halo con kettlebell: la pesa, cogida por el asa boca abajo, rodea la cabeza
    (function () {
      function hh(x, y, z) { return st({ armsR: { ik: [x, y, z + 0.04], palm: [0, 0, -1], pole: [0, -1, 0.4] }, armsL: { ik: [x, y, -(z - 0.04)], palm: [0, 0, -1], pole: [0, -1, 0.4] } }); }
      var F0 = hh(0.24, 1.52, 0), R0 = hh(0.02, 1.63, 0.24), B0 = hh(-0.2, 1.6, 0), L0 = hh(0.02, 1.63, -0.24);
      variant('kbHalo', 'ohExt', { load: 'kb', p: ['deltsF', 'triceps'], s: ['deltsS', 'traps', 'abs'], A: null, B: null, period: 3600, cam: { az: 40 },
        keys: [[0, F0], [0.25, R0], [0.5, B0], [0.75, L0], [1, F0]] });
    })();
    // Extensión de tríceps en TRX: de espaldas al anclaje, inclinado hacia delante; las manos van a la frente y se extienden
    variant('trxTriceps', 'ohExt', { load: 'none', stack: false, trx: [-1.05, 2.35, 0], cam: { az: 40 },
      A: { hip: [-0.1, 0.93], torso: 24, head: -6, legs: { ik: [-0.3, ANK], fw: 0.12, foot: 15 }, arms: { relC: [0.5, 0.14], gw: 0.12, palm: 'pro', straight: 0.95 } },
      B: { hip: [-0.04, 0.87], torso: 33, head: -6, legs: { ik: [-0.3, ANK], fw: 0.12, foot: 25 }, arms: { relC: [0.19, 0.24], gw: 0.1, palm: 'pro', pole: [1, 0.8, 0.2] } } });
    // Press (extensión) de tríceps sentado con mancuerna
    variant('ohExtSeated', 'ohExt', { scene: ['stool'], stack: false, A: { hip: [-0.04, 0.52], legs: { ik: [0.36, ANK], fw: 0.16 } }, B: { hip: [-0.04, 0.52], legs: { ik: [0.36, ANK], fw: 0.16 } } });
    // ---- Fondos ----
    variant('dipTriceps', 'dip', { p: ['triceps'], s: ['pecs', 'deltsF'], A: { torso: 3 }, B: { hip: [-0.04, 1.16], torso: 5 } });
    variant('dipTricepsWeighted', 'dipTriceps', { beltPlate: true });
    variant('dipAssisted', 'dip', { kneePlatform: [0.55, 0.35], stack: true, machinePos: [0.8, -0.6, 0], A: { legs: { th: 2, sh: -86, fw: 0.1, foot: 75 } }, B: { legs: { th: 2, sh: -86, fw: 0.1, foot: 75 } } });
    variant('dipTricepsAssisted', 'dipAssisted', { p: ['triceps'], s: ['pecs', 'deltsF'], A: { torso: 3 }, B: { hip: [-0.04, 1.16], torso: 5 } });
    variant('dipRings', 'dip', { scene: [], rings: 2.7, s: ['triceps', 'deltsF', 'abs'] });
    // Fondos en el suelo: sentado con las manos detrás; la cadera sube un poco y los codos se doblan hacia atrás
    variant('floorDip', 'dip', { p: ['triceps'], s: ['deltsF'], scene: ['mat'], cam: { az: 45, y: 0.4 },
      A: { hip: [0.04, 0.24], torso: -16, legs: { ik: [0.5, ANK], fw: 0.13 }, arms: { ik: [-0.2, 0.092], gw: 0.22, hand: 'flat', flatDir: [1, 0, 0], pole: [-1, 0.2, 0.3], straight: 1 } },
      B: { hip: [0.06, 0.15], torso: -8, legs: { ik: [0.5, ANK], fw: 0.13 }, arms: { ik: [-0.2, 0.092], gw: 0.22, hand: 'flat', flatDir: [1, 0, 0], pole: [-1, 0.2, 0.3] } } });
  })();
  // Remo al mentón con mancuernas: las mancuernas suben por delante y algo separadas del cuerpo
  variant('uprightRowDb', 'uprightRow', { load: 'hands', A: { arms: { rel: [0.1, HANG, 0.0], pole: [-0.2, 0.6, 1.4], palm: 'pro' } }, B: { arms: { rel: [0.2, -0.08, 0.04], pole: [-0.5, 0.75, 1.5], palm: 'pro' } } });
