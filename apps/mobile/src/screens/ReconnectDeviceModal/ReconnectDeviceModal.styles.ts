import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    textContainer: {
        alignItems: 'center',
        gap: theme.spacing[4],
        marginVertical: theme.spacing[16],
        marginHorizontal: theme.spacing[32]
    },
    qrContainer: {
        alignSelf: 'center',
        alignItems: 'center',
        padding: theme.spacing[24],
        marginBottom: theme.spacing[16],
        backgroundColor: theme.colors.other.constant.white,
        borderRadius: theme.radius.xl
    },
    qrPlaceholder: {
        width: 198,
        height: 198,
        alignItems: 'center',
        justifyContent: 'center'
    },
    iconImage: {
        width: 23,
        height: 20,
        transform: [{ translateY: 7 }]
    }
}));
