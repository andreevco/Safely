import { useEffect } from 'react';

import { useAnalytics } from './useAnalytics';
import { useOnboardingId } from './useOnboardingId';

export function useTrackOnboardingOpen() {
    const analytics = useAnalytics();
    const getOnboardingId = useOnboardingId();

    useEffect(() => {
        void (async () => {
            const onboardingId = await getOnboardingId();
            await analytics.trackOnboardingOpen({ onboardingId });
        })();
    }, [analytics, getOnboardingId]);
}
