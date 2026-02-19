import { Platform } from 'react-native';
import { SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
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
        paddingTop: theme.spacing[8] - theme.border.border,
        paddingBottom: 11 - theme.border.border,
        flex: 1
    },
    input: {
        fontSize: 32,
        fontWeight: 600,
        fontVariant: ['tabular-nums', 'lining-nums'],
        color: theme.colors.text.primary,
        flex: 1,
        height: 40,
        letterSpacing: 0.42,
        ...(Platform.OS === 'android'
            ? {
                  paddingBottom: 0,
                  paddingTop: 0
              }
            : {})
    },
    rightContentContainer: {
        paddingRight: theme.spacing[12],
        marginLeft: 'auto',
        justifyContent: 'center',
        alignItems: 'center'
    },
    secondaryCurrencyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4]
    },
    tabularNums: {
        fontVariant: ['tabular-nums', 'lining-nums']
    },
    textInputWithCurrencySymbolContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end'
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
