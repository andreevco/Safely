import type { ILedgerSessionPort } from '@safely/core';
import type { LedgerTransport } from '@safely/ux';

/* Capabilities this app does not have yet. They fail loudly rather than being absent, and they live
   here rather than in `@safely/web-ui` because what is missing is a property of the target: the
   extension will lack a different set and must not inherit ours. */

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
