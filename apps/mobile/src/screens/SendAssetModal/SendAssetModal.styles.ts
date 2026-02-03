import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    pagerView: {
        flex: 1
    },
    nextButton: {
        margin: theme.spacing[12],
        paddingVertical: theme.spacing[12],
        paddingHorizontal: theme.spacing[16],
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.button.primary.background,
        variants: {
            disabled: {
                true: {
                    opacity: 0.5
                },
                false: {
                    opacity: 1
                }
            }
        }
    }
}));
