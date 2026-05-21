import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import type { ITreeStorage } from '@safely/core';
import {
    deriveBip39WalletSeedAccessor,
    type ISecretEncryptor,
    type MnemonicResource
} from '@safely/core';
import type { Draft } from '@safely/slottree';
import type { StorageVersion } from '@safely/slottree';
import type { ISyncAccount } from '@safely/sync';
import { MKDerivationDomain } from '@safely/sync';
import type { SyncedStorageSchema, WalletDerivation } from '@safely/sync-storage';

export type { WalletDerivation } from '@safely/sync-storage';

type WalletDerivationStorage = {
    transaction(f: (draft: Draft<SyncedStorageSchema>) => void): Promise<void>;
};

export class WalletSeedFactory {
    constructor(private readonly storage: WalletDerivationStorage) {}

    public async createWalletDerivation(encryptor: ISecretEncryptor, rootSeedKey: Buffer) {
        let encryptedRoot: string;
        try {
            encryptedRoot = await encryptor.encrypt(bytesToHex(rootSeedKey));
        } finally {
            rootSeedKey.fill(0);
        }
        let walletDerivation: WalletDerivation | undefined;

        await this.storage.transaction(draft => {
            const existing = draft.at('walletDerivation').get();
            if (existing) {
                throw new Error('Wallet derivation is already initialized');
            }

            walletDerivation = {
                root_seed_key: encryptedRoot,
                bip39_256_wallet_index: 0
            };
            draft.set('walletDerivation', walletDerivation);
        });
    }

    public async generateBip39SeedAccessor(encryptor: ISecretEncryptor): Promise<MnemonicResource> {
        let walletDerivation: WalletDerivation | undefined;

        await this.storage.transaction(draft => {
            const current = draft.at('walletDerivation').get();
            if (!current) {
                throw new Error('Wallet derivation is not initialized');
            }

            walletDerivation = {
                root_seed_key: current.root_seed_key,
                bip39_256_wallet_index: current.bip39_256_wallet_index
            };
            draft
                .at('walletDerivation')
                .at('bip39_256_wallet_index')
                .set(current.bip39_256_wallet_index + 1);
        });

        if (!walletDerivation) {
            throw new Error('Wallet derivation is not initialized');
        }

        const rootSeedKey = await encryptor.decrypt(walletDerivation.root_seed_key);
        return deriveBip39WalletSeedAccessor(hexToBytes(rootSeedKey), {
            schema: 'bip39',
            walletIndex: walletDerivation.bip39_256_wallet_index,
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
