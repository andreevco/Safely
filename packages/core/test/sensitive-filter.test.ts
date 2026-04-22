import { describe, it, expect } from 'vitest';

import { filterSensitiveData } from '../src';

describe('filterSensitiveData', () => {
    describe('hex private keys', () => {
        it('should redact a 64-char lowercase hex string', () => {
            const key = 'a'.repeat(64);
            expect(filterSensitiveData(`key: ${key}`)).toBe('key: [REDACTED:key]');
        });

        it('should redact a 64-char mixed-case hex string', () => {
            const key = 'aB3f'.repeat(16);
            expect(filterSensitiveData(key)).toBe('[REDACTED:key]');
        });

        it('should not redact a 63-char hex string', () => {
            const short = 'a'.repeat(63);
            expect(filterSensitiveData(short)).toBe(short);
        });

        it('should not redact a 65-char hex string', () => {
            const long = 'a'.repeat(65);
            expect(filterSensitiveData(long)).toBe(long);
        });

        it('should redact multiple hex keys in the same string', () => {
            const k1 = 'a'.repeat(64);
            const k2 = 'b'.repeat(64);
            const result = filterSensitiveData(`${k1} and ${k2}`);
            expect(result).toBe('[REDACTED:key] and [REDACTED:key]');
        });
    });

    describe('Bearer tokens', () => {
        it('should redact Bearer token', () => {
            expect(filterSensitiveData('Bearer abc123xyz789')).toBe('Bearer [REDACTED]');
        });

        it('should handle tokens with base64 chars', () => {
            expect(filterSensitiveData('Bearer abc+def/ghi=')).toBe('Bearer [REDACTED]');
        });
    });

    describe('JWTs', () => {
        it('should redact a standard JWT', () => {
            const jwt =
                'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
            expect(filterSensitiveData(jwt)).toBe('[REDACTED:jwt]');
        });

        it('should not redact a short eyJ string', () => {
            expect(filterSensitiveData('eyJhbGci.ey.e')).toBe('eyJhbGci.ey.e');
        });
    });

    describe('xprv keys', () => {
        it('should redact an xprv key', () => {
            const xprv = 'xprv' + 'A'.repeat(107);
            expect(filterSensitiveData(xprv)).toBe('[REDACTED:xprv]');
        });

        it('should redact tprv variant', () => {
            const tprv = 'tprv' + 'B'.repeat(107);
            expect(filterSensitiveData(tprv)).toBe('[REDACTED:xprv]');
        });
    });

    describe('generic credentials', () => {
        it('should redact api_key patterns', () => {
            const input = 'api_key: abcdefghijklmnopqr';
            expect(filterSensitiveData(input)).toBe('[REDACTED:credential]');
        });

        it('should redact token patterns (case-insensitive)', () => {
            const input = 'Token: abcdefghijklmnopqrstuvwx';
            expect(filterSensitiveData(input)).toBe('[REDACTED:credential]');
        });

        it('should redact password patterns', () => {
            const input = 'password=supersecretpassword1';
            expect(filterSensitiveData(input)).toBe('[REDACTED:credential]');
        });

        it('should not redact values shorter than 16 chars', () => {
            const input = 'token: short';
            expect(filterSensitiveData(input)).toBe('token: short');
        });
    });

    describe('mnemonic detection', () => {
        const mnemonic12 =
            'abandon ability able about above absent absorb abstract absurd abuse access accident';

        it('should redact 12 consecutive BIP39 words', () => {
            expect(filterSensitiveData(mnemonic12)).toBe('[REDACTED:mnemonic]');
        });

        it('should redact 24 consecutive BIP39 words', () => {
            const mnemonic24 = mnemonic12 + ' ' + mnemonic12;
            expect(filterSensitiveData(mnemonic24)).toBe('[REDACTED:mnemonic]');
        });

        it('should not redact 11 consecutive BIP39 words', () => {
            const words11 =
                'abandon ability able about above absent absorb abstract absurd abuse access';
            expect(filterSensitiveData(words11)).toBe(words11);
        });

        it('should preserve surrounding text', () => {
            const input = `prefix ${mnemonic12} suffix`;
            expect(filterSensitiveData(input)).toBe('prefix [REDACTED:mnemonic] suffix');
        });

        it('should handle mnemonic at end of string', () => {
            const input = `logging: ${mnemonic12}`;
            expect(filterSensitiveData(input)).toBe('logging: [REDACTED:mnemonic]');
        });

        it('should be case-insensitive', () => {
            const upper = mnemonic12.toUpperCase();
            expect(filterSensitiveData(upper)).toBe('[REDACTED:mnemonic]');
        });
    });

    describe('combined', () => {
        it('should redact both hex key and mnemonic', () => {
            const key = 'f'.repeat(64);
            const mnemonic =
                'abandon ability able about above absent absorb abstract absurd abuse access accident';
            const input = `key ${key} words ${mnemonic}`;
            expect(filterSensitiveData(input)).toContain('[REDACTED:key]');
            expect(filterSensitiveData(input)).toContain('[REDACTED:mnemonic]');
        });

        it('should return unchanged input when nothing sensitive', () => {
            const input = 'just a normal log message about sync';
            expect(filterSensitiveData(input)).toBe(input);
        });

        it('should handle empty string', () => {
            expect(filterSensitiveData('')).toBe('');
        });

        it('should produce identical results on consecutive calls', () => {
            const key = 'a'.repeat(64);
            const r1 = filterSensitiveData(key);
            const r2 = filterSensitiveData(key);
            expect(r1).toBe(r2);
        });
    });
});
