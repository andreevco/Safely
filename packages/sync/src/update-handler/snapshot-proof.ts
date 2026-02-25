import { sha256 } from '@noble/hashes/sha2.js';

export type SnapshotProofEntry = {
    parentSnapshotProof: Buffer;
    ciphertextHash: Buffer;
};

export function getSnapshotProofFromCiphertextHash(parent: Buffer, ciphertextHash: Buffer): Buffer {
    if (parent.length === 0) return Buffer.from(ciphertextHash);
    return Buffer.from(sha256(Buffer.concat([parent, ciphertextHash])));
}

export function getSnapshotProof(parent: Buffer, ciphertext: Buffer): Buffer {
    return getSnapshotProofFromCiphertextHash(parent, Buffer.from(sha256(ciphertext)));
}
