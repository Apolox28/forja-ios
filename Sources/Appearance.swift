import SwiftUI
import UIKit

// MARK: - Tema de la app (se guarda en el iPhone, no en los datos de entrenamiento)

enum AccentChoice: String, CaseIterable, Identifiable {
    case forja, red, coral, pink, purple, indigo, blue, cyan, teal, green, lime, gold, mocha, graphite

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
        case .coral: return "Coral"
        case .indigo: return "Índigo"
        case .cyan: return "Cian"
        case .lime: return "Lima"
        case .mocha: return "Moca"
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
        case .coral: return Color(red: 1.00, green: 0.45, blue: 0.40)
        case .indigo: return Color(red: 0.35, green: 0.34, blue: 0.84)
        case .cyan: return Color(red: 0.12, green: 0.68, blue: 0.95)
        case .lime: return Color(red: 0.55, green: 0.78, blue: 0.13)
        case .mocha: return Color(red: 0.62, green: 0.44, blue: 0.32)
        }
    }
}

enum BackgroundChoice: String, CaseIterable, Identifiable {
    case system, light, dark, black
    case midnight, slate, forest, ocean, wine, plum, carbon, royal, emerald, coffee
    case sand, lavender, mint, blush, sky, cream, peach

    var id: String { rawValue }

    var name: String {
        switch self {
        case .system: return "Automático"
        case .light: return "Claro"
        case .dark: return "Oscuro"
        case .black: return "Negro"
        case .midnight: return "Medianoche"
        case .slate: return "Pizarra"
        case .forest: return "Bosque"
        case .ocean: return "Océano"
        case .wine: return "Vino"
        case .plum: return "Ciruela"
        case .sand: return "Arena"
        case .lavender: return "Lavanda"
        case .mint: return "Menta"
        case .blush: return "Rosa palo"
        case .carbon: return "Carbón"
        case .royal: return "Azul real"
        case .emerald: return "Esmeralda"
        case .coffee: return "Café"
        case .sky: return "Cielo"
        case .cream: return "Crema"
        case .peach: return "Melocotón"
        }
    }

    var scheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light, .sand, .lavender, .mint, .blush, .sky, .cream, .peach: return .light
        default: return .dark
        }
    }

    private static func rgb(_ hex: Int) -> UIColor {
        UIColor(red: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255,
                blue: CGFloat(hex & 0xFF) / 255, alpha: 1)
    }

    /// Fondo de las pantallas (nil = el de iOS).
    var background: UIColor? {
        switch self {
        case .system, .light, .dark: return nil
        case .black: return .black
        case .midnight: return Self.rgb(0x0B1426)
        case .slate: return Self.rgb(0x1C2230)
        case .forest: return Self.rgb(0x0E1F17)
        case .ocean: return Self.rgb(0x062228)
        case .wine: return Self.rgb(0x220A10)
        case .plum: return Self.rgb(0x1E0F26)
        case .sand: return Self.rgb(0xF3ECDF)
        case .lavender: return Self.rgb(0xECE8F8)
        case .mint: return Self.rgb(0xE3F3EC)
        case .blush: return Self.rgb(0xF8E8EE)
        case .carbon: return Self.rgb(0x121212)
        case .royal: return Self.rgb(0x0A1A3F)
        case .emerald: return Self.rgb(0x062A1F)
        case .coffee: return Self.rgb(0x1E1510)
        case .sky: return Self.rgb(0xE4EEFA)
        case .cream: return Self.rgb(0xFAF4E4)
        case .peach: return Self.rgb(0xFCE9DB)
        }
    }

    /// Fondo de las tarjetas y filas.
    var card: UIColor? {
        switch self {
        case .system, .light, .dark: return nil
        case .black: return Self.rgb(0x141414)
        case .midnight: return Self.rgb(0x16223A)
        case .slate: return Self.rgb(0x282F40)
        case .forest: return Self.rgb(0x18302A)
        case .ocean: return Self.rgb(0x0E343B)
        case .wine: return Self.rgb(0x37141D)
        case .plum: return Self.rgb(0x2F1A3B)
        case .sand: return Self.rgb(0xFFFBF4)
        case .lavender: return Self.rgb(0xFAF8FF)
        case .mint: return Self.rgb(0xF7FFFB)
        case .blush: return Self.rgb(0xFFF8FA)
        case .carbon: return Self.rgb(0x1E1E1E)
        case .royal: return Self.rgb(0x16285A)
        case .emerald: return Self.rgb(0x0E3E2E)
        case .coffee: return Self.rgb(0x2E2119)
        case .sky: return Self.rgb(0xF7FBFF)
        case .cream: return Self.rgb(0xFFFCF3)
        case .peach: return Self.rgb(0xFFF7F1)
        }
    }

    /// Colores de la muestra en el selector.
    var swatch: (Color, Color) {
        switch self {
        case .system: return (Color(white: 0.92), Color(white: 0.12))
        case .light: return (Color(white: 0.95), .white)
        case .dark: return (Color(white: 0.0), Color(white: 0.17))
        default: return (Color(background ?? .black), Color(card ?? .darkGray))
        }
    }
}

enum IconChoice: String, CaseIterable, Identifiable {
    case clasico, perrito, naranja, rojo, azul, verde, morado, rosa, dorado, claro, degradado

    var id: String { rawValue }

    var name: String {
        switch self {
        case .clasico: return "Clásico"
        case .perrito: return "Perrito"
        case .naranja: return "Naranja"
        case .rojo: return "Rojo"
        case .azul: return "Azul"
        case .verde: return "Verde"
        case .morado: return "Morado"
        case .rosa: return "Rosa"
        case .dorado: return "Dorado"
        case .claro: return "Claro"
        case .degradado: return "Degradado"
        }
    }

    /// Nombre del icono alternativo (nil = icono principal).
    var alternateName: String? {
        self == .clasico ? nil : "AppIcon-" + rawValue.prefix(1).uppercased() + rawValue.dropFirst()
    }

    var previewName: String { "IconPreview-" + rawValue.prefix(1).uppercased() + rawValue.dropFirst() }
}

enum CardTint: String, CaseIterable, Identifiable {
    case none, accent, orange, red, pink, purple, blue, teal, green, gold

    var id: String { rawValue }

    var name: String {
        switch self {
        case .none: return "Gris"
        case .accent: return "Principal"
        case .orange: return "Naranja"
        case .red: return "Rojo"
        case .pink: return "Rosa"
        case .purple: return "Morado"
        case .blue: return "Azul"
        case .teal: return "Turquesa"
        case .green: return "Verde"
        case .gold: return "Dorado"
        }
    }

    var base: Color? {
        switch self {
        case .none: return nil
        case .accent: return .brand
        case .orange: return AccentChoice.forja.color
        case .red: return AccentChoice.red.color
        case .pink: return AccentChoice.pink.color
        case .purple: return AccentChoice.purple.color
        case .blue: return AccentChoice.blue.color
        case .teal: return AccentChoice.teal.color
        case .green: return AccentChoice.green.color
        case .gold: return AccentChoice.gold.color
        }
    }
}

enum AppTheme {
    /// Fondo de las tarjetas de entrenamientos (Inicio, calendario, semana…).
    static var cardBackground: Color? {
        let tint = CardTint(rawValue: UserDefaults.standard.string(forKey: "themeCardTint") ?? "") ?? .none
        guard let c = tint.base else { return nil }
        let strength = UserDefaults.standard.double(forKey: "themeCardStrength")
        return c.opacity(strength > 0 ? strength : 0.18)
    }

    static var accent: AccentChoice {
        AccentChoice(rawValue: UserDefaults.standard.string(forKey: "themeAccent") ?? "") ?? .forja
    }

    static var background: BackgroundChoice {
        BackgroundChoice(rawValue: UserDefaults.standard.string(forKey: "themeBackground") ?? "") ?? .system
    }

    /// Fondo para pantallas que no son listas (por ejemplo, el Coach).
    static var screenBackground: Color {
        if let bg = background.background { return Color(bg) }
        return Color(.systemBackground)
    }

    /// Aplica el fondo elegido a listas, barras de navegación y barra de pestañas.
    static func applyUIKitAppearance() {
        let bg = background.background
        let card = background.card
        UITableView.appearance().backgroundColor = bg
        UICollectionView.appearance().backgroundColor = bg
        UITableViewCell.appearance().backgroundColor = card

        let nav = UINavigationBarAppearance()
        let tab = UITabBarAppearance()
        if let bg = bg {
            nav.configureWithOpaqueBackground()
            nav.backgroundColor = bg
            nav.shadowColor = .clear
            tab.configureWithOpaqueBackground()
            tab.backgroundColor = bg
        } else {
            nav.configureWithDefaultBackground()
            tab.configureWithDefaultBackground()
        }
        UINavigationBar.appearance().standardAppearance = nav
        UINavigationBar.appearance().compactAppearance = nav
        UINavigationBar.appearance().scrollEdgeAppearance = nav
        UITabBar.appearance().standardAppearance = tab
        UITabBar.appearance().scrollEdgeAppearance = tab
    }
}

// MARK: - Selector de apariencia

struct AppearanceSection: View {
    @AppStorage("themeAccent") var accent: String = AccentChoice.forja.rawValue
    @AppStorage("themeBackground") var background: String = BackgroundChoice.system.rawValue

    let colorColumns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 5)
    let bgColumns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 4)

    var body: some View {
        Section(header: Text("Color principal"),
                footer: Text("Se usa en botones, gráficas y detalles de toda la app.")) {
            LazyVGrid(columns: colorColumns, spacing: 12) {
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
            .padding(.vertical, 8)
            Text(AccentChoice(rawValue: accent)?.name ?? "")
                .font(.caption)
                .foregroundColor(.secondary)
        }

        Section(header: Text("Fondo"),
                footer: Text("«Negro» ahorra batería en pantallas OLED. Los fondos oscuros y de color cambian toda la app.")) {
            LazyVGrid(columns: bgColumns, spacing: 14) {
                ForEach(BackgroundChoice.allCases) { b in
                    Button {
                        background = b.rawValue
                    } label: {
                        VStack(spacing: 6) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .fill(b.swatch.0)
                                VStack(spacing: 4) {
                                    RoundedRectangle(cornerRadius: 3).fill(b.swatch.1).frame(height: 9)
                                    RoundedRectangle(cornerRadius: 3).fill(b.swatch.1).frame(height: 9)
                                    RoundedRectangle(cornerRadius: 3).fill(Color.brand).frame(width: 22, height: 6)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                }
                                .padding(8)
                            }
                            .frame(height: 64)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(background == b.rawValue ? Color.brand : Color.primary.opacity(0.12),
                                            lineWidth: background == b.rawValue ? 3 : 1)
                            )
                            Text(b.name)
                                .font(.caption2.weight(background == b.rawValue ? .bold : .regular))
                                .foregroundColor(.primary)
                                .lineLimit(1)
                                .minimumScaleFactor(0.8)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.vertical, 8)
        }
    }
}

struct IconSection: View {
    @AppStorage("themeIcon") var icon: String = IconChoice.clasico.rawValue
    @State var errorText: String? = nil
    let columns = Array(repeating: GridItem(.flexible(), spacing: 12), count: 4)

    var body: some View {
        Section(header: Text("Icono de la app"),
                footer: Text("iOS te avisará con un mensaje al cambiar el icono.")) {
            LazyVGrid(columns: columns, spacing: 14) {
                ForEach(IconChoice.allCases) { c in
                    Button {
                        setIcon(c)
                    } label: {
                        VStack(spacing: 5) {
                            Image(c.previewName)
                                .resizable()
                                .scaledToFit()
                                .frame(width: 60, height: 60)
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                                        .stroke(icon == c.rawValue ? Color.brand : Color.primary.opacity(0.12),
                                                lineWidth: icon == c.rawValue ? 3 : 1)
                                )
                            Text(c.name)
                                .font(.caption2.weight(icon == c.rawValue ? .bold : .regular))
                                .foregroundColor(.primary)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.vertical, 8)
            if let e = errorText {
                Text(e).font(.caption).foregroundColor(.orange)
            }
        }
    }

    func setIcon(_ c: IconChoice) {
        guard UIApplication.shared.supportsAlternateIcons else {
            errorText = "Este iPhone no permite cambiar el icono."
            return
        }
        UIApplication.shared.setAlternateIconName(c.alternateName) { error in
            DispatchQueue.main.async {
                if let error = error {
                    errorText = "No se pudo cambiar el icono: \(error.localizedDescription)"
                } else {
                    errorText = nil
                    icon = c.rawValue
                }
            }
        }
    }
}

struct CardColorSection: View {
    @AppStorage("themeCardTint") var tint: String = CardTint.none.rawValue
    @AppStorage("themeCardStrength") var strength: Double = 0.18
    let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 5)

    var body: some View {
        Section(header: Text("Color de los entrenamientos"),
                footer: Text("Se aplica a las tarjetas de entrenamientos en Inicio, el calendario y el detalle de cada semana.")) {
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(CardTint.allCases) { t in
                    Button {
                        tint = t.rawValue
                    } label: {
                        VStack(spacing: 4) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .fill(t.base?.opacity(max(strength, 0.25)) ?? Color(.secondarySystemGroupedBackground))
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .stroke(tint == t.rawValue ? Color.brand : Color.primary.opacity(0.15),
                                            lineWidth: tint == t.rawValue ? 3 : 1)
                                if tint == t.rawValue {
                                    Image(systemName: "checkmark").font(.caption.bold())
                                }
                            }
                            .frame(height: 38)
                            Text(t.name).font(.caption2).foregroundColor(.primary).lineLimit(1).minimumScaleFactor(0.8)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.vertical, 8)
            if tint != CardTint.none.rawValue {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Intensidad").font(.subheadline)
                    Slider(value: $strength, in: 0.10...0.55)
                }
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("Ejemplo de entrenamiento").font(.headline)
                        Label("1 h 05 min · 12.400 kg", systemImage: "clock").font(.subheadline).foregroundColor(.secondary)
                    }
                    Spacer()
                }
                .padding(12)
                .background(RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill((CardTint(rawValue: tint)?.base ?? .clear).opacity(strength)))
            }
        }
    }
}

struct AppearanceView: View {
    var body: some View {
        Form {
            IconSection()
            AppearanceSection()
            CardColorSection()
        }
        .navigationTitle("Apariencia")
        .navigationBarTitleDisplayMode(.inline)
    }
}
