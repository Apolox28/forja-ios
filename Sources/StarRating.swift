import SwiftUI

/// Preguntas voluntarias al terminar un entrenamiento.
enum WorkoutRating {
    static let questions: [(key: String, title: String)] = [
        ("feeling", "Cómo te sientes"),
        ("fatigue", "Cansancio"),
        ("energy", "Energía"),
        ("motivation", "Motivación"),
        ("soreness", "Molestias o dolor"),
    ]
}

/// Cinco estrellas con medias (0, 0,5 … 5). Toca o desliza; tocar el mismo valor lo borra.
struct StarRating: View {
    @Binding var value: Double
    var editable = true
    private let size: CGFloat = 24
    private let spacing: CGFloat = 4

    var body: some View {
        HStack(spacing: spacing) {
            ForEach(0..<5) { i in
                Image(systemName: symbol(for: i))
                    .font(.system(size: size * 0.8))
                    .frame(width: size, height: size)
                    .foregroundColor(value > Double(i) ? .yellow : Color(.tertiaryLabel))
            }
        }
        .contentShape(Rectangle())
        .gesture(DragGesture(minimumDistance: 0)
            .onChanged { g in
                if startValue == nil { startValue = value }
                value = Self.rating(at: g.location.x, size: size, spacing: spacing)
            }
            .onEnded { g in
                // Un toque (sin deslizar) sobre el valor que ya estaba lo deja en blanco.
                if abs(g.translation.width) < 4, let s = startValue, s == value { value = 0 }
                startValue = nil
            }, including: editable ? .all : .subviews)
        .accessibilityElement()
        .accessibilityLabel("\(Fmt.num(value)) de 5 estrellas")
        .accessibilityAdjustableAction { dir in
            guard editable else { return }
            switch dir {
            case .increment: value = min(5, value + 0.5)
            case .decrement: value = max(0, value - 0.5)
            @unknown default: break
            }
        }
    }

    @State private var startValue: Double? = nil

    private func symbol(for i: Int) -> String {
        if value >= Double(i) + 1 { return "star.fill" }
        if value >= Double(i) + 0.5 { return "star.leadinghalf.filled" }
        return "star"
    }

    /// Posición del dedo → valor en medias estrellas (0,5 … 5).
    static func rating(at x: CGFloat, size: CGFloat, spacing: CGFloat) -> Double {
        let slot = size + spacing
        let idx = max(0, min(4, Int(x / slot)))
        let within = x - CGFloat(idx) * slot
        return Double(idx) + (within < size / 2 ? 0.5 : 1)
    }
}
