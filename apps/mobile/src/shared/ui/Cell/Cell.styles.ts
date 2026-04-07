import Color from 'color';
import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        variants: {
            background: {
                accentRed: {
                    backgroundColor: new Color(theme.colors.accent.red).alpha(0.16).toString()
                },
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
        minHeight: 48,
        alignItems: 'center',
        gap: theme.spacing[16],
        paddingHorizontal: theme.spacing[16],
        paddingVertical: 10,
        borderBottomWidth: showDivider ? theme.border.hairline : 0,
        borderBottomColor: theme.colors.other.transparentElement
    })
}));
