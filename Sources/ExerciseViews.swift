import SwiftUI

struct ExercisesView: View {
    @EnvironmentObject var store: Store
    @State var search = ""
    @State var showNew = false

    func items(for muscle: MuscleGroup) -> [Exercise] {
        store.data.exercises
            .filter { $0.muscle == muscle }
            .filter { search.isEmpty || $0.name.localizedCaseInsensitiveContains(search) }
            .sorted { $0.name.localizedCompare($1.name) == .orderedAscending }
    }

    var body: some View {
        NavigationView {
            List {
                ForEach(MuscleGroup.allCases) { m in
                    if !items(for: m).isEmpty {
                        Section(header: Text(m.rawValue)) {
                            ForEach(items(for: m)) { ex in
                                NavigationLink(destination: ExerciseDetailView(exerciseID: ex.id)) {
                                    ExerciseRow(exercise: ex, selected: false)
                                }
                            }
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .searchable(text: $search, prompt: "Buscar ejercicio")
            .navigationTitle("Ejercicios")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showNew = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showNew) {
                NewExerciseView()
                    .environmentObject(store)
            }
            .activeWorkoutBanner()
        }
        .navigationViewStyle(.stack)
    }
}

enum ChartMetric: String, CaseIterable, Identifiable {
    case oneRM = "1RM est."
    case weight = "Peso máx."
    case volume = "Volumen"
    case reps = "Reps máx."
    var id: String { rawValue }
}

struct ExerciseDetailView: View {
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) var dismiss
    let exerciseID: UUID
    @State var metric: ChartMetric = .oneRM
    @State var editing = false
    @State var confirmDelete = false

    var exercise: Exercise? { store.exercise(exerciseID) }
    var history: [ExerciseHistoryItem] { store.history(for: exerciseID) }
    var allSets: [WorkoutSet] { history.flatMap { $0.entry.sets }.filter { $0.type != .warmup } }

    func value(_ e: WorkoutExercise) -> Double {
        switch metric {
        case .oneRM: return e.bestE1RM
        case .weight: return e.maxWeight
        case .volume: return e.sets.reduce(0) { $0 + $1.volume }
        case .reps: return Double(e.maxReps)
        }
    }

    /// Mejor peso conseguido para cada número de repeticiones (1–12).
    var repRecords: [(Int, Double)] {
        (1...12).compactMap { r in
            let best = allSets.filter { $0.reps >= r }.map { $0.weight }.max() ?? 0
            return best > 0 ? (r, best) : nil
        }
    }

    var isUsedInRoutines: Bool {
        store.data.routines.contains { r in r.exercises.contains { $0.exerciseID == exerciseID } }
    }

    var body: some View {
        List {
            if let ex = exercise {
                ExerciseHowToSections(exercise: ex)

                Section(header: Text("Récords personales")) {
                    HStack {
                        StatTile(title: "1RM estimado", value: "\(Fmt.num((allSets.map { $0.estimated1RM }.max() ?? 0).rounded())) \(store.unit)")
                        StatTile(title: "Peso máximo", value: "\(Fmt.num(allSets.map { $0.weight }.max() ?? 0)) \(store.unit)")
                    }
                    HStack {
                        StatTile(title: "Mejor serie (vol.)", value: bestSetText)
                        StatTile(title: "Reps máximas", value: "\(allSets.map { $0.reps }.max() ?? 0)")
                    }
                    HStack {
                        StatTile(title: "Veces realizado", value: "\(history.count)")
                        StatTile(title: "Volumen total", value: "\(Fmt.int(allSets.reduce(0) { $0 + $1.volume })) \(store.unit)")
                    }
                }

                if history.count >= 2 {
                    Section(header: Text("Progreso")) {
                        Picker("Métrica", selection: $metric) {
                            ForEach(ChartMetric.allCases) { m in Text(m.rawValue).tag(m) }
                        }
                        .pickerStyle(.segmented)
                        LineChart(values: history.reversed().suffix(25).map { value($0.entry) })
                    }
                }

                if ex.kind == .weightReps && !repRecords.isEmpty {
                    Section(header: Text("Mejor peso por repeticiones")) {
                        ForEach(repRecords.indices, id: \.self) { i in
                            HStack {
                                Text("\(repRecords[i].0) reps")
                                Spacer()
                                Text("\(Fmt.num(repRecords[i].1)) \(store.unit)").bold()
                            }
                        }
                    }
                }

                Section(header: Text("Historial")) {
                    if history.isEmpty {
                        Text("Todavía no has hecho este ejercicio.").foregroundColor(.secondary)
                    }
                    ForEach(history) { item in
                        NavigationLink(destination: WorkoutDetailView(workoutID: item.workout.id)) {
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text(item.workout.name).font(.subheadline.bold())
                                    Spacer()
                                    Text(Fmt.shortDate(item.workout.start)).font(.caption).foregroundColor(.secondary)
                                }
                                Text(item.entry.sets.map { setText($0, kind: ex.kind) }.joined(separator: "  ·  "))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }

                if ex.isCustom {
                    Section {
                        Button {
                            editing = true
                        } label: {
                            Label("Editar ejercicio", systemImage: "pencil")
                        }
                        Button(role: .destructive) {
                            confirmDelete = true
                        } label: {
                            Label("Eliminar ejercicio", systemImage: "trash")
                        }
                        .disabled(!history.isEmpty || isUsedInRoutines)
                        if !history.isEmpty || isUsedInRoutines {
                            Text("No se puede eliminar porque se usa en tu historial o en rutinas.")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            } else {
                Text("Ejercicio eliminado").foregroundColor(.secondary)
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle(exercise?.name ?? "")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $editing) {
            if let ex = exercise {
                EditExerciseView(exercise: ex)
                    .environmentObject(store)
            }
        }
        .confirmationDialog("¿Eliminar este ejercicio?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Eliminar", role: .destructive) {
                store.data.exercises.removeAll { $0.id == exerciseID }
                dismiss()
            }
            Button("Cancelar", role: .cancel) {}
        }
    }

    var bestSetText: String {
        guard let best = allSets.max(by: { $0.volume < $1.volume }), best.volume > 0 else { return "—" }
        return "\(Fmt.num(best.weight)) × \(best.reps)"
    }

    func setText(_ s: WorkoutSet, kind: ExerciseKind) -> String {
        switch kind {
        case .weightReps: return "\(Fmt.num(s.weight))×\(s.reps)"
        case .repsOnly: return "\(s.reps)"
        case .duration: return Fmt.clock(TimeInterval(s.seconds))
        case .distanceTime: return "\(Fmt.num(s.distance)) km"
        }
    }
}

struct EditExerciseView: View {
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) var dismiss
    @State var exercise: Exercise

    init(exercise: Exercise) {
        _exercise = State(initialValue: exercise)
    }

    var body: some View {
        NavigationView {
            Form {
                TextField("Nombre", text: $exercise.name)
                Picker("Músculo principal", selection: $exercise.muscle) {
                    ForEach(MuscleGroup.allCases) { m in Text(m.rawValue).tag(m) }
                }
                Picker("Equipamiento", selection: $exercise.equipment) {
                    ForEach(Equipment.allCases) { e in Text(e.rawValue).tag(e) }
                }
                Picker("Tipo de registro", selection: $exercise.kind) {
                    ForEach(ExerciseKind.allCases) { k in Text(k.rawValue).tag(k) }
                }
            }
            .navigationTitle("Editar ejercicio")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar") {
                        if let i = store.data.exercises.firstIndex(where: { $0.id == exercise.id }) {
                            store.data.exercises[i] = exercise
                        }
                        dismiss()
                    }
                    .disabled(exercise.name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}
