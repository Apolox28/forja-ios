import SwiftUI

/// Bienvenida para quien abre Forja por primera vez. Todo es voluntario: se puede omitir o cerrar.
/// Los datos van a los mismos sitios que ya usan Perfil y Herramientas (calorías, IMC, etc.).
struct WelcomeView: View {
    @EnvironmentObject var store: Store
    @AppStorage("welcomeDone") var welcomeDone = false
    @AppStorage("profileName") var name: String = ""
    @AppStorage("bioSex") var sex: String = Sex.male.rawValue
    @AppStorage("bioAge") var age: Double = 30
    @AppStorage("bioHeight") var height: Double = 175
    @State private var weight: Double = 0

    var body: some View {
        NavigationView {
            Form {
                Section {
                    VStack(spacing: 10) {
                        Image("LaunchLogo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 110, height: 110)
                            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                        Text("¡Bienvenido a Forja!").font(.title2.bold())
                        Text("Cuéntanos un poco de ti para ajustar calorías, récords y consejos. Es opcional: puedes omitirlo y cambiarlo cuando quieras en Perfil.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .listRowBackground(Color.clear)
                }
                Section(header: Text("Sobre ti")) {
                    TextField("Tu nombre", text: $name)
                    Picker("Sexo", selection: $sex) {
                        ForEach(Sex.allCases) { s in Text(LocalizedStringKey(s.rawValue)).tag(s.rawValue) }
                    }
                    .pickerStyle(.segmented)
                    row("Edad (años)", $age, decimals: false)
                    row("Altura (cm)", $height, decimals: false)
                    row("Peso (\(store.unit))", $weight, decimals: true)
                }
                Section(header: Text("Entrenamiento")) {
                    Picker("Unidad de peso", selection: $store.data.settings.unit) {
                        ForEach(WeightUnit.allCases) { u in Text(u.rawValue).tag(u) }
                    }
                    .pickerStyle(.segmented)
                    Stepper("Objetivo semanal: \(store.data.settings.weeklyGoal) días",
                            value: $store.data.settings.weeklyGoal, in: 1...7)
                }
                Section {
                    Button {
                        finish(save: true)
                    } label: {
                        Text("Empezar").bold().frame(maxWidth: .infinity)
                    }
                    Button("Omitir") { finish(save: false) }
                        .frame(maxWidth: .infinity)
                        .foregroundColor(.secondary)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { finish(save: false) } label: { Image(systemName: "xmark") }
                        .accessibilityLabel("Cerrar")
                }
            }
        }
        .navigationViewStyle(.stack)
    }

    func row(_ title: String, _ value: Binding<Double>, decimals: Bool) -> some View {
        HStack {
            Text(LocalizedStringKey(title))
            Spacer()
            NumberField("—", value: value, allowsDecimal: decimals).frame(width: 90)
        }
    }

    func finish(save: Bool) {
        // El peso se guarda como primera medida, así aparece en Progreso.
        if save && weight > 0 {
            var m = BodyMeasurement()
            m.weight = weight
            store.data.measurements.insert(m, at: 0)
        }
        welcomeDone = true
    }
}
