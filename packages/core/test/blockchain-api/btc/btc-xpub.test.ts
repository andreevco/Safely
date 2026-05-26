import { describe, expect, it } from 'vitest';

import { BtcXpub } from '../../../src/blockchain-api/btc/btc-xpub';
import { BtcNetwork, BtcWalletType } from '../../../src/entities/blockchain';

const KNOWN_XPUB =
    'xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSWGFNbi8Aw6ZRc1brxMyWMzG3DSSSSoekkudhUd9yLb6qx39T9nMdj';

describe('BtcXpub', () => {
    describe('validate()', () => {
        it('rejects truncated xpub', () => {
            expect(BtcXpub.validate('xpub6CUG...')).toBe(false);
        });

        it('rejects bech32 address as xpub', () => {
            expect(BtcXpub.validate('bc1qcleg3jtmvlar6cgm24vpq6n8ew3d0hame0av83')).toBe(false);
        });

        it('rejects empty string', () => {
            expect(BtcXpub.validate('')).toBe(false);
        });

        it('accepts a structurally valid xpub', () => {
            expect(BtcXpub.validate(KNOWN_XPUB)).toBe(true);
        });
    });

    describe('deriveAddress()', () => {
        it('derives a mainnet Native SegWit address (bc1q…) from xpub', () => {
            const address = BtcXpub.deriveAddress(
                KNOWN_XPUB,
                BtcNetwork.MAINNET,
                BtcWalletType.NATIVE_SEGWIT
            );
            expect(address).toBe('bc1qmxrw6qdh5g3ztfcwm0et5l8mvws4eva24kmp8m');
        });

        it('is deterministic for the same xpub', () => {
            const a = BtcXpub.deriveAddress(
                KNOWN_XPUB,
                BtcNetwork.MAINNET,
                BtcWalletType.NATIVE_SEGWIT
            );
            const b = BtcXpub.deriveAddress(
                KNOWN_XPUB,
                BtcNetwork.MAINNET,
                BtcWalletType.NATIVE_SEGWIT
            );
            expect(a).toBe(b);
        });
    });
});
