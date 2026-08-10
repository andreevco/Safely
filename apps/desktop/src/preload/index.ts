import { contextBridge, ipcRenderer } from 'electron';

import type { DesktopBridge } from '../shared/bridge';
import { BRIDGE_KEY } from '../shared/bridge';
import type { AppInfo, AppState, StoreScope } from '../shared/ipc';
import { IPC_CHANNEL, sAppInfo, sAppState } from '../shared/ipc';

/**
 * Transport only. Requests are validated in main; responses are parsed here so a malformed
 * reply cannot slip into the UI as a typed value.
 */
const bridge: DesktopBridge = {
    platform: process.platform,
    versions: {
        electron: process.versions.electron,
        chrome: process.versions.chrome
    },

    async getAppInfo(): Promise<AppInfo> {
        return sAppInfo.parse(await ipcRenderer.invoke(IPC_CHANNEL.appInfo));
    },

    relaunch(): void {
        void ipcRenderer.invoke(IPC_CHANNEL.appRelaunch);
    },

    async clearAllData(): Promise<void> {
        await ipcRenderer.invoke(IPC_CHANNEL.appClearData);
    },

    onAppStateChange(callback: (state: AppState) => void): () => void {
        const listener = (_event: unknown, raw: unknown) => callback(sAppState.parse(raw));

        ipcRenderer.on(IPC_CHANNEL.appState, listener);

        return () => {
            ipcRenderer.removeListener(IPC_CHANNEL.appState, listener);
        };
    },

    async openExternalUrl(url: string): Promise<void> {
        await ipcRenderer.invoke(IPC_CHANNEL.openExternal, { url });
    },

    security: {
        async isAvailable(): Promise<boolean> {
            return Boolean(await ipcRenderer.invoke(IPC_CHANNEL.securityAvailable));
        },
        async check(options): Promise<void> {
            await ipcRenderer.invoke(IPC_CHANNEL.securityCheck, options ?? {});
        }
    },

    store: {
        async get(scope: StoreScope, key: string): Promise<string | null> {
            const value: unknown = await ipcRenderer.invoke(IPC_CHANNEL.storeGet, { scope, key });

            return typeof value === 'string' ? value : null;
        },
        async set(scope: StoreScope, key: string, value: string): Promise<void> {
            await ipcRenderer.invoke(IPC_CHANNEL.storeSet, { scope, key, value });
        },
        async remove(scope: StoreScope, key: string): Promise<void> {
            await ipcRenderer.invoke(IPC_CHANNEL.storeRemove, { scope, key });
        },
        async clear(scope: StoreScope): Promise<void> {
            await ipcRenderer.invoke(IPC_CHANNEL.storeClear, { scope });
        },
        async keys(scope: StoreScope, prefix: string): Promise<string[]> {
            const keys: unknown = await ipcRenderer.invoke(IPC_CHANNEL.storeKeys, {
                scope,
                prefix
            });

            return Array.isArray(keys) ? keys.filter(key => typeof key === 'string') : [];
        },
        async removeWithPrefix(scope: StoreScope, prefix: string): Promise<void> {
            await ipcRenderer.invoke(IPC_CHANNEL.storeRemovePrefix, { scope, prefix });
        }
    }
};

contextBridge.exposeInMainWorld(BRIDGE_KEY, bridge);
