import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    labelContainer: {
        paddingTop: theme.spacing[12],
        paddingHorizontal: theme.spacing[16]
    },
    inputPaddingContainer: {
        margin: theme.spacing[8]
    },
    inputContainer: {
        borderWidth: theme.border.border,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.input.background,
        flexDirection: 'row',
        alignItems: 'center'
    },
    leftContentContainer: {
        paddingLeft: theme.spacing[16],
        paddingRight: theme.spacing[8],
        gap: 1,
        paddingTop: theme.spacing[8] - theme.border.border,
        paddingBottom: 11 - theme.border.border,
        flex: 1
    },
    input: {
        flex: 1,
        height: 40
    },
    rightContentContainer: {
        paddingRight: theme.spacing[12],
        marginLeft: 'auto',
        justifyContent: 'center',
        alignItems: 'center'
    },
    switchButton: {
        alignSelf: 'flex-start'
    },
    secondaryCurrencyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4]
    },
    textInputWithCurrencySymbolContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    }
}));

export const useInputAnimatedStyle = (focused: SharedValue<boolean>, errored: boolean) => {
    const { theme } = useUnistyles();

    return useAnimatedStyle(() => {
        const borderColor = () => {
            if (errored) {
                return theme.colors.input.error.border;
            }
            if (focused.value) {
                return theme.colors.input.focused.border;
            }
            return theme.colors.input.background;
        };

        return {
            borderColor: withTiming(borderColor(), { duration: 150 })
        };
    }, [focused, errored, theme]);
};
