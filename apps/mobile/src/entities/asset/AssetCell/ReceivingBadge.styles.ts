import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        flexDirection: 'column',
        gap: theme.spacing[4]
    },
    badge: {
        paddingHorizontal: theme.spacing[16],
        paddingVertical: theme.spacing[8],
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.background.tertiary,
        alignSelf: 'flex-start'
    }
}));
