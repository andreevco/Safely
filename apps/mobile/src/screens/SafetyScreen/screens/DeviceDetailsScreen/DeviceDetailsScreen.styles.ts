import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    headerPlaceholder: {
        width: 40,
        padding: theme.spacing[12]
    },
    unarchiveButton: {
        marginTop: theme.spacing[8],
        borderRadius: theme.radius.md
    },
    content: {
        paddingHorizontal: theme.spacing[8],
        paddingBottom: theme.spacing[8] + rt.insets.bottom
    }
}));
