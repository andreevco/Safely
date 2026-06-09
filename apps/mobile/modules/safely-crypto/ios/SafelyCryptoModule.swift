import ExpoModulesCore

internal final class Pbkdf2FailedException: GenericException<Int32> {
    override var reason: String {
        "CCKeyDerivationPBKDF failed with status \(param)"
    }
}

// Native PBKDF2-HMAC-SHA512 over raw bytes. The BIP39 semantics (NFKD
// normalization, "mnemonic" salt prefix, 2048 iterations) live on the JS side
// in @safely/core; this module is a pure RFC 8018 primitive — see Pbkdf2Core.
//
// Sync `Function` with TypedArray args mirrors expo-crypto's `digest`: typed
// arrays share memory with the JS runtime, so they are only safe to touch on
// the JS thread. We copy them into Data here (cheap relative to the 2048
// HMAC iterations) and hand off to the testable pure `pbkdf2Sha512`. A native
// run takes ~10ms, fine to block on — unlike the pure-JS path it replaces (~2s
// on Hermes).
public class SafelyCryptoModule: Module {
    public func definition() -> ModuleDefinition {
        Name("SafelyCrypto")

        Function("pbkdf2Sha512") { (password: TypedArray, salt: TypedArray, iterations: Int, output: TypedArray) in
            var passwordData = Data(bytes: password.rawPointer, count: password.byteLength)
            defer { passwordData.resetBytes(in: 0..<passwordData.count) }
            let saltData = Data(bytes: salt.rawPointer, count: salt.byteLength)
            do {
                var derived = try pbkdf2Sha512(
                    password: passwordData,
                    salt: saltData,
                    iterations: iterations,
                    keyLength: output.byteLength
                )
                defer { derived.resetBytes(in: 0..<derived.count) }
                derived.withUnsafeBytes { src in
                    output.rawPointer.copyMemory(from: src.baseAddress!, byteCount: src.count)
                }
            } catch Pbkdf2Error.derivationFailed(let status) {
                throw Pbkdf2FailedException(status)
            }
        }
    }
}
