import SwiftUI

// MARK: - Inicio / historial

struct HomeView: View {
    @EnvironmentObject var store: Store
    @State var search = ""

    var filtered: [Workout] {
        guard !search.isEmpty else { return store.data.workouts }
        return store.data.workouts.filter { w in
            w.name.localizedCaseInsensitiveContains(search) ||
            w.exercises.contains { store.exerciseName($0.exerciseID).localizedCaseInsensitiveContains(search) }
        }
    }

    var body: some View {
        NavigationView {
            List {
                if search.isEmpty {
                    Section {
                        WeekSummaryCard()
                    }
                }
                Section(header: Text("Historial")) {
                    if filtered.isEmpty {
                        Text(store.data.workouts.isEmpty
                             ? "Aún no hay entrenamientos. Ve a «Entrenar» para empezar el primero."
                             : "Sin resultados.")
                            .foregroundColor(.secondary)
                            .padding(.vertical, 8)
                    }
                    ForEach(filtered) { w in
                        NavigationLink(destination: WorkoutDetailView(workoutID: w.id)) {
                            WorkoutRow(workout: w)
                        }
                        .listRowBackground(AppTheme.cardBackground)
                    }
                    .onDelete { offsets in
                        let ids = offsets.map { filtered[$0].id }
                        store.data.workouts.removeAll { ids.contains($0.id) }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .searchable(text: $search, prompt: "Buscar entrenamiento o ejercicio")
            .navigationTitle("Forja")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: CalendarView()) {
                        Image(systemName: "calendar")
                    }
                }
            }
            .activeWorkoutBanner()
        }
        .navigationViewStyle(.stack)
    }
}

struct WeekSummaryCard: View {
    @EnvironmentObject var store: Store
    let dayLetters = ["L", "M", "X", "J", "V", "S", "D"]

    var body: some View {
        let count = store.workouts(inWeekOf: Date()).count
        let goal = max(store.data.settings.weeklyGoal, 1)
        let trained = store.trainedDays(inWeekOf: Date())
        let todayIndex = (store.calendar.component(.weekday, from: Date()) + 5) % 7
        return VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Esta semana").font(.caption).foregroundColor(.secondary)
                    Text("\(count) de \(goal) entrenamientos").font(.headline)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Racha").font(.caption).foregroundColor(.secondary)
                    HStack(spacing: 3) {
                        Image(systemName: "flame.fill").foregroundColor(.brand)
                        Text("\(store.weekStreak()) sem.").font(.headline)
                    }
                }
            }
            HStack {
                ForEach(0..<7) { i in
                    VStack(spacing: 4) {
                        Text(dayLetters[i]).font(.caption2).foregroundColor(.secondary)
                        ZStack {
                            Circle()
                                .fill(trained[i] ? Color.brand : Color(.tertiarySystemFill))
                            if trained[i] {
                                Image(systemName: "checkmark").font(.caption.bold()).foregroundColor(.white)
                            }
                        }
                        .frame(width: 30, height: 30)
                        .overlay(Circle().stroke(i == todayIndex ? Color.brand : Color.clear, lineWidth: 2))
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            ProgressView(value: Double(min(count, goal)), total: Double(goal))
        }
        .padding(.vertical, 6)
    }
}

struct WorkoutRow: View {
    @EnvironmentObject var store: Store
    let workout: Workout

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(alignment: .firstTextBaseline) {
                Text(workout.name)
                    .font(.headline)
                    .lineLimit(1)
                Spacer()
                Text(Fmt.shortDate(workout.start))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            HStack(spacing: 16) {
                Label(Fmt.duration(workout.duration), systemImage: "clock")
                Label("\(Fmt.int(workout.volume)) \(store.unit)", systemImage: "scalemass")
            }
            .font(.subheadline)
            .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Calendario

struct CalendarView: View {
    @EnvironmentObject var store: Store
    @State var month = Date()
    let dayLetters = ["L", "M", "X", "J", "V", "S", "D"]

    var cal: Calendar { store.calendar }

    var monthTitle: String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "es_ES")
        f.dateFormat = "LLLL yyyy"
        return f.string(from: month).capitalized
    }

    /// Celdas del mes (nil = hueco antes del día 1).
    var cells: [Date?] {
        guard let interval = cal.dateInterval(of: .month, for: month) else { return [] }
        let first = interval.start
        let offset = (cal.component(.weekday, from: first) + 5) % 7
        let days = cal.range(of: .day, in: .month, for: month)?.count ?? 30
        var result: [Date?] = Array(repeating: nil, count: offset)
        for d in 0..<days {
            result.append(cal.date(byAdding: .day, value: d, to: first))
        }
        return result
    }

    func workouts(on day: Date) -> [Workout] {
        store.data.workouts.filter { cal.isDate($0.start, inSameDayAs: day) }
    }

    var monthWorkouts: [Workout] {
        store.data.workouts.filter { cal.isDate($0.start, equalTo: month, toGranularity: .month) }
    }

    var body: some View {
        List {
            Section {
                HStack {
                    Button { shift(-1) } label: { Image(systemName: "chevron.left") }
                        .buttonStyle(.borderless)
                    Spacer()
                    Text(monthTitle).font(.headline)
                    Spacer()
                    Button { shift(1) } label: { Image(systemName: "chevron.right") }
                        .buttonStyle(.borderless)
                }
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 7), spacing: 6) {
                    ForEach(0..<7) { i in
                        Text(dayLetters[i]).font(.caption2).foregroundColor(.secondary)
                    }
                    ForEach(Array(cells.enumerated()), id: \.offset) { item in
                        if let day = item.element {
                            let trained = !workouts(on: day).isEmpty
                            Text("\(cal.component(.day, from: day))")
                                .font(.subheadline)
                                .frame(maxWidth: .infinity, minHeight: 34)
                                .background(trained ? Color.brand : Color.clear)
                                .foregroundColor(trained ? .white : .primary)
                                .clipShape(Circle())
                                .overlay(Circle().stroke(cal.isDateInToday(day) ? Color.brand : Color.clear, lineWidth: 2))
                        } else {
                            Color.clear.frame(height: 34)
                        }
                    }
                }
                .padding(.vertical, 4)
                HStack {
                    StatTile(title: "Entrenamientos", value: "\(monthWorkouts.count)")
                    StatTile(title: "Volumen", value: "\(Fmt.int(monthWorkouts.reduce(0) { $0 + $1.volume })) \(store.unit)")
                    StatTile(title: "Tiempo", value: Fmt.duration(monthWorkouts.reduce(0) { $0 + $1.duration }))
                }
            }
            Section(header: Text("Entrenamientos del mes")) {
                if monthWorkouts.isEmpty {
                    Text("Ninguno este mes").foregroundColor(.secondary)
                }
                ForEach(monthWorkouts) { w in
                    NavigationLink(destination: WorkoutDetailView(workoutID: w.id)) {
                        WorkoutRow(workout: w)
                    }
                    .listRowBackground(AppTheme.cardBackground)
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Calendario")
        .navigationBarTitleDisplayMode(.inline)
    }

    func shift(_ months: Int) {
        if let d = cal.date(byAdding: .month, value: months, to: month) { month = d }
    }
}

// MARK: - Detalle de entrenamiento

struct WorkoutDetailView: View {
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) var dismiss
    let workoutID: UUID
    @State var confirmDelete = false
    @State var savedRoutine = false
    @State var editing: Workout? = nil
    @State var shareText: ShareItem? = nil

    var workout: Workout? { store.data.workouts.first { $0.id == workoutID } }

    var body: some View {
        Group {
            if let w = workout {
                content(w)
            } else {
                Text("Entrenamiento eliminado").foregroundColor(.secondary)
            }
        }
        .navigationTitle(workout?.name ?? "")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    func content(_ w: Workout) -> some View {
        List {
            Section {
                Text(Fmt.longDate(w.start)).font(.subheadline).foregroundColor(.secondary)
                HStack {
                    StatTile(title: "Duración", value: Fmt.duration(w.duration))
                    StatTile(title: "Volumen", value: "\(Fmt.int(w.volume)) \(store.unit)")
                    StatTile(title: "Series", value: "\(w.setCount)")
                }
                if !w.notes.isEmpty {
                    Text(w.notes).font(.subheadline)
                }
            }
            Section(header: Text("Músculos trabajados")) {
                MuscleMapCard(workouts: [w])
            }
            ForEach(w.exercises) { e in
                Section(header: exerciseHeader(e, in: w)) {
                    if let ex = store.exercise(e.exerciseID) {
                        NavigationLink(destination: ExerciseDetailView(exerciseID: ex.id)) {
                            HStack(spacing: 12) {
                                ExerciseThumbnail(exercise: ex, size: 52)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("Técnica, historial y animación")
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundColor(.primary)
                                    HStack(spacing: 10) {
                                        Label(e.restSeconds == 0 ? "Sin descanso" : "Descanso \(Fmt.clock(TimeInterval(e.restSeconds)))",
                                              systemImage: "timer")
                                        Label("\(e.sets.count) series", systemImage: "list.number")
                                    }
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                }
                            }
                            .padding(.vertical, 2)
                        }
                    }
                    if !e.notes.isEmpty {
                        Text(e.notes).font(.caption).foregroundColor(.secondary)
                    }
                    ForEach(Array(e.sets.enumerated()), id: \.element.id) { item in
                        HStack {
                            Text(item.element.type == .normal ? "\(item.offset + 1)" : item.element.type.letter)
                                .font(.subheadline.bold())
                                .foregroundColor(item.element.type.color)
                                .frame(width: 26)
                            Text(describe(item.element, kind: store.exercise(e.exerciseID)?.kind ?? .weightReps))
                            if item.element.rpe > 0 {
                                Text("@\(Fmt.num(item.element.rpe))").font(.caption).foregroundColor(.secondary)
                            }
                            Spacer()
                            if item.element.estimated1RM > 0 {
                                Text("1RM ≈ \(Fmt.num(item.element.estimated1RM.rounded()))")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
            }
            Section {
                Button {
                    store.requestStart(name: w.name, template: w.exercises)
                } label: {
                    Label("Repetir este entrenamiento", systemImage: "arrow.clockwise")
                }
                Button {
                    editing = w
                } label: {
                    Label("Editar entrenamiento", systemImage: "pencil")
                }
                Button {
                    store.saveAsRoutine(w)
                    savedRoutine = true
                } label: {
                    Label("Guardar como rutina", systemImage: "square.and.arrow.down")
                }
                Button {
                    shareText = ShareItem(items: [shareSummary(w)])
                } label: {
                    Label("Compartir resumen", systemImage: "square.and.arrow.up")
                }
                Button(role: .destructive) {
                    confirmDelete = true
                } label: {
                    Label("Eliminar entrenamiento", systemImage: "trash")
                }
            }
        }
        .listStyle(.insetGrouped)
        .confirmationDialog("¿Eliminar este entrenamiento?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Eliminar", role: .destructive) {
                store.data.workouts.removeAll { $0.id == workoutID }
                dismiss()
            }
            Button("Cancelar", role: .cancel) {}
        }
        .alert("Rutina guardada", isPresented: $savedRoutine) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("La encontrarás en la pestaña «Entrenar».")
        }
        .sheet(item: $editing) { w in
            WorkoutEditorView(workout: w)
                .environmentObject(store)
        }
        .sheet(item: $shareText) { item in
            ShareSheet(items: item.items)
        }
    }

    func exerciseHeader(_ e: WorkoutExercise, in w: Workout) -> some View {
        HStack {
            Text(store.exerciseName(e.exerciseID)).font(.headline).foregroundColor(.brand)
            if let g = e.supersetID {
                Text("Superserie").font(.caption2.bold()).foregroundColor(supersetColor(g))
            }
            Spacer()
            if store.isPR(e, in: w) {
                Label("PR", systemImage: "trophy.fill")
                    .font(.caption.bold())
                    .foregroundColor(.yellow)
            }
        }
        .textCase(nil)
    }

    func describe(_ s: WorkoutSet, kind: ExerciseKind) -> String {
        switch kind {
        case .weightReps: return "\(Fmt.num(s.weight)) \(store.unit) × \(s.reps)"
        case .repsOnly: return "\(s.reps) reps"
        case .duration: return Fmt.clock(TimeInterval(s.seconds))
        case .distanceTime: return "\(Fmt.num(s.distance)) km · \(Fmt.clock(TimeInterval(s.seconds)))"
        }
    }

    func shareSummary(_ w: Workout) -> String {
        var lines = ["🏋️ \(w.name) — \(Fmt.shortDate(w.start))",
                     "⏱ \(Fmt.duration(w.duration)) · \(Fmt.int(w.volume)) \(store.unit) · \(w.setCount) series", ""]
        for e in w.exercises {
            let kind = store.exercise(e.exerciseID)?.kind ?? .weightReps
            lines.append(store.exerciseName(e.exerciseID) + (store.isPR(e, in: w) ? " 🏆" : ""))
            for s in e.sets { lines.append("  • " + describe(s, kind: kind)) }
        }
        lines.append("")
        lines.append("Registrado con Forja")
        return lines.joined(separator: "\n")
    }
}

struct ShareItem: Identifiable {
    let id = UUID()
    let items: [Any]
}

// MARK: - Editar un entrenamiento pasado

struct WorkoutEditorView: View {
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) var dismiss
    @State var workout: Workout
    @State var endDate: Date
    @State var showPicker = false

    init(workout: Workout) {
        _workout = State(initialValue: workout)
        _endDate = State(initialValue: workout.end ?? workout.start.addingTimeInterval(3600))
    }

    var body: some View {
        NavigationView {
            List {
                Section {
                    TextField("Nombre", text: $workout.name)
                    DatePicker("Hora de inicio", selection: $workout.start)
                    DatePicker("Hora de fin", selection: $endDate, in: workout.start...)
                    TextField("Notas", text: $workout.notes)
                }
                ForEach($workout.exercises) { $entry in
                    ExerciseSection(entry: $entry,
                                    isActive: false,
                                    siblings: workout.exercises,
                                    onAction: { action in workout.exercises.apply(action, to: entry.id) })
                }
                Section {
                    Button {
                        showPicker = true
                    } label: {
                        Label("Añadir ejercicio", systemImage: "plus.circle.fill")
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Editar entrenamiento")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar") { save() }
                }
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Listo") { hideKeyboard() }
                }
            }
            .sheet(isPresented: $showPicker) {
                ExercisePickerView { ids in
                    for id in ids {
                        workout.exercises.append(store.makeEntry(for: id, setCount: 3))
                    }
                }
                .environmentObject(store)
            }
        }
    }

    func save() {
        var w = workout
        w.end = max(endDate, w.start)
        // En el historial todas las series cuentan como completadas.
        for i in w.exercises.indices {
            for j in w.exercises[i].sets.indices {
                w.exercises[i].sets[j].done = true
            }
        }
        w.exercises.removeAll { $0.sets.isEmpty }
        if let i = store.data.workouts.firstIndex(where: { $0.id == w.id }) {
            store.data.workouts[i] = w
            store.data.workouts.sort { $0.start > $1.start }
        }
        dismiss()
    }
}
