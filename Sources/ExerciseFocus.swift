import SwiftUI

/// Qué parte concreta trabaja cada ejercicio, descanso sugerido y aviso de ejercicios repetitivos.
enum ExerciseFocus {
    struct Focus {
        let key: String
        let text: String
    }

    // MARK: - Enfoque por ejercicio

    private static let byName: [String: (String, String)] = [
        // Pecho
        "press de banca": ("chest-mid", "Porción media (esternal) del pectoral, con deltoides anterior y tríceps como ayudantes."),
        "press de banca con mancuernas": ("chest-mid", "Pectoral medio con más recorrido que la barra; cada lado trabaja por separado."),
        "press inclinado con barra": ("chest-upper", "Porción superior (clavicular) del pectoral y más deltoides anterior que el press plano."),
        "press inclinado con mancuernas": ("chest-upper", "Pectoral superior (clavicular) con buen estiramiento abajo."),
        "press declinado con barra": ("chest-lower", "Porción inferior del pectoral; el hombro sufre menos que en el plano."),
        "press declinado con mancuernas": ("chest-lower", "Porción inferior del pectoral."),
        "aperturas con mancuernas": ("chest-fly", "Pectoral aislado en estiramiento, casi sin tríceps."),
        "aperturas inclinadas con mancuernas": ("chest-fly", "Pectoral superior aislado, en estiramiento."),
        "aperturas en máquina": ("chest-fly", "Pectoral aislado con tensión constante, sobre todo al cerrar los brazos."),
        "cruce de poleas": ("chest-fly", "Pectoral aislado con tensión en todo el recorrido."),
        "cruce de poleas de abajo arriba": ("chest-fly", "Pectoral superior aislado (los brazos suben al cerrar)."),
        "cruce de poleas de arriba abajo": ("chest-fly", "Pectoral inferior aislado (los brazos bajan al cerrar)."),
        "fondos en paralelas": ("chest-lower", "Pectoral inferior y tríceps; inclinándote adelante trabaja más pecho."),
        "pullover con mancuerna": ("lats-iso", "Dorsal y pectoral en estiramiento por encima de la cabeza; sin bíceps."),
        // Espalda
        "dominadas": ("lats", "Dorsal ancho (amplitud de la espalda) con bíceps y redondo mayor."),
        "dominadas supinas": ("lats", "Dorsal ancho con mucho más bíceps que las dominadas pronas."),
        "jalón al pecho": ("lats", "Dorsal ancho: da amplitud (la «V» de la espalda)."),
        "jalón agarre estrecho": ("lats", "Dorsal ancho, sobre todo su parte baja, con más recorrido."),
        "jalón con brazos rectos": ("lats-iso", "Dorsal aislado, sin bíceps."),
        "pullover en polea": ("lats-iso", "Dorsal aislado, sin bíceps."),
        "remo con barra": ("back-mid", "Grosor de la espalda: romboides, trapecio medio y dorsal; también lumbares en isométrico."),
        "remo con mancuerna": ("back-mid", "Dorsal y espalda media de un lado; llevar el codo a la cadera carga más el dorsal."),
        "remo en t": ("back-mid", "Espalda media (romboides y trapecio medio) y dorsal."),
        "remo con mancuernas con pecho apoyado": ("back-mid", "Espalda media sin cargar la zona lumbar."),
        "remo sentado en polea": ("back-mid", "Espalda media y dorsal; con agarre estrecho, más dorsal."),
        "remo en polea a una mano": ("back-mid", "Dorsal y espalda media de un lado, con rotación del tronco."),
        "encogimientos con barra": ("traps", "Trapecio superior."),
        "encogimientos con mancuernas": ("traps", "Trapecio superior."),
        "peso muerto": ("posterior", "Cadena posterior completa: glúteos, isquios, lumbares y trapecios; cuádriceps al despegar."),
        "hiperextensiones": ("lower-back", "Lumbares y glúteos; redondeando la espalda, más glúteo."),
        // Hombro
        "press militar con barra": ("delt-front", "Deltoides anterior sobre todo, algo de lateral, y tríceps."),
        "press de hombro con mancuernas": ("delt-front", "Deltoides anterior y lateral con algo más de recorrido que la barra."),
        "press arnold": ("delt-front", "Deltoides anterior y lateral; el giro alarga el recorrido."),
        "elevaciones laterales": ("delt-side", "Deltoides lateral (el que da anchura al hombro)."),
        "elevaciones laterales en polea": ("delt-side", "Deltoides lateral con tensión también abajo."),
        "elevaciones frontales": ("delt-front", "Deltoides anterior; ya trabaja mucho en los press, úsalo con moderación."),
        "pájaros con mancuernas": ("delt-rear", "Deltoides posterior y espalda alta."),
        "pájaros en máquina": ("delt-rear", "Deltoides posterior aislado."),
        "face pull": ("delt-rear", "Deltoides posterior y rotadores externos: muy bueno para la salud del hombro."),
        "remo al mentón con barra": ("delt-side", "Deltoides lateral y trapecio; con agarre ancho, más deltoides."),
        // Bíceps y antebrazo
        "curl con barra": ("biceps-short", "Bíceps completo con algo más de cabeza corta (agarre supino y ancho)."),
        "curl con barra z": ("biceps-short", "Bíceps con la muñeca más cómoda; algo más de braquial que la barra recta."),
        "curl con mancuernas": ("biceps", "Bíceps completo; girar la muñeca al subir (supinar) lo activa más."),
        "curl alterno con mancuernas": ("biceps", "Bíceps completo, un brazo cada vez."),
        "curl martillo": ("brachialis", "Braquial y braquiorradial, más la cabeza larga del bíceps: engrosa el brazo visto de frente."),
        "curl martillo en polea": ("brachialis", "Braquial y braquiorradial con tensión constante."),
        "curl inclinado con mancuernas": ("biceps-long", "Cabeza larga del bíceps, en estiramiento (brazo por detrás del cuerpo)."),
        "curl bayesiano en polea": ("biceps-long", "Cabeza larga del bíceps en estiramiento."),
        "curl predicador": ("biceps-short", "Cabeza corta del bíceps (brazo por delante del cuerpo)."),
        "curl predicador con mancuerna": ("biceps-short", "Cabeza corta del bíceps."),
        "curl predicador en máquina": ("biceps-short", "Cabeza corta del bíceps."),
        "curl concentrado": ("biceps-short", "Cabeza corta del bíceps (el «pico»)."),
        "curl araña": ("biceps-short", "Cabeza corta, con máxima tensión arriba."),
        "curl inverso con barra": ("brachialis", "Braquiorradial y extensores del antebrazo."),
        "curl de muñeca": ("forearms", "Flexores del antebrazo."),
        "curl de muñeca inverso": ("forearms", "Extensores del antebrazo."),
        // Tríceps
        "extensión de tríceps en polea": ("triceps-lat", "Cabezas lateral y medial del tríceps."),
        "extensión de tríceps con cuerda": ("triceps-lat", "Cabeza lateral sobre todo (al separar la cuerda abajo)."),
        "extensión de tríceps agarre inverso": ("triceps-lat", "Cabeza medial del tríceps."),
        "press francés": ("triceps-long", "Cabeza larga del tríceps (brazo algo por encima del hombro)."),
        "extensión sobre la cabeza con mancuerna": ("triceps-long", "Cabeza larga del tríceps, en estiramiento."),
        "extensión sobre la cabeza en polea": ("triceps-long", "Cabeza larga del tríceps, en estiramiento."),
        "patada de tríceps": ("triceps-lat", "Cabezas lateral y medial con máxima tensión al estirar."),
        "press de banca agarre cerrado": ("triceps-all", "Tríceps completo con ayuda del pecho: permite mucha carga."),
        "fondos en banco": ("triceps-all", "Tríceps completo."),
        // Pierna
        "sentadilla con barra": ("quads", "Cuádriceps y glúteo mayor, con aductores y lumbares estabilizando."),
        "sentadilla frontal": ("quads", "Más cuádriceps y menos espalda baja que la sentadilla trasera."),
        "sentadilla hack": ("quads", "Cuádriceps con la espalda apoyada."),
        "prensa de piernas": ("quads", "Cuádriceps y glúteo; pies altos en la plataforma = más glúteo e isquios."),
        "sentadilla búlgara": ("quads", "Cuádriceps y glúteo de una pierna; inclinado adelante, más glúteo."),
        "extensión de cuádriceps": ("quads-iso", "Cuádriceps aislado, sobre todo el recto femoral."),
        "zancadas hacia atrás": ("quads", "Glúteo y cuádriceps con menos estrés en la rodilla que la zancada adelante."),
        "peso muerto rumano": ("hams-hinge", "Isquios y glúteo en estiramiento (bisagra de cadera)."),
        "peso muerto piernas rígidas": ("hams-hinge", "Isquios en estiramiento, más que el rumano."),
        "buenos días": ("hams-hinge", "Isquios, glúteo y lumbares."),
        "curl femoral tumbado": ("hams-curl", "Isquios por la flexión de rodilla."),
        "curl femoral sentado": ("hams-curl", "Isquios en posición más estirada: suele dar más hipertrofia que el tumbado."),
        "curl nórdico": ("hams-curl", "Isquios en excéntrico; muy útil para prevenir lesiones."),
        "hip thrust con barra": ("glutes", "Glúteo mayor con máxima tensión arriba."),
        "puente de glúteos": ("glutes", "Glúteo mayor."),
        "abducción en máquina": ("glutes-med", "Glúteo medio y menor (parte alta y lateral de la cadera)."),
        "aducción en máquina": ("adductors", "Aductores (cara interna del muslo)."),
        "elevación de talones de pie": ("calves", "Gemelo (rodilla estirada)."),
        "elevación de talones sentado": ("soleus", "Sóleo (rodilla doblada desactiva el gemelo)."),
        // Core
        "crunch abdominal": ("abs-upper", "Recto abdominal, sobre todo la parte alta."),
        "crunch en polea": ("abs-upper", "Recto abdominal con carga progresiva."),
        "crunch inverso": ("abs-lower", "Recto abdominal, parte baja."),
        "elevación de piernas colgado": ("abs-lower", "Abdomen bajo y flexores de cadera; enrolla la pelvis al subir."),
        "elevación de piernas tumbado": ("abs-lower", "Abdomen bajo y flexores de cadera."),
        "plancha": ("core-stab", "Core en estabilidad (transverso y recto abdominal)."),
        "plancha lateral": ("obliques", "Oblicuos y cuadrado lumbar en estabilidad."),
        "leñador en polea": ("obliques", "Oblicuos en rotación."),
        "giros rusos": ("obliques", "Oblicuos en rotación."),
        "pallof press": ("core-stab", "Core resistiendo la rotación."),
    ]

    private static let byPattern: [MovementPattern: (String, String)] = [
        .bench: ("chest-mid", "Pectoral medio, deltoides anterior y tríceps."),
        .incline: ("chest-upper", "Pectoral superior (clavicular) y deltoides anterior."),
        .chestPress: ("chest-mid", "Pectoral medio con trayectoria guiada."),
        .pushup: ("chest-mid", "Pectoral, deltoides anterior, tríceps y core."),
        .fly: ("chest-fly", "Pectoral aislado en estiramiento."),
        .cableFly: ("chest-fly", "Pectoral aislado con tensión constante."),
        .dip: ("chest-lower", "Pectoral inferior y tríceps."),
        .ohp: ("delt-front", "Deltoides anterior, algo de lateral, y tríceps."),
        .lateralRaise: ("delt-side", "Deltoides lateral."),
        .facePull: ("delt-rear", "Deltoides posterior."),
        .uprightRow: ("delt-side", "Deltoides lateral y trapecio."),
        .shrug: ("traps", "Trapecio superior."),
        .pulldown: ("lats", "Dorsal ancho."),
        .pullup: ("lats", "Dorsal ancho y bíceps."),
        .row: ("back-mid", "Espalda media y dorsal."),
        .dbRow: ("back-mid", "Dorsal y espalda media."),
        .seatedRow: ("back-mid", "Espalda media y dorsal."),
        .pullover: ("lats-iso", "Dorsal aislado."),
        .curl: ("biceps", "Bíceps."),
        .preacherCurl: ("biceps-short", "Cabeza corta del bíceps."),
        .pushdown: ("triceps-lat", "Cabezas lateral y medial del tríceps."),
        .ohExt: ("triceps-long", "Cabeza larga del tríceps."),
        .skullCrusher: ("triceps-long", "Cabeza larga del tríceps."),
        .kickback: ("triceps-lat", "Cabezas lateral y medial del tríceps."),
        .squat: ("quads", "Cuádriceps y glúteo."),
        .frontSquat: ("quads", "Cuádriceps."),
        .legPress: ("quads", "Cuádriceps y glúteo."),
        .lunge: ("quads", "Cuádriceps y glúteo de una pierna."),
        .legExt: ("quads-iso", "Cuádriceps aislado."),
        .deadlift: ("posterior", "Cadena posterior: glúteos, isquios y espalda."),
        .rdl: ("hams-hinge", "Isquios y glúteo (bisagra de cadera)."),
        .goodMorning: ("hams-hinge", "Isquios, glúteo y lumbares."),
        .legCurl: ("hams-curl", "Isquios (flexión de rodilla)."),
        .hipThrust: ("glutes", "Glúteo mayor."),
        .gluteKickback: ("glutes", "Glúteo mayor."),
        .abduction: ("glutes-med", "Glúteo medio."),
        .hyperext: ("lower-back", "Lumbares y glúteo."),
        .calf: ("calves", "Gemelo."),
        .seatedCalf: ("soleus", "Sóleo."),
        .crunch: ("abs-upper", "Recto abdominal."),
        .legRaise: ("abs-lower", "Abdomen bajo."),
        .hangLeg: ("abs-lower", "Abdomen bajo y flexores de cadera."),
        .plank: ("core-stab", "Core en estabilidad."),
    ]

    private static let labels: [String: (String, String)] = [
        // clave: (qué es, qué añadir en su lugar)
        "chest-mid": ("el pectoral medio", "un press inclinado o unas aperturas"),
        "chest-upper": ("el pectoral superior", "un press plano o fondos"),
        "chest-lower": ("el pectoral inferior", "un press inclinado"),
        "chest-fly": ("el pectoral aislado", "un press, plano o inclinado"),
        "delt-front": ("el deltoides anterior", "elevaciones laterales o pájaros"),
        "delt-side": ("el deltoides lateral", "pájaros o face pull (deltoides posterior)"),
        "delt-rear": ("el deltoides posterior", "elevaciones laterales"),
        "traps": ("el trapecio superior", "un remo"),
        "lats": ("el dorsal (amplitud)", "un remo (grosor de espalda)"),
        "lats-iso": ("el dorsal aislado", "un remo"),
        "back-mid": ("la espalda media", "un jalón o dominadas (amplitud)"),
        "biceps": ("el bíceps", "un curl martillo (braquial) o un curl inclinado (cabeza larga)"),
        "biceps-short": ("la cabeza corta del bíceps", "un curl martillo o un curl inclinado"),
        "biceps-long": ("la cabeza larga del bíceps", "un curl predicador o un curl martillo"),
        "brachialis": ("el braquial", "un curl predicador o inclinado"),
        "triceps-lat": ("las cabezas lateral y medial del tríceps", "una extensión sobre la cabeza (cabeza larga)"),
        "triceps-long": ("la cabeza larga del tríceps", "una extensión en polea"),
        "quads": ("el cuádriceps", "un ejercicio de isquios o glúteo"),
        "quads-iso": ("el cuádriceps aislado", "una sentadilla o prensa"),
        "hams-hinge": ("los isquios en bisagra", "un curl femoral"),
        "hams-curl": ("los isquios en flexión de rodilla", "un peso muerto rumano"),
        "glutes": ("el glúteo mayor", "una abducción (glúteo medio)"),
        "calves": ("el gemelo", "una elevación de talones sentado (sóleo)"),
        "abs-upper": ("el abdomen alto", "una elevación de piernas o plancha"),
        "abs-lower": ("el abdomen bajo", "un crunch o un ejercicio de oblicuos"),
    ]

    static func focus(for exercise: Exercise) -> Focus? {
        let hit = byName[exercise.name.lowercased()]
            ?? ExerciseMatcher.catalogName(for: exercise.name).flatMap { byName[$0.lowercased()] }
            ?? byPattern[ExerciseSeed.pattern(for: exercise)]
        return hit.map { Focus(key: $0.0, text: $0.1) }
    }

    // MARK: - Descanso sugerido

    enum Kind { case heavy, compound, isolation, cardio }

    static func kind(of exercise: Exercise) -> Kind {
        if exercise.muscle == .cardio { return .cardio }
        switch ExerciseSeed.pattern(for: exercise) {
        case .squat, .frontSquat, .deadlift, .rdl, .bench, .incline, .ohp, .goodMorning:
            return exercise.equipment == .barbell ? .heavy : .compound
        case .legPress, .pullup, .dip, .hipThrust, .row, .pulldown, .seatedRow, .lunge,
             .pushup, .chestPress, .dbRow, .swing:
            return .compound
        case .run, .walk, .bike, .rowErg, .jumpingJack, .jumpRope:
            return .cardio
        default:
            return .isolation
        }
    }

    static func suggestedRest(for exercise: Exercise) -> Int {
        switch kind(of: exercise) {
        case .heavy: return 180
        case .compound: return 120
        case .isolation: return 75
        case .cardio: return 60
        }
    }

    static func restReason(for exercise: Exercise) -> String {
        switch kind(of: exercise) {
        case .heavy: return "Compuesto pesado: 2–3 min para rendir igual en cada serie."
        case .compound: return "Compuesto: unos 2 min."
        case .isolation: return "Aislado: 60–90 s bastan."
        case .cardio: return "Cardio o circuito: descanso corto."
        }
    }

    // MARK: - Ejercicios repetitivos

    /// Aviso si 3 o más ejercicios de la lista atacan exactamente lo mismo.
    static func redundancyWarning(_ exercises: [Exercise]) -> String? {
        var groups: [String: [String]] = [:]
        for e in exercises {
            guard let f = focus(for: e) else { continue }
            groups[f.key, default: []].append(e.name)
        }
        guard let (key, names) = groups.filter({ $0.value.count >= 3 }).max(by: { $0.value.count < $1.value.count }) else { return nil }
        let (what, swap) = labels[key] ?? ("lo mismo", "un ejercicio con otro ángulo")
        return "\(names.count) ejercicios se centran en \(what) (\(names.joined(separator: ", "))). Para un estímulo más completo, cambia uno por \(swap)."
    }
}

extension WorkoutSet {
    /// Marca comparable para detectar récords: 1RM estimado, repeticiones o segundos según el tipo.
    func recordScore(_ kind: ExerciseKind) -> Double {
        guard type != .warmup else { return 0 }
        switch kind {
        case .weightReps: return estimated1RM
        case .repsOnly: return Double(reps)
        case .duration: return Double(seconds)
        case .distanceTime: return 0
        }
    }
}

/// Tarjeta de aviso para rutinas y entrenamientos.
struct RedundancyNote: View {
    @EnvironmentObject var store: Store
    let exerciseIDs: [UUID]

    var body: some View {
        if let text = ExerciseFocus.redundancyWarning(exerciseIDs.compactMap { store.exercise($0) }) {
            Section {
                Label(text, systemImage: "lightbulb.fill")
                    .font(.footnote)
                    .foregroundColor(.secondary)
            }
        }
    }
}
