import { contextBridge, ipcRenderer } from 'electron';

import type { DesktopBridge, DesktopStoreBridge } from '../shared/bridge';
import { BRIDGE_KEY } from '../shared/bridge';
import type { AppInfo, AppState, StoreChannels } from '../shared/ipc';
import { IPC_CHANNEL, sAppInfo, sAppState, sIsFullScreen } from '../shared/ipc';

function createStoreBridge(channels: StoreChannels): DesktopStoreBridge {
    return {
        async get(key: string): Promise<string | null> {
            const value: unknown = await ipcRenderer.invoke(channels.get, { key });

            return typeof value === 'string' ? value : null;
        },
        async set(key: string, value: string): Promise<void> {
            await ipcRenderer.invoke(channels.set, { key, value });
        },
        async remove(key: string): Promise<void> {
            await ipcRenderer.invoke(channels.remove, { key });
        },
        async clear(): Promise<void> {
            await ipcRenderer.invoke(channels.clear);
        },
        async keys(prefix: string): Promise<string[]> {
            const keys: unknown = await ipcRenderer.invoke(channels.keys, { prefix });

            return Array.isArray(keys) ? keys.filter(key => typeof key === 'string') : [];
        },
        async removeWithPrefix(prefix: string): Promise<void> {
            await ipcRenderer.invoke(channels.removePrefix, { prefix });
        }
    };
}

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

    async isFullScreen(): Promise<boolean> {
        return sIsFullScreen.parse(await ipcRenderer.invoke(IPC_CHANNEL.windowFullScreen));
    },

    onFullScreenChange(callback: (isFullScreen: boolean) => void): () => void {
        const listener = (_event: unknown, raw: unknown) => callback(sIsFullScreen.parse(raw));

        ipcRenderer.on(IPC_CHANNEL.windowFullScreen, listener);

        return () => {
            ipcRenderer.removeListener(IPC_CHANNEL.windowFullScreen, listener);
        };
    },

    async openExternalUrl(url: string): Promise<void> {
        await ipcRenderer.invoke(IPC_CHANNEL.openExternal, { url });
    },

    store: createStoreBridge(IPC_CHANNEL.store),

    encryptedStore: createStoreBridge(IPC_CHANNEL.encryptedStore)
};

contextBridge.exposeInMainWorld(BRIDGE_KEY, bridge);
