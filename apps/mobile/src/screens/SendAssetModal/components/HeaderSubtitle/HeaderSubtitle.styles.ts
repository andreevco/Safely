import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing[4]
    },
    shrinkableHalf: {
        flexShrink: 1,
        maxWidth: '30%'
    },
    shrinkableFull: {
        flexShrink: 1
    }
}));
