import { useCallback } from 'react';

import { generateUuidV4 } from '@safely/core';

import { useSharedUxStorage } from '../storage';

export function useOnboardingId() {
    const { get, set } = useSharedUxStorage('analyticsOnboardingId');

    return useCallback(async (): Promise<string> => {
        const stored = await get();
        if (stored) return stored;

        const fresh = generateUuidV4();
        await set(fresh);

        return fresh;
    }, [get, set]);
}
