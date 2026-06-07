import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { BtcWallet, RequiredProperties } from '@safely/core';
import { assertUnreachable, BtcAssetAmount, PortfolioType } from '@safely/core';
import type { BtcApi, BtcApiUtxoWithOptionalTx } from '@safely/core/api/btc';

import {
    QUERIES_REFETCH_INTERVAL,
    useBtcApi,
    useDerivedQuery,
    usePersistQuery
} from '../../shared';
import { useActiveAccount } from '../account';
import { resolveBtcWallet, useActiveBtcWallet, usePortfolios } from '../portfolio';
import { utxo } from './keys';
import {
    BroadcastedBtcTxService,
    getLastBroadcastedBtcTxForWallet
} from './last-broadcasted-btc-tx';
import { getBiggestBtcIOAddress } from '../activity/api';

function useAccessibleBtcWallets() {
    const portfolios = usePortfolios();
    return useMemo(
        () =>
            portfolios
                .filter(p => {
                    switch (p.type) {
                        case PortfolioType.BIP39:
                        case PortfolioType.LEDGER:
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

function btcWalletUtxoOptions(deps: {
    api: BtcApi;
    accessibleBtcWallets: BtcWallet[];
    accountId: string;
    btcWallet: BtcWallet;
}) {
    const { api, accessibleBtcWallets, accountId, btcWallet } = deps;

    return {
        queryKey: utxo.wallet(btcWallet).params({ api }).toKey(),
        queryFn: async () => {
            const utxos = await api.getUtxos(btcWallet, true);

            const serverConfirmed = utxos.filter(u => u.confirmations > 0);
            const unconfirmed = utxos.filter(u => u.confirmations === 0);

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

            const lastBroadcastedBtcTx = getLastBroadcastedBtcTxForWallet(accountId, btcWallet);

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
    const api = useBtcApi();
    const account = useActiveAccount();
    const accessibleBtcWallets = useAccessibleBtcWallets();

    return usePersistQuery(
        btcWalletUtxoOptions({
            api,
            accessibleBtcWallets,
            accountId: account.accountId,
            btcWallet
        })
    );
}

export function useBtcBalances(wallets: BtcWallet[]) {
    const api = useBtcApi();
    const accessibleBtcWallets = useAccessibleBtcWallets();
    const account = useActiveAccount();

    return useQueries({
        queries: wallets.map(btcWallet => {
            const { schemaKey, ...rest } = btcWalletUtxoOptions({
                api,
                accessibleBtcWallets,
                accountId: account.accountId,
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
        combine: results => {
            let total = BtcAssetAmount.fromWeiAmount('0');

            for (const r of results) {
                if (r.data === undefined) return null;

                total = total.amountAdd(
                    r.data.confirmed.totalAmount.amountAdd(r.data.unconfirmedSafe.totalAmount)
                );
            }

            return total;
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
    const { data } = useActiveBtcWalletUtxo();
    return data?.hasLocalNotBroadcastedCache === true;
}
