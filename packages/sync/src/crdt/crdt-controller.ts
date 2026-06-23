import type { StorageVersion } from '@safely/slottree';

import type { YManager } from './y-manager';

type ManagedYManager = YManager<StorageVersion, unknown>;
type DeviceAuthorVersions = {
    storageVersion: number | undefined;
    devicesStorageVersion: number | undefined;
};

export class CrdtController {
    constructor(
        private readonly storageManager: ManagedYManager,
        private readonly devicesStorageManager: ManagedYManager
    ) {}

    public async addAuthor(authorId: Buffer, versions: DeviceAuthorVersions): Promise<void> {
        const operations: Array<Promise<void>> = [];
        if (versions.storageVersion !== undefined) {
            operations.push(this.storageManager.addAuthor(authorId, versions.storageVersion));
        }
        if (versions.devicesStorageVersion !== undefined) {
            operations.push(
                this.devicesStorageManager.addAuthor(authorId, versions.devicesStorageVersion)
            );
        }
        await Promise.all(operations);
    }

    public async deleteAuthor(authorId: Buffer): Promise<void> {
        await Promise.all([
            this.storageManager.deleteAuthor(authorId),
            this.devicesStorageManager.deleteAuthor(authorId)
        ]);
    }
}
