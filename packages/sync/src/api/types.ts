export type EncryptedState = {
    kid: Buffer;
    ciphertext: Buffer;
    nonce: Buffer;
    snapshotProof: Buffer;
    signature: Buffer;
};

export type EncryptedStateAndProofChain = EncryptedState & {
    snapshotProofChain: Buffer[];
};
