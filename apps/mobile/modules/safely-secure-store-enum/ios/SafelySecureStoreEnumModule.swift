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
// (atomic at securityd level). `removeItemsWithPrefixAsync` collects persistent
// references for the matching accounts and issues a single batched SecItemDelete
// via `kSecMatchItemList` — one IPC round-trip into securityd instead of N. Not
// fully atomic at the securityd level, but the kill-mid-call window is the
// duration of a single XPC call. We accept that residual risk in exchange for
// not maintaining a separate journal store.
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

    private func readEntries(service: String) throws -> [(account: String, ref: Data)] {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecMatchLimit as String: kSecMatchLimitAll,
            kSecReturnAttributes as String: kCFBooleanTrue!,
            kSecReturnPersistentRef as String: kCFBooleanTrue!,
            kSecUseAuthenticationUI as String: kSecUseAuthenticationUIFail
        ]
        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound { return [] }
        if status != errSecSuccess {
            throw NSError(domain: "SafelySecureStoreEnum", code: Int(status))
        }
        guard let array = result as? [[String: Any]] else { return [] }
        return array.compactMap { attrs -> (String, Data)? in
            guard let ref = attrs[kSecValuePersistentRef as String] as? Data else {
                return nil
            }
            if let data = attrs[kSecAttrAccount as String] as? Data,
               let key = String(data: data, encoding: .utf8) {
                return (key, ref)
            }
            if let str = attrs[kSecAttrAccount as String] as? String {
                return (str, ref)
            }
            return nil
        }
    }

    private func readAccounts(service: String) throws -> [String] {
        return try readEntries(service: service).map { $0.account }
    }

    private func deleteByPrefix(service: String, prefix: String) throws {
        let refs = try readEntries(service: service)
            .filter { $0.account.hasPrefix(prefix) }
            .map { $0.ref }
        if refs.isEmpty { return }
        let q: [String: Any] = [
            kSecMatchItemList as String: refs
        ]
        let status = SecItemDelete(q as CFDictionary)
        if status != errSecSuccess && status != errSecItemNotFound {
            throw NSError(domain: "SafelySecureStoreEnum", code: Int(status))
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
