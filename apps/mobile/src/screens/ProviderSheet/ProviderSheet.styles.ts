import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        paddingTop: theme.spacing[16],
        paddingBottom: theme.spacing[24],
        paddingHorizontal: theme.spacing[32],
        alignItems: 'center'
    },
    logo: {
        width: 72,
        height: 72,
        margin: theme.spacing[12],
        borderRadius: theme.radius.lg
    },
    nameContainer: {
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[16]
    },
    banner: {
        marginHorizontal: theme.spacing[24]
    },
    disclaimerText: {
        color: theme.colors.text.secondary
    },
    actionBar: {
        paddingHorizontal: theme.spacing[24],
        paddingTop: theme.spacing[24],
        gap: theme.spacing[8]
    },
    showAgainContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[8],
        paddingVertical: 18
    }
}));
