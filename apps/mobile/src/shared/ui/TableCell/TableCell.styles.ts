import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    touchable: {
        backgroundColor: theme.colors.background.secondary
    },
    container: {
        flexDirection: 'row',
        gap: theme.spacing[8],
        paddingHorizontal: theme.spacing[16],
        paddingVertical: theme.spacing[12],
        variants: {
            showDivider: {
                true: {
                    borderBottomWidth: theme.border.hairline,
                    borderBottomColor: theme.colors.other.transparentElement
                }
            }
        }
    },
    divider: {
        borderBottomWidth: theme.border.hairline,
        borderBottomColor: theme.colors.other.transparentElement
    }
}));
