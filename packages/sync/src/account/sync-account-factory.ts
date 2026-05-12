import type { AssertVersionHList, HCons, StorageVersion } from '@safely/slottree';

import { AccountManager } from './account-manager';
import type { ISyncAccount } from './I-sync-account';
import type { ISyncAccountFactory } from './I-sync-account-factory';
import type { ITreeStorage } from '../I-storage';
import { CreateAccountService } from './create-account-service';
import { SyncAccountRepository } from './sync-account-repository';
import { Configuration } from '../api/generated';
import type { SyncApiConfiguration } from '../api/sync-api-configuration';
import { ed25519_keygen } from '../crypto/ed25519';
import type { Logger } from '../logger';
import type { OnboardingConnector } from '../onboarding/connector';
import { accountsApiForOnboarding, NewDeviceOnboarding } from '../onboarding/new-device-onboarding';
import type { SyncApiImplementations } from '../sync-container';

type VersionHList = HCons<StorageVersion, unknown>;
type LatestOf<Versions extends VersionHList> = Versions['head'];
type RestOf<Versions extends VersionHList> = Versions['tail'];

export type SyncAccountFactoryOptions<Versions extends VersionHList> = {
    storage: ITreeStorage;
    encryptedStorage: ITreeStorage;
    versions: Versions & AssertVersionHList<Versions>;
    apiConfiguration?: SyncApiConfiguration;
    apiImplementations?: SyncApiImplementations;
    noAccountLogger: Logger;
    getAccountLogger: (accountId: string) => Logger;
};

export class SyncAccountFactory<Versions extends VersionHList> implements ISyncAccountFactory<
    LatestOf<Versions>
> {
    private readonly syncAccountIdRepository: SyncAccountRepository;
    private readonly accountManager: AccountManager<LatestOf<Versions>, RestOf<Versions>>;
    private readonly apiConfiguration: Configuration;
    private readonly apiImplementations?: SyncApiImplementations;
    private readonly noAccountLogger: Logger;

    constructor(opts: SyncAccountFactoryOptions<Versions>) {
        this.syncAccountIdRepository = new SyncAccountRepository(opts.storage);
        this.apiConfiguration = new Configuration(opts.apiConfiguration);
        this.apiImplementations = opts.apiImplementations;
        this.noAccountLogger = opts.noAccountLogger;

        const createAccountService = new CreateAccountService(
            opts.storage,
            opts.encryptedStorage,
            this.syncAccountIdRepository,
            opts.versions,
            this.apiConfiguration,
            this.apiImplementations,
            opts.getAccountLogger
        );
        this.accountManager = new AccountManager(
            opts.storage,
            opts.encryptedStorage,
            this.syncAccountIdRepository,
            opts.versions,
            this.apiConfiguration,
            this.apiImplementations,
            createAccountService,
            opts.getAccountLogger
        );
    }

    /**
     * Initiates the process of connecting to an existing sync account.
     * This method returns an OnboardingConnector which contains the data needed for onboarding and
     * a method to wait for the completion of the onboarding process.
     */
    public async connectToExistingSyncAccount(
        secureEncryptedStorage: ITreeStorage
    ): Promise<OnboardingConnector<LatestOf<Versions>>> {
        const ikKeypair = ed25519_keygen();
        const accountsApi =
            this.apiImplementations?.accountsApi ??
            accountsApiForOnboarding(ikKeypair, this.apiConfiguration);
        const onboarding = new NewDeviceOnboarding(
            ikKeypair,
            accountsApi,
            this.accountManager,
            secureEncryptedStorage,
            this.noAccountLogger
        );
        const data = onboarding.generateOnboardingData();
        const abortController = new AbortController();
        return {
            data,
            waitForCompletion: async () => {
                return await onboarding.waitForOnboarding(abortController.signal);
            },
            abort: () => {
                abortController.abort();
            }
        };
    }

    /**
     * Creates a new offline sync account. The account will be stored locally and can be made online later.
     */
    public async createSyncAccount(
        secureEncryptedStorage: ITreeStorage
    ): Promise<ISyncAccount<LatestOf<Versions>>> {
        return await this.accountManager.createOfflineAccount(secureEncryptedStorage);
    }

    /**
     * Returns a list of all sync accounts available. This includes both online and offline accounts.
     */
    public async getSyncAccounts(): Promise<ISyncAccount<LatestOf<Versions>>[]> {
        return await this.accountManager.getAccounts();
    }

    /**
     * Returns the sync account with the specified account ID.
     * @param accountId
     */
    public async getSyncAccount(accountId: string): Promise<ISyncAccount<LatestOf<Versions>>> {
        return await this.accountManager.getSyncAccount(accountId);
    }

    /**
     * 1. Revokes the device from the account and sends new snapshot to the server (skip if API call fails)
     * 2. Revokes the device from the server (skip if API call fails)
     * 3. Deletes the account data from local storage
     * @param accountId
     */
    public async deleteLocalAccount(
        accountId: string,
        secureEncryptedStorage: ITreeStorage
    ): Promise<void> {
        await this.accountManager.deleteAccount(accountId, secureEncryptedStorage);
    }
}
