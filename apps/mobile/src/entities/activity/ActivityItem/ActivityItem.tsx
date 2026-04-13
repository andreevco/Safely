/* eslint-disable no-irregular-whitespace */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BTC_ASSET, ellipsisMiddle } from '@safely/core';
import {
    type BtcActivityItem,
    findPortfolioMetaByAddress,
    useBtcTransactionDisplayStatus,
    useDateFormatter,
    useNumberFormatter,
    usePortfolios,
    useRate
} from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, Text } from '@mobile/shared/ui';

import { styles } from './ActivityItem.styles';

export type ActivityItemTimeFormatDetails = 'time' | 'day-month-time';

type ActivityItemProps = {
    activity: BtcActivityItem;
    timeFormatDetails: ActivityItemTimeFormatDetails;
    onNavigateToTransaction: (activity: BtcActivityItem) => void;
};

export const ActivityItem = (props: ActivityItemProps) => {
    const { activity, onNavigateToTransaction, timeFormatDetails } = props;
    const formatter = useNumberFormatter();
    const rate = useRate(BTC_ASSET);
    const { t } = useTranslation();
    const portfolios = usePortfolios();

    const isInitiator = activity.transaction.isInitiator;
    const dateFormatter = useDateFormatter({ hour: 'numeric', minute: 'numeric' });
    const counterpartyAddress = isInitiator
        ? activity.transaction.toAddress
        : activity.transaction.fromAddress;
    const counterpartyMeta = findPortfolioMetaByAddress(portfolios, counterpartyAddress);

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

    return (
        <View style={styles.border}>
            <Cell
                background={status.type === 'pending' ? 'tertiary' : 'secondary'}
                showDivider={false}
                onPress={() => onNavigateToTransaction(activity)}
            >
                <Cell.Content>
                    <Cell.Row>
                        <View style={styles.titleWithTimestamp}>
                            <Cell.Title>{title}</Cell.Title>
                            <Text color="tertiary" style={styles.timestamp}>
                                {timeFormatDetails === 'time'
                                    ? dateFormatter.format(activity.timestamp)
                                    : dateFormatter({ day: 'numeric', month: 'short' }).format(
                                          activity.timestamp
                                      )}
                            </Text>
                        </View>
                        <Cell.Value
                            color={
                                status.type === 'pending' || isInitiator ? 'primary' : 'accentGreen'
                            }
                        >
                            {isInitiator ? '−' : '+'} {activity.transaction.value.format(formatter)}
                        </Cell.Value>
                    </Cell.Row>
                    <Cell.Row>
                        {counterpartyMeta ? (
                            <PortfolioName
                                meta={counterpartyMeta}
                                size={12}
                                gap={6}
                                fontVariant="bodyM"
                                color="secondary"
                            />
                        ) : (
                            <Cell.Subtitle color="secondary">
                                {ellipsisMiddle(counterpartyAddress, 6)}
                            </Cell.Subtitle>
                        )}
                        <Cell.Subvalue>
                            {rate.data &&
                                activity.transaction.value.convert(rate.data).format(formatter)}
                        </Cell.Subvalue>
                    </Cell.Row>
                </Cell.Content>
            </Cell>
        </View>
    );
};
