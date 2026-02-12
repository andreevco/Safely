import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing[16]
    },
    textContainer: {
        gap: theme.spacing[8],
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[16],
        marginBottom: theme.spacing[12]
    },
    inputContainer: {
        marginVertical: theme.spacing[8]
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing[16]
    },
    input: {
        flex: 1,
        height: 56,
        fontSize: 16
    },
    inputEmoji: {
        fontSize: 20
    },
    iconContainer: {
        marginLeft: theme.spacing[12],
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center'
    },
    colorDot: {
        width: 20,
        height: 20,
        borderRadius: theme.radius.full
    }
}));
