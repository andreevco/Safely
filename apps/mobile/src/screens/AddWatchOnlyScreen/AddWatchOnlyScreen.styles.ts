import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    nextButton: {
        paddingVertical: theme.spacing[8],
        paddingHorizontal: theme.spacing[16],
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.button.primary.background,
        margin: theme.spacing[12]
    },
    content: {
        paddingHorizontal: theme.spacing[16],
        gap: theme.spacing[12]
    },
    textContainer: {
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md,
        padding: theme.spacing[16],
        marginVertical: theme.spacing[8],
        marginHorizontal: theme.spacing[24],
        borderWidth: 1,
        borderColor: 'transparent',
        variants: {
            focused: {
                true: {
                    borderColor: theme.colors.accent.blue
                }
            },
            error: {
                true: {
                    borderColor: theme.colors.accent.red
                }
            }
        }
    },
    input: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        paddingVertical: 0
    },
    clearButton: {
        marginVertical: 'auto',
        marginRight: theme.spacing[4],
        paddingLeft: theme.spacing[24] - 4
    },
    errorText: {
        marginHorizontal: theme.spacing[24],
        paddingBottom: theme.spacing[12],
        color: theme.colors.accent.red,
        fontSize: 14
    },
    infoBox: {
        paddingVertical: theme.spacing[12],
        paddingHorizontal: theme.spacing[16],
        marginHorizontal: theme.spacing[24],
        borderRadius: theme.radius.md,
        borderWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement,
        backgroundColor: theme.colors.background.secondary
    }
}));
