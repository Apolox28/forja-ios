/* Forja · perrito salchicha con corona (mascota del logo) que acompaña las animaciones.
 *
 * Modelo: «Dachshund Sculpt» de Angelina (Sketchfab, CC BY 4.0), riggeado (49 huesos) y preparado con
 * modelo/herramientas/bake.mjs: pivotes de hombros, mandíbula y orejas corregidos, pesos rehechos por zonas con
 * difusión por la malla, boca cortada por los labios y ~46k caras.
 *
 * Uso (no modifica el motor):
 *   FORJA_DOG.setModel(base64OrArrayBuffer, function () { ... });   // una vez
 *   var st = FORJA3D.createStage(key, eq, muscle, view);
 *   FORJA_DOG.attach(st, FORJA_DOG.behaviorFor(key, eq));   // se coloca solo en una esquina del encuadre, mirando a la persona
 *
 * Conductas: sit, bark, treadmill, proud, lie, celebrate, pant, stretch, yawn, beg, howl, tailchase, sniff.
 * El suelo se precalcula por ciclo con la malla deformada: nunca flota ni se hunde.
 */
(function (global) {
  'use strict';
  var T = global.THREE;
  var PI = Math.PI;

  var SRC = null;          // escena del glTF original (se clona por perro)
  var SCALE = 0.32;        // el modelo mide ~2 m de hocico a cola; un salchicha real ~0,65 m
  var FLOOR = 0.097;       // el modelo tiene las patas en y = -0.097

  // ---------------------------------------------------------------- carga
  function toBuffer(data) {
    if (data instanceof ArrayBuffer) return data;
    var bin = atob(data), buf = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf.buffer;
  }
  function setModel(data, cb) {
    new T.GLTFLoader().parse(toBuffer(data), '', function (g) {
      SRC = g.scene;
      recolor(SRC);
      if (cb) cb();
    }, function (e) { if (cb) cb(e); });
  }

  // Pelaje negro uniforme y mate, mancha blanca en el pecho (como el logo) y trufa negra; ojos oscuros con brillo.
  function recolor(scene) {
    scene.traverse(function (o) {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.frustumCulled = false;
      var g = o.geometry, pos = g.attributes.position;
      if (o.material.name === 'Coco') {
        var out = new Float32Array(pos.count * 3);
        if (!g.attributes.normal) g.computeVertexNormals();
        var nrm = g.attributes.normal;
        for (var i = 0; i < pos.count; i++) {
          var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), nz = nrm.getZ(i), ny = nrm.getY(i);
          // pecho: parte delantera e inferior del tórax, con borde suave
          var cx = 0.06 - Math.max(0, y - 0.25) * 0.6, inZ = Math.min(smoothE(z, 0.16, 0.2), 1 - smoothE(z, 0.38, 0.42));
          var inY = Math.min(smoothE(y, 0.15, 0.19), 1 - smoothE(y, 0.27, 0.31)), inX = 1 - smoothE(Math.abs(x), cx - 0.012, cx + 0.012);
          var face = Math.max(smoothE(-ny, 0.05, 0.25), smoothE(nz, 0.25, 0.45));
          var w = Math.max(0, Math.min(inZ, inY, inX, face));
          var base = z > 0.74 ? 0.012 : 0.018;
          out[i * 3] = base + (0.86 - base) * w; out[i * 3 + 1] = base + (0.85 - base) * w; out[i * 3 + 2] = base * 1.15 + (0.82 - base * 1.15) * w;
        }
        g.setAttribute('color', new T.BufferAttribute(out, 3));
        o.material = furMaterial();
        o.material.name = 'Coco';
      } else if (o.name === 'EyeSparklies' || (o.parent && o.parent.name === 'EyeSparklies')) {
        o.material = new T.MeshBasicMaterial({ color: 0xffffff });
        o.castShadow = false;
      } else if (g.attributes.color) {
        // ojos: el esculpido trae pupila e iris pintados; se oscurecen a marrón muy oscuro y negro
        var col = g.attributes.color, ec = new Float32Array(col.count * 3), c = new T.Color();
        for (var j = 0; j < col.count; j++) {
          c.fromBufferAttribute(col, j);
          var l = (c.r + c.g + c.b) / 3, t = smoothE(l, 0.15, 0.55);
          ec[j * 3] = 0.008 + 0.075 * t; ec[j * 3 + 1] = 0.006 + 0.04 * t; ec[j * 3 + 2] = 0.004 + 0.022 * t;
        }
        g.setAttribute('color', new T.BufferAttribute(ec, 3));
        if (!g.attributes.normal) g.computeVertexNormals();
        o.material = new T.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 });
        o.castShadow = false;
      }
    });
  }
  function smoothE(v, a, b) { var t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); }

  // Pelo corto: mate, con un brillo suave (sheen) en el contorno; sin relieve de ruido (se veía granulado).
  function furMaterial() {
    return new T.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, sheen: 0.25, sheenRoughness: 0.6, sheenColor: new T.Color(0x23262d) });
  }

  // ---------------------------------------------------------------- materiales de utilería
  var MAT = null;
  function mats() {
    if (MAT) return MAT;
    MAT = {
      gold: new T.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.28, metalness: 0.85, emissive: 0x3a2600, emissiveIntensity: 0.4, side: T.DoubleSide }),
      gem: new T.MeshStandardMaterial({ color: 0xd8262d, roughness: 0.2, metalness: 0.3 }),
      tongue: new T.MeshStandardMaterial({ color: 0xe8778f, roughness: 0.45 }),
      tmBase: new T.MeshStandardMaterial({ color: 0x343a46, roughness: 0.5, metalness: 0.45 }),
      tmBelt: new T.MeshStandardMaterial({ color: 0x15171b, roughness: 0.95 }),
      tmStripe: new T.MeshStandardMaterial({ color: 0x3a3f49, roughness: 0.9 }),
      tmAccent: new T.MeshStandardMaterial({ color: 0xff8a3d, roughness: 0.5 }),
      dbMetal: new T.MeshStandardMaterial({ color: 0xb8c0cc, roughness: 0.28, metalness: 0.85 }),
      dbPlate: new T.MeshStandardMaterial({ color: 0x23262d, roughness: 0.55, metalness: 0.2 })
    };
    return MAT;
  }
  function mesh(geo, mat, parent, x, y, z) {
    var m = new T.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    if (parent) parent.add(m);
    return m;
  }

  // Corona en coordenadas del modelo (antes de escalar), pegada al hueso de la cabeza
  function addCrown(bones, model) {
    var M = mats(), crown = new T.Group();
    var r = 0.082;
    mesh(new T.CylinderGeometry(r, r * 0.88, 0.055, 32, 1, true), M.gold, crown, 0, 0.027, 0);
    for (var i = 0; i < 5; i++) {
      var a = (i / 5) * PI * 2, cx = Math.cos(a) * r * 0.93, cz = Math.sin(a) * r * 0.93;
      mesh(new T.ConeGeometry(0.019, 0.06, 12), M.gold, crown, cx, 0.083, cz);
      mesh(new T.SphereGeometry(0.0125, 12, 10), M.gold, crown, cx, 0.118, cz);
    }
    mesh(new T.SphereGeometry(0.014, 12, 10), M.gem, crown, 0, 0.027, r * 0.95);
    // posición sobre la coronilla en la pose de reposo, y luego se cuelga del hueso Head
    model.updateMatrixWorld(true);
    crown.position.set(0.0, 0.74, 0.5);
    crown.rotation.set(-0.28, 0, 0.12);
    model.add(crown);
    crown.updateMatrixWorld(true);
    bones.Head.attach(crown);
    return crown;
  }

  // Lengua: descansa sobre el suelo de la boca; D.tongueOut (0..1) la saca por delante, colgando un poco
  function addTongue(bones, model) {
    var t = new T.Mesh(new T.SphereGeometry(0.04, 20, 12), mats().tongue);
    t.scale.set(0.4, 0.2, 0.82);
    var A = [0, 0.547, 0.7, 0.06], B = [0, 0.532, 0.765, 0.5], st = [];
    [A, B].forEach(function (k) { t.position.set(k[0], k[1], k[2]); t.rotation.set(k[3], 0, 0); model.add(t); t.updateMatrixWorld(true); bones.Chin.attach(t); st.push({ p: t.position.clone(), q: t.quaternion.clone() }); bones.Chin.remove(t); });
    bones.Chin.add(t); t.position.copy(st[0].p); t.quaternion.copy(st[0].q);
    t.userData.states = st;
    t.visible = false;
    return t;
  }

  // Interior de la boca (el modelo viene cortado por la línea de los labios): paladar en la cabeza y suelo en la mandíbula
  function addMouth(bones, model) {
    var mat = new T.MeshStandardMaterial({ color: 0x2a0b10, roughness: 0.65, side: T.DoubleSide }), out = [];
    [['Head', 0.562, 0x2a0b10], ['Chin', 0.546, 0x200a0e]].forEach(function (c) {
      var m = new T.Mesh(new T.SphereGeometry(1, 24, 12), c[2] === 0x2a0b10 ? mat : new T.MeshStandardMaterial({ color: c[2], roughness: 0.6, side: T.DoubleSide }));
      m.scale.set(0.04, 0.008, 0.072); m.position.set(0, c[1], 0.71); m.castShadow = false;
      model.add(m); m.updateMatrixWorld(true); bones[c[0]].attach(m); out.push(m);
    });
    return out;
  }

  // ---------------------------------------------------------------- huesos
  var RQ = new T.Quaternion(), PQ = new T.Quaternion(), AQ = new T.Quaternion(), RootInv = new T.Quaternion(), AX = new T.Vector3();
  // Gira un hueso alrededor de un eje expresado en el sistema del perro (X izquierda, Y arriba, Z hacia delante).
  function rot(D, name, axis, ang) {
    var b = D.bones[name];
    if (!b || !ang) return;
    D.model.getWorldQuaternion(RootInv).invert();
    b.parent.getWorldQuaternion(PQ);
    PQ.premultiply(RootInv);                     // padre relativo al perro
    AX.set(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0);
    AQ.setFromAxisAngle(AX, ang);
    RQ.copy(PQ).invert().multiply(AQ).multiply(PQ); // eje del perro llevado al espacio del padre
    b.quaternion.premultiply(RQ);
    b.updateMatrixWorld(true);
  }
  function reset(D) {
    D.boneList.forEach(function (b) { b.quaternion.copy(b.userData.rest); });
    D.model.updateMatrixWorld(true);
  }
  // Pata: muslo, rodilla y tobillo en el plano del perro (positivo = hacia atrás)
  function leg(D, side, front, hip, knee, ankle) {
    var p = front ? 'Front_Leg_' : 'Back_Leg_';
    rot(D, p + (front ? 'Shoulder_' : 'Pelvis_') + side, 'x', front ? hip : -hip);
    rot(D, p + 'Upper_' + side, 'x', knee);
    rot(D, p + 'Lower_' + side, 'x', ankle || 0);
  }
  function legs4(D, f, b) { leg(D, 'L', true, f[0], f[1], f[2]); leg(D, 'R', true, f[0], f[1], f[2]); leg(D, 'L', false, b[0], b[1], b[2]); leg(D, 'R', false, b[0], b[1], b[2]); }
  // Cola: levantada (up) y moviéndose de lado (wag)
  function tail(D, up, wag) {
    ['Tail_Base', 'Tail_Mid', 'Tail_Mid001', 'Tail_End'].forEach(function (n, i) {
      rot(D, n, 'x', up * (i === 0 ? 1 : 0.35));
      rot(D, n, 'y', wag * (0.6 + i * 0.25));
    });
  }
  function ears(D, swing) { rot(D, 'Ear_L', 'z', swing); rot(D, 'Ear_R', 'z', -swing); }

  // ---------------------------------------------------------------- conductas
  // Cada conducta dura un ciclo exacto (PERIOD, en segundos) y se repite; así el apoyo en el suelo se
  // precalcula una vez por ciclo y no hay saltitos. Convenciones medidas en este rig:
  //   Hips +x baja el pecho y sube la grupa · Spine_4/Head +x bajan la cabeza · cola +x arriba · Chin +x abre la boca
  //   patas (leg): positivo = hacia atrás, negativo = hacia delante.
  function smooth(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
  function pulse(p, a, b) { return smooth((p - a) / 0.08) * (1 - smooth((p - b) / 0.08)); } // 0→1→0 entre a y b (fase 0..1)
  var TAU = PI * 2;

  // Cabeza y cuello en cadena: g(fase) devuelve [cabeceo (+ baja), giro (+ izquierda), ladeo]; cada eslabón llega un poco
  // después que el anterior (Spine_3 → Spine_4 → Head) y las orejas reaccionan con más retraso a la velocidad de la cabeza.
  function headChain(D, p, P, g, earBase) {
    var l = function (s) { return g(p - s / P); }, a = l(0), b = l(0.06), c = l(0.12), e1 = l(0.2), e2 = l(0.32);
    rot(D, 'Spine_3', 'x', a[0] * 0.25); rot(D, 'Spine_3', 'y', a[1] * 0.25);
    rot(D, 'Spine_4', 'x', b[0] * 0.35); rot(D, 'Spine_4', 'y', b[1] * 0.35); rot(D, 'Spine_4', 'z', b[2] * 0.3);
    rot(D, 'Head', 'x', c[0] * 0.4); rot(D, 'Head', 'y', c[1] * 0.4); rot(D, 'Head', 'z', c[2] * 0.7);
    var flop = (e2[0] - e1[0]) * 1.4, sway = (e2[1] - e1[1]) * 1.1;
    rot(D, 'Ear_L', 'z', (earBase || 0) + flop + sway); rot(D, 'Ear_R', 'z', -((earBase || 0) + flop - sway));
  }
  // Mirada viva: pequeños giros de seguimiento hacia la persona y ladeos de curiosidad
  function alive(p, k) { k = k || 1; return [0.06 * Math.sin(p * TAU * 2 + 1) * k, (0.16 * Math.sin(p * TAU) + 0.06 * Math.sin(p * TAU * 3 + 2)) * k, (0.4 * pulse(p, 0.42, 0.68) - 0.25 * pulse(p, 0.08, 0.22)) * k]; }

  var PERIOD = { sit: 6, bark: 1.6, treadmill: 0.84, proud: 4, lie: 5, celebrate: 1.8, pant: 1.4,
                 stretch: 6, yawn: 5, beg: 2, howl: 4, tailchase: 2, sniff: 4 };

  var BEHAVIORS = {
    // Sentado mirando a la persona, mueve la cola y de vez en cuando ladea la cabeza
    sit: function (D, t, p) {
      var Q = D.q || {};
      rot(D, 'Hips', 'x', Q.hips != null ? Q.hips : -0.35);
      if (Q.spine) { rot(D, 'Spine_2', 'x', Q.spine); rot(D, 'Spine_2001', 'x', Q.spine); }
      var f = Q.f || [0.35, 0, 0], b = Q.b || [-1.0, 2.4, -1.55];
      legs4(D, f, b);
      if (Q.splay) { rot(D, 'Back_Leg_Pelvis_L', 'z', Q.splay); rot(D, 'Back_Leg_Pelvis_R', 'z', -Q.splay); }
      rot(D, 'Spine_4', 'x', Q.neck != null ? Q.neck : 0.22);
      rot(D, 'Head', 'x', Q.head != null ? Q.head : 0.1);
      headChain(D, p, PERIOD.sit, function (q) { return alive(q); });
      tail(D, Q.tail != null ? Q.tail : 0.5, Math.sin(p * TAU * 12) * 0.35);
    },
    // De pie ladrando: tres ladridos seguidos; en cada uno echa la cabeza adelante y arriba y abre bien la boca
    bark: function (D, t, p) {
      var bk = function (q) { q = ((q % 1) + 1) % 1; var o = 0; [0.06, 0.2, 0.34].forEach(function (s0) { var u = (q - s0) / 0.1; if (u > 0 && u < 1) o = Math.max(o, Math.sin(u * PI) * (u < 0.35 ? 1 : 1 - (u - 0.35) * 0.4)); }); return o; };
      var b = bk(p);
      rot(D, 'Hips', 'x', -0.06 * b);
      legs4(D, [-0.12 * b, 0.2 * b, -0.08 * b], [0.04, 0, 0]);
      rot(D, 'Spine_4', 'x', -0.1);
      headChain(D, p, PERIOD.bark, function (q) { var v = bk(q); return [-0.55 * v + 0.05, 0.12 * Math.sin(q * TAU), 0.1 * pulse(q, 0.55, 0.85)]; }, 0.05);
      rot(D, 'Chin', 'x', 0.62 * b);
      D.tongue.visible = true;
      tail(D, 0.5, Math.sin(p * TAU * 4) * 0.45);
    },
    // Trota en su mini caminadora con la lengua afuera
    treadmill: function (D, t, p) {
      var w = p * TAU * 2, s = Math.sin(w), cA = Math.max(0, -Math.cos(w)), cB = Math.max(0, Math.cos(w));
      leg(D, 'L', true, 0.4 * s, 0.7 * cA, 0); leg(D, 'R', false, 0.4 * s, -0.7 * cA, 0);
      leg(D, 'R', true, -0.4 * s, 0.7 * cB, 0); leg(D, 'L', false, -0.4 * s, -0.7 * cB, 0);
      rot(D, 'Spine_2', 'x', Math.sin(w * 2) * 0.03);
      headChain(D, p, PERIOD.treadmill, function (q) { var ww = q * TAU * 2; return [-0.12 + Math.sin(ww * 2) * 0.12, Math.sin(ww) * 0.06, 0]; }, 0.1);
      rot(D, 'Chin', 'x', 0.32); D.tongueOut = 0.55;
      D.tongue.visible = true;
      tail(D, 0.3, Math.sin(w) * 0.3);
    },
    // De pie, pecho afuera y cabeza en alto, como el logo, junto a su mancuerna
    proud: function (D, t, p) {
      var br = Math.sin(p * TAU);
      rot(D, 'Spine_2001', 'x', -0.04 - br * 0.01);
      rot(D, 'Spine_4', 'x', -0.3);
      headChain(D, p, PERIOD.proud, function (q) { var v = alive(q, 0.8); return [v[0] - 0.15, v[1] * 1.4, v[2] * 0.5]; });
      leg(D, 'L', true, -0.18, 0.12, 0.05);
      tail(D, 0.75, Math.sin(p * TAU * 2) * 0.1);
    },
    // Echado como una esfinge: barriga en el suelo, patas delanteras estiradas al frente, traseras recogidas y cabeza alta
    lie: function (D, t, p) {
      var Q = D.q || {}, br = Math.sin(p * TAU * 2);
      rot(D, 'Hips', 'x', Q.hips != null ? Q.hips : -0.04);
      legs4(D, Q.f || [-1.49, 0.25, -0.2], Q.b || [-1.35, 2.55, -1.1]);
      if (Q.splay) { rot(D, 'Back_Leg_Pelvis_L', 'z', Q.splay); rot(D, 'Back_Leg_Pelvis_R', 'z', -Q.splay); }
      rot(D, 'Spine_2', 'x', br * 0.012);
      rot(D, 'Spine_4', 'x', Q.neck != null ? Q.neck : -0.05); rot(D, 'Head', 'x', (Q.head != null ? Q.head : 0.12) + br * 0.01);
      headChain(D, p, PERIOD.lie, function (q) { return alive(q, 0.6); });
      tail(D, Q.tail != null ? Q.tail : 0.1, Math.sin(p * TAU * 2) * 0.15);
    },
    // Celebración: de pie en dos patas con la medalla entre las delanteras. Ciclo: se agacha (anticipación), salta,
    // vuela con las patas algo recogidas y aterriza amortiguando; luego rebota contento.
    celebrate: function (D, t, p) {
      var Q = D.q || {}, up = Q.up != null ? Q.up : 1.2;
      // fases del salto
      var crouch = pulse(p, 0.18, 0.42) * (1 - smooth((p - 0.36) / 0.06)), air = p > 0.42 && p < 0.7 ? Math.sin((p - 0.42) / 0.28 * PI) : 0;
      var land = pulse(p, 0.68, 0.84) * (1 - smooth((p - 0.8) / 0.06));
      var bend = Math.max(crouch, land);                 // flexión de las patas traseras
      rot(D, 'Hips', 'x', -up + bend * 0.12);
      var b = Q.b || [-1.0, 0.3, -0.3];
      var bl = function (sd) { leg(D, sd, false, b[0] - bend * 0.55 + air * 0.15, b[1] + bend * 0.95 + air * 0.25, b[2] - bend * 0.5 - air * 0.35); };
      bl('L'); bl('R');
      var f = Q.f || [-1.55, 1.35, 0.25], fin = Q.fin != null ? Q.fin : 0.18;
      leg(D, 'L', true, f[0] - air * 0.25, f[1], f[2]); leg(D, 'R', true, f[0] - air * 0.25, f[1], f[2]);
      rot(D, 'Front_Leg_Shoulder_L', 'z', -fin); rot(D, 'Front_Leg_Shoulder_R', 'z', fin);
      // cabeza en cadena: mira arriba al saltar, baja al aterrizar
      var hd = -air * 0.15 + land * 0.12;
      rot(D, 'Spine_3', 'x', 0.15 + hd * 0.4); rot(D, 'Spine_4', 'x', (Q.neck != null ? Q.neck : 0.65) + hd * 0.6); rot(D, 'Head', 'x', (Q.head != null ? Q.head : 0.35) + hd);
      rot(D, 'Chin', 'x', 0.5 + air * 0.15);
      D.tongue.visible = true; D.tongueOut = 0.35;
      tail(D, Q.tail != null ? Q.tail : 2.0, Math.sin(p * TAU * 6) * 0.5);
      D.jump = air * (Q.jump != null ? Q.jump : 0.13);
      D.medal = true;
      mats().gold.emissiveIntensity = 0.4 + Math.max(0, Math.sin(p * TAU * 3)) * 1.2;
    },
    // Cansado: echado como una esfinge, jadeando con la lengua afuera
    pant: function (D, t, p) {
      BEHAVIORS.lie(D, t, 0);
      var br = Math.sin(p * TAU * 2);
      rot(D, 'Spine_2', 'x', br * 0.025);
      rot(D, 'Head', 'x', -0.06 + br * 0.03);
      rot(D, 'Chin', 'x', 0.4 + br * 0.08);
      D.tongue.visible = true; D.tongueOut = 0.9 + br * 0.1;
    },
    // Yoga: estiramiento con las patas delanteras estiradas y la grupa arriba, luego estira las de atrás
    stretch: function (D, t, p) {
      var bow = pulse(p, 0.05, 0.5), back = pulse(p, 0.55, 0.92);
      rot(D, 'Hips', 'x', 0.42 * bow - 0.12 * back);
      legs4(D, [-1.05 * bow + 0.1 * back, 0.15 * bow, 0], [-0.4 * bow, 0, 0]);
      leg(D, 'L', false, 0.9 * back, 0.35 * back, 0); leg(D, 'R', false, 0.9 * back, 0.35 * back, 0);
      rot(D, 'Spine_2', 'x', 0.12 * bow - 0.1 * back);
      rot(D, 'Spine_4', 'x', -0.25 * bow - 0.15 * back); rot(D, 'Head', 'x', -0.12 * bow);
      tail(D, 0.7 * bow + 0.2 * back, Math.sin(p * TAU * 3) * 0.15 * bow);
      ears(D, 0.15 * bow);
    },
    // Bostezo: sentado, estira el cuello, echa la cabeza atrás y abre muchísimo la boca; al final se relame
    yawn: function (D, t, p) {
      BEHAVIORS.sit(D, t, 0.02);
      var y = pulse(p, 0.22, 0.62), lick = pulse(p, 0.66, 0.78);
      headChain(D, p, PERIOD.yawn, function (q) { var v = pulse(q, 0.22, 0.62); return [-0.7 * v, 0, 0.12 * v]; }, -0.1);
      rot(D, 'Chin', 'x', 1.0 * y + 0.12 * lick);
      D.tongue.visible = y > 0.25 || lick > 0.1; D.tongueOut = 0.35 * y + 0.6 * lick;
    },
    // Pidiendo: sentado erguido sobre las ancas, patas delanteras recogidas en el aire que suben y bajan
    beg: function (D, t, p) {
      var Q = D.q || {}, bob = Math.sin(p * TAU), up = Q.up != null ? Q.up : 1.15;
      rot(D, 'Hips', 'x', -up);
      var b = Q.b || [0.3, 2.4, -1.5]; leg(D, 'L', false, b[0], b[1], b[2]); leg(D, 'R', false, b[0], b[1], b[2]);
      var f = Q.f || [-1.25, 1.75, 0.6];
      leg(D, 'L', true, f[0] + bob * 0.08, f[1], f[2]); leg(D, 'R', true, f[0] + bob * 0.08, f[1], f[2]);
      rot(D, 'Front_Leg_Shoulder_L', 'z', -0.12); rot(D, 'Front_Leg_Shoulder_R', 'z', 0.12);
      rot(D, 'Spine_4', 'x', Q.neck != null ? Q.neck : 0.6); rot(D, 'Head', 'x', Q.head != null ? Q.head : 0.3);
      headChain(D, p, PERIOD.beg, function (q) { var v = alive(q, 0.9); return [v[0] - 0.1 * Math.sin(q * TAU), v[1], v[2] + 0.2]; });
      tail(D, Q.tail != null ? Q.tail : 1.3, Math.sin(p * TAU * 4) * 0.4);
    },
    // Aullido: sentado, levanta el hocico al cielo y aúlla con la boca en «o» que vibra
    howl: function (D, t, p) {
      BEHAVIORS.sit(D, t, 0.02);
      var h = pulse(p, 0.15, 0.72);
      headChain(D, p, PERIOD.howl, function (q) { var v = pulse(q, 0.15, 0.72); return [-1.1 * v, 0.05 * Math.sin(q * TAU * 2), 0]; }, -0.15);
      rot(D, 'Chin', 'x', h * (0.4 + Math.sin(p * TAU * 7) * 0.05));
    },
    // Persiguiéndose la cola: da vueltas con el cuerpo curvado
    tailchase: function (D, t, p) {
      D.spin = -p * TAU;
      ['Spine_1', 'Spine_2', 'Spine_2001', 'Spine_3'].forEach(function (n) { rot(D, n, 'y', -0.16); });
      rot(D, 'Spine_4', 'y', -0.2); rot(D, 'Head', 'y', -0.25);
      var w = p * TAU * 4, s = Math.sin(w);
      leg(D, 'L', true, 0.25 * s, 0.4 * Math.max(0, -Math.cos(w)), 0); leg(D, 'R', false, 0.25 * s, 0, 0);
      leg(D, 'R', true, -0.25 * s, 0.4 * Math.max(0, Math.cos(w)), 0); leg(D, 'L', false, -0.25 * s, 0, 0);
      rot(D, 'Chin', 'x', 0.25);
      D.tongue.visible = true;
      tail(D, 0.35, 0.5 + Math.sin(p * TAU * 6) * 0.2);
      ears(D, 0.4);
    },
    // Olfateando: hocico al suelo, olisquea y luego levanta la cabeza curioso
    sniff: function (D, t, p) {
      var down = pulse(p, 0.05, 0.6), look = pulse(p, 0.65, 0.95);
      rot(D, 'Spine_3', 'x', 0.12 * down); rot(D, 'Spine_4', 'x', 0.25 * down - 0.15 * look);
      headChain(D, p, PERIOD.sniff, function (q) { var d2 = pulse(q, 0.05, 0.6), l2 = pulse(q, 0.65, 0.95); return [0.4 * d2 + Math.sin(q * TAU * 12) * 0.12 * d2, Math.sin(q * TAU * 2) * 0.5 * d2, 0.8 * l2]; });
      leg(D, 'R', true, -0.15 * look, 0.35 * look, 0);
      tail(D, 0.5, Math.sin(p * TAU * 8) * 0.3);
      ears(D, 0.15 * down + 0.2 * look);
    }
  };

  // ---------------------------------------------------------------- utilería
  function treadmill() {
    var M = mats(), g = new T.Group();
    var L = 0.78, W = 0.24;
    mesh(new T.BoxGeometry(L, 0.03, W), M.tmBase, g, 0, 0.015, 0).receiveShadow = true;
    mesh(new T.BoxGeometry(L - 0.04, 0.012, W - 0.04), M.tmBelt, g, 0, 0.036, 0).receiveShadow = true;
    var stripes = [];
    for (var i = 0; i < 10; i++) { var s = mesh(new T.BoxGeometry(0.012, 0.0025, W - 0.042), M.tmStripe, g, 0, 0.0435, 0); s.castShadow = false; stripes.push(s); }
    [-1, 1].forEach(function (s) {
      mesh(new T.CylinderGeometry(0.02, 0.02, W, 16), M.tmBase, g, s * (L / 2 - 0.02), 0.025, 0).rotation.x = PI / 2;
      mesh(new T.BoxGeometry(L, 0.016, 0.014), M.tmAccent, g, 0, 0.05, s * (W / 2 + 0.004)).castShadow = false;
    });
    var post = mesh(new T.CylinderGeometry(0.013, 0.013, 0.36, 12), M.tmBase, g, L / 2 - 0.03, 0.2, 0); post.rotation.z = 0.25;
    var con = mesh(new T.BoxGeometry(0.034, 0.07, 0.19), M.tmBase, g, L / 2 - 0.075, 0.385, 0); con.rotation.z = 0.35;
    var scr = mesh(new T.BoxGeometry(0.004, 0.04, 0.12), M.tmAccent, g, L / 2 - 0.093, 0.39, 0); scr.rotation.z = 0.35;
    g.userData.top = 0.045;
    g.userData.update = function (t) {
      var span = L - 0.04, off = (t * 0.6) % (span / 10);
      stripes.forEach(function (s, i) { s.position.x = span / 2 - ((i * span / 10) + off) % span; });
    };
    g.rotation.y = -PI / 2; // su +X (delante) pasa a +Z, hacia donde mira el perro
    return g;
  }
  function dumbbell() {
    var M = mats(), g = new T.Group();
    mesh(new T.CylinderGeometry(0.009, 0.009, 0.16, 12), M.dbMetal, g, 0, 0.038, 0).rotation.x = PI / 2;
    [-1, 1].forEach(function (s) { mesh(new T.CylinderGeometry(0.038, 0.038, 0.026, 24), M.dbPlate, g, 0, 0.038, s * 0.062).rotation.x = PI / 2; });
    return g;
  }

  // Medalla de oro con cinta, para sujetarla entre las patas delanteras al celebrar
  function medal() {
    var M = mats(), g = new T.Group();
    var disc = mesh(new T.CylinderGeometry(0.032, 0.032, 0.007, 32), M.gold, g, 0, 0, 0);
    disc.rotation.x = PI / 2;
    mesh(new T.TorusGeometry(0.026, 0.0028, 8, 32), M.gold, g, 0, 0, 0.0045);
    var star = mesh(new T.CircleGeometry(0.012, 5), M.gem, g, 0, 0, 0.0042);
    star.rotation.z = PI / 2;
    var ribbon = new T.MeshStandardMaterial({ color: 0xd8262d, roughness: 0.6 });
    [-1, 1].forEach(function (s) {
      var r = mesh(new T.BoxGeometry(0.014, 0.05, 0.002), ribbon, g, s * 0.012, 0.05, 0);
      r.rotation.z = s * 0.35;
    });
    return g;
  }

  // ---------------------------------------------------------------- suelo precalculado
  // Para cada conducta se recorre su ciclo una vez y se guarda el punto más bajo del cuerpo en cada instante.
  // En cada fotograma solo se interpola: el perro queda apoyado exacto y sin vibrar.
  var GROUND = {}, STEPS = 48, CAND = null;
  function candidates(skin) {
    if (CAND) return CAND;
    var n = skin.geometry.attributes.position.count, out = [];
    for (var i = 0; i < n; i += 3) out.push(i);
    return (CAND = out);
  }
  function lowest(D) {
    var pos = D.skin.geometry.attributes.position, V = D.V, min = Infinity, c = candidates(D.skin);
    D.model.updateMatrixWorld(true);
    D.invRoot.copy(D.model.matrixWorld).invert();
    for (var k = 0; k < c.length; k++) {
      V.fromBufferAttribute(pos, c[k]);
      D.skin.boneTransform(c[k], V);
      V.applyMatrix4(D.skin.matrixWorld).applyMatrix4(D.invRoot);
      if (V.y < min) min = V.y;
    }
    return min;
  }
  function groundTable(D, name, fn, P) {
    if (GROUND[name]) return GROUND[name];
    var tab = new Float32Array(STEPS);
    for (var i = 0; i < STEPS; i++) {
      var p = i / STEPS;
      reset(D); D.jump = 0; D.spin = 0;
      fn(D, p * P, p);
      tab[i] = lowest(D);
    }
    reset(D);
    return (GROUND[name] = tab);
  }
  function groundAt(tab, p) {
    var x = p * STEPS, i0 = Math.floor(x) % STEPS, i1 = (i0 + 1) % STEPS, f = x - Math.floor(x);
    return tab[i0] * (1 - f) + tab[i1] * f;
  }

  // ---------------------------------------------------------------- API
  function create(behavior, opts) {
    if (!SRC) throw new Error('FORJA_DOG: falta setModel()');
    opts = opts || {};
    var holder = new T.Group();      // posición y orientación en la escena
    var spinner = new T.Group();     // giros y saltos
    holder.add(spinner);
    var model = T.SkeletonUtils ? T.SkeletonUtils.clone(SRC) : SRC.clone(true);
    var inner = new T.Group();       // escala y altura del suelo
    inner.scale.setScalar(SCALE);
    inner.add(model);
    spinner.add(inner);

    var D = { q: opts.q, model: model, bones: {}, boneList: [], jump: 0, spin: 0, medal: false, V: new T.Vector3(), invRoot: new T.Matrix4() };
    model.traverse(function (o) {
      if (o.isBone && !D.bones[o.name]) { D.bones[o.name] = o; D.boneList.push(o); o.userData.rest = o.quaternion.clone(); }
      if (o.isSkinnedMesh && o.material.name === 'Coco') D.skin = o;
    });
    D.crown = addCrown(D.bones, model);
    D.tongue = addTongue(D.bones, model);
    D.mouth = addMouth(D.bones, model);

    var name = BEHAVIORS[behavior] ? behavior : 'sit', fn = BEHAVIORS[name], P = PERIOD[name] || 4;
    var tab = groundTable(D, name, fn, P);
    var prop = null, base = 0, med = null;
    if (name === 'treadmill') { prop = treadmill(); holder.add(prop); base = prop.userData.top; }
    if (name === 'proud') { prop = dumbbell(); prop.position.set(0.13, 0, 0.27); prop.rotation.y = 0.5; holder.add(prop); }
    if (name === 'celebrate') { med = medal(); spinner.add(med); }

    holder.scale.setScalar(opts.scale || 1);
    holder.position.set(opts.x != null ? opts.x : 0.8, 0, opts.z != null ? opts.z : 0.55);
    // por defecto mira hacia la persona (origen); el modelo mira hacia +Z
    holder.rotation.y = opts.face != null ? opts.face * PI / 180 : Math.atan2(-holder.position.x, -holder.position.z);

    var A = new T.Vector3(), B = new T.Vector3(), t0 = null;
    function update(now) {
      var t = now / 1000;
      if (t0 === null) t0 = t;
      var dt = t - t0, p = (dt % P) / P;
      D.jump = 0; D.spin = 0; D.tongue.visible = false;
      reset(D);
      D.tongueOut = 0;
      fn(D, dt, p);
      var ts = D.tongue.userData.states, to = Math.max(0, Math.min(1, D.tongueOut || 0));
      D.tongue.position.copy(ts[0].p).lerp(ts[1].p, to); D.tongue.quaternion.copy(ts[0].q).slerp(ts[1].q, to);
      spinner.rotation.y = D.spin;
      inner.position.y = -groundAt(tab, p) * SCALE;
      spinner.position.y = base + D.jump;
      if (med) {
        // la medalla va entre las dos patas delanteras
        spinner.updateMatrixWorld(true);
        // entre las dos manos: punto medio de muñecas y dedos de ambas patas
        var C4 = new T.Vector3(); A.set(0, 0, 0);
        ['Front_Leg_Ankle_L', 'Front_Leg_Ankle_R', 'Front_Leg_Foot_L', 'Front_Leg_Foot_R'].forEach(function (n) { D.bones[n].getWorldPosition(C4); A.add(C4); });
        spinner.worldToLocal(A.multiplyScalar(0.25));
        med.position.set(A.x, A.y - 0.004, A.z + 0.004);
      }
      if (prop && prop.userData.update) prop.userData.update(dt);
    }
    update(0);
    return { group: holder, update: update, parts: D };
  }

  // Punto del suelo que se ve en (sx, sy) de la cámara (de -1 a 1)
  function floorPointInView(camera, sx, sy) {
    camera.updateMatrixWorld(true);
    var ray = new T.Raycaster();
    ray.setFromCamera(new T.Vector2(sx, sy), camera);
    var o = ray.ray.origin, d = ray.ray.direction;
    if (d.y > -1e-4) return null;
    var k = -o.y / d.y;
    return { x: o.x + d.x * k, z: o.z + d.z * k };
  }

  function attach(stage, behavior, opts) {
    opts = Object.assign({}, opts);
    if (opts.x == null || opts.z == null) {
      // huella del equipamiento en el suelo (más el tamaño del perro): el perrito nunca se coloca dentro de una máquina
      var foot = [], solid = [];
      stage.scene.updateMatrixWorld(true);
      stage.scene.traverse(function (m) {
        if (!m.isMesh || m.isSkinnedMesh || !m.visible) return;
        var b = new T.Box3().setFromObject(m);
        if (!isFinite(b.min.y) || b.max.x - b.min.x > 3 || b.max.z - b.min.z > 3) return; // suelo y fondo
        solid.push(b.clone());
        if (b.min.y < 1.1) foot.push(b.expandByVector(new T.Vector3(0.4, 0, 0.4)));
      });
      // libre: lejos de la persona, fuera de la huella de las máquinas y sin nada que lo tape desde la cámara
      var cam = stage.camera.getWorldPosition(new T.Vector3()), ray = new T.Ray(), hit = new T.Vector3();
      var free = function (p) {
        if (Math.hypot(p.x, p.z) <= 0.6 || foot.some(function (b) { return p.x > b.min.x && p.x < b.max.x && p.z > b.min.z && p.z < b.max.z; })) return false;
        var to = new T.Vector3(p.x, 0.12, p.z), dist = cam.distanceTo(to);
        ray.set(cam, to.clone().sub(cam).normalize());
        return !solid.some(function (b) { return ray.intersectBox(b, hit) && cam.distanceTo(hit) < dist - 0.05; });
      };
      // puntos de la parte baja de la pantalla, primero cerca de las esquinas preferidas
      var tries = [];
      if (opts.screen) tries.push(opts.screen);
      for (var sx = -0.85; sx <= 0.851; sx += 0.1) for (var sy = -0.9; sy <= -0.25; sy += 0.08) tries.push([sx, sy]);
      var pref = function (t) { return Math.min(Math.hypot(t[0] - 0.6, t[1] + 0.68), Math.hypot(t[0] + 0.6, t[1] + 0.68)); };
      tries.sort(function (x, y) { return pref(x) - pref(y); });
      var pick = function (ok) { for (var i = 0; i < tries.length; i++) { var p = floorPointInView(stage.camera, tries[i][0], tries[i][1]); if (p && ok(p)) return p; } return null; };
      var inFoot = function (p) { return Math.hypot(p.x, p.z) <= 0.6 || foot.some(function (b) { return p.x > b.min.x && p.x < b.max.x && p.z > b.min.z && p.z < b.max.z; }); };
      var spot = pick(free) || pick(function (p) { return !inFoot(p); });
      if (!spot) return null; // no hay sitio libre a la vista: mejor sin perrito que dentro de una máquina
      opts.x = spot.x; opts.z = spot.z;
    }
    var dog = create(behavior, opts);
    stage.scene.add(dog.group);
    var orig = stage.update;
    stage.update = function () { orig.apply(stage, arguments); dog.update(performance.now()); };
    stage.dog = dog;
    return dog;
  }

  // Conducta según la animación del ejercicio (clave del motor y equipo)
  var MAP = [
    [/^(run|runOutdoor|walk|walkFree|treadmillIncline|hike|sprint)/, 'treadmill'],
    [/(Stretch|^stretching$|^yoga$|^pilates$|downDog|^pecStretch|^latStretch)/, 'stretch'],
    [/^(jumpRope|boxJump|jumpSquat|jumpLunge|skating|jumpingJack|highKnees|frogJump)/, 'tailchase'],
    [/^(burpee|battleRopes|airBike|bike|roadCycling|rowErg|skiErg|elliptical|stairClimber|sled|swim|boxing|mountainClimber|manMaker|devilPress|thruster|wallBall|kbSwing|swing|ballSlam)/, 'pant'],
    [/^(neck)/, 'yawn'],
    [/^(pullup|chinup|muscleUp|kippingPullup|scapPullup|negativePullup|climbing|deadHang|hangLeg|hangKnee|toesToBar|frontLever)/, 'howl'],
    [/^(ohp|pushPress|landminePress|arnoldPress|kbPress|hspu|handstand|plateOverhead|snatch|cleanJerk|splitJerk)/, 'beg'],
    [/^(crunch|sitUp|legRaise|plank|sidePlank|deadBug|hollow|vUp|russianTwist|bicycleCrunch|reverseCrunch|flutterKick|scissorKick|toeTouch|heelTouch|superman|birdDog|gluteBridge|hipThrust|frogPump|clamshell|sideLegRaise|lSit|dragonFlag)/, 'lie'],
    [/^(calf|seatedCalf|tibialis|lunge|reverseLunge|curtsy|lateralLunge|stepUp|bulgarian|splitSquat|walkingLunge)/, 'sniff'],
    [/(squat|Squat|deadlift|Deadlift|^rdl|row|Row|goodMorning|rackPull|clean|Clean|shrug|pullThrough)/, 'bark'],
    [/^(bench|incline|decline|curl|preacher|chestPress|legPress|legExt|legCurl|pecDeck|fly|cableFly|pulldown|pushdown|seatedRow|lateralRaiseMachine|abductionMachine|adductionMachine|hackSquat|pendulum|machine|dip|pushup)/, 'sit']
  ];
  function behaviorFor(key, eq) {
    key = key || '';
    var db = eq === 'dumbbell' || eq === 'kettlebell';
    for (var i = 0; i < MAP.length; i++) if (MAP[i][0].test(key)) return MAP[i][1] === 'sit' && db ? 'proud' : MAP[i][1];
    return db ? 'proud' : 'sit';
  }

  global.FORJA_DOG = { behaviorFor: behaviorFor, period: function (b) { return PERIOD[b] || 4; }, setModel: setModel, create: create, attach: attach, behaviors: Object.keys(BEHAVIORS), ready: function () { return !!SRC; } };
})(typeof window !== 'undefined' ? window : this);
