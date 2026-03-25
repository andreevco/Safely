import { sha256 } from '@noble/hashes/sha2.js';
import * as Y from 'yjs';

import { getSnapshotProof, getSnapshotProofFromCiphertextHash } from './snapshot-proof';
import { SyncState } from './sync-state';
import { SyncStateRepository } from './sync-state-repository';
import { SnapshotsApi } from '../api/generated';
import { EncryptedStateAndProofChain } from '../api/types';
import { StorageVerifierService } from '../crdt/storage-verifier-service';
import { YManager } from '../crdt/y-manager';
import { DeviceManagementService } from '../device-manager/device-management-service';
import { Logger } from '../logger/logger';
import { UpdateDecryptorService } from '../update-encryptor/update-decryptor-service';

export class UpdateHandler {
    constructor(
        private readonly syncStateRepository: SyncStateRepository,
        private readonly yManager: YManager,
        private readonly updateDecryptor: UpdateDecryptorService,
        private readonly storageVerifierService: StorageVerifierService,
        private readonly deviceManagementService: DeviceManagementService,
        private readonly snapshotsApi: SnapshotsApi,
        private readonly logger: Logger
    ) {}

    public async handle(upd: EncryptedStateAndProofChain): Promise<{ hasLocalChanges: boolean }> {
        const syncState = await this.syncStateRepository.getState();
        this.logger.info('Handling incoming update', upd.snapshotProof.toString('hex'));

        const update = await this.updateDecryptor.verifyAndDecrypt(upd);

        if (upd.snapshotProof.equals(syncState.snapshotProof)) {
            this.logger.info('Update already received');
            return { hasLocalChanges: this.hasLocalChanges(update) }; // Already have this update
        }

        if (syncState.snapshotProof.length !== 0) {
            let proof = syncState.snapshotProof;
            if (upd.snapshotProofChain.length >= 1) {
                for (const proofItem of upd.snapshotProofChain.slice(
                    0,
                    upd.snapshotProofChain.length - 1
                )) {
                    proof = getSnapshotProofFromCiphertextHash(proof, proofItem);
                }
            }

            const expectedProof = getSnapshotProof(proof, upd.ciphertext);

            if (!upd.snapshotProof.equals(expectedProof)) {
                this.logger.info(
                    `Expected proof ${expectedProof.toString('hex')}, but got ${upd.snapshotProof.toString('hex')}`
                );
                const isProofCorrect = await this.fetchProofChainAndVerify(
                    syncState,
                    upd.snapshotProof,
                    Buffer.from(sha256(upd.ciphertext)).toString('hex')
                );
                if (!isProofCorrect) {
                    throw new Error('Invalid snapshot proof');
                }
            }
        }

        const tempDoc = new Y.Doc();
        Y.applyUpdateV2(tempDoc, this.yManager.encodeAsSnapshot());
        Y.applyUpdateV2(tempDoc, update);

        const result = await this.storageVerifierService.verifyUpdate(
            this.yManager.getDoc(),
            tempDoc
        );

        for (const deviceOp of result.newDeviceOps) {
            await this.deviceManagementService.verifyDeviceOpAndApply(deviceOp);
        }

        await this.yManager.applyUpdate(update, 'remote');

        syncState.snapshotProof = upd.snapshotProof;
        await this.syncStateRepository.saveState(syncState);

        return { hasLocalChanges: this.hasLocalChanges(update) };
    }

    /**
     * During onboarding process, new device receives raw snapshot which must be applied without verification.
     * @param update
     * @param syncState
     */
    public async applyInitialUpdate(update: Buffer, syncState: SyncState) {
        await this.yManager.applyUpdate(update, 'remote');
        await this.syncStateRepository.saveState(syncState);

        for (const deviceOp of await this.yManager.getDeviceLog()) {
            await this.deviceManagementService.verifyDeviceOpAndApply(deviceOp);
        }
    }

    private async fetchProofChainAndVerify(
        syncState: SyncState,
        actualSnapshotProof: Buffer,
        actualSnapshotCiphertextHash: string
    ): Promise<boolean> {
        this.logger.trace('Fetching proof chain to verify snapshot proof');

        const proofChain = await this.snapshotsApi.getSnapshotProofChain({
            snapshotProof: syncState.snapshotProof.toString('hex')
        });
        let tempProof = syncState.snapshotProof;
        for (const proofItem of proofChain.proofChain) {
            tempProof = getSnapshotProofFromCiphertextHash(
                tempProof,
                Buffer.from(proofItem, 'hex')
            );
            if (tempProof.equals(actualSnapshotProof)) {
                return true;
            }
        }
        this.logger.trace(
            'Proof chain last item:',
            proofChain.proofChain[proofChain.proofChain.length - 1]
        );
        this.logger.trace('Actual snapshot cipht:', actualSnapshotCiphertextHash);
        this.logger.trace('Calculated proof from chain:', tempProof.toString('hex'));
        this.logger.trace('Actual snapshot proof:', actualSnapshotProof.toString('hex'));
        return (
            proofChain.proofChain[proofChain.proofChain.length - 1] ===
                actualSnapshotCiphertextHash && tempProof.equals(actualSnapshotProof)
        );
    }

    private hasLocalChanges(upd: Buffer): boolean {
        return !this.yManager.equalsToRemoteUpdate(upd);
    }
}
