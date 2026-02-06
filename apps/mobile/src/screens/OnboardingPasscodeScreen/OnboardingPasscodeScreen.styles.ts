import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    textContainer: {
        gap: theme.spacing[8],
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32],
        marginBottom: theme.spacing[12]
    },
    stickyButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: theme.spacing[24],
        alignItems: 'center'
    },
    stickyButton: {
        borderRadius: theme.radius.full,
        paddingVertical: theme.spacing[8],
        paddingHorizontal: theme.spacing[16],
        backgroundColor: theme.colors.button.secondary.background
    }
}));
