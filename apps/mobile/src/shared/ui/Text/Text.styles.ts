import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    text: {
        color: theme.colors.text.primary,
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
                }
            },
            variant: {
                displayL: {
                    fontSize: 44,
                    lineHeight: 56,
                    fontWeight: '600',
                    letterSpacing: 0.35
                },
                titleL: {
                    fontSize: 24,
                    lineHeight: 32,
                    fontWeight: '600',
                    letterSpacing: 0.07
                },
                titleS: {
                    fontSize: 20,
                    lineHeight: 28,
                    fontWeight: '600',
                    letterSpacing: -0.46
                },
                labelL: {
                    fontSize: 17,
                    lineHeight: 24,
                    fontWeight: '600',
                    letterSpacing: -0.44
                },
                labelM: {
                    fontSize: 14,
                    lineHeight: 20,
                    fontWeight: '600',
                    letterSpacing: -0.15
                },
                labelS: {
                    fontSize: 11,
                    lineHeight: 16,
                    fontWeight: '600',
                    letterSpacing: 0.07
                },
                bodyL: {
                    fontSize: 17,
                    lineHeight: 24,
                    fontWeight: '400',
                    letterSpacing: -0.44
                },
                bodyM: {
                    fontSize: 14,
                    lineHeight: 20,
                    fontWeight: '400',
                    letterSpacing: -0.15
                },
                bodyS: {
                    fontSize: 11,
                    lineHeight: 16,
                    fontWeight: '400',
                    letterSpacing: 0.07
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
            capitalize: {
                true: {
                    textTransform: 'capitalize'
                }
            }
        }
    }
}));
