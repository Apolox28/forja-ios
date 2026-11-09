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
  var SPINE = 0.5, UA = 0.3, FA = 0.33, TH = 0.45, SH = 0.44;
  var SHO_W = 0.2, HIP_W = 0.1;
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
    j.shr = f.shr || 0;
    j.hip = V(f.hip[0], f.hip[1], 0);
    j.shoC = j.hip.clone().add(j.up.clone().multiplyScalar(SPINE));
    var hu = j.up.clone();
    if (f.head) hu = j.up.clone().multiplyScalar(Math.cos(rad(f.head))).add(j.fwd.clone().multiplyScalar(Math.sin(rad(f.head))));
    j.headUp = hu;
    j.headFwd = V(hu.y, -hu.x, 0);
    j.head = j.shoC.clone().add(j.up.clone().multiplyScalar(0.11)).add(hu.clone().multiplyScalar(0.125)).add(j.fwd.clone().multiplyScalar(0.012));
    j.sho = {}; j.el = {}; j.hand = {}; j.hipJ = {}; j.knee = {}; j.ank = {}; j.toe = {};
    j.footDir = {}; j.footUp = {}; j.palm = {}; j.handDir = {}; j.handMode = {};
    [-1, 1].forEach(function (sg) {
      var k = sg < 0 ? 'L' : 'R';
      j.sho[k] = j.shoC.clone().add(V(0, j.shr, sg * SHO_W));
      j.hipJ[k] = j.hip.clone().add(V(0, 0, sg * HIP_W));

      // ---- Brazos ----
      var A = (k === 'L' ? f.armsL : f.armsR) || f.arms || { ua: 0, fa: 0 };
      var sh = j.sho[k], target = null;
      var gw = A.gw != null ? A.gw : 0.24;
      if (A.ik) target = V(A.ik[0], A.ik[1], A.ik.length > 2 ? A.ik[2] * sg : sg * gw);
      else if (A.relC) target = j.shoC.clone().add(j.fwd.clone().multiplyScalar(A.relC[0])).add(j.up.clone().multiplyScalar(A.relC[1])).add(V(0, 0, sg * gw));
      else if (A.rel) target = sh.clone().add(V(A.rel[0], A.rel[1], (A.rel[2] || 0) * sg));
      else if (A.temple) target = j.head.clone().add(j.headFwd.clone().multiplyScalar(-0.02)).add(V(0, -0.01, sg * 0.105));
      if (target) {
        if (A.straight) {
          var full = sh.clone().add(target.clone().sub(sh).normalize().multiplyScalar(UA + FA - 0.004));
          target = target.clone().lerp(full, clamp(num(A.straight), 0, 1));
        }
        var pole = A.pole ? V(A.pole[0], A.pole[1], (A.pole[2] || 0) * sg)
          : j.fwd.clone().multiplyScalar(-0.6).add(j.up.clone().multiplyScalar(-1)).add(V(0, 0, sg * 0.35));
        var r = ik(sh, target, UA, FA, pole);
        j.el[k] = r[0]; j.hand[k] = r[1];
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
      else palm = V(0, 0, -sg); // neutra: palmas hacia el cuerpo
      palm.sub(fd.clone().multiplyScalar(palm.dot(fd)));
      if (palm.lengthSq() < 1e-4) palm = front.clone();
      j.palm[k] = palm.normalize();
      j.handMode[k] = A.hand || 'fist';
      if (A.hand === 'flat' && A.flatDir) {
        j.handDir[k] = V(A.flatDir[0], A.flatDir[1], (A.flatDir[2] || 0) * sg).normalize();
        j.palm[k] = V(0, -1, 0);
      } else j.handDir[k] = fd;

      // ---- Piernas ----
      var Lg = (k === 'L' ? f.legsL : f.legsR) || f.legs || { th: 0, sh: 0 };
      var hp = j.hipJ[k];
      var fw = Lg.fw != null ? Lg.fw : 0.12;
      var ank = null, fAng = Lg.foot;
      if (Lg.ball) { // apoyo en la bola del pie (gemelos, talón levantado)
        var bf = fAng || 0;
        var ball = V(Lg.ball[0], Lg.ball[1], sg * fw);
        ank = ball.clone().sub(footVec(bf).multiplyScalar(0.13)).add(footUp(bf).multiplyScalar(0.075));
      } else if (Lg.ik) ank = V(Lg.ik[0], Lg.ik[1], Lg.ik.length > 2 ? Lg.ik[2] * sg : sg * fw);
      else if (Lg.rel) ank = hp.clone().add(V(Lg.rel[0], Lg.rel[1], (Lg.rel[2] || 0) * sg));
      if (ank) {
        var kp = Lg.pole ? V(Lg.pole[0], Lg.pole[1], (Lg.pole[2] || 0) * sg) : V(1, 0.15, sg * 0.18);
        var rl = ik(hp, ank, TH, SH, kp);
        j.knee[k] = rl[0]; j.ank[k] = rl[1];
      } else {
        var tA = Lg.plane === 'f' ? dirF(Lg.th, sg) : dirS(Lg.th);
        var sA = Lg.plane === 'f' ? dirF(Lg.sh, sg) : dirS(Lg.sh);
        j.knee[k] = hp.clone().add(tA.multiplyScalar(TH));
        j.ank[k] = j.knee[k].clone().add(sA.multiplyScalar(SH));
      }
      if (fAng == null && !Lg.footFlip && j.ank[k].y < 0.13 + (Lg.base || 0)) fAng = 0;
      var footDir, fUp;
      if (fAng != null) { footDir = footVec(fAng); fUp = footUp(fAng); }
      else {
        var shin = j.ank[k].clone().sub(j.knee[k]).normalize();
        footDir = V(-shin.y, shin.x, 0);
        if (Lg.footFlip) footDir.multiplyScalar(-1);
        if (footDir.lengthSq() < 1e-6) footDir = V(1, 0, 0);
        footDir.normalize();
        fUp = V(-footDir.y, footDir.x, 0);
        if (Lg.footFlip) fUp.multiplyScalar(-1);
      }
      j.footDir[k] = footDir; j.footUp[k] = fUp;
      j.toe[k] = j.ank[k].clone().add(footDir.clone().multiplyScalar(0.17)).add(fUp.clone().multiplyScalar(-0.06));
    });
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
  var MUSCLES = ['pecs', 'abs', 'lats', 'traps', 'lowback', 'glutes', 'delts', 'biceps', 'triceps', 'forearms', 'quads', 'hams', 'calves'];
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
  // Mancuerna: eje del agarre = eje Z local
  function dumbbell(parent) {
    var g = new T.Group(), M = mats();
    cylZ(g, 0.016, 0.15, M.metal, 0, 0, 0);
    [-1, 1].forEach(function (sg) {
      var p = cyl(g, 0.1, 0.07, M.plate, 6); p.rotation.x = Math.PI / 2; p.rotation.y = 0; p.position.z = sg * 0.115;
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
    box(g, 0.1, 0.06, 0.44, M.frame, 0, 2.3, 0); box(g, 0.36, 0.05, 0.5, M.frame, 0, 0.025, 0);
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
  //  Ejercicios
  //  Formato A/B: A = inicio, B = posición de trabajo (subida rápida, pausa, bajada lenta)
  //  Formato keys: lista [t, postura] cíclica
  // ---------------------------------------------------------------------------
  var STAND = [0, 0.97];
  var FEET = { ik: [0.0, 0.08] };
  var P = {};
  function def(k, o) { P[k] = o; }

  // ---- Piernas ----
  def('squat', { p: ['quads', 'glutes'], s: ['hams', 'lowback', 'abs'], load: 'back', scene: ['rack'], smith: true, cam: { az: 32 },
    A: { hip: STAND, torso: 4, legs: { ik: [0.02, 0.08], fw: 0.16 }, arms: { bar: 'back' } },
    B: { hip: [-0.24, 0.52], torso: 42, head: -25, legs: { ik: [0.02, 0.08], fw: 0.16 }, arms: { bar: 'back' } } });
  def('frontSquat', { p: ['quads'], s: ['glutes', 'abs'], load: 'goblet', cam: { az: 35 },
    A: { hip: STAND, torso: 3, legs: { ik: [0.02, 0.08], fw: 0.16 }, arms: { relC: [0.17, -0.13], gw: 0.05, pole: [0, -1, 0.5], palm: [0, 0.3, -1] } },
    B: { hip: [-0.19, 0.49], torso: 20, head: -15, legs: { ik: [0.02, 0.08], fw: 0.16 }, arms: { relC: [0.17, -0.13], gw: 0.05, pole: [0, -1, 0.5], palm: [0, 0.3, -1] } } });
  // Bisagra por fases (barra vertical pegada a las piernas): lista de [caderaX, caderaY, tronco, alturaBarra]
  function hingeKeys(list, bx) {
    var poses = list.map(function (q) {
      return { hip: [q[0], q[1]], torso: q[2], head: -q[2] * 0.35, legs: { ik: [-0.04, 0.08], fw: 0.11 }, arms: { ik: [bx, q[3]], gw: 0.25, palm: 'pro' } };
    });
    var keys = [], n = poses.length;
    poses.forEach(function (p, i) { keys.push([0.38 * i / (n - 1), p]); });
    keys.push([0.48, poses[n - 1]]);
    for (var i = n - 2; i >= 0; i--) keys.push([0.48 + 0.42 * (n - 1 - i) / (n - 1), poses[i]]);
    keys.push([1, poses[0]]);
    return keys;
  }
  def('deadlift', { p: ['glutes', 'hams', 'lowback'], s: ['quads', 'traps', 'forearms', 'lats'], load: 'bar', cam: { az: 18 }, thumb: 0.02,
    keys: hingeKeys([[-0.36, 0.57, 55, 0.225], [-0.38, 0.68, 58, 0.33], [-0.37, 0.79, 57, 0.45], [-0.33, 0.86, 48, 0.58], [-0.24, 0.94, 34, 0.7], [-0.02, 0.97, 4, 0.83]], 0.07) });
  def('rdl', { p: ['hams', 'glutes'], s: ['lowback'], load: 'bar', cam: { az: 18 }, thumb: 0.45,
    keys: hingeKeys([[-0.02, 0.97, 4, 0.83], [-0.16, 0.88, 24, 0.7], [-0.25, 0.88, 45, 0.6], [-0.29, 0.88, 60, 0.5], [-0.29, 0.86, 67, 0.43]], 0.085) });
  def('goodMorning', { p: ['hams', 'lowback'], s: ['glutes'], load: 'back', cam: { az: 20 },
    A: { hip: STAND, torso: 2, legs: { ik: [0.0, 0.08], fw: 0.15 }, arms: { bar: 'back' } },
    B: { hip: [-0.2, 0.93], torso: 74, head: -30, legs: { ik: [0.0, 0.08], fw: 0.15 }, arms: { bar: 'back' } } });
  // Zancada: parte con los pies juntos, da el paso, baja, sube y vuelve. Mancuerna en la mano contraria a la pierna que avanza.
  (function () {
    var hold = { rel: [0.02, -0.62, 0.04], palm: 'neu' };
    var stand = { hip: [0, 0.97], torso: 0, legsL: { ik: [0, 0.08] }, legsR: { ik: [0, 0.08] }, arms: hold };
    var lift = { hip: [0.05, 0.96], torso: 0, legsL: { ik: [0, 0.08] }, legsR: { ik: [0.3, 0.22] }, arms: hold };
    var plant = { hip: [0.26, 0.92], torso: 0, legsL: { ball: [0.12, 0.03], foot: 28 }, legsR: { ik: [0.62, 0.08] }, arms: hold };
    var bottom = { hip: [0.27, 0.52], torso: 6, legsL: { ball: [0.12, 0.035], foot: 52 }, legsR: { ik: [0.62, 0.08] }, arms: hold };
    def('lunge', { p: ['quads', 'glutes'], s: ['hams'], load: 'handL', cam: { az: 30 },
      keys: [[0, stand], [0.14, lift], [0.26, plant], [0.46, bottom], [0.56, bottom], [0.74, plant], [0.86, lift], [1, stand]], thumb: 0.5 });
  })();
  def('legPress', { p: ['quads', 'glutes'], s: ['hams'], load: 'sled', scene: ['legPress'], cam: { dist: 0.95, az: 28 },
    A: { hip: [-0.32, 0.56], torso: -50, legs: { ik: [0.14, 0.82], fw: 0.15, foot: -135, pole: [-0.4, 1, 0.25] }, arms: { ik: [-0.2, 0.52], gw: 0.33, palm: 'neu' } },
    B: { hip: [-0.32, 0.56], torso: -50, legs: { ik: [0.5, 1.18], fw: 0.15, foot: -135, pole: [-0.4, 1, 0.25] }, arms: { ik: [-0.2, 0.52], gw: 0.33, palm: 'neu' } } });
  def('legExt', { p: ['quads'], load: 'machine', stack: true, scene: ['legExt'], machinePos: [-0.5, -0.62, 0], cam: { az: 35 },
    A: { hip: [-0.08, 0.58], torso: -10, legs: { th: 90, sh: 6, foot: -10 }, arms: { ik: [0.0, 0.52], gw: 0.3, palm: 'neu' } },
    B: { hip: [-0.08, 0.58], torso: -10, legs: { th: 90, sh: 86, foot: -88 }, arms: { ik: [0.0, 0.52], gw: 0.3, palm: 'neu' } } });
  def('legCurl', { p: ['hams'], s: ['calves'], load: 'machine', stack: true, scene: ['legCurl'], machinePos: [0.95, -0.55, 0], cam: { az: 28 },
    A: { hip: [-0.05, 0.63], torso: 90, head: -10, legs: { th: -90, sh: -90, foot: 92 }, arms: { ik: [0.62, 0.52], gw: 0.25, palm: 'pro' } },
    B: { hip: [-0.05, 0.63], torso: 90, head: -10, legs: { th: -90, sh: -178, foot: 175 }, arms: { ik: [0.62, 0.52], gw: 0.25, palm: 'pro' } } });
  def('calf', { p: ['calves'], load: 'hands', stack: true, scene: ['step'], cam: { az: 25 },
    A: { hip: [-0.09, 0.95], torso: 0, legs: { ball: [0.08, 0.105], foot: -22, fw: 0.11 }, arms: { rel: [0.02, -0.62, 0.05], palm: 'neu' } },
    B: { hip: [-0.02, 1.06], torso: 0, legs: { ball: [0.08, 0.105], foot: 38, fw: 0.11 }, arms: { rel: [0.02, -0.62, 0.05], palm: 'neu' } } });
  def('seatedCalf', { p: ['calves'], load: 'plates', scene: ['seatedCalf'], cam: { az: 32 },
    A: { hip: [-0.22, 0.6], torso: 2, legs: { ball: [0.36, 0.205], foot: -22, fw: 0.12, pole: [1, 0.6, 0] }, arms: { ik: [0.2, 0.7], gw: 0.25, palm: 'pro' } },
    B: { hip: [-0.22, 0.6], torso: 2, legs: { ball: [0.36, 0.205], foot: 30, fw: 0.12, pole: [1, 0.6, 0] }, arms: { ik: [0.2, 0.76], gw: 0.25, palm: 'pro' } } });
  def('hipThrust', { p: ['glutes'], s: ['hams', 'quads'], load: 'hip', stack: true, scene: ['thrustBench'], cam: { az: 30 },
    A: { hip: [-0.05, 0.27], torso: -63, legs: { ik: [0.42, 0.08], fw: 0.17 }, arms: { bar: 'hip' } },
    B: { hip: [0.0, 0.6], torso: -100, legs: { ik: [0.42, 0.08], fw: 0.17 }, arms: { bar: 'hip' } } });
  def('gluteKickback', { p: ['glutes'], s: ['hams'], load: 'ankle', stack: true, scene: ['towerFront'], cam: { az: 8 },
    A: { hip: [0, 0.96], torso: 25, legsL: FEET, legsR: { th: 4, sh: 2 }, arms: { ik: [0.45, 1.2], gw: 0.2, palm: 'pro' } },
    B: { hip: [0, 0.96], torso: 25, legsL: FEET, legsR: { th: -62, sh: -55 }, arms: { ik: [0.45, 1.2], gw: 0.2, palm: 'pro' } } });

  // ---- Pecho ----
  def('bench', { p: ['pecs'], s: ['triceps', 'delts'], load: 'bar', scene: ['bench', 'benchRack'], smith: true, liftAt: 0, cam: { y: 0.75 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ik: [-0.36, 1.18], gw: 0.42, palm: 'pro' } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ik: [-0.3, 0.74], gw: 0.42, palm: 'pro' } } });
  def('incline', { p: ['pecs', 'delts'], s: ['triceps'], load: 'bar', scene: ['inclineBench'], smith: true, liftAt: 0,
    A: { hip: [0.05, 0.56], torso: -52, legs: { ik: [0.55, 0.08], fw: 0.22 }, arms: { ik: [-0.27, 1.45], gw: 0.4, palm: 'pro' } },
    B: { hip: [0.05, 0.56], torso: -52, legs: { ik: [0.55, 0.08], fw: 0.22 }, arms: { ik: [-0.22, 1.02], gw: 0.4, palm: 'pro' } } });
  def('fly', { p: ['pecs'], s: ['delts'], load: 'hands', scene: ['bench'], liftAt: 0, cam: { y: 0.75, az: 50 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ik: [-0.36, 1.15, 0.13], pole: [0.4, -0.6, 0.5], palm: [0, 0, -1] } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ik: [-0.36, 0.72, 0.68], pole: [0.4, -0.6, 0.5], palm: [0, 1, -0.3] } } });
  def('pullover', { p: ['lats', 'pecs'], s: ['triceps'], load: 'single', scene: ['bench'], liftAt: 0, cam: { y: 0.75 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ua: 178, fa: 182 } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ua: 262, fa: 268 } } });
  def('chestPress', { p: ['pecs'], s: ['triceps', 'delts'], load: 'machine', stack: true, scene: ['chestPress'], machinePos: [-0.72, -0.5, 0],
    A: { hip: [-0.1, 0.56], torso: -8, legs: { ik: [0.4, 0.08], fw: 0.17 }, arms: { ik: [0.15, 1.22], gw: 0.28, pole: [-1, -0.4, 0.5], palm: 'pro' } },
    B: { hip: [-0.1, 0.56], torso: -8, legs: { ik: [0.4, 0.08], fw: 0.17 }, arms: { ik: [0.6, 1.24], gw: 0.25, pole: [-1, -0.4, 0.5], palm: 'pro' } } });
  def('cableFly', { p: ['pecs'], s: ['delts'], load: 'twinCable', stack: true, cam: { az: 55, dist: 1.1 },
    A: { hip: [0, 0.96], torso: 14, legsL: { ik: [-0.18, 0.08] }, legsR: { ik: [0.22, 0.08] }, arms: { ik: [0.24, 1.47, 0.74], pole: [-0.6, 0.1, 0.8], palm: [0.4, 0, -1] } },
    B: { hip: [0, 0.96], torso: 14, legsL: { ik: [-0.18, 0.08] }, legsR: { ik: [0.22, 0.08] }, arms: { ik: [0.56, 1.16, 0.08], pole: [-0.6, 0.1, 0.8], palm: [0, 0, -1] } } });
  def('dip', { p: ['triceps', 'pecs'], s: ['delts'], load: 'none', scene: ['dipStation'], liftAt: 0,
    A: { hip: [-0.02, 1.33], torso: 6, legs: { rel: [-0.28, -0.72], pole: [1, 0, 0] }, arms: { ik: [0.0, 1.26], gw: 0.27, pole: [-1, 0, 0.2], palm: 'neu' } },
    B: { hip: [-0.06, 0.98], torso: 22, legs: { rel: [-0.28, -0.72], pole: [1, 0, 0] }, arms: { ik: [0.0, 1.26], gw: 0.27, pole: [-1, 0, 0.2], palm: 'neu' } } });
  def('pushup', { p: ['pecs', 'triceps'], s: ['delts', 'abs'], load: 'none', liftAt: 0, cam: { y: 0.4 },
    A: { hip: [-0.15, 0.56], torso: 79, legs: { ik: [-0.98, 0.17], fw: 0.1, foot: 75 }, arms: { ik: [0.36, 0.07], gw: 0.3, pole: [-0.5, 1, 0.6], hand: 'flat', flatDir: [1, 0, 0.2] } },
    B: { hip: [-0.15, 0.33], torso: 86, legs: { ik: [-0.98, 0.17], fw: 0.1, foot: 75 }, arms: { ik: [0.36, 0.07], gw: 0.3, pole: [-0.5, 1, 0.6], hand: 'flat', flatDir: [1, 0, 0.2] } } });

  // ---- Espalda ----
  def('row', { p: ['lats', 'traps'], s: ['biceps', 'delts', 'lowback'], load: 'bar',
    A: { hip: [-0.15, 0.87], torso: 64, head: -30, legs: FEET, arms: { ik: [0.3, 0.47], gw: 0.27, pole: [-1, 0.5, 0.35], palm: 'pro' } },
    B: { hip: [-0.15, 0.87], torso: 64, head: -30, legs: FEET, arms: { ik: [0.14, 0.82], gw: 0.27, pole: [-1, 0.5, 0.35], palm: 'pro' } } });
  def('dbRow', { p: ['lats'], s: ['biceps', 'traps'], load: 'handR', scene: ['rowBench'], cam: { az: 25 },
    A: { hip: [-0.1, 0.78], torso: 80, head: -20, legsL: { ik: [-0.48, 0.5], pole: [1, -1, 0] }, legsR: { ik: [0.0, 0.08, 0.32] },
      armsL: { ik: [0.46, 0.5, 0.2], hand: 'flat', flatDir: [1, 0, 0] }, armsR: { ik: [0.4, 0.21, 0.24], pole: [-1, 0.6, 0.3], palm: 'neu' } },
    B: { hip: [-0.1, 0.78], torso: 80, head: -20, legsL: { ik: [-0.48, 0.5], pole: [1, -1, 0] }, legsR: { ik: [0.0, 0.08, 0.32] },
      armsL: { ik: [0.46, 0.5, 0.2], hand: 'flat', flatDir: [1, 0, 0] }, armsR: { ik: [0.12, 0.7, 0.24], pole: [-1, 0.6, 0.3], palm: 'neu' } } });
  // Jalón: visto por detrás, con la polea delante; la barra baja hasta la parte alta del pecho
  def('pulldown', { p: ['lats'], s: ['biceps', 'traps'], load: 'pulldown', stack: true, scene: ['pulldown'], cam: { az: -128, el: 14 },
    A: { hip: [0, 0.57], torso: -8, legs: { ik: [0.45, 0.08], fw: 0.16 }, arms: { relC: [0.14, 0.55], gw: 0.46, pole: [0, -1, 0.6], palm: 'pro' } },
    B: { hip: [0, 0.57], torso: -20, head: 8, legs: { ik: [0.45, 0.08], fw: 0.16 }, arms: { relC: [0.21, 0.05], gw: 0.46, pole: [0, -1, 0.6], palm: 'pro' } } });
  def('pullup', { p: ['lats'], s: ['biceps', 'forearms'], load: 'none', scene: ['pullFrame'], cam: { az: -140, el: 10 },
    A: { hip: [-0.03, 1.08], torso: 0, legs: { rel: [-0.2, -0.82], fw: 0.06 }, arms: { ik: [0.0, 2.22], gw: 0.42, pole: [0.2, -1, 0.7], palm: 'pro' } },
    B: { hip: [-0.06, 1.56], torso: -8, legs: { rel: [-0.2, -0.82], fw: 0.06 }, arms: { ik: [0.0, 2.22], gw: 0.42, pole: [0.2, -1, 0.7], palm: 'pro' } } });
  // Remo sentado: piernas semiflexionadas, agarre en V que llega al abdomen con los codos por detrás del cuerpo
  def('seatedRow', { p: ['lats', 'traps'], s: ['biceps'], load: 'seatedRow', stack: true, scene: ['seatedRow'], cam: { az: 25 },
    A: { hip: [-0.38, 0.45], torso: 16, legs: { ik: [0.36, 0.33], fw: 0.14, foot: -72, pole: [0.2, 1, 0.2] }, arms: { relC: [0.6, -0.1], gw: 0.05, pole: [-1, -0.5, 0.25], palm: 'neu' } },
    B: { hip: [-0.38, 0.45], torso: -4, legs: { ik: [0.36, 0.33], fw: 0.14, foot: -72, pole: [0.2, 1, 0.2] }, arms: { relC: [0.16, -0.24], gw: 0.06, pole: [-1, -0.2, 0.35], palm: 'neu' } } });
  def('facePull', { p: ['delts', 'traps'], s: ['biceps'], load: 'facePull', stack: true, scene: ['towerFront'], cam: { az: 8 },
    A: { hip: [-0.05, 0.96], torso: -3, legsL: { ik: [-0.2, 0.08] }, legsR: { ik: [0.12, 0.08] }, arms: { ik: [0.55, 1.56], gw: 0.07, pole: [-0.6, 0.6, 1], palm: 'neu' } },
    B: { hip: [-0.05, 0.96], torso: -3, legsL: { ik: [-0.2, 0.08] }, legsR: { ik: [0.12, 0.08] }, arms: { ik: [0.1, 1.64], gw: 0.3, pole: [-0.6, 0.6, 1], palm: 'neu' } } });
  def('hyperext', { p: ['lowback', 'glutes'], s: ['hams'], load: 'none', scene: ['hyperBench'], cam: { az: 12 },
    A: { hip: [0, 0.98], torso: 132, legs: { ik: [-0.6, 0.36], fw: 0.1 }, arms: { temple: 1, pole: [0, 0.3, 1] } },
    B: { hip: [0, 0.98], torso: 48, legs: { ik: [-0.6, 0.36], fw: 0.1 }, arms: { temple: 1, pole: [0, 0.3, 1] } } });
  // Encogimientos: solo suben los hombros (el cuello y la cabeza no se separan del tronco)
  def('shrug', { p: ['traps'], s: ['forearms'], load: 'handsFront', stack: true, cam: { az: 55 },
    A: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.05, -0.62, 0.05], palm: 'pro' }, shr: 0 },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.05, -0.62, 0.05], palm: 'pro' }, shr: 0.06 } });

  // ---- Hombros ----
  def('ohp', { p: ['delts'], s: ['triceps', 'traps'], load: 'bar', stack: true,
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ik: [0.12, 1.5], gw: 0.27, pole: [0.4, -1, 0.5], palm: 'pro' } },
    B: { hip: STAND, torso: -2, legs: FEET, arms: { ik: [0.02, 2.08], gw: 0.27, pole: [0.4, -1, 0.5], palm: 'pro' } } });
  // Elevaciones laterales: brazos casi rectos, palmas hacia el suelo arriba
  def('lateralRaise', { p: ['delts'], s: ['traps'], load: 'hands', stack: true, cam: { az: 70 },
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 8, fa: 12, plane: 'f', palm: [0, 0, -1] } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 85, fa: 92, plane: 'f', palm: [0, -1, -0.15] } } });
  // Elevación frontal: un solo movimiento con el brazo casi recto (sin flexionar el codo)
  def('frontRaise', { p: ['delts'], s: ['traps'], load: 'hands', stack: true, cam: { az: 28 },
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 4, fa: 9, palm: 'pro' } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 88, fa: 94, palm: 'pro' } } });
  P.lateral = P.frontRaise;
  def('uprightRow', { p: ['delts', 'traps'], s: ['biceps'], load: 'handsFront', stack: true, cam: { az: 62 },
    A: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.06, -0.62, -0.06], pole: [0, 1, 1], palm: 'pro' } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.14, -0.12, -0.06], pole: [-0.2, 1, 1.3], palm: 'pro' } } });

  // ---- Brazos ----
  def('curl', { p: ['biceps'], s: ['forearms'], load: 'hands', stack: true,
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 2, fa: 4, palm: 'sup' } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 10, fa: 150, palm: 'sup' } } });
  def('preacherCurl', { p: ['biceps'], s: ['forearms'], load: 'hands', stack: true, scene: ['preacher'], cam: { az: 68 },
    A: { hip: [-0.12, 0.6], torso: 14, legs: { ik: [0.3, 0.08], fw: 0.16 }, arms: { ua: 45, fa: 55, palm: 'sup' } },
    B: { hip: [-0.12, 0.6], torso: 14, legs: { ik: [0.3, 0.08], fw: 0.16 }, arms: { ua: 45, fa: 168, palm: 'sup' } } });
  def('pushdown', { p: ['triceps'], load: 'pushdown', stack: true, scene: ['towerFront'], cam: { az: 8 },
    A: { hip: [-0.05, 0.96], torso: 10, legs: FEET, arms: { ua: -6, fa: 105, palm: 'pro' } },
    B: { hip: [-0.05, 0.96], torso: 10, legs: FEET, arms: { ua: -6, fa: 4, palm: 'pro' } } });
  // Extensión sobre la cabeza: los codos apuntan arriba y la mancuerna baja por detrás de la cabeza
  def('ohExt', { p: ['triceps'], load: 'overhead', stack: true, liftAt: 0, cam: { az: 25 },
    A: { hip: STAND, torso: 0, legs: FEET, arms: { relC: [0.03, 0.63], gw: 0.035, pole: [0.5, 1, 0.35], palm: [0, 1, 0] } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { relC: [-0.17, 0.2], gw: 0.035, pole: [0.5, 1, 0.35], palm: [0, 1, 0] } } });
  def('skullCrusher', { p: ['triceps'], load: 'bar', scene: ['bench'], liftAt: 0, cam: { y: 0.75 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ua: 170, fa: 175, palm: 'pro' } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ua: 170, fa: 285, palm: 'pro' } } });
  def('kickback', { p: ['triceps'], load: 'handR', stack: true, scene: ['rowBench'], cam: { az: 25 },
    A: { hip: [-0.1, 0.78], torso: 80, head: -20, legsL: { ik: [-0.48, 0.5], pole: [1, -1, 0] }, legsR: { ik: [0.0, 0.08, 0.32] },
      armsL: { ik: [0.46, 0.5, 0.2], hand: 'flat', flatDir: [1, 0, 0] }, armsR: { ua: -82, fa: 0, palm: 'neu' } },
    B: { hip: [-0.1, 0.78], torso: 80, head: -20, legsL: { ik: [-0.48, 0.5], pole: [1, -1, 0] }, legsR: { ik: [0.0, 0.08, 0.32] },
      armsL: { ik: [0.46, 0.5, 0.2], hand: 'flat', flatDir: [1, 0, 0] }, armsR: { ua: -82, fa: -84, palm: 'neu' } } });

  // ---- Core ----
  def('plank', { p: ['abs'], s: ['delts', 'glutes'], load: 'none', scene: ['mat'], cam: { y: 0.35 },
    A: { hip: [-0.3, 0.3], torso: 82, head: -10, legs: { th: -82, sh: -82, foot: 80 }, arms: { ua: 0, fa: 90, palm: [0, -1, -0.5] } },
    B: { hip: [-0.3, 0.315], torso: 82, head: -10, legs: { th: -82, sh: -82, foot: 80 }, arms: { ua: 0, fa: 90, palm: [0, -1, -0.5] } } });
  // Crunch: recorrido corto (solo se despegan los omóplatos), manos junto a la cabeza
  def('crunch', { p: ['abs'], load: 'none', stack: true, scene: ['mat'], cam: { y: 0.4, az: 35 },
    A: { hip: [0, 0.13], torso: -90, legs: { ik: [0.55, 0.09], fw: 0.15 }, arms: { temple: 1, pole: [0.3, 0.2, 1], palm: [0, 0, -1] } },
    B: { hip: [0, 0.13], torso: -62, head: 12, legs: { ik: [0.55, 0.09], fw: 0.15 }, arms: { temple: 1, pole: [0.3, 0.2, 1], palm: [0, 0, -1] } } });
  def('legRaise', { p: ['abs'], load: 'none', scene: ['mat'], cam: { y: 0.45 },
    A: { hip: [0, 0.13], torso: -90, legs: { th: 86, sh: 87 }, arms: { ua: 88, fa: 88, palm: [0, -1, 0] } },
    B: { hip: [0, 0.13], torso: -90, legs: { th: 178, sh: 180 }, arms: { ua: 88, fa: 88, palm: [0, -1, 0] } } });
  def('hangLeg', { p: ['abs'], s: ['forearms'], load: 'none', scene: ['pullFrame'],
    A: { hip: [-0.02, 1.08], torso: 0, legs: { th: 4, sh: 0 }, arms: { ik: [0.0, 2.22], gw: 0.42, straight: 1, palm: 'pro' } },
    B: { hip: [0.0, 1.08], torso: -6, legs: { th: 92, sh: 92 }, arms: { ik: [0.0, 2.22], gw: 0.42, straight: 1, palm: 'pro' } } });

  // ---- Frontales / cuerpo completo ----
  def('abduction', { p: ['glutes'], load: 'ankleSide', stack: true, scene: ['towerSide'], cam: { az: 70 },
    A: { hip: STAND, torso: 0, legsL: FEET, legsR: { th: 2, sh: 2, plane: 'f' }, armsL: { rel: [0.04, -0.6, 0.06], palm: 'neu' }, armsR: { ik: [0.0, 1.15, 0.6], palm: 'neu' } },
    B: { hip: [0, 0.97], torso: 0, legsL: FEET, legsR: { th: 48, sh: 48, plane: 'f' }, armsL: { rel: [0.04, -0.6, 0.06], palm: 'neu' }, armsR: { ik: [0.0, 1.15, 0.6], palm: 'neu' } } });
  (function () {
    var down = { hip: STAND, torso: 0, legs: { ik: [0, 0.08], fw: 0.1 }, arms: { ua: 6, fa: 4, plane: 'f', palm: [0, 0, -1] } };
    var air1 = { hip: [0, 1.06], torso: 0, legs: { ik: [0, 0.18], fw: 0.22, foot: 30 }, arms: { ua: 80, fa: 84, plane: 'f', palm: [0, -1, 0] } };
    var wide = { hip: [0, 0.94], torso: 0, legs: { ik: [0, 0.08], fw: 0.33 }, arms: { ua: 168, fa: 172, plane: 'f', palm: [0, 0, -1] } };
    def('jumpingJack', { p: ['delts', 'calves'], s: ['quads', 'glutes'], load: 'none', cam: { az: 70 },
      keys: [[0, down], [0.12, down], [0.26, air1], [0.42, wide], [0.56, wide], [0.7, air1], [0.86, down], [1, down]], thumb: 0.45 });
  })();
  def('swing', { p: ['glutes', 'hams'], s: ['delts', 'lowback', 'abs'], load: 'kb',
    A: { hip: [-0.25, 0.74], torso: 58, legs: { ik: [0.0, 0.08], fw: 0.2 }, arms: { ik: [-0.05, 0.5], gw: 0.04, straight: 1, palm: 'pro' } },
    B: { hip: STAND, torso: -2, legs: { ik: [0.0, 0.08], fw: 0.2 }, arms: { ik: [0.62, 1.38], gw: 0.04, straight: 1, palm: 'pro' } } });

  // ---- Cardio (cíclicos, con contacto real de los pies) ----
  def('run', { p: ['quads', 'hams', 'calves', 'glutes'], load: 'none', cyclic: 'run', scene: ['treadmill'], cam: { az: 28 } });
  def('walk', { p: ['forearms', 'traps'], s: ['quads', 'calves'], load: 'hands', cyclic: 'walk', cam: { az: 30 } });
  def('bike', { p: ['quads', 'calves'], s: ['hams', 'glutes'], load: 'none', cyclic: 'bike', scene: ['bike'] });
  def('rowErg', { p: ['lats', 'quads'], s: ['hams', 'biceps', 'lowback'], load: 'none', cyclic: 'rowErg', scene: ['rower'], cam: { az: 22 } });
  def('jumpRope', { p: ['calves'], s: ['delts', 'forearms'], load: 'rope', cyclic: 'jumpRope', cam: { az: 62 } });

  var BELT = 0.14;
  function gaitAnkle(w, stride, lift, base) {
    // apoyo: el pie va hacia atrás pegado al suelo; vuelo: se levanta y avanza
    var c = Math.cos(w), s = Math.sin(w);
    var x = stride * c;
    var y = base + (s > 0 ? lift * Math.pow(s, 1.4) : 0);
    return [x + 0.02, y];
  }
  function cyclicPose(kind, ph) {
    var w = ph * Math.PI * 2;
    if (kind === 'run' || kind === 'walk') {
      var run = kind === 'run', base = (run ? BELT : 0) + 0.08;
      var R = gaitAnkle(w, run ? 0.36 : 0.26, run ? 0.24 : 0.09, base), L = gaitAnkle(w + Math.PI, run ? 0.36 : 0.26, run ? 0.24 : 0.09, base);
      var bob = (run ? 0.03 : 0.015) * Math.abs(Math.cos(w));
      var hipY = (run ? BELT + 0.93 : 0.95) + bob;
      var footAng = function (a) { var s = Math.sin(a); return s > 0 ? -10 * s : 0; };
      var f = { hip: [0, hipY], torso: run ? 8 : 1,
        legsR: { ik: R, fw: 0.1, foot: footAng(w) }, legsL: { ik: L, fw: 0.1, foot: footAng(w + Math.PI) } };
      var s1 = Math.cos(w);
      if (run) { f.armsR = { ua: 32 * s1, fa: 32 * s1 + 95, palm: 'neu' }; f.armsL = { ua: -32 * s1, fa: -32 * s1 + 95, palm: 'neu' }; }
      else { f.armsR = { ua: 5 * s1, fa: 5 * s1 + 3, palm: 'neu' }; f.armsL = { ua: -5 * s1, fa: -5 * s1 + 3, palm: 'neu' }; }
      return f;
    }
    if (kind === 'bike') {
      var cr = [0.18, 0.36], r = 0.17;
      var pr = [cr[0] + Math.cos(-w) * r, cr[1] + Math.sin(-w) * r], pl = [cr[0] - Math.cos(-w) * r, cr[1] - Math.sin(-w) * r];
      return { hip: [-0.3, 1.0], torso: 28, legsR: { ik: [pr[0] - 0.03, pr[1] + 0.03], fw: 0.11 }, legsL: { ik: [pl[0] - 0.03, pl[1] + 0.03], fw: 0.11 },
        arms: { ik: [0.42, 1.22], gw: 0.22, palm: 'pro' }, pedals: [pr, pl, cr] };
    }
    if (kind === 'rowErg') {
      // Tirón: piernas -> tronco -> brazos ; recuperación: brazos -> tronco -> piernas
      var u;
      if (ph < 0.4) u = ph / 0.4; else if (ph < 0.48) u = 1; else u = 1 - (ph - 0.48) / 0.52;
      var legs = smooth(clamp(u / 0.55, 0, 1)), back = smooth(clamp((u - 0.35) / 0.35, 0, 1)), arms = smooth(clamp((u - 0.55) / 0.45, 0, 1));
      if (ph >= 0.48) { // recuperación en orden inverso
        var v = 1 - u;
        arms = 1 - smooth(clamp(v / 0.35, 0, 1)); back = 1 - smooth(clamp((v - 0.2) / 0.35, 0, 1)); legs = 1 - smooth(clamp((v - 0.4) / 0.6, 0, 1));
      }
      var hx = lerp(0.18, -0.38, legs), tor = lerp(30, -18, back);
      var tt = rad(tor), sho = [hx + Math.sin(tt) * SPINE, 0.36 + Math.cos(tt) * SPINE];
      var reach = [sho[0] + 0.6, 0.72], pull = [hx + 0.2, 0.7];
      return { hip: [hx, 0.36], torso: tor, head: -5, legs: { ik: [0.66, 0.36], fw: 0.11, foot: -62, pole: [0.2, 1, 0.12] },
        arms: { ik: [lerp(reach[0], pull[0], arms), lerp(reach[1], pull[1], arms)], gw: 0.14, pole: [-1, -0.3, 0.35], palm: 'pro' } };
    }
    if (kind === 'jumpRope') {
      // un salto por vuelta: los pies despegan justo cuando la cuerda pasa por debajo
      var hop = 0.06 * Math.pow(Math.max(0, Math.cos(w)), 2);
      var flex = 0.03 * Math.pow(Math.max(0, -Math.cos(w)), 2);
      var circle = [0.04 * Math.sin(w), 0.04 * Math.cos(w)];
      return { hip: [0, 0.965 + hop - flex], torso: 0,
        legs: { ik: [0.0, 0.08 + hop * 0.9], fw: 0.1, foot: hop > 0.01 ? 22 * (hop / 0.06) : 0 },
        arms: { rel: [0.1 + circle[0], -0.47 + circle[1], 0.22], pole: [-1, -0.5, 0], palm: [0, 0.4, -1] }, rope: w };
    }
  }

  // ---------------------------------------------------------------------------
  //  Escena
  // ---------------------------------------------------------------------------
  function tempo(ph) {
    if (ph < 0.36) return smooth(ph / 0.36);
    if (ph < 0.46) return 1;
    if (ph < 0.9) return 1 - smooth((ph - 0.46) / 0.44);
    return 0;
  }
  function keyPose(keys, ph) {
    for (var i = 0; i < keys.length - 1; i++) {
      if (ph <= keys[i + 1][0]) {
        var t = (ph - keys[i][0]) / Math.max(1e-6, keys[i + 1][0] - keys[i][0]);
        return { pose: mixVal(keys[i][1], keys[i + 1][1], smooth(t)) };
      }
    }
    return { pose: keys[keys.length - 1][1] };
  }
  function poseAt(d, phase) {
    if (d.cyclic) return { f: cyclicPose(d.cyclic, phase), u: 0 };
    if (d.keys) { var k = keyPose(d.keys, phase); return { f: k.pose, u: 0 }; }
    var u = tempo(phase);
    return { f: mixVal(d.A, d.B, u), u: u };
  }

  function createStage(key, eq, muscleOverride) {
    var d = P[key] || P.curl;
    eq = eq || 'none';
    var M = mats();
    var scene = new T.Scene();
    var active = { p: (d.p || []).slice(), s: (d.s || []).slice() };
    if (muscleOverride && MUSCLE_MAP[muscleOverride]) {
      var mm = MUSCLE_MAP[muscleOverride];
      if (active.p.indexOf(mm) < 0) { active.s = active.s.concat(active.p); active.p = [mm]; }
    }

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

    var body = makeBody(scene, active);
    var eqp = { cables: [] };
    var smith = eq === 'machine' && d.smith;
    var barMode = eq === 'barbell' || smith;
    var cableLoads = ['pulldown', 'seatedRow', 'facePull', 'pushdown', 'twinCable', 'ankle', 'ankleSide'];
    var needsStack = eq === 'cable' || (eq === 'machine' && d.stack && !smith) || cableLoads.indexOf(d.load) >= 0;
    if ((d.load === 'ankle' || d.load === 'ankleSide') && eq !== 'cable' && eq !== 'machine') needsStack = false;

    var sc = d.scene || [];
    var G = new T.Group(); scene.add(G);
    function legs4(x0, x1, z0, z1, y) { [[x0, z0], [x0, z1], [x1, z0], [x1, z1]].forEach(function (p) { box(G, 0.05, y, 0.05, M.frame, p[0], y / 2, p[1]); }); }
    if (sc.indexOf('bench') >= 0) { box(G, 1.25, 0.07, 0.3, M.pad, 0.0, 0.43, 0); legs4(-0.5, 0.5, -0.1, 0.1, 0.4); }
    if (sc.indexOf('benchRack') >= 0 && !smith) {
      [-1, 1].forEach(function (sg) { box(G, 0.06, 1.25, 0.06, M.frame, -0.62, 0.62, sg * 0.55); box(G, 0.12, 0.04, 0.06, M.metal, -0.56, 1.12, sg * 0.55); });
      box(G, 0.3, 0.04, 1.2, M.frame, -0.62, 0.02, 0);
    }
    if (sc.indexOf('rack') >= 0 && !smith) {
      [-1, 1].forEach(function (sg) { box(G, 0.07, 1.75, 0.07, M.frame, -0.42, 0.875, sg * 0.62); box(G, 0.14, 0.05, 0.07, M.metal, -0.35, 1.38, sg * 0.62); box(G, 0.55, 0.05, 0.07, M.frame, -0.2, 0.03, sg * 0.62); });
    }
    if (sc.indexOf('inclineBench') >= 0) {
      var ib = box(G, 0.9, 0.07, 0.3, M.pad, -0.2, 0.62, 0); ib.rotation.z = rad(-38);
      box(G, 0.42, 0.07, 0.3, M.pad, 0.18, 0.43, 0); legs4(-0.4, 0.3, -0.1, 0.1, 0.4);
    }
    if (sc.indexOf('rowBench') >= 0) { box(G, 1.1, 0.07, 0.3, M.pad, 0.0, 0.43, -0.17); legs4(-0.45, 0.45, -0.27, -0.07, 0.4); }
    if (sc.indexOf('thrustBench') >= 0) { box(G, 0.35, 0.07, 1.0, M.pad, -0.62, 0.43, 0); legs4(-0.72, -0.52, -0.4, 0.4, 0.4); }
    if (sc.indexOf('mat') >= 0) box(G, 1.9, 0.015, 0.65, M.mat, -0.05, 0.008, 0);
    if (sc.indexOf('step') >= 0) { box(G, 0.34, 0.1, 0.7, M.rubber, 0.15, 0.05, 0); box(G, 0.34, 0.006, 0.7, M.frameLight, 0.15, 0.103, 0); }
    if (sc.indexOf('pullFrame') >= 0) {
      [-1, 1].forEach(function (sg) { box(G, 0.07, 2.3, 0.07, M.frame, 0.0, 1.15, sg * 0.75); box(G, 0.6, 0.04, 0.07, M.frame, 0.0, 0.02, sg * 0.75); });
      cylZ(G, 0.018, 1.6, M.metal, 0.0, 2.22, 0);
    }
    if (sc.indexOf('dipStation') >= 0) {
      [-1, 1].forEach(function (sg) {
        cylX(G, 0.02, 0.7, M.metal, 0.05, 1.24, sg * 0.27);
        box(G, 0.06, 1.24, 0.06, M.frame, 0.38, 0.62, sg * 0.27); box(G, 0.06, 1.24, 0.06, M.frame, -0.28, 0.62, sg * 0.27);
      });
    }
    if (sc.indexOf('hyperBench') >= 0) {
      var hp = box(G, 0.3, 0.08, 0.4, M.pad, 0.07, 0.9, 0); hp.rotation.z = rad(45);
      var fp = box(G, 0.12, 0.06, 0.4, M.pad, -0.55, 0.3, 0); fp.rotation.z = rad(45);
      var rail = box(G, 0.06, 1.2, 0.06, M.frame, -0.25, 0.55, 0); rail.rotation.z = rad(-48);
      box(G, 0.06, 0.88, 0.06, M.frame, 0.12, 0.44, 0); box(G, 1.1, 0.04, 0.5, M.frame, -0.2, 0.02, 0);
    }
    if (sc.indexOf('preacher') >= 0) {
      var pp = box(G, 0.34, 0.06, 0.5, M.pad, 0.07, 0.93, 0); pp.rotation.z = rad(-45);
      box(G, 0.06, 0.88, 0.06, M.frame, 0.12, 0.44, 0); box(G, 0.32, 0.07, 0.32, M.pad, -0.12, 0.5, 0); box(G, 0.06, 0.48, 0.06, M.frame, -0.12, 0.24, 0);
    }
    if (sc.indexOf('legExt') >= 0) {
      box(G, 0.45, 0.08, 0.42, M.pad, 0.1, 0.5, 0);
      var bk = box(G, 0.08, 0.6, 0.42, M.pad, -0.2, 0.85, 0); bk.rotation.z = rad(-10);
      box(G, 0.06, 0.48, 0.06, M.frame, 0.1, 0.24, 0); box(G, 0.7, 0.04, 0.5, M.frame, -0.05, 0.02, 0);
      [-1, 1].forEach(function (sg) { box(G, 0.04, 0.2, 0.04, M.frame, -0.02, 0.56, sg * 0.25); cylX(G, 0.02, 0.18, M.metal, -0.02, 0.65, sg * 0.25); });
      eqp.lever = box(G, 0.04, 0.42, 0.04, M.frame, 0, 0, 0.3);
      eqp.roller = cylZ(G, 0.05, 0.42, M.pad, 0, 0, 0);
    }
    if (sc.indexOf('legCurl') >= 0) {
      box(G, 1.25, 0.08, 0.38, M.pad, 0.15, 0.54, 0); legs4(-0.35, 0.65, -0.12, 0.12, 0.5);
      [-1, 1].forEach(function (sg) { cylX(G, 0.018, 0.14, M.metal, 0.62, 0.5, sg * 0.25); });
      eqp.roller = cylZ(G, 0.05, 0.42, M.pad, 0, 0, 0);
      eqp.lever = box(G, 0.04, 0.44, 0.04, M.frame, 0, 0, 0.3);
    }
    if (sc.indexOf('chestPress') >= 0) {
      box(G, 0.42, 0.08, 0.42, M.pad, -0.05, 0.5, 0);
      var cb = box(G, 0.08, 0.75, 0.42, M.pad, -0.24, 0.92, 0); cb.rotation.z = rad(-8);
      box(G, 0.06, 0.48, 0.06, M.frame, -0.05, 0.24, 0); box(G, 0.7, 0.04, 0.6, M.frame, -0.2, 0.02, 0);
      eqp.handles = [box(G, 0.04, 0.16, 0.04, M.metal, 0, 0, -0.28), box(G, 0.04, 0.16, 0.04, M.metal, 0, 0, 0.28)];
      eqp.arms = [box(G, 0.04, 1, 0.04, M.frame, 0, 0, -0.33), box(G, 0.04, 1, 0.04, M.frame, 0, 0, 0.33)];
    }
    if (sc.indexOf('pulldown') >= 0) {
      box(G, 0.42, 0.08, 0.42, M.pad, 0.0, 0.5, 0); box(G, 0.06, 0.48, 0.06, M.frame, 0.0, 0.24, 0);
      box(G, 0.12, 0.1, 0.46, M.pad, 0.36, 0.73, 0); box(G, 0.05, 0.36, 0.05, M.frame, 0.36, 0.53, 0);
      beam(G, V(0.36, 0.53, 0), V(0.62, 0.53, 0), 0.05, M.frame);
      beam(G, V(0.62, 2.45, 0), V(0.2, 2.45, 0), 0.06, M.frame);
      var tp = new T.Mesh(new T.TorusGeometry(0.045, 0.012, 10, 24), M.metal); tp.position.set(0.2, 2.42, 0); tp.rotation.y = Math.PI / 2; G.add(tp);
      box(G, 1.0, 0.04, 0.6, M.frame, 0.25, 0.02, 0);
    }
    if (sc.indexOf('seatedRow') >= 0) {
      box(G, 1.7, 0.06, 0.32, M.frame, 0.12, 0.2, 0); box(G, 0.44, 0.08, 0.38, M.pad, -0.4, 0.4, 0);
      box(G, 0.06, 0.18, 0.06, M.frame, -0.4, 0.29, 0);
      [-1, 1].forEach(function (sg) { var fpl = box(G, 0.05, 0.3, 0.16, M.frameLight, 0.43, 0.38, sg * 0.14); fpl.rotation.z = rad(-18); });
      box(G, 0.08, 0.5, 0.2, M.frame, 0.88, 0.45, 0);
    }
    if (sc.indexOf('seatedCalf') >= 0) {
      box(G, 0.42, 0.08, 0.42, M.pad, -0.22, 0.52, 0); box(G, 0.06, 0.5, 0.06, M.frame, -0.22, 0.25, 0);
      box(G, 0.2, 0.2, 0.55, M.rubber, 0.42, 0.1, 0); box(G, 0.9, 0.04, 0.6, M.frame, 0.05, 0.02, 0);
      box(G, 0.06, 0.62, 0.06, M.frame, 0.12, 0.31, -0.32);
      eqp.kneePad = new T.Group(); G.add(eqp.kneePad);
      box(eqp.kneePad, 0.2, 0.07, 0.5, M.pad, 0, 0, 0);
      beam(eqp.kneePad, V(0, 0, -0.3), V(-0.32, -0.25, -0.32), 0.05, M.frame);
      var horn = cylZ(eqp.kneePad, 0.025, 0.25, M.metal, -0.32, -0.25, -0.45);
      [0, 1].forEach(function (i) { cylZ(eqp.kneePad, 0.16, 0.04, M.plate, -0.32, -0.25, -0.38 - i * 0.05); });
    }
    if (sc.indexOf('legPress') >= 0) {
      var seat = box(G, 0.46, 0.08, 0.52, M.pad, -0.3, 0.48, 0); seat.rotation.z = rad(-8);
      var back = box(G, 0.08, 0.72, 0.52, M.pad, -0.62, 0.78, 0); back.rotation.z = rad(-40);
      box(G, 2.1, 0.05, 1.0, M.frame, 0.15, 0.025, 0);
      // raíles a 45° por fuera del cuerpo
      [-1, 1].forEach(function (sg) {
        beam(G, V(-0.05, 0.25, sg * 0.46), V(1.05, 1.35, sg * 0.46), 0.07, M.frame);
        box(G, 0.06, 1.32, 0.06, M.frame, 1.05, 0.66, sg * 0.46);
        box(G, 0.06, 0.25, 0.06, M.frame, -0.05, 0.125, sg * 0.46);
      });
      [-1, 1].forEach(function (sg) { cylX(G, 0.018, 0.12, M.metal, -0.24, 0.55, sg * 0.33); });
      eqp.sled = new T.Group(); G.add(eqp.sled);
      box(eqp.sled, 0.05, 0.62, 0.72, M.frameLight, 0, 0, 0);          // plataforma (eje X = normal)
      box(eqp.sled, 0.02, 0.58, 0.68, M.rubber, -0.032, 0, 0);
      [-1, 1].forEach(function (sg) {
        box(eqp.sled, 0.14, 0.14, 0.1, M.frame, 0.08, 0.0, sg * 0.46);
        cylZ(eqp.sled, 0.025, 0.28, M.metal, 0.12, 0.12, sg * 0.66);
        [0, 1].forEach(function (i) { cylZ(eqp.sled, 0.2, 0.04, M.plate, 0.12, 0.12, sg * (0.58 + i * 0.05)); });
      });
    }
    if (sc.indexOf('treadmill') >= 0) {
      box(G, 1.8, 0.12, 0.8, M.frame, -0.02, 0.06, 0); eqp.belt = box(G, 1.62, 0.02, 0.62, M.belt, -0.02, 0.13, 0);
      box(G, 1.62, 0.004, 0.62, M.frameLight, -0.02, 0.112, 0);
      [-1, 1].forEach(function (sg) { box(G, 1.8, 0.03, 0.08, M.frameLight, -0.02, 0.135, sg * 0.36); var up = box(G, 0.05, 1.2, 0.05, M.frame, 0.72, 0.68, sg * 0.36); up.rotation.z = rad(-10); });
      box(G, 0.25, 0.12, 0.8, M.frame, 0.83, 1.28, 0);
      eqp.beltMarks = [];
      for (var bm = 0; bm < 6; bm++) eqp.beltMarks.push(box(G, 0.03, 0.004, 0.6, M.frameLight, 0, 0.142, 0));
    }
    if (sc.indexOf('bike') >= 0) {
      box(G, 1.1, 0.05, 0.45, M.frame, 0.0, 0.025, 0);
      var post = box(G, 0.06, 0.95, 0.06, M.frame, -0.22, 0.5, 0); post.rotation.z = rad(16);
      var fr = box(G, 0.06, 1.25, 0.06, M.frame, 0.32, 0.65, 0); fr.rotation.z = rad(-20);
      box(G, 0.3, 0.06, 0.18, M.pad, -0.3, 0.97, 0);
      cylZ(G, 0.018, 0.5, M.metal, 0.44, 1.22, 0);
      var fly = cylZ(G, 0.26, 0.06, M.plate, 0.48, 0.42, 0); fly.geometry = new T.CylinderGeometry(0.26, 0.26, 0.06, 40);
      eqp.crank = new T.Group(); G.add(eqp.crank);
    }
    if (sc.indexOf('rower') >= 0) {
      box(G, 2.2, 0.05, 0.16, M.frame, 0.05, 0.3, 0); box(G, 0.08, 0.28, 0.4, M.frame, -0.95, 0.14, 0);
      box(G, 0.12, 0.62, 0.44, M.frame, 1.05, 0.31, 0);
      var fw = cylZ(G, 0.25, 0.14, M.plate, 1.08, 0.66, 0); fw.geometry = new T.CylinderGeometry(0.25, 0.25, 0.14, 40);
      [-1, 1].forEach(function (sg) { var fpl = box(G, 0.04, 0.3, 0.14, M.frameLight, 0.74, 0.42, sg * 0.12); fpl.rotation.z = rad(-28); });
      eqp.seat = box(G, 0.3, 0.06, 0.3, M.pad, 0, 0.36, 0);
    }

    // Pilas y torres
    var tw = null, tw2 = null;
    var compactMachine = needsStack && eq === 'machine' && cableLoads.indexOf(d.load) < 0;
    if (compactMachine) {
      var mp = d.machinePos || [-0.62, -0.55, 0];
      tw = machineStack(scene, mp[0], mp[1], rad(mp[2] || 0));
      needsStack = false;
    }
    if (needsStack) {
      if (d.load === 'twinCable') { tw = stackTower(scene, -0.05, -1.05); tw2 = stackTower(scene, -0.05, 1.05); }
      else if (d.load === 'ankleSide' || sc.indexOf('towerSide') >= 0) tw = stackTower(scene, 0.0, -0.95);
      else if (d.load === 'pulldown') tw = stackTower(scene, 0.68, 0);
      else if (d.load === 'seatedRow') tw = stackTower(scene, 1.02, 0);
      else if (sc.indexOf('towerFront') >= 0 || d.load === 'facePull' || d.load === 'pushdown') tw = stackTower(scene, 0.78, 0);
      else tw = stackTower(scene, -0.75, -0.5);
    }
    if (tw && !tw.compact) eqp.cables.push(cableMesh(scene), cableMesh(scene), cableMesh(scene));
    if (tw2) eqp.cables.push(cableMesh(scene), cableMesh(scene), cableMesh(scene));

    // Cargas
    var bar = null, dbs = [], kb = null, handle = null, rope = null, smithM = null;
    var barLoads = ['bar', 'back', 'hip', 'handsFront', 'hands', 'overhead'];
    if (barMode && barLoads.indexOf(d.load) >= 0) bar = barbell(scene);
    if (smith && bar) smithM = smithMachine(scene, 0);
    if (eq === 'dumbbell') {
      if (d.load === 'goblet' || d.load === 'overhead' || d.load === 'single') dbs.push(dumbbell(scene));
      else if (d.load === 'handR' || d.load === 'handL') dbs.push(dumbbell(scene));
      else if (['hands', 'handsFront', 'bar'].indexOf(d.load) >= 0) dbs.push(dumbbell(scene), dumbbell(scene));
      else if (d.load === 'hip') dbs.push(dumbbell(scene));
    }
    if (eq === 'barbell' && d.load === 'goblet') bar = barbell(scene);
    if (eq === 'kettlebell' || d.load === 'kb') kb = kettlebell(scene);
    if ((tw && !tw.compact) || d.load === 'pulldown') {
      handle = new T.Group(); scene.add(handle);
      var hw = d.load === 'pulldown' ? 1.15 : (d.load === 'pushdown' ? 0.34 : (d.load === 'seatedRow' ? 0.16 : 0.12));
      cylZ(handle, 0.015, hw, M.metal, 0, 0, 0);
      if (d.load === 'pulldown') [-1, 1].forEach(function (sg) { var e = cyl(handle, 0.02, 0.12, M.rubber); e.rotation.x = Math.PI / 2; e.position.set(0, 0, sg * 0.5); });
    }
    if (d.load === 'rope') {
      rope = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([V(0, 1, -0.3), V(0, 0, 0), V(0, 1, 0.3)]), 24, 0.007, 6), M.accent);
      scene.add(rope);
    }

    // Cámara
    var camera = new T.PerspectiveCamera(30, 1, 0.1, 50);
    var cam = d.cam || {};
    var az = cam.az != null ? cam.az : 32, el = cam.el != null ? cam.el : 12;
    var samples = (d.keys || d.cyclic) ? [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9] : [0, 0.42];
    var js = samples.map(function (ph) { var pp = poseAt(d, ph).f; return solve(pp.arms && pp.arms.bar ? Object.assign({}, pp, { arms: { ua: 0, fa: 0 } }) : pp); });
    var pts = [];
    js.forEach(function (jj) { pts.push(jj.head, jj.hip, jj.hand.L, jj.hand.R, jj.ank.L, jj.ank.R, jj.toe.R, jj.knee.R); });
    var maxY = Math.max.apply(null, pts.map(function (p) { return p.y; })) + 0.15;
    var minX = Math.min.apply(null, pts.map(function (p) { return p.x; })) - 0.2, maxX = Math.max.apply(null, pts.map(function (p) { return p.x; })) + 0.2;
    if (tw && !tw.compact) maxY = Math.max(maxY, 2.35);
    var cx = (minX + maxX) / 2, cy = cam.y != null ? cam.y : maxY / 2;
    var ext = Math.max(maxX - minX, maxY, 1.4);
    var dist = (ext / 2) / Math.tan(rad(15)) * 1.08 * (cam.dist || 1);
    var tgt = V(cx, cy, 0);
    camera.position.set(tgt.x + dist * Math.cos(rad(el)) * Math.sin(rad(az)), tgt.y + dist * Math.sin(rad(el)), tgt.z + dist * Math.cos(rad(el)) * Math.cos(rad(az)));
    camera.lookAt(tgt);

    var liftAt = d.liftAt == null ? 1 : d.liftAt;
    function handFrame(j, k) {
      var dir = j.handDir[k], n = j.palm[k];
      return { dir: dir, n: n, k: dir.clone().cross(n).normalize() };
    }
    function orientDumbbell(mesh, pos, axis) {
      mesh.position.copy(pos);
      mesh.quaternion.setFromUnitVectors(V(0, 0, 1), axis.clone().normalize());
    }

    var state = { j: null };
    function update(phase) {
      var pr = poseAt(d, phase), f = pr.f, u = pr.u;
      var A = f.arms || {};
      if (A.bar) {
        var j0 = solve(Object.assign({}, f, { arms: { ua: 0, fa: 0 } }));
        var bp, gw2 = 0.42, pole = [0, -1, 0.5], palm = 'pro';
        if (A.bar === 'back') { bp = j0.shoC.clone().add(j0.up.clone().multiplyScalar(0.03)).add(j0.fwd.clone().multiplyScalar(-0.075)); pole = [0, -1, 0.35]; }
        else { bp = j0.hip.clone().add(j0.fwd.clone().multiplyScalar(0.15)); gw2 = 0.4; }
        f = Object.assign({}, f, { arms: { ik: [bp.x, bp.y], gw: gw2, pole: pole, palm: palm } });
        f._bar = bp;
      }
      if (key === 'frontSquat' && eq === 'barbell') {
        var j1 = solve(Object.assign({}, f, { arms: { ua: 0, fa: 0 } }));
        var fb = j1.shoC.clone().add(j1.fwd.clone().multiplyScalar(0.11)).add(j1.up.clone().multiplyScalar(0.0));
        f = Object.assign({}, f, { arms: { ik: [fb.x, fb.y], gw: 0.22, pole: [1, 0.4, 0.4], palm: 'sup' } }); f._bar = fb;
      }
      var j = solve(f);
      state.j = j;
      poseBody(body, j);
      var lift = d.cyclic || d.keys ? 0 : (liftAt === 1 ? u : 1 - u);
      var hm = j.hand.L.clone().add(j.hand.R).multiplyScalar(0.5);

      if (bar) {
        var bpos = f._bar ? f._bar : hm;
        bar.position.copy(bpos);
        if (smithM) { smithM.group.position.x = bpos.x; smithM.carriage.position.y = bpos.y; }
      }
      if (dbs.length === 2) {
        ['L', 'R'].forEach(function (k, i) { var hf = handFrame(j, k); orientDumbbell(dbs[i], j.hand[k], hf.k); });
      } else if (dbs.length === 1) {
        if (d.load === 'handR' || d.load === 'handL') { var kk = d.load === 'handR' ? 'R' : 'L'; orientDumbbell(dbs[0], j.hand[kk], handFrame(j, kk).k); }
        else if (d.load === 'goblet') { dbs[0].position.copy(hm.clone().add(V(0, 0.05, 0))); dbs[0].quaternion.setFromUnitVectors(V(0, 0, 1), j.up); }
        else if (d.load === 'overhead') { dbs[0].position.copy(hm.clone().add(j.palm.R.clone().multiplyScalar(0.06))); dbs[0].quaternion.setFromUnitVectors(V(0, 0, 1), j.hand.R.clone().sub(j.el.R).normalize()); }
        else if (d.load === 'single') { dbs[0].position.copy(hm); dbs[0].quaternion.setFromUnitVectors(V(0, 0, 1), V(0, 0, 1)); }
        else dbs[0].position.copy(hm);
      }
      if (kb) {
        kb.position.copy(hm);
        kb.quaternion.setFromUnitVectors(V(0, -1, 0), hm.clone().sub(j.shoC).normalize());
      }
      if (handle) {
        if (d.load === 'ankle' || d.load === 'ankleSide') handle.position.copy(j.ank.R);
        else handle.position.copy(hm);
        if (d.load === 'seatedRow' || d.load === 'facePull') handle.quaternion.setFromUnitVectors(V(0, 0, 1), V(0, 1, 0));
      }
      // Máquinas con partes móviles
      if (eqp.roller) {
        var rp;
        if (sc.indexOf('legExt') >= 0) rp = j.ank.R.clone().add(j.knee.R.clone().sub(j.ank.R).normalize().multiplyScalar(0.06)).add(boneFront(j.knee.R, j.ank.R, j.fwd).multiplyScalar(0.06));
        else rp = j.ank.R.clone().add(j.knee.R.clone().sub(j.ank.R).normalize().multiplyScalar(0.07)).add(boneFront(j.knee.R, j.ank.R, j.fwd).multiplyScalar(-0.07));
        eqp.roller.position.set(rp.x, rp.y, 0);
        segment(eqp.lever, V(j.knee.R.x, j.knee.R.y, 0.3), V(rp.x, rp.y, 0.3));
      }
      if (eqp.handles) {
        var pivot = V(-0.15, 1.95, 0);
        [j.hand.L, j.hand.R].forEach(function (h, i) { eqp.handles[i].position.set(h.x, h.y, i ? 0.28 : -0.28); segment(eqp.arms[i], V(pivot.x, pivot.y, i ? 0.33 : -0.33), V(h.x, h.y, i ? 0.33 : -0.33)); });
      }
      if (eqp.kneePad) eqp.kneePad.position.set(j.knee.R.x - 0.02, j.knee.R.y + 0.09, 0);
      if (eqp.sled) {
        // la plataforma queda paralela a la planta del pie
        var mid2 = j.ank.R.clone().add(j.footDir.R.clone().multiplyScalar(0.07)).add(j.footUp.R.clone().multiplyScalar(-0.085));
        var nrm = j.footUp.R.clone().multiplyScalar(-1);
        eqp.sled.position.set(mid2.x + nrm.x * 0.025, mid2.y + nrm.y * 0.025, 0);
        eqp.sled.quaternion.setFromUnitVectors(V(1, 0, 0), nrm);
      }
      if (eqp.beltMarks) eqp.beltMarks.forEach(function (bmk, i) { var x = ((i / 6 - phase * 2) % 1 + 1) % 1; bmk.position.x = 0.78 - x * 1.6; });
      if (eqp.seat) eqp.seat.position.set(j.hip.x, 0.36, 0);
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
        var lift2 = lift;
        if (d.keys || d.cyclic) lift2 = 0;
        if (d.load === 'ankle' || d.load === 'ankleSide') lift2 = u;
        tw.stack.position.y = lift2 * 0.32;
        if (tw2) tw2.stack.position.y = lift2 * 0.32;
        var top = tw.top(), st = tw.stackTop();
        var target = handle ? handle.position.clone() : hm.clone();
        if (d.load === 'twinCable') {
          var t2 = tw2.top();
          segment(eqp.cables[0], top, j.hand.L); segment(eqp.cables[1], tw.stackTop(), top); eqp.cables[2].visible = false;
          segment(eqp.cables[3], t2, j.hand.R); segment(eqp.cables[4], tw2.stackTop(), t2); eqp.cables[5].visible = false;
        } else {
          var anchor;
          if (d.load === 'pulldown') anchor = V(0.2, 2.42, 0);
          else if (d.load === 'seatedRow') anchor = V(0.95, 0.82, 0);
          else if (d.load === 'facePull') anchor = V(0.72, 1.6, 0);
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
    return { scene: scene, camera: camera, update: update, label: '', state: state, def: d };
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
  function mount(canvas, key, eq, opts) {
    opts = opts || {};
    var r = makeRenderer(canvas), st = createStage(key, eq, opts.muscle);
    var T0 = null, period = opts.period || 3200;
    if ((P[key] || {}).cyclic) period = key === 'run' ? 900 : (key === 'jumpRope' ? 600 : (key === 'bike' ? 1200 : (key === 'walk' ? 1300 : 2600)));
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

  global.FORJA3D = { createStage: createStage, mount: mount, makeRenderer: makeRenderer,
    patterns: Object.keys(P).filter(function (k) { return k !== 'lateral'; }),
    label: function () { return ''; },
    _test: { P: P, solve: solve, poseAt: poseAt, mixVal: mixVal } };
})(typeof window !== 'undefined' ? window : globalThis);
