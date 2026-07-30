import ExpoModulesCore
import StoreKit

public class SafelyStoreCountryModule: Module {
    public func definition() -> ModuleDefinition {
        Name("SafelyStoreCountry")

        AsyncFunction("getStoreCountryAsync") { () -> String? in
            guard let alpha3 = await Storefront.current?.countryCode else {
                return nil
            }
            return CountryCode.alpha3ToAlpha2(alpha3)
        }
    }
}
