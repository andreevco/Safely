import { BtcApi, BtcWallet } from '@safely/core';

import { defineQueryKeys, finalKey, mappedParams } from '../../shared';
import { SyncAccount } from '../account';
import { BroadcastedBtcTx } from './broadcasted-tx-cache';

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
                (_: { api: BtcApi; broadcastedTx: BroadcastedBtcTx | null }) => finalKey,
                ({ api, broadcastedTx }) => [api.id, JSON.stringify(broadcastedTx)]
            )
        }),
        wallet => [wallet.id]
    )
});

export const broadcastedBtcTxCache = defineQueryKeys('broadcasted-btc-tx-cache', {
    account: mappedParams(
        (_: SyncAccount) => finalKey,
        account => [account.accountId]
    )
});
