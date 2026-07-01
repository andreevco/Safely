import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    captureScreen: {
        flex: 1
    },
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
        gap: theme.spacing[4],
        padding: theme.spacing[16]
    }
}));
