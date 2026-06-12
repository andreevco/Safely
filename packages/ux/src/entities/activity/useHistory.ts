import type { InfiniteData, QueryKey } from '@tanstack/react-query';
import { useCallback } from 'react';

import { fetchBtcActivity, fetchOrdersActivity } from './api';
import { activityKeys } from './keys';
import { dedupeOrderTxs, prependBroadcastedTx } from './merge';
import {
    INITIAL_ACTIVITY_PAGE_PARAM,
    buildActivityPage,
    getNextActivityPageParam
} from './pagination';
import type { ActivityPage, IActivityFilters, IActivityPageParam, IHistoryOptions } from './types';
import { applyActivityWaterline } from './waterline';
import {
    QUERIES_STALE_TIME,
    useAppContext,
    useBtcApi,
    useExchangeApi,
    useInfinitePersistQuery
} from '../../shared';
import { useLastBroadcastedBtcTx } from '../btc-blockchain';
import { useActiveBtcWallet } from '../portfolio';

export function useHistory<TData = InfiniteData<ActivityPage, IActivityPageParam>>(
    filters: IActivityFilters = {},
    options?: IHistoryOptions<TData>
) {
    const btcWallet = useActiveBtcWallet();
    const btcApi = useBtcApi(btcWallet.network);
    const exchangeApi = useExchangeApi();

    const { i18n, userCountryInfo, logger } = useAppContext();
    const broadcastedTx = useLastBroadcastedBtcTx();

    const ordersRequest = {
        lang: i18n.language,
        storeCountryCode: userCountryInfo?.storeCode,
        deviceCountryCode: userCountryInfo?.deviceCode
    };
    const ordersFailed = (error: unknown) => {
        logger.warn('ramp orders page failed', error);
        return 'failed' as const;
    };

    return useInfinitePersistQuery<ActivityPage, unknown, TData, QueryKey, IActivityPageParam>({
        queryKey: activityKeys.all(btcWallet.id.toString(), filters).toKey(),
        staleTime: QUERIES_STALE_TIME.ACTIVITY,
        queryFn: async ({ pageParam }) => {
            const { fetch, btcPage, ordersCursor } = pageParam;

            const [btcResult, ordersResult] = await Promise.all([
                fetch !== 'orders' && btcPage !== null
                    ? fetchBtcActivity(btcApi, btcWallet, btcPage, filters)
                    : null,
                fetch !== 'btc'
                    ? fetchOrdersActivity(exchangeApi, ordersRequest, ordersCursor, filters).catch(
                          ordersFailed
                      )
                    : null
            ]);

            return buildActivityPage({ pageParam, btcResult, ordersResult });
        },
        getNextPageParam: getNextActivityPageParam,
        initialPageParam: INITIAL_ACTIVITY_PAGE_PARAM,
        schemaKey: 'infiniteActivityData',
        select: useCallback(
            (data: InfiniteData<ActivityPage, IActivityPageParam>) => {
                const patched = prependBroadcastedTx(
                    data,
                    broadcastedTx?.toActivityItem(btcWallet.address) ?? null,
                    filters
                );

                const visible = dedupeOrderTxs(applyActivityWaterline(patched));
                return options?.select ? options.select(visible) : (visible as TData);
            },
            [broadcastedTx, options?.select, filters.isInitiator, btcWallet.address]
        )
    });
}
