import type { AppInfo, AppState } from './ipc';

/**
 * The only path from the web UI to Electron, and the only module both processes may import.
 * Every member is a concrete capability, never a generic "invoke this channel" escape hatch —
 * this is the surface a compromised renderer inherits.
 */
export const BRIDGE_KEY = 'safelyDesktop';

/** One handle per backing store; which store it is comes from the channels it was built with. */
export interface DesktopStoreBridge {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(prefix: string): Promise<string[]>;
    removeWithPrefix(prefix: string): Promise<void>;
}

export interface DesktopBridge {
    platform: string;

    versions: {
        electron: string;
        chrome: string;
    };

    getAppInfo(): Promise<AppInfo>;

    relaunch(): void;

    clearAllData(): Promise<void>;

    onAppStateChange(callback: (state: AppState) => void): () => void;

    openExternalUrl(url: string): Promise<void>;

    /* No `security` member: the Touch ID gate was removed with the secret store. The vault
       (`doc/vault.md`) adds unlock/lock capabilities here, not a bare "prove presence" call. */

    store: DesktopStoreBridge;

    encryptedStore: DesktopStoreBridge;
}

declare global {
    interface Window {
        /** Injected by the preload script; absent when the UI runs outside Electron. */
        safelyDesktop?: DesktopBridge;
    }
}
