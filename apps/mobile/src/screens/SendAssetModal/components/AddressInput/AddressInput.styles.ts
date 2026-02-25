import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    labelContainer: {
        paddingTop: theme.spacing[12],
        paddingHorizontal: theme.spacing[16]
    },
    container: {
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.input.background,
        borderWidth: theme.border.border,
        borderColor: 'transparent',
        margin: theme.spacing[8],
        padding: theme.spacing[16] - theme.border.border,
        paddingRight: 56,
        justifyContent: 'center',
        position: 'relative',
        variants: {
            focused: {
                true: {
                    borderColor: theme.colors.accent.blue
                },
                false: {}
            },
            error: {
                true: {
                    borderColor: theme.colors.accent.red
                },
                false: {}
            }
        }
    },
    input: {
        fontSize: 17,
        lineHeight: 24,
        letterSpacing: -0.44,
        fontWeight: 400,
        color: theme.colors.text.primary,
        paddingTop: 0,
        paddingBottom: 0,
        includeFontPadding: false
    },
    iconButton: {
        position: 'absolute',
        right: theme.spacing[16] - 2,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    errorText: {
        marginBottom: theme.spacing[12],
        marginHorizontal: theme.spacing[16],
        color: theme.colors.accent.red,
        fontSize: 14
    }
}));
