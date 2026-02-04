import { x25519 } from '@noble/curves/ed25519.js';

import { deriveOnboardingKey, encryptMasterKey } from './crypto';
import { OnboardingInvitationCodec } from './onboarding-codec';
import { AccountsApi } from '../api/generated';
import { DmkService } from '../crypto/service/dmk-service';
import { MasterKeyService } from '../crypto/service/master-key-service';
import { DeviceManagementService } from '../device-manager/device-management-service';
import { u8be, utf8 } from '../utils/buffer';

export class PrimaryDeviceOnboarding {
    constructor(
        private readonly masterKeyService: MasterKeyService,
        private readonly dmkService: DmkService,
        private readonly accountsApi: AccountsApi,
        private readonly deviceManager: DeviceManagementService,
        private readonly onDeviceAdded: () => void
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

        const { ciphertext, nonce } = await this.masterKeyService.withMasterKey(masterKey => {
            return encryptMasterKey({
                aad: onboardingMetadata,
                onboardKey,
                masterKey
            });
        });
        const signature = await this.signOnboardingMessage(invitation.ikPub);

        await this.deviceManager.addDevice({
            ikPub: invitation.ikPub
        });
        this.onDeviceAdded();

        await this.accountsApi.toOnboardNewDevice({
            onboardingMessage: {
                newIdentityPubKey: invitation.ikPub.toString('hex'),
                inviterEphemeralPubKey: Buffer.from(ephemeralKeyPair.publicKey).toString('hex'),
                ciphertext: Buffer.from(ciphertext).toString('hex'),
                nonce: Buffer.from(nonce).toString('hex'),
                signature: signature.toString('hex')
            }
        });
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
