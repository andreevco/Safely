import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        paddingTop: 12
    },
    assetLogo: {
        width: 72,
        height: 72,
        borderRadius: theme.radius.full
    },
    title: {
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    assetLogoContainer: {
        width: 96,
        height: 96,
        margin: theme.spacing[12],
        alignItems: 'center',
        justifyContent: 'center'
    },
    titleWithLogoContainer: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    list: {
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[8]
    },
    listGroup: {
        marginBottom: 0
    }
}));
