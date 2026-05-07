import type { IStorage } from '../I-storage';
import type { SyncState } from './sync-state';
import { SyncStateSchema, syncStateToJson } from './sync-state';
import type { Logger } from '../logger/logger';

export class SyncStateRepository {
    constructor(
        private readonly storage: IStorage,
        private readonly logger: Logger
    ) {}

    public async getState(): Promise<SyncState> {
        const data = await this.storage.getItem('syncState');
        if (!data) {
            throw new Error('Sync state not found');
        }
        return SyncStateSchema.parse(JSON.parse(data));
    }

    public async saveState(state: SyncState): Promise<void> {
        await this.storage.setItem('syncState', syncStateToJson(state));
        this.logger.trace('New sync state saved', state.snapshotProof.toString('hex'));
    }
}
