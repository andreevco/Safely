import type { InfiniteData } from '@tanstack/react-query';

import type { ActivityPage, BtcActivityItem, IActivityFilters, IActivityPageParam } from './types';
import { isBtcActivityItem, isOrderActivityItem } from './types';

export function prependBroadcastedTx(
    data: InfiniteData<ActivityPage, IActivityPageParam>,
    item: BtcActivityItem | null,
    filters: IActivityFilters
): InfiniteData<ActivityPage, IActivityPageParam> {
    if (!item) {
        return data;
    }

    const alreadyInHistory = data.pages.some(page =>
        page.items.some(
            i => isBtcActivityItem(i) && i.transaction.raw.txid === item.transaction.raw.txid
        )
    );
    if (alreadyInHistory) {
        return data;
    }

    if (filters.isInitiator !== undefined && item.transaction.isInitiator !== filters.isInitiator) {
        return data;
    }

    const firstPage = data.pages[0] ?? { items: [], btcNextPage: null, ordersNextCursor: null };

    return {
        ...data,
        pages: [{ ...firstPage, items: [item, ...firstPage.items] }, ...data.pages.slice(1)]
    };
}

export function dedupeOrderTxs(
    data: InfiniteData<ActivityPage, IActivityPageParam>
): InfiniteData<ActivityPage, IActivityPageParam> {
    const orderTxHashes = new Set<string>();
    for (const page of data.pages) {
        for (const item of page.items) {
            if (isOrderActivityItem(item) && item.order.txHash) {
                orderTxHashes.add(item.order.txHash);
            }
        }
    }

    if (orderTxHashes.size === 0) {
        return data;
    }

    const hasMatches = data.pages.some(page =>
        page.items.some(
            item => isBtcActivityItem(item) && orderTxHashes.has(item.transaction.raw.txid)
        )
    );

    if (!hasMatches) {
        return data;
    }

    return {
        ...data,
        pages: data.pages.map(page => ({
            ...page,
            items: page.items.filter(
                item => !isBtcActivityItem(item) || !orderTxHashes.has(item.transaction.raw.txid)
            )
        }))
    };
}
