import { sha256 } from '@noble/hashes/sha2.js';

export function getKID(key: Buffer) {
    return Buffer.from(sha256(key)).slice(0, 16).toString('hex');
}
