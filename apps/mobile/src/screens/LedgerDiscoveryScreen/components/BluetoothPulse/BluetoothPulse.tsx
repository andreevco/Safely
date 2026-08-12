import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

import { BluetoothAccent96, Icon } from '@mobile/shared/ui';

import { styles } from './BluetoothPulse.styles';

export const BluetoothPulse = () => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }),
            -1,
            false
        );
    }, [progress]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(progress.value, [0, 1], [0.6, 1.4]) }],
        opacity: interpolate(progress.value, [0, 1], [0.32, 0])
    }));

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.pulse, pulseStyle]} />
            <Icon icon={BluetoothAccent96} />
        </View>
    );
};
