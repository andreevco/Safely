package expo.modules.safelysecurestoreenum

import android.content.Context
import android.content.SharedPreferences
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

internal class CommitException(operation: String) :
    CodedException("SharedPreferences commit failed during $operation (disk write returned false)")

// Enumerates and bulk-deletes entries written by `expo-secure-store` on Android.
// `expo-secure-store` stores everything in a single SharedPreferences file
// named "SecureStore" with keys of the form "<service>-<jsKey>" — see
// `createKeychainAwareKey` in SecureStoreModule.kt of that package. Unlike
// iOS, the service string is NOT mutated by `requireAuthentication` here, so
// the option is accepted for API parity and ignored.
//
// Subtree clears are atomic for free: `editor.commit()` flushes the whole
// batch as a single SharedPreferences write.
class SafelySecureStoreEnumModule : Module() {
    private val prefsName = "SecureStore"

    class Options : Record {
        @Field
        var keychainService: String = ""

        @Field
        var requireAuthentication: Boolean? = null
    }

    private fun prefs(): SharedPreferences =
        appContext.reactContext!!.getSharedPreferences(prefsName, Context.MODE_PRIVATE)

    private fun servicePrefix(service: String) = "$service-"

    override fun definition() = ModuleDefinition {
        Name("SafelySecureStoreEnum")

        AsyncFunction("getKeysAsync") { options: Options ->
            val sp = servicePrefix(options.keychainService)
            prefs().all.keys
                .filter { it.startsWith(sp) }
                .map { it.removePrefix(sp) }
        }

        AsyncFunction("getKeysWithPrefixAsync") { prefix: String, options: Options ->
            val sp = servicePrefix(options.keychainService)
            val full = sp + prefix
            prefs().all.keys
                .filter { it.startsWith(full) }
                .map { it.removePrefix(sp) }
        }

        AsyncFunction("clearAsync") { options: Options ->
            val sp = servicePrefix(options.keychainService)
            val p = prefs()
            val editor = p.edit()
            p.all.keys
                .filter { it.startsWith(sp) }
                .forEach { editor.remove(it) }
            if (!editor.commit()) {
                throw CommitException("clearAsync")
            }
        }

        AsyncFunction("removeItemsWithPrefixAsync") { prefix: String, options: Options ->
            val sp = servicePrefix(options.keychainService)
            val full = sp + prefix
            val p = prefs()
            val editor = p.edit()
            p.all.keys
                .filter { it.startsWith(full) }
                .forEach { editor.remove(it) }
            if (!editor.commit()) {
                throw CommitException("removeItemsWithPrefixAsync")
            }
        }
    }
}
