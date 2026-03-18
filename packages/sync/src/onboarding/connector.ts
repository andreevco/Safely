import { ZodType } from 'zod';

import { ISyncAccount } from '../account/I-sync-account';

export type OnboardingConnector<S extends Record<string, ZodType>> = {
    /**
     * The data buffer that contains the necessary information for onboarding a new device to an existing sync account.
     */
    data: Buffer;
    /**
     * Waits for the completion of the onboarding process and returns the connected sync account once the onboarding is successful.
     * Throws and error if the onboarding process isn't completed after 30 seconds
     */
    waitForCompletion: () => Promise<ISyncAccount<S>>;
    /**
     * Aborts the onboarding polling.
     */
    abort: () => void;
};
