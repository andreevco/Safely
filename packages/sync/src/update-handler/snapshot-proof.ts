import { sha256 } from '@noble/hashes/sha2.js';

export type SnapshotProofEntry = {
    parentSnapshotProof: Buffer;
    ciphertextHash: Buffer;
};

export function getSnapshotProof(parentSnapshotProof: Buffer, ciphertext: Buffer) {
    const ciphertextHash = sha256(ciphertext);
    if (parentSnapshotProof.length === 0) {
        return Buffer.from(ciphertextHash); // genesis proof
    }

    const combined = Buffer.concat([parentSnapshotProof, Buffer.from(ciphertextHash)]);
    return Buffer.from(sha256(combined));
}
