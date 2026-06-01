export enum SyncStatus {
    /**
     * Special status for offline providers, which are always offline.
     */
    OFFLINE = 'offline',
    /**
     * Sync was disabled manually
     */
    DISABLED = 'disabled',
    /**
     * Server does not respond, or responds with unrecognizable error.
     */
    DISCONNECTED = 'disconnected',
    /**
     * Server is responding, client is synchronizing data with the server.
     */
    SYNCHRONIZING = 'synchronizing',
    /**
     * Client is synchronized with the server.
     */
    SYNCHRONIZED = 'synchronized',
    /**
     * The current device has been deleted from the account.
     * This state is FINAL. Only way to recover is manually restart SyncProvider.
     */
    DEVICE_DELETED = 'device_deleted'
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
     * @param opts
     */
    waitForStatus(targetStatus: SyncStatus, opts?: WaitForStatusOptions): Promise<void>;
}

export type WaitForStatusOptions = {
    timeout?: number;
};

export class SyncStatusTimeoutError extends Error {
    constructor(
        public readonly targetStatus: SyncStatus,
        public readonly timeout: number
    ) {
        super(`Timed out waiting for sync status ${targetStatus} after ${timeout}ms`);
    }
}

export class SyncStatusManager implements ISyncStatusManager {
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

    public waitForStatus(targetStatus: SyncStatus, opts?: WaitForStatusOptions): Promise<void> {
        if (this.status === targetStatus) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            let settled = false;
            let timeoutId: ReturnType<typeof setTimeout> | undefined;

            const complete = (fn: () => void) => {
                if (settled) {
                    return;
                }

                settled = true;
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                unsubscribe();
                fn();
            };

            const unsubscribe = this.subscribe(status => {
                if (status === targetStatus) {
                    complete(() => {
                        resolve();
                    });
                }
            });

            if (opts?.timeout !== undefined) {
                timeoutId = setTimeout(() => {
                    complete(() => {
                        reject(new SyncStatusTimeoutError(targetStatus, opts.timeout!));
                    });
                }, opts.timeout);
            }
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
