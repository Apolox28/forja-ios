import SwiftUI
import UIKit
import WebKit

/// Animación 3D en bucle del ejercicio (maniquí + equipamiento), dibujada con three.js y Resources/forja3d.js.
struct ExerciseAnimationView: UIViewRepresentable {
    let exercise: Exercise

    static func resource(_ name: String) -> String {
        guard let url = Bundle.main.url(forResource: name, withExtension: "js"),
              let js = try? String(contentsOf: url, encoding: .utf8) else { return "" }
        return js
    }
    static let three: String = resource("three.min")
    static let engine: String = resource("forja3d")
    static let gltfLoader: String = resource("GLTFLoader")
    static let skeletonUtils: String = resource("SkeletonUtils")
    /// Modelo humano (GLB) codificado en base64 para cargarlo dentro de la vista web sin red.
    static let modelBase64: String = {
        guard let url = Bundle.main.url(forResource: "body", withExtension: "glb"),
              let data = try? Data(contentsOf: url) else { return "" }
        return data.base64EncodedString()
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
        <style>
        html,body{margin:0;padding:0;background:transparent;overflow:hidden}
        #w{position:relative;width:100vw;height:100vw;border-radius:18px;overflow:hidden;
           background:radial-gradient(120% 90% at 50% 25%,#30333c 0%,#1b1d23 55%,#121317 100%)}
        canvas{display:block;width:100%;height:100%}
        #l{position:absolute;top:12px;left:12px;padding:5px 11px;border-radius:999px;
           font:700 14px -apple-system,system-ui,sans-serif;color:#ff8a3d;background:rgba(255,138,61,.16)}
        </style>
        </head><body><div id="w"><canvas id="c"></canvas><div id="l"></div></div>
        <script>\(ExerciseAnimationView.three)</script>
        <script>\(ExerciseAnimationView.gltfLoader)</script>
        <script>\(ExerciseAnimationView.skeletonUtils)</script>
        <script>\(ExerciseAnimationView.engine)</script>
        <script>
        document.getElementById('l').remove();
        function start() { FORJA3D.mount(document.getElementById('c'), '\(patternKey)', '\(equipmentKey)', { muscle: '\(muscleKey)' }); }
        var data = '\(ExerciseAnimationView.modelBase64)';
        if (data.length > 0) { FORJA3D.loadModel(data, function () { start(); }); } else { start(); }
        </script>
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
            if let path = Bundle.main.path(forResource: name, ofType: "jpg"), let img = UIImage(contentsOfFile: path) {
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
