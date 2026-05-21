import { useCallback, useMemo, useSyncExternalStore } from 'react';

import type { ISyncAccount } from '@safely/sync';
import { SyncStatus } from '@safely/sync';
import type { SDeviceMeta, SyncedStorageStructure } from '@safely/sync-storage';

import { useAppContext } from '../../shared';
import type { SyncAccount } from '../account/account-state';
import { useActiveAccount, useActiveAccountStoreSlot } from '../account/account-state';
import {
    useAccountSyncStorageSlotUpdate,
    useActiveAccountSyncStorageSlotUpdate
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

    console.log('syncStatus', account.syncProvider.syncStatusManager.getStatus());

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
    const update = useActiveAccountSyncStorageSlotUpdate('devicesMeta');

    return useMutation({
        async mutationFn(ikPubHex: string) {
            using secureStorage = storage.sync.getSecureEncrypted();
            await secureStorage.unlock();

            await account.revokeRemoteDevice(Buffer.from(ikPubHex, 'hex'), secureStorage);

            await update(draft => draft.delete(ikPubHex));
        }
    });
}

export function useSetOwnSyncedDeviceMeta() {
    const update = useAccountSyncStorageSlotUpdate('devicesMeta');
    const generate = useGenerateOwnSyncedDeviceMeta();

    return useMutation<void, Error, ISyncAccount<SyncedStorageStructure>>({
        async mutationFn(syncAccount) {
            await update(syncAccount, draft => {
                const [key, value] = generate(syncAccount);
                if (!draft.get()?.[key]) {
                    draft.set(key, value);
                }
            });
        }
    });
}

export function useGenerateOwnSyncedDeviceMeta() {
    const { version, build, deviceInfo } = useAppContext();

    return useCallback(
        (account: SyncAccount) => {
            const ikPubHex = account.getMyDeviceIkPub().toString('hex');

            return [
                ikPubHex,
                {
                    name: deviceInfo.name,
                    platform: build,
                    osVersion: deviceInfo.osVersion,
                    appVersion: version,
                    pairedAt: Date.now()
                }
            ] as const;
        },
        [version, build, deviceInfo]
    );
}
