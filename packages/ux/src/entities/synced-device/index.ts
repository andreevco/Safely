import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import type { Portfolio } from '@safely/core';
import type { ISyncAccount } from '@safely/sync';
import type {
    SDeviceArchive,
    SDeviceMeta,
    SDeviceSyncState,
    SyncedStorageStructure
} from '@safely/sync-storage';

import { isSensitivePortfolio } from './utils';
import { useAppContext } from '../../shared';
import type { SyncAccount } from '../account/account-state';
import { useActiveAccount, useActiveAccountStoreSlot } from '../account/account-state';
import {
    useAccountSyncStorageSlotUpdate,
    useActiveAccountSyncStorageUpdate
} from '../account/useAccountSyncStorageUpdate';

export { useIsDeviceWarningHiddenQuery, useHideDeviceWarning } from './hidden-warnings';
export { useArchiveDevice, useUnarchiveDevice } from './device-archive';

export function useSyncedDevicesMeta(): Record<string, SDeviceMeta> | null {
    return useActiveAccountStoreSlot('devicesMeta') ?? null;
}

export function useCurrentDeviceIkPub(): string {
    const account = useActiveAccount();

    return useMemo(() => account.getMyDeviceIkPub().toString('hex'), [account]);
}

export enum SyncedDeviceDataStatus {
    SYNCED = 'synced',
    NOT_SYNCED = 'not_synced',
    UNKNOWN = 'unknown'
}

export type SyncedDeviceArchive = {
    archivedAt: number;
    archivedFromDeviceName: string | null;
};

export type SyncedDeviceDetails = {
    ikPubHex: string;
    meta: SDeviceMeta;
    isCurrent: boolean;
    lastSyncAt: number | null;
    isStale: boolean;
    dataStatus: SyncedDeviceDataStatus;
    pendingPortfolios: readonly Portfolio[];
    archive: SyncedDeviceArchive | null;
};

const STALE_CONNECTION_MS = 30 * 24 * 60 * 60 * 1000;

function resolveDataStatus(params: {
    isCurrent: boolean;
    hasReported: boolean;
    pendingPortfolios: readonly Portfolio[];
}): SyncedDeviceDataStatus {
    const { isCurrent, hasReported, pendingPortfolios } = params;

    if (isCurrent) {
        return SyncedDeviceDataStatus.SYNCED;
    }

    if (!hasReported) {
        return SyncedDeviceDataStatus.UNKNOWN;
    }

    return pendingPortfolios.length === 0
        ? SyncedDeviceDataStatus.SYNCED
        : SyncedDeviceDataStatus.NOT_SYNCED;
}

function buildDeviceDetails(params: {
    ikPubHex: string;
    meta: SDeviceMeta;
    syncState: SDeviceSyncState | null;
    archive: SDeviceArchive | null;
    devicesMeta: Record<string, SDeviceMeta>;
    currentIkPubHex: string;
    portfolios: readonly Portfolio[];
}): SyncedDeviceDetails {
    const { ikPubHex, meta, syncState, archive, devicesMeta, currentIkPubHex, portfolios } = params;

    const isCurrent = ikPubHex === currentIkPubHex;
    const pendingPortfolios =
        syncState === null || isCurrent
            ? []
            : portfolios.filter(
                  p => isSensitivePortfolio(p) && !syncState.portfolioIds[p.id.toString()]
              );

    return {
        ikPubHex,
        meta,
        isCurrent,
        lastSyncAt: syncState?.lastSyncAt ?? null,
        isStale: syncState !== null && Date.now() - syncState.lastSyncAt > STALE_CONNECTION_MS,
        dataStatus: resolveDataStatus({
            isCurrent,
            hasReported: syncState !== null,
            pendingPortfolios
        }),
        pendingPortfolios,
        archive:
            archive === null
                ? null
                : {
                      archivedAt: archive.archivedAt,
                      archivedFromDeviceName:
                          archive.archivedFromIkPubHex === null
                              ? null
                              : (devicesMeta[archive.archivedFromIkPubHex]?.name ?? null)
                  }
    };
}

export function useSyncedDeviceDetails(ikPubHex: string): SyncedDeviceDetails | null {
    const devicesMeta = useSyncedDevicesMeta();
    const devicesArchive = useActiveAccountStoreSlot('devicesArchive');
    const devicesSyncState = useActiveAccountStoreSlot('devicesSyncState');
    const portfolios = useActiveAccountStoreSlot('portfolios') ?? [];
    const currentIkPubHex = useCurrentDeviceIkPub();
    const meta = devicesMeta?.[ikPubHex] ?? null;
    const syncState = devicesSyncState?.[ikPubHex] ?? null;
    const archive = devicesArchive?.[ikPubHex] ?? null;

    return useMemo(
        () =>
            meta === null
                ? null
                : buildDeviceDetails({
                      ikPubHex,
                      meta,
                      syncState,
                      archive,
                      devicesMeta: devicesMeta ?? {},
                      currentIkPubHex,
                      portfolios
                  }),
        [ikPubHex, currentIkPubHex, meta, syncState, archive, devicesMeta, portfolios]
    );
}

export function useSyncedDevices(): SyncedDeviceDetails[] {
    const devicesMeta = useSyncedDevicesMeta();
    const devicesArchive = useActiveAccountStoreSlot('devicesArchive');
    const devicesSyncState = useActiveAccountStoreSlot('devicesSyncState');
    const portfolios = useActiveAccountStoreSlot('portfolios') ?? [];
    const currentIkPubHex = useCurrentDeviceIkPub();

    return useMemo(
        () =>
            Object.entries(devicesMeta ?? {})
                .map(([ikPubHex, meta]) =>
                    buildDeviceDetails({
                        ikPubHex,
                        meta,
                        syncState: devicesSyncState?.[ikPubHex] ?? null,
                        archive: devicesArchive?.[ikPubHex] ?? null,
                        devicesMeta: devicesMeta ?? {},
                        currentIkPubHex,
                        portfolios
                    })
                )
                .sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent)),
        [devicesMeta, devicesSyncState, devicesArchive, currentIkPubHex, portfolios]
    );
}

export enum AccountLinkState {
    SOLO = 'solo',
    PROTECTED = 'protected'
}

export function useAccountLinkState(): AccountLinkState {
    const selfIkPub = useCurrentDeviceIkPub();
    const devicesMeta = useSyncedDevicesMeta();

    const hasPeer = Object.keys(devicesMeta ?? {}).some(k => k !== selfIkPub);

    return hasPeer ? AccountLinkState.PROTECTED : AccountLinkState.SOLO;
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
