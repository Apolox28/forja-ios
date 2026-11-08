import Foundation

enum ExerciseSeed {
    static func make() -> [Exercise] {
        raw.map { item in
            Exercise(name: item.0, muscle: item.1, equipment: item.2, kind: item.3, isCustom: false)
        }
    }

    private static let raw: [(String, MuscleGroup, Equipment, ExerciseKind)] = [
        // Pecho
        ("Press de banca", .chest, .barbell, .weightReps),
        ("Press inclinado con barra", .chest, .barbell, .weightReps),
        ("Press de banca con mancuernas", .chest, .dumbbell, .weightReps),
        ("Press inclinado con mancuernas", .chest, .dumbbell, .weightReps),
        ("Aperturas con mancuernas", .chest, .dumbbell, .weightReps),
        ("Cruce de poleas", .chest, .cable, .weightReps),
        ("Press de pecho en máquina", .chest, .machine, .weightReps),
        ("Fondos en paralelas", .chest, .bodyweight, .repsOnly),
        ("Flexiones", .chest, .bodyweight, .repsOnly),
        // Espalda
        ("Peso muerto", .back, .barbell, .weightReps),
        ("Dominadas", .back, .bodyweight, .repsOnly),
        ("Dominadas lastradas", .back, .bodyweight, .weightReps),
        ("Remo con barra", .back, .barbell, .weightReps),
        ("Remo con mancuerna", .back, .dumbbell, .weightReps),
        ("Jalón al pecho", .back, .cable, .weightReps),
        ("Remo sentado en polea", .back, .cable, .weightReps),
        ("Remo en máquina", .back, .machine, .weightReps),
        ("Pullover en polea", .back, .cable, .weightReps),
        ("Encogimientos con mancuernas", .back, .dumbbell, .weightReps),
        // Hombros
        ("Press militar con barra", .shoulders, .barbell, .weightReps),
        ("Press de hombro con mancuernas", .shoulders, .dumbbell, .weightReps),
        ("Elevaciones laterales", .shoulders, .dumbbell, .weightReps),
        ("Elevaciones laterales en polea", .shoulders, .cable, .weightReps),
        ("Elevaciones frontales", .shoulders, .dumbbell, .weightReps),
        ("Pájaros con mancuernas", .shoulders, .dumbbell, .weightReps),
        ("Face pull", .shoulders, .cable, .weightReps),
        // Bíceps
        ("Curl con barra", .biceps, .barbell, .weightReps),
        ("Curl con mancuernas", .biceps, .dumbbell, .weightReps),
        ("Curl martillo", .biceps, .dumbbell, .weightReps),
        ("Curl en polea", .biceps, .cable, .weightReps),
        ("Curl predicador", .biceps, .machine, .weightReps),
        // Tríceps
        ("Extensión de tríceps en polea", .triceps, .cable, .weightReps),
        ("Press francés", .triceps, .barbell, .weightReps),
        ("Extensión sobre la cabeza con mancuerna", .triceps, .dumbbell, .weightReps),
        ("Press de banca agarre cerrado", .triceps, .barbell, .weightReps),
        ("Fondos en banco", .triceps, .bodyweight, .repsOnly),
        // Antebrazos
        ("Curl de muñeca", .forearms, .dumbbell, .weightReps),
        ("Paseo del granjero", .forearms, .dumbbell, .distanceTime),
        // Cuádriceps
        ("Sentadilla con barra", .quads, .barbell, .weightReps),
        ("Sentadilla frontal", .quads, .barbell, .weightReps),
        ("Sentadilla goblet", .quads, .dumbbell, .weightReps),
        ("Prensa de piernas", .quads, .machine, .weightReps),
        ("Extensión de cuádriceps", .quads, .machine, .weightReps),
        ("Zancadas con mancuernas", .quads, .dumbbell, .weightReps),
        ("Sentadilla búlgara", .quads, .dumbbell, .weightReps),
        ("Sentadilla hack", .quads, .machine, .weightReps),
        // Isquiotibiales
        ("Peso muerto rumano", .hamstrings, .barbell, .weightReps),
        ("Curl femoral tumbado", .hamstrings, .machine, .weightReps),
        ("Curl femoral sentado", .hamstrings, .machine, .weightReps),
        ("Buenos días", .hamstrings, .barbell, .weightReps),
        // Glúteos
        ("Hip thrust con barra", .glutes, .barbell, .weightReps),
        ("Puente de glúteos", .glutes, .bodyweight, .repsOnly),
        ("Patada de glúteo en polea", .glutes, .cable, .weightReps),
        ("Abducción en máquina", .glutes, .machine, .weightReps),
        // Gemelos
        ("Elevación de talones de pie", .calves, .machine, .weightReps),
        ("Elevación de talones sentado", .calves, .machine, .weightReps),
        // Abdomen
        ("Plancha", .core, .bodyweight, .duration),
        ("Crunch abdominal", .core, .bodyweight, .repsOnly),
        ("Elevación de piernas colgado", .core, .bodyweight, .repsOnly),
        ("Rueda abdominal", .core, .other, .repsOnly),
        ("Crunch en polea", .core, .cable, .weightReps),
        ("Giros rusos", .core, .other, .weightReps),
        // Cardio
        ("Correr", .cardio, .other, .distanceTime),
        ("Bicicleta estática", .cardio, .machine, .distanceTime),
        ("Remo ergómetro", .cardio, .machine, .distanceTime),
        ("Elíptica", .cardio, .machine, .duration),
        ("Saltar la cuerda", .cardio, .other, .duration),
        // Cuerpo completo
        ("Swing con kettlebell", .fullBody, .kettlebell, .weightReps),
        ("Burpees", .fullBody, .bodyweight, .repsOnly),
        ("Thruster", .fullBody, .barbell, .weightReps),
        ("Cargada y press", .fullBody, .barbell, .weightReps),
    ]
}
