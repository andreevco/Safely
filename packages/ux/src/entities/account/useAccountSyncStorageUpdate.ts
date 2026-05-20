import { useCallback } from 'react';

import type { Draft } from '@safely/slottree';
import type { SyncedStorageSchema } from '@safely/sync-storage';

import type { SyncAccount } from './account-state';
import { useActiveAccount } from './account-state';
import { useErrorToast } from '../errors';
import type { SyncedSlotKey } from './sync-storage/account-store';

export interface UseAccountSyncStorageUpdateOptions {
    showErrorToast?: boolean;
}

export function useAccountSyncStorageSlotUpdate<T extends SyncedSlotKey>(
    slot: T,
    options?: UseAccountSyncStorageUpdateOptions
) {
    const showErrorToast = options?.showErrorToast ?? true;
    const errorToast = useErrorToast({}, { fallback: 'account.sync.errors.updateFailed' });

    return useCallback(
        async (account: SyncAccount, f: (draft: Draft<SyncedStorageSchema[T]>) => void) => {
            try {
                await account.syncProvider.transaction(draft => f(draft.at(slot)));
            } catch (e) {
                if (showErrorToast) {
                    errorToast(e);
                }

                throw e;
            }
        },
        [slot, errorToast, showErrorToast]
    );
}
export function useAccountSyncStorageUpdate(options?: UseAccountSyncStorageUpdateOptions) {
    const showErrorToast = options?.showErrorToast ?? true;
    const errorToast = useErrorToast({}, { fallback: 'account.sync.errors.updateFailed' });

    return useCallback(
        async (account: SyncAccount, f: (draft: Draft<SyncedStorageSchema>) => void) => {
            try {
                await account.syncProvider.transaction(f);
            } catch (e) {
                if (showErrorToast) {
                    errorToast(e);
                }

                throw e;
            }
        },
        [errorToast, showErrorToast]
    );
}

export function useActiveAccountSyncStorageSlotUpdate<T extends SyncedSlotKey>(
    slot: T,
    options?: UseAccountSyncStorageUpdateOptions
) {
    const account = useActiveAccount();
    const update = useAccountSyncStorageSlotUpdate(slot, options);

    return useCallback(
        (f: (draft: Draft<SyncedStorageSchema[T]>) => void) => update(account, f),
        [account, update]
    );
}
export function useActiveAccountSyncStorageUpdate(options?: UseAccountSyncStorageUpdateOptions) {
    const account = useActiveAccount();
    const update = useAccountSyncStorageUpdate(options);

    return useCallback(
        (f: (draft: Draft<SyncedStorageSchema>) => void) => update(account, f),
        [account, update]
    );
}
