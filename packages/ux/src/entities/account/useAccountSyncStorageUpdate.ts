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

export function useAccountSyncStorageUpdate<T extends SyncedSlotKey>(
    slot: T,
    options?: UseAccountSyncStorageUpdateOptions
) {
    const showErrorToast = options?.showErrorToast ?? true;
    const errorToast = useErrorToast({}, { fallback: 'account.sync.errors.updateFailed' });

    return useCallback(
        async (
            account: SyncAccount,
            f: (
                draft: Draft<SyncedStorageSchema[T]>,
                storeDraft: Draft<SyncedStorageSchema>
            ) => void
        ) => {
            try {
                await account.syncProvider.transaction(draft => {
                    f(draft.at(slot), draft);
                });
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

export function useActiveAccountSyncStorageUpdate<T extends SyncedSlotKey>(
    slot: T,
    options?: UseAccountSyncStorageUpdateOptions
) {
    const account = useActiveAccount();
    const update = useAccountSyncStorageUpdate(slot, options);

    return useCallback(
        async (
            f: (
                draft: Draft<SyncedStorageSchema[T]>,
                storeDraft: Draft<SyncedStorageSchema>
            ) => void
        ) => update(account, f),
        [account, update]
    );
}
