import { StorageVersion } from '@safely/slottree';

import { ISyncAccount } from './I-sync-account';
import { ITreeStorage } from '../I-storage';
import { OnboardingConnector } from '../onboarding/connector';

export interface ISyncAccountFactory<Latest extends StorageVersion> {
    connectToExistingSyncAccount(
        secureEncryptedStorage: ITreeStorage
    ): Promise<OnboardingConnector<Latest>>;
    createSyncAccount(secureEncryptedStorage: ITreeStorage): Promise<ISyncAccount<Latest>>;
    getSyncAccounts(): Promise<ISyncAccount<Latest>[]>;
    getSyncAccount(accountId: string): Promise<ISyncAccount<Latest>>;
    deleteLocalAccount(accountId: string, secureEncryptedStorage: ITreeStorage): Promise<void>;
}
