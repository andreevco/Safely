import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    continueButton: {
        paddingVertical: theme.spacing[8],
        paddingHorizontal: theme.spacing[16],
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.button.primary.background,
        margin: theme.spacing[12]
    },
    content: {
        paddingHorizontal: theme.spacing[16],
        gap: theme.spacing[12]
    },
    textContainer: {
        alignItems: 'center',
        gap: theme.spacing[8],
        paddingHorizontal: theme.spacing[16],
        marginBottom: theme.spacing[4]
    },
    inputContainer: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md,
        padding: theme.spacing[16],
        minHeight: 160
    },
    inputContainerError: {
        borderWidth: 1,
        borderColor: theme.colors.accent.red
    },
    textArea: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        paddingVertical: 0
    },
    footer: {
        paddingHorizontal: theme.spacing[16],
        paddingVertical: theme.spacing[16],
        gap: theme.spacing[12]
    }
}));
