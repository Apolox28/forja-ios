import SwiftUI
import UIKit
import WebKit

// MARK: - Visor 3D compartido
//
// Antes cada animación creaba su propia vista web y cargaba de nuevo el motor 3D (≈1 MB)
// y el modelo humano (≈1,4 MB). Ahora hay un único visor que se carga una vez al abrir la app
// y solo cambia de escena. Además se puede girar con el dedo.

final class WeakScriptHandler: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(_ target: WKScriptMessageHandler) { self.target = target }
    func userContentController(_ c: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.userContentController(c, didReceive: message)
    }
}

final class Viewer3DHost: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
    enum Mode { case exercise, muscleMap }

    static let exercise = Viewer3DHost(mode: .exercise)
    static let muscleMap = Viewer3DHost(mode: .muscleMap)

    /// Prepara las páginas fuera del hilo principal y luego crea los visores de uno en uno,
    /// para no dar tirones mientras la app termina de abrirse.
    static func warmUp() {
        DispatchQueue.global(qos: .utility).async {
            _ = pagesDir
            DispatchQueue.main.async {
                _ = exercise
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { _ = muscleMap }
            }
        }
    }

    /// Los dos visores comparten proceso web: el motor 3D se compila una sola vez.
    private static let processPool = WKProcessPool()

    /// Carpeta en Caches con las páginas y scripts del visor (se genera una vez por versión).
    /// El modelo va en su propio .js para no convertirlo a base64 en cada arranque.
    static let pagesDir: URL? = {
        let fm = FileManager.default
        let bundle = Bundle.main
        guard let engineURL = bundle.url(forResource: "forja3d", withExtension: "js"),
              let glbURL = bundle.url(forResource: "body", withExtension: "glb") else { return nil }
        let build = bundle.infoDictionary?["CFBundleVersion"] as? String ?? "0"
        let engineSize = (try? fm.attributesOfItem(atPath: engineURL.path)[.size] as? Int) ?? 0
        let caches = fm.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        let name = "forja3d-\(build)-\(engineSize)"
        let dir = caches.appendingPathComponent(name)
        let marker = dir.appendingPathComponent("ok")
        if fm.fileExists(atPath: marker.path) { return dir }
        // Borra versiones anteriores.
        for old in (try? fm.contentsOfDirectory(at: caches, includingPropertiesForKeys: nil)) ?? []
        where old.lastPathComponent.hasPrefix("forja3d-") && old.lastPathComponent != name {
            try? fm.removeItem(at: old)
        }
        do {
            try? fm.removeItem(at: dir)
            try fm.createDirectory(at: dir, withIntermediateDirectories: true)
            for lib in ["three.min", "GLTFLoader", "SkeletonUtils"] {
                guard let src = bundle.url(forResource: lib, withExtension: "js") else { return nil }
                try fm.copyItem(at: src, to: dir.appendingPathComponent(lib + ".js"))
            }
            // El motor se usa tal cual; solo se expone el punto al que mira la cámara para poder girarla.
            let engine = try String(contentsOf: engineURL, encoding: .utf8).replacingOccurrences(
                of: "return { scene: scene, camera: camera, update: update,",
                with: "return { target: tgt, scene: scene, camera: camera, update: update,")
            try engine.write(to: dir.appendingPathComponent("engine.js"), atomically: true, encoding: .utf8)
            let model = "window.FORJA_MODEL='" + (try Data(contentsOf: glbURL)).base64EncodedString() + "';"
            try model.write(to: dir.appendingPathComponent("model.js"), atomically: true, encoding: .utf8)
            try page(.exercise).write(to: dir.appendingPathComponent("exercise.html"), atomically: true, encoding: .utf8)
            try page(.muscleMap).write(to: dir.appendingPathComponent("map.html"), atomically: true, encoding: .utf8)
            try Data().write(to: marker)
            return dir
        } catch {
            return nil
        }
    }()

    let webView: WKWebView
    let mode: Mode
    private var ready = false
    private var pendingJS: String?
    /// Contenedores que muestran este visor (el más reciente en pantalla se queda con él).
    let containers = NSHashTable<Viewer3DContainer>.weakObjects()

    private init(mode: Mode) {
        self.mode = mode
        let config = WKWebViewConfiguration()
        config.processPool = Viewer3DHost.processPool
        let controller = WKUserContentController()
        config.userContentController = controller
        webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 320, height: 320), configuration: config)
        super.init()
        controller.add(WeakScriptHandler(self), name: "forjaReady")
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.isUserInteractionEnabled = (mode == .exercise)
        webView.navigationDelegate = self
        load()
    }

    private func load() {
        guard let dir = Viewer3DHost.pagesDir else { return }
        let file = dir.appendingPathComponent(mode == .exercise ? "exercise.html" : "map.html")
        webView.loadFileURL(file, allowingReadAccessTo: dir)
    }

    /// iOS puede cerrar el proceso web en segundo plano: se recarga y se vuelve a mostrar lo último.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        ready = false
        pendingJS = containers.allObjects.last(where: { $0.window != nil })?.lastJS ?? pendingJS
        load()
    }

    func userContentController(_ c: WKUserContentController, didReceive message: WKScriptMessage) {
        ready = true
        if let js = pendingJS {
            pendingJS = nil
            webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    func run(_ js: String) {
        if ready {
            webView.evaluateJavaScript(js, completionHandler: nil)
        } else {
            pendingJS = js
        }
    }

    /// Cuando un contenedor deja la pantalla, el visor vuelve al último que siga visible.
    func reassign() {
        guard webView.superview == nil || webView.window == nil else { return }
        for c in containers.allObjects.reversed() where c.window != nil {
            c.take()
            return
        }
    }

    // MARK: Página

    static func page(_ mode: Mode) -> String {
        let script: String
        switch mode {
        case .exercise:
            script = """
            var canvas = document.getElementById('c'), hint = document.getElementById('h');
            var R = FORJA3D.makeRenderer(canvas), ST = null, PERIOD = 2600, T0 = null;
            var yaw = 0, vel = 0, dragging = false, lastX = 0, base = null, loaded = false, want = null, homing = false, lastTap = 0, hinted = false;
            function size() {
              var w = canvas.clientWidth || 300, h = canvas.clientHeight || w;
              R.setPixelRatio(window.devicePixelRatio || 1); R.setSize(w, h, false);
              if (ST) { ST.camera.aspect = w / h; ST.camera.updateProjectionMatrix(); }
            }
            function disposeScene(s) {
              if (!s) return;
              s.traverse(function (o) {
                if (o.geometry && o.geometry.dispose) o.geometry.dispose();
                if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (m && m.dispose) m.dispose(); });
              });
            }
            function guessTarget() {
              var d = new THREE.Vector3(); ST.camera.getWorldDirection(d);
              var D = Math.abs(d.z) > 0.15 ? -ST.camera.position.z / d.z : 4;
              return ST.camera.position.clone().add(d.multiplyScalar(D));
            }
            function show(k, eq, m, v) {
              if (!loaded) { want = [k, eq, m, v]; return; }
              var old = ST;
              ST = FORJA3D.createStage(k, eq, m, v);
              PERIOD = FORJA3D.periodFor ? FORJA3D.periodFor(k) : 2600;
              T0 = null; yaw = 0; vel = 0; homing = false;
              base = { c: ST.camera.position.clone(), t: ST.target ? ST.target.clone() : guessTarget() };
              size();
              // Dibuja ya la escena nueva para reutilizar los shaders antes de liberar la anterior.
              ST.update(0); R.render(ST.scene, ST.camera);
              if (old) disposeScene(old.scene);
            }
            window.forjaShow = show;
            function applyYaw() {
              var c = base.c, t = base.t, dx = c.x - t.x, dz = c.z - t.z, cs = Math.cos(yaw), sn = Math.sin(yaw);
              ST.camera.position.set(t.x + dx * cs + dz * sn, c.y, t.z - dx * sn + dz * cs);
              ST.camera.lookAt(t);
            }
            function frame(ts) {
              requestAnimationFrame(frame);
              if (!ST) return;
              if (T0 === null) T0 = ts;
              if (homing) { yaw *= 0.85; if (Math.abs(yaw) < 0.002) { yaw = 0; homing = false; } }
              else if (!dragging && Math.abs(vel) > 0.0003) { yaw += vel; vel *= 0.93; }
              applyYaw();
              if (Math.abs(canvas.width - canvas.clientWidth * (window.devicePixelRatio || 1)) > 2) size();
              ST.update(((ts - T0) % PERIOD) / PERIOD);
              R.render(ST.scene, ST.camera);
            }
            canvas.addEventListener('pointerdown', function (e) {
              var now = Date.now();
              if (now - lastTap < 300) { homing = true; vel = 0; }
              lastTap = now;
              dragging = true; lastX = e.clientX; vel = 0; homing = homing && true;
              if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
            });
            canvas.addEventListener('pointermove', function (e) {
              if (!dragging) return;
              var d = (e.clientX - lastX) * 0.011; lastX = e.clientX;
              yaw += d; vel = d; homing = false;
              if (!hinted) { hinted = true; hint.style.opacity = 0; }
            });
            function endDrag() { dragging = false; }
            canvas.addEventListener('pointerup', endDrag);
            canvas.addEventListener('pointercancel', endDrag);
            setTimeout(function () { hint.style.opacity = 0; }, 3500);
            requestAnimationFrame(frame);
            var data = window.FORJA_MODEL || '';
            // Si nadie ha pedido aún una animación, se prepara una de calentamiento:
            // así la primera que abra el usuario no espera a compilar los gráficos.
            function ready() { loaded = true; show.apply(null, want || ['bench', 'barbell', '', 1]); }
            if (data.length > 0) FORJA3D.loadModel(data, ready); else ready();
            window.webkit.messageHandlers.forjaReady.postMessage(1);
            """
        case .muscleMap:
            script = """
            var canvas = document.getElementById('c'), M = null, loaded = false, want = null;
            function showMap(intens) {
              if (!loaded) { want = intens; return; }
              if (M && M.update) { M.update(intens); return; }
              M = FORJA3D.bodyMap(canvas, intens, { view: 'both', rotate: false });
            }
            window.forjaMap = showMap;
            var data = window.FORJA_MODEL || '';
            function ready() { loaded = true; if (want) showMap(want); }
            if (data.length > 0) FORJA3D.loadModel(data, ready); else ready();
            window.webkit.messageHandlers.forjaReady.postMessage(1);
            """
        }
        let hint = mode == .exercise
            ? "<div id=\"h\">↔ Desliza para girar · doble toque para centrar</div>"
            : ""
        return """
        <!doctype html><html><head>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
        <style>
        html,body{margin:0;padding:0;background:transparent;overflow:hidden;-webkit-user-select:none;-webkit-touch-callout:none}
        #w{position:relative;width:100vw;height:100vh;border-radius:18px;overflow:hidden;
           background:radial-gradient(120% 90% at 50% 25%,#30333c 0%,#1b1d23 55%,#121317 100%)}
        canvas{display:block;width:100%;height:100%;touch-action:pan-y}
        #h{position:absolute;left:0;right:0;bottom:10px;text-align:center;font:600 12px -apple-system,system-ui,sans-serif;
           color:rgba(255,255,255,.75);transition:opacity .6s;pointer-events:none}
        </style>
        </head><body><div id="w"><canvas id="c"></canvas>\(hint)</div>
        <script src="three.min.js"></script>
        <script src="GLTFLoader.js"></script>
        <script src="SkeletonUtils.js"></script>
        <script src="engine.js"></script>
        <script src="model.js"></script>
        <script>\(script)</script>
        </body></html>
        """
    }
}

/// Vista que «presta» el visor compartido mientras está en pantalla.
final class Viewer3DContainer: UIView {
    let host: Viewer3DHost
    var lastJS: String?

    init(host: Viewer3DHost) {
        self.host = host
        super.init(frame: .zero)
        backgroundColor = .clear
        clipsToBounds = true
        layer.cornerRadius = 18
        host.containers.add(self)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    func take() {
        let web = host.webView
        if web.superview !== self {
            web.removeFromSuperview()
            web.frame = bounds
            web.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            addSubview(web)
        }
        if let js = lastJS { host.run(js) }
    }

    func show(_ js: String) {
        lastJS = js
        take()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        if host.webView.superview === self { host.webView.frame = bounds }
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil {
            take()
        } else {
            DispatchQueue.main.async { [host] in host.reassign() }
        }
    }
}

// MARK: - Animación del ejercicio

/// Animación 3D en bucle del ejercicio (maniquí + equipamiento), girable con el dedo.
struct ExerciseAnimationView: UIViewRepresentable {
    let exercise: Exercise
    /// 1 = vista principal, 2 = otra perspectiva
    var view: Int = 1

    var patternKey: String { ExerciseSeed.animationKey(for: exercise) }
    var equipmentKey: String { ExerciseSeed.animationEquipment(exercise.equipment) }

    /// Para ejercicios personalizados, resalta el músculo elegido por el usuario.
    var muscleKey: String {
        guard exercise.isCustom else { return "" }
        return exercise.muscle.mapKey ?? ""
    }

    var js: String { "forjaShow('\(patternKey)','\(equipmentKey)','\(muscleKey)',\(view == 2 ? 2 : 1));" }

    func makeUIView(context: Context) -> Viewer3DContainer {
        let v = Viewer3DContainer(host: .exercise)
        v.show(js)
        return v
    }

    func updateUIView(_ v: Viewer3DContainer, context: Context) {
        if v.lastJS != js { v.show(js) }
    }
}

// MARK: - Mapa muscular

/// Cuerpo 3D con los músculos trabajados pintados según su intensidad.
struct MuscleMapView: UIViewRepresentable {
    let intensities: [String: Double]
    var view: String = "both"

    var json: String {
        let pairs = intensities.sorted { $0.key < $1.key }.map { "\"\($0.key)\":\(String(format: "%.3f", $0.value))" }
        return "{" + pairs.joined(separator: ",") + "}"
    }

    var js: String { "forjaMap(\(json));" }

    func makeUIView(context: Context) -> Viewer3DContainer {
        let v = Viewer3DContainer(host: .muscleMap)
        v.show(js)
        return v
    }

    func updateUIView(_ v: Viewer3DContainer, context: Context) {
        if v.lastJS != js { v.show(js) }
    }
}
