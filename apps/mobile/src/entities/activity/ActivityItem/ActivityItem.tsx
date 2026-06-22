/* eslint-disable no-irregular-whitespace */
import { memo } from 'react';
import { View } from 'react-native';

import type { ContactMeta, PortfolioMeta } from '@safely/core';
import type { ActivityItem as ActivityItemData } from '@safely/ux';

import { ContactName } from '@mobile/entities/contact';
import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, Text } from '@mobile/shared/ui';

import { styles } from './ActivityItem.styles';

export type ActivityItemCounterparty =
    | { kind: 'contact'; meta: ContactMeta }
    | { kind: 'portfolio'; meta: PortfolioMeta }
    | { kind: 'address'; label: string }
    | { kind: 'provider'; label: string };

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
    onNavigateToActivityItem: (activity: ActivityItemData) => void;
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
        case 'provider':
            return (
                <Cell.Subtitle textTransform="capitalize" color="secondary">
                    {counterparty.label}
                </Cell.Subtitle>
            );
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
        onNavigateToActivityItem
    } = props;

    return (
        <Cell
            containerStyle={styles.border}
            background={background}
            showDivider={false}
            onPress={() => onNavigateToActivityItem(activity)}
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
                        {amountSign} {formattedValue}
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

export const ActivityItemSkeleton = () => {
    return (
        <Cell skeleton showDivider={false}>
            <Cell.Content>
                <Cell.Row>
                    <Cell.Title skeleton />
                    <Cell.Value skeleton />
                </Cell.Row>
                <Cell.Row>
                    <Cell.Subtitle skeleton />
                    <Cell.Subvalue skeleton />
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};
