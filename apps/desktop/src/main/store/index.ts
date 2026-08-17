import { app } from 'electron';
import path from 'node:path';

import { JsonStore, plainCodec, type ValueCodec } from './json-store';
import type { HardwareKey } from '../plugins/hardware-key';
import { loadSecureEnclave } from '../plugins/hardware-key';
import type { VaultSelfTestReport } from '../vault';
import { selfTestVault, Vault, VaultError } from '../vault';

/** Main-side only: the IPC contract addresses a store by channel, not by a name on the wire. */
export type StoreScope = 'regular' | 'encrypted';

/**
 * Tied to the bundle id: the Secure Enclave key is reachable only through this app's keychain
 * access group, so changing either the tag or the bundle id abandons the existing vault.
 */
const VAULT_KEY_TAG = 'com.safely.wallet-desktop.vault';

let stores: Record<StoreScope, JsonStore> | null = null;
let vault: Vault | null = null;

/** Created after the app is ready: the paths depend on `userData`. */
export async function createStores(): Promise<void> {
    const dir = path.join(app.getPath('userData'), 'store');

    vault = new Vault(hardwareKey(), path.join(dir, 'vault.json'), VAULT_KEY_TAG);

    await vault.init();

    stores = {
        regular: new JsonStore(path.join(dir, 'regular.json'), plainCodec),
        encrypted: new JsonStore(path.join(dir, 'encrypted.json'), vaultCodec(vault, 'encrypted'))
    };
}

/** Diagnostic: the same hardware the vault would use, exercised on a throwaway key. */
export async function runVaultSelfTest(): Promise<VaultSelfTestReport> {
    const dir = path.join(app.getPath('userData'), 'store');

    return selfTestVault(
        hardwareKey(),
        path.join(dir, 'vault-self-test.json'),
        `${VAULT_KEY_TAG}.self-test`
    );
}

export function getStore(scope: StoreScope): JsonStore {
    if (!stores) {
        throw new Error('Stores are not initialised yet');
    }

    return stores[scope];
}

/* No flush counterpart on purpose: every write is already on disk before it resolves. */
export async function clearStores(): Promise<void> {
    if (!stores || !vault) {
        return;
    }

    await Promise.all(Object.values(stores).map(store => store.clear()));

    await vault.erase();
    await vault.init();
}

function vaultCodec(instance: Vault, scope: StoreScope): ValueCodec {
    return {
        encode: (key, value) => instance.encode(scope, key, value),
        decode: (key, stored) => instance.decode(scope, key, stored)
    };
}

function hardwareKey(): HardwareKey {
    const key = loadSecureEnclave();

    if (!key?.isAvailable()) {
        throw new VaultError('VAULT_UNAVAILABLE');
    }

    return key;
}

export { JsonStore } from './json-store';
