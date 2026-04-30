import ExpoModulesCore
import Security

// Enumerates and bulk-deletes generic-password keychain items written by
// `expo-secure-store`. Items are matched by `kSecAttrService` (the service
// the app passes to SecureStore options); JS-level keys are read from
// `kSecAttrAccount` (UTF-8 bytes), which is exactly how `expo-secure-store`
// stores them — see SecureStoreModule.swift in that package.
//
// Important: `expo-secure-store` mutates the service string by appending
// ":auth" / ":no-auth" when `requireAuthentication` is provided in its
// options. We mirror that exact rule here so enumeration matches what the
// package wrote. See SecureStoreModule.swift `query(...)` in that package.
//
// Listing uses `kSecUseAuthenticationUI: kSecUseAuthenticationUIFail` so it
// never raises a biometric prompt; only fetching `kSecValueData` would.
//
// No intent journal: `clearAsync` is a single attribute-match SecItemDelete
// (atomic at securityd level); `removeItemsWithPrefixAsync` is a tight native loop
// where the kill-mid-loop window is on the order of microseconds. We accept
// that risk in exchange for not maintaining a separate journal store.
public class SafelySecureStoreEnumModule: Module {
    private let queue = DispatchQueue(label: "co.safely.SafelySecureStoreEnum")

    struct Options: Record {
        @Field var keychainService: String
        @Field var requireAuthentication: Bool?
    }

    public func definition() -> ModuleDefinition {
        Name("SafelySecureStoreEnum")

        AsyncFunction("getKeysAsync") { (options: Options) -> [String] in
            try self.runSync { try self.readAccounts(service: self.effectiveService(options)) }
        }

        AsyncFunction("getKeysWithPrefixAsync") { (prefix: String, options: Options) -> [String] in
            try self.runSync {
                try self.readAccounts(service: self.effectiveService(options))
                    .filter { $0.hasPrefix(prefix) }
            }
        }

        AsyncFunction("clearAsync") { (options: Options) in
            try self.runSync {
                let svc = self.effectiveService(options)
                let q: [String: Any] = [
                    kSecClass as String: kSecClassGenericPassword,
                    kSecAttrService as String: svc
                ]
                let status = SecItemDelete(q as CFDictionary)
                if status != errSecSuccess && status != errSecItemNotFound {
                    throw NSError(domain: "SafelySecureStoreEnum", code: Int(status))
                }
            }
        }

        AsyncFunction("removeItemsWithPrefixAsync") { (prefix: String, options: Options) in
            try self.runSync {
                try self.deleteByPrefix(
                    service: self.effectiveService(options),
                    prefix: prefix
                )
            }
        }
    }

    // MARK: - Service mangling (mirror of expo-secure-store)

    private func effectiveService(_ options: Options) -> String {
        guard let requireAuth = options.requireAuthentication else {
            return options.keychainService
        }
        return options.keychainService + ":\(requireAuth ? "auth" : "no-auth")"
    }

    // MARK: - Core

    private func readAccounts(service: String) throws -> [String] {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecMatchLimit as String: kSecMatchLimitAll,
            kSecReturnAttributes as String: kCFBooleanTrue!,
            kSecUseAuthenticationUI as String: kSecUseAuthenticationUIFail
        ]
        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound { return [] }
        if status != errSecSuccess {
            throw NSError(domain: "SafelySecureStoreEnum", code: Int(status))
        }
        guard let array = result as? [[String: Any]] else { return [] }
        return array.compactMap { attrs -> String? in
            if let data = attrs[kSecAttrAccount as String] as? Data,
               let key = String(data: data, encoding: .utf8) {
                return key
            }
            if let str = attrs[kSecAttrAccount as String] as? String {
                return str
            }
            return nil
        }
    }

    private func deleteByPrefix(service: String, prefix: String) throws {
        let keys = try readAccounts(service: service).filter { $0.hasPrefix(prefix) }
        for key in keys {
            let encoded = Data(key.utf8)
            let q: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: service,
                kSecAttrAccount as String: encoded
            ]
            let status = SecItemDelete(q as CFDictionary)
            if status != errSecSuccess && status != errSecItemNotFound {
                throw NSError(domain: "SafelySecureStoreEnum", code: Int(status))
            }
        }
    }

    private func runSync<T>(_ block: () throws -> T) throws -> T {
        var result: Result<T, Error>!
        queue.sync {
            do { result = .success(try block()) } catch { result = .failure(error) }
        }
        return try result.get()
    }
}
