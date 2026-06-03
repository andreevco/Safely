import { Platform } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        marginHorizontal: theme.spacing[8],
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md,
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
    field: {
        padding: Platform.OS === 'android' ? 0 : theme.spacing[16],
        borderRadius: theme.radius.md
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.text.primary,
        backgroundColor: 'transparent'
    }
}));
