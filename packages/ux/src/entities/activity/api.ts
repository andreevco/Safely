import { BtcApi } from '@safely/core';
import { BTC_ASSET, BtcWallet, CryptoAssetAmount } from '@safely/core';
import { toBig, toBigOrZero } from '@safely/core';

import { ActivityPage, BtcActivityItem, IActivityFilters } from './types';

const ON_PAGE_ELEMENTS_LIMIT = 25;

export async function fetchBtcActivity(
    btcApi: BtcApi,
    wallet: Pick<BtcWallet, 'type' | 'xpub'>,
    page: number,
    filters: IActivityFilters
): Promise<ActivityPage> {
    const pageNum = page >= 1 ? page : 1;

    const addressData = await btcApi.getXpub(
        {
            ...wallet,
            derivationPath: {
                change: 0,
                addressIndex: '*'
            }
        },
        {
            details: 'txs',
            page: pageNum,
            pageSize: ON_PAGE_ELEMENTS_LIMIT
        }
    );

    if (!addressData?.transactions || addressData.transactions.length === 0) {
        return { items: [], hasNextPage: false };
    }

    const items: BtcActivityItem[] = addressData.transactions
        .map(tx => {
            const isInitiator = !!tx.vin?.some(input => input.isOwn);
            const fromAddress = tx.vin
                .filter(v => Boolean(v.isOwn) === isInitiator)
                .slice()
                .sort((a, b) => toBigOrZero(b.value).cmp(toBigOrZero(a.value)))[0]?.addresses?.[0];

            const toAddress = tx.vout
                .filter(v => Boolean(v.isOwn) === !isInitiator)
                .slice()
                .sort((a, b) => toBigOrZero(b.value).cmp(toBigOrZero(a.value)))[0]?.addresses[0];

            if (!fromAddress || !toAddress) {
                return null;
            }

            const weiAmount = tx.vout
                .filter(v => Boolean(v.isOwn) === !isInitiator)
                .reduce((acc, v) => acc.plus(toBigOrZero(v.value)), toBig(0));

            return {
                timestamp: (tx.blockTime || 0) * 1000,
                key: tx.txid,
                transaction: {
                    isInitiator,
                    fromAddress,
                    toAddress,
                    value: new CryptoAssetAmount({ asset: BTC_ASSET, weiAmount }),
                    raw: tx
                }
            };
        })
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
