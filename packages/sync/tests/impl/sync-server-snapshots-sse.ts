import type { SyncServer } from './sync-server';
import type { EncryptedState } from '../../src/api/types';

export class SyncServerSnapshotsSse {
    constructor(
        private readonly server: SyncServer,
        private readonly getRequesterIk: () => string | Promise<string>
    ) {}

    public async subscribeToUpdates(
        onUpdate: (update: EncryptedState) => void | Promise<void>,
        onDisconnect?: (reason?: unknown) => void
    ): Promise<() => void> {
        return this.server.subscribeToUpdates(onUpdate, onDisconnect, await this.getRequesterIk());
    }
}
