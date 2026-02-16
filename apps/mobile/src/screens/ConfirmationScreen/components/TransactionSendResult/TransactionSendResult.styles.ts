import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    transactionInfoContainer: {
        flexDirection: 'row'
    },
    iconsContainer: {
        gap: theme.spacing[16],
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'flex-end'
    }
}));
