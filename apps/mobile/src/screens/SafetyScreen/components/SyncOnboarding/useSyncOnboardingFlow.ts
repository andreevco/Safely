import { useCallback, useMemo, useState } from 'react';

import { useCompleteSyncOnboarding } from '@safely/ux';

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

    return useMemo(
        () => ({ index, isFirst, isLast, goNext, goBack }),
        [index, isFirst, isLast, goNext, goBack]
    );
}
