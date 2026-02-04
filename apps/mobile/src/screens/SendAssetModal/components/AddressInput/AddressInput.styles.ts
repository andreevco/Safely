import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    labelContainer: {
        paddingTop: theme.spacing[12],
        paddingHorizontal: theme.spacing[16]
    },
    container: {
        minHeight: 64,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.input.background,
        borderWidth: theme.border.border,
        borderColor: 'transparent',
        margin: theme.spacing[8],
        padding: theme.spacing[16],
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
    inputWrapper: {
        flex: 1,
        justifyContent: 'center'
    },
    input: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text.primary,
        paddingVertical: theme.spacing[12],
        minHeight: 44
    },
    iconButton: {
        position: 'absolute',
        right: theme.spacing[16],
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        width: 24
    },
    errorText: {
        marginBottom: theme.spacing[12],
        marginHorizontal: theme.spacing[16],
        color: theme.colors.accent.red,
        fontSize: 14
    }
}));
