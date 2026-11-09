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
    j.shr = f.shr || 0;
    j.hip = V(f.hip[0], f.hip[1], 0);
    j.shoC = j.hip.clone().add(j.up.clone().multiplyScalar(SPINE)).add(j.fwd.clone().multiplyScalar(SHO_F));
    var hu = j.up.clone();
    if (f.head) hu = j.up.clone().multiplyScalar(Math.cos(rad(f.head))).add(j.fwd.clone().multiplyScalar(Math.sin(rad(f.head))));
    j.headUp = hu;
    j.headFwd = V(hu.y, -hu.x, 0);
    j.neck = j.shoC.clone().add(j.up.clone().multiplyScalar(0.09)).add(j.fwd.clone().multiplyScalar(0.03));
    j.head = j.neck.clone().add(hu.clone().multiplyScalar(0.15)).add(j.headFwd ? V(0, 0, 0) : V(0, 0, 0));
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
        ank = ball.clone().sub(footVec(bf).multiplyScalar(0.13)).add(footUp(bf).multiplyScalar(ANK));
      } else if (Lg.ik) ank = V(Lg.ik[0], Lg.ik[1], Lg.ik.length > 2 ? Lg.ik[2] * sg : sg * fw);
      else if (Lg.rel) ank = hp.clone().add(V(Lg.rel[0], Lg.rel[1], (Lg.rel[2] || 0) * sg));
      if (ank && !Lg.ball && ank.y < ANK) ank.y = ANK;
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
      j.footDir[k] = footDir; j.footUp[k] = fUp;
      j.toe[k] = j.ank[k].clone().add(footDir.clone().multiplyScalar(0.17)).add(fUp.clone().multiplyScalar(-ANK + 0.02));
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
  //  Ejercicios (v4, proporciones del modelo)
  //  A/B: inicio y posición de trabajo (subida, pausa, bajada lenta) · keys: secuencia cíclica suave (Catmull-Rom)
  // ---------------------------------------------------------------------------
  var STAND = [0, 0.97];
  var FEET = { ik: [0.0, ANK] };
  var HANG = -0.545; // mano colgando bajo el hombro
  var P = {};
  function def(k, o) { P[k] = o; }

  // ---- Piernas ----
  def('squat', { p: ['quads', 'glutes'], s: ['hams', 'lowback', 'abs'], load: 'back', scene: ['rack'], smith: true, cam: { az: 32 },
    A: { hip: STAND, torso: 4, legs: { ik: [0.02, ANK], fw: 0.16 }, arms: { bar: 'back' } },
    B: { hip: [-0.22, 0.52], torso: 40, head: -22, legs: { ik: [0.02, ANK], fw: 0.16 }, arms: { bar: 'back' } } });
  def('frontSquat', { p: ['quads'], s: ['glutes', 'abs'], load: 'goblet', cam: { az: 35 },
    A: { hip: STAND, torso: 3, legs: { ik: [0.02, ANK], fw: 0.16 }, arms: { relC: [0.18, -0.1], gw: 0.05, pole: [0, -1, 0.6], palm: [0, 0.3, -1] } },
    B: { hip: [-0.18, 0.5], torso: 20, head: -12, legs: { ik: [0.02, ANK], fw: 0.16 }, arms: { relC: [0.18, -0.1], gw: 0.05, pole: [0, -1, 0.6], palm: [0, 0.3, -1] } } });
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
  def('deadlift', { p: ['glutes', 'hams', 'lowback'], s: ['quads', 'traps', 'forearms', 'lats'], load: 'bar', cam: { az: 18 }, thumb: 0.05, keys: hingeKeys([[-0.34, 0.63, 75, 0.225], [-0.34, 0.76, 77, 0.33], [-0.33, 0.84, 74, 0.45], [-0.3, 0.9, 63, 0.58], [-0.27, 0.98, 56, 0.7], [-0.11, 0.98, 27, 0.82], [-0.02, 0.97, 2, 0.83]], 0.082) });
  def('rdl', { p: ['hams', 'glutes'], s: ['lowback'], load: 'bar', cam: { az: 18 }, thumb: 0.45, keys: hingeKeys([[-0.02, 0.97, 2, 0.83], [-0.15, 0.9, 33, 0.7], [-0.23, 0.9, 56, 0.6], [-0.27, 0.9, 73, 0.5], [-0.27, 0.87, 79, 0.43]], 0.085) });
  def('goodMorning', { p: ['hams', 'lowback'], s: ['glutes'], load: 'back', cam: { az: 20 },
    A: { hip: STAND, torso: 2, legs: { ik: [0.0, ANK], fw: 0.15 }, arms: { bar: 'back' } },
    B: { hip: [-0.19, 0.94], torso: 72, head: -28, legs: { ik: [0.0, ANK], fw: 0.15 }, arms: { bar: 'back' } } });
  // Zancada larga: pies juntos -> paso -> bajada -> subida -> vuelta. Mancuerna en la mano contraria.
  (function () {
    var hold = { rel: [0.02, HANG, 0.05], palm: 'neu' };
    var stand = { hip: [0, 0.97], torso: 0, legsL: { ball: [0.13, 0.0], foot: 0 }, legsR: { ik: [0, ANK] }, arms: hold };
    var lift = { hip: [0.08, 0.96], torso: 0, legsL: { ball: [0.13, 0.0], foot: 0 }, legsR: { ik: [0.38, 0.25] }, arms: hold };
    var plant = { hip: [0.33, 0.9], torso: 0, legsL: { ball: [0.13, 0.012], foot: 30 }, legsR: { ik: [0.78, ANK] }, arms: hold };
    var bottom = { hip: [0.35, 0.5], torso: 5, legsL: { ball: [0.13, 0.016], foot: 55 }, legsR: { ik: [0.78, ANK] }, arms: hold };
    def('lunge', { p: ['quads', 'glutes'], s: ['hams'], load: 'handL', cam: { az: 28 }, thumb: 0.45,
      keys: [[0, stand], [0.08, stand], [0.2, lift], [0.32, plant], [0.48, bottom], [0.56, bottom], [0.72, plant], [0.84, lift], [0.94, stand], [1, stand]] });
  })();
  def('legPress', { p: ['quads', 'glutes'], s: ['hams'], load: 'sled', scene: ['legPress'], cam: { dist: 1.0, az: 4 },
    A: { hip: [-0.32, 0.56], torso: -50, legs: { ik: [0.04, 0.88], fw: 0.15, foot: -135, pole: [-0.4, 1, 0.25] }, arms: { ik: [-0.22, 0.5], gw: 0.3, palm: 'neu' } },
    B: { hip: [-0.32, 0.56], torso: -50, legs: { ik: [0.3, 1.13], fw: 0.15, foot: -135, pole: [-0.4, 1, 0.25] }, arms: { ik: [-0.22, 0.5], gw: 0.3, palm: 'neu' } } });
  def('legExt', { p: ['quads'], load: 'machine', stack: true, scene: ['legExt'], machinePos: [-0.55, -0.62, 0], cam: { az: 35 },
    A: { hip: [-0.08, 0.58], torso: -10, legs: { th: 90, sh: 6, footRel: 0 }, arms: { ik: [0.0, 0.5], gw: 0.27, palm: 'neu' } },
    B: { hip: [-0.08, 0.58], torso: -10, legs: { th: 90, sh: 86, footRel: 0 }, arms: { ik: [0.0, 0.5], gw: 0.27, palm: 'neu' } } });
  def('legCurl', { p: ['hams'], s: ['calves'], load: 'machine', stack: true, scene: ['legCurl'], machinePos: [0.95, -0.55, 0], cam: { az: 22 },
    A: { hip: [-0.05, 0.6], torso: 90, head: -10, legs: { th: -90, sh: -92, footRel: 25, footFlip: true }, arms: { ik: [0.5, 0.48], gw: 0.24, palm: 'pro' } },
    B: { hip: [-0.05, 0.6], torso: 90, head: -10, legs: { th: -94, sh: -228, footRel: 25, footFlip: true }, arms: { ik: [0.5, 0.48], gw: 0.24, palm: 'pro' } } });
  def('calf', { p: ['calves'], load: 'hands', stack: true, scene: ['step'], cam: { az: 22 },
    A: { hip: [-0.07, 1.0], torso: 0, legs: { ball: [0.08, 0.105], foot: -22, fw: 0.11 }, arms: { rel: [0.02, HANG, 0.06], palm: 'neu' } },
    B: { hip: [0.02, 1.115], torso: 0, legs: { ball: [0.08, 0.105], foot: 38, fw: 0.11 }, arms: { rel: [0.02, HANG, 0.06], palm: 'neu' } } });
  def('seatedCalf', { p: ['calves'], load: 'plates', scene: ['seatedCalf'], cam: { az: 30 },
    A: { hip: [-0.24, 0.6], torso: 2, legs: { ball: [0.3, 0.205], foot: -18, fw: 0.12, pole: [1, 0.6, 0] }, arms: { ik: [0.12, 0.72], gw: 0.24, palm: 'pro' } },
    B: { hip: [-0.24, 0.6], torso: 2, legs: { ball: [0.3, 0.205], foot: 30, fw: 0.12, pole: [1, 0.6, 0] }, arms: { ik: [0.12, 0.78], gw: 0.24, palm: 'pro' } } });
  def('hipThrust', { p: ['glutes'], s: ['hams', 'quads'], load: 'hip', stack: true, scene: ['thrustBench'], cam: { az: 28 },
    A: { hip: [-0.12, 0.31], torso: -51, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { bar: 'hip' } },
    B: { hip: [-0.03, 0.62], torso: -98, legs: { ik: [0.38, ANK], fw: 0.16 }, arms: { bar: 'hip' } } });
  def('gluteKickback', { p: ['glutes'], s: ['hams'], load: 'ankle', stack: true, scene: ['towerFront'], cam: { az: 6 },
    A: { hip: [0, 0.95], torso: 32, legsL: FEET, legsR: { th: 6, sh: 4 }, arms: { ik: [0.45, 1.12], gw: 0.2, palm: 'pro' } },
    B: { hip: [0, 0.95], torso: 32, legsL: FEET, legsR: { th: -80, sh: -72 }, arms: { ik: [0.45, 1.12], gw: 0.2, palm: 'pro' } } });

  // ---- Pecho ----
  def('bench', { p: ['pecs'], s: ['triceps', 'delts'], load: 'bar', scene: ['bench', 'benchRack'], smith: true, liftAt: 0, cam: { y: 0.72 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ik: [-0.29, 1.0], gw: 0.42, palm: 'pro' } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ik: [-0.21, 0.71], gw: 0.42, palm: 'pro' } } });
  def('incline', { p: ['pecs', 'delts'], s: ['triceps'], load: 'bar', scene: ['inclineBench'], smith: true, liftAt: 0,
    A: { hip: [0.05, 0.56], torso: -52, legs: { ik: [0.52, ANK], fw: 0.22 }, arms: { ik: [-0.26, 1.25], gw: 0.4, palm: 'pro' } },
    B: { hip: [0.05, 0.56], torso: -52, legs: { ik: [0.52, ANK], fw: 0.22 }, arms: { ik: [-0.17, 0.92], gw: 0.4, palm: 'pro' } } });
  def('fly', { p: ['pecs'], s: ['delts'], load: 'hands', scene: ['bench'], liftAt: 0, cam: { y: 0.72, az: 50 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ik: [-0.3, 0.98, 0.12], pole: [0.4, -0.6, 0.5], palm: [0, 0, -1] } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ik: [-0.3, 0.66, 0.54], pole: [0.4, -0.6, 0.5], palm: [0, 1, -0.3] } } });
  def('pullover', { p: ['lats', 'pecs'], s: ['triceps'], load: 'single', scene: ['bench'], liftAt: 0, cam: { y: 0.72 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ua: 178, fa: 182, palm: [1, 0, 0] } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ua: 262, fa: 268, palm: [0, 1, 0] } } });
  // Press de pecho: palancas que salen desde abajo; agarres a la altura del pecho
  def('chestPress', { p: ['pecs'], s: ['triceps', 'delts'], load: 'machine', stack: true, scene: ['chestPress'], machinePos: [-0.72, -0.5, 0], cam: { az: 38 },
    A: { hip: [-0.1, 0.56], torso: -8, legs: { ik: [0.36, ANK], fw: 0.16 }, arms: { ik: [0.05, 0.88], gw: 0.27, pole: [-1, -0.5, 0.45], palm: [0, 0, -1] } },
    B: { hip: [-0.1, 0.56], torso: -8, legs: { ik: [0.36, ANK], fw: 0.16 }, arms: { ik: [0.31, 0.9], gw: 0.24, pole: [-1, -0.5, 0.45], palm: [0, 0, -1] } } });
  // Cruce de poleas: cada mano con su agarre (unilateral); los brazos siempre por delante del cuerpo
  def('cableFly', { p: ['pecs'], s: ['delts'], load: 'twinCable', stack: true, cam: { az: 55, dist: 1.1 },
    A: { hip: [0, 0.96], torso: 14, legsL: { ik: [-0.18, ANK] }, legsR: { ik: [0.22, ANK] }, arms: { ik: [0.24, 1.36, 0.58], pole: [-0.3, -0.7, 0.6], palm: [0.3, 0, -1] } },
    B: { hip: [0, 0.96], torso: 14, legsL: { ik: [-0.18, ANK] }, legsR: { ik: [0.22, ANK] }, arms: { ik: [0.47, 1.08, 0.07], pole: [-0.3, -0.7, 0.6], palm: [0, 0, -1] } } });
  def('dip', { p: ['triceps', 'pecs'], s: ['delts'], load: 'none', scene: ['dipStation'], liftAt: 0,
    A: { hip: [-0.02, 1.38], torso: 6, legs: { rel: [-0.26, -0.7], pole: [1, 0, 0] }, arms: { ik: [0.0, 1.26], gw: 0.25, pole: [-1, 0, 0.2], palm: 'neu' } },
    B: { hip: [-0.07, 1.06], torso: 22, legs: { rel: [-0.26, -0.7], pole: [1, 0, 0] }, arms: { ik: [0.0, 1.26], gw: 0.25, pole: [-1, 0, 0.2], palm: 'neu' } } });
  // Flexiones: cuerpo recto (piernas alineadas con el tronco), codos hacia atrás
  def('pushup', { p: ['pecs', 'triceps'], s: ['delts', 'abs'], load: 'none', liftAt: 0, cam: { y: 0.4, az: 30 },
    A: { hip: [-0.08, 0.425], torso: 68, legs: { ik: [-0.92, 0.17], fw: 0.1, foot: 65, pole: [0, -1, 0] }, arms: { ik: [0.33, 0.06], gw: 0.29, pole: [-1, 0.3, 0.45], hand: 'flat', flatDir: [1, 0, 0.15] } },
    B: { hip: [-0.03, 0.27], torso: 81, legs: { ik: [-0.92, 0.17], fw: 0.1, foot: 65, pole: [0, -1, 0] }, arms: { ik: [0.33, 0.06], gw: 0.29, pole: [-1, 0.3, 0.45], hand: 'flat', flatDir: [1, 0, 0.15] } } });

  // ---- Espalda ----
  def('row', { p: ['lats', 'traps'], s: ['biceps', 'delts', 'lowback'], load: 'bar',
    A: { hip: [-0.15, 0.87], torso: 64, head: -28, legs: FEET, arms: { ik: [0.2, 0.55], gw: 0.27, pole: [-1, 0.5, 0.4], palm: 'pro' } },
    B: { hip: [-0.15, 0.87], torso: 64, head: -28, legs: FEET, arms: { ik: [0.09, 0.79], gw: 0.27, pole: [-1, 0.5, 0.4], palm: 'pro' } } });
  def('dbRow', { p: ['lats'], s: ['biceps', 'traps'], load: 'handR', scene: ['rowBench'], cam: { az: 25 },
    A: { hip: [-0.1, 0.97], torso: 82, head: -20, legsL: { ik: [-0.52, 0.53], pole: [0, -1, 0] }, legsR: { ik: [0.0, ANK, 0.34] },
      armsL: { ik: [0.4, 0.5, 0.2], hand: 'flat', flatDir: [1, 0, 0] }, armsR: { ik: [0.31, 0.54, 0.24], pole: [-1, 0.6, 0.35], palm: 'neu' } },
    B: { hip: [-0.1, 0.97], torso: 82, head: -20, legsL: { ik: [-0.52, 0.53], pole: [0, -1, 0] }, legsR: { ik: [0.0, ANK, 0.34] },
      armsL: { ik: [0.4, 0.5, 0.2], hand: 'flat', flatDir: [1, 0, 0] }, armsR: { ik: [0.07, 0.9, 0.25], pole: [-1, 0.6, 0.35], palm: 'neu' } } });
  // Jalón: visto por detrás, polea delante; la barra baja hasta la parte alta del pecho
  def('pulldown', { p: ['lats'], s: ['biceps', 'traps'], load: 'pulldown', stack: true, scene: ['pulldown'], cam: { az: -128, el: 14 },
    A: { hip: [0, 0.57], torso: -8, legs: { ik: [0.42, ANK], fw: 0.16 }, arms: { relC: [0.12, 0.44], gw: 0.42, pole: [0, -1, 0.6], palm: 'pro' } },
    B: { hip: [0, 0.57], torso: -20, head: 10, legs: { ik: [0.42, ANK], fw: 0.16 }, arms: { relC: [0.2, 0.03], gw: 0.42, pole: [0, -1, 0.6], palm: 'pro' } } });
  // Dominadas: la barra llega a la altura de las clavículas
  def('pullup', { p: ['lats'], s: ['biceps', 'forearms'], load: 'none', scene: ['pullFrame'], cam: { az: -140, el: 10 },
    A: { hip: [-0.03, 1.32], torso: 0, legs: { rel: [-0.2, -0.8], fw: 0.06 }, arms: { ik: [0.0, 2.22], gw: 0.4, pole: [0.2, -1, 0.7], palm: 'pro' } },
    B: { hip: [-0.07, 1.78], torso: -10, head: 8, legs: { rel: [-0.2, -0.8], fw: 0.06 }, arms: { ik: [0.0, 2.22], gw: 0.4, pole: [0.2, -1, 0.7], palm: 'pro' } } });
  // Remo sentado: codos por fuera del cuerpo, el agarre llega al abdomen
  def('seatedRow', { p: ['lats', 'traps'], s: ['biceps'], load: 'seatedRow', stack: true, scene: ['seatedRow'], cam: { az: 28 },
    A: { hip: [-0.38, 0.45], torso: 16, legs: { ik: [0.3, 0.33], fw: 0.14, foot: -72, pole: [0.2, 1, 0.2] }, arms: { ik: [0.2, 0.8], gw: 0.06, pole: [-1, -0.4, 0.8], palm: 'neu' } },
    B: { hip: [-0.38, 0.45], torso: -4, legs: { ik: [0.3, 0.33], fw: 0.14, foot: -72, pole: [0.2, 1, 0.2] }, arms: { ik: [-0.22, 0.76], gw: 0.07, pole: [-1, -0.4, 0.8], palm: 'neu' } } });
  // Face pull: los codos quedan por debajo de las manos (rotación externa)
  def('facePull', { p: ['delts', 'traps'], s: ['biceps'], load: 'facePull', stack: true, scene: ['towerFront'], cam: { az: 6 },
    A: { hip: [-0.05, 0.96], torso: -3, legsL: { ik: [-0.2, ANK] }, legsR: { ik: [0.12, ANK] }, arms: { ik: [0.4, 1.47], gw: 0.08, pole: [-0.5, -0.8, 0.6], palm: 'neu' } },
    B: { hip: [-0.05, 0.96], torso: -3, legsL: { ik: [-0.2, ANK] }, legsR: { ik: [0.12, ANK] }, arms: { ik: [0.06, 1.52], gw: 0.27, pole: [-0.5, -0.8, 0.6], palm: 'neu' } } });
  def('hyperext', { p: ['lowback', 'glutes'], s: ['hams'], load: 'none', scene: ['hyperBench'], cam: { az: 12 },
    A: { hip: [0, 0.98], torso: 132, legs: { ik: [-0.58, 0.38], fw: 0.1 }, arms: { temple: 1, pole: [0, 0.3, 1] } },
    B: { hip: [0, 0.98], torso: 48, legs: { ik: [-0.58, 0.38], fw: 0.1 }, arms: { temple: 1, pole: [0, 0.3, 1] } } });
  def('shrug', { p: ['traps'], s: ['forearms'], load: 'handsFront', stack: true, cam: { az: 55 },
    A: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.05, HANG, 0.06], palm: 'pro' }, shr: 0 },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.05, HANG, 0.06], palm: 'pro' }, shr: 0.055 } });

  // ---- Hombros ----
  def('ohp', { p: ['delts'], s: ['triceps', 'traps'], load: 'bar', stack: true,
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ik: [0.1, 1.42], gw: 0.27, pole: [0.4, -1, 0.5], palm: 'pro' } },
    B: { hip: STAND, torso: -2, legs: FEET, arms: { ik: [0.0, 1.88], gw: 0.27, pole: [0.4, -1, 0.5], palm: 'pro' } } });
  def('lateralRaise', { p: ['delts'], s: ['traps'], load: 'hands', stack: true, cam: { az: 70 },
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 8, fa: 12, plane: 'f', palm: [0, 0, -1] } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 85, fa: 92, plane: 'f', palm: [0, -1, -0.15] } } });
  def('frontRaise', { p: ['delts'], s: ['traps'], load: 'hands', stack: true, cam: { az: 28 },
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 4, fa: 9, palm: 'pro' } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 88, fa: 94, palm: 'pro' } } });
  P.lateral = P.frontRaise;
  def('uprightRow', { p: ['delts', 'traps'], s: ['biceps'], load: 'handsFront', stack: true, cam: { az: 62 },
    A: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.06, HANG, -0.05], pole: [0, 1, 1], palm: 'pro' } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.13, -0.1, -0.05], pole: [-0.2, 1, 1.3], palm: 'pro' } } });

  // ---- Brazos ----
  def('curl', { p: ['biceps'], s: ['forearms'], load: 'hands', stack: true,
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 2, fa: 4, palm: 'sup' } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 10, fa: 150, palm: 'sup' } } });
  def('preacherCurl', { p: ['biceps'], s: ['forearms'], load: 'hands', stack: true, scene: ['preacher'], cam: { az: 68 },
    A: { hip: [-0.12, 0.6], torso: 0, legs: { ik: [0.28, ANK], fw: 0.16 }, arms: { ua: 58, fa: 64, palm: 'sup' } },
    B: { hip: [-0.12, 0.6], torso: 0, legs: { ik: [0.28, ANK], fw: 0.16 }, arms: { ua: 58, fa: 168, palm: 'sup' } } });
  def('pushdown', { p: ['triceps'], load: 'pushdown', stack: true, scene: ['towerFront'], cam: { az: 6 },
    A: { hip: [-0.05, 0.96], torso: 10, legs: FEET, arms: { ua: -6, fa: 105, palm: 'pro' } },
    B: { hip: [-0.05, 0.96], torso: 10, legs: FEET, arms: { ua: -6, fa: 4, palm: 'pro' } } });
  // Extensión sobre la cabeza: ambas manos sujetan la mancuerna por el disco superior
  def('ohExt', { p: ['triceps'], load: 'overhead', stack: true, liftAt: 0, cam: { az: 25 },
    A: { hip: STAND, torso: 0, legs: FEET, arms: { relC: [0.02, 0.52], gw: 0.035, pole: [0.5, 1, 0.35], palm: [0, 1, 0] } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { relC: [-0.16, 0.17], gw: 0.035, pole: [0.5, 1, 0.35], palm: [0, 1, 0] } } });
  def('skullCrusher', { p: ['triceps'], load: 'bar', scene: ['bench'], liftAt: 0, cam: { y: 0.72 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ua: 170, fa: 175, palm: 'pro' } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.55, ANK], fw: 0.24 }, arms: { ua: 170, fa: 285, palm: 'pro' } } });
  // Patada de tríceps: brazo por fuera de la pierna, codo alto y fijo
  def('kickback', { p: ['triceps'], load: 'handR', stack: true, scene: ['rowBench'], cam: { az: 25 },
    A: { hip: [-0.1, 0.97], torso: 82, head: -20, legsL: { ik: [-0.52, 0.53], pole: [0, -1, 0] }, legsR: { ik: [0.02, ANK, 0.38] },
      armsL: { ik: [0.4, 0.5, 0.2], hand: 'flat', flatDir: [1, 0, 0] }, armsR: { rel: [-0.2, -0.3, 0.06], pole: [0, 1, 0.3], palm: 'neu' } },
    B: { hip: [-0.1, 0.97], torso: 82, head: -20, legsL: { ik: [-0.52, 0.53], pole: [0, -1, 0] }, legsR: { ik: [0.02, ANK, 0.38] },
      armsL: { ik: [0.4, 0.5, 0.2], hand: 'flat', flatDir: [1, 0, 0] }, armsR: { rel: [-0.53, -0.07, 0.07], pole: [0, 1, 0.3], palm: 'neu' } } });

  // ---- Core ----
  def('plank', { p: ['abs'], s: ['delts', 'glutes'], load: 'none', scene: ['mat'], cam: { y: 0.3 },
    A: { hip: [-0.3, 0.26], torso: 82, head: -10, legs: { ik: [-1.17, 0.17], fw: 0.1, foot: 65, pole: [0, -1, 0] }, arms: { ua: 0, fa: 90, palm: [0, -1, -0.5] } },
    B: { hip: [-0.3, 0.272], torso: 82, head: -10, legs: { ik: [-1.17, 0.17], fw: 0.1, foot: 65, pole: [0, -1, 0] }, arms: { ua: 0, fa: 90, palm: [0, -1, -0.5] } } });
  def('crunch', { p: ['abs'], load: 'none', stack: true, scene: ['mat'], cam: { y: 0.35, az: 35 },
    A: { hip: [0, 0.12], torso: -90, legs: { ik: [0.5, ANK], fw: 0.15 }, arms: { temple: 1, pole: [0.3, 0.2, 1], palm: [0, 0, -1] } },
    B: { hip: [0, 0.12], torso: -64, head: 12, legs: { ik: [0.5, ANK], fw: 0.15 }, arms: { temple: 1, pole: [0.3, 0.2, 1], palm: [0, 0, -1] } } });
  // Elevación de piernas: los pies mantienen la misma posición respecto a la pierna
  def('legRaise', { p: ['abs'], load: 'none', scene: ['mat'], cam: { y: 0.4 },
    A: { hip: [0, 0.12], torso: -90, legs: { th: 86, sh: 87, footRel: 25 }, arms: { ua: 88, fa: 88, palm: [0, -1, 0] } },
    B: { hip: [0, 0.12], torso: -90, legs: { th: 178, sh: 180, footRel: 25 }, arms: { ua: 88, fa: 88, palm: [0, -1, 0] } } });
  def('hangLeg', { p: ['abs'], s: ['forearms'], load: 'none', scene: ['pullFrame'],
    A: { hip: [-0.02, 1.32], torso: 0, legs: { th: 4, sh: 0, footRel: 20 }, arms: { ik: [0.0, 2.22], gw: 0.4, straight: 1, palm: 'pro' } },
    B: { hip: [0.0, 1.32], torso: -6, legs: { th: 92, sh: 92, footRel: 20 }, arms: { ik: [0.0, 2.22], gw: 0.4, straight: 1, palm: 'pro' } } });

  // ---- Frontales / cuerpo completo ----
  def('abduction', { p: ['glutes'], load: 'ankleSide', stack: true, scene: ['towerSide'], cam: { az: 70 },
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
  def('jumpRope', { p: ['calves'], s: ['delts', 'forearms'], load: 'rope', cyclic: 'jumpRope', cam: { az: 62 } });

  var BELT = 0.14;
  // Marcha: en el apoyo el pie va hacia atrás pegado al suelo; en el vuelo se levanta y avanza
  function gaitAnkle(w, stride, lift, base) {
    var c = Math.cos(w), s = Math.sin(w);
    return [stride * c + 0.02, base + (s < 0 ? lift * Math.pow(-s, 1.3) : 0)];
  }
  function cyclicPose(kind, ph) {
    var w = ph * Math.PI * 2;
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
      return { hip: [-0.3, 0.98], torso: 28, legsR: { ik: [pr[0] - 0.03, pr[1] + 0.03], fw: 0.11 }, legsL: { ik: [pl[0] - 0.03, pl[1] + 0.03], fw: 0.11 },
        arms: { ik: [0.34, 1.18], gw: 0.22, palm: 'pro' }, pedals: [pr, pl, cr] };
    }
    if (kind === 'rowErg') {
      var u;
      if (ph < 0.4) u = ph / 0.4; else if (ph < 0.48) u = 1; else u = 1 - (ph - 0.48) / 0.52;
      var legs = smooth(clamp(u / 0.55, 0, 1)), back = smooth(clamp((u - 0.35) / 0.35, 0, 1)), arms = smooth(clamp((u - 0.55) / 0.45, 0, 1));
      if (ph >= 0.48) { var v = 1 - u; arms = 1 - smooth(clamp(v / 0.35, 0, 1)); back = 1 - smooth(clamp((v - 0.2) / 0.35, 0, 1)); legs = 1 - smooth(clamp((v - 0.4) / 0.6, 0, 1)); }
      // en el agarre (catch) las rodillas quedan junto al pecho sin atravesarlo
      var hx = lerp(0.02, -0.42, legs), tor = lerp(24, -18, back);
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
    if (d.cyclic) return { f: cyclicPose(d.cyclic, phase), u: 0 };
    if (d.keys) return { f: keyPose(d.keys, phase), u: 0 };
    var u = tempo(phase);
    return { f: mixVal(d.A, d.B, u), u: u };
  }

  // ---------------------------------------------------------------------------
  //  Modelo humano (Mixamo): esqueleto movido por la cinemática + músculos en la piel
  // ---------------------------------------------------------------------------
  var MODEL = null, MODEL_SCALE = 0.97 / 116.5, MUSCLE_CACHE = null;
  var MUSCLE_IDS = { none: 0, pecs: 1, abs: 2, lats: 3, traps: 4, lowback: 5, glutes: 6, delts: 7, biceps: 8, triceps: 9, forearms: 10, quads: 11, hams: 12, calves: 13 };
  function boneKey(name) { return name.replace(/^mixamorig[:_]?/i, ''); }

  // Clasifica cada vértice del modelo en reposo según el hueso dominante y su posición (delante/detrás)
  function classifyMuscles(root) {
    root.updateMatrixWorld(true);
    var bonePos = {};
    root.traverse(function (o) { if (o.isBone) bonePos[boneKey(o.name)] = new T.Vector3().setFromMatrixPosition(o.matrixWorld); });
    function bp(n) { return bonePos[n] || new T.Vector3(); }
    function along(p, a, b) { var d = b.clone().sub(a), L2 = d.lengthSq() || 1; var t = clamp(p.clone().sub(a).dot(d) / L2, 0, 1); return { t: t, c: a.clone().add(d.multiplyScalar(t)) }; }
    var cache = {};
    root.traverse(function (m) {
      if (!m.isSkinnedMesh) return;
      var g = m.geometry, pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
      var ids = new Uint8Array(pos.count), v = new T.Vector3();
      var bones = m.skeleton.bones.map(function (b) { return boneKey(b.name); });
      for (var i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        var best = 0, bw = -1;
        for (var k = 0; k < 4; k++) { var w = [sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)][k]; if (w > bw) { bw = w; best = [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)][k]; } }
        var bn = bones[best] || '', id = 0, side = bn.indexOf('Left') === 0 ? 'Left' : 'Right';
        var dz;
        if (/^Spine2$/.test(bn)) { var sp2 = bp('Spine2'); dz = v.z - sp2.z; id = dz > 4 ? (v.y < 168 ? 1 : 4) : (v.y > sp2.y + 6 ? 4 : 3); }
        else if (/^Spine1$/.test(bn)) { dz = v.z - bp('Spine1').z; id = dz > 3 ? 2 : (Math.abs(v.x) > 8 ? 3 : 5); }
        else if (/^Spine$/.test(bn)) { dz = v.z - bp('Spine').z; id = dz > 3 ? 2 : 5; }
        else if (/^Hips$/.test(bn)) { dz = v.z - bp('Hips').z; id = dz < -3 ? 6 : (dz > 4 && v.y > bp('Hips').y - 6 ? 2 : 0); }
        else if (/^Neck$/.test(bn)) { id = v.z < bp('Neck').z ? 4 : 0; }
        else if (/Shoulder$/.test(bn)) { id = Math.abs(v.x) < 15 && v.y > bp(side + 'Shoulder').y - 3 ? 4 : 7; }
        else if (/Arm$/.test(bn) && !/ForeArm/.test(bn)) {
          var a1 = along(v, bp(side + 'Arm'), bp(side + 'ForeArm'));
          id = a1.t < 0.3 ? 7 : (v.z > a1.c.z ? 8 : 9);
        }
        else if (/ForeArm$/.test(bn)) { var a2 = along(v, bp(side + 'ForeArm'), bp(side + 'Hand')); id = a2.t < 0.75 ? 10 : 0; }
        else if (/UpLeg$/.test(bn)) {
          var a3 = along(v, bp(side + 'UpLeg'), bp(side + 'Leg'));
          if (v.z > a3.c.z + 1) id = a3.t < 0.95 ? 11 : 0;
          else id = (a3.t < 0.18 && v.z < a3.c.z - 3) ? 6 : (a3.t < 0.9 ? 12 : 0);
        }
        else if (/Leg$/.test(bn)) { var a4 = along(v, bp(side + 'Leg'), bp(side + 'Foot')); id = (v.z < a4.c.z && a4.t < 0.65) ? 13 : 0; }
        ids[i] = id;
      }
      cache[m.name] = ids;
    });
    return cache;
  }
  function setModel(scene) {
    MODEL = scene;
    MODEL.traverse(function (o) { if (o.isSkinnedMesh) o.frustumCulled = false; });
    MUSCLE_CACHE = classifyMuscles(MODEL);
  }

  var _q1 = new T.Quaternion(), _q2 = new T.Quaternion(), _m1 = new T.Matrix4();
  function frameQuat(d, s) {
    var a = d.clone().normalize(), b = s.clone().sub(a.clone().multiplyScalar(s.dot(a)));
    if (b.lengthSq() < 1e-8) b = Math.abs(a.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0), b.sub(a.clone().multiplyScalar(b.dot(a)));
    b.normalize(); var c = a.clone().cross(b);
    _m1.makeBasis(a, b, c); return new T.Quaternion().setFromRotationMatrix(_m1);
  }
  function perp(v, axis) { return v.clone().sub(axis.clone().multiplyScalar(v.dot(axis))); }

  function makeModelBody(scene, active) {
    var inst = T.SkeletonUtils.clone(MODEL);
    var wrap = new T.Group(); wrap.rotation.y = Math.PI / 2; wrap.scale.setScalar(MODEL_SCALE); wrap.add(inst); scene.add(wrap);
    var bones = {}, meshes = [];
    inst.traverse(function (o) { if (o.isBone) bones[boneKey(o.name)] = o; if (o.isSkinnedMesh) meshes.push(o); });
    // Colores por vértice: piel neutra; músculos activos en rojo / naranja
    var base = new T.Color(0xe7e8ec), red = new T.Color(0xd8262d), orange = new T.Color(0xee8a2e);
    var pid = active.p.map(function (m) { return MUSCLE_IDS[m]; }), sid = active.s.map(function (m) { return MUSCLE_IDS[m]; });
    meshes.forEach(function (m) {
      var eyes = /eye|head/i.test(m.name) && !/body|layer/i.test(m.name);
      var g = m.geometry.clone(); m.geometry = g;
      var ids = MUSCLE_CACHE[m.name] || new Uint8Array(g.attributes.position.count);
      var col = new Float32Array(ids.length * 3);
      for (var i = 0; i < ids.length; i++) {
        var c = pid.indexOf(ids[i]) >= 0 && ids[i] ? red : (sid.indexOf(ids[i]) >= 0 && ids[i] ? orange : base);
        if (eyes) c = new T.Color(0xc9ccd3);
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
    function worldPos(name) { return new T.Vector3().setFromMatrixPosition(bones[name].matrixWorld); }

    function pose(j) {
      var Rt = frameQuat(j.up, j.fwd).multiply(R0torso);
      // cadera (raíz)
      var hips = bones.Hips;
      var hp = j.hip.clone().add(hipsOff.clone().applyQuaternion(Rt));
      hips.parent.updateMatrixWorld(true);
      hips.position.copy(hips.parent.worldToLocal(hp));
      rot('Hips', Rt); rot('Spine', Rt); rot('Spine1', Rt); rot('Spine2', Rt);
      var Rh = frameQuat(j.headUp, j.headFwd).multiply(R0torso);
      rot('Neck', Rt.clone().slerp(Rh, 0.5)); rot('Head', Rh);
      ['Left', 'Right'].forEach(function (S) {
        var k = S === 'Left' ? 'L' : 'R';
        // clavícula: apunta al hombro (encogimientos)
        var shB = worldPos(S + 'Shoulder');
        aim(S + 'Shoulder', S + 'Arm', j.sho[k].clone().sub(shB), V(0, 1, 0), j.up);
        var a0 = worldPos(S + 'Arm'), el = j.el[k], hand = j.hand[k];
        var fdir = hand.clone().sub(el).normalize(), udir = el.clone().sub(a0).normalize();
        var wrist = el.clone().add(fdir.clone().multiplyScalar(FAW));
        // brazo: el plano de flexión del codo
        var bend = perp(fdir, udir), bend0 = perp(rp(S + 'Hand').clone().sub(rp(S + 'ForeArm')).normalize(), rp(S + 'ForeArm').clone().sub(rp(S + 'Arm')).normalize());
        if (bend.length() < 0.25) { bend = perp(j.palm[k], udir); bend0 = perp(palm0[S], rp(S + 'ForeArm').clone().sub(rp(S + 'Arm')).normalize()); }
        aim(S + 'Arm', S + 'ForeArm', udir, bend0, bend);
        aim(S + 'ForeArm', S + 'Hand', fdir, palm0[S], j.palm[k]);
        aim(S + 'Hand', S + 'HandMiddle1', j.handDir[k], palm0[S], j.palm[k]);
        // dedos: puño al agarrar, abiertos con la mano plana
        var fist = j.handMode[k] !== 'flat';
        var knuckle = j.handDir[k].clone().cross(j.palm[k]).normalize();
        ['Index', 'Middle', 'Ring', 'Pinky'].forEach(function (F) {
          var curl = 0;
          [1, 2, 3].forEach(function (i, n) {
            curl += fist ? [35, 80, 70][n] : [4, 4, 4][n];
            var dirF = j.handDir[k].clone().applyAxisAngle(knuckle, -rad(curl));
            var nrm = j.palm[k].clone().applyAxisAngle(knuckle, -rad(curl));
            aim(S + 'Hand' + F + i, S + 'Hand' + F + (i + 1), dirF, palm0[S], nrm);
          });
        });
        // pulgar acompaña a la mano y se cierra un poco en el puño
        var Rhand = frameQuat(j.handDir[k], j.palm[k]).multiply(frameQuat(rp(S + 'HandMiddle1').clone().sub(rp(S + 'Hand')).normalize(), palm0[S]).invert());
        ['Thumb1', 'Thumb2', 'Thumb3'].forEach(function (t, n) {
          var extra = new T.Quaternion().setFromAxisAngle(j.handDir[k], (S === 'Left' ? 1 : -1) * rad(fist ? 18 * (n + 1) : 0));
          rot(S + 'Hand' + t, extra.multiply(Rhand));
        });
        // piernas: la rodilla mira hacia la punta del pie
        var ul = worldPos(S + 'UpLeg'), kn = j.knee[k], an = j.ank[k], fd = j.footDir[k], fu = j.footUp[k];
        var foot0 = rp(S + 'ToeBase').clone().sub(rp(S + 'Foot')); foot0.y = 0; foot0.normalize();
        aim(S + 'UpLeg', S + 'Leg', kn.clone().sub(ul), foot0, fd);
        aim(S + 'Leg', S + 'Foot', an.clone().sub(worldPos(S + 'Leg')), foot0, fd);
        var tb0 = rp(S + 'ToeBase').clone().sub(rp(S + 'Foot'));
        var a = tb0.dot(foot0), bcomp = tb0.y;
        var tb1 = fd.clone().multiplyScalar(a).add(fu.clone().multiplyScalar(bcomp));
        aim(S + 'Foot', S + 'ToeBase', tb1, V(0, 1, 0), fu);
        var Rf = frameQuat(fd, fu).multiply(frameQuat(foot0, V(0, 1, 0)).invert());
        rot(S + 'ToeBase', Rf);
      });
    }
    return { pose: pose, wrap: wrap };
  }

  // ---------------------------------------------------------------------------
  //  Escena
  // ---------------------------------------------------------------------------
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
    var cableLoads = ['pulldown', 'seatedRow', 'facePull', 'pushdown', 'twinCable', 'ankle', 'ankleSide'];
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
      var hpad = jR.hipJ.R.clone().add(th.clone().multiplyScalar(0.27)).add(tf.clone().multiplyScalar(0.11)); hpad.z = 0;
      padAlong(hpad, th, 0.22, 0.07, 0.42);
      var sv = jR.ank.R.clone().sub(jR.knee.R).normalize(), sb = boneFront(jR.knee.R, jR.ank.R, jR.fwd).multiplyScalar(-1);
      var fp = jR.ank.R.clone().add(sv.clone().multiplyScalar(-0.06)).add(sb.clone().multiplyScalar(0.07)); fp.z = 0;
      cylZ(G, 0.045, 0.4, M.pad, fp.x, fp.y, 0);
      beam(G, V(hpad.x - 0.05, hpad.y - 0.08, 0), V(fp.x, 0.05, 0), 0.06, M.frame);
      beam(G, V(hpad.x, hpad.y - 0.06, 0), V(hpad.x + 0.1, 0.03, 0), 0.06, M.frame);
      box(G, 1.2, 0.04, 0.5, M.frame, (hpad.x + fp.x) / 2, 0.02, 0);
    }
    if (sc.indexOf('preacher') >= 0) {
      var ua = jR.el.R.clone().sub(jR.sho.R).normalize(), uf = boneFront(jR.sho.R, jR.el.R, jR.fwd);
      var pc = jR.sho.R.clone().lerp(jR.el.R, 0.95).add(uf.clone().multiplyScalar(-0.07)); pc.z = 0;
      padAlong(pc, ua, 0.16, 0.05, 0.46);
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
      solid(box(G, 1.25, 0.08, 0.38, M.pad, 0.15, cy, 0)); legs4(-0.35, 0.65, -0.12, 0.12, cy - 0.04);
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
      [-1, 1].forEach(function (sg) { var fpl = box(G, 0.05, 0.3, 0.16, M.frameLight, jR.ank.R.x + 0.07, 0.38, sg * 0.14); fpl.rotation.z = rad(-18); });
      box(G, 0.08, 0.5, 0.2, M.frame, 0.88, 0.45, 0);
    }
    if (sc.indexOf('seatedCalf') >= 0) {
      box(G, 0.2, 0.2, 0.55, M.rubber, jR.ank.R.x + 0.16, 0.1, 0);
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
      box(G, 1.8, 0.12, 0.8, M.frame, -0.02, 0.06, 0); box(G, 1.62, 0.02, 0.62, M.belt, -0.02, 0.13, 0);
      [-1, 1].forEach(function (sg) { box(G, 1.8, 0.03, 0.08, M.frameLight, -0.02, 0.135, sg * 0.36); var up = box(G, 0.05, 1.2, 0.05, M.frame, 0.72, 0.68, sg * 0.36); up.rotation.z = rad(-10); });
      box(G, 0.25, 0.12, 0.8, M.frame, 0.83, 1.28, 0);
      eqp.beltMarks = [];
      for (var bm = 0; bm < 8; bm++) eqp.beltMarks.push(box(G, 0.025, 0.004, 0.6, M.frameLight, 0, 0.142, 0));
    }
    if (sc.indexOf('bike') >= 0) {
      box(G, 1.1, 0.05, 0.45, M.frame, 0.0, 0.025, 0);
      var post = box(G, 0.06, 0.95, 0.06, M.frame, -0.22, 0.5, 0); post.rotation.z = rad(16);
      var fr = box(G, 0.06, 1.2, 0.06, M.frame, 0.3, 0.62, 0); fr.rotation.z = rad(-20);
      box(G, 0.3, 0.06, 0.18, M.pad, jR.hip.x, jR.hip.y - SEAT - 0.03, 0);
      cylZ(G, 0.018, 0.5, M.metal, 0.36, 1.16, 0);
      var fly = cylZ(G, 0.26, 0.06, M.plate, 0.48, 0.42, 0); fly.geometry = new T.CylinderGeometry(0.26, 0.26, 0.06, 40);
      eqp.crank = new T.Group(); G.add(eqp.crank);
    }
    if (sc.indexOf('rower') >= 0) {
      box(G, 2.2, 0.05, 0.16, M.frame, 0.05, 0.3, 0); box(G, 0.08, 0.28, 0.4, M.frame, -0.95, 0.14, 0);
      box(G, 0.12, 0.62, 0.44, M.frame, 1.05, 0.31, 0);
      var fw = cylZ(G, 0.25, 0.14, M.plate, 1.08, 0.66, 0); fw.geometry = new T.CylinderGeometry(0.25, 0.25, 0.14, 40);
      [-1, 1].forEach(function (sg) { var fpl = box(G, 0.04, 0.3, 0.14, M.frameLight, 0.74, 0.42, sg * 0.12); fpl.rotation.z = rad(-28); });
      eqp.seat = box(G, 0.3, 0.06, 0.3, M.pad, 0, 0.36 - SEAT + 0.02, 0);
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
    var bar = null, dbs = [], kb = null, handle = null, handles2 = null, rope = null, smithM = null;
    var barLoads = ['bar', 'back', 'hip', 'handsFront', 'hands', 'overhead'];
    if (barMode && barLoads.indexOf(d.load) >= 0) bar = barbell(scene);
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
    if (d.load === 'twinCable') handles2 = [dHandle(), dHandle()];
    else if ((tw && !tw.compact) || d.load === 'pulldown') {
      handle = new T.Group(); scene.add(handle);
      var hw = d.load === 'pulldown' ? 1.1 : (d.load === 'pushdown' ? 0.34 : (d.load === 'seatedRow' ? 0.16 : 0.12));
      cylZ(handle, 0.015, hw, M.metal, 0, 0, 0);
      if (d.load === 'pulldown') [-1, 1].forEach(function (sg) { var e = cyl(handle, 0.02, 0.12, M.rubber); e.rotation.x = Math.PI / 2; e.position.set(0, 0, sg * 0.48); });
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

    var state = { j: null, solids: solids };
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
        else if (d.load === 'goblet') { orient(dbs[0], hm.clone().add(j.up.clone().multiplyScalar(-0.06)), j.up); }
        else if (d.load === 'overhead') {
          // sujetada por el disco superior con ambas manos: cuelga a lo largo de los antebrazos
          var fd = j.hand.R.clone().sub(j.el.R).add(j.hand.L.clone().sub(j.el.L)).normalize();
          orient(dbs[0], hm.clone().add(fd.clone().multiplyScalar(-0.09)), fd);
        }
        else if (d.load === 'single') orient(dbs[0], hm, V(0, 0, 1));
        else dbs[0].position.copy(hm);
      }
      if (kb) { kb.position.copy(hm); kb.quaternion.setFromUnitVectors(V(0, -1, 0), hm.clone().sub(j.shoC).normalize()); }
      if (handle) {
        if (d.load === 'ankle' || d.load === 'ankleSide') handle.position.copy(j.ank.R);
        else handle.position.copy(hm);
        if (d.load === 'seatedRow' || d.load === 'facePull') handle.quaternion.setFromUnitVectors(V(0, 0, 1), V(0, 1, 0));
      }
      if (handles2) ['L', 'R'].forEach(function (k, i) { orient(handles2[i], j.hand[k], handFrame(j, k).k); });
      // Partes móviles de máquinas
      if (eqp.roller) {
        var rp;
        if (sc.indexOf('legExt') >= 0) rp = j.ank.R.clone().add(j.knee.R.clone().sub(j.ank.R).normalize().multiplyScalar(0.06)).add(boneFront(j.knee.R, j.ank.R, j.fwd).multiplyScalar(0.07));
        else rp = j.ank.R.clone().add(j.knee.R.clone().sub(j.ank.R).normalize().multiplyScalar(0.08)).add(boneFront(j.knee.R, j.ank.R, j.fwd).multiplyScalar(-0.075));
        eqp.roller.position.set(rp.x, rp.y, 0);
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
      if (eqp.seat) eqp.seat.position.set(j.hip.x, 0.36 - SEAT + 0.02, 0);
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
        var target = handle ? handle.position.clone() : hm.clone();
        if (d.load === 'twinCable') {
          var t2 = tw2.top();
          segment(eqp.cables[0], top, j.hand.L); segment(eqp.cables[1], tw.stackTop(), top); eqp.cables[2].visible = false;
          segment(eqp.cables[3], t2, j.hand.R); segment(eqp.cables[4], tw2.stackTop(), t2); eqp.cables[5].visible = false;
        } else {
          var anchor;
          if (d.load === 'pulldown') anchor = V(0.2, 2.42, 0);
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
  function periodFor(key) {
    var d = P[key] || {};
    if (d.cyclic) return key === 'run' ? 800 : (key === 'jumpRope' ? 600 : (key === 'bike' ? 1200 : (key === 'walk' ? 1200 : 2800)));
    return d.keys ? 4200 : 3200;
  }
  function mount(canvas, key, eq, opts) {
    opts = opts || {};
    var r = makeRenderer(canvas), st = createStage(key, eq, opts.muscle);
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

  global.FORJA3D = { createStage: createStage, mount: mount, makeRenderer: makeRenderer, loadModel: loadModel, setModel: setModel,
    patterns: Object.keys(P).filter(function (k) { return k !== 'lateral'; }), periodFor: periodFor,
    label: function () { return ''; },
    _test: { P: P, solve: solve, poseAt: poseAt, mixVal: mixVal, C: { ANK: ANK, REACH: REACH, SPINE: SPINE, UA: UA, FA: FA, TH: TH, SH: SH } } };
})(typeof window !== 'undefined' ? window : globalThis);
