import SwiftUI
import UIKit
import AudioToolbox

struct ActiveWorkoutView: View {
    @EnvironmentObject var store: Store
    @State var showPicker = false
    @State var confirmFinish = false
    @State var confirmDiscard = false
    @State var nothingDoneAlert = false

    var workout: Binding<Workout> {
        Binding(
            get: { store.data.activeWorkout ?? Workout(name: "") },
            set: { newValue in
                if store.data.activeWorkout != nil { store.data.activeWorkout = newValue }
            }
        )
    }

    var body: some View {
        NavigationView {
            List {
                Section {
                    TextField("Nombre del entrenamiento", text: workout.name)
                        .font(.title3.weight(.semibold))
                    HStack {
                        TimelineView(.periodic(from: Date(), by: 1)) { ctx in
                            StatTile(title: "Duración",
                                     value: Fmt.clock(ctx.date.timeIntervalSince(workout.wrappedValue.start)))
                        }
                        StatTile(title: "Volumen", value: "\(Fmt.int(workout.wrappedValue.volume)) \(store.unit)")
                        StatTile(title: "Series", value: "\(workout.wrappedValue.setCount)")
                    }
                    TextField("Notas del entrenamiento", text: workout.notes)
                        .font(.subheadline)
                }

                if workout.wrappedValue.exercises.isEmpty {
                    Section {
                        VStack(spacing: 8) {
                            Image(systemName: "figure.walk")
                                .font(.largeTitle)
                                .foregroundColor(.secondary)
                            Text("Empieza añadiendo un ejercicio")
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 20)
                    }
                }

                ForEach(workout.exercises) { $entry in
                    ExerciseSection(entry: $entry,
                                    isActive: true,
                                    siblings: workout.wrappedValue.exercises,
                                    onAction: { action in
                                        store.data.activeWorkout?.exercises.apply(action, to: entry.id)
                                    },
                                    onSetCompleted: { seconds in store.startRest(seconds) })
                }
                RedundancyNote(exerciseIDs: workout.wrappedValue.exercises.map { $0.exerciseID })

                Section {
                    Button {
                        showPicker = true
                    } label: {
                        Label("Añadir ejercicio", systemImage: "plus.circle.fill")
                            .font(.headline)
                    }
                    Button(role: .destructive) {
                        confirmDiscard = true
                    } label: {
                        Label("Descartar entrenamiento", systemImage: "trash")
                    }
                    .confirmationDialog("¿Descartar este entrenamiento?",
                                        isPresented: $confirmDiscard,
                                        titleVisibility: .visible) {
                        Button("Descartar", role: .destructive) { store.discardWorkout() }
                        Button("Cancelar", role: .cancel) {}
                    } message: {
                        Text("Se perderán todas las series registradas.")
                    }
                }
            }
            .listStyle(.insetGrouped)
            .safeAreaInset(edge: .bottom) {
                RestTimerBar()
            }
            .navigationTitle("Entrenamiento")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        hideKeyboard()
                        store.showActiveWorkout = false
                    } label: {
                        Image(systemName: "chevron.down")
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Terminar") {
                        hideKeyboard()
                        confirmFinish = true
                    }
                    .font(.headline)
                }
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Listo") { hideKeyboard() }
                }
            }
            .confirmationDialog("¿Terminar el entrenamiento?",
                                isPresented: $confirmFinish,
                                titleVisibility: .visible) {
                Button("Terminar y guardar") {
                    if !store.finishWorkout() {
                        nothingDoneAlert = true
                    }
                }
                Button("Cancelar", role: .cancel) {}
            } message: {
                Text("Solo se guardarán las series marcadas como completadas.")
            }
            .sheet(isPresented: $showPicker) {
                ExercisePickerView { ids in
                    for id in ids {
                        store.data.activeWorkout?.exercises.append(store.makeEntry(for: id))
                    }
                }
                .environmentObject(store)
            }
        }
        .navigationViewStyle(.stack)
        .alert("No hay series completadas", isPresented: $nothingDoneAlert) {
            Button("Entendido", role: .cancel) {}
        } message: {
            Text("Marca al menos una serie con ✓ para guardar el entrenamiento, o descártalo.")
        }
    }
}

// MARK: - Sección de ejercicio (usada en entrenamiento y en editor de rutinas)

struct ExerciseSection: View {
    @EnvironmentObject var store: Store
    @Binding var entry: WorkoutExercise
    let isActive: Bool
    var siblings: [WorkoutExercise] = []
    var onAction: (ExerciseAction) -> Void
    var onSetCompleted: (Int) -> Void = { _ in }
    @State var showInfo = false

    var exercise: Exercise? { store.exercise(entry.exerciseID) }
    var kind: ExerciseKind { exercise?.kind ?? .weightReps }
    var previous: [WorkoutSet] { store.previousSets(for: entry.exerciseID) }

    /// Mejor marca guardada antes de este entrenamiento (0 si nunca se hizo: la primera vez no cuenta como récord).
    var recordToBeat: Double { store.bestScore(for: entry.exerciseID, kind: kind) }

    var body: some View {
        Section(header: header) {
            // También en las rutinas: la nota queda guardada para la próxima vez.
            TextField("Notas del ejercicio", text: $entry.notes)
                .font(.subheadline)
            columnHeader
            ForEach($entry.sets) { $set in
                SetEditorRow(set: $set,
                             label: label(for: set),
                             kind: kind,
                             previous: previousSet(for: set),
                             unit: store.unit,
                             showCheck: isActive,
                             recordToBeat: recordToBeat,
                             onCompleted: { onSetCompleted(entry.restSeconds) })
            }
            .onDelete { offsets in
                entry.sets.remove(atOffsets: offsets)
            }
            Button {
                addSet()
            } label: {
                Label("Añadir serie", systemImage: "plus")
                    .font(.subheadline)
            }
            .buttonStyle(.borderless)
        }
    }

    var others: [WorkoutExercise] { siblings.filter { $0.id != entry.id } }

    var header: some View {
        HStack {
            if let g = entry.supersetID {
                RoundedRectangle(cornerRadius: 2)
                    .fill(supersetColor(g))
                    .frame(width: 4, height: 30)
            }
            if let ex = exercise {
                Button {
                    showInfo = true
                } label: {
                    ExerciseThumbnail(exercise: ex, size: 36)
                }
                .buttonStyle(.borderless)
            }
            VStack(alignment: .leading, spacing: 1) {
                Button {
                    showInfo = true
                } label: {
                    Text(exercise?.name ?? "Ejercicio eliminado")
                        .font(.headline)
                        .foregroundColor(.brand)
                        .multilineTextAlignment(.leading)
                }
                .buttonStyle(.borderless)
                .sheet(isPresented: $showInfo) {
                    if let ex = exercise {
                        ExerciseInfoSheet(exercise: ex)
                            .environmentObject(store)
                    }
                }
                if let g = entry.supersetID {
                    Text("Superserie")
                        .font(.caption2.bold())
                        .foregroundColor(supersetColor(g))
                }
            }
            Spacer()
            RestTimeButton(seconds: entry.restSeconds) { s in
                entry.restSeconds = s
                store.rememberRest(s, for: entry.exerciseID)
            }
            Menu {
                if !others.isEmpty {
                    Menu("Superserie con…") {
                        ForEach(others) { o in
                            Button(store.exerciseName(o.exerciseID)) { onAction(.supersetWith(o.id)) }
                        }
                    }
                }
                if entry.supersetID != nil {
                    Button("Quitar de la superserie") { onAction(.leaveSuperset) }
                }
                Button { onAction(.moveUp) } label: { Label("Mover arriba", systemImage: "arrow.up") }
                Button { onAction(.moveDown) } label: { Label("Mover abajo", systemImage: "arrow.down") }
                Button(role: .destructive) { onAction(.remove) } label: {
                    Label("Quitar ejercicio", systemImage: "trash")
                }
            } label: {
                Image(systemName: "ellipsis.circle")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .padding(.leading, 6)
            }
        }
        .textCase(nil)
    }

    var columnHeader: some View {
        HStack(spacing: 8) {
            Text("SERIE").frame(width: 30)
            Text("ANTERIOR").frame(maxWidth: .infinity)
            switch kind {
            case .weightReps:
                Text(store.unit.uppercased()).frame(width: 64)
                Text("REPS").frame(width: 52)
            case .repsOnly:
                Text("REPS").frame(width: 64)
            case .duration:
                Text("SEG").frame(width: 64)
            case .distanceTime:
                Text("KM").frame(width: 56)
                Text("SEG").frame(width: 60)
            }
            if isActive {
                Image(systemName: "checkmark").frame(width: 30)
            }
        }
        .font(.caption2.bold())
        .foregroundColor(.secondary)
    }

    func label(for set: WorkoutSet) -> String {
        if set.type != .normal { return set.type.letter }
        var n = 0
        for s in entry.sets {
            if s.type != .warmup { n += 1 }
            if s.id == set.id { break }
        }
        return "\(n)"
    }

    func previousSet(for set: WorkoutSet) -> WorkoutSet? {
        guard let idx = entry.sets.firstIndex(where: { $0.id == set.id }) else { return nil }
        let prev = previous
        return idx < prev.count ? prev[idx] : nil
    }

    func addSet() {
        var s = WorkoutSet()
        if let last = entry.sets.last {
            s.weight = last.weight
            s.reps = last.reps
            s.seconds = last.seconds
            s.distance = last.distance
        }
        entry.sets.append(s)
    }
}

struct SetEditorRow: View {
    @Binding var set: WorkoutSet
    let label: String
    let kind: ExerciseKind
    let previous: WorkoutSet?
    let unit: String
    let showCheck: Bool
    var recordToBeat: Double = 0
    var onCompleted: () -> Void = {}

    var isRecord: Bool { self.set.done && recordToBeat > 0 && self.set.recordScore(kind) > recordToBeat }

    var body: some View {
        HStack(spacing: 8) {
            Menu {
                Section {
                    ForEach(SetType.allCases) { t in
                        Button(t.title) { set.type = t }
                    }
                }
                Menu("RPE: \(set.rpe > 0 ? Fmt.num(set.rpe) : "—")") {
                    Button("Sin RPE") { set.rpe = 0 }
                    ForEach([6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0], id: \.self) { v in
                        Button("RPE \(Fmt.num(v))") { set.rpe = v }
                    }
                }
            } label: {
                VStack(spacing: 0) {
                    Text(label)
                        .font(.subheadline.bold())
                        .foregroundColor(set.type.color)
                    if set.rpe > 0 {
                        Text("@\(Fmt.num(set.rpe))")
                            .font(.system(size: 8).bold())
                            .foregroundColor(.secondary)
                    }
                }
                .frame(width: 30, height: 30)
                .background(Color(.tertiarySystemFill))
                .cornerRadius(6)
                .overlay(alignment: .topTrailing) {
                    if isRecord {
                        Image(systemName: "medal.fill")
                            .font(.system(size: 13))
                            .foregroundColor(.yellow)
                            .shadow(radius: 1)
                            .offset(x: 6, y: -6)
                            .transition(.scale)
                            .accessibilityLabel("Récord personal")
                    }
                }
            }
            Text(previousText)
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity)
            fields
            if showCheck {
                Button(action: toggle) {
                    Image(systemName: set.done ? "checkmark.circle.fill" : "circle")
                        .font(.title2)
                        .foregroundColor(set.done ? .green : .secondary)
                        .frame(width: 30)
                }
                .buttonStyle(.borderless)
            }
        }
        .listRowBackground(isRecord ? Color.yellow.opacity(0.22)
                           : set.done ? Color.green.opacity(0.15) : Color(.secondarySystemGroupedBackground))
    }

    @ViewBuilder
    var fields: some View {
        switch kind {
        case .weightReps:
            NumberField(previous.map { Fmt.num($0.weight) } ?? "0", value: $set.weight)
                .frame(width: 64)
            NumberField(previous.map { "\($0.reps)" } ?? "0", value: $set.reps.asDouble, allowsDecimal: false)
                .frame(width: 52)
        case .repsOnly:
            NumberField(previous.map { "\($0.reps)" } ?? "0", value: $set.reps.asDouble, allowsDecimal: false)
                .frame(width: 64)
        case .duration:
            NumberField(previous.map { "\($0.seconds)" } ?? "0", value: $set.seconds.asDouble, allowsDecimal: false)
                .frame(width: 64)
        case .distanceTime:
            NumberField(previous.map { Fmt.num($0.distance) } ?? "0", value: $set.distance)
                .frame(width: 56)
            NumberField(previous.map { "\($0.seconds)" } ?? "0", value: $set.seconds.asDouble, allowsDecimal: false)
                .frame(width: 60)
        }
    }

    var previousText: String {
        guard let p = previous else { return "—" }
        switch kind {
        case .weightReps: return "\(Fmt.num(p.weight)) \(unit) × \(p.reps)"
        case .repsOnly: return "\(p.reps) reps"
        case .duration: return Fmt.clock(TimeInterval(p.seconds))
        case .distanceTime: return "\(Fmt.num(p.distance)) km · \(Fmt.clock(TimeInterval(p.seconds)))"
        }
    }

    func toggle() {
        if !set.done, let p = previous {
            if set.weight == 0 { set.weight = p.weight }
            if set.reps == 0 { set.reps = p.reps }
            if set.seconds == 0 { set.seconds = p.seconds }
            if set.distance == 0 { set.distance = p.distance }
        }
        withAnimation(.spring()) { set.done.toggle() }
        if set.done {
            hideKeyboard()
            if isRecord {
                AudioServicesPlaySystemSound(1025) // fanfarria del sistema
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            } else {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            }
            onCompleted()
        }
    }
}

// MARK: - Temporizador de descanso

struct RestTimerBar: View {
    @EnvironmentObject var store: Store

    var body: some View {
        ZStack {
            if let end = store.restEnd {
                TimelineView(.animation) { ctx in
                    RestTimerContent(end: end, now: ctx.date)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.spring(response: 0.45, dampingFraction: 0.85), value: store.restEnd != nil)
    }
}

struct RestTimerContent: View {
    @EnvironmentObject var store: Store
    let end: Date
    let now: Date

    var remaining: Double { max(0, end.timeIntervalSince(now)) }
    var total: Double { Double(max(store.restTotal, 1)) }
    var progress: Double { min(1, max(0, remaining / total)) }

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .stroke(Color.brand.opacity(0.18), lineWidth: 6)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(AngularGradient(gradient: Gradient(colors: [Color.brand.opacity(0.7), Color.brand]),
                                            center: .center),
                            style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Image(systemName: "timer")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.brand)
            }
            .frame(width: 48, height: 48)

            VStack(alignment: .leading, spacing: 0) {
                Text("Descanso")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(Fmt.clock(remaining.rounded(.up)))
                    .font(.system(size: 30, weight: .bold, design: .rounded).monospacedDigit())
            }

            Spacer(minLength: 4)

            HStack(spacing: 8) {
                RestPill(title: "−15") { store.adjustRest(-15) }
                RestPill(title: "+15") { store.adjustRest(15) }
                Button {
                    withAnimation(.easeInOut(duration: 0.25)) { store.skipRest() }
                } label: {
                    Image(systemName: "forward.end.fill")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 42, height: 42)
                        .background(Circle().fill(Color.brand))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(.regularMaterial)
                .shadow(color: Color.black.opacity(0.18), radius: 16, x: 0, y: 6)
        )
        .padding(.horizontal, 12)
        .padding(.bottom, 6)
        .onChange(of: remaining <= 0) { finished in
            if finished {
                UINotificationFeedbackGenerator().notificationOccurred(.success)
                withAnimation(.easeInOut(duration: 0.3)) { store.skipRest() }
            }
        }
    }
}

struct RestPill: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundColor(.primary)
                .frame(width: 46, height: 42)
                .background(Capsule().fill(Color(.tertiarySystemFill)))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Resumen al terminar

struct WorkoutSummaryView: View {
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) var dismiss
    let workout: Workout
    @State private var ratings: [String: Double] = [:]

    func saveRatings() {
        guard let i = store.data.workouts.firstIndex(where: { $0.id == workout.id }) else { return }
        let answered = ratings.filter { $0.value > 0 }
        store.data.workouts[i].ratings = answered.isEmpty ? nil : answered
    }

    var prs: [WorkoutExercise] {
        workout.exercises.filter { store.isPR($0, in: workout) }
    }

    var body: some View {
        NavigationView {
            List {
                Section {
                    VStack(spacing: 10) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 54))
                            .foregroundColor(.brand)
                        Text("¡Buen trabajo!")
                            .font(.title.bold())
                        Text("Has completado tu entrenamiento nº \(store.data.workouts.count)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    HStack {
                        StatTile(title: "Duración", value: Fmt.duration(workout.duration))
                        StatTile(title: "Volumen", value: "\(Fmt.int(workout.volume)) \(store.unit)")
                        StatTile(title: "Series", value: "\(workout.setCount)")
                    }
                }
                Section(header: Text("¿Cómo te fue? (opcional)")) {
                    ForEach(WorkoutRating.questions, id: \.key) { q in
                        HStack {
                            Text(LocalizedStringKey(q.title)).font(.subheadline)
                            Spacer()
                            StarRating(value: Binding(
                                get: { ratings[q.key] ?? 0 },
                                set: { ratings[q.key] = $0; saveRatings() }))
                        }
                    }
                }
                .onAppear { ratings = workout.ratings ?? [:] }
                if !prs.isEmpty {
                    Section(header: Text("Récords personales")) {
                        ForEach(prs) { e in
                            HStack {
                                Image(systemName: "trophy.fill").foregroundColor(.yellow)
                                Text(store.exerciseName(e.exerciseID))
                                Spacer()
                                Text("1RM ≈ \(Fmt.num(e.bestE1RM.rounded())) \(store.unit)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
                Section(header: Text("Ejercicios")) {
                    ForEach(workout.exercises) { e in
                        HStack {
                            Text(store.exerciseName(e.exerciseID))
                            Spacer()
                            Text("\(e.sets.count) series").foregroundColor(.secondary)
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Resumen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cerrar") { dismiss() }
                }
            }
        }
    }
}
