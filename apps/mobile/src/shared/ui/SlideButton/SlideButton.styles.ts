import { StyleSheet } from 'react-native-unistyles';

import { KNOB_WIDTH } from './config';

export const styles = StyleSheet.create(theme => ({
    container: {
        height: 72,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.background.secondary,
        justifyContent: 'center',
        overflow: 'hidden',
        variants: {
            disabled: {
                true: {
                    opacity: 0.5
                },
                false: {
                    opacity: 1
                }
            }
        }
    },
    textContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        paddingHorizontal: theme.spacing[16],
        alignItems: 'center',
        justifyContent: 'center'
    },
    knobWrapper: {
        height: '100%',
        justifyContent: 'center',
        padding: theme.spacing[4]
    },
    knob: {
        width: KNOB_WIDTH,
        height: '100%',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.button.primary.background,
        alignItems: 'center',
        justifyContent: 'center'
    }
}));
