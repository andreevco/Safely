import { createActor } from 'xstate';
import type * as z from 'zod';
import type { ZodType } from 'zod';

import type { ISyncProvider } from './I-sync-provider';
import type { SyncContainer } from '../sync-container';
import { OfflineSyncProvider } from './offline-sync-provider';
import { SyncStatus, SyncStatusManager } from './sync-status';
import type { SyncMachine } from '../sync-machine/machine';
import { createSyncMachine } from '../sync-machine/machine';

export class OnlineSyncProvider<S extends Record<string, ZodType>>
    extends OfflineSyncProvider<S>
    implements ISyncProvider<S>
{
    constructor(
        structure: S,
        container: SyncContainer,
        private syncMachine: SyncMachine,
        public readonly syncStatusManager: SyncStatusManager
    ) {
        super(structure, container, syncStatusManager);
    }

    public static async create<S extends Record<string, ZodType>>(
        structure: S,
        container: SyncContainer,
        syncStatusManager = new SyncStatusManager(SyncStatus.DISCONNECTED)
    ): Promise<OnlineSyncProvider<S>> {
        syncStatusManager.setStatus(SyncStatus.DISCONNECTED);
        const machine = createActor(createSyncMachine(), {
            input: {
                syncStateRepository: container.syncStateRepository,
                snapshotsApi: container.snapshotApi,
                snapshotsSse: container.snapshotSse,
                syncOperations: container.syncOperations,
                syncStatusManager,
                logger: container.logger
            },
            inspect: event => {
                if (event.type === '@xstate.event') {
                    // console.log(`[SyncMachine] Event: ${event.event.type}`);
                }
            }
        });
        machine.start();

        return new OnlineSyncProvider(structure, container, machine, syncStatusManager);
    }

    public async waitForInitialSync(): Promise<void> {
        const snapshot = this.syncMachine.getSnapshot();
        if (snapshot.matches('connectionSession')) {
            return;
        }

        return new Promise<void>(resolve => {
            const sub = this.syncMachine.subscribe(state => {
                if (state.matches('connectionSession')) {
                    sub.unsubscribe();
                    resolve();
                }
            });
        });
    }

    public dispose(): void {
        super.dispose();
        this.syncMachine.stop();
        this.syncStatusManager.setStatus(SyncStatus.DISABLED);
    }

    public restart(options?: { preserveStatus?: boolean }): void {
        this.syncMachine.stop();
        if (!options?.preserveStatus) {
            this.syncStatusManager.setStatus(SyncStatus.DISCONNECTED);
        }
        this.syncMachine = machineFromContainer(this.container, this.syncStatusManager);
        this.syncMachine.start();
    }

    public async remove(k: keyof S): Promise<void> {
        await super.remove(k);

        this.syncMachine.send({ type: 'LOCAL_UPDATE' });
    }

    public async set<K extends keyof S>(k: K, v: z.input<S[K]> | string): Promise<void> {
        await super.set(k, v);

        this.syncMachine.send({ type: 'LOCAL_UPDATE' });
    }

    public triggerSync(): void {
        this.syncMachine.send({ type: 'LOCAL_UPDATE' });
    }
}

function machineFromContainer(container: SyncContainer, syncStatusManager: SyncStatusManager) {
    return createActor(createSyncMachine(), {
        input: {
            syncStateRepository: container.syncStateRepository,
            snapshotsApi: container.snapshotApi,
            snapshotsSse: container.snapshotSse,
            syncOperations: container.syncOperations,
            syncStatusManager,
            logger: container.logger
        },
        inspect: event => {
            if (event.type === '@xstate.event') {
                // console.log(`[SyncMachine] Event: ${event.event.type}`);
            }
        }
    });
}
