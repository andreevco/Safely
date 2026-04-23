import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    wrapper: {
        padding: theme.spacing[8]
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.input.background,
        padding: theme.spacing[16] - theme.border.border,
        borderWidth: theme.border.border,
        borderRadius: theme.radius.md,
        borderColor: theme.colors.background.tertiary
    },
    input: {
        flex: 1,
        fontSize: 17,
        paddingVertical: 0,
        color: theme.colors.text.primary
    },
    clearButton: {
        marginLeft: theme.spacing[16]
    }
}));
