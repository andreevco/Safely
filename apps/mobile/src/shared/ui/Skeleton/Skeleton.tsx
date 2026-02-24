import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

import { styles } from './Skeleton.styles';

type SkeletonProps = {
    width: number;
    height: number;
    color?: string;
    borderRadius?: number;
    style?: ViewStyle;
};

const SHIMMER_DURATION = 2000;

export const Skeleton = ({ width, height, color, borderRadius, style }: SkeletonProps) => {
    const { theme } = useUnistyles();
    const translateX = useSharedValue(-width);

    // TODO: ask Alexey, is it okay to mix tranparentElement and transparentElement colors?
    const shimmerColor = theme.colors.other.transparentElement;

    useEffect(() => {
        translateX.value = withRepeat(
            withTiming(width, {
                duration: SHIMMER_DURATION,
                easing: Easing.inOut(Easing.ease)
            }),
            Infinity
        );
    }, [translateX, width]);

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }]
    }));

    return (
        <View
            style={[
                styles.skeleton({
                    width,
                    height,
                    borderRadius,
                    backgroundColor: color
                }),
                style
            ]}
        >
            <Animated.View style={[{ width, height, position: 'absolute' }, shimmerStyle]}>
                <LinearGradient
                    colors={['transparent', shimmerColor, 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ width, height }}
                />
            </Animated.View>
        </View>
    );
};
