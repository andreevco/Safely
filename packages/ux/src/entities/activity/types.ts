import { InfiniteData } from '@tanstack/react-query';

import { BtcApiTx } from '@safely/core/api/btc';
import { CryptoAssetAmount } from '@safely/core/entities';

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
