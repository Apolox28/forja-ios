# Animaciones publicadas que hay que revisar (detectadas con romtest.js y a ojo)

- ~~**seatedRowMachine**~~ (arreglado el 11-11): el brazo se dobla por detrás de la cabeza al tirar (fase 0,2–0,4). Grave.
- ~~**curlIncline**~~ (arreglado el 14-11): el brazo cuelga demasiado por detrás del cuerpo (extensión del hombro ≈ 97°).
- ~~**ballLegCurl**~~ (rodillas arregladas el 11-11): rodillas con flexión rara en la fase 0,23 y muñecas > 80°.
- ~~**benchDip / dip / dipMachine**~~ (arreglado el 14-11): extensión del hombro excesiva en la bajada (90–97°).
- ~~**cableFlyHigh, chestSupportedRow, pendlayRow**~~ (sin avisos el 14-11): hombro por detrás del cuerpo y codo > 155° al final del tirón.
- ~~**rowErg**~~: flexión de cadera de 156° en el agarre; debería estar en torno a 135°.
- ~~**deadlift / sumoDeadlift / powerClean**~~ (arreglado el 14-11): flexión de cadera de 145–149° al inicio, algo profunda.
- ~~**turkishGetUp**~~ (arreglado el 14-11): abducción de la cadera izquierda de 82° al barrer la pierna y muñeca izquierda a 114°.
- ~~**gluteKickback**~~: extensión de cadera de 48°, que debería ser ≤ 35°.
- **Agarre en la espalda (squat, boxSquat, lungeBar, goodMorning, hipThrust…)**: muñeca a 90°. Vale, pero se puede suavizar.

# Pedidos del usuario (pasados por la sesión de la app el 10-11)

1. **Leñador en polea (woodchop), PRIORIDAD.** El usuario dice que está «pésimo». Cómo debe quedar:
   - polea alta a un lado y pies fijos, algo más abiertos que la cadera;
   - brazos casi rectos, las dos manos en el asa;
   - diagonal desde encima del hombro hasta por debajo de la rodilla contraria;
   - la rotación sale del tronco y la cadera, con el pie de atrás pivotando;
   - cable siempre tenso;
   - pintado: oblicuos como principal; abdomen y deltoides como secundarios.
2. **Peck deck («Aperturas en máquina»).** Ahora parece un cruce de poleas. Debe ser una mariposa: sentado con la espalda apoyada, codos o antebrazos en almohadillas, sin poleas.
3. **Dominadas diferenciadas:**
   - lastradas: disco colgando del cinturón;
   - supinas: palmas hacia la cara y agarre más cerrado;
   - agarre neutro: asas paralelas;
   - asistidas: ya hecho (`pullupAssisted`);
   - nuevas: agarre ancho, supinas lastradas y supinas asistidas.
4. **Nuevos ejercicios:**
   - remo en T con pecho apoyado;
   - elevación de piernas y de rodillas en paralelas (silla del capitán);
   - flexión lateral con mancuerna.
5. **Los 219 de Hevy** están en `release-1.5`, `Resources/hevy_extra.json`. La clave es el nombre en minúsculas.

- Arreglados el 11-11: puente de glúteo, frog pump y puente con fitball (brazos bajo el suelo), superman (cara en el suelo), press en el suelo (codo) y patada de glúteo (pie y extensión de cadera).
- Arreglados el 11-11: fondos y fondos en máquina (bajada hasta unos 90° de codo), curl inclinado (codos abajo, brazos algo abiertos). Fondos en banco: el hombro llega a unos 90° de extensión abajo, que es propio del ejercicio.
- Arreglado el 11-11: remo ergómetro (agarre con las tibias casi verticales, cadera ~135°).
- Arreglados el 11-11: remo Pendlay (la barra toca la parte baja del pecho) y remo con pecho apoyado (codo menos atrás).

- 14-11: prueba completa de las 504 combinaciones sin ningún aviso (choques, suelo, alcance de manos, rangos humanos y coherencia).

# Revisión del 15-11 (fondo, poleas, perrito y flotación)

Ya hecho:
- Revisión visual de los 424 ejercicios de la biblioteca, en hojas de 40 y en el punto medio del movimiento.
- Arreglados:
  - press de hombro en Smith (ahora tiene animación propia);
  - patada de tríceps en polea (de cara a la máquina);
  - poleas a la izquierda o al frente;
  - escalada (se veía solo la pared).
- Nueva prueba `floattest.js` en el scratchpad: comprueba que algún punto de apoyo toca el suelo o un equipo fijo.
- Arreglado lo que flotaba: sentadillas sumo, peso muerto sumo, sentadilla con cinturón, prensa pendular y press bajo la barra. En todos, los pies se despegaban arriba.

Pendiente:
- Pasada estética «obra de arte» con dos vistas y varias fases por ejercicio. La revisión de hoy fue de un solo fotograma, a tamaño pequeño.
- Gemelos de pie en máquina: faltan las almohadillas de los hombros. Ahora sale una torre de discos.
- Hip thrust en Smith: sale una torre de discos detrás en lugar de la Smith.
- `floattest.js` da falsos positivos que hay que afinar:
  - asiento móvil del remo ergómetro;
  - barriga en el superman;
  - anillas;
  - manos en el suelo en el pino y el HSPU;
  - toes to bar.
- Saltos con fase de vuelo, revisados aparte: remo alto, devil press, man maker.
