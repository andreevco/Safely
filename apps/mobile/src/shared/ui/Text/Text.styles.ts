import { Platform } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    text: {
        includeFontPadding: false,
        color: theme.colors.text.primary,
        textAlignVertical: 'center',
        variants: {
            color: {
                primary: {
                    color: theme.colors.text.primary
                },
                secondary: {
                    color: theme.colors.text.secondary
                },
                tertiary: {
                    color: theme.colors.text.tertiary
                },
                link: {
                    color: theme.colors.text.link
                },
                accentRed: {
                    color: theme.colors.accent.red
                },
                accentGreen: {
                    color: theme.colors.accent.green
                },
                constantBlack: {
                    color: theme.colors.other.constant.black
                },
                constantWhite: {
                    color: theme.colors.other.constant.white
                }
            },
            variant: {
                displayL: {
                    fontSize: 44,
                    lineHeight: 56,
                    fontWeight: '600'
                },
                titleL: {
                    fontSize: 32,
                    lineHeight: 40,
                    fontWeight: '600'
                },
                titleM: {
                    fontSize: 24,
                    lineHeight: 32,
                    fontWeight: '600'
                },
                titleS: {
                    fontSize: 20,
                    lineHeight: 28,
                    fontWeight: '600'
                },
                labelL: {
                    fontSize: 17,
                    lineHeight: 24,
                    fontWeight: '600'
                },
                labelM: {
                    fontSize: 14,
                    lineHeight: 20,
                    fontWeight: '600'
                },
                labelS: {
                    fontSize: 11,
                    lineHeight: 16,
                    fontWeight: '600'
                },
                bodyL: {
                    fontSize: 17,
                    lineHeight: 24,
                    fontWeight: '400'
                },
                bodyLMono: {
                    fontSize: 17,
                    lineHeight: 24,
                    fontWeight: '400',
                    fontFamily: Platform.OS === 'ios' ? 'ui-monospace' : 'monospace'
                },
                bodyM: {
                    fontSize: 14,
                    lineHeight: 20,
                    fontWeight: '400'
                },
                bodyS: {
                    fontSize: 11,
                    lineHeight: 16,
                    fontWeight: '400'
                }
            },
            textAlign: {
                center: {
                    textAlign: 'center'
                },
                left: {
                    textAlign: 'left'
                },
                right: {
                    textAlign: 'right'
                }
            },
            textTransform: {
                uppercase: {
                    textTransform: 'uppercase'
                },
                lowercase: {
                    textTransform: 'lowercase'
                },
                capitalize: {
                    textTransform: 'capitalize'
                }
            },
            monospace: {
                true: {
                    fontVariant: ['tabular-nums', 'lining-nums']
                }
            }
        }
    }
}));
