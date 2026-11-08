// Forja — animación de ejercicios (muñeco musculoso con equipamiento).
// Uso: FORJA.draw(ctx, sizePx, patternKey, equipment, phase0to1)
//      FORJA.animate(canvas, patternKey, equipment)
(function (global) {
  'use strict';
  var L = { torso: 0.27, ua: 0.14, fa: 0.13, th: 0.19, sh: 0.19 };
  var GROUND = 0.885;
  function rad(a) { return a * Math.PI / 180; }
  function D(a) { return [Math.sin(rad(a)), Math.cos(rad(a))]; }
  function add(p, v, s) { return [p[0] + v[0] * s, p[1] + v[1] * s]; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ---------- Posturas ----------
  // anchor: 'feet' (tobillo fijo), 'hip' (cadera fija), 'hands' (manos fijas)
  // ángulos en grados: 0 = hacia abajo, positivo = hacia delante (derecha)
  var P = {
    squat: { frames: [
      { anchor: 'feet', ax: 0.5, ay: 0.86, torso: 8, ua: -40, fa: 170, th: 0, sh: 0 },
      { anchor: 'feet', ax: 0.5, ay: 0.86, torso: 40, ua: -15, fa: 165, th: 82, sh: -30 }],
      load: 'shoulders', scene: ['rack'] },
    frontSquat: { frames: [
      { anchor: 'feet', ax: 0.5, ay: 0.86, torso: 4, ua: 35, fa: 175, th: 0, sh: 0 },
      { anchor: 'feet', ax: 0.5, ay: 0.86, torso: 22, ua: 55, fa: 178, th: 85, sh: -30 }],
      load: 'chest', scene: [] },
    deadlift: { frames: [
      { anchor: 'feet', ax: 0.48, ay: 0.86, torso: 2, ua: 0, fa: 0, th: 0, sh: 0 },
      { anchor: 'feet', ax: 0.48, ay: 0.86, torso: 60, ua: 4, fa: 0, th: 58, sh: -24 }],
      load: 'hands', scene: [] },
    rdl: { frames: [
      { anchor: 'feet', ax: 0.48, ay: 0.86, torso: 2, ua: 0, fa: 0, th: 0, sh: 0 },
      { anchor: 'feet', ax: 0.48, ay: 0.86, torso: 78, ua: 6, fa: 3, th: 26, sh: -6 }],
      load: 'hands', scene: [] },
    bench: { frames: [
      { anchor: 'hip', ax: 0.64, ay: 0.6, torso: -90, ua: 180, fa: 180, th: 72, sh: -5 },
      { anchor: 'hip', ax: 0.64, ay: 0.6, torso: -90, ua: 80, fa: 178, th: 72, sh: -5 }],
      load: 'hands', scene: ['flatBench', 'benchRack'] },
    incline: { frames: [
      { anchor: 'hip', ax: 0.62, ay: 0.66, torso: -58, ua: 148, fa: 150, th: 75, sh: -5 },
      { anchor: 'hip', ax: 0.62, ay: 0.66, torso: -58, ua: 50, fa: 160, th: 75, sh: -5 }],
      load: 'hands', scene: ['inclineBench'] },
    fly: { frames: [
      { anchor: 'hip', ax: 0.64, ay: 0.6, torso: -90, ua: 178, fa: 178, th: 72, sh: -5 },
      { anchor: 'hip', ax: 0.64, ay: 0.6, torso: -90, ua: 105, fa: 125, th: 72, sh: -5 }],
      load: 'hands', scene: ['flatBench'] },
    ohp: { frames: [
      { anchor: 'feet', ax: 0.5, ay: 0.86, torso: 0, ua: 25, fa: 178, th: 0, sh: 0 },
      { anchor: 'feet', ax: 0.5, ay: 0.86, torso: -3, ua: 172, fa: 178, th: 0, sh: 0 }],
      load: 'hands', scene: [] },
    row: { frames: [
      { anchor: 'feet', ax: 0.52, ay: 0.86, torso: 68, ua: 0, fa: 0, th: 30, sh: -12 },
      { anchor: 'feet', ax: 0.52, ay: 0.86, torso: 68, ua: -72, fa: -5, th: 30, sh: -12 }],
      load: 'hands', scene: [] },
    pulldown: { frames: [
      { anchor: 'hip', ax: 0.42, ay: 0.66, torso: -10, ua: 168, fa: 172, th: 88, sh: 5 },
      { anchor: 'hip', ax: 0.42, ay: 0.66, torso: -16, ua: -25, fa: 165, th: 88, sh: 5 }],
      load: 'cableHigh', scene: ['pulldownMachine'] },
    pullup: { frames: [
      { anchor: 'hands', ax: 0.5, ay: 0.2, torso: 0, ua: 180, fa: 180, th: 20, sh: -110 },
      { anchor: 'hands', ax: 0.5, ay: 0.2, torso: -8, ua: 15, fa: 172, th: 25, sh: -110 }],
      load: 'none', scene: ['pullFrame'] },
    seatedRow: { frames: [
      { anchor: 'hip', ax: 0.34, ay: 0.8, torso: 12, ua: 85, fa: 88, th: 84, sh: 78 },
      { anchor: 'hip', ax: 0.34, ay: 0.8, torso: -6, ua: -45, fa: 90, th: 84, sh: 78 }],
      load: 'cableFront', scene: ['rowSeat'] },
    curl: { frames: [
      { anchor: 'feet', ax: 0.5, ay: 0.86, torso: 0, ua: 0, fa: 0, th: 0, sh: 0 },
      { anchor: 'feet', ax: 0.5, ay: 0.86, torso: 0, ua: 8, fa: 150, th: 0, sh: 0 }],
      load: 'hands', scene: [] },
    pushdown: { frames: [
      { anchor: 'feet', ax: 0.46, ay: 0.86, torso: 12, ua: -5, fa: 115, th: 8, sh: -4 },
      { anchor: 'feet', ax: 0.46, ay: 0.86, torso: 12, ua: -5, fa: 5, th: 8, sh: -4 }],
      load: 'cableHigh', scene: [] },
    ohExt: { frames: [
      { anchor: 'feet', ax: 0.5, ay: 0.86, torso: 0, ua: 172, fa: 178, th: 0, sh: 0 },
      { anchor: 'feet', ax: 0.5, ay: 0.86, torso: 0, ua: 168, fa: 25, th: 0, sh: 0 }],
      load: 'hands', scene: [] },
    lateral: { frames: [
      { anchor: 'feet', ax: 0.5, ay: 0.86, torso: 0, ua: 8, fa: 10, th: 0, sh: 0 },
      { anchor: 'feet', ax: 0.5, ay: 0.86, torso: 0, ua: 88, fa: 92, th: 0, sh: 0 }],
      load: 'hands', scene: [] },
    lunge: { frames: [
      { anchor: 'hip', ax: 0.5, ay: 0.47, torso: 0, ua: 0, fa: 0, th: 15, sh: 0, th2: -12, sh2: -15 },
      { anchor: 'hip', ax: 0.5, ay: 0.6, torso: 0, ua: 0, fa: 0, th: 80, sh: -5, th2: -25, sh2: -85 }],
      load: 'hands', scene: [] },
    hipThrust: { frames: [
      { anchor: 'feet', ax: 0.74, ay: 0.86, torso: -60, ua: 120, fa: 110, th: 50, sh: -12 },
      { anchor: 'feet', ax: 0.74, ay: 0.86, torso: -95, ua: 150, fa: 120, th: 90, sh: 0 }],
      load: 'hip', scene: ['lowBench'] },
    legExt: { frames: [
      { anchor: 'hip', ax: 0.42, ay: 0.6, torso: -12, ua: 15, fa: 40, th: 88, sh: 5 },
      { anchor: 'hip', ax: 0.42, ay: 0.6, torso: -12, ua: 15, fa: 40, th: 88, sh: 85 }],
      load: 'machine', scene: ['legExtMachine'] },
    legCurl: { frames: [
      { anchor: 'hip', ax: 0.44, ay: 0.6, torso: -92, ua: -10, fa: -80, th: 92, sh: 92 },
      { anchor: 'hip', ax: 0.44, ay: 0.6, torso: -92, ua: -10, fa: -80, th: 92, sh: 185 }],
      load: 'machine', scene: ['legCurlMachine'] },
    calf: { frames: [
      { anchor: 'hip', ax: 0.5, ay: 0.45, torso: 0, ua: 0, fa: 0, th: 0, sh: 0 },
      { anchor: 'hip', ax: 0.5, ay: 0.41, torso: 0, ua: 0, fa: 0, th: 0, sh: -10 }],
      load: 'hands', scene: ['calfBlock'] },
    plank: { frames: [
      { anchor: 'hip', ax: 0.55, ay: 0.72, torso: -78, ua: 0, fa: -90, th: 99, sh: 99 },
      { anchor: 'hip', ax: 0.55, ay: 0.705, torso: -78, ua: 0, fa: -90, th: 99, sh: 99 }],
      load: 'none', scene: ['mat'] },
    crunch: { frames: [
      { anchor: 'hip', ax: 0.56, ay: 0.83, torso: -90, ua: 90, fa: 90, th: 150, sh: 20 },
      { anchor: 'hip', ax: 0.56, ay: 0.83, torso: -48, ua: 110, fa: 110, th: 150, sh: 20 }],
      load: 'none', scene: ['mat'] },
    hangLeg: { frames: [
      { anchor: 'hands', ax: 0.45, ay: 0.12, torso: 0, ua: 180, fa: 180, th: 15, sh: -100 },
      { anchor: 'hands', ax: 0.45, ay: 0.12, torso: -8, ua: 180, fa: 180, th: 95, sh: 90 }],
      load: 'none', scene: ['pullFrame'] },
    run: { frames: [
      { anchor: 'hip', ax: 0.5, ay: 0.5, torso: 8, ua: -40, fa: 60, ua2: 40, fa2: 120, th: 35, sh: -10, th2: -30, sh2: -80 },
      { anchor: 'hip', ax: 0.5, ay: 0.5, torso: 8, ua: 40, fa: 120, ua2: -40, fa2: 60, th: -30, sh: -80, th2: 35, sh2: -10 }],
      load: 'none', scene: [] },
    swing: { frames: [
      { anchor: 'feet', ax: 0.5, ay: 0.86, torso: 60, ua: -25, fa: -25, th: 45, sh: -18 },
      { anchor: 'feet', ax: 0.5, ay: 0.86, torso: -3, ua: 95, fa: 95, th: 0, sh: 0 }],
      load: 'hands', scene: [] },
    dip: { frames: [
      { anchor: 'hands', ax: 0.5, ay: 0.5, torso: 5, ua: 0, fa: 0, th: 30, sh: -85 },
      { anchor: 'hands', ax: 0.5, ay: 0.5, torso: 20, ua: -105, fa: -5, th: 30, sh: -85 }],
      load: 'none', scene: ['dipStation'] },
    pushup: { frames: [
      { anchor: 'hands', ax: 0.3, ay: 0.86, torso: -76, ua: 0, fa: 0, th: 78, sh: 78 },
      { anchor: 'hands', ax: 0.3, ay: 0.86, torso: -82, ua: 95, fa: -30, th: 82, sh: 82 }],
      load: 'none', scene: [] },
    chestPress: { frames: [
      { anchor: 'hip', ax: 0.38, ay: 0.64, torso: -6, ua: -60, fa: 90, th: 85, sh: 5 },
      { anchor: 'hip', ax: 0.38, ay: 0.64, torso: -6, ua: 88, fa: 90, th: 85, sh: 5 }],
      load: 'machine', scene: ['chestPressMachine'] },
    legPress: { frames: [
      { anchor: 'hip', ax: 0.42, ay: 0.72, torso: -55, ua: 30, fa: 60, th: 150, sh: 60 },
      { anchor: 'hip', ax: 0.42, ay: 0.72, torso: -55, ua: 30, fa: 60, th: 115, sh: 110 }],
      load: 'machine', scene: ['legPressMachine'] },
  };

  function solve(p) {
    var t = [Math.sin(rad(p.torso)), -Math.cos(rad(p.torso))];
    var ua2 = p.ua2 == null ? p.ua : p.ua2, fa2 = p.fa2 == null ? p.fa : p.fa2;
    var th2 = p.th2 == null ? p.th : p.th2, sh2 = p.sh2 == null ? p.sh : p.sh2;
    var hip;
    if (p.anchor === 'feet') {
      var ank0 = [p.ax, p.ay]; var k0 = add(ank0, D(p.sh), -L.sh); hip = add(k0, D(p.th), -L.th);
    } else if (p.anchor === 'hands') {
      var h0 = [p.ax, p.ay]; var e0 = add(h0, D(p.fa), -L.fa); var s0 = add(e0, D(p.ua), -L.ua); hip = add(s0, t, -L.torso);
    } else hip = [p.ax, p.ay];
    var sho = add(hip, t, L.torso);
    var j = { t: t, hip: hip, sho: sho, head: add(sho, t, 0.088) };
    j.el = add(sho, D(p.ua), L.ua); j.hand = add(j.el, D(p.fa), L.fa);
    j.el2 = add(sho, D(ua2), L.ua); j.hand2 = add(j.el2, D(fa2), L.fa);
    j.knee = add(hip, D(p.th), L.th); j.ank = add(j.knee, D(p.sh), L.sh); j.toe = add(j.ank, D(p.sh + 90), 0.07);
    j.knee2 = add(hip, D(th2), L.th); j.ank2 = add(j.knee2, D(sh2), L.sh); j.toe2 = add(j.ank2, D(sh2 + 90), 0.07);
    j.front = [-t[1], t[0]]; // hacia donde mira el pecho
    if (j.front[0] < 0 && Math.abs(p.torso) < 100) j.front = [t[1] * -1, t[0]];
    return j;
  }

  function mix(a, b, t) {
    var r = {}; for (var k in a) r[k] = (typeof a[k] === 'number') ? lerp(a[k], (b[k] == null ? (k.slice(-1) === '2' ? b[k.slice(0, -1)] : a[k]) : b[k]), t) : a[k];
    ['ua2', 'fa2', 'th2', 'sh2'].forEach(function (k) {
      var base = k.slice(0, -1);
      if (a[k] != null || b[k] != null) r[k] = lerp(a[k] == null ? a[base] : a[k], b[k] == null ? b[base] : b[k], t);
    });
    return r;
  }

  // ---------- Dibujo del cuerpo ----------
  var COL = {
    skin: '#f6f7f9', skinFar: '#c9ced8', line: '#1b1e25', bg1: '#24262e', bg2: '#16171c',
    floor: 'rgba(255,255,255,0.05)', metal: '#9aa1ae', metalDark: '#5c6370', plate: '#2a2d35',
    plateRim: '#545b68', pad: '#3b4150', padTop: '#4b5263', accent: '#ff8a3d'
  };

  function widthAt(knots, s) {
    for (var i = 0; i < knots.length - 1; i++) {
      var a = knots[i], b = knots[i + 1];
      if (s <= b[0]) { var u = (s - a[0]) / (b[0] - a[0]); u = (1 - Math.cos(u * Math.PI)) / 2; return lerp(a[1], b[1], u); }
    }
    return knots[knots.length - 1][1];
  }

  function limb(ctx, S, a, b, knots, fill, lw) {
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1e-6;
    var d = [dx / len, dy / len], n = [-d[1], d[0]];
    var N = 16, left = [], right = [];
    for (var i = 0; i <= N; i++) {
      var s = i / N, w = widthAt(knots, s) / 2, c = [a[0] + dx * s, a[1] + dy * s];
      left.push([c[0] + n[0] * w, c[1] + n[1] * w]); right.push([c[0] - n[0] * w, c[1] - n[1] * w]);
    }
    var an = Math.atan2(n[1], n[0]);
    var r0 = widthAt(knots, 0) / 2, r1 = widthAt(knots, 1) / 2;
    ctx.beginPath();
    ctx.moveTo(left[0][0] * S, left[0][1] * S);
    for (i = 1; i <= N; i++) ctx.lineTo(left[i][0] * S, left[i][1] * S);
    ctx.arc(b[0] * S, b[1] * S, r1 * S, an, an - Math.PI, true);
    for (i = N; i >= 0; i--) ctx.lineTo(right[i][0] * S, right[i][1] * S);
    ctx.arc(a[0] * S, a[1] * S, r0 * S, an + Math.PI, an, true);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = lw; ctx.strokeStyle = COL.line; ctx.lineJoin = 'round'; ctx.stroke();
  }

  function circle(ctx, S, c, r, fill, stroke, lw) {
    ctx.beginPath(); ctx.arc(c[0] * S, c[1] * S, r * S, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function rect(ctx, S, x, y, w, h, fill, r) {
    ctx.beginPath();
    if (ctx.roundRect && r) ctx.roundRect(x * S, y * S, w * S, h * S, r * S); else ctx.rect(x * S, y * S, w * S, h * S);
    ctx.fillStyle = fill; ctx.fill();
  }
  function line(ctx, S, a, b, color, w) {
    ctx.beginPath(); ctx.moveTo(a[0] * S, a[1] * S); ctx.lineTo(b[0] * S, b[1] * S);
    ctx.strokeStyle = color; ctx.lineWidth = w * S; ctx.lineCap = 'round'; ctx.stroke();
  }

  var K = {
    torso: [[0, 0.125], [0.3, 0.112], [0.72, 0.172], [0.92, 0.165], [1, 0.14]],
    neck: [[0, 0.06], [1, 0.055]],
    ua: [[0, 0.082], [0.18, 0.07], [0.55, 0.074], [1, 0.05]],
    fa: [[0, 0.056], [0.3, 0.06], [1, 0.04]],
    th: [[0, 0.108], [0.35, 0.102], [1, 0.064]],
    sh: [[0, 0.064], [0.3, 0.07], [1, 0.042]],
    foot: [[0, 0.046], [1, 0.04]]
  };

  function drawLeg(ctx, S, hip, knee, ank, toe, fill, lw) {
    limb(ctx, S, hip, knee, K.th, fill, lw);
    limb(ctx, S, knee, ank, K.sh, fill, lw);
    limb(ctx, S, ank, toe, K.foot, fill, lw);
  }
  function drawArm(ctx, S, sho, el, hand, fill, lw) {
    limb(ctx, S, sho, el, K.ua, fill, lw);
    limb(ctx, S, el, hand, K.fa, fill, lw);
    circle(ctx, S, hand, 0.029, fill, COL.line, lw);
  }

  // ---------- Equipamiento ----------
  function plates(ctx, S, c, big, lw) {
    // 100 kg: barra + 2 discos grandes por lado (se ven superpuestos)
    var R = big ? 0.098 : 0.085;
    circle(ctx, S, [c[0] + 0.016, c[1] - 0.006], R, '#1c1e24', COL.plateRim, lw);
    circle(ctx, S, c, R, COL.plate, COL.plateRim, lw * 1.3);
    circle(ctx, S, c, R * 0.72, null, '#3a3f4a', lw);
    circle(ctx, S, c, R * 0.22, '#3a3f4a', null, 0);
    circle(ctx, S, c, 0.016, COL.metal, COL.line, lw * 0.6);
  }
  function dumbbell(ctx, S, c, far, lw) {
    // 40 kg: cabeza hexagonal grande
    var r = 0.058, col = far ? '#1d1f25' : COL.plate;
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 6 + i * Math.PI / 3, x = (c[0] + Math.cos(a) * r) * S, y = (c[1] + Math.sin(a) * r) * S;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = COL.plateRim; ctx.stroke();
    circle(ctx, S, c, 0.014, COL.metal, null, 0);
  }
  function kettlebell(ctx, S, hand, lw) {
    var c = [hand[0], hand[1] + 0.06];
    ctx.beginPath(); ctx.arc(hand[0] * S, (hand[1] + 0.02) * S, 0.03 * S, Math.PI * 1.05, Math.PI * 1.95);
    ctx.lineWidth = 0.012 * S; ctx.strokeStyle = COL.plate; ctx.stroke();
    circle(ctx, S, c, 0.055, COL.plate, COL.plateRim, lw);
  }
  function weightStack(ctx, S, x, top, bottom, lw) {
    // torre de polea/máquina cargada al máximo
    rect(ctx, S, x - 0.055, top, 0.012, bottom - top, COL.metalDark);
    rect(ctx, S, x + 0.043, top, 0.012, bottom - top, COL.metalDark);
    rect(ctx, S, x - 0.06, top - 0.012, 0.12, 0.016, COL.metalDark, 0.004);
    var n = 10, h = 0.022, y0 = bottom - 0.01 - n * h;
    for (var i = 0; i < n; i++) {
      rect(ctx, S, x - 0.042, y0 + i * h, 0.084, h - 0.004, i === n - 1 ? '#3a3f4a' : COL.accent, 0.003);
    }
    // pin en el último disco
    circle(ctx, S, [x + 0.05, y0 + (n - 1) * h + h / 2], 0.008, COL.metal, null, 0);
    return y0;
  }
  function cable(ctx, S, from, to, lw) {
    line(ctx, S, from, to, '#d7dbe2', 0.006);
    circle(ctx, S, from, 0.018, COL.metalDark, COL.line, lw * 0.6);
  }
  function label(ctx, S, text) {
    ctx.font = '700 ' + Math.round(0.052 * S) + 'px -apple-system, system-ui, sans-serif';
    var w = ctx.measureText(text).width + 0.04 * S, h = 0.075 * S, x = 0.04 * S, y = 0.04 * S;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, h / 2); else ctx.rect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,138,61,0.16)'; ctx.fill();
    ctx.fillStyle = COL.accent; ctx.textBaseline = 'middle'; ctx.fillText(text, x + 0.02 * S, y + h / 2 + 1);
  }

  function scene(ctx, S, names, j, lw) {
    names.forEach(function (n) {
      if (n === 'rack') {
        rect(ctx, S, 0.2, 0.12, 0.025, GROUND - 0.12, COL.metalDark);
        rect(ctx, S, 0.78, 0.12, 0.025, GROUND - 0.12, COL.metalDark);
        rect(ctx, S, 0.2, 0.12, 0.605, 0.02, COL.metalDark);
      }
      if (n === 'flatBench' || n === 'benchRack') {
        if (n === 'benchRack') { rect(ctx, S, 0.17, 0.25, 0.022, GROUND - 0.25, COL.metalDark); rect(ctx, S, 0.15, 0.32, 0.06, 0.014, COL.metalDark); }
        if (n === 'flatBench') {
          rect(ctx, S, 0.17, 0.635, 0.6, 0.055, COL.pad, 0.02); rect(ctx, S, 0.17, 0.635, 0.6, 0.02, COL.padTop, 0.01);
          rect(ctx, S, 0.24, 0.69, 0.03, GROUND - 0.69, COL.metalDark); rect(ctx, S, 0.66, 0.69, 0.03, GROUND - 0.69, COL.metalDark);
        }
      }
      if (n === 'inclineBench') {
        ctx.save(); ctx.translate(j.hip[0] * S, (j.hip[1] + 0.045) * S); ctx.rotate(rad(-32));
        rect(ctx, S, -0.34, -0.02, 0.36, 0.05, COL.pad, 0.02); ctx.restore();
        rect(ctx, S, j.hip[0] - 0.05, j.hip[1] + 0.03, 0.17, 0.05, COL.pad, 0.02);
        rect(ctx, S, j.hip[0] - 0.02, j.hip[1] + 0.08, 0.03, GROUND - j.hip[1] - 0.08, COL.metalDark);
      }
      if (n === 'lowBench') {
        rect(ctx, S, 0.08, 0.6, 0.26, 0.055, COL.pad, 0.02);
        rect(ctx, S, 0.14, 0.655, 0.03, GROUND - 0.655, COL.metalDark); rect(ctx, S, 0.27, 0.655, 0.03, GROUND - 0.655, COL.metalDark);
      }
      if (n === 'pullFrame') {
        rect(ctx, S, 0.1, j.hand[1] - 0.012, 0.8, 0.024, COL.metal, 0.01);
        rect(ctx, S, 0.1, j.hand[1], 0.022, GROUND - j.hand[1], COL.metalDark); rect(ctx, S, 0.878, j.hand[1], 0.022, GROUND - j.hand[1], COL.metalDark);
      }
      if (n === 'dipStation') {
        rect(ctx, S, j.hand[0] - 0.14, j.hand[1] + 0.012, 0.26, 0.026, COL.metal, 0.01);
        rect(ctx, S, j.hand[0] + 0.09, j.hand[1] + 0.03, 0.026, GROUND - j.hand[1] - 0.03, COL.metalDark);
      }
      if (n === 'calfBlock') { rect(ctx, S, j.ank[0] - 0.03, GROUND - 0.035, 0.16, 0.035, COL.pad, 0.008); }
      if (n === 'mat') { rect(ctx, S, 0.08, GROUND - 0.012, 0.84, 0.014, '#2f5d8a', 0.006); }
      if (n === 'rowSeat') {
        rect(ctx, S, j.hip[0] - 0.09, j.hip[1] + 0.035, 0.16, 0.04, COL.pad, 0.015);
        rect(ctx, S, j.hip[0] - 0.12, j.hip[1] + 0.075, 0.6, 0.02, COL.metalDark);
        rect(ctx, S, j.ank[0] + 0.02, j.ank[1] - 0.09, 0.025, 0.12, COL.metalDark, 0.008);
      }
      if (n === 'pulldownMachine') {
        rect(ctx, S, j.hip[0] - 0.1, j.hip[1] + 0.035, 0.2, 0.045, COL.pad, 0.015);
        rect(ctx, S, j.hip[0] - 0.02, j.hip[1] + 0.08, 0.03, GROUND - j.hip[1] - 0.08, COL.metalDark);
        rect(ctx, S, j.knee[0] - 0.02, j.knee[1] - 0.075, 0.07, 0.035, COL.pad, 0.015);
      }
      if (n === 'legExtMachine' || n === 'chestPressMachine') {
        rect(ctx, S, j.hip[0] - 0.1, j.hip[1] + 0.035, 0.22, 0.05, COL.pad, 0.018);
        ctx.save(); ctx.translate((j.hip[0] - 0.07) * S, (j.hip[1] + 0.04) * S); ctx.rotate(rad(-10));
        rect(ctx, S, -0.03, -0.3, 0.05, 0.3, COL.pad, 0.018); ctx.restore();
        rect(ctx, S, j.hip[0] - 0.02, j.hip[1] + 0.085, 0.035, GROUND - j.hip[1] - 0.085, COL.metalDark);
      }
      if (n === 'legCurlMachine') {
        rect(ctx, S, 0.12, 0.635, 0.62, 0.05, COL.pad, 0.02);
        rect(ctx, S, 0.2, 0.685, 0.03, GROUND - 0.685, COL.metalDark); rect(ctx, S, 0.62, 0.685, 0.03, GROUND - 0.685, COL.metalDark);
      }
      if (n === 'legPressMachine') {
        ctx.save(); ctx.translate(j.hip[0] * S, (j.hip[1] + 0.04) * S); ctx.rotate(rad(-55));
        rect(ctx, S, -0.02, -0.03, 0.3, 0.05, COL.pad, 0.02); ctx.restore();
        rect(ctx, S, j.hip[0] - 0.12, j.hip[1] + 0.05, 0.24, 0.045, COL.pad, 0.018);
        rect(ctx, S, j.hip[0] - 0.08, j.hip[1] + 0.095, 0.7, 0.02, COL.metalDark);
        line(ctx, S, [j.hip[0] + 0.1, j.hip[1] + 0.09], [0.95, 0.12], COL.metalDark, 0.016);
      }
    });
  }

  // Zona del pie/mano para máquinas (rodillo, placa, agarres)
  function machineFront(ctx, S, key, j, lw) {
    if (key === 'legExt' || key === 'legCurl') {
      circle(ctx, S, [j.ank[0] + (key === 'legExt' ? 0.0 : 0), j.ank[1] + (key === 'legExt' ? -0.04 : 0.0)], 0.035, COL.pad, COL.line, lw);
    }
    if (key === 'legPress') {
      var a = j.toe, b = j.ank, d = [b[0] - a[0], b[1] - a[1]];
      ctx.save(); ctx.translate(((a[0] + b[0]) / 2 + 0.02) * S, ((a[1] + b[1]) / 2 - 0.02) * S);
      ctx.rotate(Math.atan2(d[1], d[0]) + Math.PI / 2);
      rect(ctx, S, -0.1, -0.02, 0.2, 0.03, COL.metal, 0.008); ctx.restore();
      plates(ctx, S, [j.ank[0] + 0.1, j.ank[1] - 0.09], false, lw);
    }
    if (key === 'chestPress') {
      line(ctx, S, [j.hand[0], j.hand[1]], [j.hand[0], j.hand[1] - 0.12], COL.metal, 0.014);
    }
  }

  // ---------- Escena completa ----------
  var LOAD_TEXT = { barbell: '100 kg', dumbbell: '2 × 40 kg', kettlebell: '40 kg', cable: 'MÁX', machine: 'MÁX', none: '' };

  function draw(ctx, size, key, equipment, phase) {
    var def = P[key] || P.curl;
    var S = size, lw = Math.max(1, size * 0.006);
    var eq = equipment || 'none';
    var u = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
    u = u * u * (3 - 2 * u);
    var pose = mix(def.frames[0], def.frames[1], u);
    var j = solve(pose);

    ctx.save();
    ctx.clearRect(0, 0, S, S);
    var g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, COL.bg1); g.addColorStop(1, COL.bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = COL.floor; ctx.fillRect(0, GROUND * S, S, S);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath();
    ctx.ellipse(j.ank[0] * S, (GROUND + 0.012) * S, 0.17 * S, 0.016 * S, 0, 0, Math.PI * 2); ctx.fill();

    // Cargas según equipamiento
    var load = def.load;
    var useCable = eq === 'cable' || load === 'cableHigh' || load === 'cableFront';
    var useMachine = eq === 'machine' || load === 'machine';
    var stackX = 0.9;

    var Z = 0.86; ctx.translate(0.5 * S * (1 - Z), GROUND * S * (1 - Z)); ctx.scale(Z, Z);
    scene(ctx, S, def.scene, j, lw);

    // Polea / máquina: torre cargada
    if (useCable || useMachine) {
      var top = 0.1, bottom = GROUND;
      weightStack(ctx, S, stackX, top, bottom, lw);
      if (useCable) {
        var anchor;
        if (load === 'cableHigh' || key === 'pushdown' || key === 'pulldown' || key === 'ohExt') anchor = [j.hand[0] + 0.03, 0.1];
        else if (load === 'cableFront' || key === 'chestPress' || key === 'seatedRow' || key === 'row') anchor = [stackX - 0.05, j.hand[1]];
        else anchor = [stackX - 0.05, GROUND - 0.06];
        line(ctx, S, [stackX, top], anchor, '#d7dbe2', 0.005);
        cable(ctx, S, anchor, j.hand, lw);
      }
    }

    // Brazo/pierna lejanos
    drawLeg(ctx, S, j.hip, j.knee2, j.ank2, j.toe2, COL.skinFar, lw);
    if ((eq === 'dumbbell') && load === 'hands') dumbbell(ctx, S, j.hand2, true, lw);
    drawArm(ctx, S, j.sho, j.el2, j.hand2, COL.skinFar, lw);

    // Barra (detrás del brazo cercano)
    if (eq === 'barbell') {
      if (load === 'shoulders') plates(ctx, S, [j.sho[0] - 0.01, j.sho[1] - 0.005], true, lw);
      else if (load === 'hip') plates(ctx, S, [j.hip[0] + 0.01, j.hip[1] - 0.075], true, lw);
      else if (load === 'chest') plates(ctx, S, [j.sho[0] + 0.03, j.sho[1] + 0.01], true, lw);
      else if (load === 'hands') plates(ctx, S, j.hand, true, lw);
    }

    // Cuerpo
    circle(ctx, S, add(j.hip, j.front, -0.035), 0.062, COL.skin, COL.line, lw); // glúteo
    limb(ctx, S, j.hip, j.sho, K.torso, COL.skin, lw);
    limb(ctx, S, j.sho, add(j.sho, j.t, 0.06), K.neck, COL.skin, lw);
    circle(ctx, S, j.head, 0.055, COL.skin, COL.line, lw);
    // mandíbula y oreja
    circle(ctx, S, add(add(j.head, j.front, 0.03), j.t, -0.022), 0.03, COL.skin, null, 0);
    circle(ctx, S, add(j.head, j.front, -0.008), 0.012, '#e3e6ea', COL.line, lw * 0.5);

    drawLeg(ctx, S, j.hip, j.knee, j.ank, j.toe, COL.skin, lw);
    machineFront(ctx, S, key, j, lw);
    drawArm(ctx, S, j.sho, j.el, j.hand, COL.skin, lw);
    // deltoide marcado
    circle(ctx, S, add(j.sho, j.t, -0.01), 0.04, COL.skin, COL.line, lw);
    limb(ctx, S, j.sho, j.el, K.ua, COL.skin, lw);
    limb(ctx, S, j.el, j.hand, K.fa, COL.skin, lw);
    circle(ctx, S, j.hand, 0.029, COL.skin, COL.line, lw);

    // Cargas en las manos (delante)
    if (load === 'hands' || load === 'chest') {
      if (eq === 'dumbbell') dumbbell(ctx, S, j.hand, false, lw);
      if (eq === 'kettlebell') kettlebell(ctx, S, j.hand, lw);
    }
    if (key === 'chestPress') machineFront(ctx, S, key, j, lw);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var text = LOAD_TEXT[useCable ? 'cable' : (useMachine && eq !== 'barbell' && eq !== 'dumbbell' ? 'machine' : eq)] || '';
    if (text) label(ctx, S, text);
    ctx.restore();
  }

  function animate(canvas, key, equipment, period) {
    var ctx = canvas.getContext('2d'), dpr = global.devicePixelRatio || 1;
    var T = (period || 2600), start = null, size = 0;
    function frame(ts) {
      if (start === null) start = ts;
      var w = canvas.clientWidth || 300;
      if (w !== size) { size = w; canvas.width = size * dpr; canvas.height = size * dpr; }
      var phase = ((ts - start) % T) / T;
      draw(ctx, size * dpr, key, equipment, phase);
      global.requestAnimationFrame(frame);
    }
    global.requestAnimationFrame(frame);
  }

  global.FORJA = { draw: draw, animate: animate, patterns: Object.keys(P) };
})(window);
