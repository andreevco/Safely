import { ed25519, x25519 } from '@noble/curves/ed25519.js';
import { ZodType } from 'zod';

import { decryptMasterKey, deriveOnboardingKey } from './crypto';
import { OnboardingInvitationCodec } from './onboarding-codec';
import { AccountManager } from '../account/account-manager';
import { ApiSigner } from '../api/api-signer';
import { AccountsApi, Configuration, OnboardingMessage } from '../api/generated';
import { ITreeStorage } from '../I-storage';

export class NewDeviceOnboarding<S extends Record<string, ZodType>> {
    private ephemeralKeyPair: { publicKey: Buffer; secretKey: Buffer } | null = null;

    constructor(
        private readonly ik: { publicKey: Buffer; secretKey: Buffer },
        private readonly accountsApi: AccountsApi,
        private readonly accountManager: AccountManager<S>,
        private readonly secureEncryptedStorage: ITreeStorage
    ) {}

    public generateOnboardingData(): Buffer {
        const generated = x25519.keygen();
        this.ephemeralKeyPair = {
            publicKey: Buffer.from(generated.publicKey),
            secretKey: Buffer.from(generated.secretKey)
        };

        return OnboardingInvitationCodec.encode({
            ephemeralPub: this.ephemeralKeyPair.publicKey,
            ikPub: this.ik.publicKey
        });
    }

    public async waitForOnboarding() {
        for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            let message: OnboardingMessage;
            try {
                message = await this.accountsApi.acceptOnboarding();
            } catch (err) {
                console.log('No onboarding message yet, retrying...', err);
                continue;
            }

            return await this.handleOnboardingMessage(message);
        }
        throw new Error('Onboarding timed out');
    }

    private async handleOnboardingMessage(msg: OnboardingMessage) {
        const masterKey = await this.getMasterKey(msg);
        return await this.accountManager.createOnlineAccountFromMasterKey(
            this.secureEncryptedStorage,
            masterKey,
            this.ik
        );
    }

    private async getMasterKey(msg: OnboardingMessage) {
        if (!this.ephemeralKeyPair) {
            throw new Error('Ephemeral key pair not generated');
        }
        const inviterEphemeralPubKey = Buffer.from(msg.inviterEphemeralPubKey, 'hex');

        const invitationIkPub = this.ik.publicKey;
        const metadata = {
            inviterEphemeralPub: inviterEphemeralPubKey,
            invitationIkPub: invitationIkPub,
            invitationEphemeraPub: this.ephemeralKeyPair.publicKey
        };

        const onboardKey = deriveOnboardingKey({
            ephemeralPrv: this.ephemeralKeyPair.secretKey,
            ephemeralPub: inviterEphemeralPubKey,
            info: metadata
        });

        const masterKey = decryptMasterKey({
            onboardKey,
            ciphertext: Buffer.from(msg.ciphertext, 'hex'),
            nonce: Buffer.from(msg.nonce, 'hex'),
            aad: metadata
        });

        return masterKey;
    }
}

export function accountsApiForOnboarding(
    ikKeypair: { publicKey: Buffer; secretKey: Buffer },
    apiConfiguration: Configuration
) {
    // We cant store data in the storage before we get account id from the existing device, so we
    // create a temporary AccountsApi instance that uses the in-memory ik keypair
    return new AccountsApi(
        new ApiSigner({
            sign: async (data: Buffer) => {
                const signature = ed25519.sign(data, ikKeypair.secretKey);
                return Buffer.from(signature);
            },
            verify(_: Buffer, __: Buffer): Promise<boolean> {
                throw new Error('is not used in this context');
            },
            getPub: async () => {
                return Buffer.from(ikKeypair.publicKey);
            }
        }),
        apiConfiguration
    );
}
