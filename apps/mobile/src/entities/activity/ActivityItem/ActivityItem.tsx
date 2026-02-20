/* eslint-disable no-irregular-whitespace */
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BTC_ASSET, ellipsisMiddle } from '@safely/core';
import { type BtcActivityItem, useDateFormatter, useNumberFormatter, useRate } from '@safely/ux';

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

    const isInitiator = activity.transaction.isInitiator;
    const dateFormatter = useDateFormatter({ hour: 'numeric', minute: 'numeric' });

    return (
        <View style={styles.border}>
            <Cell onPress={() => onNavigateToTransaction(activity)}>
                <Cell.Content>
                    <Cell.Row>
                        <View style={styles.titleWithTimestamp}>
                            <Cell.Title>
                                {isInitiator ? t('transaction.sent') : t('transaction.received')}
                            </Cell.Title>
                            <Text color="secondary" style={styles.timestamp}>
                                {timeFormatDetails === 'time'
                                    ? dateFormatter.format(activity.timestamp)
                                    : dateFormatter({ day: 'numeric', month: 'short' }).format(
                                          activity.timestamp
                                      )}
                            </Text>
                        </View>
                        <Cell.Value color={isInitiator ? 'primary' : 'accentGreen'}>
                            {isInitiator ? '−' : '+'} {activity.transaction.value.format(formatter)}
                        </Cell.Value>
                    </Cell.Row>
                    <Cell.Row>
                        <Cell.Subtitle>
                            {ellipsisMiddle(
                                activity.transaction.isInitiator
                                    ? activity.transaction.toAddress
                                    : activity.transaction.fromAddress,
                                6
                            )}
                        </Cell.Subtitle>
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
