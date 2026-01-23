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
            }
        }
    },
    divider: {
        height: theme.border.hairline,
        // TODO: Fix for divider inside Cell
        backgroundColor: 'rgba(40, 40, 43, 1)',
        width: '100%'
    },
    separatedContainer: {
        borderRadius: theme.radius.md,
        overflow: 'hidden'
    }
}));
