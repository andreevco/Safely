import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    textContainer: {
        marginVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32],
        gap: theme.spacing[4],
        alignItems: 'center'
    },
    list: {
        paddingHorizontal: theme.spacing[16]
    },
    statusContainer: {
        alignItems: 'center',
        paddingVertical: theme.spacing[24]
    },
    showNext: {
        alignSelf: 'center',
        marginTop: theme.spacing[8]
    }
}));
