
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
