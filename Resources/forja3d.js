// Forja 3D (v3) — animaciones de ejercicios con three.js
// FORJA3D.createStage(pattern, equipment, muscleOverride) -> { scene, camera, update(phase) }
// FORJA3D.mount(canvas, pattern, equipment, opts)   (animación en bucle)
(function (global) {
  'use strict';
  var T = global.THREE;
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;

  // ---------------------------------------------------------------------------
  //  Medidas (metros)
  // ---------------------------------------------------------------------------
  // Medidas tomadas del esqueleto del modelo (escala: cadera a 0,97 m)
  var SPINE = 0.4038, SHO_F = -0.0354, UA = 0.2228, FAW = 0.2643, GRIP = 0.066, FA = FAW + GRIP, TH = 0.4519, SH = 0.4323;
  var SHO_W = 0.1748, HIP_W = 0.0808, ANK = 0.0883, REACH = UA + FA;
  var Y = new T.Vector3(0, 1, 0);

  function V(x, y, z) { return new T.Vector3(x || 0, y || 0, z || 0); }
  function rad(a) { return a * Math.PI / 180; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); }

  // ---------------------------------------------------------------------------
  //  Cinemática
  // ---------------------------------------------------------------------------
  function ik(root, target, l1, l2, pole) {
    var d = target.clone().sub(root), dist = clamp(d.length(), 1e-4, l1 + l2 - 1e-4);
    var dn = d.clone().normalize();
    var a = Math.acos(clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1));
    var p = pole.clone().sub(dn.clone().multiplyScalar(pole.dot(dn)));
    if (p.lengthSq() < 1e-6) p = V(0, 1, 0).sub(dn.clone().multiplyScalar(dn.y));
    p.normalize();
    var mid = root.clone().add(dn.clone().multiplyScalar(Math.cos(a) * l1)).add(p.multiplyScalar(Math.sin(a) * l1));
    var end = mid.clone().add(target.clone().sub(mid).normalize().multiplyScalar(l2));
    return [mid, end];
  }
  function dirS(a) { return V(Math.sin(rad(a)), -Math.cos(rad(a)), 0); }          // plano sagital (0 = abajo, + = delante)
  function dirF(a, sg) { return V(0, -Math.cos(rad(a)), sg * Math.sin(rad(a))); } // plano frontal (+ = hacia fuera)
  function footVec(f) { return V(Math.cos(rad(f)), -Math.sin(rad(f)), 0); }        // 0 = plano hacia delante, + = punta abajo
  function footUp(f) { return V(Math.sin(rad(f)), Math.cos(rad(f)), 0); }

  function num(v) { return typeof v === 'boolean' ? (v ? 1 : 0) : v; }
  function mixVal(a, b, t) {
    a = num(a); b = num(b);
    if (typeof a === 'number' && b === undefined) return lerp(a, 0, t);
    if (a === undefined && typeof b === 'number') return lerp(0, b, t);
    if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, t);
    if (Array.isArray(a) && Array.isArray(b)) return a.map(function (v, i) { return mixVal(v, b[i], t); });
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      var r = {}, k;
      for (k in a) r[k] = (k in b) ? mixVal(a[k], b[k], t) : (typeof num(a[k]) === 'number' ? mixVal(a[k], undefined, t) : a[k]);
      for (k in b) if (!(k in r)) r[k] = (typeof num(b[k]) === 'number') ? mixVal(undefined, b[k], t) : b[k];
      return r;
    }
    return t < 0.5 ? a : b;
  }

  function boneFront(a, b, torsoFwd) {
    var d = b.clone().sub(a).normalize();
    var f = V(0, 0, 1).cross(d);
    if (f.lengthSq() < 0.09) f = torsoFwd.clone().sub(d.clone().multiplyScalar(torsoFwd.dot(d)));
    if (f.lengthSq() < 1e-6) f = V(0, 1, 0);
    return f.normalize();
  }

  // Resuelve una postura -> articulaciones 3D
  function solve(f) {
    var j = {};
    var tt = rad(f.torso || 0);
    j.up = V(Math.sin(tt), Math.cos(tt), 0);
    j.fwd = V(Math.cos(tt), -Math.sin(tt), 0);
    j.side = V(0, 0, 1);
    // inclinación lateral del tronco (f.lean, + = hacia la derecha): la columna gira sobre el eje frontal; la pelvis no se inclina
    j.upP = j.up.clone(); // pelvis: no sigue la inclinación lateral
    if (f.lean) { var lr = rad(f.lean); j.up.applyAxisAngle(j.fwd, lr); j.side.applyAxisAngle(j.fwd, lr); }
    // giro del tronco (twist, + = el pecho gira hacia la izquierda): la pelvis no gira
    var twr = rad(f.twist || 0);
    j.fwdT = twr ? j.fwd.clone().applyAxisAngle(j.up, twr) : j.fwd.clone();
    j.sideT = twr ? j.side.clone().applyAxisAngle(j.up, twr) : j.side.clone();
    j.shr = f.shr || 0;
    j.hip = V(f.hip[0] + (f._bOff ? f._bOff[0] : 0), f.hip[1] + (f._bOff ? f._bOff[1] : 0), f.hip[2] || 0);
    j.shoC = j.hip.clone().add(j.up.clone().multiplyScalar(SPINE)).add(j.fwd.clone().multiplyScalar(SHO_F));
    var hu = j.up.clone();
    if (f.head) hu = j.up.clone().multiplyScalar(Math.cos(rad(f.head))).add(j.fwd.clone().multiplyScalar(Math.sin(rad(f.head))));
    j.headUp = hu;
    j.headFwd = V(hu.y, -hu.x, 0);
    if (twr) { j.headUp = hu.clone().applyAxisAngle(j.up, twr * 0.8); j.headFwd = j.headFwd.applyAxisAngle(j.up, twr * 0.8); }
    j.neck = j.shoC.clone().add(j.up.clone().multiplyScalar(0.09)).add(j.fwd.clone().multiplyScalar(0.03));
    j.head = j.neck.clone().add(hu.clone().multiplyScalar(0.15)).add(j.headFwd ? V(0, 0, 0) : V(0, 0, 0));
    j.sho = {}; j.el = {}; j.hand = {}; j.hipJ = {}; j.knee = {}; j.ank = {}; j.toe = {};
    j.footDir = {}; j.footUp = {}; j.palm = {}; j.handDir = {}; j.handMode = {};
    [-1, 1].forEach(function (sg) {
      var k = sg < 0 ? 'L' : 'R';
      j.sho[k] = j.shoC.clone().add(j.sideT.clone().multiplyScalar(sg * SHO_W)).add(V(0, j.shr, 0));
      j.hipJ[k] = j.hip.clone().add(V(0, 0, sg * HIP_W));

      // ---- Brazos ----
      var A = (k === 'L' ? f.armsL : f.armsR) || f.arms || { ua: 0, fa: 0 };
      var sh = j.sho[k], target = null;
      var gw = A.gw != null ? A.gw : 0.24;
      if (A.ik) target = V(A.ik[0], A.ik[1], A.ik.length > 2 ? A.ik[2] * sg : sg * gw);
      else if (A.relC) target = j.shoC.clone().add(j.fwdT.clone().multiplyScalar(A.relC[0])).add(j.up.clone().multiplyScalar(A.relC[1])).add(j.sideT.clone().multiplyScalar(sg * gw));
      else if (A.rel) target = sh.clone().add(V(A.rel[0], A.rel[1], (A.rel[2] || 0) * sg));
      else if (A.temple) target = j.head.clone().add(j.headFwd.clone().multiplyScalar(-0.02)).add(V(0, -0.01, sg * 0.105));
      // desplazamiento precalculado para que la pesa no atraviese el cuerpo
      var hOff = f._hOff && f._hOff[k];
      if (hOff && (Math.abs(hOff[0]) + Math.abs(hOff[1]) + Math.abs(hOff[2])) > 1e-4) {
        if (!target) {
          var dA0 = A.plane === 'f' ? dirF(A.ua, sg) : dirS(A.ua), dB0 = A.plane === 'f' ? dirF(A.fa, sg) : dirS(A.fa);
          target = sh.clone().add(dA0.multiplyScalar(UA)).add(dB0.multiplyScalar(FA));
          if (!A.pole) A = Object.assign({}, A, { pole: [0, -1, 0.35] });
        }
        target = target.clone().add(V(hOff[0], hOff[1], hOff[2]));
      }
      if (target) {
        if (A.straight) {
          var full = sh.clone().add(target.clone().sub(sh).normalize().multiplyScalar(REACH - 0.004));
          target = target.clone().lerp(full, clamp(num(A.straight), 0, 1));
        }
        var pole = A.pole ? V(A.pole[0], A.pole[1], (A.pole[2] || 0) * sg)
          : j.fwd.clone().multiplyScalar(-0.6).add(j.up.clone().multiplyScalar(-1)).add(V(0, 0, sg * 0.35));
        var r = ik(sh, target, UA, FA, pole);
        j.el[k] = r[0]; j.hand[k] = r[1]; j.tgt = j.tgt || {}; j.tgt[k] = { p: target.clone(), straight: !!(A.straight && num(A.straight) > 0.01) };
      } else {
        var dA = A.plane === 'f' ? dirF(A.ua, sg) : dirS(A.ua);
        var dB = A.plane === 'f' ? dirF(A.fa, sg) : dirS(A.fa);
        j.el[k] = sh.clone().add(dA.multiplyScalar(UA));
        j.hand[k] = j.el[k].clone().add(dB.multiplyScalar(FA));
      }
      // Orientación de la mano: palma
      var fd = j.hand[k].clone().sub(j.el[k]).normalize();
      var front = boneFront(j.el[k], j.hand[k], j.fwd);
      var palm;
      var pm = A.palm || 'neu';
      if (Array.isArray(pm)) palm = V(pm[0], pm[1], (pm[2] || 0) * sg);
      else if (pm === 'sup') palm = front.clone();
      else if (pm === 'pro') palm = front.clone().multiplyScalar(-1);
      else if (pm === 'semi') palm = front.clone().multiplyScalar(0.72).add(V(0, 0, -sg * 0.69)); // semisupina (barra Z): entre supina y neutra
      else palm = V(0, 0, -sg); // neutra: palmas hacia el cuerpo
      palm.sub(fd.clone().multiplyScalar(palm.dot(fd)));
      if (palm.lengthSq() < 1e-4) palm = front.clone();
      j.palm[k] = palm.normalize();
      j.handMode[k] = A.hand || 'fist';
      j.wrist = j.wrist || {};
      if (A.wrist && !(A.hand === 'flat')) {
        var wax = fd.clone().cross(j.palm[k]).normalize(), wr = rad(num(A.wrist));
        var hd2 = fd.clone().multiplyScalar(Math.cos(wr)).add(j.palm[k].clone().multiplyScalar(Math.sin(wr))).normalize();
        var pl2 = j.palm[k].clone().multiplyScalar(Math.cos(wr)).sub(fd.clone().multiplyScalar(Math.sin(wr))).normalize();
        var wpt = j.el[k].clone().add(fd.clone().multiplyScalar(FAW));
        j.hand[k] = wpt.clone().add(hd2.clone().multiplyScalar(GRIP));
        j.palm[k] = pl2; j.wrist[k] = hd2;
        if (j.tgt && j.tgt[k]) j.tgt[k].p = j.hand[k].clone(); // la mano gira alrededor de la muñeca
      }
      if (A.hand === 'flat' && A.flatDir) {
        j.handDir[k] = V(A.flatDir[0], A.flatDir[1], (A.flatDir[2] || 0) * sg).normalize();
        j.palm[k] = A.flatPalm ? V(A.flatPalm[0], A.flatPalm[1], (A.flatPalm[2] || 0) * sg).normalize() : V(0, -1, 0); // flatPalm: palma de la mano abierta (por defecto hacia el suelo)
      } else j.handDir[k] = (j.wrist && j.wrist[k]) ? j.wrist[k] : fd;

      // ---- Piernas ----
      var Lg = (k === 'L' ? f.legsL : f.legsR) || f.legs || { th: 0, sh: 0 };
      var hp = j.hipJ[k];
      var fw = Lg.fw != null ? Lg.fw : 0.12;
      var ank = null, fAng = Lg.foot;
      if (Lg.ball) { // apoyo en la bola del pie (gemelos, talón levantado)
        var bf = fAng || 0;
        var ball = V(Lg.ball[0], Lg.ball[1], sg * fw);
        ank = ball.clone().sub(footVec(bf).multiplyScalar(0.13)).add(footUp(bf).multiplyScalar(ANK));
      } else if (Lg.ik) ank = V(Lg.ik[0], Lg.ik[1], Lg.ik.length > 2 ? Lg.ik[2] * sg : sg * fw);
      else if (Lg.rel) ank = hp.clone().add(V(Lg.rel[0], Lg.rel[1], (Lg.rel[2] || 0) * sg));
      if (ank && !Lg.ball && ank.y < ANK) ank.y = ANK;
      if (ank) {
        var kp = Lg.pole ? V(Lg.pole[0], Lg.pole[1], (Lg.pole[2] || 0) * sg) : V(1, 0.15, sg * 0.18);
        // punta del pie abierta: la rodilla sigue la dirección de los dedos
        if (Lg.toe) kp.add(V(0, 0, sg * Math.tan(rad(Lg.toe)) * kp.length()));
        var rl = ik(hp, ank, TH, SH, kp);
        j.knee[k] = rl[0]; j.ank[k] = rl[1];
      } else {
        var tA = Lg.plane === 'f' ? dirF(Lg.th, sg) : dirS(Lg.th);
        var sA = Lg.plane === 'f' ? dirF(Lg.sh, sg) : dirS(Lg.sh);
        j.knee[k] = hp.clone().add(tA.multiplyScalar(TH));
        j.ank[k] = j.knee[k].clone().add(sA.multiplyScalar(SH));
      }
      if (fAng == null && Lg.footRel == null && !Lg.footFlip && j.ank[k].y < 0.14 + (Lg.base || 0)) fAng = 0;
      var footDir, fUp;
      if (Lg.footRel != null) {
        var sd = j.ank[k].clone().sub(j.knee[k]).normalize(), pp = V(-sd.y, sd.x, 0).normalize();
        var a = rad(Lg.footRel);
        footDir = pp.clone().multiplyScalar(Math.cos(a)).add(sd.clone().multiplyScalar(Math.sin(a))).normalize();
        fUp = V(-footDir.y, footDir.x, 0);
      } else if (fAng != null) { footDir = footVec(fAng); fUp = footUp(fAng); }
      else {
        var shin = j.ank[k].clone().sub(j.knee[k]).normalize();
        footDir = V(-shin.y, shin.x, 0);
        if (Lg.footFlip) footDir.multiplyScalar(-1);
        if (footDir.lengthSq() < 1e-6) footDir = V(1, 0, 0);
        footDir.normalize();
        fUp = V(-footDir.y, footDir.x, 0);
        if (Lg.footFlip) fUp.multiplyScalar(-1);
      }
      if (Lg.toe) { footDir = footDir.clone().applyAxisAngle(fUp, -sg * rad(Lg.toe)); }
      // la bola del pie nunca bajo el suelo: si quedaría hundida, el pie gira sobre el tobillo (menos punta) hasta apoyarla
      var onBall = false;
      if (!Lg.ball && j.ank[k].y < 0.3) {
        var bAx = footDir.clone().cross(fUp).normalize(), ballY = function () { return j.ank[k].y + footDir.y * 0.13 - fUp.y * (ANK - 0.012); };
        for (var it = 0; it < 30 && ballY() < 0.0115; it++) { var ry = ballY(); footDir.applyAxisAngle(bAx, rad(2)); fUp.applyAxisAngle(bAx, rad(2)); if (ballY() < ry) { footDir.applyAxisAngle(bAx, rad(-4)); fUp.applyAxisAngle(bAx, rad(-4)); } onBall = true; }
        if (!onBall && footDir.y < -0.3 && ballY() < 0.05) onBall = true;
      }
      j.footDir[k] = footDir; j.footUp[k] = fUp;
      j.ball = j.ball || {}; j.ball[k] = !!Lg.ball || onBall || (fAng != null && fAng > 18 && j.ank[k].y < 0.2); // talón levantado junto al suelo: los dedos se doblan y quedan apoyados
      j.toe[k] = j.ank[k].clone().add(footDir.clone().multiplyScalar(0.17)).add(fUp.clone().multiplyScalar(-ANK + 0.02));
    });
    if (f.roll) { // también con ángulo 0: el desplazamiento se aplica siempre
      var ra = rad(f.roll[0]), ya = rad(f.roll[4] || 0), RY = V(0, 1, 0), RX = V(1, 0, 0), off = V(f.roll[1] || 0, f.roll[2] || 0, f.roll[3] || 0);
      var DIRS = { upP: 1, up: 1, fwd: 1, side: 1, fwdT: 1, sideT: 1, headUp: 1, headFwd: 1, footDir: 1, footUp: 1, palm: 1, handDir: 1, wrist: 1 };
      Object.keys(j).forEach(function (q) {
        var v = j[q], dir = !!DIRS[q];
        var one = function (w) { w.applyAxisAngle(RX, ra); if (!dir) w.add(off); if (ya) w.applyAxisAngle(RY, ya); };
        if (v && v.isVector3) one(v);
        else if (v && typeof v === 'object') Object.keys(v).forEach(function (s2) { if (v[s2] && v[s2].isVector3) one(v[s2]); });
      });
      if (j.tgt) Object.keys(j.tgt).forEach(function (s2) { var p = j.tgt[s2] && j.tgt[s2].p; if (p && p.isVector3) { p.applyAxisAngle(RX, ra); p.add(off); if (ya) p.applyAxisAngle(V(0, 1, 0), ya); } });
    }
    return j;
  }

  // ---------------------------------------------------------------------------
  //  Cuerpo
  // ---------------------------------------------------------------------------
  function radiusAt(knots, s) {
    for (var i = 0; i < knots.length - 1; i++) {
      var a = knots[i], b = knots[i + 1];
      if (s <= b[0]) { var u = (s - a[0]) / (b[0] - a[0]); u = (1 - Math.cos(u * Math.PI)) / 2; return lerp(a[1], b[1], u); }
    }
    return knots[knots.length - 1][1];
  }
  function limbGeo(L, knots) {
    var pts = [], i, r0 = knots[0][1], r1 = knots[knots.length - 1][1];
    for (i = 0; i <= 6; i++) { var a = (Math.PI / 2) * i / 6; pts.push(new T.Vector2(r0 * Math.sin(a), -r0 * Math.cos(a) * 0.8)); }
    for (i = 1; i <= 22; i++) { var s = i / 22; pts.push(new T.Vector2(radiusAt(knots, s), s * L)); }
    for (i = 1; i <= 6; i++) { var b = (Math.PI / 2) * i / 6; pts.push(new T.Vector2(r1 * Math.cos(b), L + r1 * Math.sin(b) * 0.8)); }
    pts[pts.length - 1].x = 0;
    var g = new T.LatheGeometry(pts, 32);
    g.computeVertexNormals();
    return g;
  }
  var SPH = new T.SphereGeometry(1, 36, 26);
  var KN = {
    ua: [[0, 0.052], [0.25, 0.048], [0.6, 0.049], [0.92, 0.04], [1, 0.038]],
    fa: [[0, 0.043], [0.25, 0.046], [0.8, 0.031], [1, 0.027]],
    th: [[0, 0.088], [0.3, 0.08], [0.85, 0.058], [1, 0.053]],
    sh: [[0, 0.052], [0.22, 0.056], [0.75, 0.036], [1, 0.03]],
    neck: [[0, 0.062], [1, 0.052]]
  };
  var MUSCLES = ['pecs', 'pecsU', 'abs', 'lats', 'traps', 'trapsU', 'lowback', 'glutes', 'gluteMed', 'delts', 'deltsF', 'deltsS', 'deltsR', 'biceps', 'triceps', 'forearms', 'brachiorad', 'forearmFlex', 'forearmExt', 'quads', 'hipFlex', 'adductors', 'hams', 'calves', 'soleus', 'tibialis', 'obliques', 'trapsM', 'neck', 'adductorsV', 'quadsV', 'scapV', 'latsV', 'lowbackV', 'absV'];
  var MUSCLE_MAP = { chest: 'pecs', back: 'lats', shoulders: 'delts', biceps: 'biceps', triceps: 'triceps', forearms: 'forearms',
    quads: 'quads', hamstrings: 'hams', glutes: 'glutes', calves: 'calves', core: 'abs' };
  var SKIN = 0xe7e8ec;

  function makeBody(scene, active) {
    var skin = new T.MeshStandardMaterial({ color: SKIN, roughness: 0.55, metalness: 0.0 });
    var skinDark = new T.MeshStandardMaterial({ color: 0xd5d7dd, roughness: 0.6 });
    var mats = {};
    MUSCLES.forEach(function (m) {
      var on = active.p.indexOf(m) >= 0, sec = active.s.indexOf(m) >= 0;
      mats[m] = new T.MeshStandardMaterial({ color: on ? 0xd8262d : (sec ? 0xee8a2e : SKIN), roughness: 0.5,
        emissive: on ? 0x5c0505 : (sec ? 0x2e1300 : 0x000000) });
    });
    var body = { m: {} };
    function add(geo, mat) { var x = new T.Mesh(geo, mat); x.castShadow = true; x.receiveShadow = true; scene.add(x); return x; }
    var uaG = limbGeo(UA, KN.ua), faG = limbGeo(FA - 0.06, KN.fa), thG = limbGeo(TH, KN.th), shG = limbGeo(SH, KN.sh), nkG = limbGeo(0.14, KN.neck);
    var m = body.m;
    ['pelvis', 'waist', 'ribs', 'girdle', 'head', 'jaw', 'chin', 'nose', 'brow', 'earL', 'earR'].forEach(function (n) { m[n] = add(SPH, skin); });
    m.neck = add(nkG, skin);
    m.pecL = add(SPH, mats.pecs); m.pecR = add(SPH, mats.pecs);
    m.abs = [0, 1, 2, 3, 4, 5].map(function () { return add(SPH, mats.abs); });
    m.oblL = add(SPH, mats.abs); m.oblR = add(SPH, mats.abs);
    m.lat = [add(SPH, mats.lats), add(SPH, mats.lats)];
    m.traps = add(SPH, mats.traps); m.lowback = add(SPH, mats.lowback);
    m.gluteL = add(SPH, mats.glutes); m.gluteR = add(SPH, mats.glutes);
    ['L', 'R'].forEach(function (k) {
      m['ua' + k] = add(uaG, skin); m['fa' + k] = add(faG, skin);
      m['delt' + k] = add(SPH, mats.delts); m['bic' + k] = add(SPH, mats.biceps); m['tri' + k] = add(SPH, mats.triceps);
      m['for' + k] = add(SPH, mats.forearms); m['elb' + k] = add(SPH, skin);
      m['palm' + k] = add(SPH, skin); m['fing' + k] = add(SPH, skin); m['knk' + k] = add(SPH, skinDark); m['thumb' + k] = add(SPH, skin);
      m['th' + k] = add(thG, skin); m['sh' + k] = add(shG, skin);
      m['quad' + k] = add(SPH, mats.quads); m['vmo' + k] = add(SPH, mats.quads); m['ham' + k] = add(SPH, mats.hams);
      m['calf' + k] = add(SPH, mats.calves); m['pat' + k] = add(SPH, skin);
      m['heel' + k] = add(SPH, skin); m['arch' + k] = add(SPH, skin); m['toes' + k] = add(SPH, skin);
      m['malL' + k] = add(SPH, skin); m['malR' + k] = add(SPH, skin);
    });
    return body;
  }

  var _m = new T.Matrix4();
  // Elipsoide en un sistema (eje1, eje2, eje3) con radios (r1, r2, r3); los ejes deben ser ortonormales y diestros
  function placeFrame(mesh, pos, a1, a2, a3, r1, r2, r3) {
    _m.makeBasis(a1, a2, a3);
    mesh.quaternion.setFromRotationMatrix(_m);
    mesh.position.copy(pos);
    mesh.scale.set(r1, r2, r3);
  }
  function placeAlong(mesh, a, b) {
    var d = b.clone().sub(a).normalize();
    mesh.position.copy(a); mesh.quaternion.setFromUnitVectors(Y, d); mesh.scale.set(1, 1, 1);
  }
  function onBone(mesh, a, b, s, front, off, rLen, rFront, rSide) {
    var d = b.clone().sub(a), L = d.length(); d.normalize();
    var f = front.clone().sub(d.clone().multiplyScalar(front.dot(d))).normalize();
    var sd = f.clone().cross(d).normalize();
    placeFrame(mesh, a.clone().add(d.clone().multiplyScalar(L * s)).add(f.clone().multiplyScalar(off)), f, d, sd, rFront, rLen, rSide);
  }

  function poseBody(body, j) {
    var m = body.m, up = j.up, fwd = j.fwd, side = j.side;
    function at(base, u, f, s) { return base.clone().add(up.clone().multiplyScalar(u)).add(fwd.clone().multiplyScalar(f)).add(side.clone().multiplyScalar(s || 0)); }
    placeFrame(m.pelvis, at(j.hip, 0.02, -0.005), fwd, up, side, 0.115, 0.105, 0.165);
    placeFrame(m.waist, at(j.hip, 0.18, 0.005), fwd, up, side, 0.105, 0.14, 0.138);
    placeFrame(m.ribs, at(j.hip, 0.34, 0.012), fwd, up, side, 0.128, 0.17, 0.165);
    placeFrame(m.girdle, at(j.hip, 0.45 + j.shr * 0.5, 0.0), fwd, up, side, 0.105, 0.075, 0.2);
    // cabeza
    var hu = j.headUp, hf = j.headFwd, hd = j.head;
    placeAlong(m.neck, at(j.shoC, -0.02, -0.012), hd.clone().add(hu.clone().multiplyScalar(-0.06)));
    placeFrame(m.head, hd, hf, hu, side, 0.095, 0.115, 0.085);
    placeFrame(m.jaw, hd.clone().add(hu.clone().multiplyScalar(-0.06)).add(hf.clone().multiplyScalar(0.03)), hf, hu, side, 0.065, 0.05, 0.065);
    placeFrame(m.chin, hd.clone().add(hu.clone().multiplyScalar(-0.095)).add(hf.clone().multiplyScalar(0.07)), hf, hu, side, 0.03, 0.025, 0.035);
    placeFrame(m.nose, hd.clone().add(hf.clone().multiplyScalar(0.093)).add(hu.clone().multiplyScalar(-0.015)), hf, hu, side, 0.02, 0.032, 0.014);
    placeFrame(m.brow, hd.clone().add(hf.clone().multiplyScalar(0.075)).add(hu.clone().multiplyScalar(0.03)), hf, hu, side, 0.022, 0.016, 0.07);
    placeFrame(m.earL, hd.clone().add(side.clone().multiplyScalar(-0.085)), hf, hu, side, 0.02, 0.032, 0.012);
    placeFrame(m.earR, hd.clone().add(side.clone().multiplyScalar(0.085)), hf, hu, side, 0.02, 0.032, 0.012);
    // torso
    placeFrame(m.pecL, at(j.hip, 0.4, 0.098, -0.082), fwd, up, side, 0.048, 0.075, 0.095);
    placeFrame(m.pecR, at(j.hip, 0.4, 0.098, 0.082), fwd, up, side, 0.048, 0.075, 0.095);
    for (var i = 0; i < 6; i++) {
      var row = Math.floor(i / 2), sg = i % 2 ? 1 : -1;
      placeFrame(m.abs[i], at(j.hip, 0.29 - row * 0.072, 0.09, sg * 0.038), fwd, up, side, 0.02, 0.031, 0.035);
    }
    placeFrame(m.oblL, at(j.hip, 0.2, 0.035, -0.115), fwd, up, side, 0.05, 0.11, 0.035);
    placeFrame(m.oblR, at(j.hip, 0.2, 0.035, 0.115), fwd, up, side, 0.05, 0.11, 0.035);
    placeFrame(m.lat[0], at(j.hip, 0.33, -0.035, -0.14), fwd, up, side, 0.065, 0.15, 0.055);
    placeFrame(m.lat[1], at(j.hip, 0.33, -0.035, 0.14), fwd, up, side, 0.065, 0.15, 0.055);
    placeFrame(m.traps, at(j.shoC, 0.035 + j.shr * 0.7, -0.04), fwd, up, side, 0.055, 0.065 + j.shr * 0.6, 0.15);
    placeFrame(m.lowback, at(j.hip, 0.13, -0.08), fwd, up, side, 0.04, 0.1, 0.1);
    placeFrame(m.gluteL, at(j.hip, -0.025, -0.07, -0.072), fwd, up, side, 0.08, 0.09, 0.08);
    placeFrame(m.gluteR, at(j.hip, -0.025, -0.07, 0.072), fwd, up, side, 0.08, 0.09, 0.08);

    ['L', 'R'].forEach(function (k) {
      var sg = k === 'L' ? -1 : 1;
      var sh = j.sho[k], el = j.el[k], gr = j.hand[k];
      placeAlong(m['ua' + k], sh, el);
      var fdir = gr.clone().sub(el).normalize();
      var wrist = el.clone().add(fdir.clone().multiplyScalar(FA - 0.065));
      placeAlong(m['fa' + k], el, wrist);
      // deltoide
      var outv = V(0, 0, sg), ad = el.clone().sub(sh).normalize();
      var dpos = sh.clone().add(outv.clone().multiplyScalar(0.025)).add(ad.clone().multiplyScalar(0.035)).add(V(0, 0.005, 0));
      var a2 = ad.clone(), a1 = outv.clone().sub(a2.clone().multiplyScalar(outv.dot(a2)));
      if (a1.lengthSq() < 1e-4) a1 = fwd.clone(); a1.normalize();
      placeFrame(m['delt' + k], dpos, a1, a2, a1.clone().cross(a2).normalize(), 0.07, 0.085, 0.072);
      var af = boneFront(sh, el, fwd);
      onBone(m['bic' + k], sh, el, 0.58, af, 0.02, 0.095, 0.032, 0.037);
      onBone(m['tri' + k], sh, el, 0.45, af, -0.022, 0.12, 0.031, 0.039);
      onBone(m['elb' + k], sh, el, 1.0, af, -0.028, 0.03, 0.022, 0.026);
      var ff = boneFront(el, gr, fwd);
      onBone(m['for' + k], el, wrist, 0.28, ff, 0.012, 0.1, 0.033, 0.039);
      // mano: palma, dedos, nudillos y pulgar
      var hdv = j.handDir[k], n = j.palm[k].clone();
      n.sub(hdv.clone().multiplyScalar(n.dot(hdv))).normalize();
      var kx = hdv.clone().cross(n).normalize();
      var flat = j.handMode[k] === 'flat';
      var a1h = n, a2h = hdv, a3h = n.clone().cross(hdv).normalize();
      placeFrame(m['palm' + k], wrist.clone().add(hdv.clone().multiplyScalar(0.045)), a1h, a2h, a3h, 0.019, 0.05, 0.042);
      if (flat) {
        placeFrame(m['fing' + k], wrist.clone().add(hdv.clone().multiplyScalar(0.125)), a1h, a2h, a3h, 0.012, 0.05, 0.041);
        placeFrame(m['knk' + k], wrist.clone().add(hdv.clone().multiplyScalar(0.085)).add(n.clone().multiplyScalar(-0.006)), a1h, a2h, a3h, 0.014, 0.016, 0.043);
      } else {
        placeFrame(m['fing' + k], wrist.clone().add(hdv.clone().multiplyScalar(0.088)).add(n.clone().multiplyScalar(0.02)), a1h, a2h, a3h, 0.03, 0.03, 0.042);
        placeFrame(m['knk' + k], wrist.clone().add(hdv.clone().multiplyScalar(0.09)).add(n.clone().multiplyScalar(-0.008)), a1h, a2h, a3h, 0.016, 0.019, 0.044);
      }
      var thumbSide = sg;
      var tdir = hdv.clone().add(n.clone().multiplyScalar(flat ? 0.1 : 0.9)).add(kx.clone().multiplyScalar(thumbSide * (flat ? 0.6 : 0.2))).normalize();
      var tpos = wrist.clone().add(hdv.clone().multiplyScalar(0.04)).add(kx.clone().multiplyScalar(thumbSide * 0.04)).add(n.clone().multiplyScalar(0.018));
      var t1 = n.clone().sub(tdir.clone().multiplyScalar(n.dot(tdir))).normalize();
      placeFrame(m['thumb' + k], tpos.clone().add(tdir.clone().multiplyScalar(0.018)), t1, tdir, t1.clone().cross(tdir).normalize(), 0.012, 0.034, 0.013);

      // piernas
      var hp = j.hipJ[k], kn = j.knee[k], an = j.ank[k];
      placeAlong(m['th' + k], hp, kn);
      placeAlong(m['sh' + k], kn, an);
      var tf = boneFront(hp, kn, fwd);
      onBone(m['quad' + k], hp, kn, 0.45, tf, 0.026, 0.2, 0.05, 0.066);
      onBone(m['vmo' + k], hp, kn, 0.8, tf.clone().add(V(0, 0, -sg * 0.8)).normalize(), 0.024, 0.065, 0.032, 0.036);
      onBone(m['ham' + k], hp, kn, 0.5, tf, -0.028, 0.18, 0.045, 0.062);
      var sf = boneFront(kn, an, fwd);
      onBone(m['calf' + k], kn, an, 0.28, sf, -0.022, 0.12, 0.037, 0.046);
      onBone(m['pat' + k], hp, kn, 1.0, tf, 0.04, 0.035, 0.022, 0.035);
      // pie: talón, arco y dedos
      var fdv = j.footDir[k], fu = j.footUp[k], fz = fdv.clone().cross(fu).normalize();
      placeFrame(m['heel' + k], an.clone().add(fu.clone().multiplyScalar(-0.045)).add(fdv.clone().multiplyScalar(-0.025)), fdv, fu, fz, 0.04, 0.035, 0.036);
      placeFrame(m['arch' + k], an.clone().add(fu.clone().multiplyScalar(-0.045)).add(fdv.clone().multiplyScalar(0.06)), fdv, fu, fz, 0.085, 0.032, 0.043);
      placeFrame(m['toes' + k], an.clone().add(fu.clone().multiplyScalar(-0.058)).add(fdv.clone().multiplyScalar(0.145)), fdv, fu, fz, 0.04, 0.02, 0.044);
      placeFrame(m['malL' + k], an.clone().add(fz.clone().multiplyScalar(-0.03)), fdv, fu, fz, 0.018, 0.022, 0.016);
      placeFrame(m['malR' + k], an.clone().add(fz.clone().multiplyScalar(0.03)), fdv, fu, fz, 0.018, 0.022, 0.016);
    });
  }

  // ---------------------------------------------------------------------------
  //  Equipamiento
  // ---------------------------------------------------------------------------
  var MAT = {};
  function mats() {
    if (MAT.metal) return MAT;
    MAT.metal = new T.MeshStandardMaterial({ color: 0xb8c0cc, roughness: 0.28, metalness: 0.85 });
    MAT.frame = new T.MeshStandardMaterial({ color: 0x343a46, roughness: 0.5, metalness: 0.45 });
    MAT.frameLight = new T.MeshStandardMaterial({ color: 0x4a5262, roughness: 0.45, metalness: 0.5 });
    MAT.plate = new T.MeshStandardMaterial({ color: 0x23262d, roughness: 0.55, metalness: 0.2 });
    MAT.plateRim = new T.MeshStandardMaterial({ color: 0x3a3f49, roughness: 0.4, metalness: 0.4 });
    MAT.pad = new T.MeshStandardMaterial({ color: 0x262b35, roughness: 0.85 });
    MAT.stack = new T.MeshStandardMaterial({ color: 0x8f97a5, roughness: 0.35, metalness: 0.7 });
    MAT.cable = new T.MeshStandardMaterial({ color: 0xdfe3ea, roughness: 0.4 });
    MAT.mat = new T.MeshStandardMaterial({ color: 0x2c5b88, roughness: 0.9 });
    MAT.belt = new T.MeshStandardMaterial({ color: 0x15171b, roughness: 0.95 });
    MAT.rubber = new T.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.9 });
    MAT.accent = new T.MeshStandardMaterial({ color: 0xff8a3d, roughness: 0.5 });
    return MAT;
  }
  function shadowOn(m) { m.castShadow = true; m.receiveShadow = true; return m; }
  function box(parent, w, h, d, mat, x, y, z) { var m = shadowOn(new T.Mesh(new T.BoxGeometry(w, h, d), mat)); m.position.set(x, y, z); parent.add(m); return m; }
  function cyl(parent, r, h, mat, seg) { var m = shadowOn(new T.Mesh(new T.CylinderGeometry(r, r, h, seg || 24), mat)); parent.add(m); return m; }
  function cylX(parent, r, len, mat, x, y, z) { var c = cyl(parent, r, len, mat); c.rotation.z = Math.PI / 2; c.position.set(x, y, z); return c; }
  function cylZ(parent, r, len, mat, x, y, z) { var c = cyl(parent, r, len, mat); c.rotation.x = Math.PI / 2; c.position.set(x, y, z); return c; }
  function segment(mesh, a, b) {
    var d = b.clone().sub(a), L = d.length();
    mesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(Y, d.normalize());
    mesh.scale.set(1, Math.max(L, 1e-4), 1);
  }
  function beam(parent, a, b, w, mat) { var m = box(parent, w, 1, w, mat, 0, 0, 0); segment(m, a, b); return m; }
  function cableMesh(parent) { var m = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, 1, 8), mats().cable); parent.add(m); return m; }

  function barbell(parent) {
    var g = new T.Group(), M = mats();
    cylZ(g, 0.015, 2.1, M.metal, 0, 0, 0);
    [-1, 1].forEach(function (sg) {
      [0.64, 0.7].forEach(function (z) {
        cylZ(g, 0.225, 0.045, M.plate, 0, 0, sg * z).geometry = new T.CylinderGeometry(0.225, 0.225, 0.045, 48);
        var rim = new T.Mesh(new T.TorusGeometry(0.219, 0.011, 8, 48), M.plateRim); rim.position.z = sg * (z + 0.023); g.add(rim);
        var hub = cylZ(g, 0.05, 0.05, M.plateRim, 0, 0, sg * z);
      });
      cylZ(g, 0.035, 0.05, M.metal, 0, 0, sg * 0.6);
      cylZ(g, 0.026, 0.3, M.metal, 0, 0, sg * 0.82);
    });
    parent.add(g); return g;
  }
  // Barra Z: eje a lo largo de Z local; los tramos de agarre forman un ángulo (zigzag) en el plano X-Z
  function ezBar(parent) {
    var g = new T.Group(), M = mats();
    var pts = [[-0.62, 0], [-0.25, 0], [-0.2, 0.028], [-0.14, -0.012], [-0.07, 0.012], [0.07, 0.012], [0.14, -0.012], [0.2, 0.028], [0.25, 0], [0.62, 0]];
    for (var i = 0; i < pts.length - 1; i++) { var a = V(pts[i][1], 0, pts[i][0]), b = V(pts[i + 1][1], 0, pts[i + 1][0]); var c = cyl(g, 0.014, 1, M.metal, 16); segment(c, a, b); }
    [-1, 1].forEach(function (sg) {
      [0.4, 0.445].forEach(function (z) { cylZ(g, 0.16, 0.04, M.plate, 0, 0, sg * z).geometry = new T.CylinderGeometry(0.16, 0.16, 0.04, 40); cylZ(g, 0.04, 0.045, M.plateRim, 0, 0, sg * z); });
      cylZ(g, 0.03, 0.04, M.metal, 0, 0, sg * 0.37); cylZ(g, 0.024, 0.2, M.metal, 0, 0, sg * 0.53);
    });
    parent.add(g); return g;
  }
  // Mancuerna: eje del agarre = eje Z local
  function dumbbell(parent) {
    var g = new T.Group(), M = mats();
    cylZ(g, 0.016, 0.14, M.metal, 0, 0, 0);
    [-1, 1].forEach(function (sg) {
      var p = cyl(g, 0.08, 0.06, M.plate, 6); p.rotation.x = Math.PI / 2; p.rotation.y = 0; p.position.z = sg * 0.1;
      cylZ(g, 0.03, 0.02, M.metal, 0, 0, sg * 0.072);
    });
    parent.add(g); return g;
  }
  function kettlebell(parent) {
    var g = new T.Group(), M = mats();
    var b = shadowOn(new T.Mesh(new T.SphereGeometry(0.115, 32, 24), M.plate)); b.position.y = -0.16; b.scale.set(1, 0.92, 1); g.add(b);
    var hdl = new T.Mesh(new T.TorusGeometry(0.065, 0.015, 12, 32, Math.PI), M.plate); hdl.position.y = -0.065; hdl.rotation.y = Math.PI / 2; g.add(hdl);
    parent.add(g); return g;
  }
  // Torre de polea (cruce de poleas / jalón): discos que suben y bajan
  function stackTower(parent, x, z, rotY) {
    var g = new T.Group(), M = mats();
    g.position.set(x, 0, z); g.rotation.y = rotY || 0;
    box(g, 0.06, 2.3, 0.06, M.frame, 0, 1.15, -0.18); box(g, 0.06, 2.3, 0.06, M.frame, 0, 1.15, 0.18);
    box(g, 0.1, 0.06, 0.44, M.frame, 0, 2.3, 0); box(g, 0.36, 0.014, 0.5, M.frame, 0, 0.007, 0);
    box(g, 0.02, 1.9, 0.38, M.frameLight, -0.1, 1.05, 0);
    cyl(g, 0.007, 1.9, M.metal).position.set(0, 1.05, -0.06); cyl(g, 0.007, 1.9, M.metal).position.set(0, 1.05, 0.06);
    var stack = new T.Group(); g.add(stack);
    for (var i = 0; i < 14; i++) box(stack, 0.17, 0.042, 0.26, M.stack, 0, 0.09 + i * 0.046, 0);
    box(stack, 0.04, 0.03, 0.04, M.accent, 0.1, 0.09 + 13 * 0.046, 0);
    var pul = new T.Mesh(new T.TorusGeometry(0.05, 0.014, 10, 24), M.metal); pul.position.set(0, 2.24, 0); g.add(pul);
    parent.add(g);
    return {
      group: g, stack: stack,
      top: function () { return g.localToWorld(V(0, 2.24, 0)); },
      stackTop: function () { return g.localToWorld(V(0, 0.09 + 14 * 0.046 + stack.position.y, 0)); }
    };
  }
  // Pila de máquina comercial (con carcasa, sin cables a la vista)
  function machineStack(parent, x, z, rotY) {
    var g = new T.Group(), M = mats();
    g.position.set(x, 0, z); g.rotation.y = rotY || 0;
    box(g, 0.44, 0.06, 0.46, M.frame, 0, 0.03, 0);
    box(g, 0.04, 1.42, 0.42, M.frame, -0.18, 0.74, 0); box(g, 0.04, 1.42, 0.42, M.frame, 0.18, 0.74, 0);
    box(g, 0.4, 0.06, 0.44, M.frame, 0, 1.46, 0); box(g, 0.4, 1.36, 0.02, M.frameLight, 0, 0.74, -0.2);
    var stack = new T.Group(); g.add(stack);
    for (var i = 0; i < 12; i++) box(stack, 0.28, 0.042, 0.2, M.stack, 0, 0.1 + i * 0.047, 0);
    box(stack, 0.04, 0.03, 0.04, M.accent, 0.16, 0.1 + 11 * 0.047, 0.05);
    cyl(g, 0.008, 1.32, M.metal).position.set(-0.07, 0.74, 0); cyl(g, 0.008, 1.32, M.metal).position.set(0.07, 0.74, 0);
    parent.add(g);
    return { group: g, stack: stack, compact: true };
  }
  // Máquina Smith: guías verticales, barra con carros deslizantes, ganchos y topes de seguridad
  function smithMachine(parent, x) {
    var g = new T.Group(), M = mats(); g.position.set(x, 0, 0);
    [-1, 1].forEach(function (sg) {
      box(g, 0.08, 2.35, 0.08, M.frame, -0.32, 1.175, sg * 0.95); box(g, 0.08, 2.35, 0.08, M.frame, 0.32, 1.175, sg * 0.95);
      box(g, 0.72, 0.08, 0.08, M.frame, 0, 2.31, sg * 0.95); box(g, 0.72, 0.06, 0.1, M.frame, 0, 0.03, sg * 0.95);
      cyl(g, 0.022, 2.2, M.metal).position.set(0, 1.15, sg * 0.88);
      box(g, 0.1, 0.03, 0.08, M.accent, 0, 0.45, sg * 0.88); // tope de seguridad
      for (var h = 0.6; h < 2.0; h += 0.16) box(g, 0.03, 0.025, 0.03, M.frameLight, -0.06, h, sg * 0.9); // ganchos
    });
    box(g, 0.08, 0.08, 1.98, M.frame, -0.32, 2.31, 0); box(g, 0.08, 0.08, 1.98, M.frame, 0.32, 2.31, 0);
    box(g, 0.8, 0.02, 2.0, M.rubber, 0, 0.01, 0);
    var carriage = new T.Group(); g.add(carriage);
    [-1, 1].forEach(function (sg) { box(carriage, 0.09, 0.14, 0.07, M.frameLight, 0, 0, sg * 0.88); box(carriage, 0.05, 0.03, 0.05, M.metal, -0.06, 0.04, sg * 0.88); });
    parent.add(g);
    return { group: g, carriage: carriage };
  }

  // ---------------------------------------------------------------------------
  //  Ejercicios (v4, proporciones del modelo)
  //  A/B: inicio y posición de trabajo (subida, pausa, bajada lenta) · keys: secuencia cíclica suave (Catmull-Rom)
  // ---------------------------------------------------------------------------
  var STAND = [0, 0.97];
  var FEET = { ik: [0.0, ANK] };
  var HANG = -0.545; // mano colgando bajo el hombro
  var P = {};
  function def(k, o) { P[k] = o; }

  // ---- Piernas ----
  def('squat', { p: ['quads'], s: ['glutes', 'adductors', 'soleus'], load: 'back', scene: ['rack'], smith: true, cam: { az: 32 },
    A: { hip: STAND, torso: 4, legs: { ik: [0.02, ANK], fw: 0.16 }, arms: { bar: 'back' } },
    B: { hip: [-0.22, 0.52], torso: 40, head: -22, legs: { ik: [0.02, ANK], fw: 0.16 }, arms: { bar: 'back' } } });
  def('frontSquat', { p: ['quads'], s: ['glutes', 'adductors', 'abs'], load: 'goblet', cam: { az: 35 },
    A: { hip: STAND, torso: 3, legs: { ik: [0.02, ANK], fw: 0.16 }, arms: { relC: [0.25, -0.03], gw: 0.045, pole: [0, -1, 0.5], palm: [0, 0.6, -1] } },
    B: { hip: [-0.18, 0.5], torso: 20, head: -12, legs: { ik: [0.02, ANK], fw: 0.16 }, arms: { relC: [0.25, -0.03], gw: 0.045, pole: [0, -1, 0.5], palm: [0, 0.6, -1] } } });
  // Bisagras: posturas calculadas por altura de barra (barra vertical pegada a las piernas)
  function hingeKeys(list, bx) {
    var poses = list.map(function (q) {
      return { hip: [q[0], q[1]], torso: q[2], head: -q[2] * 0.35, legs: { ik: [-0.04, ANK], fw: 0.11 }, arms: { ik: [bx, q[3]], gw: 0.24, palm: 'pro' } };
    });
    var keys = [], n = poses.length;
    keys.push([0, poses[0]]);
    poses.forEach(function (p, i) { keys.push([0.04 + 0.36 * i / (n - 1), p]); });
    keys.push([0.5, poses[n - 1]]);
    for (var i = n - 2; i >= 0; i--) keys.push([0.5 + 0.42 * (n - 1 - i) / (n - 1), poses[i]]);
    keys.push([1, poses[0]]);
    return keys;
  }
  def('deadlift', { p: ['glutes', 'hams', 'lowback'], s: ['quads', 'adductors', 'traps', 'forearms'], load: 'bar', cam: { az: 18 }, thumb: 0.05, keys: hingeKeys([[-0.34, 0.63, 75, 0.225], [-0.34, 0.76, 77, 0.33], [-0.33, 0.84, 74, 0.45], [-0.3, 0.9, 63, 0.58], [-0.27, 0.98, 56, 0.7], [-0.11, 0.98, 27, 0.82], [-0.02, 0.97, 2, 0.83]], 0.082) });
  def('rdl', { p: ['hams'], s: ['glutes', 'adductors', 'lowback'], load: 'bar', cam: { az: 18 }, thumb: 0.45, keys: hingeKeys([[-0.02, 0.97, 2, 0.83], [-0.15, 0.9, 33, 0.7], [-0.23, 0.9, 56, 0.6], [-0.27, 0.9, 73, 0.5], [-0.27, 0.87, 79, 0.43]], 0.085) });
  def('goodMorning', { p: ['hams'], s: ['glutes', 'adductors', 'lowback'], load: 'back', cam: { az: 20 },
    A: { hip: STAND, torso: 2, legs: { ik: [0.0, ANK], fw: 0.15 }, arms: { bar: 'back' } },
    B: { hip: [-0.19, 0.94], torso: 72, head: -28, legs: { ik: [0.0, ANK], fw: 0.15 }, arms: { bar: 'back' } } });
  // Zancada larga: pies juntos -> paso -> bajada -> subida -> vuelta. Mancuerna en la mano contraria.
  (function () {
    var hold = { rel: [0.02, HANG, 0.05], palm: 'neu' };
    var stand = { hip: [0, 0.97], torso: 0, legsL: { ball: [0.13, 0.0], foot: 0 }, legsR: { ik: [0, ANK] }, arms: hold };
    var lift = { hip: [0.08, 0.96], torso: 0, legsL: { ball: [0.13, 0.0], foot: 0 }, legsR: { ik: [0.38, 0.25] }, arms: hold };
    var plant = { hip: [0.33, 0.9], torso: 0, legsL: { ball: [0.13, 0.012], foot: 30 }, legsR: { ik: [0.78, ANK] }, arms: hold };
    var bottom = { hip: [0.35, 0.5], torso: 5, legsL: { ball: [0.13, 0.016], foot: 55 }, legsR: { ik: [0.78, ANK] }, arms: hold };
    def('lunge', { side: 'R', p: ['quads'], s: ['glutes', 'adductors', 'soleus'], load: 'handL', cam: { az: 28 }, thumb: 0.45,
      keys: [[0, stand], [0.08, stand], [0.2, lift], [0.32, plant], [0.48, bottom], [0.56, bottom], [0.72, plant], [0.84, lift], [0.94, stand], [1, stand]] });
  })();
  def('legPress', { p: ['quads'], s: ['glutes', 'adductors', 'soleus'], load: 'sled', scene: ['legPress'], cam: { dist: 1.0, az: 4 },
    A: { hip: [-0.32, 0.56], torso: -50, legs: { ik: [0.04, 0.88], fw: 0.15, foot: -135, pole: [-0.4, 1, 0.25] }, arms: { ik: [-0.22, 0.5], gw: 0.3, palm: 'neu' } },
    B: { hip: [-0.32, 0.56], torso: -50, legs: { ik: [0.3, 1.13], fw: 0.15, foot: -135, pole: [-0.4, 1, 0.25] }, arms: { ik: [-0.22, 0.5], gw: 0.3, palm: 'neu' } } });
  def('legExt', { p: ['quads'], load: 'machine', stack: true, scene: ['legExt'], machinePos: [-0.55, -0.62, 0], cam: { az: 35 },
    A: { hip: [-0.08, 0.58], torso: -10, legs: { th: 90, sh: 6, footRel: 0 }, arms: { ik: [0.0, 0.5], gw: 0.27, palm: 'neu' } },
    B: { hip: [-0.08, 0.58], torso: -10, legs: { th: 90, sh: 86, footRel: 0 }, arms: { ik: [0.0, 0.5], gw: 0.27, palm: 'neu' } } });
  def('legCurl', { p: ['hams'], s: ['calves'], load: 'machine', stack: true, scene: ['legCurl'], machinePos: [0.95, -0.55, 0], cam: { az: 22 },
    A: { hip: [-0.05, 0.6], torso: 90, head: -10, legs: { th: -90, sh: -92, footRel: 25, footFlip: true }, arms: { ik: [0.5, 0.48], gw: 0.24, palm: 'pro' } },
    B: { hip: [-0.05, 0.6], torso: 90, head: -10, legs: { th: -94, sh: -228, footRel: 25, footFlip: true }, arms: { ik: [0.5, 0.48], gw: 0.24, palm: 'pro' } } });
  def('calf', { p: ['calves'], s: ['soleus'], load: 'hands', stack: true, scene: ['step'], cam: { az: 22 },
    A: { hip: [-0.07, 1.0], torso: 0, legs: { ball: [0.08, 0.105], foot: -22, fw: 0.11 }, arms: { rel: [0.02, HANG, 0.06], palm: 'neu' } },
    B: { hip: [0.02, 1.115], torso: 0, legs: { ball: [0.08, 0.105], foot: 38, fw: 0.11 }, arms: { rel: [0.02, HANG, 0.06], palm: 'neu' } } });
  def('seatedCalf', { p: ['soleus'], s: ['calves'], load: 'plates', scene: ['seatedCalf'], cam: { az: 30 },
    A: { hip: [-0.24, 0.6], torso: 2, legs: { ball: [0.3, 0.205], foot: -18, fw: 0.12, pole: [1, 0.6, 0] }, arms: { ik: [0.12, 0.72], gw: 0.24, palm: 'pro' } },
    B: { hip: [-0.24, 0.6], torso: 2, legs: { ball: [0.3, 0.205], foot: 30, fw: 0.12, pole: [1, 0.6, 0] }, arms: { ik: [0.12, 0.78], gw: 0.24, palm: 'pro' } } });
  def('hipThrust', { p: ['glutes'], s: ['hams', 'quads'], load: 'hip', stack: true, scene: ['thrustBench'], cam: { az: 28 },
    A: { hip: [-0.12, 0.31], torso: -51, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { bar: 'hip' } },
    B: { hip: [-0.03, 0.62], torso: -98, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { bar: 'hip' } } });
  def('gluteKickback', { side: 'R', p: ['glutes'], s: ['hams'], load: 'ankle', stack: true, scene: ['towerFront'], cam: { az: 6 },
    A: { hip: [0, 0.97], torso: 32, legsL: FEET, legsR: { th: 6, sh: 4 }, arms: { ik: [0.45, 1.12], gw: 0.2, palm: 'pro' } },
    B: { hip: [0, 0.97], torso: 32, legsL: FEET, legsR: { th: -62, sh: -56 }, arms: { ik: [0.45, 1.12], gw: 0.2, palm: 'pro' } } });

  // ---- Pecho ----
  def('bench', { p: ['pecs'], s: ['pecsU', 'deltsF', 'triceps'], load: 'bar', scene: ['bench', 'benchRack'], smith: true, liftAt: 0, cam: { y: 0.72 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ik: [-0.29, 1.0], gw: 0.42, palm: 'pro' } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ik: [-0.21, 0.71], gw: 0.42, palm: 'pro' } } });
  def('incline', { p: ['pecsU'], s: ['pecs', 'deltsF', 'triceps'], load: 'bar', scene: ['inclineBench'], smith: true, liftAt: 0,
    A: { hip: [0.05, 0.56], torso: -52, legs: { ik: [0.52, ANK], fw: 0.22 }, arms: { ik: [-0.26, 1.25], gw: 0.4, palm: 'pro' } },
    B: { hip: [0.05, 0.56], torso: -52, legs: { ik: [0.52, ANK], fw: 0.22 }, arms: { ik: [-0.17, 0.92], gw: 0.4, palm: 'pro' } } });
  def('fly', { p: ['pecs'], s: ['pecsU', 'deltsF'], load: 'hands', scene: ['bench'], liftAt: 0, cam: { y: 0.72, az: 50 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ik: [-0.3, 0.98, 0.12], pole: [0.4, -0.6, 0.5], palm: [0, 0, -1] } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ik: [-0.3, 0.66, 0.54], pole: [0.4, -0.6, 0.5], palm: [0, 1, -0.3] } } });
  def('pullover', { p: ['lats'], s: ['pecs', 'triceps'], load: 'single', scene: ['bench'], liftAt: 0, cam: { y: 0.72 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ua: 178, fa: 182, palm: [1, 0, 0] } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ua: 262, fa: 268, palm: [0, 1, 0] } } });
  // Press de pecho: palancas que salen desde abajo; agarres a la altura del pecho
  def('chestPress', { p: ['pecs'], s: ['pecsU', 'deltsF', 'triceps'], load: 'machine', stack: true, scene: ['chestPress'], machinePos: [-0.72, -0.5, 0], cam: { az: 38 },
    A: { hip: [-0.1, 0.56], torso: -8, legs: { ik: [0.36, ANK], fw: 0.16 }, arms: { ik: [0.05, 0.88], gw: 0.27, pole: [-1, -0.5, 0.45], palm: [0, 0, -1] } },
    B: { hip: [-0.1, 0.56], torso: -8, legs: { ik: [0.36, ANK], fw: 0.16 }, arms: { ik: [0.31, 0.9], gw: 0.24, pole: [-1, -0.5, 0.45], palm: [0, 0, -1] } } });
  // Cruce de poleas: cada mano con su agarre (unilateral); los brazos siempre por delante del cuerpo
  def('cableFly', { p: ['pecs'], s: ['pecsU'], load: 'twinCable', stack: true, cam: { az: 55, dist: 1.1 },
    A: { hip: [0, 0.96], torso: 14, legsL: { ik: [-0.18, ANK] }, legsR: { ik: [0.22, ANK] }, arms: { ik: [0.1, 1.4, 0.6], pole: [-1, 0.35, 0.55], palm: [0.4, -0.1, -1] } },
    B: { hip: [0, 0.96], torso: 14, legsL: { ik: [-0.18, ANK] }, legsR: { ik: [0.22, ANK] }, arms: { ik: [0.47, 1.08, 0.07], pole: [-0.6, 0.1, 0.9], palm: [0, 0, -1] } } });
  def('dip', { p: ['pecs'], s: ['triceps', 'deltsF', 'pecsU'], load: 'none', scene: ['dipStation'], liftAt: 0,
    A: { hip: [-0.02, 1.38], torso: 6, legs: { rel: [-0.26, -0.7], pole: [1, 0, 0] }, arms: { ik: [0.0, 1.26], gw: 0.25, pole: [-1, 0, 0.2], palm: 'neu' } },
    B: { hip: [-0.06, 1.16], torso: 16, legs: { rel: [-0.26, -0.7], pole: [1, 0, 0] }, arms: { ik: [0.0, 1.26], gw: 0.25, pole: [-1, 0, 0.2], palm: 'neu' } } });
  // Flexiones: cuerpo recto (piernas alineadas con el tronco), codos hacia atrás
  def('pushup', { p: ['pecs'], s: ['pecsU', 'deltsF', 'triceps', 'abs'], load: 'none', liftAt: 0, cam: { y: 0.4, az: 30 },
    A: { hip: [-0.08, 0.425], torso: 68, legs: { ik: [-0.92, 0.207], fw: 0.1, foot: 65, pole: [0, -1, 0] }, arms: { ik: [0.33, 0.06], gw: 0.29, pole: [-1, 0.3, 0.45], hand: 'flat', flatDir: [1, 0, 0.15] } },
    B: { hip: [-0.03, 0.27], torso: 81, legs: { ik: [-0.92, 0.207], fw: 0.1, foot: 65, pole: [0, -1, 0] }, arms: { ik: [0.33, 0.06], gw: 0.29, pole: [-1, 0.3, 0.45], hand: 'flat', flatDir: [1, 0, 0.15] } } });

  // ---- Espalda ----
  def('row', { p: ['lats', 'traps'], s: ['deltsR', 'biceps', 'lowback'], load: 'bar',
    A: { hip: [-0.15, 0.87], torso: 64, head: -28, legs: FEET, arms: { ik: [0.2, 0.55], gw: 0.27, pole: [-1, 0.5, 0.4], palm: 'pro' } },
    B: { hip: [-0.15, 0.87], torso: 64, head: -28, legs: FEET, arms: { ik: [0.09, 0.79], gw: 0.27, pole: [-1, 0.5, 0.4], palm: 'pro' } } });
  def('dbRow', { side: 'R', p: ['lats', 'traps'], s: ['deltsR', 'biceps'], load: 'handR', scene: ['rowBench'], cam: { az: 25 },
    A: { hip: [-0.1, 0.97], torso: 82, head: -20, legsL: { ik: [-0.52, 0.53], pole: [0, -1, 0] }, legsR: { ik: [0.0, ANK, 0.34] },
      armsL: { ik: [0.4, 0.5, 0.2], hand: 'flat', flatDir: [1, 0, 0] }, armsR: { ik: [0.31, 0.54, 0.24], pole: [-1, 0.6, 0.35], palm: 'neu' } },
    B: { hip: [-0.1, 0.97], torso: 82, head: -20, legsL: { ik: [-0.52, 0.53], pole: [0, -1, 0] }, legsR: { ik: [0.0, ANK, 0.34] },
      armsL: { ik: [0.4, 0.5, 0.2], hand: 'flat', flatDir: [1, 0, 0] }, armsR: { ik: [0.07, 0.9, 0.25], pole: [-1, 0.6, 0.35], palm: 'neu' } } });
  // Jalón: visto por detrás, polea delante; la barra baja hasta la parte alta del pecho
  def('pulldown', { p: ['lats'], s: ['biceps', 'deltsR', 'traps'], load: 'pulldown', stack: true, scene: ['pulldown'], cam: { az: -128, el: 14 },
    A: { hip: [0, 0.57], torso: -8, legs: { ik: [0.42, ANK], fw: 0.16 }, arms: { relC: [0.12, 0.44], gw: 0.42, pole: [0, -1, 0.6], palm: 'pro' } },
    B: { hip: [0, 0.57], torso: -20, head: 10, legs: { ik: [0.42, ANK], fw: 0.16 }, arms: { relC: [0.2, 0.03], gw: 0.42, pole: [0, -1, 0.6], palm: 'pro' } } });
  // Dominadas: la barra llega a la altura de las clavículas
  def('pullup', { p: ['lats'], s: ['biceps', 'deltsR', 'traps', 'forearms'], load: 'none', scene: ['pullFrame'], cam: { az: -140, el: 10 },
    A: { hip: [-0.03, 1.32], torso: 0, legs: { rel: [-0.2, -0.8], fw: 0.06 }, arms: { ik: [0.0, 2.22], gw: 0.4, pole: [0.2, -1, 0.7], palm: 'pro' } },
    B: { hip: [-0.07, 1.78], torso: -10, head: 8, legs: { rel: [-0.2, -0.8], fw: 0.06 }, arms: { ik: [0.0, 2.22], gw: 0.4, pole: [0.2, -1, 0.7], palm: 'pro' } } });
  // Remo sentado: codos por fuera del cuerpo, el agarre llega al abdomen
  def('seatedRow', { p: ['lats', 'traps'], s: ['deltsR', 'biceps', 'lowback'], load: 'seatedRow', stack: true, scene: ['seatedRow'], cam: { az: 28 },
    A: { hip: [-0.38, 0.45], torso: 16, legs: { ik: [0.3, 0.33], fw: 0.14, foot: -72, pole: [0.2, 1, 0.2] }, arms: { ik: [0.2, 0.8], gw: 0.06, pole: [-1, -0.4, 0.8], palm: 'neu' } },
    B: { hip: [-0.38, 0.45], torso: -4, legs: { ik: [0.3, 0.33], fw: 0.14, foot: -72, pole: [0.2, 1, 0.2] }, arms: { ik: [-0.22, 0.76], gw: 0.07, pole: [-1, -0.4, 0.8], palm: 'neu' } } });
  // Face pull: los codos quedan por debajo de las manos (rotación externa)
  def('facePull', { p: ['deltsR'], s: ['deltsS', 'traps', 'biceps'], load: 'facePull', stack: true, scene: ['towerFront'], cam: { az: 6 },
    A: { hip: [-0.05, 0.96], torso: -3, legsL: { ik: [-0.2, ANK] }, legsR: { ik: [0.12, ANK] }, arms: { ik: [0.4, 1.47], gw: 0.08, pole: [-0.5, -0.8, 0.6], palm: 'neu' } },
    B: { hip: [-0.05, 0.96], torso: -3, legsL: { ik: [-0.2, ANK] }, legsR: { ik: [0.12, ANK] }, arms: { ik: [0.06, 1.52], gw: 0.27, pole: [-0.5, -0.8, 0.6], palm: 'neu' } } });
  def('hyperext', { p: ['lowback'], s: ['glutes', 'hams'], load: 'none', scene: ['hyperBench'], cam: { az: 12 },
    A: { hip: [0, 0.98], torso: 132, legs: { ik: [-0.58, 0.38], fw: 0.1 }, arms: { relC: [0.15, -0.07], gw: -0.07, pole: [0, -1, 0.5], palm: 'neu' } },
    B: { hip: [0, 0.98], torso: 48, legs: { ik: [-0.58, 0.38], fw: 0.1 }, arms: { relC: [0.15, -0.07], gw: -0.07, pole: [0, -1, 0.5], palm: 'neu' } } });
  def('shrug', { p: ['trapsU'], s: ['traps', 'forearms'], load: 'handsFront', stack: true, cam: { az: 55 },
    A: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.05, HANG, 0.06], palm: 'pro' }, shr: 0 },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.05, HANG, 0.06], palm: 'pro' }, shr: 0.055 } });

  // ---- Hombros ----
  def('ohp', { p: ['deltsF'], s: ['deltsS', 'triceps', 'pecsU', 'traps'], load: 'bar', stack: true,
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ik: [0.1, 1.42], gw: 0.27, pole: [0.4, -1, 0.5], palm: 'pro' } },
    B: { hip: STAND, torso: -2, legs: FEET, arms: { ik: [0.0, 1.88], gw: 0.27, pole: [0.4, -1, 0.5], palm: 'pro' } } });
  def('lateralRaise', { p: ['deltsS'], s: ['deltsF', 'traps'], load: 'hands', stack: true, cam: { az: 70 },
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 8, fa: 12, plane: 'f', palm: [0, 0, -1] } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 85, fa: 92, plane: 'f', palm: [0, -1, -0.15] } } });
  def('frontRaise', { p: ['deltsF'], s: ['pecsU', 'deltsS'], load: 'hands', stack: true, cam: { az: 28 },
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 12, fa: 16, palm: 'pro' } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 88, fa: 94, palm: 'pro' } } });
  P.lateral = P.frontRaise;
  def('uprightRow', { p: ['deltsS'], s: ['deltsF', 'traps', 'trapsU', 'biceps'], load: 'handsFront', stack: true, cam: { az: 62 },
    A: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.08, HANG, -0.03], pole: [-0.2, 0.6, 1.4], palm: 'pro' } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.15, -0.07, -0.025], pole: [-0.5, 0.75, 1.5], palm: 'pro' } } });

  // ---- Brazos ----
  def('curl', { p: ['biceps'], s: ['forearms'], load: 'hands', stack: true,
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 2, fa: 4, palm: 'sup' } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 10, fa: 150, palm: 'sup' } } });
  def('preacherCurl', { p: ['biceps'], s: ['forearms'], load: 'hands', stack: true, scene: ['preacher'], cam: { az: 68 },
    A: { hip: [-0.12, 0.6], torso: 15, legs: { ik: [0.28, ANK], fw: 0.16 }, arms: { ua: 70, fa: 76, palm: 'sup' } },
    B: { hip: [-0.12, 0.6], torso: 15, legs: { ik: [0.28, ANK], fw: 0.16 }, arms: { ua: 70, fa: 155, palm: 'sup' } } });
  def('pushdown', { p: ['triceps'], load: 'pushdown', stack: true, scene: ['towerFront'], cam: { az: 6 },
    A: { hip: [-0.05, 0.96], torso: 10, legs: FEET, arms: { ua: -6, fa: 105, palm: 'pro' } },
    B: { hip: [-0.05, 0.96], torso: 10, legs: FEET, arms: { ua: -3, fa: 16, palm: 'pro' } } });
  // Extensión sobre la cabeza: ambas manos sujetan la mancuerna por el disco superior
  def('ohExt', { p: ['triceps'], load: 'overhead', stack: true, liftAt: 0, cam: { az: 25 },
    A: { hip: STAND, torso: 0, legs: FEET, arms: { relC: [0.02, 0.52], gw: 0.03, pole: [0.7, 1, 0.1], palm: [0, 1, 0] } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { relC: [-0.16, 0.19], gw: 0.03, pole: [0.7, 1, 0.1], palm: [0, 1, 0] } } });
  def('skullCrusher', { p: ['triceps'], load: 'bar', scene: ['bench'], liftAt: 0, cam: { y: 0.72 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ua: 178, fa: 180, palm: 'pro' } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ua: 198, fa: 278, palm: 'pro' } } });
  // Patada de tríceps: brazo por fuera de la pierna, codo alto y fijo
  def('kickback', { side: 'R', p: ['triceps'], load: 'handR', stack: true, scene: ['rowBench'], cam: { az: 25 },
    A: { hip: [-0.1, 0.97], torso: 82, head: -20, legsL: { ik: [-0.52, 0.53], pole: [0, -1, 0] }, legsR: { ik: [0.02, ANK, 0.38] },
      armsL: { ik: [0.4, 0.5, 0.2], hand: 'flat', flatDir: [1, 0, 0] }, armsR: { rel: [-0.2, -0.3, 0.06], pole: [0, 1, 0.3], palm: 'neu' } },
    B: { hip: [-0.1, 0.97], torso: 82, head: -20, legsL: { ik: [-0.52, 0.53], pole: [0, -1, 0] }, legsR: { ik: [0.02, ANK, 0.38] },
      armsL: { ik: [0.4, 0.5, 0.2], hand: 'flat', flatDir: [1, 0, 0] }, armsR: { rel: [-0.53, -0.07, 0.07], pole: [0, 1, 0.3], palm: 'neu' } } });

  // ---- Core ----
  def('plank', { p: ['abs'], s: ['deltsF', 'glutes', 'quads'], load: 'none', scene: ['mat'], cam: { y: 0.3 },
    A: { hip: [-0.3, 0.2], torso: 82, head: -10, legs: { ik: [-1.17, 0.207], fw: 0.1, foot: 65, pole: [0, -1, 0] }, arms: { ua: 0, fa: 90, palm: [0, -1, -0.5] } },
    B: { hip: [-0.3, 0.208], torso: 82, head: -10, legs: { ik: [-1.17, 0.207], fw: 0.1, foot: 65, pole: [0, -1, 0] }, arms: { ua: 0, fa: 90, palm: [0, -1, -0.5] } } });
  def('crunch', { p: ['abs'], machinePos: [-0.7, -0.8, 0], load: 'none', stack: true, scene: ['mat'], cam: { y: 0.35, az: 35 },
    A: { hip: [0, 0.133], torso: -90, legs: { ik: [0.5, ANK], fw: 0.15 }, arms: { temple: 1, pole: [0.3, 0.2, 1], palm: [0, 0, -1] } },
    B: { hip: [0, 0.133], torso: -64, head: 12, legs: { ik: [0.5, ANK], fw: 0.15 }, arms: { temple: 1, pole: [0.3, 0.2, 1], palm: [0, 0, -1] } } });
  // Elevación de piernas: los pies mantienen la misma posición respecto a la pierna
  def('legRaise', { p: ['hipFlex', 'abs'], s: ['quads'], load: 'none', scene: ['mat'], cam: { y: 0.4 },
    A: { hip: [0, 0.145], torso: -90, legs: { th: 86, sh: 87, footRel: 25 }, arms: { ua: 88, fa: 88, palm: [0, -1, 0] } },
    B: { hip: [0, 0.145], torso: -90, legs: { th: 178, sh: 180, footRel: 25 }, arms: { ua: 88, fa: 88, palm: [0, -1, 0] } } });
  def('hangLeg', { p: ['hipFlex', 'abs'], s: ['forearms'], load: 'none', scene: ['pullFrame'],
    A: { hip: [-0.02, 1.32], torso: 0, legs: { th: 4, sh: 0, footRel: 20 }, arms: { ik: [0.0, 2.22], gw: 0.4, straight: 1, palm: 'pro' } },
    B: { hip: [0.0, 1.32], torso: -6, legs: { th: 92, sh: 92, footRel: 20 }, arms: { ik: [0.0, 2.22], gw: 0.4, straight: 1, palm: 'pro' } } });

  // ---- Frontales / cuerpo completo ----
  def('abduction', { side: 'R', p: ['gluteMed'], s: ['glutes'], load: 'ankleSide', stack: true, scene: ['towerSide'], cam: { az: 70 },
    A: { hip: STAND, torso: 0, legsL: FEET, legsR: { th: 2, sh: 2, plane: 'f' }, armsL: { ik: [0.0, 1.12, 0.6], palm: 'neu' }, armsR: { rel: [0.03, HANG, 0.06], palm: 'neu' } },
    B: { hip: [0, 0.97], torso: -2, legsL: FEET, legsR: { th: 50, sh: 50, plane: 'f' }, armsL: { ik: [0.0, 1.12, 0.6], palm: 'neu' }, armsR: { rel: [0.03, HANG, 0.06], palm: 'neu' } } });
  (function () {
    var down = { hip: STAND, torso: 0, legs: { ik: [0, ANK], fw: 0.1 }, arms: { ua: 6, fa: 4, plane: 'f', palm: [0, 0, -1] } };
    var air1 = { hip: [0, 1.05], torso: 0, legs: { ik: [0, 0.17], fw: 0.21, foot: 25 }, arms: { ua: 80, fa: 84, plane: 'f', palm: [0, -1, 0] } };
    var wide = { hip: [0, 0.94], torso: 0, legs: { ik: [0, ANK], fw: 0.32 }, arms: { ua: 168, fa: 172, plane: 'f', palm: [0, 0, -1] } };
    def('jumpingJack', { p: ['delts', 'calves'], s: ['quads', 'glutes'], load: 'none', cam: { az: 70 }, thumb: 0.45,
      keys: [[0, down], [0.1, down], [0.25, air1], [0.4, wide], [0.52, wide], [0.68, air1], [0.84, down], [1, down]] });
  })();
  def('swing', { p: ['glutes', 'hams'], s: ['delts', 'lowback', 'abs'], load: 'kb',
    A: { hip: [-0.25, 0.74], torso: 58, legs: { ik: [0.0, ANK], fw: 0.2 }, arms: { ik: [-0.05, 0.5], gw: 0.04, straight: 1, palm: 'pro' } },
    B: { hip: STAND, torso: -2, legs: { ik: [0.0, ANK], fw: 0.2 }, arms: { ik: [0.62, 1.3], gw: 0.04, straight: 1, palm: 'pro' } } });

  // ---- Cardio (cíclicos) ----
  def('run', { p: ['quads', 'hams', 'calves', 'glutes'], load: 'none', cyclic: 'run', scene: ['treadmill'], cam: { az: 28 } });
  def('walk', { p: ['forearms', 'traps'], s: ['quads', 'calves'], load: 'hands', cyclic: 'walk', cam: { az: 30 } });
  def('bike', { p: ['quads', 'calves'], s: ['hams', 'glutes'], load: 'none', cyclic: 'bike', scene: ['bike'] });
  def('rowErg', { p: ['lats', 'quads'], s: ['hams', 'biceps', 'lowback'], load: 'none', cyclic: 'rowErg', scene: ['rower'], cam: { az: 22 } });
  // ---- técnica: pies abiertos ~15° con las rodillas siguiendo la punta del pie (sentadilla, prensa, hip thrust)
  function toeOut(k, deg) { ['A', 'B'].forEach(function (f) { var L = P[k] && P[k][f] && P[k][f].legs; if (L) P[k][f].legs = Object.assign({}, L, { toe: deg }); }); }
  def('jumpRope', { p: ['calves'], s: ['delts', 'forearms'], load: 'rope', cyclic: 'jumpRope', cam: { az: 62 } });
  toeOut('squat', 15); toeOut('frontSquat', 15); toeOut('legPress', 12); toeOut('hipThrust', 10);
  // segunda perspectiva elegida a mano donde la máquina tapa la vista automática
  // <<VARIANTES
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
    A: { hip: [0.05, 0.56], torso: -50, legs: { ik: [0.52, ANK], fw: 0.22 }, arms: { rel: [-0.05, HANG + 0.01, 0.12], palm: 'neu', pole: [-1, -0.2, 0.4] } },
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
    A: { hip: [0.04, 0.5], torso: -2, legs: { ik: [0.76, ANK], fw: 0.12 }, arms: { ik: [-0.12, 0.47], gw: 0.22, hand: 'flat', flatDir: [1, 0, 0], pole: [-1, 0.2, 0.3] } },
    B: { hip: [0.05, 0.37], torso: 4, legs: { ik: [0.76, ANK], fw: 0.12 }, arms: { ik: [-0.12, 0.47], gw: 0.22, hand: 'flat', flatDir: [1, 0, 0], pole: [-1, 0.2, 0.3] } } });
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
    A: { hip: STAND, torso: 0, lean: -7, legs: { ik: [0, ANK], fw: 0.14 }, armsR: { rel: [0.02, HANG, 0.06], palm: 'neu' }, armsL: { rel: [0.04, -0.3, -0.04], palm: 'neu', pole: [-1, 0, 0.3] }, arms: null },
    B: { hip: STAND, torso: 0, lean: 28, legs: { ik: [0, ANK], fw: 0.14 }, armsR: { rel: [0.02, HANG, 0.06], palm: 'neu' }, armsL: { rel: [0.04, -0.3, -0.04], palm: 'neu', pole: [-1, 0, 0.3] }, arms: null } });
  // VARIANTES>>
  function cam2(k, az2, el2) { if (P[k]) P[k].cam = Object.assign({}, P[k].cam, { az2: az2, el2: el2 }); }
  cam2('legPress', -48, 26); cam2('calf', 72, 10); cam2('seatedCalf', 75, 14); cam2('chestPress', 100, 12); cam2('pulldown', 2, 12);
  cam2('pushup', 90, 8); cam2('cableFly', 92, 8); cam2('plank', -32, 12); cam2('legRaise', -42, 20);

  var BELT = 0.14;
  // Marcha: en el apoyo el pie va hacia atrás pegado al suelo; en el vuelo se levanta y avanza
  function gaitAnkle(w, stride, lift, base) {
    var c = Math.cos(w), s = Math.sin(w);
    return [stride * c + 0.02, base + (s < 0 ? lift * Math.pow(-s, 1.3) : 0)];
  }
  // Zancada de carrera (ciclo de una pierna): [fase, muslo (° desde la vertical, + delante), flexión de rodilla, pie (+ punta abajo)]
  // apoyo 0–0,38 (contacto bajo la cadera, amortiguación ~40°, despegue con la punta); vuelo; balanceo con el talón hacia el glúteo
  var RUN_KEYS = [[0, 17, 12, -4], [0.12, 6, 38, 0], [0.26, -12, 30, 12], [0.38, -20, 22, 38], [0.52, -10, 85, 30],
    [0.68, 18, 105, 18], [0.84, 40, 72, 6], [0.94, 30, 28, -4], [1, 17, 12, -4]];
  function runLeg(p) {
    p = ((p % 1) + 1) % 1;
    var n = RUN_KEYS.length, i = 0;
    while (i < n - 2 && p > RUN_KEYS[i + 1][0]) i++;
    var k0 = RUN_KEYS[(i - 1 + n - 1) % (n - 1)], k1 = RUN_KEYS[i], k2 = RUN_KEYS[i + 1], k3 = RUN_KEYS[(i + 2) % (n - 1)];
    var t = (p - k1[0]) / (k2[0] - k1[0]);
    var out = [1, 2, 3].map(function (c) { return crVal(k0[c], k1[c], k2[c], k3[c], t); });
    return { th: out[0], knee: out[1], foot: out[2], stance: p <= 0.38, p: p };
  }
  function runPose(ph, d) {
    var R = runLeg(ph), L = runLeg(ph + 0.5);
    // altura del tobillo sobre la cinta: al despegar, el pie gira sobre el metatarso y el talón se eleva
    function vlen(g) { return TH * Math.cos(rad(g.th)) + SH * Math.cos(rad(g.th - g.knee)) + 0.14 * Math.sin(rad(Math.max(0, g.foot))); }
    var base = (d && d.belt === false ? 0 : BELT) + ANK, hy;
    if (R.stance) hy = base + vlen(R);
    else if (L.stance) hy = base + vlen(L);
    else {
      // fase de vuelo: entre el despegue de una pierna y el contacto de la otra
      var fr = R.p > 0.38 && R.p < 0.5 ? R : L, nx = fr === R ? L : R;
      var s = (fr.p - 0.38) / 0.12, a = base + vlen(runLeg(fr.p - (fr.p - 0.38))), b = base + vlen(runLeg(nx.p + (1 - nx.p)));
      hy = lerp(a, b, s) + 0.022 * Math.sin(Math.PI * s);
    }
    function legOf(g) { return { th: g.th, sh: g.th - g.knee, fw: 0.09, foot: g.foot }; }
    function armOf(g) { var ua = clamp(-0.9 * (g.th - 10), -32, 34); return { ua: ua, fa: ua + 86 + Math.max(0, ua) * 0.35, palm: 'neu' }; }
    return { hip: [0, hy], torso: 8, head: -6, legsR: legOf(R), legsL: legOf(L), armsR: armOf(R), armsL: armOf(L) };
  }
  // Marcha (ciclo de una pierna, ExRx/Perry): [fase, muslo (° desde la vertical, + delante), flexión de rodilla, pie (+ punta abajo)]
  // contacto de talón 0, respuesta a la carga, apoyo medio, despegue del talón, despegue de los dedos 0,6, balanceo inicial, medio y final
  var WALK_KEYS = [[0, 22, 3, -14], [0.1, 17, 16, -2], [0.3, 2, 6, 0], [0.48, -12, 6, 8], [0.6, -14, 36, 28], [0.72, 2, 60, 14],
    [0.85, 19, 36, -4], [0.95, 23, 6, -12], [1, 22, 3, -14]];
  function keyLeg(K, p, stanceEnd) {
    p = ((p % 1) + 1) % 1;
    var n = K.length, i = 0;
    while (i < n - 2 && p > K[i + 1][0]) i++;
    var k0 = K[(i - 1 + n - 1) % (n - 1)], k1 = K[i], k2 = K[i + 1], k3 = K[(i + 2) % (n - 1)];
    var t = (p - k1[0]) / (k2[0] - k1[0]);
    var o = [1, 2, 3].map(function (c) { return crVal(k0[c], k1[c], k2[c], k3[c], t); });
    return { p: p, th: o[0], knee: o[1], foot: o[2], stance: p < stanceEnd };
  }
  // d.gait: { belt: cinta, incline: grados, lean: inclinación del tronco, arms: 'swing' | 'pack' | 'rails', stride: escala }
  function walkPose(ph, d) {
    var g = (d && d.gait) || {}, sc = g.stride || 1, inc = rad(g.incline || 0), base = (g.belt ? BELT : 0) + ANK;
    function leg(p) { var k = keyLeg(WALK_KEYS, p, 0.6); k.th = k.th * sc + (g.incline || 0) * 0.45; k.knee *= (0.85 + 0.15 * sc); return k; }
    var R = leg(ph), L = leg(ph + 0.5);
    // altura de la cadera: el pie de apoyo toca el suelo (o la cinta inclinada); en el doble apoyo manda la pierna más larga
    function hNeed(k) {
      var ax = TH * Math.sin(rad(k.th)) + SH * Math.sin(rad(k.th - k.knee));
      return base + ax * Math.tan(inc) + TH * Math.cos(rad(k.th)) + SH * Math.cos(rad(k.th - k.knee)) + 0.12 * Math.sin(rad(Math.max(0, k.foot))) * 0.5;
    }
    var hy = Math.max(R.stance ? hNeed(R) : 0, L.stance ? hNeed(L) : 0);
    function legOf(k) { return { th: k.th, sh: k.th - k.knee, fw: 0.1, foot: k.foot + (g.incline || 0) * (k.stance ? -1 : -0.5) }; }
    function armOf(k) {
      if (g.arms === 'rails') return { ik: [0.34, 1.12], gw: 0.27, palm: 'neu' };
      if (g.arms === 'pack') return { relC: [0.14, -0.2], gw: 0.11, palm: [-0.3, 0, -1], pole: [0, -1, 0.5] };
      var ua = clamp(-0.75 * (k.th - 4), -18, 20); return { ua: ua, fa: ua + 14 + Math.max(0, ua) * 0.5, palm: 'neu' };
    }
    var f = { hip: [0, hy], torso: (g.lean || 2) + (g.incline || 0) * 0.5, head: -(g.lean || 0) * 0.4, legsR: legOf(R), legsL: legOf(L) };
    if (g.arms === 'rails') f.arms = armOf(R); else { f.armsR = armOf(R); f.armsL = armOf(L); }
    return f;
  }
  function cyclicPose(kind, ph, d) {
    var w = ph * Math.PI * 2;
    if (kind === 'run') return runPose(ph, d);
    if (kind === 'walk2') return walkPose(ph, d);
    if (kind === 'sled') {
      // pierna de empuje: apoya bajo la cadera con la rodilla flexionada y extiende hacia atrás empujando con la punta
      var SK = [[0, 48, 62, 8], [0.25, 22, 40, 14], [0.5, -6, 14, 34], [0.6, -8, 40, 40], [0.78, 30, 100, 20], [0.92, 52, 82, 8], [1, 48, 62, 8]];
      var sR2 = keyLeg(SK, ph, 0.55), sL2 = keyLeg(SK, ph + 0.5, 0.55);
      var hn = function (k) { return ANK + TH * Math.cos(rad(k.th)) + SH * Math.cos(rad(k.th - k.knee)) + 0.1 * Math.sin(rad(Math.max(0, k.foot))); };
      var shy = Math.max(sR2.stance ? hn(sR2) : 0, sL2.stance ? hn(sL2) : 0);
      var lgS = function (k) { return { th: k.th, sh: k.th - k.knee, fw: 0.12, foot: k.foot }; };
      return { hip: [0, shy], torso: 52, head: -30, legsR: lgS(sR2), legsL: lgS(sL2), arms: { ik: [0.66, 0.92], gw: 0.23, palm: 'neu', pole: [-0.3, -1, 0.5] } };
    }
    if (kind === 'swim') {
      // brazada de crol (cada brazo: tracción 0–0,5 con codo alto, recobro 0,5–1 por encima del agua); el cuerpo rueda hacia el brazo que tracciona
      // trayectoria de la mano respecto al hombro (antes del rolido): x adelante, y hacia la espalda (fuera del agua), z hacia fuera
      // entrada delante, agarre y tracción bajo el cuerpo con codo alto, salida junto a la cadera y recobro bajo con el codo alto
      var SWK = [[0, 0.52, -0.08, 0.04], [0.12, 0.42, -0.3, 0.06], [0.28, 0.08, -0.42, -0.02], [0.44, -0.34, -0.26, 0.08], [0.52, -0.44, -0.08, 0.12],
        [0.68, -0.22, 0.04, 0.2], [0.84, 0.18, 0.04, 0.2], [0.95, 0.46, 0.02, 0.1], [1, 0.52, -0.08, 0.04]];
      var arm = function (p) {
        p = ((p % 1) + 1) % 1; var n = SWK.length, i = 0;
        while (i < n - 2 && p > SWK[i + 1][0]) i++;
        var k0 = SWK[(i - 1 + n - 1) % (n - 1)], k1 = SWK[i], k2 = SWK[i + 1], k3 = SWK[(i + 2) % (n - 1)], tt = (p - k1[0]) / (k2[0] - k1[0]);
        var r = [1, 2, 3].map(function (c) { return crVal(k0[c], k1[c], k2[c], k3[c], tt); });
        var rec = p > 0.5 && p < 0.97;
        return { rel: r, pole: rec ? [0, 1, 0.8] : [0, 0.35, 1], palm: rec ? [0, 0, -1] : [-0.4, -1, 0] };
      };
      var kick = function (p) { var a = Math.sin(p * Math.PI * 6); return { th: -90 + 9 * a, sh: -90 + 9 * a - 8 - 12 * Math.max(0, a), footRel: 82 }; };
      var rl = 34 * Math.sin(w);
      return { hip: [0, 0], torso: 90, head: 6, roll: [rl, 0, 0.53, 0], armsR: arm(ph), armsL: arm(ph + 0.5), legsR: kick(ph), legsL: kick(ph + 1 / 6) };
    }
    if (kind === 'stair') {
      // peldaño superior en ST0; cada medio ciclo los peldaños bajan uno (STD)
      var ST0 = [0.17, 0.44], STD = [-0.25, -0.2]; // huella 25 cm, contrahuella 20 cm: los dedos no quedan bajo el peldaño de arriba
      var sfoot = function (p) {
        p = ((p % 1) + 1) % 1;
        if (p < 0.5) { var u = p / 0.5; return { a: [ST0[0] + STD[0] * u, ST0[1] + STD[1] * u + ANK], f: 0 }; }
        var v = smooth((p - 0.5) / 0.5), lift = Math.sin(Math.PI * v);
        // el pie sube primero y avanza después; nunca por debajo del peldaño al que va, que todavía está bajando
        var vx = smooth(clamp((v - 0.25) / 0.7, 0, 1));
        var yP = lerp(ST0[1] + STD[1], ST0[1], Math.pow(v, 0.35)) + ANK + 0.1 * lift, su = (p - 0.5) / 0.5, yS = ST0[1] - STD[1] * (1 - su) + ANK + 0.03 * (1 - su); // el peldaño baja de forma lineal (su), no suavizada
        return { a: [lerp(ST0[0] + STD[0], ST0[0], vx), v > 0.4 ? Math.max(yP, yS) : yP], f: -10 * Math.sin(Math.PI * v) };
      };
      var sR = sfoot(ph), sL = sfoot(ph + 0.5);
      return { hip: [-0.1, 1.2 + 0.015 * Math.cos(4 * Math.PI * ph)], torso: 7, head: -4,
        legsR: { ik: sR.a, fw: 0.11, foot: sR.f, pole: [1, 0.2, 0.12] }, legsL: { ik: sL.a, fw: 0.11, foot: sL.f, pole: [1, 0.2, 0.12] },
        arms: { ik: [0.1, 1.1], gw: 0.3, palm: 'neu', pole: [-0.2, -1, 0.4] }, stairs: (ph * 2) % 1 };
    }
    if (kind === 'elliptical') {
      // pedal derecho en la elipse; el izquierdo, en oposición. Asa del mismo lado: atrás cuando el pie va delante
      var EC = [0.1, 0.33], EA = 0.23, EB = 0.075;
      var pR = [EC[0] + EA * Math.cos(w), EC[1] + EB * Math.sin(w)], pL = [EC[0] - EA * Math.cos(w), EC[1] - EB * Math.sin(w)];
      var hR = [0.25 - 0.1 * Math.cos(w), 1.2], hL = [0.25 + 0.1 * Math.cos(w), 1.2];
      var fR = -9 * Math.sin(w), fL = 9 * Math.sin(w);
      return { hip: [0.0, 1.17 + 0.012 * Math.sin(2 * w)], torso: 4, head: -3,
        legsR: { ik: [pR[0], pR[1] + 0.03 + ANK], fw: 0.11, foot: fR, pole: [1, 0.1, 0.15] }, legsL: { ik: [pL[0], pL[1] + 0.03 + ANK], fw: 0.11, foot: fL, pole: [1, 0.1, 0.15] },
        armsR: { ik: [hR[0], hR[1]], gw: 0.27, palm: 'neu', pole: [-0.3, -1, 0.5] }, armsL: { ik: [hL[0], hL[1]], gw: 0.27, palm: 'neu', pole: [-0.3, -1, 0.5] },
        ell: { pR: pR, pL: pL, hR: hR, hL: hL, fR: fR, fL: fL, w: w } };
    }
    if (kind === 'run' || kind === 'walk') {
      var run = kind === 'run', base = (run ? BELT : 0) + ANK;
      var R = gaitAnkle(w, run ? 0.34 : 0.24, run ? 0.24 : 0.09, base), L = gaitAnkle(w + Math.PI, run ? 0.34 : 0.24, run ? 0.24 : 0.09, base);
      var bob = (run ? 0.03 : 0.015) * Math.abs(Math.cos(w));
      var hipY = (run ? BELT + 0.925 : 0.955) + bob;
      var fa = function (a) { var s = Math.sin(a); return s < 0 ? 10 * s : 0; };
      var f = { hip: [0, hipY], torso: run ? 8 : 1,
        legsR: { ik: R, fw: 0.1, foot: fa(w) }, legsL: { ik: L, fw: 0.1, foot: fa(w + Math.PI) } };
      var s1 = Math.cos(w);
      if (run) { f.armsR = { ua: 32 * s1, fa: 32 * s1 + 95, palm: 'neu' }; f.armsL = { ua: -32 * s1, fa: -32 * s1 + 95, palm: 'neu' }; }
      else { f.armsR = { ua: 5 * s1, fa: 5 * s1 + 3, palm: 'neu' }; f.armsL = { ua: -5 * s1, fa: -5 * s1 + 3, palm: 'neu' }; }
      return f;
    }
    if (kind === 'bike') {
      var cr = [0.18, 0.36], r = 0.17;
      var pr = [cr[0] + Math.cos(-w) * r, cr[1] + Math.sin(-w) * r], pl = [cr[0] - Math.cos(-w) * r, cr[1] - Math.sin(-w) * r];
      var bf = (d && d.bikeFit) || {}, bp0 = { hip: bf.hip || [-0.3, 0.98], torso: bf.torso != null ? bf.torso : 28, head: bf.head || 0,
        legsR: { ik: [pr[0] - 0.03, pr[1] + 0.03], fw: 0.11 }, legsL: { ik: [pl[0] - 0.03, pl[1] + 0.03], fw: 0.11 }, pedals: [pr, pl, cr], crankW: w };
      if (bf.air) {
        // asa derecha adelante cuando empuja la pierna izquierda (movimiento contralateral)
        var ax = bf.hands[0], ay = bf.hands[1];
        bp0.armsR = { ik: [ax + 0.11 * Math.sin(w), ay], gw: 0.27, palm: 'neu', pole: [-0.3, -1, 0.6] };
        bp0.armsL = { ik: [ax - 0.11 * Math.sin(w), ay], gw: 0.27, palm: 'neu', pole: [-0.3, -1, 0.6] };
        bp0.airH = [ax + 0.11 * Math.sin(w), ax - 0.11 * Math.sin(w), ay];
      } else bp0.arms = { ik: bf.hands || [0.34, 1.18], gw: bf.gw || 0.22, palm: bf.palm || 'pro', pole: bf.pole };
      return bp0;
    }
    if (kind === 'rowErg') {
      var u;
      if (ph < 0.4) u = ph / 0.4; else if (ph < 0.48) u = 1; else u = 1 - (ph - 0.48) / 0.52;
      var legs = smooth(clamp(u / 0.55, 0, 1)), back = smooth(clamp((u - 0.35) / 0.35, 0, 1)), arms = smooth(clamp((u - 0.55) / 0.45, 0, 1));
      if (ph >= 0.48) { var v = 1 - u; arms = 1 - smooth(clamp(v / 0.35, 0, 1)); back = 1 - smooth(clamp((v - 0.2) / 0.35, 0, 1)); legs = 1 - smooth(clamp((v - 0.4) / 0.6, 0, 1)); }
      // en el agarre (catch) las rodillas quedan junto al pecho sin atravesarlo
      var hx = lerp(-0.07, -0.42, legs), tor = lerp(24, -18, back); // agarre con las tibias casi verticales: cadera ~135°
      var tt = rad(tor), shx = hx + Math.sin(tt) * SPINE, shy = 0.36 + Math.cos(tt) * SPINE;
      var reach = [shx + 0.5, 0.7], pull = [hx + 0.2, 0.68];
      return { hip: [hx, 0.36], torso: tor, head: -5, legs: { ik: [0.66, 0.36], fw: 0.12, foot: -62, pole: [0.2, 1, 0.25] },
        arms: { ik: [lerp(reach[0], pull[0], arms), lerp(reach[1], pull[1], arms)], gw: 0.14, pole: [-1, -0.3, 0.45], palm: 'pro' } };
    }
    if (kind === 'jumpRope') {
      var hop = 0.06 * Math.pow(Math.max(0, Math.cos(w)), 2);
      var flex = 0.03 * Math.pow(Math.max(0, -Math.cos(w)), 2);
      var circle = [0.04 * Math.sin(w), 0.04 * Math.cos(w)];
      return { hip: [0, 0.965 + hop - flex], torso: 0,
        legs: { ik: [0.0, ANK + hop * 0.9], fw: 0.1, foot: hop > 0.01 ? 22 * (hop / 0.06) : 0 },
        arms: { rel: [0.1 + circle[0], -0.42 + circle[1], 0.2], pole: [-1, -0.5, 0], palm: [0, 0.4, -1] }, rope: w };
    }
  }

  // ---------------------------------------------------------------------------
  //  Interpolación
  // ---------------------------------------------------------------------------
  function tempo(ph) {
    if (ph < 0.36) return smooth(ph / 0.36);
    if (ph < 0.46) return 1;
    if (ph < 0.9) return 1 - smooth((ph - 0.46) / 0.44);
    return 0;
  }
  // Catmull-Rom sobre posturas completas (movimiento continuo, sin parones entre fases)
  function crVal(p0, p1, p2, p3, t) {
    p0 = num(p0); p1 = num(p1); p2 = num(p2); p3 = num(p3);
    if (typeof p1 === 'number' && typeof p2 === 'number') {
      var a = typeof p0 === 'number' ? p0 : p1, d = typeof p3 === 'number' ? p3 : p2;
      var t2 = t * t, t3 = t2 * t;
      return 0.5 * (2 * p1 + (-a + p2) * t + (2 * a - 5 * p1 + 4 * p2 - d) * t2 + (-a + 3 * p1 - 3 * p2 + d) * t3);
    }
    if (Array.isArray(p1) && Array.isArray(p2)) return p1.map(function (v, i) { return crVal(p0 && p0[i], v, p2[i], p3 && p3[i], t); });
    if (p1 && p2 && typeof p1 === 'object' && typeof p2 === 'object') {
      var r = {}, k;
      for (k in p1) r[k] = (k in p2) ? crVal(p0 && p0[k], p1[k], p2[k], p3 && p3[k], t) : mixVal(p1[k], undefined, t);
      for (k in p2) if (!(k in r)) r[k] = mixVal(undefined, p2[k], t);
      return r;
    }
    return t < 0.5 ? p1 : p2;
  }
  function keyPose(keys, ph) {
    var n = keys.length;
    for (var i = 0; i < n - 1; i++) {
      if (ph <= keys[i + 1][0]) {
        var t = (ph - keys[i][0]) / Math.max(1e-6, keys[i + 1][0] - keys[i][0]);
        var p0 = keys[Math.max(0, i - 1)][1], p3 = keys[Math.min(n - 1, i + 2)][1];
        return crVal(p0, keys[i][1], keys[i + 1][1], p3, t);
      }
    }
    return keys[n - 1][1];
  }
  function poseAt(d, phase) {
    if (d.cyclic) return { f: cyclicPose(d.cyclic, phase, d), u: 0 };
    if (d.keys) return { f: keyPose(d.keys, phase), u: 0 };
    var u = tempo(phase);
    return { f: mixVal(d.A, d.B, u), u: u };
  }

  // ---------------------------------------------------------------------------
  //  Modelo humano (Mixamo): esqueleto movido por la cinemática + músculos en la piel
  // ---------------------------------------------------------------------------
  var MODEL = null, MODEL_SCALE = 0.97 / 116.5, MUSCLE_CACHE = null;
  var BAKED = {"bench:barbell":{"pads":[[2,0,-0.0382,0]],"h":[[0,3,0,0,3,0],[0,9,0,0,9,0],[0,17,0,0,17,0],[0,27,0,0,27,0],[0,34,0,0,34,0],[0,39,0,0,39,0],[0,41,0,0,41,0],[0,43,0,0,43,0],[0,43,0,0,43,0],[0,43,0,0,43,0],[0,43,0,0,43,0],[0,41,0,0,41,0],[0,37,0,0,37,0],[0,32,0,0,32,0],[0,24,0,0,24,0],[0,15,0,0,15,0],[0,7,0,0,7,0],[0,3,0,0,3,0],[0,1,0,0,1,0],[0,0,0,0,0,0],[0,0,0,0,0,0]]},"bench:dumbbell":{"pads":[[2,0,-0.0382,0]]},"incline:barbell":{"pads":[[3,0,-0.0427,0]],"h":[[0,0,0,0,0,0],[1,1,0,1,1,0],[3,4,0,3,4,0],[7,9,0,7,9,0],[12,15,0,12,15,0],[15,20,0,15,20,0],[17,22,0,17,22,0],[18,23,0,18,23,0],[18,23,0,18,23,0],[18,23,0,18,23,0],[18,22,0,18,22,0],[17,21,0,17,21,0],[14,18,0,14,18,0],[10,13,0,10,13,0],[6,7,0,6,7,0],[2,3,0,2,3,0],[1,1,0,1,1,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]]},"incline:dumbbell":{"pads":[[3,0,-0.0427,0]]},"bench:machine":{"pads":[[2,0,-0.0382,0]]},"incline:machine":{"pads":[[3,0,-0.0427,0]]},"chestPress:machine":{"pads":[[2,0,-0.0251,0],[5,0,0.0094,0]]},"chestPress:cable":{"pads":[[2,0,-0.0251,0],[5,0,0.0094,0]]},"fly:dumbbell":{"pads":[[2,0,-0.0382,0]]},"pullover:dumbbell":{"pads":[[2,0,-0.0382,0]]},"deadlift:dumbbell":{"h":[[17,-3,-32,18,-3,34],[17,-3,-33,18,-3,35],[17,-3,-33,18,-3,35],[17,-1,-34,18,-1,36],[16,4,-42,17,4,43],[16,8,-58,16,8,58],[17,11,-74,17,11,74],[19,12,-83,19,12,83],[21,13,-85,21,13,85],[21,13,-85,21,13,85],[21,13,-85,21,13,85],[21,12,-83,21,12,83],[20,11,-75,20,11,75],[17,9,-60,17,9,60],[16,6,-44,16,6,45],[16,2,-35,17,2,36],[17,-1,-32,18,-1,34],[17,-3,-33,18,-3,35],[17,-3,-33,18,-3,35],[17,-3,-32,17,-3,34],[17,-3,-32,17,-3,34]]},"pullup:none":{"b":[[-109,-10],[-119,-11],[-126,-12],[-128,-12],[-127,-12],[-124,-12],[-116,-12],[-102,-11],[-88,-10],[-90,-11],[-106,-12],[-122,-13],[-131,-14],[-135,-14],[-135,-14],[-134,-14],[-126,-13],[-107,-11],[-79,-8],[-49,-4],[-29,-2]]},"pullup:machine":{"b":[[-109,-10],[-119,-11],[-126,-12],[-128,-12],[-127,-12],[-124,-12],[-116,-12],[-102,-11],[-88,-10],[-90,-11],[-106,-12],[-122,-13],[-131,-14],[-135,-14],[-135,-14],[-134,-14],[-126,-13],[-107,-11],[-79,-8],[-49,-4],[-29,-2]]},"dbRow:dumbbell":{"pads":[[2,0,-0.0099,0]],"h":[[0,0,0,3,0,1],[0,0,0,10,1,4],[0,0,0,20,2,8],[0,0,0,30,4,13],[0,0,0,35,4,15],[0,0,0,36,4,15],[0,0,0,36,4,15],[0,0,0,36,4,15],[0,0,0,35,3,15],[0,0,0,35,3,15],[0,0,0,35,4,16],[0,0,0,36,4,16],[0,0,0,35,4,16],[0,0,0,33,4,15],[0,0,0,28,3,12],[0,0,0,20,2,9],[0,0,0,11,1,5],[0,0,0,4,1,2],[0,0,0,1,0,1],[0,0,0,0,0,0],[0,0,0,0,0,0]]},"row:dumbbell":{"h":[[14,6,-33,14,6,33],[15,7,-36,16,6,36],[16,8,-38,17,7,39],[17,8,-39,17,8,39],[17,8,-39,17,8,39],[16,9,-38,16,8,39],[16,9,-38,15,8,37],[14,9,-36,14,9,34],[14,9,-34,13,9,32],[13,9,-35,13,8,33],[14,9,-36,14,8,35],[15,9,-37,15,8,37],[16,9,-38,16,8,39],[16,9,-39,16,8,39],[16,8,-39,16,8,39],[16,8,-39,16,8,39],[16,7,-38,16,7,38],[15,6,-35,15,6,35],[14,5,-31,14,5,31],[13,5,-29,13,5,29],[13,5,-28,13,5,28]]},"seatedRow:cable":{"pads":[[5,0.0315,-0.0102,0],[6,0.0321,-0.0104,0]]},"seatedRow:machine":{"pads":[[5,0.0315,-0.0102,0],[6,0.0321,-0.0104,0]]},"pulldown:cable":{"pads":[[2,0,-0.0321,0],[4,0,-0.0333,0],[5,0,0.0264,0],[12,0,-0.009,0]],"h":[[84,20,0,84,20,0],[102,25,0,102,25,0],[115,29,0,115,29,0],[118,29,0,118,29,0],[117,29,0,117,29,0],[112,29,0,112,29,0],[99,26,0,99,26,0],[77,21,0,77,21,0],[59,17,0,59,17,0],[60,17,0,60,17,0],[78,22,0,78,22,0],[99,27,0,99,27,0],[112,30,0,112,30,0],[117,30,0,117,30,0],[118,30,0,118,30,0],[116,30,0,116,30,0],[109,28,0,109,28,0],[92,22,0,92,22,0],[67,15,0,67,15,0],[40,9,0,40,9,0],[22,5,0,22,5,0]]},"pulldown:machine":{"pads":[[2,0,-0.0321,0],[4,0,-0.0333,0],[5,0,0.0264,0],[12,0,-0.009,0]],"h":[[84,20,0,84,20,0],[102,25,0,102,25,0],[115,29,0,115,29,0],[118,29,0,118,29,0],[117,29,0,117,29,0],[112,29,0,112,29,0],[99,26,0,99,26,0],[77,21,0,77,21,0],[59,17,0,59,17,0],[60,17,0,60,17,0],[78,22,0,78,22,0],[99,27,0,99,27,0],[112,30,0,112,30,0],[117,30,0,117,30,0],[118,30,0,118,30,0],[116,30,0,116,30,0],[109,28,0,109,28,0],[92,22,0,92,22,0],[67,15,0,67,15,0],[40,9,0,40,9,0],[22,5,0,22,5,0]]},"hyperext:none":{"pads":[[2,0,0.0279,0]]},"shrug:barbell":{"h":[[134,0,0,134,0,0],[134,0,0,134,0,0],[134,0,0,134,0,0],[132,0,0,132,0,0],[130,0,0,130,0,0],[128,0,0,128,0,0],[128,0,0,128,0,0],[127,0,0,127,0,0],[126,0,0,126,0,0],[126,0,0,126,0,0],[126,0,0,126,0,0],[127,0,0,127,0,0],[128,0,0,128,0,0],[131,0,0,131,0,0],[133,0,0,133,0,0],[134,0,0,134,0,0],[134,0,0,134,0,0],[134,0,0,134,0,0],[134,0,0,134,0,0],[134,0,0,134,0,0],[134,0,0,134,0,0]]},"shrug:dumbbell":{"h":[[12,13,-93,12,13,94],[12,13,-93,12,13,94],[13,13,-93,12,13,94],[13,13,-92,12,12,93],[13,12,-91,12,12,91],[12,12,-88,12,12,89],[12,12,-87,11,12,87],[11,12,-86,11,11,86],[11,11,-85,10,11,85],[11,11,-85,10,11,85],[11,11,-85,11,11,85],[12,12,-86,12,11,86],[12,12,-88,12,12,88],[12,12,-91,12,12,91],[12,13,-92,12,12,93],[12,13,-93,12,13,93],[12,13,-93,12,13,93],[12,13,-93,12,13,93],[12,13,-92,12,14,92],[12,13,-92,12,14,92],[12,13,-92,12,14,91]]},"ohp:barbell":{"h":[[134,2,0,134,2,0],[150,3,0,150,3,0],[162,3,0,162,3,0],[164,3,0,164,3,0],[164,3,0,164,3,0],[161,3,0,161,3,0],[146,3,0,146,3,0],[116,2,0,116,2,0],[88,2,0,88,2,0],[88,2,0,88,2,0],[115,2,0,115,2,0],[143,3,0,143,3,0],[157,3,0,157,3,0],[160,3,0,160,3,0],[161,3,0,161,3,0],[159,3,0,159,3,0],[150,3,0,150,3,0],[133,2,0,133,2,0],[111,2,0,111,2,0],[89,1,0,89,1,0],[72,1,0,72,1,0]]},"ohp:dumbbell":{"h":[[5,3,-19,5,3,19],[5,3,-19,5,3,19],[5,4,-18,5,3,18],[4,3,-16,4,3,15],[3,2,-10,3,2,9],[1,1,-4,1,1,4],[0,0,-1,0,0,1],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,-1,0,0,1],[2,1,-5,1,1,5],[3,2,-12,3,2,12],[5,3,-17,5,3,17],[5,4,-19,5,3,19],[5,4,-19,5,3,19],[5,3,-19,5,3,19],[5,2,-19,5,2,19],[4,2,-19,5,2,19]]},"lateral:dumbbell":{"h":[[97,0,0,96,0,0],[96,0,0,95,0,0],[91,0,0,90,0,0],[77,0,0,77,0,0],[57,0,0,57,0,0],[34,0,0,34,0,0],[16,0,0,16,0,0],[5,0,0,5,0,0],[1,0,0,1,0,0],[1,0,0,1,0,0],[5,0,0,5,0,0],[12,0,0,12,0,0],[25,0,0,24,0,0],[41,0,0,41,0,0],[62,0,0,62,0,0],[81,0,0,81,0,0],[92,0,0,92,0,0],[96,0,0,96,0,0],[97,0,0,96,0,0],[97,0,0,96,0,0],[97,0,0,96,0,0]]},"lateral:barbell":{"h":[[30,0,0,30,0,0],[29,0,0,29,0,0],[25,0,0,25,0,0],[18,0,0,18,0,0],[10,0,0,10,0,0],[5,0,0,5,0,0],[1,0,0,1,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[2,0,0,2,0,0],[6,0,0,6,0,0],[13,0,0,13,0,0],[21,0,0,21,0,0],[27,0,0,27,0,0],[29,0,0,29,0,0],[30,0,0,30,0,0],[30,0,0,30,0,0],[30,0,0,30,0,0]]},"facePull:machine":{"h":[[2,0,0,2,0,0],[8,0,0,8,0,0],[20,1,0,20,1,0],[37,2,0,37,2,0],[54,3,0,54,3,0],[66,3,0,66,3,0],[70,4,0,70,4,0],[71,4,0,71,4,0],[71,4,0,71,4,0],[71,4,0,71,4,0],[71,4,0,71,4,0],[69,4,0,69,4,0],[63,3,0,63,3,0],[50,3,0,50,3,0],[33,2,0,33,2,0],[17,1,0,17,1,0],[7,0,0,7,0,0],[1,0,0,1,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]]},"facePull:cable":{"h":[[2,0,0,2,0,0],[8,0,0,8,0,0],[20,1,0,20,1,0],[37,2,0,37,2,0],[54,3,0,54,3,0],[66,3,0,66,3,0],[70,4,0,70,4,0],[71,4,0,71,4,0],[71,4,0,71,4,0],[71,4,0,71,4,0],[71,4,0,71,4,0],[69,4,0,69,4,0],[63,3,0,63,3,0],[50,3,0,50,3,0],[33,2,0,33,2,0],[17,1,0,17,1,0],[7,0,0,7,0,0],[1,0,0,1,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]]},"uprightRow:barbell":{"h":[[78,0,0,78,0,0],[78,0,0,78,0,0],[78,0,0,78,0,0],[78,0,0,78,0,0],[79,0,0,79,0,0],[80,0,0,80,0,0],[80,0,0,80,0,0],[80,0,0,80,0,0],[79,0,0,79,0,0],[79,0,0,79,0,0],[80,0,0,80,0,0],[80,0,0,80,0,0],[80,0,0,80,0,0],[80,0,0,80,0,0],[80,0,0,80,0,0],[80,0,0,80,0,0],[80,0,0,80,0,0],[79,0,0,79,0,0],[77,0,0,77,0,0],[75,0,0,75,0,0],[72,0,0,72,0,0]]},"curl:barbell":{"h":[[141,0,0,141,0,0],[140,0,0,140,0,0],[135,0,0,135,0,0],[127,0,0,127,0,0],[116,0,0,116,0,0],[102,0,0,102,0,0],[86,0,0,86,0,0],[70,0,0,70,0,0],[56,0,0,56,0,0],[53,0,0,53,0,0],[62,0,0,62,0,0],[76,0,0,76,0,0],[90,0,0,90,0,0],[104,0,0,104,0,0],[118,0,0,118,0,0],[128,0,0,128,0,0],[136,0,0,136,0,0],[140,0,0,140,0,0],[141,0,0,141,0,0],[141,0,0,141,0,0],[141,0,0,141,0,0]]},"curl:dumbbell":{"h":[[0,0,-154,0,0,154],[0,0,-154,0,0,154],[0,0,-154,0,0,154],[0,0,-153,0,0,153],[0,0,-150,0,0,149],[0,0,-139,0,0,139],[0,0,-122,0,0,121],[0,0,-101,0,0,100],[0,0,-83,0,0,84],[0,0,-74,0,0,76],[0,0,-73,0,0,76],[0,0,-80,0,0,86],[0,0,-96,0,0,103],[0,0,-118,0,0,125],[0,0,-141,0,0,145],[0,0,-156,0,0,154],[0,0,-160,0,0,156],[0,0,-158,0,0,156],[0,0,-154,0,0,155],[0,0,-151,0,0,153],[0,0,-150,0,0,152]]},"preacherCurl:dumbbell":{"pads":[[4,0,-0.0225,0]]},"preacherCurl:barbell":{"pads":[[4,0,-0.0225,0]]},"preacherCurl:machine":{"pads":[[4,0,-0.0225,0]]},"pushdown:cable":{"h":[[0,0,0,0,0,0],[2,0,0,2,0,0],[5,-1,0,5,-1,0],[11,-2,0,11,-2,0],[20,-4,0,20,-4,0],[29,-5,0,29,-5,0],[34,-6,0,34,-6,0],[35,-6,0,35,-6,0],[35,-6,0,35,-6,0],[35,-6,0,35,-6,0],[35,-6,0,35,-6,0],[33,-6,0,33,-6,0],[26,-5,0,26,-5,0],[16,-3,0,16,-3,0],[7,-1,0,7,-1,0],[2,0,0,2,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]]},"skullCrusher:barbell":{"pads":[[2,0,-0.0382,0]]},"skullCrusher:dumbbell":{"pads":[[2,0,-0.0382,0]],"h":[[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,-1,0,0,1],[-1,1,-3,-1,1,3],[-3,1,-6,-3,1,6],[-4,2,-8,-4,2,8],[-4,2,-8,-4,2,8],[-4,2,-8,-4,2,8],[-4,2,-8,-4,2,8],[-4,2,-8,-4,2,8],[-4,2,-8,-3,1,7],[-3,1,-6,-2,1,5],[-1,0,-2,-1,0,2],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]]},"kickback:dumbbell":{"pads":[[2,0,-0.0099,0]],"h":[[0,0,0,91,41,33],[0,0,0,91,51,33],[0,0,0,91,59,34],[0,0,0,91,61,34],[0,0,0,88,62,34],[0,0,0,73,61,33],[0,0,0,36,59,32],[0,0,0,-5,53,28],[0,0,0,-22,45,25],[0,0,0,-24,46,29],[0,0,0,-11,54,36],[0,0,0,28,61,40],[0,0,0,69,63,42],[0,0,0,91,63,43],[0,0,0,99,63,44],[0,0,0,100,61,44],[0,0,0,99,54,44],[0,0,0,97,41,42],[0,0,0,92,26,37],[0,0,0,87,14,31],[0,0,0,84,6,26]]},"kickback:cable":{"pads":[[2,0,-0.0099,0]]},"pushdown:machine":{"h":[[0,0,0,0,0,0],[2,0,0,2,0,0],[5,-1,0,5,-1,0],[11,-2,0,11,-2,0],[20,-4,0,20,-4,0],[29,-5,0,29,-5,0],[34,-6,0,34,-6,0],[35,-6,0,35,-6,0],[35,-6,0,35,-6,0],[35,-6,0,35,-6,0],[35,-6,0,35,-6,0],[33,-6,0,33,-6,0],[26,-5,0,26,-5,0],[16,-3,0,16,-3,0],[7,-1,0,7,-1,0],[2,0,0,2,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]]},"walk:dumbbell":{"h":[[0,0,-95,0,0,76],[0,0,-98,0,0,80],[0,0,-100,0,0,85],[0,0,-101,0,0,90],[0,0,-101,0,0,92],[0,0,-101,0,0,92],[0,0,-101,0,0,92],[0,0,-101,0,0,91],[0,0,-100,0,0,88],[0,0,-97,0,0,88],[0,0,-89,0,0,93],[0,0,-84,0,0,98],[0,0,-86,0,0,100],[0,0,-90,0,0,101],[0,0,-92,0,0,101],[0,0,-92,0,0,101],[0,0,-92,0,0,101],[0,0,-91,0,0,101],[0,0,-88,0,0,100],[0,0,-83,0,0,97],[0,0,-81,0,0,92]]},"frontSquat:dumbbell":{"h":[[20,-24,0,20,-24,0],[20,-24,0,20,-24,0],[20,-25,0,20,-25,0],[20,-25,0,20,-25,0],[19,-26,0,19,-26,0],[18,-26,0,18,-26,0],[16,-27,0,16,-27,0],[15,-27,0,15,-27,0],[14,-27,0,14,-27,0],[14,-27,0,14,-27,0],[15,-27,0,15,-27,0],[16,-27,0,16,-27,0],[18,-27,0,18,-27,0],[19,-26,0,19,-26,0],[19,-26,0,19,-26,0],[20,-25,0,20,-25,0],[20,-25,0,20,-25,0],[20,-24,0,20,-24,0],[20,-23,0,20,-23,0],[20,-23,0,20,-23,0],[20,-23,0,20,-23,0]]},"squat:machine":{"pads":[[51,0,-0.015,0]]},"lunge:dumbbell":{"h":[[-82,-3,-38,0,0,0],[-90,-3,-40,0,0,0],[-99,-3,-42,0,0,0],[-106,-3,-43,0,0,0],[-111,-3,-44,0,0,0],[-117,-3,-44,0,0,0],[-124,-3,-44,0,0,0],[-132,-2,-44,0,0,0],[-139,-2,-44,0,0,0],[-143,-2,-43,0,0,0],[-144,-2,-43,0,0,0],[-143,-2,-43,0,0,0],[-142,-2,-44,0,0,0],[-137,-2,-44,0,0,0],[-129,-3,-44,0,0,0],[-121,-3,-44,0,0,0],[-115,-3,-44,0,0,0],[-110,-3,-44,0,0,0],[-104,-3,-43,0,0,0],[-96,-3,-41,0,0,0],[-89,-3,-39,0,0,0]]},"legPress:machine":{"pads":[[3,0,0.0041,0]]},"legExt:machine":{"pads":[[2,0,-0.0187,0],[5,0,0.0121,0]]},"rdl:dumbbell":{"h":[[24,17,-84,23,17,84],[24,17,-84,24,17,84],[25,17,-84,24,18,84],[25,17,-82,24,17,82],[24,17,-78,24,17,78],[23,15,-70,23,15,70],[21,13,-60,21,13,60],[19,10,-50,20,10,51],[18,7,-42,19,7,43],[18,4,-38,18,5,39],[18,5,-38,18,5,39],[18,7,-42,19,7,44],[19,10,-51,20,10,52],[21,13,-61,22,13,62],[23,16,-71,24,15,71],[24,17,-79,25,17,79],[24,17,-83,25,17,83],[24,17,-85,25,17,86],[24,17,-85,24,17,86],[22,17,-85,22,17,86],[19,16,-85,19,16,86]]},"legCurl:machine":{"pads":[[2,0,-0.0625,0]]},"legCurl:dumbbell":{"pads":[[2,0,-0.0625,0]]},"legCurl:none":{"pads":[[2,0,-0.0625,0]]},"hipThrust:dumbbell":{"h":[[-23,93,8,-23,93,8],[-23,93,10,-23,93,10],[-22,91,10,-22,91,10],[-21,86,10,-21,86,10],[-19,77,10,-19,77,10],[-16,65,10,-16,65,10],[-12,52,9,-12,52,9],[-8,37,7,-8,37,7],[-5,25,4,-5,25,4],[-5,23,3,-5,23,3],[-7,32,4,-7,32,4],[-11,46,6,-11,46,6],[-15,59,9,-15,59,9],[-18,69,10,-18,69,10],[-20,78,11,-20,78,11],[-22,85,11,-22,85,11],[-23,89,11,-23,89,11],[-23,91,10,-23,91,10],[-23,92,8,-23,92,8],[-23,92,5,-23,92,5],[-23,92,3,-23,92,3]]},"calf:dumbbell":{"h":[[0,0,-33,0,0,33],[0,0,-33,0,0,33],[0,0,-34,0,0,34],[0,0,-34,0,0,34],[0,0,-34,0,0,34],[0,0,-34,0,0,34],[0,0,-33,0,0,33],[0,0,-33,0,0,33],[0,0,-33,0,0,33],[0,0,-33,0,0,33],[0,0,-33,0,0,33],[0,0,-33,0,0,33],[0,0,-33,0,0,33],[0,0,-34,0,0,34],[0,0,-34,0,0,34],[0,0,-34,0,0,34],[0,0,-33,0,0,33],[0,0,-33,0,0,33],[0,0,-33,0,0,33],[0,0,-32,0,0,32],[0,0,-32,0,0,32]]},"crunch:none":{"pads":[[2,0,-0.01,0]]},"crunch:cable":{"pads":[[2,0,-0.01,0]]},"crunch:machine":{"pads":[[2,0,-0.01,0]]},"legRaise:none":{"pads":[[2,0,-0.0083,0]]},"run:none":{"pads":[[3,0,-0.0074,0]]},"run:machine":{"pads":[[3,0,-0.0074,0]]},"bike:machine":{"pads":[[5,0,-0.0484,0]]},"bike:none":{"pads":[[5,0,-0.0484,0]]},"rowErg:machine":{"pads":[[6,0.0309,-0.0164,0],[7,0.0309,-0.0164,0]]},"crunch:kettlebell":{"pads":[[2,0,-0.01,0]],"h":[[-18,-26,0,-18,-26,0],[-22,-26,0,-22,-26,0],[-28,-26,0,-28,-26,0],[-32,-25,0,-32,-25,0],[-35,-24,0,-35,-24,0],[-36,-21,0,-36,-21,0],[-36,-17,0,-36,-17,0],[-36,-12,0,-36,-12,0],[-36,-10,0,-36,-10,0],[-36,-10,0,-36,-10,0],[-36,-12,0,-36,-12,0],[-36,-16,0,-36,-16,0],[-36,-20,0,-36,-20,0],[-35,-23,0,-35,-23,0],[-32,-25,0,-32,-25,0],[-29,-26,0,-29,-26,0],[-24,-26,0,-24,-26,0],[-19,-26,0,-19,-26,0],[-15,-26,0,-15,-26,0],[-13,-26,0,-13,-26,0],[-12,-26,0,-12,-26,0]]},"bench:none":{"pads":[[2,0,-0.0382,0]]},"incline:none":{"pads":[[3,0,-0.0427,0]]},"fly:none":{"pads":[[2,0,-0.0382,0]]},"pulldown:none":{"pads":[[2,0,-0.0321,0],[4,0,-0.0333,0],[5,0,0.0264,0],[12,0,-0.009,0]],"h":[[84,20,0,84,20,0],[102,25,0,102,25,0],[115,29,0,115,29,0],[118,29,0,118,29,0],[117,29,0,117,29,0],[112,29,0,112,29,0],[99,26,0,99,26,0],[77,21,0,77,21,0],[59,17,0,59,17,0],[60,17,0,60,17,0],[78,22,0,78,22,0],[99,27,0,99,27,0],[112,30,0,112,30,0],[117,30,0,117,30,0],[118,30,0,118,30,0],[116,30,0,116,30,0],[109,28,0,109,28,0],[92,22,0,92,22,0],[67,15,0,67,15,0],[40,9,0,40,9,0],[22,5,0,22,5,0]]},"seatedRow:none":{"pads":[[5,0.0315,-0.0102,0],[6,0.0321,-0.0104,0]]},"pushdown:none":{"h":[[0,0,0,0,0,0],[2,0,0,2,0,0],[5,-1,0,5,-1,0],[11,-2,0,11,-2,0],[20,-4,0,20,-4,0],[29,-5,0,29,-5,0],[34,-6,0,34,-6,0],[35,-6,0,35,-6,0],[35,-6,0,35,-6,0],[35,-6,0,35,-6,0],[35,-6,0,35,-6,0],[33,-6,0,33,-6,0],[26,-5,0,26,-5,0],[16,-3,0,16,-3,0],[7,-1,0,7,-1,0],[2,0,0,2,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]]},"legExt:none":{"pads":[[2,0,-0.0187,0],[5,0,0.0121,0]]},"chestPress:none":{"pads":[[2,0,-0.0251,0],[5,0,0.0094,0]]},"legPress:none":{"pads":[[3,0,0.0041,0]]},"facePull:none":{"h":[[2,0,0,2,0,0],[8,0,0,8,0,0],[20,1,0,20,1,0],[37,2,0,37,2,0],[54,3,0,54,3,0],[66,3,0,66,3,0],[70,4,0,70,4,0],[71,4,0,71,4,0],[71,4,0,71,4,0],[71,4,0,71,4,0],[71,4,0,71,4,0],[69,4,0,69,4,0],[63,3,0,63,3,0],[50,3,0,50,3,0],[33,2,0,33,2,0],[17,1,0,17,1,0],[7,0,0,7,0,0],[1,0,0,1,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]]},"kickback:none":{"pads":[[2,0,-0.0099,0]]},"preacherCurl:none":{"pads":[[4,0,-0.0225,0]]},"skullCrusher:none":{"pads":[[2,0,-0.0382,0]]},"rowErg:none":{"pads":[[6,0.0309,-0.0164,0],[7,0.0309,-0.0164,0]]},"pullover:none":{"pads":[[2,0,-0.0382,0]]},"dbRow:none":{"pads":[[2,0,-0.0099,0]]},"curlAlt:dumbbell":{"h":[[0,0,-154,0,0,152],[0,0,-154,0,0,152],[0,0,-154,0,0,149],[0,0,-154,0,0,143],[0,0,-153,0,0,137],[0,0,-153,0,0,140],[0,0,-154,0,0,148],[0,0,-153,0,0,151],[0,0,-153,0,0,151],[0,0,-152,0,0,152],[0,0,-152,0,0,152],[0,0,-151,0,0,153],[0,0,-149,0,0,154],[0,0,-142,0,0,154],[0,0,-136,0,0,155],[0,0,-140,0,0,156],[0,0,-148,0,0,156],[0,0,-151,0,0,156],[0,0,-152,0,0,154],[0,0,-152,0,0,154],[0,0,-152,0,0,153]]},"curlHammer:dumbbell":{"h":[[0,0,-86,0,0,87],[0,0,-87,0,0,88],[0,0,-88,0,0,88],[0,0,-86,0,0,86],[0,0,-76,0,0,77],[0,0,-57,0,0,58],[0,0,-36,0,0,36],[0,0,-22,0,0,22],[0,0,-16,0,0,16],[0,0,-16,0,0,16],[0,0,-22,0,0,22],[0,0,-36,0,0,36],[0,0,-56,0,0,56],[0,0,-72,0,0,72],[0,0,-80,0,0,80],[0,0,-82,0,0,81],[0,0,-82,0,0,81],[0,0,-81,0,0,81],[0,0,-81,0,0,81],[0,0,-80,0,0,80],[0,0,-80,0,0,80]]},"concentrationCurl:dumbbell":{"h":[[0,0,0,-35,19,-149],[0,0,0,-35,19,-153],[0,0,0,-35,25,-163],[0,0,0,-35,37,-179],[0,0,0,-33,43,-187],[0,0,0,-28,41,-182],[0,0,0,-23,36,-166],[0,0,0,-11,28,-140],[0,0,0,8,19,-114],[0,0,0,20,14,-108],[0,0,0,25,13,-127],[0,0,0,29,15,-153],[0,0,0,32,16,-169],[0,0,0,36,16,-173],[0,0,0,37,16,-172],[0,0,0,37,15,-170],[0,0,0,34,16,-166],[0,0,0,27,16,-161],[0,0,0,18,16,-151],[0,0,0,11,13,-130],[0,0,0,7,11,-109]]},"curlIncline:dumbbell":{"pads":[[2,0,0.0645,0],[3,0,-0.0425,0]],"h":[[0,0,0,0,0,0],[0,0,-3,0,0,3],[0,0,-10,0,0,10],[0,0,-21,0,0,20],[0,0,-32,0,0,29],[0,0,-40,0,0,36],[0,0,-43,0,0,40],[0,0,-44,0,0,40],[0,0,-44,0,0,40],[0,0,-44,0,0,40],[0,0,-44,0,0,40],[0,0,-43,0,0,39],[0,0,-39,0,0,36],[0,0,-31,0,0,28],[0,0,-20,0,0,18],[0,0,-9,0,0,8],[0,0,-3,0,0,3],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]]},"curlSpider:dumbbell":{"pads":[[2,0,-0.065,0],[5,0,-0.0311,0]],"h":[[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,-2,0,0,2],[0,0,-8,0,0,8],[0,0,-19,0,0,18],[0,0,-26,0,0,26],[0,0,-29,0,0,28],[0,0,-29,0,0,28],[0,0,-29,0,0,28],[0,0,-29,0,0,28],[0,0,-29,0,0,28],[0,0,-28,0,0,28],[0,0,-25,0,0,25],[0,0,-17,0,0,17],[0,0,-7,0,0,7],[0,0,-1,0,0,1],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]]},"pushdownReverse:cable":{"h":[[0,0,0,0,0,0],[2,0,0,2,0,0],[5,-1,0,5,-1,0],[11,-2,0,11,-2,0],[20,-4,0,20,-4,0],[29,-5,0,29,-5,0],[34,-6,0,34,-6,0],[35,-6,0,35,-6,0],[35,-6,0,35,-6,0],[35,-6,0,35,-6,0],[35,-6,0,35,-6,0],[33,-6,0,33,-6,0],[26,-5,0,26,-5,0],[16,-3,0,16,-3,0],[7,-1,0,7,-1,0],[2,0,0,2,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]]},"benchClose:barbell":{"pads":[[2,0,-0.0382,0]],"h":[[0,3,0,0,3,0],[0,8,0,0,8,0],[0,17,0,0,17,0],[0,26,0,0,26,0],[0,35,0,0,35,0],[0,40,0,0,40,0],[0,42,0,0,42,0],[0,43,0,0,43,0],[0,43,0,0,43,0],[0,43,0,0,43,0],[0,42,0,0,42,0],[0,41,0,0,41,0],[0,37,0,0,37,0],[0,31,0,0,31,0],[0,24,0,0,24,0],[0,15,0,0,15,0],[0,7,0,0,7,0],[0,3,0,0,3,0],[0,1,0,0,1,0],[0,0,0,0,0,0],[0,0,0,0,0,0]]},"benchJM:barbell":{"pads":[[2,0,-0.0382,0]]},"dipMachine:machine":{"pads":[[2,0,-0.0088,0]]},"wristCurl:dumbbell":{"h":[[72,-21,95,73,-12,-97],[72,-20,95,73,-12,-97],[70,-18,85,71,-12,-86],[67,-9,66,67,-6,-67],[63,5,54,63,7,-56],[56,12,53,57,13,-55],[42,12,52,44,13,-54],[28,11,48,29,12,-50],[17,10,42,18,11,-44],[15,11,40,16,12,-43],[22,12,46,25,14,-48],[34,13,52,39,15,-53],[48,14,56,54,15,-53],[60,14,57,63,15,-54],[66,6,59,67,7,-59],[70,-11,72,70,-8,-74],[73,-20,90,72,-16,-90],[73,-23,99,73,-16,-96],[73,-26,100,73,-16,-96],[73,-26,100,73,-15,-95],[72,-27,100,73,-15,-94]]},"wristCurlRev:dumbbell":{"h":[[26,21,79,28,19,-92],[31,21,79,33,19,-92],[35,18,76,38,16,-88],[36,14,68,40,13,-77],[36,12,59,40,13,-63],[33,13,54,37,14,-53],[25,12,51,30,14,-49],[17,11,44,19,13,-46],[12,10,34,12,11,-39],[10,9,31,11,10,-36],[12,11,38,14,12,-43],[18,13,47,21,13,-52],[26,14,51,29,13,-56],[31,13,54,34,13,-61],[32,13,62,35,11,-70],[32,15,71,35,12,-80],[29,19,79,34,16,-89],[25,21,84,30,18,-92],[22,22,85,27,18,-92],[20,22,86,24,18,-92],[20,22,86,24,18,-92]]},"curlReverse:barbell":{"h":[[141,0,0,141,0,0],[140,0,0,140,0,0],[135,0,0,135,0,0],[127,0,0,127,0,0],[116,0,0,116,0,0],[102,0,0,102,0,0],[86,0,0,86,0,0],[70,0,0,70,0,0],[56,0,0,56,0,0],[53,0,0,53,0,0],[62,0,0,62,0,0],[76,0,0,76,0,0],[90,0,0,90,0,0],[104,0,0,104,0,0],[118,0,0,118,0,0],[128,0,0,128,0,0],[136,0,0,136,0,0],[140,0,0,140,0,0],[141,0,0,141,0,0],[141,0,0,141,0,0],[141,0,0,141,0,0]]},"decline:barbell":{"pads":[[2,0,0.0362,0]],"h":[[-10,30,0,-10,30,0],[-12,38,0,-12,38,0],[-16,50,0,-16,50,0],[-20,62,0,-20,62,0],[-24,73,0,-24,73,0],[-26,81,0,-26,81,0],[-27,84,0,-27,84,0],[-28,85,0,-28,85,0],[-28,85,0,-28,85,0],[-27,85,0,-27,85,0],[-27,84,0,-27,84,0],[-27,83,0,-27,83,0],[-25,78,0,-25,78,0],[-22,69,0,-22,69,0],[-19,59,0,-19,59,0],[-16,48,0,-16,48,0],[-12,36,0,-12,36,0],[-8,26,0,-8,26,0],[-5,16,0,-5,16,0],[-3,9,0,-3,9,0],[-1,5,0,-1,5,0]]},"decline:dumbbell":{"pads":[[2,0,0.0362,0]]},"floorPress:barbell":{"pads":[[2,0,-0.01,0]]},"chestPressIncline:machine":{"pads":[[2,0,-0.0251,0]]},"flyIncline:dumbbell":{"pads":[[3,0,-0.0425,0]]},"pecDeck:machine":{"pads":[[2,0,-0.0154,0]]},"ohpSeated:barbell":{"pads":[[2,0,-0.018,0]],"h":[[157,11,0,157,11,0],[167,12,0,167,12,0],[175,12,0,175,12,0],[178,12,0,178,12,0],[179,12,0,179,12,0],[177,12,0,177,12,0],[169,12,0,169,12,0],[148,10,0,148,10,0],[126,9,0,126,9,0],[125,9,0,125,9,0],[146,10,0,146,10,0],[166,12,0,166,12,0],[173,12,0,173,12,0],[175,12,0,175,12,0],[174,12,0,174,12,0],[172,12,0,172,12,0],[166,12,0,166,12,0],[155,11,0,155,11,0],[136,10,0,136,10,0],[113,8,0,113,8,0],[95,7,0,95,7,0]]},"ohpSeated:dumbbell":{"pads":[[2,0,-0.018,0]],"h":[[7,5,-27,5,4,19],[7,5,-27,5,4,19],[7,5,-26,5,4,19],[6,5,-24,5,4,18],[5,4,-18,4,4,15],[3,3,-11,3,3,10],[1,1,-5,1,1,5],[0,0,-1,0,0,1],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[1,0,-2,1,0,2],[2,2,-6,2,2,6],[3,3,-12,3,3,12],[5,4,-19,5,4,16],[6,5,-24,5,4,19],[7,5,-26,5,4,19],[7,5,-27,5,4,19],[7,5,-26,5,4,19],[6,4,-25,5,4,19],[6,4,-23,5,3,19]]},"arnoldPress:dumbbell":{"h":[[29,23,-84,29,23,84],[29,23,-84,29,23,84],[29,23,-84,29,23,84],[28,22,-84,29,22,83],[27,21,-82,28,22,82],[24,19,-77,25,20,79],[20,17,-68,21,18,71],[16,14,-58,16,15,59],[12,12,-46,12,12,46],[8,10,-33,8,10,32],[6,8,-24,6,8,24],[7,8,-29,7,8,29],[11,11,-41,10,11,41],[14,13,-54,14,13,54],[18,15,-65,18,16,65],[23,18,-75,23,19,75],[27,21,-81,27,21,82],[29,22,-84,28,22,84],[29,22,-84,29,23,84],[29,22,-84,29,23,84],[29,22,-84,29,23,84]]},"ohpMachine:machine":{"pads":[[2,0,-0.018,0]]},"pushPress:barbell":{"h":[[57,-1,0,57,-1,0],[71,-1,0,71,-1,0],[88,-1,0,88,-1,0],[101,-1,0,101,-1,0],[107,-1,0,107,-1,0],[110,-1,0,110,-1,0],[110,-1,0,110,-1,0],[110,-1,0,110,-1,0],[113,-1,0,113,-1,0],[124,-1,0,124,-1,0],[140,-1,0,140,-1,0],[153,-1,0,153,-1,0],[159,0,0,159,0,0],[160,0,0,160,0,0],[160,0,0,160,0,0],[157,0,0,157,0,0],[152,0,0,152,0,0],[140,0,0,140,0,0],[122,0,0,122,0,0],[100,0,0,100,0,0],[82,0,0,82,0,0]]},"lateralRaiseMachine:machine":{"pads":[[2,0,-0.0088,0]]},"reverseFlyMachine:machine":{"pads":[[2,0,-0.0531,0],[4,0,-0.0096,0]]},"yRaise:dumbbell":{"h":[[111,57,-46,111,57,46],[110,57,-46,110,57,46],[107,55,-44,107,55,45],[101,52,-41,101,52,41],[89,46,-35,89,47,36],[74,39,-29,73,39,29],[55,29,-22,55,29,22],[36,20,-15,36,20,15],[22,13,-10,22,14,10],[18,12,-9,18,12,9],[27,18,-13,27,19,13],[44,28,-20,44,28,20],[61,37,-27,61,38,27],[78,46,-34,78,46,34],[91,52,-40,91,52,40],[99,55,-43,99,55,43],[104,56,-44,103,56,44],[105,56,-44,105,57,44],[106,56,-44,106,57,44],[106,56,-44,106,57,44],[106,56,-44,106,57,44]]},"rackPull:barbell":{"pads":[[8,0,-0.025,0]]},"chinup:none":{"b":[[-109,-10],[-120,-11],[-127,-12],[-128,-12],[-128,-12],[-124,-12],[-116,-12],[-101,-11],[-87,-10],[-89,-11],[-104,-12],[-120,-14],[-130,-14],[-135,-14],[-135,-14],[-134,-14],[-124,-13],[-102,-11],[-72,-7],[-42,-4],[-24,-2]]},"pullupNeutral:none":{"b":[[-154,-11],[-155,-11],[-156,-12],[-156,-12],[-155,-12],[-151,-11],[-140,-11],[-122,-11],[-104,-10],[-102,-10],[-119,-11],[-141,-11],[-156,-11],[-164,-12],[-166,-12],[-166,-12],[-166,-11],[-163,-11],[-153,-10],[-136,-8],[-118,-6]]},"pendlayRow:barbell":{"h":[[6,-72,0,6,-72,0],[8,-86,0,8,-86,0],[9,-104,0,9,-104,0],[11,-122,0,11,-122,0],[12,-141,0,12,-141,0],[14,-157,0,14,-157,0],[14,-163,0,14,-163,0],[14,-164,0,14,-164,0],[14,-164,0,14,-164,0],[14,-165,0,14,-165,0],[14,-164,0,14,-164,0],[14,-157,0,14,-157,0],[12,-140,0,12,-140,0],[11,-121,0,11,-121,0],[9,-103,0,9,-103,0],[7,-85,0,7,-85,0],[6,-67,0,6,-67,0],[4,-51,0,4,-51,0],[3,-36,0,3,-36,0],[2,-23,0,2,-23,0],[1,-15,0,1,-15,0]]},"seatedRowOneArm:cable":{"pads":[[5,0.0315,-0.0102,0],[6,0.0321,-0.0104,0]]},"seatedRowMachine:machine":{"pads":[[2,0,-0.0531,0],[4,0,-0.0107,0]]},"pulldownClose:cable":{"pads":[[2,0,-0.0321,0],[4,0,-0.0333,0],[5,0,0.0264,0],[12,0,-0.009,0]]},"pulldownUnder:cable":{"pads":[[2,0,-0.0321,0],[4,0,-0.0333,0],[5,0,0.0264,0],[12,0,-0.009,0]],"h":[[84,20,0,84,20,0],[102,25,0,102,25,0],[115,29,0,115,29,0],[118,29,0,118,29,0],[117,29,0,117,29,0],[112,29,0,112,29,0],[99,26,0,99,26,0],[77,21,0,77,21,0],[59,17,0,59,17,0],[60,17,0,60,17,0],[78,22,0,78,22,0],[99,27,0,99,27,0],[112,30,0,112,30,0],[117,30,0,117,30,0],[118,30,0,118,30,0],[116,30,0,116,30,0],[109,28,0,109,28,0],[92,22,0,92,22,0],[67,15,0,67,15,0],[40,9,0,40,9,0],[22,5,0,22,5,0]]},"pulldownOneArm:cable":{"pads":[[2,0,-0.0321,0],[4,0,-0.0333,0],[5,0,0.0264,0],[12,0,-0.009,0]]},"hyperextWeighted:none":{"pads":[[2,0,0.0279,0]]},"superman:none":{"pads":[[2,0,-0.01,0]]},"singleLegRdl:dumbbell":{"h":[[0,0,0,-11,8,116],[0,0,0,-11,8,116],[0,0,0,-10,8,116],[0,0,0,-9,8,115],[0,0,0,-4,7,111],[0,0,0,0,5,100],[0,0,0,2,3,82],[0,0,0,2,0,60],[0,0,0,1,-1,38],[0,0,0,-1,0,30],[0,0,0,-5,0,42],[0,0,0,-8,3,65],[0,0,0,-11,6,87],[0,0,0,-13,8,103],[0,0,0,-14,9,112],[0,0,0,-15,10,115],[0,0,0,-15,10,115],[0,0,0,-15,11,116],[0,0,0,-15,11,117],[0,0,0,-15,11,117],[0,0,0,-15,11,117]]},"powerClean:barbell":{"h":[[44,-3,0,44,-3,0],[58,-3,0,58,-3,0],[78,-4,0,78,-4,0],[95,-5,0,95,-5,0],[106,-5,0,106,-5,0],[110,-5,0,110,-5,0],[111,-6,0,111,-6,0],[110,-6,0,110,-6,0],[107,-6,0,107,-6,0],[99,-6,0,99,-6,0],[89,-6,0,89,-6,0],[79,-6,0,79,-6,0],[69,-6,0,69,-6,0],[60,-6,0,60,-6,0],[54,-6,0,54,-6,0],[50,-6,0,50,-6,0],[49,-6,0,49,-6,0],[48,-6,0,48,-6,0],[47,-6,0,47,-6,0],[44,-6,0,44,-6,0],[40,-5,0,40,-5,0]]},"squatDb:dumbbell":{"h":[[-132,-9,-47,-134,-9,47],[-138,-11,-49,-140,-11,49],[-145,-13,-51,-146,-12,51],[-150,-13,-52,-150,-13,52],[-153,-13,-52,-151,-13,52],[-155,-13,-52,-152,-7,52],[-156,-13,-50,-152,4,50],[-156,-7,-46,-152,10,46],[-156,2,-42,-152,10,41],[-156,7,-42,-152,10,41],[-155,4,-45,-152,10,45],[-155,-2,-48,-152,10,49],[-153,-5,-50,-151,9,50],[-150,-2,-50,-147,9,50],[-145,5,-50,-143,9,50],[-140,8,-50,-139,8,50],[-135,8,-49,-135,8,49],[-128,8,-47,-128,8,48],[-117,8,-44,-117,8,44],[-102,7,-40,-101,7,39],[-89,6,-35,-89,7,35]]},"bulgarian:dumbbell":{"h":[[114,31,-43,0,0,0],[120,31,-43,0,0,0],[127,31,-43,0,0,0],[129,30,-43,0,0,0],[130,17,-41,0,0,0],[128,-7,-34,0,0,0],[120,-18,-17,0,0,0],[103,-17,1,0,0,0],[87,-15,7,0,0,0],[88,-7,7,0,0,0],[103,8,0,0,0,0],[117,22,-17,0,0,0],[123,31,-33,0,0,0],[125,34,-41,0,0,0],[125,35,-43,0,0,0],[124,35,-43,0,0,0],[120,35,-43,0,0,0],[114,34,-43,0,0,0],[107,33,-43,0,0,0],[101,33,-43,0,0,0],[97,32,-43,0,0,0]]},"legPressHoriz:machine":{"pads":[[8,0,-0.0128,0]]},"legPressSingle:machine":{"pads":[[2,-0.0039,-0.0372,0],[3,0,0.0041,0],[5,0,-0.045,0]]},"legExtSingle:machine":{"pads":[[2,0,-0.0187,0],[5,0,0.0121,0]]},"reverseLunge:dumbbell":{"h":[[-40,5,-22,-10,-1,6],[-41,8,-24,-11,-2,6],[-41,13,-26,-12,-2,7],[-42,20,-31,-13,-2,7],[-8,27,-37,-13,-2,7],[63,35,-43,-13,-2,7],[110,42,-48,-13,-2,7],[122,47,-52,-13,-2,7],[128,50,-55,-13,-2,7],[130,51,-56,-13,-2,7],[131,52,-57,-13,-2,7],[130,51,-56,-13,-2,7],[128,50,-55,-13,-2,7],[122,47,-52,-13,-2,7],[110,42,-48,-13,-2,7],[63,35,-43,-13,-2,7],[-8,27,-37,-13,-2,7],[-42,20,-31,-13,-2,7],[-41,13,-26,-12,-2,7],[-41,8,-24,-11,-2,6],[-41,5,-22,-10,-1,6]]},"lungeAlt:dumbbell":{"h":[[-57,3,-24,0,0,0],[-67,4,-28,-1,0,1],[-78,5,-32,-2,0,2],[-84,5,-35,-4,-1,3],[-87,5,-36,-5,-1,4],[-87,5,-36,-6,-1,5],[-87,5,-36,-7,-1,5],[-82,5,-34,-11,-1,7],[-72,4,-29,-18,-1,9],[-56,2,-23,-30,0,14],[-40,0,-17,-47,1,20],[-27,-1,-13,-63,3,26],[-21,-1,-11,-76,4,32],[-19,-1,-11,-85,5,36],[-18,-1,-10,-89,5,37],[-17,-1,-10,-89,5,38],[-18,-1,-10,-88,5,37],[-19,-1,-11,-84,5,35],[-20,-1,-11,-74,4,31],[-20,-1,-11,-59,3,24],[-20,-1,-11,-47,2,20]]},"lateralLunge:dumbbell":{"h":[[21,-21,0,21,-21,0],[22,-21,0,22,-21,0],[22,-22,0,22,-22,0],[22,-23,0,22,-23,0],[22,-25,0,22,-25,0],[22,-26,0,22,-26,0],[22,-26,0,22,-26,0],[20,-27,0,20,-27,0],[18,-27,0,18,-27,0],[16,-27,0,16,-27,0],[16,-27,0,16,-27,0],[18,-27,0,18,-27,0],[21,-27,0,21,-27,0],[22,-26,0,22,-26,0],[22,-25,0,22,-25,0],[22,-24,0,22,-24,0],[22,-23,0,22,-23,0],[22,-22,0,22,-22,0],[22,-21,0,22,-21,0],[21,-21,0,21,-21,0],[21,-21,0,21,-21,0]]},"lungeSmith:machine":{"pads":[[51,0,-0.015,0]]},"stepUp:dumbbell":{"h":[[0,0,0,-4,-1,2],[0,0,0,-7,-1,4],[0,0,0,-11,-2,7],[0,0,0,-15,-2,10],[-1,0,-1,-17,-2,11],[-3,0,-2,-17,-2,12],[-5,0,-4,-17,-2,11],[-7,0,-5,-15,-1,10],[-8,0,-6,-16,-1,10],[-8,0,-6,-19,-2,11],[-8,0,-6,-22,-2,13],[-7,0,-5,-22,-2,13],[-5,0,-4,-22,-2,13],[-3,0,-2,-19,-2,11],[-1,0,-1,-17,-2,9],[0,0,0,-18,-2,10],[0,0,0,-20,-2,11],[0,0,0,-21,-2,11],[0,0,0,-20,-2,11],[0,0,0,-17,-2,9],[0,0,0,-13,-2,7]]},"legCurlSeated:machine":{"pads":[[4,0,-0.0187,0]]},"gluteBridge:none":{"pads":[[2,0,-0.01,0]]},"gluteBridgeBar:barbell":{"pads":[[2,0,-0.01,0]]},"abductionMachine:machine":{"pads":[[2,0,-0.011,0]]},"adductionMachine:machine":{"pads":[[2,0,-0.011,0]]},"frogPump:none":{"pads":[[2,0,-0.01,0]]},"calfPress:machine":{"pads":[[3,0,0.0041,0]]},"thruster:barbell":{"h":[[0,0,0,0,0,0],[0,0,0,0,0,0],[2,0,0,2,0,0],[9,-1,0,9,-1,0],[22,-2,0,22,-2,0],[44,-5,0,44,-5,0],[68,-7,0,68,-7,0],[88,-9,0,88,-9,0],[98,-10,0,98,-10,0],[102,-10,0,102,-10,0],[102,-11,0,102,-11,0],[106,-10,0,106,-10,0],[119,-10,0,119,-10,0],[136,-9,0,136,-9,0],[146,-7,0,146,-7,0],[148,-5,0,148,-5,0],[147,-4,0,147,-4,0],[141,-3,0,141,-3,0],[128,-3,0,128,-3,0],[106,-3,0,106,-3,0],[86,-2,0,86,-2,0]]},"machineCrunch:machine":{"pads":[[2,0,-0.0222,0]]},"sitUp:none":{"pads":[[2,0,-0.01,0]]},"vUp:none":{"pads":[[2,0,-0.0083,0]]},"turkishGetUp:kettlebell":{"pads":[[2,0,-0.01,0]]},"treadmillIncline:machine":{"pads":[[3,0,-0.015,0]]},"roadCycling:none":{"pads":[[25,0.0026,-0.0296,0]]},"kbSwingOne:kettlebell":{"h":[[12,-3,8,12,-3,8],[12,-3,8,12,-3,8],[12,-3,8,12,-3,8],[12,-3,8,12,-3,8],[12,-3,8,12,-3,8],[12,-3,7,12,-3,7],[11,-3,6,11,-3,6],[10,-2,5,10,-2,5],[7,-2,6,7,-2,6],[5,-1,9,5,-1,9],[3,-1,11,3,-1,11],[2,-1,13,2,-1,13],[2,-1,13,2,-1,13],[2,-1,14,2,-1,14],[2,-1,14,2,-1,14],[2,-2,14,2,-2,14],[2,-2,14,2,-2,14],[2,-2,14,2,-2,14],[2,-1,14,2,-1,14],[2,-1,14,2,-1,14],[2,-1,13,2,-1,13]]},"kbSnatch:kettlebell":{"h":[[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,1,0,0,1],[2,0,3,2,0,3],[4,1,6,4,1,6],[9,2,10,9,2,10],[14,3,12,14,3,12],[20,4,14,20,4,14],[24,5,14,24,5,14],[26,6,14,26,6,14],[26,6,14,26,6,14],[26,6,14,26,6,14],[24,5,14,24,5,14],[20,4,14,20,4,14],[16,3,13,16,3,13]]},"kbClean:kettlebell":{"h":[[40,16,-6,40,16,-6],[42,17,-1,42,17,-1],[46,19,0,46,19,0],[51,21,-11,51,21,-11],[54,22,-19,54,22,-19],[53,22,-19,53,22,-19],[52,21,-19,52,21,-19],[49,20,-19,49,20,-19],[44,19,-19,44,19,-19],[41,19,-18,41,19,-18],[44,22,-16,44,22,-16],[50,25,-8,50,25,-8],[55,27,5,55,27,5],[56,27,11,56,27,11],[57,27,12,57,27,12],[57,27,12,57,27,12],[57,27,12,57,27,12],[56,27,12,56,27,12],[55,27,12,55,27,12],[50,25,11,50,25,11],[45,22,10,45,22,10]]},"pullThrough:cable":{"h":[[130,-112,0,130,-112,0],[137,-116,0,137,-116,0],[141,-117,0,141,-117,0],[142,-116,0,142,-116,0],[139,-111,0,139,-111,0],[130,-99,0,130,-99,0],[121,-86,0,121,-86,0],[111,-73,0,111,-73,0],[101,-65,0,101,-65,0],[98,-67,0,98,-67,0],[104,-77,0,104,-77,0],[114,-87,0,114,-87,0],[125,-100,0,125,-100,0],[136,-112,0,136,-112,0],[140,-119,0,140,-119,0],[140,-122,0,140,-122,0],[137,-123,0,137,-123,0],[130,-118,0,130,-118,0],[114,-105,0,114,-105,0],[93,-85,0,93,-85,0],[78,-71,0,78,-71,0]]},"cleanPress:barbell":{"h":[[61,-75,0,61,-75,0],[69,-80,0,69,-80,0],[77,-84,0,77,-84,0],[85,-85,0,85,-85,0],[97,-84,0,97,-84,0],[114,-80,0,114,-80,0],[132,-71,0,132,-71,0],[144,-58,0,144,-58,0],[150,-44,0,150,-44,0],[151,-30,0,151,-30,0],[151,-21,0,151,-21,0],[152,-20,0,152,-20,0],[153,-28,0,153,-28,0],[154,-40,0,154,-40,0],[154,-50,0,154,-50,0],[154,-58,0,154,-58,0],[152,-62,0,152,-62,0],[147,-63,0,147,-63,0],[133,-63,0,133,-63,0],[113,-63,0,113,-63,0],[95,-62,0,95,-62,0]]},"cleanJerk:barbell":{"h":[[61,-37,0,61,-37,0],[71,-38,0,71,-38,0],[81,-38,0,81,-38,0],[87,-38,0,87,-38,0],[95,-38,0,95,-38,0],[110,-38,0,110,-38,0],[126,-37,0,126,-37,0],[136,-36,0,136,-36,0],[141,-32,0,141,-32,0],[142,-25,0,142,-25,0],[142,-17,0,142,-17,0],[142,-13,0,142,-13,0],[141,-18,0,141,-18,0],[136,-28,0,136,-28,0],[125,-39,0,125,-39,0],[107,-48,0,107,-48,0],[88,-54,0,88,-54,0],[73,-56,0,73,-56,0],[66,-57,0,66,-57,0],[62,-57,0,62,-57,0],[60,-57,0,60,-57,0]]},"snatch:barbell":{"h":[[104,-89,0,104,-89,0],[116,-90,0,116,-90,0],[130,-90,0,130,-90,0],[138,-90,0,138,-90,0],[142,-90,0,142,-90,0],[143,-90,0,143,-90,0],[142,-87,0,142,-87,0],[139,-82,0,139,-82,0],[132,-74,0,132,-74,0],[121,-63,0,121,-63,0],[108,-59,0,108,-59,0],[101,-66,0,101,-66,0],[102,-79,0,102,-79,0],[107,-93,0,107,-93,0],[112,-106,0,112,-106,0],[114,-117,0,114,-117,0],[113,-125,0,113,-125,0],[112,-127,0,112,-127,0],[109,-125,0,109,-125,0],[104,-117,0,104,-117,0],[98,-109,0,98,-109,0]]},"devilPress:dumbbell":{"h":[[11,-3,-1,8,-2,1],[11,-3,-1,8,-2,1],[11,-3,-2,8,-2,1],[12,-2,-3,11,-2,2],[19,-2,-6,19,-1,5],[34,-2,-11,34,-2,11],[54,-3,-19,55,-2,19],[73,-4,-27,73,-4,27],[85,-5,-32,86,-6,31],[90,-6,-34,91,-6,34],[91,-6,-34,92,-6,34],[90,-6,-34,91,-6,34],[84,-2,-33,84,-2,33],[70,8,-29,71,9,30],[63,20,-28,63,21,28],[74,31,-31,74,32,31],[89,38,-37,89,40,37],[95,41,-40,96,43,40],[96,42,-41,97,44,41],[96,41,-41,96,43,41],[95,40,-41,95,42,41]]},"manMaker:dumbbell":{"h":[[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[2,-1,-1,2,-1,0],[6,-3,-2,6,-3,2],[14,-7,-4,13,-6,3],[25,-12,-6,24,-12,6],[36,-17,-9,35,-17,9],[45,-21,-11,43,-21,12],[49,-23,-12,47,-22,13],[50,-24,-13,47,-23,13],[49,-23,-13,47,-22,13],[47,-22,-12,45,-21,12],[45,-20,-11,41,-19,11],[46,-16,-12,39,-16,10],[46,-14,-12,39,-13,10],[46,-13,-12,39,-11,10],[44,-12,-11,38,-10,9]]},"pullupAssisted:machine":{"b":[[-109,-10],[-119,-11],[-126,-12],[-128,-12],[-127,-12],[-124,-12],[-116,-12],[-102,-11],[-88,-10],[-90,-11],[-106,-12],[-122,-13],[-131,-14],[-135,-14],[-135,-14],[-134,-14],[-126,-13],[-107,-11],[-79,-8],[-49,-4],[-29,-2]]},"curlEz:barbell":{"h":[[141,0,0,141,0,0],[140,0,0,140,0,0],[135,0,0,135,0,0],[127,0,0,127,0,0],[116,0,0,116,0,0],[102,0,0,102,0,0],[86,0,0,86,0,0],[70,0,0,70,0,0],[56,0,0,56,0,0],[53,0,0,53,0,0],[62,0,0,62,0,0],[76,0,0,76,0,0],[90,0,0,90,0,0],[104,0,0,104,0,0],[118,0,0,118,0,0],[128,0,0,128,0,0],[136,0,0,136,0,0],[140,0,0,140,0,0],[141,0,0,141,0,0],[141,0,0,141,0,0],[141,0,0,141,0,0]]},"hipThrustDb:dumbbell":{"h":[[-20,79,5,-20,79,5],[-20,79,5,-20,79,5],[-19,78,5,-19,78,5],[-18,72,5,-18,72,5],[-15,62,5,-15,62,5],[-12,49,5,-12,49,5],[-8,34,4,-8,34,4],[-5,20,3,-5,20,3],[-2,11,1,-2,11,1],[-2,9,1,-2,9,1],[-4,17,2,-4,17,2],[-6,29,3,-6,29,3],[-10,43,5,-10,43,5],[-13,56,6,-13,56,6],[-16,67,6,-16,67,6],[-17,75,6,-17,75,6],[-18,79,6,-18,79,6],[-18,80,5,-18,80,5],[-18,80,4,-18,80,4],[-18,80,3,-18,80,3],[-17,80,3,-17,80,3]]},"calfDbSingle:dumbbell":{"h":[[0,0,0,-65,-3,31],[0,0,0,-65,-3,31],[0,0,0,-65,-3,31],[0,0,0,-65,-3,31],[0,0,0,-65,-3,31],[0,0,0,-64,-3,31],[0,0,0,-64,-3,31],[0,0,0,-64,-3,31],[0,0,0,-64,-3,31],[0,0,0,-64,-3,31],[0,0,0,-64,-3,31],[0,0,0,-64,-3,31],[0,0,0,-64,-3,31],[0,0,0,-65,-3,31],[0,0,0,-65,-3,31],[0,0,0,-65,-3,31],[0,0,0,-65,-3,31],[0,0,0,-65,-3,31],[0,0,0,-64,-3,31],[0,0,0,-63,-2,31],[0,0,0,-63,-2,31]]},"pecDeckFly:machine":{"pads":[[2,0,-0.0154,0]]},"pullupWeighted:none":{"b":[[-109,-10],[-119,-11],[-126,-12],[-128,-12],[-127,-12],[-124,-12],[-116,-12],[-102,-11],[-88,-10],[-90,-11],[-106,-12],[-122,-13],[-131,-14],[-135,-14],[-135,-14],[-134,-14],[-126,-13],[-107,-11],[-79,-8],[-49,-4],[-29,-2]]},"pullupWide:none":{"b":[[-150,-13],[-151,-13],[-152,-13],[-152,-13],[-152,-13],[-149,-13],[-140,-13],[-124,-12],[-108,-11],[-108,-11],[-123,-11],[-140,-12],[-151,-13],[-156,-13],[-158,-13],[-158,-13],[-158,-13],[-156,-12],[-148,-11],[-134,-9],[-120,-6]]},"chinupWeighted:none":{"b":[[-109,-10],[-120,-11],[-127,-12],[-128,-12],[-128,-12],[-124,-12],[-116,-12],[-101,-11],[-87,-10],[-89,-11],[-104,-12],[-120,-14],[-130,-14],[-135,-14],[-135,-14],[-134,-14],[-124,-13],[-102,-11],[-72,-7],[-42,-4],[-24,-2]]},"chinupAssisted:machine":{"b":[[-109,-10],[-120,-11],[-127,-12],[-128,-12],[-128,-12],[-124,-12],[-116,-12],[-101,-11],[-87,-10],[-89,-11],[-104,-12],[-120,-14],[-130,-14],[-135,-14],[-135,-14],[-134,-14],[-124,-13],[-102,-11],[-72,-7],[-42,-4],[-24,-2]]},"sideBendDb:dumbbell":{"h":[[0,0,0,-131,5,51],[0,0,0,-131,5,51],[0,0,0,-130,3,50],[0,0,0,-124,-1,48],[0,0,0,-113,-3,44],[0,0,0,-95,-3,38],[0,0,0,-75,-3,31],[0,0,0,-53,-3,22],[0,0,0,-35,-2,15],[0,0,0,-30,-2,13],[0,0,0,-43,-2,17],[0,0,0,-64,-3,25],[0,0,0,-86,-3,32],[0,0,0,-104,-3,38],[0,0,0,-119,-1,43],[0,0,0,-129,3,46],[0,0,0,-134,6,48],[0,0,0,-137,7,48],[0,0,0,-138,8,48],[0,0,0,-138,8,48],[0,0,0,-138,8,48]]}}; // se rellena con colisiones precalculadas (ver más abajo)
  var GRIP_R = 0.016, FING_R = 0.0075; // radio del agarre y grosor de un dedo (m)
  var MUSCLE_IDS = { none: 0, pecs: 1, abs: 2, lats: 3, traps: 4, lowback: 5, glutes: 6, delts: 7, biceps: 8, triceps: 9, forearms: 10, quads: 11, hams: 12, calves: 13 };
  function boneKey(name) { return name.replace(/^mixamorig[:_]?/i, ''); }

  // Mapa anatómico: cada músculo es una zona con bordes suaves definida sobre el modelo en reposo
  // (coordenadas del modelo: y arriba, z adelante, x hacia la izquierda del modelo; ~1 u = 0.83 cm).
  function ssm(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function classifyMuscles(root) {
    root.updateMatrixWorld(true);
    var bonePos = {};
    root.traverse(function (o) { if (o.isBone) bonePos[boneKey(o.name)] = new T.Vector3().setFromMatrixPosition(o.matrixWorld); });
    function bp(n) { return bonePos[n] || new T.Vector3(); }
    // forma 2D (vista frontal x,y) con borde suave; e = distancia normalizada (1 = borde)
    function soft(e, edge) { return 1 - ssm(1 - (edge || 0.18), 1 + (edge || 0.18), e); }
    function ell(x, y, cx, cy, rx, ry, ang) {
      var dx = x - cx, dy = y - cy;
      if (ang) { var c = Math.cos(ang), s = Math.sin(ang), u = dx * c + dy * s, w = -dx * s + dy * c; dx = u; dy = w; }
      return Math.sqrt(dx * dx / (rx * rx) + dy * dy / (ry * ry));
    }
    function sup(x, y, cx, cy, rx, ry) { var a = Math.abs(x - cx) / rx, b = Math.abs(y - cy) / ry; return Math.pow(a * a * a * a + b * b * b * b, 0.25); }
    // segmento de extremidad: t a lo largo del hueso y ángulo alrededor (0 = delante, +90 = hacia fuera)
    function limb(v, a, b, sideSign) {
      var d = b.clone().sub(a), L = d.length(); d.divideScalar(L);
      var t = v.clone().sub(a).dot(d) / L;
      var r = v.clone().sub(a).sub(d.clone().multiplyScalar(t * L));
      var fr = V(0, 0, 1); fr.sub(d.clone().multiplyScalar(fr.dot(d))).normalize();
      var lat = d.clone().cross(fr).normalize(); if (lat.x * sideSign < 0) lat.multiplyScalar(-1);
      return { t: t, ang: Math.atan2(r.dot(lat), r.dot(fr)) * 180 / Math.PI };
    }
    function angW(ang, center, half, edge) { var d = Math.abs(((ang - center + 540) % 360) - 180); return 1 - ssm(half - edge, half + edge, d); }
    function spin(t, t0, t1, pw) { var u = clamp((t - t0) / (t1 - t0), 0, 1); return Math.pow(Math.sin(Math.PI * u), pw || 0.55); }
    function tW(t, t0, t1, e) { return ssm(t0 - e, t0 + e, t) * (1 - ssm(t1 - e, t1 + e, t)); }
    var cache = {};
    root.traverse(function (m) {
      if (!m.isSkinnedMesh) return;
      var g = m.geometry, pos = g.attributes.position, nor = g.attributes.normal, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
      var n = pos.count, W = {}; MUSCLES.forEach(function (k) { W[k] = new Float32Array(n); });
      W.__x = new Float32Array(n);
      if (/eye|head/i.test(m.name) && !/body|layer/i.test(m.name)) { cache[m.name] = W; return; }
      var bones = m.skeleton.bones.map(function (b) { return boneKey(b.name); });
      // en reposo: hacia dónde mira la palma y hacia dónde queda el pulgar (por lado)
      var palmSide = {}, thumbSide = {};
      ['Left', 'Right'].forEach(function (S) {
        var fax = bp(S + 'Hand').clone().sub(bp(S + 'ForeArm')).normalize();
        var curl = bp(S + 'HandMiddle3').clone().sub(bp(S + 'HandMiddle1'));
        var dir = bp(S + 'HandMiddle1').clone().sub(bp(S + 'Hand')).normalize();
        var pn = curl.sub(dir.clone().multiplyScalar(curl.dot(dir)));
        if (pn.lengthSq() < 1e-6) pn = bp(S + 'HandThumb2').clone().sub(bp(S + 'Hand'));
        pn.sub(fax.clone().multiplyScalar(pn.dot(fax))).normalize(); palmSide[S] = pn;
        var th = bp(S + 'HandIndex1').clone().sub(bp(S + 'HandPinky1')); th.sub(fax.clone().multiplyScalar(th.dot(fax))).normalize(); thumbSide[S] = th;
      });
      var v = new T.Vector3(), nv = new T.Vector3(), nm = new T.Matrix3().getNormalMatrix(m.matrixWorld);
      for (var i = 0; i < n; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        W.__x[i] = v.x;
        nv.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
        // peso de piel por grupo de huesos
        var grp = {};
        [[si.getX(i), sw.getX(i)], [si.getY(i), sw.getY(i)], [si.getZ(i), sw.getZ(i)], [si.getW(i), sw.getW(i)]].forEach(function (p) {
          var bn = (bones[p[0]] || '').replace(/^(Left|Right)/, ''); grp[bn] = (grp[bn] || 0) + p[1];
        });
        function gw() { var s = 0; for (var k = 0; k < arguments.length; k++) s += grp[arguments[k]] || 0; return s; }
        var torso = gw('Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Neck_1', 'Shoulder');
        var x = Math.abs(v.x), y = v.y, sg = v.x >= 0 ? 1 : -1, S = sg > 0 ? 'Left' : 'Right';
        var front = ssm(0.05, 0.4, nv.z), back = ssm(-0.05, -0.4, nv.z);
        var tm = ssm(0.25, 0.6, torso + gw('Arm') * 0.35);
        // ---- tronco
        // pectoral mayor: abanico del esternón al húmero
        W.pecs[i] = tm * front * soft(ell(x, y, 10.2, 157.5, 10.4, 10.6), 0.14) * ssm(0.6, 1.8, x)
          * (1 - ssm(166, 170, y - (x < 12 ? 0 : (x - 12) * 0.2)));
        // recto abdominal + oblicuos
        W.abs[i] = ssm(0.25, 0.6, torso) * front * soft(sup(x, y, 0, 135.5, 8.2, 12.0), 0.12);
        W.obliques[i] = ssm(0.25, 0.6, torso) * ssm(-0.35, 0.1, nv.z) * soft(ell(x, y, 12.8, 133, 4.6, 11.5), 0.2);
        // dorsal ancho: ala desde la axila hasta la zona lumbar
        W.lats[i] = tm * ssm(0.1, -0.3, nv.z) * soft(ell(x, y, 12.5, 146, 8.6, 17.5, -0.38), 0.16) * ssm(2.5, 5, x);
        // trapecio: rombo desde la nuca hasta media espalda y la parte alta de los hombros
        var dyT = y > 168 ? (y - 168) / 13 : (168 - y) / 22;
        W.traps[i] = ssm(0.3, 0.6, torso + gw('Neck', 'Head') * 0.5) * ssm(0.15, -0.15, nv.z - (y > 164 ? 0.25 + 0.55 * Math.max(0, nv.y) : 0))
          * soft(x / Math.max(1.5, 18 - Math.max(0, 168 - y) * 0.45) + dyT * 0.55, 0.14) * (1 - ssm(181, 185, y)) * ssm(138, 144, y);
        // erectores de la columna
        W.trapsU[i] = W.traps[i] * ssm(161, 166, y);
        W.trapsM[i] = W.traps[i] * (1 - ssm(161, 166, y));
        // ---- solo para el mapa muscular: cada músculo de la espalda con su forma
        // grupo escapular (infraespinoso, redondos y romboides): óvalo sobre cada omóplato
        W.scapV[i] = tm * back * soft(ell(x, y, 8.6, 152.5, 5.4, 6.6, 0.15), 0.16) * ssm(2.2, 4, x);
        // dorsal ancho: abanico desde la axila y la punta de la escápula hacia la zona lumbar y los costados
        W.latsV[i] = tm * ssm(0.15, -0.25, nv.z) * soft(ell(x, y, 11.6, 142.5, 8.8, 17.5, -0.45), 0.16) * ssm(3.2, 5.5, x) * (1 - 0.6 * ssm(0.3, 0.7, W.scapV[i]) * ssm(150, 156, y));
        // erectores de la columna: dos columnas a los lados de la columna, de media espalda al sacro
        W.lowbackV[i] = ssm(0.3, 0.6, torso) * back * soft(ell(x, y, 3.3, 129, 2.4, 13), 0.18) * ssm(0.6, 1.4, x);
        // recto abdominal: tableta central estrecha, de bajo el pecho a algo por debajo del ombligo
        W.absV[i] = ssm(0.25, 0.6, torso) * front * soft(sup(x, y, 0, 133.5, 5.6, 14.5), 0.12);
        var nkW = gw('Neck', 'Neck_1');
        W.neck[i] = ssm(0.35, 0.65, nkW + gw('Head') * 0.4) * ssm(164, 167, y) * (1 - ssm(177, 180, y)) * (1 - W.trapsU[i]) * soft(x / 6.2, 0.18);
        // pectoral superior (cabeza clavicular)
        W.pecsU[i] = W.pecs[i] * ssm(159, 163, y - (x > 12 ? (x - 12) * 0.3 : 0));
        // glúteo medio: cara lateral de la cadera, sobre el trocánter
        W.gluteMed[i] = ssm(0.3, 0.6, torso + gw('UpLeg')) * ssm(0.05, 0.4, nv.x * sg) * ssm(0.3, -0.05, nv.z) * soft(ell(x, y, 13.8, 116, 5.2, 9.5, 0.25), 0.16);
        W.lowback[i] = ssm(0.3, 0.6, torso) * back * soft(sup(x, y, 3.8, 134, 4.2, 12.5), 0.16);
        // glúteos
        W.glutes[i] = ssm(0.3, 0.6, torso + gw('UpLeg')) * ssm(0.0, -0.35, nv.z) * soft(ell(x, y, 9.6, 109.5, 9.4, 11.5), 0.14);
        // ---- brazo
        var armW = gw('Arm'), sh = gw('Shoulder');
        if (armW + sh > 0.15) {
          var ua = limb(v, bp(S + 'Arm'), bp(S + 'ForeArm'), sg);
          // deltoides: casquete que termina en punta en la inserción (V deltoidea)
          var dh = 130 * Math.pow(clamp(1 - (ua.t + 0.2) / 0.62, 0, 1), 0.7) + 8;
          W.delts[i] = ssm(0.25, 0.55, armW + sh) * tW(ua.t, -0.2, 0.43, 0.05) * angW(ua.ang, 90, dh, 16);
          // tres cabezas del deltoides: anterior, lateral y posterior
          W.deltsF[i] = W.delts[i] * angW(ua.ang, 32, 46, 12);
          W.deltsS[i] = W.delts[i] * angW(ua.ang, 95, 38, 12);
          W.deltsR[i] = W.delts[i] * angW(ua.ang, 160, 44, 12);
          W.biceps[i] = ssm(0.55, 0.8, armW) * tW(ua.t, 0.3, 0.9, 0.04) * angW(ua.ang, 12, 8 + 58 * spin(ua.t, 0.3, 0.9), 14);
          W.triceps[i] = ssm(0.55, 0.8, armW) * tW(ua.t, 0.22, 0.92, 0.04) * angW(ua.ang, 182, 10 + 74 * spin(ua.t, 0.22, 0.98, 0.45), 14);
        }
        var faW = gw('ForeArm');
        if (faW > 0.15) {
          var fa = limb(v, bp(S + 'ForeArm'), bp(S + 'Hand'), sg);
          W.forearms[i] = ssm(0.3, 0.6, faW) * tW(fa.t, 0.02, 0.72, 0.05) * angW(fa.ang, 0, 30 + 150 * spin(fa.t, -0.1, 0.8, 0.6), 18);
          // lado de la palma en reposo (los dedos se cierran hacia ahí)
          var pa = palmSide[S], rr = v.clone().sub(bp(S + 'ForeArm')); var fax = bp(S + 'Hand').clone().sub(bp(S + 'ForeArm')).normalize();
          rr.sub(fax.clone().multiplyScalar(rr.dot(fax))).normalize();
          var pd = rr.dot(pa);
          W.forearmFlex[i] = ssm(0.3, 0.6, faW) * tW(fa.t, 0.04, 0.7, 0.05) * ssm(-0.15, 0.35, pd);
          W.forearmExt[i] = ssm(0.3, 0.6, faW) * tW(fa.t, 0.04, 0.7, 0.05) * ssm(0.15, -0.35, pd);
          // braquiorradial: borde radial (lado del pulgar) de la mitad proximal
          var td = rr.dot(thumbSide[S]);
          W.brachiorad[i] = ssm(0.3, 0.6, faW) * tW(fa.t, -0.05, 0.6, 0.05) * ssm(0.2, 0.6, td) * (1 - ssm(0.45, 0.62, fa.t));
        }
        // ---- pierna
        var thW = gw('UpLeg');
        if (thW > 0.15) {
          var th = limb(v, bp(S + 'UpLeg'), bp(S + 'Leg'), sg);
          // cuádriceps fusiforme + gota del vasto interno sobre la rodilla
          var qd = tW(th.t, 0.08, 0.9, 0.04) * angW(th.ang, 28, 14 + 72 * spin(th.t, 0.02, 0.95, 0.5), 14);
          var vm = tW(th.t, 0.62, 0.93, 0.04) * angW(th.ang, -38, 34 * spin(th.t, 0.55, 0.97, 0.7), 12);
          W.quads[i] = ssm(0.3, 0.6, thW) * Math.max(qd, vm);
          // aductores: cara interna del muslo; flexores de cadera: parte alta y delantera
          W.adductors[i] = ssm(0.3, 0.6, thW) * tW(th.t, 0.04, 0.72, 0.04) * angW(th.ang, -100, 8 + 42 * spin(th.t, -0.05, 0.8, 0.5), 12);
          // aductores vistos de frente (mapa muscular): triángulo interno alto del muslo (aductor largo, pectíneo, grácil)
          W.adductorsV[i] = ssm(0.5, 0.8, thW) * ssm(4.5, 7, x) * tW(th.t, 0.04, 0.6, 0.04) * angW(th.ang, -20 - 10 * clamp(th.t / 0.6, 0, 1), 10 + 22 * Math.pow(clamp(1 - th.t / 0.62, 0, 1), 0.7), 12);
          W.quadsV[i] = W.quads[i] * (1 - ssm(0.15, 0.4, W.adductorsV[i]));
          W.hipFlex[i] = ssm(0.3, 0.6, thW) * tW(th.t, -0.05, 0.36, 0.05) * angW(th.ang, -5, 10 + 30 * spin(th.t, -0.15, 0.45, 0.5), 12);
          W.hams[i] = ssm(0.3, 0.6, thW) * tW(th.t, 0.18, 0.92, 0.04) * angW(th.ang, 182, 10 + 56 * spin(th.t, 0.15, 0.95, 0.5), 14);
        }
        var shW = gw('Leg');
        if (shW > 0.15) {
          var sk = limb(v, bp(S + 'Leg'), bp(S + 'Foot'), sg);
          // gemelos: rombo con dos cabezas (la interna baja un poco más)
          var gm = tW(sk.t, 0.04, 0.6, 0.04) * angW(sk.ang, 200, 8 + 62 * spin(sk.t, 0.0, 0.62, 0.6), 12);
          var gl = tW(sk.t, 0.04, 0.52, 0.04) * angW(sk.ang, 160, 8 + 56 * spin(sk.t, 0.0, 0.55, 0.6), 12);
          W.calves[i] = ssm(0.3, 0.6, shW) * Math.max(gm, gl);
          // sóleo: bajo los gemelos y a los costados de la pantorrilla
          W.tibialis[i] = ssm(0.3, 0.6, shW) * tW(sk.t, 0.08, 0.72, 0.05) * angW(sk.ang, 22, 8 + 26 * spin(sk.t, 0.0, 0.8, 0.5), 10);
          W.soleus[i] = ssm(0.3, 0.6, shW) * tW(sk.t, 0.4, 0.84, 0.04) * angW(sk.ang, 180, 10 + 95 * spin(sk.t, 0.3, 0.9, 0.5), 12);
        }
      }
      // suavizado: promedio con vecinos (2 pasadas) para bordes limpios
      var idx = g.index ? g.index.array : null;
      if (idx) {
        var nb = []; for (var a = 0; a < n; a++) nb.push([]);
        for (var f = 0; f < idx.length; f += 3) { var A = idx[f], B = idx[f + 1], Cc = idx[f + 2]; nb[A].push(B, Cc); nb[B].push(A, Cc); nb[Cc].push(A, B); }
        MUSCLES.forEach(function (k) {
          for (var pass = 0; pass < 4; pass++) {
            var src = W[k], dst = new Float32Array(n);
            for (var q = 0; q < n; q++) { var s = src[q] * 2, c = 2, L = nb[q]; for (var r = 0; r < L.length; r++) { s += src[L[r]]; c++; } dst[q] = s / c; }
            W[k] = dst;
          }
        });
      }
      cache[m.name] = W;
    });
    return cache;
  }
  // Tonifica el modelo: abulta el vientre de cada músculo y guarda la concavidad (separaciones musculares)
  var TONE = { pecs: 1.5, delts: 1.2, biceps: 0.95, triceps: 0.8, forearms: 0.5, quads: 1.4, hams: 0.9, calves: 1.2, glutes: 0.9, lats: 0.8, traps: 0.9, abs: 0.5, lowback: 0.5 };
  function toneModel(root, cache) {
    root.traverse(function (m) {
      if (!m.isSkinnedMesh || !cache[m.name]) return;
      var g = m.geometry, P = g.attributes.position, N = g.attributes.normal, n = P.count, W = cache[m.name];
      var eyes = /eye|head/i.test(m.name) && !/body|layer/i.test(m.name);
      var cav = new Float32Array(n);
      if (!eyes) {
        for (var i = 0; i < n; i++) {
          var d = 0;
          for (var k in TONE) if (W[k]) { var w = W[k][i]; d += TONE[k] * w * w * (3 - 2 * w); }
          d = Math.min(d, 2.0);
          if (d > 0.001) P.setXYZ(i, P.getX(i) + N.getX(i) * d, P.getY(i) + N.getY(i) * d, P.getZ(i) + N.getZ(i) * d);
        }
        P.needsUpdate = true; g.computeVertexNormals(); N = g.attributes.normal;
        // concavidad: >0 en surcos (sombra), <0 en relieves (brillo)
        var cnt = new Float32Array(n), idx = g.index ? g.index.array : null;
        if (idx) {
          var add = function (a, b) {
            var dx = P.getX(b) - P.getX(a), dy = P.getY(b) - P.getY(a), dz = P.getZ(b) - P.getZ(a), L = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
            cav[a] += (dx * N.getX(a) + dy * N.getY(a) + dz * N.getZ(a)) / L; cnt[a]++;
          };
          for (var f = 0; f < idx.length; f += 3) { var A = idx[f], B = idx[f + 1], C = idx[f + 2]; add(A, B); add(A, C); add(B, A); add(B, C); add(C, A); add(C, B); }
          for (var q = 0; q < n; q++) cav[q] = cnt[q] ? cav[q] / cnt[q] : 0;
          var nb = []; for (var a2 = 0; a2 < n; a2++) nb.push([]);
          for (var f2 = 0; f2 < idx.length; f2 += 3) { var x0 = idx[f2], x1 = idx[f2 + 1], x2 = idx[f2 + 2]; nb[x0].push(x1, x2); nb[x1].push(x0, x2); nb[x2].push(x0, x1); }
          for (var pass = 0; pass < 2; pass++) { var o = new Float32Array(n); for (var r = 0; r < n; r++) { var sm = cav[r] * 2, c = 2, L2 = nb[r]; for (var z = 0; z < L2.length; z++) { sm += cav[L2[z]]; c++; } o[r] = sm / c; } cav = o; }
          for (var t = 0; t < n; t++) cav[t] = clamp(cav[t] * 9, -1, 1);
        }
      }
      g.setAttribute('cav', new T.BufferAttribute(cav, 1));
    });
  }
  function setModel(scene) {
    MODEL = scene;
    MODEL.traverse(function (o) {
      if (!o.isSkinnedMesh) return;
      o.frustumCulled = false;
      var g = o.geometry, idx = g.index, P = g.attributes.position, N = g.attributes.normal;
      if (!idx || !N) return;
      var A = new T.Vector3(), B = new T.Vector3(), C = new T.Vector3(), fn = new T.Vector3(), vn = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3();
      var arr = idx.array, flipped = 0;
      for (var f = 0; f < arr.length; f += 3) {
        A.fromBufferAttribute(P, arr[f]); B.fromBufferAttribute(P, arr[f + 1]); C.fromBufferAttribute(P, arr[f + 2]);
        fn.crossVectors(e1.subVectors(B, A), e2.subVectors(C, A));
        vn.set(0, 0, 0);
        for (var k = 0; k < 3; k++) vn.x += N.getX(arr[f + k]), vn.y += N.getY(arr[f + k]), vn.z += N.getZ(arr[f + k]);
        if (fn.dot(vn) < 0) { var t = arr[f + 1]; arr[f + 1] = arr[f + 2]; arr[f + 2] = t; flipped++; }
      }
      idx.needsUpdate = true;
    });
    MUSCLE_CACHE = classifyMuscles(MODEL);
    toneModel(MODEL, MUSCLE_CACHE);
  }

  var _q1 = new T.Quaternion(), _q2 = new T.Quaternion(), _m1 = new T.Matrix4();
  function frameQuat(d, s) {
    var a = d.clone().normalize(), b = s.clone().sub(a.clone().multiplyScalar(s.dot(a)));
    if (b.lengthSq() < 1e-8) b = Math.abs(a.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0), b.sub(a.clone().multiplyScalar(b.dot(a)));
    b.normalize(); var c = a.clone().cross(b);
    _m1.makeBasis(a, b, c); return new T.Quaternion().setFromRotationMatrix(_m1);
  }
  function perp(v, axis) { return v.clone().sub(axis.clone().multiplyScalar(v.dot(axis))); }

  // Material de piel con músculos pintados: contorno limpio y un degradado suave dentro del músculo
  function muscleMaterial(baseHex) {
    var mat = new T.MeshStandardMaterial({ color: baseHex, roughness: 0.6, metalness: 0, side: T.DoubleSide });
    mat.extensions = { derivatives: true };
    mat.onBeforeCompile = function (sh) {
      sh.vertexShader = 'attribute vec2 mw;\nattribute float cav;\nvarying vec2 vMw;\nvarying float vCav;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vMw = mw; vCav = cav;');
      sh.fragmentShader = 'varying vec2 vMw;\nvarying float vCav;\n' +sh.fragmentShader.replace('#include <color_fragment>', [
        '#include <color_fragment>',
        ' float TH = 0.36;',
        ' float ap = fwidth(vMw.x) * 0.9 + 0.004, as = fwidth(vMw.y) * 0.9 + 0.004;',
        ' float pa = smoothstep(TH - ap, TH + ap, vMw.x);',
        ' float sa = smoothstep(TH - as, TH + as, vMw.y);',
        ' vec3 pc = mix(vec3(0.60, 0.04, 0.05), vec3(0.84, 0.12, 0.11), smoothstep(TH, 0.95, vMw.x));',
        ' vec3 sc = mix(vec3(0.86, 0.36, 0.05), vec3(0.98, 0.56, 0.16), smoothstep(TH, 0.95, vMw.y));',
        ' vec3 skin = diffuseColor.rgb;',
        ' vec3 colM = mix(skin, sc, sa);',
        ' colM = mix(colM, pc, pa);',
        ' colM *= 1.0 - 0.5 * max(vCav, 0.0) + 0.06 * max(-vCav, 0.0);',
        ' diffuseColor.rgb = colM;'
      ].join('\n'));
    };
    mat.customProgramCacheKey = function () { return 'forjaMuscle'; };
    return mat;
  }

  function makeModelBody(scene, active) {
    var inst = T.SkeletonUtils.clone(MODEL);
    var wrap = new T.Group(); wrap.rotation.y = Math.PI / 2; wrap.scale.setScalar(MODEL_SCALE); wrap.add(inst); scene.add(wrap);
    var bones = {}, meshes = [];
    inst.traverse(function (o) { if (o.isBone) bones[boneKey(o.name)] = o; if (o.isSkinnedMesh) meshes.push(o); });
    // Colores por vértice: piel neutra; músculos activos en rojo / naranja
    var base = new T.Color(0xe7e8ec), red = new T.Color(0xd8262d), orange = new T.Color(0xee8a2e);
    var dbg = global.FORJA3D_DEBUG_MUSCLES, palette = {};
    if (dbg) MUSCLES.forEach(function (k, i) { palette[k] = new T.Color().setHSL(i / MUSCLES.length, 0.75, 0.5); });
    meshes.forEach(function (m) {
      var eyes = /eye|head/i.test(m.name) && !/body|layer/i.test(m.name);
      var g = m.geometry.clone(); m.geometry = g;
      var n = g.attributes.position.count, W = MUSCLE_CACHE[m.name] || {};
      if (!dbg) {
        // pesos por vértice (principal, secundario); el borde nítido se recorta en el sombreador
        var mw = new Float32Array(n * 2);
        if (!eyes) for (var q = 0; q < n; q++) {
          var a = 0, b = 0;
          var sx = W.__x ? clamp(W.__x[q] / 2.5, -1, 1) : 0, sm = active.side ? ssm(-0.25, 0.6, active.side === 'L' ? sx : -sx) : 1;
          active.p.forEach(function (k) { if (W[k]) a = Math.max(a, W[k][q] * (k === 'abs' || k === 'lowback' || active.both.indexOf(k) >= 0 ? 1 : sm)); });
          active.s.forEach(function (k) { if (W[k]) b = Math.max(b, W[k][q] * (k === 'abs' || k === 'lowback' || active.both.indexOf(k) >= 0 ? 1 : sm)); });
          mw[q * 2] = a; mw[q * 2 + 1] = b;
        }
        g.setAttribute('mw', new T.BufferAttribute(mw, 2));
        m.material = muscleMaterial(eyes ? 0xc9ccd3 : 0xe9eaee);
        m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
        return;
      }
      var col = new Float32Array(n * 3), c = new T.Color();
      for (var i = 0; i < n; i++) {
        c.copy(eyes ? new T.Color(0xc9ccd3) : base);
        if (!eyes) {
          if (dbg) { MUSCLES.forEach(function (k) { if (W[k]) c.lerp(palette[k], W[k][i]); }); }
          else {
            var ws = 0, wp = 0;
            active.s.forEach(function (k) { if (W[k]) ws = Math.max(ws, W[k][i]); });
            active.p.forEach(function (k) { if (W[k]) wp = Math.max(wp, W[k][i]); });
            c.lerp(orange, ws * 0.95); c.lerp(red, wp * 0.97);
          }
        }
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new T.BufferAttribute(col, 3));
      m.material = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0, side: T.DoubleSide });
      m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
    });
    scene.updateMatrixWorld(true);
    // Datos de reposo (mundo)
    var rest = {};
    Object.keys(bones).forEach(function (n) {
      var b = bones[n];
      rest[n] = { p: new T.Vector3().setFromMatrixPosition(b.matrixWorld), q: b.getWorldQuaternion(new T.Quaternion()) };
    });
    function rp(n) { return rest[n] ? rest[n].p : V(); }
    var hipC0 = rp('LeftUpLeg').clone().add(rp('RightUpLeg')).multiplyScalar(0.5);
    var up0 = rp('Spine2').clone().sub(rp('Hips')).normalize(), fwd0 = perp(V(1, 0, 0), up0).normalize();
    var R0torso = frameQuat(up0, fwd0).invert();
    var hipsOff = rp('Hips').clone().sub(hipC0);
    // palma en reposo (normal hacia la palma) por lado
    function restPalm(side) {
      var h = rp(side + 'Hand'), mid = rp(side + 'HandMiddle1'), idx = rp(side + 'HandIndex1'), pk = rp(side + 'HandPinky1');
      var dir = mid.clone().sub(h).normalize(), across = idx.clone().sub(pk).normalize();
      var n = dir.clone().cross(across).normalize();
      // la palma apunta hacia el cuerpo/abajo en la pose A: si apunta hacia fuera, invertir
      var outward = V(0, 0, side === 'Left' ? -1 : 1);
      if (n.dot(outward) > 0) n.multiplyScalar(-1);
      return n;
    }
    var palm0 = { Left: restPalm('Left'), Right: restPalm('Right') };

    function setWorldQuat(b, qw) {
      b.parent.getWorldQuaternion(_q1);
      b.quaternion.copy(_q1.invert().multiply(qw));
      b.updateMatrixWorld(true);
    }
    function aim(name, child, d1, s0, s1) {
      var b = bones[name]; if (!b || !rest[child]) return;
      var d0 = rp(child).clone().sub(rp(name)).normalize();
      var R = frameQuat(d1, s1).multiply(frameQuat(d0, s0).invert());
      setWorldQuat(b, R.multiply(rest[name].q.clone()));
    }
    function rot(name, R) { var b = bones[name]; if (b) setWorldQuat(b, R.clone().multiply(rest[name].q.clone())); }
    // como aim(), pero con la dirección de reposo dada (para la última falange, que no tiene hueso hijo)
    function aimD(name, d0, d1, s0, s1) {
      var b = bones[name]; if (!b) return;
      setWorldQuat(b, frameQuat(d1, s1).multiply(frameQuat(d0, s0).invert()).multiply(rest[name].q.clone()));
    }
    // falanges: dirección y largo en reposo (la 3ª se prolonga desde la 2ª)
    var fingerSeg = {};
    ['Left', 'Right'].forEach(function (S) {
      ['Index', 'Middle', 'Ring', 'Pinky'].forEach(function (F) {
        var p1 = rest[S + 'Hand' + F + '1'], p2 = rest[S + 'Hand' + F + '2'], p3 = rest[S + 'Hand' + F + '3'];
        if (!p1 || !p2 || !p3) return;
        var a = p2.p.clone().sub(p1.p), b = p3.p.clone().sub(p2.p);
        fingerSeg[S + F] = { 1: { d0: a.clone().normalize(), L: a.length() }, 2: { d0: b.clone().normalize(), L: b.length() }, 3: { d0: b.clone().normalize(), L: b.length() * 0.75 } };
      });
    });
    function worldPos(name) { return new T.Vector3().setFromMatrixPosition(bones[name].matrixWorld); }

    function pose(j) {
      var Rt = frameQuat(j.up, j.fwd).multiply(R0torso);
      // cadera (raíz)
      var hips = bones.Hips;
      var hp = j.hip.clone().add(hipsOff.clone().applyQuaternion(Rt));
      hips.parent.updateMatrixWorld(true);
      hips.position.copy(hips.parent.worldToLocal(hp));
      var RtT = frameQuat(j.up, j.fwdT || j.fwd).multiply(R0torso), RtM = Rt.clone().slerp(RtT, 0.5);
      var RtP = frameQuat(j.upP || j.up, j.fwd).multiply(R0torso);
      rot('Hips', RtP); rot('Spine', RtP.clone().slerp(RtT, 0.3)); rot('Spine1', RtP.clone().slerp(RtT, 0.65)); rot('Spine2', RtT);
      var Rh = frameQuat(j.headUp, j.headFwd).multiply(R0torso);
      rot('Neck', RtT.clone().slerp(Rh, 0.5)); rot('Head', Rh);
      ['Left', 'Right'].forEach(function (S) {
        var k = S === 'Left' ? 'L' : 'R';
        // clavícula: apunta al hombro (encogimientos)
        var shB = worldPos(S + 'Shoulder');
        var upA = j.el[k].clone().sub(j.sho[k]).normalize(), elev = Math.acos(clamp(upA.dot(j.up.clone().negate()), -1, 1));
        var eu = clamp((elev - rad(70)) / rad(100), 0, 1); eu = eu * eu * (3 - 2 * eu);
        var shoT = j.sho[k].clone().add(j.up.clone().multiplyScalar(0.042 * eu)).add(j.fwd.clone().multiplyScalar(-0.012 * eu));
        aim(S + 'Shoulder', S + 'Arm', shoT.sub(shB), V(0, 1, 0), j.up);
        var a0 = worldPos(S + 'Arm'), el = j.el[k], hand = j.hand[k];
        var fdir = hand.clone().sub(el).normalize(), udir = el.clone().sub(a0).normalize();
        var wrist = el.clone().add(fdir.clone().multiplyScalar(FAW));
        // brazo: el plano de flexión del codo
        // giro del húmero: el pliegue del codo mira hacia donde se dobla el antebrazo;
        // con el brazo estirado mira hacia delante (como en la anatomía real), nunca sigue a la palma
        var udir0 = rp(S + 'ForeArm').clone().sub(rp(S + 'Arm')).normalize();
        var bend0 = perp(fwd0.clone().add(up0.clone().multiplyScalar(0.35)), udir0).normalize();
        var dflt = perp(j.fwd.clone().add(j.up.clone().multiplyScalar(0.35)), udir);
        if (dflt.lengthSq() < 1e-4) dflt = perp(j.up, udir);
        dflt.normalize();
        var bendRaw = perp(fdir, udir), bw = ssm(0.12, 0.4, bendRaw.length());
        var bend = bw > 0 ? dflt.clone().multiplyScalar(1 - bw).add(bendRaw.normalize().multiplyScalar(bw)).normalize() : dflt;
        aim(S + 'Arm', S + 'ForeArm', udir, bend0, bend);
        var fist = j.handMode[k] !== 'flat';
        var knuckle = j.handDir[k].clone().cross(j.palm[k]).normalize();
        // la muñeca sigue al antebrazo (sin quiebres hacia atrás): la mano se limita a ±35° respecto al antebrazo
        var hd = j.handDir[k].clone();
        var wlim = (j.wrist && j.wrist[k]) ? 85 : 35;
        if (hd.angleTo(fdir) > rad(wlim)) { var ax = fdir.clone().cross(hd); if (ax.lengthSq() > 1e-8) hd = fdir.clone().applyAxisAngle(ax.normalize(), rad(wlim)); }
        var palmN = j.palm[k];
        function poseBase(fd) {
          aim(S + 'ForeArm', S + 'Hand', fd, palm0[S], palmN);
          aim(S + 'Hand', S + 'HandMiddle1', hd, palm0[S], palmN);
        }
        poseBase(fdir);
        // el agarre queda en la palma, en la base de los dedos: se corrige la dirección del antebrazo
        if (fist) {
          for (var it = 0; it < 4; it++) {
            var pp = worldPos(S + 'Hand').lerp(worldPos(S + 'HandMiddle1'), 0.86).add(palmN.clone().multiplyScalar(GRIP_R + 0.011));
            var err = hand.clone().sub(pp);
            if (err.length() < 0.003) break;
            fdir = worldPos(S + 'Hand').add(err).sub(el).normalize();
            poseBase(fdir);
          }
        }
        // dedos con contacto: cada falange se cierra hasta tocar el agarre (no atraviesa la barra ni a los otros dedos)
        var gAx = knuckle.clone();
        function hitsGrip(a, b) {
          for (var s = 0; s <= 4; s++) {
            var p = a.clone().lerp(b, s / 4).sub(hand);
            if (p.sub(gAx.clone().multiplyScalar(p.dot(gAx))).length() < GRIP_R + FING_R) return true;
          }
          return false;
        }
        // mano plana apoyada: dedos algo separados y relajados, con las yemas sobre el apoyo (sin atravesarlo)
        if (!fist && bones[S + 'HandIndex1'] && bones[S + 'HandPinky1']) {
          var radDir = worldPos(S + 'HandIndex1').sub(worldPos(S + 'HandPinky1')); radDir.sub(palmN.clone().multiplyScalar(radDir.dot(palmN))).normalize();
          var supN = palmN.clone().negate();
          var P0 = worldPos(S + 'Hand').lerp(worldPos(S + 'HandMiddle1'), 0.75).add(palmN.clone().multiplyScalar(0.013));
          var spreadA = { Index: 9, Middle: 2, Ring: -5, Pinky: -12 };
          ['Index', 'Middle', 'Ring', 'Pinky'].forEach(function (F) {
            if (!fingerSeg[S + F]) return;
            var sp = rad(spreadA[F]), hdF = hd.clone().multiplyScalar(Math.cos(sp)).add(radDir.clone().multiplyScalar(Math.sin(sp))).normalize();
            var knF = hdF.clone().cross(palmN).normalize();
            function setF(a1) {
              var cum = 0, tip = null;
              [a1, 12, 8].forEach(function (a, n) {
                var i = n + 1, name = S + 'Hand' + F + i, seg = fingerSeg[S + F][i];
                cum += a;
                var dirF = hdF.clone().applyAxisAngle(knF, rad(cum)), nrm = palmN.clone().applyAxisAngle(knF, rad(cum));
                aimD(name, seg.d0, dirF, palm0[S], nrm);
                if (i === 3) tip = worldPos(name).add(dirF.multiplyScalar(seg.L));
              });
              return tip.sub(P0).dot(supN);
            }
            var lo = -35, hi = 40;
            for (var it2 = 0; it2 < 8; it2++) { var mid2 = (lo + hi) / 2; if (setF(mid2) > 0.006) lo = mid2; else hi = mid2; }
            setF((lo + hi) / 2);
          });
        }
        if (fist) ['Index', 'Middle', 'Ring', 'Pinky'].forEach(function (F) {
          var cum = 0;
          for (var i = 1; i <= 3; i++) {
            var name = S + 'Hand' + F + i, seg = fingerSeg[S + F][i];
            if (!bones[name] || !seg) continue;
            var setA = function (a) {
              var dirF = hd.clone().applyAxisAngle(knuckle, rad(cum + a)), nrm = palmN.clone().applyAxisAngle(knuckle, rad(cum + a));
              aimD(name, seg.d0, dirF, palm0[S], nrm);
              var p0 = worldPos(name);
              return [p0, p0.clone().add(dirF.multiplyScalar(seg.L))];
            };
            var maxA = fist ? [80, 100, 75][i - 1] : 0, a = maxA;
            if (fist) {
              var free = 0, hit = -1;
              for (var t = 10; t <= maxA + 0.1; t += 10) { var sg = setA(Math.min(t, maxA)); if (hitsGrip(sg[0], sg[1])) { hit = Math.min(t, maxA); break; } free = Math.min(t, maxA); }
              if (hit >= 0) { for (var r = 0; r < 3; r++) { var mid = (free + hit) / 2, sm = setA(mid); if (hitsGrip(sm[0], sm[1])) hit = mid; else free = mid; } a = free; }
            }
            setA(a); cum += a;
          }
        });
        // pulgar: rodea el agarre desde el otro lado y se detiene al tocarlo
        var Rhand = frameQuat(hd, palmN).multiply(frameQuat(rp(S + 'HandMiddle1').clone().sub(rp(S + 'Hand')).normalize(), palm0[S]).invert());
        function setThumb(a) {
          var pts = [];
          ['Thumb1', 'Thumb2', 'Thumb3'].forEach(function (t, n) {
            var extra = new T.Quaternion().setFromAxisAngle(hd, (S === 'Left' ? -1 : 1) * rad(a * [0.6, 1.1, 1.5][n]));
            rot(S + 'Hand' + t, extra.multiply(Rhand));
          });
          var t1 = worldPos(S + 'HandThumb1'), t2 = worldPos(S + 'HandThumb2'), t3 = worldPos(S + 'HandThumb3');
          var tip = t3.clone().add(t3.clone().sub(t2).multiplyScalar(0.75));
          return [[t2, t3], [t3, tip]];
        }
        if (bones[S + 'HandThumb3']) {
          setThumb(0);
          if (!fist && bones[S + 'HandIndex1'] && bones[S + 'HandPinky1']) {
            // mano plana apoyada: el pulgar descansa sobre la superficie, hacia delante y al costado
            var rad1 = worldPos(S + 'HandIndex1').sub(worldPos(S + 'HandPinky1')); rad1.sub(palmN.clone().multiplyScalar(rad1.dot(palmN))).normalize();
            var tdir = hd.clone().multiplyScalar(0.55).add(rad1.clone().multiplyScalar(0.8)).add(palmN.clone().multiplyScalar(-0.12)).normalize();
            var tdir2 = hd.clone().multiplyScalar(0.8).add(rad1.clone().multiplyScalar(0.5)).add(palmN.clone().multiplyScalar(-0.1)).normalize();
            var trf = rest[S + 'HandThumb3'].p.clone().sub(rest[S + 'HandThumb2'].p).normalize();
            aim(S + 'HandThumb1', S + 'HandThumb2', tdir, palm0[S], palmN);
            aim(S + 'HandThumb2', S + 'HandThumb3', tdir2, palm0[S], palmN);
            aimD(S + 'HandThumb3', trf, tdir2, palm0[S], palmN);
          }
          if (fist && bones[S + 'HandIndex2']) {
            // agarre de fuerza: el pulgar rodea el agarre por el lado contrario y se apoya sobre el índice
            var e1 = palmN.clone().negate(), e2 = hd.clone();
            var Cc = hand.clone().add(gAx.clone().multiplyScalar(worldPos(S + 'HandIndex1').sub(hand).dot(gAx)));
            var R2 = GRIP_R + FING_R * 1.15;
            function onC(a, b) { return Cc.clone().add(e1.clone().multiplyScalar(a).add(e2.clone().multiplyScalar(b)).normalize().multiplyScalar(R2)); }
            var P2 = onC(0.35, -1), P3 = onC(-0.7, -0.6), Ptip = onC(-1, 0.35);
            var tr = rest[S + 'HandThumb3'].p.clone().sub(rest[S + 'HandThumb2'].p).normalize();
            aim(S + 'HandThumb1', S + 'HandThumb2', P2.clone().sub(worldPos(S + 'HandThumb1')), palm0[S], palmN);
            aim(S + 'HandThumb2', S + 'HandThumb3', P3.clone().sub(worldPos(S + 'HandThumb2')), palm0[S], palmN);
            aimD(S + 'HandThumb3', tr, Ptip.clone().sub(worldPos(S + 'HandThumb3')), palm0[S], palmN);
          }
        }
        // piernas: la rodilla mira hacia la punta del pie
        var ul = worldPos(S + 'UpLeg'), kn = j.knee[k], an = j.ank[k], fd = j.footDir[k], fu = j.footUp[k];
        var foot0 = rp(S + 'ToeBase').clone().sub(rp(S + 'Foot')); foot0.y = 0; foot0.normalize();
        // giro del muslo: la rótula mira hacia el frente de la rodilla (plano real de flexión);
        // con la pierna casi estirada se usa la dirección del pie
        var thD = kn.clone().sub(ul).normalize(), shD = an.clone().sub(kn).normalize();
        var pat = perp(shD, thD).negate(), pw = ssm(0.12, 0.35, pat.length());
        var fdP = perp(fd, thD); if (fdP.lengthSq() < 1e-6) fdP = perp(j.fwd, thD);
        fdP.normalize();
        var patDir = pw > 0 ? fdP.clone().multiplyScalar(1 - pw).add(pat.normalize().multiplyScalar(pw)).normalize() : fdP;
        aim(S + 'UpLeg', S + 'Leg', kn.clone().sub(ul), foot0, patDir);
        aim(S + 'Leg', S + 'Foot', an.clone().sub(worldPos(S + 'Leg')), foot0, fd);
        var tb0 = rp(S + 'ToeBase').clone().sub(rp(S + 'Foot'));
        var a = tb0.dot(foot0), bcomp = tb0.y;
        var tb1 = fd.clone().multiplyScalar(a).add(fu.clone().multiplyScalar(bcomp));
        aim(S + 'Foot', S + 'ToeBase', tb1, V(0, 1, 0), fu);
        var Rf = frameQuat(fd, fu).multiply(frameQuat(foot0, V(0, 1, 0)).invert());
        // sobre la bola del pie los dedos se doblan y quedan planos sobre el apoyo
        if (j.ball && j.ball[k]) { var fdFlat = V(fd.x, 0, fd.z); if (fdFlat.lengthSq() > 1e-6) Rf = frameQuat(fdFlat.normalize(), V(0, 1, 0)).multiply(frameQuat(foot0, V(0, 1, 0)).invert()); }
        rot(S + 'ToeBase', Rf);
      });
    }
    return { pose: pose, wrap: wrap };
  }

  // ---------------------------------------------------------------------------
  //  Escena
  // ---------------------------------------------------------------------------
  function createStage(key, eq, muscleOverride, view) {
    var d = P[key] || P.curl;
    eq = eq || 'none';
    var M = mats();
    var scene = new T.Scene();
    var active = { p: (d.p || []).slice(), s: (d.s || []).slice(), side: d.side || null, both: d.both || [] }; // both: músculos que trabajan a los dos lados aunque el ejercicio sea a una mano
    if (muscleOverride && MUSCLE_MAP[muscleOverride]) {
      var mm = MUSCLE_MAP[muscleOverride];
      if (active.p.indexOf(mm) < 0) { active.s = active.s.concat(active.p); active.p = [mm]; }
    }
    var solids = []; // superficies que el cuerpo no puede atravesar (para las pruebas)
    function solid(m) { solids.push(m); return m; }

    // Luces y suelo
    scene.add(new T.HemisphereLight(0xffffff, 0x30343e, 0.8));
    var key1 = new T.DirectionalLight(0xffffff, 1.2);
    key1.position.set(2.5, 4.6, 3.2); key1.castShadow = true;
    key1.shadow.mapSize.set(1024, 1024); key1.shadow.camera.left = -2.6; key1.shadow.camera.right = 2.6;
    key1.shadow.camera.top = 3; key1.shadow.camera.bottom = -1; key1.shadow.bias = -0.0005; key1.shadow.radius = 4;
    scene.add(key1);
    var rim = new T.DirectionalLight(0xc6d6ff, 0.5); rim.position.set(-3, 2.6, -2.6); scene.add(rim);
    var fill = new T.DirectionalLight(0xffffff, 0.25); fill.position.set(-2, 1.5, 3); scene.add(fill);
    var disc = new T.Mesh(new T.CircleGeometry(2.8, 64), new T.MeshBasicMaterial({ color: 0x1c1e24 }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = -0.002; scene.add(disc);
    var floor = new T.Mesh(new T.PlaneGeometry(12, 12), new T.ShadowMaterial({ opacity: 0.45 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    var body = MODEL ? null : makeBody(scene, active);
    var model = MODEL ? makeModelBody(scene, active) : null;
    var eqp = { cables: [] };
    var smith = eq === 'machine' && d.smith;
    var barMode = eq === 'barbell' || smith;
    var cableLoads = ['pulldown', 'seatedRow', 'facePull', 'pushdown', 'twinCable', 'ankle', 'ankleSide', 'cableR', 'cableL'];
    var needsStack = eq === 'cable' || (eq === 'machine' && d.stack && !smith) || cableLoads.indexOf(d.load) >= 0;
    if ((d.load === 'ankle' || d.load === 'ankleSide') && eq !== 'cable' && eq !== 'machine') needsStack = false;

    // Postura de referencia para colocar los soportes (no se mueven)
    var p0 = poseAt(d, 0).f;
    var jR = solve(p0.arms && p0.arms.bar ? Object.assign({}, p0, { arms: { ua: 0, fa: 0 } }) : p0);
    var BACK = 0.12, SEAT = 0.1; // grosor del cuerpo: espalda y glúteos
    var sc = d.scene || [];
    var G = new T.Group(); scene.add(G);
    function legs4(x0, x1, z0, z1, y) { [[x0, z0], [x0, z1], [x1, z0], [x1, z1]].forEach(function (p) { box(G, 0.05, y, 0.05, M.frame, p[0], y / 2, p[1]); }); }
    // cojín orientado a lo largo de un eje (cara superior apoyada en el cuerpo)
    function padAlong(center, axis, len, thick, width, normalSign) {
      var g = new T.Group(); G.add(g);
      var b = solid(box(g, len, thick, width, M.pad, 0, 0, 0));
      var ang = Math.atan2(axis.y, axis.x);
      g.position.copy(center); g.rotation.z = ang;
      return g;
    }
    if (sc.indexOf('bench') >= 0) {
      var by = jR.hip.y - BACK - 0.035;
      solid(box(G, 1.25, 0.07, 0.3, M.pad, -0.05, by, 0)); legs4(-0.55, 0.45, -0.1, 0.1, by - 0.035);
    }
    if (sc.indexOf('benchRack') >= 0 && !smith) {
      [-1, 1].forEach(function (sg) { box(G, 0.06, 1.15, 0.06, M.frame, -0.6, 0.575, sg * 0.55); box(G, 0.12, 0.04, 0.06, M.metal, -0.54, 1.02, sg * 0.55); });
      box(G, 0.3, 0.04, 1.2, M.frame, -0.6, 0.02, 0);
    }
    if (sc.indexOf('rack') >= 0 && !smith) {
      [-1, 1].forEach(function (sg) { box(G, 0.07, 1.7, 0.07, M.frame, -0.42, 0.85, sg * 0.62); box(G, 0.14, 0.05, 0.07, M.metal, -0.35, 1.38, sg * 0.62); box(G, 0.55, 0.05, 0.07, M.frame, -0.2, 0.03, sg * 0.62); });
    }
    if (sc.indexOf('inclineBench') >= 0) {
      var bc = jR.hip.clone().add(jR.up.clone().multiplyScalar(0.28)).add(jR.fwd.clone().multiplyScalar(-BACK - 0.035));
      padAlong(bc, jR.up, 0.82, 0.07, 0.3);
      var sc0 = jR.hip.clone().add(V(0.12, -SEAT - 0.035, 0));
      solid(box(G, 0.42, 0.07, 0.3, M.pad, sc0.x, sc0.y, 0)); legs4(sc0.x - 0.4, sc0.x + 0.15, -0.1, 0.1, sc0.y - 0.035);
    }
    if (sc.indexOf('rowBench') >= 0) { solid(box(G, 1.1, 0.07, 0.3, M.pad, 0.0, 0.43, -0.17)); legs4(-0.45, 0.45, -0.27, -0.07, 0.4); }
    if (sc.indexOf('thrustBench') >= 0) { solid(box(G, 0.24, 0.07, 1.0, M.pad, -0.64, 0.405, 0)); legs4(-0.72, -0.56, -0.4, 0.4, 0.37); }
    if (sc.indexOf('mat') >= 0) box(G, 1.9, 0.015, 0.65, M.mat, -0.05, 0.008, 0);
    // barra fija baja para el remo invertido (a la altura de las manos con los brazos estirados)
    if (sc.indexOf('lowBar') >= 0) {
      var lbh = jR.hand.L.clone().add(jR.hand.R).multiplyScalar(0.5);
      cylZ(G, 0.016, 1.2, M.metal, lbh.x, lbh.y, 0); // se agarra con las manos: no es un obstáculo
      [-1, 1].forEach(function (sg) { box(G, 0.06, lbh.y + 0.08, 0.06, M.frame, lbh.x, (lbh.y + 0.08) / 2, sg * 0.6); box(G, 0.5, 0.04, 0.06, M.frame, lbh.x, 0.02, sg * 0.6); });
    }
    // jaula con pines a la altura de las rodillas (rack pull)
    if (sc.indexOf('rackPins') >= 0) {
      [-1, 1].forEach(function (sg) { box(G, 0.06, 1.6, 0.06, M.frame, -0.1, 0.8, sg * 0.62); box(G, 0.06, 1.6, 0.06, M.frame, 0.45, 0.8, sg * 0.62); box(G, 0.62, 0.035, 0.05, M.metal, 0.17, (d.pinY || 0.48) - 0.04, sg * 0.62); });
      box(G, 0.62, 0.03, 1.3, M.frame, 0.17, 0.015, 0);
    }
    // cajas, bancos y pared colocados a mano: [x, alto de la cara superior, z, ancho x, ancho z, grosor (por defecto hasta el suelo)]
    (d.boxes || []).forEach(function (bx) {
      var h = bx[5] || bx[1], m = solid(box(G, bx[3] || 0.4, h, bx[4] || 0.4, bx[6] ? M.frame : M.pad, bx[0], bx[1] - h / 2, bx[2] || 0)); m.userData.noBake = true;
    });
    // plataforma móvil para los pies (prensa horizontal) sobre raíles
    if (d.sled && !eqp.sled) {
      eqp.sled = new T.Group(); G.add(eqp.sled);
      box(eqp.sled, 0.05, 0.62, 0.72, M.frameLight, 0, 0, 0); box(eqp.sled, 0.02, 0.58, 0.68, M.rubber, -0.032, 0, 0);
      [-1, 1].forEach(function (sg) { box(G, 1.4, 0.05, 0.05, M.frame, 0.3, 0.3, sg * 0.42); box(G, 0.05, 0.3, 0.05, M.frame, 0.95, 0.15, sg * 0.42); });
    }
    // rodillo de curl genérico (de pie / sentado): por detrás de la pierna derecha
    if (d.roller) { eqp.roller = cylZ(G, 0.05, d.side ? 0.2 : 0.36, M.pad, 0, 0, 0); eqp.lever = box(G, 0.04, 0.44, 0.04, M.frame, 0, 0, 0.3); }
    // banco bajo las manos (flexiones inclinadas): las manos en el borde cercano
    if (sc.indexOf('handBench') >= 0) {
      var hh = jR.hand.L.clone().add(jR.hand.R).multiplyScalar(0.5), hy0 = hh.y - 0.05;
      solid(box(G, 0.34, 0.07, 1.0, M.pad, hh.x + 0.12, hy0 - 0.035, 0)).userData.noBake = true; legs4(hh.x - 0.0, hh.x + 0.26, -0.38, 0.38, hy0 - 0.07);
    }
    // banco bajo los pies (flexiones declinadas): las puntas apoyadas encima
    if (sc.indexOf('footBench') >= 0) {
      var fa0 = jR.ank.L.clone().add(jR.ank.R).multiplyScalar(0.5), fy0 = Math.min(jR.toe.L.y, jR.toe.R.y) - 0.024; // las puntas de los pies apoyan encima
      solid(box(G, 0.34, 0.07, 0.6, M.pad, fa0.x + 0.06, fy0 - 0.035, 0)).userData.noBake = true; legs4(fa0.x - 0.08, fa0.x + 0.2, -0.22, 0.22, fy0 - 0.07);
    }
    // banco declinado: respaldo bajo la espalda, rodillo para sujetar las piernas
    if (sc.indexOf('declineBench') >= 0) {
      var dc = jR.hip.clone().add(jR.up.clone().multiplyScalar(0.3)).add(jR.fwd.clone().multiplyScalar(-BACK - 0.035)); dc.z = 0;
      padAlong(dc, jR.up, 1.0, 0.07, 0.3);
      var kt = jR.hipJ.R.clone().sub(jR.knee.R).normalize(), ks = jR.ank.R.clone().sub(jR.knee.R).normalize(), kang = Math.acos(clamp(kt.dot(ks), -1, 1)); var kin = kt.clone().add(ks).normalize(); var lk = jR.knee.R.clone().add(kin.multiplyScalar((0.05 + 0.062) / Math.max(0.3, Math.sin(kang / 2)))), la = jR.ank.R.clone().add(jR.footDir.R.clone().multiplyScalar(0.12)).add(jR.footUp.R.clone().multiplyScalar(0.06)); // rodillo sobre el empeine
      cylZ(G, 0.045, 0.36, M.pad, la.x, la.y, 0); // los pies se enganchan bajo el rodillo
      beam(G, V(dc.x - 0.3, dc.y - 0.12, 0), V(dc.x - 0.35, 0.03, 0), 0.06, M.frame);
      beam(G, V(la.x, la.y - 0.05, 0), V(la.x + 0.05, 0.03, 0), 0.06, M.frame);
      box(G, 1.3, 0.04, 0.4, M.frame, (dc.x + lk.x) / 2 - 0.1, 0.02, 0);
    }
    // asiento con respaldo vertical (press sentado, pec deck, máquinas)
    if (sc.indexOf('seatBack') >= 0) {
      var sby = jR.hip.y - SEAT - 0.03;
      solid(box(G, 0.4, 0.06, 0.34, M.pad, jR.hip.x + 0.08, sby, 0)); legs4(jR.hip.x - 0.08, jR.hip.x + 0.22, -0.12, 0.12, sby - 0.03);
      var bb = jR.hip.clone().add(jR.up.clone().multiplyScalar(0.3)).add(jR.fwd.clone().multiplyScalar(-BACK - 0.035)); bb.z = 0;
      padAlong(bb, jR.up, 0.62, 0.07, 0.32);
      beam(G, V(bb.x - 0.04, bb.y - 0.3, 0), V(bb.x - 0.04, 0.03, 0), 0.06, M.frame);
    }
    // cojín vertical delante del pecho (pec deck inverso, remo en máquina con pecho apoyado)
    if (sc.indexOf('chestPad') >= 0) {
      var cp = jR.hip.clone().add(jR.up.clone().multiplyScalar(0.33)).add(jR.fwd.clone().multiplyScalar(0.15)); cp.z = 0;
      padAlong(cp, jR.up, 0.28, 0.07, 0.3);
      beam(G, V(cp.x + 0.06, cp.y - 0.2, 0), V(cp.x + 0.1, 0.03, 0), 0.06, M.frame);
      var sy2 = jR.hip.y - SEAT - 0.03;
      solid(box(G, 0.36, 0.06, 0.32, M.pad, jR.hip.x - 0.02, sy2, 0)); legs4(jR.hip.x - 0.16, jR.hip.x + 0.12, -0.11, 0.11, sy2 - 0.03);
    }
    // taburete / banco plano para sentarse (la cadera apoya encima)
    if (sc.indexOf('stool') >= 0) {
      var sy = jR.hip.y - SEAT - 0.03;
      solid(box(G, 0.32, 0.06, 0.32, M.pad, jR.hip.x - 0.1, sy, 0)); legs4(jR.hip.x - 0.22, jR.hip.x + 0.02, -0.11, 0.11, sy - 0.03);
    }
    // banco inclinado para tumbarse boca abajo (el pecho apoya en el respaldo)
    if (sc.indexOf('proneIncline') >= 0) {
      // el borde superior queda bajo las axilas: los brazos cuelgan libres por delante
      var pcn = jR.hip.clone().lerp(jR.shoC, 0.32).add(jR.fwd.clone().multiplyScalar(0.13)); pcn.z = 0;
      padAlong(pcn, jR.up, 0.24, 0.07, 0.32);
      beam(G, V(pcn.x + 0.02, pcn.y - 0.1, 0), V(pcn.x + 0.25, 0.03, 0), 0.06, M.frame);
      beam(G, V(pcn.x - 0.1, pcn.y - 0.25, 0), V(pcn.x - 0.25, 0.03, 0), 0.06, M.frame);
      box(G, 0.7, 0.04, 0.4, M.frame, pcn.x, 0.02, 0);
    }
    // banco inclinado estrecho bajo todo el tronco (remo con pecho apoyado): los brazos cuelgan a los lados
    if (sc.indexOf('proneBench') >= 0) {
      var pb = jR.hip.clone().lerp(jR.shoC, 0.6).add(jR.fwd.clone().multiplyScalar(0.22)); pb.z = 0;
      padAlong(pb, jR.up, 0.4, 0.07, 0.22).children[0].userData.noBake = true;
      beam(G, V(pb.x + 0.03, pb.y - 0.08, 0), V(pb.x + 0.22, 0.03, 0), 0.06, M.frame);
      beam(G, V(pb.x - 0.12, pb.y - 0.2, 0), V(pb.x - 0.3, 0.03, 0), 0.06, M.frame);
      box(G, 0.7, 0.04, 0.36, M.frame, pb.x - 0.04, 0.02, 0);
    }
    // banco plano detrás de la cadera para fondos (las manos apoyan en el borde)
    if (sc.indexOf('dipBench') >= 0) {
      var hb = jR.hand.L.clone().add(jR.hand.R).multiplyScalar(0.5), dy = hb.y - 0.05;
      solid(box(G, 0.34, 0.07, 1.0, M.pad, hb.x - 0.13, dy - 0.035 + 0.0, 0)); legs4(hb.x - 0.27, hb.x + 0.01, -0.38, 0.38, dy - 0.07);
    }
    if (sc.indexOf('step') >= 0) { box(G, 0.34, 0.1, 0.7, M.rubber, 0.21, 0.05, 0); box(G, 0.34, 0.006, 0.7, M.frameLight, 0.21, 0.103, 0); }
    if (sc.indexOf('pullFrame') >= 0) {
      [-1, 1].forEach(function (sg) { box(G, 0.07, 2.3, 0.07, M.frame, -0.05, 1.15, sg * 0.75); box(G, 0.6, 0.04, 0.07, M.frame, -0.05, 0.02, sg * 0.75); });
      cylZ(G, 0.018, 1.6, M.metal, 0.0, 2.22, 0);
    }
    if (sc.indexOf('dipStation') >= 0) {
      [-1, 1].forEach(function (sg) {
        cylX(G, 0.02, 0.7, M.metal, 0.05, 1.24, sg * 0.26);
        box(G, 0.06, 1.24, 0.06, M.frame, 0.38, 0.62, sg * 0.3); box(G, 0.06, 1.24, 0.06, M.frame, -0.28, 0.62, sg * 0.3);
      });
    }
    if (sc.indexOf('hyperBench') >= 0) {
      // cojín bajo la parte delantera de los muslos y rodillo detrás de los tobillos
      var th = jR.knee.R.clone().sub(jR.hipJ.R).normalize(), tf = boneFront(jR.hipJ.R, jR.knee.R, jR.fwd);
      var hpad = jR.hipJ.R.clone().add(th.clone().multiplyScalar(0.345)).add(tf.clone().multiplyScalar(0.11)); hpad.z = 0;
      padAlong(hpad, th, 0.22, 0.07, 0.42);
      var sv = jR.ank.R.clone().sub(jR.knee.R).normalize(), sb = boneFront(jR.knee.R, jR.ank.R, jR.fwd).multiplyScalar(-1);
      var fp = jR.ank.R.clone().add(sv.clone().multiplyScalar(-0.06)).add(sb.clone().multiplyScalar(0.095)); fp.z = 0;
      cylZ(G, 0.045, 0.4, M.pad, fp.x, fp.y, 0);
      beam(G, V(hpad.x - 0.05, hpad.y - 0.08, 0), V(fp.x, 0.05, 0), 0.06, M.frame);
      beam(G, V(hpad.x, hpad.y - 0.06, 0), V(hpad.x + 0.1, 0.03, 0), 0.06, M.frame);
      box(G, 1.2, 0.04, 0.5, M.frame, (hpad.x + fp.x) / 2, 0.02, 0);
    }
    if (sc.indexOf('preacher') >= 0) {
      var ua = jR.el.R.clone().sub(jR.sho.R).normalize(), uf = boneFront(jR.sho.R, jR.el.R, jR.fwd);
      // tabla inclinada más vertical que el brazo: su borde superior sostiene el brazo junto al codo
      // y el resto baja hacia el suelo, lejos del abdomen (como en los bancos Scott reales)
      var padAx = ua.clone().applyAxisAngle(V(0, 0, 1), -rad(30)); padAx.z = 0; padAx.normalize();
      var padN = V(-padAx.y, padAx.x, 0); if (padN.dot(uf) < 0) padN.multiplyScalar(-1);
      var touch = jR.sho.R.clone().lerp(jR.el.R, 0.98).add(padN.clone().multiplyScalar(-0.047));
      var PL = 0.2, pc = touch.clone().add(padN.clone().multiplyScalar(-0.025)).add(padAx.clone().multiplyScalar(PL / 2 + 0.06)); pc.z = 0;
      var prPad = padAlong(pc, padAx, PL, 0.05, 0.46); prPad.children[0].userData.noBake = true;
      solids.pop(); // el pecho se apoya en el borde del cojín (contacto real)
      box(G, 0.06, pc.y - 0.05, 0.06, M.frame, pc.x + 0.05, (pc.y - 0.05) / 2, 0);
      var ps = jR.hip.clone().add(V(0.02, -SEAT - 0.035, 0));
      solid(box(G, 0.32, 0.07, 0.32, M.pad, ps.x, ps.y, 0)); box(G, 0.06, ps.y - 0.035, 0.06, M.frame, ps.x, (ps.y - 0.035) / 2, 0);
    }
    if (sc.indexOf('legExt') >= 0 || sc.indexOf('chestPress') >= 0 || sc.indexOf('pulldown') >= 0 || sc.indexOf('seatedCalf') >= 0) {
      var seat = jR.hip.clone().add(V(0.05, -SEAT - 0.04, 0));
      solid(box(G, 0.46, 0.08, 0.44, M.pad, seat.x, seat.y, 0));
      box(G, 0.07, seat.y - 0.04, 0.07, M.frame, seat.x, (seat.y - 0.04) / 2, 0);
      box(G, 0.8, 0.04, 0.6, M.frame, seat.x - 0.05, 0.02, 0);
      if (sc.indexOf('pulldown') < 0 && sc.indexOf('seatedCalf') < 0) {
        var back = jR.hip.clone().add(jR.up.clone().multiplyScalar(0.3)).add(jR.fwd.clone().multiplyScalar(-BACK - 0.04));
        padAlong(back, jR.up, 0.62, 0.08, 0.42);
      }
    }
    if (sc.indexOf('legExt') >= 0) {
      [-1, 1].forEach(function (sg) { cylX(G, 0.02, 0.18, M.metal, jR.hip.x + 0.05, jR.hip.y - 0.02, sg * 0.25); });
      eqp.lever = box(G, 0.04, 0.42, 0.04, M.frame, 0, 0, 0.3);
      eqp.roller = cylZ(G, 0.05, 0.42, M.pad, 0, 0, 0);
    }
    if (sc.indexOf('legCurl') >= 0) {
      var cy = jR.hip.y - 0.11 - 0.04;
      solid(box(G, 1.08, 0.08, 0.38, M.pad, 0.065, cy, 0)); legs4(-0.35, 0.5, -0.12, 0.12, cy - 0.04);
      [-1, 1].forEach(function (sg) { cylX(G, 0.018, 0.14, M.metal, 0.5, cy - 0.06, sg * 0.25); });
      eqp.roller = cylZ(G, 0.05, 0.42, M.pad, 0, 0, 0);
      eqp.lever = box(G, 0.04, 0.44, 0.04, M.frame, 0, 0, 0.3);
    }
    if (sc.indexOf('chestPress') >= 0) {
      // palancas desde abajo (pivote cerca del suelo, delante del asiento)
      eqp.handles = [box(G, 0.035, 0.15, 0.035, M.metal, 0, 0, -0.27), box(G, 0.035, 0.15, 0.035, M.metal, 0, 0, 0.27)];
      eqp.arms = [box(G, 0.05, 1, 0.05, M.frame, 0, 0, -0.34), box(G, 0.05, 1, 0.05, M.frame, 0, 0, 0.34)];
      eqp.pivot = V(jR.hip.x - 0.02, 0.22, 0);
      [-1, 1].forEach(function (sg) { cylZ(G, 0.04, 0.08, M.metal, eqp.pivot.x, eqp.pivot.y, sg * 0.34); box(G, 0.06, 0.22, 0.06, M.frame, eqp.pivot.x, 0.11, sg * 0.34); });
    }
    if (sc.indexOf('pulldown') >= 0) {
      var kp = jR.knee.R.clone().add(V(-0.02, 0.115, 0)); kp.z = 0;
      solid(box(G, 0.12, 0.1, 0.46, M.pad, kp.x, kp.y, 0)); box(G, 0.05, kp.y - 0.05, 0.05, M.frame, kp.x + 0.06, (kp.y - 0.05) / 2, 0);
      beam(G, V(0.62, 2.45, 0), V(0.2, 2.45, 0), 0.06, M.frame);
      var tp = new T.Mesh(new T.TorusGeometry(0.045, 0.012, 10, 24), M.metal); tp.position.set(0.2, 2.42, 0); tp.rotation.y = Math.PI / 2; G.add(tp);
    }
    if (sc.indexOf('seatedRow') >= 0) {
      box(G, 1.7, 0.06, 0.32, M.frame, 0.12, 0.2, 0);
      solid(box(G, 0.44, 0.08, 0.38, M.pad, jR.hip.x, jR.hip.y - SEAT - 0.04, 0));
      box(G, 0.06, 0.18, 0.06, M.frame, jR.hip.x, 0.29, 0);
      [-1, 1].forEach(function (sg) { var fpl = box(G, 0.05, 0.3, 0.16, M.frameLight, jR.ank.R.x + 0.1, 0.38, sg * 0.14); fpl.rotation.z = rad(-18); });
      box(G, 0.08, 0.5, 0.2, M.frame, 0.88, 0.45, 0);
    }
    if (sc.indexOf('seatedCalf') >= 0) {
      box(G, 0.2, 0.2, 0.55, M.rubber, jR.ank.R.x + 0.185, 0.1, 0);
      box(G, 0.06, 0.62, 0.06, M.frame, 0.12, 0.31, -0.32);
      eqp.kneePad = new T.Group(); G.add(eqp.kneePad);
      box(eqp.kneePad, 0.2, 0.07, 0.5, M.pad, 0, 0, 0);
      beam(eqp.kneePad, V(0, 0, -0.3), V(-0.32, -0.25, -0.32), 0.05, M.frame);
      cylZ(eqp.kneePad, 0.025, 0.25, M.metal, -0.32, -0.25, -0.45);
      [0, 1].forEach(function (i) { cylZ(eqp.kneePad, 0.16, 0.04, M.plate, -0.32, -0.25, -0.38 - i * 0.05); });
    }
    if (sc.indexOf('legPress') >= 0) {
      var lseat = jR.hip.clone().add(V(0.02, -SEAT - 0.04, 0));
      var ls = solid(box(G, 0.44, 0.08, 0.52, M.pad, lseat.x, lseat.y, 0)); ls.rotation.z = rad(-6);
      var lback = jR.hip.clone().add(jR.up.clone().multiplyScalar(0.28)).add(jR.fwd.clone().multiplyScalar(-BACK - 0.04));
      padAlong(lback, jR.up, 0.66, 0.08, 0.52);
      box(G, 0.07, lseat.y, 0.07, M.frame, lseat.x, lseat.y / 2, 0);
      box(G, 2.1, 0.05, 1.0, M.frame, 0.15, 0.025, 0);
      [-1, 1].forEach(function (sg) {
        beam(G, V(-0.05, 0.25, sg * 0.46), V(1.05, 1.35, sg * 0.46), 0.07, M.frame);
        box(G, 0.06, 1.32, 0.06, M.frame, 1.05, 0.66, sg * 0.46);
        box(G, 0.06, 0.25, 0.06, M.frame, -0.05, 0.125, sg * 0.46);
      });
      eqp.sled = new T.Group(); G.add(eqp.sled);
      box(eqp.sled, 0.05, 0.62, 0.72, M.frameLight, 0, 0, 0);
      box(eqp.sled, 0.02, 0.58, 0.68, M.rubber, -0.032, 0, 0);
      [-1, 1].forEach(function (sg) {
        box(eqp.sled, 0.14, 0.14, 0.1, M.frame, 0.08, 0.0, sg * 0.46);
        cylZ(eqp.sled, 0.025, 0.28, M.metal, 0.12, 0.12, sg * 0.66);
        [0, 1].forEach(function (i) { cylZ(eqp.sled, 0.2, 0.04, M.plate, 0.12, 0.12, sg * (0.58 + i * 0.05)); });
      });
    }
    if (sc.indexOf('treadmill') >= 0) {
      var TG = new T.Group(); G.add(TG); var tInc = rad((d.gait && d.gait.incline) || 0); TG.rotation.z = tInc;
      box(TG, 1.8, 0.12, 0.8, M.frame, -0.02, 0.06, 0); box(TG, 1.62, 0.02, 0.62, M.belt, -0.02, 0.13, 0);
      [-1, 1].forEach(function (sg) { box(TG, 1.8, 0.03, 0.08, M.frameLight, -0.02, 0.135, sg * 0.36); var up = box(TG, 0.05, 1.2, 0.05, M.frame, 0.72, 0.68, sg * 0.36); up.rotation.z = rad(-10) - tInc; });
      box(TG, 0.25, 0.12, 0.8, M.frame, 0.83, 1.28, 0).rotation.z = -tInc;
      if (tInc) { box(G, 0.12, 0.9 * Math.sin(tInc) + 0.06, 0.7, M.frame, 0.86, 0.45 * Math.sin(tInc) + 0.03, 0); }
      eqp.beltMarks = [];
      for (var bm = 0; bm < 8; bm++) eqp.beltMarks.push(box(TG, 0.025, 0.004, 0.6, M.frameLight, 0, 0.142, 0));
    }
    if (sc.indexOf('airbike') >= 0) {
      box(G, 1.25, 0.05, 0.5, M.frame, 0.05, 0.025, 0);
      beam(G, V(-0.42, 0.05, 0), V(jR.hip.x - 0.02, jR.hip.y - SEAT - 0.08, 0), 0.06, M.frame);
      box(G, 0.13, 0.06, 0.13, M.pad, jR.hip.x - 0.08, jR.hip.y - SEAT - 0.085, 0).userData.noBake = true;
      beam(G, V(0.18, 0.36, 0), V(0.8, 0.62, 0), 0.06, M.frame); beam(G, V(0.8, 0.05, 0), V(0.8, 0.62, 0), 0.07, M.frame);
      var fan = cylZ(G, 0.36, 0.2, M.frameLight, 0.9, 0.52, 0); fan.geometry = new T.CylinderGeometry(0.36, 0.36, 0.2, 48);
      [-1, 1].forEach(function (sg) { var rim = new T.Mesh(new T.TorusGeometry(0.36, 0.015, 8, 48), M.frame); rim.position.set(0.9, 0.52, sg * 0.1); G.add(rim); });
      beam(G, V(0.78, 0.62, 0), V(0.5, 1.3, 0), 0.05, M.frame); box(G, 0.1, 0.08, 0.22, M.frameLight, 0.5, 1.34, 0);
      eqp.crank = new T.Group(); G.add(eqp.crank);
      eqp.airLev = [0, 1].map(function () { var l = beam(G, V(0, 0, 0), V(0, 1, 0), 0.045, M.metal); l.userData.noBake = true; return l; });
      eqp.airGrip = [0, 1].map(function () { var g = beam(G, V(0, 0, 0), V(0, 1, 0), 0.034, M.rubber); g.userData.noBake = true; return g; });
    }
    if (sc.indexOf('roadbike') >= 0) {
      // bicicleta de carretera: ruedas, cuadro en diamante, sillín y manillar de cuernos
      var RW = 0.335, rx = -0.58, fx = 0.6, wy = RW + 0.015, bb = V(0.18, 0.36, 0);
      eqp.wheels = [rx, fx].map(function (x) {
        var g = new T.Group(); g.position.set(x, wy, 0); G.add(g);
        var tire = new T.Mesh(new T.TorusGeometry(RW, 0.014, 10, 60), M.rubber); g.add(tire);
        var rimW = new T.Mesh(new T.TorusGeometry(RW - 0.025, 0.008, 6, 60), M.metal); g.add(rimW);
        for (var sp = 0; sp < 8; sp++) { var spk = box(g, 0.004, RW - 0.03, 0.004, M.metal, 0, 0, 0); spk.geometry.translate(0, (RW - 0.03) / 2, 0); spk.rotation.z = sp * Math.PI / 4; }
        cylZ(g, 0.025, 0.1, M.metal, 0, 0, 0); return g;
      });
      var seatT = V(jR.hip.x - 0.02, jR.hip.y - SEAT - 0.07, 0), head = V(fx - 0.12, 0.88, 0);
      [[bb, seatT], [seatT, head], [bb, head.clone().add(V(0.01, -0.12, 0))], [V(rx, wy, 0), bb], [V(rx, wy, 0), seatT.clone().add(V(0.03, -0.06, 0))], [head.clone().add(V(0, 0.08, 0)), V(fx, wy, 0)]].forEach(function (p) { beam(G, p[0], p[1], 0.035, M.frame); });
      box(G, 0.12, 0.045, 0.13, M.pad, jR.hip.x - 0.09, jR.hip.y - SEAT - 0.065, 0).userData.noBake = true; box(G, 0.13, 0.035, 0.04, M.pad, jR.hip.x + 0.03, jR.hip.y - SEAT - 0.08, 0).userData.noBake = true; // sillín: trasera ancha y punta estrecha
      var stem = head.clone().add(V(0.05, 0.12, 0)); beam(G, head.clone().add(V(0, 0.06, 0)), stem, 0.035, M.frame);
      cylZ(G, 0.014, 0.42, M.metal, stem.x, stem.y, 0);
      [-1, 1].forEach(function (sg) { beam(G, V(stem.x, stem.y, sg * 0.2), V(stem.x + 0.08, stem.y - 0.02, sg * 0.2), 0.03, M.rubber); });
      eqp.crank = new T.Group(); G.add(eqp.crank);
    }
    if (sc.indexOf('bike') >= 0 && sc.indexOf('airbike') < 0 && sc.indexOf('roadbike') < 0) {
      box(G, 1.1, 0.05, 0.45, M.frame, 0.0, 0.025, 0);
      var post = box(G, 0.06, 0.95, 0.06, M.frame, -0.3, 0.5, 0); post.rotation.z = rad(16);
      var fr = box(G, 0.06, 1.2, 0.06, M.frame, 0.3, 0.62, 0); fr.rotation.z = rad(-20);
      box(G, 0.13, 0.06, 0.16, M.pad, jR.hip.x - 0.06, jR.hip.y - SEAT - 0.045, 0); box(G, 0.07, 0.045, 0.04, M.pad, jR.hip.x + 0.04, jR.hip.y - SEAT - 0.06, 0).userData.noBake = true; // sillín: trasera ancha y punta estrecha
      cylZ(G, 0.018, 0.5, M.metal, 0.36, 1.16, 0);
      var fly = cylZ(G, 0.26, 0.06, M.plate, 0.48, 0.42, 0); fly.geometry = new T.CylinderGeometry(0.26, 0.26, 0.06, 40);
      eqp.crank = new T.Group(); G.add(eqp.crank);
    }
    if (sc.indexOf('sledPush') >= 0) {
      // trineo (prowler): patines, postes verticales con empuñaduras y discos en el centro
      var SX = 0.66;
      [-1, 1].forEach(function (sg) { box(G, 0.9, 0.04, 0.06, M.metal, SX + 0.38, 0.02, sg * 0.26); beam(G, V(SX, 0.04, sg * 0.23), V(SX, 1.08, sg * 0.23), 0.05, M.frame); });
      box(G, 0.7, 0.05, 0.58, M.frame, SX + 0.38, 0.065, 0); beam(G, V(SX, 0.55, -0.23), V(SX, 0.55, 0.23), 0.05, M.frame);
      beam(G, V(SX + 0.45, 0.07, 0), V(SX + 0.45, 0.6, 0), 0.05, M.metal);
      [0.13, 0.19, 0.25].forEach(function (y) { var pl = cyl(G, 0.225, 0.05, M.plate); pl.geometry = new T.CylinderGeometry(0.225, 0.225, 0.05, 40); pl.position.set(SX + 0.45, y, 0); });
    }
    if (sc.indexOf('pool') >= 0) {
      var wm = new T.MeshStandardMaterial({ color: 0x2f7fc4, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.42, depthWrite: false });
      var wat = new T.Mesh(new T.BoxGeometry(5, 0.02, 3), wm); wat.position.set(0, 0.56, 0); wat.renderOrder = 2; wat.userData.noBake = true; wat.userData.noTest = true; G.add(wat);
      [-1, 1].forEach(function (sg) { for (var fk = -6; fk <= 6; fk++) { var fl = new T.Mesh(new T.SphereGeometry(0.035, 10, 8), new T.MeshStandardMaterial({ color: fk % 2 ? 0xd94b3a : 0xf2f2f2, roughness: 0.6 })); fl.position.set(fk * 0.2, 0.57, sg * 0.75); fl.userData.noTest = true; G.add(fl); } });
    }
    if (sc.indexOf('stair') >= 0) {
      eqp.steps = [];
      for (var sk = -1; sk < 4; sk++) { var stp = box(G, 0.245, 0.05, 0.62, M.frame, 0, 0, 0); stp.userData.noBake = true; stp.userData.k = sk; eqp.steps.push(stp); }
      // laterales inclinados, barandillas a la altura de la cadera y consola delante
      [-1, 1].forEach(function (sg) {
        beam(G, V(-0.85, 0.03, sg * 0.35), V(0.4, 0.5, sg * 0.35), 0.07, M.frame); // largueros bajo los extremos de los peldaños
        beam(G, V(-0.28, 1.083, sg * 0.3), V(0.55, 1.083, sg * 0.3), 0.035, M.rubber);
        beam(G, V(-0.28, 1.083, sg * 0.3), V(-0.28, 0.2, sg * 0.3), 0.035, M.metal);
      });
      box(G, 1.3, 0.05, 0.8, M.frame, -0.1, 0.025, 0);
      beam(G, V(0.55, 0.02, 0), V(0.55, 1.3, 0), 0.08, M.frame); box(G, 0.12, 0.2, 0.5, M.frameLight, 0.52, 1.38, 0);
    }
    if (sc.indexOf('elliptical') >= 0) {
      box(G, 1.7, 0.06, 0.46, M.frame, 0.18, 0.03, 0);
      var efw = cylZ(G, 0.27, 0.3, M.frame, 0.86, 0.33, 0); efw.geometry = new T.CylinderGeometry(0.27, 0.27, 0.3, 40);
      beam(G, V(0.8, 0.52, 0), V(0.66, 1.28, 0), 0.07, M.frame); box(G, 0.12, 0.1, 0.32, M.frameLight, 0.64, 1.33, 0);
      eqp.ell = { pads: [], rods: [], levs: [], grips: [] };
      [1, -1].forEach(function (sg) {
        var pad = box(G, 0.34, 0.03, 0.13, M.rubber, 0, 0, 0); pad.userData.noBake = true; eqp.ell.pads.push(pad);
        var rod = beam(G, V(0, 0, 0), V(0, 1, 0), 0.04, M.metal); rod.userData.noBake = true; eqp.ell.rods.push(rod);
        var lev = beam(G, V(0, 0, 0), V(0, 1, 0), 0.04, M.metal); lev.userData.noBake = true; eqp.ell.levs.push(lev);
        var gr = beam(G, V(0, 0, 0), V(0, 1, 0), 0.034, M.rubber); gr.userData.noBake = true; eqp.ell.grips.push(gr);
      });
    }
    if (sc.indexOf('rower') >= 0) {
      box(G, 2.2, 0.05, 0.16, M.frame, 0.05, 0.15, 0); box(G, 0.08, 0.14, 0.4, M.frame, -0.95, 0.07, 0);
      box(G, 0.12, 0.62, 0.44, M.frame, 1.05, 0.31, 0);
      var fw = cylZ(G, 0.25, 0.14, M.plate, 1.08, 0.66, 0); fw.geometry = new T.CylinderGeometry(0.25, 0.25, 0.14, 40);
      [-1, 1].forEach(function (sg) { var fpl = box(G, 0.04, 0.3, 0.14, M.frameLight, 0.765, 0.42, sg * 0.12); fpl.rotation.z = rad(-28); });
      eqp.seat = box(G, 0.22, 0.06, 0.3, M.pad, 0, 0.36 - SEAT - 0.05, 0);
    }

    // Pilas y torres
    var tw = null, tw2 = null;
    var compactMachine = needsStack && eq === 'machine' && cableLoads.indexOf(d.load) < 0;
    if (compactMachine) {
      var mpos = d.machinePos || [-0.62, -0.55, 0];
      tw = machineStack(scene, mpos[0], mpos[1], rad(mpos[2] || 0));
      needsStack = false;
    }
    if (needsStack) {
      if (d.towerPos) tw = stackTower(scene, d.towerPos[0], d.towerPos[1], rad(d.towerPos[2] || 0));
      else if (d.load === 'twinCable') { var tp = d.twinPos || [[-0.05, -1.05], [-0.05, 1.05]]; tw = stackTower(scene, tp[0][0], tp[0][1], rad(tp[0][2] || 0)); tw2 = stackTower(scene, tp[1][0], tp[1][1], rad(tp[1][2] || 0)); }
      else if (d.load === 'ankleSide' || sc.indexOf('towerSide') >= 0) tw = stackTower(scene, 0.0, -0.95);
      else if (d.load === 'pulldown') tw = stackTower(scene, 0.68, 0);
      else if (d.load === 'seatedRow') tw = stackTower(scene, 1.02, 0);
      else if (sc.indexOf('towerFront') >= 0 || d.load === 'facePull' || d.load === 'pushdown') tw = stackTower(scene, 0.78, 0);
      else tw = stackTower(scene, -0.75, -0.66);
    }
    if (tw && !tw.compact) eqp.cables.push(cableMesh(scene), cableMesh(scene), cableMesh(scene));
    if (tw2) eqp.cables.push(cableMesh(scene), cableMesh(scene), cableMesh(scene));

    // Cargas
    var bar = null, dbs = [], kb = null, handle = null, handles2 = null, rope = null, smithM = null;
    var barLoads = ['bar', 'back', 'hip', 'handsFront', 'hands', 'overhead'];
    if (barMode && barLoads.indexOf(d.load) >= 0) bar = d.ez ? ezBar(scene) : barbell(scene);
    var smithX = null;
    if (smith && bar) {
      var f0 = poseAt(d, 0).f, j0b = solve(f0.arms && f0.arms.bar ? Object.assign({}, f0, { arms: { ua: 0, fa: 0 } }) : f0);
      smithX = d.load === 'back' ? j0b.shoC.x - 0.08 : j0b.hand.L.clone().add(j0b.hand.R).multiplyScalar(0.5).x;
      smithM = smithMachine(scene, smithX);
    }
    if (eq === 'dumbbell') {
      if (d.load === 'goblet' || d.load === 'overhead' || d.load === 'single') dbs.push(dumbbell(scene));
      else if (d.load === 'handR' || d.load === 'handL') dbs.push(dumbbell(scene));
      else if (['hands', 'handsFront', 'bar'].indexOf(d.load) >= 0) dbs.push(dumbbell(scene), dumbbell(scene));
      else if (d.load === 'hip') dbs.push(dumbbell(scene));
    }
    if (eq === 'kettlebell' || d.load === 'kb') kb = kettlebell(scene);
    function dHandle() { // agarre en D
      var g = new T.Group(); scene.add(g);
      cylZ(g, 0.016, 0.13, M.rubber, 0, 0, 0);
      var tor = new T.Mesh(new T.TorusGeometry(0.075, 0.01, 8, 24, Math.PI), M.metal); tor.rotation.y = Math.PI / 2; tor.rotation.z = Math.PI; tor.position.y = 0.0; g.add(tor);
      return g;
    }
    var ropeAtt = null;
    if (d.load === 'twinCable') handles2 = [dHandle(), dHandle()];
    else if ((d.load === 'facePull' || d.rope) && tw && !tw.compact) {
      // cuerda de tríceps/face pull: mosquetón, dos ramales trenzados y topes de goma
      handle = new T.Group(); scene.add(handle);
      var ropeMat = new T.MeshStandardMaterial({ color: 0x24262c, roughness: 0.9 });
      handle.add(new T.Mesh(new T.SphereGeometry(0.018, 12, 10), M.metal));
      ropeAtt = { strands: [0, 1, 2, 3].map(function () { var c = new T.Mesh(new T.CylinderGeometry(0.0075, 0.0075, 1, 8), ropeMat); c.castShadow = true; scene.add(c); return c; }),
        knobs: [0, 1].map(function () { var k = new T.Mesh(new T.SphereGeometry(0.022, 16, 12), M.rubber); scene.add(k); return k; }) };
    }
    else if (d.load !== 'cableR' && d.load !== 'cableL' && ((tw && !tw.compact) || d.load === 'pulldown')) {
      handle = new T.Group(); scene.add(handle);
      var hw = d.handleW || (d.load === 'pulldown' ? 1.1 : (d.load === 'pushdown' ? 0.34 : (d.load === 'seatedRow' ? 0.16 : 0.12)));
      cylZ(handle, 0.015, hw, M.metal, 0, 0, 0);
      if (d.load === 'pulldown' && !d.handleW) [-1, 1].forEach(function (sg) { var e = cyl(handle, 0.02, 0.12, M.rubber); e.rotation.x = Math.PI / 2; e.position.set(0, 0, sg * 0.48); });
    }
    var single = null, battle = null, mine = null, hexb = null, plateC = null, mball = null, sball = null, backPad = null, kpads = null;
    if (d.load === 'zercher') bar = barbell(scene);
    if (d.load === 'medball') { mball = new T.Mesh(new T.SphereGeometry(0.15, 28, 20), new T.MeshStandardMaterial({ color: 0x2d3038, roughness: 0.8 })); mball.castShadow = true; scene.add(mball); }
    if (d.load === 'stabBall') { sball = new T.Mesh(new T.SphereGeometry(0.31, 36, 26), new T.MeshStandardMaterial({ color: 0x3a6fc4, roughness: 0.55 })); sball.castShadow = true; scene.add(sball); }
    if (d.backPad) { backPad = new T.Group(); scene.add(backPad); box(backPad, 0.62, 0.07, 0.32, M.pad, 0, 0, 0); [-1, 1].forEach(function (sg) { cylZ(backPad, 0.045, 0.12, M.pad, 0.28, -0.07, sg * 0.14); box(backPad, 0.035, 0.035, 0.2, M.frame, -0.25, 0.0, sg * 0.24); box(backPad, 0.034, 0.15, 0.034, M.frame, -0.25, -0.06, sg * 0.322); }); }
    // Rueda abdominal: rueda con eje y empuñaduras; el centro del eje está entre las manos
    var abW = null;
    if (d.load === 'abWheel') {
      abW = new T.Group(); scene.add(abW);
      var wh = cylZ(abW, 0.1, 0.07, M.rubber, 0, 0, 0); wh.geometry = new T.CylinderGeometry(0.1, 0.1, 0.07, 40);
      cylZ(abW, 0.06, 0.075, M.plateRim, 0, 0, 0);
      cylZ(abW, 0.012, 0.34, M.metal, 0, 0, 0);
      [-1, 1].forEach(function (sg) { cylZ(abW, 0.017, 0.1, M.rubber, 0, 0, sg * 0.125); });
    }
    var pack = null;
    if (d.backpack) {
      pack = new T.Group(); scene.add(pack);
      var pm = new T.MeshStandardMaterial({ color: 0x3b4a3f, roughness: 0.85 }), pm2 = new T.MeshStandardMaterial({ color: 0x2a3329, roughness: 0.9 });
      // cuerpo redondeado (cápsula achatada), bolsillo delantero, tapa y correas sobre los hombros
      var pb = new T.Mesh(new T.CapsuleGeometry(0.12, 0.2, 8, 16), pm); pb.rotation.z = Math.PI / 2; pb.scale.set(1, 1, 1.15); pb.castShadow = true; pack.add(pb);
      var pk = new T.Mesh(new T.CapsuleGeometry(0.06, 0.12, 6, 12), pm2); pk.rotation.z = Math.PI / 2; pk.position.set(-0.06, 0.1, 0); pk.scale.set(1, 1, 1.6); pack.add(pk);
      var lid = new T.Mesh(new T.CapsuleGeometry(0.07, 0.1, 6, 12), pm2); lid.rotation.x = Math.PI / 2; lid.position.set(0.21, 0.01, 0); pack.add(lid);
      [-1, 1].forEach(function (sg) { var st = new T.Mesh(new T.BoxGeometry(0.34, 0.012, 0.045), pm2); st.position.set(0.02, -0.115, sg * 0.1); pack.add(st); });
    }
    var hPad = null, fDb = null, belt = null, aBand = null, kPlat = null, pecP = null;
    var pecH = null;
    if (d.pecHandles) pecH = [0, 1].map(function () { return { grip: cyl(scene, 0.017, 0.2, M.rubber, 16), arm: beam(scene, V(0, 0, 0), V(0, 1, 0), 0.04, M.frame), drop: beam(scene, V(0, 0, 0), V(0, 1, 0), 0.04, M.frame) }; });
    if (d.pecPads) pecP = [0, 1].map(function () { return { pad: box(scene, 0.07, 0.2, 0.05, M.pad, 0, 0, 0), arm: beam(scene, V(0, 0, 0), V(0, 1, 0), 0.04, M.frame), drop: beam(scene, V(0, 0, 0), V(0, 1, 0), 0.04, M.frame) }; });
    if (d.hipPad) { hPad = { pad: cylZ(scene, 0.06, 0.62, M.pad, 0, 0, 0), lev: [0, 1].map(function () { return beam(scene, V(0, 0, 0), V(0, 1, 0), 0.05, M.frame); }) }; }
    if (d.load === 'feetDb') fDb = dumbbell(scene);
    if (d.beltPlate) {
      belt = { plate: cylX(scene, 0.16, 0.035, M.plate, 0, 0, 0), ch: [0, 1].map(function () { return beam(scene, V(0, 0, 0), V(0, 1, 0), 0.008, M.metal); }) };
      belt.plate.geometry = new T.CylinderGeometry(0.16, 0.16, 0.035, 40);
      belt.ring = new T.Mesh(new T.TorusGeometry(0.16, 0.035, 8, 40), new T.MeshStandardMaterial({ color: 0x24262c, roughness: 0.9 })); belt.ring.rotation.x = Math.PI / 2; belt.ring.scale.set(1.12, 0.9, 0.5); scene.add(belt.ring);
    }
    if (d.ankleBand) { var bm = new T.MeshStandardMaterial({ color: 0x3f8fd6, roughness: 0.6 }); aBand = [0, 1].map(function () { var b = new T.Mesh(new T.CylinderGeometry(0.009, 0.009, 1, 10), bm); scene.add(b); return b; }); }
    if (d.kneePlatform) { kPlat = { pad: box(scene, 0.34, 0.06, 0.42, M.pad, 0, 0, 0), lev: beam(scene, V(0, 0, 0), V(0, 1, 0), 0.05, M.frame) }; }
    // Disco apoyado sobre la espalda (plancha con peso)
    var bPlate = null;
    if (d.backPlate) {
      bPlate = new T.Group(); scene.add(bPlate);
      var bp = cyl(bPlate, 0.225, 0.045, M.plate); bp.geometry = new T.CylinderGeometry(0.225, 0.225, 0.045, 48);
      cyl(bPlate, 0.05, 0.05, M.plateRim);
      var brim = new T.Mesh(new T.TorusGeometry(0.219, 0.011, 8, 48), M.plateRim); brim.rotation.x = Math.PI / 2; brim.position.y = 0.023; bPlate.add(brim);
    }
    // Máquina de crunch: almohadilla de pecho con asas, unida a palancas que giran a la altura de la cadera
    var fPad = null, fLev = null;
    if (d.frontPad) {
      fPad = new T.Group(); scene.add(fPad);
      box(fPad, 0.15, 0.07, 0.3, M.pad, 0, 0, 0);
      [-1, 1].forEach(function (sg) { cylX(fPad, 0.016, 0.16, M.rubber, 0.05, 0.03, sg * 0.21); box(fPad, 0.03, 0.03, 0.12, M.frame, 0.05, 0.03, sg * 0.25); });
      fLev = [0, 1, 2].map(function () { return beam(scene, V(0, 0, 0), V(0, 1, 0), 0.045, M.frame); });
    }
    // Hack de discos: el carro (respaldo) lleva el bastidor, los cuernos y los discos; los raíles y la base se colocan en cada fotograma
    var hackF = null;
    if (d.hackSled && backPad) {
      box(backPad, 0.7, 0.05, 0.3, M.frame, -0.02, 0.075, 0);
      [-1, 1].forEach(function (sg) {
        box(backPad, 0.05, 0.05, 0.3, M.frame, 0.22, 0.1, sg * 0.27);
        cylZ(backPad, 0.025, 0.22, M.metal, 0.22, 0.1, sg * 0.5);
        [0.455, 0.502].forEach(function (z) {
          cylZ(backPad, 0.225, 0.045, M.plate, 0.22, 0.1, sg * z).geometry = new T.CylinderGeometry(0.225, 0.225, 0.045, 48);
          var rim = new T.Mesh(new T.TorusGeometry(0.219, 0.011, 8, 48), M.plateRim); rim.position.set(0.22, 0.1, sg * (z + 0.023)); backPad.add(rim);
          cylZ(backPad, 0.05, 0.05, M.plateRim, 0.22, 0.1, sg * z);
        });
      });
      var pa = rad(d.hackSled.tilt || 20), pd = V(Math.cos(pa), Math.sin(pa), 0), pn = V(-Math.sin(pa), Math.cos(pa), 0), p0 = V(d.hackSled.at[0], d.hackSled.at[1], 0);
      var plat = box(scene, 0.56, 0.04, 0.66, M.frame, 0, 0, 0); plat.position.copy(p0.clone().add(pd.clone().multiplyScalar(0.07)).add(pn.clone().multiplyScalar(-0.022))); plat.rotation.z = pa; plat.userData.noBake = true;
      var pf = p0.clone().add(pd.clone().multiplyScalar(0.33)).add(pn.clone().multiplyScalar(-0.05)), pb = p0.clone().add(pd.clone().multiplyScalar(-0.19)).add(pn.clone().multiplyScalar(-0.05));
      [-1, 1].forEach(function (sg) { beam(scene, V(pf.x, pf.y, sg * 0.3), V(pf.x, 0, sg * 0.3), 0.05, M.frame).userData.noBake = true; beam(scene, V(pb.x, Math.max(pb.y, 0.03), sg * 0.3), V(pb.x, 0, sg * 0.3), 0.05, M.frame).userData.noBake = true; beam(scene, V(pb.x - 0.05, 0.03, sg * 0.3), V(pf.x + 0.05, 0.03, sg * 0.3), 0.05, M.frame).userData.noBake = true; });
      hackF = [0, 1, 2, 3, 4, 5, 6, 7].map(function () { return beam(scene, V(0, 0, 0), V(0, 1, 0), 0.06, M.frame); });
    }
    if (d.kneePads) { kpads = [0, 1].map(function () { var g = new T.Group(); scene.add(g); box(g, 0.16, 0.18, 0.05, M.pad, 0, 0, 0); return g; }); }
    if (d.load === 'hexbar') {
      hexb = new T.Group(); scene.add(hexb);
      var hx = [[0.33, 0], [0.16, 0.29], [-0.16, 0.29], [-0.33, 0], [-0.16, -0.29], [0.16, -0.29]];
      for (var hi2 = 0; hi2 < 6; hi2++) { var p1 = V(hx[hi2][0], 0, hx[hi2][1]), p2 = V(hx[(hi2 + 1) % 6][0], 0, hx[(hi2 + 1) % 6][1]); var sgm = cylZ(hexb, 0.016, 1, M.metal, 0, 0, 0); segment(sgm, p1, p2); }
      [-1, 1].forEach(function (sg) {
        var hg = cylZ(hexb, 0.016, 0.16, M.rubber, 0, 0, 0); hg.position.set(0, 0, sg * 0.29); hg.rotation.set(0, Math.PI / 2, 0);
        var sl = cylZ(hexb, 0.026, 0.32, M.metal, 0, 0, sg * 0.5);
        [0.42, 0.48].forEach(function (z) { var pl = cylZ(hexb, 0.225, 0.045, M.plate, 0, 0, sg * z); pl.geometry = new T.CylinderGeometry(0.225, 0.225, 0.045, 48); });
      });
    }
    if (d.load === 'plate') { plateC = new T.Group(); scene.add(plateC); var pc0 = cylZ(plateC, 0.16, 0.035, M.plate, 0, 0, 0); pc0.geometry = new T.CylinderGeometry(0.16, 0.16, 0.035, 40); }
    if (d.load === 'landmine') {
      // barra de landmine: un extremo en el pivote del suelo, discos junto a las manos
      mine = new T.Group(); scene.add(mine);
      cylZ(mine, 0.015, 2.0, M.metal, 0, 0, 1.0);
      var mpr = d.minePlateR || 0.16, mp = cylZ(mine, mpr, 0.045, M.plate, 0, 0, 1.78); mp.geometry = new T.CylinderGeometry(mpr, mpr, 0.045, 40);
      cylZ(mine, 0.026, 0.22, M.metal, 0, 0, 1.88);
      var mpv = d.minePivot || [1.75, 0.07, 0]; box(scene, 0.12, 0.08, 0.12, M.frame, mpv[0], 0.04, mpv[2] || 0);
    }
    if (d.load === 'grips') handles2 = [dHandle(), dHandle()];
    if (d.load === 'cableR' || d.load === 'cableL') single = dHandle();
    if (d.load === 'battle') {
      var bMat = new T.MeshStandardMaterial({ color: 0x2a2c31, roughness: 0.95 });
      battle = { mat: bMat, meshes: [null, null], anchor: V(2.4, 0.12, 0) };
      box(scene, 0.12, 0.24, 0.3, M.frame, 2.45, 0.12, 0);
    }
    if (d.load === 'rope') {
      rope = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([V(0, 1, -0.3), V(0, 0, 0), V(0, 1, 0.3)]), 24, 0.007, 6), M.accent);
      scene.add(rope);
    }

    // Colisiones precalculadas con el modelo real (cojines ajustados y desvío de las manos con pesas)
    var held = dbs.slice(); if (kb) held.push(kb);
    var meshList = []; scene.traverse(function (o) { if (o.isMesh && !o.isSkinnedMesh) meshList.push(o); });
    var bake = MODEL && !global.FORJA3D_NO_BAKE ? BAKED[key + ':' + eq] : null;
    if (bake && bake.pads) bake.pads.forEach(function (p) { var m = meshList[p[0]]; if (m) m.position.add(V(p[1], p[2], p[3])); });
    var hoff = bake && bake.h ? bake.h : null, boff = bake && bake.b ? bake.b : null;
    function hoffAt(ph) {
      var n = hoff.length, x = clamp(ph, 0, 1) * (n - 1), i0 = Math.floor(x), i1 = Math.min(n - 1, i0 + 1), t = x - i0, a = hoff[i0], b = hoff[i1];
      function at(o) { return [0, 1, 2].map(function (c) { return (a[o + c] * (1 - t) + b[o + c] * t) / 1000; }); }
      return { L: at(0), R: at(3) };
    }

    // Cámara
    var camera = new T.PerspectiveCamera(30, 1, 0.1, 50);
    var cam = d.cam || {};
    var az = cam.az != null ? cam.az : 32, el = cam.el != null ? cam.el : 12;
    // segunda perspectiva: la cámara gira ~100° alrededor del ejercicio para verlo desde el otro lado
    if (view === 2) {
      // otro ángulo que muestre el músculo principal: de espaldas para la cadena posterior, de frente para la anterior;
      // si la vista principal ya es esa, se usa el perfil puro
      var backM = ['lats', 'traps', 'trapsU', 'deltsR', 'lowback', 'glutes', 'gluteMed', 'hams', 'triceps', 'calves', 'soleus'];
      var isBack = (d.p || []).some(function (m) { return backM.indexOf(m) >= 0; });
      var cands = isBack ? [-125, 90, 0] : [90, -125, 0];
      function adiff(a1, a2) { var x = Math.abs(((a1 - a2) % 360 + 540) % 360 - 180); return x; }
      var az2 = cands[0]; for (var ci = 0; ci < cands.length; ci++) { if (adiff(cands[ci], az) >= 55) { az2 = cands[ci]; break; } }
      var tA = Math.abs(((d.A || {}).torso) || 0), lying = tA > 60 && tA < 125;
      az = cam.az2 != null ? cam.az2 : az2; el = cam.el2 != null ? cam.el2 : Math.max(lying ? 38 : 10, el);
      // si la torre de poleas queda entre la cámara y la persona, se gira la cámara hacia el perfil
      if (cam.az2 == null && tw && tw.top) {
        var ttp = tw.top(), taz = Math.atan2(ttp.x, ttp.z) * 180 / Math.PI;
        if (adiff(taz, az) < 40) az = adiff(taz, 0) > 60 ? 0 : (az > 0 ? az - 90 : az + 90);
      }
    }
    var samples = (d.keys || d.cyclic) ? [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9] : [0, 0.42];
    var js = samples.map(function (ph) { var pp = poseAt(d, ph).f; return solve(pp.arms && pp.arms.bar ? Object.assign({}, pp, { arms: { ua: 0, fa: 0 } }) : pp); });
    var pts = [];
    js.forEach(function (jj) { pts.push(jj.head, jj.hip, jj.hand.L, jj.hand.R, jj.ank.L, jj.ank.R, jj.toe.R, jj.knee.R); });
    var maxY = Math.max.apply(null, pts.map(function (p) { return p.y; })) + 0.18;
    var minX = Math.min.apply(null, pts.map(function (p) { return p.x; })) - 0.2, maxX = Math.max.apply(null, pts.map(function (p) { return p.x; })) + 0.2;
    if (tw && !tw.compact) maxY = Math.max(maxY, 2.35);
    var cx = (minX + maxX) / 2, cy = cam.y != null ? cam.y : maxY / 2;
    var ext = Math.max(maxX - minX, maxY, 1.4);
    var dist = (ext / 2) / Math.tan(rad(15)) * 1.08 * (cam.dist || 1);
    var tgt = V(cx, cy, 0);
    camera.position.set(tgt.x + dist * Math.cos(rad(el)) * Math.sin(rad(az)), tgt.y + dist * Math.sin(rad(el)), tgt.z + dist * Math.cos(rad(el)) * Math.cos(rad(az)));
    camera.lookAt(tgt);

    var liftAt = d.liftAt == null ? 1 : d.liftAt;
    function handFrame(j, k) { var dir = j.handDir[k], n = j.palm[k]; return { dir: dir, n: n, k: dir.clone().cross(n).normalize() }; }
    function orient(mesh, pos, axis) { mesh.position.copy(pos); mesh.quaternion.setFromUnitVectors(V(0, 0, 1), axis.clone().normalize()); }

    var state = { j: null, solids: solids, held: held, meshList: meshList };
    function update(phase) {
      var pr = poseAt(d, phase), f = pr.f, u = pr.u;
      var A = f.arms || {};
      if (A.bar) {
        var j0 = solve(Object.assign({}, f, { arms: { ua: 0, fa: 0 } }));
        var bp, gw2 = 0.42, pole = [0, -1, 0.5];
        if (A.bar === 'back') { bp = j0.shoC.clone().add(j0.up.clone().multiplyScalar(0.05)).add(j0.fwd.clone().multiplyScalar(-0.05)); pole = [0, -1, 0.35]; }
        else { bp = j0.hip.clone().add(j0.fwd.clone().multiplyScalar(0.15)); gw2 = 0.4; }
        // en la Smith la barra solo sube y baja: el cuerpo se ajusta para mantenerla en su guía
        if (smithX != null && A.bar === 'back') {
          var dx = smithX - bp.x;
          f = Object.assign({}, f, { hip: [f.hip[0] + dx, f.hip[1]] }); bp.x = smithX;
        }
        f = Object.assign({}, f, { arms: { ik: [bp.x, bp.y], gw: gw2, pole: pole, palm: 'pro' } });
        f._bar = bp;
      }
      if (hoff) f = Object.assign({}, f, { _hOff: hoffAt(phase) });
      if (boff) { var bn = boff.length, bx = clamp(phase, 0, 1) * (bn - 1), b0 = Math.floor(bx), b1 = Math.min(bn - 1, b0 + 1), bt = bx - b0; f = Object.assign({}, f, { _bOff: [(boff[b0][0] * (1 - bt) + boff[b1][0] * bt) / 1000, (boff[b0][1] * (1 - bt) + boff[b1][1] * bt) / 1000] }); }
      var j = solve(f);
      state.j = j;
      if (model) model.pose(j); else poseBody(body, j);
      var lift = d.cyclic || d.keys ? 0 : (liftAt === 1 ? u : 1 - u);
      var hm = j.hand.L.clone().add(j.hand.R).multiplyScalar(0.5);

      if (bar) {
        var bpos = f._bar ? f._bar : hm;
        if (smithX != null) bpos = V(smithX, bpos.y, 0);
        bar.position.copy(bpos);
        if (smithM) smithM.carriage.position.y = bpos.y;
      }
      if (dbs.length === 2) ['L', 'R'].forEach(function (k, i) { orient(dbs[i], j.hand[k], handFrame(j, k).k); });
      else if (dbs.length === 1) {
        if (d.load === 'handR' || d.load === 'handL') { var kk = d.load === 'handR' ? 'R' : 'L'; orient(dbs[0], j.hand[kk], handFrame(j, kk).k); }
        else if (d.load === 'goblet') { orient(dbs[0], hm.clone().add(j.up.clone().multiplyScalar(-0.1)), j.up); }
        else if (d.load === 'overhead') {
          // sujetada por el disco superior con ambas manos: cuelga a lo largo de los antebrazos
          var fd = j.hand.R.clone().sub(j.el.R).add(j.hand.L.clone().sub(j.el.L)).normalize();
          orient(dbs[0], hm.clone().add(fd.clone().multiplyScalar(0.1)), fd);
        }
        else if (d.load === 'single') orient(dbs[0], hm, V(0, 0, 1));
        else if (d.load === 'hip') orient(dbs[0], hm.clone().add(j.fwd.clone().multiplyScalar(0.03)), V(0, 0, 1)); // mancuerna atravesada sobre la cadera
        else dbs[0].position.copy(hm.clone().add(j.fwd.clone().multiplyScalar(0.035)));
      }
      if (kb && d.kbHand) { // pesa rusa en una mano: colgando ('hang') o apoyada en el dorso del antebrazo ('rack')
        var kk = d.kbHand[0], kh = j.hand[kk], kw = f.kbRack != null ? clamp(f.kbRack, 0, 1) : (d.kbHand[1] === 'rack' ? 1 : 0);
        var kRack = j.el[kk].clone().sub(kh).normalize().multiplyScalar(0.12).add(j.palm[kk].clone().multiplyScalar(-1)).normalize(), kHang = kh.clone().sub(j.sho[kk]).normalize();
        var kd = kHang.multiplyScalar(1 - kw).add(kRack.multiplyScalar(kw)); if (kd.lengthSq() < 1e-6) kd = V(0, -1, 0); kd.normalize(); // f.kbRack: 0 colgando, 1 sobre el antebrazo
        kb.position.copy(kh); kb.quaternion.setFromUnitVectors(V(0, -1, 0), kd);
      } else if (kb) { kb.position.copy(hm); kb.quaternion.setFromUnitVectors(V(0, -1, 0), hm.clone().sub(j.shoC).normalize()); }
      if (handle) {
        if (d.load === 'ankle' || d.load === 'ankleSide') handle.position.copy(j.ank.R);
        else handle.position.copy(hm);
        if (d.load === 'seatedRow' || d.load === 'facePull') handle.quaternion.setFromUnitVectors(V(0, 0, 1), V(0, 1, 0));
        if (ropeAtt) {
          var toP = (d.anchor ? V(d.anchor[0], d.anchor[1], d.anchor[2] || 0) : (d.load === 'pushdown' ? V(0.72, 2.12, 0) : V(0.72, 1.52, 0))).sub(hm).normalize(), clip = hm.clone().add(toP.multiplyScalar(d.load === 'pushdown' ? 0.16 : 0.2));
          handle.position.copy(clip);
          ['L', 'R'].forEach(function (k, i) {
            var hnd = j.hand[k], dirR = hnd.clone().sub(clip).normalize(), side = V(0, 1, 0).cross(dirR).normalize().multiplyScalar(0.006);
            segment(ropeAtt.strands[i * 2], clip.clone().add(side), hnd.clone().add(side));
            segment(ropeAtt.strands[i * 2 + 1], clip.clone().sub(side), hnd.clone().sub(side));
            ropeAtt.knobs[i].position.copy(hnd.clone().add(dirR.multiplyScalar(0.035)));
          });
        }
      }
      if (handles2) ['L', 'R'].forEach(function (k, i) { orient(handles2[i], j.hand[k], handFrame(j, k).k); });
      if (d.load === 'zercher' && bar) { bar.position.copy(j.el.L.clone().add(j.el.R).multiplyScalar(0.5).add(j.up.clone().multiplyScalar(0.03))); bar.quaternion.set(0, 0, 0, 1); }
      if (mball) {
        var fl = d.flight, hb = hm.clone().add(j.fwdT.clone().multiplyScalar(0.06));
        if (fl && phase > fl[0] && phase < fl[1]) { var tq = (phase - fl[0]) / (fl[1] - fl[0]); hb = hb.clone().add(V(0.05 * Math.sin(Math.PI * tq), fl[2] * Math.sin(Math.PI * tq), 0)); }
        mball.position.copy(hb);
      }
      if (sball) { var am = j.ank.L.clone().add(j.ank.R).multiplyScalar(0.5); var bdy = Math.max(0, am.y - 0.31); sball.position.set(am.x + Math.sqrt(Math.max(0, 0.385 * 0.385 - bdy * bdy)), 0.31, 0); }
      if (backPad) { backPad.position.copy(j.hip.clone().add(j.up.clone().multiplyScalar(0.28)).add(j.fwd.clone().multiplyScalar(-BACK - 0.035))); backPad.quaternion.setFromUnitVectors(V(1, 0, 0), j.up.clone()); }
      if (pack) { pack.position.copy(j.hip.clone().add(j.up.clone().multiplyScalar(0.3)).add(j.fwd.clone().multiplyScalar(-(BACK + 0.11)))); pack.quaternion.setFromUnitVectors(V(1, 0, 0), j.up.clone()); }
      if (pecH) ['L', 'R'].forEach(function (k, i) { // asa vertical en la mano; el brazo de la máquina baja desde un eje encima del hombro
        var h = j.hand[k], piv = V(j.sho[k].x, j.sho[k].y + 0.42, j.sho[k].z); pecH[i].grip.position.copy(h); var top = h.clone().add(V(0, 0.1, 0));
        segment(pecH[i].arm, piv, V(top.x, piv.y, top.z)); segment(pecH[i].drop, V(top.x, piv.y, top.z), top);
      });
      if (pecP) ['L', 'R'].forEach(function (k, i) { // almohadilla vertical por dentro del antebrazo; el brazo de la máquina gira sobre un eje encima del hombro
        var sg = k === 'L' ? -1 : 1, fm = j.el[k].clone().lerp(j.hand[k], 0.64), inw = V(0, 0, -sg), elbF = j.hand[k].clone().sub(j.sho[k]); elbF.y = 0; elbF.normalize();
        var pc = fm.clone().add(inw.clone().multiplyScalar(0.082)).add(elbF.clone().multiplyScalar(0.02)); pecP[i].pad.position.copy(pc); pecP[i].pad.quaternion.setFromUnitVectors(V(0, 1, 0), j.hand[k].clone().sub(j.el[k]).normalize()); // a lo largo del antebrazo
        var piv = V(j.sho[k].x, j.sho[k].y + 0.42, j.sho[k].z), top = pc.clone().add(V(0, 0.2, 0)); segment(pecP[i].arm, piv, V(top.x, piv.y, top.z)); segment(pecP[i].drop, V(top.x, piv.y, top.z), top);
      });
      if (hPad) { // almohadilla sobre la pelvis (cara anterior) y palancas hacia el eje detrás del banco
        var hp0 = j.hip.clone().add(j.fwd.clone().multiplyScalar(0.17)).add(j.up.clone().multiplyScalar(0.07)); // sobre la pelvis, por encima del pliegue de la cadera hPad.pad.position.copy(hp0);
        [-1, 1].forEach(function (sg, i) { segment(hPad.lev[i], V(hp0.x, hp0.y, sg * 0.33), V(d.hipPad[0], d.hipPad[1], sg * 0.33)); });
      }
      if (fDb) { // mancuerna sujeta entre los pies, a lo largo de las tibias
        var am2 = j.ank.L.clone().add(j.ank.R).multiplyScalar(0.5), shd = am2.clone().sub(j.knee.L.clone().add(j.knee.R).multiplyScalar(0.5)).normalize();
        var fdm = j.footDir.L.clone().add(j.footDir.R).normalize(), fum = j.footUp.L.clone().add(j.footUp.R).normalize(); fDb.position.copy(am2.clone().add(fdm.multiplyScalar(0.09)).add(fum.multiplyScalar(-0.05))); // el disco de arriba apoya en las plantas
        fDb.quaternion.setFromUnitVectors(V(0, 0, 1), shd);
      }
      if (belt) { // disco colgando del cinturón por delante de los muslos
        var bh = j.hip.clone().add(j.fwd.clone().multiplyScalar(0.11)).add(j.up.clone().multiplyScalar(-0.02));
        var pc = V(bh.x + 0.09, bh.y - 0.44, 0); belt.plate.position.copy(pc); belt.plate.rotation.set(0, 0, Math.PI / 2);
        belt.ring.position.copy(j.hip.clone().add(j.up.clone().multiplyScalar(0.06))); belt.ring.quaternion.setFromUnitVectors(V(0, 1, 0), j.up.clone()); belt.ring.rotateX(Math.PI / 2);
        [-1, 1].forEach(function (sg, i) { segment(belt.ch[i], V(bh.x, bh.y, sg * 0.13), V(pc.x, pc.y + 0.15, sg * 0.02)); });
      }
      if (aBand) [0.035, -0.035].forEach(function (dx, i) { segment(aBand[i], j.ank.L.clone().add(V(dx, 0.04, 0.035)), j.ank.R.clone().add(V(dx, 0.04, -0.035))); });
      if (kPlat) { var km = j.knee.L.clone().add(j.knee.R).multiplyScalar(0.5); kPlat.pad.position.set(km.x - 0.06, km.y - 0.085, 0); segment(kPlat.lev, V(km.x - 0.2, km.y - 0.1, 0), V(d.kneePlatform[0], d.kneePlatform[1], 0)); }
      if (abW) { abW.position.set(hm.x, 0.1, 0); abW.rotation.z = -hm.x / 0.1; }
      if (bPlate) { bPlate.position.copy(j.hip.clone().add(j.up.clone().multiplyScalar(d.backPlate[0])).add(j.fwd.clone().multiplyScalar(-(BACK + d.backPlate[1])))); bPlate.quaternion.setFromUnitVectors(V(0, 1, 0), j.fwd.clone().multiplyScalar(-1)); }
      if (fPad) {
        var fc = j.hip.clone().add(j.up.clone().multiplyScalar(d.frontPad[0])).add(j.fwd.clone().multiplyScalar(d.frontPad[1]));
        fPad.position.copy(fc); fPad.quaternion.setFromUnitVectors(V(1, 0, 0), j.up.clone());
        var top = fc.clone().add(j.up.clone().multiplyScalar(0.05)).add(j.fwd.clone().multiplyScalar(0.03));
        [-1, 1].forEach(function (sg, i) { segment(fLev[i], V(j.hip.x, j.hip.y, sg * 0.36), V(top.x, top.y, sg * 0.36)); });
        segment(fLev[2], V(top.x, top.y, -0.36), V(top.x, top.y, 0.36));
      }
      if (hackF) {
        var hb = j.fwd.clone().multiplyScalar(-0.14), ho = backPad.position.clone().add(hb);
        var hs = function (y) { return (y - ho.y) / j.up.y; };
        var rB = ho.clone().add(j.up.clone().multiplyScalar(hs(0.1))), rT = ho.clone().add(j.up.clone().multiplyScalar(hs(1.85)));
        [-1, 1].forEach(function (sg, i) {
          var zz = sg * 0.17;
          segment(hackF[i], V(rB.x, rB.y, zz), V(rT.x, rT.y, zz));
          segment(hackF[2 + i], V(rT.x, rT.y + 0.03, zz), V(rT.x, 0, zz));
          segment(hackF[4 + i], V(rT.x, 0.03, zz), V(Math.max(rB.x, 0.45), 0.03, zz));
        });
        segment(hackF[6], V(rT.x, rT.y, -0.2), V(rT.x, rT.y, 0.2));
        segment(hackF[7], V(rB.x, 0.06, -0.2), V(rB.x, 0.06, 0.2));
      }
      if (kpads) ['L', 'R'].forEach(function (k, i) { var sg = k === 'L' ? -1 : 1, td = j.knee[k].clone().sub(j.hipJ[k]); td.y = 0; td.normalize(); var nn = V(-td.z, 0, td.x), kp = j.knee[k].clone().add(td.clone().multiplyScalar(-0.03)).add(nn.multiplyScalar(sg * (d.kneePads === 'out' ? 0.105 : -0.105))); kpads[i].position.copy(kp); kpads[i].rotation.y = -Math.atan2(td.z, td.x); });
      if (hexb) { hexb.position.copy(V(hm.x, hm.y, 0)); }
      if (plateC) { plateC.position.copy(j.shoC.clone().add(j.fwdT.clone().multiplyScalar(0.235)).add(j.up.clone().multiplyScalar(-0.1))); plateC.quaternion.setFromUnitVectors(V(0, 0, 1), j.fwdT.clone()); }
      if (mine) { var mpv2 = d.minePivot || [1.75, 0.07, 0], pv = V(mpv2[0], mpv2[1], mpv2[2] || 0), hk = d.mineBoth ? j.hand.L.clone().add(j.hand.R).multiplyScalar(0.5) : j.hand[d.side === 'L' ? 'L' : 'R'], dirM = hk.clone().sub(pv).normalize(); mine.position.copy(pv); mine.quaternion.setFromUnitVectors(V(0, 0, 1), dirM); mine.scale.z = (hk.distanceTo(pv) + (d.mineOver || 0.02)) / 2.0; }
      if (single) { var sk2 = d.load === 'cableR' ? 'R' : 'L'; orient(single, j.hand[sk2], handFrame(j, sk2).k); }
      if (battle) {
        ['L', 'R'].forEach(function (k, i) {
          var h0 = j.hand[k], a0 = battle.anchor.clone().setZ(k === 'L' ? -0.12 : 0.12), pts = [];
          for (var q = 0; q <= 14; q++) {
            var tq = q / 14, p = h0.clone().lerp(a0, tq);
            var amp = 0.13 * (1 - tq) * (1 - tq) + 0.02;
            p.y += Math.sin(phase * Math.PI * 2 * 1 - tq * 9 + (k === 'L' ? Math.PI : 0)) * amp * (q === 0 ? 0 : 1) - 0.04 * Math.sin(Math.PI * tq);
            if (p.y < 0.03) p.y = 0.03; pts.push(p);
          }
          if (battle.meshes[i]) { scene.remove(battle.meshes[i]); battle.meshes[i].geometry.dispose(); }
          battle.meshes[i] = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.018, 7), battle.mat);
          battle.meshes[i].castShadow = true; scene.add(battle.meshes[i]);
        });
      }
      // Partes móviles de máquinas
      if (eqp.roller) {
        var rp;
        if (sc.indexOf('legExt') >= 0 && d.roller !== 'back') rp = j.ank.R.clone().add(j.knee.R.clone().sub(j.ank.R).normalize().multiplyScalar(0.06)).add(boneFront(j.knee.R, j.ank.R, j.fwd).multiplyScalar(0.07));
        else rp = j.ank.R.clone().add(j.knee.R.clone().sub(j.ank.R).normalize().multiplyScalar(0.08)).add(boneFront(j.knee.R, j.ank.R, j.fwd).multiplyScalar(-0.097));
        eqp.roller.position.set(rp.x, rp.y, d.side === 'R' && d.roller === 'back' ? j.ank.R.z + 0.03 : 0);
        segment(eqp.lever, V(j.knee.R.x, j.knee.R.y, 0.3), V(rp.x, rp.y, 0.3));
      }
      if (eqp.handles) {
        [j.hand.L, j.hand.R].forEach(function (h, i) {
          var z = i ? 0.27 : -0.27; eqp.handles[i].position.set(h.x, h.y, z);
          segment(eqp.arms[i], V(eqp.pivot.x, eqp.pivot.y, i ? 0.34 : -0.34), V(h.x, h.y - 0.06, i ? 0.34 : -0.34));
        });
      }
      if (eqp.kneePad) eqp.kneePad.position.set(j.knee.R.x - 0.02, j.knee.R.y + 0.1, 0);
      if (eqp.sled) {
        var mid2 = j.ank.R.clone().add(j.footDir.R.clone().multiplyScalar(0.07)).add(j.footUp.R.clone().multiplyScalar(-ANK - 0.005));
        var nrm = j.footUp.R.clone().multiplyScalar(-1);
        eqp.sled.position.set(mid2.x + nrm.x * 0.025, mid2.y + nrm.y * 0.025, 0);
        eqp.sled.quaternion.setFromUnitVectors(V(1, 0, 0), nrm);
      }
      if (eqp.beltMarks) eqp.beltMarks.forEach(function (bmk, i) { var x = ((i / 8 - phase) % 1 + 1) % 1; bmk.position.x = 0.78 - x * 1.6; });
      if (eqp.seat) eqp.seat.position.set(j.hip.x, 0.36 - SEAT - 0.05, 0);
      if (eqp.steps && f.stairs != null) eqp.steps.forEach(function (stp) {
        var kk = stp.userData.k + f.stairs, x = 0.17 - 0.25 * kk + 0.065, y = 0.44 - 0.2 * kk - 0.025;
        stp.position.set(x, y, 0); stp.visible = y > 0.02 && y < 0.7;
      });
      if (eqp.ell && f.ell) {
        var E = f.ell, cr0 = V(0.86, 0.33, 0);
        [['R', 1], ['L', -1]].forEach(function (q, i) {
          var p = E['p' + q[0]], hh = E['h' + q[0]], sg = q[1], fa = rad(E['f' + q[0]]);
          var pad = eqp.ell.pads[i]; pad.position.set(p[0] + 0.04, p[1] + 0.015, sg * 0.11); pad.rotation.z = -fa;
          var ca = E.w + (q[0] === 'L' ? Math.PI : 0), crp = cr0.clone().add(V(Math.cos(ca) * 0.12, Math.sin(ca) * 0.12, sg * 0.2));
          segment(eqp.ell.rods[i], V(p[0] - 0.12, p[1] - 0.01, sg * 0.2), crp);
          var piv = V(0.6, 0.62, sg * 0.3), gr = V(hh[0], hh[1], sg * 0.3);
          segment(eqp.ell.levs[i], piv, gr.clone().add(V(0.01, -0.09, 0)));
          segment(eqp.ell.grips[i], gr.clone().add(V(0.01, -0.09, 0)), gr.clone().add(V(0.03, 0.17, 0))); // empuñadura casi vertical (agarre neutro)
        });
      }
      if (eqp.wheels && f.crankW != null) eqp.wheels.forEach(function (g) { g.rotation.z = -f.crankW * 2.6; });
      if (eqp.airLev && f.airH) [0, 1].forEach(function (i) {
        var sg = i ? -1 : 1, gx = f.airH[i], gy = f.airH[2], piv = V(0.6, 0.58, sg * 0.3), gp = V(gx, gy, sg * 0.3);
        segment(eqp.airLev[i], piv, gp.clone().add(V(0.01, -0.09, 0)));
        segment(eqp.airGrip[i], gp.clone().add(V(0.01, -0.1, 0)), gp.clone().add(V(0.03, 0.17, 0)));
      });
      if (eqp.crank && f.pedals) {
        while (eqp.crank.children.length) eqp.crank.remove(eqp.crank.children[0]);
        var c0 = V(f.pedals[2][0], f.pedals[2][1], 0);
        [0, 1].forEach(function (i) {
          var pp2 = V(f.pedals[i][0], f.pedals[i][1], i ? -0.14 : 0.14);
          var arm = box(eqp.crank, 0.03, 1, 0.03, M.metal, 0, 0, 0); segment(arm, V(c0.x, c0.y, pp2.z), pp2);
          box(eqp.crank, 0.12, 0.02, 0.08, M.frame, pp2.x, pp2.y, pp2.z);
        });
      }
      if (rope && f.rope != null) {
        var w = f.rope, hL = j.hand.L, hR = j.hand.R;
        var apex = hm.clone().add(V(Math.sin(w) * 0.85, -Math.cos(w) * 0.98, 0));
        if (apex.y < 0.008) apex.y = 0.008;
        rope.geometry.dispose();
        rope.geometry = new T.TubeGeometry(new T.CatmullRomCurve3([hL, apex.clone().add(V(0, 0, -0.27)), apex, apex.clone().add(V(0, 0, 0.27)), hR]), 32, 0.007, 6);
      }
      // Pilas y cables
      if (tw && tw.compact) tw.stack.position.y = lift * 0.3;
      if (tw && !tw.compact) {
        var lift2 = (d.keys || d.cyclic) ? 0 : lift;
        if (d.load === 'ankle' || d.load === 'ankleSide') lift2 = u;
        tw.stack.position.y = lift2 * 0.32;
        if (tw2) tw2.stack.position.y = lift2 * 0.32;
        var top = tw.top(), st = tw.stackTop();
        var target = single ? j.hand[d.load === 'cableR' ? 'R' : 'L'].clone() : (handle ? handle.position.clone() : hm.clone());
        if (d.load === 'twinCable') {
          var t2 = tw2.top();
          if (d.pulleyY != null) { top = top.clone(); top.y = d.pulleyY; t2 = t2.clone(); t2.y = d.pulleyY; }
          segment(eqp.cables[0], top, j.hand.L); segment(eqp.cables[1], tw.stackTop(), top); eqp.cables[2].visible = false;
          segment(eqp.cables[3], t2, j.hand.R); segment(eqp.cables[4], tw2.stackTop(), t2); eqp.cables[5].visible = false;
          if (d.pulleyY != null) { segment(eqp.cables[1], tw.stackTop(), tw.top()); segment(eqp.cables[4], tw2.stackTop(), tw2.top()); }
        } else {
          var anchor;
          if (d.anchor) anchor = V(d.anchor[0], d.anchor[1], d.anchor[2] || 0);
          else if (d.load === 'pulldown') anchor = V(0.2, 2.42, 0);
          else if (d.load === 'seatedRow') anchor = V(0.95, 0.8, 0);
          else if (d.load === 'facePull') anchor = V(0.72, 1.52, 0);
          else if (d.load === 'pushdown') anchor = V(0.72, 2.12, 0);
          else if (d.load === 'ankle') anchor = V(0.72, 0.12, 0);
          else if (d.load === 'ankleSide') anchor = V(0.0, 0.12, -0.82);
          else anchor = top;
          segment(eqp.cables[0], anchor, target);
          segment(eqp.cables[1], st, top);
          if (anchor !== top) segment(eqp.cables[2], top, anchor); else eqp.cables[2].visible = false;
        }
      }
    }
    update(d.keys ? (d.thumb || 0.5) : 0.42);
    return { scene: scene, camera: camera, update: update, label: '', state: state, def: d, _setHOff: function (a) { hoff = a; }, _setBOff: function (a) { boff = a; } };
  }

  // ---------------------------------------------------------------------------
  //  Montaje
  // ---------------------------------------------------------------------------
  function makeRenderer(canvas) {
    var r = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.setClearColor(0x000000, 0);
    return r;
  }
  function periodFor(key) {
    var d = P[key] || {};
    if (d.period) return d.period;
    if (d.cyclic) return key === 'run' ? 720 : (key === 'jumpRope' ? 600 : (key === 'bike' ? 1200 : (key === 'walk' ? 1200 : 2800)));
    return d.keys ? 4200 : 3200;
  }
  // ---------------------------------------------------------------------------
  //  Mapa muscular estático: músculos trabajados en un entrenamiento (0 = nada, 1 = muy trabajado)
  //  FORJA3D.bodyMap(canvas, intensities, { view: 'both' | 'front' | 'back', rotate: false })
  //  intensities: { chest, back, shoulders, biceps, triceps, forearms, quads, hamstrings, glutes, calves, core, traps?, lats? }
  // ---------------------------------------------------------------------------
  var BODYMAP_REGIONS = {
    chest: ['pecs', 'pecsU'], back: ['latsV', 'traps', 'scapV', 'lowbackV'], shoulders: ['delts'], biceps: ['biceps'],
    triceps: ['triceps'], forearms: ['forearms', 'brachiorad', 'forearmFlex', 'forearmExt'], quads: ['quadsV', 'hipFlex'], hamstrings: ['hams'],
    glutes: ['glutes'], calves: ['calves', 'soleus', 'tibialis'], core: ['absV'], obliques: ['obliques'], traps: ['traps'], lats: ['latsV'],
    upperBack: ['scapV'], lowerBack: ['lowbackV'], abductors: ['gluteMed'], adductors: ['adductors', 'adductorsV'], neck: ['neck']
  };
  function bodyMapMaterial(baseHex) {
    var mat = new T.MeshStandardMaterial({ color: baseHex, roughness: 0.6, metalness: 0, side: T.DoubleSide });
    mat.extensions = { derivatives: true };
    mat.onBeforeCompile = function (sh) {
      sh.vertexShader = 'attribute vec2 mw;\nattribute float cav;\nvarying vec2 vMw;\nvarying float vCav;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vMw = mw; vCav = cav;');
      sh.fragmentShader = 'varying vec2 vMw;\nvarying float vCav;\n' + sh.fragmentShader.replace('#include <color_fragment>', [
        '#include <color_fragment>',
        ' float TH = 0.36, aw = fwidth(vMw.x) * 0.9 + 0.004;',
        ' float on = smoothstep(TH - aw, TH + aw, vMw.x) * step(0.01, vMw.y);',
        ' vec3 heat = mix(vec3(0.98, 0.72, 0.42), vec3(0.72, 0.05, 0.06), smoothstep(0.0, 1.0, vMw.y));',
        ' vec3 colM = mix(diffuseColor.rgb, heat, on);',
        ' colM *= 1.0 - 0.5 * max(vCav, 0.0) + 0.06 * max(-vCav, 0.0);',
        ' diffuseColor.rgb = colM;'
      ].join('\n'));
    };
    mat.customProgramCacheKey = function () { return 'forjaBodyMap'; };
    return mat;
  }
  function bodyMap(canvas, intensities, opts) {
    opts = opts || {};
    if (!MODEL) return null;
    var view = opts.view || 'both', rotate = !!opts.rotate, yaw0 = rad(+opts.yaw || 0), zoom = Math.max(0.3, +opts.zoom || 1), tY = opts.targetY != null ? +opts.targetY : null;
    var r = makeRenderer(canvas), scene = new T.Scene();
    scene.add(new T.HemisphereLight(0xffffff, 0x30343e, 0.85));
    var k1 = new T.DirectionalLight(0xffffff, 1.1); k1.position.set(2.5, 4, 3); scene.add(k1);
    var k2 = new T.DirectionalLight(0xffffff, 0.55); k2.position.set(-2.5, 3, -3); scene.add(k2);
    // postura neutra de pie, brazos algo separados del cuerpo para ver brazos y tronco
    var pose = solve({ hip: STAND, torso: 0, legs: { ik: [0.0, ANK], fw: 0.2 }, arms: { ua: 14, fa: 18, plane: 'f', palm: 'neu' } });
    var figs = (view === 'both' && !rotate) ? [{ x: -0.42, yaw: 0 }, { x: 0.42, yaw: Math.PI }] : [{ x: 0, yaw: view === 'back' ? Math.PI : 0 }];
    var bodies = figs.map(function (fg) {
      var holder = new T.Group(); scene.add(holder);
      var mb = makeModelBody(holder, { p: [], s: [] }); mb.pose(pose);
      // la figura mira a la cámara (+z): el modelo mira hacia +x en la escena
      holder.rotation.y = -Math.PI / 2 + fg.yaw + yaw0; holder.position.x = fg.x;
      var meshes = []; holder.traverse(function (o) { if (o.isSkinnedMesh) meshes.push(o); });
      var infl = opts.inflate || null;
      if (infl) meshes.forEach(function (m) {
        var W = MUSCLE_CACHE[m.name]; if (!W) return;
        var g = m.geometry = m.geometry.clone(), P = g.attributes.position, N = g.attributes.normal, any = false;
        Object.keys(infl).forEach(function (key) {
          var amt = (+infl[key] || 1) - 1, regs = BODYMAP_REGIONS[key]; if (!regs || Math.abs(amt) < 1e-3) return;
          for (var i = 0; i < P.count; i++) {
            var w = 0; regs.forEach(function (rg) { if (W[rg]) w = Math.max(w, W[rg][i]); });
            if (w <= 0.01) continue;
            var dd = amt * 9 * Math.pow(Math.sin(Math.PI / 2 * Math.min(1, w * 1.25)), 1.4);
            P.setXYZ(i, P.getX(i) + N.getX(i) * dd, P.getY(i) + N.getY(i) * dd, P.getZ(i) + N.getZ(i) * dd); any = true;
          }
        });
        if (any) { P.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); }
      });
      meshes.forEach(function (m) {
        var eyes = /eye|head/i.test(m.name) && !/body|layer/i.test(m.name);
        m.material = bodyMapMaterial(eyes ? 0xc9ccd3 : 0xe9eaee);
      });
      return { holder: holder, meshes: meshes };
    });
    function apply(intens) {
      intens = intens || {};
      bodies.forEach(function (b) {
        b.meshes.forEach(function (m) {
          var W = MUSCLE_CACHE[m.name] || {}, g = m.geometry, n = g.attributes.position.count;
          var mw = g.attributes.mw ? g.attributes.mw : new T.BufferAttribute(new Float32Array(n * 2), 2);
          for (var i = 0; i < n; i++) {
            var shape = 0, val = 0;
            Object.keys(intens).forEach(function (key) {
              var v = clamp(+intens[key] || 0, 0, 1), regs = BODYMAP_REGIONS[key]; if (!regs || v <= 0) return;
              regs.forEach(function (rg) { var w = W[rg] ? W[rg][i] : 0; if (w * (0.35 + v) > shape * (0.35 + val)) { shape = w; val = v; } });
            });
            mw.setXY(i, shape, val);
          }
          mw.needsUpdate = true; g.setAttribute('mw', mw);
        });
      });
    }
    apply(intensities);
    var camera = new T.PerspectiveCamera(28, 1, 0.1, 30);
    function size() {
      var w = canvas.clientWidth || 300, h = canvas.clientHeight || w;
      r.setPixelRatio(global.devicePixelRatio || 1); r.setSize(w, h, false);
      camera.aspect = w / h; var span = figs.length > 1 ? 1.75 : 1.0;
      var dist = Math.max(2.15 / (2 * Math.tan(rad(14))), span / camera.aspect / (2 * Math.tan(rad(14)))) * 1.06;
      dist /= zoom; var ly = tY != null ? tY : 0.92 + (zoom > 1 ? (1.3 - 0.92) * Math.min(1, (zoom - 1) / 1.5) : 0);
      camera.position.set(0, ly + 0.03, dist); camera.lookAt(0, ly, 0); camera.updateProjectionMatrix();
    }
    size();
    var raf = null, t0 = null, alive = true;
    function frame(ts) {
      if (!alive) return;
      if (t0 == null) t0 = ts;
      if (rotate) bodies[0].holder.rotation.y = -Math.PI / 2 + yaw0 + ((ts - t0) / 9000) * Math.PI * 2;
      if (canvas.clientWidth && Math.abs(canvas.width - canvas.clientWidth * (global.devicePixelRatio || 1)) > 2) size();
      r.render(scene, camera);
      raf = rotate ? requestAnimationFrame(frame) : null;
    }
    requestAnimationFrame(frame);
    return {
      update: function (intens) { apply(intens); if (!rotate) requestAnimationFrame(frame); },
      resize: function () { size(); if (!rotate) requestAnimationFrame(frame); },
      dispose: function () { alive = false; if (raf) cancelAnimationFrame(raf); r.dispose && r.dispose(); }
    };
  }

  function mount(canvas, key, eq, opts) {
    opts = opts || {};
    var r = makeRenderer(canvas), st = createStage(key, eq, opts.muscle, opts.view === 2 ? 2 : 1);
    var T0 = null, period = opts.period && !(P[key] || {}).cyclic && !(P[key] || {}).keys ? opts.period : periodFor(key);
    function size() {
      var w = canvas.clientWidth || 300, h = canvas.clientHeight || w;
      r.setPixelRatio(global.devicePixelRatio || 1); r.setSize(w, h, false);
      st.camera.aspect = w / h; st.camera.updateProjectionMatrix();
    }
    size();
    if (opts.phase != null) { st.update(opts.phase); r.render(st.scene, st.camera); return st; }
    function frame(ts) {
      if (T0 === null) T0 = ts;
      if (canvas.clientWidth && Math.abs(canvas.width - canvas.clientWidth * (global.devicePixelRatio || 1)) > 2) size();
      st.update(((ts - T0) % period) / period);
      r.render(st.scene, st.camera);
      global.requestAnimationFrame(frame);
    }
    global.requestAnimationFrame(frame);
    return st;
  }
  // Carga el modelo humano (GLB en base64 o ArrayBuffer) y luego llama a done()
  function loadModel(data, done) {
    var buf = data;
    if (typeof data === 'string') {
      var bin = global.atob(data), arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      buf = arr.buffer;
    }
    new T.GLTFLoader().parse(buf, '', function (g) { setModel(g.scene); done && done(true); }, function () { done && done(false); });
  }

  global.FORJA3D = { createStage: createStage, mount: mount, bodyMap: bodyMap, makeRenderer: makeRenderer, loadModel: loadModel, setModel: setModel,
    patterns: Object.keys(P).filter(function (k) { return k !== 'lateral'; }), periodFor: periodFor,
    label: function () { return ''; },
    _test: { mc: function () { return MUSCLE_CACHE; }, P: P, solve: solve, poseAt: poseAt, mixVal: mixVal, C: { ANK: ANK, REACH: REACH, SPINE: SPINE, UA: UA, FA: FA, TH: TH, SH: SH } } };
})(typeof window !== 'undefined' ? window : globalThis);
