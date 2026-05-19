import { useEffect, useRef } from 'react';

import { useAnalytics } from './useAnalytics';
import { useOnboardingId } from '../../shared/analytics/useOnboardingId';

export function useTrackOnboardingOpen() {
    const tracked = useRef(false);

    const analytics = useAnalytics();
    const getOnboardingId = useOnboardingId();

    useEffect(() => {
        if (tracked.current) return;
        tracked.current = true;

        void (async () => {
            const onboardingId = await getOnboardingId();
            await analytics.trackOnboardingOpen({ onboardingId });
        })();
    }, [analytics, getOnboardingId]);
}
