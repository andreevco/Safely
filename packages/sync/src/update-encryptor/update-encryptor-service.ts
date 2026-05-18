import { sha256 } from '@noble/hashes/sha2.js';

import type { EncryptedState } from '../api/types';
import type { IkService } from '../crypto/service/ik-service';
import type { SyncKeyService } from '../crypto/service/sync-key-service';
import type { SyncStateRepository } from '../update-handler/sync-state-repository';

export class UpdateEncryptorService {
    constructor(
        private readonly syncKeyService: SyncKeyService,
        private readonly ikService: IkService,
        private readonly syncStateRepository: SyncStateRepository
    ) {}

    public async encryptAndSign(update: Buffer): Promise<EncryptedState> {
        return this.createSnapshot(update);
    }

    private async createSnapshot(update: Buffer): Promise<EncryptedState> {
        const kid = this.ikService.getKID();
        const { ciphertext, nonce } = await this.syncKeyService.encrypt(update);

        const snapshotProof = await this.makeSnapshotProof(Buffer.from(ciphertext));

        const dataToSign = Buffer.concat([nonce, ciphertext, snapshotProof]);
        const signature = await this.ikService.sign(dataToSign);

        return {
            kid,
            ciphertext: Buffer.from(ciphertext),
            nonce: Buffer.from(nonce),
            snapshotProof: snapshotProof,
            signature: Buffer.from(signature)
        };
    }

    private async makeSnapshotProof(ciphertext: Buffer): Promise<Buffer> {
        const prevState = await this.syncStateRepository.getState();
        if (prevState.snapshotProof.length === 0) {
            return Buffer.from(sha256(ciphertext)); // genesis proof
        }
        const proofData = Buffer.concat([prevState.snapshotProof, sha256(ciphertext)]);
        const proof = Buffer.from(sha256(proofData));
        return proof;
    }
}
