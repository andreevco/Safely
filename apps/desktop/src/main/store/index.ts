import { app, safeStorage } from 'electron';
import path from 'node:path';

import { JsonStore, plainCodec, type ValueCodec } from './json-store';
import type { StoreScope } from '../../shared/ipc';

/**
 * Sealed with the OS keychain (Keychain on macOS, DPAPI on Windows). If the platform cannot
 * encrypt, the store throws rather than silently writing secrets as plaintext.
 */
const safeStorageCodec: ValueCodec = {
    encode: value => {
        assertEncryptionAvailable();

        return safeStorage.encryptString(value).toString('base64');
    },
    decode: stored => {
        assertEncryptionAvailable();

        return safeStorage.decryptString(Buffer.from(stored, 'base64'));
    }
};

function assertEncryptionAvailable(): void {
    if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('OS-backed encryption is unavailable, refusing to touch secret storage');
    }
}

let stores: Record<StoreScope, JsonStore> | null = null;

/** Created after the app is ready: the paths depend on `userData`. */
export function createStores(): Record<StoreScope, JsonStore> {
    const dir = path.join(app.getPath('userData'), 'store');

    stores = {
        regular: new JsonStore(path.join(dir, 'regular.json'), plainCodec),
        encrypted: new JsonStore(path.join(dir, 'encrypted.json'), safeStorageCodec),
        secureEncrypted: new JsonStore(path.join(dir, 'secure-encrypted.json'), safeStorageCodec)
    };

    return stores;
}

export function getStore(scope: StoreScope): JsonStore {
    if (!stores) {
        throw new Error('Stores are not initialised yet');
    }

    return stores[scope];
}

/* No flush counterpart on purpose: every write is already on disk before it resolves. */
export async function clearStores(): Promise<void> {
    if (!stores) {
        return;
    }

    await Promise.all(Object.values(stores).map(store => store.clear()));
}

export { JsonStore } from './json-store';
