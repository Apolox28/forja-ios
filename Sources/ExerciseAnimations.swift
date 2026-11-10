import Foundation

// Generado: animación propia de cada ejercicio de la biblioteca (variante de su patrón de movimiento).
extension ExerciseSeed {
    static let animationByName: [String: String] = [
        "aperturas en máquina": "pecDeck",
        "aperturas inclinadas con mancuernas": "flyIncline",
        "cruce de poleas de abajo arriba": "cableFlyLow",
        "cruce de poleas de arriba abajo": "cableFlyHigh",
        "cuerdas de batalla": "battleRopes",
        "curl alterno con mancuernas": "curlAlt",
        "curl araña": "curlSpider",
        "curl bayesiano en polea": "curlBayesian",
        "curl con cuerda en polea": "curlRope",
        "curl concentrado": "concentrationCurl",
        "curl de muñeca": "wristCurl",
        "curl de muñeca inverso": "wristCurlRev",
        "curl inclinado con mancuernas": "curlIncline",
        "curl inverso con barra": "curlReverse",
        "curl martillo": "curlHammer",
        "curl martillo en polea": "curlHammer",
        "elevaciones en y": "yRaise",
        "elevaciones laterales en máquina": "lateralRaiseMachine",
        "elevaciones laterales en polea": "lateralRaiseCable",
        "extensión de tríceps a una mano en polea": "pushdownOneArm",
        "extensión de tríceps agarre inverso": "pushdownReverse",
        "extensión de tríceps con cuerda": "pushdownRope",
        "flexiones declinadas": "pushupDecline",
        "flexiones diamante": "pushupDiamond",
        "flexiones inclinadas": "pushupIncline",
        "fondos en banco": "benchDip",
        "fondos en máquina": "dipMachine",
        "leñador en polea": "woodchop",
        "pallof press": "pallof",
        "press arnold": "arnoldPress",
        "press de banca agarre cerrado": "benchClose",
        "press de hombro en máquina": "ohpMachine",
        "press de hombro sentado con mancuernas": "ohpSeated",
        "press de suelo con barra": "floorPress",
        "press declinado con barra": "decline",
        "press declinado con mancuernas": "decline",
        "press inclinado en máquina": "chestPressIncline",
        "press jm": "benchJM",
        "press landmine": "landminePress",
        "press militar sentado": "ohpSeated",
        "push press": "pushPress",
        "pájaros con mancuernas": "reverseFlyDb",
        "pájaros en máquina": "reverseFlyMachine",
        "pájaros en polea": "reverseFlyCable",
    ]

    /// Clave de animación: la variante del ejercicio o, si no tiene, su patrón de movimiento.
    static func animationKey(for exercise: Exercise) -> String {
        animationByName[exercise.name.lowercased()] ?? pattern(for: exercise).rawValue
    }
}
