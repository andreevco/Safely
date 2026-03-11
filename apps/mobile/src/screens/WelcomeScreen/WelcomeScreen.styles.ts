import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    background: {
        flex: 1
    },
    logo: {
        margin: 'auto',
        marginBottom: theme.spacing[16]
    },
    textContainer: {
        alignItems: 'center',
        marginVertical: theme.spacing[16],
        marginHorizontal: theme.spacing[32]
    },
    buttonsContainer: {
        gap: theme.spacing[8],
        margin: theme.spacing[24]
    },
    legalContainer: {
        alignItems: 'center',
        paddingBottom: theme.spacing[16],
        paddingHorizontal: theme.spacing[16]
    }
}));
