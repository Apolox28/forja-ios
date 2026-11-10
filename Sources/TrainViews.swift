import SwiftUI

struct RoutineEditorItem: Identifiable {
    let id = UUID()
    let routine: Routine
    let isNew: Bool
}

// MARK: - Entrenar (rutinas)

struct TrainView: View {
    @EnvironmentObject var store: Store
    @State var editorItem: RoutineEditorItem? = nil
    @State var showTemplates = false
    @State var showLibrary = false
    @State var collapsed: Set<String> = []

    var folders: [String] {
        let names = Set(store.data.routines.map { $0.folder })
        return names.sorted { a, b in
            if a.isEmpty { return false }
            if b.isEmpty { return true }
            return a.localizedCompare(b) == .orderedAscending
        }
    }

    func routines(in folder: String) -> [Routine] {
        store.data.routines.filter { $0.folder == folder }
    }

    var body: some View {
        NavigationView {
            List {
                Section {
                    Button {
                        store.requestStart(name: nil, template: [])
                    } label: {
                        Label("Empezar entrenamiento vacío", systemImage: "plus.circle.fill")
                            .font(.headline)
                    }
                    Button {
                        editorItem = RoutineEditorItem(routine: Routine(name: ""), isNew: true)
                    } label: {
                        Label("Nueva rutina", systemImage: "square.and.pencil")
                    }
                    Button {
                        showTemplates = true
                    } label: {
                        Label("Explorar programas predefinidos", systemImage: "books.vertical")
                    }
                }

                if store.data.routines.isEmpty {
                    Section {
                        Text("Crea una rutina o añade un programa predefinido para empezar más rápido.")
                            .foregroundColor(.secondary)
                    }
                }

                ForEach(folders, id: \.self) { folder in
                    Section(header: folderHeader(folder)) {
                        if !collapsed.contains(folder) {
                            ForEach(routines(in: folder)) { r in
                                RoutineRow(routine: r,
                                           onStart: { store.requestStart(name: r.name, template: r.exercises) },
                                           onEdit: { editorItem = RoutineEditorItem(routine: r, isNew: false) })
                            }
                            .onDelete { offsets in
                                let ids = offsets.map { routines(in: folder)[$0].id }
                                store.data.routines.removeAll { ids.contains($0.id) }
                            }
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Entrenar")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showLibrary = true
                    } label: {
                        Label("Ejercicios", systemImage: "books.vertical")
                    }
                }
            }
            .background(
                Color.clear.sheet(isPresented: $showLibrary) {
                    ExercisesView()
                        .environmentObject(store)
                }
            )
            .sheet(item: $editorItem) { item in
                RoutineEditorView(routine: item.routine, isNew: item.isNew)
                    .environmentObject(store)
            }
            .sheet(isPresented: $showTemplates) {
                ProgramTemplatesView()
                    .environmentObject(store)
            }
            .activeWorkoutBanner()
        }
        .navigationViewStyle(.stack)
    }

    func folderHeader(_ folder: String) -> some View {
        Button {
            if collapsed.contains(folder) { collapsed.remove(folder) } else { collapsed.insert(folder) }
        } label: {
            HStack {
                Image(systemName: "folder")
                Text(folder.isEmpty ? "Mis rutinas" : folder)
                Text("(\(routines(in: folder).count))")
                Spacer()
                Image(systemName: collapsed.contains(folder) ? "chevron.right" : "chevron.down")
            }
        }
        .buttonStyle(.plain)
        .textCase(nil)
        .font(.subheadline.bold())
    }
}

struct RoutineRow: View {
    @EnvironmentObject var store: Store
    let routine: Routine
    var onStart: () -> Void
    var onEdit: () -> Void

    var summary: String {
        routine.exercises.map { store.exerciseName($0.exerciseID) }.joined(separator: ", ")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(routine.name).font(.headline)
                Spacer()
                Menu {
                    Button { onEdit() } label: { Label("Editar", systemImage: "pencil") }
                    Button {
                        var copy = routine
                        copy.id = UUID()
                        copy.name = routine.name + " (copia)"
                        store.data.routines.append(copy)
                    } label: { Label("Duplicar", systemImage: "plus.square.on.square") }
                    Button(role: .destructive) {
                        store.data.routines.removeAll { $0.id == routine.id }
                    } label: { Label("Eliminar", systemImage: "trash") }
                } label: {
                    Image(systemName: "ellipsis")
                        .padding(8)
                }
            }
            Text(summary.isEmpty ? "Sin ejercicios" : summary)
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(2)
            Button(action: onStart) {
                Text("Empezar rutina")
                    .font(.subheadline.bold())
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Editor de rutinas

struct RoutineEditorView: View {
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) var dismiss
    @State var routine: Routine
    let isNew: Bool
    @State var showPicker = false

    init(routine: Routine, isNew: Bool) {
        _routine = State(initialValue: routine)
        self.isNew = isNew
    }

    var existingFolders: [String] {
        Array(Set(store.data.routines.map { $0.folder }.filter { !$0.isEmpty })).sorted()
    }

    var body: some View {
        NavigationView {
            List {
                Section {
                    TextField("Nombre de la rutina", text: $routine.name)
                    TextField("Carpeta (opcional)", text: $routine.folder)
                    if !existingFolders.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack {
                                ForEach(existingFolders, id: \.self) { f in
                                    Button(f) { routine.folder = f }
                                        .buttonStyle(.bordered)
                                        .font(.caption)
                                }
                            }
                        }
                    }
                    TextField("Notas (opcional)", text: $routine.notes)
                }
                ForEach($routine.exercises) { $entry in
                    ExerciseSection(entry: $entry,
                                    isActive: false,
                                    siblings: routine.exercises,
                                    onAction: { action in routine.exercises.apply(action, to: entry.id) })
                }
                Section {
                    Button {
                        showPicker = true
                    } label: {
                        Label("Añadir ejercicio", systemImage: "plus.circle.fill")
                            .font(.headline)
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle(isNew ? "Nueva rutina" : "Editar rutina")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar") { save() }
                        .disabled(routine.name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Listo") { hideKeyboard() }
                }
            }
            .sheet(isPresented: $showPicker) {
                ExercisePickerView { ids in
                    for id in ids {
                        routine.exercises.append(store.makeEntry(for: id, setCount: 3))
                    }
                }
                .environmentObject(store)
            }
        }
    }

    func save() {
        routine.folder = routine.folder.trimmingCharacters(in: .whitespaces)
        if let i = store.data.routines.firstIndex(where: { $0.id == routine.id }) {
            store.data.routines[i] = routine
        } else {
            store.data.routines.append(routine)
        }
        dismiss()
    }
}

// MARK: - Programas predefinidos

struct ProgramTemplate: Identifiable {
    let id = UUID()
    let name: String
    let description: String
    /// (nombre de rutina, [(ejercicio, series, reps)])
    let days: [(String, [(String, Int, Int)])]
}

enum ProgramLibrary {
    static let all: [ProgramTemplate] = [
        ProgramTemplate(
            name: "Cuerpo completo 3 días",
            description: "Ideal para empezar. 3 días por semana alternando A y B.",
            days: [
                ("Cuerpo completo A", [("Sentadilla con barra", 3, 8), ("Press de banca", 3, 8), ("Remo con barra", 3, 8), ("Elevaciones laterales", 3, 12), ("Plancha", 3, 0)]),
                ("Cuerpo completo B", [("Peso muerto", 3, 5), ("Press militar con barra", 3, 8), ("Jalón al pecho", 3, 10), ("Zancadas con mancuernas", 3, 10), ("Crunch abdominal", 3, 15)]),
            ]),
        ProgramTemplate(
            name: "Torso / Pierna 4 días",
            description: "Equilibrio entre fuerza e hipertrofia. 4 días por semana.",
            days: [
                ("Torso 1", [("Press de banca", 4, 6), ("Remo con barra", 4, 6), ("Press de hombro con mancuernas", 3, 10), ("Jalón al pecho", 3, 10), ("Curl con barra", 3, 10), ("Extensión de tríceps en polea", 3, 12)]),
                ("Pierna 1", [("Sentadilla con barra", 4, 6), ("Peso muerto rumano", 3, 8), ("Prensa de piernas", 3, 10), ("Curl femoral tumbado", 3, 12), ("Elevación de talones de pie", 4, 12)]),
                ("Torso 2", [("Press inclinado con mancuernas", 4, 8), ("Remo sentado en polea", 4, 10), ("Elevaciones laterales", 4, 12), ("Face pull", 3, 15), ("Curl martillo", 3, 12), ("Press francés", 3, 10)]),
                ("Pierna 2", [("Peso muerto", 3, 5), ("Sentadilla búlgara", 3, 10), ("Hip thrust con barra", 3, 10), ("Extensión de cuádriceps", 3, 12), ("Elevación de talones sentado", 4, 15)]),
            ]),
        ProgramTemplate(
            name: "Empuje / Tirón / Pierna",
            description: "Clásico de 3 o 6 días por semana.",
            days: [
                ("Empuje", [("Press de banca", 4, 8), ("Press militar con barra", 3, 8), ("Press inclinado con mancuernas", 3, 10), ("Elevaciones laterales", 4, 12), ("Extensión de tríceps en polea", 3, 12)]),
                ("Tirón", [("Peso muerto", 3, 5), ("Dominadas", 3, 8), ("Remo con barra", 3, 8), ("Face pull", 3, 15), ("Curl con mancuernas", 3, 12)]),
                ("Pierna", [("Sentadilla con barra", 4, 8), ("Peso muerto rumano", 3, 10), ("Prensa de piernas", 3, 12), ("Curl femoral sentado", 3, 12), ("Elevación de talones de pie", 4, 15)]),
            ]),
        ProgramTemplate(
            name: "En casa con mancuernas",
            description: "Solo necesitas mancuernas y tu peso corporal.",
            days: [
                ("Casa A", [("Sentadilla goblet", 4, 12), ("Press de banca con mancuernas", 4, 10), ("Remo con mancuerna", 4, 10), ("Flexiones", 3, 15), ("Plancha", 3, 0)]),
                ("Casa B", [("Zancadas con mancuernas", 4, 10), ("Press de hombro con mancuernas", 4, 10), ("Curl con mancuernas", 3, 12), ("Extensión sobre la cabeza con mancuerna", 3, 12), ("Puente de glúteos", 3, 15)]),
            ]),
    ]
}

struct ProgramTemplatesView: View {
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) var dismiss
    @State var added: String? = nil

    var body: some View {
        NavigationView {
            List {
                ForEach(ProgramLibrary.all) { p in
                    Section {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(p.name).font(.headline)
                            Text(p.description).font(.subheadline).foregroundColor(.secondary)
                            ForEach(p.days.indices, id: \.self) { i in
                                Text("• " + p.days[i].0 + ": " + p.days[i].1.map { $0.0 }.joined(separator: ", "))
                                    .font(.caption)
                            }
                        }
                        .padding(.vertical, 4)
                        Button {
                            add(p)
                        } label: {
                            Label("Añadir a mis rutinas", systemImage: "plus")
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Programas")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Cerrar") { dismiss() }
                }
            }
            .alert("Programa añadido",
                   isPresented: Binding(get: { added != nil }, set: { if !$0 { added = nil } })) {
                Button("OK", role: .cancel) { dismiss() }
            } message: {
                Text("Encontrarás sus rutinas en la carpeta «\(added ?? "")».")
            }
        }
    }

    func add(_ p: ProgramTemplate) {
        for day in p.days {
            var r = Routine(name: day.0)
            r.folder = p.name
            for item in day.1 {
                guard let ex = store.data.exercises.first(where: { $0.name == item.0 }) else { continue }
                let sets = (0..<item.1).map { _ -> WorkoutSet in
                    var s = WorkoutSet()
                    if ex.kind == .duration { s.seconds = 45 } else { s.reps = item.2 }
                    return s
                }
                r.exercises.append(WorkoutExercise(exerciseID: ex.id, sets: sets, restSeconds: store.data.settings.defaultRest))
            }
            store.data.routines.append(r)
        }
        added = p.name
    }
}

// MARK: - Selector de ejercicios

struct ExercisePickerView: View {
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) var dismiss
    let onPick: ([UUID]) -> Void
    @State var search = ""
    @State var equipment: Equipment? = nil
    @State var selected: [UUID] = []
    @State var showNew = false

    init(onPick: @escaping ([UUID]) -> Void) {
        self.onPick = onPick
    }

    var body: some View {
        NavigationView {
            ExerciseBrowser(mode: .picker, selected: $selected, search: $search, equipment: $equipment, onDone: finish)
                .searchable(text: $search, prompt: "Buscar ejercicio")
                .navigationTitle("Añadir ejercicios")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancelar") { dismiss() }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button {
                            showNew = true
                        } label: {
                            Label("Crear ejercicio", systemImage: "plus")
                        }
                    }
                }
                .sheet(isPresented: $showNew) {
                    NewExerciseView { ex in
                        selected.append(ex.id)
                    }
                    .environmentObject(store)
                }
        }
        .navigationViewStyle(.stack)
    }

    func finish() {
        onPick(selected)
        dismiss()
    }
}

struct NewExerciseView: View {
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) var dismiss
    var onCreate: (Exercise) -> Void = { _ in }
    @State var name = ""
    @State var muscle: MuscleGroup = .chest
    @State var equipment: Equipment = .barbell
    @State var kind: ExerciseKind = .weightReps

    init(onCreate: @escaping (Exercise) -> Void = { _ in }) {
        self.onCreate = onCreate
    }

    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("Nombre del ejercicio", text: $name)
                }
                Section {
                    Picker("Músculo principal", selection: $muscle) {
                        ForEach(MuscleGroup.allCases) { m in Text(m.rawValue).tag(m) }
                    }
                    Picker("Equipamiento", selection: $equipment) {
                        ForEach(Equipment.allCases) { e in Text(e.rawValue).tag(e) }
                    }
                    Picker("Tipo de registro", selection: $kind) {
                        ForEach(ExerciseKind.allCases) { k in Text(k.rawValue).tag(k) }
                    }
                }
            }
            .navigationTitle("Nuevo ejercicio")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar") {
                        let ex = Exercise(name: name.trimmingCharacters(in: .whitespaces),
                                          muscle: muscle, equipment: equipment, kind: kind, isCustom: true)
                        store.data.exercises.append(ex)
                        onCreate(ex)
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}
