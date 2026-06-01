import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    container: {
        marginTop: 'auto',
        paddingHorizontal: theme.spacing[12],
        paddingTop: theme.spacing[12],
        paddingBottom: theme.spacing[32],
        marginBottom: rt.insets.bottom
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    button: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing[16]
    },
    hiddenInput: {
        position: 'absolute',
        width: 0,
        height: 0,
        opacity: 0
    }
}));
