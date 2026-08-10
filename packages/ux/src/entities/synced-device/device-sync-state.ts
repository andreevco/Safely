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

        if (account.syncProvider.syncStatusManager.getStatus() !== SyncStatus.SYNCHRONIZED) {
            return;
        }

        const ikPubHex = account.getMyDeviceIkPub().toString('hex');
        const stored = account.syncProvider.get('devicesSyncState')?.[ikPubHex];
        const ids = portfolioIds(getPortfolios());
        const now = Date.now();

        const isUpToDate =
            stored &&
            now - stored.lastSyncAt < MIN_WRITE_INTERVAL_MS &&
            areIdsEqual(stored.portfolioIds, ids);

        if (isUpToDate) return;

        isWriting = true;
        try {
            await account.syncProvider.transaction(draft => {
                draft
                    .at('devicesSyncState')
                    .entry(ikPubHex)
                    .set({ lastSyncAt: now, portfolioIds: ids });
            });

            logger.debug('device_sync_state.reported', { ikPubHex, portfolios: ids.length });
        } catch (e) {
            logger.error('device_sync_state.failed', e);
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
