import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        flexDirection: 'column',
        gap: theme.spacing[2],
        paddingTop: theme.spacing[2]
    },
    badge: {
        paddingHorizontal: theme.spacing[12],
        paddingVertical: theme.spacing[8],
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.background.tertiary,
        alignSelf: 'flex-start'
    }
}));
