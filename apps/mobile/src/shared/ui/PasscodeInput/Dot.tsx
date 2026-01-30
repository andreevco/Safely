import { useEffect } from 'react';
import { View, ViewProps } from 'react-native';
import Animated, {
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

import { styles } from './Dot.styles';

export interface DotProps extends ViewProps {
    isFilled: boolean;
    isError?: SharedValue<boolean>;
    isSuccess?: SharedValue<boolean>;
}

export const Dot = (props: DotProps) => {
    const { isFilled, isSuccess, isError } = props;
    const { theme } = useUnistyles();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        let backgroundColor = theme.colors.accent.accent;

        if (isSuccess?.value) {
            backgroundColor = theme.colors.accent.green;
        } else if (isError?.value) {
            backgroundColor = theme.colors.accent.red;
        }

        return {
            backgroundColor: withTiming(backgroundColor, { duration: 100 }),
            opacity: withTiming(isFilled ? 1 : 0, { duration: 50 }),
            transform: [{ scale: scale.value }]
        };
    });

    useEffect(() => {
        if (isFilled) {
            scale.value = withSequence(
                withTiming(1.25, { duration: 50 }),
                withTiming(1, { duration: 50 })
            );
        }
    }, [isFilled, scale]);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.dot, animatedStyle]} />
        </View>
    );
};
