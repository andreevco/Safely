import { ZodType } from 'zod';

import { ISyncAccount } from './I-sync-account';
import { OnboardingConnector } from '../onboarding/connector';

export interface ISyncAccountFactory<S extends Record<string, ZodType>> {
    connectToExistingSyncAccount(): Promise<OnboardingConnector<S>>;
    createSyncAccount(): Promise<ISyncAccount<S>>;
    getSyncAccounts(): Promise<ISyncAccount<S>[]>;
    getSyncAccount(accountId: string): Promise<ISyncAccount<S>>;
    deleteLocalAccount(accountId: string): Promise<void>;
}
