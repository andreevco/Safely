import { ZodType } from 'zod';

import { ISyncAccount } from './I-sync-account';
import { OnboardingConnector } from '../onboarding/connector';

export interface ISyncAccountFactory<S extends Record<string, ZodType>> {
    createOfflineSyncAccount(): Promise<ISyncAccount<S>>;
    connectToExistingSyncAccount(): Promise<OnboardingConnector<S>>;
    getSyncAccounts(): Promise<ISyncAccount<S>[]>;
}
