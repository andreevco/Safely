import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    container: {
        position: 'absolute',
        bottom: rt.insets.bottom,
        left: 0,
        right: 0,
        padding: theme.spacing[32]
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center'
    }
}));
