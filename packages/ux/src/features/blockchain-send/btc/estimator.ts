import { useMemo } from 'react';

import { BtcEstimator } from '@safely/core';

import { useActiveBtcWallet, useActiveSignableBtcWallet } from '../../../entities';
import { useAppContext, useBtcApi } from '../../../shared';

export function useBtcEstimator() {
    const wallet = useActiveBtcWallet();
    const btcApi = useBtcApi(wallet.network);
    const btcWallet = useActiveSignableBtcWallet();
    const { logger } = useAppContext();

    return useMemo(
        () => new BtcEstimator(btcApi, btcWallet, logger),
        [btcApi.id, btcWallet.id, logger]
    );
}
