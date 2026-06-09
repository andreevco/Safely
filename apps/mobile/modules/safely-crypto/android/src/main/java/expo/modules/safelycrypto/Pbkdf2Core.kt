package expo.modules.safelycrypto

import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

// Pure RFC 8018 PBKDF2-HMAC-SHA512 over raw bytes. Depends on nothing but the
// JDK (javax.crypto) — no Expo/Android/RN — so it is unit-testable on a plain
// JVM via the android/host-test Gradle project. The BIP39 semantics (NFKD,
// "mnemonic" salt prefix, 2048 iterations) live on the JS side; this is the
// bare primitive, called by SafelyCryptoModule's thin `Function` adapter.
//
// Implemented as a manual block loop over Mac("HmacSHA512") instead of
// SecretKeyFactory("PBKDF2WithHmacSHA512") because PBEKeySpec only accepts
// char[] and applies its own char->byte conversion; BIP39 requires the password
// to be the exact UTF-8/NFKD bytes produced by the JS side. The Mac itself is
// Conscrypt-native on device, so the 2048-iteration loop stays ~10ms.
internal fun pbkdf2HmacSha512(
    password: ByteArray,
    salt: ByteArray,
    iterations: Int,
    keyLength: Int
): ByteArray {
    val mac = Mac.getInstance("HmacSHA512")
    mac.init(SecretKeySpec(password, "HmacSHA512"))
    val hLen = mac.macLength
    val blocks = (keyLength + hLen - 1) / hLen
    val dk = ByteArray(blocks * hLen)
    val blockIndex = ByteArray(4)
    for (i in 1..blocks) {
        blockIndex[0] = (i ushr 24).toByte()
        blockIndex[1] = (i ushr 16).toByte()
        blockIndex[2] = (i ushr 8).toByte()
        blockIndex[3] = i.toByte()
        mac.update(salt)
        mac.update(blockIndex)
        var u = mac.doFinal()
        val t = u.copyOf()
        for (j in 1 until iterations) {
            u = mac.doFinal(u)
            for (k in t.indices) t[k] = (t[k].toInt() xor u[k].toInt()).toByte()
        }
        t.copyInto(dk, (i - 1) * hLen)
        t.fill(0)
        u.fill(0)
    }
    return if (dk.size == keyLength) {
        dk
    } else {
        dk.copyOf(keyLength).also { dk.fill(0) }
    }
}
