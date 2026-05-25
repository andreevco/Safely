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
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md,
        paddingVertical: theme.spacing[12],
        paddingHorizontal: theme.spacing[16],
        gap: theme.spacing[12],
        margin: theme.spacing[24]
    },
    bannerText: {
        flex: 1
    },
    bannerIcon: {
        marginHorizontal: theme.spacing[8]
    }
}));
