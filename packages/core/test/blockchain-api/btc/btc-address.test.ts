import { describe, expect, it } from 'vitest';

import { BtcAddress } from '../../../src/blockchain-api/btc/btc-address';

describe('BtcAddress', () => {
    describe('type()', () => {
        it('classifies mainnet bech32 P2WPKH (bc1q…)', () => {
            const address = 'bc1qcleg3jtmvlar6cgm24vpq6n8ew3d0hame0av83';
            expect(BtcAddress.type(address)).toBe('P2WPKH');
        });

        it('classifies testnet bech32 P2WPKH (tb1q…)', () => {
            expect(BtcAddress.type('tb1q4tvt7x6veyr96kj3deph5av03czytyw5ssalr6')).toBe('P2WPKH');
        });

        it('classifies P2PKH (1…)', () => {
            expect(BtcAddress.type('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe('P2PKH');
        });

        it('classifies P2SH (3…)', () => {
            expect(BtcAddress.type('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toBe('P2SH');
        });

        it('classifies P2TR (bc1p…)', () => {
            expect(
                BtcAddress.type('bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr')
            ).toBe('P2TR');
        });

        it('throws on unknown prefix', () => {
            expect(() => BtcAddress.type('zzz')).toThrow();
        });
    });

    describe('isSegWit()', () => {
        it('returns true for P2WPKH', () => {
            expect(BtcAddress.isSegWit('bc1qcleg3jtmvlar6cgm24vpq6n8ew3d0hame0av83')).toBe(true);
        });

        it('returns false for P2PKH', () => {
            expect(BtcAddress.isSegWit('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(false);
        });

        it('returns true for P2TR', () => {
            expect(
                BtcAddress.isSegWit(
                    'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr'
                )
            ).toBe(true);
        });
    });

    describe('isLegacy()', () => {
        it('returns true for P2PKH', () => {
            expect(BtcAddress.isLegacy('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(true);
        });

        it('returns true for P2SH', () => {
            expect(BtcAddress.isLegacy('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toBe(true);
        });

        it('returns false for SegWit', () => {
            expect(BtcAddress.isLegacy('bc1qcleg3jtmvlar6cgm24vpq6n8ew3d0hame0av83')).toBe(false);
        });
    });

    describe('validate()', () => {
        it('accepts a valid mainnet P2WPKH address', () => {
            expect(BtcAddress.validate('bc1qcleg3jtmvlar6cgm24vpq6n8ew3d0hame0av83')).toBe(true);
        });

        it('rejects garbage', () => {
            expect(BtcAddress.validate('not-an-address')).toBe(false);
            expect(BtcAddress.validate('')).toBe(false);
        });
    });
});
