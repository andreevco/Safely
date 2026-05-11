import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    text: {
        flex: 1,
        color: theme.colors.text.primary,
        variants: {
            variant: {
                warn: {
                    color: theme.colors.accent.orange
                },
                danger: {
                    color: theme.colors.accent.red
                }
            }
        }
    }
}));
