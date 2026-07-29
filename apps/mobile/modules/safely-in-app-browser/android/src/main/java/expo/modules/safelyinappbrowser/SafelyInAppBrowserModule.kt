package expo.modules.safelyinappbrowser

import android.app.Activity
import android.app.Application
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
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

    private var pendingPromise: Promise? = null
    private var lifecycleObserver: Application.ActivityLifecycleCallbacks? = null
    private var observedApplication: Application? = null

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
                if (pendingPromise != null) {
                    promise.reject(CodedException("An in-app browser session is already active"))
                    return@runOnUiThread
                }

                val uri = Uri.parse(url)
                val scheme = uri.scheme?.lowercase()
                if (scheme != "http" && scheme != "https") {
                    promise.reject(CodedException("openBrowser requires an http(s) URL"))
                    return@runOnUiThread
                }

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

                    pendingPromise = promise
                    startObservingDismissal(activity)
                    builder.build().launchUrl(activity, uri)
                } catch (e: Exception) {
                    pendingPromise = null
                    stopObservingDismissal()
                    promise.reject(CodedException("Failed to open in-app browser: ${e.message}"))
                }
            }
        }

        OnDestroy {
            // The JS context is tearing down (e.g. a reload). Drop the observer and any
            // dangling promise so we don't leak the Application lifecycle callback. OnDestroy
            // is not guaranteed to run on the main thread, so marshal onto it: every read and
            // write of the session state happens on the main thread, which keeps it a
            // single-threaded state machine (mirroring the iOS module on DispatchQueue.main).
            Handler(Looper.getMainLooper()).post {
                pendingPromise = null
                stopObservingDismissal()
            }
        }
    }

    // A Custom Tab is rendered by the browser in its own process, so once it is on screen all
    // of this app's activities are stopped, and closing it brings our activity back to the
    // foreground. We mirror the iOS module (which resolves on SFSafariViewController dismissal)
    // by resolving only once our task returns to the foreground after having been backgrounded.
    private fun startObservingDismissal(activity: Activity) {
        val application = activity.application
        val observer = object : Application.ActivityLifecycleCallbacks {
            private var wentToBackground = false

            override fun onActivityStopped(activity: Activity) {
                wentToBackground = true
            }

            override fun onActivityResumed(activity: Activity) {
                if (wentToBackground) {
                    resolveDismissed()
                }
            }

            override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
            override fun onActivityStarted(activity: Activity) {}
            override fun onActivityPaused(activity: Activity) {}
            override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
            override fun onActivityDestroyed(activity: Activity) {}
        }

        lifecycleObserver = observer
        observedApplication = application
        application.registerActivityLifecycleCallbacks(observer)
    }

    private fun stopObservingDismissal() {
        val observer = lifecycleObserver ?: return
        observedApplication?.unregisterActivityLifecycleCallbacks(observer)
        lifecycleObserver = null
        observedApplication = null
    }

    private fun resolveDismissed() {
        val promise = pendingPromise ?: return
        pendingPromise = null
        stopObservingDismissal()
        promise.resolve(mapOf("type" to "dismiss"))
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
