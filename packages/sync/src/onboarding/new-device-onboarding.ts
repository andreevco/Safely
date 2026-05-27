import { ed25519, x25519 } from '@noble/curves/ed25519.js';

import type { StorageVersion } from '@safely/slottree';

import { decryptOnboardingMessagePayload, deriveOnboardingKey } from './crypto';
import { QRMessageCodec, QRMessageOperation } from './onboarding-codec';
import { decodeOnboardingMessagePayload } from './onboarding-message-payload';
import type { AccountManager } from '../account/account-manager';
import type { ISyncAccount } from '../account/I-sync-account';
import { ApiSigner } from '../api/api-signer';
import type { Configuration, OnboardingMessage } from '../api/generated';
import { AccountsApi } from '../api/generated';
import type { ITreeStorage } from '../I-storage';
import type { Logger } from '../logger';
import { SyncFlowLogger } from '../logger';
import { OnboardingAbortedError } from '../sync-error';
import { getKID } from '../utils/kid';

export class NewDeviceOnboarding<Latest extends StorageVersion, Rest> {
    private readonly flow: SyncFlowLogger;
    private ephemeralKeyPair: { publicKey: Buffer; secretKey: Buffer } | null = null;

    constructor(
        private readonly ik: { publicKey: Buffer; secretKey: Buffer },
        private readonly accountsApi: AccountsApi,
        private readonly accountManager: AccountManager<Latest, Rest>,
        private readonly secureEncryptedStorage: ITreeStorage,
        private readonly logger: Logger,
        private readonly pollingTimeout: number,
        private readonly storageVersion: number
    ) {
        this.flow = new SyncFlowLogger(logger, 'onboarding.new_device', {
            localStorageVersion: this.storageVersion,
            selfKid: getKID(this.ik.publicKey)
        });
    }

    public generateOnboardingData(): Buffer {
        this.flow.logStart();

        const generated = x25519.keygen();
        this.ephemeralKeyPair = {
            publicKey: Buffer.from(generated.publicKey),
            secretKey: Buffer.from(generated.secretKey)
        };

        const data = QRMessageCodec.encode({
            type: QRMessageOperation.NEW_DEVICE_ONBOARDING,
            ephemeralPub: this.ephemeralKeyPair.publicKey,
            ikPub: this.ik.publicKey,
            storageVersion: this.storageVersion
        });
        this.flow.logStep('qr.generated');

        return data;
    }

    public async waitForOnboarding(signal?: AbortSignal): Promise<ISyncAccount<Latest>> {
        try {
            const account = await this.waitForOnboardingInner(signal);
            this.flow.logEnd('completed');
            return account;
        } catch (error) {
            if (!this.flow.isCompleted()) {
                this.flow.logFail(error, 'incomplete');
            }
            throw error;
        }
    }

    private async waitForOnboardingInner(signal?: AbortSignal): Promise<ISyncAccount<Latest>> {
        const maxAttempts = 150;
        this.flow.logStep('message.poll.start', {
            maxAttempts: maxAttempts,
            pollingTimeoutMs: this.pollingTimeout
        });

        for (let i = 0; i < maxAttempts; i++) {
            if (signal?.aborted) {
                throw new OnboardingAbortedError();
            }

            let message: OnboardingMessage;
            try {
                message = await this.accountsApi.getOnboardingMessage({
                    signal
                });
                this.flow.logStep('message.poll.received', { attempt: i + 1 });
            } catch {
                if (signal?.aborted) {
                    throw new OnboardingAbortedError();
                }

                this.flow.logStep('message.poll.empty', { attempt: i + 1 });
                await this.waitBeforeRetry(signal);
                continue;
            }

            if (signal?.aborted) {
                throw new OnboardingAbortedError();
            }

            return await this.handleOnboardingMessage(message);
        }
        throw new Error('Onboarding timed out');
    }

    private async waitBeforeRetry(signal?: AbortSignal): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(resolve, this.pollingTimeout);
            signal?.addEventListener(
                'abort',
                () => {
                    clearTimeout(timer);
                    reject(new OnboardingAbortedError());
                },
                { once: true }
            );
        });
    }

    private async handleOnboardingMessage(msg: OnboardingMessage) {
        // We don't need to verify signature from the onboarding message because it is the signature for server
        // operation, not for the new device.
        if (msg.newIdentityPubKey !== this.ik.publicKey.toString('hex')) {
            throw new Error('Onboarding message is not for this device');
        }
        this.flow.logStep('message.validate.done');

        const onboardingMessagePayload = await this.getOnboardingMessagePayload(msg);
        const account = await this.accountManager.createOnlineAccountFromMasterKey(
            this.secureEncryptedStorage,
            onboardingMessagePayload,
            this.ik,
            this.flow.child('handleOnboardingMessage')
        );
        this.flow.logStep('account.created');

        this.logger.info('Onboarding completed');
        return account;
    }

    private async getOnboardingMessagePayload(msg: OnboardingMessage) {
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

        return decodeOnboardingMessagePayload(
            decryptOnboardingMessagePayload({
                onboardKey,
                ciphertext: Buffer.from(msg.ciphertext, 'hex'),
                nonce: Buffer.from(msg.nonce, 'hex'),
                aad: metadata
            })
        );
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
            verify(_: Buffer, __: Buffer): boolean {
                throw new Error('is not used in this context');
            },
            getPub: () => {
                return Buffer.from(ikKeypair.publicKey);
            }
        }),
        apiConfiguration
    );
}
