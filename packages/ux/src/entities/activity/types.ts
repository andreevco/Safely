import { InfiniteData } from '@tanstack/react-query';

import { BtcApiTx } from '@safely/core';
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
        raw: BtcApiTx;
    };
}

export type ActivityItemsDatedGroup = [string, BtcActivityItem[]];

export interface IActivityPageParam {
    page: number;
}

export interface ActivityPage {
    items: BtcActivityItem[];
    hasNextPage: boolean;
}

export interface IHistoryOptions<TData> {
    select?: (data: InfiniteData<ActivityPage, IActivityPageParam>) => TData;
}
