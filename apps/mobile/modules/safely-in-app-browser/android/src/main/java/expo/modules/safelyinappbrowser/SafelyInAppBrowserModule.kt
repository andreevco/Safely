package expo.modules.safelyinappbrowser

import android.app.Activity
import android.graphics.Color
import android.net.Uri
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsIntent
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class SafelyInAppBrowserModule : Module() {

    class OpenBrowserOptions : Record {
        @Field
        var toolbarColor: String? = null

        @Field
        var controlTintColor: String? = null

        @Field
        var dismissButtonStyle: String? = null
    }

    override fun definition() = ModuleDefinition {
        Name("SafelyInAppBrowser")

        Function("isAvailable") {
            val context = appContext.reactContext ?: return@Function false
            CustomTabsClient.getPackageName(context, null) != null
        }

        AsyncFunction("openBrowser") { url: String, options: OpenBrowserOptions, promise: Promise ->
            val activity: Activity? = appContext.currentActivity
            if (activity == null) {
                promise.reject(CodedException("No current activity to launch the in-app browser from"))
                return@AsyncFunction
            }

            activity.runOnUiThread {
                try {
                    val builder = CustomTabsIntent.Builder()
                        .setShowTitle(false)
                        .setUrlBarHidingEnabled(true)

                    parseColorOrNull(options.toolbarColor)?.let { color ->
                        builder.setDefaultColorSchemeParams(
                            CustomTabColorSchemeParams.Builder()
                                .setToolbarColor(color)
                                .build()
                        )
                    }

                    builder.build().launchUrl(activity, Uri.parse(url))
                    promise.resolve(mapOf("type" to "dismiss"))
                } catch (e: Exception) {
                    promise.reject(CodedException("Failed to open in-app browser: ${e.message}"))
                }
            }
        }
    }

    private fun parseColorOrNull(value: String?): Int? {
        val s = value?.trim() ?: return null
        if (s.isEmpty()) return null
        return try {
            Color.parseColor(if (s.startsWith("#")) s else "#$s")
        } catch (e: IllegalArgumentException) {
            null
        }
    }
}
