import { useEffect, useState } from 'react';

type UseCountdownOptions = {
    frequencyMS?: number;
};

export function useCountdown(initial: number, options?: UseCountdownOptions): number {
    const [count, setCount] = useState(() => (initial < 0 ? 0 : initial));
    const frequencyMS = options?.frequencyMS ?? 1000;

    useEffect(() => {
        const normalized = initial < 0 ? 0 : initial;
        setCount(normalized);
    }, [initial]);

    useEffect(() => {
        if (count === 0) {
            return;
        }

        const timerId = setInterval(() => {
            setCount(prev => {
                const next = prev - 1;

                return next < 0 ? 0 : next;
            });
        }, frequencyMS);

        return () => clearInterval(timerId);
    }, [count, frequencyMS]);

    return count;
}
