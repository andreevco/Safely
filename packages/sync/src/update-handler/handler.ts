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
        this.logger.info('Handling incoming update', upd.snapshotProof.toString('hex'));

        const update = await this.updateDecryptor.decrypt(upd);
        const payload = decodeUpdatePayload(update);

        if (upd.snapshotProof.equals(syncState.snapshotProof)) {
            this.logger.info('Update already received');
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
        await this.deviceManagementService.mergeDeviceStorage(
            Buffer.from(payload.deviceStorage, 'utf8')
        );

        const isRevoked = await this.deviceManagementService.isThisDeviceRevoked();
        if (isRevoked) {
            this.logger.warn('This device has been revoked');
            return {
                hasLocalChanges: false,
                revoked: true
            };
        }

        await this.deviceManagementService.activate();

        // TODO
        // Suppose following scenario:
        // - User has two devices A (online) and B (offline)
        // - User adds device C from A, and then send snapshots to server from C
        // - B comes online and receives snapshot from server, but there is no yet device C in the B's device list
        // - To prevent deadlock (B needs to verify snapshot with C's signature, but to do so it needs to read C's
        //   snapshot), we first apply any device ops from the update, and only then verify IK signature of the snapshot.
        // Security considerations:
        // - If the attacker can create a valid device update, then they can get access to all the private keys from compromised
        //   device (including wallet secrets) at which point they can do much more harm than just sending invalid snapshots.
        //   At this point we cant really protect user, so this is acceptable scenario.
        //
        // IK signature verification is intentionally disabled for now. Legal delete/revoke flows can leave the
        // snapshot signer already revoked locally, or even deliver a snapshot where the signing remote device is revoked
        // by the same update, which makes authenticity verification fail for a valid snapshot. This does not add
        // meaningful security risk in the current flow, and the signature itself may be removed later.
        // await this.updateDecryptor.verifyIKSig(upd);

        this.logger.info('Applying update to local CRDT document...');
        await this.yManager.applyUpdate(Buffer.from(payload.userStorage, 'utf8'), 'remote');

        syncState.snapshotProof = upd.snapshotProof;
        await this.syncStateRepository.saveState(syncState);

        const hasLocalChanges = await this.hasLocalChanges(payload);
        this.logger.info('Update applied, hasLocalChanges:', hasLocalChanges);
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
            !this.yManager.equalsToRemoteUpdate(Buffer.from(upd.userStorage, 'utf8')) ||
            !this.deviceYManager.equalsToRemoteUpdate(Buffer.from(upd.deviceStorage, 'utf8'))
        );
    }
}
