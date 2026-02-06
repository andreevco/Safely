import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    textContainer: {
        marginVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32],
        alignItems: 'center'
    },
    buttonContainer: {
        margin: theme.spacing[24],
        marginBottom: theme.spacing[24] + rt.insets.bottom
    }
}));
