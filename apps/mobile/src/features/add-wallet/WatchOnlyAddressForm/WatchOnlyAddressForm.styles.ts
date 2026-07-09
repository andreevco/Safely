import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    nextButton: {
        paddingVertical: theme.spacing[8],
        paddingHorizontal: theme.spacing[16],
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.button.primary.background,
        margin: theme.spacing[12]
    },
    textContainer: {
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    inputWrapper: {
        marginHorizontal: theme.spacing[16]
    },
    infoBox: {
        paddingVertical: theme.spacing[12],
        paddingHorizontal: theme.spacing[16],
        marginHorizontal: theme.spacing[24],
        borderRadius: theme.radius.md,
        borderWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement,
        backgroundColor: theme.colors.background.secondary
    }
}));
