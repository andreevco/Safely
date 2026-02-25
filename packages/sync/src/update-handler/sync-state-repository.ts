import { IStorage } from '../I-storage';
import { SyncState, SyncStateSchema, syncStateToJson } from './sync-state';

export class SyncStateRepository {
    constructor(private readonly storage: IStorage) {}

    public async getState(): Promise<SyncState> {
        const data = await this.storage.getItem('syncState');
        if (!data) {
            throw new Error('Sync state not found');
        }
        return SyncStateSchema.parse(JSON.parse(data));
    }

    public async saveState(state: SyncState): Promise<void> {
        await this.storage.setItem('syncState', syncStateToJson(state));
    }
}
