import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import {
    deriveBip39WalletSeedAccessor,
    generateWalletRootSeedKey,
    type ISecretEncryptor,
    type MnemonicResource
} from '@safely/core';

import type { WalletDerivation } from '../../shared';

type WalletDerivationStorage = {
    get(key: 'walletDerivation'): WalletDerivation | null;
    set(key: 'walletDerivation', value: WalletDerivation): Promise<void>;
};

export class WalletSeedFactory {
    constructor(private readonly storage: WalletDerivationStorage) {}

    public async createWalletDerivation(encryptor: ISecretEncryptor): Promise<WalletDerivation> {
        const existing = this.storage.get('walletDerivation');
        if (existing) {
            throw new Error('Wallet derivation is already initialized');
        }

        const encryptedRoot = await encryptor.encrypt(bytesToHex(generateWalletRootSeedKey()));
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
