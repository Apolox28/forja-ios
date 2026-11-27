  // ================= Lote 13: ejercicios nuevos (parte A) =================
  (function () {
    function kmap(k, fn) { P[k].keys = P[k].keys.map(function (kv) { var p = cloneP(kv[1]); ['arms', 'armsL', 'armsR'].forEach(function (n) { if (p[n]) p[n] = fn(cloneP(p[n]), n, p); }); return [kv[0], p]; }); }
    // Press de banca con pausa: la barra se detiene un segundo sobre el pecho antes de subir
    var BA = P.bench.A, BB = P.bench.B;
    variant('benchPause', 'bench', { A: null, B: null, period: 4200, keys: [[0, BA], [0.32, BB], [0.58, BB], [0.86, BA], [1, BA]] });
    // Flexiones con agarre ancho: manos bien por fuera de los hombros, más pectoral
    variant('pushupWide', 'pushup', { s: ['deltsF', 'pecsU'], A: { hip: [-0.08, 0.405] }, B: { hip: [-0.03, 0.255] } }); eachArm('pushupWide', function (a) { a.gw = 0.38; return a; });
    // Remo Yates: tronco más erguido (unos 45º) y agarre supino; la barra sube al abdomen bajo
    variant('rowYates', 'row', { p: ['lats', 'traps'], s: ['biceps', 'deltsR'],
      A: { hip: [-0.13, 0.9], torso: 42, head: -14, arms: { ik: [0.2, 0.68], gw: 0.25, pole: [-1, 0.4, 0.4], palm: 'sup' } },
      B: { hip: [-0.13, 0.9], torso: 42, head: -14, arms: { ik: [0.02, 0.88], gw: 0.25, pole: [-1, 0.4, 0.4], palm: 'sup' } } });
    // Peso muerto con agarre de arrancada: manos muy abiertas
    variant('deadliftSnatchGrip', 'deadlift', { s: ['traps', 'hams', 'lowback', 'forearms'] }); kmap('deadliftSnatchGrip', function (a) { a.gw = 0.37; return a; });
    P.deadliftSnatchGrip.keys = P.deadliftSnatchGrip.keys.map(function (kv) { var p = cloneP(kv[1]); if (p.hip) { var dr = 0.035; p.torso = (p.torso || 0) - 4 * Math.max(0, Math.min(1, (0.97 - p.hip[1]) / 0.35)); p.hip = [p.hip[0], p.hip[1] - dr]; } return [kv[0], p]; });
    // Curl predicador inverso: agarre prono, trabaja el braquiorradial
    variant('preacherCurlRev', 'preacherCurl', { p: ['brachiorad', 'biceps'], s: ['forearmExt'] }); eachArm('preacherCurlRev', function (a) { a.palm = 'pro'; return a; });
    // Curl martillo inclinado: tumbado en el banco inclinado, palmas enfrentadas
    variant('curlInclineHammer', 'curlIncline', { p: ['brachiorad', 'biceps'] }); eachArm('curlInclineHammer', function (a) { a.palm = 'neu'; return a; });
    // Giros rusos con disco: el disco sujeto por los lados
    variant('russianTwistPlate', 'russianTwist', { load: 'plate', plateAtHands: 'grip' });
    // Swing con mancuerna: una mancuerna en vertical sujeta con las dos manos
    variant('swingDb', 'swing', { load: 'goblet' });
    // Pallof con banda: la banda anclada a la izquierda a la altura del pecho
    variant('pallofBand', 'pallof', { load: 'none', stack: false, towerPos: null, anchor: null, bands: [['handL', [0.05, 1.2, -1.0]], ['handR', [0.05, 1.2, -1.0]]] });
    // Leñador con banda: de arriba a la izquierda hacia abajo a la derecha, banda anclada en alto
    variant('woodchopBand', 'woodchop', { load: 'none', stack: false, towerPos: null, anchor: null, bands: [['handL', [0.1, 2.0, -0.9]], ['handR', [0.1, 2.0, -0.9]]] });
    // Sentadilla frontal en Smith: la barra guiada por la Smith sobre los hombros
    variant('frontSquatSmith', 'frontSquatBar', { smith: true, stack: false });
    // Pullover con barra: la barra sujeta con agarre prono al ancho de los hombros
    variant('pulloverBar', 'pullover', { load: 'bar', bakeBar: true }); eachArm('pulloverBar', function (a) { a.palm = 'pro'; return a; });
  })();
