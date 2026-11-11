
  // ---------------- Pecho ----------------
  // ayuda: posición de los hombros para una postura (para colocar agarres relativos)
  function shoAt(f) { return solve(Object.assign({}, f, { arms: { ua: 0, fa: 0 } })).shoC; }
  // cuerpo recto de los tobillos a los hombros (flexiones): devuelve cadera e inclinación del tronco
  function lineBody(ank, sho) {
    var a = V(ank[0], ank[1], 0), s0 = V(sho[0], sho[1], 0), L = TH + SH, t = L / (L + SPINE);
    var hip = a.clone().lerp(s0, t), up = s0.clone().sub(hip).normalize();
    return { hip: [hip.x, hip.y], torso: Math.atan2(up.x, up.y) * 180 / Math.PI };
  }
  // Declinado: cabeza más baja que la cadera, piernas sujetas; la barra baja a la parte baja del pecho
  (function () {
    var base = { hip: [0.08, 0.66], torso: -108, legs: { ik: [0.42, 0.42], fw: 0.14, pole: [0.2, 1, 0.1], foot: 20 } };
    var sc0 = shoAt(base);
    variant('decline', 'bench', { scene: ['declineBench'], smith: false, cam: { y: 0.6, az: 40 },
      A: Object.assign({}, base, { arms: { ik: [sc0.x + 0.05, sc0.y + 0.46], gw: 0.42, palm: 'pro' } }),
      B: Object.assign({}, base, { arms: { ik: [sc0.x + 0.13, sc0.y + 0.17], gw: 0.42, palm: 'pro' } }) });
  })();
  // Press de suelo: tumbado en el suelo, rodillas flexionadas; los codos tocan el suelo abajo
  (function () {
    var base = { hip: [0.1, 0.13], torso: -90, legs: { ik: [0.45, ANK], fw: 0.18 } };
    var sc0 = shoAt(base);
    variant('floorPress', 'bench', { scene: ['mat'], smith: false, cam: { y: 0.35, az: 40 },
      A: Object.assign({}, base, { arms: { ik: [sc0.x + 0.01, sc0.y + 0.46], gw: 0.4, palm: 'pro' } }),
      B: Object.assign({}, base, { arms: { ik: [sc0.x + 0.07, sc0.y + 0.22], gw: 0.4, palm: 'pro', pole: [0.3, -1, 0.6] } }) });
  })();
  // Aperturas inclinadas: banco inclinado; principal el pectoral superior
  variant('flyIncline', 'fly', { p: ['pecsU'], s: ['pecs', 'deltsF'], scene: ['inclineBench'], cam: { az: 50, y: 0.85 },
    A: { hip: [0.05, 0.56], torso: -50, legs: { ik: [0.52, ANK], fw: 0.22 }, arms: { relC: [0.46, 0.0], gw: 0.12, pole: [0.4, -0.6, 0.5], palm: [0, 0, -1] } },
    B: { hip: [0.05, 0.56], torso: -50, legs: { ik: [0.52, ANK], fw: 0.22 }, arms: { relC: [0.15, 0.0], gw: 0.54, pole: [0.4, -0.6, 0.5], palm: [0.4, 0.8, -0.3] } } });
  // Cruce de abajo arriba: poleas bajas; las manos suben de la cadera a la altura del pecho (pectoral superior)
  variant('cableFlyLow', 'cableFly', { p: ['pecsU'], s: ['pecs', 'deltsF'], pulleyY: 0.22,
    A: { hip: [0, 0.97], torso: 6, arms: { ik: [0.16, 0.95, 0.44], pole: [-0.5, -0.6, 0.6], palm: [0.3, 0.6, -0.7] } },
    B: { hip: [0, 0.97], torso: 6, arms: { ik: [0.45, 1.3, 0.08], pole: [-0.5, -0.6, 0.6], palm: [0, 0.4, -1] } } });
  // Cruce de arriba abajo: poleas altas; las manos bajan hasta delante de la cadera (pectoral inferior)
  variant('cableFlyHigh', 'cableFly', { p: ['pecs'], s: ['pecsU', 'deltsF'],
    A: { hip: [0, 0.96], torso: 18, arms: { ik: [0.04, 1.6, 0.62], pole: [-1, 0.35, 0.55], palm: [0.4, -0.2, -1] } },
    B: { hip: [0, 0.96], torso: 18, arms: { ik: [0.4, 0.94, 0.08], pole: [-0.6, 0.1, 0.9], palm: [0, 0, -1] } } });
  // Pec deck: sentado, antebrazos verticales en las almohadillas, brazos paralelos al suelo; se juntan delante
  variant('pecDeck', 'cableFly', { load: 'grips', stack: true, scene: ['seatBack'], machinePos: [-0.75, -0.55, 0], twinPos: null, cam: { az: 50, y: 0.85 },
    A: { hip: [-0.08, 0.52], torso: -4, legs: { ik: [0.4, ANK], fw: 0.16 }, legsL: null, legsR: null, arms: { relC: [0.08, 0.3], gw: 0.48, pole: [0, -0.2, 1], palm: 'neu' } },
    B: { hip: [-0.08, 0.52], torso: -4, legs: { ik: [0.4, ANK], fw: 0.16 }, legsL: null, legsR: null, arms: { relC: [0.33, 0.3], gw: 0.11, pole: [0, -0.2, 1], palm: 'neu' } } });
  // Press inclinado en máquina: los agarres suben y hacia delante (pectoral superior)
  variant('chestPressIncline', 'chestPress', { p: ['pecsU'], s: ['pecs', 'deltsF', 'triceps'],
    A: { arms: { ik: [0.03, 0.96], gw: 0.27, pole: [-1, -0.5, 0.45], palm: [0, 0, -1] } },
    B: { arms: { ik: [0.25, 1.1], gw: 0.24, pole: [-1, -0.5, 0.45], palm: [0, 0, -1] } } });
  // Pallof press: de lado a la polea, las manos salen del pecho hacia delante sin girar el tronco (antirrotación)
  variant('pallof', 'chestPress', { p: ['obliques', 'abs'], s: ['deltsF', 'glutes'], load: 'cableR', stack: true, scene: [], towerPos: [0.05, -0.95], anchor: [0.05, 1.22, -0.87], machinePos: null, cam: { az: 70 },
    A: { hip: [0, 0.93], torso: 0, legs: { ik: [0.0, ANK], fw: 0.2 }, arms: { relC: [0.12, -0.12], gw: 0.03, palm: 'neu', pole: [-1, -0.6, 0.3] } },
    B: { hip: [0, 0.93], torso: 0, legs: { ik: [0.0, ANK], fw: 0.2 }, arms: { relC: [0.45, -0.12], gw: 0.03, palm: 'neu', pole: [-1, -0.6, 0.3] } } });
  // Flexiones inclinadas (manos en un banco) y declinadas (pies en un banco)
  (function () {
    var inA = lineBody([-0.85, ANK], [0.25, 0.92]), inB = lineBody([-0.85, ANK], [0.34, 0.65]);
    variant('pushupIncline', 'pushup', { scene: ['handBench'], cam: { y: 0.55, az: 30 },
      A: { hip: inA.hip, torso: inA.torso, arms: { ik: [0.33, 0.5], gw: 0.29, pole: [-1, 0.3, 0.45], hand: 'flat', flatDir: [1, 0, 0.15] } },
      B: { hip: inB.hip, torso: inB.torso, arms: { ik: [0.33, 0.5], gw: 0.29, pole: [-1, 0.3, 0.45], hand: 'flat', flatDir: [1, 0, 0.15] } } });
    var deA = lineBody([-0.95, 0.56], [0.3, 0.52]), deB = lineBody([-0.95, 0.56], [0.36, 0.28]);
    variant('pushupDecline', 'pushup', { p: ['pecsU'], s: ['pecs', 'deltsF', 'triceps'], scene: ['footBench'], cam: { y: 0.45, az: 30 },
      A: { hip: deA.hip, torso: deA.torso, legs: { ik: [-0.95, 0.56], fw: 0.1, foot: 70, pole: [0, -1, 0] } },
      B: { hip: deB.hip, torso: deB.torso, legs: { ik: [-0.95, 0.56], fw: 0.1, foot: 70, pole: [0, -1, 0] } } });
  })();

  // ---------------- Hombros ----------------
  var OHP_LO = [0.135, 0.05], OHP_HI = [0.035, 0.51];
  // Press militar sentado (barra o mancuernas): sentado con respaldo
  variant('ohpSeated', 'ohp', { scene: ['seatBack'], cam: { az: 32, y: 0.95 },
    A: { hip: [-0.06, 0.52], torso: -4, legs: { ik: [0.38, ANK], fw: 0.2 }, arms: { relC: OHP_LO, gw: 0.27, pole: [0.4, -1, 0.5], palm: 'pro' } },
    B: { hip: [-0.06, 0.52], torso: -4, legs: { ik: [0.38, ANK], fw: 0.2 }, arms: { relC: OHP_HI, gw: 0.27, pole: [0.4, -1, 0.5], palm: 'pro' } } });
  // Press de hombro en máquina: sentado, agarres que suben en vertical
  variant('ohpMachine', 'ohpSeated', { load: 'grips', machinePos: [-0.75, -0.55, 0] });
  // Press Arnold: empieza con las palmas hacia ti y los codos delante; los codos se abren mientras sube
  (function () {
    var b = { hip: STAND, torso: 0, legs: FEET };
    var st = Object.assign({}, b, { arms: { relC: [0.2, 0.02], gw: 0.13, palm: 'sup', pole: [1, -1, 0.2] } });
    var md = Object.assign({}, b, { arms: { relC: [0.1, 0.12], gw: 0.27, palm: 'pro', pole: [0.2, -1, 1] } });
    var tp = Object.assign({}, b, { arms: { relC: [0.035, 0.5], gw: 0.2, palm: 'pro', pole: [0.2, -1, 1] } });
    variant('arnoldPress', 'ohp', { load: 'hands', A: null, B: null, thumb: 0.5,
      keys: [[0, st], [0.12, st], [0.3, md], [0.46, tp], [0.56, tp], [0.72, md], [0.9, st], [1, st]] });
  })();
  // Push press: pequeña flexión de rodillas y empuje de piernas que impulsa la barra por encima de la cabeza
  (function () {
    var rack = { hip: STAND, torso: 0, legs: FEET, arms: { relC: [0.16, 0.05], gw: 0.27, pole: [0.4, -1, 0.5], palm: 'pro' } };
    var dip = Object.assign({}, rack, { hip: [-0.04, 0.89], torso: 2 });
    var drive = Object.assign({}, rack, { hip: [0, 0.98], arms: { relC: [0.17, 0.26], gw: 0.27, pole: [0.4, -1, 0.5], palm: 'pro' } });
    var top = Object.assign({}, rack, { arms: { relC: [0.035, 0.51], gw: 0.27, pole: [0.4, -1, 0.5], palm: 'pro' } });
    variant('pushPress', 'ohp', { A: null, B: null, bakeBar: true, s: ['deltsS', 'triceps', 'pecsU', 'quads', 'glutes'], thumb: 0.36,
      keys: [[0, rack], [0.1, rack], [0.24, dip], [0.32, drive], [0.44, top], [0.56, top], [0.8, rack], [1, rack]] });
  })();
  // Press landmine: con un brazo, la barra sale del hombro hacia arriba y delante en diagonal
  variant('landminePress', 'ohp', { side: 'R', load: 'landmine', stack: false, cam: { az: 55 },
    A: { hip: [-0.02, 0.95], torso: 12, legsL: { ik: [0.22, ANK] }, legsR: { ik: [-0.24, ANK] }, legs: null, armsR: { relC: [0.2, -0.03], gw: 0.13, pole: [0.2, -1, 0.4], palm: 'neu' }, armsL: RELAX, arms: null },
    B: { hip: [-0.02, 0.95], torso: 12, legsL: { ik: [0.22, ANK] }, legsR: { ik: [-0.24, ANK] }, legs: null, armsR: { relC: [0.44, 0.3], gw: 0.06, pole: [0.2, -1, 0.4], palm: 'neu' }, armsL: RELAX, arms: null } });
  // Pájaros con mancuernas: tronco casi horizontal; los brazos se abren a los lados con el codo algo flexionado
  variant('reverseFlyDb', 'lateralRaise', { p: ['deltsR'], s: ['deltsS', 'traps'], cam: { az: 25 },
    A: { hip: [-0.2, 0.86], torso: 72, head: -24, legs: { ik: [0.0, ANK], fw: 0.15 }, arms: { ua: 6, fa: 14, plane: 'f', palm: 'neu' } },
    B: { hip: [-0.2, 0.86], torso: 72, head: -24, legs: { ik: [0.0, ANK], fw: 0.15 }, arms: { ua: 78, fa: 92, plane: 'f', palm: [0, -1, 0] } } });
  // Pájaros en máquina (pec deck inverso): pecho contra el cojín; los agarres van atrás hasta detrás de la espalda
  variant('reverseFlyMachine', 'lateralRaise', { p: ['deltsR'], s: ['deltsS', 'traps'], load: 'grips', stack: true, scene: ['chestPad'], machinePos: [0.7, -0.55, 0], cam: { az: -40, y: 1.0 },
    A: { hip: [-0.05, 0.52], torso: 8, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { relC: [0.44, 0.0], gw: 0.08, pole: [0, 0.5, 1], palm: 'neu' } },
    B: { hip: [-0.05, 0.52], torso: 8, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { relC: [0.02, 0.0], gw: 0.72, pole: [0, 0.5, 1], palm: 'neu' } } });
  // Pájaros en polea: de frente a dos poleas a la altura del hombro; los cables se cruzan
  variant('reverseFlyCable', 'cableFly', { p: ['deltsR'], s: ['deltsS', 'traps'], twinPos: [[0.95, 0.25], [0.95, -0.25]], pulleyY: 1.42, cam: { az: -45 },
    A: { hip: [0, 0.97], torso: 0, legsL: { ik: [0.12, ANK] }, legsR: { ik: [-0.14, ANK] }, arms: { relC: [0.42, -0.02], gw: -0.06, pole: [0, 0.5, 1], palm: 'neu' } },
    B: { hip: [0, 0.97], torso: 0, legsL: { ik: [0.12, ANK] }, legsR: { ik: [-0.14, ANK] }, arms: { relC: [0.03, 0.0], gw: 0.72, pole: [0, 0.5, 1], palm: 'neu' } } });
  // Elevaciones en Y: los brazos suben en diagonal (en Y) por encima de la cabeza; trapecio inferior y deltoides
  variant('yRaise', 'lateralRaise', { p: ['traps', 'deltsS'], s: ['deltsF'],
    A: { hip: STAND, torso: 8, legs: FEET, arms: { relC: [0.14, -0.52], gw: 0.2, palm: 'neu' } },
    B: { hip: STAND, torso: 8, legs: FEET, arms: { relC: [0.26, 0.47], gw: 0.44, palm: 'neu', straight: 1 } } });
  // Elevaciones laterales en máquina: sentado, codos flexionados contra las almohadillas, suben hasta la horizontal
  variant('lateralRaiseMachine', 'lateralRaise', { load: 'none', stack: true, scene: ['stool'], machinePos: [0.75, -0.55, 0], cam: { az: 50, y: 0.9 },
    A: { hip: [-0.05, 0.52], torso: 6, legs: { ik: [0.36, ANK], fw: 0.15 }, arms: { relC: [0.2, -0.33], gw: 0.22, pole: [-0.2, -0.3, 1], palm: 'neu' } },
    B: { hip: [-0.05, 0.52], torso: 6, legs: { ik: [0.36, ANK], fw: 0.15 }, arms: { relC: [0.2, -0.02], gw: 0.54, pole: [-0.2, -0.3, 1], palm: 'neu' } } });
  // Elevación lateral en polea: un brazo; la polea baja queda del lado contrario y el cable cruza por delante
  variant('lateralRaiseCable', 'lateralRaise', { side: 'R', load: 'cableR', towerPos: [0.3, -0.85], anchor: [0.3, 0.16, -0.78],
    A: { hip: STAND, torso: 0, legs: FEET, armsR: { ua: 8, fa: 14, plane: 'f', palm: 'neu' }, armsL: { rel: [0.05, -0.3, -0.02], palm: 'neu' }, arms: null },
    B: { hip: STAND, torso: 0, legs: FEET, armsR: { ua: 84, fa: 92, plane: 'f', palm: [0, -1, 0] }, armsL: { rel: [0.05, -0.3, -0.02], palm: 'neu' }, arms: null } });
  // Leñador en polea: de arriba a abajo en diagonal con giro del tronco; oblicuos
  (function () {
    var hi = { hip: [0, 0.95], torso: 0, twist: -45, legs: { ik: [0.0, ANK], fw: 0.22 }, arms: { relC: [0.42, 0.32], gw: 0.03, palm: 'neu', straight: 0.9 } };
    var lo = { hip: [0, 0.88], torso: 12, twist: 45, legs: { ik: [0.0, ANK], fw: 0.22 }, arms: { relC: [0.4, -0.45], gw: 0.03, palm: 'neu', straight: 0.9 } };
    variant('woodchop', 'lateralRaise', { p: ['obliques'], s: ['abs', 'deltsF'], load: 'cableR', stack: true, towerPos: [0.1, 0.95], anchor: [0.1, 2.05, 0.88], A: null, B: null,
      keys: [[0, hi], [0.12, hi], [0.42, lo], [0.55, lo], [0.88, hi], [1, hi]], cam: { az: 40 } });
  })();

  cam2('pecDeck', 92, 12); cam2('chestPressIncline', 95, 12); cam2('ohpMachine', 92, 10); cam2('lateralRaiseMachine', 100, 12); cam2('reverseFlyMachine', -120, 14);
