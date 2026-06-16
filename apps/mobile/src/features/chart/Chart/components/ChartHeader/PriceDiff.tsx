import Color from 'color';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { SPACE } from '@safely/core';
import { useNumberFormatter } from '@safely/ux';

import { Text } from '@mobile/shared/ui';

type PriceDiffProps = {
    priceDiff?: number | null;
};

export const PriceDiff = (props: PriceDiffProps) => {
    const { priceDiff } = props;
    const formatter = useNumberFormatter();
    const isPositive = priceDiff != null && priceDiff > 0;

    styles.useVariants({ type: isPositive ? 'positive' : 'negative' });

    return (
        <View style={styles.diff}>
            <Text variant="bodyM" monospace color={isPositive ? 'accentGreen' : 'accentRed'}>
                {priceDiff ? formatter.formatPercent(priceDiff) : `−${SPACE.NNBSP}%`}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    diff: {
        borderRadius: theme.radius.xs,
        paddingVertical: theme.spacing[2],
        paddingHorizontal: theme.spacing[6],
        variants: {
            type: {
                positive: {
                    backgroundColor: new Color(theme.colors.accent.green).alpha(0.12).toString()
                },
                negative: {
                    backgroundColor: new Color(theme.colors.accent.red).alpha(0.12).toString()
                }
            }
        }
    }
}));
