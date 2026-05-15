import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import {
    deriveBip39WalletSeedAccessor,
    generateWalletRootSeedKey,
    type MnemonicResource
} from '@safely/core';

import type { WalletDerivation } from '../../shared';

type WalletDerivationStorage = {
    get(key: 'walletDerivation'): WalletDerivation | null;
    set(key: 'walletDerivation', value: WalletDerivation): Promise<void>;
};

export class WalletSeedFactory {
    constructor(private readonly storage: WalletDerivationStorage) {}

    public async createWalletDerivation(): Promise<WalletDerivation> {
        const existing = this.storage.get('walletDerivation');
        if (existing) {
            throw new Error('Wallet derivation is already initialized');
        }

        const walletDerivation: WalletDerivation = {
            root_seed_key: bytesToHex(generateWalletRootSeedKey()),
            bip39_256_wallet_index: 0
        };

        await this.storage.set('walletDerivation', walletDerivation);

        return walletDerivation;
    }

    public async generateBip39SeedAccessor(): Promise<MnemonicResource> {
        const walletDerivation = this.storage.get('walletDerivation');
        if (!walletDerivation) {
            throw new Error('Wallet derivation is not initialized');
        }

        const walletIndex = walletDerivation.bip39_256_wallet_index;

        await this.storage.set('walletDerivation', {
            ...walletDerivation,
            bip39_256_wallet_index: walletIndex + 1
        });

        return deriveBip39WalletSeedAccessor(hexToBytes(walletDerivation.root_seed_key), {
            schema: 'bip39',
            walletIndex,
            entropyBits: 128
        });
    }
}
