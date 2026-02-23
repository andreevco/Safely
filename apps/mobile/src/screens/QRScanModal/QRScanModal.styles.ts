import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        paddingTop: 42
    },
    textContainer: {
        padding: theme.spacing[32],
        gap: theme.spacing[4],
        alignItems: 'center',
        justifyContent: 'center'
    }
}));
