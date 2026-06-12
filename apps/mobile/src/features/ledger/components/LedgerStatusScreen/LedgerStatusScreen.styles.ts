import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing[24]
    },
    body: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing[16],
        paddingHorizontal: theme.spacing[8]
    },
    textContainer: {
        gap: theme.spacing[4]
    },
    button: {
        marginVertical: theme.spacing[24]
    }
}));
