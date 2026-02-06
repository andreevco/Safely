import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    textContainer: {
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: theme.spacing[32],
        marginVertical: theme.spacing[16]
    },
    buttonsContainer: {
        margin: theme.spacing[24],
        gap: theme.spacing[8]
    },
    legalText: {
        marginHorizontal: theme.spacing[24],
        marginBottom: theme.spacing[16] + rt.insets.bottom
    }
}));
