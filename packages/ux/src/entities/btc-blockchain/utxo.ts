import { useCallback, useMemo } from 'react';

import { assertUnreachable, BtcAssetAmount, BtcWallet, PortfolioType } from '@safely/core';
import { BtcApiUtxoWithOptionalTx } from '@safely/core/api/btc';

import {
    QUERIES_REFETCH_INTERVAL,
    useBtcApi,
    useDerivedQuery,
    usePersistQuery
} from '../../shared';
import { useActiveBtcWallet, usePortfolios } from '../portfolio';
import { useBroadcastedBtcTxCache, BroadcastedBtcTxCacheService } from './broadcasted-tx-cache';
import { utxo } from './keys';
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

function getTotal(utxos: { value: string }[]) {
    return utxos.reduce(
        (acc, tx) => acc.amountAdd(BtcAssetAmount.fromWeiAmount(tx.value)),
        BtcAssetAmount.fromWeiAmount('0')
    );
}

export function useRawBtcWalletUtxo(btcWallet: BtcWallet) {
    const api = useBtcApi();

    return usePersistQuery({
        queryKey: utxo.wallet(btcWallet).params({ api }).toKey(),
        queryFn: () => api.getUtxos(btcWallet, true),
        schemaKey: 'sBtcWalletUtxos',
        refetchInterval: QUERIES_REFETCH_INTERVAL.DEFAULT
    });
}

function useBtcWalletUtxoFromServer(btcWallet: BtcWallet) {
    const rawQuery = useRawBtcWalletUtxo(btcWallet);
    const accessibleBtcWallets = useAccessibleBtcWallets();

    const queryFn = useCallback(
        ([allUtxos]: readonly [BtcApiUtxoWithOptionalTx[]]) => {
            const confirmed = allUtxos.filter(u => u.confirmations > 0);
            const unconfirmed = allUtxos.filter(u => u.confirmations === 0);

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

            return {
                confirmedIn: {
                    totalAmount: getTotal(confirmed),
                    utxos: confirmed
                },
                unconfirmedInSafe: {
                    totalAmount: getTotal(safe),
                    utxos: safe
                },
                unconfirmedInUnsafe: {
                    totalAmount: getTotal(unsafe),
                    utxos: unsafe
                }
            };
        },
        [accessibleBtcWallets]
    );

    return useDerivedQuery({
        queries: [rawQuery],
        queryFn
    });
}

export function useBtcWalletUtxo(btcWallet: BtcWallet) {
    const serverUtxoQuery = useBtcWalletUtxoFromServer(btcWallet);
    const broadcastedTxQuery = useBroadcastedBtcTxCache();

    return useDerivedQuery({
        queries: [serverUtxoQuery, broadcastedTxQuery],
        queryFn([serverUtxo, rawBroadcastedTx]) {
            const spentKeys = new Set(rawBroadcastedTx?.inputs.map(i => `${i.txid}:${i.vout}`));
            const isSender = serverUtxo.unconfirmedInSafe.utxos
                .concat(serverUtxo.confirmedIn.utxos)
                .some(u => spentKeys.has(`${u.txid}:${u.vout}`));
            const isRecipient =
                rawBroadcastedTx?.outputs.some(o => o.address === btcWallet.address) ?? false;

            if (!isSender && !isRecipient) {
                rawBroadcastedTx = null;
            }

            const cacheService = new BroadcastedBtcTxCacheService(
                rawBroadcastedTx,
                btcWallet.address
            );

            const patchedConfirmed = cacheService.toConfirmed(serverUtxo.confirmedIn.utxos);
            const patchedSafe = cacheService.toUnconfirmedSafe(serverUtxo.unconfirmedInSafe.utxos);

            return {
                confirmedIn: {
                    totalAmount: getTotal(patchedConfirmed),
                    utxos: patchedConfirmed
                },
                unconfirmedInSafe: {
                    totalAmount: getTotal(patchedSafe),
                    utxos: patchedSafe
                },
                unconfirmedInUnsafe: serverUtxo.unconfirmedInUnsafe
            };
        }
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
