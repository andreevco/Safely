import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    hover: {
        backgroundColor: theme.colors.background.secondary
    },
    wrapper: {
        paddingVertical: theme.spacing[12],
        paddingHorizontal: theme.spacing[16],
        variants: {
            showDivider: {
                true: {
                    borderBottomWidth: theme.border.hairline,
                    borderBottomColor: theme.colors.other.transparentElement
                }
            }
        }
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: theme.spacing[8]
    },
    label: {
        width: 120
    },
    value: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center'
    }
}));
