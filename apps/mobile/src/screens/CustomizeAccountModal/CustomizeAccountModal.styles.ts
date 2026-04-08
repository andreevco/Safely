import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    saveButton: {
        paddingVertical: theme.spacing[8],
        paddingHorizontal: theme.spacing[16],
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.button.primary.background,
        margin: theme.spacing[12]
    },
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
        marginVertical: theme.spacing[8],
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing[16],
        borderWidth: 1,
        borderColor: 'transparent',
        variants: {
            focused: {
                true: {
                    borderColor: theme.colors.accent.blue
                }
            }
        }
    },
    input: {
        height: 56,
        fontSize: 16,
        color: theme.colors.text.primary
    }
}));
