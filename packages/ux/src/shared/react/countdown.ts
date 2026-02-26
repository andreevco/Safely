import { useCallback, useEffect, useRef, useState } from 'react';

import { useInterval } from './interval';

type UseCountdownOptions = {
    frequencyMS?: number;
};

export function useReactiveCountdown(initial: number, options?: UseCountdownOptions): number {
    const [count, setCount] = useState(() => (initial < 0 ? 0 : initial));
    const frequencyMS = options?.frequencyMS ?? 1000;

    useEffect(() => {
        setCount(initial < 0 ? 0 : initial);
    }, [initial]);

    const tick = useCallback(() => {
        setCount(prev => (prev <= 0 ? 0 : prev - 1));
    }, []);

    useInterval(tick, count > 0 ? frequencyMS : null);

    return count;
}

export function useCountdown(initial: number, options?: UseCountdownOptions): number {
    const initialRef = useRef(initial);
    return useReactiveCountdown(initialRef.current, options);
}

export function useCountdownTo(timestamp: number | null): number {
    const cache = useRef({
        timestamp,
        seconds: timestamp ? Math.ceil((timestamp - Date.now()) / 1000) : 0
    });

    if (cache.current.timestamp !== timestamp) {
        cache.current = {
            timestamp,
            seconds: timestamp ? Math.ceil((timestamp - Date.now()) / 1000) : 0
        };
    }

    return useReactiveCountdown(cache.current.seconds);
}
