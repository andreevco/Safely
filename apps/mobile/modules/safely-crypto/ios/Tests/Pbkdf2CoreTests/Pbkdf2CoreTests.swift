import Foundation
import XCTest

@testable import Pbkdf2Core

// Unit tests for the PBKDF2-HMAC-SHA512 primitive. iOS delegates to
// CommonCrypto's CCKeyDerivationPBKDF, so these mainly guard that the
// parameters (PRF = HMAC-SHA512, algorithm = PBKDF2, argument order) stay
// correct. Most cases use the real BIP39 profile (salt "mnemonic", 2048
// iterations, 64-byte key); vectors are cross-checked against the canonical
// BIP39 test vectors and node's crypto.pbkdf2Sync, and match the Android tests.
final class Pbkdf2CoreTests: XCTestCase {
    private func hex(_ data: Data) -> String {
        data.map { String(format: "%02x", $0) }.joined()
    }

    private func derive(_ password: String, _ salt: String, _ iterations: Int, _ keyLength: Int) throws -> String {
        let out = try pbkdf2Sha512(
            password: Data(password.utf8),
            salt: Data(salt.utf8),
            iterations: iterations,
            keyLength: keyLength
        )
        return hex(out)
    }

    // BIP39 profile, empty passphrase (salt "mnemonic").
    private func bip39Seed(_ mnemonic: String) throws -> String {
        try derive(mnemonic, "mnemonic", 2048, 64)
    }

    private let abandonMnemonic =
        Array(repeating: "abandon", count: 11).joined(separator: " ") + " about"

    func testBip39AbandonAboutVector() throws {
        // The canonical BIP39 "abandon… about" / empty-passphrase seed.
        XCTAssertEqual(
            try bip39Seed(abandonMnemonic),
            "5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4"
        )
    }

    func testBip39LegalWinnerVector() throws {
        XCTAssertEqual(
            try bip39Seed("legal winner thank year wave sausage worth useful legal winner thank yellow"),
            "878386efb78845b3355bd15ea4d39ef97d179cb712b77d5c12b6be415fffeffe5f377ba02bf3f8544ab800b955e51fbff09828f682052a20faa6addbbddfb096"
        )
    }

    func testBip39LetterAdviceVector() throws {
        XCTAssertEqual(
            try bip39Seed("letter advice cage absurd amount doctor acoustic avoid letter advice cage above"),
            "77d6be9708c8218738934f84bbbb78a2e048ca007746cb764f0673e4b1812d176bbb173e1a291f31cf633f1d0bad7d3cf071c30e98cd0688b5bcce65ecaceb36"
        )
    }

    func testBip39WithPassphraseVector() throws {
        // Same mnemonic, passphrase "TREZOR" -> salt "mnemonicTREZOR". The most
        // widely published BIP39 vector; guards the salt-concatenation path.
        XCTAssertEqual(
            try derive(abandonMnemonic, "mnemonicTREZOR", 2048, 64),
            "c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04"
        )
    }

    // --- non-BIP39 parameters: exercise iteration count and key length ---

    func testSingleIteration() throws {
        XCTAssertEqual(
            try derive(abandonMnemonic, "mnemonic", 1, 64),
            "64d8279a3894fed8d8847f5c3c9a42678dc846253fcda33157df5c148ab9df4ac3c9079d364e2a6f9d24b24c3ae858cdb0cfb546e01986cee10967f2473a2b37"
        )
    }

    // keyLength spanning two HMAC-SHA512 blocks, truncated 128 -> 100.
    func testMultiBlockTruncated() throws {
        XCTAssertEqual(
            try derive(abandonMnemonic, "mnemonic", 2048, 100),
            "5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4" +
                "f8f12c541aeb32cc5576a45e4a70c8ba0fbef5a8f1eb4cbd856d5a4bf11639ab27c68cdc"
        )
    }

    // keyLength shorter than one block.
    func testShortKey() throws {
        XCTAssertEqual(
            try derive(abandonMnemonic, "mnemonic", 2048, 20),
            "5eb00bbddcf069084889a8ab9155568165f5c453"
        )
    }
}
