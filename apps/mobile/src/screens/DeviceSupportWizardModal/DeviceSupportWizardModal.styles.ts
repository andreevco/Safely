import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    headerButton: {
        marginHorizontal: theme.spacing[12]
    },
    content: {
        alignItems: 'center',
        paddingTop: theme.spacing[16],
        paddingBottom: theme.spacing[24] + rt.insets.bottom
    },
    textContainer: {
        marginBottom: theme.spacing[24],
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32],
        gap: theme.spacing[4],
        alignItems: 'center'
    },
    dismissButton: {
        marginHorizontal: theme.spacing[24],
        alignSelf: 'center'
    }
}));
