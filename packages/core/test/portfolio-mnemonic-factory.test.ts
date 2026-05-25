import { hexToBytes } from '@noble/hashes/utils.js';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ISyncAccount, ITreeStorage } from '@safely/sync';
import { MKDerivationDomain } from '@safely/sync';

import { PortfolioMnemonicFactory } from '../src';

const ZERO_ROOT_SEED_KEY_HEX = '0000000000000000000000000000000000000000000000000000000000000000';

const ONES_ROOT_SEED_KEY_HEX = '1111111111111111111111111111111111111111111111111111111111111111';

function makeAccount(rootSeedKey: Uint8Array) {
    const deriveKeyFromMasterKey = vi
        .fn<ISyncAccount<never>['deriveKeyFromMasterKey']>()
        .mockResolvedValue(Buffer.from(rootSeedKey));

    const account = { deriveKeyFromMasterKey } as unknown as ISyncAccount<never>;
    return { account, deriveKeyFromMasterKey };
}

const STORAGE = {} as ITreeStorage;

describe('PortfolioMnemonicFactory', () => {
    let factory: PortfolioMnemonicFactory;
    let deriveSpy: ReturnType<typeof makeAccount>['deriveKeyFromMasterKey'];

    beforeEach(() => {
        const { account, deriveKeyFromMasterKey } = makeAccount(hexToBytes(ZERO_ROOT_SEED_KEY_HEX));
        factory = new PortfolioMnemonicFactory(account, STORAGE);
        deriveSpy = deriveKeyFromMasterKey;
    });

    it('derives a 12-word BIP39 mnemonic for entropy=128', async () => {
        const result = await factory.deriveBip39MnemonicResource(0);
        expect(result.value).toHaveLength(12);
        expect(validateMnemonic(result.value.join(' '), wordlist)).toBe(true);
    });

    it('derives the expected deterministic mnemonic for zero root key + index 0', async () => {
        const result = await factory.deriveBip39MnemonicResource(0);
        expect(result.value).toEqual(
            'world ceiling fine urge fringe gap item muffin another eyebrow search vault'.split(' ')
        );
    });

    it('derives the expected deterministic mnemonic for zero root key + index 1', async () => {
        const result = await factory.deriveBip39MnemonicResource(1);
        console.log(result.value.join(' '));
        expect(result.value).toEqual(
            'fix game edit street parade tape state reform donkey humor post kingdom'.split(' ')
        );
    });

    it('is deterministic for the same factory instance', async () => {
        const r1 = await factory.deriveBip39MnemonicResource(0);
        const _ = await factory.deriveBip39MnemonicResource(1);
        const r2 = await factory.deriveBip39MnemonicResource(0);

        expect(r1.value).toEqual(r2.value);
    });

    it('is deterministic for the same root seed key and index', async () => {
        const { account: account2 } = makeAccount(hexToBytes(ZERO_ROOT_SEED_KEY_HEX));
        const factory2 = new PortfolioMnemonicFactory(account2, STORAGE);

        const r1 = await factory.deriveBip39MnemonicResource(0);
        const r2 = await factory2.deriveBip39MnemonicResource(0);

        expect(r1.value).toEqual(r2.value);
    });

    it('produces different mnemonics for different portfolio indexes', async () => {
        const r0 = await factory.deriveBip39MnemonicResource(0);
        const r1 = await factory.deriveBip39MnemonicResource(1);

        expect(r0.value).not.toEqual(r1.value);
    });

    it('produces different mnemonics for different root seed keys', async () => {
        const { account: account2 } = makeAccount(hexToBytes(ONES_ROOT_SEED_KEY_HEX));
        const factory2 = new PortfolioMnemonicFactory(account2, STORAGE);

        const a = await factory.deriveBip39MnemonicResource(0);
        const b = await factory2.deriveBip39MnemonicResource(0);

        expect(a.value).not.toEqual(b.value);
    });

    it('asks the account for the ROOT_SEED_KEY domain', async () => {
        await factory.deriveBip39MnemonicResource(0);

        expect(deriveSpy).toHaveBeenCalledTimes(1);
        expect(deriveSpy).toHaveBeenCalledWith(MKDerivationDomain.ROOT_SEED_KEY, STORAGE);
    });

    it('accepts the boundary uint32 index 0xffffffff', async () => {
        const result = await factory.deriveBip39MnemonicResource(0xffffffff);
        expect(result.value).toHaveLength(12);
    });

    it('rejects an index outside uint32 range', async () => {
        await expect(factory.deriveBip39MnemonicResource(0x1_0000_0000)).rejects.toThrow(
            'Wallet seed index must be a uint32'
        );
    });

    it('rejects negative indexes', async () => {
        await expect(factory.deriveBip39MnemonicResource(-1)).rejects.toThrow(
            'Wallet seed index must be a uint32'
        );
    });

    it('rejects non-integer indexes', async () => {
        await expect(factory.deriveBip39MnemonicResource(1.5)).rejects.toThrow(
            'Wallet seed index must be a uint32'
        );
    });

    it('rejects when the account returns a root seed key of wrong length', async () => {
        const { account } = makeAccount(new Uint8Array(16));
        const badFactory = new PortfolioMnemonicFactory(account, STORAGE);

        await expect(badFactory.deriveBip39MnemonicResource(0)).rejects.toThrow(
            'Root seed key must be 32 bytes'
        );
    });
});
