import { describe, expect, it } from 'vitest';

import { DEK } from '../../../src/main/vault/dek';

/* The point of every case below is that authentication fails loudly: a value must not decrypt
   under a key, a scope or a format it was not written for. */
describe('DEK', () => {
    it('returns what was sealed', () => {
        using dek = DEK.generate();

        const stored = dek.seal('encrypted', 'master_key', 'deadbeef');

        expect(dek.unseal('encrypted', 'master_key', stored)).toBe('deadbeef');
    });

    it('does not leak the plaintext into the stored form', () => {
        using dek = DEK.generate();

        expect(dek.seal('encrypted', 'master_key', 'deadbeef')).not.toContain('deadbeef');
    });

    it('produces a different ciphertext each time, so equal values are not recognisable', () => {
        using dek = DEK.generate();

        const first = dek.seal('encrypted', 'master_key', 'same');
        const second = dek.seal('encrypted', 'master_key', 'same');

        expect(first).not.toBe(second);
    });

    it('rejects a value moved to another key', () => {
        using dek = DEK.generate();

        const stored = dek.seal('encrypted', 'master_key', 'deadbeef');

        expect(() => dek.unseal('encrypted', 'dmk_prv', stored)).toThrow('DECRYPT_FAILED');
    });

    it('rejects a value moved to another scope', () => {
        using dek = DEK.generate();

        const stored = dek.seal('encrypted', 'master_key', 'deadbeef');

        expect(() => dek.unseal('regular', 'master_key', stored)).toThrow('DECRYPT_FAILED');
    });

    it('rejects a value sealed under a different data key', () => {
        using dek = DEK.generate();
        using other = DEK.generate();

        const stored = other.seal('encrypted', 'master_key', 'deadbeef');

        expect(() => dek.unseal('encrypted', 'master_key', stored)).toThrow('DECRYPT_FAILED');
    });

    it('rejects a tampered ciphertext instead of returning altered bytes', () => {
        using dek = DEK.generate();

        const stored = dek.seal('encrypted', 'master_key', 'deadbeef');
        const payload = Buffer.from(stored.slice('v1:'.length), 'base64');

        payload[payload.length - 20] ^= 0x01;

        const tampered = `v1:${payload.toString('base64')}`;

        expect(() => dek.unseal('encrypted', 'master_key', tampered)).toThrow('DECRYPT_FAILED');
    });

    it('rejects an unknown format version', () => {
        using dek = DEK.generate();

        const stored = dek.seal('encrypted', 'master_key', 'deadbeef');
        const reversioned = `v2:${stored.slice('v1:'.length)}`;

        expect(() => dek.unseal('encrypted', 'master_key', reversioned)).toThrow('DECRYPT_FAILED');
    });

    it('rejects a payload too short to hold a nonce and a tag', () => {
        using dek = DEK.generate();

        expect(() => dek.unseal('encrypted', 'master_key', 'v1:AAAA')).toThrow('DECRYPT_FAILED');
    });

    /* Leaving the scope has to really zero the material: a disposal that did nothing would keep the
       key alive for as long as the process, with nothing else in the vault to notice. */
    it('cannot open its own ciphertext once its scope ended', () => {
        let escaped: DEK;
        let stored: string;

        {
            using dek = DEK.generate();

            escaped = dek;
            stored = dek.seal('encrypted', 'master_key', 'deadbeef');
        }

        expect(() => escaped.unseal('encrypted', 'master_key', stored)).toThrow('DECRYPT_FAILED');
    });
});
