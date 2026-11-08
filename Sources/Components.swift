import SwiftUI
import UIKit

func hideKeyboard() {
    UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
}

extension Binding where Value == Int {
    var asDouble: Binding<Double> {
        Binding<Double>(
            get: { Double(self.wrappedValue) },
            set: { newValue in
                let clamped = Swift.min(Swift.max(newValue, 0), 1_000_000)
                self.wrappedValue = Int(clamped)
            }
        )
    }
}

/// Campo numérico que actualiza el valor mientras se escribe (acepta coma o punto).
struct NumberField: View {
    let placeholder: String
    @Binding var value: Double
    let allowsDecimal: Bool
    @State var text: String = ""

    init(_ placeholder: String, value: Binding<Double>, allowsDecimal: Bool = true) {
        self.placeholder = placeholder
        self._value = value
        self.allowsDecimal = allowsDecimal
    }

    var body: some View {
        TextField(placeholder, text: $text)
            .keyboardType(allowsDecimal ? .decimalPad : .numberPad)
            .multilineTextAlignment(.center)
            .padding(.vertical, 6)
            .padding(.horizontal, 4)
            .background(Color(.tertiarySystemFill))
            .cornerRadius(8)
            .onAppear { text = NumberField.format(value) }
            .onChange(of: text) { newText in
                let parsed = NumberField.parse(newText)
                if parsed != value { value = parsed }
            }
            .onChange(of: value) { newValue in
                if NumberField.parse(text) != newValue { text = NumberField.format(newValue) }
            }
    }

    static func parse(_ s: String) -> Double {
        let clean = s.replacingOccurrences(of: ",", with: ".").trimmingCharacters(in: .whitespaces)
        guard let v = Double(clean), v.isFinite, v >= 0 else { return 0 }
        return v
    }

    static func format(_ v: Double) -> String {
        v == 0 ? "" : Fmt.num(v)
    }
}

struct StatTile: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(value)
                .font(.headline.monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct ExerciseRow: View {
    let exercise: Exercise
    let selected: Bool

    var body: some View {
        HStack(spacing: 12) {
            ExerciseThumbnail(exercise: exercise, size: 48)
            VStack(alignment: .leading, spacing: 2) {
                Text(exercise.name)
                    .font(.body)
                    .foregroundColor(.primary)
                Text("\(exercise.muscle.rawValue) · \(exercise.equipment.rawValue)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            if selected {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.brand)
                    .font(.title3)
            }
        }
        .contentShape(Rectangle())
    }
}

struct LineChart: View {
    let values: [Double]
    var color: Color = .brand

    var body: some View {
        GeometryReader { geo in
            ZStack {
                Path { path in
                    for i in values.indices {
                        let p = point(i, in: geo.size)
                        if i == 0 { path.move(to: p) } else { path.addLine(to: p) }
                    }
                }
                .stroke(color, style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))
                ForEach(values.indices, id: \.self) { i in
                    Circle()
                        .fill(color)
                        .frame(width: 7, height: 7)
                        .position(point(i, in: geo.size))
                }
            }
        }
        .frame(height: 160)
        .padding(.vertical, 8)
    }

    func point(_ i: Int, in size: CGSize) -> CGPoint {
        let maxV = values.max() ?? 1
        let minV = values.min() ?? 0
        let range = max(maxV - minV, 0.0001)
        let x: CGFloat = values.count <= 1 ? size.width / 2 : size.width * CGFloat(i) / CGFloat(values.count - 1)
        let normalized = maxV == minV ? 0.5 : (values[i] - minV) / range
        let y = size.height - CGFloat(normalized) * (size.height - 10) - 5
        return CGPoint(x: x, y: y)
    }
}

struct BarChart: View {
    let values: [Double]
    let labels: [String]
    var color: Color = .brand

    var body: some View {
        let maxV = max(values.max() ?? 0, 1)
        return HStack(alignment: .bottom, spacing: 6) {
            ForEach(values.indices, id: \.self) { i in
                VStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(i == values.count - 1 ? color : color.opacity(0.55))
                        .frame(height: max(3, CGFloat(values[i] / maxV) * 120))
                    Text(i < labels.count ? labels[i] : "")
                        .font(.system(size: 9))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .frame(height: 145, alignment: .bottom)
        .padding(.vertical, 8)
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

/// Barra inferior para volver al entrenamiento en curso.
struct ActiveWorkoutBanner: ViewModifier {
    @EnvironmentObject var store: Store

    func body(content: Content) -> some View {
        content.safeAreaInset(edge: .bottom) {
            if let w = store.data.activeWorkout, !store.showActiveWorkout {
                Button {
                    store.showActiveWorkout = true
                } label: {
                    HStack {
                        Image(systemName: "flame.fill")
                        VStack(alignment: .leading, spacing: 1) {
                            Text(w.name).font(.subheadline.bold()).lineLimit(1)
                            TimelineView(.periodic(from: Date(), by: 1)) { ctx in
                                Text("En curso · \(Fmt.clock(ctx.date.timeIntervalSince(w.start)))")
                                    .font(.caption.monospacedDigit())
                            }
                        }
                        Spacer()
                        Text("Reanudar").font(.subheadline.bold())
                        Image(systemName: "chevron.up")
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color.brand)
                    .cornerRadius(14)
                    .padding(.horizontal, 12)
                    .padding(.bottom, 6)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

extension View {
    func activeWorkoutBanner() -> some View {
        modifier(ActiveWorkoutBanner())
    }
}
