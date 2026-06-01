import type { StorageVersion } from '@safely/slottree';

import type { YManager } from './y-manager';

type ManagedYManager = YManager<StorageVersion, unknown>;

export class CrdtController {
    private readonly managers: ManagedYManager[] = [];

    public addManager(manager: ManagedYManager): void {
        this.managers.push(manager);
    }

    public async addAuthor(authorId: Buffer, storageVersion: number): Promise<void> {
        await Promise.all(
            this.managers.map(manager => manager.addAuthor(authorId, storageVersion))
        );
    }

    public async deleteAuthor(authorId: Buffer): Promise<void> {
        await Promise.all(this.managers.map(manager => manager.deleteAuthor(authorId)));
    }
}
