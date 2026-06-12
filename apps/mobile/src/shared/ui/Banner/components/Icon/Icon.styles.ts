import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    icon: {
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
