import Foundation

/// Reconoce un ejercicio por su nombre (español o inglés, con o sin el equipo entre paréntesis)
/// y devuelve el ejercicio equivalente de la biblioteca de Forja.
/// La tabla está en Resources/exercise_concepts.json (la misma que se prueba fuera de la app).
enum ExerciseMatcher {
    struct Concept: Decodable {
        let alts: [[String]]
        let not: [String]?
        let rules: [[String]]?
        let name: String
    }

    static let concepts: [Concept] = {
        guard let url = Bundle.main.url(forResource: "exercise_concepts", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let list = try? JSONDecoder().decode([Concept].self, from: data) else { return [] }
        return list
    }()

    private static let equipmentWords: [(Equipment, [String])] = [
        (.barbell, ["barbell", "barra", "ez bar", "olympic", "olimpica"]),
        (.dumbbell, ["dumbbell", "mancuerna", "db"]),
        (.machine, ["machine", "maquina", "smith", "hammer strength", "iso lateral", "isolateral", "plate loaded"]),
        (.cable, ["cable", "polea"]),
        (.band, ["band", "banda", "elastic", "elastica", "liga"]),
        (.kettlebell, ["kettlebell", "pesa rusa", "kb"]),
        (.bodyweight, ["bodyweight", "peso corporal", "sin peso", "body weight", "calistenia"]),
    ]

    private static var cache: [String: String?] = [:]

    static func normalize(_ s: String) -> String {
        let folded = s.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: Locale(identifier: "es_ES")).lowercased()
        var out = ""
        var lastSpace = true
        for ch in folded {
            if ch.isLetter || ch.isNumber {
                out.append(ch)
                lastSpace = false
            } else if !lastSpace {
                out.append(" ")
                lastSpace = true
            }
        }
        return out.trimmingCharacters(in: .whitespaces)
    }

    static func detectEquipment(_ n: String) -> Equipment? {
        let padded = " " + n + " "
        for (eq, words) in equipmentWords {
            for w in words where padded.contains(" " + w + " ") || (w.count > 4 && n.contains(w)) {
                return eq
            }
        }
        return nil
    }

    private static func holds(_ condition: String, _ n: String, _ eq: Equipment?) -> Bool {
        for alt in condition.split(separator: "|") {
            var all = true
            for part in alt.split(separator: "+").map(String.init) {
                if part.hasPrefix("eq:") {
                    let want = String(part.dropFirst(3))
                    let ok = want == "none" ? eq == nil : eq.map { equipmentKey($0) == want } ?? false
                    if !ok { all = false; break }
                } else if !n.contains(normalize(part)) {
                    all = false
                    break
                }
            }
            if all { return true }
        }
        return false
    }

    private static func equipmentKey(_ e: Equipment) -> String {
        switch e {
        case .barbell: return "barbell"
        case .dumbbell: return "dumbbell"
        case .machine: return "machine"
        case .cable: return "cable"
        case .band: return "band"
        case .kettlebell: return "kettlebell"
        case .bodyweight: return "bodyweight"
        case .other: return "other"
        }
    }

    /// Nombre del ejercicio de la biblioteca de Forja que corresponde a este título (o nil).
    static func catalogName(for title: String) -> String? {
        if let hit = cache[title] { return hit }
        let n = normalize(title)
        let eq = detectEquipment(n)
        var result: String? = nil
        for c in concepts {
            guard c.alts.contains(where: { alt in alt.allSatisfy { n.contains(normalize($0)) } }) else { continue }
            if let not = c.not, not.contains(where: { n.contains(normalize($0)) }) { continue }
            result = c.name
            for rule in c.rules ?? [] where rule.count == 2 && holds(rule[0], n, eq) {
                result = rule[1]
                break
            }
            break
        }
        cache[title] = result
        return result
    }
}
