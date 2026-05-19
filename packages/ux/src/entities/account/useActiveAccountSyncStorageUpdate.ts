import { useCallback } from 'react';

import type { Draft } from '@safely/slottree';
import type { SyncedStorageSchema } from '@safely/sync-storage';

import { useActiveAccount } from './account-state';
import type { SyncedSlotKey } from './sync-storage/account-store';
import { accountStore, accountStoreActions } from './sync-storage/account-store';
import { SecretEncryptor, useAppContext } from '../../shared';
import { AccountStoreTransform } from './sync-storage/account-store-transform';

export function useActiveAccountSyncStorageUpdate<T extends SyncedSlotKey>(slot: T) {
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
            const prevStoreData = accountStore.getState().accountsData.get(account.accountId);

            try {
                await account.syncProvider.transaction(draft => {
                    f(draft.at(slot), draft);

                    const currentStoreData = accountStore
                        .getState()
                        .accountsData.get(account.accountId);
                    if (currentStoreData) {
                        const optimistic = draft.get()![slot] as SyncedStorageSchema[T];
                        accountStoreActions.setSlot(
                            account.accountId,
                            slot,
                            transformer.restore(slot, optimistic, currentStoreData)
                        );
                    }
                });
            } catch (e) {
                const currentStoreData = accountStore
                    .getState()
                    .accountsData.get(account.accountId);
                if (currentStoreData && prevStoreData) {
                    accountStoreActions.setSlot(account.accountId, slot, prevStoreData[slot]);
                }

                throw e;
            }
        },
        [account.accountId, account.secretEncryptor, slot, getSecureEncrypted]
    );
}
