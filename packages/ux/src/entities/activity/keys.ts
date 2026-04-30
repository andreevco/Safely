import { IActivityFilters } from './types';
import { defineQueryKeys, finalKey } from '../../shared/query-core/query-key-factory';

export const activityKeys = defineQueryKeys('activity', {
    all: (_walletId: string, _filters: IActivityFilters) => ({
        btcTxLastTimestamp: finalKey
    })
});
