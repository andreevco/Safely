import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    textContainer: {
        gap: theme.spacing[4]
    },
    buttonContainer: {
        padding: theme.spacing[24],
        marginBottom: rt.insets.bottom
    }
}));
