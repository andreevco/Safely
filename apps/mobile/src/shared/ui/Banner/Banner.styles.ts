import Color from 'color';
import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        borderRadius: theme.radius.md,
        borderWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement,
        backgroundColor: theme.colors.background.secondary,
        paddingVertical: theme.spacing[12],
        paddingHorizontal: theme.spacing[16],
        gap: theme.spacing[4],
        variants: {
            variant: {
                warn: {
                    backgroundColor: Color(theme.colors.accent.orange).alpha(0.16).toString()
                },
                danger: {
                    backgroundColor: Color(theme.colors.accent.red).alpha(0.16).toString()
                }
            }
        }
    }
}));
