import type { FC, PropsWithChildren } from 'react';
import { useEffect } from 'react';

import { SecretEncryptor, useAppContext } from '../../../shared';
import { useAppState } from '../../../shared/app/useAppState';
import { useActiveAccountQuery } from '../account-state';
import { accountStore, accountStoreActions, SYNCED_SLOT_KEYS } from './account-store';
import { AccountStoreTransform } from './account-store-transform';

function useSyncObserver() {
    const { storage } = useAppContext();
    const { data: activeAccount } = useActiveAccountQuery();

    useEffect(() => {
        if (!activeAccount) {
            accountStoreActions.clear();
            return;
        }

        const transform = new AccountStoreTransform(
            () =>
                new SecretEncryptor(
                    activeAccount.secretEncryptor,
                    storage.sync.getSecureEncrypted()
                )
        );

        accountStoreActions.attachSnapshot(
            transform.restoreAll(activeAccount.accountId, activeAccount.syncProvider.getAll())
        );

        const unsubscribes = SYNCED_SLOT_KEYS.map(key =>
            activeAccount.syncProvider.onChange(key, () => {
                const slotJson = activeAccount.syncProvider.get(key);
                const prev = accountStore.getState().active;
                const next = transform.restore(key, slotJson, prev);
                accountStoreActions.setSlot(key, next);
            })
        );

        return () => {
            unsubscribes.forEach(fn => fn());
        };
    }, [activeAccount, storage.sync]);
}

function useSyncRestartOnForeground() {
    const { data: activeAccount } = useActiveAccountQuery();
    const { current, previous } = useAppState();

    useEffect(() => {
        if (!activeAccount) return;

        if (previous === 'inactive' || (previous === 'background' && current === 'active')) {
            activeAccount.syncProvider.restart();
        }
    }, [activeAccount, current, previous]);
}

export const SyncStorageProvider: FC<PropsWithChildren> = ({ children }) => {
    useSyncObserver();
    useSyncRestartOnForeground();

    return <>{children}</>;
};
