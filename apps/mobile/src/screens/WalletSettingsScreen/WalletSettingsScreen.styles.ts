import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    headerPlaceholder: {
        width: 40,
        padding: theme.spacing[12]
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing[8],
        paddingBottom: theme.spacing[8] + rt.insets.bottom
    }
}));
