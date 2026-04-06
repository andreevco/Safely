import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    accountOptions: {
        marginTop: 2
    },
    buttonContainer: {
        alignItems: 'center',
        paddingBottom: theme.spacing[8]
    },
    syncDot: (synced: boolean) => ({
        width: 10,
        height: 10,
        borderRadius: theme.radius.full,
        backgroundColor: synced ? theme.colors.accent.green : theme.colors.accent.orange
    })
}));
