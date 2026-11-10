import SwiftUI
import WebKit

// MARK: - Intensidad por músculo

extension MuscleGroup {
    /// Clave que entiende el modelo 3D (FORJA3D.bodyMap).
    var mapKey: String? {
        switch self {
        case .chest: return "chest"
        case .back: return "back"
        case .shoulders: return "shoulders"
        case .biceps: return "biceps"
        case .triceps: return "triceps"
        case .forearms: return "forearms"
        case .quads: return "quads"
        case .hamstrings: return "hamstrings"
        case .glutes: return "glutes"
        case .calves: return "calves"
        case .core: return "core"
        case .lats: return "lats"
        case .upperBack: return "upperBack"
        case .lowerBack: return "lowerBack"
        case .traps: return "traps"
        case .obliques: return "obliques"
        case .abductors: return "abductors"
        case .adductors: return "adductors"
        case .neck: return "neck"
        case .cardio, .fullBody: return nil
        }
    }

    /// Músculos que también trabajan como ayudantes (fracción del trabajo).
    var helpers: [(MuscleGroup, Double)] {
        switch self {
        case .chest: return [(.triceps, 0.5), (.shoulders, 0.4)]
        case .back: return [(.biceps, 0.5), (.forearms, 0.3), (.shoulders, 0.2)]
        case .shoulders: return [(.triceps, 0.3)]
        case .biceps: return [(.forearms, 0.4)]
        case .triceps: return [(.chest, 0.15)]
        case .quads: return [(.glutes, 0.5), (.hamstrings, 0.2), (.core, 0.2)]
        case .hamstrings: return [(.glutes, 0.5), (.back, 0.2)]
        case .glutes: return [(.hamstrings, 0.4), (.quads, 0.2)]
        case .calves: return []
        case .core: return []
        case .forearms: return []
        case .fullBody: return [(.quads, 0.5), (.glutes, 0.5), (.back, 0.5), (.shoulders, 0.4), (.core, 0.4), (.hamstrings, 0.3)]
        case .cardio: return [(.quads, 0.3), (.calves, 0.3), (.hamstrings, 0.2), (.glutes, 0.2)]
        case .lats: return [(.biceps, 0.5), (.upperBack, 0.3), (.forearms, 0.2)]
        case .upperBack: return [(.biceps, 0.4), (.lats, 0.3), (.shoulders, 0.3), (.traps, 0.2)]
        case .lowerBack: return [(.glutes, 0.4), (.hamstrings, 0.3)]
        case .traps: return [(.forearms, 0.3), (.upperBack, 0.2)]
        case .obliques: return [(.core, 0.5)]
        case .abductors: return [(.glutes, 0.4)]
        case .adductors: return [(.quads, 0.2)]
        case .neck: return []
        }
    }
}

extension Store {
    /// Intensidad (0…1) de cada músculo según las series efectivas de unos entrenamientos.
    func muscleIntensities(for workouts: [Workout]) -> [String: Double] {
        var raw: [MuscleGroup: Double] = [:]
        for w in workouts {
            for e in w.exercises {
                guard let ex = exercise(e.exerciseID) else { continue }
                let sets = Double(e.sets.filter { $0.type != .warmup }.count)
                guard sets > 0 else { continue }
                if ex.muscle.mapKey != nil { raw[ex.muscle, default: 0] += sets }
                for (helper, share) in ex.muscle.helpers {
                    raw[helper, default: 0] += sets * share
                }
            }
        }
        let maxV = raw.values.max() ?? 0
        guard maxV > 0 else { return [:] }
        var out: [String: Double] = [:]
        for (m, v) in raw {
            if let key = m.mapKey { out[key] = min(1, v / maxV) }
        }
        return out
    }
}

/// Tarjeta con el mapa muscular y la lista de músculos más trabajados.
struct MuscleMapCard: View {
    @EnvironmentObject var store: Store
    let workouts: [Workout]

    var stats: [MuscleStat] { store.muscleSets(in: workouts) }
    var intensities: [String: Double] { store.muscleIntensities(for: workouts) }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if intensities.isEmpty {
                Text("Aún no hay series para pintar.").foregroundColor(.secondary)
            } else {
                MuscleMapView(intensities: intensities)
                    .aspectRatio(1.5, contentMode: .fit)
                    .frame(maxWidth: .infinity)
                HStack(spacing: 6) {
                    Text("Menos").font(.caption2).foregroundColor(.secondary)
                    LinearGradient(colors: [Color.brand.opacity(0.15), Color.brand], startPoint: .leading, endPoint: .trailing)
                        .frame(height: 6)
                        .clipShape(Capsule())
                    Text("Más").font(.caption2).foregroundColor(.secondary)
                }
                FlowChips(items: stats.prefix(8).map { "\($0.muscle.rawValue) · \($0.sets)" })
            }
        }
        .padding(.vertical, 6)
    }
}

/// Etiquetas en varias líneas.
struct FlowChips: View {
    let items: [String]

    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 110), spacing: 6)], alignment: .leading, spacing: 6) {
            ForEach(items, id: \.self) { t in
                Text(t)
                    .font(.caption.weight(.semibold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Capsule().fill(Color.brand.opacity(0.14)))
                    .foregroundColor(.brand)
                    .lineLimit(1)
            }
        }
    }
}
