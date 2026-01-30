import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing[16],
        paddingVertical: theme.spacing[12],
        gap: theme.spacing[8],
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.background.tertiary,
        maxWidth: '80%'
    }
}));
