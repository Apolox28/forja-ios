import SwiftUI
import UIKit
import AudioToolbox

// MARK: - Datos personales compartidos por las calculadoras

enum Sex: String, CaseIterable, Identifiable {
    case male = "Hombre"
    case female = "Mujer"
    var id: String { rawValue }
}

struct BodyInputs: View {
    @AppStorage("bioSex") var sex: String = Sex.male.rawValue
    @AppStorage("bioAge") var age: Double = 30
    @AppStorage("bioHeight") var height: Double = 175
    @EnvironmentObject var store: Store
    @Binding var weight: Double

    var body: some View {
        Picker("Sexo", selection: $sex) {
            ForEach(Sex.allCases) { s in Text(s.rawValue).tag(s.rawValue) }
        }
        .pickerStyle(.segmented)
        Stepper("Edad: \(Int(age)) años", value: $age, in: 14...90)
        Stepper("Altura: \(Int(height)) cm", value: $height, in: 120...220)
        HStack {
            Text("Peso (kg)")
            Spacer()
            NumberField("0", value: $weight).frame(width: 90)
        }
    }
}

extension Store {
    /// Último peso corporal registrado, en kg.
    var lastBodyWeightKg: Double {
        guard let w = data.measurements.first(where: { $0.weight > 0 })?.weight else { return 0 }
        return data.settings.unit == .lb ? w / 2.20462 : w
    }
}

// MARK: - Calorías y macros

struct CaloriesToolView: View {
    @EnvironmentObject var store: Store
    @AppStorage("bioSex") var sex: String = Sex.male.rawValue
    @AppStorage("bioAge") var age: Double = 30
    @AppStorage("bioHeight") var height: Double = 175
    @State var weight: Double = 0
    @State var activity: Double = 1.55
    @State var goal: Int = 0

    let activities: [(String, Double)] = [
        ("Sedentario", 1.2), ("Ligero (1–3 días)", 1.375), ("Moderado (3–5 días)", 1.55),
        ("Alto (6–7 días)", 1.725), ("Muy alto (doble sesión)", 1.9),
    ]
    let goals: [(String, Double)] = [("Perder grasa", -400), ("Mantener", 0), ("Ganar músculo", 250)]

    var bmr: Double {
        guard weight > 0 else { return 0 }
        let base = 10 * weight + 6.25 * height - 5 * age
        return sex == Sex.male.rawValue ? base + 5 : base - 161
    }
    var maintenance: Double { bmr * activity }
    var target: Double { max(0, maintenance + goals[goal].1) }
    var protein: Double { weight * (goal == 0 ? 2.2 : 1.8) }
    var fat: Double { weight * 0.9 }
    var carbs: Double { max(0, (target - protein * 4 - fat * 9) / 4) }

    var body: some View {
        Form {
            Section(header: Text("Tus datos")) {
                BodyInputs(weight: $weight)
                Picker("Actividad", selection: $activity) {
                    ForEach(activities.indices, id: \.self) { i in Text(activities[i].0).tag(activities[i].1) }
                }
                Picker("Objetivo", selection: $goal) {
                    ForEach(goals.indices, id: \.self) { i in Text(goals[i].0).tag(i) }
                }
                .pickerStyle(.segmented)
            }
            if weight > 0 {
                Section(header: Text("Resultado")) {
                    HStack {
                        StatTile(title: "Metabolismo basal", value: "\(Int(bmr)) kcal")
                        StatTile(title: "Mantenimiento", value: "\(Int(maintenance)) kcal")
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Objetivo diario").font(.caption).foregroundColor(.secondary)
                        Text("\(Int(target)) kcal").font(.largeTitle.bold()).foregroundColor(.brand)
                    }
                }
                Section(header: Text("Macros diarios")) {
                    macroRow("Proteína", grams: protein, kcal: 4, color: .red)
                    macroRow("Carbohidratos", grams: carbs, kcal: 4, color: .blue)
                    macroRow("Grasas", grams: fat, kcal: 9, color: .yellow)
                }
                Section(footer: Text("Estimación con la fórmula de Mifflin-St Jeor. Ajusta según cómo cambie tu peso en 2–3 semanas.")) { EmptyView() }
            }
        }
        .navigationTitle("Calorías y macros")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { if weight == 0 { weight = store.lastBodyWeightKg.rounded() } }
    }

    func macroRow(_ name: String, grams: Double, kcal: Double, color: Color) -> some View {
        HStack {
            Circle().fill(color).frame(width: 10, height: 10)
            Text(name)
            Spacer()
            Text("\(Int(grams.rounded())) g").bold()
            Text("· \(Int(grams * kcal)) kcal").font(.caption).foregroundColor(.secondary)
        }
    }
}

// MARK: - IMC y grasa corporal

struct BodyCompositionToolView: View {
    @EnvironmentObject var store: Store
    @AppStorage("bioSex") var sex: String = Sex.male.rawValue
    @AppStorage("bioHeight") var height: Double = 175
    @State var weight: Double = 0
    @State var waist: Double = 0
    @State var neck: Double = 0
    @State var hip: Double = 0

    var bmi: Double { height > 0 && weight > 0 ? weight / pow(height / 100, 2) : 0 }

    var bmiText: (String, Color) {
        switch bmi {
        case ..<18.5: return ("Bajo peso", .blue)
        case ..<25: return ("Normal", .green)
        case ..<30: return ("Sobrepeso", .orange)
        default: return ("Obesidad", .red)
        }
    }

    /// Método de la Marina de EE. UU. (medidas en cm).
    var bodyFat: Double? {
        guard waist > 0, neck > 0, height > 0 else { return nil }
        if sex == Sex.male.rawValue {
            guard waist > neck else { return nil }
            return 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
        } else {
            guard hip > 0, waist + hip > neck else { return nil }
            return 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
        }
    }

    var body: some View {
        Form {
            Section(header: Text("Tus datos")) {
                BodyInputs(weight: $weight)
            }
            if bmi > 0 {
                Section(header: Text("Índice de masa corporal")) {
                    HStack {
                        Text(String(format: "%.1f", bmi)).font(.largeTitle.bold())
                        Spacer()
                        Text(bmiText.0).bold().foregroundColor(bmiText.1)
                    }
                    Text("El IMC no distingue músculo de grasa: si tienes mucha masa muscular puede salir alto.")
                        .font(.caption).foregroundColor(.secondary)
                }
            }
            Section(header: Text("% de grasa (método de la Marina)"),
                    footer: Text("Mide con cinta métrica: cuello bajo la nuez, cintura a la altura del ombligo y cadera en la parte más ancha.")) {
                measureRow("Cuello (cm)", $neck)
                measureRow("Cintura (cm)", $waist)
                if sex == Sex.female.rawValue { measureRow("Cadera (cm)", $hip) }
                if let bf = bodyFat, bf > 2, bf < 60 {
                    HStack {
                        Text("Grasa corporal estimada")
                        Spacer()
                        Text(String(format: "%.1f %%", bf)).font(.title3.bold()).foregroundColor(.brand)
                    }
                }
            }
        }
        .navigationTitle("IMC y grasa corporal")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if weight == 0 { weight = store.lastBodyWeightKg.rounded() }
            if waist == 0, let w = store.data.measurements.first(where: { $0.waist > 0 })?.waist { waist = w }
        }
    }

    func measureRow(_ title: String, _ value: Binding<Double>) -> some View {
        HStack {
            Text(title)
            Spacer()
            NumberField("0", value: value).frame(width: 90)
        }
    }
}

// MARK: - Zonas de frecuencia cardiaca

struct HeartZonesToolView: View {
    @AppStorage("bioAge") var age: Double = 30
    @State var resting: Double = 0

    var maxHR: Double { 208 - 0.7 * age }
    let zones: [(String, Double, Double, Color, String)] = [
        ("Zona 1", 0.50, 0.60, .gray, "Recuperación"),
        ("Zona 2", 0.60, 0.70, .blue, "Base aeróbica"),
        ("Zona 3", 0.70, 0.80, .green, "Tempo"),
        ("Zona 4", 0.80, 0.90, .orange, "Umbral"),
        ("Zona 5", 0.90, 1.00, .red, "Máximo"),
    ]

    func bpm(_ pct: Double) -> Int {
        // Con pulso en reposo se usa el método de Karvonen.
        if resting > 30 { return Int((resting + (maxHR - resting) * pct).rounded()) }
        return Int((maxHR * pct).rounded())
    }

    var body: some View {
        Form {
            Section(header: Text("Tus datos")) {
                Stepper("Edad: \(Int(age)) años", value: $age, in: 14...90)
                HStack {
                    Text("Pulso en reposo (opcional)")
                    Spacer()
                    NumberField("—", value: $resting, allowsDecimal: false).frame(width: 80)
                }
            }
            Section(header: Text("FC máxima estimada: \(Int(maxHR)) ppm")) {
                ForEach(zones.indices, id: \.self) { i in
                    let z = zones[i]
                    HStack {
                        RoundedRectangle(cornerRadius: 3).fill(z.3).frame(width: 6, height: 34)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(z.0).bold()
                            Text(z.4).font(.caption).foregroundColor(.secondary)
                        }
                        Spacer()
                        Text("\(bpm(z.1))–\(bpm(z.2)) ppm").font(.subheadline.monospacedDigit().bold())
                    }
                }
            }
        }
        .navigationTitle("Zonas de pulso")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Temporizador de intervalos (HIIT / Tabata)

struct IntervalTimerView: View {
    @State var work: Int = 20
    @State var rest: Int = 10
    @State var rounds: Int = 8
    @State var running = false
    @State var paused = false
    @State var start = Date()
    @State var pausedElapsed: TimeInterval = 0
    @State var lastPhaseKey = ""

    var cycle: Int { work + rest }
    var total: Int { cycle * rounds }

    func state(at date: Date) -> (phase: String, round: Int, left: Int, done: Bool, progress: Double) {
        let elapsed = paused ? pausedElapsed : pausedElapsed + date.timeIntervalSince(start)
        let e = Int(elapsed)
        if e >= total { return ("¡Terminado!", rounds, 0, true, 1) }
        let r = e / cycle + 1
        let inCycle = e % cycle
        if inCycle < work {
            return ("Trabajo", r, work - inCycle, false, Double(inCycle) / Double(max(work, 1)))
        }
        return ("Descanso", r, cycle - inCycle, false, Double(inCycle - work) / Double(max(rest, 1)))
    }

    var body: some View {
        Form {
            if running {
                Section {
                    TimelineView(.periodic(from: Date(), by: 0.25)) { ctx in
                        let s = state(at: ctx.date)
                        VStack(spacing: 10) {
                            Text(s.phase)
                                .font(.title2.bold())
                                .foregroundColor(s.phase == "Trabajo" ? .brand : (s.done ? .green : .blue))
                            ZStack {
                                Circle().stroke(Color.primary.opacity(0.1), lineWidth: 12)
                                Circle()
                                    .trim(from: 0, to: 1 - s.progress)
                                    .stroke(s.phase == "Trabajo" ? Color.brand : Color.blue,
                                            style: StrokeStyle(lineWidth: 12, lineCap: .round))
                                    .rotationEffect(.degrees(-90))
                                    .animation(.linear(duration: 0.25), value: s.progress)
                                Text("\(s.left)")
                                    .font(.system(size: 64, weight: .bold, design: .rounded).monospacedDigit())
                            }
                            .frame(width: 200, height: 200)
                            Text("Ronda \(s.round) de \(rounds)").foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .onChange(of: "\(s.phase)-\(s.round)") { key in
                            if key != lastPhaseKey {
                                lastPhaseKey = key
                                AudioServicesPlaySystemSound(1057)
                                UINotificationFeedbackGenerator().notificationOccurred(.warning)
                            }
                        }
                    }
                    HStack {
                        Button(paused ? "Reanudar" : "Pausa") {
                            if paused { start = Date(); paused = false }
                            else { pausedElapsed += Date().timeIntervalSince(start); paused = true }
                        }
                        .buttonStyle(.borderedProminent)
                        Spacer()
                        Button("Terminar", role: .destructive) { running = false }
                            .buttonStyle(.bordered)
                    }
                }
            } else {
                Section(header: Text("Configuración")) {
                    Stepper("Trabajo: \(work) s", value: $work, in: 5...300, step: 5)
                    Stepper("Descanso: \(rest) s", value: $rest, in: 0...300, step: 5)
                    Stepper("Rondas: \(rounds)", value: $rounds, in: 1...50)
                    Text("Duración total: \(Fmt.clock(TimeInterval(total)))").foregroundColor(.secondary)
                }
                Section(header: Text("Rápidos")) {
                    Button("Tabata (20 s / 10 s × 8)") { work = 20; rest = 10; rounds = 8 }
                    Button("EMOM 10 min (60 s × 10)") { work = 60; rest = 0; rounds = 10 }
                    Button("HIIT 40/20 × 10") { work = 40; rest = 20; rounds = 10 }
                }
                Section {
                    Button {
                        pausedElapsed = 0
                        start = Date()
                        paused = false
                        lastPhaseKey = ""
                        running = true
                    } label: {
                        Label("Empezar", systemImage: "play.fill").frame(maxWidth: .infinity).font(.headline)
                    }
                }
            }
        }
        .navigationTitle("Intervalos")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { UIApplication.shared.isIdleTimerDisabled = true }
        .onDisappear { UIApplication.shared.isIdleTimerDisabled = false }
    }
}

// MARK: - Cronómetro

struct StopwatchView: View {
    @State var running = false
    @State var start = Date()
    @State var accumulated: TimeInterval = 0
    @State var laps: [TimeInterval] = []

    func elapsed(_ now: Date) -> TimeInterval { accumulated + (running ? now.timeIntervalSince(start) : 0) }

    func format(_ t: TimeInterval) -> String {
        let cs = Int((t * 100).rounded(.down)) % 100
        return Fmt.clock(t) + String(format: ",%02d", cs)
    }

    var body: some View {
        List {
            Section {
                TimelineView(.periodic(from: Date(), by: 0.05)) { ctx in
                    Text(format(elapsed(ctx.date)))
                        .font(.system(size: 52, weight: .bold, design: .rounded).monospacedDigit())
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                }
                HStack {
                    Button(running ? "Vuelta" : "Reiniciar") {
                        if running { laps.insert(elapsed(Date()), at: 0) }
                        else { accumulated = 0; laps = [] }
                    }
                    .buttonStyle(.bordered)
                    .disabled(!running && accumulated == 0)
                    Spacer()
                    Button(running ? "Parar" : "Iniciar") {
                        if running { accumulated += Date().timeIntervalSince(start); running = false }
                        else { start = Date(); running = true }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(running ? .red : .green)
                }
            }
            if !laps.isEmpty {
                Section(header: Text("Vueltas")) {
                    ForEach(laps.indices, id: \.self) { i in
                        let lap = laps[i] - (i + 1 < laps.count ? laps[i + 1] : 0)
                        HStack {
                            Text("Vuelta \(laps.count - i)")
                            Spacer()
                            Text(format(lap)).monospacedDigit()
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Cronómetro")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Ritmo de carrera

struct PaceToolView: View {
    @State var distance: Double = 5
    @State var hours: Int = 0
    @State var minutes: Int = 25
    @State var seconds: Int = 0

    let raceList: [(Double, String)] = [(5.0, "5 km"), (10.0, "10 km"), (21.0975, "Media maratón"), (42.195, "Maratón")]

    var totalSeconds: Double { Double(hours * 3600 + minutes * 60 + seconds) }
    var pace: Double { distance > 0 ? totalSeconds / distance : 0 }
    var speed: Double { totalSeconds > 0 ? distance / (totalSeconds / 3600) : 0 }

    var body: some View {
        Form {
            Section(header: Text("Distancia y tiempo")) {
                HStack {
                    Text("Distancia (km)")
                    Spacer()
                    NumberField("0", value: $distance).frame(width: 90)
                }
                HStack {
                    Picker("h", selection: $hours) { ForEach(0..<10) { Text("\($0) h").tag($0) } }
                    Picker("min", selection: $minutes) { ForEach(0..<60) { Text("\($0) min").tag($0) } }
                    Picker("s", selection: $seconds) { ForEach(0..<60) { Text("\($0) s").tag($0) } }
                }
                .pickerStyle(.menu)
                HStack {
                    Button("5 km") { distance = 5 }
                    Button("10 km") { distance = 10 }
                    Button("21,1 km") { distance = 21.0975 }
                    Button("42,2 km") { distance = 42.195 }
                }
                .buttonStyle(.bordered)
                .font(.caption)
            }
            if pace > 0 {
                Section(header: Text("Resultado")) {
                    HStack {
                        StatTile(title: "Ritmo", value: "\(Fmt.clock(pace)) /km")
                        StatTile(title: "Velocidad", value: String(format: "%.1f km/h", speed))
                    }
                }
                Section(header: Text("Con este ritmo")) {
                    ForEach(raceList.indices, id: \.self) { i in
                        HStack {
                            Text(raceList[i].1)
                            Spacer()
                            Text(Fmt.clock(pace * raceList[i].0)).monospacedDigit().bold()
                        }
                    }
                }
            }
        }
        .navigationTitle("Ritmo de carrera")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Hidratación

struct HydrationToolView: View {
    @EnvironmentObject var store: Store
    @State var weight: Double = 0
    @State var trainingMinutes: Double = 60
    @State var hot = false

    var liters: Double {
        guard weight > 0 else { return 0 }
        var ml = weight * 33
        ml += trainingMinutes / 30 * 350
        if hot { ml += 500 }
        return ml / 1000
    }

    var body: some View {
        Form {
            Section(header: Text("Tus datos")) {
                HStack {
                    Text("Peso (kg)")
                    Spacer()
                    NumberField("0", value: $weight).frame(width: 90)
                }
                Stepper("Entrenamiento: \(Int(trainingMinutes)) min", value: $trainingMinutes, in: 0...240, step: 15)
                Toggle("Hace calor o sudas mucho", isOn: $hot)
            }
            if liters > 0 {
                Section(header: Text("Agua recomendada hoy")) {
                    Text(String(format: "%.1f litros", liters)).font(.largeTitle.bold()).foregroundColor(.blue)
                    Text("≈ \(Int((liters / 0.25).rounded())) vasos de 250 ml. Incluye el agua de las comidas y bebidas.")
                        .font(.caption).foregroundColor(.secondary)
                }
            }
        }
        .navigationTitle("Hidratación")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { if weight == 0 { weight = store.lastBodyWeightKg.rounded() } }
    }
}

// MARK: - Conversor de unidades

struct ConverterToolView: View {
    @State var kg: Double = 100

    var body: some View {
        Form {
            Section(header: Text("Peso")) {
                HStack {
                    Text("Kilogramos")
                    Spacer()
                    NumberField("0", value: $kg).frame(width: 100)
                }
                HStack {
                    Text("Libras")
                    Spacer()
                    NumberField("0", value: Binding(get: { (kg * 2.20462 * 10).rounded() / 10 },
                                                    set: { kg = ($0 / 2.20462 * 100).rounded() / 100 }))
                        .frame(width: 100)
                }
            }
            Section(header: Text("Tabla rápida")) {
                ForEach([20.0, 40, 60, 80, 100, 120, 140, 160, 180, 200], id: \.self) { v in
                    HStack {
                        Text("\(Fmt.num(v)) kg")
                        Spacer()
                        Text("\(Fmt.num((v * 2.20462 * 10).rounded() / 10)) lb").foregroundColor(.secondary)
                    }
                }
            }
        }
        .navigationTitle("Conversor kg ↔ lb")
        .navigationBarTitleDisplayMode(.inline)
    }
}
