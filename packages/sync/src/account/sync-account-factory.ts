import { ZodType } from 'zod';

import { AccountManager } from './account-manager';
import { ISyncAccount } from './I-sync-account';
import { ISyncAccountFactory } from './I-sync-account-factory';
import { ITreeStorage } from '../I-storage';
import { CreateAccountService } from './create-account-service';
import { SyncAccountRepository } from './sync-account-repository';
import { Configuration } from '../api/generated';
import { SyncApiConfiguration } from '../api/sync-api-configuration';
import { validateSyncDataScheme } from '../crdt/deep-merge/z-schema';
import { ed25519_keygen } from '../crypto/ed25519';
import { Logger, logsFilterMinSeverityLevel, LogLevel } from '../logger';
import { OnboardingConnector } from '../onboarding/connector';
import { accountsApiForOnboarding, NewDeviceOnboarding } from '../onboarding/new-device-onboarding';

export class SyncAccountFactory<
    S extends Record<string, ZodType>
> implements ISyncAccountFactory<S> {
    private readonly syncAccountIdRepository: SyncAccountRepository;
    private readonly accountManager: AccountManager<S>;
    private readonly apiConfiguration: Configuration;
    private readonly preAccountLogger: Logger;

    constructor(opts: {
        storage: ITreeStorage;
        encryptedStorage: ITreeStorage;
        structure: S;
        apiConfiguration?: SyncApiConfiguration;
        preAccountLogger?: Logger;
        createAccountLogger: (accountId: string) => Logger;
    }) {
        validateSyncDataScheme(opts.structure);

        this.syncAccountIdRepository = new SyncAccountRepository(opts.storage);
        this.apiConfiguration = new Configuration(opts.apiConfiguration);
        this.preAccountLogger =
            opts.preAccountLogger ??
            (() => {
                const logger = new Logger();
                logger.setLogsFilter(logsFilterMinSeverityLevel(LogLevel.TRACE));
                return logger;
            })();

        const createAccountService = new CreateAccountService(
            opts.storage,
            opts.encryptedStorage,
            this.syncAccountIdRepository,
            opts.structure,
            this.apiConfiguration,
            opts.createAccountLogger
        );
        this.accountManager = new AccountManager(
            opts.storage,
            opts.encryptedStorage,
            this.syncAccountIdRepository,
            opts.structure,
            this.apiConfiguration,
            createAccountService,
            opts.createAccountLogger
        );
    }

    /**
     * Initiates the process of connecting to an existing sync account.
     * This method returns an OnboardingConnector which contains the data needed for onboarding and
     * a method to wait for the completion of the onboarding process.
     */
    public async connectToExistingSyncAccount(
        secureEncryptedStorage: ITreeStorage
    ): Promise<OnboardingConnector<S>> {
        const ikKeypair = ed25519_keygen();
        const onboarding = new NewDeviceOnboarding(
            ikKeypair,
            accountsApiForOnboarding(ikKeypair, this.apiConfiguration),
            this.accountManager,
            secureEncryptedStorage,
            this.preAccountLogger
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
    public async createSyncAccount(secureEncryptedStorage: ITreeStorage): Promise<ISyncAccount<S>> {
        return await this.accountManager.createOfflineAccount(secureEncryptedStorage);
    }

    /**
     * Returns a list of all sync accounts available. This includes both online and offline accounts.
     */
    public async getSyncAccounts(): Promise<ISyncAccount<S>[]> {
        return await this.accountManager.getAccounts();
    }

    /**
     * Returns the sync account with the specified account ID.
     * @param accountId
     */
    public async getSyncAccount(accountId: string): Promise<ISyncAccount<S>> {
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
