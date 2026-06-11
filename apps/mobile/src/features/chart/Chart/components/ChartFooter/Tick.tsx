import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import type { UnistylesVariants } from 'react-native-unistyles';
import { StyleSheet } from 'react-native-unistyles';

type TickProps = UnistylesVariants<typeof styles> & {
    style?: StyleProp<ViewStyle>;
    mediumTickColor?: 'tertiary' | 'secondary';
};

export const Tick = (props: TickProps) => {
    const { variant, mediumTickColor, style } = props;

    styles.useVariants({ variant });

    return <View style={[styles.tick(mediumTickColor), style]} />;
};

const styles = StyleSheet.create(theme => ({
    tick: (mediumTickColor?: 'tertiary' | 'secondary') => ({
        width: 1,
        variants: {
            variant: {
                small: {
                    height: 2,
                    backgroundColor: theme.colors.icon.tertiary
                },
                medium: {
                    height: 4,
                    backgroundColor:
                        mediumTickColor === 'tertiary'
                            ? theme.colors.icon.tertiary
                            : theme.colors.icon.secondary
                },
                large: {
                    height: 8,
                    backgroundColor: theme.colors.icon.secondary
                }
            }
        }
    })
}));
