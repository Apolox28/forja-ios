import SwiftUI
import UIKit

// MARK: - Tema de la app (se guarda en el iPhone, no en los datos de entrenamiento)

enum AccentChoice: String, CaseIterable, Identifiable {
    case forja, red, pink, purple, blue, teal, green, gold, graphite

    var id: String { rawValue }

    var name: String {
        switch self {
        case .forja: return "Naranja Forja"
        case .red: return "Rojo"
        case .pink: return "Rosa"
        case .purple: return "Morado"
        case .blue: return "Azul"
        case .teal: return "Turquesa"
        case .green: return "Verde"
        case .gold: return "Dorado"
        case .graphite: return "Grafito"
        }
    }

    var color: Color {
        switch self {
        case .forja: return Color(red: 0.98, green: 0.42, blue: 0.18)
        case .red: return Color(red: 0.92, green: 0.22, blue: 0.24)
        case .pink: return Color(red: 0.94, green: 0.29, blue: 0.56)
        case .purple: return Color(red: 0.55, green: 0.36, blue: 0.96)
        case .blue: return Color(red: 0.16, green: 0.49, blue: 0.98)
        case .teal: return Color(red: 0.10, green: 0.70, blue: 0.70)
        case .green: return Color(red: 0.20, green: 0.72, blue: 0.36)
        case .gold: return Color(red: 0.90, green: 0.66, blue: 0.12)
        case .graphite: return Color(red: 0.45, green: 0.48, blue: 0.54)
        }
    }
}

enum BackgroundChoice: String, CaseIterable, Identifiable {
    case system, light, dark, black

    var id: String { rawValue }

    var name: String {
        switch self {
        case .system: return "Automático"
        case .light: return "Claro"
        case .dark: return "Oscuro"
        case .black: return "Negro"
        }
    }

    var icon: String {
        switch self {
        case .system: return "circle.lefthalf.filled"
        case .light: return "sun.max.fill"
        case .dark: return "moon.fill"
        case .black: return "moon.stars.fill"
        }
    }

    var scheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark, .black: return .dark
        }
    }
}

enum AppTheme {
    static var accent: AccentChoice {
        AccentChoice(rawValue: UserDefaults.standard.string(forKey: "themeAccent") ?? "") ?? .forja
    }

    static var background: BackgroundChoice {
        BackgroundChoice(rawValue: UserDefaults.standard.string(forKey: "themeBackground") ?? "") ?? .system
    }

    /// Fondo negro puro (pantallas OLED): se aplica a las listas de toda la app.
    static func applyUIKitAppearance() {
        let black = background == .black
        UITableView.appearance().backgroundColor = black ? .black : nil
        UICollectionView.appearance().backgroundColor = black ? .black : nil
        UITableViewCell.appearance().backgroundColor = black ? UIColor(white: 0.08, alpha: 1) : nil
        UITabBar.appearance().backgroundColor = black ? .black : nil
        UINavigationBar.appearance().backgroundColor = black ? .black : nil
    }
}

// MARK: - Sección en Perfil

struct AppearanceSection: View {
    @AppStorage("themeAccent") var accent: String = AccentChoice.forja.rawValue
    @AppStorage("themeBackground") var background: String = BackgroundChoice.system.rawValue

    let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 5)

    var body: some View {
        Section(header: Text("Apariencia"),
                footer: Text("El color principal se usa en botones, gráficas y detalles. «Negro» ahorra batería en pantallas OLED.")) {
            VStack(alignment: .leading, spacing: 10) {
                Text("Color principal").font(.subheadline.weight(.semibold))
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(AccentChoice.allCases) { c in
                        Button {
                            withAnimation(.easeInOut(duration: 0.2)) { accent = c.rawValue }
                        } label: {
                            ZStack {
                                Circle().fill(c.color)
                                if accent == c.rawValue {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 15, weight: .bold))
                                        .foregroundColor(.white)
                                }
                            }
                            .frame(width: 40, height: 40)
                            .overlay(Circle().stroke(Color.primary.opacity(accent == c.rawValue ? 0.35 : 0), lineWidth: 3).padding(-4))
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(c.name)
                    }
                }
                Text(AccentChoice(rawValue: accent)?.name ?? "")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 6)

            VStack(alignment: .leading, spacing: 10) {
                Text("Fondo").font(.subheadline.weight(.semibold))
                HStack(spacing: 8) {
                    ForEach(BackgroundChoice.allCases) { b in
                        Button {
                            background = b.rawValue
                        } label: {
                            VStack(spacing: 6) {
                                Image(systemName: b.icon).font(.title3)
                                Text(b.name).font(.caption)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .foregroundColor(background == b.rawValue ? .white : .primary)
                            .background(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .fill(background == b.rawValue ? Color.brand : Color(.tertiarySystemFill))
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(.vertical, 6)
        }
    }
}
