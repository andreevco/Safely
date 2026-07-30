import { requireNativeModule } from 'expo-modules-core';

interface SafelyStoreCountryNativeModule {
    getStoreCountryAsync(): Promise<string | null | undefined>;
}

const native = requireNativeModule<SafelyStoreCountryNativeModule>('SafelyStoreCountry');

export function getStoreCountryAsync(): Promise<string | null> {
    return native.getStoreCountryAsync().then(code => code?.toUpperCase() ?? null);
}
