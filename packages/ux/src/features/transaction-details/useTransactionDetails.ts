import { BLOCKCHAIN_NAME, BTC_ASSET } from '@safely/core';

import { useBtcTransactionStatusView } from './btc-transaction-status';
import { buildTransactionDetailsView } from './transaction-details-view';
import type { TransactionDetailsView } from './types';
import type { BtcActivityItem } from '../../entities';
import { useActivePortfolioRate, useExplorer, useNumberFormatter } from '../../entities';
import { useDateFormatter, useTranslate } from '../../shared';
import { useShowFullSentAmount, useTransactionHistoryAmountOrder } from '../amount-display';

const CONFIRMED_AT_FORMAT = {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
} as const;

export function useTransactionDetails(activity: BtcActivityItem): TransactionDetailsView {
    const t = useTranslate();
    const numberFormatter = useNumberFormatter();
    const confirmedAtFormatter = useDateFormatter(CONFIRMED_AT_FORMAT);
    const { data: rate } = useActivePortfolioRate(BTC_ASSET);
    const explorer = useExplorer(BLOCKCHAIN_NAME.BTC);
    const showFullSentAmount = useShowFullSentAmount();
    const amountOrder = useTransactionHistoryAmountOrder();
    const status = useBtcTransactionStatusView(activity.transaction.raw);

    return buildTransactionDetailsView(activity, {
        t,
        confirmedAtFormatter,
        numberFormatter,
        rate,
        showFullSentAmount,
        amountOrder,
        status,
        explorerUrl: explorer.transaction(activity.transaction.raw.txid)
    });
}
