import { useCallback, useMemo } from 'react';

import {
    assertUnreachable,
    BtcAssetAmount,
    BtcWallet,
    PortfolioType,
    RequiredProperties
} from '@safely/core';
import { BtcApiUtxoWithOptionalTx } from '@safely/core/api/btc';

import {
    QUERIES_REFETCH_INTERVAL,
    useBtcApi,
    useDerivedQuery,
    usePersistQuery
} from '../../shared';
import { resolveBtcWallet, useActiveBtcWallet, usePortfolios } from '../portfolio';
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
                        case PortfolioType.WATCH_ONLY:
                            return false;
                        default:
                            assertUnreachable(p);
                    }
                })
                .map(p => resolveBtcWallet(p)),
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
        refetchInterval: QUERIES_REFETCH_INTERVAL.UTXO
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
                        return { ...acc };
                    }
                    const fromAddress = getBiggestBtcIOAddress(item.tx.vin.filter(v => !v.isOwn));
                    const isSafe = accessibleBtcWallets.some(w => w.address === fromAddress);
                    const narrowed = item as RequiredProperties<BtcApiUtxoWithOptionalTx, 'tx'>;
                    if (isSafe) {
                        return { ...acc, safe: acc.safe.concat(narrowed) };
                    } else {
                        return { ...acc, unsafe: acc.unsafe.concat(narrowed) };
                    }
                },
                { safe: [], unsafe: [] } as {
                    safe: RequiredProperties<BtcApiUtxoWithOptionalTx, 'tx'>[];
                    unsafe: RequiredProperties<BtcApiUtxoWithOptionalTx, 'tx'>[];
                }
            );

            return {
                confirmed: {
                    totalAmount: getTotal(confirmed),
                    utxos: confirmed
                },
                unconfirmedSafe: {
                    totalAmount: getTotal(safe),
                    utxos: safe
                },
                unconfirmedUnsafe: {
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
            const isSender = serverUtxo.confirmed.utxos
                .concat(serverUtxo.unconfirmedSafe.utxos)
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

            const patchedConfirmed = cacheService.toConfirmed(serverUtxo.confirmed.utxos);
            const patchedSafe = cacheService.toUnconfirmedSafe(serverUtxo.unconfirmedSafe.utxos);

            return {
                confirmed: {
                    totalAmount: getTotal(patchedConfirmed),
                    utxos: patchedConfirmed
                },
                unconfirmedSafe: {
                    totalAmount: getTotal(patchedSafe),
                    utxos: patchedSafe
                },
                unconfirmedUnsafe: serverUtxo.unconfirmedUnsafe
            };
        }
    });
}

export function useBtcBalance(wallet: BtcWallet) {
    const utxosQuery = useBtcWalletUtxo(wallet);

    return useDerivedQuery({
        queries: [utxosQuery],
        queryFn: ([utxos]) => ({
            display: utxos.confirmed.totalAmount.amountAdd(utxos.unconfirmedSafe.totalAmount),
            pending: utxos.unconfirmedUnsafe.totalAmount
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
            return u.confirmed.utxos.concat(u.unconfirmedSafe.utxos);
        }
    });
}

export function useBtcSendLocked() {
    const { data: broadcastedTx = null } = useBroadcastedBtcTxCache();
    return !!broadcastedTx;
}
