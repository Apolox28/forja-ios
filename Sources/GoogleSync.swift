import Foundation
import SwiftUI
import UIKit
import AuthenticationServices
import CryptoKit
import Security

// MARK: - Configuración

enum GoogleConfig {
    /// ID de cliente iOS creado en Google Cloud Console (se puede cambiar dentro de la app).
    static let defaultClientID = "733914063882-7t7oqcnlvmcmocp0hv0l70cnrl9vl5vb.apps.googleusercontent.com"

    static var clientID: String {
        get {
            let saved = UserDefaults.standard.string(forKey: "googleClientID") ?? ""
            return saved.isEmpty ? defaultClientID : saved
        }
        set {
            UserDefaults.standard.set(newValue.trimmingCharacters(in: .whitespacesAndNewlines), forKey: "googleClientID")
        }
    }

    static var isConfigured: Bool { clientID.hasSuffix(".apps.googleusercontent.com") }

    /// "123-abc.apps.googleusercontent.com" → "com.googleusercontent.apps.123-abc"
    static var reversedScheme: String {
        clientID.components(separatedBy: ".").reversed().joined(separator: ".")
    }

    static var redirectURI: String { reversedScheme + ":/oauth2redirect" }
    static let scopes = "openid email https://www.googleapis.com/auth/drive.appdata"
    static let backupName = "forja-backup.json"
}

enum GoogleError: LocalizedError {
    case notConfigured, cancelled, noCode, server(String), noBackup, notSignedIn

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "Falta el ID de cliente de Google."
        case .cancelled: return "Inicio de sesión cancelado."
        case .noCode: return "Google no devolvió el código de acceso."
        case .server(let m): return "Google respondió: \(m)"
        case .noBackup: return "No hay ninguna copia de Forja en tu Google Drive."
        case .notSignedIn: return "Primero inicia sesión con Google."
        }
    }
}

// MARK: - Llavero

enum Keychain {
    static func set(_ value: String?, for key: String) {
        let base: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                   kSecAttrAccount as String: key,
                                   kSecAttrService as String: "com.forja.app"]
        SecItemDelete(base as CFDictionary)
        guard let v = value, let data = v.data(using: .utf8) else { return }
        var add = base
        add[kSecValueData as String] = data
        add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        SecItemAdd(add as CFDictionary, nil)
    }

    static func get(_ key: String) -> String? {
        let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                kSecAttrAccount as String: key,
                                kSecAttrService as String: "com.forja.app",
                                kSecReturnData as String: true,
                                kSecMatchLimit as String: kSecMatchLimitOne]
        var out: AnyObject?
        guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let d = out as? Data else { return nil }
        return String(data: d, encoding: .utf8)
    }
}

// MARK: - Sesión y Drive

final class AuthAnchor: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        return scenes.compactMap { $0.keyWindow }.first ?? scenes.first?.windows.first ?? ASPresentationAnchor()
    }
}

@MainActor
final class GoogleSync: ObservableObject {
    static let shared = GoogleSync()

    @Published var email: String? = UserDefaults.standard.string(forKey: "googleEmail")
    @Published var busy = false
    @Published var lastBackup: Date? = UserDefaults.standard.object(forKey: "googleLastBackup") as? Date
    @Published var autoBackup: Bool = UserDefaults.standard.object(forKey: "googleAutoBackup") as? Bool ?? true {
        didSet { UserDefaults.standard.set(autoBackup, forKey: "googleAutoBackup") }
    }

    var isSignedIn: Bool { email != nil && Keychain.get("google.refresh") != nil }

    private var accessToken: String?
    private var expiry = Date.distantPast
    private var session: ASWebAuthenticationSession?
    private let anchor = AuthAnchor()

    // Inicio de sesión (OAuth 2.0 con PKCE, sin SDK)
    func signIn() async throws {
        guard GoogleConfig.isConfigured else { throw GoogleError.notConfigured }
        busy = true
        defer { busy = false }

        let verifier = Self.randomString(64)
        let challenge = Self.base64url(Data(SHA256.hash(data: Data(verifier.utf8))))
        var comps = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        comps.queryItems = [
            URLQueryItem(name: "client_id", value: GoogleConfig.clientID),
            URLQueryItem(name: "redirect_uri", value: GoogleConfig.redirectURI),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: GoogleConfig.scopes),
            URLQueryItem(name: "code_challenge", value: challenge),
            URLQueryItem(name: "code_challenge_method", value: "S256"),
            URLQueryItem(name: "prompt", value: "consent"),
        ]
        let callback = try await authenticate(url: comps.url!, scheme: GoogleConfig.reversedScheme)
        guard let code = URLComponents(url: callback, resolvingAgainstBaseURL: false)?
            .queryItems?.first(where: { $0.name == "code" })?.value else { throw GoogleError.noCode }

        let json = try await tokenRequest([
            "code": code,
            "client_id": GoogleConfig.clientID,
            "redirect_uri": GoogleConfig.redirectURI,
            "grant_type": "authorization_code",
            "code_verifier": verifier,
        ])
        if let refresh = json["refresh_token"] as? String { Keychain.set(refresh, for: "google.refresh") }
        storeAccess(json)

        let info = try await getJSON("https://www.googleapis.com/oauth2/v3/userinfo")
        let mail = info["email"] as? String ?? "Cuenta de Google"
        email = mail
        UserDefaults.standard.set(mail, forKey: "googleEmail")
    }

    func signOut() {
        if let token = Keychain.get("google.refresh"),
           let url = URL(string: "https://oauth2.googleapis.com/revoke?token=\(token)") {
            var req = URLRequest(url: url)
            req.httpMethod = "POST"
            URLSession.shared.dataTask(with: req).resume()
        }
        Keychain.set(nil, for: "google.refresh")
        accessToken = nil
        email = nil
        UserDefaults.standard.removeObject(forKey: "googleEmail")
    }

    // Copia de seguridad
    func backup(_ payload: Data) async throws {
        guard isSignedIn else { throw GoogleError.notSignedIn }
        busy = true
        defer { busy = false }
        let token = try await validToken()
        if let existing = try await findBackup() {
            var req = URLRequest(url: URL(string: "https://www.googleapis.com/upload/drive/v3/files/\(existing)?uploadType=media")!)
            req.httpMethod = "PATCH"
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = payload
            _ = try await send(req)
        } else {
            let boundary = "forja-\(UUID().uuidString)"
            var body = Data()
            let meta = "{\"name\":\"\(GoogleConfig.backupName)\",\"parents\":[\"appDataFolder\"]}"
            body.append("--\(boundary)\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n\(meta)\r\n".data(using: .utf8)!)
            body.append("--\(boundary)\r\nContent-Type: application/json\r\n\r\n".data(using: .utf8)!)
            body.append(payload)
            body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
            var req = URLRequest(url: URL(string: "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart")!)
            req.httpMethod = "POST"
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            req.setValue("multipart/related; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
            req.httpBody = body
            _ = try await send(req)
        }
        let now = Date()
        lastBackup = now
        UserDefaults.standard.set(now, forKey: "googleLastBackup")
    }

    func downloadBackup() async throws -> Data {
        guard isSignedIn else { throw GoogleError.notSignedIn }
        busy = true
        defer { busy = false }
        guard let id = try await findBackup() else { throw GoogleError.noBackup }
        let token = try await validToken()
        var req = URLRequest(url: URL(string: "https://www.googleapis.com/drive/v3/files/\(id)?alt=media")!)
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        return try await send(req)
    }

    // MARK: Internos

    private func findBackup() async throws -> String? {
        var comps = URLComponents(string: "https://www.googleapis.com/drive/v3/files")!
        comps.queryItems = [
            URLQueryItem(name: "spaces", value: "appDataFolder"),
            URLQueryItem(name: "q", value: "name='\(GoogleConfig.backupName)'"),
            URLQueryItem(name: "fields", value: "files(id,modifiedTime)"),
        ]
        let json = try await getJSON(comps.url!.absoluteString)
        let files = json["files"] as? [[String: Any]] ?? []
        return files.first?["id"] as? String
    }

    private func validToken() async throws -> String {
        if let t = accessToken, expiry > Date().addingTimeInterval(60) { return t }
        guard let refresh = Keychain.get("google.refresh") else { throw GoogleError.notSignedIn }
        let json = try await tokenRequest([
            "client_id": GoogleConfig.clientID,
            "refresh_token": refresh,
            "grant_type": "refresh_token",
        ])
        storeAccess(json)
        guard let t = accessToken else { throw GoogleError.server("sin token") }
        return t
    }

    private func storeAccess(_ json: [String: Any]) {
        accessToken = json["access_token"] as? String
        let secs = (json["expires_in"] as? Double) ?? Double(json["expires_in"] as? Int ?? 3600)
        expiry = Date().addingTimeInterval(secs)
    }

    private func tokenRequest(_ params: [String: String]) async throws -> [String: Any] {
        var req = URLRequest(url: URL(string: "https://oauth2.googleapis.com/token")!)
        req.httpMethod = "POST"
        req.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        var allowed = CharacterSet.alphanumerics
        allowed.insert(charactersIn: "-._~")
        req.httpBody = params.map { k, v in
            "\(k)=\(v.addingPercentEncoding(withAllowedCharacters: allowed) ?? v)"
        }.joined(separator: "&").data(using: .utf8)
        let data = try await send(req)
        return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
    }

    private func getJSON(_ url: String) async throws -> [String: Any] {
        let token = try await validToken()
        var req = URLRequest(url: URL(string: url)!)
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let data = try await send(req)
        return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
    }

    private func send(_ req: URLRequest) async throws -> Data {
        let (data, response) = try await URLSession.shared.data(for: req)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            let text = String(data: data, encoding: .utf8) ?? "error \(http.statusCode)"
            throw GoogleError.server(String(text.prefix(200)))
        }
        return data
    }

    private func authenticate(url: URL, scheme: String) async throws -> URL {
        try await withCheckedThrowingContinuation { cont in
            let s = ASWebAuthenticationSession(url: url, callbackURLScheme: scheme) { callback, error in
                if let callback = callback {
                    cont.resume(returning: callback)
                } else if let e = error as? ASWebAuthenticationSessionError, e.code == .canceledLogin {
                    cont.resume(throwing: GoogleError.cancelled)
                } else {
                    cont.resume(throwing: error ?? GoogleError.noCode)
                }
            }
            s.presentationContextProvider = anchor
            s.prefersEphemeralWebBrowserSession = false
            session = s
            s.start()
        }
    }

    static func randomString(_ n: Int) -> String {
        let chars = Array("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~")
        return String((0..<n).map { _ in chars[Int.random(in: 0..<chars.count)] })
    }

    static func base64url(_ data: Data) -> String {
        data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}

// MARK: - Interfaz en Perfil

struct GoogleAccountSection: View {
    @EnvironmentObject var store: Store
    @ObservedObject var sync = GoogleSync.shared
    @State var clientID = GoogleConfig.clientID
    @State var configured = GoogleConfig.isConfigured
    @State var message: String? = nil
    @State var confirmRestore = false

    var body: some View {
        Section(header: Text("Cuenta de Google"),
                footer: Text(footer)) {
            if !configured {
                Text("Para vincular Google necesitas pegar aquí tu ID de cliente (termina en .apps.googleusercontent.com).")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                TextField("ID de cliente de Google", text: $clientID)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
                    .font(.caption.monospaced())
                Button("Guardar ID") {
                    GoogleConfig.clientID = clientID
                    configured = GoogleConfig.isConfigured
                    if !configured { message = "Ese ID no es válido. Debe terminar en .apps.googleusercontent.com" }
                }
            } else if let mail = sync.email {
                Label(mail, systemImage: "person.crop.circle.badge.checkmark")
                Toggle("Copia automática al terminar un entrenamiento", isOn: $sync.autoBackup)
                Button {
                    Task {
                        do {
                            guard let payload = store.encodedData() else { return }
                            try await sync.backup(payload)
                            message = "Copia guardada en tu Google Drive."
                        } catch { message = error.localizedDescription }
                    }
                } label: {
                    Label("Guardar copia en Google Drive", systemImage: "icloud.and.arrow.up")
                }
                Button {
                    confirmRestore = true
                } label: {
                    Label("Restaurar desde Google Drive", systemImage: "icloud.and.arrow.down")
                }
                Button(role: .destructive) {
                    sync.signOut()
                } label: {
                    Label("Cerrar sesión de Google", systemImage: "rectangle.portrait.and.arrow.right")
                }
            } else {
                Button {
                    Task {
                        do {
                            try await sync.signIn()
                            message = "Cuenta vinculada. Tus entrenamientos se guardarán en tu Google Drive."
                        } catch GoogleError.cancelled {
                        } catch { message = error.localizedDescription }
                    }
                } label: {
                    HStack {
                        Image(systemName: "g.circle.fill").font(.title2)
                        Text("Iniciar sesión con Google").bold()
                        Spacer()
                        if sync.busy { ProgressView() }
                    }
                }
            }
        }
        .alert("Google", isPresented: Binding(get: { message != nil }, set: { if !$0 { message = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(message ?? "")
        }
        .confirmationDialog("¿Restaurar desde Google Drive?", isPresented: $confirmRestore, titleVisibility: .visible) {
            Button("Restaurar", role: .destructive) {
                Task {
                    do {
                        let raw = try await sync.downloadBackup()
                        message = store.restore(from: raw)
                    } catch { message = error.localizedDescription }
                }
            }
            Button("Cancelar", role: .cancel) {}
        } message: {
            Text("Se reemplazarán los datos de este iPhone por los de la copia en la nube.")
        }
    }

    var footer: String {
        if let d = sync.lastBackup {
            return "Última copia: \(Fmt.longDate(d)). Se guarda en una carpeta privada de la app dentro de tu Drive."
        }
        return "Inicia sesión para guardar tus entrenamientos en tu Google Drive y recuperarlos en otro iPhone."
    }
}
