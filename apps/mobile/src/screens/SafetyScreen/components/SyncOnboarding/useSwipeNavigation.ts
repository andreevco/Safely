import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-worklets';

const SWIPE_DISTANCE_THRESHOLD = 48;
const SWIPE_VELOCITY_THRESHOLD = 500;

interface UseSwipeNavigationParams {
    onSwipeNext: () => void;
    onSwipeBack: () => void;
}

export function useSwipeNavigation({ onSwipeNext, onSwipeBack }: UseSwipeNavigationParams) {
    return useMemo(() => {
        return Gesture.Pan().onEnd((event, success) => {
            'worklet';
            if (!success) {
                return;
            }

            const passedDistance = Math.abs(event.translationX) > SWIPE_DISTANCE_THRESHOLD;
            const passedVelocity = Math.abs(event.velocityX) > SWIPE_VELOCITY_THRESHOLD;

            if (!passedDistance && !passedVelocity) {
                return;
            }

            const direction = passedVelocity
                ? Math.sign(event.velocityX)
                : Math.sign(event.translationX);

            if (direction < 0) {
                runOnJS(onSwipeNext)();
            } else if (direction > 0) {
                runOnJS(onSwipeBack)();
            }
        });
    }, [onSwipeNext, onSwipeBack]);
}
