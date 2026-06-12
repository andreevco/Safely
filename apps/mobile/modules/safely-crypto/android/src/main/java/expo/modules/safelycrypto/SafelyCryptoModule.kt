package expo.modules.safelycrypto

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.typedarray.Uint8Array

internal class Pbkdf2InvalidArgsException(message: String) : CodedException(message)

// Bridges native crypto primitives (see *Core.kt) to JS. Each primitive is a
// pure, JDK-only function in its own *Core.kt file (unit-tested on a plain JVM
// via android/host-test); the `Function` blocks here are thin TypedArray<->
// ByteArray adapters.
//
// Sync `Function` with TypedArray args mirrors expo-crypto's `digest`: typed
// arrays share memory with the JS runtime, so they are only safe to touch on
// the JS thread.
class SafelyCryptoModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("SafelyCrypto")

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
                try {
                    output.write(derived, 0, derived.size)
                } finally {
                    derived.fill(0)
                }
            } finally {
                passwordBytes.fill(0)
            }
        }
    }
}
