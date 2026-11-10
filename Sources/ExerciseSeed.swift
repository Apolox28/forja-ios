import Foundation

/// Patrón de movimiento: decide la animación y las instrucciones.
enum MovementPattern: String, CaseIterable {
    case squat, frontSquat, deadlift, rdl, bench, incline, fly, ohp, row, pulldown, pullup, seatedRow
    case curl, pushdown, ohExt, lateral, lunge, hipThrust, legExt, legCurl, calf, plank, crunch
    case hangLeg, run, swing, dip, pushup, chestPress, legPress
    case lateralRaise, shrug, uprightRow, abduction, jumpingJack, jumpRope, facePull, kickback
    case preacherCurl, skullCrusher, cableFly, goodMorning, hyperext, legRaise, bike, rowErg
    case walk, pullover, dbRow, gluteKickback, seatedCalf
}

struct ExerciseGuide {
    let steps: [String]
    let tips: [String]
}

enum ExerciseSeed {
    typealias Entry = (String, MuscleGroup, Equipment, ExerciseKind, MovementPattern)

    static func make() -> [Exercise] {
        catalog.map { Exercise(name: $0.0, muscle: $0.1, equipment: $0.2, kind: $0.3, isCustom: false) }
    }

    private static let patternByName: [String: MovementPattern] = {
        var d: [String: MovementPattern] = [:]
        for e in catalog { d[e.0.lowercased()] = e.4 }
        return d
    }()

    static func pattern(for exercise: Exercise) -> MovementPattern {
        if let p = patternByName[exercise.name.lowercased()] { return p }
        return guess(name: exercise.name, muscle: exercise.muscle)
    }

    static func guess(name: String, muscle: MuscleGroup) -> MovementPattern {
        let n = name.lowercased()
        let rules: [(String, MovementPattern)] = [
            ("talones sentado", .seatedCalf), ("seated calf", .seatedCalf),
            ("laterales", .lateralRaise), ("lateral raise", .lateralRaise),
            ("encogimiento", .shrug), ("shrug", .shrug),
            ("mentón", .uprightRow), ("upright row", .uprightRow),
            ("abducción", .abduction), ("aducción", .abduction), ("abduction", .abduction), ("adduction", .abduction),
            ("face pull", .facePull), ("pájaros en", .facePull),
            ("patada de tríceps", .kickback), ("triceps kickback", .kickback),
            ("patada de glúteo", .gluteKickback), ("glute kickback", .gluteKickback),
            ("predicador", .preacherCurl), ("preacher", .preacherCurl), ("concentrado", .preacherCurl),
            ("press francés", .skullCrusher), ("skull", .skullCrusher),
            ("cruce", .cableFly), ("crossover", .cableFly), ("cable fly", .cableFly), ("pec deck", .cableFly),
            ("hiperextens", .hyperext), ("hyperextension", .hyperext), ("back extension", .hyperext),
            ("buenos días", .goodMorning), ("good morning", .goodMorning),
            ("piernas tumbado", .legRaise), ("lying leg raise", .legRaise), ("crunch inverso", .legRaise),
            ("bici", .bike), ("cycl", .bike), ("bike", .bike),
            ("remo ergómetro", .rowErg), ("rowing machine", .rowErg),
            ("caminar", .walk), ("walk", .walk), ("granjero", .walk), ("farmer", .walk),
            ("pullover", .pullover),
            ("remo con mancuerna", .dbRow), ("dumbbell row", .dbRow),
            ("jumping jack", .jumpingJack), ("cuerda", .jumpRope), ("jump rope", .jumpRope),
            ("prensa", .legPress), ("leg press", .legPress),
            ("extensión de cuádriceps", .legExt), ("leg extension", .legExt),
            ("curl femoral", .legCurl), ("leg curl", .legCurl),
            ("hip thrust", .hipThrust), ("puente", .hipThrust), ("bridge", .hipThrust),
            ("rumano", .rdl), ("romanian", .rdl), ("rígidas", .rdl), ("buenos días", .rdl), ("good morning", .rdl),
            ("peso muerto", .deadlift), ("deadlift", .deadlift),
            ("frontal", .frontSquat), ("goblet", .frontSquat), ("front squat", .frontSquat),
            ("sentadilla", .squat), ("squat", .squat),
            ("zancada", .lunge), ("lunge", .lunge), ("búlgara", .lunge), ("step", .lunge),
            ("talones", .calf), ("calf", .calf), ("gemelo", .calf),
            ("dominada", .pullup), ("pull up", .pullup), ("chin", .pullup),
            ("jalón", .pulldown), ("pulldown", .pulldown),
            ("remo sentado", .seatedRow), ("seated row", .seatedRow), ("face pull", .seatedRow),
            ("remo", .row), ("row", .row),
            ("inclinado", .incline), ("incline", .incline),
            ("aperturas", .fly), ("fly", .fly),
            ("press de banca", .bench), ("bench", .bench),
            ("fondos", .dip), ("dip", .dip),
            ("flexiones", .pushup), ("push up", .pushup),
            ("press militar", .ohp), ("press de hombro", .ohp), ("overhead press", .ohp), ("shoulder press", .ohp),
            ("elevaciones", .lateral), ("raise", .lateral),
            ("press francés", .ohExt), ("sobre la cabeza", .ohExt), ("skull", .ohExt), ("overhead", .ohExt),
            ("tríceps", .pushdown), ("tricep", .pushdown), ("pushdown", .pushdown),
            ("curl", .curl),
            ("plancha", .plank), ("plank", .plank),
            ("crunch", .crunch), ("abdominal", .crunch), ("sit up", .crunch),
            ("colgado", .hangLeg), ("hanging", .hangLeg),
            ("swing", .swing),
            ("correr", .run), ("run", .run),
        ]
        for (k, p) in rules where n.contains(k) { return p }
        switch muscle {
        case .chest: return .bench
        case .back: return .row
        case .shoulders: return .ohp
        case .biceps, .forearms: return .curl
        case .triceps: return .pushdown
        case .quads: return .squat
        case .hamstrings: return .rdl
        case .glutes: return .hipThrust
        case .calves: return .calf
        case .core: return .crunch
        case .cardio: return .run
        case .fullBody: return .swing
        case .lats: return .pulldown
        case .upperBack: return .row
        case .lowerBack: return .rdl
        case .traps: return .calf
        case .obliques: return .crunch
        case .abductors, .adductors: return .legExt
        case .neck: return .crunch
        }
    }

    /// Nombre del tipo de equipamiento para la animación.
    static func animationEquipment(_ e: Equipment) -> String {
        switch e {
        case .barbell: return "barbell"
        case .dumbbell: return "dumbbell"
        case .kettlebell: return "kettlebell"
        case .cable: return "cable"
        case .machine: return "machine"
        case .bodyweight, .band, .other: return "none"
        }
    }

    // MARK: - Instrucciones por patrón

    static func guide(for exercise: Exercise) -> ExerciseGuide {
        guides[pattern(for: exercise)] ?? ExerciseGuide(steps: [], tips: [])
    }

    static let guides: [MovementPattern: ExerciseGuide] = [
        .squat: ExerciseGuide(steps: [
            "Coloca los pies a la anchura de los hombros, con las puntas ligeramente hacia fuera.",
            "Si usas barra, apóyala sobre la parte alta de la espalda (trapecios), no sobre el cuello.",
            "Toma aire, aprieta el abdomen y baja llevando la cadera atrás y abajo, como si te sentaras.",
            "Baja hasta que los muslos queden al menos paralelos al suelo, con las rodillas siguiendo la dirección de los pies.",
            "Empuja el suelo con todo el pie para subir y suelta el aire al final.",
        ], tips: ["Mantén el pecho alto y la espalda neutra.", "No dejes que las rodillas se vayan hacia dentro.", "Los talones nunca se despegan del suelo."]),
        .frontSquat: ExerciseGuide(steps: [
            "Sujeta el peso delante del pecho (barra sobre los hombros o mancuerna pegada al esternón).",
            "Pies a la anchura de los hombros y codos altos.",
            "Baja con el torso lo más vertical posible, llevando las rodillas hacia delante.",
            "Llega a la profundidad que controles sin perder la postura y sube empujando con los talones.",
        ], tips: ["Codos arriba durante todo el movimiento.", "Abdomen apretado para no inclinarte hacia delante."]),
        .deadlift: ExerciseGuide(steps: [
            "Pies a la anchura de la cadera, con la barra sobre la mitad del pie.",
            "Agarra la barra justo por fuera de las piernas, con los brazos rectos.",
            "Baja la cadera, saca pecho y tensa la espalda (\"rompe\" la barra hacia fuera).",
            "Empuja el suelo con las piernas y sube la barra pegada al cuerpo.",
            "Termina de pie con la cadera extendida, sin echarte hacia atrás. Baja con control por el mismo camino.",
        ], tips: ["La espalda nunca se redondea.", "La barra roza las piernas durante todo el recorrido.", "Cadera y hombros suben a la vez."]),
        .rdl: ExerciseGuide(steps: [
            "De pie, con el peso delante de los muslos y las rodillas ligeramente flexionadas.",
            "Lleva la cadera hacia atrás mientras el peso baja pegado a las piernas.",
            "Baja hasta notar estiramiento en los isquiotibiales (normalmente por debajo de las rodillas).",
            "Sube empujando la cadera hacia delante y apretando los glúteos.",
        ], tips: ["La flexión de rodilla no cambia durante el ejercicio.", "Espalda recta y mirada al frente-abajo."]),
        .bench: ExerciseGuide(steps: [
            "Túmbate en el banco con los ojos bajo la barra y los pies firmes en el suelo.",
            "Junta las escápulas, saca pecho y agarra la barra algo más abierto que los hombros.",
            "Saca la barra y bájala con control hasta tocar la parte baja del pecho.",
            "Los codos van a unos 45–70° del cuerpo, no totalmente abiertos.",
            "Empuja la barra hacia arriba y ligeramente hacia la cara hasta estirar los brazos.",
        ], tips: ["Las escápulas siguen juntas y apoyadas en el banco.", "No rebotes la barra en el pecho.", "Usa un compañero o topes de seguridad con mucho peso."]),
        .incline: ExerciseGuide(steps: [
            "Ajusta el banco a unos 30–45° y siéntate con la espalda bien apoyada.",
            "Junta las escápulas y sujeta el peso a la altura del pecho alto.",
            "Empuja hacia arriba hasta estirar los brazos sobre los hombros.",
            "Baja con control hasta la parte alta del pecho.",
        ], tips: ["Una inclinación muy alta pasa el trabajo a los hombros.", "Pies firmes en el suelo y glúteos en el banco."]),
        .fly: ExerciseGuide(steps: [
            "Túmbate con los pesos sobre el pecho y los codos ligeramente flexionados.",
            "Abre los brazos en arco hasta notar estiramiento en el pecho.",
            "Cierra el arco juntando los pesos sobre el pecho como si abrazaras un árbol.",
        ], tips: ["El ángulo del codo no cambia.", "No bajes más de lo que tu hombro tolere."]),
        .ohp: ExerciseGuide(steps: [
            "De pie (o sentado), con el peso a la altura de los hombros y los antebrazos verticales.",
            "Aprieta glúteos y abdomen para no arquear la espalda.",
            "Empuja el peso hacia arriba apartando la cabeza ligeramente y vuelve a meterla al pasar la barra.",
            "Termina con los brazos estirados sobre la cabeza y baja con control.",
        ], tips: ["Las costillas no se abren hacia delante.", "La barra sube en línea recta."]),
        .row: ExerciseGuide(steps: [
            "Inclina el torso hacia delante (unos 45° o más) con la espalda recta y las rodillas algo flexionadas.",
            "Deja colgar el peso con los brazos estirados.",
            "Tira llevando los codos hacia atrás y junta las escápulas.",
            "Baja con control sin perder la postura de la espalda.",
        ], tips: ["No uses impulso del torso.", "Piensa en llevar los codos al bolsillo trasero."]),
        .pulldown: ExerciseGuide(steps: [
            "Siéntate con los muslos bien sujetos bajo el apoyo.",
            "Agarra la barra algo más abierto que los hombros.",
            "Inclínate un poco hacia atrás, saca pecho y tira de la barra hasta la parte alta del pecho.",
            "Sube con control hasta estirar los brazos por completo.",
        ], tips: ["Los codos bajan hacia los costados.", "No tires con el cuello ni balancees el cuerpo."]),
        .pullup: ExerciseGuide(steps: [
            "Cuélgate de la barra con los brazos estirados y el agarre a la anchura de los hombros o algo más.",
            "Baja los hombros (escápulas hacia abajo) y aprieta el abdomen.",
            "Tira hasta que la barbilla pase la barra llevando los codos hacia el suelo.",
            "Baja con control hasta estirar de nuevo los brazos.",
        ], tips: ["Evita balancearte.", "Si aún no puedes, usa banda o máquina asistida."]),
        .seatedRow: ExerciseGuide(steps: [
            "Siéntate con los pies apoyados y las rodillas ligeramente flexionadas.",
            "Agarra el maneral con los brazos estirados y la espalda recta.",
            "Tira hacia el abdomen llevando los codos atrás y juntando las escápulas.",
            "Vuelve estirando los brazos sin redondear la espalda.",
        ], tips: ["El torso apenas se mueve.", "Pausa un segundo con las escápulas juntas."]),
        .curl: ExerciseGuide(steps: [
            "De pie, con el peso en las manos y los brazos estirados a los lados.",
            "Pega los codos al cuerpo.",
            "Flexiona los codos subiendo el peso hasta los hombros.",
            "Aprieta el bíceps arriba y baja lentamente.",
        ], tips: ["Los codos no se mueven hacia delante.", "Sin balanceo del cuerpo."]),
        .pushdown: ExerciseGuide(steps: [
            "De pie frente a la polea alta, agarra la barra o cuerda.",
            "Pega los codos a los costados con el torso ligeramente inclinado.",
            "Empuja hacia abajo hasta estirar los brazos por completo.",
            "Sube controlando hasta que los antebrazos queden paralelos al suelo.",
        ], tips: ["Solo se mueven los antebrazos.", "Aprieta el tríceps abajo un segundo."]),
        .ohExt: ExerciseGuide(steps: [
            "Sujeta el peso sobre la cabeza con los brazos estirados.",
            "Mantén los codos apuntando al frente y cerca de la cabeza.",
            "Baja el peso por detrás de la cabeza flexionando solo los codos.",
            "Estira los brazos de nuevo hasta arriba.",
        ], tips: ["No abras los codos.", "Abdomen apretado para no arquear la espalda."]),
        .lateral: ExerciseGuide(steps: [
            "De pie, con los pesos a los lados y los codos ligeramente flexionados.",
            "Sube los brazos (hacia los lados o al frente, según el ejercicio) hasta la altura de los hombros.",
            "Haz una pausa breve arriba.",
            "Baja despacio sin dejar caer el peso.",
        ], tips: ["Usa un peso que te permita no balancearte.", "Lleva el peso con los codos, no con las manos."]),
        .lunge: ExerciseGuide(steps: [
            "De pie, con el peso en las manos (si lo usas).",
            "Da un paso largo (adelante o atrás) manteniendo el torso recto.",
            "Baja hasta que la rodilla de atrás casi toque el suelo y ambas rodillas formen unos 90°.",
            "Empuja con la pierna de delante para volver.",
        ], tips: ["La rodilla de delante sigue la dirección del pie.", "Reparte el peso entre talón y mitad del pie."]),
        .hipThrust: ExerciseGuide(steps: [
            "Apoya la parte alta de la espalda en el banco y coloca el peso sobre la cadera.",
            "Pies a la anchura de la cadera, con las rodillas a 90° arriba.",
            "Empuja con los talones y sube la cadera hasta alinear rodillas, cadera y hombros.",
            "Aprieta los glúteos arriba y baja con control.",
        ], tips: ["Barbilla hacia el pecho para no arquear la espalda.", "Usa una almohadilla para la barra."]),
        .legExt: ExerciseGuide(steps: [
            "Ajusta la máquina para que la rodilla quede alineada con el eje y el rodillo sobre los tobillos.",
            "Agarra los asideros y pega la espalda al respaldo.",
            "Estira las piernas por completo y aprieta los cuádriceps arriba.",
            "Baja despacio sin dejar caer el peso.",
        ], tips: ["No despegues la cadera del asiento.", "Controla la bajada (2–3 segundos)."]),
        .legCurl: ExerciseGuide(steps: [
            "Ajusta la máquina para que el rodillo quede justo encima de los talones.",
            "Agarra los asideros y mantén la cadera pegada al banco.",
            "Flexiona las rodillas llevando los talones hacia los glúteos.",
            "Baja con control hasta casi estirar las piernas.",
        ], tips: ["No levantes la cadera.", "Evita los tirones."]),
        .calf: ExerciseGuide(steps: [
            "Apoya la parte delantera del pie en un escalón o plataforma.",
            "Baja los talones hasta notar estiramiento en el gemelo.",
            "Sube lo más alto posible poniéndote de puntillas.",
            "Pausa arriba y baja despacio.",
        ], tips: ["Recorrido completo: abajo del todo y arriba del todo.", "Rodillas estiradas de pie; flexionadas sentado."]),
        .plank: ExerciseGuide(steps: [
            "Apoya los antebrazos en el suelo con los codos bajo los hombros.",
            "Estira las piernas y apóyate en las puntas de los pies.",
            "Forma una línea recta de la cabeza a los talones.",
            "Aprieta abdomen y glúteos y mantén la posición respirando con normalidad.",
        ], tips: ["La cadera no cae ni sube.", "Mejor menos tiempo con buena técnica."]),
        .crunch: ExerciseGuide(steps: [
            "Túmbate boca arriba con las rodillas flexionadas y los pies apoyados.",
            "Coloca las manos en el pecho o junto a la cabeza (sin tirar del cuello).",
            "Despega los hombros del suelo contrayendo el abdomen.",
            "Baja despacio sin apoyar del todo la cabeza.",
        ], tips: ["Suelta el aire al subir.", "El movimiento es corto: no hace falta sentarse del todo."]),
        .hangLeg: ExerciseGuide(steps: [
            "Cuélgate de la barra con los brazos estirados.",
            "Aprieta el abdomen y evita balancearte.",
            "Sube las piernas (o rodillas) hasta la altura de la cadera o más.",
            "Bájalas con control.",
        ], tips: ["Inclina un poco la pelvis hacia arriba al final.", "Sin impulso."]),
        .run: ExerciseGuide(steps: [
            "Empieza con 5 minutos a ritmo suave para calentar.",
            "Mantén el torso erguido y los hombros relajados.",
            "Mueve los brazos al ritmo de las piernas, con los codos a unos 90°.",
            "Termina con unos minutos suaves para bajar pulsaciones.",
        ], tips: ["Registra distancia y tiempo para seguir tu progreso.", "Aumenta el volumen poco a poco."]),
        .swing: ExerciseGuide(steps: [
            "Pies algo más abiertos que la cadera y la kettlebell delante.",
            "Agárrala con las dos manos, lleva la cadera atrás y pásala entre las piernas.",
            "Extiende la cadera de golpe para lanzar la pesa hasta la altura del pecho.",
            "Deja que baje y repite el movimiento de bisagra.",
        ], tips: ["La fuerza sale de la cadera, no de los brazos.", "Espalda recta en todo momento."]),
        .dip: ExerciseGuide(steps: [
            "Sujétate en las paralelas con los brazos estirados.",
            "Inclina un poco el torso hacia delante (más pecho) o mantenlo vertical (más tríceps).",
            "Baja flexionando los codos hasta que los hombros queden a la altura de los codos.",
            "Empuja hasta estirar los brazos de nuevo.",
        ], tips: ["Hombros lejos de las orejas.", "No bajes más de lo que tu hombro tolere."]),
        .pushup: ExerciseGuide(steps: [
            "Manos en el suelo algo más abiertas que los hombros.",
            "Cuerpo recto de la cabeza a los talones, con el abdomen apretado.",
            "Baja el pecho hasta casi tocar el suelo con los codos a unos 45°.",
            "Empuja el suelo hasta estirar los brazos.",
        ], tips: ["La cadera no se hunde.", "Si cuesta, apoya las rodillas o las manos en un banco."]),
        .chestPress: ExerciseGuide(steps: [
            "Ajusta el asiento para que los agarres queden a la altura del pecho.",
            "Espalda pegada al respaldo y escápulas juntas.",
            "Empuja hasta estirar los brazos sin bloquear los codos de golpe.",
            "Vuelve con control hasta notar el estiramiento.",
        ], tips: ["No despegues la espalda.", "Recorrido completo y controlado."]),
        .lateralRaise: ExerciseGuide(steps: [
            "De pie, con un peso en cada mano a los lados y los codos ligeramente flexionados.",
            "Sube los brazos hacia los lados hasta la altura de los hombros, con las palmas hacia el suelo.",
            "Haz una pausa breve arriba.",
            "Baja despacio, en unos 2–3 segundos.",
        ], tips: ["Lleva el peso con los codos, no con las manos.", "No subas los hombros hacia las orejas.", "Mejor poco peso y técnica limpia."]),
        .shrug: ExerciseGuide(steps: [
            "De pie, con el peso en las manos y los brazos estirados.",
            "Sube los hombros en línea recta hacia las orejas.",
            "Aprieta los trapecios un segundo arriba.",
            "Baja con control hasta estirar.",
        ], tips: ["No gires los hombros en círculo.", "Los brazos no se flexionan."]),
        .uprightRow: ExerciseGuide(steps: [
            "De pie, con la barra delante de los muslos y un agarre a la anchura de los hombros.",
            "Sube la barra pegada al cuerpo llevando los codos hacia arriba y hacia fuera.",
            "Para cuando los codos lleguen a la altura de los hombros.",
            "Baja con control.",
        ], tips: ["Los codos siempre más altos que las manos.", "Si te molesta el hombro, abre más el agarre o sube menos."]),
        .abduction: ExerciseGuide(steps: [
            "Colócate de lado a la polea, o siéntate en la máquina, con la tobillera o las almohadillas en su sitio.",
            "Mantén el torso recto y el abdomen firme.",
            "Separa la pierna hacia fuera hasta notar el glúteo lateral.",
            "Vuelve despacio sin dejar caer el peso.",
        ], tips: ["No inclines el cuerpo hacia el otro lado.", "Movimiento controlado, sin impulso."]),
        .jumpingJack: ExerciseGuide(steps: [
            "De pie, con los pies juntos y los brazos a los lados.",
            "Salta abriendo las piernas mientras subes los brazos por encima de la cabeza.",
            "Salta de nuevo volviendo a la posición inicial.",
            "Mantén un ritmo constante.",
        ], tips: ["Aterriza suave sobre la parte delantera del pie.", "Respira de forma regular."]),
        .jumpRope: ExerciseGuide(steps: [
            "Sujeta la cuerda con los codos cerca del cuerpo.",
            "Gira la cuerda con las muñecas, no con los brazos.",
            "Da saltos pequeños sobre la parte delantera del pie.",
            "Mantén un ritmo cómodo y constante.",
        ], tips: ["Salta solo lo justo para que pase la cuerda.", "Rodillas ligeramente flexionadas."]),
        .facePull: ExerciseGuide(steps: [
            "Coloca la polea a la altura de la cara con una cuerda.",
            "Agarra la cuerda con las palmas hacia dentro y da un paso atrás.",
            "Tira hacia la cara separando las manos y llevando los codos hacia atrás y arriba.",
            "Junta las escápulas, aguanta un segundo y vuelve con control.",
        ], tips: ["Los codos van a la altura de los hombros o algo más arriba.", "Piensa en enseñar el bíceps al final."]),
        .kickback: ExerciseGuide(steps: [
            "Inclínate hacia delante con la espalda recta (apoya una mano en un banco si quieres).",
            "Pega el brazo al costado, con el codo a la altura del torso.",
            "Estira el codo llevando el peso hacia atrás hasta que el brazo quede recto.",
            "Vuelve despacio sin mover el hombro.",
        ], tips: ["Solo se mueve el antebrazo.", "Aprieta el tríceps al final."]),
        .preacherCurl: ExerciseGuide(steps: [
            "Siéntate en el banco predicador con la parte trasera de los brazos apoyada en el cojín.",
            "Agarra la barra o la mancuerna con los brazos casi estirados.",
            "Flexiona los codos subiendo el peso hacia los hombros.",
            "Baja despacio hasta casi estirar los brazos.",
        ], tips: ["No despegues los brazos del cojín.", "Controla mucho la bajada."]),
        .skullCrusher: ExerciseGuide(steps: [
            "Túmbate en el banco con el peso sobre el pecho y los brazos estirados.",
            "Inclina un poco los brazos hacia la cabeza.",
            "Flexiona solo los codos bajando el peso hacia la frente o detrás de la cabeza.",
            "Estira los brazos de nuevo apretando el tríceps.",
        ], tips: ["Los codos apuntan al techo y no se abren.", "Usa barra Z si te molestan las muñecas."]),
        .cableFly: ExerciseGuide(steps: [
            "Colócate en el centro de las poleas con un pie adelantado y el torso algo inclinado.",
            "Agarra los manerales con los codos ligeramente flexionados.",
            "Junta las manos delante del pecho en un arco amplio.",
            "Abre despacio hasta notar el estiramiento del pecho.",
        ], tips: ["El ángulo del codo no cambia.", "Aprieta el pecho cuando las manos se juntan."]),
        .goodMorning: ExerciseGuide(steps: [
            "Coloca la barra sobre la parte alta de la espalda, como en la sentadilla.",
            "Con las rodillas ligeramente flexionadas, lleva la cadera hacia atrás inclinando el torso.",
            "Baja hasta que el torso quede casi paralelo al suelo o notes los isquiotibiales.",
            "Sube empujando la cadera hacia delante.",
        ], tips: ["Espalda recta durante todo el movimiento.", "Empieza con poco peso."]),
        .hyperext: ExerciseGuide(steps: [
            "Ajusta el banco para que el cojín quede justo debajo de la cadera.",
            "Cruza los brazos sobre el pecho o sujeta un disco.",
            "Baja el torso doblándote por la cadera.",
            "Sube hasta alinear el cuerpo, apretando glúteos y lumbares, sin arquearte de más.",
        ], tips: ["Movimiento lento y controlado.", "No sobrepases la línea recta del cuerpo."]),
        .legRaise: ExerciseGuide(steps: [
            "Túmbate boca arriba con las piernas estiradas y las manos a los lados o bajo la cadera.",
            "Pega la zona lumbar al suelo.",
            "Sube las piernas juntas hasta que queden verticales.",
            "Bájalas despacio sin que toquen el suelo.",
        ], tips: ["Si te molesta la espalda, flexiona un poco las rodillas.", "Suelta el aire al subir."]),
        .bike: ExerciseGuide(steps: [
            "Ajusta el sillín para que la rodilla quede casi estirada con el pedal abajo.",
            "Agarra el manillar con los brazos relajados.",
            "Pedalea con un ritmo constante empujando y tirando del pedal.",
            "Ajusta la resistencia según el objetivo (suave, intervalos…).",
        ], tips: ["La cadera no se balancea en el sillín.", "Registra distancia y tiempo para seguir tu progreso."]),
        .rowErg: ExerciseGuide(steps: [
            "Siéntate con los pies sujetos y agarra el maneral con los brazos estirados.",
            "Empuja primero con las piernas.",
            "Cuando las piernas estén casi estiradas, inclina un poco el torso atrás y tira del maneral hacia el abdomen.",
            "Vuelve en orden inverso: brazos, torso y piernas.",
        ], tips: ["Piernas, tronco y brazos: en ese orden.", "La espalda no se redondea."]),
        .walk: ExerciseGuide(steps: [
            "Si llevas peso, coge una mancuerna o kettlebell pesada en cada mano.",
            "Mantén el torso erguido, los hombros atrás y el abdomen firme.",
            "Camina con pasos cortos y controlados.",
            "Mantén el ritmo durante la distancia o el tiempo marcado.",
        ], tips: ["No dejes que el peso te incline hacia los lados.", "Agarre fuerte durante todo el recorrido."]),
        .pullover: ExerciseGuide(steps: [
            "Túmbate en el banco y sujeta una mancuerna con ambas manos sobre el pecho.",
            "Con los codos ligeramente flexionados, baja el peso por detrás de la cabeza en un arco.",
            "Baja hasta notar estiramiento en el dorsal y el pecho.",
            "Vuelve por el mismo arco hasta encima del pecho.",
        ], tips: ["El ángulo de los codos no cambia.", "Baja solo hasta donde controles."]),
        .dbRow: ExerciseGuide(steps: [
            "Apoya una mano y la rodilla del mismo lado en un banco.",
            "Con la espalda recta, deja colgar la mancuerna con el otro brazo.",
            "Tira llevando el codo hacia la cadera.",
            "Baja con control hasta estirar el brazo.",
        ], tips: ["No gires el torso para subir el peso.", "Piensa en tirar con el codo, no con la mano."]),
        .gluteKickback: ExerciseGuide(steps: [
            "Colócate a cuatro patas (o de pie frente a la polea) con la tobillera puesta.",
            "Mantén el abdomen firme y la espalda neutra.",
            "Lleva la pierna hacia atrás y arriba apretando el glúteo.",
            "Vuelve despacio sin perder la postura.",
        ], tips: ["No arquees la zona lumbar.", "Pausa de un segundo arriba."]),
        .seatedCalf: ExerciseGuide(steps: [
            "Siéntate con la parte delantera de los pies en la plataforma y las almohadillas sobre las rodillas.",
            "Baja los talones hasta notar el estiramiento.",
            "Sube los talones lo más alto posible.",
            "Pausa arriba y baja despacio.",
        ], tips: ["Recorrido completo en cada repetición.", "Trabaja sobre todo el sóleo."]),
        .legPress: ExerciseGuide(steps: [
            "Siéntate con la espalda y la cadera bien apoyadas.",
            "Pies en la plataforma a la anchura de los hombros.",
            "Quita los seguros y baja la plataforma flexionando las rodillas hacia el pecho.",
            "Empuja con todo el pie hasta casi estirar las piernas.",
        ], tips: ["No bloquees las rodillas arriba.", "La zona lumbar no se despega del respaldo."]),
    ]

    // MARK: - Catálogo

    static let catalog: [Entry] = [
        // Pecho
        ("Press de banca", .chest, .barbell, .weightReps, .bench),
        ("Press de banca con mancuernas", .chest, .dumbbell, .weightReps, .bench),
        ("Press inclinado con barra", .chest, .barbell, .weightReps, .incline),
        ("Press inclinado con mancuernas", .chest, .dumbbell, .weightReps, .incline),
        ("Press declinado con barra", .chest, .barbell, .weightReps, .bench),
        ("Press declinado con mancuernas", .chest, .dumbbell, .weightReps, .bench),
        ("Press de banca en máquina Smith", .chest, .machine, .weightReps, .bench),
        ("Press inclinado en máquina Smith", .chest, .machine, .weightReps, .incline),
        ("Press de suelo con barra", .chest, .barbell, .weightReps, .bench),
        ("Press de pecho en máquina", .chest, .machine, .weightReps, .chestPress),
        ("Press inclinado en máquina", .chest, .machine, .weightReps, .chestPress),
        ("Press de pecho en polea", .chest, .cable, .weightReps, .chestPress),
        ("Aperturas con mancuernas", .chest, .dumbbell, .weightReps, .fly),
        ("Aperturas inclinadas con mancuernas", .chest, .dumbbell, .weightReps, .fly),
        ("Aperturas en máquina", .chest, .machine, .weightReps, .cableFly),
        ("Cruce de poleas", .chest, .cable, .weightReps, .cableFly),
        ("Cruce de poleas de abajo arriba", .chest, .cable, .weightReps, .cableFly),
        ("Cruce de poleas de arriba abajo", .chest, .cable, .weightReps, .cableFly),
        ("Pullover con mancuerna", .chest, .dumbbell, .weightReps, .pullover),
        ("Fondos en paralelas", .chest, .bodyweight, .repsOnly, .dip),
        ("Fondos lastrados", .chest, .bodyweight, .weightReps, .dip),
        ("Flexiones", .chest, .bodyweight, .repsOnly, .pushup),
        ("Flexiones inclinadas", .chest, .bodyweight, .repsOnly, .pushup),
        ("Flexiones declinadas", .chest, .bodyweight, .repsOnly, .pushup),
        ("Flexiones con palmada", .chest, .bodyweight, .repsOnly, .pushup),
        ("Flexiones lastradas", .chest, .bodyweight, .weightReps, .pushup),
        // Espalda
        ("Peso muerto", .back, .barbell, .weightReps, .deadlift),
        ("Peso muerto sumo", .back, .barbell, .weightReps, .deadlift),
        ("Peso muerto con barra hexagonal", .back, .barbell, .weightReps, .deadlift),
        ("Peso muerto con mancuernas", .back, .dumbbell, .weightReps, .deadlift),
        ("Rack pull", .upperBack, .barbell, .weightReps, .deadlift),
        ("Dominadas", .lats, .bodyweight, .repsOnly, .pullup),
        ("Dominadas lastradas", .lats, .bodyweight, .weightReps, .pullup),
        ("Dominadas supinas", .lats, .bodyweight, .repsOnly, .pullup),
        ("Dominadas agarre neutro", .lats, .bodyweight, .repsOnly, .pullup),
        ("Dominadas asistidas", .lats, .machine, .weightReps, .pullup),
        ("Remo con barra", .upperBack, .barbell, .weightReps, .row),
        ("Remo Pendlay", .upperBack, .barbell, .weightReps, .row),
        ("Remo con barra agarre supino", .upperBack, .barbell, .weightReps, .row),
        ("Remo con mancuerna", .upperBack, .dumbbell, .weightReps, .dbRow),
        ("Remo con mancuernas con pecho apoyado", .upperBack, .dumbbell, .weightReps, .row),
        ("Remo en T", .upperBack, .barbell, .weightReps, .row),
        ("Remo Meadows", .upperBack, .barbell, .weightReps, .row),
        ("Remo invertido", .upperBack, .bodyweight, .repsOnly, .row),
        ("Remo sentado en polea", .upperBack, .cable, .weightReps, .seatedRow),
        ("Remo en polea a una mano", .upperBack, .cable, .weightReps, .seatedRow),
        ("Remo en máquina", .upperBack, .machine, .weightReps, .seatedRow),
        ("Jalón al pecho", .lats, .cable, .weightReps, .pulldown),
        ("Jalón agarre estrecho", .lats, .cable, .weightReps, .pulldown),
        ("Jalón agarre supino", .lats, .cable, .weightReps, .pulldown),
        ("Jalón a una mano", .lats, .cable, .weightReps, .pulldown),
        ("Jalón en máquina", .lats, .machine, .weightReps, .pulldown),
        ("Pullover en polea", .lats, .cable, .weightReps, .pulldown),
        ("Jalón con brazos rectos", .lats, .cable, .weightReps, .pulldown),
        ("Hiperextensiones", .lowerBack, .bodyweight, .repsOnly, .hyperext),
        ("Hiperextensiones lastradas", .lowerBack, .bodyweight, .weightReps, .hyperext),
        ("Encogimientos con barra", .traps, .barbell, .weightReps, .shrug),
        ("Encogimientos con mancuernas", .traps, .dumbbell, .weightReps, .shrug),
        ("Encogimientos en máquina", .traps, .machine, .weightReps, .shrug),
        ("Superman", .lowerBack, .bodyweight, .duration, .hyperext),
        // Hombros
        ("Press militar con barra", .shoulders, .barbell, .weightReps, .ohp),
        ("Press militar sentado", .shoulders, .barbell, .weightReps, .ohp),
        ("Press de hombro con mancuernas", .shoulders, .dumbbell, .weightReps, .ohp),
        ("Press de hombro sentado con mancuernas", .shoulders, .dumbbell, .weightReps, .ohp),
        ("Press Arnold", .shoulders, .dumbbell, .weightReps, .ohp),
        ("Press de hombro en máquina", .shoulders, .machine, .weightReps, .ohp),
        ("Press de hombro en máquina Smith", .shoulders, .machine, .weightReps, .ohp),
        ("Push press", .shoulders, .barbell, .weightReps, .ohp),
        ("Press landmine", .shoulders, .barbell, .weightReps, .ohp),
        ("Elevaciones laterales", .shoulders, .dumbbell, .weightReps, .lateralRaise),
        ("Elevaciones laterales en polea", .shoulders, .cable, .weightReps, .lateralRaise),
        ("Elevaciones laterales en máquina", .shoulders, .machine, .weightReps, .lateralRaise),
        ("Elevaciones frontales", .shoulders, .dumbbell, .weightReps, .lateral),
        ("Elevaciones frontales con barra", .shoulders, .barbell, .weightReps, .lateral),
        ("Elevaciones frontales en polea", .shoulders, .cable, .weightReps, .lateral),
        ("Pájaros con mancuernas", .shoulders, .dumbbell, .weightReps, .row),
        ("Pájaros en máquina", .shoulders, .machine, .weightReps, .facePull),
        ("Pájaros en polea", .shoulders, .cable, .weightReps, .facePull),
        ("Face pull", .shoulders, .cable, .weightReps, .facePull),
        ("Remo al mentón con barra", .shoulders, .barbell, .weightReps, .uprightRow),
        ("Remo al mentón en polea", .shoulders, .cable, .weightReps, .uprightRow),
        ("Elevaciones en Y", .shoulders, .dumbbell, .weightReps, .lateralRaise),
        // Bíceps
        ("Curl con barra", .biceps, .barbell, .weightReps, .curl),
        ("Curl con barra Z", .biceps, .barbell, .weightReps, .curl),
        ("Curl con mancuernas", .biceps, .dumbbell, .weightReps, .curl),
        ("Curl alterno con mancuernas", .biceps, .dumbbell, .weightReps, .curl),
        ("Curl martillo", .biceps, .dumbbell, .weightReps, .curl),
        ("Curl martillo en polea", .biceps, .cable, .weightReps, .curl),
        ("Curl concentrado", .biceps, .dumbbell, .weightReps, .preacherCurl),
        ("Curl inclinado con mancuernas", .biceps, .dumbbell, .weightReps, .curl),
        ("Curl predicador", .biceps, .barbell, .weightReps, .preacherCurl),
        ("Curl predicador con mancuerna", .biceps, .dumbbell, .weightReps, .preacherCurl),
        ("Curl predicador en máquina", .biceps, .machine, .weightReps, .preacherCurl),
        ("Curl en polea", .biceps, .cable, .weightReps, .curl),
        ("Curl con cuerda en polea", .biceps, .cable, .weightReps, .curl),
        ("Curl bayesiano en polea", .biceps, .cable, .weightReps, .curl),
        ("Curl araña", .biceps, .dumbbell, .weightReps, .curl),
        ("Curl 21", .biceps, .barbell, .weightReps, .curl),
        ("Curl en máquina", .biceps, .machine, .weightReps, .curl),
        // Tríceps
        ("Extensión de tríceps en polea", .triceps, .cable, .weightReps, .pushdown),
        ("Extensión de tríceps con cuerda", .triceps, .cable, .weightReps, .pushdown),
        ("Extensión de tríceps a una mano en polea", .triceps, .cable, .weightReps, .pushdown),
        ("Extensión de tríceps agarre inverso", .triceps, .cable, .weightReps, .pushdown),
        ("Press francés", .triceps, .barbell, .weightReps, .skullCrusher),
        ("Press francés con mancuernas", .triceps, .dumbbell, .weightReps, .skullCrusher),
        ("Extensión sobre la cabeza con mancuerna", .triceps, .dumbbell, .weightReps, .ohExt),
        ("Extensión sobre la cabeza en polea", .triceps, .cable, .weightReps, .ohExt),
        ("Extensión sobre la cabeza con barra Z", .triceps, .barbell, .weightReps, .ohExt),
        ("Patada de tríceps", .triceps, .dumbbell, .weightReps, .kickback),
        ("Patada de tríceps en polea", .triceps, .cable, .weightReps, .kickback),
        ("Press de banca agarre cerrado", .triceps, .barbell, .weightReps, .bench),
        ("Press JM", .triceps, .barbell, .weightReps, .bench),
        ("Fondos en banco", .triceps, .bodyweight, .repsOnly, .dip),
        ("Fondos en máquina", .triceps, .machine, .weightReps, .dip),
        ("Extensión de tríceps en máquina", .triceps, .machine, .weightReps, .pushdown),
        ("Flexiones diamante", .triceps, .bodyweight, .repsOnly, .pushup),
        // Antebrazos
        ("Curl de muñeca", .forearms, .dumbbell, .weightReps, .curl),
        ("Curl de muñeca inverso", .forearms, .dumbbell, .weightReps, .curl),
        ("Curl inverso con barra", .forearms, .barbell, .weightReps, .curl),
        ("Paseo del granjero", .forearms, .dumbbell, .distanceTime, .walk),
        ("Colgarse de la barra", .forearms, .bodyweight, .duration, .pullup),
        // Cuádriceps
        ("Sentadilla con barra", .quads, .barbell, .weightReps, .squat),
        ("Sentadilla frontal", .quads, .barbell, .weightReps, .frontSquat),
        ("Sentadilla goblet", .quads, .dumbbell, .weightReps, .frontSquat),
        ("Sentadilla con mancuernas", .quads, .dumbbell, .weightReps, .squat),
        ("Sentadilla en máquina Smith", .quads, .machine, .weightReps, .squat),
        ("Sentadilla hack", .quads, .machine, .weightReps, .squat),
        ("Sentadilla péndulo", .quads, .machine, .weightReps, .squat),
        ("Sentadilla en caja", .quads, .barbell, .weightReps, .squat),
        ("Sentadilla Zercher", .quads, .barbell, .weightReps, .frontSquat),
        ("Sentadilla con peso corporal", .quads, .bodyweight, .repsOnly, .squat),
        ("Sentadilla con salto", .quads, .bodyweight, .repsOnly, .squat),
        ("Sentadilla pistol", .quads, .bodyweight, .repsOnly, .squat),
        ("Sentadilla sissy", .quads, .bodyweight, .repsOnly, .squat),
        ("Sentadilla en pared", .quads, .bodyweight, .duration, .squat),
        ("Sentadilla búlgara", .quads, .dumbbell, .weightReps, .lunge),
        ("Sentadilla búlgara con barra", .quads, .barbell, .weightReps, .lunge),
        ("Prensa de piernas", .quads, .machine, .weightReps, .legPress),
        ("Prensa de piernas horizontal", .quads, .machine, .weightReps, .legPress),
        ("Prensa a una pierna", .quads, .machine, .weightReps, .legPress),
        ("Extensión de cuádriceps", .quads, .machine, .weightReps, .legExt),
        ("Extensión de cuádriceps a una pierna", .quads, .machine, .weightReps, .legExt),
        ("Zancadas con mancuernas", .quads, .dumbbell, .weightReps, .lunge),
        ("Zancadas con barra", .quads, .barbell, .weightReps, .lunge),
        ("Zancadas hacia atrás", .quads, .dumbbell, .weightReps, .lunge),
        ("Zancadas caminando", .quads, .dumbbell, .weightReps, .lunge),
        ("Zancadas laterales", .quads, .dumbbell, .weightReps, .lunge),
        ("Zancadas en máquina Smith", .quads, .machine, .weightReps, .lunge),
        ("Step-up con mancuernas", .quads, .dumbbell, .weightReps, .lunge),
        // Isquiotibiales
        ("Peso muerto rumano", .hamstrings, .barbell, .weightReps, .rdl),
        ("Peso muerto rumano con mancuernas", .hamstrings, .dumbbell, .weightReps, .rdl),
        ("Peso muerto piernas rígidas", .hamstrings, .barbell, .weightReps, .rdl),
        ("Peso muerto a una pierna", .hamstrings, .dumbbell, .weightReps, .rdl),
        ("Buenos días", .hamstrings, .barbell, .weightReps, .goodMorning),
        ("Curl femoral tumbado", .hamstrings, .machine, .weightReps, .legCurl),
        ("Curl femoral sentado", .hamstrings, .machine, .weightReps, .legCurl),
        ("Curl femoral de pie", .hamstrings, .machine, .weightReps, .legCurl),
        ("Curl femoral con mancuerna", .hamstrings, .dumbbell, .weightReps, .legCurl),
        ("Curl nórdico", .hamstrings, .bodyweight, .repsOnly, .legCurl),
        ("Curl femoral con fitball", .hamstrings, .other, .repsOnly, .hipThrust),
        // Glúteos
        ("Hip thrust con barra", .glutes, .barbell, .weightReps, .hipThrust),
        ("Hip thrust en máquina", .glutes, .machine, .weightReps, .hipThrust),
        ("Hip thrust a una pierna", .glutes, .bodyweight, .repsOnly, .hipThrust),
        ("Hip thrust con mancuerna", .glutes, .dumbbell, .weightReps, .hipThrust),
        ("Puente de glúteos", .glutes, .bodyweight, .repsOnly, .hipThrust),
        ("Puente de glúteos con barra", .glutes, .barbell, .weightReps, .hipThrust),
        ("Patada de glúteo en polea", .glutes, .cable, .weightReps, .gluteKickback),
        ("Patada de glúteo en máquina", .glutes, .machine, .weightReps, .gluteKickback),
        ("Abducción en máquina", .glutes, .machine, .weightReps, .abduction),
        ("Abducción con banda", .glutes, .band, .repsOnly, .abduction),
        ("Aducción en máquina", .adductors, .machine, .weightReps, .abduction),
        ("Pull-through en polea", .glutes, .cable, .weightReps, .swing),
        ("Frog pump", .glutes, .bodyweight, .repsOnly, .hipThrust),
        // Gemelos
        ("Elevación de talones de pie", .calves, .machine, .weightReps, .calf),
        ("Elevación de talones sentado", .calves, .machine, .weightReps, .seatedCalf),
        ("Elevación de talones en prensa", .calves, .machine, .weightReps, .calf),
        ("Elevación de talones con mancuerna", .calves, .dumbbell, .weightReps, .calf),
        ("Elevación de talones en máquina Smith", .calves, .machine, .weightReps, .calf),
        ("Elevación de talones con peso corporal", .calves, .bodyweight, .repsOnly, .calf),
        ("Elevación de puntas (tibial)", .calves, .bodyweight, .repsOnly, .calf),
        // Abdomen
        ("Plancha", .core, .bodyweight, .duration, .plank),
        ("Plancha lateral", .obliques, .bodyweight, .duration, .plank),
        ("Plancha con peso", .core, .bodyweight, .duration, .plank),
        ("Crunch abdominal", .core, .bodyweight, .repsOnly, .crunch),
        ("Crunch en polea", .core, .cable, .weightReps, .crunch),
        ("Crunch en máquina", .core, .machine, .weightReps, .crunch),
        ("Crunch inverso", .core, .bodyweight, .repsOnly, .legRaise),
        ("Crunch bicicleta", .core, .bodyweight, .repsOnly, .crunch),
        ("Abdominales completos", .core, .bodyweight, .repsOnly, .crunch),
        ("Abdominales en V", .core, .bodyweight, .repsOnly, .crunch),
        ("Dead bug", .core, .bodyweight, .repsOnly, .crunch),
        ("Hollow hold", .core, .bodyweight, .duration, .crunch),
        ("Giros rusos", .obliques, .other, .weightReps, .crunch),
        ("Elevación de piernas colgado", .core, .bodyweight, .repsOnly, .hangLeg),
        ("Elevación de rodillas colgado", .core, .bodyweight, .repsOnly, .hangLeg),
        ("Toes to bar", .core, .bodyweight, .repsOnly, .hangLeg),
        ("Elevación de piernas tumbado", .core, .bodyweight, .repsOnly, .legRaise),
        ("Rueda abdominal", .core, .other, .repsOnly, .plank),
        ("Escaladores", .core, .bodyweight, .repsOnly, .plank),
        ("Leñador en polea", .obliques, .cable, .weightReps, .lateral),
        ("Pallof press", .core, .cable, .weightReps, .chestPress),
        // Cardio
        ("Correr", .cardio, .other, .distanceTime, .run),
        ("Correr en cinta", .cardio, .machine, .distanceTime, .run),
        ("Caminar", .cardio, .other, .distanceTime, .walk),
        ("Caminar en cinta inclinada", .cardio, .machine, .distanceTime, .walk),
        ("Senderismo", .cardio, .other, .distanceTime, .walk),
        ("Bicicleta estática", .cardio, .machine, .distanceTime, .bike),
        ("Ciclismo", .cardio, .other, .distanceTime, .bike),
        ("Bicicleta de aire", .cardio, .machine, .distanceTime, .bike),
        ("Remo ergómetro", .cardio, .machine, .distanceTime, .rowErg),
        ("Ski ergómetro", .cardio, .machine, .distanceTime, .pulldown),
        ("Elíptica", .cardio, .machine, .duration, .run),
        ("Escaladora", .cardio, .machine, .duration, .run),
        ("Natación", .cardio, .other, .distanceTime, .run),
        ("Saltar la cuerda", .cardio, .other, .duration, .jumpRope),
        ("Jumping jacks", .cardio, .bodyweight, .repsOnly, .jumpingJack),
        ("Empuje de trineo", .cardio, .other, .distanceTime, .run),
        ("Cuerdas de batalla", .cardio, .other, .duration, .curl),
        ("Caminata del oso", .cardio, .bodyweight, .duration, .pushup),
        // Cuerpo completo
        ("Swing con kettlebell", .fullBody, .kettlebell, .weightReps, .swing),
        ("Swing con kettlebell a una mano", .fullBody, .kettlebell, .weightReps, .swing),
        ("Arrancada con kettlebell", .fullBody, .kettlebell, .weightReps, .swing),
        ("Cargada con kettlebell", .fullBody, .kettlebell, .weightReps, .swing),
        ("Sentadilla goblet con kettlebell", .fullBody, .kettlebell, .weightReps, .frontSquat),
        ("Burpees", .fullBody, .bodyweight, .repsOnly, .pushup),
        ("Thruster", .fullBody, .barbell, .weightReps, .frontSquat),
        ("Thruster con mancuernas", .fullBody, .dumbbell, .weightReps, .frontSquat),
        ("Cargada de potencia", .fullBody, .barbell, .weightReps, .deadlift),
        ("Cargada y press", .fullBody, .barbell, .weightReps, .ohp),
        ("Arrancada", .fullBody, .barbell, .weightReps, .ohp),
        ("Envión", .fullBody, .barbell, .weightReps, .ohp),
        ("Levantamiento turco", .fullBody, .kettlebell, .weightReps, .crunch),
        ("Wall ball", .fullBody, .other, .repsOnly, .frontSquat),
        ("Salto al cajón", .fullBody, .bodyweight, .repsOnly, .squat),
        ("Devil press", .fullBody, .dumbbell, .weightReps, .pushup),
        ("Man maker", .fullBody, .dumbbell, .weightReps, .pushup),
    ]
}
