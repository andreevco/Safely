import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    background: {
        flex: 1
    },
    logo: {
        margin: 'auto',
        marginBottom: theme.spacing[8]
    },
    textContainer: {
        alignItems: 'center',
        marginVertical: theme.spacing[16],
        marginHorizontal: theme.spacing[32],
        gap: theme.spacing[4]
    },
    buttonsContainer: {
        gap: theme.spacing[8],
        margin: theme.spacing[24],
        marginHorizontal: theme.spacing[64]
    },
    legalContainer: {
        alignItems: 'center',
        paddingBottom: theme.spacing[8],
        paddingHorizontal: theme.spacing[16]
    },
    buttonTextWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[8]
    },
    lastButton: {
        marginTop: theme.spacing[24]
    }
}));
