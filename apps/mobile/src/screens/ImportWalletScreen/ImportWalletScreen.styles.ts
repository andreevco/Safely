import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    continueButton: {
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
        padding: theme.spacing[16]
    },
    inputContainer: {
        marginHorizontal: theme.spacing[8],
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md,
        padding: theme.spacing[16],
        minHeight: 166,
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
    textArea: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        paddingVertical: 0
    },
    footer: {
        paddingHorizontal: theme.spacing[16],
        paddingVertical: theme.spacing[16],
        gap: theme.spacing[12]
    }
}));
