import { BtcApi, BtcWallet } from '@safely/core';

import { BroadcastedBtcTx } from './last-broadcasted-btc-tx';
import { defineQueryKeys, finalKey, mappedParams } from '../../shared';

export const btcBlockchain = defineQueryKeys('btc-blockchain', {
    blockNumber: mappedParams(
        (_: BtcApi) => {
            return finalKey;
        },
        api => [api.id]
    )
});

export const utxo = defineQueryKeys('utxo', {
    wallet: mappedParams(
        (__: BtcWallet) => ({
            params: mappedParams(
                (_: { api: BtcApi; lastBroadcastedBtcTx: BroadcastedBtcTx | undefined }) =>
                    finalKey,
                ({ api, lastBroadcastedBtcTx }) => [api.id, lastBroadcastedBtcTx]
            )
        }),
        wallet => [wallet.id]
    )
});
