import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { concatBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { entropyToMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

import type { ISyncAccount, ITreeStorage } from '@safely/sync';
import { MKDerivationDomain } from '@safely/sync';

import { MnemonicResource } from '../mnemonic';

export class PortfolioMnemonicFactory {
    constructor(
        private readonly account: ISyncAccount<never>,
        private readonly secureEncryptedStorage: ITreeStorage
    ) {}

    public async deriveBip39MnemonicResource(portfolioIndex: number): Promise<MnemonicResource> {
        this.assertValidPortfolioIndex(portfolioIndex);
        const rootSeedKey = await this.getRootDerivationKey();

        const entropyBits = 128;

        const context = concatBytes(
            utf8ToBytes('safely/v1/portfolio-seed'),
            Buffer.from([0x00]),
            utf8ToBytes('bip39'),
            this.uint32be(portfolioIndex),
            this.uint32be(entropyBits)
        );
        const material = hmac(sha256, rootSeedKey, context);
        const entropy = material.slice(0, entropyBits / 8);
        const mnemonic = entropyToMnemonic(entropy, wordlist).split(' ');

        return new MnemonicResource(mnemonic);
    }

    private async getRootDerivationKey() {
        const rootSeedKey = await this.account.deriveKeyFromMasterKey(
            MKDerivationDomain.ROOT_SEED_KEY,
            this.secureEncryptedStorage
        );
        this.assertValidRootSeedKey(rootSeedKey);
        return rootSeedKey;
    }

    private uint32be(value: number): Uint8Array {
        const buf = Buffer.alloc(4);
        buf.writeUInt32BE(value, 0);
        return buf;
    }

    private assertValidRootSeedKey(rootSeedKey: Uint8Array) {
        const ROOT_SEED_KEY_BYTES = 32;
        if (rootSeedKey.length !== ROOT_SEED_KEY_BYTES) {
            throw new Error(`Root seed key must be ${ROOT_SEED_KEY_BYTES} bytes`);
        }
    }

    private assertValidPortfolioIndex(portfolioIndex: number) {
        const MAX_UINT32 = 0xffffffff;
        if (
            !Number.isSafeInteger(portfolioIndex) ||
            portfolioIndex < 0 ||
            portfolioIndex > MAX_UINT32
        ) {
            throw new Error('Wallet seed index must be a uint32');
        }
    }
}
