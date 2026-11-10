import SwiftUI
import UIKit
import AVFoundation

// MARK: - Modelo del chat

struct CoachMessage: Identifiable, Codable, Equatable {
    var id = UUID()
    var role: String   // "user" o "model"
    var text: String
    var date = Date()
    var exerciseName: String? = nil
    var offline: Bool? = nil
    var articleTitle: String? = nil
    var imageCount: Int? = nil
}

enum CoachSheet: Identifiable {
    case exercise(Exercise)
    case article(KnowledgeArticle)
    case library
    case camera(UIImagePickerController.SourceType)

    var id: String {
        switch self {
        case .exercise(let e): return "ex-" + e.id.uuidString
        case .article(let a): return "art-" + a.title
        case .library: return "library"
        case .camera(let s): return "camera-\(s.rawValue)"
        }
    }
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
    /// Hasta cuándo está silenciado el Coach por usarlo para otras cosas.
    @Published var mutedUntil: Date? = nil

    private let storeKey = "coachHistory"

    init() {
        if let raw = UserDefaults.standard.data(forKey: storeKey),
           let saved = try? JSONDecoder().decode([CoachMessage].self, from: raw) {
            messages = saved
        }
        if let until = UserDefaults.standard.object(forKey: "coachMutedUntil") as? Date, until > Date() {
            mutedUntil = until
        }
    }

    var isMuted: Bool {
        if let until = mutedUntil { return until > Date() }
        return false
    }

    func setMuted(_ until: Date?) {
        mutedUntil = until
        UserDefaults.standard.set(until, forKey: "coachMutedUntil")
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

    func send(_ text: String, context: String, library: [Exercise], images: [String] = []) async {
        let question = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !question.isEmpty, !sending else { return }
        if isMuted { return }
        errorText = nil
        messages.append(CoachMessage(role: "user", text: question, imageCount: images.isEmpty ? nil : images.count))
        persist()
        sending = true
        defer { sending = false }

        var req = URLRequest(url: CoachConfig.endpoint)
        req.httpMethod = "POST"
        req.timeoutInterval = 60
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("forja-ios", forHTTPHeaderField: "X-Forja-App")
        req.setValue(CoachConfig.deviceID, forHTTPHeaderField: "X-Forja-Device")
        var payload: [String: Any] = [
            "messages": messages.filter { $0.offline != true && $0.role != "warning" }.suffix(16).map { ["role": $0.role, "text": $0.text] },
            "context": context,
        ]
        if !images.isEmpty { payload["images"] = images }
        req.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        if !images.isEmpty { req.timeoutInterval = 90 }

        do {
            let (data, _) = try await URLSession.shared.data(for: req)
            let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
            if let r = json["remaining"] as? Int { remaining = r }
            if let mutedMs = json["mutedUntil"] as? Double, mutedMs > 0 {
                setMuted(Date(timeIntervalSince1970: mutedMs / 1000))
            }
            if let reply = json["reply"] as? String, !reply.isEmpty {
                messages.append(CoachMessage(role: "model", text: reply))
                persist()
            } else if let err = json["error"] as? String, err == "off_topic" || err == "muted" {
                // Uso fuera de lo previsto: aviso visible en la conversación.
                messages.append(CoachMessage(role: "warning", text: (json["message"] as? String) ?? "El Coach solo responde sobre entrenamiento."))
                persist()
            } else {
                errorText = (json["message"] as? String) ?? "El Coach no ha podido responder. Inténtalo de nuevo."
            }
        } catch {
            // Sin internet: respuesta con la biblioteca guardada en el iPhone.
            messages.append(CoachModel.offlineAnswer(to: question, library: library))
            persist()
        }
    }

    // MARK: Modo sin conexión

    static func normalize(_ s: String) -> String {
        s.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: Locale(identifier: "es_ES")).lowercased()
    }

    /// Busca el ejercicio de la biblioteca al que se refiere la pregunta.
    static func findExercise(in question: String, library: [Exercise]) -> Exercise? {
        findExerciseScored(in: question, library: library)?.0
    }

    static func findExerciseScored(in question: String, library: [Exercise]) -> (Exercise, Int)? {
        let q = normalize(question)
        let stop: Set<String> = ["con", "en", "de", "del", "la", "el", "los", "las", "al", "para", "sobre", "una", "por", "agarre"]
        var best: Exercise? = nil
        var bestScore = 0
        for (index, ex) in library.enumerated() {
            let n = normalize(ex.name)
            var score = 0
            if q.contains(n) {
                score = 10_000 + n.count
            } else {
                let words = n.split(separator: " ").map(String.init).filter { $0.count >= 4 && !stop.contains($0) }
                guard let first = words.first else { continue }
                let hits = words.filter { q.contains($0) }.count
                if hits == words.count {
                    score = 5_000 + hits * 100
                } else if hits >= 2 {
                    score = 3_000 + hits * 100
                } else if q.contains(first) {
                    // Solo la palabra principal («sentadilla», «remo»…): el primero de la biblioteca es el básico.
                    score = 1_000 - min(index, 999)
                }
            }
            if score > bestScore { bestScore = score; best = ex }
        }
        return best.map { ($0, bestScore) }
    }

    static func offlineAnswer(to question: String, library: [Exercise]) -> CoachMessage {
        let header = "📴 **Sin conexión.** Te respondo con la biblioteca guardada en tu iPhone; cuando vuelva internet tendrás al Coach completo.\n\n"
        let exMatch = findExerciseScored(in: question, library: library)
        let kbMatch = KnowledgeBase.bestMatch(for: question)
        let strongExercise = (exMatch?.1 ?? 0) >= 3_000
        let kbScore = kbMatch?.1 ?? 0

        // 1) Artículo científico si la pregunta es de un tema (y no nombra claramente un ejercicio).
        if case let (article, _)? = kbMatch, kbScore >= 2, !(strongExercise && kbScore < 4) {
            var text = header + "**\(article.title)**\n\(article.summary)\n\n\(article.body)"
            if case let (ex, _)? = exMatch, strongExercise {
                text += "\n\nTambién puedes ver la técnica de **\(ex.name)** con el botón de abajo."
                return CoachMessage(role: "model", text: text, exerciseName: ex.name, offline: true, articleTitle: article.title)
            }
            return CoachMessage(role: "model", text: text, offline: true, articleTitle: article.title)
        }

        if case let (ex, _)? = exMatch {
            let guide = ExerciseSeed.guide(for: ex)
            var text = header + "**\(ex.name)** · \(ex.muscle.rawValue) · \(ex.equipment.rawValue)\n\n"
            if !guide.steps.isEmpty {
                text += "**Cómo hacerlo**\n"
                for (i, step) in guide.steps.enumerated() { text += "\(i + 1). \(step)\n" }
            }
            if !guide.tips.isEmpty {
                text += "\n**Consejos**\n"
                for tip in guide.tips { text += "• \(tip)\n" }
            }
            return CoachMessage(role: "model", text: text.trimmingCharacters(in: .whitespacesAndNewlines),
                                exerciseName: ex.name, offline: true)
        }

        let q = normalize(question)
        if ["rutina", "plan", "programa"].contains(where: { q.contains($0) }) {
            return CoachMessage(role: "model", text: header + "**Rutinas sin conexión**\nEn **Entrenar → Explorar programas predefinidos** tienes planes listos (cuerpo completo, torso/pierna, empuje/tirón/pierna y en casa). Con internet, pídeme uno a tu medida y lo guardo en tus rutinas.", offline: true)
        }
        return CoachMessage(role: "model",
                            text: header + "Sin internet puedo explicarte **cualquier ejercicio de tu biblioteca** (escribe su nombre, por ejemplo «peso muerto») y responder con la **biblioteca científica**: repeticiones, volumen, descanso, proteína, calorías, sueño, cardio, lesiones y más. Toca 📚 arriba para verla entera.",
                            offline: true)
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
    @State var sheet: CoachSheet? = nil
    @State var showVideoOptions = false
    @State var videoFrames: [String] = []
    @State var videoThumb: UIImage? = nil
    @State var processingVideo = false

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
                                CoachBubble(message: m, onShowExercise: { name in
                                    if let ex = store.data.exercises.first(where: { $0.name == name }) {
                                        sheet = .exercise(ex)
                                    }
                                }, onShowArticle: { title in
                                    if let a = KnowledgeBase.articles.first(where: { $0.title == title }) {
                                        sheet = .article(a)
                                    }
                                }) { p in
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
                                    Text(videoFrames.isEmpty ? "El Coach está pensando…" : "El Coach está revisando tu vídeo…")
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
                if model.isMuted {
                    mutedBanner
                } else {
                    inputBar
                }
            }
            .background(AppTheme.screenBackground.ignoresSafeArea())
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
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button {
                        sheet = .library
                    } label: {
                        Image(systemName: "books.vertical")
                    }
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
            .confirmationDialog("Revisar tu técnica", isPresented: $showVideoOptions, titleVisibility: .visible) {
                if UIImagePickerController.isSourceTypeAvailable(.camera) {
                    Button("Grabar vídeo (máx. 20 s)") { sheet = .camera(.camera) }
                }
                Button("Elegir vídeo de la galería") { sheet = .camera(.photoLibrary) }
                Button("Cancelar", role: .cancel) {}
            } message: {
                Text("Grábate de lado, con todo el cuerpo y la barra o mancuernas visibles. El Coach analizará varios fotogramas (necesita internet).")
            }
            .sheet(item: $sheet) { s in
                switch s {
                case .exercise(let ex):
                    ExerciseInfoSheet(exercise: ex).environmentObject(store)
                case .article(let a):
                    NavigationView {
                        KnowledgeArticleView(article: a)
                            .toolbar {
                                ToolbarItem(placement: .confirmationAction) {
                                    Button("Cerrar") { sheet = nil }
                                }
                            }
                    }
                case .library:
                    NavigationView {
                        KnowledgeLibraryView()
                            .toolbar {
                                ToolbarItem(placement: .confirmationAction) {
                                    Button("Cerrar") { sheet = nil }
                                }
                            }
                    }
                case .camera(let source):
                    VideoPicker(source: source) { url in
                        sheet = nil
                        processVideo(url)
                    }
                    .ignoresSafeArea()
                }
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
                    Text("Pregúntame sobre técnica, rutinas, progresión o descanso. Conozco tu historial de Forja. Toca 📷 para que revise un vídeo de tu técnica.")
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
            Text("Las respuestas son orientativas y no sustituyen a un médico ni a un fisioterapeuta. El Coach solo responde sobre entrenamiento, salud y nutrición deportiva.")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal)
    }

    var mutedBanner: some View {
        TimelineView(.periodic(from: Date(), by: 1)) { ctx in
            let left = max(0, (model.mutedUntil ?? ctx.date).timeIntervalSince(ctx.date))
            HStack(spacing: 10) {
                Image(systemName: "speaker.slash.fill").foregroundColor(.orange)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Coach en pausa").font(.subheadline.bold())
                    Text("Por usarlo para temas que no son de entrenamiento. Vuelve en \(Fmt.clock(left)).")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
            }
            .padding(14)
            .background(.bar)
            .onChange(of: left <= 0) { done in
                if done { model.setMuted(nil) }
            }
        }
    }

    var inputBar: some View {
        VStack(spacing: 6) {
            if processingVideo || !videoFrames.isEmpty {
                HStack(spacing: 10) {
                    if let img = videoThumb {
                        Image(uiImage: img)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 44, height: 44)
                            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    } else {
                        ProgressView().frame(width: 44, height: 44)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text(processingVideo ? "Preparando vídeo…" : "Vídeo adjunto").font(.subheadline.bold())
                        Text(processingVideo ? "Extrayendo fotogramas" : "\(videoFrames.count) fotogramas para el Coach")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    Button {
                        videoFrames = []
                        videoThumb = nil
                    } label: {
                        Image(systemName: "xmark.circle.fill").foregroundColor(.secondary).font(.title3)
                    }
                    .disabled(processingVideo)
                }
                .padding(10)
                .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Color(.secondarySystemBackground)))
                .padding(.horizontal, 12)
            }
            HStack(alignment: .bottom, spacing: 8) {
                Button {
                    hideKeyboard()
                    showVideoOptions = true
                } label: {
                    Image(systemName: "video.fill")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.brand)
                        .frame(width: 40, height: 40)
                        .background(Circle().fill(Color.brand.opacity(0.14)))
                }
                .disabled(model.sending || processingVideo)
                TextField(videoFrames.isEmpty ? "Pregunta al Coach…" : "¿Qué ejercicio es y qué quieres que revise?", text: $input)
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
        }
        .padding(.vertical, 8)
        .background(.bar)
    }

    var canSend: Bool {
        guard !model.sending, !processingVideo else { return false }
        if !videoFrames.isEmpty { return true }
        return !input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    func ask(_ text: String) {
        var q = text.trimmingCharacters(in: .whitespacesAndNewlines)
        let frames = videoFrames
        if !frames.isEmpty && q.isEmpty {
            q = "Revisa mi técnica en este vídeo. ¿Está bien hecho? Dime qué corregir."
        }
        guard !q.isEmpty else { return }
        input = ""
        videoFrames = []
        videoThumb = nil
        hideKeyboard()
        let context = store.coachContext()
        let library = store.data.exercises
        Task { await model.send(q, context: context, library: library, images: frames) }
    }

    func processVideo(_ url: URL) {
        processingVideo = true
        videoFrames = []
        videoThumb = nil
        DispatchQueue.global(qos: .userInitiated).async {
            let result = VideoFrames.extract(from: url, count: 5)
            DispatchQueue.main.async {
                processingVideo = false
                videoFrames = result.base64
                videoThumb = result.thumbnail
                if result.base64.isEmpty {
                    savedMessage = "No se pudo leer el vídeo. Prueba con otro más corto."
                }
            }
        }
    }
}

struct CoachBubble: View {
    let message: CoachMessage
    var onShowExercise: (String) -> Void = { _ in }
    var onShowArticle: (String) -> Void = { _ in }
    let onSaveRoutine: (CoachRoutineProposal) -> Void

    var isUser: Bool { message.role == "user" }
    var isWarning: Bool { message.role == "warning" }

    var attributed: AttributedString {
        let text = isUser ? message.text : CoachModel.displayText(message.text)
        let options = AttributedString.MarkdownParsingOptions(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        return (try? AttributedString(markdown: text, options: options)) ?? AttributedString(text)
    }

    var body: some View {
        VStack(alignment: isUser ? .trailing : .leading, spacing: 8) {
            if isWarning {
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: "exclamationmark.shield.fill")
                        .foregroundColor(.orange)
                        .font(.title3)
                    Text(attributed)
                        .font(.subheadline)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Color.orange.opacity(0.14)))
            } else {
                HStack {
                    if isUser { Spacer(minLength: 40) }
                    VStack(alignment: isUser ? .trailing : .leading, spacing: 6) {
                        if let n = message.imageCount, n > 0 {
                            Label("Vídeo · \(n) fotogramas", systemImage: "video.fill")
                                .font(.caption.bold())
                                .foregroundColor(isUser ? .white.opacity(0.9) : .secondary)
                        }
                        Text(attributed)
                            .font(.subheadline)
                            .foregroundColor(isUser ? .white : .primary)
                            .textSelection(.enabled)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .fill(isUser ? Color.brand : Color(.secondarySystemBackground))
                    )
                    if !isUser { Spacer(minLength: 24) }
                }
            }
            if !isUser, let name = message.exerciseName {
                Button {
                    onShowExercise(name)
                } label: {
                    Label("Ver animación e instrucciones", systemImage: "play.rectangle.fill")
                        .font(.subheadline.bold())
                        .foregroundColor(.brand)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(Capsule().stroke(Color.brand, lineWidth: 1.5))
                }
                .buttonStyle(.plain)
            }
            if !isUser, let title = message.articleTitle {
                Button {
                    onShowArticle(title)
                } label: {
                    Label("Leer artículo completo", systemImage: "book.fill")
                        .font(.subheadline.bold())
                        .foregroundColor(.brand)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(Capsule().stroke(Color.brand, lineWidth: 1.5))
                }
                .buttonStyle(.plain)
            }
            if !isUser && !isWarning {
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

// MARK: - Vídeo de técnica

/// Grabar o elegir un vídeo (cámara o galería).
struct VideoPicker: UIViewControllerRepresentable {
    let source: UIImagePickerController.SourceType
    let onPick: (URL) -> Void
    @Environment(\.dismiss) var dismiss

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = UIImagePickerController.isSourceTypeAvailable(source) ? source : .photoLibrary
        picker.mediaTypes = ["public.movie"]
        picker.videoMaximumDuration = 20
        picker.videoQuality = .typeMedium
        if picker.sourceType == .camera {
            picker.cameraCaptureMode = .video
        }
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: VideoPicker
        init(_ parent: VideoPicker) { self.parent = parent }

        func imagePickerController(_ picker: UIImagePickerController,
                                   didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let url = info[.mediaURL] as? URL {
                // Copia a la carpeta temporal para que no desaparezca.
                let dest = FileManager.default.temporaryDirectory.appendingPathComponent("tecnica-\(UUID().uuidString).mov")
                try? FileManager.default.copyItem(at: url, to: dest)
                parent.onPick(FileManager.default.fileExists(atPath: dest.path) ? dest : url)
            } else {
                parent.dismiss()
            }
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

enum VideoFrames {
    /// Extrae fotogramas repartidos por el vídeo, reducidos a JPEG en base64.
    static func extract(from url: URL, count: Int) -> (base64: [String], thumbnail: UIImage?) {
        let asset = AVURLAsset(url: url)
        let duration = CMTimeGetSeconds(asset.duration)
        guard duration.isFinite, duration > 0 else { return ([], nil) }
        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        generator.maximumSize = CGSize(width: 640, height: 640)
        generator.requestedTimeToleranceBefore = CMTime(seconds: 0.2, preferredTimescale: 600)
        generator.requestedTimeToleranceAfter = CMTime(seconds: 0.2, preferredTimescale: 600)

        var frames: [String] = []
        var thumb: UIImage? = nil
        for i in 0..<count {
            let t = duration * (Double(i) + 0.5) / Double(count)
            let time = CMTime(seconds: t, preferredTimescale: 600)
            guard let cg = try? generator.copyCGImage(at: time, actualTime: nil) else { continue }
            let image = UIImage(cgImage: cg)
            if thumb == nil { thumb = image }
            if let data = image.jpegData(compressionQuality: 0.55) {
                frames.append(data.base64EncodedString())
            }
        }
        try? FileManager.default.removeItem(at: url)
        return (frames, thumb)
    }
}
