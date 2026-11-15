// Vocabulario para reconocer un nombre por sus palabras, sin importar el orden ni el idioma.
// Todo se escribe normalizado (minúsculas, sin tildes). Las frases se reemplazan primero (en este orden)
// y luego cada palabra; el resultado son «fichas» en inglés en singular.
module.exports.phrases = [
  // equipo
  ['smith machine', 'smith'], ['maquina smith', 'smith'], ['en maquina smith', 'smith'], ['peso corporal', 'bodyweight'], ['body weight', 'bodyweight'],
  ['sin peso', 'bodyweight'], ['pesa rusa', 'kettlebell'], ['pesas rusas', 'kettlebell'], ['barra ez', 'ezbar'], ['barra z', 'ezbar'], ['ez bar', 'ezbar'],
  ['trap bar', 'trapbar'], ['barra hexagonal', 'trapbar'], ['barra t', 'tbar'], ['t bar', 'tbar'], ['en t', 'tbar'], ['banda elastica', 'band'],
  ['machine plates', 'machine'], ['maquina de discos', 'machine'],
  // posición, agarre y lado
  ['por encima de la cabeza', 'overhead'], ['sobre la cabeza', 'overhead'], ['encima de la cabeza', 'overhead'],
  ['por detras de la espalda', 'behind back'], ['detras de la espalda', 'behind back'], ['behind the back', 'behind back'], ['por detras', 'behind back'],
  ['con apoyo de pecho', 'chestsupported'], ['apoyo de pecho', 'chestsupported'], ['pecho apoyado', 'chestsupported'], ['con pecho apoyado', 'chestsupported'], ['chest supported', 'chestsupported'],
  ['a un brazo', 'single'], ['un brazo', 'single'], ['a una mano', 'single'], ['una mano', 'single'], ['single arm', 'single'], ['one arm', 'single'],
  ['a una pierna', 'singleleg'], ['una pierna', 'singleleg'], ['single leg', 'singleleg'], ['one leg', 'singleleg'],
  ['de pie', 'standing'], ['agarre cerrado', 'closegrip'], ['agarre estrecho', 'closegrip'], ['close grip', 'closegrip'],
  ['agarre abierto', 'widegrip'], ['agarre ancho', 'widegrip'], ['agarre amplio', 'widegrip'], ['wide grip', 'widegrip'],
  ['agarre inverso', 'reverse grip'], ['agarre supino', 'reverse grip'], ['palmas arriba', 'palm up'], ['palms up', 'palm up'],
  ['de arriba hacia abajo', 'uptodown'], ['de arriba abajo', 'uptodown'], ['up to down', 'uptodown'], ['de abajo hacia arriba', 'downtoup'], ['de abajo arriba', 'downtoup'], ['down to up', 'downtoup'],
  ['barras paralelas', 'parallel'], ['parallel bars', 'parallel'], ['en paralelas', 'parallel'],
  ['iso lateral', 'isolateral'],
  // movimientos de varias palabras
  ['pull ups', 'pullup'], ['pull up', 'pullup'], ['chin ups', 'chinup'], ['chin up', 'chinup'], ['dominadas supinas', 'chinup'], ['dominada supina', 'chinup'],
  ['push ups', 'pushup'], ['push up', 'pushup'], ['sit ups', 'situp'], ['sit up', 'situp'], ['step ups', 'stepup'], ['step up', 'stepup'],
  ['subida al cajon', 'stepup'], ['subidas al cajon', 'stepup'], ['subida al banco', 'stepup'],
  ['peso muerto', 'deadlift'], ['buenos dias', 'good morning'], ['good mornings', 'good morning'],
  ['abdominal corto', 'crunch'], ['abdominales cortos', 'crunch'], ['abdominal completo', 'situp'], ['abdominales completos', 'situp'],
  ['empuje de cadera', 'hip thrust'], ['jalon a la cara', 'face pull'], ['tiron a la cara', 'face pull'],
  ['cables cruzados', 'crossover'], ['cable cruzado', 'crossover'], ['poleas cruzadas', 'crossover'], ['cruce de poleas', 'crossover'], ['cruce de polea', 'crossover'],
  ['fly crossovers', 'crossover'], ['fly crossover', 'crossover'], ['cable crossover', 'crossover'], ['crossovers', 'crossover'],
  ['vuelos posteriores', 'reverse fly'], ['vuelo posterior', 'reverse fly'], ['aperturas inversas', 'reverse fly'], ['apertura inversa', 'reverse fly'],
  ['rear delt reverse fly', 'reverse fly'], ['rear delt fly', 'reverse fly'], ['pajaros', 'reverse fly'], ['pajaro', 'reverse fly'],
  ['flexion lateral', 'side bend'], ['flexiones laterales', 'side bend'], ['inclinacion lateral', 'side bend'],
  ['flexion de cuello', 'neck curl'], ['extension de cuello', 'neck extension'],
  ['cross body', 'cross'], ['hacia atras', 'reverse'], ['press militar', 'military press'],
  ['elevacion de talones', 'calf raise'], ['elevaciones de talones', 'calf raise'], ['elevacion de talon', 'calf raise'],
  ['jalon al pecho', 'lat pulldown'], ['jalon dorsal', 'lat pulldown'], ['polea al pecho', 'lat pulldown'], ['jalones al pecho', 'lat pulldown'],
  ['jalon de triceps', 'tricep pushdown'], ['jalones de triceps', 'tricep pushdown'], ['empuje de triceps', 'tricep pushdown'],
  ['rompecraneos', 'skullcrusher'], ['press frances', 'skullcrusher'], ['skull crusher', 'skullcrusher'], ['skull crushers', 'skullcrusher'],
  ['curl femoral', 'leg curl'], ['curl de isquios', 'leg curl'], ['curl de isquiotibiales', 'leg curl'],
  ['extension de cuadriceps', 'leg extension'], ['extensiones de cuadriceps', 'leg extension'],
  ['mountain climbers', 'mountain climber'], ['jumping jacks', 'jumping jack'],
];
module.exports.words = {
  // equipo
  mancuerna: 'dumbbell', mancuernas: 'dumbbell', barra: 'barbell', polea: 'cable', poleas: 'cable', maquina: 'machine', banda: 'band', liga: 'band',
  lastrado: 'weighted', lastrada: 'weighted', lastrados: 'weighted', lastradas: 'weighted', asistido: 'assisted', asistida: 'assisted', asistidas: 'assisted', asistidos: 'assisted',
  suspension: 'suspension', trx: 'suspension', disco: 'plate', discos: 'plate', saco: 'sandbag', cuerda: 'rope',
  // movimientos y partes del cuerpo
  banca: 'bench', banco: 'bench', inclinado: 'incline', inclinada: 'incline', declinado: 'decline', declinada: 'decline',
  sentadilla: 'squat', sentadillas: 'squat', zancada: 'lunge', zancadas: 'lunge', estocada: 'lunge', estocadas: 'lunge', desplante: 'lunge',
  remo: 'row', jalon: 'pulldown', jalones: 'pulldown', dominada: 'pullup', dominadas: 'pullup', flexion: 'pushup', flexiones: 'pushup', lagartija: 'pushup', lagartijas: 'pushup',
  fondo: 'dip', fondos: 'dip', biceps: 'bicep', triceps: 'tricep', martillo: 'hammer', concentrado: 'concentration', predicador: 'preacher', scott: 'preacher', arana: 'spider',
  invertido: 'reverse', invertida: 'reverse', inverso: 'reverse', inversa: 'reverse', muneca: 'wrist', munecas: 'wrist', palma: 'palm', arriba: 'up',
  pierna: 'leg', piernas: 'leg', acostado: 'lying', acostada: 'lying', tumbado: 'lying', tumbada: 'lying', sentado: 'seated', sentada: 'seated',
  extension: 'extension', extensiones: 'extension', elevacion: 'raise', elevaciones: 'raise', frontal: 'front', frontales: 'front', laterales: 'lateral',
  gemelo: 'calf', gemelos: 'calf', pantorrilla: 'calf', pantorrillas: 'calf', cadera: 'hip', abduccion: 'abduction', aduccion: 'adduction',
  apertura: 'fly', aperturas: 'fly', vuelo: 'fly', vuelos: 'fly', flys: 'fly', flyes: 'fly', cruzado: 'cross', cruzada: 'cross', bajo: 'low', baja: 'low', bajos: 'low', alto: 'high', alta: 'high',
  encogimiento: 'shrug', encogimientos: 'shrug', rumano: 'romanian', plancha: 'plank', abdominal: 'crunch', abdominales: 'crunch',
  gluteo: 'glute', gluteos: 'glute', puente: 'bridge', patada: 'kickback', patadas: 'kickback', hombro: 'shoulder', hombros: 'shoulder', militar: 'military',
  pecho: 'chest', espalda: 'back', giro: 'twist', giros: 'twist', ruso: 'russian', rusos: 'russian', rodilla: 'knee', rodillas: 'knee',
  colgado: 'hanging', colgando: 'hanging', colgante: 'hang', paralela: 'parallel', paralelas: 'parallel', bulgara: 'bulgarian',
  dividida: 'split', caminando: 'walking', salto: 'jump', saltos: 'jump', cajon: 'box', caja: 'box', granjero: 'farmer', paseo: 'walk', caminata: 'walk',
  arrancada: 'snatch', cargada: 'clean', envion: 'jerk', empuje: 'push', trineo: 'sled', cuello: 'neck', dorsal: 'lat', dorsales: 'lat',
  estiramiento: 'stretch', estiramientos: 'stretch', pectoral: 'pec', deltoides: 'delt', isquios: 'hamstring', cuadriceps: 'quad', antebrazo: 'forearm',
  carrera: 'running', correr: 'running', cinta: 'treadmill', bicicleta: 'cycling', eliptica: 'elliptical', natacion: 'swimming', comba: 'jump rope',
  rotacion: 'rotation', tronco: 'torso', torso: 'torso', molinete: 'pinwheel', camarero: 'waiter', arrastrado: 'drag', zottman: 'zottman',
  prensa: 'press', empujes: 'push', tiron: 'pull', jalar: 'pull', vertical: 'upright', menton: 'upright', isolateral: 'isolateral',
  // inglés: plurales y variantes que cambian la ficha
  curls: 'curl', raises: 'raise', rows: 'row', presses: 'press', dips: 'dip', lunges: 'lunge', squats: 'squat', extensions: 'extension',
  pushdowns: 'pushdown', pressdown: 'pushdown', pulldowns: 'pulldown', shrugs: 'shrug', kickbacks: 'kickback', crunches: 'crunch',
  dumbbells: 'dumbbell', barbells: 'barbell', cables: 'cable', machines: 'machine', bands: 'band', kettlebells: 'kettlebell',
};
// palabras que no aportan
module.exports.stop = ['de', 'del', 'la', 'el', 'los', 'las', 'con', 'en', 'a', 'al', 'y', 'e', 'para', 'por', 'un', 'una', 'the', 'with', 'on', 'of', 'to', 'for', 'and', 'in', 'grip', 'agarre'];
// fichas de equipo (se comparan aparte del movimiento)
module.exports.equip = ['barbell', 'dumbbell', 'cable', 'machine', 'smith', 'band', 'kettlebell', 'bodyweight', 'weighted', 'assisted', 'suspension', 'ezbar', 'trapbar', 'sandbag'];
