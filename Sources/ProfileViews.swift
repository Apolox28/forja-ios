import SwiftUI
import UIKit
import UniformTypeIdentifiers

enum ImportMode {
    case hevyCSV
    case backupJSON
}

enum ProfileSheet: Identifiable {
    case share(ShareItem)
    case picker(ImportMode)

    var id: String {
        switch self {
        case .share(let item): return "share-" + item.id.uuidString
        case .picker(let mode): return mode == .hevyCSV ? "picker-csv" : "picker-json"
        }
    }
}

/// Selector de archivos nativo de iOS (copia el archivo a la app, sin problemas de permisos).
struct DocumentPicker: UIViewControllerRepresentable {
    let onPick: (URL) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onPick: onPick) }

    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let types: [UTType] = [.commaSeparatedText, .json, .plainText, .text, .data, .item]
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: types, asCopy: true)
        picker.allowsMultipleSelection = false
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}

    final class Coordinator: NSObject, UIDocumentPickerDelegate {
        let onPick: (URL) -> Void
        init(onPick: @escaping (URL) -> Void) { self.onPick = onPick }
        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            if let url = urls.first { onPick(url) }
        }
    }
}

struct ProfileView: View {
    @EnvironmentObject var store: Store
    @State var sheet: ProfileSheet? = nil
    @State var message: String? = nil
    @State var confirmReset = false

    var body: some View {
        NavigationView {
            Form {
                Section {
                    HStack(spacing: 14) {
                        ZStack {
                            Circle().fill(Color.brand)
                            Image(systemName: "flame.fill").font(.title).foregroundColor(.white)
                        }
                        .frame(width: 56, height: 56)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Forja").font(.title2.bold())
                            Text("Todas las funciones incluidas · sin suscripción")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 6)
                }

                Section(header: Text("Ajustes")) {
                    Picker("Unidad de peso", selection: $store.data.settings.unit) {
                        ForEach(WeightUnit.allCases) { u in Text(u.rawValue).tag(u) }
                    }
                    .pickerStyle(.segmented)
                    Stepper("Descanso por defecto: \(Fmt.rest(store.data.settings.defaultRest))",
                            value: $store.data.settings.defaultRest, in: 0...600, step: 15)
                    Stepper("Objetivo semanal: \(store.data.settings.weeklyGoal) días",
                            value: $store.data.settings.weeklyGoal, in: 1...7)
                    Button {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    } label: {
                        Label("Idioma de la app (Español / English)", systemImage: "globe")
                    }
                    Button {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    } label: {
                        Label("Notificaciones del descanso", systemImage: "bell")
                    }
                }

                Section(header: Text("Herramientas")) {
                    NavigationLink(destination: OneRMCalculatorView()) {
                        Label("Calculadora de 1RM", systemImage: "function")
                    }
                    NavigationLink(destination: PlateCalculatorView()) {
                        Label("Calculadora de discos", systemImage: "circle.grid.2x1")
                    }
                    NavigationLink(destination: WarmupCalculatorView()) {
                        Label("Series de calentamiento", systemImage: "thermometer.sun")
                    }
                }

                GoogleAccountSection()

                Section(header: Text("Pasar mis datos desde Hevy"),
                        footer: Text("En Hevy: Perfil → Ajustes → Exportar e importar datos → Exportar entrenamientos. Guarda el archivo .csv en Archivos (o Google Drive) e impórtalo aquí.")) {
                    Button {
                        sheet = .picker(.hevyCSV)
                    } label: {
                        Label("Importar CSV de Hevy", systemImage: "square.and.arrow.down.on.square")
                    }
                }

                Section(header: Text("Copia de seguridad"),
                        footer: Text("Puedes guardar la copia en iCloud Drive, Google Drive o enviártela por correo. Los datos se guardan solo en este iPhone.")) {
                    Button {
                        if let url = store.exportFile() {
                            sheet = .share(ShareItem(items: [url]))
                        }
                    } label: {
                        Label("Crear copia de seguridad (JSON)", systemImage: "externaldrive.badge.plus")
                    }
                    Button {
                        sheet = .picker(.backupJSON)
                    } label: {
                        Label("Restaurar copia de seguridad", systemImage: "arrow.counterclockwise")
                    }
                    Button {
                        if let url = HevyImporter.exportCSV(store) {
                            sheet = .share(ShareItem(items: [url]))
                        }
                    } label: {
                        Label("Exportar entrenamientos (CSV)", systemImage: "tablecells")
                    }
                    Button(role: .destructive) {
                        confirmReset = true
                    } label: {
                        Label("Borrar todos los datos", systemImage: "trash")
                    }
                }

                Section(header: Text("Acerca de")) {
                    HStack {
                        Text("Versión")
                        Spacer()
                        Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Text("Ejercicios en la biblioteca")
                        Spacer()
                        Text("\(store.data.exercises.count)").foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Perfil")
            .sheet(item: $sheet) { s in
                switch s {
                case .share(let item):
                    ShareSheet(items: item.items)
                case .picker(let mode):
                    DocumentPicker { url in
                        sheet = nil
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                            message = store.importAny(url, mode: mode)
                        }
                    }
                    .ignoresSafeArea()
                }
            }
            .alert("Forja", isPresented: Binding(get: { message != nil }, set: { if !$0 { message = nil } })) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(message ?? "")
            }
            .confirmationDialog("¿Borrar todos los datos?", isPresented: $confirmReset, titleVisibility: .visible) {
                Button("Borrar todo", role: .destructive) { store.resetAll() }
                Button("Cancelar", role: .cancel) {}
            } message: {
                Text("Se eliminarán entrenamientos, rutinas, medidas y ejercicios personalizados. No se puede deshacer.")
            }
            .activeWorkoutBanner()
        }
        .navigationViewStyle(.stack)
    }
}

// MARK: - Calculadora de 1RM

struct OneRMCalculatorView: View {
    @EnvironmentObject var store: Store
    @State var weight: Double = 0
    @State var reps: Double = 0

    var oneRM: Double {
        guard weight > 0, reps > 0 else { return 0 }
        let r = min(reps, 30)
        return r == 1 ? weight : weight * (1 + r / 30)
    }

    var body: some View {
        Form {
            Section(header: Text("Tu serie")) {
                HStack {
                    Text("Peso (\(store.unit))")
                    Spacer()
                    NumberField("0", value: $weight).frame(width: 90)
                }
                HStack {
                    Text("Repeticiones")
                    Spacer()
                    NumberField("0", value: $reps, allowsDecimal: false).frame(width: 90)
                }
            }
            Section(header: Text("1RM estimado")) {
                Text("\(Fmt.num(oneRM.rounded())) \(store.unit)")
                    .font(.largeTitle.bold())
                    .foregroundColor(.brand)
            }
            if oneRM > 0 {
                Section(header: Text("Porcentajes")) {
                    ForEach([100, 95, 90, 85, 80, 75, 70, 65, 60, 50], id: \.self) { p in
                        HStack {
                            Text("\(p)%").frame(width: 50, alignment: .leading)
                            Text("\(Fmt.num((oneRM * Double(p) / 100).rounded())) \(store.unit)").bold()
                            Spacer()
                            Text("≈ \(max(1, Int((30 * (100 / Double(p) - 1)).rounded()))) reps")
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
        }
        .navigationTitle("Calculadora de 1RM")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Calculadora de discos

struct PlateCalculatorView: View {
    @EnvironmentObject var store: Store
    @State var target: Double = 0
    @State var bar: Double = 20

    var isKg: Bool { store.data.settings.unit == .kg }
    var bars: [Double] { isKg ? [20, 15, 10, 0] : [45, 35, 25, 0] }
    var plates: [Double] { isKg ? [25, 20, 15, 10, 5, 2.5, 1.25] : [45, 35, 25, 10, 5, 2.5] }

    var perSide: (plates: [Double], remainder: Double) {
        var remaining = max(0, (target - bar) / 2)
        var result: [Double] = []
        for p in plates {
            while remaining >= p - 0.0001 {
                result.append(p)
                remaining -= p
            }
        }
        return (result, remaining * 2)
    }

    func color(_ p: Double) -> Color {
        switch p {
        case 25, 45: return .red
        case 20, 35: return .blue
        case 15: return .yellow
        case 10: return .green
        default: return .gray
        }
    }

    var body: some View {
        Form {
            Section {
                HStack {
                    Text("Peso objetivo (\(store.unit))")
                    Spacer()
                    NumberField("0", value: $target).frame(width: 90)
                }
                Picker("Barra", selection: $bar) {
                    ForEach(bars, id: \.self) { b in
                        Text(b == 0 ? "Sin barra" : "\(Fmt.num(b)) \(store.unit)").tag(b)
                    }
                }
                .pickerStyle(.segmented)
            }
            if target > bar {
                Section(header: Text("Discos por lado")) {
                    HStack(alignment: .center, spacing: 3) {
                        Rectangle().fill(Color.gray).frame(width: 40, height: 10)
                        ForEach(Array(perSide.plates.enumerated()), id: \.offset) { item in
                            RoundedRectangle(cornerRadius: 3)
                                .fill(color(item.element))
                                .frame(width: 14, height: CGFloat(40 + item.element * (isKg ? 3.2 : 1.8)))
                        }
                        Rectangle().fill(Color.gray).frame(width: 14, height: 10)
                        Spacer()
                    }
                    .frame(height: 130)
                    Text(perSide.plates.map { Fmt.num($0) }.joined(separator: " + "))
                        .font(.headline)
                    if perSide.remainder > 0.01 {
                        Text("No se puede cargar exacto. Faltan \(Fmt.num(perSide.remainder)) \(store.unit).")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }
            }
        }
        .navigationTitle("Calculadora de discos")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { bar = isKg ? 20 : 45 }
    }
}

// MARK: - Calentamiento

struct WarmupCalculatorView: View {
    @EnvironmentObject var store: Store
    @State var working: Double = 0

    var isKg: Bool { store.data.settings.unit == .kg }

    func round(_ v: Double) -> Double {
        let step = isKg ? 2.5 : 5
        return (v / step).rounded() * step
    }

    var steps: [(Double, Int)] {
        let bar = isKg ? 20.0 : 45.0
        return [(0.0, 10), (0.4, 5), (0.6, 3), (0.8, 2), (0.9, 1)].map { item in
            item.0 == 0 ? (bar, item.1) : (max(bar, round(working * item.0)), item.1)
        }
    }

    var body: some View {
        Form {
            Section(header: Text("Peso de tu serie efectiva")) {
                HStack {
                    Text("Peso (\(store.unit))")
                    Spacer()
                    NumberField("0", value: $working).frame(width: 90)
                }
            }
            if working > 0 {
                Section(header: Text("Calentamiento sugerido")) {
                    ForEach(Array(steps.enumerated()), id: \.offset) { item in
                        HStack {
                            Text("Serie \(item.offset + 1)")
                            Spacer()
                            Text("\(Fmt.num(item.element.0)) \(store.unit) × \(item.element.1)").bold()
                        }
                    }
                    HStack {
                        Text("Serie efectiva").foregroundColor(.brand)
                        Spacer()
                        Text("\(Fmt.num(working)) \(store.unit)").bold().foregroundColor(.brand)
                    }
                }
            }
        }
        .navigationTitle("Calentamiento")
        .navigationBarTitleDisplayMode(.inline)
    }
}
