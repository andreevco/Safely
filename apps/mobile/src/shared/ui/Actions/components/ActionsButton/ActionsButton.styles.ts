import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        alignItems: 'center',
        gap: theme.spacing[8]
    },
    iconContainer: {
        backgroundColor: theme.colors.background.tertiary,
        borderWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement,
        borderRadius: theme.radius.full,
        padding: theme.spacing[12]
    }
}));
