import SwiftUI
import UIKit
import WebKit

/// Miniatura estática (pre-renderizada) para listas.
struct ExerciseThumbnail: View {
    let exercise: Exercise
    var size: CGFloat = 44

    /// Por ejercicio (nombre + equipo): evita recalcular claves y buscar archivos en cada redibujado.
    /// Guarda también los que no tienen imagen (nil) para no volver a buscarlos.
    static var cache: [String: UIImage?] = [:]

    var image: UIImage? {
        let id = exercise.name + "|" + exercise.equipment.rawValue
        if let hit = ExerciseThumbnail.cache[id] { return hit }
        let a = ExerciseSeed.animationKey(for: exercise)
        let p = ExerciseSeed.pattern(for: exercise).rawValue
        let e = ExerciseSeed.animationEquipment(exercise.equipment)
        var found: UIImage? = nil
        for name in ["thumb_\(a)_\(e)", "thumb_\(a)_none", "thumb_\(p)_\(e)", "thumb_\(p)_none"] {
            if let path = Bundle.main.path(forResource: name, ofType: "jpg"), let img = UIImage(contentsOfFile: path) {
                // Decodificada ya, para que no se haga al dibujar mientras se desplaza la lista.
                found = img.preparingForDisplay() ?? img
                break
            }
        }
        ExerciseThumbnail.cache[id] = .some(found)
        return found
    }

    var body: some View {
        Group {
            if let img = image {
                Image(uiImage: img)
                    .resizable()
                    .interpolation(.high)
                    .aspectRatio(contentMode: .fill)
            } else {
                ZStack {
                    Color.brand.opacity(0.18)
                    Text(String(exercise.name.prefix(1)))
                        .font(.headline)
                        .foregroundColor(.brand)
                }
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: size * 0.22, style: .continuous))
    }
}

/// Ficha con animación + instrucciones (se abre desde el entrenamiento).
struct ExerciseInfoSheet: View {
    @EnvironmentObject var store: Store
    @Environment(\.dismiss) var dismiss
    let exercise: Exercise

    var body: some View {
        NavigationView {
            List {
                ExerciseHowToSections(exercise: exercise)
            }
            .listStyle(.insetGrouped)
            .navigationTitle(exercise.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Cerrar") { dismiss() }
                }
            }
        }
    }
}

/// Secciones reutilizables: animación, músculos e instrucciones.
struct ExerciseHowToSections: View {
    let exercise: Exercise
    @State private var view = 1

    var guide: ExerciseGuide { ExerciseSeed.guide(for: exercise) }

    var body: some View {
        Section {
            Picker("Perspectiva", selection: $view) {
                Text("Vista principal").tag(1)
                Text("Otro ángulo").tag(2)
            }
            .pickerStyle(.segmented)
            .listRowBackground(Color.clear)
            ExerciseAnimationView(exercise: exercise, view: view)
                .aspectRatio(1, contentMode: .fit)
                .frame(maxWidth: 420)
                .frame(maxWidth: .infinity)
                .listRowInsets(EdgeInsets(top: 8, leading: 8, bottom: 8, trailing: 8))
                .listRowBackground(Color.clear)
            HStack {
                Label(exercise.muscle.rawValue, systemImage: "figure.walk")
                Spacer()
                Label(exercise.equipment.rawValue, systemImage: "scalemass")
            }
            .font(.subheadline)
            .foregroundColor(.secondary)
        }
        Section(header: Text("Qué trabaja")) {
            if let f = ExerciseFocus.focus(for: exercise) {
                Label(f.text, systemImage: "scope")
                    .font(.subheadline)
            }
            Label("Descanso sugerido: \(Fmt.rest(ExerciseFocus.suggestedRest(for: exercise))). \(ExerciseFocus.restReason(for: exercise))", systemImage: "timer")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        if !guide.steps.isEmpty {
            Section(header: Text("Cómo hacerlo")) {
                ForEach(Array(guide.steps.enumerated()), id: \.offset) { item in
                    HStack(alignment: .top, spacing: 12) {
                        Text("\(item.offset + 1)")
                            .font(.subheadline.bold())
                            .foregroundColor(.white)
                            .frame(width: 26, height: 26)
                            .background(Circle().fill(Color.brand))
                        Text(item.element)
                            .font(.subheadline)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.vertical, 2)
                }
            }
        }
        if !guide.tips.isEmpty {
            Section(header: Text("Consejos")) {
                ForEach(guide.tips, id: \.self) { tip in
                    Label {
                        Text(tip).font(.subheadline)
                    } icon: {
                        Image(systemName: "lightbulb.fill").foregroundColor(.yellow)
                    }
                }
            }
        }
    }
}
