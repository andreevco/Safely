import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: theme.spacing[16]
    },
    textContainer: {
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    button: {
        padding: theme.spacing[24],
        marginBottom: rt.insets.bottom
    }
}));
