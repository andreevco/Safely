import { ZodType } from 'zod';

import { ISyncAccount } from './I-sync-account';
import { Device } from '../device-manager/device-repository';
import { ITreeStorage } from '../I-storage';
import { OnboardingConnector } from '../onboarding/connector';
import { PrimaryDeviceOnboarding } from '../onboarding/primary-device-onboarding';
import { ReconnectOnboarding } from '../onboarding/reconnect/reconnect-onboarding';
import { ISecretEncryptor } from '../secret-encryptor';
import { SyncContainer } from '../sync-container';
import { SyncAccountRepository } from './sync-account-repository';
import { SyncError } from '../sync-error';
import { ISyncProvider } from '../sync-provider/I-sync-provider';
import { OnlineSyncProvider } from '../sync-provider/online-sync-provider';
import { SyncStatus, SyncStatusManager } from '../sync-provider/sync-status';

export class SyncAccount<S extends Record<string, ZodType>> implements ISyncAccount<S> {
    public readonly secretEncryptor: ISecretEncryptor;
    public readonly accountId: string;

    private readonly structure: S;
    private readonly container: SyncContainer;
    private readonly syncAccountRepository: SyncAccountRepository;

    private online: boolean;
    private syncProviderInternal: ISyncProvider<S>;
    private makeAccountOnlinePromise: Promise<void> | null = null;

    constructor(opts: {
        accountId: string;
        structure: S;
        syncProvider: ISyncProvider<S>;
        container: SyncContainer;
        syncAccountRepository: SyncAccountRepository;
        online: boolean;
    }) {
        this.accountId = opts.accountId;
        this.structure = opts.structure;
        this.container = opts.container;
        this.syncAccountRepository = opts.syncAccountRepository;
        this.syncProviderInternal = opts.syncProvider;
        this.online = opts.online;
        this.secretEncryptor = opts.container.secretEncryptor;
    }

    public get syncProvider(): ISyncProvider<S> {
        return this.syncProviderInternal;
    }

    public async connectToNewDevice(
        data: Buffer,
        secureEncryptedStorage: ITreeStorage
    ): Promise<void> {
        await this.ensureAccountOnline();

        const onboarding = new PrimaryDeviceOnboarding(
            this.container.keyServiceFactory.createMasterKeyService(secureEncryptedStorage),
            this.container.keyServiceFactory.createDmkSignerService(secureEncryptedStorage),
            this.container.accountsApi,
            this.container.deviceManager,
            () => {
                this.syncProvider.triggerSync();
            }
        );
        await onboarding.onboard(data);
    }

    public async getDevices(): Promise<Device[]> {
        return await this.container.deviceManager.getDevices();
    }

    public async revokeRemoteDevice(
        ikPub: Buffer,
        secureEncryptedStorage: ITreeStorage
    ): Promise<void> {
        const myIkPub = await this.container.ikService.getPub();
        if (ikPub.equals(myIkPub)) {
            throw new Error(
                'Cannot revoke self device with revokeRemoteDevice, use SyncAccountFactory.deleteLocalAccount instead'
            );
        }
        await this.container.deviceManager.revokeDevice(
            ikPub,
            this.container.keyServiceFactory.createDmkSignerService(secureEncryptedStorage)
        );
        this.syncProvider.triggerSync();
        const sig = await this.container.keyServiceFactory
            .createDmkSignerService(secureEncryptedStorage)
            .signRevokeMessageForServer(ikPub);
        await this.container.accountsApi.removeDeviceFromAccount({
            signedDeviceIdentity: {
                identityPubKey: ikPub.toString('hex'),
                signature: sig.toString('hex')
            }
        });
    }

    public async reconnectToAccount(): Promise<OnboardingConnector<S>> {
        if (this.syncProviderInternal.syncStatusManager.getStatus() !== SyncStatus.DEVICE_DELETED) {
            const deviceList = await this.container.deviceManager.getDevices();
            const myIkPub = await this.container.ikService.getPub();
            const isMyDeviceInList = deviceList.some(device => device.ikPub.equals(myIkPub));
            if (isMyDeviceInList) {
                throw new SyncError('Device was not deleted');
            }
        }

        const onboarding = new ReconnectOnboarding(
            await this.container.ikService.getPub(),
            this.syncProviderInternal as OnlineSyncProvider<S>
        );
        const data = onboarding.generateOnboardingData();
        const abortController = new AbortController();
        return {
            data,
            waitForCompletion: async () => {
                await onboarding.waitForOnboarding(abortController.signal);
                return this;
            },
            abort: () => {
                abortController.abort();
            }
        };
    }

    public async getMyDeviceIkPub(): Promise<Buffer> {
        return this.container.ikService.getPub();
    }

    public async deleteThisDevice(secureEncryptedStorage: ITreeStorage): Promise<void> {
        this.syncProvider.dispose();

        // Revoke self device in doc
        const myIkPub = await this.container.ikService.getPub();
        await this.container.deviceManager.revokeDevice(
            myIkPub,
            this.container.keyServiceFactory.createDmkSignerService(secureEncryptedStorage)
        );

        // Send manually new snapshot to the server so that the revoke operation is synced on
        // the other devices.
        for (let i = 0; i < 3; i++) {
            try {
                await this.sendSnapshotManually();
                break;
            } catch (error) {
                console.warn('Cannot send snapshot to server after revoking self device', error);
            }
        }

        try {
            const sig = await this.container.keyServiceFactory
                .createDmkSignerService(secureEncryptedStorage)
                .signRevokeMessageForServer(myIkPub);
            await this.container.accountsApi.removeDeviceFromAccount({
                signedDeviceIdentity: {
                    identityPubKey: myIkPub.toString('hex'),
                    signature: sig.toString('hex')
                }
            });
        } catch (error) {
            console.warn('Cannot revoke self device on server', error);
        }
    }

    private async ensureAccountOnline(): Promise<void> {
        if (this.online) {
            return;
        }

        if (!this.makeAccountOnlinePromise) {
            this.makeAccountOnlinePromise = this.makeAccountOnline().finally(() => {
                this.makeAccountOnlinePromise = null;
            });
        }

        await this.makeAccountOnlinePromise;
    }

    private async makeAccountOnline(): Promise<void> {
        const keyRepository = this.container.keyRepository;
        const dmkPub = await keyRepository.getDMKPub();
        const ikPub = await keyRepository.getIKPub();

        await this.container.accountsApi.createAccount({
            newAccount: {
                accountId: this.accountId,
                deviceManagementPubKey: dmkPub.toString('hex'),
                identityPubKey: ikPub.toString('hex')
            }
        });
        await this.sendSnapshotManually();

        await this.syncAccountRepository.setAccountOnlineStatus(this.accountId, true);

        await this.promoteToOnlineProvider();
        this.online = true;
    }

    private async promoteToOnlineProvider(): Promise<void> {
        if (this.syncProviderInternal.syncStatusManager.getStatus() !== SyncStatus.OFFLINE) {
            return;
        }

        this.syncProviderInternal.dispose();
        this.syncProviderInternal = await OnlineSyncProvider.create(
            this.structure,
            this.container,
            // We pass the same SyncStatusManager instance to the OnlineSyncProvider, so that the
            // subscribers to the SyncAccount's syncProvider will be notified of the status changes
            // when we promote to online provider.
            this.syncProviderInternal.syncStatusManager as SyncStatusManager
        );
    }

    private async sendSnapshotManually(): Promise<void> {
        const encrypted = await this.container.updateEncryptor.encryptAndSign(
            this.container.yManager.encodeAsSnapshot()
        );

        await this.container.snapshotApi.saveSnapshot({
            snapshot: {
                kid: (await this.container.ikService.getKID()).toString('hex'),
                ciphertext: encrypted.ciphertext.toString('hex'),
                nonce: encrypted.nonce.toString('hex'),
                snapshotProof: encrypted.snapshotProof.toString('hex'),
                signature: encrypted.signature.toString('hex')
            }
        });

        await this.container.syncStateRepository.saveState({
            snapshotProof: encrypted.snapshotProof
        });
    }
}
