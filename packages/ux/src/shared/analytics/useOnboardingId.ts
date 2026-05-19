import { useCallback } from 'react';

import { generateUuidV4 } from '@safely/core';

import { useSharedUxStorage } from '../storage';

export function useOnboardingId() {
    const { get, set } = useSharedUxStorage('analyticsOnboardingId');

    return useCallback(
        async (isOnboarding = false): Promise<string> => {
            const stored = await get();

            if (isOnboarding) {
                const fresh = generateUuidV4();
                await set(`onboarding:${fresh}`);

                return fresh;
            }

            if (stored?.startsWith('onboarding:')) {
                const inherited = stored.slice('onboarding:'.length);
                await set(`account:${inherited}`);

                return inherited;
            }

            const fresh = generateUuidV4();
            await set(`account:${fresh}`);

            return fresh;
        },
        [get, set]
    );
}
