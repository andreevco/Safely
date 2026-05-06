import { createActor } from 'xstate';
import * as z from 'zod';

import { NewOf, StorageVersion } from '@safely/slottree';

import { ISyncProvider } from './I-sync-provider';
import { OfflineSyncProvider } from './offline-sync-provider';
import { SyncStatus, SyncStatusManager } from './sync-status';
import { DmkSignerService } from '../crypto/service/dmk-signer-service';
import { SyncContainer } from '../sync-container';
import { createSyncMachine, SyncMachine } from '../sync-machine/machine';

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
        syncStatusManager = new SyncStatusManager(SyncStatus.DISCONNECTED),
        dmkSignerService?: DmkSignerService
    ): Promise<OnlineSyncProvider<Latest, Rest>> {
        syncStatusManager.setStatus(SyncStatus.DISCONNECTED);

        if (dmkSignerService) {
            await container.deviceManager.ensureSelfDevice(dmkSignerService);
        }

        const machine = createActor(createSyncMachine(), {
            input: {
                syncStateRepository: container.syncStateRepository,
                updateHandler: container.updateHandler,
                yManager: container.yManager,
                deviceYManager: container.deviceYManager,
                updateEncryptor: container.updateEncryptor,
                snapshotsApi: container.snapshotApi,
                snapshotsSse: container.snapshotSse,
                ikService: container.ikService,
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

    public restart(): void {
        this.syncMachine.stop();
        this.syncStatusManager.setStatus(SyncStatus.DISCONNECTED);
        this.syncMachine = machineFromContainer(this.container, this.syncStatusManager);
        this.syncMachine.start();
    }

    public async set<K extends keyof NewOf<Latest>>(
        k: K,
        v: z.input<NewOf<Latest>[K]> | string
    ): Promise<void> {
        await super.set(k, v);

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
            updateHandler: container.updateHandler,
            yManager: container.yManager,
            deviceYManager: container.deviceYManager,
            updateEncryptor: container.updateEncryptor,
            snapshotsApi: container.snapshotApi,
            snapshotsSse: container.snapshotSse,
            ikService: container.ikService,
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
