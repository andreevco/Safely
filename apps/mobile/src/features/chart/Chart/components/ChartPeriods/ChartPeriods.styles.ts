import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    tab: {
        paddingHorizontal: theme.spacing[8],
        paddingVertical: theme.spacing[2],
        borderRadius: theme.radius.xs,
        borderWidth: theme.border.hairline,
        variants: {
            isActive: {
                true: {
                    backgroundColor: theme.colors.background.tertiary,
                    borderColor: theme.colors.other.transparentElement
                },
                false: {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent'
                }
            }
        }
    },
    tabContainer: {
        flex: 1,
        paddingTop: theme.spacing[12],
        paddingBottom: theme.spacing[4],
        alignItems: 'center',
        justifyContent: 'center'
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center'
    }
}));
