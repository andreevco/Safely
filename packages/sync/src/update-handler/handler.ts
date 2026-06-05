import type { StorageVersion } from '@safely/slottree';

import { getSnapshotProofFromCiphertextHash } from './snapshot-proof';
import type { SyncState } from './sync-state';
import type { SyncStateRepository } from './sync-state-repository';
import type { UpdatePayload } from './update-payload';
import { decodeUpdatePayload } from './update-payload';
import type { SnapshotsApi } from '../api/generated';
import type { EncryptedStateAndProofChain } from '../api/types';
import type { YManager } from '../crdt/y-manager';
import type { DeviceManagementService } from '../device-manager/device-management-service';
import type { tDevicesLatest, tDevicesRest } from '../device-manager/device-storage-schema';
import type { Logger } from '../logger';
import type { UpdateDecryptorService } from '../update-encryptor/update-decryptor-service';

export class UpdateHandler<Latest extends StorageVersion, Rest> {
    constructor(
        private readonly syncStateRepository: SyncStateRepository,
        private readonly yManager: YManager<Latest, Rest>,
        private readonly deviceYManager: YManager<tDevicesLatest, tDevicesRest>,
        private readonly updateDecryptor: UpdateDecryptorService,
        private readonly deviceManagementService: DeviceManagementService,
        private readonly snapshotsApi: SnapshotsApi,
        private readonly logger: Logger
    ) {}

    public async handle(
        upd: EncryptedStateAndProofChain
    ): Promise<{ hasLocalChanges: boolean; revoked?: boolean }> {
        const syncState = await this.syncStateRepository.getState();
        this.logger.info('UpdateHandler.handle', upd.snapshotProof.toString('hex'));

        const update = await this.updateDecryptor.decrypt(upd);
        const payload = decodeUpdatePayload(update);

        if (upd.snapshotProof.equals(syncState.snapshotProof)) {
            this.logger.info('UpdateHandler.handle.known');
            return { hasLocalChanges: await this.hasLocalChanges(payload) }; // Already have this update
        }

        // TODO
        // Snapshot proof chain verification is intentionally disabled for now. It was originally used to
        // detect server-side history rewrites, but the current slottree-backed storage already prevents
        // overwriting accepted history. Keeping this check strict creates availability issues when the
        // server loses or drops snapshot/proof-chain data, because the client currently has no resync
        // mechanism for that case. Until resync is implemented, snapshot proof is treated as a cursor/id
        // rather than an enforced integrity boundary.

        // if (syncState.snapshotProof.length !== 0) {
        //     let proof = syncState.snapshotProof;
        //     if (upd.snapshotProofChain.length >= 1) {
        //         for (const proofItem of upd.snapshotProofChain.slice(
        //             0,
        //             upd.snapshotProofChain.length - 1
        //         )) {
        //             proof = getSnapshotProofFromCiphertextHash(proof, proofItem);
        //         }
        //     }
        //
        //     const expectedProof = getSnapshotProof(proof, upd.ciphertext);
        //
        //     if (!upd.snapshotProof.equals(expectedProof)) {
        //         this.logger.info(
        //             `Expected proof ${expectedProof.toString('hex')}, but got ${upd.snapshotProof.toString('hex')}`
        //         );
        //         const isProofCorrect = await this.fetchProofChainAndVerify(
        //             syncState,
        //             upd.snapshotProof,
        //             Buffer.from(sha256(upd.ciphertext)).toString('hex')
        //         );
        //         if (!isProofCorrect) {
        //             throw new Error('Invalid snapshot proof');
        //         }
        //     }
        // }

        // TODO: merge remote devices into temporal storage first and verify on temp storage
        // this is minor security bug
        await this.deviceManagementService.mergeDeviceStorage(payload.deviceStorage);

        const isRevoked = await this.deviceManagementService.isThisDeviceRevoked();
        if (isRevoked) {
            this.logger.debug('This device has been revoked');
            return {
                hasLocalChanges: false,
                revoked: true
            };
        }

        await this.deviceManagementService.activate();

        this.logger.debug('Applying update to local CRDT document...');
        await this.yManager.applyUpdate(payload.userStorage, 'remote');

        syncState.snapshotProof = upd.snapshotProof;
        await this.syncStateRepository.saveState(syncState);

        const hasLocalChanges = await this.hasLocalChanges(payload);
        this.logger.info('UpdateHandler.handle.applied', { hasLocalChanges });
        return { hasLocalChanges };
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

    private async hasLocalChanges(upd: UpdatePayload): Promise<boolean> {
        if (!(await this.deviceManagementService.isThisDeviceActive())) {
            return false;
        }

        return (
            !this.yManager.equalsToRemoteUpdate(upd.userStorage) ||
            !this.deviceYManager.equalsToRemoteUpdate(upd.deviceStorage)
        );
    }
}
