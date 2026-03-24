export enum SyncStatus {
    /**
     * Special status for offline providers, which are always offline.
     */
    OFFLINE,
    /**
     * Sync was disabled manually
     */
    DISABLED,
    /**
     * Server does not respond, or responds with unrecognizable error.
     */
    DISCONNECTED,
    /**
     * Server is responding, client is synchronizing data with the server.
     */
    SYNCHRONIZING,
    /**
     * Client is synchronized with the server.
     */
    SYNCHRONIZED,
    /**
     * The current device has been deleted from the account.
     */
    // TODO: use this status
    DELETED
}

export interface ISyncStatusManager {
    /**
     * Returns the current synchronization status.
     */
    getStatus(): SyncStatus;

    /**
     * Subscribes to synchronization status changes. The provided callback will be called immediately
     * with the current status, and then on every status change.
     * @param f
     */
    subscribe(f: (status: SyncStatus) => void): () => void;

    /**
     * Returns a promise that resolves when the synchronization status reaches the specified target status.
     * @param targetStatus
     */
    waitForStatus(targetStatus: SyncStatus): Promise<void>;
}

export class SyncStatusManager {
    private readonly subscribers: Set<(status: SyncStatus) => void> = new Set();

    constructor(private status: SyncStatus) {}

    public getStatus(): SyncStatus {
        return this.status;
    }

    public setStatus(newStatus: SyncStatus): void {
        if (this.status !== newStatus) {
            this.status = newStatus;
            this.notify();
        }
    }

    public waitForStatus(targetStatus: SyncStatus): Promise<void> {
        if (this.status === targetStatus) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            const unsubscribe = this.subscribe(status => {
                if (status === targetStatus) {
                    unsubscribe();
                    resolve();
                }
            });
        });
    }

    public subscribe(f: (status: SyncStatus) => void): () => void {
        this.subscribers.add(f);
        f(this.status);
        return () => {
            this.subscribers.delete(f);
        };
    }

    private notify(): void {
        for (const subscriber of this.subscribers) {
            subscriber(this.status);
        }
    }
}
