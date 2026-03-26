import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { x25519 } from '@noble/curves/ed25519.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';

import { u8be, utf8 } from '../utils/buffer';

export function deriveOnboardingKey(opts: {
    ephemeralPrv: Buffer;
    ephemeralPub: Buffer;
    info: {
        inviterEphemeralPub: Buffer;
        invitationEphemeraPub: Buffer;
        invitationIkPub: Buffer;
    };
}) {
    const sharedSecret = x25519.getSharedSecret(opts.ephemeralPrv, opts.ephemeralPub);

    const onboardKey = hkdf(
        sha256,
        sharedSecret,
        sha256(utf8('safely/sync/v1/onboarding-salt')),
        Buffer.concat([
            utf8('safely/sync/v1/onboarding-key'),
            u8be(0x00),
            opts.info.inviterEphemeralPub,
            opts.info.invitationEphemeraPub,
            opts.info.invitationIkPub
        ]),
        32
    );

    return Buffer.from(onboardKey);
}

export function encryptMasterKey(opts: {
    aad: {
        inviterEphemeralPub: Buffer;
        invitationEphemeraPub: Buffer;
        invitationIkPub: Buffer;
    };
    onboardKey: Buffer;
    masterKey: Buffer;
}): { ciphertext: Buffer; nonce: Buffer } {
    const nonce = randomBytes(24);
    const aad = encryptionMasterKeyAAD(opts.aad);

    return {
        ciphertext: Buffer.from(
            xchacha20poly1305(opts.onboardKey, nonce, aad).encrypt(opts.masterKey)
        ),
        nonce: Buffer.from(nonce)
    };
}

export function decryptMasterKey(opts: {
    aad: {
        inviterEphemeralPub: Buffer;
        invitationEphemeraPub: Buffer;
        invitationIkPub: Buffer;
    };
    onboardKey: Buffer;
    ciphertext: Buffer;
    nonce: Buffer;
}): Buffer {
    const aad = encryptionMasterKeyAAD(opts.aad);

    return Buffer.from(
        xchacha20poly1305(opts.onboardKey, opts.nonce, aad).decrypt(opts.ciphertext)
    );
}

function encryptionMasterKeyAAD(opts: {
    inviterEphemeralPub: Buffer;
    invitationEphemeraPub: Buffer;
    invitationIkPub: Buffer;
}): Buffer {
    return Buffer.concat([
        utf8('safely/sync/v1/onboarding-aad'),
        u8be(0x00),
        opts.inviterEphemeralPub,
        opts.invitationEphemeraPub,
        opts.invitationIkPub
    ]);
}
