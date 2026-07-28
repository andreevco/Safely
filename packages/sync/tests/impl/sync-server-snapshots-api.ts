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
        private readonly requesterIk: string
    ) {
        this.configuration = new Configuration({ basePath: 'sync-server://mock' });
    }

    public async getActualSnapshot(
        request: GetActualSnapshotRequest = {}
    ): Promise<SnapshotWithProofs> {
        return this.server.getActualSnapshot(request, this.requesterIk);
    }

    public async getSnapshotProofChain(
        request: GetSnapshotProofChainRequest
    ): Promise<SnapshotProofChain> {
        return this.server.getSnapshotProofChain(request, this.requesterIk);
    }

    public async saveSnapshot(request: SaveSnapshotRequest): Promise<void> {
        this.server.saveSnapshot(request, this.requesterIk);
    }
}
