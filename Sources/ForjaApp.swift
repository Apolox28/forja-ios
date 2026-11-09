import SwiftUI

@main
struct ForjaApp: App {
    @StateObject var store = Store()
    @AppStorage("themeAccent") var accent: String = AccentChoice.forja.rawValue
    @AppStorage("themeBackground") var background: String = BackgroundChoice.system.rawValue

    init() {
        AppTheme.applyUIKitAppearance()
    }

    @State var showSplash = true

    var body: some Scene {
        WindowGroup {
            ZStack {
                RootView()
                    .environmentObject(store)
                    .tint(.brand)
                    .preferredColorScheme(AppTheme.background.scheme)
                    // Al cambiar el tema se reconstruye la interfaz con los nuevos colores.
                    .id(accent + "-" + background)
                    .onChange(of: background) { _ in AppTheme.applyUIKitAppearance() }
                if showSplash {
                    SplashView()
                        .transition(.opacity)
                        .zIndex(1)
                }
            }
            .onAppear {
                // El logo sigue al de la pantalla de arranque y se desvanece al terminar de cargar.
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                    withAnimation(.easeOut(duration: 0.45)) { showSplash = false }
                }
            }
        }
    }
}

/// Logo del perrito con corona mientras se abre la app.
struct SplashView: View {
    @State var pulse = false

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            Image("LaunchLogo")
                .scaleEffect(pulse ? 1.04 : 1.0)
                .animation(.easeInOut(duration: 0.8), value: pulse)
        }
        .onAppear { pulse = true }
    }
}

struct RootView: View {
    @EnvironmentObject var store: Store
    @State var importMessage: String? = nil

    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Inicio", systemImage: "house.fill") }
            TrainView()
                .tabItem { Label("Entrenar", systemImage: "flame.fill") }
            CoachView()
                .tabItem { Label("Coach", systemImage: "sparkles") }
            ProgressTabView()
                .tabItem { Label("Progreso", systemImage: "chart.bar.fill") }
            ProfileView()
                .tabItem { Label("Perfil", systemImage: "person.crop.circle") }
        }
        .fullScreenCover(isPresented: $store.showActiveWorkout) {
            ActiveWorkoutView()
                .environmentObject(store)
                .tint(.brand)
        }
        .background(
            Color.clear
                .sheet(item: $store.lastFinished) { w in
                    WorkoutSummaryView(workout: w)
                        .environmentObject(store)
                        .tint(.brand)
                }
        )
        .alert("Ya tienes un entrenamiento en curso",
               isPresented: Binding(get: { store.pendingStart != nil },
                                    set: { if !$0 { store.pendingStart = nil } })) {
            Button("Continuar el actual") {
                store.pendingStart = nil
                store.showActiveWorkout = true
            }
            Button("Descartar y empezar nuevo", role: .destructive) {
                if let p = store.pendingStart {
                    store.pendingStart = nil
                    store.startWorkout(name: p.name, template: p.template)
                }
            }
            Button("Cancelar", role: .cancel) {
                store.pendingStart = nil
            }
        } message: {
            Text("¿Qué quieres hacer con él?")
        }
        .onAppear {
            store.requestNotifications()
        }
        .onOpenURL { url in
            // «Abrir con Forja» desde Archivos, Drive, correo…
            guard url.isFileURL else { return }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                importMessage = store.importAny(url)
            }
        }
        .alert("Importación", isPresented: Binding(get: { importMessage != nil },
                                                   set: { if !$0 { importMessage = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(importMessage ?? "")
        }
    }
}
