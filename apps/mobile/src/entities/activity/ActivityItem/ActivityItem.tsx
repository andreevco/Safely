/* eslint-disable no-irregular-whitespace */
import { Cell, Text } from '@mobile/shared/ui';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BTC_ASSET, ellipsisMiddle } from '@safely/core';
import { type BtcActivityItem, useNumberFormatter, useRate } from '@safely/ux';

import { styles } from './ActivityItem.styles';

type ActivityItemProps = {
    activity: BtcActivityItem;
    onNavigateToTransaction: (activity: BtcActivityItem) => void;
};

export const ActivityItem = (props: ActivityItemProps) => {
    const { activity, onNavigateToTransaction } = props;
    const formatter = useNumberFormatter();
    const rate = useRate(BTC_ASSET);
    const { t, i18n } = useTranslation();

    const isInitiator = activity.transaction.isInitiator;

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
                                {new Date(activity.timestamp * 1000).toLocaleTimeString(
                                    i18n.language,
                                    {
                                        hour: 'numeric',
                                        minute: 'numeric'
                                    }
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
