import type { TFunction } from 'i18next';

import { assertUnreachable, ellipsisMiddle } from '@safely/core';
import type {
    useActivePortfolioRate,
    useActualBtcBlockNumber,
    useContacts,
    useNumberFormatter,
    usePortfolios
} from '@safely/ux';
import {
    type ActivityItem,
    type ActivityItemsDatedGroupMeta,
    type BtcActivityItem,
    type DateFormatter,
    type OrderActivityItem,
    ACTIVITY_GROUP_LABEL,
    findContactMetaByAddress,
    findPortfolioMetaByAddress,
    getBtcTransactionDisplayStatus,
    isRampOrderActive
} from '@safely/ux';

import type { ActivityItemProps } from '@mobile/entities/activity';

export type HistoryHeaderRow = {
    key: string;
    type: 'header';
    title: string;
};

export type ActivityRow = ActivityItemProps & {
    key: string;
    type: 'activity';
};

export type HistoryRowItem = HistoryHeaderRow | ActivityRow;

export type ActivityRowContext = {
    t: TFunction;
    dateFormatterTime: DateFormatter;
    dateFormatterDayMonth: DateFormatter;
    numberFormatter: ReturnType<typeof useNumberFormatter>;
    portfolios: ReturnType<typeof usePortfolios>;
    contacts: ReturnType<typeof useContacts>;
    rateData: ReturnType<typeof useActivePortfolioRate>['data'];
    currentBlockNumber: ReturnType<typeof useActualBtcBlockNumber>['data'];
    onNavigateToActivityItem: (activity: ActivityItem) => void;
};

export type TimeFormatDetails = 'time' | 'day-month-time';

export const timeFormatDetailsByGroupLabel: Record<ACTIVITY_GROUP_LABEL, TimeFormatDetails> = {
    [ACTIVITY_GROUP_LABEL.PENDING]: 'time',
    [ACTIVITY_GROUP_LABEL.TODAY]: 'time',
    [ACTIVITY_GROUP_LABEL.YESTERDAY]: 'time',
    [ACTIVITY_GROUP_LABEL.THIS_MONTH]: 'time',
    [ACTIVITY_GROUP_LABEL.THIS_YEAR]: 'day-month-time',
    [ACTIVITY_GROUP_LABEL.PAST_YEAR]: 'day-month-time'
};

export const getGroupKey = (meta: ActivityItemsDatedGroupMeta): string => JSON.stringify(meta);

const getGroupTitle = (
    meta: ActivityItemsDatedGroupMeta,
    t: TFunction,
    formatter: DateFormatter
): string => {
    switch (meta.label) {
        case ACTIVITY_GROUP_LABEL.PENDING:
            return t('dateGroups.pending');
        case ACTIVITY_GROUP_LABEL.TODAY:
            return t('dateGroups.today');
        case ACTIVITY_GROUP_LABEL.YESTERDAY:
            return t('dateGroups.yesterday');
        case ACTIVITY_GROUP_LABEL.THIS_MONTH: {
            const date = new Date(meta.year, meta.month, meta.day);
            return formatter({ month: 'long', day: 'numeric' }).format(date);
        }
        case ACTIVITY_GROUP_LABEL.THIS_YEAR: {
            const date = new Date(meta.year, meta.month, 1);
            return formatter({ month: 'long' }).format(date);
        }
        case ACTIVITY_GROUP_LABEL.PAST_YEAR: {
            const date = new Date(meta.year, meta.month, 1);
            return formatter({ month: 'long', year: 'numeric' }).format(date);
        }
    }
};

export const buildHeaderRow = (
    meta: ActivityItemsDatedGroupMeta,
    groupKey: string,
    t: TFunction,
    groupFormatter: DateFormatter
): HistoryHeaderRow => ({
    key: `header-${groupKey}`,
    type: 'header',
    title: getGroupTitle(meta, t, groupFormatter)
});

const formatTimestampLabel = (
    timestamp: number,
    timeFormatDetails: TimeFormatDetails,
    context: ActivityRowContext
): string =>
    timeFormatDetails === 'time'
        ? context.dateFormatterTime.format(timestamp)
        : context.dateFormatterDayMonth.format(timestamp);

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

    const amountSign: ActivityRow['amountSign'] = isInitiator ? '−' : '+';
    const formattedValue = activity.transaction.value.format(context.numberFormatter);
    const formattedFiat = context.rateData
        ? activity.transaction.value.convert(context.rateData).format(context.numberFormatter)
        : null;
    const valueColor: ActivityRow['valueColor'] = isInitiator ? 'primary' : 'accentGreen';

    const timestampLabel = isPending
        ? null
        : formatTimestampLabel(activity.timestamp, timeFormatDetails, context);

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

    const background: ActivityRow['background'] = isPending ? 'tertiary' : 'secondary';

    return {
        key: `activity-${groupKey}-${activity.key}`,
        type: 'activity',
        activity,
        title,
        amountSign,
        formattedValue,
        valueColor,
        formattedFiat,
        timestampLabel,
        background,
        counterparty,
        onNavigateToActivityItem: context.onNavigateToActivityItem
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

    return {
        key: `activity-${groupKey}-${activity.key}`,
        type: 'activity',
        activity,
        title,
        amountSign: isSale ? '−' : '+',
        formattedValue: activity.cryptoAmount?.format(context.numberFormatter) ?? '-',
        valueColor: isSale || isUnsuccessful ? 'primary' : 'accentGreen',
        formattedFiat: formattedFiat ?? null,
        timestampLabel: isPending
            ? null
            : formatTimestampLabel(activity.timestamp, timeFormatDetails, context),
        background: isPending ? 'tertiary' : 'secondary',
        counterparty: {
            kind: 'provider',
            label: order.provider
        },
        onNavigateToActivityItem: context.onNavigateToActivityItem
    };
};

export function buildActivityRow(
    activity: ActivityItem,
    groupKey: string,
    timeFormatDetails: TimeFormatDetails,
    context: ActivityRowContext
): ActivityRow {
    switch (activity.type) {
        case 'transaction':
            return buildTransactionRow(activity, groupKey, timeFormatDetails, context);
        case 'order':
            return buildOrderRow(activity, groupKey, timeFormatDetails, context);
        default:
            return assertUnreachable(activity as never);
    }
}
