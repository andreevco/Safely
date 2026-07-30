package expo.modules.safelystorecountry

import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingConfigResponseListener
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.GetBillingConfigParams
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.PurchasesUpdatedListener
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.atomic.AtomicBoolean

private const val RESOLVE_TIMEOUT_MS = 5_000L

class SafelyStoreCountryModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("SafelyStoreCountry")

        AsyncFunction("getStoreCountryAsync") { promise: Promise ->
            val context = appContext.reactContext
            if (context == null) {
                promise.resolve(null)
                return@AsyncFunction
            }

            val settled = AtomicBoolean(false)
            val timeoutHandler = Handler(Looper.getMainLooper())
            val client = BillingClient.newBuilder(context)
                .setListener(PurchasesUpdatedListener { _, _ -> })
                .enablePendingPurchases(
                    PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
                )
                .build()

            fun finish(code: String?) {
                if (settled.compareAndSet(false, true)) {
                    timeoutHandler.removeCallbacksAndMessages(null)
                    promise.resolve(code)
                    try {
                        client.endConnection()
                    } catch (_: Exception) {
                    }
                }
            }

            timeoutHandler.postDelayed({ finish(null) }, RESOLVE_TIMEOUT_MS)

            client.startConnection(object : BillingClientStateListener {
                override fun onBillingSetupFinished(result: BillingResult) {
                    if (result.responseCode != BillingClient.BillingResponseCode.OK) {
                        finish(null)
                        return
                    }
                    client.getBillingConfigAsync(
                        GetBillingConfigParams.newBuilder().build(),
                        BillingConfigResponseListener { billingResult, config ->
                            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                                finish(config?.countryCode)
                            } else {
                                finish(null)
                            }
                        }
                    )
                }

                override fun onBillingServiceDisconnected() {
                    finish(null)
                }
            })
        }
    }
}
