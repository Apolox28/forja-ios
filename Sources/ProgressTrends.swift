import SwiftUI

// MARK: - Métricas y rangos

enum TrendMetric: String, CaseIterable, Identifiable {
    case volume = "Volumen"
    case workouts = "Entrenos"
    case sets = "Series"
    case time = "Tiempo"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .volume: return "Volumen por semana"
        case .workouts: return "Entrenamientos por semana"
        case .sets: return "Series por semana"
        case .time: return "Tiempo entrenado por semana"
        }
    }

    var icon: String {
        switch self {
        case .volume: return "scalemass"
        case .workouts: return "flame.fill"
        case .sets: return "list.number"
        case .time: return "clock"
        }
    }

    var color: Color {
        switch self {
        case .volume: return .brand
        case .workouts: return .blue
        case .sets: return .purple
        case .time: return .teal
        }
    }

    func value(_ ws: [Workout]) -> Double {
        switch self {
        case .volume: return ws.reduce(0) { $0 + $1.volume }
        case .workouts: return Double(ws.count)
        case .sets: return Double(ws.reduce(0) { $0 + $1.setCount })
        case .time: return ws.reduce(0) { $0 + $1.duration } / 60
        }
    }

    func format(_ v: Double, unit: String) -> String {
        switch self {
        case .volume: return "\(Fmt.int(v)) \(unit)"
        case .workouts: return v == 1 ? "1 entreno" : "\(Int(v.rounded())) entrenos"
        case .sets: return "\(Int(v.rounded())) series"
        case .time: return Fmt.duration(v * 60)
        }
    }

    /// Etiqueta corta para encima de la barra.
    func short(_ v: Double) -> String {
        switch self {
        case .volume: return v >= 1000 ? String(format: "%.1fk", v / 1000) : Fmt.int(v)
        case .workouts, .sets: return "\(Int(v.rounded()))"
        case .time: return v >= 60 ? String(format: "%.1fh", v / 60) : "\(Int(v.rounded()))m"
        }
    }
}

enum TrendRange: String, CaseIterable, Identifiable {
    case weeks8 = "8 sem"
    case months6 = "6 meses"
    case year = "1 año"
    case all = "Todo"

    var id: String { rawValue }

    func weekCount(firstWorkout: Date?, store: Store) -> Int {
        switch self {
        case .weeks8: return 8
        case .months6: return 26
        case .year: return 52
        case .all:
            guard let first = firstWorkout else { return 8 }
            let weeks = store.calendar.dateComponents([.weekOfYear], from: store.weekStart(first), to: store.weekStart(Date())).weekOfYear ?? 0
            return min(max(weeks + 1, 8), 260)
        }
    }
}

struct WeekBucket: Identifiable {
    var id: Date { start }
    let start: Date
    let workouts: [Workout]
}

extension Store {
    func weekBuckets(_ count: Int) -> [WeekBucket] {
        let current = weekStart(Date())
        return (0..<count).reversed().compactMap { i in
            guard let start = calendar.date(byAdding: .weekOfYear, value: -i, to: current) else { return nil }
            return WeekBucket(start: start, workouts: workouts(inWeekOf: start))
        }
    }

    func muscleSets(in ws: [Workout]) -> [MuscleStat] {
        var counts: [MuscleGroup: Int] = [:]
        for w in ws {
            for e in w.exercises {
                guard let ex = exercise(e.exerciseID) else { continue }
                counts[ex.muscle, default: 0] += e.sets.filter { $0.type != .warmup }.count
            }
        }
        return MuscleGroup.allCases
            .compactMap { m in counts[m].map { MuscleStat(muscle: m, sets: $0) } }
            .sorted { $0.sets > $1.sets }
    }
}

extension Fmt {
    private static let weekFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "es_ES")
        f.dateFormat = "d MMM"
        return f
    }()

    static func weekRange(_ start: Date) -> String {
        let end = start.addingTimeInterval(6 * 86400)
        return "\(weekFormatter.string(from: start)) – \(weekFormatter.string(from: end))"
    }
}

// MARK: - Gráfica de barras interactiva

struct InteractiveBarChart: View {
    let values: [Double]
    let labels: [String]
    var color: Color = .brand
    var valueText: (Double) -> String = { Fmt.int($0) }
    @Binding var selected: Int?
    var height: CGFloat = 170

    var body: some View {
        GeometryReader { geo in
            let n = max(values.count, 1)
            let spacing: CGFloat = n > 20 ? 5 : 8
            let fitted = (geo.size.width - spacing * CGFloat(n - 1)) / CGFloat(n)
            let barWidth = min(max(fitted, 14), 44)
            let maxV = max(values.max() ?? 0, 1)
            ScrollViewReader { proxy in
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(alignment: .bottom, spacing: spacing) {
                        ForEach(values.indices, id: \.self) { i in
                            let isSel = selected == i
                            let highlight = isSel || (selected == nil && i == values.count - 1)
                            VStack(spacing: 4) {
                                if isSel {
                                    Text(valueText(values[i]))
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(color)
                                        .fixedSize()
                                }
                                RoundedRectangle(cornerRadius: 5, style: .continuous)
                                    .fill(highlight ? color : color.opacity(0.4))
                                    .frame(width: barWidth, height: max(3, CGFloat(values[i] / maxV) * (height - 44)))
                                Text(i < labels.count ? labels[i] : "")
                                    .font(.system(size: 9, weight: isSel ? .bold : .regular))
                                    .foregroundColor(isSel ? .primary : .secondary)
                                    .fixedSize()
                                    .frame(width: barWidth)
                            }
                            .frame(height: height, alignment: .bottom)
                            .contentShape(Rectangle())
                            .id(i)
                            .onTapGesture {
                                withAnimation(.easeInOut(duration: 0.2)) {
                                    selected = (selected == i) ? nil : i
                                }
                            }
                        }
                    }
                    .frame(minWidth: geo.size.width, alignment: .trailing)
                }
                .onAppear { proxy.scrollTo(values.count - 1, anchor: .trailing) }
            }
        }
        .frame(height: height)
    }
}

// MARK: - Pestaña Progreso

enum ProgressScope: String, CaseIterable, Identifiable {
    case week = "Esta semana"
    case total = "Total"
    var id: String { rawValue }
}

struct ProgressTabView: View {
    @EnvironmentObject var store: Store
    @State var scope: ProgressScope = .week
    @State var showAddMeasurement = false
    @State var measureField: MeasureField = .weight
    @State var selectedDay: Int? = nil

    let dayLetters = ["L", "M", "X", "J", "V", "S", "D"]

    var thisWeek: [Workout] { store.workouts(inWeekOf: Date()) }
    var lastWeek: [Workout] {
        let prev = store.calendar.date(byAdding: .weekOfYear, value: -1, to: Date()) ?? Date()
        return store.workouts(inWeekOf: prev)
    }

    var body: some View {
        NavigationView {
            List {
                Section {
                    Picker("Vista", selection: $scope) {
                        ForEach(ProgressScope.allCases) { s in Text(s.rawValue).tag(s) }
                    }
                    .pickerStyle(.segmented)
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0))
                }
                if scope == .week {
                    weekSections
                } else {
                    totalSections
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Progreso")
            .sheet(isPresented: $showAddMeasurement) {
                AddMeasurementView()
                    .environmentObject(store)
            }
            .activeWorkoutBanner()
        }
        .navigationViewStyle(.stack)
    }

    // MARK: Esta semana

    @ViewBuilder
    var weekSections: some View {
        let goal = max(store.data.settings.weeklyGoal, 1)
        Section(header: Text("Semana del \(Fmt.weekRange(store.weekStart(Date())))"),
                footer: Text("Se renueva cada lunes.")) {
            HStack(spacing: 16) {
                ZStack {
                    Circle().stroke(Color.brand.opacity(0.18), lineWidth: 9)
                    Circle()
                        .trim(from: 0, to: min(1, CGFloat(thisWeek.count) / CGFloat(goal)))
                        .stroke(Color.brand, style: StrokeStyle(lineWidth: 9, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 0) {
                        Text("\(thisWeek.count)/\(goal)").font(.headline.monospacedDigit())
                        Text("entrenos").font(.caption2).foregroundColor(.secondary)
                    }
                }
                .frame(width: 84, height: 84)
                VStack(alignment: .leading, spacing: 6) {
                    Text(thisWeek.count >= goal ? "¡Objetivo cumplido! 🎉" : "Te faltan \(goal - thisWeek.count) para tu objetivo")
                        .font(.subheadline.weight(.semibold))
                    Label("Racha de \(store.weekStreak()) semanas", systemImage: "flame.fill")
                        .font(.caption)
                        .foregroundColor(.brand)
                }
            }
            .padding(.vertical, 6)
            HStack {
                compareTile(.volume)
                compareTile(.sets)
            }
            HStack {
                compareTile(.time)
                compareTile(.workouts)
            }
        }

        Section(header: Text("Volumen por día")) {
            let days = dailyVolumes()
            InteractiveBarChart(values: days, labels: dayLetters, color: .brand,
                                valueText: { "\(Fmt.int($0)) \(store.unit)" },
                                selected: $selectedDay, height: 150)
                .padding(.vertical, 6)
        }

        Section(header: Text("Músculos trabajados esta semana")) {
            let stats = store.muscleSets(in: thisWeek)
            if stats.isEmpty {
                Text("Aún no has entrenado esta semana.").foregroundColor(.secondary)
            }
            ForEach(stats) { s in muscleRow(s, maxSets: stats.first?.sets ?? 1) }
        }

        Section(header: Text("Entrenamientos de esta semana")) {
            if thisWeek.isEmpty {
                Text("Ninguno todavía. ¡A por el primero! 💪").foregroundColor(.secondary)
            }
            ForEach(thisWeek) { w in
                NavigationLink(destination: WorkoutDetailView(workoutID: w.id)) {
                    WorkoutRow(workout: w)
                }
            }
        }
    }

    func compareTile(_ metric: TrendMetric) -> some View {
        let now = metric.value(thisWeek)
        let before = metric.value(lastWeek)
        let change: Double? = before > 0 ? (now - before) / before * 100 : nil
        return VStack(alignment: .leading, spacing: 3) {
            Label(metric.rawValue, systemImage: metric.icon)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(metric.format(now, unit: store.unit))
                .font(.headline.monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            if let c = change {
                Text("\(c >= 0 ? "▲" : "▼") \(Int(abs(c).rounded()))% vs. semana pasada")
                    .font(.caption2)
                    .foregroundColor(c >= 0 ? .green : .red)
            } else {
                Text("Sin datos de la semana pasada")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    func dailyVolumes() -> [Double] {
        let start = store.weekStart(Date())
        var days = Array(repeating: 0.0, count: 7)
        for w in thisWeek {
            let d = store.calendar.dateComponents([.day], from: start, to: store.calendar.startOfDay(for: w.start)).day ?? -1
            if d >= 0 && d < 7 { days[d] += w.volume }
        }
        return days
    }

    // MARK: Total

    @ViewBuilder
    var totalSections: some View {
        let ws = store.data.workouts
        Section(header: Text("Desde que usas Forja")) {
            HStack {
                StatTile(title: "Entrenamientos", value: "\(ws.count)")
                StatTile(title: "Series", value: "\(ws.reduce(0) { $0 + $1.setCount })")
            }
            HStack {
                StatTile(title: "Volumen", value: "\(Fmt.int(ws.reduce(0) { $0 + $1.volume })) \(store.unit)")
                StatTile(title: "Tiempo", value: Fmt.duration(ws.reduce(0) { $0 + $1.duration }))
            }
        }

        Section(header: Text("Evolución"), footer: Text("Toca una gráfica para verla en detalle y a lo largo del tiempo.")) {
            ForEach([TrendMetric.volume, .workouts, .sets, .time]) { metric in
                NavigationLink(destination: TrendDetailView(metric: metric)) {
                    TrendPreviewRow(metric: metric)
                }
            }
        }

        Section(header: Text("Series por músculo · últimos 30 días")) {
            let stats = store.muscleStats(days: 30)
            if stats.isEmpty {
                Text("Sin datos todavía").foregroundColor(.secondary)
            }
            ForEach(stats) { s in muscleRow(s, maxSets: stats.first?.sets ?? 1) }
        }

        Section(header: measurementHeader) {
            Picker("Medida", selection: $measureField) {
                ForEach(MeasureField.allCases) { f in Text(f.rawValue).tag(f) }
            }
            .pickerStyle(.menu)
            let values = store.data.measurements.filter { measureField.value($0) > 0 }.sorted { $0.date < $1.date }
            if values.count >= 2 {
                LineChart(values: values.suffix(30).map { measureField.value($0) }, color: .green)
                if let first = values.first, let last = values.last {
                    let diff = measureField.value(last) - measureField.value(first)
                    Text("Cambio: \(diff >= 0 ? "+" : "")\(Fmt.num(diff)) \(measureField.unit(store.unit)) desde \(Fmt.shortDate(first.date))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            if store.data.measurements.isEmpty {
                Text("Registra tu peso y medidas para ver tu evolución.")
                    .foregroundColor(.secondary)
            }
            ForEach(store.data.measurements) { m in
                HStack {
                    Text(Fmt.shortDate(m.date))
                    Spacer()
                    Text(measurementSummary(m))
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.trailing)
                }
            }
            .onDelete { store.data.measurements.remove(atOffsets: $0) }
        }
    }

    func muscleRow(_ s: MuscleStat, maxSets: Int) -> some View {
        HStack {
            Text(s.muscle.rawValue)
                .font(.subheadline)
                .frame(width: 120, alignment: .leading)
            GeometryReader { g in
                Capsule()
                    .fill(Color.brand)
                    .frame(width: max(4, g.size.width * CGFloat(s.sets) / CGFloat(max(maxSets, 1))))
            }
            .frame(height: 10)
            Text("\(s.sets)")
                .font(.caption.monospacedDigit())
                .frame(width: 32, alignment: .trailing)
        }
    }

    var measurementHeader: some View {
        HStack {
            Text("Medidas corporales")
            Spacer()
            Button {
                showAddMeasurement = true
            } label: {
                Label("Añadir", systemImage: "plus")
            }
            .font(.caption.bold())
        }
    }

    func measurementSummary(_ m: BodyMeasurement) -> String {
        MeasureField.allCases
            .filter { $0.value(m) > 0 }
            .map { "\($0.rawValue): \(Fmt.num($0.value(m))) \($0.unit(store.unit))" }
            .joined(separator: "\n")
    }
}

/// Fila con mini gráfica de las últimas 8 semanas (se toca para ver el detalle).
struct TrendPreviewRow: View {
    @EnvironmentObject var store: Store
    let metric: TrendMetric

    var body: some View {
        let buckets = store.weekBuckets(8)
        let values = buckets.map { metric.value($0.workouts) }
        let maxV = max(values.max() ?? 0, 1)
        return HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Label(metric.title, systemImage: metric.icon)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.primary)
                Text("Esta semana: \(metric.format(values.last ?? 0, unit: store.unit))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            HStack(alignment: .bottom, spacing: 3) {
                ForEach(values.indices, id: \.self) { i in
                    RoundedRectangle(cornerRadius: 2)
                        .fill(i == values.count - 1 ? metric.color : metric.color.opacity(0.4))
                        .frame(width: 7, height: max(3, CGFloat(values[i] / maxV) * 38))
                }
            }
            .frame(height: 40, alignment: .bottom)
        }
        .padding(.vertical, 6)
    }
}

// MARK: - Detalle a lo largo del tiempo

struct TrendDetailView: View {
    @EnvironmentObject var store: Store
    @State var metric: TrendMetric
    @State var range: TrendRange = .weeks8
    @State var selected: Int? = nil

    var buckets: [WeekBucket] {
        let first = store.data.workouts.last?.start
        return store.weekBuckets(range.weekCount(firstWorkout: first, store: store))
    }

    var body: some View {
        let bs = buckets
        let values = bs.map { metric.value($0.workouts) }
        let active = values.filter { $0 > 0 }
        let total = values.reduce(0, +)
        let avg = active.isEmpty ? 0 : active.reduce(0, +) / Double(active.count)
        let bestIndex = values.indices.max { values[$0] < values[$1] }
        let shownIndex = selected ?? (values.count - 1)
        return List {
            Section {
                Picker("Métrica", selection: $metric) {
                    ForEach(TrendMetric.allCases) { m in Text(m.rawValue).tag(m) }
                }
                .pickerStyle(.segmented)
                Picker("Periodo", selection: $range) {
                    ForEach(TrendRange.allCases) { r in Text(r.rawValue).tag(r) }
                }
                .pickerStyle(.segmented)
            }

            Section {
                if bs.indices.contains(shownIndex) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(selected == nil ? "Esta semana" : "Semana del \(Fmt.weekRange(bs[shownIndex].start))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(metric.format(values[shownIndex], unit: store.unit))
                            .font(.title2.bold().monospacedDigit())
                            .foregroundColor(metric.color)
                    }
                }
                InteractiveBarChart(values: values,
                                    labels: bs.map { Fmt.dayMonth($0.start) },
                                    color: metric.color,
                                    valueText: { metric.short($0) },
                                    selected: $selected)
                    .padding(.vertical, 6)
                Text("Toca una barra para ver esa semana. Desliza para ver semanas anteriores.")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Section(header: Text("Resumen del periodo")) {
                HStack {
                    StatTile(title: "Total", value: metric.format(total, unit: store.unit))
                    StatTile(title: "Media semanal", value: metric.format(avg, unit: store.unit))
                }
                if let b = bestIndex, values[b] > 0 {
                    HStack {
                        Image(systemName: "trophy.fill").foregroundColor(.yellow)
                        Text("Mejor semana: \(Fmt.weekRange(bs[b].start))")
                        Spacer()
                        Text(metric.format(values[b], unit: store.unit)).bold()
                    }
                    .font(.subheadline)
                }
            }

            Section(header: Text("Semana a semana")) {
                ForEach(Array(bs.enumerated().reversed()), id: \.element.id) { item in
                    let i = item.offset
                    let prev = i > 0 ? values[i - 1] : 0
                    NavigationLink(destination: WeekWorkoutsView(bucket: item.element)) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(Fmt.weekRange(item.element.start)).font(.subheadline)
                                Text(item.element.workouts.count == 1 ? "1 entrenamiento" : "\(item.element.workouts.count) entrenamientos")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                Text(metric.format(values[i], unit: store.unit))
                                    .font(.subheadline.weight(.semibold).monospacedDigit())
                                if prev > 0 && values[i] > 0 {
                                    let c = (values[i] - prev) / prev * 100
                                    Text("\(c >= 0 ? "▲" : "▼") \(Int(abs(c).rounded()))%")
                                        .font(.caption2)
                                        .foregroundColor(c >= 0 ? .green : .red)
                                }
                            }
                        }
                    }
                    .disabled(item.element.workouts.isEmpty)
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle(metric.title)
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: range) { _ in selected = nil }
        .onChange(of: metric) { _ in selected = nil }
    }
}

struct WeekWorkoutsView: View {
    @EnvironmentObject var store: Store
    let bucket: WeekBucket

    var body: some View {
        List {
            Section(header: Text("Semana del \(Fmt.weekRange(bucket.start))")) {
                HStack {
                    StatTile(title: "Volumen", value: "\(Fmt.int(TrendMetric.volume.value(bucket.workouts))) \(store.unit)")
                    StatTile(title: "Series", value: "\(Int(TrendMetric.sets.value(bucket.workouts)))")
                    StatTile(title: "Tiempo", value: Fmt.duration(TrendMetric.time.value(bucket.workouts) * 60))
                }
            }
            Section(header: Text("Entrenamientos")) {
                ForEach(bucket.workouts) { w in
                    NavigationLink(destination: WorkoutDetailView(workoutID: w.id)) {
                        WorkoutRow(workout: w)
                    }
                }
            }
            let stats = store.muscleSets(in: bucket.workouts)
            if !stats.isEmpty {
                Section(header: Text("Series por músculo")) {
                    ForEach(stats) { s in
                        HStack {
                            Text(s.muscle.rawValue)
                            Spacer()
                            Text("\(s.sets)").bold().monospacedDigit()
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Detalle de la semana")
        .navigationBarTitleDisplayMode(.inline)
    }
}
