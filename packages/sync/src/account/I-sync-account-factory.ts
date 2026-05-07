import type { ZodType } from 'zod';

import type { ISyncAccount } from './I-sync-account';
import type { ITreeStorage } from '../I-storage';
import type { OnboardingConnector } from '../onboarding/connector';

export interface ISyncAccountFactory<S extends Record<string, ZodType>> {
    connectToExistingSyncAccount(
        secureEncryptedStorage: ITreeStorage
    ): Promise<OnboardingConnector<S>>;
    createSyncAccount(secureEncryptedStorage: ITreeStorage): Promise<ISyncAccount<S>>;
    getSyncAccounts(): Promise<ISyncAccount<S>[]>;
    getSyncAccount(accountId: string): Promise<ISyncAccount<S>>;
    deleteLocalAccount(accountId: string, secureEncryptedStorage: ITreeStorage): Promise<void>;
}
