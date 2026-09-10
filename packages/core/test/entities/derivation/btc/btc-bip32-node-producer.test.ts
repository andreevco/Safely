import { HDKey } from '@scure/bip32';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { BtcNetwork, BtcWalletType } from '../../../../src/entities/blockchain';
import { BtcBip32NodeProducer } from '../../../../src/entities/derivation/btc/implementations/bip39/btc-bip32-node-producer';
import type { ISeedProducer } from '../../../../src/entities/seed/I-seed-producer';

const SEED_BYTE = 7;
const SEED_LENGTH = 64;

const expectedAccount = HDKey.fromMasterSeed(Buffer.alloc(SEED_LENGTH, SEED_BYTE)).derive(
    "m/84'/0'/0'"
);

function producerFor(seed: Buffer): BtcBip32NodeProducer {
    const seedProducer: ISeedProducer = { getSeed: () => Promise.resolve(seed) };

    return new BtcBip32NodeProducer(
        seedProducer,
        BtcWalletType.NATIVE_SEGWIT,
        BtcNetwork.MAINNET,
        0
    );
}

// The master node is created inside the producer, so the only way to inspect it
// afterwards is to record what fromMasterSeed handed back.
function trackMasterNodes(): HDKey[] {
    const masterNodes: HDKey[] = [];
    const fromMasterSeed = HDKey.fromMasterSeed;

    vi.spyOn(HDKey, 'fromMasterSeed').mockImplementation(
        (...args: Parameters<typeof HDKey.fromMasterSeed>) => {
            const root = fromMasterSeed(...args);
            masterNodes.push(root);
            return root;
        }
    );

    return masterNodes;
}

describe('BtcBip32NodeProducer key hygiene', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('zeroes the seed and wipes the master node after deriving', async () => {
        const seed = Buffer.alloc(SEED_LENGTH, SEED_BYTE);
        const masterNodes = trackMasterNodes();

        const account = await producerFor(seed).getPortfolioDerivation();

        expect(masterNodes).toHaveLength(1);
        expect(masterNodes[0].privateKey).toBeNull();
        expect(seed.equals(Buffer.alloc(SEED_LENGTH))).toBe(true);
        // Wiping the master node must not disturb the node that is returned.
        expect(account.privateKey).toEqual(expectedAccount.privateKey);
    });

    it('zeroes the seed and wipes the master node when derivation throws', async () => {
        const seed = Buffer.alloc(SEED_LENGTH, SEED_BYTE);
        const masterNodes = trackMasterNodes();

        vi.spyOn(HDKey.prototype, 'derive').mockImplementation(() => {
            throw new Error('derivation failed');
        });

        await expect(producerFor(seed).getPortfolioDerivation()).rejects.toThrow(
            'derivation failed'
        );

        expect(masterNodes).toHaveLength(1);
        expect(masterNodes[0].privateKey).toBeNull();
        expect(seed.equals(Buffer.alloc(SEED_LENGTH))).toBe(true);
    });
});
