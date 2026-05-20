import { useCallback, useMemo, useSyncExternalStore } from 'react';

import type { ISyncAccount } from '@safely/sync';
import { SyncStatus } from '@safely/sync';
import type { SDeviceMeta, SyncedStorageStructure } from '@safely/sync-storage';

import { useAppContext } from '../../shared';
import { useActiveAccount, useActiveAccountStoreSlot } from '../account/account-state';
import {
    useAccountSyncStorageUpdate,
    useActiveAccountSyncStorageUpdate
} from '../account/useAccountSyncStorageUpdate';
import { useMutation } from '../query-core';

export function useSyncedDevicesMeta(): Record<string, SDeviceMeta> | null {
    return useActiveAccountStoreSlot('devicesMeta') ?? null;
}

export function useCurrentDeviceIkPub(): string {
    const account = useActiveAccount();

    return useMemo(() => account.getMyDeviceIkPub().toString('hex'), [account]);
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
    const update = useActiveAccountSyncStorageUpdate('devicesMeta');

    return useMutation({
        async mutationFn(ikPubHex: string) {
            await account.revokeRemoteDevice(
                Buffer.from(ikPubHex, 'hex'),
                storage.sync.getSecureEncrypted()
            );

            await update(draft => draft.delete(ikPubHex));
        }
    });
}

export function useSetOwnSyncedDeviceMeta() {
    const { version, build, deviceInfo } = useAppContext();
    const update = useAccountSyncStorageUpdate('devicesMeta');

    return useMutation<void, Error, ISyncAccount<SyncedStorageStructure>>({
        async mutationFn(syncAccount) {
            const ikPubHex = syncAccount.getMyDeviceIkPub().toString('hex');

            await update(syncAccount, draft =>
                draft.set(ikPubHex, {
                    name: deviceInfo.name,
                    platform: build as 'ios' | 'android',
                    osVersion: deviceInfo.osVersion,
                    appVersion: version,
                    pairedAt: draft.get()?.[ikPubHex]?.pairedAt ?? Date.now()
                })
            );
        }
    });
}
