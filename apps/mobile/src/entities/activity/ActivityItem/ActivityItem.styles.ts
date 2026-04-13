import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    border: {
        borderRadius: theme.radius.md,
        overflow: 'hidden'
    },
    titleWithTimestamp: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4]
    },
    timestamp: {
        marginTop: theme.spacing[6],
        marginBottom: theme.spacing[2],
        fontSize: 12.5,
        lineHeight: 16
    }
}));
