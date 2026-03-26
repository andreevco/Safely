import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    textContainer: {
        marginVertical: theme.spacing[16],
        marginHorizontal: theme.spacing[32],
        gap: theme.spacing[4],
        alignItems: 'center'
    },
    buttonContainer: {
        gap: theme.spacing[8],
        padding: theme.spacing[24]
    }
}));
