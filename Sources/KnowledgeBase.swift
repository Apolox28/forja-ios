import SwiftUI

// MARK: - Biblioteca científica (funciona sin internet)

enum KnowledgeCategory: String, CaseIterable, Identifiable {
    case training = "Fuerza e hipertrofia"
    case recovery = "Recuperación"
    case nutrition = "Nutrición"
    case cardio = "Cardio y salud"
    case body = "Medidas y composición"
    case safety = "Técnica y seguridad"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .training: return "flame.fill"
        case .recovery: return "bed.double.fill"
        case .nutrition: return "leaf.fill"
        case .cardio: return "heart.fill"
        case .body: return "ruler.fill"
        case .safety: return "cross.case.fill"
        }
    }

    var color: Color {
        switch self {
        case .training: return .orange
        case .recovery: return .indigo
        case .nutrition: return .green
        case .cardio: return .red
        case .body: return .teal
        case .safety: return .blue
        }
    }
}

struct KnowledgeArticle: Identifiable {
    var id: String { title }
    let title: String
    let category: KnowledgeCategory
    let keywords: [String]
    let summary: String
    let body: String
}

enum KnowledgeBase {
    static let articles: [KnowledgeArticle] = [
        // MARK: Fuerza e hipertrofia
        KnowledgeArticle(
            title: "¿Cuántas repeticiones hago?",
            category: .training,
            keywords: ["repeticiones", "reps", "rango", "hipertrofia", "fuerza", "resistencia", "cuantas"],
            summary: "El músculo crece en un rango amplio de repeticiones si llegas cerca del fallo.",
            body: """
            • **Fuerza máxima:** 1–5 repeticiones con cargas altas (80–95 % del 1RM) y descansos largos.
            • **Hipertrofia (ganar músculo):** se consigue de forma parecida entre 6 y 30 repeticiones, siempre que las series terminen cerca del fallo (0–3 repeticiones en reserva). Lo más práctico suele ser 6–15.
            • **Resistencia muscular:** 15–30+ repeticiones con poco descanso.
            • Combina rangos: pesados en ejercicios básicos (sentadilla, press, peso muerto) y moderados o altos en aislamiento (curl, elevaciones, extensiones).
            """),
        KnowledgeArticle(
            title: "Volumen semanal por músculo",
            category: .training,
            keywords: ["volumen", "series", "semana", "semanal", "cuantas series", "musculo"],
            summary: "Unas 10–20 series duras por músculo a la semana funcionan para la mayoría.",
            body: """
            • El **volumen** se mide en series efectivas (cerca del fallo) por músculo y semana.
            • **Principiantes:** 6–10 series semanales ya dan muy buen resultado.
            • **Intermedios:** 10–20 series semanales es el rango con más respaldo.
            • Más volumen ayuda hasta cierto punto; si no te recuperas (rendimiento que baja, dolor articular, sueño peor), reduce.
            • En la pestaña **Progreso** puedes ver tus series por músculo para comprobarlo.
            """),
        KnowledgeArticle(
            title: "¿Cuántas veces por semana entreno cada músculo?",
            category: .training,
            keywords: ["frecuencia", "veces", "dias", "por semana", "split", "torso", "pierna", "full body"],
            summary: "Entrenar cada músculo 2 veces por semana suele rendir mejor que 1.",
            body: """
            • Con el mismo volumen total, repartirlo en **2 sesiones por músculo** a la semana suele dar algo más de resultado que hacerlo todo en un día.
            • Opciones habituales: **cuerpo completo** 3 días, **torso/pierna** 4 días o **empuje/tirón/pierna** 3–6 días.
            • Elige la que puedas cumplir de forma constante: la constancia pesa más que la división perfecta.
            """),
        KnowledgeArticle(
            title: "RPE y repeticiones en reserva (RIR)",
            category: .training,
            keywords: ["rpe", "rir", "reserva", "esfuerzo", "intensidad", "fallo", "escala"],
            summary: "RIR = repeticiones que te quedaban antes del fallo. RPE 8 ≈ 2 en reserva.",
            body: """
            • **RIR** (repeticiones en reserva): cuántas repeticiones más podrías haber hecho con buena técnica.
            • **RPE** (esfuerzo percibido, 1–10): RPE 10 = fallo, RPE 9 = 1 en reserva, RPE 8 = 2, RPE 7 = 3.
            • Para ganar músculo y fuerza, la mayoría de series deberían quedar entre **RPE 7 y 9** (1–3 en reserva).
            • Puedes anotar el RPE de cada serie en Forja tocando el número de la serie.
            """),
        KnowledgeArticle(
            title: "Ir al fallo: ¿sí o no?",
            category: .training,
            keywords: ["fallo", "fallo muscular", "al fallo", "agotamiento"],
            summary: "Acercarse al fallo es clave; llegar siempre al fallo no hace falta.",
            body: """
            • Las series tienen que ser **exigentes**: quedarse a 0–3 repeticiones del fallo.
            • Ir al fallo absoluto en todas las series genera mucha fatiga y no da mucho más resultado.
            • Úsalo con moderación, sobre todo en la **última serie** de ejercicios de aislamiento o máquinas, donde es más seguro.
            • Evítalo en básicos pesados con barra libre (sentadilla, peso muerto) si entrenas sin ayuda.
            """),
        KnowledgeArticle(
            title: "Sobrecarga progresiva",
            category: .training,
            keywords: ["progresion", "progresar", "sobrecarga", "subir peso", "mejorar", "avanzar", "doble progresion"],
            summary: "Para seguir mejorando hay que ir pidiendo un poco más al músculo con el tiempo.",
            body: """
            • **Doble progresión** (la más sencilla): elige un rango, por ejemplo 8–12. Cuando hagas 12 en todas las series, sube el peso lo mínimo (2,5–5 %) y vuelve a empezar desde 8.
            • También se progresa con más repeticiones, más series, mejor técnica o más rango de movimiento.
            • La columna **«Anterior»** de Forja te muestra lo que hiciste la última vez para que intentes superarlo.
            """),
        KnowledgeArticle(
            title: "¿Cuánto descanso entre series?",
            category: .training,
            keywords: ["descanso", "descansar", "pausa", "entre series", "minutos", "temporizador"],
            summary: "2–3 minutos en básicos y 1–2 en aislamiento suele ser lo ideal.",
            body: """
            • **Ejercicios básicos pesados** (sentadilla, peso muerto, press): 2–5 minutos.
            • **Ejercicios accesorios o de aislamiento:** 1–2 minutos.
            • Descansar muy poco reduce las repeticiones de la siguiente serie y, con ello, el estímulo.
            • En Forja toca el tiempo junto a cada ejercicio para fijarlo; se recuerda para la próxima vez.
            """),
        KnowledgeArticle(
            title: "Rango de movimiento y tempo",
            category: .training,
            keywords: ["rango", "recorrido", "tempo", "lento", "excentrica", "estiramiento", "parciales"],
            summary: "Usa el recorrido completo y controla la bajada.",
            body: """
            • Trabajar con **recorrido completo**, sobre todo en la posición de estiramiento del músculo, suele dar mejores resultados que las repeticiones parciales.
            • **Baja controlando** (unos 2–3 segundos) y sube con intención, sin rebotes.
            • No hace falta ir exageradamente lento: el tempo muy lento reduce el peso que puedes mover.
            """),
        KnowledgeArticle(
            title: "Principiantes: cómo empezar",
            category: .training,
            keywords: ["principiante", "empezar", "comenzar", "novato", "primera vez", "iniciar"],
            summary: "3 días de cuerpo completo, técnica primero y progresión constante.",
            body: """
            • Empieza con **3 días por semana de cuerpo completo** (en Entrenar → Programas tienes uno listo).
            • 2–3 series por ejercicio, dejando 2–3 repeticiones en reserva mientras aprendes la técnica.
            • Prioriza movimientos básicos: sentadilla o prensa, bisagra de cadera, empuje horizontal y vertical, remo y jalón.
            • Las primeras semanas el progreso es rápido: aprovéchalo subiendo peso poco a poco.
            """),
        KnowledgeArticle(
            title: "Me he estancado",
            category: .training,
            keywords: ["estancado", "estancamiento", "no progreso", "no subo", "meseta", "plateau"],
            summary: "Revisa sueño, comida, volumen y variedad antes de cambiarlo todo.",
            body: """
            1. **Sueño y comida:** ¿duermes 7–9 h y comes suficiente proteína y calorías?
            2. **Fatiga acumulada:** si llevas muchas semanas apretando, haz una semana de descarga.
            3. **Volumen:** súbelo un poco si es bajo, o bájalo si no te recuperas.
            4. **Rango de repeticiones:** cambia temporalmente (por ejemplo de 5 a 8–10).
            5. **Variante del ejercicio:** cambiar de barra a mancuernas o el agarre puede desbloquear.
            """),
        KnowledgeArticle(
            title: "Entrenamiento de fuerza en mujeres",
            category: .training,
            keywords: ["mujer", "mujeres", "chica", "femenino", "voluminosa", "tonificar"],
            summary: "Los principios son los mismos; no hace falta entrenar distinto.",
            body: """
            • Las mujeres ganan fuerza y músculo con los mismos principios: volumen suficiente, esfuerzo y progresión.
            • En términos relativos, el progreso suele ser muy parecido al de los hombres.
            • «Tonificar» es, en la práctica, ganar algo de músculo y perder algo de grasa.
            • Ganar mucho volumen muscular lleva años de trabajo; no ocurre por accidente.
            """),
        KnowledgeArticle(
            title: "Fuerza a partir de los 50",
            category: .training,
            keywords: ["mayor", "edad", "50", "60", "sarcopenia", "envejecer", "abuelo"],
            summary: "Entrenar fuerza es de lo más eficaz para mantener músculo y autonomía.",
            body: """
            • A partir de los 30–40 años se pierde masa muscular poco a poco (sarcopenia); el entrenamiento de fuerza la frena y la revierte en parte.
            • También mejora la densidad ósea, el equilibrio y reduce el riesgo de caídas.
            • Empieza con cargas moderadas, controla la técnica y aumenta poco a poco. Consulta con tu médico si tienes alguna enfermedad.
            """),

        // MARK: Recuperación
        KnowledgeArticle(
            title: "El sueño",
            category: .recovery,
            keywords: ["sueño", "dormir", "descansar", "horas", "noche", "insomnio"],
            summary: "Dormir 7–9 horas mejora la recuperación, la fuerza y el control del apetito.",
            body: """
            • La mayoría de adultos necesita **7–9 horas**.
            • Dormir poco reduce el rendimiento, empeora la recuperación y aumenta el apetito.
            • Ayuda: horarios regulares, habitación oscura y fresca, evitar pantallas y cafeína por la tarde-noche.
            """),
        KnowledgeArticle(
            title: "Agujetas",
            category: .recovery,
            keywords: ["agujetas", "dolor muscular", "doms", "dolor despues", "me duele el musculo"],
            summary: "Son normales tras un estímulo nuevo y no indican que el entreno fue mejor.",
            body: """
            • Aparecen 24–72 h después de un ejercicio nuevo o más intenso, sobre todo por la fase de bajada.
            • **No son una medida de lo bien que entrenaste**: con la práctica aparecen menos aunque sigas progresando.
            • Moverse suave, dormir bien y comer adecuadamente ayuda; no hace falta nada especial.
            • Si el dolor es en una articulación, punzante o no mejora en una semana, no son agujetas: consulta.
            """),
        KnowledgeArticle(
            title: "Semana de descarga",
            category: .recovery,
            keywords: ["descarga", "deload", "fatiga", "cansado", "sobreentrenamiento", "agotado"],
            summary: "Cada 4–8 semanas, bajar el volumen a la mitad ayuda a recuperarse.",
            body: """
            • Una **descarga** consiste en entrenar 1 semana con la mitad de series (o con menos peso), manteniendo la técnica.
            • Úsala cada 4–8 semanas o cuando notes: rendimiento que baja varias sesiones, dolor articular, sueño peor o pocas ganas.
            • El «sobreentrenamiento» real es raro; lo habitual es fatiga acumulada que se va en pocos días.
            """),
        KnowledgeArticle(
            title: "Movilidad y estiramientos",
            category: .recovery,
            keywords: ["estirar", "estiramientos", "movilidad", "flexibilidad", "elasticidad"],
            summary: "Movilidad dinámica antes de entrenar; estiramientos largos después, si los necesitas.",
            body: """
            • **Antes de entrenar:** movilidad dinámica y series de aproximación. Los estiramientos estáticos largos justo antes pueden restar algo de fuerza.
            • **Para ganar flexibilidad:** estiramientos de 30–60 s, varias veces por semana.
            • Entrenar con recorrido completo ya mejora mucho la movilidad.
            """),

        // MARK: Nutrición
        KnowledgeArticle(
            title: "Proteína: ¿cuánta necesito?",
            category: .nutrition,
            keywords: ["proteina", "proteinas", "gramos", "comer", "carne", "batido", "whey"],
            summary: "1,6–2,2 g por kg de peso al día, repartida en 3–5 comidas.",
            body: """
            • Para ganar o mantener músculo: **1,6–2,2 g de proteína por kg de peso corporal al día**.
            • Repártela en 3–5 comidas de unos **0,3–0,4 g/kg** cada una.
            • Fuentes: carne, pescado, huevos, lácteos, legumbres, tofu. Los batidos son solo una forma cómoda de llegar.
            • Calcula la tuya en **Perfil → Herramientas → Calorías y macros**.
            """),
        KnowledgeArticle(
            title: "Calorías para ganar músculo o perder grasa",
            category: .nutrition,
            keywords: ["calorias", "dieta", "definir", "definicion", "volumen", "superavit", "deficit", "adelgazar", "perder grasa", "engordar"],
            summary: "Superávit pequeño para ganar músculo; déficit moderado para perder grasa.",
            body: """
            • **Ganar músculo:** come unas 200–300 kcal por encima de tu mantenimiento; busca subir un 0,25–0,5 % de tu peso al mes (más rápido si eres principiante).
            • **Perder grasa:** déficit de unas 300–500 kcal; ritmo razonable de 0,5–1 % de tu peso a la semana. Mantén la proteína alta y sigue entrenando fuerza para conservar músculo.
            • Calcula tu mantenimiento en **Perfil → Herramientas → Calorías y macros** y ajústalo según cómo evolucione tu peso en 2–3 semanas.
            """),
        KnowledgeArticle(
            title: "Carbohidratos y grasas",
            category: .nutrition,
            keywords: ["carbohidratos", "hidratos", "grasas", "macros", "arroz", "pasta"],
            summary: "Los carbohidratos dan energía para entrenar; las grasas son necesarias para la salud.",
            body: """
            • **Grasas:** al menos 0,6–1 g/kg al día (aceite de oliva, frutos secos, pescado azul, huevos).
            • **Carbohidratos:** el resto de las calorías. Ayudan a rendir en sesiones largas o intensas.
            • Comer algo con carbohidratos y proteína 1–3 h antes de entrenar suele sentar bien.
            """),
        KnowledgeArticle(
            title: "Hidratación",
            category: .nutrition,
            keywords: ["agua", "hidratacion", "beber", "sed", "litros", "deshidratacion"],
            summary: "Unos 30–35 ml por kg al día, más lo que sudes.",
            body: """
            • Referencia: **30–35 ml de agua por kg** de peso al día, más el sudor del entrenamiento.
            • Una orina de color amarillo claro indica buena hidratación.
            • Perder más de un 2 % del peso en sudor puede bajar el rendimiento: bebe durante sesiones largas o con calor.
            • Calcúlalo en **Herramientas → Hidratación**.
            """),
        KnowledgeArticle(
            title: "Suplementos con respaldo",
            category: .nutrition,
            keywords: ["suplementos", "creatina", "cafeina", "pre entreno", "preentreno", "proteina en polvo"],
            summary: "Creatina y cafeína son los que más evidencia tienen; el resto, poco.",
            body: """
            • **Creatina monohidrato:** 3–5 g al día, a cualquier hora y sin necesidad de fase de carga. Mejora fuerza y rendimiento; es de los suplementos más estudiados y seguros en personas sanas.
            • **Cafeína:** 3–6 mg/kg unos 30–60 min antes mejora el rendimiento. Evítala por la tarde si afecta a tu sueño.
            • **Proteína en polvo:** solo es comida práctica.
            • Consulta con tu médico si tienes alguna enfermedad (por ejemplo renal) o tomas medicación.
            """),

        // MARK: Cardio y salud
        KnowledgeArticle(
            title: "Cardio y fuerza a la vez",
            category: .cardio,
            keywords: ["cardio", "correr", "aerobico", "interferencia", "bici", "combinar"],
            summary: "El cardio moderado no te quita músculo; separa las sesiones si puedes.",
            body: """
            • El llamado «efecto interferencia» es pequeño con cantidades moderadas de cardio.
            • Si los haces el mismo día, mejor fuerza primero o sepáralos unas horas.
            • Recomendación general de salud para adultos: **150–300 min semanales de actividad moderada** o 75–150 de intensa, más 2 días de fuerza.
            """),
        KnowledgeArticle(
            title: "Zonas de frecuencia cardiaca",
            category: .cardio,
            keywords: ["pulsaciones", "frecuencia cardiaca", "zona 2", "zonas", "pulso", "fc maxima"],
            summary: "FC máxima estimada ≈ 208 − 0,7 × edad. La zona 2 está en torno al 60–70 %.",
            body: """
            • **FC máxima estimada:** 208 − 0,7 × edad (es solo una aproximación).
            • **Zona 1 (50–60 %):** muy suave, recuperación.
            • **Zona 2 (60–70 %):** puedes hablar con frases completas; base aeróbica.
            • **Zona 3 (70–80 %):** ritmo exigente pero sostenible.
            • **Zona 4–5 (80–100 %):** intervalos y esfuerzos cortos.
            • Calcula tus zonas en **Herramientas → Zonas de pulso**.
            """),
        KnowledgeArticle(
            title: "HIIT o cardio continuo",
            category: .cardio,
            keywords: ["hiit", "intervalos", "tabata", "liss", "quemar grasa", "continuo"],
            summary: "Ambos funcionan; el HIIT ahorra tiempo pero cansa más.",
            body: """
            • **HIIT:** intervalos intensos con pausas. Ahorra tiempo y mejora mucho la capacidad aeróbica, pero genera más fatiga: 1–2 sesiones por semana suelen bastar.
            • **Cardio continuo suave (zona 2):** más fácil de recuperar y de hacer con frecuencia.
            • Para perder grasa, lo que más cuenta es el balance calórico total.
            • Tienes un temporizador de intervalos en **Herramientas**.
            """),

        // MARK: Medidas y composición
        KnowledgeArticle(
            title: "IMC: para qué sirve y sus límites",
            category: .body,
            keywords: ["imc", "indice de masa corporal", "obesidad", "sobrepeso", "peso ideal"],
            summary: "Útil a nivel de población, pero no distingue músculo de grasa.",
            body: """
            • **IMC = peso (kg) ÷ altura (m)².** Referencias: <18,5 bajo peso; 18,5–24,9 normal; 25–29,9 sobrepeso; ≥30 obesidad.
            • Una persona musculada puede salir con «sobrepeso» sin tener exceso de grasa.
            • Complétalo con el perímetro de cintura y el % de grasa.
            """),
        KnowledgeArticle(
            title: "Porcentaje de grasa y cintura",
            category: .body,
            keywords: ["grasa corporal", "porcentaje de grasa", "cintura", "barriga", "abdomen", "medidas"],
            summary: "La cintura es un indicador sencillo del riesgo para la salud.",
            body: """
            • Rangos orientativos de % de grasa saludables: hombres ~10–20 %, mujeres ~18–30 %.
            • **Perímetro de cintura:** a partir de unos 94 cm en hombres y 80 cm en mujeres aumenta el riesgo cardiometabólico (más aún por encima de 102 y 88 cm).
            • Mide siempre en las mismas condiciones (en ayunas, por la mañana) y fíjate en la tendencia.
            • Puedes estimar tu % de grasa en **Herramientas → IMC y grasa corporal**.
            """),
        KnowledgeArticle(
            title: "El 1RM y cómo estimarlo",
            category: .body,
            keywords: ["1rm", "maximo", "repeticion maxima", "epley", "brzycki", "porcentaje"],
            summary: "No hace falta probar tu máximo: se puede estimar con una serie de 3–10 repeticiones.",
            body: """
            • **1RM** es el peso máximo que puedes levantar una vez con buena técnica.
            • **Fórmula de Epley:** 1RM ≈ peso × (1 + repeticiones ÷ 30). Es la que usa Forja.
            • La estimación es más fiable con series de 3–10 repeticiones.
            • Relación aproximada: 90 % ≈ 3–4 reps, 85 % ≈ 5–6, 80 % ≈ 7–8, 75 % ≈ 9–10, 70 % ≈ 11–12.
            """),

        // MARK: Técnica y seguridad
        KnowledgeArticle(
            title: "Calentamiento",
            category: .safety,
            keywords: ["calentar", "calentamiento", "antes de entrenar", "activacion", "aproximacion"],
            summary: "5 minutos suaves y series de aproximación del primer ejercicio.",
            body: """
            1. 5 minutos de cardio suave para subir la temperatura.
            2. Movilidad dinámica de las articulaciones que vas a usar.
            3. **Series de aproximación:** por ejemplo barra sola × 10, 40 % × 5, 60 % × 3, 80 % × 1–2, y empieza tus series efectivas.
            • Usa **Herramientas → Series de calentamiento** para calcularlas.
            """),
        KnowledgeArticle(
            title: "Respiración y abdomen firme",
            category: .safety,
            keywords: ["respirar", "respiracion", "bracing", "valsalva", "cinturon", "faja", "abdomen firme"],
            summary: "Toma aire, aprieta el abdomen y mantén la tensión en las repeticiones pesadas.",
            body: """
            • Antes de cada repetición pesada: toma aire, aprieta el abdomen como si fueran a darte un golpe y mantén la tensión durante la parte difícil.
            • El **cinturón** ayuda a crear esa presión en series muy pesadas; no es necesario en el resto.
            • Si tienes hipertensión o problemas cardiovasculares, evita aguantar la respiración mucho tiempo y consulta con tu médico.
            """),
        KnowledgeArticle(
            title: "Dolor: cuándo parar",
            category: .safety,
            keywords: ["dolor", "lesion", "me duele", "molestia", "pinchazo", "hombro", "rodilla", "lumbar", "espalda baja"],
            summary: "Molestia leve que no empeora suele ser tolerable; dolor punzante o que va a más, no.",
            body: """
            • **Puedes seguir con cuidado** si la molestia es leve (≤3 de 10), no empeora durante la sesión y se ha calmado al día siguiente.
            • **Para y consulta** si el dolor es punzante, en una articulación, aparece de golpe, va acompañado de hinchazón, hormigueo o pérdida de fuerza, o empeora día tras día.
            • Muchas molestias mejoran ajustando: menos peso, otra variante del ejercicio o menos recorrido temporalmente.
            • Esta información no sustituye una valoración médica o de fisioterapia.
            """),
        KnowledgeArticle(
            title: "Cuidar la espalda baja",
            category: .safety,
            keywords: ["lumbar", "espalda baja", "zona lumbar", "hernia", "peso muerto espalda"],
            summary: "Columna neutra, cadera atrás y carga progresiva.",
            body: """
            • En peso muerto, sentadilla y remo, mantén la **columna neutra**: ni redondeada ni excesivamente arqueada.
            • Inicia los movimientos de bisagra llevando la **cadera atrás** y con la barra pegada al cuerpo.
            • La espalda se adapta a la carga: progresa poco a poco en lugar de evitar todo esfuerzo.
            • Si notas dolor que baja por la pierna u hormigueo, consulta a un profesional.
            """),
        KnowledgeArticle(
            title: "Grabarse para revisar la técnica",
            category: .safety,
            keywords: ["grabar", "video", "camara", "tecnica", "revisar", "filmar"],
            summary: "Grábate de lado, con el cuerpo entero en el encuadre.",
            body: """
            • Coloca el móvil **de lado** (perfil) y a la altura de la cadera, con el cuerpo entero y la barra visibles.
            • Para sentadilla y peso muerto, el perfil es lo más útil; para ver rodillas o simetría, grábate también de frente.
            • En el **Coach**, toca la cámara para grabar o elegir un vídeo y pregúntale si la técnica está bien (necesita internet).
            """),
    ]

    static func normalize(_ s: String) -> String {
        s.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: Locale(identifier: "es_ES")).lowercased()
    }

    /// Artículo que mejor responde a una pregunta (o nil).
    static func bestMatch(for question: String) -> (KnowledgeArticle, Int)? {
        let q = normalize(question)
        var best: (KnowledgeArticle, Int)? = nil
        for a in articles {
            var score = 0
            for k in a.keywords where q.contains(normalize(k)) {
                score += k.contains(" ") ? 3 : 2
            }
            if q.contains(normalize(a.title)) { score += 4 }
            if score > (best?.1 ?? 0) { best = (a, score) }
        }
        return best
    }
}

// MARK: - Pantallas

struct KnowledgeLibraryView: View {
    @State var search = ""

    func items(_ c: KnowledgeCategory) -> [KnowledgeArticle] {
        KnowledgeBase.articles.filter { a in
            a.category == c && (search.isEmpty
                || KnowledgeBase.normalize(a.title + " " + a.summary + " " + a.keywords.joined(separator: " "))
                    .contains(KnowledgeBase.normalize(search)))
        }
    }

    var body: some View {
        List {
            Section(footer: Text("Información general basada en la evidencia actual. No sustituye el consejo de un profesional sanitario.")) {
                EmptyView()
            }
            ForEach(KnowledgeCategory.allCases) { c in
                if !items(c).isEmpty {
                    Section(header: Label(c.rawValue, systemImage: c.icon)) {
                        ForEach(items(c)) { a in
                            NavigationLink(destination: KnowledgeArticleView(article: a)) {
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(a.title).font(.subheadline.weight(.semibold))
                                    Text(a.summary).font(.caption).foregroundColor(.secondary).lineLimit(2)
                                }
                                .padding(.vertical, 2)
                            }
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .searchable(text: $search, prompt: "Buscar tema")
        .navigationTitle("Ciencia del entrenamiento")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct KnowledgeArticleView: View {
    let article: KnowledgeArticle

    var attributed: AttributedString {
        let options = AttributedString.MarkdownParsingOptions(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        return (try? AttributedString(markdown: article.body, options: options)) ?? AttributedString(article.body)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Label(article.category.rawValue, systemImage: article.category.icon)
                    .font(.caption.weight(.semibold))
                    .foregroundColor(article.category.color)
                Text(article.title).font(.title2.bold())
                Text(article.summary)
                    .font(.headline)
                    .foregroundColor(.secondary)
                Divider()
                Text(attributed)
                    .font(.body)
                    .lineSpacing(4)
                    .textSelection(.enabled)
                Text("Información general. No sustituye el consejo de un profesional sanitario.")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 8)
            }
            .padding()
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}
