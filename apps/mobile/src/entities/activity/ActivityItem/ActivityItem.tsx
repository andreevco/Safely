/* eslint-disable no-irregular-whitespace */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BTC_ASSET, ellipsisMiddle } from '@safely/core';
import {
    type BtcActivityItem,
    findPortfolioMetaByAddress,
    findContactMetaByAddress,
    useBtcTransactionDisplayStatus,
    useDateFormatter,
    useNumberFormatter,
    usePortfolios,
    useRate,
    useContacts
} from '@safely/ux';

import { ContactName } from '@mobile/entities/contact';
import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, Text } from '@mobile/shared/ui';

import { styles } from './ActivityItem.styles';

export type ActivityItemTimeFormatDetails = 'time' | 'day-month-time';

type ActivityItemProps = {
    activity: BtcActivityItem;
    timeFormatDetails: ActivityItemTimeFormatDetails;
    onNavigateToTransaction: (activity: BtcActivityItem) => void;
};

const ActivityItemContent = (props: ActivityItemProps) => {
    const { activity, onNavigateToTransaction, timeFormatDetails } = props;
    const formatter = useNumberFormatter();
    const rate = useRate(BTC_ASSET);
    const { t } = useTranslation();
    const portfolios = usePortfolios();
    const contacts = useContacts();
    const isInitiator = activity.transaction.isInitiator;
    const dateFormatter = useDateFormatter({ hour: 'numeric', minute: 'numeric' });
    const counterpartyAddress = isInitiator
        ? activity.transaction.toAddress
        : activity.transaction.fromAddress;
    const counterpartyPortfolioMeta = findPortfolioMetaByAddress(portfolios, counterpartyAddress);
    const counterpartyContactMeta = findContactMetaByAddress(contacts, counterpartyAddress);

    const status = useBtcTransactionDisplayStatus(activity.transaction.raw);

    const title = useMemo(() => {
        if (status.type === 'pending') {
            if (isInitiator) {
                return t('history.transactionInfo.sending');
            } else {
                return t('history.transactionInfo.receiving');
            }
        }
        return isInitiator
            ? t('history.transactionInfo.sent')
            : t('history.transactionInfo.received');
    }, [status.type, isInitiator, t]);

    const CounterpartyName = useMemo(() => {
        if (counterpartyContactMeta) {
            return (
                <ContactName
                    meta={counterpartyContactMeta}
                    size={12}
                    gap={6}
                    fontVariant="bodyM"
                    color="secondary"
                />
            );
        }
        if (counterpartyPortfolioMeta) {
            return (
                <PortfolioName
                    meta={counterpartyPortfolioMeta}
                    size={12}
                    gap={6}
                    fontVariant="bodyM"
                    color="secondary"
                />
            );
        }
        return (
            <Cell.Subtitle color="secondary">
                {ellipsisMiddle(counterpartyAddress, 6)}
            </Cell.Subtitle>
        );
    }, [counterpartyPortfolioMeta, counterpartyContactMeta, counterpartyAddress]);

    return (
        <Cell
            containerStyle={styles.border}
            background={status.type === 'pending' ? 'tertiary' : 'secondary'}
            showDivider={false}
            onPress={() => onNavigateToTransaction(activity)}
        >
            <Cell.Content>
                <Cell.Row>
                    <View style={styles.titleWithTimestamp}>
                        <Cell.Title>{title}</Cell.Title>
                        {status.type !== 'pending' && (
                            <Text color="tertiary" style={styles.timestamp}>
                                {timeFormatDetails === 'time'
                                    ? dateFormatter.format(activity.timestamp)
                                    : dateFormatter({ day: 'numeric', month: 'short' }).format(
                                          activity.timestamp
                                      )}
                            </Text>
                        )}
                    </View>
                    <Cell.Value color={isInitiator ? 'primary' : 'accentGreen'}>
                        {isInitiator ? '−' : '+'} {activity.transaction.value.format(formatter)}
                    </Cell.Value>
                </Cell.Row>
                <Cell.Row>
                    {CounterpartyName}
                    <Cell.Subvalue>
                        {rate.data &&
                            activity.transaction.value.convert(rate.data).format(formatter)}
                    </Cell.Subvalue>
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};

export const ActivityItem = (props: ActivityItemProps) => {
    return <ActivityItemContent {...props} />;
};
