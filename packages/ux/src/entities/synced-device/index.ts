import { useMutation, useQueryClient } from '@tanstack/react-query';

import { PortfolioFactory } from '@safely/core';

import {
    type DeviceMeta,
    useAppContext,
    useSuspenseQuery,
    useActiveAccountSyncedStorage
} from '../../shared';
import { calcSyncedStorageHash } from '../../shared/storage/account/synced/schemas';
import { calculatePortfoliosHashes } from '../../shared/storage/account/synced/schemas/devices-meta.schema';
import { SyncAccount, useActiveAccount, useActiveAccountQueryKey } from '../account';
import { accountKey } from '../account/keys';

export function useSyncedDevicesMetaQuery() {
    const accountQueryKey = useActiveAccountQueryKey();
    const { get } = useActiveAccountSyncedStorage('devicesMeta');

    return useSuspenseQuery({
        queryKey: accountQueryKey.devices.meta.toKey(),
        queryFn: get,
        staleTime: Infinity
    });
}

export function useSyncedDevicesMeta(): Record<string, DeviceMeta> | null {
    return useSyncedDevicesMetaQuery().data;
}

export function useCurrentDeviceIkPub() {
    const account = useActiveAccount();
    const accountQueryKey = useActiveAccountQueryKey();

    return useSuspenseQuery({
        queryKey: accountQueryKey.devices.currentIkPub.toKey(),
        queryFn: async () => {
            const ikPub = await account.getMyDeviceIkPub();
            return ikPub.toString('hex');
        },
        staleTime: Infinity
    }).data;
}

export function useCurrentDeviceMetaSyncedState() {
    const currentIkPub = useCurrentDeviceIkPub();
    const syncedDevicesMeta = useSyncedDevicesMeta();

    return syncedDevicesMeta?.[currentIkPub].syncState;
}

export function useRevokeSyncedDevice() {
    const client = useQueryClient();
    const account = useActiveAccount();
    const accountQueryKey = useActiveAccountQueryKey();
    const { get, set } = useActiveAccountSyncedStorage('devicesMeta');

    return useMutation({
        async mutationFn(ikPubHex: string) {
            await account.revokeRemoteDevice(Buffer.from(ikPubHex, 'hex'));

            const existing = (await get()) ?? {};
            const { [ikPubHex]: _, ...rest } = existing;
            await set(Object.keys(rest).length > 0 ? rest : null);

            await client.invalidateQueries({ queryKey: accountQueryKey.devices.meta.toKey() });
        }
    });
}

export function useUpdateOwnSyncedDeviceMeta() {
    const client = useQueryClient();
    const { version, build, deviceInfo } = useAppContext();

    return useMutation<void, Error, SyncAccount>({
        async mutationFn(syncAccount) {
            const ikPub = await syncAccount.getMyDeviceIkPub();
            const ikPubHex = ikPub.toString('hex');

            const existing = await syncAccount.syncProvider.get('devicesMeta');
            const currentMetaExisting = existing?.[ikPubHex];
            const portfolios =
                (await syncAccount.syncProvider.get('portfolios'))?.map(a =>
                    PortfolioFactory.restorePortfolio(syncAccount.secretEncryptor, a)
                ) ?? [];

            const currentMeta: DeviceMeta = {
                name: deviceInfo.name,
                platform: build as 'ios' | 'android',
                osVersion: deviceInfo.osVersion,
                appVersion: version,
                pairedAt: currentMetaExisting?.pairedAt ?? Date.now(),
                syncState: {
                    stateHash: calcSyncedStorageHash({} as any), // TODO sync
                    portfoliosHashes: calculatePortfoliosHashes(portfolios)
                }
            };

            await syncAccount.syncProvider.set('devicesMeta', {
                ...existing,
                [ikPubHex]: currentMeta
            });
            await client.invalidateQueries({
                queryKey: accountKey.accountId(syncAccount.accountId).devices.meta.toKey()
            });
        }
    });
}
