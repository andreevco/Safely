import { x25519 } from '@noble/curves/ed25519.js';

import type { StorageVersion } from '@safely/slottree';

import { deriveOnboardingKey, encryptOnboardingMessage } from './crypto';
import type { QRMessageNewDeviceOnboarding, QRMessageReconnection } from './onboarding-codec';
import { QRMessageCodec, QRMessageOperation } from './onboarding-codec';
import { encodeOnboardingMessagePayload } from './onboarding-message-payload';
import type { AccountsApi } from '../api/generated';
import type { DmkSignerService } from '../crypto/service/dmk-signer-service';
import type { MasterKeyService } from '../crypto/service/master-key-service';
import type { DeviceManagementService } from '../device-manager/device-management-service';
import type { SyncFlowLogger } from '../logger';
import { SyncError } from '../sync-error';
import type { SyncOperations } from '../sync-operations/sync-operations';

export class PrimaryDeviceOnboarding {
    constructor(
        private readonly inviterIkPub: Buffer,
        private readonly masterKeyService: MasterKeyService,
        private readonly dmkService: DmkSignerService,
        private readonly accountsApi: AccountsApi,
        private readonly deviceManager: DeviceManagementService,
        private readonly syncOperations: SyncOperations<StorageVersion, unknown>,
        private readonly storageVersion: number,
        private readonly devicesStorageVersion: number,
        private readonly triggerSync: () => Promise<void>
    ) {}

    public async onboard(data: Buffer, flow: SyncFlowLogger): Promise<Buffer> {
        const message = QRMessageCodec.decode(data);

        switch (message.type) {
            case QRMessageOperation.NEW_DEVICE_ONBOARDING:
                await this.onboardNewDevice(message, flow.child('new_device_onboarding'));
                return message.ikPub;
            case QRMessageOperation.RECONNECTION:
                await this.reconnectExistingDevice(message, flow.child('reconnection'));
                return message.ikPub;
            default:
                throw new PrimaryDeviceOnboardingError('Unsupported onboarding operation');
        }
    }

    private async reconnectExistingDevice(
        message: QRMessageReconnection,
        flow: SyncFlowLogger
    ): Promise<void> {
        await this.deviceManager.assertDeviceCanReconnect(message.ikPub);
        flow.logStep('assert_device.done', this.deviceLogFields(message));

        const signature = await this.signOnboardingMessage(message.ikPub);

        await this.accountsApi.addDeviceToAccount({
            signedDeviceIdentity: {
                identityPubKey: message.ikPub.toString('hex'),
                signature: signature.toString('hex')
            }
        });
        flow.logStep('server.add_device', this.deviceLogFields(message));

        await this.syncOperations.addDevice(
            message.ikPub,
            this.knownStorageVersion(message.storageVersion, this.storageVersion),
            this.knownStorageVersion(message.devicesStorageVersion, this.devicesStorageVersion),
            this.dmkService
        );
        flow.logStep('device_storage.add_device', this.deviceLogFields(message));

        flow.logStep('sync.trigger.start', this.deviceLogFields(message));
        await this.triggerSync();
        flow.logStep('sync.trigger.done', this.deviceLogFields(message));

        try {
            await this.waitUntilDeviceVisible(message, flow);
        } catch (e) {
            flow.logFail(e, 'device.visible', this.deviceLogFields(message));
            throw e;
        }
    }

    private async onboardNewDevice(
        message: QRMessageNewDeviceOnboarding,
        flow: SyncFlowLogger
    ): Promise<void> {
        const ephemeralKeyPair = x25519.keygen();

        const onboardingMetadata = {
            inviterEphemeralPub: Buffer.from(ephemeralKeyPair.publicKey),
            invitationEphemeraPub: message.ephemeralPub,
            invitationIkPub: message.ikPub
        };

        const onboardKey = deriveOnboardingKey({
            ephemeralPrv: Buffer.from(ephemeralKeyPair.secretKey),
            ephemeralPub: message.ephemeralPub,
            info: onboardingMetadata
        });

        const { ciphertext, nonce } = await this.masterKeyService.withMasterKey(masterKey => {
            return encryptOnboardingMessage({
                aad: onboardingMetadata,
                onboardKey,
                onboardingMessagePayload: encodeOnboardingMessagePayload({
                    masterKey,
                    inviterIkPub: this.inviterIkPub
                })
            });
        });
        const signature = await this.signOnboardingMessage(message.ikPub);

        await this.syncOperations.addDevice(
            message.ikPub,
            this.knownStorageVersion(message.storageVersion, this.storageVersion),
            this.knownStorageVersion(message.devicesStorageVersion, this.devicesStorageVersion),
            this.dmkService
        );
        flow.logStep('device_storage.add_device', this.deviceLogFields(message));

        await this.triggerSync();
        flow.logStep('sync.trigger', this.deviceLogFields(message));

        flow.logStep('server.onboarding_message.post.start', this.deviceLogFields(message));
        await this.accountsApi.postOnboardingMessage({
            onboardingMessage: {
                newIdentityPubKey: message.ikPub.toString('hex'),
                inviterEphemeralPubKey: Buffer.from(ephemeralKeyPair.publicKey).toString('hex'),
                ciphertext: Buffer.from(ciphertext).toString('hex'),
                nonce: Buffer.from(nonce).toString('hex'),
                signature: signature.toString('hex')
            }
        });
        flow.logStep('server.onboarding_message.post.done', this.deviceLogFields(message));

        try {
            await this.waitUntilDeviceVisible(message, flow);
        } catch (e) {
            flow.logFail(e, 'device.visible', this.deviceLogFields(message));
            throw e;
        }
    }

    private async signOnboardingMessage(newIkPub: Buffer): Promise<Buffer> {
        return await this.dmkService.signAddDeviceForServer(newIkPub);
    }

    private knownStorageVersion(version: number, latestKnownVersion: number): number | undefined {
        return version <= latestKnownVersion ? version : undefined;
    }

    private async waitUntilDeviceVisible(
        message: QRMessageNewDeviceOnboarding | QRMessageReconnection,
        flow: SyncFlowLogger
    ): Promise<void> {
        await this.deviceManager.waitUntilDeviceVisible(message.ikPub, {
            timeoutMs: 30000,
            timeoutError: () =>
                new PrimaryDeviceOnboardingError('Device did not become active after onboarding')
        });
        flow.logEnd('device.visible', this.deviceLogFields(message));
    }

    private deviceLogFields(
        message: QRMessageNewDeviceOnboarding | QRMessageReconnection
    ): Record<string, unknown> {
        return {
            ikPub: message.ikPub.toString('hex')
        };
    }
}

export class PrimaryDeviceOnboardingError extends SyncError {}
