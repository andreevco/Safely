import { useCallback, useMemo } from 'react';
import type { LayoutChangeEvent, ViewProps } from 'react-native';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

import { ArrowRight28, Icon } from '../Icon';
import { Text } from '../Text';
import { COMPLETE_THRESHOLD, KNOB_WIDTH, SPRING_CONFIG, TRACK_HORIZONTAL_PADDING } from './config';
import { styles } from './SlideButton.styles';

type SlideButtonProps = ViewProps & {
    label: string;
    description: string;
    disabled?: boolean;
    onSlideComplete?: () => void;
};

export const SlideButton = (props: SlideButtonProps) => {
    const { label, description, style, disabled, onSlideComplete, ...rest } = props;

    const translateX = useSharedValue(0);
    const maxTranslateX = useSharedValue(0);
    const startX = useSharedValue(0);

    const handleComplete = useCallback(() => {
        onSlideComplete?.();
    }, [onSlideComplete]);

    const onTrackLayout = useCallback(
        (event: LayoutChangeEvent) => {
            const { width } = event.nativeEvent.layout;

            maxTranslateX.value =
                width - KNOB_WIDTH - TRACK_HORIZONTAL_PADDING * 2 > 0
                    ? width - KNOB_WIDTH - TRACK_HORIZONTAL_PADDING * 2
                    : 0;
        },
        [maxTranslateX]
    );

    const panGesture = useMemo(() => {
        return Gesture.Pan()
            .enabled(!disabled)
            .onBegin(() => {
                'worklet';
                startX.value = translateX.value;
            })
            .onUpdate(event => {
                'worklet';
                const nextX = startX.value + event.translationX;
                translateX.value = Math.min(Math.max(nextX, 0), maxTranslateX.value);
            })
            .onEnd(() => {
                'worklet';

                const shouldComplete =
                    maxTranslateX.value > 0 &&
                    translateX.value > maxTranslateX.value * COMPLETE_THRESHOLD;

                if (shouldComplete) {
                    translateX.value = withSpring(maxTranslateX.value, SPRING_CONFIG);
                    runOnJS(handleComplete)();
                } else {
                    translateX.value = withSpring(0, SPRING_CONFIG);
                }
            });
    }, [disabled, handleComplete, maxTranslateX, startX, translateX]);

    const knobStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }]
    }));

    const textAnimatedStyle = useAnimatedStyle(() => {
        if (maxTranslateX.value <= 0) {
            return {};
        }

        const opacity = interpolate(
            translateX.value,
            [0, maxTranslateX.value * 0.2],
            [1, 0],
            Extrapolation.CLAMP
        );

        return { opacity };
    });

    styles.useVariants({
        disabled: !!disabled
    });

    return (
        <View style={[styles.container, style]} onLayout={onTrackLayout} {...rest}>
            <Animated.View style={[styles.textContainer, textAnimatedStyle]} pointerEvents="none">
                <Text variant="labelL" textAlign="center">
                    {label}
                </Text>
                {!!description && (
                    <Text variant="bodyM" color="tertiary" textAlign="center">
                        {description}
                    </Text>
                )}
            </Animated.View>

            <GestureDetector gesture={panGesture}>
                <Animated.View style={styles.knobWrapper}>
                    <Animated.View style={[styles.knob, knobStyle]}>
                        <Icon icon={ArrowRight28} color="primary" />
                    </Animated.View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
};
