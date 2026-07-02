import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { BtcWallet, RequiredProperties } from '@safely/core';
import { BtcAssetAmount } from '@safely/core';
import type { BtcApi, BtcApiUtxoWithOptionalTx } from '@safely/core/api/btc';

import {
    QUERIES_REFETCH_INTERVAL,
    useBtcApi,
    useGetBtcApi,
    useDerivedQuery,
    usePersistQuery
} from '../../shared';
import { useActiveAccountQuery } from '../account';
import {
    isDerivablePortfolio,
    resolveBtcWallets,
    useActiveBtcWallet,
    usePortfolios
} from '../portfolio';
import { utxo } from './keys';
import {
    BroadcastedBtcTxService,
    getLastBroadcastedBtcTxForWallet
} from './last-broadcasted-btc-tx';
import { getBiggestBtcIOAddress } from '../activity/api';

function useAccessibleBtcWallets() {
    const portfolios = usePortfolios();
    return useMemo(
        () => portfolios.filter(isDerivablePortfolio).flatMap(resolveBtcWallets),
        [portfolios]
    );
}

const isConfirmed = (u: { confirmations: number }) => u.confirmations > 0;

function getTotal(utxos: { value: string }[]) {
    return utxos.reduce(
        (acc, tx) => acc.amountAdd(BtcAssetAmount.fromWeiAmount(tx.value)),
        BtcAssetAmount.fromWeiAmount('0')
    );
}

function btcWalletUtxoOptions(deps: {
    api: BtcApi;
    accessibleBtcWallets: BtcWallet[];
    accountId: string | undefined;
    btcWallet: BtcWallet;
}) {
    const { api, accessibleBtcWallets, accountId, btcWallet } = deps;

    return {
        queryKey: utxo.wallet(btcWallet).params({ api }).toKey(),
        queryFn: async () => {
            const utxos = await api.getUtxos(btcWallet, true);

            const serverConfirmed = utxos.filter(isConfirmed);
            const unconfirmed = utxos.filter(u => !isConfirmed(u));

            const { safe: serverSafe, unsafe: serverUnsafe } = unconfirmed.reduce(
                (acc, item) => {
                    if (!item.tx) {
                        return { ...acc };
                    }
                    const externalInputs = item.tx.vin.filter(v => !v.isOwn);
                    const fromAddress = getBiggestBtcIOAddress(externalInputs);
                    const isSafe =
                        externalInputs.length === 0 ||
                        accessibleBtcWallets.some(w => w.address === fromAddress);
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

            const lastBroadcastedBtcTx = accountId
                ? getLastBroadcastedBtcTxForWallet(accountId, btcWallet)
                : null;

            const service = new BroadcastedBtcTxService(lastBroadcastedBtcTx, btcWallet.address, {
                serverConfirmed,
                serverSafe,
                serverUnsafe
            });

            const confirmed = service.confirmed;
            const safe = service.unconfirmedSafe;

            return {
                confirmed: { totalAmount: getTotal(confirmed), utxos: confirmed },
                unconfirmedSafe: { totalAmount: getTotal(safe), utxos: safe },
                unconfirmedUnsafe: {
                    totalAmount: getTotal(serverUnsafe),
                    utxos: serverUnsafe
                },
                hasLocalNotBroadcastedCache: service.hasLocalNotBroadcastedCache
            };
        },
        schemaKey: 'sBtcWalletUtxos' as const,
        refetchInterval: QUERIES_REFETCH_INTERVAL.UTXO
    };
}

export function useBtcWalletUtxo(btcWallet: BtcWallet) {
    const api = useBtcApi(btcWallet.network);
    const { data: account } = useActiveAccountQuery();
    const accessibleBtcWallets = useAccessibleBtcWallets();

    return usePersistQuery(
        btcWalletUtxoOptions({
            api,
            accessibleBtcWallets,
            accountId: account?.accountId,
            btcWallet
        })
    );
}

export function sumBtcDisplay(
    balances: ReturnType<typeof useBtcWalletBalances>
): BtcAssetAmount | null {
    let total = BtcAssetAmount.fromWeiAmount('0');

    for (const balance of balances) {
        if (balance === undefined) {
            return null;
        }

        total = total.amountAdd(balance.display);
    }

    return total;
}

export function useBtcWalletBalances(wallets: BtcWallet[]) {
    const { data: account } = useActiveAccountQuery();
    const getBtcApi = useGetBtcApi();
    const accessibleBtcWallets = useAccessibleBtcWallets();

    return useQueries({
        queries: wallets.map(btcWallet => {
            const { schemaKey, ...rest } = btcWalletUtxoOptions({
                api: getBtcApi(btcWallet.network),
                accessibleBtcWallets,
                accountId: account?.accountId,
                btcWallet
            });

            return {
                ...rest,
                meta: {
                    persist: true,
                    schemaKey
                }
            };
        }),
        combine: results =>
            results.map(r =>
                r.data
                    ? {
                          display: r.data.confirmed.totalAmount.amountAdd(
                              r.data.unconfirmedSafe.totalAmount
                          ),
                          pending: r.data.unconfirmedUnsafe.totalAmount
                      }
                    : undefined
            )
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
    const { data } = useActiveBtcWalletUtxo();
    return data?.hasLocalNotBroadcastedCache === true;
}
