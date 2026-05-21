import { createActor } from 'xstate';
import type * as z from 'zod';

import type { Draft, NewOf, StorageVersion } from '@safely/slottree';

import type { ISyncProvider } from './I-sync-provider';
import { OfflineSyncProvider } from './offline-sync-provider';
import { SyncStatus, SyncStatusManager } from './sync-status';
import type { SyncContainer } from '../sync-container';
import type { SyncMachine } from '../sync-machine/machine';
import { createSyncMachine } from '../sync-machine/machine';

export class OnlineSyncProvider<Latest extends StorageVersion, Rest>
    extends OfflineSyncProvider<Latest, Rest>
    implements ISyncProvider<NewOf<Latest>>
{
    constructor(
        container: SyncContainer<Latest, Rest>,
        private syncMachine: SyncMachine,
        public readonly syncStatusManager: SyncStatusManager
    ) {
        super(container, syncStatusManager);
    }

    public static async create<Latest extends StorageVersion, Rest>(
        container: SyncContainer<Latest, Rest>,
        syncStatusManager = new SyncStatusManager(SyncStatus.DISCONNECTED)
    ): Promise<OnlineSyncProvider<Latest, Rest>> {
        syncStatusManager.setStatus(SyncStatus.DISCONNECTED);

        const machine = createActor(createSyncMachine(), {
            input: {
                syncStateRepository: container.syncStateRepository,
                deviceYManager: container.deviceYManager,

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

        return new OnlineSyncProvider(container, machine, syncStatusManager);
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

    public async transaction(f: (draft: Draft<z.output<NewOf<Latest>>>) => void): Promise<void> {
        await super.transaction(f);

        this.syncMachine.send({ type: 'LOCAL_UPDATE' });
    }

    public triggerSync(): void {
        this.syncMachine.send({ type: 'LOCAL_UPDATE' });
    }
}

function machineFromContainer<Latest extends StorageVersion, Rest>(
    container: SyncContainer<Latest, Rest>,
    syncStatusManager: SyncStatusManager
) {
    return createActor(createSyncMachine(), {
        input: {
            syncStateRepository: container.syncStateRepository,
            deviceYManager: container.deviceYManager,

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
