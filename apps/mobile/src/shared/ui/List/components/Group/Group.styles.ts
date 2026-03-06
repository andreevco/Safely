import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    group: {
        borderRadius: theme.radius.md,
        overflow: 'hidden',
        marginBottom: theme.spacing[8],
        variants: {
            variant: {
                separated: {
                    gap: theme.spacing[2]
                },
                divided: {}
            },
            withoutBottomMargin: {
                true: {
                    marginBottom: 0
                }
            }
        }
    },
    separatedContainer: {
        borderRadius: theme.radius.md,
        overflow: 'hidden'
    }
}));
