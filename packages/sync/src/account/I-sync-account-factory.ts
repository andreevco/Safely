import { ZodType } from 'zod';

import { ISyncAccount } from './I-sync-account';
import { ITreeStorage } from '../I-storage';
import { OnboardingConnector } from '../onboarding/connector';

export interface ISyncAccountFactory<S extends Record<string, ZodType>> {
    connectToExistingSyncAccount(
        secureEncryptedStorage: ITreeStorage
    ): Promise<OnboardingConnector<S>>;
    createSyncAccount(secureEncryptedStorage: ITreeStorage): Promise<ISyncAccount<S>>;
    getSyncAccounts(): Promise<ISyncAccount<S>[]>;
    getSyncAccount(accountId: string): Promise<ISyncAccount<S>>;
    deleteLocalAccount(accountId: string, secureEncryptedStorage: ITreeStorage): Promise<void>;
}
