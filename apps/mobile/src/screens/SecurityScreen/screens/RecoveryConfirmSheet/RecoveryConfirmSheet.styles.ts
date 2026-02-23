import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing[24]
    },
    titleBox: {
        alignItems: 'center',
        marginVertical: theme.spacing[16],
        marginHorizontal: theme.spacing[8]
    },
    warningBox: {
        width: '100%',
        borderRadius: theme.radius.md,
        borderWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement,
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing[16],
        marginVertical: theme.spacing[16],
        gap: theme.spacing[4]
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[12]
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.icon.tertiary,
        marginTop: 7
    },
    bulletText: {
        flex: 1
    },
    buttons: {
        flexDirection: 'row',
        gap: theme.spacing[8],
        marginVertical: theme.spacing[24]
    },
    button: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing[16],
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.button.secondary.background
    },
    buttonPrimary: {
        backgroundColor: theme.colors.button.primary.background
    }
}));
