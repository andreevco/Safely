import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    headerFullScreen: {
        flex: 1
    },
    buttonContainer: {
        padding: theme.spacing[24],
        paddingBottom: theme.spacing[24] + rt.insets.bottom
    },
    listHeader: {
        marginBottom: theme.spacing[24]
    },
    listWrapper: {
        flex: 1
    },
    footer: (hasBorder: boolean) => ({
        padding: theme.spacing[24],
        paddingBottom: theme.spacing[24] + rt.insets.bottom,
        backgroundColor: theme.colors.background.primary,
        borderTopWidth: hasBorder ? theme.border.hairline : 0,
        borderTopColor: theme.colors.other.transparentElement
    })
}));
