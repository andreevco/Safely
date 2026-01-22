import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    group: {
        borderRadius: theme.radius.md,
        overflow: 'hidden',
        paddingBottom: theme.spacing[8],
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
        backgroundColor: theme.colors.other.transparentElement,
        width: '100%'
    }
}));
