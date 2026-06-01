import type { StorageVersion } from '@safely/slottree';

import type { ISyncAccount } from './I-sync-account';
import type { ITreeStorage } from '../I-storage';
import type { OnboardingConnector } from '../onboarding/connector';

export interface ISyncAccountFactory<Latest extends StorageVersion> {
    connectToExistingSyncAccount(
        secureEncryptedStorage: ITreeStorage
    ): Promise<OnboardingConnector<Latest>>;
    createSyncAccount(secureEncryptedStorage: ITreeStorage): Promise<ISyncAccount<Latest>>;
    getSyncAccounts(): Promise<ISyncAccount<Latest>[]>;
    getSyncAccount(accountId: string): Promise<ISyncAccount<Latest>>;
    deleteLocalAccount(accountId: string, secureEncryptedStorage: ITreeStorage): Promise<void>;
}
