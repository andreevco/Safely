import { ZodType } from 'zod';

import { ISyncAccount } from './I-sync-account';
import { AccountID } from './sync-account-repository';
import { OnboardingConnector } from '../onboarding/connector';

export interface ISyncAccountFactory<S extends Record<string, ZodType>> {
    connectToExistingSyncAccount(): Promise<OnboardingConnector<S>>;
    createOfflineSyncAccount(): Promise<ISyncAccount<S>>;
    makeOfflineAccountOnline(accountId: AccountID): Promise<ISyncAccount<S>>;
    getSyncAccounts(): Promise<ISyncAccount<S>[]>;
    getSyncAccount(accountId: string): Promise<ISyncAccount<S>>;
    deleteLocalAccount(accountId: string): Promise<void>;
}
