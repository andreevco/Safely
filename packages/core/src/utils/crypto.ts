import { sha256 } from '@noble/hashes/sha2.js';

export function sha256Prefix(input: string, byteLength = 8): string {
    return Buffer.from(sha256(Buffer.from(input, 'utf-8')))
        .subarray(0, byteLength)
        .toString('hex');
}
