import SwiftUI
import UIKit

// MARK: - Modelo del chat

struct CoachMessage: Identifiable, Codable, Equatable {
    var id = UUID()
    var role: String   // "user" o "model"
    var text: String
    var date = Date()
}

struct CoachRoutineProposal: Identifiable, Equatable {
    let id = UUID()
    let name: String
    let items: [(name: String, sets: Int, reps: Int, rest: Int)]

    static func == (a: CoachRoutineProposal, b: CoachRoutineProposal) -> Bool { a.id == b.id }
}

enum CoachConfig {
    static let endpoint = URL(string: "https://forja-coach.apolofachero.workers.dev/chat")!

    static var deviceID: String {
        if let id = UserDefaults.standard.string(forKey: "coachDeviceID") { return id }
        let id = UUID().uuidString
        UserDefaults.standard.set(id, forKey: "coachDeviceID")
        return id
    }
}

@MainActor
final class CoachModel: ObservableObject {
    @Published var messages: [CoachMessage] = []
    @Published var sending = false
    @Published var remaining: Int? = nil
    @Published var errorText: String? = nil

    private let storeKey = "coachHistory"

    init() {
        if let raw = UserDefaults.standard.data(forKey: storeKey),
           let saved = try? JSONDecoder().decode([CoachMessage].self, from: raw) {
            messages = saved
        }
    }

    func persist() {
        let recent = Array(messages.suffix(60))
        if let raw = try? JSONEncoder().encode(recent) {
            UserDefaults.standard.set(raw, forKey: storeKey)
        }
    }

    func reset() {
        messages = []
        errorText = nil
        persist()
    }

    func send(_ text: String, context: String) async {
        let question = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !question.isEmpty, !sending else { return }
        errorText = nil
        messages.append(CoachMessage(role: "user", text: question))
        persist()
        sending = true
        defer { sending = false }

        var req = URLRequest(url: CoachConfig.endpoint)
        req.httpMethod = "POST"
        req.timeoutInterval = 60
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("forja-ios", forHTTPHeaderField: "X-Forja-App")
        req.setValue(CoachConfig.deviceID, forHTTPHeaderField: "X-Forja-Device")
        let payload: [String: Any] = [
            "messages": messages.suffix(16).map { ["role": $0.role, "text": $0.text] },
            "context": context,
        ]
        req.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        do {
            let (data, _) = try await URLSession.shared.data(for: req)
            let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
            if let r = json["remaining"] as? Int { remaining = r }
            if let reply = json["reply"] as? String, !reply.isEmpty {
                messages.append(CoachMessage(role: "model", text: reply))
                persist()
            } else {
                errorText = (json["message"] as? String) ?? "El Coach no ha podido responder. Inténtalo de nuevo."
            }
        } catch {
            errorText = "Sin conexión. Revisa tu internet e inténtalo otra vez."
        }
    }

    // MARK: Rutinas propuestas por el Coach

    static func proposals(in text: String) -> [CoachRoutineProposal] {
        var result: [CoachRoutineProposal] = []
        let parts = text.components(separatedBy: "```forja-routine")
        for part in parts.dropFirst() {
            guard let end = part.range(of: "```") else { continue }
            let body = String(part[part.startIndex..<end.lowerBound]).trimmingCharacters(in: .whitespacesAndNewlines)
            guard let raw = body.data(using: .utf8),
                  let obj = (try? JSONSerialization.jsonObject(with: raw)) as? [String: Any] else { continue }
            let name = (obj["name"] as? String) ?? "Rutina del Coach"
            let list = (obj["exercises"] as? [[String: Any]]) ?? []
            let items = list.compactMap { e -> (name: String, sets: Int, reps: Int, rest: Int)? in
                guard let n = e["name"] as? String else { return nil }
                return (n, max(1, (e["sets"] as? Int) ?? 3), max(0, (e["reps"] as? Int) ?? 10), max(0, (e["rest"] as? Int) ?? 90))
            }
            if !items.isEmpty { result.append(CoachRoutineProposal(name: name, items: items)) }
        }
        return result
    }

    /// Texto sin los bloques técnicos de rutina.
    static func displayText(_ text: String) -> String {
        var out = text
        while let start = out.range(of: "```forja-routine") {
            if let end = out.range(of: "```", range: start.upperBound..<out.endIndex) {
                out.removeSubrange(start.lowerBound..<end.upperBound)
            } else {
                out.removeSubrange(start.lowerBound..<out.endIndex)
            }
        }
        return out.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

// MARK: - Contexto del usuario para el Coach

extension Store {
    func coachContext() -> String {
        var lines: [String] = []
        lines.append("Unidad de peso: \(unit). Objetivo semanal: \(data.settings.weeklyGoal) entrenamientos. Racha: \(weekStreak()) semanas.")
        lines.append("Entrenamientos registrados: \(data.workouts.count).")

        let recent = data.workouts.prefix(6)
        if !recent.isEmpty {
            lines.append("Últimos entrenamientos:")
            for w in recent {
                let ex = w.exercises.map { e -> String in
                    let best = e.sets.max { $0.estimated1RM < $1.estimated1RM }
                    let bestText = best.map { $0.weight > 0 ? "\(Fmt.num($0.weight))×\($0.reps)" : "\($0.reps) reps" } ?? ""
                    return "\(exerciseName(e.exerciseID)) (\(e.sets.count) series, mejor \(bestText))"
                }.joined(separator: "; ")
                lines.append("- \(Fmt.shortDate(w.start)) «\(w.name)»: \(ex)")
            }
        }

        var bests: [(String, Double)] = []
        var seen = Set<UUID>()
        for w in data.workouts {
            for e in w.exercises where !seen.contains(e.exerciseID) {
                seen.insert(e.exerciseID)
                let best = history(for: e.exerciseID).map { $0.entry.bestE1RM }.max() ?? 0
                if best > 0 { bests.append((exerciseName(e.exerciseID), best)) }
            }
        }
        if !bests.isEmpty {
            lines.append("1RM estimados: " + bests.sorted { $0.1 > $1.1 }.prefix(12)
                .map { "\($0.0) \(Fmt.num($0.1.rounded())) \(unit)" }.joined(separator: ", "))
        }

        if let m = data.measurements.first(where: { $0.weight > 0 }) {
            lines.append("Peso corporal: \(Fmt.num(m.weight)) \(unit).")
        }

        let names = data.exercises.map { $0.name }.sorted().joined(separator: "; ")
        lines.append("Biblioteca de ejercicios disponible (usa estos nombres exactos en las rutinas): \(names)")
        return lines.joined(separator: "\n")
    }

    func saveCoachRoutine(_ p: CoachRoutineProposal) -> Int {
        var routine = Routine(name: p.name)
        routine.folder = "Coach"
        var added = 0
        for item in p.items {
            let lower = item.name.lowercased()
            let match = data.exercises.first { $0.name.lowercased() == lower }
                ?? data.exercises.first { $0.name.lowercased().contains(lower) || lower.contains($0.name.lowercased()) }
            guard let ex = match else { continue }
            let sets = (0..<item.sets).map { _ -> WorkoutSet in
                var s = WorkoutSet()
                if ex.kind == .duration { s.seconds = max(item.reps, 30) } else { s.reps = item.reps }
                return s
            }
            routine.exercises.append(WorkoutExercise(exerciseID: ex.id, sets: sets, restSeconds: item.rest > 0 ? item.rest : data.settings.defaultRest))
            added += 1
        }
        if added > 0 { data.routines.append(routine) }
        return added
    }
}

// MARK: - Pantalla del Coach

struct CoachView: View {
    @EnvironmentObject var store: Store
    @StateObject var model = CoachModel()
    @State var input = ""
    @State var savedMessage: String? = nil
    @State var confirmReset = false

    let suggestions = [
        "¿Cómo mejoro mi press de banca?",
        "Hazme una rutina de 4 días para ganar músculo",
        "¿Cuánto debo descansar entre series?",
        "Analiza mis últimos entrenamientos",
        "¿Qué hago si me estanco en sentadilla?",
        "Calentamiento antes de pierna",
    ]

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 12) {
                            if model.messages.isEmpty {
                                welcome
                            }
                            ForEach(model.messages) { m in
                                CoachBubble(message: m) { p in
                                    let n = store.saveCoachRoutine(p)
                                    savedMessage = n > 0
                                        ? "Rutina «\(p.name)» guardada con \(n) ejercicios en Entrenar → carpeta Coach."
                                        : "No encontré esos ejercicios en tu biblioteca."
                                }
                                .id(m.id)
                            }
                            if model.sending {
                                HStack(spacing: 8) {
                                    ProgressView()
                                    Text("El Coach está pensando…")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                }
                                .padding(.horizontal)
                                .id("typing")
                            }
                            if let err = model.errorText {
                                Label(err, systemImage: "exclamationmark.triangle.fill")
                                    .font(.subheadline)
                                    .foregroundColor(.orange)
                                    .padding(.horizontal)
                                    .id("error")
                            }
                            Color.clear.frame(height: 4).id("bottom")
                        }
                        .padding(.vertical, 12)
                    }
                    .onChange(of: model.messages.count) { _ in
                        withAnimation(.easeOut(duration: 0.25)) { proxy.scrollTo("bottom", anchor: .bottom) }
                    }
                    .onChange(of: model.sending) { _ in
                        withAnimation(.easeOut(duration: 0.25)) { proxy.scrollTo("bottom", anchor: .bottom) }
                    }
                    .onAppear { proxy.scrollTo("bottom", anchor: .bottom) }
                }
                inputBar
            }
            .navigationTitle("Coach")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    if let r = model.remaining {
                        Text("\(r) restantes hoy")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        confirmReset = true
                    } label: {
                        Image(systemName: "square.and.pencil")
                    }
                    .disabled(model.messages.isEmpty)
                }
            }
            .confirmationDialog("¿Empezar una conversación nueva?", isPresented: $confirmReset, titleVisibility: .visible) {
                Button("Nueva conversación", role: .destructive) { model.reset() }
                Button("Cancelar", role: .cancel) {}
            }
            .alert("Coach", isPresented: Binding(get: { savedMessage != nil }, set: { if !$0 { savedMessage = nil } })) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(savedMessage ?? "")
            }
        }
        .navigationViewStyle(.stack)
    }

    var welcome: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                ZStack {
                    Circle().fill(Color.brand)
                    Image(systemName: "sparkles").foregroundColor(.white).font(.title3)
                }
                .frame(width: 44, height: 44)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Tu Coach").font(.title3.bold())
                    Text("Pregúntame sobre técnica, rutinas, progresión o descanso. Conozco tu historial de Forja.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            ForEach(suggestions, id: \.self) { s in
                Button {
                    ask(s)
                } label: {
                    HStack {
                        Text(s).font(.subheadline).multilineTextAlignment(.leading)
                        Spacer()
                        Image(systemName: "arrow.up.circle.fill").foregroundColor(.brand)
                    }
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Color(.secondarySystemBackground)))
                }
                .buttonStyle(.plain)
            }
            Text("Las respuestas son orientativas y no sustituyen a un médico ni a un fisioterapeuta.")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal)
    }

    var inputBar: some View {
        HStack(alignment: .bottom, spacing: 10) {
            TextField("Pregunta al Coach…", text: $input)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Capsule().fill(Color(.secondarySystemBackground)))
                .submitLabel(.send)
                .onSubmit { ask(input) }
            Button {
                ask(input)
            } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 40, height: 40)
                    .background(Circle().fill(canSend ? Color.brand : Color.gray.opacity(0.4)))
            }
            .disabled(!canSend)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(.bar)
    }

    var canSend: Bool {
        !model.sending && !input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    func ask(_ text: String) {
        let q = text
        input = ""
        hideKeyboard()
        let context = store.coachContext()
        Task { await model.send(q, context: context) }
    }
}

struct CoachBubble: View {
    let message: CoachMessage
    let onSaveRoutine: (CoachRoutineProposal) -> Void

    var isUser: Bool { message.role == "user" }

    var attributed: AttributedString {
        let text = isUser ? message.text : CoachModel.displayText(message.text)
        let options = AttributedString.MarkdownParsingOptions(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        return (try? AttributedString(markdown: text, options: options)) ?? AttributedString(text)
    }

    var body: some View {
        VStack(alignment: isUser ? .trailing : .leading, spacing: 8) {
            HStack {
                if isUser { Spacer(minLength: 40) }
                Text(attributed)
                    .font(.subheadline)
                    .foregroundColor(isUser ? .white : .primary)
                    .textSelection(.enabled)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .fill(isUser ? Color.brand : Color(.secondarySystemBackground))
                    )
                if !isUser { Spacer(minLength: 24) }
            }
            if !isUser {
                ForEach(CoachModel.proposals(in: message.text)) { p in
                    Button {
                        onSaveRoutine(p)
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "plus.rectangle.on.folder.fill")
                            VStack(alignment: .leading, spacing: 1) {
                                Text("Guardar rutina «\(p.name)»").font(.subheadline.bold())
                                Text("\(p.items.count) ejercicios").font(.caption)
                            }
                            Spacer()
                        }
                        .foregroundColor(.brand)
                        .padding(12)
                        .background(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Color.brand, lineWidth: 1.5))
                    }
                    .buttonStyle(.plain)
                    .padding(.trailing, 24)
                }
            }
        }
        .padding(.horizontal)
    }
}
