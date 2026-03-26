import { sha256 } from '@noble/hashes/sha2.js';

export function generateKID(buffer: Buffer): Buffer {
    // Simple KID generation using SHA-256 hash of the public key and taking the first 8 bytes as the KID
    const hash = sha256(buffer);
    return Buffer.from(hash.slice(0, 16));
}
