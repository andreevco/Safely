import { useMemo } from 'react';

import { BtcApi } from '@safely/core';

import { useBootConfig } from './useBootConfig';
import { useAppContext } from '../providers';

export function useBtcApi() {
    const { blockchains } = useBootConfig();
    const { logger } = useAppContext();

    return useMemo(
        () =>
            new BtcApi({
                baseUrl: blockchains.bitcoin.mainnet.api_url,
                logger
            }),
        [blockchains.bitcoin.mainnet.api_url, logger]
    );
}
