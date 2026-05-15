import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';

import { PortfolioFactory } from '@safely/core';
import type { ISyncAccount } from '@safely/sync';
import { SyncStatus } from '@safely/sync';

import type { SyncedStorageStructure } from '../../shared';
import { type DeviceMeta, useAppContext, SecretEncryptor } from '../../shared';
import { calcSyncedStorageHash } from '../../shared/storage/account/synced/schemas';
import { calculatePortfoliosHashes } from '../../shared/storage/account/synced/schemas/devices-meta.schema';
import { useActiveAccount, useActiveAccountQueryKey } from '../account/account-state';
import { accountKey } from '../account/keys';
import { useActiveAccountSyncedStorage } from '../account/storage';
import { useMutation } from '../query-core';

export function useSyncedDevicesMetaQuery() {
    const accountQueryKey = useActiveAccountQueryKey();
    const { get } = useActiveAccountSyncedStorage('devicesMeta');

    return useQuery({
        queryKey: accountQueryKey.devices.meta.toKey(),
        queryFn: get,
        initialData: get,
        staleTime: Infinity
    });
}

export function useSyncedDevicesMeta(): Record<string, DeviceMeta> | null {
    return useSyncedDevicesMetaQuery().data;
}

export function useCurrentDeviceIkPub(): string {
    const account = useActiveAccount();
    const accountQueryKey = useActiveAccountQueryKey();

    const resolve = () => account.getMyDeviceIkPub().toString('hex');

    return useQuery({
        queryKey: accountQueryKey.devices.currentIkPub.toKey(),
        queryFn: resolve,
        initialData: resolve,
        staleTime: Infinity
    }).data;
}

export enum AccountLinkState {
    SOLO = 'solo',
    PROTECTED = 'protected',
    UNLINKED = 'unlinked'
}

export function useAccountLinkState(): AccountLinkState {
    const account = useActiveAccount();
    const selfIkPub = useCurrentDeviceIkPub();
    const devicesMeta = useSyncedDevicesMeta();

    const syncStatus = useSyncExternalStore(
        useCallback(cb => account.syncProvider.syncStatusManager.subscribe(cb), [account]),
        () => account.syncProvider.syncStatusManager.getStatus()
    );

    if (syncStatus === SyncStatus.DEVICE_DELETED) {
        return AccountLinkState.UNLINKED;
    }

    if (devicesMeta === null) {
        return AccountLinkState.SOLO;
    }

    const keys = Object.keys(devicesMeta);

    if (!(selfIkPub in devicesMeta)) {
        return keys.length === 0 ? AccountLinkState.SOLO : AccountLinkState.UNLINKED;
    }

    const hasPeer = keys.some(k => k !== selfIkPub);

    return hasPeer ? AccountLinkState.PROTECTED : AccountLinkState.SOLO;
}

export function useCurrentDeviceMetaSyncedState() {
    const currentIkPub = useCurrentDeviceIkPub();
    const syncedDevicesMeta = useSyncedDevicesMeta();

    if (!syncedDevicesMeta) {
        return undefined;
    }

    return syncedDevicesMeta[currentIkPub]?.syncState;
}

export function useRevokeSyncedDevice() {
    const client = useQueryClient();
    const account = useActiveAccount();
    const accountQueryKey = useActiveAccountQueryKey();
    const { get, set } = useActiveAccountSyncedStorage('devicesMeta');
    const { storage } = useAppContext();

    return useMutation({
        async mutationFn(ikPubHex: string) {
            await account.revokeRemoteDevice(
                Buffer.from(ikPubHex, 'hex'),
                storage.sync.getSecureEncrypted()
            );

            const existing = get() ?? {};
            const { [ikPubHex]: _, ...rest } = existing;
            await set(Object.keys(rest).length > 0 ? rest : null);

            await client.invalidateQueries({ queryKey: accountQueryKey.devices.meta.toKey() });
        }
    });
}

export function useUpdateOwnSyncedDeviceMeta() {
    const client = useQueryClient();
    const { version, build, deviceInfo, storage } = useAppContext();

    return useMutation<void, Error, ISyncAccount<SyncedStorageStructure>>({
        async mutationFn(syncAccount) {
            const ikPub = syncAccount.getMyDeviceIkPub();
            const ikPubHex = ikPub.toString('hex');

            const existing = syncAccount.syncProvider.get('devicesMeta');
            const currentMetaExisting = existing?.[ikPubHex];
            const portfolios =
                syncAccount.syncProvider
                    .get('portfolios')
                    ?.map(a =>
                        PortfolioFactory.restorePortfolio(
                            new SecretEncryptor(
                                syncAccount.secretEncryptor,
                                storage.sync.getSecureEncrypted()
                            ),
                            a
                        )
                    ) ?? [];

            const currentMeta: DeviceMeta = {
                name: deviceInfo.name,
                platform: build as 'ios' | 'android',
                osVersion: deviceInfo.osVersion,
                appVersion: version,
                pairedAt: currentMetaExisting?.pairedAt ?? Date.now(),
                syncState: {
                    stateHash: calcSyncedStorageHash(syncAccount.syncProvider.getAll()),
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
