import { x25519 } from '@noble/curves/ed25519.js';

import { deriveOnboardingKey, encryptOnboardingMessage } from './crypto';
import type { QRMessageNewDeviceOnboarding, QRMessageReconnection } from './onboarding-codec';
import { QRMessageCodec, QRMessageOperation } from './onboarding-codec';
import { encodeOnboardingMessagePayload } from './onboarding-message-payload';
import type { AccountsApi } from '../api/generated';
import type { DmkSignerService } from '../crypto/service/dmk-signer-service';
import type { MasterKeyService } from '../crypto/service/master-key-service';
import type { DeviceManagementService } from '../device-manager/device-management-service';
import { SyncError } from '../sync-error';
import type { SyncOperations } from '../sync-operations/sync-operations';
import { u8be, utf8 } from '../utils/buffer';

export class PrimaryDeviceOnboarding {
    constructor(
        private readonly masterKeyService: MasterKeyService,
        private readonly dmkService: DmkSignerService,
        private readonly accountsApi: AccountsApi,
        private readonly deviceManager: DeviceManagementService,
        private readonly syncOperations: SyncOperations,
        private readonly triggerSync: () => void
    ) {}

    public async onboard(data: Buffer): Promise<void> {
        const message = QRMessageCodec.decode(data);

        switch (message.type) {
            case QRMessageOperation.NEW_DEVICE_ONBOARDING:
                await this.onboardNewDevice(message);
                break;
            case QRMessageOperation.RECONNECTION:
                await this.reconnectExistingDevice(message);
                break;
            default:
                throw new PrimaryDeviceOnboardingError('Unsupported onboarding operation');
        }
    }

    private async reconnectExistingDevice(message: QRMessageReconnection): Promise<void> {
        const signature = await this.signOnboardingMessage(message.ikPub);
        await this.accountsApi.addDeviceToAccount({
            signedDeviceIdentity: {
                identityPubKey: message.ikPub.toString('hex'),
                signature: signature.toString('hex')
            }
        });

        await this.syncOperations.addDevice(message.ikPub, this.dmkService);
        this.triggerSync();
    }

    private async onboardNewDevice(message: QRMessageNewDeviceOnboarding): Promise<void> {
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

        const addOp = await this.deviceManager.makeAddOp(message.ikPub, this.dmkService);

        const { ciphertext, nonce } = await this.masterKeyService.withMasterKey(masterKey => {
            return encryptOnboardingMessage({
                aad: onboardingMetadata,
                onboardKey,
                onboardingMessagePayload: encodeOnboardingMessagePayload({
                    masterKey,
                    addOp
                })
            });
        });
        const signature = await this.signOnboardingMessage(message.ikPub);

        await this.accountsApi.postOnboardingMessage({
            onboardingMessage: {
                newIdentityPubKey: message.ikPub.toString('hex'),
                inviterEphemeralPubKey: Buffer.from(ephemeralKeyPair.publicKey).toString('hex'),
                ciphertext: Buffer.from(ciphertext).toString('hex'),
                nonce: Buffer.from(nonce).toString('hex'),
                signature: signature.toString('hex')
            }
        });

        for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const devices = await this.deviceManager.getDevices();
            if (devices.some(d => d.ikPub.equals(message.ikPub))) {
                return;
            }
        }

        throw new PrimaryDeviceOnboardingError(
            'New device did not appear after onboarding message was sent'
        );
    }

    private async signOnboardingMessage(newIkPub: Buffer): Promise<Buffer> {
        const toSign = Buffer.concat([
            utf8('safely/sync/v1/server/add_device'),
            u8be(0x00),
            newIkPub
        ]);
        return await this.dmkService.sign(toSign);
    }
}

export class PrimaryDeviceOnboardingError extends SyncError {}
