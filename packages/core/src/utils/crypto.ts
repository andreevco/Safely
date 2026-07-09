import { sha256 } from '@noble/hashes/sha2.js';

const defaultByteLength = 16;

export function sha256PrefixBuffer(input: string, byteLength = defaultByteLength): Buffer {
    return Buffer.from(sha256(Buffer.from(input, 'utf-8'))).subarray(0, byteLength);
}

export function sha256PrefixString(input: string, byteLength = defaultByteLength): string {
    return sha256PrefixBuffer(input, byteLength).toString('hex');
}

export function sha256PrefixNumber(input: string, byteLength = defaultByteLength): number {
    return sha256PrefixBuffer(input, byteLength).readUint32BE();
}
