import type { Build, IEnumerableStorage, ISyncKeyValueStorage } from '@safely/core';
import type { AppStateStatus, LedgerTransport, Security } from '@safely/ux';

import type { AppInfo } from '../../shared/app-info';

/**
 * What the renderer supplies to the shared UI — the app's own contract, not one `@safely/web-ui`
 * dictates: an extension differs in storage, in user presence and in how it opens links, and would
 * describe itself with its own shape.
 */
export interface DesktopPlatformStorage {
    REGULAR_DESKTOP_STORAGE_ONLY_APP_LEVEL_USE: IEnumerableStorage;

    ENCRYPTED_DESKTOP_STORAGE_ONLY_APP_LEVEL_USE: IEnumerableStorage;

    SECURE_ENCRYPTED_DESKTOP_STORAGE_ONLY_APP_LEVEL_USE: IEnumerableStorage;

    synchronous: ISyncKeyValueStorage;
}

export interface DesktopPlatform {
    readonly appInfo: AppInfo & { build: Build };

    readonly storage: DesktopPlatformStorage;

    readonly security: Security;

    openExternalUrl(url: string): Promise<void>;

    reloadApp(): void;

    clearAllData(): Promise<void>;

    subscribeAppStateChange(callback: (status: AppStateStatus) => void): () => void;

    /** Absent until a Ledger transport lands (WebHID). */
    readonly ledgerTransport?: LedgerTransport;
}
