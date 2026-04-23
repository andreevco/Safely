import { useQueryClient } from '@tanstack/react-query';
import { FC, PropsWithChildren, useEffect } from 'react';

import { useActiveAccountQuery, useUpdateOwnSyncedDeviceMeta } from '../../entities';
import { accountKey } from '../../entities/account/keys';
import { useAppState } from '../app/useAppState';
import { SyncedStorageStructure, syncedStorageStructure } from '../storage';

const syncedStorageKeys = Object.keys(syncedStorageStructure) as (keyof SyncedStorageStructure)[];

function useSyncChangeObserver() {
    const client = useQueryClient();
    const { data: activeAccount } = useActiveAccountQuery();
    const { mutateAsync: updateOwnSyncedDeviceMeta } = useUpdateOwnSyncedDeviceMeta();

    useEffect(() => {
        if (!activeAccount) return;

        const syncProvider = activeAccount.syncProvider;
        const accountQueryKey = accountKey.accountId(activeAccount.accountId);

        const queryKeysToInvalidate: Record<keyof SyncedStorageStructure, readonly unknown[]> = {
            portfolios: accountQueryKey.portfolios.toKey(),
            preferredFiat: accountQueryKey.preferredFiat.toKey(),
            meta: accountKey.list.toKey(),
            devicesMeta: accountQueryKey.devices.meta.toKey(),
            contacts: accountQueryKey.contacts.toKey()
        };

        const unsubscribes = syncedStorageKeys.map(field =>
            syncProvider.onChange(field, async () => {
                if (field !== 'devicesMeta') {
                    await updateOwnSyncedDeviceMeta(activeAccount);
                }

                void client.invalidateQueries({ queryKey: queryKeysToInvalidate[field] });
            })
        );

        return () => {
            unsubscribes.forEach(fn => fn());
        };
    }, [activeAccount, client, updateOwnSyncedDeviceMeta]);
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
    useSyncChangeObserver();
    useSyncRestartOnForeground();

    return <>{children}</>;
};
