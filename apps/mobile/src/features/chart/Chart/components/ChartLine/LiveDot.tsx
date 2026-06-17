import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
    interpolateColor,
    type SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

import { LINE_COLOR, OPAQUE_LINE_COLOR } from '@mobile/features/chart/Chart/constants';

import { styles } from './LiveDot.styles';

type LiveDotProps = {
    x: number;
    y: number;
    eitherActive: SharedValue<boolean>;
};

export const LiveDot = (props: LiveDotProps) => {
    const { x, y, eitherActive } = props;

    const pulse = useSharedValue(0);

    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1000 }),
                withDelay(1500, withTiming(0, { duration: 1000 }))
            ),
            -1,
            true
        );
    }, [pulse]);

    const dotStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(pulse.value, [0, 1], [OPAQUE_LINE_COLOR, LINE_COLOR])
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: eitherActive.value ? 0 : 1
    }));

    return (
        <Animated.View
            pointerEvents="none"
            style={[styles.container, { left: x, top: y }, containerStyle]}
        >
            <View style={styles.halo}>
                <Animated.View style={[styles.dot, dotStyle]} />
            </View>
        </Animated.View>
    );
};
