import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    accountOptions: {
        marginTop: 2
    },
    buttonsContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        paddingBottom: theme.spacing[8],
        gap: theme.spacing[8]
    }
}));
