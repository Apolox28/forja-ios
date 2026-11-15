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
    A: { hip: [0.05, 0.56], torso: -50, legs: { ik: [0.52, ANK], fw: 0.22 }, arms: { rel: [0.03, HANG + 0.01, 0.12], palm: 'neu', pole: [-1, -0.2, 0.4] } },
    B: { hip: [0.05, 0.56], torso: -50, legs: { ik: [0.52, ANK], fw: 0.22 }, arms: { rel: [0.1, -0.13, 0.09], palm: 'sup', pole: [-1, -0.6, 0.35] } } });
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
    A: { armsR: { ua: -2, fa: 105, palm: 'sup' }, armsL: { rel: [0.05, -0.3, 0.1], palm: 'neu' }, arms: null },
    B: { armsR: { ua: -3, fa: 16, palm: 'sup' }, armsL: { rel: [0.05, -0.3, 0.1], palm: 'neu' }, arms: null } });
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
    A: { hip: [0.01, 0.57], torso: -6, legs: { ik: [0.76, ANK], fw: 0.12 }, arms: { ik: [-0.12, 0.47], gw: 0.22, hand: 'flat', flatDir: [1, 0, 0], pole: [-1, 0.2, 0.3] } },
    B: { hip: [0.0, 0.48], torso: -3, legs: { ik: [0.76, ANK], fw: 0.12 }, arms: { ik: [-0.12, 0.47], gw: 0.22, hand: 'flat', flatDir: [1, 0, 0], pole: [-1, 0.2, 0.3] } } });
  // Fondos en máquina: sentado, empuja los agarres hacia abajo junto a la cadera
  variant('dipMachine', 'dip', { p: ['triceps'], s: ['pecs', 'deltsF'], load: 'grips', stack: true, scene: ['stool'], cam: { az: 40, y: 0.8 },
    A: { hip: [-0.05, 0.52], torso: 6, legs: { ik: [0.36, ANK], fw: 0.15 }, arms: { rel: [0.03, -0.33, 0.09], palm: 'neu', pole: [-1, 0.2, 0.3] } },
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
      B: Object.assign({}, base, { arms: { ik: [sc0.x + 0.07, sc0.y + 0.26], gw: 0.4, palm: 'pro', pole: [0.3, -1, 0.6] } }) }); // el codo apenas toca el suelo
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
  // Peck deck (mariposa de almohadillas): sentado con la espalda apoyada, brazos a la altura de los hombros con los codos a 90°
  // y los antebrazos verticales contra las almohadillas; cierra los codos delante del pecho (aducción horizontal)
  variant('pecDeck', 'cableFly', { load: 'none', stack: true, scene: ['seatBack'], machinePos: [-0.75, -0.55, 0], twinPos: null, pecPads: true, cam: { az: 50, y: 0.95 },
    A: { hip: [-0.08, 0.52], torso: -4, legs: { ik: [0.4, ANK], fw: 0.16 }, legsL: null, legsR: null, arms: { relC: [-0.02, 0.29], gw: 0.4, pole: [-0.15, -0.35, 1], palm: [0, 0, -1] } },
    B: { hip: [-0.08, 0.52], torso: -4, legs: { ik: [0.4, ANK], fw: 0.16 }, legsL: null, legsR: null, arms: { relC: [0.22, 0.27], gw: 0.115, pole: [1, -0.35, 0.1], palm: [0, 0, -1] } } });
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
    // Giro con cable de arriba hacia abajo (StrengthLog/Motra): polea alta a la derecha, pies algo más abiertos que la cadera,
    // brazos casi rectos con las dos manos en el asa; el tronco gira y baja en diagonal hasta fuera de la rodilla izquierda;
    // el pie derecho (el de atrás) pivota sobre la punta al final
    function hands(x, y, z, st) { return { armsR: { ik: [x, y, z + 0.035], palm: [0, -0.3, -1], straight: st, pole: [0, -1, 0.3] }, armsL: { ik: [x, y, -(z - 0.035)], palm: [0, -0.3, -1], straight: st, pole: [0, -1, 0.3] } }; }
    function lg(rf) { return { legsL: { ik: [0.0, ANK, 0.22], fw: 0.22, toe: 10 }, legsR: rf ? { ik: [-0.02, ANK + 0.045, 0.22], fw: 0.22, foot: 32, toe: -28 } : { ik: [0.0, ANK, 0.22], fw: 0.22, toe: 10, foot: 0 } }; }
    var hi = Object.assign({ hip: [0, 0.95], torso: 0, head: -10, twist: -38 }, lg(false), hands(0.34, 1.6, 0.3, 0.9));
    var md = Object.assign({ hip: [-0.02, 0.9], torso: 14, head: 0, twist: 0 }, lg(false), hands(0.42, 1.18, 0.1, 0.9));
    var lo = Object.assign({ hip: [-0.08, 0.76], torso: 42, head: 12, twist: 40 }, lg(true), hands(0.3, 0.68, -0.3, 0.9));
    variant('woodchop', 'lateralRaise', { p: ['obliques'], s: ['abs', 'delts'], load: 'cableR', stack: true, towerPos: [0.1, 0.95], anchor: [0.1, 2.05, 0.88], A: null, B: null, period: 3000, thumb: 0.45,
      keys: [[0, hi], [0.1, hi], [0.27, md], [0.45, lo], [0.55, lo], [0.78, md], [0.95, hi], [1, hi]], cam: { az: 125, el: 12 } });
  })();

  cam2('woodchop', 40, 12); cam2('pecDeck', 92, 12); cam2('chestPressIncline', 95, 12); cam2('ohpMachine', 92, 10); cam2('lateralRaiseMachine', 100, 12); cam2('reverseFlyMachine', -120, 14);

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
    var ch = Object.assign({}, b, { arms: { ik: relIk(b, [0.17, -0.15]), gw: 0.27, pole: [-1, 0.5, 0.4], palm: 'pro' } }); // la barra toca la parte baja del pecho
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
    var s0 = shoAt(b), top = relIk(b, [0.12, -0.12]); // las mancuernas llegan a la altura de las costillas sin llevar el codo demasiado atrás
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
  variant('deadHang', 'pullup', { p: ['forearms'], s: ['lats', 'deltsR'], B: { hip: [-0.03, 1.34], torso: 0, head: 0 } });
  // Remo sentado a una mano y remo en máquina con pecho apoyado
  variant('seatedRowOneArm', 'seatedRow', { side: 'R', load: 'cableR', anchor: [0.95, 0.8, 0.12],
    A: { armsR: { ik: [0.2, 0.8, 0.12], pole: [-1, -0.4, 0.8], palm: 'neu' }, armsL: { rel: [0.32, -0.3, 0.02], hand: 'flat', flatDir: [1, -0.3, 0] }, arms: null, twist: -10 },
    B: { armsR: { ik: [-0.22, 0.76, 0.2], pole: [-1, -0.4, 0.8], palm: 'neu' }, armsL: { rel: [0.32, -0.3, 0.02], hand: 'flat', flatDir: [1, -0.3, 0] }, arms: null, twist: 12 } });
  variant('seatedRowMachine', 'seatedRow', { load: 'grips', stack: true, scene: ['chestPad'], machinePos: [0.75, -0.55, 0], s: ['deltsR', 'biceps'], cam: { az: 40 },
    A: { hip: [-0.05, 0.52], torso: 6, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { relC: [0.46, -0.1], gw: 0.19, palm: 'neu', pole: [-1, -0.45, 0.6] } },
    B: { hip: [-0.05, 0.52], torso: 6, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { relC: [0.12, -0.25], gw: 0.21, palm: 'neu', pole: [-1, -0.45, 0.6] } } }); // final: manos junto a las costillas bajas, codos atrás
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
    var P0 = hp([-0.34, 0.635], 74, [0.082, 0.225]), P1 = hp([-0.33, 0.84], 74, [0.082, 0.45]), P2 = hp([-0.14, 0.95], 22, [0.05, 0.86]);
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
    A: { hip: [0, 0.165], torso: 89, head: -14, legs: { th: -90, sh: -90, fw: 0.1, foot: 72 }, arms: { ua: 90, fa: 90, palm: [0, -1, 0], gw: 0.25 } },
    B: { hip: [0, 0.165], torso: 76, head: -18, legs: { th: -101, sh: -101, fw: 0.1, foot: 72 }, arms: { ua: 104, fa: 104, palm: [0, -1, 0], gw: 0.25 } } });

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
    var rear = { ik: [-0.6, 0.555], fw: 0.07, foot: 150 }, front = { ik: [0.36, ANK], fw: 0.1 };
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
    variant('nordic', 'legCurl', { load: 'none', stack: false, scene: ['mat'], machinePos: null, boxes: [[-0.45, 0.255, 0, 0.1, 0.5, 0.07, 1]], A: null, B: null, cam: { az: 30, y: 0.4 },
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
    var lg = { ik: [0.36, ANK], fw: 0.15 }, flat = { ik: [0.06, 0.05], gw: 0.27, hand: 'flat', flatDir: [1, 0, 0], pole: [0, 0.4, 1] }; // brazos estirados en el suelo junto al cuerpo
    variant('gluteBridgeBar', 'hipThrust', { scene: ['mat'], load: 'hip', A: { hip: lo.hip, torso: lo.torso, legs: lg }, B: { hip: hi.hip, torso: hi.torso, legs: lg } });
    variant('gluteBridge', 'hipThrust', { scene: ['mat'], load: 'none', A: { hip: lo.hip, torso: lo.torso, legs: lg, arms: flat }, B: { hip: hi.hip, torso: hi.torso, legs: lg, arms: flat } });
    var fr = { ik: [0.2, ANK, 0.035], fw: 0.03, pole: [0, 1, 1], toe: 45 }, hf = bridge([0.03, 0.29], SH0);
    variant('frogPump', 'hipThrust', { scene: ['mat'], load: 'none', s: ['adductors', 'hams'], A: { hip: lo.hip, torso: lo.torso, legs: fr, arms: flat }, B: { hip: hf.hip, torso: hf.torso, legs: fr, arms: flat } });
    // Puente con fitball: talones sobre el balón; la cadera sube y las rodillas traen el balón hacia el glúteo
    var a1 = [0.84, 0.66], a2 = [0.4, 0.52], b1 = bridge([0.04, 0.38], SH0), b2 = bridge([0.06, 0.48], SH0);
    variant('ballLegCurl', 'hipThrust', { scene: ['mat'], load: 'stabBall', p: ['hams'], s: ['glutes', 'calves'], cam: { az: 30, y: 0.4 },
      A: { hip: b1.hip, torso: b1.torso, legs: { ik: a1, fw: 0.1, foot: -58, pole: [0.3, 1, 0.1] }, arms: flat }, B: { hip: b2.hip, torso: b2.torso, legs: { ik: a2, fw: 0.1, foot: -55, pole: [0.3, 1, 0.1] }, arms: flat } });
  })();
  // Hip thrust a una pierna: apoyada la derecha; la izquierda flexionada en el aire
  variant('hipThrustSingle', 'hipThrust', { side: 'R', A: { legs: null, legsR: P.hipThrust.A.legs, legsL: { th: 124, sh: 124, fw: 0.15 }, arms: { ik: [-0.07, 0.48], gw: 0.13, palm: 'pro', pole: [-0.3, 1, 0.5] } }, B: { legs: null, legsR: P.hipThrust.B.legs, legsL: { th: 164, sh: 164, fw: 0.15 }, arms: { ik: [-0.1, 0.82], gw: 0.13, palm: 'pro', pole: [-0.3, 1, 0.5] } } });

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
    var B1 = { hip: [-0.08, 0.44], torso: 72, head: -18, legs: { ik: [0, ANK], fw: 0.15, pole: [1, -0.3, 0.25] }, arms: floor(0.31, 0.24) };
    var B2 = { hip: [-0.08, 0.4], torso: 69, head: -8, legs: LP, arms: floor(0.33) }, B3 = { hip: [-0.03, 0.25], torso: 82, head: -6, legs: LP, arms: floor(0.33) };
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
    var stand = { hip: STAND, torso: 0, legs: LQ }, Do = Object.assign({}, stand, { arms: { ik: relIk(stand, [0.02, 0.52]), gw: 0.22, palm: 'neu', pole: [0, -1, 0.5], straight: 1 } });
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
        return { hip: [0, 0.97], torso: 0, roll: [th, 0, dy, 0, -90], legs: { ik: [0, ANK], fw: 0.07, foot: -14 },
          armsR: { rel: [FA * 0.98, -c * UA * 0.98, s * UA * 0.98], pole: [0, -c, s], palm: [0, 0, 1] }, armsL: { ua: 6, fa: 6, plane: 'f', palm: 'neu' } };
      }
      variant('sidePlank', 'plank', { side: 'R', p: ['obliques'], s: ['abs', 'gluteMed', 'deltsS'], scene: [], cam: { az: 15, el: 12, y: 0.32 }, A: sp(75.5, 0.1), B: sp(76.2, 0.098) });
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
    var P1 = tg([0, 0.145], -90, 0, { ik: [0.84, ANK, 0.3], fw: 0.14, foot: -88 }, RB, lh(-0.28, 0.075, 0.46, 1, [0.5, 0, 1]));
    var P2 = tg([0, 0.145], -58, 22, { ik: [0.84, ANK, 0.3], fw: 0.14, foot: -88 }, RB, Object.assign(lh(-0.24, 0.075, 0.42, 0, [0.4, 0, 1]), { pole: [-0.4, -0.15, 1] }), 8);
    var P3 = tg([0, 0.145], -32, 28, { ik: [0.84, ANK, 0.3], fw: 0.14, foot: -88 }, RB, lh(-0.32, 0.075, 0.4, 1), 8);
    var P4 = tg([0.08, 0.45], -72, 26, { ik: [0.84, ANK, 0.3], fw: 0.14, foot: -70 }, RB, lh(-0.36, 0.075, 0.4, 1), 10);
    var P4b = tg([0.0, 0.43], -70, 22, { ik: [0.0, 0.13, 0.11], fw: 0.14, foot: 20, pole: [0.9, 0.3, 0.6] }, RB, lh(-0.4, 0.075, 0.4, 1), 10);
    var P6 = tg([-0.1, 0.55], 0, 0, { ik: [-0.52, 0.11, 0.13], fw: 0.14, foot: 90, pole: [0.2, -1, 0] }, RB, lh(-0.1, 0.6, 0.28, 0, [0, -1, 0.1]));
    var P6b = tg([0.14, 0.84], 6, 0, { ik: [-0.38, ANK + 0.04, 0.13], fw: 0.14, foot: 45, pole: [0.2, -1, 0] }, RB, lh(0.15, 0.74, 0.25, 0, [0, -1, 0.1]));
    var P7 = tg([0.4, 0.97], 0, 0, { ik: [0.42, ANK, 0.13], fw: 0.14, foot: 0 }, { ik: [0.42, ANK, 0.13], fw: 0.14, foot: 0 }, lh(0.42, 0.87, 0.24, 0, [0, -1, 0.1]));
    variant('turkishGetUp', 'swing', { load: 'kb', kbHand: ['R', 'rack'], scene: ['mat'], p: ['deltsF', 'abs', 'glutes'], s: ['obliques', 'deltsS', 'triceps', 'quads'], A: null, B: null, thumb: 0.32, period: 9000, cam: { az: 25, y: 0.6 },
      keys: [[0, P1], [0.06, P1], [0.14, P2], [0.22, P3], [0.3, P4], [0.37, P4b], [0.45, P6], [0.52, P6b], [0.58, P7], [0.64, P7], [0.7, P6b], [0.76, P6], [0.83, P4b], [0.88, P4], [0.93, P3], [0.97, P2], [1, P1]] });
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
  // Aperturas en máquina con brazos estirados (pec deck de asas): codos apenas flexionados, las asas verticales se juntan delante del pecho
  variant('pecDeckFly', 'pecDeck', { pecPads: false, pecHandles: true,
    A: { arms: { relC: [-0.04, -0.03], gw: 0.66, pole: [-0.3, -1, 0.1], palm: 'neu', straight: 0.85 } },
    B: { arms: { relC: [0.48, -0.03], gw: 0.075, pole: [-0.3, -1, 0.1], palm: 'neu', straight: 0.85 } } });
  cam2('pecDeckFly', 92, 12);
  // ---------------- Dominadas diferenciadas ----------------
  (function () {
    function grip(k, gw, palm, pole, y) { eachArm(k, function (a) { a.gw = gw; a.palm = palm; a.pole = pole; if (y) a.ik = [a.ik[0], y]; return a; }); }
    // Supinas (chin-up): agarre al ancho de hombros, palmas hacia la cara y codos por delante; se ve de frente
    variant('chinup', 'pullup', { s: ['biceps', 'deltsR', 'traps'], cam: { az: 35, el: 8 } }); grip('chinup', 0.17, 'sup', [0.9, -1, 0.35]);
    // Agarre neutro: asas paralelas colgadas de la barra, palmas enfrentadas
    variant('pullupNeutral', 'pullup', { s: ['biceps', 'brachiorad', 'deltsR', 'traps'], cam: { az: 35, el: 8 },
      boxes: [[0.0, 2.133, 0.25, 0.3, 0.027, 0.027, 1], [0.0, 2.133, -0.25, 0.3, 0.027, 0.027, 1], [-0.12, 2.22, 0.25, 0.025, 0.025, 0.09, 1], [0.12, 2.22, 0.25, 0.025, 0.025, 0.09, 1], [-0.12, 2.22, -0.25, 0.025, 0.025, 0.09, 1], [0.12, 2.22, -0.25, 0.025, 0.025, 0.09, 1]] });
    grip('pullupNeutral', 0.25, 'neu', [0.6, -1, 0.5], 2.12);
    // Agarre ancho: manos bastante más abiertas que los hombros, palmas al frente
    variant('pullupWide', 'pullup', { s: ['deltsR', 'traps', 'biceps'], A: { hip: [-0.03, 1.425] } }); // con agarre ancho la cuelga queda más alta grip('pullupWide', 0.55, 'pro', [0, -1, 1]);
    // Lastradas: disco colgado del cinturón (pronas y supinas)
    variant('pullupWeighted', 'pullup', { beltPlate: true });
    variant('chinupWeighted', 'chinup', { beltPlate: true });
    // Supinas asistidas: de rodillas en la plataforma, agarre supino
    variant('chinupAssisted', 'pullupAssisted', { s: ['biceps', 'deltsR', 'traps'], cam: { az: 35, el: 8 } }); grip('chinupAssisted', 0.17, 'sup', [0.9, -1, 0.35]);
  })();
  // ---------------- Pedidos nuevos ----------------
  // Remo en T con pecho apoyado: pecho en el banco inclinado, agarre neutro cerrado en la palanca, codos pegados hacia atrás
  (function () {
    var C = P.chestSupportedRow, A0 = C.A.arms.ik, B0 = C.B.arms.ik;
    variant('tbarChestRow', 'chestSupportedRow', { load: 'landmine', minePivot: [-1.6, 0.07, 0], mineBoth: true, mineOver: 0.5, minePlateR: 0.1, bakeBar: false,
      A: { arms: { ik: [A0[0], A0[1], 0.16], palm: 'neu', pole: [-1, 0.6, 0.3] } }, B: { arms: { ik: [B0[0] + 0.04, B0[1] - 0.1, 0.17], palm: 'neu', pole: [-1, 0.6, 0.3] } } }); // asas por fuera del cojín y el tirón termina bajo él
  })();
  // Elevación de piernas / rodillas en paralelas (silla del capitán): antebrazos en las almohadillas, espalda contra el respaldo
  (function () {
    var cc = { hip: [-0.03, 1.12], torso: -3, head: 0, arms: { ua: 0, fa: 90, palm: 'neu' } };
    var sc = { scene: [], p: ['hipFlex', 'abs'], s: ['obliques', 'quads'], cam: { az: 40 },
      boxes: [[0.1, 1.243, 0.21, 0.36, 0.09, 0.05], [0.1, 1.243, -0.21, 0.36, 0.09, 0.05], [-0.205, 1.55, 0, 0.05, 0.34, 0.52], [0.27, 1.33, 0.21, 0.03, 0.03, 0.12, 1], [0.27, 1.33, -0.21, 0.03, 0.03, 0.12, 1],
        [-0.25, 1.6, 0.3, 0.06, 0.06, 0, 1], [-0.25, 1.6, -0.3, 0.06, 0.06, 0, 1], [0.0, 1.21, 0.3, 0.5, 0.05, 0.04, 1], [0.0, 1.21, -0.3, 0.5, 0.05, 0.04, 1]] };
    variant('captainLegRaise', 'hangLeg', Object.assign({}, sc, { A: Object.assign({ legs: { th: 3, sh: 2, footRel: 20 } }, cc), B: Object.assign({ legs: { th: 90, sh: 90, footRel: 20 } }, cc) }));
    variant('captainKneeRaise', 'hangLeg', Object.assign({}, sc, { A: Object.assign({ legs: { th: 3, sh: 2, footRel: 20 } }, cc), B: Object.assign({ legs: { th: 104, sh: 14, footRel: 20 } }, cc) }));
  })();
  // Flexión lateral con mancuerna: de pie, la mancuerna en la mano derecha; el tronco se inclina hacia ella y sube hasta pasar algo del centro
  variant('sideBendDb', 'lateralRaise', { load: 'handR', side: 'L', p: ['obliques'], s: ['abs', 'lowback'], stack: false, cam: { az: 85, el: 8 },
    A: { hip: STAND, torso: 0, lean: -7, legs: { ik: [0, ANK], fw: 0.14 }, armsR: { rel: [0.02, HANG, 0.06], palm: 'neu' }, armsL: { rel: [0.09, -0.3, -0.04], palm: 'neu', pole: [-1, 0, 0.3] }, arms: null },
    B: { hip: STAND, torso: 0, lean: 28, legs: { ik: [0, ANK], fw: 0.14 }, armsR: { rel: [0.02, HANG, 0.06], palm: 'neu' }, armsL: { rel: [0.09, -0.3, -0.04], palm: 'neu', pole: [-1, 0, 0.3] }, arms: null } });

  // lote variants_b8.js
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

  // lote variants_b9.js
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
      var F0 = hh(0.24, 1.52, 0), R0 = hh(0.02, 1.63, 0.24), B0 = hh(-0.24, 1.56, 0), L0 = hh(0.02, 1.63, -0.24);
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
      A: { hip: [0.04, 0.24], torso: -20, legs: { ik: [0.5, ANK], fw: 0.13 }, arms: { ik: [-0.2, 0.092], gw: 0.22, hand: 'flat', flatDir: [0.25, 0, 0.97], pole: [-1, 0.2, 0.3], straight: 1 } },
      B: { hip: [-0.02, 0.17], torso: -18, legs: { ik: [0.5, ANK], fw: 0.13 }, arms: { ik: [-0.2, 0.092], gw: 0.22, hand: 'flat', flatDir: [0.25, 0, 0.97], pole: [-1, 0.2, 0.3] } } });
  })();
  // Remo al mentón con mancuernas: las mancuernas suben por delante y algo separadas del cuerpo
  variant('uprightRowDb', 'uprightRow', { load: 'hands', A: { arms: { rel: [0.1, HANG, 0.0], pole: [-0.2, 0.6, 1.4], palm: 'pro' } }, B: { arms: { rel: [0.2, -0.08, 0.04], pole: [-0.5, 0.75, 1.5], palm: 'pro' } } });

  // lote variants_b10.js
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

  // lote variants_b11.js
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

  // lote variants_b12.js
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
