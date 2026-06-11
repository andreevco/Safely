import { memo } from 'react';
import { View } from 'react-native';

import type { ContactMeta, PortfolioMeta, RampOrder } from '@safely/core';
import type { ActivityItem as ActivityItemData, BtcActivityItem } from '@safely/ux';
import { isOrderActivityItem } from '@safely/ux';

import { ContactName } from '@mobile/entities/contact';
import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, Text } from '@mobile/shared/ui';

import { styles } from './ActivityItem.styles';

export type ActivityItemCounterparty =
    | { kind: 'contact'; meta: ContactMeta }
    | { kind: 'portfolio'; meta: PortfolioMeta }
    | { kind: 'address'; label: string };

export type ActivityItemProps = {
    activity: ActivityItemData;
    title: string;
    amountSign: '+' | '−';
    formattedValue: string;
    valueColor: 'primary' | 'accentGreen';
    formattedFiat: string | null;
    timestampLabel: string | null;
    background: 'tertiary' | 'secondary';
    counterparty: ActivityItemCounterparty;
    onNavigateToTransaction: (activity: BtcActivityItem) => void;
    onNavigateToOrder: (order: RampOrder) => void;
};

const Counterparty = ({ counterparty }: { counterparty: ActivityItemCounterparty }) => {
    switch (counterparty.kind) {
        case 'contact':
            return (
                <ContactName
                    meta={counterparty.meta}
                    size={12}
                    gap={6}
                    fontVariant="bodyM"
                    color="secondary"
                />
            );
        case 'portfolio':
            return (
                <PortfolioName
                    meta={counterparty.meta}
                    size={12}
                    gap={6}
                    fontVariant="bodyM"
                    color="secondary"
                />
            );
        case 'address':
            return <Cell.Subtitle color="secondary">{counterparty.label}</Cell.Subtitle>;
    }
};

export const ActivityItem = memo((props: ActivityItemProps) => {
    const {
        activity,
        title,
        amountSign,
        formattedValue,
        valueColor,
        formattedFiat,
        timestampLabel,
        background,
        counterparty,
        onNavigateToTransaction,
        onNavigateToOrder
    } = props;

    return (
        <Cell
            containerStyle={styles.border}
            background={background}
            showDivider={false}
            onPress={() =>
                isOrderActivityItem(activity)
                    ? onNavigateToOrder(activity.order)
                    : onNavigateToTransaction(activity)
            }
        >
            <Cell.Content>
                <Cell.Row>
                    <View style={styles.titleWithTimestamp}>
                        <Cell.Title>{title}</Cell.Title>
                        {timestampLabel !== null && (
                            <Text color="tertiary" style={styles.timestamp}>
                                {timestampLabel}
                            </Text>
                        )}
                    </View>
                    <Cell.Value color={valueColor}>
                        {amountSign} {formattedValue}
                    </Cell.Value>
                </Cell.Row>
                <Cell.Row>
                    <Counterparty counterparty={counterparty} />
                    <Cell.Subvalue>{formattedFiat}</Cell.Subvalue>
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
});
