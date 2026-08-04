import { useEffect } from 'react';

import type { Portfolio } from '@safely/core';
import type { Logger } from '@safely/sync';
import { SyncStatus } from '@safely/sync';

import { areIdsEqual, portfolioIds } from './utils';
import { useLogger } from '../../shared';
import { useAppState } from '../../shared/app/useAppState';
import type { SyncAccount } from '../account/account-state';
import { useAccounts } from '../account/account-state';
import { accountStore } from '../account/sync-storage/account-store';

const MIN_WRITE_INTERVAL_MS = 60 * 1000;
const TICK_INTERVAL_MS = 30 * 1000;

type DeviceSyncStateReporterDeps = {
    account: SyncAccount;
    getPortfolios: () => Portfolio[];
    logger: Logger;
};

function createDeviceSyncStateReporter(deps: DeviceSyncStateReporterDeps) {
    const { account, getPortfolios, logger } = deps;

    let isWriting = false;

    return async function report(): Promise<void> {
        if (isWriting) return;

        const status = account.syncProvider.syncStatusManager.getStatus();
        if (status !== SyncStatus.SYNCHRONIZED) {
            logger.debug('device_sync_state.skipped', { status });
            return;
        }

        const ikPubHex = account.getMyDeviceIkPub().toString('hex');
        const syncState = account.syncProvider.get('devicesSyncState') ?? {};
        const devicesMeta = account.syncProvider.get('devicesMeta') ?? {};
        const stored = syncState[ikPubHex];
        const ids = portfolioIds(getPortfolios());
        const now = Date.now();

        const unseededPeers = Object.keys(devicesMeta).filter(
            peer => peer !== ikPubHex && !syncState[peer]
        );
        const shouldWriteOwn =
            !stored ||
            now - stored.lastSyncAt >= MIN_WRITE_INTERVAL_MS ||
            !areIdsEqual(stored.portfolioIds, ids);

        if (!shouldWriteOwn && unseededPeers.length === 0) return;

        isWriting = true;
        try {
            await account.syncProvider.transaction(draft => {
                const slot = draft.at('devicesSyncState');

                if (shouldWriteOwn) {
                    slot.entry(ikPubHex).set({ lastSyncAt: now, portfolioIds: ids });
                }

                unseededPeers.forEach(peer => {
                    slot.entry(peer).set({
                        lastSyncAt: devicesMeta[peer].pairedAt,
                        portfolioIds: ids
                    });
                });
            });

            logger.debug('device_sync_state.reported', {
                wroteOwn: shouldWriteOwn,
                seededPeers: unseededPeers.length,
                portfolios: ids.length
            });
        } finally {
            isWriting = false;
        }
    };
}

export function useDeviceSyncStateChecker(): void {
    const { current } = useAppState();
    const accounts = useAccounts();
    const logger = useLogger('device-sync-state');

    useEffect(() => {
        if (accounts.length === 0 || current === 'background') return;

        const reports = accounts.map(account =>
            createDeviceSyncStateReporter({
                account,
                getPortfolios: () =>
                    accountStore.getState().accountsData.get(account.accountId)?.portfolios ?? [],
                logger
            })
        );

        const tick = () => reports.forEach(report => void report());

        tick();
        const interval = setInterval(tick, TICK_INTERVAL_MS);
        const unsubscribes = accounts.map((account, index) =>
            account.syncProvider.syncStatusManager.subscribe(() => void reports[index]())
        );

        return () => {
            clearInterval(interval);
            unsubscribes.forEach(unsubscribe => unsubscribe());
        };
    }, [accounts, current, logger]);
}
