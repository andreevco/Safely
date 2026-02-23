import { BtcApi } from '@safely/core';

import { defineQueryKeys, finalKey, mappedParams } from '../../shared';

export const btcBlockchain = defineQueryKeys('btc-blockchain', {
    blockNumber: mappedParams(
        (_: BtcApi) => {
            return finalKey;
        },
        api => [api.id]
    )
});
