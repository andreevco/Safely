import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    saveButton: {
        paddingVertical: theme.spacing[8],
        paddingHorizontal: theme.spacing[16],
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.button.primary.background,
        margin: theme.spacing[12]
    }
}));
