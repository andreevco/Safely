import { ed25519 } from '@noble/curves/ed25519.js';

export function ed25519_keygen(seed?: Buffer): { publicKey: Buffer; secretKey: Buffer } {
    const keys = ed25519.keygen(seed);
    return {
        publicKey: Buffer.from(keys.publicKey),
        secretKey: Buffer.from(keys.secretKey)
    };
}

export function ed25519_sign(message: Buffer, secretKey: Buffer): Buffer {
    const sig = ed25519.sign(message, secretKey);
    return Buffer.from(sig);
}

export function ed25519_verify(sig: Buffer, message: Buffer, publicKey: Buffer): boolean {
    return ed25519.verify(sig, message, publicKey);
}
