import { SyncServer } from './sync-server';

let __safelySyncServer: SyncServer | undefined;

export function initializeSyncServer(server: SyncServer = new SyncServer()): SyncServer {
    __safelySyncServer = server;
    return server;
}

export function getSyncServer(): SyncServer {
    if (!__safelySyncServer) {
        return initializeSyncServer();
    }

    return __safelySyncServer;
}
