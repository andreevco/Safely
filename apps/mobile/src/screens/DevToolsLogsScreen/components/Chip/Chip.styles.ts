import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    chip: {
        paddingVertical: theme.spacing[6],
        paddingHorizontal: theme.spacing[12],
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.background.tertiary
    },
    chipActive: {
        backgroundColor: theme.colors.button.primary.background
    }
}));
