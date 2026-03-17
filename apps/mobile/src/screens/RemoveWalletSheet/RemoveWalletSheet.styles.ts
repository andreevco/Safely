import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    titleBox: {
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    subtitle: {
        width: '100%'
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[16],
        marginVertical: theme.spacing[16],
        marginHorizontal: theme.spacing[24],
        paddingVertical: theme.spacing[12],
        paddingHorizontal: theme.spacing[16],
        borderRadius: theme.radius.md,
        borderWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement,
        backgroundColor: theme.colors.background.secondary
    },
    checkboxText: {
        flex: 1
    },
    footer: {
        width: '100%',
        gap: theme.spacing[8],
        padding: theme.spacing[24],
        marginBottom: rt.insets.bottom
    }
}));
