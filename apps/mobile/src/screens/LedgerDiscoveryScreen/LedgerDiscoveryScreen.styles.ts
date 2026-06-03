import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1
    },
    header: {
        alignItems: 'center',
        paddingTop: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    textContainer: {
        marginVertical: theme.spacing[16],
        gap: theme.spacing[4],
        alignItems: 'center'
    },
    statusContainer: {
        alignItems: 'center',
        gap: theme.spacing[8],
        paddingVertical: theme.spacing[24]
    },
    list: {
        paddingHorizontal: theme.spacing[16]
    },
    buttonContainer: {
        padding: theme.spacing[24]
    }
}));
