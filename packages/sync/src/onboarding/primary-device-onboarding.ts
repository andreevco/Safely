import { x25519 } from '@noble/curves/ed25519.js';

import { deriveOnboardingKey, encryptOnboardingMessage } from './crypto';
import { OnboardingInvitationCodec } from './onboarding-codec';
import { encodeOnboardingMessagePayload } from './onboarding-message-payload';
import { AccountsApi } from '../api/generated';
import { DmkSignerService } from '../crypto/service/dmk-signer-service';
import { MasterKeyService } from '../crypto/service/master-key-service';
import { DeviceManagementService } from '../device-manager/device-management-service';
import { SyncError } from '../sync-error';
import { u8be, utf8 } from '../utils/buffer';

export class PrimaryDeviceOnboarding {
    constructor(
        private readonly masterKeyService: MasterKeyService,
        private readonly dmkService: DmkSignerService,
        private readonly accountsApi: AccountsApi,
        private readonly deviceManager: DeviceManagementService
    ) {}

    public async sendOnboardingMessage(data: Buffer): Promise<void> {
        const invitation = OnboardingInvitationCodec.decode(data);
        const ephemeralKeyPair = x25519.keygen();

        const onboardingMetadata = {
            inviterEphemeralPub: Buffer.from(ephemeralKeyPair.publicKey),
            invitationEphemeraPub: invitation.ephemeralPub,
            invitationIkPub: invitation.ikPub
        };

        const onboardKey = deriveOnboardingKey({
            ephemeralPrv: Buffer.from(ephemeralKeyPair.secretKey),
            ephemeralPub: invitation.ephemeralPub,
            info: onboardingMetadata
        });

        const addOp = await this.deviceManager.makeAddOp(invitation.ikPub, this.dmkService);

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
        const signature = await this.signOnboardingMessage(invitation.ikPub);

        await this.accountsApi.postOnboardingMessage({
            onboardingMessage: {
                newIdentityPubKey: invitation.ikPub.toString('hex'),
                inviterEphemeralPubKey: Buffer.from(ephemeralKeyPair.publicKey).toString('hex'),
                ciphertext: Buffer.from(ciphertext).toString('hex'),
                nonce: Buffer.from(nonce).toString('hex'),
                signature: signature.toString('hex')
            }
        });

        for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const devices = await this.deviceManager.getDevices();
            if (devices.some(d => d.ikPub.equals(invitation.ikPub))) {
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
