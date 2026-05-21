import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { concatBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { entropyToMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

import { MnemonicResource } from '../mnemonic';

export type WalletSeedDescriptor = {
    schema: 'bip39';
    walletIndex: number;
    entropyBits: 128 | 160 | 192 | 224 | 256;
};

const ROOT_SEED_KEY_BYTES = 32;
const SUPPORTED_ENTROPY_BITS = new Set([128, 160, 192, 224, 256]);

export function deriveWalletSeedAccessor(
    rootSeedKey: Uint8Array,
    descriptor: WalletSeedDescriptor
): MnemonicResource {
    assertValidRootSeedKey(rootSeedKey);

    switch (descriptor.schema) {
        case 'bip39':
            return deriveBip39WalletSeedAccessor(rootSeedKey, descriptor);
        default:
            throw new Error(`Unsupported wallet seed schema: ${String(descriptor.schema)}`);
    }
}

export function deriveBip39WalletSeedAccessor(
    rootSeedKey: Uint8Array,
    descriptor: WalletSeedDescriptor
): MnemonicResource {
    assertValidRootSeedKey(rootSeedKey);
    assertValidWalletIndex(descriptor.walletIndex);

    const entropyBits = descriptor.entropyBits;
    assertValidEntropyBits(entropyBits);

    const context = concatBytes(
        utf8ToBytes('safely/v1/wallet-seed'),
        Buffer.from([0x00]),
        utf8ToBytes('bip39'),
        uint32be(descriptor.walletIndex),
        uint32be(entropyBits)
    );
    const material = hmac(sha256, rootSeedKey, context);
    const entropy = material.slice(0, entropyBits / 8);
    const mnemonic = entropyToMnemonic(entropy, wordlist).split(' ');

    return new MnemonicResource(mnemonic);
}

function uint32be(value: number): Uint8Array {
    const bytes = new Uint8Array(4);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, value, false);
    return bytes;
}

function assertValidRootSeedKey(rootSeedKey: Uint8Array) {
    if (rootSeedKey.length !== ROOT_SEED_KEY_BYTES) {
        throw new Error(`Root seed key must be ${ROOT_SEED_KEY_BYTES} bytes`);
    }
}

function assertValidWalletIndex(walletIndex: number) {
    if (!Number.isSafeInteger(walletIndex) || walletIndex < 0) {
        throw new Error('Wallet seed index must be a uint32');
    }
}

function assertValidEntropyBits(entropyBits: number) {
    if (!SUPPORTED_ENTROPY_BITS.has(entropyBits)) {
        throw new Error('BIP39 entropy bits must be one of 128, 160, 192, 224, 256');
    }
}
