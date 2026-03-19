import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    item: {
        height: 48,
        paddingRight: theme.spacing[8]
    },
    itemContainer: {
        borderRadius: theme.radius.md,
        overflow: 'hidden',
        variants: {
            variant: {
                compact: {
                    borderRadius: 0
                }
            }
        }
    },
    row: {
        alignItems: 'center'
    }
}));
