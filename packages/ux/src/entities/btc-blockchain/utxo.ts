import { useMemo } from 'react';

import { assertUnreachable, BtcAssetAmount, BtcWallet, PortfolioType } from '@safely/core';
import { BtcApiUtxoWithOptionalTx } from '@safely/core/api/btc';

import {
    QUERIES_REFETCH_INTERVAL,
    useBtcApi,
    useDerivedQuery,
    usePersistQuery
} from '../../shared';
import { useActiveBtcWallet, usePortfolios } from '../portfolio';
import { utxo } from './keys';
import { useBroadcastedBtcTxCache, BroadcastedBtcTxCacheService } from './broadcasted-tx-cache';
import { getBiggestBtcIOAddress } from '../activity/api';

function useAccessibleBtcWallets() {
    const portfolios = usePortfolios();
    return useMemo(
        () =>
            portfolios
                .filter(p => {
                    switch (p.type) {
                        case PortfolioType.BIP39:
                            return true;
                        default:
                            assertUnreachable(p.type);
                    }
                })
                .map(p => p.derivations[0].chains.btc.wallets[0]),
        [portfolios]
    );
}

export function useBtcWalletUtxo(btcWallet: BtcWallet) {
    const api = useBtcApi();
    const accessibleBtcWallets = useAccessibleBtcWallets();
    const { data: broadcastedTx = null } = useBroadcastedBtcTxCache();

    return usePersistQuery({
        queryKey: utxo.wallet(btcWallet).params({ api, broadcastedTx }).toKey(),
        async queryFn() {
            const allUtxos = await api.getUtxos(btcWallet, true);

            const confirmed = allUtxos.filter(u => u.confirmations > 0);
            const unconfirmed = allUtxos.filter(u => u.confirmations === 0);

            const cacheService = new BroadcastedBtcTxCacheService(broadcastedTx, btcWallet.address);

            const { safe, unsafe } = unconfirmed.reduce(
                (acc, item) => {
                    if (!item.tx) {
                        return { ...acc, unsafe: acc.unsafe.concat(item) };
                    }
                    const fromAddress = getBiggestBtcIOAddress(item.tx.vin.filter(v => !v.isOwn));
                    const isSafe = accessibleBtcWallets.some(w => w.address === fromAddress);
                    if (isSafe) {
                        return { ...acc, safe: acc.safe.concat(item) };
                    } else {
                        return { ...acc, unsafe: acc.unsafe.concat(item) };
                    }
                },
                { safe: [], unsafe: [] } as {
                    safe: BtcApiUtxoWithOptionalTx[];
                    unsafe: BtcApiUtxoWithOptionalTx[];
                }
            );

            const patchedConfirmed = cacheService.toConfirmed(confirmed);
            const patchedSafe = cacheService.toUnconfirmedSafe(safe);

            const getTotal = (utxos: { value: string }[]) =>
                utxos.reduce(
                    (acc, tx) => acc.amountAdd(BtcAssetAmount.fromWeiAmount(tx.value)),
                    BtcAssetAmount.fromWeiAmount('0')
                );

            return {
                confirmedIn: {
                    totalAmount: getTotal(patchedConfirmed),
                    utxos: patchedConfirmed
                },
                unconfirmedInSafe: {
                    totalAmount: getTotal(patchedSafe),
                    utxos: patchedSafe
                },
                unconfirmedInUnsafe: {
                    totalAmount: getTotal(unsafe),
                    utxos: unsafe
                }
            };
        },
        meta: {
            persist: true,
            schemaKey: 'sBtcWalletUtxos'
        },
        refetchInterval: QUERIES_REFETCH_INTERVAL.DEFAULT
    });
}

export function useBtcBalance(wallet: BtcWallet) {
    const utxosQuery = useBtcWalletUtxo(wallet);

    return useDerivedQuery({
        queries: [utxosQuery],
        queryFn: ([utxos]) => ({
            display: utxos.confirmedIn.totalAmount.amountAdd(utxos.unconfirmedInSafe.totalAmount),
            pending: utxos.unconfirmedInUnsafe.totalAmount
        })
    });
}

export function useActiveWalletBtcBalance() {
    const wallet = useActiveBtcWallet();
    return useBtcBalance(wallet);
}

export function useActiveBtcWalletUtxo() {
    const wallet = useActiveBtcWallet();
    return useBtcWalletUtxo(wallet);
}

export function useActiveBtcWalletUtxoForEstimation() {
    const utxoQuery = useActiveBtcWalletUtxo();
    return useDerivedQuery({
        queries: [utxoQuery],
        queryFn([u]) {
            return u.confirmedIn.utxos.concat(u.unconfirmedInSafe.utxos);
        }
    });
}

export function useBtcSendLocked() {
    const { data: broadcastedTx = null } = useBroadcastedBtcTxCache();
    return !!broadcastedTx;
}
