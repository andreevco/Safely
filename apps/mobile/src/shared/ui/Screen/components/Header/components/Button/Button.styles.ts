import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        padding: theme.spacing[12]
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.button.secondary.background,
        borderRadius: theme.radius.full,
        padding: theme.spacing[12]
    }
}));
