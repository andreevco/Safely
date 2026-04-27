import { sha256 } from '@noble/hashes/sha2.js';

export function xorFold16(input: Uint8Array): Buffer {
    if (input.length !== 64) throw new Error('input must be 64 bytes');
    const out = new Uint8Array(16);
    for (let b = 0; b < 4; b++) {
        const base = b * 16;
        for (let i = 0; i < 16; i++) {
            out[i] ^= input[base + i];
        }
    }
    return Buffer.from(out);
}

export function sha256Prefix(input: string, byteLength = 8): string {
    return Buffer.from(sha256(Buffer.from(input, 'utf-8')))
        .subarray(0, byteLength)
        .toString('hex');
}
