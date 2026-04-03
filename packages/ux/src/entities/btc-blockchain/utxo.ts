import { useMemo } from 'react';

import { assertUnreachable, BtcAssetAmount, BtcWallet, PortfolioType } from '@safely/core';
import { BtcApiUtxoWithTx } from '@safely/core/api/btc';

import {
    QUERIES_REFETCH_INTERVAL,
    useBtcApi,
    useDerivedQuery,
    usePersistQuery
} from '../../shared';
import { useActiveBtcWallet, usePortfolios } from '../portfolio';
import { utxo } from './keys';
import {
    usePendingBtcTransactions,
    useRemovePendingBtcTransactions,
    PendingBtcTxsService
} from './pending-txs';
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
    const { data: pendingTxs = [] } = usePendingBtcTransactions();
    const { mutate: removePendingTxs } = useRemovePendingBtcTransactions();

    return usePersistQuery({
        queryKey: utxo.wallet(btcWallet).params({ api, pendingTxs }).toKey(),
        async queryFn() {
            const [confirmedIn, serverUnconfirmedIn, txHistory] = await Promise.all([
                api.getAccountConfirmedUtxo(btcWallet),
                api.getAccountUnconfirmedUtxo(btcWallet),
                api.getXpub(
                    {
                        ...btcWallet,
                        derivationPath: {
                            change: 0,
                            addressIndex: '*'
                        }
                    },
                    {
                        details: 'txs',
                        page: 1,
                        pageSize: 1
                    }
                )
            ]);

            const pendingTxsService = new PendingBtcTxsService(
                pendingTxs,
                btcWallet.address,
                txHistory.transactions,
                serverUnconfirmedIn
            );

            if (pendingTxsService.resolvedTxs.length > 0) {
                void removePendingTxs(pendingTxsService.resolvedTxs);
            }

            const serverUnconfirmedOutTxs =
                txHistory.transactions?.filter(
                    tx => tx.vin?.some(input => input.isOwn) && tx.confirmations < 1
                ) ?? [];

            const unconfirmedOutTxs = pendingTxsService.toUnconfirmedOut(serverUnconfirmedOutTxs);

            const unconfirmedOutUtxos = unconfirmedOutTxs.flatMap(tx =>
                tx.vin
                    .filter(vin => vin.isOwn && vin.txid != null)
                    .map(vin => ({
                        txid: vin.txid!,
                        vout: vin.vout ?? 0,
                        value: vin.value ?? '0'
                    }))
            );

            const { safe: serverSafe, unsafe } = serverUnconfirmedIn.reduce(
                (acc, item) => {
                    const fromAddress = getBiggestBtcIOAddress(item.tx.vin.filter(v => !v.isOwn));
                    const isSafe = accessibleBtcWallets.some(w => w.address === fromAddress);
                    if (isSafe) {
                        return { ...acc, safe: acc.safe.concat(item) };
                    } else {
                        return { ...acc, unsafe: acc.unsafe.concat(item) };
                    }
                },
                { safe: [], unsafe: [] } as {
                    safe: BtcApiUtxoWithTx[];
                    unsafe: BtcApiUtxoWithTx[];
                }
            );

            const patchedSafe = pendingTxsService.toUnconfirmedInSafe(serverSafe);

            const getTotal = (utxos: { value: string }[]) =>
                utxos.reduce(
                    (acc, tx) => acc.amountAdd(BtcAssetAmount.fromWeiAmount(tx.value)),
                    BtcAssetAmount.fromWeiAmount('0')
                );

            return {
                confirmedIn: {
                    totalAmount: getTotal(confirmedIn),
                    utxos: confirmedIn
                },
                unconfirmedInSafe: {
                    totalAmount: getTotal(patchedSafe),
                    utxos: patchedSafe
                },
                unconfirmedInUnsafe: {
                    totalAmount: getTotal(unsafe),
                    utxos: unsafe
                },
                unconfirmedOut: {
                    totalAmount: getTotal(unconfirmedOutUtxos),
                    utxos: unconfirmedOutUtxos
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
            display: utxos.confirmedIn.totalAmount
                .amountAdd(utxos.unconfirmedInSafe.totalAmount)
                .amountSub(utxos.unconfirmedOut.totalAmount),
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
            return {
                in: u.confirmedIn.utxos.concat(u.unconfirmedInSafe.utxos),
                pendingOut: u.unconfirmedOut.utxos
            };
        }
    });
}
