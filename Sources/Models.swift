import Foundation
import SwiftUI

// MARK: - Catálogo

enum MuscleGroup: String, Codable, CaseIterable, Identifiable {
    case chest = "Pecho"
    case back = "Espalda"
    case shoulders = "Hombros"
    case biceps = "Bíceps"
    case triceps = "Tríceps"
    case forearms = "Antebrazos"
    case quads = "Cuádriceps"
    case hamstrings = "Isquiotibiales"
    case glutes = "Glúteos"
    case calves = "Gemelos"
    case core = "Abdomen"
    case cardio = "Cardio"
    case fullBody = "Cuerpo completo"

    var id: String { rawValue }
}

enum Equipment: String, Codable, CaseIterable, Identifiable {
    case barbell = "Barra"
    case dumbbell = "Mancuernas"
    case machine = "Máquina"
    case cable = "Polea"
    case bodyweight = "Peso corporal"
    case kettlebell = "Kettlebell"
    case band = "Banda"
    case other = "Otro"

    var id: String { rawValue }
}

enum ExerciseKind: String, Codable, CaseIterable, Identifiable {
    case weightReps = "Peso y repeticiones"
    case repsOnly = "Solo repeticiones"
    case duration = "Duración"
    case distanceTime = "Distancia y tiempo"

    var id: String { rawValue }
}

enum WeightUnit: String, Codable, CaseIterable, Identifiable {
    case kg
    case lb

    var id: String { rawValue }
}

struct Exercise: Identifiable, Codable, Hashable {
    var id = UUID()
    var name: String
    var muscle: MuscleGroup
    var equipment: Equipment
    var kind: ExerciseKind = .weightReps
    var isCustom = false
}

// MARK: - Series y entrenamientos

enum SetType: String, Codable, CaseIterable, Identifiable {
    case normal
    case warmup
    case drop
    case failure

    var id: String { rawValue }

    var title: String {
        switch self {
        case .normal: return "Normal"
        case .warmup: return "Calentamiento"
        case .drop: return "Drop set"
        case .failure: return "Al fallo"
        }
    }

    var letter: String {
        switch self {
        case .normal: return "N"
        case .warmup: return "C"
        case .drop: return "D"
        case .failure: return "F"
        }
    }

    var color: Color {
        switch self {
        case .normal: return .primary
        case .warmup: return .yellow
        case .drop: return .purple
        case .failure: return .red
        }
    }
}

struct WorkoutSet: Identifiable, Codable, Hashable {
    var id = UUID()
    var type: SetType = .normal
    var weight: Double = 0
    var reps: Int = 0
    var seconds: Int = 0
    var distance: Double = 0
    var rpe: Double = 0
    var done = false

    var volume: Double {
        type == .warmup ? 0 : weight * Double(reps)
    }

    /// 1RM estimado (fórmula de Epley).
    var estimated1RM: Double {
        guard weight > 0, reps > 0, type != .warmup else { return 0 }
        return reps == 1 ? weight : weight * (1 + Double(reps) / 30)
    }
}

struct WorkoutExercise: Identifiable, Codable, Hashable {
    var id = UUID()
    var exerciseID: UUID
    var sets: [WorkoutSet] = []
    var notes = ""
    var restSeconds = 90
    var supersetID: Int? = nil

    var bestE1RM: Double { sets.map { $0.estimated1RM }.max() ?? 0 }
    var maxWeight: Double { sets.filter { $0.type != .warmup }.map { $0.weight }.max() ?? 0 }
    var maxReps: Int { sets.map { $0.reps }.max() ?? 0 }
    var maxSeconds: Int { sets.map { $0.seconds }.max() ?? 0 }
    var volume: Double { sets.filter { $0.done }.reduce(0) { $0 + $1.volume } }
}

struct Routine: Identifiable, Codable, Hashable {
    var id = UUID()
    var name: String
    var notes = ""
    var folder = ""
    var exercises: [WorkoutExercise] = []
}

enum ExerciseAction {
    case remove
    case moveUp
    case moveDown
    case supersetWith(UUID)
    case leaveSuperset
}

extension Array where Element == WorkoutExercise {
    mutating func apply(_ action: ExerciseAction, to id: UUID) {
        guard let i = firstIndex(where: { $0.id == id }) else { return }
        switch action {
        case .remove:
            remove(at: i)
        case .moveUp:
            if i > 0 { swapAt(i, i - 1) }
        case .moveDown:
            if i < count - 1 { swapAt(i, i + 1) }
        case .supersetWith(let other):
            guard let j = firstIndex(where: { $0.id == other }) else { return }
            let group = self[j].supersetID ?? self[i].supersetID ?? Int.random(in: 1...1_000_000)
            self[i].supersetID = group
            self[j].supersetID = group
            // Colocar juntos
            if j != i + 1 && j != i - 1 {
                let moved = remove(at: j)
                let target = Swift.min(i < j ? i + 1 : i, count)
                insert(moved, at: target)
            }
        case .leaveSuperset:
            let group = self[i].supersetID
            self[i].supersetID = nil
            if let g = group {
                let remaining = indices.filter { self[$0].supersetID == g }
                if remaining.count == 1 { self[remaining[0]].supersetID = nil }
            }
        }
    }
}

/// Colores para identificar superseries.
func supersetColor(_ id: Int) -> Color {
    let palette: [Color] = [.purple, .blue, .teal, .pink, .green, .indigo]
    return palette[abs(id) % palette.count]
}

struct Workout: Identifiable, Codable, Hashable {
    var id = UUID()
    var name: String
    var start = Date()
    var end: Date? = nil
    var exercises: [WorkoutExercise] = []
    var notes = ""

    var doneSets: [WorkoutSet] { exercises.flatMap { $0.sets.filter { $0.done } } }
    var volume: Double { doneSets.reduce(0) { $0 + $1.volume } }
    var setCount: Int { doneSets.count }
    var duration: TimeInterval { (end ?? Date()).timeIntervalSince(start) }

    static func defaultName(for date: Date = Date()) -> String {
        let hour = Calendar.current.component(.hour, from: date)
        switch hour {
        case 5..<12: return "Entrenamiento de mañana"
        case 12..<20: return "Entrenamiento de tarde"
        default: return "Entrenamiento de noche"
        }
    }
}

struct BodyMeasurement: Identifiable, Codable, Hashable {
    var id = UUID()
    var date = Date()
    var weight: Double = 0
    var bodyFat: Double = 0
    var waist: Double = 0
    var chest: Double = 0
    var arm: Double = 0
    var thigh: Double = 0
}

struct AppSettings: Codable, Hashable {
    var unit: WeightUnit = .kg
    var defaultRest = 90
    var weeklyGoal = 3
}

struct AppData: Codable {
    var exercises: [Exercise] = []
    var routines: [Routine] = []
    var workouts: [Workout] = []
    var measurements: [BodyMeasurement] = []
    var settings = AppSettings()
    var activeWorkout: Workout? = nil
}

// MARK: - Estadísticas auxiliares

struct WeekStat: Identifiable {
    var id: Date { start }
    let start: Date
    let volume: Double
    let count: Int
}

struct MuscleStat: Identifiable {
    var id: MuscleGroup { muscle }
    let muscle: MuscleGroup
    let sets: Int
}

struct ExerciseHistoryItem: Identifiable {
    var id: UUID { workout.id }
    let workout: Workout
    let entry: WorkoutExercise
}

// MARK: - Formato

enum Fmt {
    static func num(_ v: Double) -> String {
        guard v.isFinite else { return "0" }
        var s = String(format: "%.2f", v)
        while s.contains(".") && (s.hasSuffix("0") || s.hasSuffix(".")) {
            s.removeLast()
        }
        return s
    }

    private static let intFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.maximumFractionDigits = 0
        f.locale = Locale(identifier: "es_ES")
        return f
    }()

    static func int(_ v: Double) -> String {
        intFormatter.string(from: NSNumber(value: v.rounded())) ?? "\(Int(v))"
    }

    static func clock(_ t: TimeInterval) -> String {
        let total = max(0, Int(t))
        let h = total / 3600
        let m = (total % 3600) / 60
        let s = total % 60
        if h > 0 { return String(format: "%d:%02d:%02d", h, m, s) }
        return String(format: "%d:%02d", m, s)
    }

    static func duration(_ t: TimeInterval) -> String {
        let total = max(0, Int(t)) / 60
        let h = total / 60
        let m = total % 60
        return h > 0 ? "\(h) h \(m) min" : "\(m) min"
    }

    static func rest(_ seconds: Int) -> String {
        if seconds == 0 { return "Sin descanso" }
        let m = seconds / 60
        let s = seconds % 60
        if m == 0 { return "\(s) s" }
        return s == 0 ? "\(m) min" : "\(m) min \(s) s"
    }

    private static let shortDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "es_ES")
        f.dateFormat = "EEE d MMM"
        return f
    }()

    private static let longDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "es_ES")
        f.dateFormat = "EEEE d 'de' MMMM yyyy, HH:mm"
        return f
    }()

    private static let dayMonthFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "es_ES")
        f.dateFormat = "d/M"
        return f
    }()

    static func shortDate(_ d: Date) -> String { shortDateFormatter.string(from: d).capitalized }
    static func longDate(_ d: Date) -> String { longDateFormatter.string(from: d).capitalized }
    static func dayMonth(_ d: Date) -> String { dayMonthFormatter.string(from: d) }
}

extension Color {
    static let brand = Color(red: 0.98, green: 0.42, blue: 0.18)
}
