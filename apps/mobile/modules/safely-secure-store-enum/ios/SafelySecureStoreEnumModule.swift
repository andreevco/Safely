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
// (atomic at securityd level). `removeItemsWithPrefixAsync` enumerates the
// matching accounts and issues one attribute-match SecItemDelete per item.
//
// We previously batched via `kSecMatchItemList` with persistent refs. That
// returned errSecParam (-50) in production on iOS 18.6.x (multiple devices).
//
// `Security.framework/Headers/SecItem.h` (iOS SDK, definitive source — the
// generated web docs miss this) explicitly tags the key as macOS-only:
//
//   @constant kSecMatchItemList macOS only. Specifies a dictionary key
//   whose value is a CFArray of SecKeychainItemRef items.
//
// And in SecItemDelete's own docblock:
//
//   To delete an item identified by a persistent reference, on iOS, specify
//   kSecValuePersistentRef … On macOS, use kSecMatchItemList …
//
// So there is no iOS API to delete N items by ref in a single IPC — the
// lower bound is N XPC calls (per-attribute or per-persistent-ref).
//
// We pick attribute-match: no persistent-ref dependency, matches the path
// expo-secure-store uses for single-item delete. Known-good on every iOS.
//
// The kill-mid-call window grows to N XPC calls, but each individual delete
// remains atomic at securityd level. We accept that residual risk in
// exchange for not maintaining a separate journal store.
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
                try self.deleteItems(service: self.effectiveService(options))
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
            // expo-secure-store writes kSecAttrAccount as UTF-8 bytes (Data);
            // accept String too in case a different writer touched the same service.
            if let data = attrs[kSecAttrAccount as String] as? Data {
                return String(data: data, encoding: .utf8)
            }
            return attrs[kSecAttrAccount as String] as? String
        }
    }

    private func deleteByPrefix(service: String, prefix: String) throws {
        if prefix.isEmpty {
            try deleteItems(service: service)
            return
        }
        let accounts = try readAccounts(service: service)
            .filter { $0.hasPrefix(prefix) }
        for account in accounts {
            try deleteItems(service: service, account: account)
        }
    }

    private func deleteItems(service: String, account: String? = nil) throws {
        var q: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service
        ]
        if let account = account {
            // Match the type expo-secure-store writes — Data(key.utf8), not String.
            // securityd's attribute match is type-sensitive; passing String here
            // would silently miss items and return errSecItemNotFound, leaving
            // orphaned keychain records.
            q[kSecAttrAccount as String] = Data(account.utf8)
        }
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
