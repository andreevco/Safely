import type { Build, IEnumerableStorage, ISyncKeyValueStorage } from '@safely/core';
import type { AppStateStatus, LedgerTransport } from '@safely/ux';

/**
 * What a web target must provide for the shared UI to run — the web-side counterpart of the
 * DI interfaces in `@safely/core`. It covers only what differs between Electron and an
 * extension; anything a browser can do on its own (clipboard, WebCrypto, QR rendering) stays out.
 */
export type WebPlatformTarget = 'desktop' | 'extension';

export interface WebAppInfo {
    version: string;

    /** Reported to the config API and to analytics. */
    build: Build;

    environment: 'production' | 'development';

    /** Shown in the synced device list, so it should be recognisable to the user. */
    deviceName: string;

    osVersion: string;

    /** BCP-47 tag driving number formatting and the initial language. */
    locale: string;

    /** ISO-3166 region reported by the OS, or `null` when unknown. */
    deviceCountryCode: string | null;
}

export interface WebSecurityGate {
    /** When the platform cannot prove user presence, `check` rejects and the secure storage stays closed. */
    readonly isAvailable: boolean;

    check(options?: { title?: string; subtitle?: string }): Promise<void>;
}

export interface WebPlatformStorage {
    /** Non-secret state: CRDT snapshots, query cache. */
    regular: IEnumerableStorage;

    /** Encrypted at rest, readable without a user-presence check. */
    encrypted: IEnumerableStorage;

    /** Encrypted at rest *and* gated by `security.check()`. A fresh handle per call: the
     *  unlocked state is per instance (see `UnlockableSecuredEncryptedStorage`). */
    createSecureEncrypted(): IEnumerableStorage;

    /** Read before React mounts (language, dev flags), so it cannot be asynchronous. */
    synchronous: ISyncKeyValueStorage;
}

export interface WebPlatform {
    readonly target: WebPlatformTarget;

    readonly appInfo: WebAppInfo;

    readonly storage: WebPlatformStorage;

    readonly security: WebSecurityGate;

    /** Re-validated by the platform: the renderer is not a trusted caller. */
    openExternalUrl(url: string): Promise<void>;

    reloadApp(): void;

    /** Wipes every storage this platform owns; the caller reloads afterwards. */
    clearAllData(): Promise<void>;

    subscribeAppStateChange(callback: (status: AppStateStatus) => void): () => void;

    /** Absent until the platform implements a Ledger transport (WebHID / node-hid). */
    readonly ledgerTransport?: LedgerTransport;
}
