import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    box: {
        width: 24,
        height: 24,
        borderRadius: theme.radius.sm,
        borderWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement,
        backgroundColor: theme.colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    boxChecked: {
        backgroundColor: theme.colors.accent.accent,
        borderColor: theme.colors.accent.accent
    }
}));
