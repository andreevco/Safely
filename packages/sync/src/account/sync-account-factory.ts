import { ZodType } from 'zod';

import { AccountManager } from './account-manager';
import { ISyncAccount } from './I-sync-account';
import { ISyncAccountFactory } from './I-sync-account-factory';
import { ITreeStorage } from '../I-storage';
import { CreateAccountService } from './create-account-service';
import { AccountID, SyncAccountRepository } from './sync-account-repository';
import { getSyncAccountStorage } from './sync-account-storage';
import { Configuration, ConfigurationParameters } from '../api/generated';
import { ed25519_keygen } from '../crypto/ed25519';
import { OnboardingConnector } from '../onboarding/connector';
import { accountsApiForOnboarding, NewDeviceOnboarding } from '../onboarding/new-device-onboarding';
import { createSyncContainer } from '../sync-container';

export class SyncAccountFactory<
    S extends Record<string, ZodType>
> implements ISyncAccountFactory<S> {
    private readonly syncAccountIdRepository: SyncAccountRepository;
    private readonly accountManager: AccountManager<S>;
    private readonly apiConfiguration: Configuration;
    private readonly storage: ITreeStorage;
    private readonly encryptedStorage: ITreeStorage;
    private readonly secureEncryptedStorage: ITreeStorage;

    constructor(opts: {
        storage: ITreeStorage;
        encryptedStorage: ITreeStorage;
        secureEncryptedStorage: ITreeStorage;
        structure: S;
        apiConfiguration?: ConfigurationParameters;
    }) {
        this.syncAccountIdRepository = new SyncAccountRepository(opts.storage);
        this.apiConfiguration = new Configuration(opts.apiConfiguration);

        const createAccountService = new CreateAccountService(
            opts.storage,
            opts.encryptedStorage,
            opts.secureEncryptedStorage,
            this.syncAccountIdRepository,
            opts.structure,
            this.apiConfiguration
        );
        this.accountManager = new AccountManager(
            opts.storage,
            opts.encryptedStorage,
            opts.secureEncryptedStorage,
            this.syncAccountIdRepository,
            opts.structure,
            this.apiConfiguration,
            createAccountService
        );
        this.storage = opts.storage;
        this.encryptedStorage = opts.encryptedStorage;
        this.secureEncryptedStorage = opts.secureEncryptedStorage;
    }

    /**
     * Initiates the process of connecting to an existing sync account.
     * This method returns an OnboardingConnector which contains the data needed for onboarding and
     * a method to wait for the completion of the onboarding process.
     */
    public async connectToExistingSyncAccount(): Promise<OnboardingConnector<S>> {
        const ikKeypair = ed25519_keygen();
        const onboarding = new NewDeviceOnboarding(
            ikKeypair,
            accountsApiForOnboarding(ikKeypair, this.apiConfiguration),
            this.accountManager
        );
        const data = onboarding.generateOnboardingData();
        return {
            data,
            waitForCompletion: async () => {
                return await onboarding.waitForOnboarding();
            }
        };
    }

    /**
     * Creates a new offline sync account. The account will be stored locally and can be made online later.
     */
    public async createOfflineSyncAccount(): Promise<ISyncAccount<S>> {
        return await this.accountManager.createOfflineAccount();
    }

    /**
     * Makes an existing offline account online by creating it on the server and uploading the initial snapshot.
     * This method is required before onboarding new devices to the account.
     * @param accountId
     */
    public async makeOfflineAccountOnline(accountId: AccountID): Promise<ISyncAccount<S>> {
        const accountInfo = await this.syncAccountIdRepository.getSyncAccount(accountId);
        if (accountInfo.online) {
            throw new Error(`Account with ID "${accountId}" is already online.`);
        }

        const container = await createSyncContainer({
            storage: getSyncAccountStorage(this.storage, accountId),
            encryptedStorage: getSyncAccountStorage(this.encryptedStorage, accountId),
            secureEncryptedStorage: getSyncAccountStorage(this.secureEncryptedStorage, accountId),
            apiConfiguration: this.apiConfiguration
        });

        const keyRepository = container.keyRepository;
        const dmkPub = await keyRepository.getDMKPub();
        const ikPub = await keyRepository.getIKPub();

        await container.accountsApi.createAccount({
            newAccount: {
                accountId,
                deviceManagementPubKey: dmkPub.toString('hex'),
                identityPubKey: ikPub.toString('hex')
            }
        });

        await this.syncAccountIdRepository.setAccountOnlineStatus(accountId, true);

        const encrypted = await container.updateEncryptor.encryptAndSign(
            container.yManager.encodeAsSnapshot()
        );
        await container.snapshotApi.saveSnapshot({
            snapshot: {
                kid: (await container.ikService.getKID()).toString('hex'),
                ciphertext: encrypted.ciphertext.toString('hex'),
                nonce: encrypted.nonce.toString('hex'),
                snapshotProof: encrypted.snapshotProof.toString('hex'),
                signature: encrypted.signature.toString('hex')
            }
        });

        return await this.getSyncAccount(accountId);
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
    public async deleteLocalAccount(accountId: string): Promise<void> {
        await this.accountManager.deleteAccount(accountId);
    }
}
