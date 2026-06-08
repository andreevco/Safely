package expo.modules.safelypbkdf2

import org.junit.Assert.assertEquals
import org.junit.Test

// Unit tests for the manual PBKDF2-HMAC-SHA512 block loop. They exercise the
// hand-rolled logic (iteration XOR, multi-block, key truncation) — the HMAC
// itself is JVM-provided (SunJCE on the host, Conscrypt on device); PBKDF2 is
// provider-independent, so these vectors match on both. Most cases use the real
// BIP39 profile (salt "mnemonic", 2048 iterations, 64-byte key) so a wrong
// result here = wrong wallet addresses; vectors are cross-checked against the
// canonical BIP39 test vectors and node's crypto.pbkdf2Sync.
class Pbkdf2HmacSha512Test {
    private fun hex(bytes: ByteArray) = bytes.joinToString("") { "%02x".format(it) }

    private fun derive(password: String, salt: String, iterations: Int, keyLength: Int) =
        hex(pbkdf2HmacSha512(password.toByteArray(), salt.toByteArray(), iterations, keyLength))

    // BIP39 profile, empty passphrase (salt "mnemonic"), canonical vectors.
    private fun bip39Seed(mnemonic: String) = derive(mnemonic, "mnemonic", 2048, 64)

    private val abandonMnemonic = List(11) { "abandon" }.plus("about").joinToString(" ")

    @Test
    fun bip39AbandonAboutVector() {
        // The canonical BIP39 "abandon… about" / empty-passphrase seed.
        assertEquals(
            "5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4",
            bip39Seed(abandonMnemonic)
        )
    }

    @Test
    fun bip39LegalWinnerVector() {
        assertEquals(
            "878386efb78845b3355bd15ea4d39ef97d179cb712b77d5c12b6be415fffeffe5f377ba02bf3f8544ab800b955e51fbff09828f682052a20faa6addbbddfb096",
            bip39Seed("legal winner thank year wave sausage worth useful legal winner thank yellow")
        )
    }

    @Test
    fun bip39LetterAdviceVector() {
        assertEquals(
            "77d6be9708c8218738934f84bbbb78a2e048ca007746cb764f0673e4b1812d176bbb173e1a291f31cf633f1d0bad7d3cf071c30e98cd0688b5bcce65ecaceb36",
            bip39Seed("letter advice cage absurd amount doctor acoustic avoid letter advice cage above")
        )
    }

    @Test
    fun bip39WithPassphraseVector() {
        // Same mnemonic, passphrase "TREZOR" -> salt "mnemonicTREZOR". The most
        // widely published BIP39 vector; guards the salt-concatenation path.
        assertEquals(
            "c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04",
            derive(abandonMnemonic, "mnemonicTREZOR", 2048, 64)
        )
    }

    // --- branch coverage for the hand-rolled loop (non-BIP39 parameters) ---

    @Test
    fun singleIteration() {
        // iterations = 1: only U_1, the inner XOR-accumulation loop never runs.
        assertEquals(
            "64d8279a3894fed8d8847f5c3c9a42678dc846253fcda33157df5c148ab9df4ac3c9079d364e2a6f9d24b24c3ae858cdb0cfb546e01986cee10967f2473a2b37",
            derive(abandonMnemonic, "mnemonic", 1, 64)
        )
    }

    @Test
    fun multiBlockTruncated() {
        // keyLength 100: blocks = 2, then truncated 128 -> 100 (copyOf branch).
        assertEquals(
            "5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4" +
                "f8f12c541aeb32cc5576a45e4a70c8ba0fbef5a8f1eb4cbd856d5a4bf11639ab27c68cdc",
            derive(abandonMnemonic, "mnemonic", 2048, 100)
        )
    }

    @Test
    fun truncatedWithinSingleBlock() {
        // keyLength 20 < hLen: single block, truncated to 20.
        assertEquals(
            "5eb00bbddcf069084889a8ab9155568165f5c453",
            derive(abandonMnemonic, "mnemonic", 2048, 20)
        )
    }
}
