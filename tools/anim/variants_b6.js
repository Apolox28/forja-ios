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
