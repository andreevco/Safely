import { BtcApi, BtcWallet } from '@safely/core';

import { defineQueryKeys, finalKey, mappedParams } from '../../shared';
import { SyncAccount } from '../account';
import { PendingBtcTx } from './pending-txs';

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
                (_: { api: BtcApi; pendingTxs: PendingBtcTx[] }) => finalKey,
                ({ api, pendingTxs }) => [api.id, JSON.stringify(pendingTxs)]
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
