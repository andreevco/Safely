import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    headerButton: {
        marginHorizontal: theme.spacing[12]
    },
    content: {
        alignItems: 'center',
        paddingTop: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    textContainer: {
        marginVertical: theme.spacing[16],
        gap: theme.spacing[4],
        alignItems: 'center'
    }
}));
