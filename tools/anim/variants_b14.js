  // ================= Lote 14: ejercicios nuevos (parte B) =================
  (function () {
    // Press guillotina: agarre ancho, codos muy abiertos y la barra baja hacia la base del cuello
    variant('benchGuillotine', 'bench', { p: ['pecsU', 'pecs'], s: ['deltsF', 'triceps'],
      A: { arms: { ik: [-0.33, 0.98], gw: 0.36, palm: 'pro', pole: [0, -1, 0.9] } }, B: { arms: { ik: [-0.33, 0.74], gw: 0.36, palm: 'pro', pole: [0, -1, 0.9] } } });
    // Rotación externa en polea: el codo pegado al costado y a 90º; el antebrazo gira hacia fuera contra la polea de la izquierda
    variant('extRotCable', 'lateralRaise', { side: 'R', load: 'cableR', stack: true, towerPos: [0.05, -0.95], anchor: [0.05, 1.0, -0.88], p: ['deltsR'], s: ['deltsS', 'traps'], cam: { az: 40 },
      A: { arms: null, armsR: { rel: [0.27, -0.28, -0.02], palm: 'neu', pole: [-0.3, -1, 0.1] }, armsL: { rel: [0.02, HANG, 0.05], palm: 'neu' } },
      B: { arms: null, armsR: { rel: [0.1, -0.28, 0.24], palm: 'neu', pole: [-0.3, -1, 0.1] }, armsL: { rel: [0.02, HANG, 0.05], palm: 'neu' } } });
    // Press Z: sentado en el suelo con las piernas estiradas al frente; press de la barra sin apoyo de espalda
    var ZL = { th: 90, sh: 90, fw: 0.15, footRel: 10 };
    variant('ohpZ', 'ohp', { stack: false, scene: ['mat'], s: ['deltsS', 'triceps', 'abs'], cam: { az: 40, y: 0.5 },
      A: { hip: [0, 0.13], torso: 0, legs: ZL, arms: { ik: [0.1, 0.6], gw: 0.27, pole: [0.4, -1, 0.5], palm: 'pro' } },
      B: { hip: [0, 0.13], torso: -2, legs: ZL, arms: { ik: [0.0, 1.06], gw: 0.27, pole: [0.4, -1, 0.5], palm: 'pro' } } });
    // Paseo de maleta: una sola mancuerna en la mano derecha; el tronco no se inclina hacia ella
    variant('suitcaseCarry', 'walk', { load: 'handR', side: 'R', both: ['forearms'], p: ['obliques', 'forearms'], s: ['traps', 'glutes', 'abs'] });
    // Sentadilla cosaca: zancada lateral muy profunda; la pierna estirada con la punta hacia arriba
    variant('cossackSquat', 'lateralLungeBW', { p: ['quads', 'adductors', 'glutes'], s: ['hams'] });
    P.cossackSquat.keys = P.cossackSquat.keys.map(function (kv, i) { var p = cloneP(kv[1]); if (i === 3 || i === 4) { p.hip = [p.hip[0], p.hip[1] - 0.08].concat(p.hip.slice(2)); p.torso = (p.torso || 0) + 6; } return [kv[0], p]; });
    // Puente de glúteos con banda: mini banda por encima de las rodillas, se empujan hacia fuera
    variant('gluteBridgeBand', 'gluteBridge', { bands: [['kneeL', 'kneeR']], p: ['glutes', 'gluteMed'], s: ['hams'] });
    // Plancha con elevación de pierna: en plancha de antebrazos, sube una pierna estirada y luego la otra
    (function () {
      var base = P.plank.A, dn = { ik: [-1.17, 0.207], fw: 0.1, foot: 65, pole: [0, -1, 0] }, up = { ik: [-1.13, 0.42], fw: 0.1, foot: 40, pole: [0, -1, 0] };
      function pl(l, r) { return Object.assign({}, base, { legs: null, legsL: l, legsR: r }); }
      variant('plankLegLift', 'plank', { p: ['abs', 'glutes'], s: ['lowback', 'deltsF'], A: null, B: null, period: 3600, cam: { az: 30, y: 0.35 },
        keys: [[0, pl(dn, dn)], [0.2, pl(dn, up)], [0.4, pl(dn, dn)], [0.5, pl(dn, dn)], [0.7, pl(up, dn)], [0.9, pl(dn, dn)], [1, pl(dn, dn)]] });
    })();
    // Saltos con rodillas al pecho: salto vertical explosivo llevando las rodillas al pecho en el aire
    (function () {
      var K = P.jumpSquat.keys.map(function (kv) { return [kv[0], cloneP(kv[1])]; });
      var T = Object.assign({}, K[2][1], { hip: [0.0, 1.24], torso: 4, legs: { ik: [0.1, 0.74], fw: 0.15, foot: 30 }, arms: { rel: [0.3, -0.25, 0.1], palm: 'neu' } });
      K[2] = [K[2][0], T];
      variant('tuckJump', 'jumpSquat', { p: ['quads', 'glutes', 'hipFlex'], s: ['calves', 'abs'], keys: K });
    })();
    // Lanzamiento rotacional de balón medicinal: de lado a la pared, carga el balón junto a la cadera derecha y lo lanza girando
    (function () {
      var lg = { ik: [0.0, ANK], fw: 0.22 };
      function th(tw, rc) { return { hip: [-0.05, 0.9], torso: 8, twist: tw, legs: lg, arms: { relC: rc, gw: 0.12, palm: 'neu', pole: [0, -1, 0.4] } }; }
      var W = th(40, [0.26, -0.3]), M = th(0, [0.4, -0.12]), Th = th(-38, [0.55, -0.02]);
      variant('mbRotThrow', 'swing', { load: 'medball', p: ['obliques'], s: ['abs', 'deltsF', 'glutes'], A: null, B: null, period: 2200, cam: { az: 70 },
        keys: [[0, W], [0.18, W], [0.36, M], [0.48, Th], [0.6, Th], [0.82, M], [1, W]] });
    })();
  })();
