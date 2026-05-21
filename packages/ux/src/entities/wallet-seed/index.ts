import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import type { ITreeStorage } from '@safely/core';
import {
    deriveBip39WalletSeedAccessor,
    type ISecretEncryptor,
    type MnemonicResource
} from '@safely/core';
import type { StorageVersion } from '@safely/slottree';
import type { ISyncAccount } from '@safely/sync';
import { MKDerivationDomain } from '@safely/sync';
import type { WalletDerivation } from '@safely/sync-storage';

export type { WalletDerivation } from '@safely/sync-storage';

type WalletDerivationStorage = {
    get(key: 'walletDerivation'): WalletDerivation | null;
    set(key: 'walletDerivation', value: WalletDerivation): Promise<void>;
};

export class WalletSeedFactory {
    constructor(private readonly storage: WalletDerivationStorage) {}

    public async createWalletDerivation(
        encryptor: ISecretEncryptor,
        rootSeedKey: Buffer
    ): Promise<WalletDerivation> {
        const existing = this.storage.get('walletDerivation');
        if (existing) {
            throw new Error('Wallet derivation is already initialized');
        }

        let encryptedRoot: string;
        try {
            encryptedRoot = await encryptor.encrypt(bytesToHex(rootSeedKey));
        } finally {
            rootSeedKey.fill(0);
        }
        const walletDerivation: WalletDerivation = {
            root_seed_key: encryptedRoot,
            bip39_256_wallet_index: 0
        };

        await this.storage.set('walletDerivation', walletDerivation);

        return walletDerivation;
    }

    public async generateBip39SeedAccessor(encryptor: ISecretEncryptor): Promise<MnemonicResource> {
        const walletDerivation = this.storage.get('walletDerivation');
        if (!walletDerivation) {
            throw new Error('Wallet derivation is not initialized');
        }

        const walletIndex = walletDerivation.bip39_256_wallet_index;

        await this.storage.set('walletDerivation', {
            ...walletDerivation,
            bip39_256_wallet_index: walletIndex + 1
        });

        const rootSeedKey = await encryptor.decrypt(walletDerivation.root_seed_key);
        return deriveBip39WalletSeedAccessor(hexToBytes(rootSeedKey), {
            schema: 'bip39',
            walletIndex,
            entropyBits: 128
        });
    }
}

export async function generateRootSeedKey<T extends StorageVersion>(
    account: ISyncAccount<T>,
    secureEncryptedStorage: ITreeStorage
) {
    return await account.deriveKeyFromMasterKey(
        MKDerivationDomain.ROOT_SEED_KEY,
        secureEncryptedStorage
    );
}
