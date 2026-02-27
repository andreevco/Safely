import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        variants: {
            background: {
                secondary: {
                    backgroundColor: theme.colors.background.secondary
                },
                tertiary: {
                    backgroundColor: theme.colors.background.tertiary
                }
            }
        }
    },
    content: (showDivider: boolean) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[16],
        paddingHorizontal: theme.spacing[16],
        paddingVertical: 10,
        borderBottomWidth: showDivider ? theme.border.hairline : 0,
        borderBottomColor: theme.colors.other.transparentElement
    })
}));
