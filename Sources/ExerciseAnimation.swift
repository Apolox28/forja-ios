import SwiftUI
import UIKit
import WebKit

/// Animación en bucle del ejercicio (muñeco + equipamiento), dibujada con el motor de Resources/figure.js.
struct ExerciseAnimationView: UIViewRepresentable {
    let exercise: Exercise

    static let script: String = {
        guard let url = Bundle.main.url(forResource: "figure", withExtension: "js"),
              let js = try? String(contentsOf: url, encoding: .utf8) else { return "" }
        return js
    }()

    var patternKey: String { ExerciseSeed.pattern(for: exercise).rawValue }
    var equipmentKey: String { ExerciseSeed.animationEquipment(exercise.equipment) }

    /// Para ejercicios personalizados, resalta el músculo elegido por el usuario.
    var muscleKey: String {
        guard exercise.isCustom else { return "" }
        switch exercise.muscle {
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
        case .cardio, .fullBody: return ""
        }
    }

    func makeUIView(context: Context) -> WKWebView {
        // (las animaciones se dibujan a 60 fps dentro de la vista web)
        let config = WKWebViewConfiguration()
        let web = WKWebView(frame: .zero, configuration: config)
        web.isOpaque = false
        web.backgroundColor = .clear
        web.scrollView.isScrollEnabled = false
        web.scrollView.bounces = false
        web.isUserInteractionEnabled = false
        load(web)
        context.coordinator.key = patternKey + equipmentKey
        return web
    }

    func updateUIView(_ web: WKWebView, context: Context) {
        let key = patternKey + equipmentKey
        if context.coordinator.key != key {
            context.coordinator.key = key
            load(web)
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator() }
    final class Coordinator { var key = "" }

    func load(_ web: WKWebView) {
        let html = """
        <!doctype html><html><head>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
        <style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}
        canvas{display:block;width:100vw;height:100vw;border-radius:16px}</style>
        </head><body><canvas id="c"></canvas>
        <script>\(ExerciseAnimationView.script)</script>
        <script>FORJA.animate(document.getElementById('c'), '\(patternKey)', '\(equipmentKey)', 3000, '\(muscleKey)');</script>
        </body></html>
        """
        web.loadHTMLString(html, baseURL: nil)
    }
}

/// Miniatura estática (pre-renderizada) para listas.
struct ExerciseThumbnail: View {
    let exercise: Exercise
    var size: CGFloat = 44

    static var cache: [String: UIImage] = [:]

    var image: UIImage? {
        let p = ExerciseSeed.pattern(for: exercise).rawValue
        let e = ExerciseSeed.animationEquipment(exercise.equipment)
        let key = "thumb_\(p)_\(e)"
        if let img = ExerciseThumbnail.cache[key] { return img }
        let candidates = [key, "thumb_\(p)_none"]
        for name in candidates {
            if let path = Bundle.main.path(forResource: name, ofType: "png"), let img = UIImage(contentsOfFile: path) {
                ExerciseThumbnail.cache[key] = img
                return img
            }
        }
        return nil
    }

    var body: some View {
        Group {
            if let img = image {
                Image(uiImage: img)
                    .resizable()
                    .interpolation(.high)
                    .aspectRatio(contentMode: .fill)
            } else {
                ZStack {
                    Color.brand.opacity(0.18)
                    Text(String(exercise.name.prefix(1)))
                        .font(.headline)
                        .foregroundColor(.brand)
                }
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: size * 0.22, style: .continuous))
    }
}

/// Ficha con animación + instrucciones (se abre desde el entrenamiento).
struct ExerciseInfoSheet: View {
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) var dismiss
    let exercise: Exercise

    var body: some View {
        NavigationView {
            List {
                ExerciseHowToSections(exercise: exercise)
            }
            .listStyle(.insetGrouped)
            .navigationTitle(exercise.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Cerrar") { dismiss() }
                }
            }
        }
    }
}

/// Secciones reutilizables: animación, músculos e instrucciones.
struct ExerciseHowToSections: View {
    let exercise: Exercise

    var guide: ExerciseGuide { ExerciseSeed.guide(for: exercise) }

    var body: some View {
        Section {
            ExerciseAnimationView(exercise: exercise)
                .aspectRatio(1, contentMode: .fit)
                .frame(maxWidth: 420)
                .frame(maxWidth: .infinity)
                .listRowInsets(EdgeInsets(top: 8, leading: 8, bottom: 8, trailing: 8))
                .listRowBackground(Color.clear)
            HStack {
                Label(exercise.muscle.rawValue, systemImage: "figure.walk")
                Spacer()
                Label(exercise.equipment.rawValue, systemImage: "scalemass")
            }
            .font(.subheadline)
            .foregroundColor(.secondary)
        }
        if !guide.steps.isEmpty {
            Section(header: Text("Cómo hacerlo")) {
                ForEach(Array(guide.steps.enumerated()), id: \.offset) { item in
                    HStack(alignment: .top, spacing: 12) {
                        Text("\(item.offset + 1)")
                            .font(.subheadline.bold())
                            .foregroundColor(.white)
                            .frame(width: 26, height: 26)
                            .background(Circle().fill(Color.brand))
                        Text(item.element)
                            .font(.subheadline)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.vertical, 2)
                }
            }
        }
        if !guide.tips.isEmpty {
            Section(header: Text("Consejos")) {
                ForEach(guide.tips, id: \.self) { tip in
                    Label {
                        Text(tip).font(.subheadline)
                    } icon: {
                        Image(systemName: "lightbulb.fill").foregroundColor(.yellow)
                    }
                }
            }
        }
    }
}
