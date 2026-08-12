import { defineQueryKeys, finalKey } from '../../shared';

export const syncOnboardingKeys = defineQueryKeys('syncOnboarding', {
    completed: finalKey
});
