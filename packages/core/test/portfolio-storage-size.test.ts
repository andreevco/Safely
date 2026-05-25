import { entropyToMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { describe, expect, it } from 'vitest';

import { syncedStorageVersions } from '@safely/sync-storage';

import { PortfolioFactory, PortfolioNetworkType } from '../src';
import { createStorage, jsonEncoder } from '../../slottree/src';

const AUTHOR_PUBKEY_HEX = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const PORTFOLIOS_COUNT = 100;

class PassthroughSecretEncryptor {
    public async decrypt(secret: string): Promise<string> {
        return secret;
    }

    public async encrypt(secret: string): Promise<string> {
        return secret;
    }
}

class StaticMnemonicAccessor {
    constructor(public readonly value: string[]) {}
}

function mnemonicFor(index: number): string[] {
    const entropy = new Uint8Array(16);
    entropy[12] = (index >>> 24) & 0xff;
    entropy[13] = (index >>> 16) & 0xff;
    entropy[14] = (index >>> 8) & 0xff;
    entropy[15] = index & 0xff;

    return entropyToMnemonic(entropy, wordlist).split(' ');
}

function byteLength(value: string): number {
    return Buffer.byteLength(value, 'utf8');
}

describe('Portfolio storage snapshot size', () => {
    it('prints JSON export and binary export sizes', async () => {
        const storage = createStorage({
            authorId: AUTHOR_PUBKEY_HEX,
            versions: syncedStorageVersions
        });
        const factory = new PortfolioFactory(new PassthroughSecretEncryptor());
        const portfolios = [];

        for (let index = 0; index < PORTFOLIOS_COUNT; index += 1) {
            const portfolio = await factory.generatePortfolio(
                new StaticMnemonicAccessor(mnemonicFor(index)),
                {
                    network: PortfolioNetworkType.MAINNET,
                    meta: { name: `Portfolio ${index + 1}` }
                }
            );
            portfolios.push(portfolio.toJSON());
        }

        storage.transaction(draft => {
            const portfolioDraft = draft.at('portfolios');
            for (const portfolio of portfolios) {
                portfolioDraft.push(portfolio);
            }
        });

        const jsonExport = storage.withEncoder(jsonEncoder).export();
        const binaryExport = storage.exportBinary();
        const restored = createStorage({
            authorId: AUTHOR_PUBKEY_HEX,
            versions: syncedStorageVersions
        });
        restored.mergeBinary(binaryExport);

        const jsonBytes = byteLength(jsonExport);
        const binaryBytes = binaryExport.length;

        console.log(
            `PORTFOLIO_STORAGE_SIZE ${JSON.stringify({
                portfolios: PORTFOLIOS_COUNT,
                authorHexChars: AUTHOR_PUBKEY_HEX.length,
                jsonBytes,
                binaryBytes,
                ratio: binaryBytes / jsonBytes
            })}`
        );

        expect(restored.get()).toEqual(storage.get());
        expect(binaryBytes).toBeLessThan(jsonBytes);
    });
});
