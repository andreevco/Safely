import { useMemo } from 'react';

import { BtcEstimator } from '@safely/core';

import { useActiveSignableBtcWallet } from '../../../entities';
import { useBtcApi } from '../../../shared';

export function useBtcEstimator() {
    const btcApi = useBtcApi();
    const btcWallet = useActiveSignableBtcWallet();

    return useMemo(() => new BtcEstimator(btcApi, btcWallet), [btcApi.id, btcWallet.id]);
}
