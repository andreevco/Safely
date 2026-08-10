import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    content: {
        paddingBottom: theme.spacing[8] + rt.insets.bottom
    },
    hint: {
        padding: theme.spacing[16]
    },
    customRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[8],
        paddingTop: theme.spacing[8]
    },
    customInput: {
        flex: 1
    }
}));
