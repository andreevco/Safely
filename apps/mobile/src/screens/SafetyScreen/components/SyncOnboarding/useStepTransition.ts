import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { ViewStyle } from 'react-native';
import {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
    type AnimatedStyle
} from 'react-native-reanimated';

const STEP_OFFSET = 16;

const OUT_DURATION = 80;
const IN_DELAY = 60;
const IN_DURATION = 120;
const EASING = Easing.bezier(0, 0, 0.58, 1);

export interface StepTransition {
    previousIndex: number | null;
    outgoingStyle: AnimatedStyle<ViewStyle>;
    incomingStyle: AnimatedStyle<ViewStyle>;
    isAnimating: boolean;
}

export function useStepTransition(index: number): StepTransition {
    const prevIndexRef = useRef(index);
    const generationRef = useRef(0);
    const [previousIndex, setPreviousIndex] = useState<number | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const outProgress = useSharedValue(1);
    const inProgress = useSharedValue(1);
    const direction = useSharedValue<1 | -1>(1);

    const finalize = useCallback((generation: number) => {
        if (generation !== generationRef.current) {
            return;
        }

        setPreviousIndex(null);
        setIsAnimating(false);
    }, []);

    useLayoutEffect(() => {
        const from = prevIndexRef.current;

        if (from === index) {
            return;
        }

        prevIndexRef.current = index;
        const generation = ++generationRef.current;

        direction.value = index >= from ? 1 : -1;
        setPreviousIndex(from);
        setIsAnimating(true);

        outProgress.value = 1 - inProgress.value;
        inProgress.value = 0;

        outProgress.value = withTiming(1, { duration: OUT_DURATION, easing: EASING });
        inProgress.value = withDelay(
            IN_DELAY,
            withTiming(1, { duration: IN_DURATION, easing: EASING }, finished => {
                if (finished) {
                    runOnJS(finalize)(generation);
                }
            })
        );
    }, [index, direction, outProgress, inProgress, finalize]);

    const outgoingStyle = useAnimatedStyle(() => ({
        opacity: 1 - outProgress.value
    }));

    const incomingStyle = useAnimatedStyle(() => ({
        opacity: inProgress.value,
        transform: [{ translateX: (1 - inProgress.value) * STEP_OFFSET * direction.value }]
    }));

    return { previousIndex, outgoingStyle, incomingStyle, isAnimating };
}
