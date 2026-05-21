import { describe, expect, it } from 'vitest';

import type { ISecretEncryptor } from '@safely/core';
import type { Draft } from '@safely/slottree';
import type { SyncedStorageSchema } from '@safely/sync-storage';

import type { WalletDerivation } from '../src';
import { WalletSeedFactory } from '../src';

const passthroughEncryptor: ISecretEncryptor = {
    async encrypt(secret) {
        return secret;
    },
    async decrypt(secret) {
        return secret;
    }
};

class WalletDerivationStorage {
    public value: WalletDerivation | null = null;

    public get() {
        return this.value;
    }

    public async set(_key: 'walletDerivation', value: WalletDerivation) {
        this.value = value;
    }

    public async transaction(f: (draft: Draft<SyncedStorageSchema>) => void) {
        const draft = {
            at: () => ({
                get: () => this.value,
                at: (key: 'bip39_256_wallet_index') => ({
                    set: (value: WalletDerivation[typeof key]) => {
                        if (!this.value) {
                            throw new Error('Wallet derivation is not initialized');
                        }
                        this.value = {
                            ...this.value,
                            [key]: value
                        };
                    }
                })
            }),
            set: (_key: 'walletDerivation', value: WalletDerivation) => {
                this.value = value;
            }
        } as unknown as Draft<SyncedStorageSchema>;

        f(draft);
    }
}

describe('WalletSeedFactory', () => {
    it('initializes wallet derivation state', async () => {
        const storage = new WalletDerivationStorage();
        const factory = new WalletSeedFactory(storage);

        await factory.createWalletDerivation(passthroughEncryptor, Buffer.alloc(32, 0));

        expect(storage.value).toEqual({
            bip39_256_wallet_index: 0,
            root_seed_key: '0000000000000000000000000000000000000000000000000000000000000000'
        });
    });

    it('does not overwrite an existing wallet derivation state', async () => {
        const storage = new WalletDerivationStorage();
        storage.value = {
            root_seed_key: '0000000000000000000000000000000000000000000000000000000000000000',
            bip39_256_wallet_index: 0
        };
        const factory = new WalletSeedFactory(storage);

        await expect(
            factory.createWalletDerivation(passthroughEncryptor, Buffer.alloc(32, 0))
        ).rejects.toThrow('Wallet derivation is already initialized');
    });

    it('throws when seed generation is requested before wallet derivation initialization', async () => {
        const storage = new WalletDerivationStorage();
        const factory = new WalletSeedFactory(storage);

        await expect(factory.generateBip39SeedAccessor(passthroughEncryptor)).rejects.toThrow(
            'Wallet derivation is not initialized'
        );
    });

    it('derives BIP39 seed accessors and advances the wallet index', async () => {
        const storage = new WalletDerivationStorage();
        storage.value = {
            root_seed_key: '0000000000000000000000000000000000000000000000000000000000000000',
            bip39_256_wallet_index: 0
        };
        const factory = new WalletSeedFactory(storage);

        using first = await factory.generateBip39SeedAccessor(passthroughEncryptor);
        using second = await factory.generateBip39SeedAccessor(passthroughEncryptor);

        expect(first.value).toEqual([
            'bring',
            'grocery',
            'method',
            'crime',
            'clever',
            'awake',
            'bitter',
            'liberty',
            'armed',
            'essence',
            'squirrel',
            'easily'
        ]);
        expect(second.value).toEqual([
            'also',
            'glimpse',
            'another',
            'add',
            'farm',
            'siren',
            'inner',
            'add',
            'noise',
            'grant',
            'almost',
            'example'
        ]);
        expect(storage.value.bip39_256_wallet_index).toBe(2);
    });
});
