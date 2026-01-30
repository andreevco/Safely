import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        padding: theme.spacing[12]
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.button.secondary.background,
        borderRadius: theme.radius.full,
        padding: theme.spacing[12],
        variants: {
            type: {
                rounded: {
                    borderRadius: theme.radius.full
                },
                small: {
                    paddingVertical: 10,
                    paddingHorizontal: theme.spacing[16],
                    borderRadius: theme.radius.full
                }
            }
        }
    }
}));
