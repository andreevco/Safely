import { useMemo } from 'react';

import { BtcApi } from '@safely/core';

import { useBootConfig } from './useBootConfig';

export function useBtcApi() {
    const { blockchains } = useBootConfig();

    return useMemo(
        () =>
            new BtcApi({
                baseUrl: blockchains.bitcoin.mainnet.api_url
            }),
        [blockchains.bitcoin.mainnet.api_url]
    );
}
