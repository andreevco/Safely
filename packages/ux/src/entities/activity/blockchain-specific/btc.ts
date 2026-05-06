import type { InfiniteData } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { BtcApiTx } from '@safely/core';
import { BLOCKCHAIN_NAME } from '@safely/core';

import { QUERIES_REFETCH_INTERVAL, useBtcApi } from '../../../shared';
import { useActualBtcBlockNumber } from '../../btc-blockchain';
import { useActiveBtcWallet } from '../../portfolio';
import { fetchBtcActivity } from '../api';
import { activityKeys } from '../keys';
import type { ActivityItem, ActivityPage, IActivityPageParam } from '../types';

type BtcTransactionDisplayStatus =
    | { type: 'pending' }
    | { type: 'confirmed-recently'; timestamp: Date; confirmations: number }
    | { type: 'confirmed-long-ago'; timestamp: Date };

export function isBtcTransactionPending(tx: Pick<BtcApiTx, 'blockHeight'>): boolean {
    return tx.blockHeight === -1;
}

export function useBtcTransactionDisplayStatus(
    tx: Pick<BtcApiTx, 'blockHeight' | 'confirmations' | 'blockTime'>
): BtcTransactionDisplayStatus {
    const { data: currentBlockNumber } = useActualBtcBlockNumber();
    if (isBtcTransactionPending(tx)) {
        return { type: 'pending' };
    } else {
        const timestamp = new Date(tx.blockTime * 1000);
        const confirmations =
            currentBlockNumber !== undefined
                ? currentBlockNumber - tx.blockHeight + 1
                : tx.confirmations;
        const confirmedAgoConfirmationsNumber = 6;

        if (confirmations > confirmedAgoConfirmationsNumber) {
            return { type: 'confirmed-long-ago', timestamp };
        } else {
            return { type: 'confirmed-recently', confirmations, timestamp };
        }
    }
}

function extractTimestamp(items: ActivityItem[]) {
    const btcItem = items.find(
        item => item.transaction.value.asset.id.blockchain === BLOCKCHAIN_NAME.BTC
    );
    return btcItem?.timestamp ?? null;
}

export function useLastBtcTransactionTimestamp() {
    const queryClient = useQueryClient();
    const btcApi = useBtcApi();
    const btcWallet = useActiveBtcWallet();
    const walletId = btcWallet.id.toString();

    const historyQueryKey = activityKeys.all(walletId, {}).toKey();

    return useQuery({
        queryKey: activityKeys.all(walletId, {}).btcTxLastTimestamp.toKey(),
        queryFn: async () => {
            const state = queryClient.getQueryState(historyQueryKey);
            const cachedData =
                queryClient.getQueryData<InfiniteData<ActivityPage, IActivityPageParam>>(
                    historyQueryKey
                );

            if (
                cachedData &&
                state &&
                Date.now() - state.dataUpdatedAt < QUERIES_REFETCH_INTERVAL.LAST_BTC_TX
            ) {
                const items = cachedData.pages.flatMap(page => page.items);
                return extractTimestamp(items);
            }

            const page = await fetchBtcActivity(btcApi, btcWallet, 1, {});
            return extractTimestamp(page.items);
        },
        refetchInterval: QUERIES_REFETCH_INTERVAL.LAST_BTC_TX
    });
}
