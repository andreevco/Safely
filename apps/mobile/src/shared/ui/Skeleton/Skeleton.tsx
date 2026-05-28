import { useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    interpolateColor
} from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

import { styles } from './Skeleton.styles';

type SkeletonProps = {
    width: number;
    height: number;
    borderRadius?: number;
    style?: ViewStyle;
    variant?: 'transparentElement' | 'secondary';
};

const PULSE_DURATION = 600;

export const Skeleton = ({
    width,
    height,
    borderRadius,
    variant = 'secondary',
    style
}: SkeletonProps) => {
    const { theme } = useUnistyles();
    const progress = useSharedValue(0);

    const colors = {
        transparentElement: {
            start: theme.colors.other.transparentElement,
            end: 'rgba(255, 255, 255, 0.12)'
        },
        secondary: {
            start: theme.colors.background.secondary,
            end: theme.colors.background.tertiary
        }
    };

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, {
                duration: PULSE_DURATION,
                easing: Easing.inOut(Easing.ease)
            }),
            Infinity,
            true
        );
    }, [progress]);

    const animatedStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            progress.value,
            [0, 1],
            [colors[variant].start, colors[variant].end]
        )
    }));

    return (
        <Animated.View
            style={[styles.skeleton({ width, height, borderRadius }), animatedStyle, style]}
        />
    );
};
