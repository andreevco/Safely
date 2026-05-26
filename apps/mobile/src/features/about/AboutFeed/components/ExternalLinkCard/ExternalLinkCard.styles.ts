import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        gap: theme.spacing[12],
        flexDirection: 'row'
    },
    image: {
        width: 64,
        height: 64,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.background.tertiary
    },
    body: {
        gap: theme.spacing[4],
        flexShrink: 1
    }
}));
