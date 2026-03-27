import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    container: {
        paddingHorizontal: theme.spacing[8]
    },
    listContent: {
        flexGrow: 1,
        paddingBottom: theme.spacing[8] + rt.insets.bottom
    },
    headerPlaceholder: {
        width: 40,
        padding: theme.spacing[12]
    },
    listGroupMargin: {
        marginBottom: theme.spacing[2]
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    syncDotGreen: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.accent.green
    },
    syncDotYellow: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.accent.orange
    }
}));
