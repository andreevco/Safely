import type { SyncServer } from './sync-server';
import { Configuration } from '../../src/api/generated';
import type {
    GetActualSnapshotRequest,
    GetSnapshotProofChainRequest,
    SaveSnapshotRequest,
    SnapshotProofChain,
    SnapshotWithProofs
} from '../../src/api/generated';

export class SyncServerSnapshotsApi {
    public readonly configuration: Configuration;

    constructor(
        private readonly server: SyncServer,
        private readonly getRequesterIk: () => string | Promise<string>
    ) {
        this.configuration = new Configuration({ basePath: 'sync-server://mock' });
    }

    public async getActualSnapshot(
        request: GetActualSnapshotRequest = {}
    ): Promise<SnapshotWithProofs> {
        return this.server.getActualSnapshot(request, await this.getRequesterIk());
    }

    public async getSnapshotProofChain(
        request: GetSnapshotProofChainRequest
    ): Promise<SnapshotProofChain> {
        return this.server.getSnapshotProofChain(request, await this.getRequesterIk());
    }

    public async saveSnapshot(request: SaveSnapshotRequest): Promise<void> {
        this.server.saveSnapshot(request, await this.getRequesterIk());
    }
}
