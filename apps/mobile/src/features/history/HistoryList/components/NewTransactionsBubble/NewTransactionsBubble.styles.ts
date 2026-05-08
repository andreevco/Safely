import { Easing, withTiming } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        position: 'absolute',
        alignItems: 'center',
        top: 0,
        left: 0,
        right: 0,
        padding: theme.spacing[8]
    }
}));

const SHOW_DURATION = 240;
const HIDE_DURATION = 180;
export const ORIGIN_Y = -12;

export function ShowInAnimation() {
    'worklet';
    const animations = {
        originY: withTiming(0, {
            duration: SHOW_DURATION,
            easing: Easing.out(Easing.cubic)
        }),
        opacity: withTiming(1, {
            duration: Math.max(120, SHOW_DURATION - 60),
            easing: Easing.out(Easing.cubic)
        })
    };

    const initialValues = {
        originY: ORIGIN_Y,
        opacity: 0
    };

    return {
        animations,
        initialValues
    };
}

export function ShowOutAnimation() {
    'worklet';
    const animations = {
        originY: withTiming(ORIGIN_Y, {
            duration: HIDE_DURATION,
            easing: Easing.in(Easing.cubic)
        }),
        opacity: withTiming(0, {
            duration: Math.max(120, HIDE_DURATION - 40),
            easing: Easing.in(Easing.cubic)
        })
    };

    return {
        animations,
        initialValues: {
            originY: 0,
            opacity: 1
        }
    };
}
