import type { ILedgerSessionPort, QrScanner } from '@safely/core';
import type { LedgerTransport } from '@safely/ux';

/* Capabilities the web targets lack for now. They fail loudly rather than being absent. */

/* TODO(qr): camera plus BarcodeDetector, and an image-file fallback. Not needed to join an
   account from this device — the joining device only *shows* the connection string. */
export const unsupportedQrScanner: QrScanner = {
    scan() {
        return Promise.reject(new Error('QR scanning is not available on this platform yet'));
    }
};

/* TODO(ledger): WebHID in the renderer (plus setDevicePermissionHandler in main) or node-hid
   behind the platform bridge. */
export const unsupportedLedgerTransport: LedgerTransport = {
    createKit() {
        throw new Error('Ledger is not available on this platform yet');
    },
    transportIdentifier: 'unsupported'
};

export const unsupportedLedgerSessionPort: ILedgerSessionPort = {
    withSession() {
        return Promise.reject(new Error('Ledger is not available on this platform yet'));
    }
};
