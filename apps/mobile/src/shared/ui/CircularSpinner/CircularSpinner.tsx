import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

import { Icon, Loader56 } from '@mobile/shared/ui/Icon';

import { styles } from './CircularSpinner.styles';

interface CircularSpinnerProps {
    size?: number;
}

export const CircularSpinner = ({ size }: CircularSpinnerProps) => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, { duration: 1000, easing: Easing.linear }),
            -1,
            false
        );
    }, [rotation]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }]
    }));

    return (
        <View style={styles.wrapper}>
            <Animated.View style={animatedStyle}>
                <Icon icon={Loader56} size={size} />
            </Animated.View>
        </View>
    );
};
