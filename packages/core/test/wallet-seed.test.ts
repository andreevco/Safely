import { hexToBytes } from '@noble/hashes/utils.js';
import { describe, expect, it } from 'vitest';

import { deriveBip39WalletSeedAccessor } from '../src';

const ZERO_ROOT_SEED_KEY = '0000000000000000000000000000000000000000000000000000000000000000';

describe('wallet seed derivation', () => {
    it('derives a deterministic BIP39 256-bit mnemonic', () => {
        const accessor = deriveBip39WalletSeedAccessor(hexToBytes(ZERO_ROOT_SEED_KEY), {
            schema: 'bip39',
            walletIndex: 0,
            entropyBits: 256
        });

        expect(accessor.value).toEqual(
            'steak gaze monster demise edge shuffle legal symbol use ghost marine swamp pattern impact behind heart squirrel mix butter erode cross february report live'.split(
                ' '
            )
        );
    });

    it('uses wallet index and entropy bits in the derivation context', () => {
        const indexOne = deriveBip39WalletSeedAccessor(hexToBytes(ZERO_ROOT_SEED_KEY), {
            schema: 'bip39',
            walletIndex: 1,
            entropyBits: 256
        });
        const entropy128 = deriveBip39WalletSeedAccessor(hexToBytes(ZERO_ROOT_SEED_KEY), {
            schema: 'bip39',
            walletIndex: 0,
            entropyBits: 128
        });

        expect(indexOne.value).toEqual(
            'help sad response shell pair lamp tennis smile garden truth case pear come episode wide beef tomorrow vehicle novel scrap donor card onion electric'.split(
                ' '
            )
        );
        expect(entropy128.value).toEqual(
            'bring grocery method crime clever awake bitter liberty armed essence squirrel easily'.split(
                ' '
            )
        );
    });

    it('rejects wallet indexes outside uint32 range', () => {
        expect(() =>
            deriveBip39WalletSeedAccessor(hexToBytes(ZERO_ROOT_SEED_KEY), {
                schema: 'bip39',
                walletIndex: 0x1_0000_0000,
                entropyBits: 128
            })
        ).toThrow('Wallet seed index must be a uint32');
    });
});
