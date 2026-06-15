import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    balance: {
        padding: theme.spacing[32],
        paddingBottom: theme.spacing[24],
        gap: theme.spacing[8]
    },
    list: {
        marginTop: theme.spacing[16],
        marginHorizontal: theme.spacing[8]
    },
    findMore: {
        alignItems: 'center'
    }
}));
