package expo.modules.safelypbkdf2

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.typedarray.Uint8Array
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

internal class Pbkdf2InvalidArgsException(message: String) : CodedException(message)

// Native PBKDF2-HMAC-SHA512 over raw bytes. The BIP39 semantics (NFKD
// normalization, "mnemonic" salt prefix, 2048 iterations) live on the JS side
// in @safely/core; this module is a pure RFC 8018 primitive.
//
// Implemented as a manual block loop over Mac("HmacSHA512") instead of
// SecretKeyFactory("PBKDF2WithHmacSHA512") because PBEKeySpec only accepts
// char[] and applies its own char->byte conversion; BIP39 requires the
// password to be the exact UTF-8/NFKD bytes produced by the JS side. The Mac
// itself is Conscrypt-native, so the 2048-iteration loop stays ~10ms.
//
// Sync `Function` with TypedArray args mirrors expo-crypto's `digest`: typed
// arrays share memory with the JS runtime, so they are only safe to touch on
// the JS thread.
class SafelyPbkdf2Module : Module() {
    override fun definition() = ModuleDefinition {
        Name("SafelyPbkdf2")

        Function("pbkdf2Sha512") { password: Uint8Array, salt: Uint8Array, iterations: Int, output: Uint8Array ->
            if (iterations <= 0 || password.byteLength == 0 || output.byteLength == 0) {
                throw Pbkdf2InvalidArgsException(
                    "iterations, password and output must be non-empty"
                )
            }
            val passwordBytes = ByteArray(password.byteLength).also { password.read(it, 0, it.size) }
            val saltBytes = ByteArray(salt.byteLength).also { salt.read(it, 0, it.size) }
            try {
                val derived = pbkdf2HmacSha512(passwordBytes, saltBytes, iterations, output.byteLength)
                output.write(derived, 0, derived.size)
                derived.fill(0)
            } finally {
                passwordBytes.fill(0)
            }
        }
    }
}

// Top-level so it can be unit-tested without the Expo runtime (the `Function`
// block above is just a thin TypedArray<->ByteArray adapter over this).
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
