import { useCallback } from 'react';

import type { Draft } from '@safely/slottree';
import type { SyncedStorageSchema } from '@safely/sync-storage';

import { useActiveAccount } from './account-state';
import type { SyncedSlotKey } from './sync-storage/account-store';
import { accountStore } from './sync-storage/account-store';
import { accountStoreActions } from './sync-storage/account-store';
import { AccountStoreTransform } from './sync-storage/account-store-transform';
import { SecretEncryptor, useAppContext } from '../../shared';

export function useAccountSyncStorageUpdate<T extends SyncedSlotKey>(slot: T) {
    const account = useActiveAccount();
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();

    return useCallback(
        async (
            f: (
                draft: Draft<SyncedStorageSchema[T]>,
                storeDraft: Draft<SyncedStorageSchema>
            ) => void
        ) => {
            const transformer = new AccountStoreTransform(
                () => new SecretEncryptor(account.secretEncryptor, getSecureEncrypted())
            );
            const prevStoreData = accountStore.getState().active;

            try {
                await account.syncProvider.transaction(draft => {
                    f(draft.at(slot), draft);

                    const currentStoreData = accountStore.getState().active;
                    if (currentStoreData && currentStoreData.accountId === account.accountId) {
                        const optimistic = draft.get()![slot] as SyncedStorageSchema[T];
                        accountStoreActions.setSlot(
                            slot,
                            transformer.restore(slot, optimistic, currentStoreData)
                        );
                    }
                });
            } catch (e) {
                const currentStoreData = accountStore.getState().active;
                if (
                    currentStoreData &&
                    prevStoreData &&
                    currentStoreData.accountId === account.accountId
                ) {
                    accountStoreActions.setSlot(slot, prevStoreData[slot]);
                }

                throw e;
            }
        },
        [account.accountId, account.secretEncryptor, slot, getSecureEncrypted]
    );
}
