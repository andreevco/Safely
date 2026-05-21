import { memo } from 'react';
import { View } from 'react-native';

import { ContactName } from '@mobile/entities/contact';
import { PortfolioName } from '@mobile/entities/portfolio';
import { ActivityRow } from '@mobile/features/history/HistoryList/utils/rows';
import { Cell, Text } from '@mobile/shared/ui';

import { styles } from './ActivityItem.styles';

const Counterparty = ({ counterparty }: { counterparty: ActivityRow['counterparty'] }) => {
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

export const ActivityItem = memo((props: ActivityRow) => {
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
        onNavigateToTransaction
    } = props;

    return (
        <Cell
            containerStyle={styles.border}
            background={background}
            showDivider={false}
            onPress={() => onNavigateToTransaction(activity)}
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
