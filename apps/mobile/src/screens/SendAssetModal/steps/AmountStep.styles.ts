import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1
    },
    remainingContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing[16],
        paddingVertical: theme.spacing[4],
        gap: theme.spacing[8]
    },
    tabularNums: {
        fontVariant: ['tabular-nums', 'lining-nums']
    }
}));
