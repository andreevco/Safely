import { InfiniteData } from '@tanstack/react-query';

import { BtcApiTx, BtcAsset, TransactionFeeCrypto } from '@safely/core';
import { CryptoAssetAmount } from '@safely/core';

export interface IActivityFilters {
    isInitiator?: boolean;
}

export interface BtcActivityItem {
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

export type ActivityItem = BtcActivityItem;

export enum ACTIVITY_GROUP_LABEL {
    TODAY = 'TODAY',
    YESTERDAY = 'YESTERDAY',
    THIS_MONTH = 'THIS_MONTH',
    THIS_YEAR = 'THIS_YEAR',
    PAST_YEAR = 'PAST_YEAR'
}

export type ActivityItemsDatedGroupMeta =
    | { label: ACTIVITY_GROUP_LABEL.TODAY }
    | { label: ACTIVITY_GROUP_LABEL.YESTERDAY }
    | { label: ACTIVITY_GROUP_LABEL.THIS_MONTH; day: number }
    | { label: ACTIVITY_GROUP_LABEL.THIS_YEAR; month: number }
    | { label: ACTIVITY_GROUP_LABEL.PAST_YEAR; year: number; month: number };

export type ActivityItemsDatedGroup = ActivityItemsDatedGroupMeta & { items: ActivityItem[] };

export interface IActivityPageParam {
    page: number;
}

export interface ActivityPage {
    items: ActivityItem[];
    hasNextPage: boolean;
}

export interface IHistoryOptions<TData> {
    select?: (data: InfiniteData<ActivityPage, IActivityPageParam>) => TData;
}
