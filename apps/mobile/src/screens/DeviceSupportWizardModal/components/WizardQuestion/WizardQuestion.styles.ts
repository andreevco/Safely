import { StyleSheet } from 'react-native-unistyles';

const CHECKMARK_SIZE = 28;

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
        width: CHECKMARK_SIZE,
        height: CHECKMARK_SIZE,
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        marginBottom: theme.spacing[12]
    }
}));
