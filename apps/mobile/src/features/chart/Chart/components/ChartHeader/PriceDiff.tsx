/* eslint-disable no-irregular-whitespace */

import Color from 'color';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { PriceDiffValue } from '@mobile/features/chart/Chart/utils/priceDiff';
import { Text } from '@mobile/shared/ui';

type PriceDiffProps = {
    priceDiff?: PriceDiffValue;
};

export const PriceDiff = (props: PriceDiffProps) => {
    const { priceDiff } = props;

    styles.useVariants({ type: priceDiff?.isPositive ? 'positive' : 'negative' });

    return (
        <View style={styles.diff}>
            <Text
                variant="bodyM"
                monospace
                color={priceDiff?.isPositive ? 'accentGreen' : 'accentRed'}
            >
                {priceDiff?.isPositive ? '+' : '−'} {priceDiff?.formatted} %
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
