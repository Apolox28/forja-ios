import Foundation

/// Importa el CSV que genera Hevy (Ajustes → Exportar e importar datos → Exportar entrenamientos).
/// También sirve para el CSV que exporta Forja, porque usa las mismas columnas.
struct CSVImportResult {
    var workouts = 0
    var sets = 0
    var newExercises = 0
    var skippedDuplicates = 0
    var error: String? = nil
}

enum CSV {
    /// Detecta el separador (coma, punto y coma o tabulador) mirando la primera línea.
    static func detectDelimiter(_ text: String) -> Character {
        let firstLine = text.split(separator: "\n", maxSplits: 1, omittingEmptySubsequences: true).first.map(String.init) ?? text
        let counts: [(Character, Int)] = [(",", firstLine.filter { $0 == "," }.count),
                                          (";", firstLine.filter { $0 == ";" }.count),
                                          ("\t", firstLine.filter { $0 == "\t" }.count)]
        return counts.max(by: { $0.1 < $1.1 })?.0 ?? ","
    }

    static func parse(_ text: String) -> [[String]] {
        let delimiter = detectDelimiter(text)
        var rows: [[String]] = []
        var row: [String] = []
        var field = ""
        var inQuotes = false
        var chars = Array(text)
        if chars.first == "\u{FEFF}" { chars.removeFirst() }
        var i = 0
        while i < chars.count {
            let c = chars[i]
            if inQuotes {
                if c == "\"" {
                    if i + 1 < chars.count && chars[i + 1] == "\"" {
                        field.append("\"")
                        i += 1
                    } else {
                        inQuotes = false
                    }
                } else {
                    field.append(c)
                }
            } else {
                switch c {
                case "\"":
                    inQuotes = true
                case delimiter:
                    row.append(field)
                    field = ""
                case "\n", "\r\n":
                    row.append(field)
                    rows.append(row)
                    row = []
                    field = ""
                case "\r":
                    break
                default:
                    field.append(c)
                }
            }
            i += 1
        }
        if !field.isEmpty || !row.isEmpty {
            row.append(field)
            rows.append(row)
        }
        return rows.filter { !($0.count == 1 && $0[0].isEmpty) }
    }

    static func escape(_ s: String) -> String {
        if s.contains(",") || s.contains("\"") || s.contains("\n") {
            return "\"" + s.replacingOccurrences(of: "\"", with: "\"\"") + "\""
        }
        return s
    }
}

enum HevyImporter {
    /// Nombres habituales del CSV (en inglés) → ejercicios incluidos en Forja.
    static let nameMap: [String: String] = baseNameMap.merging(
        ExerciseSeed.extras.flatMap { x in x.hevy.map { ($0.lowercased(), x.name) } },
        uniquingKeysWith: { a, _ in a })

    /// Todos los nombres de Hevy en inglés y en español (Resources/hevy_names.json, generado con tools/hevy_names/build.js).
    static let hevyNames: [String: String] = {
        guard let url = Bundle.main.url(forResource: "hevy_names", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let map = try? JSONDecoder().decode([String: String].self, from: data) else { return [:] }
        return map
    }()

    /// Coincidencia exacta (sin tildes ni mayúsculas); si el equipo entre paréntesis no está en la tabla, prueba sin él.
    static func hevyName(_ title: String) -> String? {
        hevyNames[ExerciseMatcher.normalize(title)]
            ?? title.firstIndex(of: "(").flatMap { hevyNames[ExerciseMatcher.normalize(String(title[..<$0]))] }
    }

    private static let baseNameMap: [String: String] = [
        "21s bicep curl": "Curl 21",
        "ab wheel": "Rueda abdominal",
        "air bike": "Bicicleta de aire",
        "arnold press (dumbbell)": "Press Arnold",
        "back extension (hyperextension)": "Hiperextensiones",
        "back extension (weighted hyperextension)": "Hiperextensiones lastradas",
        "battle ropes": "Cuerdas de batalla",
        "behind the back curl (cable)": "Curl bayesiano en polea",
        "bench dip": "Fondos en banco",
        "bench press (barbell)": "Press de banca",
        "bench press (cable)": "Press de pecho en polea",
        "bench press (dumbbell)": "Press de banca con mancuernas",
        "bench press (smith machine)": "Press de banca en máquina Smith",
        "bench press - close grip (barbell)": "Press de banca agarre cerrado",
        "bent over row (barbell)": "Remo con barra",
        "bicep curl (barbell)": "Curl con barra",
        "bicep curl (cable)": "Curl en polea",
        "bicep curl (dumbbell)": "Curl con mancuernas",
        "bicep curl (machine)": "Curl en máquina",
        "bicycle crunch": "Crunch bicicleta",
        "box jump": "Salto al cajón",
        "box squat (barbell)": "Sentadilla en caja",
        "bulgarian split squat": "Sentadilla búlgara",
        "burpee": "Burpees",
        "butterfly (pec deck)": "Aperturas en máquina",
        "cable core pallof press": "Pallof press",
        "cable crunch": "Crunch en polea",
        "cable fly crossovers": "Cruce de poleas",
        "cable pull through": "Pull-through en polea",
        "cable twist (up to down)": "Leñador en polea",
        "chest dip": "Fondos en paralelas",
        "chest dip (weighted)": "Fondos lastrados",
        "chest fly (dumbbell)": "Aperturas con mancuernas",
        "chest fly (machine)": "Aperturas en máquina",
        "chest press (machine)": "Press de pecho en máquina",
        "chest supported incline row (dumbbell)": "Remo con mancuernas con pecho apoyado",
        "chest supported y raise (dumbbell)": "Elevaciones en Y",
        "chin up": "Dominadas supinas",
        "clap push ups": "Flexiones con palmada",
        "clean and jerk": "Envión",
        "clean and press": "Cargada y press",
        "concentration curl": "Curl concentrado",
        "crunch": "Crunch abdominal",
        "crunch (machine)": "Crunch en máquina",
        "cycling": "Ciclismo",
        "dead bug": "Dead bug",
        "dead hang": "Colgarse de la barra",
        "deadlift (barbell)": "Peso muerto",
        "deadlift (dumbbell)": "Peso muerto con mancuernas",
        "deadlift (trap bar)": "Peso muerto con barra hexagonal",
        "decline bench press (barbell)": "Press declinado con barra",
        "decline bench press (dumbbell)": "Press declinado con mancuernas",
        "decline push up": "Flexiones declinadas",
        "diamond push up": "Flexiones diamante",
        "dumbbell row": "Remo con mancuerna",
        "dumbbell step up": "Step-up con mancuernas",
        "elliptical trainer": "Elíptica",
        "ez bar biceps curl": "Curl con barra Z",
        "face pull": "Face pull",
        "farmers walk": "Paseo del granjero",
        "floor press (barbell)": "Press de suelo con barra",
        "frog pumps (dumbbell)": "Frog pump",
        "front raise (barbell)": "Elevaciones frontales con barra",
        "front raise (cable)": "Elevaciones frontales en polea",
        "front raise (dumbbell)": "Elevaciones frontales",
        "front squat": "Sentadilla frontal",
        "full squat": "Sentadilla con barra",
        "glute bridge": "Puente de glúteos",
        "glute kickback (machine)": "Patada de glúteo en máquina",
        "goblet squat": "Sentadilla goblet",
        "good morning (barbell)": "Buenos días",
        "hack squat (machine)": "Sentadilla hack",
        "hammer curl (cable)": "Curl martillo en polea",
        "hammer curl (dumbbell)": "Curl martillo",
        "hanging knee raise": "Elevación de rodillas colgado",
        "hanging leg raise": "Elevación de piernas colgado",
        "hiking": "Senderismo",
        "hip abduction (machine)": "Abducción en máquina",
        "hip adduction (machine)": "Aducción en máquina",
        "hip thrust (barbell)": "Hip thrust con barra",
        "hip thrust (machine)": "Hip thrust en máquina",
        "incline bench press (barbell)": "Press inclinado con barra",
        "incline bench press (dumbbell)": "Press inclinado con mancuernas",
        "incline bench press (smith machine)": "Press inclinado en máquina Smith",
        "incline chest fly (dumbbell)": "Aperturas inclinadas con mancuernas",
        "incline chest press (machine)": "Press inclinado en máquina",
        "incline dumbbell y-raise": "Elevaciones en Y",
        "incline push ups": "Flexiones inclinadas",
        "inverted row": "Remo invertido",
        "jm press (barbell)": "Press JM",
        "jump rope": "Saltar la cuerda",
        "jump squat": "Sentadilla con salto",
        "jumping jack": "Jumping jacks",
        "kettlebell clean": "Cargada con kettlebell",
        "kettlebell goblet squat": "Sentadilla goblet con kettlebell",
        "kettlebell snatch": "Arrancada con kettlebell",
        "kettlebell swing": "Swing con kettlebell",
        "kettlebell turkish get up": "Levantamiento turco",
        "lat pulldown (cable)": "Jalón al pecho",
        "lat pulldown (machine)": "Jalón en máquina",
        "lat pulldown - close grip (cable)": "Jalón agarre estrecho",
        "lateral lunge": "Zancadas laterales",
        "lateral raise (cable)": "Elevaciones laterales en polea",
        "lateral raise (dumbbell)": "Elevaciones laterales",
        "lateral raise (machine)": "Elevaciones laterales en máquina",
        "leg extension (machine)": "Extensión de cuádriceps",
        "leg press (machine)": "Prensa de piernas",
        "leg press horizontal (machine)": "Prensa de piernas horizontal",
        "leg press toe press": "Elevación de talones en prensa",
        "low cable fly crossovers": "Cruce de poleas de abajo arriba",
        "lunge (barbell)": "Zancadas con barra",
        "lunge (dumbbell)": "Zancadas con mancuernas",
        "lying leg curl (machine)": "Curl femoral tumbado",
        "lying leg raise": "Elevación de piernas tumbado",
        "meadows rows (barbell)": "Remo Meadows",
        "mountain climber": "Escaladores",
        "nordic hamstrings curls": "Curl nórdico",
        "overhead press (barbell)": "Press militar con barra",
        "overhead press (dumbbell)": "Press de hombro con mancuernas",
        "overhead press (smith machine)": "Press de hombro en máquina Smith",
        "overhead triceps extension (cable)": "Extensión sobre la cabeza en polea",
        "overhead triceps extension (dumbbell)": "Extensión sobre la cabeza con mancuerna",
        "pendlay row (barbell)": "Remo Pendlay",
        "pendulum squat (machine)": "Sentadilla péndulo",
        "pistol squat": "Sentadilla pistol",
        "plank": "Plancha",
        "power clean": "Cargada de potencia",
        "preacher curl (barbell)": "Curl predicador",
        "preacher curl (dumbbell)": "Curl predicador con mancuerna",
        "preacher curl (machine)": "Curl predicador en máquina",
        "pull up": "Dominadas",
        "pull up (assisted)": "Dominadas asistidas",
        "pull up (weighted)": "Dominadas lastradas",
        "pullover (dumbbell)": "Pullover con mancuerna",
        "push press": "Push press",
        "push up": "Flexiones",
        "push up (weighted)": "Flexiones lastradas",
        "rack pull": "Rack pull",
        "rear delt reverse fly (cable)": "Pájaros en polea",
        "rear delt reverse fly (dumbbell)": "Pájaros con mancuernas",
        "rear delt reverse fly (machine)": "Pájaros en máquina",
        "rear kick (machine)": "Patada de glúteo en máquina",
        "reverse crunch": "Crunch inverso",
        "reverse curl (barbell)": "Curl inverso con barra",
        "reverse grip lat pulldown (cable)": "Jalón agarre supino",
        "reverse lunge (dumbbell)": "Zancadas hacia atrás",
        "romanian deadlift (barbell)": "Peso muerto rumano",
        "romanian deadlift (dumbbell)": "Peso muerto rumano con mancuernas",
        "rope cable curl": "Curl con cuerda en polea",
        "rowing machine": "Remo ergómetro",
        "running": "Correr",
        "russian twist (weighted)": "Giros rusos",
        "seated cable row - v grip (cable)": "Remo sentado en polea",
        "seated calf raise": "Elevación de talones sentado",
        "seated dip machine": "Fondos en máquina",
        "seated incline curl (dumbbell)": "Curl inclinado con mancuernas",
        "seated leg curl (machine)": "Curl femoral sentado",
        "seated overhead press (barbell)": "Press militar sentado",
        "seated overhead press (dumbbell)": "Press de hombro sentado con mancuernas",
        "seated palms up wrist curl": "Curl de muñeca",
        "seated row (machine)": "Remo en máquina",
        "seated shoulder press (machine)": "Press de hombro en máquina",
        "seated wrist extension (barbell)": "Curl de muñeca inverso",
        "shoulder press (dumbbell)": "Press de hombro con mancuernas",
        "shrug (barbell)": "Encogimientos con barra",
        "shrug (dumbbell)": "Encogimientos con mancuernas",
        "shrug (machine)": "Encogimientos en máquina",
        "side plank": "Plancha lateral",
        "single arm cable row": "Remo en polea a una mano",
        "single arm landmine press (barbell)": "Press landmine",
        "single arm lat pulldown": "Jalón a una mano",
        "single arm tricep extension (dumbbell)": "Extensión sobre la cabeza con mancuerna",
        "single arm triceps pushdown (cable)": "Extensión de tríceps a una mano en polea",
        "single leg extensions": "Extensión de cuádriceps a una pierna",
        "single leg hip thrust": "Hip thrust a una pierna",
        "single leg press (machine)": "Prensa a una pierna",
        "single leg romanian deadlift (dumbbell)": "Peso muerto a una pierna",
        "single leg standing calf raise (dumbbell)": "Elevación de talones con mancuerna",
        "sit up": "Abdominales completos",
        "ski erg": "Ski ergómetro",
        "skullcrusher (barbell)": "Press francés",
        "skullcrusher (dumbbell)": "Press francés con mancuernas",
        "sled push": "Empuje de trineo",
        "smith machine lunge": "Zancadas en máquina Smith",
        "snatch": "Arrancada",
        "spider curl (dumbbell)": "Curl araña",
        "spinning": "Bicicleta estática",
        "squat (barbell)": "Sentadilla con barra",
        "squat (bodyweight)": "Sentadilla con peso corporal",
        "squat (dumbbell)": "Sentadilla con mancuernas",
        "squat (smith machine)": "Sentadilla en máquina Smith",
        "stair machine (floors)": "Escaladora",
        "stair machine (steps)": "Escaladora",
        "standing cable glute kickbacks": "Patada de glúteo en polea",
        "standing calf raise": "Elevación de talones con peso corporal",
        "standing calf raise (dumbbell)": "Elevación de talones con mancuerna",
        "standing calf raise (machine)": "Elevación de talones de pie",
        "standing calf raise (smith)": "Elevación de talones en máquina Smith",
        "standing leg curls": "Curl femoral de pie",
        "standing military press (barbell)": "Press militar con barra",
        "straight arm lat pulldown (cable)": "Jalón con brazos rectos",
        "straight leg deadlift": "Peso muerto piernas rígidas",
        "sumo deadlift": "Peso muerto sumo",
        "superman": "Superman",
        "swimming": "Natación",
        "t bar row": "Remo en T",
        "thruster (barbell)": "Thruster",
        "toes to bar": "Toes to bar",
        "treadmill": "Correr en cinta",
        "triceps extension (barbell)": "Extensión sobre la cabeza con barra Z",
        "triceps extension (cable)": "Extensión de tríceps en polea",
        "triceps extension (dumbbell)": "Extensión sobre la cabeza con mancuerna",
        "triceps extension (machine)": "Extensión de tríceps en máquina",
        "triceps kickback (cable)": "Patada de tríceps en polea",
        "triceps kickback (dumbbell)": "Patada de tríceps",
        "triceps pressdown": "Extensión de tríceps en polea",
        "triceps pushdown": "Extensión de tríceps en polea",
        "triceps rope pushdown": "Extensión de tríceps con cuerda",
        "upright row (barbell)": "Remo al mentón con barra",
        "upright row (cable)": "Remo al mentón en polea",
        "v up": "Abdominales en V",
        "vertical traction (machine)": "Jalón en máquina",
        "walking": "Caminar",
        "walking lunge (dumbbell)": "Zancadas caminando",
        "wall ball": "Wall ball",
        "wall sit": "Sentadilla en pared",
        "zercher squat": "Sentadilla Zercher",
    ]

    static let dateFormats = [
        "d MMM yyyy, HH:mm", "dd MMM yyyy, HH:mm", "d MMM yyyy, H:mm",
        "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm", "yyyy-MM-dd'T'HH:mm:ssZ",
        "yyyy-MM-dd'T'HH:mm:ss.SSSZ", "MMM d, yyyy, h:mm a", "d MMM yyyy HH:mm",
    ]

    static let monthNames: [String: Int] = [
        "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6, "jul": 7, "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12,
        "ene": 1, "abr": 4, "ago": 8, "dic": 12, "set": 9,
    ]

    /// Lector manual de fechas: «8 Nov 2026, 18:30», «08 nov. 2026 6:30 PM», «2026-11-08 18:30:00», «08/11/2026 18:30»…
    static func looseDate(_ s: String) -> Date? {
        let lower = s.lowercased()
        var numbers: [Int] = []
        var words: [String] = []
        var current = ""
        var isNumber = false
        for ch in lower {
            if ch.isNumber {
                if !isNumber && !current.isEmpty { words.append(current); current = "" }
                isNumber = true
                current.append(ch)
            } else if ch.isLetter {
                if isNumber && !current.isEmpty { numbers.append(Int(current) ?? 0); current = "" }
                isNumber = false
                current.append(ch)
            } else if !current.isEmpty {
                if isNumber { numbers.append(Int(current) ?? 0) } else { words.append(current) }
                current = ""
            }
        }
        if !current.isEmpty {
            if isNumber { numbers.append(Int(current) ?? 0) } else { words.append(current) }
        }
        let pm = words.contains("pm") || words.contains("p")
        let am = words.contains("am") || words.contains("a")
        var month: Int? = nil
        for w in words {
            if let m = monthNames[String(w.prefix(4))] ?? monthNames[String(w.prefix(3))] { month = m; break }
        }
        var day = 0, mon = 0, year = 0, hour = 0, minute = 0, second = 0
        if let m = month {
            guard numbers.count >= 2 else { return nil }
            mon = m
            if numbers[0] > 31 { year = numbers[0]; day = numbers[1] } else { day = numbers[0]; year = numbers[1] }
            if numbers.count > 2 { hour = numbers[2] }
            if numbers.count > 3 { minute = numbers[3] }
            if numbers.count > 4 { second = numbers[4] }
        } else {
            guard numbers.count >= 3 else { return nil }
            if numbers[0] > 31 {
                year = numbers[0]; mon = numbers[1]; day = numbers[2]
            } else {
                day = numbers[0]; mon = numbers[1]; year = numbers[2]
                if mon > 12 { let t = day; day = mon; mon = t }
            }
            if numbers.count > 3 { hour = numbers[3] }
            if numbers.count > 4 { minute = numbers[4] }
            if numbers.count > 5 { second = numbers[5] }
        }
        if year < 100 { year += 2000 }
        if pm && hour < 12 { hour += 12 }
        if am && hour == 12 { hour = 0 }
        guard (1...12).contains(mon), (1...31).contains(day), year > 1990 else { return nil }
        var comps = DateComponents()
        comps.year = year; comps.month = mon; comps.day = day
        comps.hour = hour; comps.minute = minute; comps.second = second
        return Calendar(identifier: .gregorian).date(from: comps)
    }

    static func parseDate(_ s: String) -> Date? {
        let trimmed = s.trimmingCharacters(in: .whitespaces)
        if trimmed.isEmpty { return nil }
        if let unix = Double(trimmed), unix > 1_000_000_000 {
            return Date(timeIntervalSince1970: unix > 10_000_000_000 ? unix / 1000 : unix)
        }
        let iso = ISO8601DateFormatter()
        if let d = iso.date(from: trimmed) { return d }
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        for format in dateFormats {
            f.dateFormat = format
            if let d = f.date(from: trimmed) { return d }
        }
        // Algunos exportes vienen con meses en español.
        f.locale = Locale(identifier: "es_ES")
        for format in dateFormats {
            f.dateFormat = format
            if let d = f.date(from: trimmed) { return d }
        }
        return looseDate(trimmed)
    }

    static func guessEquipment(_ title: String) -> Equipment {
        let t = title.lowercased()
        if t.contains("barbell") || t.contains("barra") { return .barbell }
        if t.contains("dumbbell") || t.contains("mancuerna") { return .dumbbell }
        if t.contains("machine") || t.contains("máquina") || t.contains("smith") { return .machine }
        if t.contains("cable") || t.contains("polea") { return .cable }
        if t.contains("kettlebell") { return .kettlebell }
        if t.contains("band") || t.contains("banda") { return .band }
        if t.contains("bodyweight") { return .bodyweight }
        return .other
    }

    static func guessMuscle(_ title: String) -> MuscleGroup {
        let t = title.lowercased()
        let rules: [(String, MuscleGroup)] = [
            ("bench", .chest), ("chest", .chest), ("fly", .chest), ("push up", .chest), ("dip", .chest),
            ("row", .back), ("pull", .back), ("lat", .back), ("deadlift", .back), ("shrug", .back),
            ("shoulder", .shoulders), ("overhead press", .shoulders), ("lateral", .shoulders), ("raise", .shoulders), ("delt", .shoulders),
            ("curl", .biceps), ("tricep", .triceps), ("skull", .triceps), ("extension", .quads),
            ("squat", .quads), ("lunge", .quads), ("leg press", .quads),
            ("leg curl", .hamstrings), ("romanian", .hamstrings),
            ("hip", .glutes), ("glute", .glutes), ("calf", .calves),
            ("crunch", .core), ("plank", .core), ("ab ", .core), ("sit up", .core),
            ("run", .cardio), ("cycl", .cardio), ("bike", .cardio), ("rowing", .cardio), ("walk", .cardio),
        ]
        // "leg curl" debe ganar a "curl"
        if t.contains("leg curl") { return .hamstrings }
        for (key, muscle) in rules where t.contains(key) { return muscle }
        return .fullBody
    }

    static func importCSV(_ text: String, into store: Store) -> CSVImportResult {
        var result = CSVImportResult()
        let rows = CSV.parse(text)
        guard let header = rows.first?.map({ h -> String in
            h.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines.union(CharacterSet(charactersIn: "\"\u{FEFF}")))
                .lowercased()
                .replacingOccurrences(of: " ", with: "_")
        }) else {
            result.error = "El archivo está vacío."
            return result
        }
        func col(_ names: String...) -> Int? {
            for n in names { if let i = header.firstIndex(of: n) { return i } }
            return nil
        }
        guard let cTitle = col("title", "workout_name", "name"), let cStart = col("start_time", "date", "start"), let cExercise = col("exercise_title", "exercise_name", "exercise") else {
            result.error = "No parece un CSV de Hevy. Columnas encontradas: " + header.prefix(8).joined(separator: ", ")
            return result
        }
        let cEnd = col("end_time")
        let cDesc = col("description")
        let cSuperset = col("superset_id")
        let cExNotes = col("exercise_notes")
        let cType = col("set_type")
        let cKg = col("weight_kg")
        let cLbs = col("weight_lbs")
        let cReps = col("reps")
        let cKm = col("distance_km")
        let cMiles = col("distance_miles")
        let cSecs = col("duration_seconds")
        let cRpe = col("rpe")

        let userUnit = store.data.settings.unit
        var data = store.data
        var exerciseByName: [String: UUID] = [:]
        for ex in data.exercises { exerciseByName[ex.name.lowercased()] = ex.id }

        func value(_ row: [String], _ idx: Int?) -> String {
            guard let i = idx, i < row.count else { return "" }
            return row[i].trimmingCharacters(in: .whitespaces)
        }
        func number(_ row: [String], _ idx: Int?) -> Double {
            let v = Double(value(row, idx).replacingOccurrences(of: ",", with: ".")) ?? 0
            return v.isFinite ? v : 0
        }

        var workouts: [Workout] = []
        var currentKey = ""
        var current: Workout? = nil
        var lastExerciseTitle = ""
        var supersetMap: [String: Int] = [:]

        for row in rows.dropFirst() {
            guard row.count > 2 else { continue }
            let title = value(row, cTitle)
            let startRaw = value(row, cStart)
            guard let start = parseDate(startRaw) else { continue }
            let key = title + "|" + startRaw
            if key != currentKey {
                if let w = current { workouts.append(w) }
                var w = Workout(name: title.isEmpty ? "Entrenamiento" : title, start: start)
                w.end = parseDate(value(row, cEnd))
                w.notes = value(row, cDesc)
                current = w
                currentKey = key
                lastExerciseTitle = ""
                supersetMap = [:]
            }

            // Ejercicio
            let exTitle = value(row, cExercise)
            guard !exTitle.isEmpty else { continue }
            let mapped = nameMap[exTitle.lowercased()] ?? hevyName(exTitle) ?? ExerciseMatcher.catalogName(for: exTitle) ?? exTitle
            var exID = exerciseByName[mapped.lowercased()]
            if exID == nil {
                let kind: ExerciseKind
                if number(row, cKm) > 0 || number(row, cMiles) > 0 {
                    kind = .distanceTime
                } else if number(row, cSecs) > 0 && number(row, cReps) == 0 {
                    kind = .duration
                } else if number(row, cKg) == 0 && number(row, cLbs) == 0 && number(row, cReps) > 0 {
                    kind = .repsOnly
                } else {
                    kind = .weightReps
                }
                let ex = Exercise(name: mapped, muscle: guessMuscle(exTitle), equipment: guessEquipment(exTitle), kind: kind, isCustom: true)
                data.exercises.append(ex)
                exerciseByName[mapped.lowercased()] = ex.id
                exID = ex.id
                result.newExercises += 1
            }
            guard let exerciseID = exID, current != nil else { continue }

            if exTitle != lastExerciseTitle || current!.exercises.isEmpty {
                var entry = WorkoutExercise(exerciseID: exerciseID, restSeconds: data.settings.defaultRest)
                entry.notes = value(row, cExNotes)
                let ss = value(row, cSuperset)
                if !ss.isEmpty {
                    if supersetMap[ss] == nil { supersetMap[ss] = Int.random(in: 1...1_000_000) }
                    entry.supersetID = supersetMap[ss]
                }
                current!.exercises.append(entry)
                lastExerciseTitle = exTitle
            }

            // Serie
            var set = WorkoutSet()
            switch value(row, cType).lowercased() {
            case "warmup", "warm_up", "warm up": set.type = .warmup
            case "dropset", "drop", "drop_set": set.type = .drop
            case "failure": set.type = .failure
            default: set.type = .normal
            }
            var weight = 0.0
            if cKg != nil && number(row, cKg) > 0 {
                weight = number(row, cKg)
                if userUnit == .lb { weight *= 2.20462 }
            } else if cLbs != nil && number(row, cLbs) > 0 {
                weight = number(row, cLbs)
                if userUnit == .kg { weight /= 2.20462 }
            }
            set.weight = (weight * 100).rounded() / 100
            set.reps = Int(number(row, cReps))
            set.seconds = Int(number(row, cSecs))
            set.distance = number(row, cKm) > 0 ? number(row, cKm) : number(row, cMiles) * 1.60934
            set.rpe = number(row, cRpe)
            set.done = true
            current!.exercises[current!.exercises.count - 1].sets.append(set)
            result.sets += 1
        }
        if let w = current { workouts.append(w) }

        for w in workouts {
            let duplicate = data.workouts.contains { abs($0.start.timeIntervalSince(w.start)) < 60 && $0.name == w.name }
            if duplicate {
                result.skippedDuplicates += 1
                continue
            }
            var fixed = w
            if fixed.end == nil { fixed.end = fixed.start.addingTimeInterval(3600) }
            data.workouts.append(fixed)
            result.workouts += 1
        }
        data.workouts.sort { $0.start > $1.start }
        store.data = data
        return result
    }

    /// Exporta todo el historial en CSV con las mismas columnas que Hevy.
    static func exportCSV(_ store: Store) -> URL? {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "d MMM yyyy, HH:mm"
        let isKg = store.data.settings.unit == .kg
        var lines = ["title,start_time,end_time,description,exercise_title,superset_id,exercise_notes,set_index,set_type,\(isKg ? "weight_kg" : "weight_lbs"),reps,distance_km,duration_seconds,rpe"]
        for w in store.data.workouts.sorted(by: { $0.start < $1.start }) {
            for e in w.exercises {
                for (i, s) in e.sets.enumerated() {
                    let type: String
                    switch s.type {
                    case .normal: type = "normal"
                    case .warmup: type = "warmup"
                    case .drop: type = "dropset"
                    case .failure: type = "failure"
                    }
                    let fields: [String] = [
                        w.name, f.string(from: w.start), f.string(from: w.end ?? w.start), w.notes,
                        store.exerciseName(e.exerciseID), e.supersetID.map { "\($0)" } ?? "", e.notes,
                        "\(i)", type, s.weight > 0 ? Fmt.num(s.weight) : "", s.reps > 0 ? "\(s.reps)" : "",
                        s.distance > 0 ? Fmt.num(s.distance) : "", s.seconds > 0 ? "\(s.seconds)" : "",
                        s.rpe > 0 ? Fmt.num(s.rpe) : "",
                    ]
                    lines.append(fields.map { CSV.escape($0) }.joined(separator: ","))
                }
            }
        }
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("forja-entrenamientos.csv")
        do {
            try lines.joined(separator: "\n").write(to: url, atomically: true, encoding: .utf8)
            return url
        } catch {
            return nil
        }
    }
}
