import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Cell, Text } from '@mobile/shared/ui';

import { styles } from './LedgerDerivationRow.styles';

type LedgerDerivationRowProps = {
    index: number;
    title?: string;
    subtitle?: ReactNode;
    badge?: ReactNode;
    isSubtitleLoading?: boolean;
    isSkeleton?: boolean;
    showDivider?: boolean;
    accessory?: ReactNode;
    onPress?: () => void;
};

export const LedgerDerivationRow = (props: LedgerDerivationRowProps) => {
    const {
        index,
        title,
        subtitle,
        badge,
        isSubtitleLoading = false,
        isSkeleton = false,
        showDivider,
        accessory,
        onPress
    } = props;

    return (
        <Cell
            skeleton={isSkeleton}
            showDivider={showDivider}
            onPress={onPress}
            style={styles.container}
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
                        {!isSkeleton && badge}
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
