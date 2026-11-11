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
