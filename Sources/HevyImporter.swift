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
    static let nameMap: [String: String] = [
        "bench press (barbell)": "Press de banca",
        "incline bench press (barbell)": "Press inclinado con barra",
        "bench press (dumbbell)": "Press de banca con mancuernas",
        "incline bench press (dumbbell)": "Press inclinado con mancuernas",
        "chest fly (dumbbell)": "Aperturas con mancuernas",
        "cable fly crossovers": "Cruce de poleas",
        "chest press (machine)": "Press de pecho en máquina",
        "chest dip": "Fondos en paralelas",
        "push up": "Flexiones",
        "deadlift (barbell)": "Peso muerto",
        "pull up": "Dominadas",
        "pull up (weighted)": "Dominadas lastradas",
        "bent over row (barbell)": "Remo con barra",
        "dumbbell row": "Remo con mancuerna",
        "lat pulldown (cable)": "Jalón al pecho",
        "seated cable row - v grip (cable)": "Remo sentado en polea",
        "shrug (dumbbell)": "Encogimientos con mancuernas",
        "overhead press (barbell)": "Press militar con barra",
        "shoulder press (dumbbell)": "Press de hombro con mancuernas",
        "lateral raise (dumbbell)": "Elevaciones laterales",
        "lateral raise (cable)": "Elevaciones laterales en polea",
        "front raise (dumbbell)": "Elevaciones frontales",
        "rear delt reverse fly (dumbbell)": "Pájaros con mancuernas",
        "face pull": "Face pull",
        "bicep curl (barbell)": "Curl con barra",
        "bicep curl (dumbbell)": "Curl con mancuernas",
        "hammer curl (dumbbell)": "Curl martillo",
        "bicep curl (cable)": "Curl en polea",
        "preacher curl (machine)": "Curl predicador",
        "triceps pushdown": "Extensión de tríceps en polea",
        "skullcrusher (barbell)": "Press francés",
        "overhead triceps extension (dumbbell)": "Extensión sobre la cabeza con mancuerna",
        "bench press - close grip (barbell)": "Press de banca agarre cerrado",
        "squat (barbell)": "Sentadilla con barra",
        "front squat": "Sentadilla frontal",
        "goblet squat": "Sentadilla goblet",
        "leg press (machine)": "Prensa de piernas",
        "leg extension (machine)": "Extensión de cuádriceps",
        "lunge (dumbbell)": "Zancadas con mancuernas",
        "bulgarian split squat": "Sentadilla búlgara",
        "hack squat (machine)": "Sentadilla hack",
        "romanian deadlift (barbell)": "Peso muerto rumano",
        "lying leg curl (machine)": "Curl femoral tumbado",
        "seated leg curl (machine)": "Curl femoral sentado",
        "good morning (barbell)": "Buenos días",
        "hip thrust (barbell)": "Hip thrust con barra",
        "glute bridge": "Puente de glúteos",
        "hip abduction (machine)": "Abducción en máquina",
        "standing calf raise (machine)": "Elevación de talones de pie",
        "seated calf raise": "Elevación de talones sentado",
        "plank": "Plancha",
        "crunch": "Crunch abdominal",
        "hanging leg raise": "Elevación de piernas colgado",
        "ab wheel": "Rueda abdominal",
        "cable crunch": "Crunch en polea",
        "russian twist (weighted)": "Giros rusos",
        "running": "Correr",
        "cycling": "Bicicleta estática",
        "rowing machine": "Remo ergómetro",
        "elliptical trainer": "Elíptica",
        "jump rope": "Saltar la cuerda",
        "kettlebell swing": "Swing con kettlebell",
        "burpee": "Burpees",
        "thruster (barbell)": "Thruster",
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
            let mapped = nameMap[exTitle.lowercased()] ?? exTitle
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
