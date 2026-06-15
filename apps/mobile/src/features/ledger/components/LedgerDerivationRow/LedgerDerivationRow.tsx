import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Cell, Text } from '@mobile/shared/ui';

import { styles } from './LedgerDerivationRow.styles';

type LedgerDerivationRowProps = {
    index: number;
    title?: string;
    subtitle?: string;
    isSubtitleLoading?: boolean;
    isSkeleton?: boolean;
    isDimmed?: boolean;
    accessory?: ReactNode;
    onPress?: () => void;
};

export const LedgerDerivationRow = (props: LedgerDerivationRowProps) => {
    const {
        index,
        title,
        subtitle,
        isSubtitleLoading = false,
        isSkeleton = false,
        isDimmed = false,
        accessory,
        onPress
    } = props;

    return (
        <Cell
            skeleton={isSkeleton}
            onPress={onPress}
            style={[styles.container, isDimmed && styles.dimmed]}
        >
            <View style={styles.badgeColumn}>
                <View style={styles.badge}>
                    <Text variant="bodyM" monospace>
                        {index + 1}
                    </Text>
                </View>
            </View>
            <Cell.Content>
                <Cell.Row>
                    <View style={styles.titleRow}>
                        <Cell.Title>{isSkeleton ? undefined : title}</Cell.Title>
                    </View>
                </Cell.Row>
                <Cell.Row>
                    <Cell.Subtitle skeleton={isSubtitleLoading} skeletonWidth={140}>
                        {isSkeleton || isSubtitleLoading ? undefined : subtitle}
                    </Cell.Subtitle>
                </Cell.Row>
            </Cell.Content>
            {accessory}
        </Cell>
    );
};
