import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';
import { app, ipcMain, shell } from 'electron';
import os from 'node:os';
import type { ZodType } from 'zod';

import { clearStores, getStore } from './store';
import {
    hasValidTicket,
    isUserPresenceAvailable,
    promptUserPresence,
    revokeTicket
} from './user-presence';
import type { AppInfo, StoreScope } from '../shared/ipc';
import {
    IPC_CHANNEL,
    sOpenExternalRequest,
    sSecurityCheckRequest,
    sStoreKeyRequest,
    sStorePrefixRequest,
    sStoreScopeRequest,
    sStoreSetRequest
} from '../shared/ipc';

/** Protocols main is willing to hand to the OS, regardless of what the renderer claims. */
const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['https:', 'mailto:', 'tg:']);

/**
 * Validated here rather than in the sandboxed preload: main is the authoritative side, and the
 * renderer is not a trusted caller even though it is our own code.
 */
function handle<T>(
    channel: string,
    schema: ZodType<T>,
    handler: (payload: T, event: IpcMainInvokeEvent) => unknown
): void {
    ipcMain.handle(channel, async (event, rawPayload) => {
        assertTrustedSender(event);

        return handler(schema.parse(rawPayload), event);
    });
}

function assertTrustedSender(event: IpcMainInvokeEvent): void {
    if (event.senderFrame?.parent) {
        throw new Error('IPC is only available to the top-level frame');
    }
}

/** The secret stores are readable only while a user-presence ticket is live. */
function assertSecretAccessAllowed(scope: StoreScope): void {
    if (scope !== 'secureEncrypted') {
        return;
    }

    if (!hasValidTicket()) {
        throw new Error('Secure storage requires a fresh user-presence check');
    }
}

export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
    ipcMain.handle(IPC_CHANNEL.appInfo, (event): AppInfo => {
        assertTrustedSender(event);

        return {
            version: app.getVersion(),
            environment: app.isPackaged ? 'production' : 'development',
            deviceName: os.hostname(),
            osVersion: os.release(),
            locale: app.getLocale(),
            deviceCountryCode: app.getLocaleCountryCode() || null
        };
    });

    ipcMain.handle(IPC_CHANNEL.appRelaunch, event => {
        assertTrustedSender(event);
        getWindow()?.reload();
    });

    ipcMain.handle(IPC_CHANNEL.appClearData, async event => {
        assertTrustedSender(event);
        revokeTicket();
        await clearStores();
    });

    ipcMain.handle(IPC_CHANNEL.securityAvailable, event => {
        assertTrustedSender(event);

        return isUserPresenceAvailable();
    });

    handle(IPC_CHANNEL.securityCheck, sSecurityCheckRequest, payload =>
        promptUserPresence(payload.title ?? 'unlock Safely')
    );

    handle(IPC_CHANNEL.openExternal, sOpenExternalRequest, async payload => {
        const { protocol } = new URL(payload.url);

        if (!ALLOWED_EXTERNAL_PROTOCOLS.has(protocol)) {
            throw new Error(`Refusing to open ${protocol} externally`);
        }

        await shell.openExternal(payload.url);
    });

    handle(IPC_CHANNEL.storeGet, sStoreKeyRequest, payload => {
        assertSecretAccessAllowed(payload.scope);

        return getStore(payload.scope).get(payload.key);
    });

    handle(IPC_CHANNEL.storeSet, sStoreSetRequest, payload => {
        assertSecretAccessAllowed(payload.scope);

        return getStore(payload.scope).set(payload.key, payload.value);
    });

    handle(IPC_CHANNEL.storeRemove, sStoreKeyRequest, payload => {
        assertSecretAccessAllowed(payload.scope);

        return getStore(payload.scope).remove(payload.key);
    });

    handle(IPC_CHANNEL.storeClear, sStoreScopeRequest, payload => {
        assertSecretAccessAllowed(payload.scope);

        return getStore(payload.scope).clear();
    });

    handle(IPC_CHANNEL.storeKeys, sStorePrefixRequest, payload => {
        assertSecretAccessAllowed(payload.scope);

        return getStore(payload.scope).keys(payload.prefix);
    });

    handle(IPC_CHANNEL.storeRemovePrefix, sStorePrefixRequest, payload => {
        assertSecretAccessAllowed(payload.scope);

        return getStore(payload.scope).removeWithPrefix(payload.prefix);
    });
}
