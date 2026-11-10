import Foundation
import SwiftUI
import UserNotifications

final class NotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }
}

struct PendingStart {
    let name: String?
    let template: [WorkoutExercise]
}

final class Store: ObservableObject {
    @Published var data: AppData {
        didSet { scheduleSave() }
    }
    @Published var showActiveWorkout = false
    @Published var restEnd: Date? = nil
    @Published var restTotal = 0
    @Published var lastFinished: Workout? = nil
    @Published var pendingStart: PendingStart? = nil

    let fileURL: URL
    var pendingSave: DispatchWorkItem?
    let notificationDelegate = NotificationDelegate()

    init() {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        fileURL = docs.appendingPathComponent("forja-datos.json")

        var loaded = AppData()
        if let raw = try? Data(contentsOf: fileURL) {
            if let decoded = try? JSONDecoder().decode(AppData.self, from: raw) {
                loaded = decoded
            } else {
                // Guardamos una copia del archivo dañado para no perder nada.
                let backup = docs.appendingPathComponent("forja-datos-danado-\(Int(Date().timeIntervalSince1970)).json")
                try? raw.write(to: backup)
            }
        }
        if loaded.exercises.isEmpty {
            loaded.exercises = ExerciseSeed.make()
        } else {
            // Añade los ejercicios nuevos de la biblioteca sin tocar los existentes.
            let existing = Set(loaded.exercises.map { $0.name.lowercased() })
            for ex in ExerciseSeed.make() where !existing.contains(ex.name.lowercased()) {
                loaded.exercises.append(ex)
            }
            // Repara (una sola vez) los ejercicios importados de Hevy que quedaron como personalizados.
            if !UserDefaults.standard.bool(forKey: "importRepairV2") {
                Store.repairImported(&loaded)
                UserDefaults.standard.set(true, forKey: "importRepairV2")
            }
            // Mantiene al día el grupo muscular de los ejercicios incluidos (no toca los personalizados).
            let catalog = Dictionary(ExerciseSeed.make().map { ($0.name.lowercased(), $0.muscle) }, uniquingKeysWith: { a, _ in a })
            for i in loaded.exercises.indices where !loaded.exercises[i].isCustom {
                if let m = catalog[loaded.exercises[i].name.lowercased()], m != loaded.exercises[i].muscle {
                    loaded.exercises[i].muscle = m
                }
            }
        }
        data = loaded
        UNUserNotificationCenter.current().delegate = notificationDelegate
        saveNow()
        if data.activeWorkout != nil {
            showActiveWorkout = false
        }
    }

    /// Une los ejercicios importados (personalizados) con su equivalente de la biblioteca,
    /// conservando el historial y las rutinas. Los que no parecen importados solo corrigen su músculo.
    static func repairImported(_ data: inout AppData) {
        var byName: [String: Exercise] = [:]
        for ex in data.exercises where !ex.isCustom { byName[ex.name.lowercased()] = ex }
        var remap: [UUID: UUID] = [:]
        for i in data.exercises.indices where data.exercises[i].isCustom {
            let ex = data.exercises[i]
            let lower = ex.name.lowercased()
            guard let target = HevyImporter.nameMap[lower] ?? ExerciseMatcher.catalogName(for: ex.name),
                  let cat = byName[target.lowercased()] else { continue }
            let looksImported = ex.name.contains("(") || HevyImporter.nameMap[lower] != nil
            if looksImported {
                remap[ex.id] = cat.id
            } else {
                data.exercises[i].muscle = cat.muscle
            }
        }
        guard !remap.isEmpty else { return }
        func fix(_ list: inout [WorkoutExercise]) {
            for j in list.indices {
                if let n = remap[list[j].exerciseID] { list[j].exerciseID = n }
            }
        }
        for w in data.workouts.indices { fix(&data.workouts[w].exercises) }
        for r in data.routines.indices { fix(&data.routines[r].exercises) }
        if data.activeWorkout != nil { fix(&data.activeWorkout!.exercises) }
        data.exercises.removeAll { remap[$0.id] != nil }
    }

    // MARK: - Persistencia

    var unit: String { data.settings.unit.rawValue }

    func scheduleSave() {
        pendingSave?.cancel()
        let work = DispatchWorkItem { [weak self] in self?.saveNow() }
        pendingSave = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4, execute: work)
    }

    func saveNow() {
        do {
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted]
            let raw = try encoder.encode(data)
            try raw.write(to: fileURL, options: .atomic)
        } catch {
            print("Error al guardar: \(error)")
        }
    }

    func exportFile() -> URL? {
        let f = DateFormatter()
        f.dateFormat = "yyyyMMdd-HHmm"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("forja-copia-\(f.string(from: Date())).json")
        do {
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted]
            try encoder.encode(data).write(to: url, options: .atomic)
            return url
        } catch {
            return nil
        }
    }

    func importFile(_ url: URL) -> Bool {
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        guard let raw = try? Data(contentsOf: url),
              var decoded = try? JSONDecoder().decode(AppData.self, from: raw) else { return false }
        if decoded.exercises.isEmpty { decoded.exercises = ExerciseSeed.make() }
        data = decoded
        return true
    }

    func encodedData() -> Data? {
        try? JSONEncoder().encode(data)
    }

    func restore(from raw: Data) -> String {
        guard var decoded = try? JSONDecoder().decode(AppData.self, from: raw) else {
            return "La copia no es válida."
        }
        let existing = Set(decoded.exercises.map { $0.name.lowercased() })
        for ex in ExerciseSeed.make() where !existing.contains(ex.name.lowercased()) {
            decoded.exercises.append(ex)
        }
        data = decoded
        return "Datos restaurados: \(decoded.workouts.count) entrenamientos y \(decoded.routines.count) rutinas."
    }

    func autoBackupToGoogle() {
        guard let payload = encodedData() else { return }
        Task { @MainActor in
            let sync = GoogleSync.shared
            guard sync.autoBackup, sync.isSignedIn else { return }
            try? await sync.backup(payload)
        }
    }

    /// Importa un CSV (Hevy/Forja) o una copia JSON. Devuelve el mensaje para el usuario.
    func importAny(_ url: URL, mode: ImportMode? = nil) -> String {
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        guard let raw = try? Data(contentsOf: url), !raw.isEmpty else {
            return "No se pudo leer el archivo."
        }
        let ext = url.pathExtension.lowercased()
        let looksJSON = ext == "json" || raw.first == UInt8(ascii: "{")
        if mode == .backupJSON || (mode == nil && looksJSON) {
            guard var decoded = try? JSONDecoder().decode(AppData.self, from: raw) else {
                return "El archivo no es una copia de seguridad válida de Forja."
            }
            if decoded.exercises.isEmpty { decoded.exercises = ExerciseSeed.make() }
            data = decoded
            return "Copia de seguridad restaurada."
        }
        let text = String(data: raw, encoding: .utf8)
            ?? String(data: raw, encoding: .utf16)
            ?? String(data: raw, encoding: .isoLatin1)
            ?? ""
        let r = HevyImporter.importCSV(text, into: self)
        if let err = r.error { return err }
        if r.workouts == 0 && r.skippedDuplicates == 0 {
            return "No se encontraron entrenamientos en el archivo. Comprueba que es el CSV de «Exportar entrenamientos» de Hevy."
        }
        return "Importados \(r.workouts) entrenamientos y \(r.sets) series. Ejercicios nuevos: \(r.newExercises). Duplicados omitidos: \(r.skippedDuplicates)."
    }

    func resetAll() {
        var fresh = AppData()
        fresh.exercises = ExerciseSeed.make()
        fresh.settings = data.settings
        data = fresh
        showActiveWorkout = false
        skipRest()
    }

    // MARK: - Ejercicios

    func exercise(_ id: UUID) -> Exercise? {
        data.exercises.first { $0.id == id }
    }

    func exerciseName(_ id: UUID) -> String {
        exercise(id)?.name ?? "Ejercicio eliminado"
    }

    func makeEntry(for exerciseID: UUID, setCount: Int? = nil) -> WorkoutExercise {
        let count = setCount ?? max(1, previousSets(for: exerciseID).count)
        return WorkoutExercise(exerciseID: exerciseID,
                               sets: (0..<count).map { _ in WorkoutSet() },
                               restSeconds: restFor(exerciseID))
    }

    // MARK: - Descanso recordado por ejercicio

    private static let restKey = "restByExercise"

    /// Descanso que el usuario eligió la última vez para este ejercicio (o el general).
    func restFor(_ exerciseID: UUID) -> Int {
        let dict = UserDefaults.standard.dictionary(forKey: Store.restKey) as? [String: Int] ?? [:]
        return dict[exerciseID.uuidString] ?? data.settings.defaultRest
    }

    func rememberRest(_ seconds: Int, for exerciseID: UUID) {
        var dict = UserDefaults.standard.dictionary(forKey: Store.restKey) as? [String: Int] ?? [:]
        dict[exerciseID.uuidString] = seconds
        UserDefaults.standard.set(dict, forKey: Store.restKey)
        objectWillChange.send()
    }

    func hasRememberedRest(_ exerciseID: UUID) -> Bool {
        let dict = UserDefaults.standard.dictionary(forKey: Store.restKey) as? [String: Int] ?? [:]
        return dict[exerciseID.uuidString] != nil
    }

    /// Series de la última vez que se hizo este ejercicio.
    func previousSets(for exerciseID: UUID) -> [WorkoutSet] {
        for w in data.workouts {
            if let e = w.exercises.first(where: { $0.exerciseID == exerciseID }) {
                return e.sets
            }
        }
        return []
    }

    func history(for exerciseID: UUID) -> [ExerciseHistoryItem] {
        var items: [ExerciseHistoryItem] = []
        for w in data.workouts {
            for e in w.exercises where e.exerciseID == exerciseID {
                items.append(ExerciseHistoryItem(workout: w, entry: e))
            }
        }
        return items
    }

    func isPR(_ entry: WorkoutExercise, in workout: Workout) -> Bool {
        let best = entry.bestE1RM
        guard best > 0 else { return false }
        var prior = 0.0
        var hadPrior = false
        for w in data.workouts where w.start < workout.start {
            for e in w.exercises where e.exerciseID == entry.exerciseID {
                hadPrior = true
                prior = max(prior, e.bestE1RM)
            }
        }
        return hadPrior && best > prior
    }

    // MARK: - Entrenamiento activo

    func requestStart(name: String?, template: [WorkoutExercise]) {
        if data.activeWorkout != nil {
            pendingStart = PendingStart(name: name, template: template)
        } else {
            startWorkout(name: name, template: template)
        }
    }

    func startWorkout(name: String?, template: [WorkoutExercise]) {
        var w = Workout(name: (name?.isEmpty == false ? name! : Workout.defaultName()))
        w.exercises = template.map { ex in
            var copy = ex
            copy.id = UUID()
            // Si el usuario fijó un descanso para este ejercicio, se usa ese.
            if hasRememberedRest(ex.exerciseID) { copy.restSeconds = restFor(ex.exerciseID) }
            copy.sets = ex.sets.map { s in
                var n = s
                n.id = UUID()
                n.done = false
                return n
            }
            return copy
        }
        skipRest()
        data.activeWorkout = w
        showActiveWorkout = true
    }

    func discardWorkout() {
        data.activeWorkout = nil
        showActiveWorkout = false
        skipRest()
    }

    /// Guarda el entrenamiento en el historial. Devuelve false si no hay series completadas.
    func finishWorkout() -> Bool {
        guard var w = data.activeWorkout else { return false }
        w.exercises = w.exercises.compactMap { ex in
            var e = ex
            e.sets = ex.sets.filter { $0.done }
            return e.sets.isEmpty ? nil : e
        }
        guard !w.exercises.isEmpty else { return false }
        w.end = Date()

        var newData = data
        newData.workouts.insert(w, at: 0)
        newData.workouts.sort { $0.start > $1.start }
        newData.activeWorkout = nil
        data = newData

        showActiveWorkout = false
        skipRest()
        autoBackupToGoogle()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) { [weak self] in
            self?.lastFinished = w
        }
        return true
    }

    func saveAsRoutine(_ workout: Workout) {
        let exercises = workout.exercises.map { ex -> WorkoutExercise in
            var e = ex
            e.id = UUID()
            e.sets = ex.sets.map { s in
                var n = s
                n.id = UUID()
                n.done = false
                return n
            }
            return e
        }
        data.routines.append(Routine(name: workout.name, notes: workout.notes, exercises: exercises))
    }

    // MARK: - Temporizador de descanso

    func requestNotifications() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }

    func startRest(_ seconds: Int) {
        guard seconds > 0 else { return }
        restTotal = seconds
        restEnd = Date().addingTimeInterval(TimeInterval(seconds))
        scheduleRestNotification()
    }

    func adjustRest(_ delta: Int) {
        guard let end = restEnd else { return }
        let newEnd = end.addingTimeInterval(TimeInterval(delta))
        if newEnd <= Date() {
            skipRest()
            return
        }
        restEnd = newEnd
        restTotal = max(1, restTotal + delta)
        scheduleRestNotification()
    }

    func skipRest() {
        restEnd = nil
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["forja.rest"])
    }

    func scheduleRestNotification() {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["forja.rest"])
        guard let end = restEnd else { return }
        let interval = end.timeIntervalSinceNow
        guard interval > 1 else { return }
        let content = UNMutableNotificationContent()
        content.title = "Descanso terminado"
        content.body = "¡A por la siguiente serie!"
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
        center.add(UNNotificationRequest(identifier: "forja.rest", content: content, trigger: trigger))
    }

    // MARK: - Estadísticas

    var calendar: Calendar {
        var c = Calendar(identifier: .gregorian)
        c.firstWeekday = 2
        c.locale = Locale(identifier: "es_ES")
        return c
    }

    func weekStart(_ d: Date) -> Date {
        calendar.dateInterval(of: .weekOfYear, for: d)?.start ?? calendar.startOfDay(for: d)
    }

    func workouts(inWeekOf d: Date) -> [Workout] {
        let start = weekStart(d)
        guard let end = calendar.date(byAdding: .day, value: 7, to: start) else { return [] }
        return data.workouts.filter { $0.start >= start && $0.start < end }
    }

    func trainedDays(inWeekOf d: Date) -> [Bool] {
        let start = weekStart(d)
        var days = Array(repeating: false, count: 7)
        for w in workouts(inWeekOf: d) {
            let diff = calendar.dateComponents([.day], from: start, to: calendar.startOfDay(for: w.start)).day ?? -1
            if diff >= 0 && diff < 7 { days[diff] = true }
        }
        return days
    }

    func weekStreak() -> Int {
        var streak = 0
        var cursor = weekStart(Date())
        if workouts(inWeekOf: cursor).isEmpty {
            guard let prev = calendar.date(byAdding: .weekOfYear, value: -1, to: cursor) else { return 0 }
            cursor = prev
        }
        while !workouts(inWeekOf: cursor).isEmpty {
            streak += 1
            guard let prev = calendar.date(byAdding: .weekOfYear, value: -1, to: cursor) else { break }
            cursor = prev
        }
        return streak
    }

    func weeklyStats(weeks: Int = 8) -> [WeekStat] {
        let current = weekStart(Date())
        return (0..<weeks).reversed().compactMap { i in
            guard let start = calendar.date(byAdding: .weekOfYear, value: -i, to: current) else { return nil }
            let ws = workouts(inWeekOf: start)
            return WeekStat(start: start, volume: ws.reduce(0) { $0 + $1.volume }, count: ws.count)
        }
    }

    func muscleStats(days: Int = 30) -> [MuscleStat] {
        let since = Date().addingTimeInterval(-Double(days) * 86400)
        var counts: [MuscleGroup: Int] = [:]
        for w in data.workouts where w.start >= since {
            for e in w.exercises {
                guard let ex = exercise(e.exerciseID) else { continue }
                counts[ex.muscle, default: 0] += e.sets.filter { $0.type != .warmup }.count
            }
        }
        return MuscleGroup.allCases
            .compactMap { m in counts[m].map { MuscleStat(muscle: m, sets: $0) } }
            .sorted { $0.sets > $1.sets }
    }
}
