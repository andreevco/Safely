/* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment */
import { ed25519 } from '@noble/curves/ed25519.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { HDKey } from '@scure/bip32';
import { describe, it, expect } from 'vitest';

import { AUTH_CERT_CHILD_INDEX, CERT_DOMAIN } from './const';
import { createReadOnlyCertificate } from './create-cert';
import { buildRequestSigningPayload, signRequest } from './sign';
import { bytesToUtf8, hexToBytes, utf8 } from './utils';

describe('AuthCert', () => {
    it('should create an instance of AuthCert, sign and verify it', () => {
        const hdKey = HDKey.fromMasterSeed(Buffer.alloc(32, 0x01));
        const { reqSecretKey, certHex } = createReadOnlyCertificate(hdKey);

        const reqInput = {
            method: 'GET',
            pathWithQuery: '/test/path?query=1',
            bodyBytes: utf8('test-body'),
            certHex,
            reqSecretKey
        };
        const authHeader = signRequest(reqInput);

        validateRequest({
            authorization: authHeader,
            method: reqInput.method,
            pathWithQuery: reqInput.pathWithQuery,
            bodyBytes: reqInput.bodyBytes
        });
    });
});

function validateRequest(input: {
    authorization: string;
    method: string;
    pathWithQuery: string;
    bodyBytes: Uint8Array;
}) {
    const parsed = parseAuthorizationHeader(input.authorization);

    const certBytes = hexToBytes(parsed.certHex);

    const { certSig, certBody: certBodyBytes } = parseCertEnvelope(certBytes);
    const certBody = parseCertBody(certBodyBytes);

    const authCertNode = deriveAuthCertNodeFromXpub(certBody.xpub);
    const authCertPub = authCertNode.publicKey!;

    const certToVerify = Buffer.concat([utf8(CERT_DOMAIN), Uint8Array.of(0x00), certBodyBytes]);
    const certMsgHash = sha256(certToVerify);

    expect(
        secp256k1.verify(certSig, certMsgHash, authCertPub, {
            prehash: false,
            format: 'compact'
        })
    ).toBeTruthy();

    const reqPublicKey = hexToBytes(certBody.req_pub);

    const bodyBytes = input.bodyBytes ?? new Uint8Array();

    const reqToVerify = buildRequestSigningPayload({
        method: input.method,
        pathWithQuery: input.pathWithQuery,
        bodyBytes,
        ts: parsed.ts,
        nonce: parsed.nonce,
        certBytes
    });
    const reqSig = hexToBytes(parsed.sigHex);

    expect(
        ed25519.verify(reqSig, reqToVerify, reqPublicKey, {
            zip215: false
        })
    ).toBeTruthy();
}

function parseAuthorizationHeader(header: string): {
    certHex: string;
    ts: number;
    nonce: number;
    sigHex: string;
} {
    const re =
        /^Safely-RO cert=(?<cert>[a-f0-9]+),nonce=(?<nonce>\d+),timestamp=(?<ts>\d+),sig=(?<sig>[a-f0-9]+)$/;
    const m = header.match(re)!;

    const [, certHex, nonceRaw, tsRaw, sigHex] = m;
    const ts = Number(tsRaw);
    const nonce = Number(nonceRaw);

    return { certHex, ts, nonce, sigHex };
}

function parseCertEnvelope(certBytes: Uint8Array): {
    certBody: Uint8Array;
    certSig: Uint8Array;
} {
    const certSig = certBytes.slice(0, 64);
    const certBody = certBytes.slice(64);

    return { certBody, certSig };
}

function parseCertBody(certBodyBytes: Uint8Array): ReadOnlyCertBody {
    const obj = JSON.parse(bytesToUtf8(certBodyBytes));

    expect(obj.v).toEqual(1);
    expect(obj.typ).toEqual('wallet-http-ro');
    expect(obj.alg).toEqual('ed25519');

    return obj as ReadOnlyCertBody;
}

function deriveAuthCertNodeFromXpub(accountXpub: string): HDKey {
    const accountNode = HDKey.fromExtendedKey(accountXpub);
    return accountNode.deriveChild(AUTH_CERT_CHILD_INDEX);
}

interface ReadOnlyCertBody {
    v: 1;
    typ: 'wallet-http-ro';
    alg: 'ed25519';
    xpub: string; // standard BIP32 xpub
    req_pub: string; // hex, 32 bytes => 64 hex chars
}
