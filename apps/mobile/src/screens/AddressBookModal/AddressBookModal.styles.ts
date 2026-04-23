import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    headerFullScreen: {
        flex: 1
    },
    buttonContainer: {
        padding: theme.spacing[24],
        paddingBottom: theme.spacing[24] + rt.insets.bottom
    },
    button: {
        marginRight: theme.spacing[12]
    }
}));
