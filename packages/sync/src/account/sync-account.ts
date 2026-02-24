import { ZodType } from 'zod';

import { ISyncAccount } from './I-sync-account';
import { Device } from '../device-manager/device-repository';
import { PrimaryDeviceOnboarding } from '../onboarding/primary-device-onboarding';
import { ISecretEncryptor } from '../secret-encryptor';
import { SyncContainer } from '../sync-container';
import { ISyncProvider } from '../sync-provider/I-sync-provider';

export class SyncAccount<S extends Record<string, ZodType>> implements ISyncAccount<S> {
    public readonly secretEncryptor: ISecretEncryptor;

    constructor(
        public readonly accountId: string,
        public readonly syncProvider: ISyncProvider<S>,
        private readonly container: SyncContainer
    ) {
        this.secretEncryptor = container.secretEncryptor;
    }

    public async connectToNewDevice(data: Buffer): Promise<void> {
        const onboarding = new PrimaryDeviceOnboarding(
            this.container.masterKeyService,
            this.container.dmkService,
            this.container.accountsApi,
            this.container.deviceManager,
            () => {
                this.syncProvider.triggerSync();
            }
        );
        await onboarding.sendOnboardingMessage(data);
    }

    public async getDevices(): Promise<Device[]> {
        return await this.container.deviceManager.getDevices();
    }

    public async revokeRemoteDevice(ikPub: Buffer): Promise<void> {
        const myIkPub = await this.container.ikService.getPub();
        if (ikPub.equals(myIkPub)) {
            throw new Error(
                'Cannot revoke self device with revokeRemoteDevice, use SyncAccountFactory.deleteLocalAccount instead'
            );
        }
        await this.container.deviceManager.revokeDevice(ikPub);
    }

    public async deleteThisDevice(): Promise<void> {
        this.syncProvider.dispose();

        // Revoke self device in doc
        const myIkPub = await this.container.ikService.getPub();
        await this.container.deviceManager.revokeDevice(myIkPub);

        // Send manually new snapshot to the server
        try {
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
        } catch (error) {
            console.warn('Cannot send snapshot to server after revoking self device', error);
        }

        try {
            const sig = await this.container.dmkService.signRevokeMessageForServer(myIkPub);
            await this.container.accountsApi.removeDeviceFromAccount({
                deviceToRemove: {
                    identityPubKey: myIkPub.toString('hex'),
                    signature: sig.toString('hex')
                }
            });
        } catch (error) {
            console.warn('Cannot revoke self device on server', error);
        }
    }
}
