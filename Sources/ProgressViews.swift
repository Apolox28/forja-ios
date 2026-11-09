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

// PROGRESS_TAB_PLACEHOLDER

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
