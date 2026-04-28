import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    backdrop: {
        ...StyleSheet.absoluteFillObject
    },
    menu: {
        position: 'absolute',
        gap: theme.spacing[8],
        zIndex: 1000
    },
    menuLayout: {
        left: theme.spacing[48],
        right: theme.spacing[48],
        variants: {
            variant: {
                fullWidth: {
                    left: theme.spacing[8],
                    right: theme.spacing[8]
                },
                compact: {
                    left: undefined,
                    right: undefined,
                    alignSelf: 'flex-end' as const
                }
            }
        }
    },
    footer: {
        position: 'absolute',
        bottom: rt.insets.bottom + theme.spacing[24],
        left: 0,
        right: 0,
        alignItems: 'center'
    },
    header: {
        position: 'absolute',
        top: rt.insets.top + 2,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row'
    }
}));
