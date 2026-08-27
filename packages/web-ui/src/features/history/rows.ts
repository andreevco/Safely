import { GROUP_LABEL, assertUnreachable, ellipsisMiddle } from '@safely/core';
import type {
    useActivePortfolioRate,
    useActualBtcBlockNumber,
    useContacts,
    useNumberFormatter,
    usePortfolios
} from '@safely/ux';
import {
    type ActivityItem,
    type ActivityItemsDatedGroup,
    type BtcActivityItem,
    type DateFormatter,
    type OrderActivityItem,
    type TranslateFn,
    findContactMetaByAddress,
    findPortfolioMetaByAddress,
    getBtcTransactionDisplayStatus,
    getDateGroupTitle,
    isRampOrderActive,
    resolveSentAmount
} from '@safely/ux';

import type { ActivityItemProps } from '../../entities';

export type ActivityRow = ActivityItemProps & { key: string };

export type HistoryGroup = {
    key: string;
    title: string;
    rows: ActivityRow[];
};

export type ActivityRowContext = {
    t: TranslateFn;
    groupFormatter: DateFormatter;
    timeFormatter: DateFormatter;
    dayMonthFormatter: DateFormatter;
    numberFormatter: ReturnType<typeof useNumberFormatter>;
    portfolios: ReturnType<typeof usePortfolios>;
    contacts: ReturnType<typeof useContacts>;
    rateData: ReturnType<typeof useActivePortfolioRate>['data'];
    currentBlockNumber: ReturnType<typeof useActualBtcBlockNumber>['data'];
    showFullSentAmount: boolean;
    onSelectActivity: (activity: ActivityItem) => void;
};

type TimeFormatDetails = 'time' | 'day-month-time';

const timeFormatDetailsByGroupLabel: Record<GROUP_LABEL, TimeFormatDetails> = {
    [GROUP_LABEL.PENDING]: 'time',
    [GROUP_LABEL.TODAY]: 'time',
    [GROUP_LABEL.YESTERDAY]: 'time',
    [GROUP_LABEL.THIS_MONTH]: 'time',
    [GROUP_LABEL.THIS_YEAR]: 'day-month-time',
    [GROUP_LABEL.PAST_YEAR]: 'day-month-time'
};

const formatTimestampLabel = (
    timestamp: number,
    timeFormatDetails: TimeFormatDetails,
    context: ActivityRowContext
): string =>
    timeFormatDetails === 'time'
        ? context.timeFormatter.format(timestamp)
        : context.dayMonthFormatter.format(timestamp);

const buildTransactionRow = (
    activity: BtcActivityItem,
    groupKey: string,
    timeFormatDetails: TimeFormatDetails,
    context: ActivityRowContext
): ActivityRow => {
    const isInitiator = activity.transaction.isInitiator;
    const displayStatus = getBtcTransactionDisplayStatus(
        activity.transaction.raw,
        context.currentBlockNumber
    );
    const isPending = displayStatus.type === 'pending';

    const title = isPending
        ? isInitiator
            ? context.t('history.transactionInfo.sending')
            : context.t('history.transactionInfo.receiving')
        : isInitiator
          ? context.t('history.transactionInfo.sent')
          : context.t('history.transactionInfo.received');

    const { amount, isFullPrecision } = resolveSentAmount({
        isInitiator,
        value: activity.transaction.value,
        fee: activity.transaction.fee?.amount,
        showFullSentAmount: context.showFullSentAmount
    });
    const formattedValue = amount.format(context.numberFormatter, {
        fullPrecision: isFullPrecision
    });
    const formattedFiat = context.rateData
        ? amount.convert(context.rateData).format(context.numberFormatter)
        : null;

    const counterpartyAddress = isInitiator
        ? activity.transaction.toAddress
        : activity.transaction.fromAddress;
    const portfolioMeta = findPortfolioMetaByAddress(context.portfolios, counterpartyAddress);
    const contactMeta = findContactMetaByAddress(context.contacts, counterpartyAddress);
    const counterparty: ActivityRow['counterparty'] = contactMeta
        ? { kind: 'contact', meta: contactMeta }
        : portfolioMeta
          ? { kind: 'portfolio', meta: portfolioMeta }
          : { kind: 'address', label: ellipsisMiddle(counterpartyAddress, 6) };

    return {
        key: `${groupKey}-${activity.key}`,
        title,
        amountSign: isInitiator ? '−' : '+',
        formattedValue,
        valueTone: isInitiator ? 'primary' : 'accentGreen',
        formattedFiat,
        timestampLabel: isPending
            ? null
            : formatTimestampLabel(activity.timestamp, timeFormatDetails, context),
        isPending,
        counterparty,
        onSelect: () => context.onSelectActivity(activity)
    };
};

const buildOrderRow = (
    activity: OrderActivityItem,
    groupKey: string,
    timeFormatDetails: TimeFormatDetails,
    context: ActivityRowContext
): ActivityRow => {
    const { order } = activity;
    const isPending = isRampOrderActive(order);
    const isSale = order.type === 'offramp';
    const isUnsuccessful = !isPending && order.status !== 'completed';

    const formattedFiat = context.rateData
        ? activity.cryptoAmount?.convert(context.rateData).format(context.numberFormatter)
        : null;

    const title = (() => {
        switch (order.status) {
            case 'failed':
                return isSale
                    ? context.t('history.orderInfo.sale.failed')
                    : context.t('history.orderInfo.purchase.failed');
            case 'expired':
                return isSale
                    ? context.t('history.orderInfo.sale.cancelled')
                    : context.t('history.orderInfo.purchase.cancelled');
            default:
                return isSale
                    ? context.t('history.orderInfo.sale.default')
                    : context.t('history.orderInfo.purchase.default');
        }
    })();

    const amountSign: ActivityRow['amountSign'] = (() => {
        if (isUnsuccessful) return null;

        return isSale ? '−' : '+';
    })();

    const valueTone: ActivityRow['valueTone'] = (() => {
        if (isUnsuccessful) return 'tertiary';

        return isSale ? 'primary' : 'accentGreen';
    })();

    return {
        key: `${groupKey}-${activity.key}`,
        title,
        amountSign,
        formattedValue: activity.cryptoAmount?.format(context.numberFormatter) ?? '-',
        valueTone,
        formattedFiat: formattedFiat ?? null,
        timestampLabel: isPending
            ? null
            : formatTimestampLabel(activity.timestamp, timeFormatDetails, context),
        isPending,
        counterparty: { kind: 'provider', label: order.provider },
        onSelect: () => context.onSelectActivity(activity)
    };
};

const buildActivityRow = (
    activity: ActivityItem,
    groupKey: string,
    timeFormatDetails: TimeFormatDetails,
    context: ActivityRowContext
): ActivityRow => {
    switch (activity.type) {
        case 'transaction':
            return buildTransactionRow(activity, groupKey, timeFormatDetails, context);
        case 'order':
            return buildOrderRow(activity, groupKey, timeFormatDetails, context);
        default:
            return assertUnreachable(activity as never);
    }
};

export function buildHistoryGroups(
    groups: ActivityItemsDatedGroup[],
    context: ActivityRowContext
): HistoryGroup[] {
    return groups.map(group => {
        const { key, meta, items } = group;
        const timeFormatDetails = timeFormatDetailsByGroupLabel[meta.label];

        return {
            key,
            title: getDateGroupTitle(meta, context.t, context.groupFormatter),
            rows: items.map(activity => buildActivityRow(activity, key, timeFormatDetails, context))
        };
    });
}
