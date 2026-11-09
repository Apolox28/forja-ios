import SwiftUI

/// Botón con el tiempo de descanso del ejercicio. Al tocarlo se elige otro tiempo.
struct RestTimeButton: View {
    let seconds: Int
    let onChange: (Int) -> Void
    @State var showCustom = false

    static let quick = [0, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300]

    var body: some View {
        Menu {
            Section("Descanso entre series") {
                ForEach(RestTimeButton.quick, id: \.self) { s in
                    Button {
                        onChange(s)
                    } label: {
                        if s == seconds {
                            Label(Fmt.rest(s), systemImage: "checkmark")
                        } else {
                            Text(Fmt.rest(s))
                        }
                    }
                }
            }
            Button {
                showCustom = true
            } label: {
                Label("Personalizado…", systemImage: "slider.horizontal.3")
            }
        } label: {
            HStack(spacing: 4) {
                Image(systemName: "timer")
                Text(seconds == 0 ? "Sin descanso" : Fmt.clock(TimeInterval(seconds)))
                    .monospacedDigit()
            }
            .font(.subheadline.weight(.semibold))
            .foregroundColor(.brand)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Capsule().fill(Color.brand.opacity(0.14)))
        }
        .sheet(isPresented: $showCustom) {
            RestPickerSheet(seconds: seconds, onSave: onChange)
        }
    }
}

struct RestPickerSheet: View {
    @Environment(\.dismiss) var dismiss
    let onSave: (Int) -> Void
    @State var minutes: Int
    @State var secs: Int

    init(seconds: Int, onSave: @escaping (Int) -> Void) {
        self.onSave = onSave
        _minutes = State(initialValue: seconds / 60)
        _secs = State(initialValue: (seconds % 60) / 5 * 5)
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 16) {
                Text(Fmt.clock(TimeInterval(minutes * 60 + secs)))
                    .font(.system(size: 48, weight: .bold, design: .rounded).monospacedDigit())
                    .foregroundColor(.brand)
                    .padding(.top, 12)
                HStack(spacing: 0) {
                    Picker("Minutos", selection: $minutes) {
                        ForEach(0..<11) { m in Text("\(m) min").tag(m) }
                    }
                    .pickerStyle(.wheel)
                    .frame(maxWidth: .infinity)
                    .clipped()
                    Picker("Segundos", selection: $secs) {
                        ForEach(Array(stride(from: 0, to: 60, by: 5)), id: \.self) { s in Text("\(s) s").tag(s) }
                    }
                    .pickerStyle(.wheel)
                    .frame(maxWidth: .infinity)
                    .clipped()
                }
                Text("Forja recordará este descanso para este ejercicio.")
                    .font(.footnote)
                    .foregroundColor(.secondary)
                Spacer()
            }
            .padding(.horizontal)
            .navigationTitle("Tiempo de descanso")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar") {
                        onSave(minutes * 60 + secs)
                        dismiss()
                    }
                }
            }
        }
    }
}
