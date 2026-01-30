import { useMemo } from 'react';

import { BtcEstimator } from '@safely/core';

import { useActiveBtcWallet } from '../../../entities';
import { useBtcApi } from '../../../shared';

export function useBtcEstimator() {
    const btcApi = useBtcApi();
    const btcWallet = useActiveBtcWallet();

    return useMemo(() => new BtcEstimator(btcApi, btcWallet), [btcApi.id, btcWallet.id]);
}
