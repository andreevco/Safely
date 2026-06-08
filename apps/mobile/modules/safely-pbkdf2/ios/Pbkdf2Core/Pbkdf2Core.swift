import CommonCrypto
import Foundation

enum Pbkdf2Error: Error {
    case derivationFailed(Int32)
}

// Pure RFC 8018 PBKDF2-HMAC-SHA512 over raw bytes. No ExpoModulesCore
// dependency, so it is unit-testable on the host via SwiftPM (`swift test`).
// The BIP39 semantics (NFKD, "mnemonic" salt prefix, 2048 iterations) live on
// the JS side; this is the bare primitive. SafelyPbkdf2Module's `Function` is a
// thin TypedArray<->Data adapter over this function.
func pbkdf2Sha512(password: Data, salt: Data, iterations: Int, keyLength: Int) throws -> Data {
    var derived = Data(count: keyLength)
    let status = derived.withUnsafeMutableBytes { outBuf in
        password.withUnsafeBytes { pwBuf in
            salt.withUnsafeBytes { saltBuf in
                CCKeyDerivationPBKDF(
                    CCPBKDFAlgorithm(kCCPBKDF2),
                    pwBuf.baseAddress?.assumingMemoryBound(to: Int8.self),
                    password.count,
                    saltBuf.baseAddress?.assumingMemoryBound(to: UInt8.self),
                    salt.count,
                    CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA512),
                    UInt32(iterations),
                    outBuf.baseAddress?.assumingMemoryBound(to: UInt8.self),
                    keyLength
                )
            }
        }
    }
    guard status == CCStatus(kCCSuccess) else {
        throw Pbkdf2Error.derivationFailed(status)
    }
    return derived
}
