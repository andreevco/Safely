import type { SyncServer } from './sync-server';
import { SyncServerAccountsApi } from './sync-server-accounts-api';
import { SyncServerSnapshotsApi } from './sync-server-snapshots-api';
import { SyncServerSnapshotsSse } from './sync-server-snapshots-sse';
import type { AccountsApi, SnapshotsApi } from '../../src/api/generated';
import type { SnapshotsSse } from '../../src/api/snapshots-sse';
import type { SyncApiImplementations } from '../../src/sync-container';

export function createSyncServerApiImplementations(
    server: SyncServer,
    getRequesterIk: () => string | Promise<string>
): SyncApiImplementations {
    return {
        accountsApi: new SyncServerAccountsApi(server, getRequesterIk) as unknown as AccountsApi,
        snapshotsApi: new SyncServerSnapshotsApi(server, getRequesterIk) as unknown as SnapshotsApi,
        snapshotsSse: new SyncServerSnapshotsSse(server, getRequesterIk) as unknown as SnapshotsSse
    };
}
