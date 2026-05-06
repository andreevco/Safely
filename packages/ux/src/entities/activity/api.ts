import type {
    BtcApi,
    BtcApiTx,
    BtcAsset,
    BtcWalletReadOnly,
    TransactionFeeCrypto
} from '@safely/core';
import { BtcAssetAmount, toBig, toBigOrZero } from '@safely/core';

import type { ActivityPage, BtcActivityItem, IActivityFilters } from './types';

const ON_PAGE_ELEMENTS_LIMIT = 25;

export function getBiggestBtcIOAddress(io: BtcApiTx['vin' | 'vout']) {
    return io.slice().sort((a, b) => toBigOrZero(b.value).cmp(toBigOrZero(a.value)))[0]
        ?.addresses?.[0];
}
export function btcTxToActivityItem(tx: BtcApiTx): BtcActivityItem | null {
    const isInitiator = !!tx.vin?.some(input => input.isOwn);

    const fromAddress = getBiggestBtcIOAddress(
        tx.vin.filter(v => Boolean(v.isOwn) === isInitiator)
    );

    const toAddress =
        getBiggestBtcIOAddress(tx.vout.filter(v => Boolean(v.isOwn) === !isInitiator)) ??
        getBiggestBtcIOAddress(tx.vout);

    if (!fromAddress || !toAddress) {
        return null;
    }

    const weiAmount = tx.vout
        .filter(v => Boolean(v.isOwn) === !isInitiator)
        .reduce((acc, v) => acc.plus(toBigOrZero(v.value)), toBig(0));

    let fee: TransactionFeeCrypto<BtcAsset> | undefined;
    try {
        if (tx.fees) {
            fee = {
                type: 'crypto',
                amount: BtcAssetAmount.fromWeiAmount(tx.fees)
            };
        }
    } catch {
        //
    }

    return {
        timestamp: (tx.blockTime || 0) * 1000,
        key: tx.txid,
        transaction: {
            isInitiator,
            fromAddress,
            toAddress,
            value: BtcAssetAmount.fromWeiAmount(weiAmount),
            fee,
            raw: tx
        }
    };
}

export async function fetchBtcActivity(
    btcApi: BtcApi,
    wallet: Pick<BtcWalletReadOnly, 'type' | 'xpub' | 'address'>,
    page: number,
    filters: IActivityFilters
): Promise<ActivityPage> {
    const pageNum = page >= 1 ? page : 1;

    const addressData = await btcApi.getAddressInfo(wallet, {
        details: 'txs',
        page: pageNum,
        pageSize: ON_PAGE_ELEMENTS_LIMIT
    });

    if (!addressData?.transactions || addressData.transactions.length === 0) {
        return { items: [], hasNextPage: false };
    }

    const items: BtcActivityItem[] = addressData.transactions
        .map(btcTxToActivityItem)
        .filter((item): item is BtcActivityItem => item !== null)
        .filter(tx => {
            if (filters.isInitiator !== undefined) {
                return tx.transaction.isInitiator === filters.isInitiator;
            }
            return true;
        });

    const currentPage = addressData.page ?? 1;
    const totalPages = addressData.totalPages ?? 0;
    const hasNextPage = totalPages > 0 && currentPage < totalPages;

    return { items, hasNextPage };
}
