import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

import type { Portfolio } from '@safely/core';
import { Id, PortfolioType } from '@safely/core';
import type { ISyncAccount } from '@safely/sync';
import { SyncStatus } from '@safely/sync';
import type { SDeviceMeta, SyncedStorageStructure } from '@safely/sync-storage';

import { useAppContext } from '../../shared';
import type { SyncAccount } from '../account/account-state';
import { useActiveAccount, useActiveAccountStoreSlot } from '../account/account-state';
import {
    useAccountSyncStorageSlotUpdate,
    useActiveAccountSyncStorageUpdate
} from '../account/useAccountSyncStorageUpdate';

export function useSyncedDevicesMeta(): Record<string, SDeviceMeta> | null {
    return useActiveAccountStoreSlot('devicesMeta') ?? null;
}

export function useCurrentDeviceIkPub(): string {
    const account = useActiveAccount();

    return useMemo(() => account.getMyDeviceIkPub().toString('hex'), [account]);
}

export enum SyncedDeviceDataStatus {
    SYNCED = 'synced',
    NOT_SYNCED = 'not_synced'
}

export type SyncedDeviceDetails = {
    ikPubHex: string;
    meta: SDeviceMeta;
    isCurrent: boolean;
    lastSyncAt: number;
    dataStatus: SyncedDeviceDataStatus;
    pendingPortfolios: readonly Portfolio[];
};

export function useSyncedDeviceDetails(ikPubHex: string): SyncedDeviceDetails | null {
    const devicesMeta = useSyncedDevicesMeta();
    const devicesSyncState = useActiveAccountStoreSlot('devicesSyncState');
    const portfolios = useActiveAccountStoreSlot('portfolios') ?? [];
    const currentIkPubHex = useCurrentDeviceIkPub();
    const meta = devicesMeta?.[ikPubHex] ?? null;
    const syncState = devicesSyncState?.[ikPubHex] ?? null;

    return useMemo(() => {
        if (meta === null) return null;

        const isCurrent = ikPubHex === currentIkPubHex;
        const pendingPortfolios =
            syncState === null || isCurrent
                ? []
                : portfolios.filter(
                      p =>
                          p.type === PortfolioType.BIP39 &&
                          !syncState.portfolioIds.some(id => p.id.isEq(Id.fromString(id)))
                  );

        return {
            ikPubHex,
            meta,
            isCurrent,
            lastSyncAt: syncState?.lastSyncAt ?? meta.pairedAt,
            dataStatus:
                pendingPortfolios.length === 0
                    ? SyncedDeviceDataStatus.SYNCED
                    : SyncedDeviceDataStatus.NOT_SYNCED,
            pendingPortfolios
        };
    }, [ikPubHex, currentIkPubHex, meta, syncState, portfolios]);
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

export function useRevokeSyncedDevice() {
    const account = useActiveAccount();
    const { storage } = useAppContext();
    const update = useActiveAccountSyncStorageUpdate();

    return useMutation({
        async mutationFn(ikPubHex: string) {
            using secureStorage = storage.sync.getSecureEncrypted();
            await secureStorage.unlock();

            await account.revokeRemoteDevice(Buffer.from(ikPubHex, 'hex'), secureStorage);

            await update(draft => {
                draft.at('devicesMeta').ifPresent(devicesMeta => devicesMeta.delete(ikPubHex));
                draft.at('devicesSyncState').delete(ikPubHex);
            });
        }
    });
}

export function useSetOwnSyncedDeviceMeta() {
    const update = useAccountSyncStorageSlotUpdate('devicesMeta');
    const generate = useGenerateOwnSyncedDeviceMeta();

    return useMutation<void, Error, ISyncAccount<SyncedStorageStructure>>({
        async mutationFn(syncAccount) {
            await update(syncAccount, draft => {
                const { key, value } = generate(syncAccount);
                draft.orDefault({}).entry(key).orDefault(value);
            });
        }
    });
}

export function useGenerateOwnSyncedDeviceMeta() {
    const { version, build, deviceInfo } = useAppContext();

    return useCallback(
        (account: SyncAccount) => {
            const ikPubHex = account.getMyDeviceIkPub().toString('hex');

            return {
                key: ikPubHex,
                value: {
                    name: deviceInfo.name,
                    platform: build,
                    osVersion: deviceInfo.osVersion,
                    appVersion: version,
                    pairedAt: Date.now()
                }
            };
        },
        [version, build, deviceInfo]
    );
}
