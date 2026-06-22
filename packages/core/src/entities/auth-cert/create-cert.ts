import { ed25519 } from '@noble/curves/ed25519.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import type { HDKey } from '@scure/bip32';

import { toHex, utf8 } from '@safely/sync/buffer';

import { AUTH_CERT_CHILD_INDEX, CERT_DOMAIN, SEED_INFO } from './const';

export function createReadOnlyCertificate(accountNode: HDKey) {
    const authCertNode = deriveAuthCertNodeFromXpriv(accountNode);
    if (!authCertNode.privateKey) {
        throw new Error('Auth cert node has no private key.');
    }

    const { secretKey: reqSecretKey, publicKey: reqPublicKey } =
        deriveRequestKeypairFromAuthCertPriv(authCertNode.privateKey);

    const certBody = {
        v: 1,
        typ: 'wallet-http-ro',
        alg: 'ed25519',
        xpub: accountNode.publicExtendedKey,
        req_pub: toHex(reqPublicKey)
    };

    const certBodyBytes = utf8(JSON.stringify(certBody));
    const certToSign = Buffer.concat([utf8(CERT_DOMAIN), Uint8Array.of(0x00), certBodyBytes]);

    const certSig = secp256k1.sign(sha256(certToSign), authCertNode.privateKey, {
        prehash: false,
        format: 'compact'
    });

    const certBytes = Buffer.concat([certSig, certBodyBytes]);
    const certHex = toHex(certBytes);

    return {
        reqSecretKey,
        certHex
    };
}

function deriveAuthCertNodeFromXpriv(accountNode: HDKey): HDKey {
    return accountNode.deriveChild(AUTH_CERT_CHILD_INDEX);
}

function deriveRequestKeypairFromAuthCertPriv(authCertPriv: Uint8Array): {
    secretKey: Buffer;
    publicKey: Buffer;
} {
    const seed = hkdf(sha256, authCertPriv, new Uint8Array(), utf8(SEED_INFO), 32);
    const keys = ed25519.keygen(seed);
    return {
        secretKey: Buffer.from(keys.secretKey),
        publicKey: Buffer.from(keys.publicKey)
    };
}
