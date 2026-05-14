import { type TFunction } from 'i18next';

import { ellipsisMiddle } from '@safely/core';
import {
    type ActivityItemsDatedGroupMeta,
    type BtcActivityItem,
    type DateFormatter,
    ACTIVITY_GROUP_LABEL,
    findContactMetaByAddress,
    findPortfolioMetaByAddress,
    getBtcTransactionDisplayStatus,
    useActualBtcBlockNumber,
    useContacts,
    useNumberFormatter,
    usePortfolios,
    useRate
} from '@safely/ux';

import { type ActivityItemProps } from '@mobile/entities/activity';

export type HistoryHeaderRow = {
    key: string;
    type: 'header';
    title: string;
};

export type HistoryActivityRow = {
    key: string;
    type: 'activity';
    activity: BtcActivityItem;
    title: string;
    amountSign: ActivityItemProps['amountSign'];
    formattedValue: string;
    valueColor: ActivityItemProps['valueColor'];
    formattedFiat: string | null;
    timestampLabel: string | null;
    background: ActivityItemProps['background'];
    counterparty: ActivityItemProps['counterparty'];
    onPress: () => void;
};

export type HistoryRowItem = HistoryHeaderRow | HistoryActivityRow;

export type ActivityRowContext = {
    t: TFunction;
    dateFormatterTime: DateFormatter;
    dateFormatterDayMonth: DateFormatter;
    numberFormatter: ReturnType<typeof useNumberFormatter>;
    portfolios: ReturnType<typeof usePortfolios>;
    contacts: ReturnType<typeof useContacts>;
    rateData: ReturnType<typeof useRate>['data'];
    currentBlockNumber: ReturnType<typeof useActualBtcBlockNumber>['data'];
    onNavigateToTransaction: (activity: BtcActivityItem) => void;
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
            return t('history.dateHeaders.pending');
        case ACTIVITY_GROUP_LABEL.TODAY:
            return t('history.dateHeaders.today');
        case ACTIVITY_GROUP_LABEL.YESTERDAY:
            return t('history.dateHeaders.yesterday');
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

export const buildActivityRow = (
    activity: BtcActivityItem,
    groupKey: string,
    timeFormatDetails: TimeFormatDetails,
    context: ActivityRowContext
): HistoryActivityRow => {
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

    const amountSign: ActivityItemProps['amountSign'] = isInitiator ? '−' : '+';
    const formattedValue = activity.transaction.value.format(context.numberFormatter);
    const formattedFiat = context.rateData
        ? activity.transaction.value.convert(context.rateData).format(context.numberFormatter)
        : null;
    const valueColor: ActivityItemProps['valueColor'] = isInitiator ? 'primary' : 'accentGreen';

    const timestampLabel = isPending
        ? null
        : timeFormatDetails === 'time'
          ? context.dateFormatterTime.format(activity.timestamp)
          : context.dateFormatterDayMonth.format(activity.timestamp);

    const counterpartyAddress = isInitiator
        ? activity.transaction.toAddress
        : activity.transaction.fromAddress;
    const portfolioMeta = findPortfolioMetaByAddress(context.portfolios, counterpartyAddress);
    const contactMeta = findContactMetaByAddress(context.contacts, counterpartyAddress);
    const counterparty: ActivityItemProps['counterparty'] = contactMeta
        ? { kind: 'contact', meta: contactMeta }
        : portfolioMeta
          ? { kind: 'portfolio', meta: portfolioMeta }
          : { kind: 'address', label: ellipsisMiddle(counterpartyAddress, 6) };

    const background: ActivityItemProps['background'] = isPending ? 'tertiary' : 'secondary';

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
        onPress: () => context.onNavigateToTransaction(activity)
    };
};
