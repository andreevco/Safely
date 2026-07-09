import { useEffect, useMemo, useRef } from 'react';
import { Easing, Keyframe } from 'react-native-reanimated';

const STEP_OFFSET = 16;

const OUT_DURATION = 80;
const IN_DELAY = 60;
const IN_DURATION = 120;
const EASING = Easing.bezier(0, 0, 0.58, 1);

type KeyframeAnimation = InstanceType<typeof Keyframe>;

export interface StepTransition {
    layerKey: number;
    entering: KeyframeAnimation | undefined;
    exiting: KeyframeAnimation;
}

export function useStepTransition(index: number): StepTransition {
    const prevIndexRef = useRef(index);
    const isFirstRef = useRef(true);

    const { entering, exiting } = useMemo(() => {
        const direction = index >= prevIndexRef.current ? 1 : -1;

        const enter = isFirstRef.current
            ? undefined
            : new Keyframe({
                  0: {
                      opacity: 0,
                      transform: [{ translateX: STEP_OFFSET * direction }]
                  },
                  100: {
                      opacity: 1,
                      transform: [{ translateX: 0 }],
                      easing: EASING
                  }
              })
                  .duration(IN_DURATION)
                  .delay(IN_DELAY);

        const exit = new Keyframe({
            0: { opacity: 1 },
            100: { opacity: 0, easing: EASING }
        }).duration(OUT_DURATION);

        return { entering: enter, exiting: exit };
    }, [index]);

    useEffect(() => {
        isFirstRef.current = false;
        prevIndexRef.current = index;
    }, [index]);

    return { layerKey: index, entering, exiting };
}
