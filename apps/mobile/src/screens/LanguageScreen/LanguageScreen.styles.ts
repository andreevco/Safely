import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    container: {
        paddingHorizontal: theme.spacing[8]
    },
    listContent: {
        flexGrow: 1,
        paddingBottom: theme.spacing[8] + rt.insets.bottom
    },
    cellContent: {
        flexDirection: 'column'
    },
    nativeName: {
        marginTop: theme.spacing[4]
    },
    headerPlaceholder: {
        width: 40,
        padding: theme.spacing[12]
    }
}));
