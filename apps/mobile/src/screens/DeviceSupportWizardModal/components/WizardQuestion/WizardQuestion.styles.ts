import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        width: '100%',
        padding: theme.spacing[24],
        borderTopWidth: theme.border.hairline,
        borderTopColor: theme.colors.other.transparentElement,
        variants: {
            hasActionBelow: {
                true: {
                    paddingBottom: theme.spacing[16]
                }
            }
        }
    },
    checkmark: {
        minWidth: 28,
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        marginBottom: theme.spacing[12]
    }
}));
