import Color from 'color';
import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        borderRadius: theme.radius.md,
        borderWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement,
        backgroundColor: theme.colors.background.secondary,
        paddingVertical: theme.spacing[12],
        paddingHorizontal: theme.spacing[16],
        gap: theme.spacing[4],
        variants: {
            variant: {
                warning: {
                    backgroundColor: Color(theme.colors.accent.orange).alpha(0.16).toString()
                },
                danger: {
                    backgroundColor: Color(theme.colors.accent.red).alpha(0.16).toString()
                }
            }
        }
    },
    text: {
        color: theme.colors.text.primary,
        variants: {
            variant: {
                warning: {
                    color: theme.colors.accent.orange
                },
                danger: {
                    color: theme.colors.accent.red
                }
            }
        }
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    icon: {
        tintColor: theme.colors.icon.secondary,
        variants: {
            variant: {
                warning: {
                    tintColor: theme.colors.accent.orange
                },
                danger: {
                    tintColor: theme.colors.accent.red
                }
            }
        }
    }
}));
