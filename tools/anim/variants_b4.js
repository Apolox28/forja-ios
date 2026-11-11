
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
    var lg = { ik: [0.36, ANK], fw: 0.15 }, flat = { ik: [0.06, 0.05], gw: 0.27, hand: 'flat', flatDir: [1, 0, 0], pole: [0, 0.4, 1] }; // brazos estirados en el suelo junto al cuerpo
    variant('gluteBridgeBar', 'hipThrust', { scene: ['mat'], load: 'hip', A: { hip: lo.hip, torso: lo.torso, legs: lg }, B: { hip: hi.hip, torso: hi.torso, legs: lg } });
    variant('gluteBridge', 'hipThrust', { scene: ['mat'], load: 'none', A: { hip: lo.hip, torso: lo.torso, legs: lg, arms: flat }, B: { hip: hi.hip, torso: hi.torso, legs: lg, arms: flat } });
    var fr = { ik: [0.2, ANK, 0.035], fw: 0.03, pole: [0, 0.4, 1], toe: 55 }, hf = bridge([0.03, 0.29], SH0);
    variant('frogPump', 'hipThrust', { scene: ['mat'], load: 'none', s: ['adductors', 'hams'], A: { hip: lo.hip, torso: lo.torso, legs: fr, arms: flat }, B: { hip: hf.hip, torso: hf.torso, legs: fr, arms: flat } });
    // Puente con fitball: talones sobre el balón; la cadera sube y las rodillas traen el balón hacia el glúteo
    var a1 = [0.84, 0.66], a2 = [0.4, 0.52], b1 = bridge([0.04, 0.38], SH0), b2 = bridge([0.06, 0.48], SH0);
    variant('ballLegCurl', 'hipThrust', { scene: ['mat'], load: 'stabBall', p: ['hams'], s: ['glutes', 'calves'], cam: { az: 30, y: 0.4 },
      A: { hip: b1.hip, torso: b1.torso, legs: { ik: a1, fw: 0.1, foot: -58, pole: [0.3, 1, 0.1] }, arms: flat }, B: { hip: b2.hip, torso: b2.torso, legs: { ik: a2, fw: 0.1, foot: -55, pole: [0.3, 1, 0.1] }, arms: flat } });
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
