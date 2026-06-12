import { useMemo } from 'react';

import { BtcEstimator } from '@safely/core';

import { useActiveSignableBtcWallet } from '../../../entities';
import { useAppContext, useBtcApi } from '../../../shared';

export function useBtcEstimator() {
    const btcWallet = useActiveSignableBtcWallet();
    const btcApi = useBtcApi(btcWallet.network);
    const { logger } = useAppContext();

    return useMemo(
        () => new BtcEstimator(btcApi, btcWallet, logger),
        [btcApi.id, btcWallet.id, logger]
    );
}
