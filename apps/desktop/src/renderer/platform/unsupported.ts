import type { IEnumerableStorage, ILedgerSessionPort, QrScanner } from '@safely/core';
import type { LedgerTransport } from '@safely/ux';

import type { DesktopSecurityGate } from './types';

/* Capabilities this app does not have yet. They fail loudly rather than being absent, and they live
   here rather than in `@safely/web-ui` because what is missing is a property of the target: the
   extension will lack a different set and must not inherit ours. */

/* TODO(qr): camera plus BarcodeDetector, and an image-file fallback. Not needed to join an
   account from this device — the joining device only *shows* the connection string. */
export const unsupportedQrScanner: QrScanner = {
    scan() {
        return Promise.reject(new Error('QR scanning is not available on the desktop app yet'));
    }
};

/* TODO(ledger): WebHID in the renderer, plus setDevicePermissionHandler in main. */
export const unsupportedLedgerTransport: LedgerTransport = {
    createKit() {
        throw new Error('Ledger is not available on the desktop app yet');
    },
    transportIdentifier: 'unsupported'
};

export const unsupportedLedgerSessionPort: ILedgerSessionPort = {
    withSession() {
        return Promise.reject(new Error('Ledger is not available on the desktop app yet'));
    }
};

/* TODO(vault): the secret store was removed to be rebuilt from scratch — `doc/vault.md`. Every
   operation rejects, so an attempt to onboard fails at the first write instead of quietly persisting
   keys somewhere unprotected. */
function secretStorageUnavailable(): Promise<never> {
    return Promise.reject(new Error('Secret storage is not available on the desktop app yet'));
}

export const unsupportedSecureEncryptedStorage: IEnumerableStorage = {
    getItem: secretStorageUnavailable,
    setItem: secretStorageUnavailable,
    removeItem: secretStorageUnavailable,
    clear: secretStorageUnavailable,
    getAllKeys: secretStorageUnavailable,
    getKeysWithPrefix: secretStorageUnavailable,
    removeItemsWithPrefix: secretStorageUnavailable
};

/* `isAvailable: false` is the honest answer while there is no gate: the UI can ask before offering a
   flow that needs one, instead of discovering it from a rejected promise. */
export const unsupportedSecurityGate: DesktopSecurityGate = {
    isAvailable: false,
    check() {
        return Promise.reject(new Error('User presence cannot be proven on the desktop app yet'));
    }
};
