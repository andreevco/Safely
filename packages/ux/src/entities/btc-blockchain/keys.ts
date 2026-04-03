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
            api: mappedParams(
                (_: BtcApi) => finalKey,
                api => [api.id]
            )
        }),
        wallet => [wallet.id]
    )
});

export const pendingBtcTxs = defineQueryKeys('pending-btc-txs', {
    account: mappedParams(
        (_: SyncAccount) => finalKey,
        account => [account.accountId]
    )
});
