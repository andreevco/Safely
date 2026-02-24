import { useCallback, useRef, useState } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

export type UseScrollPositionOptions = {
    threshold?: number;
    throttleMs?: number;
};

export type UseScrollPositionResult = {
    atTop: boolean;
    atBottom: boolean;
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export function useScrollPosition(options: UseScrollPositionOptions = {}): UseScrollPositionResult {
    const { threshold = 5, throttleMs = 100 } = options;
    const [position, setPosition] = useState({ atTop: true, atBottom: false });
    const lastInvocationRef = useRef<number>(0);

    const onScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const now = Date.now();
            if (now - lastInvocationRef.current < throttleMs) return;

            lastInvocationRef.current = now;

            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const y = contentOffset.y;
            const maxY = contentSize.height - layoutMeasurement.height;

            const atTop = y <= threshold;
            const atBottom = maxY <= 0 || y >= maxY - threshold;

            setPosition((prev: { atTop: boolean; atBottom: boolean }) => {
                if (prev.atTop === atTop && prev.atBottom === atBottom) return prev;
                return { atTop, atBottom };
            });
        },
        [threshold, throttleMs]
    );

    return {
        atTop: position.atTop,
        atBottom: position.atBottom,
        onScroll
    };
}
