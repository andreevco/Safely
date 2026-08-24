import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    iconBox: {
        alignItems: 'center',
        paddingTop: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    titleBox: {
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    warningBanner: {
        borderWidth: 0
    },
    table: {
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[32],
        paddingVertical: theme.spacing[16]
    },
    wallets: {
        gap: theme.spacing[2]
    },
    footer: {
        flexDirection: 'row',
        gap: theme.spacing[8],
        paddingHorizontal: theme.spacing[24],
        paddingTop: theme.spacing[24],
        paddingBottom: theme.spacing[24] + rt.insets.bottom
    },
    footerButton: {
        flex: 1
    }
}));
