import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        paddingRight: theme.spacing[12]
    },
    content: {
        borderRadius: theme.radius.full
    }
}));
