import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';
import { app, ipcMain, shell } from 'electron';
import os from 'node:os';
import type { ZodType } from 'zod';

import type { StoreScope } from './store';
import { clearStores, getStore } from './store';
import type { AppInfo, StoreChannels } from '../shared/ipc';
import {
    IPC_CHANNEL,
    sOpenExternalRequest,
    sStoreKeyRequest,
    sStorePrefixRequest,
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
        await clearStores();
    });

    handle(IPC_CHANNEL.openExternal, sOpenExternalRequest, async payload => {
        const { protocol } = new URL(payload.url);

        if (!ALLOWED_EXTERNAL_PROTOCOLS.has(protocol)) {
            throw new Error(`Refusing to open ${protocol} externally`);
        }

        await shell.openExternal(payload.url);
    });

    registerStoreHandlers(IPC_CHANNEL.store, 'regular');
    registerStoreHandlers(IPC_CHANNEL.encryptedStore, 'encrypted');
    registerStoreHandlers(IPC_CHANNEL.secureEncryptedStore, 'secureEncrypted');
}

/* The stores are resolved per call, not captured: `createStores()` runs after the app is ready. */
function registerStoreHandlers(channels: StoreChannels, scope: StoreScope): void {
    handle(channels.get, sStoreKeyRequest, payload => getStore(scope).get(payload.key));

    handle(channels.set, sStoreSetRequest, payload =>
        getStore(scope).set(payload.key, payload.value)
    );

    handle(channels.remove, sStoreKeyRequest, payload => getStore(scope).remove(payload.key));

    ipcMain.handle(channels.clear, event => {
        assertTrustedSender(event);

        return getStore(scope).clear();
    });

    handle(channels.keys, sStorePrefixRequest, payload => getStore(scope).keys(payload.prefix));

    handle(channels.removePrefix, sStorePrefixRequest, payload =>
        getStore(scope).removeWithPrefix(payload.prefix)
    );
}
