import SwiftUI

enum MeasureField: String, CaseIterable, Identifiable {
    case weight = "Peso corporal"
    case bodyFat = "% grasa"
    case waist = "Cintura"
    case chest = "Pecho"
    case arm = "Brazo"
    case thigh = "Muslo"
    var id: String { rawValue }

    func value(_ m: BodyMeasurement) -> Double {
        switch self {
        case .weight: return m.weight
        case .bodyFat: return m.bodyFat
        case .waist: return m.waist
        case .chest: return m.chest
        case .arm: return m.arm
        case .thigh: return m.thigh
        }
    }

    func unit(_ weightUnit: String) -> String {
        switch self {
        case .weight: return weightUnit
        case .bodyFat: return "%"
        default: return "cm"
        }
    }
}

struct ProgressTabView: View {
    @EnvironmentObject var store: Store
    @State var showAddMeasurement = false
    @State var measureField: MeasureField = .weight

    var weeks: [WeekStat] { store.weeklyStats(weeks: 8) }

    var measurementsWithValue: [BodyMeasurement] {
        store.data.measurements.filter { measureField.value($0) > 0 }.sorted { $0.date < $1.date }
    }

    var totals: (count: Int, volume: Double, time: TimeInterval, sets: Int) {
        let ws = store.data.workouts
        return (ws.count, ws.reduce(0) { $0 + $1.volume }, ws.reduce(0) { $0 + $1.duration }, ws.reduce(0) { $0 + $1.setCount })
    }

    var body: some View {
        NavigationView {
            List {
                Section(header: Text("Total")) {
                    HStack {
                        StatTile(title: "Entrenamientos", value: "\(totals.count)")
                        StatTile(title: "Series", value: "\(totals.sets)")
                    }
                    HStack {
                        StatTile(title: "Volumen", value: "\(Fmt.int(totals.volume)) \(store.unit)")
                        StatTile(title: "Tiempo", value: Fmt.duration(totals.time))
                    }
                }

                Section(header: Text("Volumen semanal (\(store.unit))")) {
                    BarChart(values: weeks.map { $0.volume }, labels: weeks.map { Fmt.dayMonth($0.start) })
                }

                Section(header: Text("Entrenamientos por semana")) {
                    BarChart(values: weeks.map { Double($0.count) },
                             labels: weeks.map { "\($0.count)" },
                             color: .blue)
                }

                Section(header: Text("Series por músculo · últimos 30 días")) {
                    let stats = store.muscleStats(days: 30)
                    if stats.isEmpty {
                        Text("Sin datos todavía").foregroundColor(.secondary)
                    }
                    ForEach(stats) { s in
                        HStack {
                            Text(s.muscle.rawValue)
                                .font(.subheadline)
                                .frame(width: 120, alignment: .leading)
                            GeometryReader { g in
                                Capsule()
                                    .fill(Color.brand)
                                    .frame(width: max(4, g.size.width * CGFloat(s.sets) / CGFloat(max(stats.first?.sets ?? 1, 1))))
                            }
                            .frame(height: 10)
                            Text("\(s.sets)")
                                .font(.caption.monospacedDigit())
                                .frame(width: 32, alignment: .trailing)
                        }
                    }
                }

                Section(header: measurementHeader) {
                    Picker("Medida", selection: $measureField) {
                        ForEach(MeasureField.allCases) { f in Text(f.rawValue).tag(f) }
                    }
                    .pickerStyle(.menu)
                    if measurementsWithValue.count >= 2 {
                        LineChart(values: measurementsWithValue.suffix(30).map { measureField.value($0) }, color: .green)
                        if let first = measurementsWithValue.first, let last = measurementsWithValue.last {
                            let diff = measureField.value(last) - measureField.value(first)
                            Text("Cambio: \(diff >= 0 ? "+" : "")\(Fmt.num(diff)) \(measureField.unit(store.unit)) desde \(Fmt.shortDate(first.date))")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    if store.data.measurements.isEmpty {
                        Text("Registra tu peso y medidas para ver tu evolución.")
                            .foregroundColor(.secondary)
                    }
                    ForEach(store.data.measurements) { m in
                        HStack {
                            Text(Fmt.shortDate(m.date))
                            Spacer()
                            Text(measurementSummary(m))
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.trailing)
                        }
                    }
                    .onDelete { store.data.measurements.remove(atOffsets: $0) }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Progreso")
            .sheet(isPresented: $showAddMeasurement) {
                AddMeasurementView()
                    .environmentObject(store)
            }
            .activeWorkoutBanner()
        }
        .navigationViewStyle(.stack)
    }

    var measurementHeader: some View {
        HStack {
            Text("Medidas corporales")
            Spacer()
            Button {
                showAddMeasurement = true
            } label: {
                Label("Añadir", systemImage: "plus")
            }
            .font(.caption.bold())
        }
    }

    func measurementSummary(_ m: BodyMeasurement) -> String {
        MeasureField.allCases
            .filter { $0.value(m) > 0 }
            .map { "\($0.rawValue): \(Fmt.num($0.value(m))) \($0.unit(store.unit))" }
            .joined(separator: "\n")
    }
}

struct AddMeasurementView: View {
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) var dismiss
    @State var m = BodyMeasurement()

    var body: some View {
        NavigationView {
            Form {
                DatePicker("Fecha", selection: $m.date)
                row("Peso corporal (\(store.unit))", $m.weight)
                row("% grasa corporal", $m.bodyFat)
                row("Cintura (cm)", $m.waist)
                row("Pecho (cm)", $m.chest)
                row("Brazo (cm)", $m.arm)
                row("Muslo (cm)", $m.thigh)
            }
            .navigationTitle("Nueva medida")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar") {
                        store.data.measurements.append(m)
                        store.data.measurements.sort { $0.date > $1.date }
                        dismiss()
                    }
                    .disabled(MeasureField.allCases.allSatisfy { $0.value(m) == 0 })
                }
            }
        }
    }

    func row(_ title: String, _ value: Binding<Double>) -> some View {
        HStack {
            Text(title)
            Spacer()
            NumberField("—", value: value)
                .frame(width: 90)
        }
    }
}
