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
    syncDot: (synced: boolean) => ({
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: synced ? theme.colors.accent.green : theme.colors.accent.orange
    })
}));
