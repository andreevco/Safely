import { BtcApi, BtcWallet } from '@safely/core';

import { defineQueryKeys, finalKey, mappedParams } from '../../shared';
import { SyncAccount } from '../account';

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
                (_: { api: BtcApi }) => finalKey,
                ({ api }) => [api.id]
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
