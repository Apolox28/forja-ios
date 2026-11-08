// Forja 3D — animaciones de ejercicios con three.js
// FORJA3D.createStage(pattern, equipment, muscleOverride) -> { scene, camera, update(phase), label }
// FORJA3D.mount(canvas, pattern, equipment, opts)   (animación en bucle)
(function (global) {
  'use strict';
  var T = global.THREE;
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;

  // ---------------------------------------------------------------------------
  //  Medidas del cuerpo (metros)
  // ---------------------------------------------------------------------------
  var SPINE = 0.5, UA = 0.3, FA = 0.33, TH = 0.45, SH = 0.44, FOOT = 0.17;
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
  function dirS(a) { return V(Math.sin(rad(a)), -Math.cos(rad(a)), 0); }          // plano sagital
  function dirF(a, sg) { return V(0, -Math.cos(rad(a)), sg * Math.sin(rad(a))); } // plano frontal

  function num(v) { return typeof v === 'boolean' ? (v ? 1 : 0) : v; }
  function mixVal(a, b, t) {
    a = num(a); b = num(b);
    if (typeof a === 'number' && b === undefined) return lerp(a, 0, t);
    if (a === undefined && typeof b === 'number') return lerp(0, b, t);
    if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, t);
    if (Array.isArray(a) && Array.isArray(b)) return a.map(function (v, i) { return mixVal(v, b[i], t); });
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      var r = {}, k;
      for (k in a) r[k] = (k in b) ? mixVal(a[k], b[k], t) : (typeof num(a[k]) === 'number' && !Array.isArray(a[k]) ? mixVal(a[k], undefined, t) : a[k]);
      for (k in b) if (!(k in r)) r[k] = (typeof num(b[k]) === 'number' && !Array.isArray(b[k])) ? mixVal(undefined, b[k], t) : b[k];
      return r;
    }
    return t < 0.5 ? a : b;
  }

  // Resuelve una postura -> articulaciones 3D
  function solve(f) {
    var j = {};
    var tt = rad(f.torso || 0);
    j.up = V(Math.sin(tt), Math.cos(tt), 0);
    j.fwd = V(Math.cos(tt), -Math.sin(tt), 0);
    j.side = V(0, 0, 1);
    j.hip = V(f.hip[0], f.hip[1], 0);
    j.shoC = j.hip.clone().add(j.up.clone().multiplyScalar(SPINE)).add(V(0, f.shr || 0, 0));
    j.head = j.shoC.clone().add(j.up.clone().multiplyScalar(0.235)).add(j.fwd.clone().multiplyScalar(0.015));
    if (f.headTilt) j.head.add(j.fwd.clone().multiplyScalar(f.headTilt));
    j.sho = {}; j.el = {}; j.hand = {}; j.hipJ = {}; j.knee = {}; j.ank = {}; j.toe = {}; j.footDir = {};
    [-1, 1].forEach(function (sg) {
      var k = sg < 0 ? 'L' : 'R';
      j.sho[k] = j.shoC.clone().add(V(0, 0, sg * SHO_W));
      j.hipJ[k] = j.hip.clone().add(V(0, 0, sg * HIP_W));

      // ---- Brazos ----
      var A = (k === 'L' ? f.armsL : f.armsR) || f.arms || { ua: 0, fa: 0 };
      if (A.bar) A = { ua: 0, fa: 0 };
      var sh = j.sho[k], target = null;
      var gw = A.gw != null ? A.gw : 0.24;
      if (A.ik) target = V(A.ik[0], A.ik[1], A.ik.length > 2 ? A.ik[2] * sg : sg * gw);
      else if (A.rel) target = sh.clone().add(V(A.rel[0], A.rel[1], (A.rel[2] || 0) * sg));
      else if (A.chest) target = j.shoC.clone().add(j.fwd.clone().multiplyScalar(0.13)).add(j.up.clone().multiplyScalar(-0.12)).add(V(0, 0, -sg * 0.05));
      if (target) {
        if (A.straight) {
          var full = sh.clone().add(target.clone().sub(sh).normalize().multiplyScalar(UA + FA - 0.005));
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

      // ---- Piernas ----
      var Lg = (k === 'L' ? f.legsL : f.legsR) || f.legs || { th: 0, sh: 0 };
      var hp = j.hipJ[k];
      var fw = Lg.fw != null ? Lg.fw : 0.13;
      var ank = null;
      if (Lg.toes) {
        var fd = V(Math.cos(rad(Lg.foot || 0)), -Math.sin(rad(Lg.foot || 0)), 0);
        var toe = V(Lg.toes[0], Lg.toes[1], sg * fw);
        ank = toe.clone().sub(fd.clone().multiplyScalar(FOOT));
      } else if (Lg.ik) ank = V(Lg.ik[0], Lg.ik[1], Lg.ik.length > 2 ? Lg.ik[2] * sg : sg * fw);
      else if (Lg.rel) ank = hp.clone().add(V(Lg.rel[0], Lg.rel[1], (Lg.rel[2] || 0) * sg));
      if (ank) {
        var kp = Lg.pole ? V(Lg.pole[0], Lg.pole[1], (Lg.pole[2] || 0) * sg) : j.fwd.clone().add(V(0, 0, sg * 0.12));
        var rl = ik(hp, ank, TH, SH, kp);
        j.knee[k] = rl[0]; j.ank[k] = rl[1];
      } else {
        var tA = Lg.plane === 'f' ? dirF(Lg.th, sg) : dirS(Lg.th);
        var sA = Lg.plane === 'f' ? dirF(Lg.sh, sg) : dirS(Lg.sh);
        j.knee[k] = hp.clone().add(tA.multiplyScalar(TH));
        j.ank[k] = j.knee[k].clone().add(sA.multiplyScalar(SH));
      }
      var shin = j.ank[k].clone().sub(j.knee[k]).normalize();
      var footDir;
      if (Lg.foot != null) footDir = V(Math.cos(rad(Lg.foot)), -Math.sin(rad(Lg.foot)), 0);
      else {
        footDir = V(-shin.y, shin.x, 0); // perpendicular a la tibia, hacia delante
        if (Lg.footFlip) footDir.multiplyScalar(-1);
        if (footDir.lengthSq() < 1e-6) footDir = V(1, 0, 0);
        footDir.normalize();
      }
      j.footDir[k] = footDir;
      j.toe[k] = j.ank[k].clone().add(footDir.clone().multiplyScalar(FOOT));
    });
    return j;
  }

  // ---------------------------------------------------------------------------
  //  Geometrías del cuerpo
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
    for (i = 1; i <= 20; i++) { var s = i / 20; pts.push(new T.Vector2(radiusAt(knots, s), s * L)); }
    for (i = 1; i <= 6; i++) { var b = (Math.PI / 2) * i / 6; pts.push(new T.Vector2(r1 * Math.cos(b), L + r1 * Math.sin(b) * 0.8)); }
    pts[pts.length - 1].x = 0;
    var g = new T.LatheGeometry(pts, 28);
    g.computeVertexNormals();
    return g;
  }
  var SPH = new T.SphereGeometry(1, 32, 24);

  var KN = {
    ua: [[0, 0.054], [0.2, 0.05], [0.55, 0.052], [1, 0.041]],
    fa: [[0, 0.044], [0.25, 0.047], [0.82, 0.032], [1, 0.03]],
    th: [[0, 0.088], [0.3, 0.082], [0.85, 0.06], [1, 0.056]],
    sh: [[0, 0.054], [0.25, 0.058], [0.72, 0.038], [1, 0.034]],
    neck: [[0, 0.06], [1, 0.054]]
  };

  var MUSCLES = ['pecs', 'abs', 'lats', 'traps', 'lowback', 'glutes', 'delts', 'biceps', 'triceps', 'forearms', 'quads', 'hams', 'calves'];
  var MUSCLE_MAP = { chest: 'pecs', back: 'lats', shoulders: 'delts', biceps: 'biceps', triceps: 'triceps', forearms: 'forearms',
    quads: 'quads', hamstrings: 'hams', glutes: 'glutes', calves: 'calves', core: 'abs' };

  function makeBody(scene, active) {
    var skin = new T.MeshStandardMaterial({ color: 0xe9eaee, roughness: 0.58, metalness: 0.02 });
    var mats = {};
    MUSCLES.forEach(function (m) {
      var c = active.p.indexOf(m) >= 0 ? 0xd92b31 : (active.s.indexOf(m) >= 0 ? 0xf08a2c : 0xe9eaee);
      mats[m] = new T.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.02,
        emissive: active.p.indexOf(m) >= 0 ? 0x6a0606 : (active.s.indexOf(m) >= 0 ? 0x3a1800 : 0x000000) });
    });
    var body = { parts: [], mats: mats, skin: skin };
    function add(geo, mat) { var m = new T.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; scene.add(m); body.parts.push(m); return m; }
    body.add = add;
    var uaG = limbGeo(UA, KN.ua), faG = limbGeo(FA - 0.06, KN.fa), thG = limbGeo(TH, KN.th), shG = limbGeo(SH, KN.sh), nkG = limbGeo(0.13, KN.neck);
    body.m = {
      pelvis: add(SPH, skin), abdomen: add(SPH, skin), chest: add(SPH, skin), neck: add(nkG, skin),
      head: add(SPH, skin), jaw: add(SPH, skin), nose: add(SPH, skin), earL: add(SPH, skin), earR: add(SPH, skin),
      uaL: add(uaG, skin), uaR: add(uaG, skin), faL: add(faG, skin), faR: add(faG, skin),
      handL: add(SPH, skin), handR: add(SPH, skin),
      thL: add(thG, skin), thR: add(thG, skin), shL: add(shG, skin), shR: add(shG, skin),
      footL: add(SPH, skin), footR: add(SPH, skin), kneeL: add(SPH, skin), kneeR: add(SPH, skin),
      // músculos (dan volumen y se iluminan cuando trabajan)
      pecL: add(SPH, mats.pecs), pecR: add(SPH, mats.pecs),
      lat: [add(SPH, mats.lats), add(SPH, mats.lats)], traps: add(SPH, mats.traps), lowback: add(SPH, mats.lowback),
      gluteL: add(SPH, mats.glutes), gluteR: add(SPH, mats.glutes),
      deltL: add(SPH, mats.delts), deltR: add(SPH, mats.delts),
      bicL: add(SPH, mats.biceps), bicR: add(SPH, mats.biceps), triL: add(SPH, mats.triceps), triR: add(SPH, mats.triceps),
      forL: add(SPH, mats.forearms), forR: add(SPH, mats.forearms),
      quadL: add(SPH, mats.quads), quadR: add(SPH, mats.quads), vmoL: add(SPH, mats.quads), vmoR: add(SPH, mats.quads),
      hamL: add(SPH, mats.hams), hamR: add(SPH, mats.hams),
      calfL: add(SPH, mats.calves), calfR: add(SPH, mats.calves),
      abs: [0, 1, 2, 3, 4, 5].map(function () { return add(SPH, mats.abs); })
    };
    return body;
  }

  var _m = new T.Matrix4();
  function placeBasis(mesh, pos, fwd, up, side, sx, sy, sz) {
    _m.makeBasis(fwd, up, side);
    mesh.quaternion.setFromRotationMatrix(_m);
    mesh.position.copy(pos);
    mesh.scale.set(sx, sy, sz);
  }
  function placeAlong(mesh, a, b) {
    var d = b.clone().sub(a).normalize();
    mesh.position.copy(a);
    mesh.quaternion.setFromUnitVectors(Y, d);
    mesh.scale.set(1, 1, 1);
  }
  // Elipsoide alineado con un hueso
  function placeOnBone(mesh, a, b, s, frontVec, off, rLen, rFront, rSide) {
    var d = b.clone().sub(a), L = d.length(); d.normalize();
    var f = frontVec.clone().sub(d.clone().multiplyScalar(frontVec.dot(d))).normalize();
    var sd = f.clone().cross(d).normalize();
    var p = a.clone().add(d.clone().multiplyScalar(L * s)).add(f.clone().multiplyScalar(off));
    _m.makeBasis(f, d, sd);
    mesh.quaternion.setFromRotationMatrix(_m);
    mesh.position.copy(p);
    mesh.scale.set(rFront, rLen, rSide);
  }
  function boneFront(a, b, torsoFwd) {
    var d = b.clone().sub(a).normalize();
    var f = V(0, 0, 1).cross(d);
    if (f.lengthSq() < 0.09) f = torsoFwd.clone();
    return f.normalize();
  }

  function poseBody(body, j) {
    var m = body.m, up = j.up, fwd = j.fwd, side = j.side;
    function at(base, u, f, s) { return base.clone().add(up.clone().multiplyScalar(u)).add(fwd.clone().multiplyScalar(f)).add(side.clone().multiplyScalar(s || 0)); }
    placeBasis(m.pelvis, at(j.hip, 0.03, -0.01), fwd, up, side, 0.12, 0.115, 0.175);
    placeBasis(m.abdomen, at(j.hip, 0.2, 0.0), fwd, up, side, 0.112, 0.17, 0.148);
    placeBasis(m.chest, at(j.hip, 0.37, 0.012), fwd, up, side, 0.135, 0.19, 0.19);
    placeAlong(m.neck, at(j.shoC, 0.0, -0.01), at(j.shoC, 0.14, 0.0));
    var hd = j.head;
    placeBasis(m.head, hd, fwd, up, side, 0.098, 0.118, 0.088);
    placeBasis(m.jaw, hd.clone().add(up.clone().multiplyScalar(-0.07)).add(fwd.clone().multiplyScalar(0.035)), fwd, up, side, 0.06, 0.045, 0.06);
    placeBasis(m.nose, hd.clone().add(fwd.clone().multiplyScalar(0.095)).add(up.clone().multiplyScalar(-0.01)), fwd, up, side, 0.022, 0.03, 0.016);
    placeBasis(m.earL, hd.clone().add(side.clone().multiplyScalar(-0.088)), fwd, up, side, 0.018, 0.032, 0.012);
    placeBasis(m.earR, hd.clone().add(side.clone().multiplyScalar(0.088)), fwd, up, side, 0.018, 0.032, 0.012);
    // Torso: pectorales, abdominales, dorsales, trapecio, lumbar
    placeBasis(m.pecL, at(j.hip, 0.405, 0.1, -0.085), fwd, up, side, 0.05, 0.08, 0.1);
    placeBasis(m.pecR, at(j.hip, 0.405, 0.1, 0.085), fwd, up, side, 0.05, 0.08, 0.1);
    for (var i = 0; i < 6; i++) {
      var row = Math.floor(i / 2), sg = i % 2 ? 1 : -1;
      placeBasis(m.abs[i], at(j.hip, 0.29 - row * 0.075, 0.092 - row * 0.002, sg * 0.04), fwd, up, side, 0.022, 0.033, 0.037);
    }
    placeBasis(m.lat[0], at(j.hip, 0.33, -0.04, -0.15), fwd, up, side, 0.07, 0.15, 0.06);
    placeBasis(m.lat[1], at(j.hip, 0.33, -0.04, 0.15), fwd, up, side, 0.07, 0.15, 0.06);
    placeBasis(m.traps, at(j.shoC, 0.04, -0.045), fwd, up, side, 0.06, 0.07, 0.17);
    placeBasis(m.lowback, at(j.hip, 0.14, -0.085), fwd, up, side, 0.045, 0.1, 0.11);
    placeBasis(m.gluteL, at(j.hip, -0.02, -0.075, -0.075), fwd, up, side, 0.085, 0.095, 0.085);
    placeBasis(m.gluteR, at(j.hip, -0.02, -0.075, 0.075), fwd, up, side, 0.085, 0.095, 0.085);

    ['L', 'R'].forEach(function (k) {
      var sg = k === 'L' ? -1 : 1;
      var sh = j.sho[k], el = j.el[k], hd2 = j.hand[k];
      placeAlong(m['ua' + k], sh, el);
      var wrist = el.clone().add(hd2.clone().sub(el).normalize().multiplyScalar(FA - 0.06));
      placeAlong(m['fa' + k], el, wrist);
      var hdir = hd2.clone().sub(el).normalize();
      var hf = boneFront(el, hd2, fwd);
      placeOnBone(m['hand' + k], wrist, hd2.clone().add(hdir.clone().multiplyScalar(0.03)), 0.55, hf, 0, 0.055, 0.035, 0.047);
      // deltoide
      var outward = V(0, 0, sg);
      var dpos = sh.clone().add(outward.clone().multiplyScalar(0.03)).add(up.clone().multiplyScalar(0.01));
      var ad = el.clone().sub(sh).normalize();
      placeOnBone(m['delt' + k], dpos, dpos.clone().add(ad), 0.0, outward, 0.0, 0.085, 0.075, 0.075);
      m['delt' + k].position.copy(dpos.clone().add(ad.clone().multiplyScalar(0.03)));
      var af = boneFront(sh, el, fwd);
      placeOnBone(m['bic' + k], sh, el, 0.58, af, 0.02, 0.095, 0.032, 0.038);
      placeOnBone(m['tri' + k], sh, el, 0.45, af, -0.022, 0.12, 0.031, 0.04);
      var ff = boneFront(el, hd2, fwd);
      placeOnBone(m['for' + k], el, wrist, 0.28, ff, 0.012, 0.1, 0.034, 0.04);
      // piernas
      var hp = j.hipJ[k], kn = j.knee[k], an = j.ank[k];
      placeAlong(m['th' + k], hp, kn);
      placeAlong(m['sh' + k], kn, an);
      var tf = boneFront(hp, kn, fwd);
      placeOnBone(m['quad' + k], hp, kn, 0.45, tf, 0.026, 0.2, 0.05, 0.066);
      placeOnBone(m['vmo' + k], hp, kn, 0.8, tf.clone().add(V(0, 0, -sg * 0.8)).normalize(), 0.024, 0.065, 0.032, 0.036);
      placeOnBone(m['ham' + k], hp, kn, 0.5, tf, -0.028, 0.18, 0.045, 0.062);
      var sf = boneFront(kn, an, fwd);
      placeOnBone(m['calf' + k], kn, an, 0.28, sf, -0.022, 0.12, 0.037, 0.046);
      placeOnBone(m['knee' + k], kn, an, 0.02, tf, 0.04, 0.04, 0.03, 0.045);
      var fd = j.footDir[k];
      var fUp = fd.clone().cross(V(0, 0, 1)).multiplyScalar(-1).normalize();
      placeBasis(m['foot' + k], an.clone().add(fd.clone().multiplyScalar(0.07)).add(fUp.clone().multiplyScalar(-0.035)), fd, fUp, V(0, 0, 1), 0.125, 0.04, 0.05);
    });
  }

  // ---------------------------------------------------------------------------
  //  Equipamiento
  // ---------------------------------------------------------------------------
  var MAT = {};
  function mats() {
    if (MAT.metal) return MAT;
    MAT.metal = new T.MeshStandardMaterial({ color: 0xb4bcc8, roughness: 0.3, metalness: 0.85 });
    MAT.frame = new T.MeshStandardMaterial({ color: 0x3b414d, roughness: 0.5, metalness: 0.5 });
    MAT.plate = new T.MeshStandardMaterial({ color: 0x24272e, roughness: 0.55, metalness: 0.2 });
    MAT.plateRim = new T.MeshStandardMaterial({ color: 0x3a3f49, roughness: 0.4, metalness: 0.4 });
    MAT.pad = new T.MeshStandardMaterial({ color: 0x2b303b, roughness: 0.85 });
    MAT.stack = new T.MeshStandardMaterial({ color: 0xff8a3d, roughness: 0.45, metalness: 0.2 });
    MAT.cable = new T.MeshStandardMaterial({ color: 0xdfe3ea, roughness: 0.4 });
    MAT.mat = new T.MeshStandardMaterial({ color: 0x2c5b88, roughness: 0.9 });
    MAT.belt = new T.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.9 });
    return MAT;
  }
  function box(parent, w, h, d, mat, x, y, z) {
    var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function cyl(parent, r, h, mat, seg) {
    var m = new T.Mesh(new T.CylinderGeometry(r, r, h, seg || 24), mat); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function rbox(parent, w, h, d, mat, x, y, z) { // cojín con bordes suaves (aprox.)
    var g = new T.BoxGeometry(w, h, d, 2, 2, 2);
    var m = new T.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function segment(mesh, a, b) {
    var d = b.clone().sub(a), L = d.length();
    mesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(Y, d.normalize());
    mesh.scale.set(1, Math.max(L, 1e-4), 1);
  }
  function cableMesh(parent) { var m = new T.Mesh(new T.CylinderGeometry(0.007, 0.007, 1, 8), mats().cable); parent.add(m); return m; }

  function barbell(parent, half) {
    var g = new T.Group(), M = mats();
    var bar = cyl(g, 0.016, 2.1, M.metal); bar.rotation.x = Math.PI / 2;
    [-1, 1].forEach(function (sg) {
      [0.64, 0.7].forEach(function (z) {
        var p = cyl(g, 0.225, 0.045, M.plate, 40); p.rotation.x = Math.PI / 2; p.position.z = sg * z;
        var rim = new T.Mesh(new T.TorusGeometry(0.218, 0.012, 8, 40), M.plateRim); rim.position.z = sg * (z + 0.023); g.add(rim);
      });
      var col = cyl(g, 0.035, 0.05, M.metal); col.rotation.x = Math.PI / 2; col.position.z = sg * 0.6;
      var sl = cyl(g, 0.026, 0.3, M.metal); sl.rotation.x = Math.PI / 2; sl.position.z = sg * 0.82;
    });
    parent.add(g); return g;
  }
  function dumbbell(parent) {
    var g = new T.Group(), M = mats();
    var h = cyl(g, 0.017, 0.16, M.metal); h.rotation.x = Math.PI / 2;
    [-1, 1].forEach(function (sg) {
      var p = cyl(g, 0.105, 0.075, M.plate, 6); p.rotation.x = Math.PI / 2; p.position.z = sg * 0.12; p.rotation.y = Math.PI / 6;
    });
    parent.add(g); return g;
  }
  function kettlebell(parent) {
    var g = new T.Group(), M = mats();
    var b = new T.Mesh(new T.SphereGeometry(0.12, 32, 24), M.plate); b.position.y = -0.15; b.castShadow = true; g.add(b);
    var hdl = new T.Mesh(new T.TorusGeometry(0.07, 0.016, 12, 32, Math.PI), M.plate); hdl.position.y = -0.06; hdl.rotation.z = 0; g.add(hdl);
    parent.add(g); return g;
  }
  // Torre de polea con pila de discos que sube y baja
  function stackTower(parent, x, z, rotY) {
    var g = new T.Group(), M = mats();
    g.position.set(x, 0, z); g.rotation.y = rotY || 0;
    box(g, 0.05, 2.25, 0.05, M.frame, 0, 1.125, -0.17);
    box(g, 0.05, 2.25, 0.05, M.frame, 0, 1.125, 0.17);
    box(g, 0.08, 0.05, 0.42, M.frame, 0, 2.25, 0);
    box(g, 0.3, 0.04, 0.5, M.frame, 0, 0.02, 0);
    cyl(g, 0.008, 1.9, M.metal).position.set(0, 1.1, -0.06);
    cyl(g, 0.008, 1.9, M.metal).position.set(0, 1.1, 0.06);
    var stack = new T.Group(); g.add(stack);
    for (var i = 0; i < 12; i++) box(stack, 0.16, 0.045, 0.26, M.stack, 0, 0.09 + i * 0.05, 0);
    var pul = new T.Mesh(new T.TorusGeometry(0.05, 0.014, 10, 24), M.metal); pul.position.set(0, 2.2, 0); g.add(pul);
    parent.add(g);
    return {
      group: g, stack: stack,
      top: function () { return g.localToWorld(V(0, 2.2, 0)); },
      stackTop: function () { return g.localToWorld(V(0, 0.09 + 12 * 0.05 + stack.position.y, 0)); }
    };
  }

  function machineStack(parent, x, z, rotY) {
    var g = new T.Group(), M = mats();
    g.position.set(x, 0, z); g.rotation.y = rotY || 0;
    box(g, 0.42, 0.06, 0.46, M.frame, 0, 0.03, 0);
    box(g, 0.04, 1.45, 0.42, M.frame, -0.17, 0.75, 0);
    box(g, 0.04, 1.45, 0.42, M.frame, 0.17, 0.75, 0);
    box(g, 0.38, 0.05, 0.42, M.frame, 0, 1.48, 0);
    box(g, 0.38, 1.4, 0.02, M.frame, 0, 0.75, -0.2);
    var stack = new T.Group(); g.add(stack);
    for (var i = 0; i < 12; i++) box(stack, 0.28, 0.045, 0.2, M.stack, 0, 0.1 + i * 0.05, 0);
    cyl(g, 0.008, 1.35, M.metal).position.set(-0.07, 0.75, 0);
    cyl(g, 0.008, 1.35, M.metal).position.set(0.07, 0.75, 0);
    parent.add(g);
    return { group: g, stack: stack, compact: true };
  }

  // ---------------------------------------------------------------------------
  //  Ejercicios (posturas A = inicio, B = trabajo)
  // ---------------------------------------------------------------------------
  var STAND = [0, 0.97];
  var FEET = { ik: [0.0, 0.08] };
  var P = {};
  function def(k, o) { P[k] = o; }

  // ---- Piernas y bisagra ----
  def('squat', { p: ['quads', 'glutes'], s: ['hams', 'lowback', 'abs'], load: 'back', scene: ['rack'], smith: true,
    A: { hip: STAND, torso: 6, legs: FEET, arms: { bar: 'back', pole: [0, -1, 0.3] } },
    B: { hip: [-0.21, 0.53], torso: 40, legs: FEET, arms: { bar: 'back', pole: [0, -1, 0.3] } } });
  def('frontSquat', { p: ['quads'], s: ['glutes', 'abs'], load: 'chest',
    A: { hip: STAND, torso: 3, legs: FEET, arms: { bar: 'chest' } },
    B: { hip: [-0.17, 0.51], torso: 20, legs: FEET, arms: { bar: 'chest' } } });
  def('deadlift', { p: ['glutes', 'hams', 'lowback'], s: ['quads', 'traps', 'forearms', 'lats'], load: 'hands', liftAt: 1,
    A: { hip: [-0.22, 0.6], torso: 60, legs: FEET, arms: { ik: [0.07, 0.225], gw: 0.25, straight: true } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { ik: [0.07, 0.8], gw: 0.25, straight: true } } });
  def('rdl', { p: ['hams', 'glutes'], s: ['lowback'], load: 'hands',
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ik: [0.07, 0.8], gw: 0.25, straight: true } },
    B: { hip: [-0.2, 0.91], torso: 74, legs: FEET, arms: { ik: [0.09, 0.42], gw: 0.25, straight: true } } });
  def('goodMorning', { p: ['hams', 'lowback'], s: ['glutes'], load: 'back',
    A: { hip: STAND, torso: 2, legs: FEET, arms: { bar: 'back', pole: [0, -1, 0.3] } },
    B: { hip: [-0.17, 0.93], torso: 76, legs: FEET, arms: { bar: 'back', pole: [0, -1, 0.3] } } });
  def('lunge', { p: ['quads', 'glutes'], s: ['hams'], load: 'hands', smith: true,
    A: { hip: [-0.03, 0.93], torso: 2, legsR: { ik: [0.36, 0.08] }, legsL: { ik: [-0.42, 0.13], foot: 35 }, arms: { rel: [0.02, -0.62, 0.04] } },
    B: { hip: [-0.03, 0.55], torso: 4, legsR: { ik: [0.36, 0.08] }, legsL: { ik: [-0.42, 0.13], foot: 35 }, arms: { rel: [0.02, -0.62, 0.04] } } });
  def('legPress', { p: ['quads', 'glutes'], s: ['hams'], load: 'sled', scene: ['legPress'], cam: { dist: 0.92, az: 30 },
    A: { hip: [-0.32, 0.55], torso: -52, legs: { ik: [0.12, 0.78], fw: 0.15, foot: -45 }, arms: { ik: [-0.15, 0.5], gw: 0.32 } },
    B: { hip: [-0.32, 0.55], torso: -52, legs: { ik: [0.5, 1.14], fw: 0.15, foot: -45 }, arms: { ik: [-0.15, 0.5], gw: 0.32 } } });
  def('legExt', { p: ['quads'], load: 'machine', stack: true, scene: ['legExt'], machinePos: [-0.45, -0.62, 0],
    A: { hip: [-0.08, 0.58], torso: -10, legs: { th: 90, sh: 8 }, arms: { ik: [0.0, 0.52], gw: 0.3 } },
    B: { hip: [-0.08, 0.58], torso: -10, legs: { th: 90, sh: 86 }, arms: { ik: [0.0, 0.52], gw: 0.3 } } });
  def('legCurl', { p: ['hams'], s: ['calves'], load: 'machine', stack: true, scene: ['legCurl'], machinePos: [0.9, -0.55, 0],
    A: { hip: [-0.05, 0.63], torso: 91, legs: { th: -88, sh: -90, footFlip: true }, arms: { ik: [0.62, 0.5], gw: 0.25 } },
    B: { hip: [-0.05, 0.63], torso: 91, legs: { th: -88, sh: -185, footFlip: true }, arms: { ik: [0.62, 0.5], gw: 0.25 } } });
  def('calf', { p: ['calves'], load: 'hands', stack: true, scene: ['step'],
    A: { hip: [0.0, 0.95], torso: 0, legs: { toes: [0.13, 0.12], foot: -18 }, arms: { rel: [0.02, -0.62, 0.05] }, calf: true },
    B: { hip: [0.0, 1.05], torso: 0, legs: { toes: [0.13, 0.12], foot: 32 }, arms: { rel: [0.02, -0.62, 0.05] }, calf: true } });
  def('seatedCalf', { p: ['calves'], load: 'machine', stack: true, scene: ['seatedCalf'], machinePos: [-0.6, -0.55, 0],
    A: { hip: [-0.2, 0.6], torso: 0, legs: { toes: [0.42, 0.14], foot: -15, pole: [1, 0.6, 0] }, arms: { ik: [0.2, 0.68], gw: 0.25 } },
    B: { hip: [-0.2, 0.6], torso: 0, legs: { toes: [0.42, 0.14], foot: 30, pole: [1, 0.6, 0] }, arms: { ik: [0.2, 0.72], gw: 0.25 } } });
  def('hipThrust', { p: ['glutes'], s: ['hams', 'quads'], load: 'hip', stack: true, scene: ['thrustBench'],
    A: { hip: [-0.05, 0.27], torso: -63, legs: { ik: [0.42, 0.08], fw: 0.17 }, arms: { bar: 'hip', pole: [0, -1, 0.4] } },
    B: { hip: [0.0, 0.6], torso: -100, legs: { ik: [0.42, 0.08], fw: 0.17 }, arms: { bar: 'hip', pole: [0, -1, 0.4] } } });
  def('gluteKickback', { p: ['glutes'], s: ['hams'], load: 'ankle', stack: true, scene: ['towerFront'], cam: { az: 6 },
    A: { hip: [0, 0.96], torso: 22, legsL: FEET, legsR: { th: 2, sh: 0 }, arms: { ik: [0.42, 1.18], gw: 0.2 } },
    B: { hip: [0, 0.96], torso: 22, legsL: FEET, legsR: { th: -42, sh: -30 }, arms: { ik: [0.42, 1.18], gw: 0.2 } } });

  // ---- Pecho ----
  def('bench', { p: ['pecs'], s: ['triceps', 'delts'], load: 'hands', scene: ['bench', 'benchRack'], smith: true, liftAt: 0, cam: { y: 0.75 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ik: [-0.36, 1.18], gw: 0.42 } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ik: [-0.3, 0.74], gw: 0.42 } } });
  def('incline', { p: ['pecs', 'delts'], s: ['triceps'], load: 'hands', scene: ['inclineBench'], smith: true, liftAt: 0,
    A: { hip: [0.05, 0.56], torso: -52, legs: { ik: [0.55, 0.08], fw: 0.22 }, arms: { ik: [-0.27, 1.45], gw: 0.4 } },
    B: { hip: [0.05, 0.56], torso: -52, legs: { ik: [0.55, 0.08], fw: 0.22 }, arms: { ik: [-0.22, 1.02], gw: 0.4 } } });
  def('fly', { p: ['pecs'], s: ['delts'], load: 'hands', scene: ['bench'], liftAt: 0, cam: { y: 0.75, az: 50 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ik: [-0.36, 1.15, 0.13], pole: [0.4, -0.6, 0.5] } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ik: [-0.36, 0.72, 0.68], pole: [0.4, -0.6, 0.5] } } });
  def('pullover', { p: ['lats', 'pecs'], s: ['triceps'], load: 'hands', scene: ['bench'], liftAt: 0, cam: { y: 0.75 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ua: 178, fa: 182 } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ua: 262, fa: 268 } } });
  def('chestPress', { p: ['pecs'], s: ['triceps', 'delts'], load: 'machine', stack: true, scene: ['chestPress'], machinePos: [-0.7, -0.5, 0],
    A: { hip: [-0.1, 0.56], torso: -8, legs: { ik: [0.4, 0.08], fw: 0.17 }, arms: { ik: [0.15, 1.22], gw: 0.28, pole: [-1, -0.4, 0.5] } },
    B: { hip: [-0.1, 0.56], torso: -8, legs: { ik: [0.4, 0.08], fw: 0.17 }, arms: { ik: [0.6, 1.24], gw: 0.25, pole: [-1, -0.4, 0.5] } } });
  def('cableFly', { p: ['pecs'], s: ['delts'], load: 'twinCable', stack: true, cam: { az: 55, dist: 1.1 },
    A: { hip: [0, 0.96], torso: 14, legsL: { ik: [-0.18, 0.08] }, legsR: { ik: [0.22, 0.08] }, arms: { ik: [0.24, 1.47, 0.74], pole: [-0.6, 0.1, 0.8] } },
    B: { hip: [0, 0.96], torso: 14, legsL: { ik: [-0.18, 0.08] }, legsR: { ik: [0.22, 0.08] }, arms: { ik: [0.56, 1.16, 0.08], pole: [-0.6, 0.1, 0.8] } } });
  def('dip', { p: ['triceps', 'pecs'], s: ['delts'], load: 'none', scene: ['dipStation'], liftAt: 0,
    A: { hip: [-0.02, 1.33], torso: 6, legs: { rel: [-0.28, -0.72] }, arms: { ik: [0.0, 1.26], gw: 0.27, pole: [-1, 0, 0.2] } },
    B: { hip: [-0.06, 0.98], torso: 22, legs: { rel: [-0.28, -0.72] }, arms: { ik: [0.0, 1.26], gw: 0.27, pole: [-1, 0, 0.2] } } });
  def('pushup', { p: ['pecs', 'triceps'], s: ['delts', 'abs'], load: 'none', liftAt: 0, cam: { y: 0.4 },
    A: { hip: [-0.15, 0.56], torso: 79, legs: { ik: [-0.98, 0.13], fw: 0.1, foot: 75 }, arms: { ik: [0.36, 0.05], gw: 0.3, pole: [-0.5, 1, 0.6] } },
    B: { hip: [-0.15, 0.33], torso: 86, legs: { ik: [-0.98, 0.13], fw: 0.1, foot: 75 }, arms: { ik: [0.36, 0.05], gw: 0.3, pole: [-0.5, 1, 0.6] } } });

  // ---- Espalda ----
  def('row', { p: ['lats', 'traps'], s: ['biceps', 'delts', 'lowback'], load: 'hands',
    A: { hip: [-0.15, 0.87], torso: 64, legs: FEET, arms: { ik: [0.3, 0.47], gw: 0.27, pole: [-1, 0.5, 0.35] } },
    B: { hip: [-0.15, 0.87], torso: 64, legs: FEET, arms: { ik: [0.14, 0.82], gw: 0.27, pole: [-1, 0.5, 0.35] } } });
  def('dbRow', { p: ['lats'], s: ['biceps', 'traps'], load: 'handR', scene: ['rowBench'], cam: { az: 25 },
    A: { hip: [-0.1, 0.78], torso: 80, legsL: { ik: [-0.48, 0.5], pole: [1, -1, 0] }, legsR: { ik: [0.0, 0.08, 0.32] },
      armsL: { ik: [0.46, 0.48, 0.2] }, armsR: { ik: [0.4, 0.21, 0.24], pole: [-1, 0.6, 0.3] } },
    B: { hip: [-0.1, 0.78], torso: 80, legsL: { ik: [-0.48, 0.5], pole: [1, -1, 0] }, legsR: { ik: [0.0, 0.08, 0.32] },
      armsL: { ik: [0.46, 0.48, 0.2] }, armsR: { ik: [0.12, 0.7, 0.24], pole: [-1, 0.6, 0.3] } } });
  def('pulldown', { p: ['lats'], s: ['biceps', 'traps'], load: 'pulldown', stack: true, scene: ['pulldown'],
    A: { hip: [0, 0.57], torso: -8, legs: { ik: [0.45, 0.08], fw: 0.16 }, arms: { ik: [0.08, 2.15], gw: 0.46, pole: [0, -1, 0.6] } },
    B: { hip: [0, 0.57], torso: -18, legs: { ik: [0.45, 0.08], fw: 0.16 }, arms: { ik: [0.17, 1.42], gw: 0.46, pole: [0, -1, 0.6] } } });
  def('pullup', { p: ['lats'], s: ['biceps', 'forearms'], load: 'none', scene: ['pullFrame'],
    A: { hip: [-0.03, 1.08], torso: 0, legs: { rel: [-0.2, -0.82], fw: 0.06 }, arms: { ik: [0.0, 2.22], gw: 0.42, pole: [0.2, -1, 0.7] } },
    B: { hip: [-0.06, 1.56], torso: -8, legs: { rel: [-0.2, -0.82], fw: 0.06 }, arms: { ik: [0.0, 2.22], gw: 0.42, pole: [0.2, -1, 0.7] } } });
  def('seatedRow', { p: ['lats', 'traps'], s: ['biceps'], load: 'seatedRow', stack: true, scene: ['seatedRow'],
    A: { hip: [-0.36, 0.45], torso: 14, legs: { ik: [0.42, 0.3], fw: 0.14, foot: -70 }, arms: { ik: [0.4, 0.88], gw: 0.11, pole: [-1, -0.5, 0.25] } },
    B: { hip: [-0.36, 0.45], torso: -4, legs: { ik: [0.42, 0.3], fw: 0.14, foot: -70 }, arms: { ik: [-0.02, 0.86], gw: 0.13, pole: [-1, -0.5, 0.25] } } });
  def('facePull', { p: ['delts', 'traps'], s: ['biceps'], load: 'facePull', stack: true, scene: ['towerFront'], cam: { az: 6 },
    A: { hip: [-0.05, 0.96], torso: -3, legsL: { ik: [-0.2, 0.08] }, legsR: { ik: [0.12, 0.08] }, arms: { ik: [0.55, 1.56], gw: 0.07, pole: [-0.6, 0.6, 1] } },
    B: { hip: [-0.05, 0.96], torso: -3, legsL: { ik: [-0.2, 0.08] }, legsR: { ik: [0.12, 0.08] }, arms: { ik: [0.1, 1.64], gw: 0.3, pole: [-0.6, 0.6, 1] } } });
  def('hyperext', { p: ['lowback', 'glutes'], s: ['hams'], load: 'none', scene: ['hyperBench'], cam: { az: 12 },
    A: { hip: [0, 0.98], torso: 132, legs: { ik: [-0.6, 0.36], fw: 0.1 }, arms: { chest: true } },
    B: { hip: [0, 0.98], torso: 48, legs: { ik: [-0.6, 0.36], fw: 0.1 }, arms: { chest: true } } });
  def('shrug', { view: 'front', p: ['traps'], s: ['forearms'], load: 'handsFront', stack: true,
    A: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.05, -0.62, 0.05] }, shr: 0 },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.05, -0.62, 0.05] }, shr: 0.065 } });

  // ---- Hombros ----
  def('ohp', { p: ['delts'], s: ['triceps', 'traps'], load: 'hands', stack: true,
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ik: [0.12, 1.5], gw: 0.27, pole: [0.4, -1, 0.5] } },
    B: { hip: STAND, torso: -2, legs: FEET, arms: { ik: [0.02, 2.08], gw: 0.27, pole: [0.4, -1, 0.5] } } });
  def('lateralRaise', { view: 'front', p: ['delts'], s: ['traps'], load: 'hands', stack: true,
    A: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.04, -0.6, 0.1], pole: [-1, 0, 0] } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.08, -0.04, 0.6], pole: [-1, 0, 0] } } });
  def('frontRaise', { p: ['delts'], s: ['traps'], load: 'hands', stack: true,
    A: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.06, -0.61, 0.02], pole: [-1, -0.2, 0.3] } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.61, 0.02, 0.02], pole: [-1, -0.2, 0.3] } } });
  P.lateral = P.frontRaise;
  def('uprightRow', { view: 'front', p: ['delts', 'traps'], s: ['biceps'], load: 'handsFront', stack: true,
    A: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.06, -0.62, -0.06], pole: [0, 1, 1] } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { rel: [0.14, -0.12, -0.06], pole: [-0.2, 1, 1.3] } } });

  // ---- Brazos ----
  def('curl', { p: ['biceps'], s: ['forearms'], load: 'hands', stack: true,
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 2, fa: 4 } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 10, fa: 150 } } });
  def('preacherCurl', { p: ['biceps'], s: ['forearms'], load: 'hands', stack: true, scene: ['preacher'], cam: { az: 68 },
    A: { hip: [-0.12, 0.6], torso: 14, legs: { ik: [0.3, 0.08], fw: 0.16 }, arms: { ua: 45, fa: 55 } },
    B: { hip: [-0.12, 0.6], torso: 14, legs: { ik: [0.3, 0.08], fw: 0.16 }, arms: { ua: 45, fa: 168 } } });
  def('pushdown', { p: ['triceps'], load: 'pushdown', stack: true, scene: ['towerFront'], cam: { az: 6 },
    A: { hip: [-0.05, 0.96], torso: 10, legs: FEET, arms: { ua: -6, fa: 105 } },
    B: { hip: [-0.05, 0.96], torso: 10, legs: FEET, arms: { ua: -6, fa: 4 } } });
  def('ohExt', { p: ['triceps'], load: 'overhead', stack: true, liftAt: 0,
    A: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 172, fa: 178, gwFix: 0.06 } },
    B: { hip: STAND, torso: 0, legs: FEET, arms: { ua: 168, fa: 30 } } });
  def('skullCrusher', { p: ['triceps'], load: 'hands', scene: ['bench'], liftAt: 0, cam: { y: 0.75 },
    A: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ua: 170, fa: 175 } },
    B: { hip: [0.1, 0.56], torso: -90, legs: { ik: [0.58, 0.08], fw: 0.24 }, arms: { ua: 170, fa: 285 } } });
  def('kickback', { p: ['triceps'], load: 'handR', stack: true, scene: ['rowBench'], cam: { az: 25 },
    A: { hip: [-0.1, 0.78], torso: 80, legsL: { ik: [-0.48, 0.5], pole: [1, -1, 0] }, legsR: { ik: [0.0, 0.08, 0.32] },
      armsL: { ik: [0.46, 0.48, 0.2] }, armsR: { ua: -82, fa: 0 } },
    B: { hip: [-0.1, 0.78], torso: 80, legsL: { ik: [-0.48, 0.5], pole: [1, -1, 0] }, legsR: { ik: [0.0, 0.08, 0.32] },
      armsL: { ik: [0.46, 0.48, 0.2] }, armsR: { ua: -82, fa: -84 } } });

  // ---- Core ----
  def('plank', { p: ['abs'], s: ['delts', 'glutes'], load: 'none', scene: ['mat'], cam: { y: 0.35 },
    A: { hip: [-0.3, 0.3], torso: 82, legs: { th: -82, sh: -82, foot: 80 }, arms: { ua: 0, fa: 90 } },
    B: { hip: [-0.3, 0.315], torso: 82, legs: { th: -82, sh: -82, foot: 80 }, arms: { ua: 0, fa: 90 } } });
  def('crunch', { p: ['abs'], load: 'none', stack: true, scene: ['mat'], cam: { y: 0.4 },
    A: { hip: [0, 0.13], torso: -90, legs: { ik: [0.55, 0.09], fw: 0.15 }, arms: { chest: true } },
    B: { hip: [0, 0.13], torso: -52, legs: { ik: [0.55, 0.09], fw: 0.15 }, arms: { chest: true } } });
  def('legRaise', { p: ['abs'], load: 'none', scene: ['mat'], cam: { y: 0.45 },
    A: { hip: [0, 0.13], torso: -90, legs: { th: 86, sh: 87 }, arms: { ua: 88, fa: 88 } },
    B: { hip: [0, 0.13], torso: -90, legs: { th: 178, sh: 180 }, arms: { ua: 88, fa: 88 } } });
  def('hangLeg', { p: ['abs'], s: ['forearms'], load: 'none', scene: ['pullFrame'],
    A: { hip: [-0.02, 1.08], torso: 0, legs: { th: 4, sh: 0 }, arms: { ik: [0.0, 2.22], gw: 0.42, straight: true } },
    B: { hip: [0.0, 1.08], torso: -6, legs: { th: 92, sh: 92 }, arms: { ik: [0.0, 2.22], gw: 0.42, straight: true } } });

  // ---- Frontales / cuerpo completo ----
  def('abduction', { view: 'front', p: ['glutes'], load: 'ankleSide', stack: true, scene: ['towerSide'],
    A: { hip: STAND, torso: 0, legsL: FEET, legsR: { th: 2, sh: 2, plane: 'f' }, armsL: { rel: [0.04, -0.6, 0.06] }, armsR: { ik: [0.0, 1.15, 0.6] } },
    B: { hip: STAND, torso: 0, legsL: FEET, legsR: { th: 36, sh: 36, plane: 'f' }, armsL: { rel: [0.04, -0.6, 0.06] }, armsR: { ik: [0.0, 1.15, 0.6] } } });
  def('jumpingJack', { view: 'front', p: ['delts', 'calves'], s: ['quads', 'glutes'], load: 'none',
    A: { hip: STAND, torso: 0, legs: { th: 3, sh: 3, plane: 'f' }, arms: { ua: 8, fa: 6, plane: 'f' } },
    B: { hip: [0, 0.95], torso: 0, legs: { th: 16, sh: 16, plane: 'f' }, arms: { ua: 165, fa: 170, plane: 'f' } } });
  def('swing', { p: ['glutes', 'hams'], s: ['delts', 'lowback', 'abs'], load: 'kb',
    A: { hip: [-0.25, 0.74], torso: 58, legs: { ik: [0.0, 0.08], fw: 0.2 }, arms: { ik: [-0.05, 0.5], gw: 0.04, straight: true } },
    B: { hip: STAND, torso: -2, legs: { ik: [0.0, 0.08], fw: 0.2 }, arms: { ik: [0.62, 1.38], gw: 0.04, straight: true } } });

  // ---- Cardio (cíclicos) ----
  def('run', { p: ['quads', 'hams', 'calves', 'glutes'], load: 'none', cyclic: 'run', scene: ['treadmill'] });
  def('walk', { p: ['forearms', 'traps'], s: ['quads', 'calves'], load: 'hands', cyclic: 'walk' });
  def('bike', { p: ['quads', 'calves'], s: ['hams', 'glutes'], load: 'none', cyclic: 'bike', scene: ['bike'] });
  def('rowErg', { p: ['lats', 'quads'], s: ['hams', 'biceps', 'lowback'], load: 'none', cyclic: 'rowErg', scene: ['rower'] });
  def('jumpRope', { view: 'front', p: ['calves'], s: ['delts', 'forearms'], load: 'rope', cyclic: 'jumpRope' });

  // Posturas cíclicas
  function cyclicPose(kind, ph) {
    var w = ph * Math.PI * 2;
    if (kind === 'run' || kind === 'walk') {
      var run = kind === 'run', amp = run ? 32 : 18, s1 = Math.sin(w), s2 = Math.sin(w + Math.PI);
      var knee = function (s, c) { return run ? 10 + 70 * Math.max(0, Math.sin(c)) : 5 + 30 * Math.max(0, Math.sin(c)); };
      var bob = run ? 0.025 * Math.abs(Math.sin(w)) : 0.012 * Math.abs(Math.sin(w));
      var f = { hip: [0, (run ? 0.93 : 0.95) + bob], torso: run ? 9 : 1 };
      f.legsR = { th: amp * s1, sh: amp * s1 - knee(s1, w + 0.6) };
      f.legsL = { th: amp * s2, sh: amp * s2 - knee(s2, w + Math.PI + 0.6) };
      if (run) { f.armsR = { ua: -30 * s1, fa: -30 * s1 + 95 }; f.armsL = { ua: -30 * s2, fa: -30 * s2 + 95 }; }
      else { f.armsR = { ua: -6 * s1, fa: -6 * s1 + 4 }; f.armsL = { ua: -6 * s2, fa: -6 * s2 + 4 }; }
      return f;
    }
    if (kind === 'bike') {
      var cr = [0.18, 0.36], r = 0.17;
      var pr = [cr[0] + Math.cos(-w) * r, cr[1] + Math.sin(-w) * r], pl = [cr[0] - Math.cos(-w) * r, cr[1] - Math.sin(-w) * r];
      return { hip: [-0.3, 1.0], torso: 28, legsR: { ik: [pr[0] - 0.03, pr[1] + 0.03], fw: 0.11 }, legsL: { ik: [pl[0] - 0.03, pl[1] + 0.03], fw: 0.11 },
        arms: { ik: [0.42, 1.22], gw: 0.22 }, pedals: [pr, pl, cr] };
    }
    if (kind === 'rowErg') {
      // piernas -> tronco -> brazos ; vuelta: brazos -> tronco -> piernas
      var u = ph < 0.45 ? ph / 0.45 : (ph < 0.55 ? 1 : 1 - (ph - 0.55) / 0.45);
      var legs = smooth(clamp(u / 0.55, 0, 1)), back = smooth(clamp((u - 0.3) / 0.4, 0, 1)), arms = smooth(clamp((u - 0.55) / 0.45, 0, 1));
      var hx = lerp(0.12, -0.42, legs), tor = lerp(28, -20, back);
      var tt = rad(tor), sho = [hx + Math.sin(tt) * SPINE, 0.36 + Math.cos(tt) * SPINE];
      var reach = [sho[0] + 0.6, sho[1] - 0.18], pull = [sho[0] + 0.14, sho[1] - 0.24];
      return { hip: [hx, 0.36], torso: tor, legs: { ik: [0.62, 0.3], fw: 0.12, foot: -65 },
        arms: { ik: [lerp(reach[0], pull[0], arms), lerp(reach[1], pull[1], arms)], gw: 0.14, pole: [-1, -0.3, 0.4] } };
    }
    if (kind === 'jumpRope') {
      var hop = 0.045 * Math.max(0, Math.sin(w * 2));
      return { hip: [0, 0.96 + hop], torso: 0, legs: { th: 4, sh: -4 - 10 * Math.max(0, Math.sin(w * 2)) }, arms: { rel: [0.08, -0.48, 0.2], pole: [-1, -0.5, 0] }, rope: w };
    }
  }

  // ---------------------------------------------------------------------------
  //  Escena por ejercicio
  // ---------------------------------------------------------------------------
  function labelFor(d, eq) {
    if (eq === 'cable' || ['pulldown', 'seatedRow', 'facePull', 'pushdown', 'twinCable'].indexOf(d.load) >= 0) return 'MÁX';
    if (eq === 'machine') return d.smith ? '100 kg' : 'MÁX';
    if (d.load === 'machine' || d.load === 'sled') return 'MÁX';
    if (eq === 'barbell') return '100 kg';
    if (eq === 'dumbbell') return d.load === 'handR' ? '40 kg' : '2 × 40 kg';
    if (eq === 'kettlebell') return '40 kg';
    return '';
  }
  function tempo(ph) {
    if (ph < 0.36) return smooth(ph / 0.36);
    if (ph < 0.46) return 1;
    if (ph < 0.9) return 1 - smooth((ph - 0.46) / 0.44);
    return 0;
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
    scene.add(new T.HemisphereLight(0xffffff, 0x3a3f4a, 0.75));
    var key1 = new T.DirectionalLight(0xffffff, 1.15);
    key1.position.set(2.5, 4.5, 3.2); key1.castShadow = true;
    key1.shadow.mapSize.set(1024, 1024); key1.shadow.camera.left = -2.5; key1.shadow.camera.right = 2.5;
    key1.shadow.camera.top = 3; key1.shadow.camera.bottom = -1; key1.shadow.bias = -0.0005; key1.shadow.radius = 4;
    scene.add(key1);
    var rim = new T.DirectionalLight(0xbfd4ff, 0.45); rim.position.set(-3, 2.5, -2.5); scene.add(rim);
    var disc = new T.Mesh(new T.CircleGeometry(2.6, 64), new T.MeshBasicMaterial({ color: 0x1c1e24 }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = -0.002; scene.add(disc);
    var floor = new T.Mesh(new T.PlaneGeometry(12, 12), new T.ShadowMaterial({ opacity: 0.45 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    var body = makeBody(scene, active);
    var eqp = { cables: [] };
    var smith = eq === 'machine' && d.smith;
    var barMode = (eq === 'barbell' || smith);
    var needsStack = (eq === 'cable') || (eq === 'machine' && d.stack && !smith) ||
      ['pulldown', 'seatedRow', 'facePull', 'pushdown', 'machine', 'twinCable', 'ankleSide', 'ankle'].indexOf(d.load) >= 0;
    if (['ankle', 'ankleSide'].indexOf(d.load) >= 0 && eq !== 'cable' && eq !== 'machine') needsStack = false;

    // Escena fija
    var sc = d.scene || [];
    var G = new T.Group(); scene.add(G);
    function legs4(x0, x1, z0, z1, y) { [[x0, z0], [x0, z1], [x1, z0], [x1, z1]].forEach(function (p) { box(G, 0.05, y, 0.05, M.frame, p[0], y / 2, p[1]); }); }
    if (sc.indexOf('bench') >= 0) { rbox(G, 1.25, 0.07, 0.3, M.pad, 0.0, 0.43, 0); legs4(-0.5, 0.5, -0.1, 0.1, 0.4); }
    if (sc.indexOf('benchRack') >= 0) {
      [-1, 1].forEach(function (sg) { box(G, 0.06, 1.25, 0.06, M.frame, -0.62, 0.62, sg * 0.55); box(G, 0.12, 0.04, 0.06, M.metal, -0.56, 1.12, sg * 0.55); });
      box(G, 0.3, 0.04, 1.2, M.frame, -0.62, 0.02, 0);
    }
    if (sc.indexOf('rack') >= 0 && !(eq === 'machine' && d.smith)) {
      [-1, 1].forEach(function (sg) { box(G, 0.07, 1.75, 0.07, M.frame, -0.42, 0.875, sg * 0.62); box(G, 0.14, 0.05, 0.07, M.metal, -0.35, 1.38, sg * 0.62); box(G, 0.55, 0.05, 0.07, M.frame, -0.2, 0.03, sg * 0.62); });
      box(G, 0.8, 0.03, 1.4, M.pad, 0, 0.015, 0);
    }
    if (sc.indexOf('inclineBench') >= 0) {
      var ib = rbox(G, 0.9, 0.07, 0.3, M.pad, -0.2, 0.62, 0); ib.rotation.z = rad(-38);
      rbox(G, 0.42, 0.07, 0.3, M.pad, 0.18, 0.43, 0); legs4(-0.4, 0.3, -0.1, 0.1, 0.4);
    }
    if (sc.indexOf('rowBench') >= 0) { rbox(G, 1.1, 0.07, 0.3, M.pad, 0.0, 0.43, -0.17); legs4(-0.45, 0.45, -0.27, -0.07, 0.4); }
    if (sc.indexOf('thrustBench') >= 0) { rbox(G, 0.35, 0.07, 1.0, M.pad, -0.62, 0.43, 0); legs4(-0.72, -0.52, -0.4, 0.4, 0.4); }
    if (sc.indexOf('mat') >= 0) box(G, 1.9, 0.015, 0.65, M.mat, -0.05, 0.008, 0);
    if (sc.indexOf('step') >= 0) box(G, 0.4, 0.1, 0.7, M.pad, 0.02, 0.05, 0);
    if (sc.indexOf('pullFrame') >= 0) {
      [-1, 1].forEach(function (sg) { box(G, 0.07, 2.3, 0.07, M.frame, 0.0, 1.15, sg * 0.75); box(G, 0.6, 0.04, 0.07, M.frame, 0.0, 0.02, sg * 0.75); });
      var pb = cyl(G, 0.018, 1.6, M.metal); pb.rotation.x = Math.PI / 2; pb.position.set(0.0, 2.22, 0);
    }
    if (sc.indexOf('dipStation') >= 0) {
      [-1, 1].forEach(function (sg) {
        var hb = cyl(G, 0.02, 0.7, M.metal); hb.rotation.z = Math.PI / 2; hb.position.set(0.05, 1.24, sg * 0.27);
        box(G, 0.06, 1.24, 0.06, M.frame, 0.38, 0.62, sg * 0.27); box(G, 0.06, 1.24, 0.06, M.frame, -0.28, 0.62, sg * 0.27);
      });
    }
    if (sc.indexOf('hyperBench') >= 0) {
      var hp = rbox(G, 0.3, 0.08, 0.4, M.pad, 0.07, 0.9, 0); hp.rotation.z = rad(45);
      var fp = rbox(G, 0.12, 0.06, 0.4, M.pad, -0.55, 0.3, 0); fp.rotation.z = rad(45);
      var rail = box(G, 0.06, 1.2, 0.06, M.frame, -0.25, 0.55, 0); rail.rotation.z = rad(-48);
      box(G, 0.06, 0.88, 0.06, M.frame, 0.12, 0.44, 0); box(G, 1.1, 0.04, 0.5, M.frame, -0.2, 0.02, 0);
    }
    if (sc.indexOf('preacher') >= 0) {
      var pp = rbox(G, 0.34, 0.06, 0.5, M.pad, 0.07, 0.93, 0); pp.rotation.z = rad(-45);
      box(G, 0.06, 0.88, 0.06, M.frame, 0.12, 0.44, 0); rbox(G, 0.32, 0.07, 0.32, M.pad, -0.12, 0.5, 0); box(G, 0.06, 0.48, 0.06, M.frame, -0.12, 0.24, 0);
    }
    if (sc.indexOf('legExt') >= 0) {
      rbox(G, 0.45, 0.08, 0.42, M.pad, 0.1, 0.5, 0);
      var bk = rbox(G, 0.08, 0.6, 0.42, M.pad, -0.2, 0.85, 0); bk.rotation.z = rad(-10);
      box(G, 0.06, 0.48, 0.06, M.frame, 0.1, 0.24, 0); box(G, 0.6, 0.04, 0.5, M.frame, 0.0, 0.02, 0);
      eqp.lever = box(G, 0.04, 0.42, 0.04, M.frame, 0, 0, 0.3);
      eqp.roller = cyl(G, 0.05, 0.42, M.pad); eqp.roller.rotation.x = Math.PI / 2;
    }
    if (sc.indexOf('legCurl') >= 0) {
      rbox(G, 1.25, 0.08, 0.38, M.pad, 0.15, 0.54, 0); legs4(-0.35, 0.65, -0.12, 0.12, 0.5);
      eqp.roller = cyl(G, 0.05, 0.42, M.pad); eqp.roller.rotation.x = Math.PI / 2;
      eqp.lever = box(G, 0.04, 0.44, 0.04, M.frame, 0, 0, 0.3);
    }
    if (sc.indexOf('chestPress') >= 0) {
      rbox(G, 0.42, 0.08, 0.42, M.pad, -0.05, 0.5, 0);
      var cb = rbox(G, 0.08, 0.75, 0.42, M.pad, -0.24, 0.92, 0); cb.rotation.z = rad(-8);
      box(G, 0.06, 0.48, 0.06, M.frame, -0.05, 0.24, 0); box(G, 0.7, 0.04, 0.6, M.frame, -0.2, 0.02, 0);
      eqp.handles = [box(G, 0.04, 0.16, 0.04, M.metal, 0, 0, -0.28), box(G, 0.04, 0.16, 0.04, M.metal, 0, 0, 0.28)];
      eqp.arms = [box(G, 0.04, 1, 0.04, M.frame, 0, 0, -0.33), box(G, 0.04, 1, 0.04, M.frame, 0, 0, 0.33)];
    }
    if (sc.indexOf('pulldown') >= 0) {
      rbox(G, 0.42, 0.08, 0.42, M.pad, 0.0, 0.5, 0); box(G, 0.06, 0.48, 0.06, M.frame, 0.0, 0.24, 0);
      rbox(G, 0.12, 0.1, 0.42, M.pad, 0.38, 0.72, 0); box(G, 0.05, 0.72, 0.05, M.frame, 0.38, 0.36, 0);
      box(G, 0.05, 0.05, 1.0, M.frame, -0.2, 2.42, 0); box(G, 0.6, 0.05, 0.05, M.frame, 0.06, 2.42, 0);
    }
    if (sc.indexOf('seatedRow') >= 0) {
      box(G, 1.6, 0.06, 0.3, M.frame, 0.1, 0.18, 0); rbox(G, 0.42, 0.08, 0.38, M.pad, -0.38, 0.38, 0);
      box(G, 0.06, 0.2, 0.06, M.frame, -0.38, 0.28, 0);
      var plate = box(G, 0.05, 0.32, 0.5, M.frame, 0.5, 0.36, 0); plate.rotation.z = rad(-20);
    }
    if (sc.indexOf('seatedCalf') >= 0) {
      rbox(G, 0.42, 0.08, 0.42, M.pad, -0.2, 0.52, 0); box(G, 0.06, 0.5, 0.06, M.frame, -0.2, 0.25, 0);
      box(G, 0.25, 0.1, 0.5, M.pad, 0.42, 0.06, 0);
      eqp.kneePad = rbox(G, 0.22, 0.07, 0.48, M.pad, 0, 0, 0);
    }
    if (sc.indexOf('legPress') >= 0) {
      var seat = rbox(G, 0.45, 0.08, 0.5, M.pad, -0.3, 0.48, 0); seat.rotation.z = rad(-8);
      var back = rbox(G, 0.08, 0.7, 0.5, M.pad, -0.62, 0.78, 0); back.rotation.z = rad(-38);
      [-1, 1].forEach(function (sg) { var r1 = box(G, 0.06, 1.8, 0.06, M.frame, 0.5, 0.88, sg * 0.32); r1.rotation.z = rad(-45); });
      box(G, 2.0, 0.05, 0.8, M.frame, 0.1, 0.025, 0);
      eqp.sled = new T.Group(); G.add(eqp.sled);
      box(eqp.sled, 0.06, 0.6, 0.62, M.metal, 0, 0, 0);
      var sp = barbell(eqp.sled); sp.scale.set(0.9, 0.9, 0.42); sp.position.set(0.25, 0.25, 0); sp.rotation.z = rad(45);
    }
    if (sc.indexOf('treadmill') >= 0) {
      box(G, 1.7, 0.12, 0.75, M.frame, -0.05, 0.06, 0); eqp.belt = box(G, 1.55, 0.02, 0.6, M.belt, -0.05, 0.13, 0);
      [-1, 1].forEach(function (sg) { var up = box(G, 0.05, 1.2, 0.05, M.frame, 0.65, 0.65, sg * 0.36); up.rotation.z = rad(-10); });
      box(G, 0.25, 0.12, 0.8, M.frame, 0.75, 1.25, 0);
    }
    if (sc.indexOf('bike') >= 0) {
      box(G, 1.1, 0.05, 0.45, M.frame, 0.0, 0.025, 0);
      var post = box(G, 0.06, 0.95, 0.06, M.frame, -0.22, 0.5, 0); post.rotation.z = rad(16);
      var fr = box(G, 0.06, 1.25, 0.06, M.frame, 0.32, 0.65, 0); fr.rotation.z = rad(-20);
      rbox(G, 0.3, 0.06, 0.18, M.pad, -0.27, 0.97, 0);
      var hbar = cyl(G, 0.018, 0.5, M.metal); hbar.rotation.x = Math.PI / 2; hbar.position.set(0.44, 1.22, 0);
      var fly = cyl(G, 0.26, 0.06, M.plate, 40); fly.rotation.x = Math.PI / 2; fly.position.set(0.48, 0.42, 0);
      eqp.crank = new T.Group(); G.add(eqp.crank);
    }
    if (sc.indexOf('rower') >= 0) {
      box(G, 2.1, 0.05, 0.16, M.frame, 0.0, 0.3, 0); box(G, 0.08, 0.28, 0.4, M.frame, -0.95, 0.14, 0);
      box(G, 0.1, 0.62, 0.4, M.frame, 0.95, 0.31, 0);
      var fw = cyl(G, 0.25, 0.14, M.plate, 40); fw.rotation.x = Math.PI / 2; fw.position.set(0.98, 0.62, 0);
      [-1, 1].forEach(function (sg) { var fpl = box(G, 0.04, 0.3, 0.16, M.metal, 0.66, 0.4, sg * 0.13); fpl.rotation.z = rad(-25); });
      eqp.seat = rbox(G, 0.3, 0.06, 0.3, M.pad, 0, 0.36, 0);
    }

    // Cargas en las manos / torres
    var tw = null, tw2 = null;
    var cableLoads = ['pulldown', 'seatedRow', 'facePull', 'pushdown', 'twinCable', 'ankle', 'ankleSide'];
    var compactMachine = needsStack && eq === 'machine' && cableLoads.indexOf(d.load) < 0;
    if (compactMachine) {
      var mp = d.machinePos || [-0.62, -0.55, 0];
      tw = machineStack(scene, mp[0], mp[1], rad(mp[2] || 0));
      needsStack = false;
    }
    if (needsStack) {
      var towerPos = { pulldown: [-0.45, -0.0], seatedRow: [1.0, 0], facePull: [0.95, 0], pushdown: [0.55, 0], twinCable: null };
      if (d.load === 'twinCable') { tw = stackTower(scene, -0.05, -1.05); tw2 = stackTower(scene, -0.05, 1.05); }
      else if (d.load === 'ankleSide' || sc.indexOf('towerSide') >= 0) tw = stackTower(scene, 0.0, -0.95);
      else if (towerPos[d.load]) tw = stackTower(scene, towerPos[d.load][0], towerPos[d.load][1]);
      else if (sc.indexOf('towerFront') >= 0) tw = stackTower(scene, 0.75, 0);
      else tw = stackTower(scene, -0.75, -0.45);
    }
    if (sc.indexOf('towerFront') >= 0 && !tw && eq !== 'machine') tw = stackTower(scene, 0.75, 0);
    var pulleyPts = null;
    if (tw && !tw.compact) eqp.cables.push(cableMesh(scene), cableMesh(scene), cableMesh(scene));
    if (tw2) eqp.cables.push(cableMesh(scene), cableMesh(scene), cableMesh(scene));

    var bar = null, dbs = [], kb = null, handle = null, rope = null, smithRails = null;
    if (barMode && ['hands', 'back', 'chest', 'hip', 'handsFront', 'overhead'].indexOf(d.load) >= 0) bar = barbell(scene);
    if (smith && bar) {
      smithRails = new T.Group(); scene.add(smithRails);
      [-1, 1].forEach(function (sg) { box(smithRails, 0.06, 2.3, 0.06, M.frame, 0, 1.15, sg * 0.98); });
      box(smithRails, 0.06, 0.06, 2.02, M.frame, 0, 2.3, 0);
    }
    if (eq === 'dumbbell' && ['hands', 'handR', 'handsFront', 'chest', 'overhead', 'hip'].indexOf(d.load) >= 0) {
      if (d.load === 'chest' || d.load === 'overhead' || d.load === 'hip') dbs.push(dumbbell(scene));
      else if (d.load === 'handR') dbs.push(dumbbell(scene));
      else dbs.push(dumbbell(scene), dumbbell(scene));
    }
    if (eq === 'kettlebell' || d.load === 'kb') kb = kettlebell(scene);
    if ((tw && !tw.compact) || d.load === 'pulldown') {
      handle = new T.Group(); scene.add(handle);
      var hw = (d.load === 'pulldown') ? 1.1 : (d.load === 'seatedRow' || d.load === 'facePull' || d.load === 'pushdown') ? 0.32 : 0.14;
      var hb2 = cyl(handle, 0.016, hw, M.metal); hb2.rotation.x = Math.PI / 2;
    }
    if (d.load === 'rope') {
      rope = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([V(0, 1, -0.3), V(0, 0, 0), V(0, 1, 0.3)]), 24, 0.008, 6), M.stack);
      scene.add(rope);
    }

    // Cámara
    var view = d.view || 'side';
    var camera = new T.PerspectiveCamera(30, 1, 0.1, 50);
    var cam = d.cam || {};
    var az = cam.az != null ? cam.az : (view === 'front' ? 62 : 32), el = 12;
    var fA = d.cyclic ? cyclicPose(d.cyclic, 0) : d.A, fB = d.cyclic ? cyclicPose(d.cyclic, 0.5) : d.B;
    var jA = solve(fA), jB = solve(fB);
    var pts = [];
    [jA, jB].forEach(function (jj) { pts.push(jj.head, jj.hip, jj.hand.L, jj.hand.R, jj.ank.L, jj.ank.R, jj.toe.R, jj.knee.R); });
    var minY = 0, maxY = Math.max.apply(null, pts.map(function (p) { return p.y; })) + 0.15;
    var minX = Math.min.apply(null, pts.map(function (p) { return p.x; })) - 0.2, maxX = Math.max.apply(null, pts.map(function (p) { return p.x; })) + 0.2;
    if (tw) { maxY = Math.max(maxY, 2.3); }
    var cx = (minX + maxX) / 2, cy = cam.y != null ? cam.y : (minY + maxY) / 2;
    var ext = Math.max(maxX - minX, maxY - minY, 1.4);
    var dist = (ext / 2) / Math.tan(rad(15)) * 1.08 * (cam.dist || 1);
    var tgt = V(cx, cy, 0);
    camera.position.set(tgt.x + dist * Math.cos(rad(el)) * Math.sin(rad(az)), tgt.y + dist * Math.sin(rad(el)), tgt.z + dist * Math.cos(rad(el)) * Math.cos(rad(az)));
    camera.lookAt(tgt);

    var liftAt = d.liftAt == null ? 1 : d.liftAt;

    function update(phase) {
      var u = d.cyclic ? phase : tempo(phase);
      var f = d.cyclic ? cyclicPose(d.cyclic, phase) : mixVal(d.A, d.B, u);
      // Brazos que sujetan la barra en la espalda / pecho / cadera: se calculan con el tronco
      var A = f.arms || {};
      if (A.bar) {
        var j0 = solve(Object.assign({}, f, { arms: { ua: 0, fa: 0 } }));
        var bp;
        if (A.bar === 'back') bp = j0.shoC.clone().add(j0.up.clone().multiplyScalar(0.02)).add(j0.fwd.clone().multiplyScalar(-0.07));
        else if (A.bar === 'chest') bp = j0.shoC.clone().add(j0.fwd.clone().multiplyScalar(0.12)).add(j0.up.clone().multiplyScalar(-0.03));
        else bp = j0.hip.clone().add(j0.fwd.clone().multiplyScalar(0.15));
        var gw = A.bar === 'chest' ? (eq === 'dumbbell' || eq === 'kettlebell' ? 0.05 : 0.22) : 0.42;
        f = Object.assign({}, f, { arms: { ik: [bp.x, bp.y], gw: gw, pole: A.pole || (A.bar === 'chest' ? [0, -1, 0.4] : [0, -1, 0.5]) } });
        f._bar = bp;
      }
      var j = solve(f);
      poseBody(body, j);
      var lift = d.cyclic ? 0 : (liftAt === 1 ? u : 1 - u);
      var hm = j.hand.L.clone().add(j.hand.R).multiplyScalar(0.5);

      if (bar) {
        var bpos = f._bar ? f._bar : (d.load === 'hip' ? j.hip.clone().add(j.fwd.clone().multiplyScalar(0.15)) : hm);
        bar.position.copy(bpos);
        if (smithRails) smithRails.position.set(bpos.x, 0, 0);
      }
      if (dbs.length === 2) { dbs[0].position.copy(j.hand.L); dbs[1].position.copy(j.hand.R); }
      else if (dbs.length === 1) dbs[0].position.copy(d.load === 'handR' ? j.hand.R : (f._bar || hm));
      if (kb) {
        kb.position.copy(hm);
        var armDir = hm.clone().sub(j.shoC).normalize();
        kb.quaternion.setFromUnitVectors(V(0, -1, 0), armDir);
      }
      if (handle) {
        handle.position.copy(d.load === 'ankle' ? j.ank.R : (d.load === 'ankleSide' ? j.ank.R : hm));
      }
      // Máquinas con partes móviles
      if (eqp.roller) {
        var rp = d.load === 'machine' && sc.indexOf('legExt') >= 0 ? j.ank.R.clone().add(j.knee.R.clone().sub(j.ank.R).normalize().multiplyScalar(0.06)).add(j.fwd.clone().multiplyScalar(0.05))
          : j.ank.R.clone().add(V(0, 0.07, 0));
        eqp.roller.position.set(rp.x, rp.y, 0);
        segment(eqp.lever, V(j.knee.R.x, j.knee.R.y, 0.3), V(rp.x, rp.y, 0.3));
      }
      if (eqp.handles) {
        var pivot = V(-0.15, 1.95, 0);
        [j.hand.L, j.hand.R].forEach(function (h, i) { eqp.handles[i].position.set(h.x, h.y, i ? 0.28 : -0.28); segment(eqp.arms[i], V(pivot.x, pivot.y, i ? 0.33 : -0.33), V(h.x, h.y, i ? 0.33 : -0.33)); });
      }
      if (eqp.kneePad) eqp.kneePad.position.set(j.knee.R.x - 0.04, j.knee.R.y + 0.09, 0);
      if (eqp.sled) {
        var mid = j.toe.R.clone().add(j.ank.R).multiplyScalar(0.5);
        eqp.sled.position.set(mid.x + 0.04, mid.y + 0.04, 0); eqp.sled.rotation.z = rad(-45);
      }
      if (eqp.belt) eqp.belt.material.color.setHex(0x1b1d22);
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
        var w = f.rope, hL = j.hand.L, hR = j.hand.R, c1 = hm.clone();
        var apex = c1.clone().add(V(Math.sin(w) * 0.85, -Math.cos(w) * 0.95 + 0.02, 0));
        if (apex.y < 0.01) apex.y = 0.01;
        rope.geometry.dispose();
        rope.geometry = new T.TubeGeometry(new T.CatmullRomCurve3([hL, apex.clone().add(V(0, 0, -0.25)), apex, apex.clone().add(V(0, 0, 0.25)), hR]), 32, 0.008, 6);
      }

      // Torres y cables
      if (tw && tw.compact) tw.stack.position.y = lift * 0.3;
      if (tw && !tw.compact) {
        tw.stack.position.y = lift * 0.32;
        if (tw2) tw2.stack.position.y = lift * 0.32;
        var top = tw.top(), st = tw.stackTop();
        var anchor, target = handle ? handle.position.clone() : hm.clone();
        if (d.load === 'twinCable') {
          var t2 = tw2.top();
          segment(eqp.cables[0], tw.top(), j.hand.L); segment(eqp.cables[1], tw.stackTop(), tw.top());
          segment(eqp.cables[3], t2, j.hand.R); segment(eqp.cables[4], tw2.stackTop(), t2); eqp.cables[2].visible = false; eqp.cables[5].visible = false;
        } else {
          if (d.load === 'pulldown') anchor = V(0.1, 2.42, 0);
          else if (d.load === 'seatedRow') anchor = V(0.85, 0.85, 0);
          else if (d.load === 'facePull') anchor = V(0.85, 1.6, 0);
          else if (d.load === 'pushdown') anchor = V(0.5, 2.15, 0);
          else if (d.load === 'ankle') anchor = V(0.7, 0.12, 0);
          else if (d.load === 'ankleSide') anchor = V(0.0, 0.12, -0.8);
          else anchor = top;
          if (d.load === 'ankle') target = j.ank.R.clone();
          if (d.load === 'ankleSide') target = j.ank.R.clone();
          segment(eqp.cables[0], anchor, target);
          segment(eqp.cables[1], st, top);
          if (anchor !== top) segment(eqp.cables[2], top, anchor); else eqp.cables[2].visible = false;
          if (anchor !== top && d.load !== 'pulldown') { /* recorrido polea -> ancla */ }
        }
      }
    }
    update(0.43);
    return { scene: scene, camera: camera, update: update, label: labelFor(d, eq), view: view };
  }

  // ---------------------------------------------------------------------------
  //  Montaje en un canvas (app)
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
    patterns: Object.keys(P).filter(function (k) { return k !== 'lateral'; }), label: function (k, e) { return labelFor(P[k] || P.curl, e || 'none'); } };
})(window);
