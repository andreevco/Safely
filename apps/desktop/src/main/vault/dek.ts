import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { VaultError } from './vault-error';

const KEY_BYTES = 32;
const VERSION = 'v1';
const PREFIX = `${VERSION}:`;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

/**
 * The data key and the format written under it. A resource, so an instance cannot outlive the
 * operation it was unwrapped for: every holder declares it with `using` and the key is zeroed when
 * that scope ends, on the error path as well.
 */
export class DEK implements Disposable {
    public static generate(): Buffer {
        return randomBytes(KEY_BYTES);
    }

    constructor(private readonly bytes: Buffer) {}

    public seal(scope: string, key: string, value: string): string {
        const nonce = randomBytes(NONCE_BYTES);
        const cipher = createCipheriv('aes-256-gcm', this.bytes, nonce);

        cipher.setAAD(additionalData(scope, key));

        const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);

        return PREFIX + Buffer.concat([nonce, ciphertext, cipher.getAuthTag()]).toString('base64');
    }

    public unseal(scope: string, key: string, stored: string): string {
        if (!stored.startsWith(PREFIX)) {
            throw new VaultError('DECRYPT_FAILED');
        }

        const payload = Buffer.from(stored.slice(PREFIX.length), 'base64');

        if (payload.length < NONCE_BYTES + TAG_BYTES) {
            throw new VaultError('DECRYPT_FAILED');
        }

        const decipher = createDecipheriv(
            'aes-256-gcm',
            this.bytes,
            payload.subarray(0, NONCE_BYTES)
        );

        decipher.setAAD(additionalData(scope, key));
        decipher.setAuthTag(payload.subarray(payload.length - TAG_BYTES));

        try {
            const plaintext = Buffer.concat([
                decipher.update(payload.subarray(NONCE_BYTES, payload.length - TAG_BYTES)),
                decipher.final()
            ]);

            return plaintext.toString('utf8');
        } catch {
            throw new VaultError('DECRYPT_FAILED');
        }
    }

    public [Symbol.dispose](): void {
        this.bytes.fill(0);
    }
}

/** A ciphertext moved to another key, scope or format version fails authentication. */
function additionalData(scope: string, key: string): Buffer {
    return Buffer.from(`${VERSION}|${scope}|${key}`, 'utf8');
}
