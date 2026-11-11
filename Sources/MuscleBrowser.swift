import SwiftUI
import UIKit

// MARK: - Grupos musculares con imagen 3D

extension MuscleGroup {
    /// Orden en el que se muestran los grupos.
    static let browseOrder: [MuscleGroup] = [.chest, .shoulders, .back, .lats, .upperBack, .lowerBack, .traps,
                                              .biceps, .triceps, .forearms, .core, .obliques,
                                              .quads, .hamstrings, .glutes, .adductors, .calves,
                                              .neck, .fullBody, .cardio]

    /// Músculos que incluye este grupo al explorar (Espalda reúne todas sus partes).
    var browseMembers: Set<MuscleGroup> {
        switch self {
        case .back: return [.back, .lats, .upperBack, .lowerBack, .traps]
        default: return [self]
        }
    }

    /// Imagen provisional mientras no exista la del grupo.
    var fallbackImageName: String {
        switch self {
        case .lats, .upperBack, .lowerBack, .traps: return "muscle_back"
        case .obliques: return "muscle_core"
        case .abductors: return "muscle_glutes"
        case .adductors: return "muscle_quads"
        case .neck: return "muscle_shoulders"
        default: return "muscle_fullBody"
        }
    }

    var imageName: String {
        switch self {
        case .chest: return "muscle_chest"
        case .back: return "muscle_back"
        case .shoulders: return "muscle_shoulders"
        case .biceps: return "muscle_biceps"
        case .triceps: return "muscle_triceps"
        case .forearms: return "muscle_forearms"
        case .quads: return "muscle_quads"
        case .hamstrings: return "muscle_hamstrings"
        case .glutes: return "muscle_glutes"
        case .calves: return "muscle_calves"
        case .core: return "muscle_core"
        case .cardio: return "muscle_cardio"
        case .fullBody: return "muscle_fullBody"
        case .lats: return "muscle_lats"
        case .upperBack: return "muscle_upperBack"
        case .lowerBack: return "muscle_lowerBack"
        case .traps: return "muscle_traps"
        case .obliques: return "muscle_obliques"
        case .abductors: return "muscle_abductors"
        case .adductors: return "muscle_adductors"
        case .neck: return "muscle_neck"
        }
    }
}

extension Equipment {
    var shortName: String {
        switch self {
        case .barbell: return "Barra"
        case .dumbbell: return "Mancuernas"
        case .machine: return "Máquina"
        case .cable: return "Polea"
        case .bodyweight: return "Peso corporal"
        case .kettlebell: return "Kettlebell"
        case .band: return "Banda"
        case .other: return "Otro"
        }
    }

    var icon: String {
        switch self {
        case .barbell: return "minus"
        case .dumbbell: return "scalemass"
        case .machine: return "gearshape"
        case .cable: return "point.topleft.down.curvedto.point.bottomright.up"
        case .bodyweight: return "figure.walk"
        case .kettlebell: return "bag"
        case .band: return "lasso"
        case .other: return "ellipsis.circle"
        }
    }
}

/// Imagen del modelo 3D con el músculo resaltado (pre-renderizada).
struct MuscleImage: View {
    let muscle: MuscleGroup
    var fit = false

    static var cache: [String: UIImage] = [:]

    var image: UIImage? {
        let name = muscle.imageName
        if let img = MuscleImage.cache[name] { return img }
        for candidate in [name, muscle.fallbackImageName] {
            if let path = Bundle.main.path(forResource: candidate, ofType: "jpg"),
               let img = UIImage(contentsOfFile: path) {
                MuscleImage.cache[name] = img
                return img
            }
        }
        return nil
    }

    var body: some View {
        ZStack {
            Color(red: 0.11, green: 0.12, blue: 0.14)
            if let img = image {
                Image(uiImage: img)
                    .resizable()
                    .interpolation(.high)
                    .aspectRatio(contentMode: fit ? .fit : .fill)
            } else {
                Image(systemName: "figure.walk").font(.largeTitle).foregroundColor(.gray)
            }
        }
    }
}

// MARK: - Filtro de equipamiento

struct EquipmentFilterBar: View {
    @Binding var equipment: Equipment?

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                chip(title: "Todo", icon: "square.grid.2x2", active: equipment == nil) { equipment = nil }
                ForEach(Equipment.allCases) { e in
                    chip(title: e.shortName, icon: e.icon, active: equipment == e) {
                        equipment = (equipment == e) ? nil : e
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 4)
        }
    }

    func chip(title: String, icon: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: {
            withAnimation(.easeInOut(duration: 0.15)) { action() }
        }) {
            HStack(spacing: 5) {
                Image(systemName: icon).font(.caption.weight(.semibold))
                Text(title).font(.subheadline.weight(.semibold))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .foregroundColor(active ? .white : .primary)
            .background(Capsule().fill(active ? Color.brand : Color(.secondarySystemBackground)))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Explorador (biblioteca y selector)

enum ExerciseBrowseMode {
    case library
    case picker
}

struct ExerciseBrowser: View {
    @EnvironmentObject var store: Store
    let mode: ExerciseBrowseMode
    @Binding var selected: [UUID]
    @Binding var search: String
    @Binding var equipment: Equipment?
    var onDone: () -> Void = {}

    let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    func exercises(_ muscle: MuscleGroup?) -> [Exercise] {
        store.data.exercises
            .filter { muscle == nil || muscle!.browseMembers.contains($0.muscle) }
            .filter { equipment == nil || $0.equipment == equipment }
            .sorted(by: ExerciseSeed.popularFirst)
    }

    var searchResults: [Exercise] {
        let q = KnowledgeBase.normalize(search)
        return store.data.exercises
            .filter { equipment == nil || $0.equipment == equipment }
            .filter { KnowledgeBase.normalize($0.name + " " + $0.muscle.rawValue).contains(q) }
            .sorted(by: ExerciseSeed.popularFirst)
    }

    var recent: [Exercise] {
        var seen: [UUID] = []
        for w in store.data.workouts.prefix(10) {
            for e in w.exercises where !seen.contains(e.exerciseID) { seen.append(e.exerciseID) }
        }
        return seen.prefix(5).compactMap { store.exercise($0) }
            .filter { equipment == nil || $0.equipment == equipment }
    }

    var body: some View {
        Group {
            if !search.trimmingCharacters(in: .whitespaces).isEmpty {
                List {
                    Section {
                        EquipmentFilterBar(equipment: $equipment)
                            .listRowInsets(EdgeInsets())
                            .listRowBackground(Color.clear)
                    }
                    Section(header: Text("\(searchResults.count) resultados")) {
                        if searchResults.isEmpty {
                            Text("No hay ejercicios con ese nombre.").foregroundColor(.secondary)
                        }
                        ForEach(searchResults) { ex in row(ex) }
                    }
                }
                .listStyle(.insetGrouped)
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        EquipmentFilterBar(equipment: $equipment)
                            .padding(.horizontal, -16)

                        if mode == .picker && !recent.isEmpty {
                            Text("Recientes").font(.headline)
                            VStack(spacing: 0) {
                                ForEach(recent) { ex in
                                    pickButton(ex)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                    if ex.id != recent.last?.id { Divider().padding(.leading, 72) }
                                }
                            }
                            .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Color(.secondarySystemBackground)))
                        }

                        Text("Grupos musculares").font(.headline)
                        LazyVGrid(columns: columns, spacing: 12) {
                            ForEach(MuscleGroup.browseOrder) { m in
                                let count = exercises(m).count
                                NavigationLink(destination: MuscleExerciseList(muscle: m, mode: mode, selected: $selected,
                                                                               equipment: $equipment, onDone: onDone)) {
                                    MuscleCard(title: m.rawValue, muscle: m, count: count)
                                }
                                .buttonStyle(.plain)
                                .opacity(count == 0 ? 0.45 : 1)
                            }
                            NavigationLink(destination: MuscleExerciseList(muscle: nil, mode: mode, selected: $selected,
                                                                           equipment: $equipment, onDone: onDone)) {
                                MuscleCard(title: "Todos", muscle: .fullBody, count: exercises(nil).count, allCard: true)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(16)
                    .padding(.bottom, mode == .picker ? 70 : 0)
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            if mode == .picker && !selected.isEmpty {
                AddSelectedBar(count: selected.count, onDone: onDone)
            }
        }
    }

    @ViewBuilder
    func row(_ ex: Exercise) -> some View {
        if mode == .library {
            NavigationLink(destination: ExerciseDetailView(exerciseID: ex.id)) {
                ExerciseRow(exercise: ex, selected: false)
            }
        } else {
            pickButton(ex)
        }
    }

    func pickButton(_ ex: Exercise) -> some View {
        Button {
            toggle(ex.id)
        } label: {
            ExerciseRow(exercise: ex, selected: selected.contains(ex.id))
        }
        .buttonStyle(.plain)
    }

    func toggle(_ id: UUID) {
        if let i = selected.firstIndex(of: id) { selected.remove(at: i) } else { selected.append(id) }
    }
}

struct MuscleCard: View {
    let title: String
    let muscle: MuscleGroup
    let count: Int
    var allCard = false

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            MuscleImage(muscle: muscle)
                .aspectRatio(1, contentMode: .fill)
                .overlay(allCard ? Color.brand.opacity(0.35) : Color.clear)
            LinearGradient(colors: [.clear, .black.opacity(0.75)], startPoint: .center, endPoint: .bottom)
            VStack(alignment: .leading, spacing: 1) {
                Text(title).font(.headline).foregroundColor(.white)
                Text(count == 1 ? "1 ejercicio" : "\(count) ejercicios")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.8))
            }
            .padding(10)
        }
        .aspectRatio(1, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .contentShape(Rectangle())
    }
}

struct AddSelectedBar: View {
    let count: Int
    let onDone: () -> Void

    var body: some View {
        Button(action: onDone) {
            Text(count == 1 ? "Añadir 1 ejercicio" : "Añadir \(count) ejercicios")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Color.brand))
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(.bar)
    }
}

/// Ejercicios de un grupo muscular (o todos), con filtro de equipamiento.
struct MuscleExerciseList: View {
    @EnvironmentObject var store: Store
    let muscle: MuscleGroup?
    let mode: ExerciseBrowseMode
    @Binding var selected: [UUID]
    @Binding var equipment: Equipment?
    var onDone: () -> Void = {}
    @State var search = ""

    var items: [Exercise] {
        let q = KnowledgeBase.normalize(search)
        return store.data.exercises
            .filter { muscle == nil || muscle!.browseMembers.contains($0.muscle) }
            .filter { equipment == nil || $0.equipment == equipment }
            .filter { search.isEmpty || KnowledgeBase.normalize($0.name).contains(q) }
            .sorted(by: ExerciseSeed.popularFirst)
    }

    var body: some View {
        List {
            if let m = muscle {
                Section {
                    // Entera (sin recortar) y del tamaño de la imagen, para que no se corte ni se vea borrosa.
                    MuscleImage(muscle: m, fit: true)
                        .frame(height: 240)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                }
            }
            Section {
                EquipmentFilterBar(equipment: $equipment)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
            }
            Section(header: Text(items.count == 1 ? "1 ejercicio" : "\(items.count) ejercicios")) {
                if items.isEmpty {
                    Text("No hay ejercicios con este equipamiento.").foregroundColor(.secondary)
                }
                ForEach(items) { ex in
                    if mode == .library {
                        NavigationLink(destination: ExerciseDetailView(exerciseID: ex.id)) {
                            ExerciseRow(exercise: ex, selected: false)
                        }
                    } else {
                        Button {
                            if let i = selected.firstIndex(of: ex.id) { selected.remove(at: i) } else { selected.append(ex.id) }
                        } label: {
                            ExerciseRow(exercise: ex, selected: selected.contains(ex.id))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .searchable(text: $search, prompt: muscle == nil ? "Buscar ejercicio" : "Buscar en \(muscle!.rawValue.lowercased())")
        .navigationTitle(muscle?.rawValue ?? "Todos los ejercicios")
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            if mode == .picker && !selected.isEmpty {
                AddSelectedBar(count: selected.count, onDone: onDone)
            }
        }
    }
}
