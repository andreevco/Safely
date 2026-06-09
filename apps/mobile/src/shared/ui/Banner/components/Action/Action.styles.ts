import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start'
    },
    text: {
        color: theme.colors.text.primary,
        variants: {
            variant: {
                warn: {
                    color: theme.colors.accent.orange
                },
                danger: {
                    color: theme.colors.accent.red
                },
                transparent: {
                    color: theme.colors.accent.orange
                }
            }
        }
    },
    chevron: {
        tintColor: theme.colors.icon.secondary,
        variants: {
            variant: {
                warn: {
                    tintColor: theme.colors.accent.orange
                },
                danger: {
                    tintColor: theme.colors.accent.red
                },
                transparent: {
                    tintColor: theme.colors.accent.orange
                }
            }
        }
    }
}));
