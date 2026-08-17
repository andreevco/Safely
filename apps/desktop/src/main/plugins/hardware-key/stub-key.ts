import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

import type { HardwareKey } from './types';

const NONCE_BYTES = 12;
const TAG_BYTES = 16;

function stubKey(tag: string): Buffer {
    return createHash('sha256').update(`safely/vault/dev-stub/${tag}`).digest();
}

/** The same shape as the enclave and none of the protection: the key is derived from the tag. */
export function createStubHardwareKey(): HardwareKey {
    return {
        isAvailable: () => true,

        ensureKey: () => undefined,

        seal: (tag, data) => {
            const nonce = randomBytes(NONCE_BYTES);
            const cipher = createCipheriv('aes-256-gcm', stubKey(tag), nonce);
            const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);

            return Buffer.concat([nonce, ciphertext, cipher.getAuthTag()]);
        },

        open: (tag, blob) => {
            if (blob.length < NONCE_BYTES + TAG_BYTES) {
                return Promise.reject(new Error('stub hardware key: blob is too short'));
            }

            const decipher = createDecipheriv(
                'aes-256-gcm',
                stubKey(tag),
                blob.subarray(0, NONCE_BYTES)
            );

            decipher.setAuthTag(blob.subarray(blob.length - TAG_BYTES));

            try {
                return Promise.resolve(
                    Buffer.concat([
                        decipher.update(blob.subarray(NONCE_BYTES, blob.length - TAG_BYTES)),
                        decipher.final()
                    ])
                );
            } catch {
                return Promise.reject(new Error('stub hardware key: blob did not authenticate'));
            }
        },

        destroy: () => undefined
    };
}
