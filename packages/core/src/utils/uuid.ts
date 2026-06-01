import { bytesToHex } from '@noble/hashes/utils.js';

export function formatBytesAsUuid(bytes: Uint8Array, version: number): string {
    if (bytes.length < 16) {
        throw new Error('formatBytesAsUuid requires at least 16 bytes');
    }

    if (version < 0 || version > 0xf) {
        throw new Error(`formatBytesAsUuid: version must be 0..15, got ${version}`);
    }

    const out = new Uint8Array(16);
    out.set(bytes.subarray(0, 16));
    out[6] = (out[6] & 0x0f) | (version << 4);
    out[8] = (out[8] & 0x3f) | 0x80;

    return formatUuidString(out);
}

function formatUuidString(bytes16: Uint8Array): string {
    const hex = bytesToHex(bytes16);

    return (
        hex.substring(0, 8) +
        '-' +
        hex.substring(8, 12) +
        '-' +
        hex.substring(12, 16) +
        '-' +
        hex.substring(16, 20) +
        '-' +
        hex.substring(20, 32)
    );
}
