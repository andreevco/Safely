import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing[8],
        paddingHorizontal: theme.spacing[16],
        borderBottomWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement,
        gap: theme.spacing[4],
        variants: {
            isLast: {
                true: {
                    borderBottomWidth: 0
                }
            },
            isRightColumn: {
                true: {
                    borderLeftWidth: theme.border.hairline
                }
            }
        }
    },
    number: {
        width: 24
    }
}));
