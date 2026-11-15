import SwiftUI
import UIKit

// MARK: - Aspecto del perrito (Perfil → Apariencia)
//
// Los valores son las claves de FORJA_DOG.setLook en Resources/forja3d_dog.js.
// Miniaturas en Resources/dogskins (dog_<grupo>_<clave>.png).

enum DogLook {
    static let shownKey = "dogShown"
    static let coatKey = "dogCoat"
    static let hatKey = "dogHat"
    static let extraKey = "dogExtra"

    static let coats: [(String, String)] = [
        ("clasico", "Negro"), ("fuego", "Negro y fuego"), ("chocolate", "Chocolate"), ("rojo", "Rojizo"),
        ("crema", "Crema"), ("gris", "Azul"), ("arlequin", "Arlequín"),
    ]
    static let hats: [(String, String)] = [
        ("corona", "Corona"), ("ninguno", "Sin gorro"), ("fiesta", "Fiesta"), ("lana", "Lana"), ("gorra", "Gorra"),
        ("noel", "Navidad"), ("vikingo", "Vikingo"), ("mago", "Mago"), ("chef", "Chef"),
    ]
    static let extras: [(String, String)] = [
        ("ninguno", "Nada"), ("panuelo", "Pañuelo"), ("pajarita", "Pajarita"), ("collar", "Collar"), ("gafas", "Gafas"),
    ]

    /// Llamada JS que aplica el aspecto guardado; solo admite claves conocidas.
    static var js: String {
        let d = UserDefaults.standard
        func pick(_ key: String, _ list: [(String, String)]) -> String {
            let v = d.string(forKey: key) ?? list[0].0
            return list.contains { $0.0 == v } ? v : list[0].0
        }
        let shown = d.object(forKey: shownKey) as? Bool ?? true
        return "forjaDog({hidden:\(!shown),coat:'\(pick(coatKey, coats))',hat:'\(pick(hatKey, hats))',extra:'\(pick(extraKey, extras))'});"
    }

    static func image(_ group: String, _ key: String) -> UIImage? {
        Bundle.main.path(forResource: "dog_\(group)_\(key)", ofType: "png").flatMap { UIImage(contentsOfFile: $0) }
    }
}

struct DogSection: View {
    @AppStorage(DogLook.shownKey) var shown = true
    @AppStorage(DogLook.coatKey) var coat = "clasico"
    @AppStorage(DogLook.hatKey) var hat = "corona"
    @AppStorage(DogLook.extraKey) var extra = "ninguno"

    var body: some View {
        Section(header: Text("Perrito"),
                footer: Text("El perrito acompaña las animaciones de los ejercicios.")) {
            Toggle("Mostrar perrito", isOn: $shown)
            if shown {
                row("Pelaje", "coat", DogLook.coats, $coat)
                row("Gorro", "hat", DogLook.hats, $hat)
                row("Accesorio", "extra", DogLook.extras, $extra)
            }
        }
    }

    func row(_ title: String, _ group: String, _ list: [(String, String)], _ value: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.subheadline.weight(.semibold))
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(list, id: \.0) { item in
                        let on = value.wrappedValue == item.0
                        Button { value.wrappedValue = item.0 } label: {
                            VStack(spacing: 4) {
                                Group {
                                    if let img = DogLook.image(group, item.0) {
                                        Image(uiImage: img).resizable().scaledToFill()
                                    } else {
                                        Color(.secondarySystemFill)
                                    }
                                }
                                .frame(width: 64, height: 64)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(on ? Color.brand : Color.primary.opacity(0.12), lineWidth: on ? 3 : 1))
                                Text(item.1)
                                    .font(.caption2.weight(on ? .bold : .regular))
                                    .foregroundColor(.primary)
                                    .lineLimit(1)
                            }
                            .frame(width: 70)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("\(title): \(item.1)")
                        .accessibilityAddTraits(on ? .isSelected : [])
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .padding(.vertical, 4)
    }
}
