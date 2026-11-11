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
    A: { hip: STAND, torso: 0, lean: -7, legs: { ik: [0, ANK], fw: 0.14 }, armsR: { rel: [0.02, HANG, 0.06], palm: 'neu' }, armsL: { rel: [0.04, -0.3, -0.04], palm: 'neu', pole: [-1, 0, 0.3] }, arms: null },
    B: { hip: STAND, torso: 0, lean: 28, legs: { ik: [0, ANK], fw: 0.14 }, armsR: { rel: [0.02, HANG, 0.06], palm: 'neu' }, armsL: { rel: [0.04, -0.3, -0.04], palm: 'neu', pole: [-1, 0, 0.3] }, arms: null } });
