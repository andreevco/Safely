import { useEffect, useRef } from 'react';

import { useAnalytics } from './useAnalytics';
import { useOnboardingId } from '../../shared/analytics/useOnboardingId';

export function useTrackOnboardingOpen() {
    const tracked = useRef(false);

    const analytics = useAnalytics();
    const { generate } = useOnboardingId();

    useEffect(() => {
        if (tracked.current) return;
        tracked.current = true;

        void analytics.trackOnboardingOpen({ onboardingId: generate() });
    }, [analytics, generate]);
}
