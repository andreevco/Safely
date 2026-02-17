import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    background: {
        flex: 1
    },
    logoSection: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center'
    },
    logo: {
        width: 160,
        height: 160
    },
    spacer: {
        flex: 1
    },
    bottomSection: {
        paddingHorizontal: theme.spacing[24],
        paddingBottom: theme.spacing[16]
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing[32]
    },
    buttonsContainer: {
        gap: theme.spacing[8],
        marginBottom: theme.spacing[24]
    },
    legalText: {
        marginHorizontal: theme.spacing[8]
    }
}));
