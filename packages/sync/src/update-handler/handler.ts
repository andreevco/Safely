import type { StorageVersion } from '@safely/slottree';

import type { SyncStateRepository } from './sync-state-repository';
import type { UpdatePayload } from './update-payload';
import { decodeUpdatePayload } from './update-payload';
import type { EncryptedStateAndProofChain } from '../api/types';
import type { YManager } from '../crdt/y-manager';
import type { DeviceManagementService } from '../device-manager/device-management-service';
import type { tDevicesLatest, tDevicesRest } from '../device-manager/device-storage-schema';
import type { Logger } from '../logger';
import type { UpdateDecryptorService } from '../update-encryptor/update-decryptor-service';

/**
 * Two snapshot-level checks are intentionally not enforced by UpdateHandler.
 *
 * Snapshot proof verification is not needed as an anti-history-rewrite boundary. Slottree keeps
 * tombstones forever, so an update produced from older history cannot overwrite newer accepted data
 * even if the server reorders or rewrites stored snapshots. The snapshot proof is still useful as a
 * cursor/id, but rejecting updates only because the proof chain is unavailable would reduce
 * availability without protecting current data.
 *
 * IK signature verification also does not provide meaningful protection in the current model. If an
 * attacker steals a usable IK proof/signature capability, they effectively have access to all synced
 * data already. If a user loses a phone, the correct response is to create a new account and rotate
 * all keys and wallets, not to rely on snapshot signature checks from the old account state.
 */

export class UpdateHandler<Latest extends StorageVersion, Rest> {
    constructor(
        private readonly syncStateRepository: SyncStateRepository,
        private readonly yManager: YManager<Latest, Rest>,
        private readonly deviceYManager: YManager<tDevicesLatest, tDevicesRest>,
        private readonly updateDecryptor: UpdateDecryptorService,
        private readonly deviceManagementService: DeviceManagementService,
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
