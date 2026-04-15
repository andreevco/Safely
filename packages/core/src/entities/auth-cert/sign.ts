import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';

import { REQ_DOMAIN } from './const';
import { bytesToHex, hexToBytes, u16be, u32be, u64be, u8be, utf8 } from './utils';

export interface SignRequestInput {
    certHex: string;
    reqSecretKey: Uint8Array;
    method: string;
    pathWithQuery: string;
    bodyBytes: Uint8Array;
}

export function signRequest(input: SignRequestInput): string {
    const ts = Math.floor(Date.now() / 1000);
    const nonce = getNonce();

    const bodyBytes = input.bodyBytes;

    const certBytes = hexToBytes(input.certHex);
    const toSign = buildRequestSigningPayload({
        method: input.method,
        pathWithQuery: input.pathWithQuery,
        bodyBytes,
        ts,
        nonce,
        certBytes
    });

    const signature = ed25519.sign(toSign, input.reqSecretKey);

    return (
        `Safely-RO cert=${input.certHex},` +
        `nonce=${nonce},` +
        `timestamp=${ts},` +
        `sig=${bytesToHex(signature)}`
    );
}

export function buildRequestSigningPayload(input: {
    method: string;
    pathWithQuery: string;
    bodyBytes: Uint8Array;
    ts: number;
    nonce: number;
    certBytes: Uint8Array;
}): Uint8Array {
    const method = input.method.toUpperCase();
    const pathWithQuery = input.pathWithQuery;

    const methodBytes = utf8(method);
    const pathBytes = utf8(pathWithQuery);

    return Buffer.concat([
        utf8(REQ_DOMAIN),
        u8be(0x00),
        u16be(methodBytes.length),
        utf8(method),
        u16be(pathBytes.length),
        utf8(pathWithQuery),
        sha256(input.bodyBytes),
        u64be(input.ts),
        u32be(input.nonce),
        sha256(input.certBytes)
    ]);
}

function getNonce(): number {
    const arr = new Uint8Array(4);
    crypto.getRandomValues(arr);
    return Buffer.from(arr).readUint32BE();
}
