import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    labelContainer: {
        paddingTop: theme.spacing[12],
        paddingHorizontal: theme.spacing[16]
    },
    container: {
        minHeight: 56,
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
        lineHeight: 22,
        fontWeight: 400,
        color: theme.colors.text.primary,
        paddingTop: 0,
        paddingBottom: 0,
        includeFontPadding: false,
        textAlignVertical: 'top'
    },
    hiddenInput: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        opacity: 0
    },
    iconButton: {
        position: 'absolute',
        right: theme.spacing[16] - 2,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    clearIconButton: {
        right: 20
    },
    selectedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4]
    },
    inputModeBox: {
        position: 'relative'
    },
    measure: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        opacity: 0
    },
    inputSuffix: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center'
    },
    selectedDot: (color: string) => ({
        width: 20,
        height: 20,
        borderRadius: theme.radius.full,
        backgroundColor: color
    }),
    selectedEmoji: {
        fontSize: 20
    },
    selectedName: {
        fontSize: 17,
        fontWeight: '500' as const,
        color: theme.colors.text.primary
    },
    selectedCursor: {
        width: 2,
        height: 20,
        borderRadius: 1
    },
    errorText: {
        marginBottom: theme.spacing[12],
        marginHorizontal: theme.spacing[16],
        color: theme.colors.accent.red,
        fontSize: 14
    }
}));
