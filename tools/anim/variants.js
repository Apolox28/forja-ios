  // ---- Variantes de la biblioteca: cada ejercicio con su propio recorrido (técnica según ExRx) ----
  function cloneP(o) { return JSON.parse(JSON.stringify(o)); }
  function variant(k, base, ov) {
    var b = cloneP(P[base]);
    Object.keys(ov || {}).forEach(function (x) {
      if ((x === 'A' || x === 'B') && b[x] && ov[x]) Object.keys(ov[x]).forEach(function (y) { if (ov[x][y] === null) delete b[x][y]; else b[x][y] = ov[x][y]; });
      else if (ov[x] === null) delete b[x];
      else b[x] = ov[x];
    });
    P[k] = b; return b;
  }
  function eachArm(k, fn) { ['A', 'B'].forEach(function (f) { var a = P[k][f]; if (!a) return; ['arms', 'armsL', 'armsR'].forEach(function (n) { if (a[n]) a[n] = fn(cloneP(a[n]), f, n); }); }); }
  var RELAX = { rel: [0.02, HANG, 0.05], palm: 'neu' };
  // oblicuos como sinergistas (ExRx)
  P.crunch.s = ['obliques']; P.plank.s = (P.plank.s || []).concat(['obliques']);
  // polea baja delante para los curls con cable
  P.curl.towerPos = [0.85, 0]; P.curl.anchor = [0.78, 0.14, 0];

  // ---------------- Bíceps y antebrazo ----------------
  // Martillo: palmas enfrentadas todo el recorrido; trabaja sobre todo el braquiorradial
  variant('curlHammer', 'curl', { p: ['brachiorad'], s: ['biceps', 'forearms'] });
  eachArm('curlHammer', function (a) { a.palm = 'neu'; return a; });
  // Con cuerda en polea baja: agarre neutro (martillo) con la cuerda
  variant('curlRope', 'curlHammer', { rope: true });
  // Inverso: agarre prono; braquiorradial y extensores del antebrazo
  variant('curlReverse', 'curl', { p: ['brachiorad'], s: ['biceps', 'forearmExt'] });
  eachArm('curlReverse', function (a) { a.palm = 'pro'; return a; });
  // Alterno: un brazo sube mientras el otro espera abajo (con supinación)
  (function () {
    var dn = { ua: 2, fa: 4, palm: 'sup' }, up = { ua: 14, fa: 136, palm: 'sup' };
    var base = { hip: STAND, torso: 0, legs: FEET };
    function pose(r, l) { return Object.assign({}, base, { armsR: r, armsL: l }); }
    variant('curlAlt', 'curl', { A: null, B: null, keys: [[0, pose(dn, dn)], [0.22, pose(up, dn)], [0.44, pose(dn, dn)], [0.5, pose(dn, dn)], [0.72, pose(dn, up)], [0.94, pose(dn, dn)], [1, pose(dn, dn)]], thumb: 0.22 });
  })();
  // Inclinado: sentado en banco a 45-60°, brazos colgando por detrás del torso; supina al subir
  variant('curlIncline', 'curl', { scene: ['inclineBench'], s: ['brachiorad'], cam: { az: 70, y: 0.75 },
    A: { hip: [0.05, 0.56], torso: -50, legs: { ik: [0.52, ANK], fw: 0.22 }, arms: { rel: [-0.05, HANG + 0.01, 0.075], palm: 'neu', pole: [-1, -0.2, 0.4] } },
    B: { hip: [0.05, 0.56], torso: -50, legs: { ik: [0.52, ANK], fw: 0.22 }, arms: { rel: [0.1, -0.13, 0.07], palm: 'sup', pole: [-1, -0.6, 0.35] } } });
  // Araña: boca abajo sobre banco inclinado, brazos colgando en vertical; el codo no se mueve
  variant('curlSpider', 'curl', { scene: ['proneIncline'], s: ['brachiorad'], cam: { az: 60, y: 0.75 },
    A: { hip: [-0.1, 0.88], torso: 45, head: 10, legs: { ik: [-0.45, ANK], fw: 0.14 }, arms: { ua: 22, fa: 24, palm: 'sup' } },
    B: { hip: [-0.1, 0.88], torso: 45, head: 10, legs: { ik: [-0.45, ANK], fw: 0.14 }, arms: { ua: 22, fa: 135, palm: 'sup' } } });
  // Concentrado: sentado, codo apoyado en la cara interna del muslo; solo trabaja el brazo derecho
  variant('concentrationCurl', 'curl', { side: 'R', load: 'handR', scene: ['stool'], s: ['brachiorad'], cam: { az: 40, y: 0.7 },
    A: { hip: [-0.12, 0.52], torso: 32, legs: { ik: [0.3, ANK], fw: 0.24 }, armsR: { ua: 2, fa: 4, palm: 'sup', pole: [1, 0, -0.2] }, armsL: { rel: [0.26, -0.32, 0.06], hand: 'flat', flatDir: [1, -0.3, 0] }, arms: null },
    B: { hip: [-0.12, 0.52], torso: 32, legs: { ik: [0.3, ANK], fw: 0.24 }, armsR: { ua: 10, fa: 108, palm: 'sup', pole: [1, 0, -0.2] }, armsL: { rel: [0.26, -0.32, 0.06], hand: 'flat', flatDir: [1, -0.3, 0] }, arms: null } });
  // Bayesiano: polea baja detrás; el brazo empieza por detrás del cuerpo (bíceps estirado); un solo brazo
  variant('curlBayesian', 'curl', { side: 'R', load: 'cableR', towerPos: [-1.0, 0.24], anchor: [-0.92, 0.16, 0.24], s: ['brachiorad'], cam: { az: 50 },
    A: { hip: STAND, torso: 6, legsL: { ik: [0.16, ANK] }, legsR: { ik: [-0.14, ANK] }, legs: null, armsR: { ua: -22, fa: -18, palm: 'sup' }, armsL: RELAX, arms: null },
    B: { hip: STAND, torso: 6, legsL: { ik: [0.16, ANK] }, legsR: { ik: [-0.14, ANK] }, legs: null, armsR: { ua: -16, fa: 120, palm: 'sup' }, armsL: RELAX, arms: null } });
  // Curl de muñeca: antebrazos sobre los muslos, solo se mueve la muñeca (flexores)
  variant('wristCurl', 'curl', { p: ['forearmFlex'], s: [], scene: ['stool'], cam: { az: 55, y: 0.6, dist: 0.8 },
    A: { hip: [-0.12, 0.52], torso: 28, legs: { ik: [0.3, ANK], fw: 0.15 }, arms: { ik: [0.4, 0.55], gw: 0.11, palm: 'sup', pole: [0, -1, 0.3], wrist: -50 } },
    B: { hip: [-0.12, 0.52], torso: 28, legs: { ik: [0.3, ANK], fw: 0.15 }, arms: { ik: [0.4, 0.55], gw: 0.11, palm: 'sup', pole: [0, -1, 0.3], wrist: 45 } } });
  variant('wristCurlRev', 'wristCurl', { p: ['forearmExt'] });
  eachArm('wristCurlRev', function (a, f) { a.palm = 'pro'; a.wrist = f === 'A' ? 40 : -45; return a; });
  // Cuerdas de batalla: media sentadilla y ondas alternas con los brazos
  (function () {
    var base = { hip: [-0.06, 0.82], torso: 18, head: -14, legs: { ik: [0.04, ANK], fw: 0.2, toe: 12 } };
    function pose(r, l) { return Object.assign({}, base, { armsR: { relC: [0.42, -0.2 + r], gw: 0.12, palm: 'neu', pole: [0, -1, 0.5] }, armsL: { relC: [0.42, -0.2 + l], gw: 0.12, palm: 'neu', pole: [0, -1, 0.5] } }); }
    variant('battleRopes', 'curl', { load: 'battle', stack: false, p: ['deltsF', 'forearms'], s: ['biceps', 'abs', 'quads', 'glutes'], period: 700, A: null, B: null, cam: { az: 40 },
      keys: [[0, pose(0.14, -0.12)], [0.5, pose(-0.12, 0.14)], [1, pose(0.14, -0.12)]] });
  })();

  // ---------------- Tríceps ----------------
  // Cuerda: agarre neutro; abajo las manos se separan a los lados de los muslos
  variant('pushdownRope', 'pushdown', { rope: true,
    A: { arms: { relC: [0.22, -0.12], gw: 0.05, palm: 'neu', pole: [-1, -0.4, 0.35] } },
    B: { arms: { relC: [0.21, -0.53], gw: 0.17, palm: 'neu', pole: [-1, -0.4, 0.35] } } });
  // Agarre inverso (supino)
  variant('pushdownReverse', 'pushdown', {});
  eachArm('pushdownReverse', function (a) { a.palm = 'sup'; return a; });
  // A una mano (agarre supino según ExRx); solo el brazo derecho
  variant('pushdownOneArm', 'pushdown', { side: 'R', load: 'cableR', anchor: [0.72, 2.12, 0.17],
    A: { armsR: { ua: -6, fa: 105, palm: 'sup' }, armsL: { rel: [0.0, -0.3, 0.1], palm: 'neu' }, arms: null },
    B: { armsR: { ua: -3, fa: 16, palm: 'sup' }, armsL: { rel: [0.0, -0.3, 0.1], palm: 'neu' }, arms: null } });
  // Press de banca agarre cerrado: manos al ancho de hombros, codos pegados; principal el tríceps
  variant('benchClose', 'bench', { p: ['triceps'], s: ['pecs', 'pecsU', 'deltsF'] });
  eachArm('benchClose', function (a) { a.gw = 0.19; a.pole = [0.6, -0.4, 0.25]; return a; });
  // Press JM: agarre cerrado, la barra baja hacia la parte alta del pecho/barbilla con los codos hacia los pies
  variant('benchJM', 'benchClose', {});
  eachArm('benchJM', function (a, f) { if (f === 'B') a.ik = [-0.34, 0.78]; a.pole = [1, -0.1, 0.15]; return a; });
  // Flexiones diamante: manos juntas bajo el pecho; principal el tríceps
  variant('pushupDiamond', 'pushup', { p: ['triceps'], s: ['pecs', 'deltsF'] });
  eachArm('pushupDiamond', function (a) { a.gw = 0.07; a.flatDir = [1, 0, -0.45]; a.pole = [-1, 0.2, 0.25]; return a; });
  // Fondos en banco: manos en el borde del banco detrás de la cadera, piernas estiradas
  variant('benchDip', 'dip', { p: ['triceps'], s: ['deltsF', 'pecs'], scene: ['dipBench'], cam: { az: 45, y: 0.5 },
    A: { hip: [0.06, 0.5], torso: -2, legs: { ik: [0.78, ANK], fw: 0.12 }, arms: { ik: [-0.12, 0.47], gw: 0.22, hand: 'flat', flatDir: [1, 0, 0], pole: [-1, 0.2, 0.3] } },
    B: { hip: [0.08, 0.27], torso: 6, legs: { ik: [0.78, ANK], fw: 0.12 }, arms: { ik: [-0.12, 0.47], gw: 0.22, hand: 'flat', flatDir: [1, 0, 0], pole: [-1, 0.2, 0.3] } } });
  // Fondos en máquina: sentado, empuja los agarres hacia abajo junto a la cadera
  variant('dipMachine', 'dip', { p: ['triceps'], s: ['pecs', 'deltsF'], load: 'grips', stack: true, scene: ['stool'], cam: { az: 40, y: 0.8 },
    A: { hip: [-0.05, 0.52], torso: 6, legs: { ik: [0.36, ANK], fw: 0.15 }, arms: { rel: [-0.02, -0.26, 0.09], palm: 'neu', pole: [-1, 0.2, 0.3] } },
    B: { hip: [-0.05, 0.52], torso: 6, legs: { ik: [0.36, ANK], fw: 0.15 }, arms: { rel: [0.02, -0.52, 0.07], palm: 'neu', pole: [-1, 0.2, 0.3] } } });
  // segunda perspectiva de las variantes de brazo: de frente al músculo que trabaja
  cam2('concentrationCurl', 95, 14); cam2('wristCurl', 95, 26); cam2('wristCurlRev', 95, 26); cam2('curlSpider', 105, 8);
  cam2('curlIncline', 100, 14); cam2('curlBayesian', 95, 10);
  cam2('dipMachine', 92, 12);

  // lote variants_b2.js

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

  // lote variants_b3.js

  // ---------------- Espalda ----------------
  // ayuda: convierte un agarre relativo al tronco en coordenadas del mundo (para interpolar sin saltos)
  function relIk(pose, rc, gw) { var j0 = solve(Object.assign({}, pose, { arms: { ua: 0, fa: 0 } })); var p = j0.shoC.clone().add(j0.fwd.clone().multiplyScalar(rc[0])).add(j0.up.clone().multiplyScalar(rc[1])); return [p.x, p.y]; }
  // Remo con barra agarre supino: palmas hacia arriba, agarre al ancho de hombros
  variant('rowUnder', 'row', { s: ['biceps', 'deltsR', 'lowback'] });
  eachArm('rowUnder', function (a) { a.palm = 'sup'; a.gw = 0.22; return a; });
  // Remo Pendlay: tronco paralelo al suelo; la barra sale del suelo en cada repetición hasta la parte baja del pecho
  (function () {
    var b = { hip: [-0.3, 0.74], torso: 85, head: -30, legs: { ik: [-0.16, ANK], fw: 0.15 } };
    var fl = Object.assign({}, b, { arms: { ik: relIk(b, [0.52, -0.03]), gw: 0.27, pole: [-1, 0.5, 0.4], palm: 'pro' } });
    var ch = Object.assign({}, b, { arms: { ik: relIk(b, [0.1, -0.03]), gw: 0.27, pole: [-1, 0.5, 0.4], palm: 'pro' } });
    var md = Object.assign({}, b, { arms: { ik: [0.17, 0.46], gw: 0.27, pole: [-1, 0.5, 0.4], palm: 'pro' } });
    variant('pendlayRow', 'row', { A: null, B: null, bakeBar: true, cam: { az: 25 },
      // la barra rodea las rodillas por delante en un ligero arco (las rodillas no se mueven)
      keys: [[0, fl], [0.12, fl], [0.22, md], [0.32, ch], [0.42, ch], [0.62, md], [0.76, fl], [1, fl]] });
  })();
  // Remo en T: la barra (anclada detrás) pasa entre las piernas; agarre en V cerrado
  variant('tBarRow', 'row', { load: 'landmine', minePivot: [-1.6, 0.07, 0], mineBoth: true, mineOver: 0.2, minePlateR: 0.115, bakeBar: false, cam: { az: 30 },
    A: { hip: [-0.22, 0.76], torso: 62, head: -24, legs: { ik: [0.0, ANK], fw: 0.21 }, arms: { relC: [0.5, 0.0], gw: 0.05, palm: 'neu', pole: [-1, 0.6, 0.4] } },
    B: { hip: [-0.22, 0.76], torso: 62, head: -24, legs: { ik: [0.0, ANK], fw: 0.21 }, arms: { relC: [0.31, -0.05], gw: 0.05, palm: 'neu', pole: [-1, 0.6, 0.4] } } });
  // Remo Meadows: un brazo, la barra anclada en el suelo delante y a un lado; el codo sube alto y hacia atrás
  variant('meadowsRow', 'row', { side: 'R', load: 'landmine', minePivot: [0.55, 0.07, -1.4], cam: { az: 40 },
    A: { hip: [-0.15, 0.85], torso: 60, head: -20, legsL: { ik: [0.22, ANK] }, legsR: { ik: [-0.18, ANK, 0.16] }, legs: null, armsR: { relC: [0.5, 0.02], gw: 0.2, palm: 'pro', pole: [-1, 0.6, 0.5] }, armsL: { rel: [0.3, -0.38, 0.05], hand: 'flat', flatDir: [1, -0.4, 0] }, arms: null },
    B: { hip: [-0.15, 0.85], torso: 60, head: -20, legsL: { ik: [0.22, ANK] }, legsR: { ik: [-0.18, ANK, 0.16] }, legs: null, armsR: { relC: [0.26, -0.05], gw: 0.32, palm: 'pro', pole: [-1, 0.6, 0.5] }, armsL: { rel: [0.3, -0.38, 0.05], hand: 'flat', flatDir: [1, -0.4, 0] }, arms: null } });
  // Remo invertido: cuerpo recto bajo una barra fija; el pecho sube hasta la barra
  (function () {
    var lo = lineBody([1.0, ANK], [-0.04, 0.44]), hi = lineBody([1.0, ANK], [-0.02, 0.8]);
    var legs = { ik: [1.0, ANK], fw: 0.1, foot: -72 };
    var arms = { ik: [0.0, 0.97], gw: 0.3, palm: 'pro', pole: [0.2, -1, 0.5] };
    variant('invertedRow', 'row', { load: 'none', scene: ['lowBar'], cam: { az: 40, y: 0.55 },
      A: { hip: lo.hip, torso: lo.torso, head: 0, legs: legs, arms: arms }, B: { hip: hi.hip, torso: hi.torso, head: 0, legs: legs, arms: arms } });
  })();
  // Remo con pecho apoyado (banco inclinado boca abajo): los brazos cuelgan y los codos suben hacia atrás
  (function () {
    var b = { hip: [-0.1, 0.88], torso: 45, head: 10, legs: { ik: [-0.45, ANK], fw: 0.14 } };
    var s0 = shoAt(b), top = relIk(b, [0.08, -0.14]);
    variant('chestSupportedRow', 'row', { load: 'hands', scene: ['proneBench'], cam: { az: 55, y: 0.75 },
      A: Object.assign({}, b, { arms: { ik: [s0.x + 0.04, s0.y - REACH + 0.014, 0.22], palm: 'neu', pole: [-1, 0.6, 0.4] } }),
      B: Object.assign({}, b, { arms: { ik: [top[0], top[1], 0.34], palm: 'neu', pole: [-1, 0.6, 0.4] } }) });
  })();
  // Jalones: agarre estrecho neutro (V), supino y a una mano
  variant('pulldownClose', 'pulldown', { handleW: 0.2, s: ['biceps', 'brachiorad', 'deltsR', 'traps'] });
  eachArm('pulldownClose', function (a) { a.gw = 0.07; a.palm = 'neu'; return a; });
  variant('pulldownUnder', 'pulldown', { s: ['biceps', 'deltsR', 'traps'] });
  eachArm('pulldownUnder', function (a) { a.gw = 0.24; a.palm = 'sup'; return a; });
  variant('pulldownOneArm', 'pulldown', { side: 'R', load: 'cableR', towerPos: [0.68, 0], anchor: [0.2, 2.42, 0.18],
    A: { armsR: { relC: [0.12, 0.44], gw: 0.2, pole: [0, -1, 0.6], palm: 'neu' }, armsL: { rel: [0.2, -0.36, 0.0], hand: 'flat', flatDir: [1, -0.3, 0] }, arms: null },
    B: { armsR: { relC: [0.17, 0.02], gw: 0.21, pole: [0, -1, 0.6], palm: 'neu' }, armsL: { rel: [0.2, -0.36, 0.0], hand: 'flat', flatDir: [1, -0.3, 0] }, arms: null } });
  // Jalón con brazos rectos (y pullover en polea): brazos estirados de arriba a los muslos
  variant('straightArmPulldown', 'pushdown', { p: ['lats'], s: ['triceps', 'deltsR'], handleW: 0.6,
    A: { hip: [-0.08, 0.95], torso: 22, legs: FEET, arms: { relC: [0.42, 0.3], gw: 0.25, palm: 'pro', straight: 1 } },
    B: { hip: [-0.08, 0.95], torso: 22, legs: FEET, arms: { relC: [0.3, -0.45], gw: 0.22, palm: 'pro', straight: 1 } } });
  // Ski ergómetro: tirón doble desde arriba con flexión de cadera y rodillas
  (function () {
    var up = { hip: [0, 0.97], torso: -2, legs: { ik: [0.0, ANK], fw: 0.14 }, arms: { relC: [0.28, 0.36], gw: 0.17, palm: 'neu', straight: 0.9 } };
    var dn = { hip: [-0.18, 0.82], torso: 42, head: -12, legs: { ik: [0.0, ANK], fw: 0.14 }, arms: { relC: [0.13, -0.44], gw: 0.2, palm: 'neu' } };
    variant('skiErg', 'pushdown', { p: ['lats', 'triceps', 'abs'], s: ['deltsR', 'quads', 'glutes'], load: 'twinCable', twinPos: [[0.62, -0.16], [0.62, 0.16]], pulleyY: 2.05, stack: true, A: null, B: null, period: 1400, cam: { az: 40 },
      keys: [[0, up], [0.38, dn], [0.5, dn], [1, up]] });
  })();
  // Dominadas: agarre neutro, supinas (chin-up) y colgarse de la barra
  variant('pullupNeutral', 'pullup', { s: ['biceps', 'brachiorad', 'deltsR', 'traps'] });
  eachArm('pullupNeutral', function (a) { a.gw = 0.26; a.palm = 'neu'; return a; });
  variant('chinup', 'pullup', { s: ['biceps', 'deltsR', 'traps'] });
  eachArm('chinup', function (a) { a.gw = 0.2; a.palm = 'sup'; return a; });
  variant('deadHang', 'pullup', { p: ['forearms'], s: ['lats', 'deltsR'], B: { hip: [-0.03, 1.34], torso: 0, head: 0 } });
  // Remo sentado a una mano y remo en máquina con pecho apoyado
  variant('seatedRowOneArm', 'seatedRow', { side: 'R', load: 'cableR', anchor: [0.95, 0.8, 0.12],
    A: { armsR: { ik: [0.2, 0.8, 0.12], pole: [-1, -0.4, 0.8], palm: 'neu' }, armsL: { rel: [0.32, -0.3, 0.02], hand: 'flat', flatDir: [1, -0.3, 0] }, arms: null, twist: -10 },
    B: { armsR: { ik: [-0.22, 0.76, 0.2], pole: [-1, -0.4, 0.8], palm: 'neu' }, armsL: { rel: [0.32, -0.3, 0.02], hand: 'flat', flatDir: [1, -0.3, 0] }, arms: null, twist: 12 } });
  variant('seatedRowMachine', 'seatedRow', { load: 'grips', stack: true, scene: ['chestPad'], machinePos: [0.75, -0.55, 0], s: ['deltsR', 'biceps'], cam: { az: 40 },
    A: { hip: [-0.05, 0.52], torso: 6, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { relC: [0.46, -0.06], gw: 0.19, palm: 'neu', pole: [-1, -0.2, 0.6] } },
    B: { hip: [-0.05, 0.52], torso: 6, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { relC: [-0.04, -0.1], gw: 0.22, palm: 'neu', pole: [-1, -0.2, 0.6] } } });
  // ---------------- Bisagra de cadera ----------------
  // Sumo: piernas muy abiertas con las puntas hacia fuera, agarre por dentro de las rodillas, tronco más vertical
  (function () {
    var k = hingeKeys([[-0.22, 0.5, 55, 0.225], [-0.18, 0.62, 48, 0.39], [-0.12, 0.78, 35, 0.6], [-0.06, 0.9, 18, 0.76], [-0.02, 0.97, 3, 0.83]], 0.07);
    k.forEach(function (q) { q[1] = cloneP(q[1]); q[1].legs = { ik: [-0.04, ANK], fw: 0.34, toe: 32 }; q[1].arms.gw = 0.17; });
    variant('sumoDeadlift', 'deadlift', { p: ['glutes', 'quads', 'adductors'], s: ['hams', 'lowback', 'traps', 'forearms'], keys: k, thumb: 0.05 });
  })();
  // Rack pull: la barra arranca desde los pines a la altura de las rodillas
  variant('rackPull', 'deadlift', { scene: ['rackPins'], pinY: 0.456, p: ['glutes', 'lowback', 'traps'], s: ['hams', 'forearms'], thumb: 0.05,
    keys: hingeKeys([[-0.33, 0.84, 74, 0.45], [-0.3, 0.9, 63, 0.58], [-0.27, 0.98, 56, 0.7], [-0.11, 0.98, 27, 0.82], [-0.02, 0.97, 2, 0.83]], 0.082) });
  // Peso muerto piernas rígidas: rodillas casi estiradas, la barra baja hacia los pies
  variant('stiffLeg', 'rdl', { keys: hingeKeys([[-0.02, 0.97, 2, 0.83], [-0.13, 0.95, 35, 0.77], [-0.2, 0.94, 60, 0.645], [-0.25, 0.93, 80, 0.505]], 0.085) });
  // Barra hexagonal: manos a los costados con agarre neutro, más flexión de rodillas y tronco más vertical
  (function () {
    function pose(h, t) { var b = { hip: h, torso: t, head: -t * 0.3, legs: { ik: [-0.02, ANK], fw: 0.13 } }; var s0 = shoAt(b); return Object.assign(b, { arms: { ik: [s0.x, s0.y - REACH + 0.006], gw: 0.29, palm: 'neu', pole: [-1, 0.2, 0.6] } }); }
    var p0 = pose([-0.19, 0.5], 42), p1 = pose([-0.14, 0.68], 30), p2 = pose([-0.06, 0.88], 14), p3 = pose([0, 0.97], 1);
    variant('trapBarDeadlift', 'deadlift', { load: 'hexbar', p: ['quads', 'glutes'], s: ['hams', 'lowback', 'traps', 'forearms', 'adductors'], thumb: 0.05,
      keys: [[0, p0], [0.06, p0], [0.22, p1], [0.36, p2], [0.5, p3], [0.6, p3], [0.74, p2], [0.86, p1], [0.96, p0], [1, p0]] });
  })();
  // Cargada de potencia: tirón desde el suelo, extensión explosiva, recepción con la barra en los hombros
  (function () {
    var ft = { ik: [-0.04, ANK], fw: 0.13 };
    function hp(h, t, bar, extra) { return Object.assign({ hip: h, torso: t, head: -t * 0.3, legs: ft, arms: { ik: bar, gw: 0.25, palm: 'pro' } }, extra || {}); }
    var P0 = hp([-0.34, 0.63], 75, [0.082, 0.225]), P1 = hp([-0.33, 0.84], 74, [0.082, 0.45]), P2 = hp([-0.14, 0.95], 22, [0.05, 0.86]);
    var P3 = hp([0.0, 1.0], -4, [0.03, 0.91], { shr: 0.05 });
    var b4 = { hip: [-0.04, 0.94], torso: 4, legs: ft }, P4 = Object.assign({}, b4, { arms: { ik: relIk(b4, [0.14, -0.04]), gw: 0.27, palm: 'pro', pole: [0, 1, 0.8] } });
    var b5 = { hip: [-0.12, 0.84], torso: 10, head: 0, legs: ft }, P5 = Object.assign({}, b5, { arms: { ik: relIk(b5, [0.19, 0.06]), gw: 0.25, palm: 'pro', pole: [1, 0.5, 0.3] } });
    var b6 = { hip: STAND, torso: 2, legs: ft }, P6 = Object.assign({}, b6, { arms: { ik: relIk(b6, [0.19, 0.06]), gw: 0.25, palm: 'pro', pole: [1, 0.5, 0.3] } });
    variant('powerClean', 'deadlift', { p: ['glutes', 'quads', 'traps'], s: ['hams', 'deltsF', 'calves', 'lowback'], bakeBar: true, thumb: 0.5,
      keys: [[0, P0], [0.06, P0], [0.18, P1], [0.26, P2], [0.3, P3], [0.35, P4], [0.4, P5], [0.5, P6], [0.6, P6], [0.72, P2], [0.86, P1], [0.96, P0], [1, P0]] });
  })();
  // Peso muerto a una pierna: apoyo en la izquierda, la derecha se estira hacia atrás; mancuerna en la mano derecha
  variant('singleLegRdl', 'rdl', { side: 'L', load: 'handR', p: ['glutes', 'hams'], s: ['adductors', 'lowback'], keys: null, cam: { az: 25 },
    A: { hip: [0, 0.97], torso: 2, legsL: { ik: [0.0, ANK], fw: 0.1 }, legsR: { th: -3, sh: -7, fw: 0.1, foot: 10 }, armsR: { rel: [0.04, HANG, 0.03], palm: 'pro' }, armsL: { rel: [0.02, HANG, 0.05], palm: 'neu' } },
    B: { hip: [-0.1, 0.9], torso: 78, head: -25, legsL: { ik: [0.0, ANK], fw: 0.1 }, legsR: { th: -78, sh: -82, fw: 0.1, foot: 80 }, armsR: { rel: [0.03, HANG, 0.03], palm: 'pro' }, armsL: { rel: [0.02, HANG, 0.05], palm: 'neu' } } });
  // Hiperextensiones con disco abrazado al pecho
  variant('hyperextWeighted', 'hyperext', { load: 'plate' });
  eachArm('hyperextWeighted', function (a) { a.relC = [0.2, -0.1]; a.gw = -0.06; return a; });
  // Superman: boca abajo en el suelo; se elevan a la vez el pecho, los brazos y las piernas
  variant('superman', 'hyperext', { scene: ['mat'], cam: { az: 30, y: 0.25 },
    A: { hip: [0, 0.115], torso: 90, head: 0, legs: { th: -90, sh: -90, fw: 0.1, foot: 90 }, arms: { ua: 90, fa: 90, palm: [0, -1, 0], gw: 0.25 } },
    B: { hip: [0, 0.115], torso: 76, head: -8, legs: { th: -101, sh: -101, fw: 0.1, foot: 90 }, arms: { ua: 104, fa: 104, palm: [0, -1, 0], gw: 0.25 } } });

  // lote variants_b4.js

  // ---------------- Piernas: sentadillas ----------------
  var HANGD = { rel: [0.02, HANG, 0.09], palm: 'neu' };
  // Con peso corporal: brazos extendidos al frente para equilibrar
  variant('squatBW', 'squat', { load: 'none', scene: [], smith: false,
    A: { arms: { rel: [0.5, -0.03, 0], palm: 'pro', straight: 1 } }, B: { arms: { rel: [0.5, -0.03, 0], palm: 'pro', straight: 1 } } });
  // Con mancuernas: las mancuernas cuelgan a los costados
  variant('squatDb', 'squat', { load: 'hands', scene: [], smith: false, A: { arms: HANGD }, B: { arms: HANGD } });
  // En caja: se sienta atrás sobre la caja con las tibias casi verticales
  variant('boxSquat', 'squat', { boxes: [[-0.31, 0.44, 0, 0.36, 0.36]],
    A: { legs: { ik: [0.02, ANK], fw: 0.2, toe: 20 } }, B: { hip: [-0.27, 0.555], torso: 32, legs: { ik: [0.02, ANK], fw: 0.2, toe: 20 } } });
  // Con salto: bajada, salto explosivo con los brazos y aterrizaje amortiguado
  (function () {
    var lg = function (y, f) { return { ik: [0.02, y], fw: 0.15, toe: 12, foot: f }; };
    var S = { hip: STAND, torso: 2, legs: lg(ANK, 0), arms: { rel: [0.02, HANG, 0.08], palm: 'neu' } };
    var D = { hip: [-0.2, 0.6], torso: 32, head: -10, legs: lg(ANK, 0), arms: { rel: [-0.14, -0.48, 0.08], palm: 'neu' } };
    var J = { hip: [0.0, 1.14], torso: -2, legs: lg(ANK + 0.17, 38), arms: { rel: [0.16, -0.22, 0.1], palm: 'neu' } };
    var L = { hip: [-0.12, 0.76], torso: 18, legs: lg(ANK, 0), arms: { rel: [0.12, -0.42, 0.08], palm: 'neu' } };
    variant('jumpSquat', 'squat', { load: 'none', scene: [], smith: false, A: null, B: null, p: ['quads', 'glutes'], s: ['calves', 'hams'], thumb: 0.32,
      keys: [[0, S], [0.18, D], [0.32, J], [0.46, L], [0.62, S], [1, S]] });
  })();
  // En pared: espalda apoyada, muslos paralelos al suelo (isométrico)
  variant('wallSit', 'squat', { load: 'none', scene: [], smith: false, boxes: [[-0.285, 1.7, 0, 0.08, 0.9, 1.7, 1]], cam: { az: 40 },
    A: { hip: [-0.1, 0.5], torso: 0, legs: { ik: [0.36, ANK], fw: 0.15 }, arms: { rel: [0.24, -0.29, 0.05], hand: 'flat', flatDir: [1, -0.25, 0] } },
    B: { hip: [-0.1, 0.505], torso: 0, legs: { ik: [0.36, ANK], fw: 0.15 }, arms: { rel: [0.24, -0.285, 0.05], hand: 'flat', flatDir: [1, -0.25, 0] } } });
  // Pistol: sentadilla a una pierna (izquierda) con la otra extendida al frente
  variant('pistol', 'squat', { side: 'L', load: 'none', scene: [], smith: false, p: ['quads', 'glutes'], s: ['adductors', 'soleus'], cam: { az: 50 },
    A: { hip: [0, 0.97], torso: 2, legs: null, legsL: { ik: [0.0, ANK], fw: 0.1 }, legsR: { th: 26, sh: 26, fw: 0.1, foot: -10 }, arms: { rel: [0.45, -0.05, 0], palm: 'pro', straight: 1 } },
    B: { hip: [-0.22, 0.43], torso: 38, head: -10, legs: null, legsL: { ik: [0.02, ANK], fw: 0.1 }, legsR: { th: 82, sh: 86, fw: 0.1, foot: -5 }, arms: { rel: [0.5, 0.06, 0], palm: 'pro', straight: 1 } } });
  // Sissy: rodillas muy adelante sobre la punta de los pies, cadera extendida e inclinación hacia atrás
  variant('sissySquat', 'squat', { load: 'none', scene: [], smith: false, p: ['quads'], s: ['abs', 'hipFlex'], cam: { az: 70 },
    A: { hip: STAND, torso: 0, legs: { ball: [0.13, 0.0], foot: 0, fw: 0.12 }, arms: { rel: [0.35, -0.12, 0.05], palm: 'neu', straight: 1 } },
    B: { hip: [0.18, 0.62], torso: -36, head: 14, legs: { ball: [0.13, 0.0], foot: 44, fw: 0.12 }, arms: { rel: [0.4, -0.05, 0.05], palm: 'neu', straight: 1 } } });
  // Hack: espalda contra el respaldo inclinado que baja con el cuerpo; pies en la plataforma
  (function () {
    function hk(t, d0, rl) {
      var up = V(Math.sin(rad(t)), Math.cos(rad(t)), 0), a = V(-0.26, 0.98, 0), b = a.clone().sub(up.clone().multiplyScalar(d0));
      var base = { torso: t, head: -t * 0.55, legs: { ik: [0.2, (t < -30 ? 0.06 : 0.1) + ANK + (t < -30 ? 0.012 : 0)], fw: 0.16, toe: 15, foot: t < -30 ? -20 : 0 }, arms: { rel: rl, palm: 'neu' } };
      return { A: Object.assign({ hip: [a.x, a.y] }, cloneP(base)), B: Object.assign({ hip: [b.x, b.y] }, cloneP(base)) };
    }
    var h1 = hk(-38, 0.4, [0.317, -0.227, 0.13]), h2 = hk(-26, 0.42, [0.263, -0.288, 0.13]);
    variant('hackSquat', 'squat', { load: 'none', stack: false, scene: [], smith: false, backPad: true, hackSled: { at: [0.2, 0.06], tilt: 20 }, machinePos: null, boxes: null, p: ['quads', 'glutes'], s: ['adductors', 'soleus'], A: h1.A, B: h1.B, cam: { az: 38, dist: 1.15, y: 0.85 } });
    variant('pendulumSquat', 'hackSquat', { cam: { az: 40 }, stack: true, hackSled: false, boxes: [[0.24, 0.1, 0, 0.5, 0.62, 0.08, 1]], machinePos: [-0.75, -0.6, 0], A: h2.A, B: h2.B });
  })();
  // Salto al cajón: contramovimiento, salto, aterrizaje amortiguado sobre la caja y bajada
  (function () {
    var lg = function (x, y) { return { ik: [x, y], fw: 0.14, foot: 0 }; };
    var S = { hip: [0, 0.97], torso: 2, legs: lg(0.02, ANK), arms: { rel: [0.02, HANG, 0.08], palm: 'neu' } };
    var C = { hip: [-0.16, 0.72], torso: 30, head: -10, legs: lg(0.02, ANK), arms: { rel: [-0.16, -0.46, 0.08], palm: 'neu' } };
    var Air = { hip: [0.3, 1.3], torso: 14, legs: lg(0.42, 0.72), arms: { rel: [0.2, -0.15, 0.1], palm: 'neu' } };
    var Ld = { hip: [0.45, 1.1], torso: 28, legs: lg(0.62, 0.5 + ANK), arms: { rel: [0.25, -0.35, 0.08], palm: 'neu' } };
    var T2 = { hip: [0.6, 1.47], torso: 2, legs: lg(0.62, 0.5 + ANK), arms: { rel: [0.02, HANG, 0.08], palm: 'neu' } };
    var B1 = { hip: [0.3, 1.32], torso: 4, legs: lg(0.3, 0.55), arms: { rel: [0.05, -0.45, 0.1], palm: 'neu' } };
    variant('boxJump', 'squat', { load: 'none', scene: [], smith: false, p: ['quads', 'glutes'], s: ['calves', 'hams'], boxes: [[0.64, 0.5, 0, 0.5, 0.6]], A: null, B: null, thumb: 0.36, cam: { az: 70 },
      keys: [[0, S], [0.12, S], [0.24, C], [0.36, Air], [0.46, Ld], [0.58, T2], [0.7, T2], [0.84, B1], [0.94, S], [1, S]] });
  })();
  // Zercher: la barra apoyada en el pliegue de los codos, manos juntas delante del pecho
  variant('zercher', 'squat', { load: 'zercher', scene: [], smith: false, p: ['quads', 'glutes'], s: ['abs', 'traps', 'biceps'],
    A: { arms: { relC: [0.2, -0.1], gw: 0.06, palm: 'sup', pole: [1, -1, 0.4] } }, B: { arms: { relC: [0.2, -0.1], gw: 0.06, palm: 'sup', pole: [1, -1, 0.4] } } });
  // Sentadilla frontal: barra apoyada delante de los hombros con los codos altos; tronco más vertical
  var RACK = { relC: [0.19, 0.06], gw: 0.25, palm: 'pro', pole: [1, 0.5, 0.3] };
  variant('frontSquatBar', 'frontSquat', { load: 'bar', s: ['glutes', 'adductors', 'abs'],
    A: { hip: STAND, torso: 2, arms: RACK }, B: { hip: [-0.15, 0.5], torso: 22, head: -8, arms: RACK } });
  // Thruster: sentadilla frontal y, al subir, la barra sigue hasta arriba en un solo movimiento
  (function () {
    var lg = { ik: [0.02, ANK], fw: 0.16, toe: 15 };
    var R = { hip: STAND, torso: 2, legs: lg, arms: RACK }, Q = { hip: [-0.15, 0.5], torso: 22, head: -8, legs: lg, arms: RACK };
    var U = { hip: [-0.05, 0.86], torso: 8, legs: lg, arms: { relC: [0.19, 0.12], gw: 0.25, palm: 'pro', pole: [1, 0.5, 0.3] } };
    var P = { hip: STAND, torso: 0, legs: lg, arms: { relC: [0.035, 0.51], gw: 0.25, palm: 'pro', pole: [0.4, -1, 0.5] } };
    variant('thruster', 'frontSquat', { load: 'bar', A: null, B: null, bakeBar: true, p: ['quads', 'deltsF'], s: ['glutes', 'triceps', 'deltsS'], thumb: 0.5,
      keys: [[0, R], [0.08, R], [0.28, Q], [0.36, Q], [0.48, U], [0.58, P], [0.68, P], [0.86, R], [1, R]] });
  })();
  // Wall ball: sentadilla con el balón al pecho y lanzamiento hacia arriba al subir
  (function () {
    var lg = { ik: [0.02, ANK], fw: 0.16, toe: 15 };
    var R = { hip: STAND, torso: 2, legs: lg, arms: { relC: [0.31, -0.06], gw: 0.13, palm: 'neu', pole: [1, -1, 0.5] } };
    var Q = { hip: [-0.18, 0.52], torso: 24, head: -8, legs: lg, arms: { relC: [0.32, -0.04], gw: 0.13, palm: 'neu', pole: [1, -1, 0.5] } };
    var T3 = { hip: STAND, torso: -2, legs: lg, arms: { relC: [0.3, 0.42], gw: 0.13, palm: 'neu', pole: [1, -1, 0.5] } };
    var Cc = { hip: STAND, torso: 0, legs: lg, arms: { relC: [0.32, 0.25], gw: 0.13, palm: 'neu', pole: [1, -1, 0.5] } };
    variant('wallBall', 'frontSquat', { load: 'medball', flight: [0.46, 0.8, 1.5], A: null, B: null, p: ['quads', 'glutes', 'deltsF'], s: ['triceps', 'abs'], thumb: 0.3,
      keys: [[0, R], [0.18, Q], [0.26, Q], [0.4, R], [0.46, T3], [0.8, T3], [0.86, Cc], [1, R]] });
  })();

  // ---------------- Piernas: zancadas y subidas ----------------
  // Búlgara: pie trasero apoyado en un banco; trabaja sobre todo la pierna delantera (derecha)
  (function () {
    var rear = { ik: [-0.6, 0.555], fw: 0.1, foot: 150 }, front = { ik: [0.36, ANK], fw: 0.1 };
    var top = { hip: [-0.08, 0.93], torso: 4, legsL: rear, legsR: front }, bot = { hip: [-0.12, 0.6], torso: 10, legsL: rear, legsR: front };
    variant('bulgarian', 'lunge', { keys: null, load: 'hands', boxes: [[-0.66, 0.45, -0.1, 0.32, 0.5]], p: ['quads', 'glutes'], s: ['adductors', 'soleus'],
      A: Object.assign({ arms: HANGD }, top), B: Object.assign({ arms: HANGD }, bot) });
    variant('bulgarianBar', 'bulgarian', { load: 'back', A: { arms: { bar: 'back' } }, B: { arms: { bar: 'back' } } });
  })();
  // Zancadas con barra (y en Smith): la barra en la espalda en vez de mancuerna
  variant('lungeBar', 'lunge', { load: 'back' });
  P.lungeBar.keys.forEach(function (q) { q[1] = cloneP(q[1]); q[1].arms = { bar: 'back' }; });
  variant('lungeSmith', 'lungeBar', { smith: true });
  // Zancada alterna (caminando): primero adelanta la derecha y luego la izquierda
  (function () {
    var hold = HANGD;
    function st(lx, rx, ly, ry, lf, rf, hip, tor) { return { hip: hip, torso: tor || 0, legsL: { ball: [lx, ly], foot: lf }, legsR: { ball: [rx, ry], foot: rf }, arms: hold }; }
    var stand = st(0.13, 0.13, 0, 0, 0, 0, [0, 0.97]);
    var rLift = st(0.13, 0.42, 0, 0.2, 0, 0, [0.08, 0.96]), rPlant = st(0.13, 0.91, 0.012, 0, 30, 0, [0.33, 0.9]), rBot = st(0.13, 0.91, 0.016, 0, 55, 0, [0.35, 0.5], 5);
    var lLift = st(0.42, 0.13, 0.2, 0, 0, 0, [0.08, 0.96]), lPlant = st(0.91, 0.13, 0, 0.012, 0, 30, [0.33, 0.9]), lBot = st(0.91, 0.13, 0, 0.016, 0, 55, [0.35, 0.5], 5);
    variant('lungeAlt', 'lunge', { side: null, load: 'hands', thumb: 0.24,
      keys: [[0, stand], [0.06, rLift], [0.14, rPlant], [0.24, rBot], [0.3, rPlant], [0.38, rLift], [0.46, stand], [0.52, stand], [0.58, lLift], [0.66, lPlant], [0.76, lBot], [0.82, lPlant], [0.9, lLift], [0.98, stand], [1, stand]] });
  })();
  // Zancada hacia atrás: la pierna izquierda da el paso atrás; trabaja la delantera (derecha)
  (function () {
    function st(lx, ly, lf, hip, tor) { return { hip: hip, torso: tor || 0, legsL: { ball: [lx, ly], foot: lf }, legsR: { ball: [0.13, 0], foot: 0 }, arms: HANGD }; }
    var stand = st(0.13, 0, 0, [0, 0.97]), lift = st(-0.12, 0.2, 10, [-0.05, 0.96]), plant = st(-0.6, 0.012, 38, [-0.18, 0.9], 4), bot = st(-0.6, 0.016, 58, [-0.2, 0.52], 8);
    variant('reverseLunge', 'lunge', { load: 'hands', keys: [[0, stand], [0.08, stand], [0.18, lift], [0.3, plant], [0.46, bot], [0.54, bot], [0.7, plant], [0.82, lift], [0.94, stand], [1, stand]] });
  })();
  // Zancada lateral: paso al costado con la derecha y la cadera atrás sobre esa pierna; la izquierda queda estirada
  (function () {
    var arms = { relC: [0.25, -0.03], gw: 0.045, palm: [0, 0.6, -1], pole: [0, -1, 0.5] };
    function st(rz, hip, tor) { return { hip: hip, torso: tor || 0, legsL: { ik: [0.0, ANK, 0.11], fw: 0.11 }, legsR: { ik: [0.04, ANK, rz], fw: 0.11, toe: 18 }, arms: arms }; }
    var stand = st(0.11, [0, 0.97, 0]), step = st(0.62, [-0.02, 0.92, 0.12]), bot = st(0.62, [-0.2, 0.62, 0.36], 32);
    variant('lateralLunge', 'lunge', { load: 'goblet', p: ['quads', 'glutes', 'adductors'], s: ['hams'], cam: { az: 80 },
      keys: [[0, stand], [0.1, stand], [0.24, step], [0.42, bot], [0.52, bot], [0.7, step], [0.86, stand], [1, stand]] });
  })();
  // Step-up: sube al cajón con la derecha, junta la izquierda y baja
  (function () {
    var H = 0.42;
    function st(lx, ly, rx, ry, hip, tor) { return { hip: hip, torso: tor || 0, legsL: { ik: [lx, ly], fw: 0.11, foot: 0 }, legsR: { ik: [rx, ry], fw: 0.11, foot: 0 }, arms: HANGD }; }
    var S = st(0.0, ANK, 0.0, ANK, [0, 0.97]), R1 = st(0.0, ANK, 0.42, H + ANK, [0.05, 0.95], 8), U = st(0.0, ANK + 0.12, 0.42, H + ANK, [0.36, 1.32], 6);
    var T4 = st(0.42, H + ANK, 0.42, H + ANK, [0.42, H + 0.97]), D1 = st(0.0, ANK, 0.42, H + ANK, [0.16, 1.12], 10);
    var R0 = st(0.0, ANK, 0.08, H + ANK + 0.04, [0.02, 0.96], 4), L1 = st(0.28, H + ANK + 0.05, 0.42, H + ANK, [0.4, H + 0.93], 4), L2 = st(0.06, H + ANK + 0.03, 0.42, H + ANK, [0.33, 1.27], 9);
    variant('stepUp', 'lunge', { load: 'hands', boxes: [[0.46, H, 0, 0.42, 0.6]], p: ['glutes', 'quads'], s: ['adductors', 'soleus'], cam: { az: 60 },
      keys: [[0, S], [0.05, R0], [0.12, R1], [0.26, U], [0.36, T4], [0.42, T4], [0.47, L1], [0.53, L2], [0.62, D1], [0.72, R1], [0.8, R0], [0.9, S], [1, S]] });
  })();

  // ---------------- Piernas: máquinas ----------------
  // Prensa a una pierna: empuja la derecha; la izquierda descansa en el suelo
  variant('legPressSingle', 'legPress', { side: 'R', A: { legs: null, legsR: P.legPress.A.legs, legsL: { ik: [0.02, ANK], fw: 0.2 } }, B: { legs: null, legsR: P.legPress.B.legs, legsL: { ik: [0.02, ANK], fw: 0.2 } } });
  // Prensa horizontal: sentado, empuja la plataforma en horizontal
  variant('legPressHoriz', 'legPress', { scene: ['seatBack'], sled: true, cam: { az: 30 },
    A: { hip: [-0.32, 0.52], torso: -18, legs: { ik: [0.2, 0.62], fw: 0.15, foot: -90, pole: [0, 1, 0.3] }, arms: { ik: [-0.22, 0.48], gw: 0.3, palm: 'neu' } },
    B: { hip: [-0.32, 0.52], torso: -18, legs: { ik: [0.62, 0.62], fw: 0.15, foot: -90, pole: [0, 1, 0.3] }, arms: { ik: [-0.22, 0.48], gw: 0.3, palm: 'neu' } } });
  // Extensión de cuádriceps a una pierna (derecha)
  variant('legExtSingle', 'legExt', { side: 'R', A: { legs: null, legsL: { th: 90, sh: 6, footRel: 0 }, legsR: { th: 90, sh: 6, footRel: 0 } }, B: { legs: null, legsL: { th: 90, sh: 6, footRel: 0 }, legsR: { th: 90, sh: 86, footRel: 0 } } });
  // Curl nórdico: de rodillas con los tobillos sujetos; el cuerpo recto baja lento hacia delante y vuelve
  (function () {
    function nd(a, arms) { var kx = 0, ky = 0.1; return { hip: [kx + TH * Math.sin(rad(a)), ky + TH * Math.cos(rad(a))], torso: a, head: -a * 0.2, legs: { th: -a, sh: -90, fw: 0.11, foot: 90 }, arms: arms }; }
    var ch = { relC: [0.22, -0.06], gw: 0.12, palm: 'neu', pole: [0, -1, 0.5] }, rc = { relC: [0.42, 0.22], gw: 0.2, palm: 'pro', pole: [0, -1, 0.5] };
    variant('nordic', 'legCurl', { load: 'none', stack: false, scene: ['mat'], machinePos: null, boxes: [[-0.45, 0.235, 0, 0.1, 0.5, 0.07, 1]], A: null, B: null, cam: { az: 30, y: 0.4 },
      keys: [[0, nd(4, ch)], [0.1, nd(4, ch)], [0.55, nd(58, ch)], [0.64, nd(68, rc)], [0.74, nd(46, rc)], [0.9, nd(8, ch)], [1, nd(4, ch)]] });
  })();
  // Curl femoral de pie: una pierna (derecha), el talón sube hacia el glúteo contra el rodillo
  variant('legCurlStanding', 'legCurl', { side: 'R', scene: [], roller: 'back', machinePos: [0.6, -0.6, 0], cam: { az: 40 }, boxes: [[0.4, 1.248, 0, 0.035, 0.66, 0.035, 1], [0.4, 1.248, -0.33, 0.05, 0.05, 0, 1], [0.4, 1.248, 0.33, 0.05, 0.05, 0, 1]],
    A: { hip: STAND, torso: 8, head: 0, legs: null, legsL: { ik: [0.0, ANK], fw: 0.11 }, legsR: { th: 3, sh: 3, fw: 0.11, footRel: 5 }, arms: { relC: [0.36, -0.06], gw: 0.2, palm: 'pro', pole: [0, -1, 0.5] } },
    B: { hip: STAND, torso: 8, head: 0, legs: null, legsL: { ik: [0.0, ANK], fw: 0.11 }, legsR: { th: 10, sh: -100, fw: 0.11, footRel: 5 }, arms: { relC: [0.36, -0.06], gw: 0.2, palm: 'pro', pole: [0, -1, 0.5] } } });
  // Curl femoral sentado: piernas estiradas sobre el rodillo y flexión de rodillas hacia abajo
  variant('legCurlSeated', 'legCurl', { scene: ['seatBack'], roller: 'back', machinePos: [-0.7, -0.6, 0], cam: { az: 40 },
    A: { hip: [-0.08, 0.56], torso: -10, head: 0, legs: { th: 90, sh: 90, footRel: 10 }, arms: { ik: [0.02, 0.5], gw: 0.27, palm: 'neu' } },
    B: { hip: [-0.08, 0.56], torso: -10, head: 0, legs: { th: 90, sh: -4, footRel: 10 }, arms: { ik: [0.02, 0.5], gw: 0.27, palm: 'neu' } } });

  // ---------------- Glúteo ----------------
  function bridge(hip, sho) { var up = V(sho[0] - hip[0], sho[1] - hip[1], 0).normalize(); return { hip: hip, torso: Math.atan2(up.x, up.y) * 180 / Math.PI }; }
  (function () {
    var SH0 = [-0.43, 0.12], lo = bridge([-0.03, 0.14], SH0), hi = bridge([0.05, 0.37], SH0);
    var lg = { ik: [0.36, ANK], fw: 0.15 }, flat = { ik: [-0.16, 0.045], gw: 0.3, hand: 'flat', flatDir: [1, 0, 0] };
    variant('gluteBridgeBar', 'hipThrust', { scene: ['mat'], load: 'hip', A: { hip: lo.hip, torso: lo.torso, legs: lg }, B: { hip: hi.hip, torso: hi.torso, legs: lg } });
    variant('gluteBridge', 'hipThrust', { scene: ['mat'], load: 'none', A: { hip: lo.hip, torso: lo.torso, legs: lg, arms: flat }, B: { hip: hi.hip, torso: hi.torso, legs: lg, arms: flat } });
    var fr = { ik: [0.2, ANK, 0.035], fw: 0.03, pole: [0, 0.4, 1], toe: 55 }, hf = bridge([0.03, 0.29], SH0);
    variant('frogPump', 'hipThrust', { scene: ['mat'], load: 'none', s: ['adductors', 'hams'], A: { hip: lo.hip, torso: lo.torso, legs: fr, arms: flat }, B: { hip: hf.hip, torso: hf.torso, legs: fr, arms: flat } });
    // Puente con fitball: talones sobre el balón; la cadera sube y las rodillas traen el balón hacia el glúteo
    var a1 = [0.84, 0.66], a2 = [0.4, 0.52], b1 = bridge([0.04, 0.38], SH0), b2 = bridge([0.06, 0.48], SH0);
    variant('ballLegCurl', 'hipThrust', { scene: ['mat'], load: 'stabBall', p: ['hams'], s: ['glutes', 'calves'], cam: { az: 30, y: 0.4 },
      A: { hip: b1.hip, torso: b1.torso, legs: { ik: a1, fw: 0.1, foot: -58 }, arms: flat }, B: { hip: b2.hip, torso: b2.torso, legs: { ik: a2, fw: 0.1, foot: -55 }, arms: flat } });
  })();
  // Hip thrust a una pierna: apoyada la derecha; la izquierda flexionada en el aire
  variant('hipThrustSingle', 'hipThrust', { side: 'R', A: { legs: null, legsR: P.hipThrust.A.legs, legsL: { th: 118, sh: 22, fw: 0.15 } }, B: { legs: null, legsR: P.hipThrust.B.legs, legsL: { th: 162, sh: 76, fw: 0.15 } } });

  // ---------------- Pantorrilla y cadera ----------------
  // Elevación de puntas (tibial): espalda contra la pared, talones en el suelo y las puntas suben
  variant('tibialisRaise', 'calf', { p: ['tibialis'], s: [], load: 'none', stack: false, scene: [], boxes: [[-0.31, 1.8, 0, 0.08, 0.9, 1.8, 1]], cam: { az: 50 },
    A: { hip: [-0.1, 0.94], torso: -6, legs: { ik: [0.25, ANK], fw: 0.12, foot: 0 }, arms: { rel: [-0.02, HANG, 0.08], palm: 'neu' } },
    B: { hip: [-0.1, 0.94], torso: -6, legs: { ik: [0.25, ANK], fw: 0.12, foot: -32 }, arms: { rel: [-0.02, HANG, 0.08], palm: 'neu' } } });
  // Elevación de talones en prensa: rodillas casi estiradas, empuja con la punta de los pies
  variant('calfPress', 'legPress', { p: ['calves'], s: ['soleus'],
    A: { legs: { ball: [0.458, 1.21], foot: -142, fw: 0.15, pole: [-0.4, 1, 0.25] } }, B: { legs: { ball: [0.508, 1.258], foot: -112, fw: 0.15, pole: [-0.4, 1, 0.25] } } });
  // Abducción y aducción en máquina: sentado, las almohadillas en las rodillas
  (function () {
    var b = { hip: [-0.08, 0.55], torso: -6, armsL: null, armsR: null, legsL: null, legsR: null, arms: { ik: [0.02, 0.52], gw: 0.27, palm: 'neu' } };
    var cl = Object.assign({ legs: { ik: [0.37, 0.15, 0.11], fw: 0.1, pole: [1, 0.25, 0.05] } }, b), op = Object.assign({ legs: { ik: [0.29, 0.15, 0.35], fw: 0.1, pole: [0.8, 0.25, 0.6] } }, b);
    variant('abductionMachine', 'abduction', { side: null, load: 'none', stack: true, scene: ['seatBack'], machinePos: [-0.7, -0.6, 0], kneePads: 'out', A: cl, B: op, cam: { az: 60 } });
    variant('adductionMachine', 'abductionMachine', { p: ['adductors'], s: [], kneePads: 'in', A: op, B: cl });
    cam2('abductionMachine', 90, 16); cam2('legCurlSeated', 92, 14); cam2('wallSit', 2, 8); cam2('hackSquat', 95, 12); cam2('pendulumSquat', 95, 12); cam2('tibialisRaise', 80, 8); cam2('legPressHoriz', -70, 30); cam2('legPressSingle', -70, 30); cam2('calfPress', -70, 30); cam2('ballLegCurl', -55, 20); cam2('adductionMachine', 90, 16);
  })();

  // lote variants_b6.js
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
    var Dd = { hip: [-0.02, 0.95], torso: 6, head: 0, legs: LQ, arms: dh(0.22, 1.18, 0.21, [0.2, -1, 0.6]) };   // impulso de cadera: suben pegadas al cuerpo
    var stand = { hip: STAND, torso: 0, legs: LQ }, Do = Object.assign({}, stand, { arms: { ik: relIk(stand, [0.02, 0.52]), gw: 0.22, palm: 'neu', pole: [0, -1, 0.5], straight: 1 } });
    variant('devilPress', 'pushup', { load: 'hands', p: ['glutes', 'delts', 'quads'], s: ['pecs', 'triceps', 'hams', 'abs', 'traps'], A: null, B: null, liftAt: null, period: 5200, thumb: 0.62, cam: { az: 35, y: 0.95, dist: 1.2 },
      keys: [[0, Dq], [0.08, Dj], [0.15, Dp], [0.24, Dc], [0.33, Dp], [0.4, Dj], [0.47, Dq], [0.54, Dh], [0.59, Dt], [0.64, Dd], [0.7, Do], [0.76, Do], [0.82, Dd], [0.87, Dt], [0.93, Dh], [1, Dq]] });
    // Man maker: flexión sobre las mancuernas, remo con cada brazo, pies adelante, cargada a los hombros, sentadilla frontal y press (thruster)
    var row = function (side) { var q = cloneP(Dp); q.arms = null; var up = dh(0.12, 0.36, 0.2, [-1, 0.6, 0.6]); q['arms' + side] = up; q['arms' + (side === 'R' ? 'L' : 'R')] = dh(0.33, 0.1, 0.2); q.twist = side === 'R' ? 6 : -6; return q; };
    var both = function (p) { var q = cloneP(p); if (q.twist == null) q.twist = 0; if (!q.arms) { delete q.arms; return q; } var a = q.arms; delete q.arms; q.armsL = cloneP(a); q.armsR = cloneP(a); if (q.twist == null) q.twist = 0; return q; };
    var rack = function (b) { var q = cloneP(b), r = relIk(b, [0.16, 0.04]); q.arms = dh(r[0], r[1], 0.2, [0.4, -1, 0.3]); return q; };
    var Mr = rack(stand), Mfs = rack({ hip: [-0.17, 0.52], torso: 18, head: -4, legs: LQ });
    var Mm = { hip: [0, 0.99], torso: 0, legs: LQ, arms: dh.apply(null, relIk(stand, [0.08, 0.3]).concat([0.21, [0.3, -1, 0.5]])) };
    var seq = [[0, Dp], [0.07, Dc], [0.14, Dp], [0.2, row('R')], [0.26, Dp], [0.32, row('L')], [0.38, Dp], [0.44, Dj], [0.5, Dq], [0.57, Dd], [0.62, Mr], [0.69, Mfs], [0.75, Mm], [0.8, Do], [0.85, Do], [0.9, Mr], [0.95, Dq], [1, Dp]];
    variant('manMaker', 'pushup', { load: 'hands', p: ['pecs', 'lats', 'quads', 'delts'], s: ['triceps', 'biceps', 'glutes', 'abs', 'deltsR'], A: null, B: null, liftAt: null, period: 9000, thumb: 0.2, cam: { az: 35, y: 0.95, dist: 1.2 },
      keys: seq.map(function (k) { return [k[0], both(k[1])]; }) });
  })();

  // lote variants_b7.js
  // ================= Lote 7: variantes sueltas de la biblioteca =================
  (function () {
    // Curl 21: 7 repeticiones de la mitad inferior, 7 de la superior y 7 completas (aquí una de cada)
    var dn = { ua: 2, fa: 4, palm: 'sup' }, md = { ua: 5, fa: 82, palm: 'sup' }, up = { ua: 10, fa: 150, palm: 'sup' };
    function cp(a) { return { hip: STAND, torso: 0, legs: FEET, arms: a }; }
    variant('curl21', 'curl', { A: null, B: null, s: ['brachiorad', 'forearms'], period: 5600, thumb: 0.44,
      keys: [[0, cp(dn)], [0.11, cp(md)], [0.22, cp(dn)], [0.33, cp(md)], [0.44, cp(up)], [0.55, cp(md)], [0.66, cp(dn)], [0.83, cp(up)], [1, cp(dn)]] });
    // Curl con barra Z: agarre semisupino en los tramos inclinados; algo menos de tensión en las muñecas
    variant('curlEz', 'curl', { ez: true, s: ['brachiorad', 'forearms'] });
    eachArm('curlEz', function (a) { a.palm = 'semi'; a.gw = 0.18; return a; });
  })();
  // Dominadas asistidas: de rodillas sobre la plataforma de la máquina, que empuja hacia arriba
  variant('pullupAssisted', 'pullup', { kneePlatform: [0.5, 0.3], stack: true, machinePos: [0.75, -0.55, 0],
    A: { legs: { th: 2, sh: -86, fw: 0.1, foot: 75 } }, B: { legs: { th: 2, sh: -86, fw: 0.1, foot: 75 } } });
  // Fondos lastrados: disco colgado del cinturón por delante de los muslos
  variant('dipWeighted', 'dip', { beltPlate: true, B: { hip: [-0.05, 1.17], torso: 15 } }); // bajada hasta ~90° de codo: el hombro no se hiperextiende
  // Flexiones lastradas: disco sobre la parte alta de la espalda
  variant('pushupWeighted', 'pushup', { backPlate: [0.3, 0.014] });
  // Hip thrust con mancuerna: la mancuerna atravesada sobre el pliegue de la cadera, sujeta por los extremos
  variant('hipThrustDb', 'hipThrust', { load: 'hip', A: { arms: { ik: [-0.02, 0.44], gw: 0.13, palm: 'pro', pole: [-0.3, 1, 0.5] } }, B: { arms: { ik: [-0.06, 0.79], gw: 0.13, palm: 'pro', pole: [-0.3, 1, 0.5] } } });
  // Hip thrust en máquina: almohadilla sobre la cadera unida a palancas que giran detrás del respaldo
  variant('hipThrustMachine', 'hipThrust', { load: 'none', stack: false, hipPad: [0.62, 0.3], A: { arms: { ik: [-0.02, 0.45], gw: 0.3, palm: 'pro', pole: [-0.3, 1, 0.5] } }, B: { arms: { ik: [-0.06, 0.8], gw: 0.3, palm: 'pro', pole: [-0.3, 1, 0.5] } } });
  // Patada de glúteo en máquina: pecho apoyado, manos en las asas y la almohadilla detrás de la pierna que empuja
  variant('gluteKickbackMachine', 'gluteKickback', { load: 'none', scene: [], roller: 'back', stack: true, machinePos: [0.85, -0.6, 0],
    boxes: [[0.52, 0.995, 0.34, 0.05, 0.05, 0, 1], [0.52, 0.995, -0.34, 0.05, 0.05, 0, 1], [0.5, 1.012, 0, 0.03, 0.72, 0.03, 1]],
    A: { hip: [0, 0.975], arms: { ik: [0.49, 1.0], gw: 0.2, palm: 'pro' } }, B: { hip: [0, 0.975], arms: { ik: [0.49, 1.0], gw: 0.2, palm: 'pro' }, legsR: { th: -62, sh: -56 } } });
  // Curl femoral con mancuerna: tumbado boca abajo en un banco, la mancuerna sujeta entre los pies
  variant('legCurlDb', 'legCurl', { load: 'feetDb', stack: false, machinePos: null, scene: [], boxes: [[0.1, 0.43, 0, 1.0, 0.32]],
    A: { legs: { th: -90, sh: -100, footRel: 25, footFlip: true, fw: 0.06 } }, B: { legs: { th: -94, sh: -205, footRel: 25, footFlip: true, fw: 0.06 } } });
  // Elevación de talones con mancuerna (a una pierna): mancuerna en la mano del lado que trabaja, la otra mano en un apoyo
  variant('calfDbSingle', 'calf', { side: 'R', load: 'handR', boxes: [[0.44, 1.3, 0.34, 0.06, 0.06, 0, 1]],
    A: { legsR: P.calf.A.legs, legsL: { th: -12, sh: -80, fw: 0.09, foot: 30 }, legs: null, armsR: { rel: [0.02, HANG, 0.06], palm: 'neu' }, armsL: { ik: [0.4, 1.28, 0.34], palm: 'neu', pole: [-0.3, -1, 0.5] }, arms: null },
    B: { legsR: P.calf.B.legs, legsL: { th: -12, sh: -80, fw: 0.09, foot: 30 }, legs: null, armsR: { rel: [0.02, HANG, 0.06], palm: 'neu' }, armsL: { ik: [0.4, 1.28, 0.34], palm: 'neu', pole: [-0.3, -1, 0.5] }, arms: null } });
  // Abducción con banda: mini banda en los tobillos, manos en la cadera; la pierna derecha se separa sin inclinar el tronco
  variant('bandAbduction', 'abduction', { load: 'none', stack: false, scene: [], ankleBand: true, cam: { az: 80 },
    A: { armsL: null, armsR: null, arms: { ik: [0.04, 1.03], gw: 0.22, palm: 'neu', pole: [-0.2, 0, 1] } }, B: { armsL: null, armsR: null, arms: { ik: [0.04, 1.03], gw: 0.22, palm: 'neu', pole: [-0.2, 0, 1] }, legsR: { th: 38, sh: 38, plane: 'f' } } });

  // lote variants_b5.js
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
    var P1 = tg([0, 0.145], -90, 0, { ik: [0.84, ANK, 0.36], fw: 0.14, foot: -88 }, RB, lh(-0.28, 0.075, 0.46, 1, [0.5, 0, 1]));
    var P2 = tg([0, 0.145], -58, 22, { ik: [0.84, ANK, 0.36], fw: 0.14, foot: -88 }, RB, Object.assign(lh(-0.24, 0.075, 0.42, 0, [0.4, 0, 1]), { pole: [-0.4, -0.15, 1] }), 8);
    var P3 = tg([0, 0.145], -32, 28, { ik: [0.84, ANK, 0.36], fw: 0.14, foot: -88 }, RB, lh(-0.32, 0.075, 0.4, 1), 8);
    var P4 = tg([0.08, 0.45], -72, 26, { ik: [0.84, ANK, 0.36], fw: 0.14, foot: -70 }, RB, lh(-0.36, 0.075, 0.4, 1), 10);
    var P4b = tg([0.0, 0.43], -70, 22, { ik: [0.0, 0.13, 0.13], fw: 0.14, foot: 20, pole: [0.6, 0.1, 1] }, RB, lh(-0.4, 0.075, 0.4, 1), 10);
    var P6 = tg([-0.1, 0.55], 0, 0, { ik: [-0.52, 0.11, 0.13], fw: 0.14, foot: 90, pole: [0.2, -1, 0] }, RB, lh(-0.1, 0.6, 0.28, 0, [0, -1, 0.1]));
    var P6b = tg([0.14, 0.84], 6, 0, { ik: [-0.42, ANK + 0.04, 0.13], fw: 0.14, foot: 45, pole: [0.2, -1, 0] }, RB, lh(0.15, 0.74, 0.25, 0, [0, -1, 0.1]));
    var P7 = tg([0.4, 0.97], 0, 0, { ik: [0.42, ANK, 0.13], fw: 0.14, foot: 0 }, { ik: [0.42, ANK, 0.13], fw: 0.14, foot: 0 }, lh(0.42, 0.87, 0.24, 0, [0, -1, 0.1]));
    variant('turkishGetUp', 'swing', { load: 'kb', kbHand: ['R', 'rack'], scene: ['mat'], p: ['deltsF', 'abs', 'glutes'], s: ['obliques', 'deltsS', 'triceps', 'quads'], A: null, B: null, thumb: 0.32, period: 9000, cam: { az: 25, y: 0.6 },
      keys: [[0, P1], [0.06, P1], [0.14, P2], [0.22, P3], [0.3, P4], [0.37, P4b], [0.45, P6], [0.52, P6b], [0.58, P7], [0.64, P7], [0.7, P6b], [0.76, P6], [0.83, P4b], [0.88, P4], [0.93, P3], [0.97, P2], [1, P1]] });
  })();
