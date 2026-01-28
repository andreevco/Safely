import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    container: {
        paddingHorizontal: theme.spacing[8]
    },
    listContent: {
        flexGrow: 1,
        paddingBottom: theme.spacing[8] + rt.insets.bottom,
        gap: theme.spacing[8]
    },
    headerPlaceholder: {
        padding: theme.spacing[12]
    }
}));
