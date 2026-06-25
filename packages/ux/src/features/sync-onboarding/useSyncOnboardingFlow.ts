import { useCallback, useMemo, useState } from 'react';

import { useCompleteSyncOnboarding } from '../../entities';

interface UseSyncOnboardingFlowParams {
    stepCount: number;
    onFinish: () => void;
}

export function useSyncOnboardingFlow({ stepCount, onFinish }: UseSyncOnboardingFlowParams) {
    const [index, setIndex] = useState(0);
    const { mutateAsync: complete } = useCompleteSyncOnboarding();

    const isFirst = index === 0;
    const isLast = index === stepCount - 1;

    const goNext = useCallback(async () => {
        if (isLast) {
            await complete();
            onFinish();
            return;
        }
        setIndex(i => Math.min(i + 1, stepCount - 1));
    }, [isLast, complete, onFinish, stepCount]);

    const goBack = useCallback(() => {
        setIndex(i => Math.max(i - 1, 0));
    }, []);

    const moveToIndex = useCallback(
        (next: number) =>
            setIndex(prev => (prev === next ? prev : Math.max(0, Math.min(next, stepCount - 1)))),
        [stepCount]
    );

    return useMemo(
        () => ({ index, isFirst, isLast, goNext, goBack, moveToIndex }),
        [index, isFirst, isLast, goNext, goBack, moveToIndex]
    );
}
