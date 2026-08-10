import type { AppInfo, AppState, StoreScope } from './ipc';

/**
 * The only path from the web UI to Electron, and the only module both processes may import.
 * Every member is a concrete capability, never a generic "invoke this channel" escape hatch —
 * this is the surface a compromised renderer inherits.
 */
export const BRIDGE_KEY = 'safelyDesktop';

export interface DesktopStoreBridge {
    get(scope: StoreScope, key: string): Promise<string | null>;
    set(scope: StoreScope, key: string, value: string): Promise<void>;
    remove(scope: StoreScope, key: string): Promise<void>;
    clear(scope: StoreScope): Promise<void>;
    keys(scope: StoreScope, prefix: string): Promise<string[]>;
    removeWithPrefix(scope: StoreScope, prefix: string): Promise<void>;
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

    security: {
        /** Whether this machine can prove user presence (Touch ID / Windows Hello). */
        isAvailable(): Promise<boolean>;
        /** Resolves on success and mints a short-lived ticket for the secure store. */
        check(options?: { title?: string; subtitle?: string }): Promise<void>;
    };

    store: DesktopStoreBridge;
}

declare global {
    interface Window {
        /** Injected by the preload script; absent when the UI runs outside Electron. */
        safelyDesktop?: DesktopBridge;
    }
}
