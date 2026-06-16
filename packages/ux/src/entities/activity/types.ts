import type { InfiniteData } from '@tanstack/react-query';

import type { BtcApiTx, BtcAsset, RampOrder, TransactionFeeCrypto } from '@safely/core';
import type { CryptoAssetAmount } from '@safely/core';

export interface IActivityFilters {
    isInitiator?: boolean;
}

export interface BtcActivityItem {
    type: 'transaction';
    timestamp: number;
    key: string;
    transaction: {
        isInitiator: boolean;
        fromAddress: string;
        toAddress: string;
        value: CryptoAssetAmount;
        fee: TransactionFeeCrypto<BtcAsset> | undefined;
        raw: BtcApiTx;
    };
}

export interface OrderActivityItem {
    type: 'order';
    timestamp: number;
    key: string;
    order: RampOrder;
    cryptoAmount: CryptoAssetAmount | null;
}

export type ActivityItem = BtcActivityItem | OrderActivityItem;

export function isBtcActivityItem(item: ActivityItem): item is BtcActivityItem {
    return item.type === 'transaction';
}

export function isOrderActivityItem(item: ActivityItem): item is OrderActivityItem {
    return item.type === 'order';
}

export enum ACTIVITY_GROUP_LABEL {
    PENDING = 'PENDING',
    TODAY = 'TODAY',
    YESTERDAY = 'YESTERDAY',
    THIS_MONTH = 'THIS_MONTH',
    THIS_YEAR = 'THIS_YEAR',
    PAST_YEAR = 'PAST_YEAR'
}

export type ActivityItemsDatedGroupMeta =
    | { label: ACTIVITY_GROUP_LABEL.PENDING }
    | { label: ACTIVITY_GROUP_LABEL.TODAY }
    | { label: ACTIVITY_GROUP_LABEL.YESTERDAY }
    | { label: ACTIVITY_GROUP_LABEL.THIS_MONTH; year: number; month: number; day: number }
    | { label: ACTIVITY_GROUP_LABEL.THIS_YEAR; year: number; month: number }
    | { label: ACTIVITY_GROUP_LABEL.PAST_YEAR; year: number; month: number };

export type ActivityItemsDatedGroup = ActivityItemsDatedGroupMeta & { items: ActivityItem[] };

export interface IActivityPageParam {
    fetch: 'both' | 'btc' | 'orders';
    btcPage: number | null;
    ordersCursor: string | null;
}

export interface BtcActivityPage {
    items: BtcActivityItem[];
    hasNextPage: boolean;
}

export interface OrdersActivityPage {
    items: OrderActivityItem[];
    nextCursor: string | null;
}

export interface ActivityPage {
    items: ActivityItem[];
    btcNextPage: number | null;
    ordersNextCursor: string | null;
}

export interface IHistoryOptions<TData> {
    select?: (data: InfiniteData<ActivityPage, IActivityPageParam>) => TData;
}
