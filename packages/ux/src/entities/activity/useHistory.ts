import { InfiniteData, QueryKey } from '@tanstack/react-query';

import { QUERIES_STALE_TIME, useInfinitePersistQuery, useBtcApi } from '../../shared';
import { useBroadcastedBtcTxCache } from '../btc-blockchain/broadcasted-tx-cache';
import { useActiveBtcWallet } from '../portfolio';
import { fetchBtcActivity } from './api';
import { activityKeys } from './keys';
import { ActivityPage, IActivityFilters, IActivityPageParam, IHistoryOptions } from './types';

const INITIAL_PAGE = 1;

export function useHistory<TData = InfiniteData<ActivityPage, IActivityPageParam>>(
    filters: IActivityFilters = {},
    options?: IHistoryOptions<TData>
) {
    const btcApi = useBtcApi();
    const btcWallet = useActiveBtcWallet();
    const { data: broadcastedTx = null } = useBroadcastedBtcTxCache();

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
        initialPageParam: { page: INITIAL_PAGE },
        meta: {
            persist: true,
            schemaKey: 'infiniteActivityData'
        },
        select(data) {
            const allItems = data?.pages?.length ? data.pages.flatMap(page => page.items) : [];

            if (broadcastedTx) {
                const broadcastedItem = broadcastedTx.toActivityItem(btcWallet.address);

                if (
                    broadcastedItem &&
                    !allItems.some(
                        item => item.transaction.raw.txid === broadcastedItem.transaction.raw.txid
                    ) &&
                    (filters.isInitiator === undefined ||
                        broadcastedItem.transaction.isInitiator === filters.isInitiator)
                ) {
                    allItems.unshift(broadcastedItem);
                }
            }

            const patchedData: InfiniteData<ActivityPage, IActivityPageParam> = {
                ...data,
                pages: [
                    { items: allItems, hasNextPage: data.pages[0]?.hasNextPage ?? false },
                    ...data.pages.slice(1)
                ]
            };

            return options?.select ? options.select(patchedData) : (patchedData as TData);
        }
    });
}
