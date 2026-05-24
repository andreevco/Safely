import type { InfiniteData, QueryKey } from '@tanstack/react-query';
import { useCallback } from 'react';

import { fetchBtcActivity } from './api';
import { activityKeys } from './keys';
import type { ActivityPage, IActivityFilters, IActivityPageParam, IHistoryOptions } from './types';
import { QUERIES_STALE_TIME, useInfinitePersistQuery, useBtcApi } from '../../shared';
import { useActiveAccountQuery } from '../account/account-state';
import { useLastBroadcastedBtcTx } from '../btc-blockchain';
import { useActiveBtcWallet } from '../portfolio';

const INITIAL_PAGE = 1;

export function useHistory<TData = InfiniteData<ActivityPage, IActivityPageParam>>(
    filters: IActivityFilters = {},
    options?: IHistoryOptions<TData>
) {
    const btcApi = useBtcApi();
    const btcWallet = useActiveBtcWallet();
    const broadcastedTx = useLastBroadcastedBtcTx();
    const { data: activeAccount } = useActiveAccountQuery();

    return useInfinitePersistQuery<ActivityPage, unknown, TData, QueryKey, IActivityPageParam>({
        queryKey: activityKeys.all(btcWallet.id.toString(), filters).toKey(),
        staleTime: QUERIES_STALE_TIME.ACTIVITY,
        queryFn: async ({ pageParam }) => {
            const page = pageParam?.page ?? INITIAL_PAGE;
            return fetchBtcActivity(btcApi, btcWallet, page, filters);
        },
        getNextPageParam: (lastPage, _, lastPageParam) => {
            if (!lastPage || lastPage.items.length === 0 || !lastPage.hasNextPage) {
                return undefined;
            }

            const currentPage = lastPageParam?.page ?? INITIAL_PAGE;
            return { page: currentPage + 1 };
        },
        meta: { accountId: activeAccount?.accountId },
        initialPageParam: { page: INITIAL_PAGE },
        schemaKey: 'infiniteActivityData',
        select: useCallback(
            (data: InfiniteData<ActivityPage, IActivityPageParam>) => {
                const getPatchedData = () => {
                    const broadcastedItem = broadcastedTx?.toActivityItem(btcWallet.address);

                    if (!broadcastedItem) {
                        return data;
                    }

                    const alreadyInHistory = data.pages.some(p =>
                        p.items.some(
                            item =>
                                item.transaction.raw.txid === broadcastedItem.transaction.raw.txid
                        )
                    );

                    if (alreadyInHistory) {
                        return data;
                    }

                    if (
                        filters.isInitiator !== undefined &&
                        broadcastedItem.transaction.isInitiator !== filters.isInitiator
                    ) {
                        return data;
                    }

                    const firstPage = data.pages[0] ?? { items: [], hasNextPage: false };

                    return {
                        ...data,
                        pages: [
                            { ...firstPage, items: [broadcastedItem, ...firstPage.items] },
                            ...data.pages.slice(1)
                        ]
                    };
                };

                return options?.select
                    ? options.select(getPatchedData())
                    : (getPatchedData() as TData);
            },
            [broadcastedTx, options?.select, filters.isInitiator, btcWallet.address]
        )
    });
}
