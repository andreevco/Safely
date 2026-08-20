import type { Build, IEnumerableStorage, ISyncKeyValueStorage } from '@safely/core';
import type { AppStateStatus, LedgerTransport } from '@safely/ux';

import type { AppInfo } from '../../shared/ipc';

/**
 * What the renderer supplies to the shared UI — the app's own contract, not one `@safely/web-ui`
 * dictates: an extension differs in storage, in user presence and in how it opens links, and would
 * describe itself with its own shape.
 */
export interface DesktopSecurityGate {
    /** With no way to prove user presence, `check` rejects and the secret storage stays closed. */
    readonly isAvailable: boolean;

    check(options?: { title?: string; subtitle?: string }): Promise<void>;
}

export interface DesktopPlatformStorage {
    /** Non-secret state: CRDT snapshots, query cache. */
    regular: IEnumerableStorage;

    /** Encrypted at rest, readable without a user-presence check. */
    encrypted: IEnumerableStorage;

    /** Key material. A fresh handle per call: the unlocked state is per instance (see
     *  `UnlockableSecuredEncryptedStorage`). */
    createSecureEncrypted(): IEnumerableStorage;

    /** Read before React mounts (language, dev flags), so it cannot be asynchronous. */
    synchronous: ISyncKeyValueStorage;
}

export interface DesktopPlatform {
    /** `build` is what the config API and analytics report; the rest comes from main. */
    readonly appInfo: AppInfo & { build: Build };

    readonly storage: DesktopPlatformStorage;

    readonly security: DesktopSecurityGate;

    openExternalUrl(url: string): Promise<void>;

    reloadApp(): void;

    clearAllData(): Promise<void>;

    subscribeAppStateChange(callback: (status: AppStateStatus) => void): () => void;

    /** Absent until a Ledger transport lands (WebHID). */
    readonly ledgerTransport?: LedgerTransport;
}
