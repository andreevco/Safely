import { useMemo } from 'react';

import {
    assertUnreachable,
    BtcApiUtxo,
    BtcAssetAmount,
    BtcWallet,
    PortfolioType
} from '@safely/core';

import { QUERIES_REFETCH_INTERVAL, useBtcApi, usePersistQuery } from '../../shared';
import { useActiveBtcWallet, usePortfolios } from '../portfolio';
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

export function useBtcWalletUtxo(btcWallet: BtcWallet) {
    const client = useBtcApi();
    const accessibleBtcWallets = useAccessibleBtcWallets();

    return usePersistQuery({
        queryKey: utxo.wallet(btcWallet).api(client).toKey(),
        async queryFn() {
            const [confirmedBalance, unconfirmedIn, txHistory] = await Promise.all([
                client.getXpub(btcWallet),
                client.getAccountUnconfirmedUtxo(btcWallet),
                client.getXpub(
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

            const unconfirmedOut =
                txHistory.transactions?.filter(
                    tx => tx.vin?.some(input => input.isOwn) && tx.confirmations < 1
                ) ?? [];

            const { safe, unsafe } = unconfirmedIn.reduce(
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
                    safe: BtcApiUtxo[];
                    unsafe: BtcApiUtxo[];
                }
            );

            const getTotal = (utxos: { value: string }[]) =>
                utxos.reduce(
                    (acc, tx) => acc.amountAdd(BtcAssetAmount.fromWeiAmount(tx.value)),
                    BtcAssetAmount.fromWeiAmount('0')
                );

            return {
                confirmedIn: {
                    totalAmount: BtcAssetAmount.fromWeiAmount(confirmedBalance.balance)
                },
                unconfirmedInSafe: {
                    totalAmount: getTotal(safe),
                    utxos: safe
                },
                unconfirmedInUnsafe: {
                    totalAmount: getTotal(unsafe),
                    utxos: unsafe
                },
                unconfirmedOut: {
                    totalAmount: getTotal(unconfirmedOut),
                    txs: unconfirmedOut
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

export function useActiveBtcWalletUtxo() {
    const wallet = useActiveBtcWallet();
    return useBtcWalletUtxo(wallet);
}
