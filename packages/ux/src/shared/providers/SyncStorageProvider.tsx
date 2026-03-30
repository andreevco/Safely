import { useQueryClient } from '@tanstack/react-query';
import { FC, PropsWithChildren, useEffect, useRef } from 'react';

import { useActiveAccountQuery, fiatKeys, useUpdateOwnSyncedDeviceMeta } from '../../entities';
import { accountKey } from '../../entities/account/keys';
import { SyncedStorageStructure, syncedStorageStructure } from '../storage';
import { AppStateStatus, useAppContext } from './AppContext';

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

function useSyncRestartOnForeground() {
    const { data: activeAccount } = useActiveAccountQuery();
    const { subscribeAppStateChange } = useAppContext();
    const appStateRef = useRef<AppStateStatus>('active');

    useEffect(() => {
        if (!activeAccount) return;

        return subscribeAppStateChange(nextStatus => {
            if (
                appStateRef.current === 'inactive' ||
                (appStateRef.current === 'background' && nextStatus === 'active')
            ) {
                activeAccount.syncProvider.restart();
            }

            appStateRef.current = nextStatus;
        });
    }, [activeAccount, subscribeAppStateChange]);
}

export const SyncStorageProvider: FC<PropsWithChildren> = ({ children }) => {
    useSyncChangeObserver();
    useSyncRestartOnForeground();

    return <>{children}</>;
};
