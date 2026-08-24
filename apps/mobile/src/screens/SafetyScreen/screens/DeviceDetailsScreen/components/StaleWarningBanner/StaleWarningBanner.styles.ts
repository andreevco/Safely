import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    banner: {
        marginTop: theme.spacing[2],
        marginBottom: theme.spacing[8],
        gap: theme.spacing[12],
        borderWidth: 0
    },
    hideButton: {
        alignSelf: 'flex-start'
    }
}));
