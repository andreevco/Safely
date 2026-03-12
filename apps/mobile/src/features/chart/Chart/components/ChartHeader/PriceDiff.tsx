/* eslint-disable no-irregular-whitespace */

import Color from 'color';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Text } from '@mobile/shared/ui';

type PriceDiffProps = {
    formatted: string;
    isPositive: boolean;
};

export const PriceDiff = (props: PriceDiffProps) => {
    const { formatted, isPositive } = props;

    styles.useVariants({ type: isPositive ? 'positive' : 'negative' });

    return (
        <View style={styles.diff}>
            <Text variant="bodyM" monospace color={isPositive ? 'accentGreen' : 'accentRed'}>
                {isPositive ? '+' : '−'} {formatted} %
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
