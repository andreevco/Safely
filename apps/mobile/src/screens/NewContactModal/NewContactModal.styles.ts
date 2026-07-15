import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    button: {
        marginRight: theme.spacing[12]
    },
    addressGroup: {
        marginHorizontal: theme.spacing[8]
    },
    note: {
        paddingHorizontal: theme.spacing[16],
        marginBottom: theme.spacing[12]
    }
}));
