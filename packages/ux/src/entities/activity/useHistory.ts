import { InfiniteData, QueryKey } from '@tanstack/react-query';

import { QUERIES_STALE_TIME, useInfinitePersistQuery, useBtcApi } from '../../shared';
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
        select: options?.select
    });
}
