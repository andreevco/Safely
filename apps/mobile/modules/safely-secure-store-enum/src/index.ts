import { requireNativeModule } from 'expo-modules-core';

export interface SecureStoreEnumOptions {
    keychainService: string;
    requireAuthentication?: boolean;
}

interface SafelySecureStoreEnumNativeModule {
    getKeysAsync(options: SecureStoreEnumOptions): Promise<string[]>;
    getKeysWithPrefixAsync(prefix: string, options: SecureStoreEnumOptions): Promise<string[]>;
    clearAsync(options: SecureStoreEnumOptions): Promise<void>;
    removeItemsWithPrefixAsync(prefix: string, options: SecureStoreEnumOptions): Promise<void>;
}

const native = requireNativeModule<SafelySecureStoreEnumNativeModule>('SafelySecureStoreEnum');

export const SafelySecureStoreEnum = native;
