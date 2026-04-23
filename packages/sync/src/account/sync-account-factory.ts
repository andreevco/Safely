import { AccountManager } from './account-manager';
import { ISyncAccount } from './I-sync-account';
import { ITreeStorage } from '../I-storage';
import { CreateAccountService } from './create-account-service';
import { ISyncAccountFactory } from './I-sync-account-factory';
import { SyncAccountRepository } from './sync-account-repository';
import { Configuration } from '../api/generated';
import { SyncApiConfiguration } from '../api/sync-api-configuration';
import { validateSyncDataScheme } from '../crdt/deep-merge/z-schema';
import { AssertVersionChain, chainToRuntimeArray, LastNew } from '../crdt/version';
import { ed25519_keygen } from '../crypto/ed25519';
import { Logger, LogLevel } from '../logger/logger';
import { OnboardingConnector } from '../onboarding/connector';
import { accountsApiForOnboarding, NewDeviceOnboarding } from '../onboarding/new-device-onboarding';

export class SyncAccountFactory<const S extends readonly unknown[]> implements ISyncAccountFactory<
    LastNew<S>
> {
    private readonly syncAccountIdRepository: SyncAccountRepository;
    private readonly accountManager: AccountManager<LastNew<S>>;
    private readonly apiConfiguration: Configuration;
    private readonly logger: Logger;

    constructor(opts: {
        storage: ITreeStorage;
        encryptedStorage: ITreeStorage;
        structure: S & AssertVersionChain<S>;
        apiConfiguration?: SyncApiConfiguration;
        logger?: Logger;
    }) {
        const versions = chainToRuntimeArray(opts.structure);

        for (const item of versions) {
            validateSyncDataScheme(item.schema);
        }

        const latestVersion = versions[versions.length - 1];

        this.syncAccountIdRepository = new SyncAccountRepository(opts.storage);
        this.apiConfiguration = new Configuration(opts.apiConfiguration);
        this.logger =
            opts.logger ??
            (() => {
                const logger = new Logger();
                logger.setLevel(LogLevel.TRACE);
                return logger;
            })();

        const createAccountService = new CreateAccountService(
            opts.storage,
            opts.encryptedStorage,
            this.syncAccountIdRepository,
            versions,
            latestVersion.schema,
            this.apiConfiguration,
            this.logger
        );
        this.accountManager = new AccountManager(
            opts.storage,
            opts.encryptedStorage,
            this.syncAccountIdRepository,
            versions,
            latestVersion.schema,
            this.apiConfiguration,
            createAccountService,
            this.logger
        ) as AccountManager<LastNew<S>>; // TODO: remove cast
    }

    /**
     * Initiates the process of connecting to an existing sync account.
     * This method returns an OnboardingConnector which contains the data needed for onboarding and
     * a method to wait for the completion of the onboarding process.
     */
    public async connectToExistingSyncAccount(
        secureEncryptedStorage: ITreeStorage
    ): Promise<OnboardingConnector<LastNew<S>>> {
        const ikKeypair = ed25519_keygen();
        const onboarding = new NewDeviceOnboarding(
            ikKeypair,
            accountsApiForOnboarding(ikKeypair, this.apiConfiguration),
            this.accountManager,
            secureEncryptedStorage
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
    ): Promise<ISyncAccount<LastNew<S>>> {
        return await this.accountManager.createOfflineAccount(secureEncryptedStorage);
    }

    /**
     * Returns a list of all sync accounts available. This includes both online and offline accounts.
     */
    public async getSyncAccounts(): Promise<ISyncAccount<LastNew<S>>[]> {
        return await this.accountManager.getAccounts();
    }

    /**
     * Returns the sync account with the specified account ID.
     * @param accountId
     */
    public async getSyncAccount(accountId: string): Promise<ISyncAccount<LastNew<S>>> {
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
