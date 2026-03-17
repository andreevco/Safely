import { useQueryClient } from '@tanstack/react-query';
import { FC, PropsWithChildren, useEffect } from 'react';

import { useActiveAccountQuery, fiatKeys, useUpdateOwnSyncedDeviceMeta } from '../../entities';
import { accountKey } from '../../entities/account/keys';
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
            preferredFiat: fiatKeys.active.toKey(),
            meta: accountKey.list.toKey(),
            devicesMeta: accountQueryKey.devices.meta.toKey()
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

export const SyncStorageProvider: FC<PropsWithChildren> = ({ children }) => {
    useSyncChangeObserver();

    return <>{children}</>;
};
