import { createActor } from 'xstate';
import * as z from 'zod';
import { ZodType } from 'zod';

import { ISyncProvider } from './I-sync-provider';
import { SyncContainer } from '../sync-container';
import { OfflineSyncProvider } from './offline-sync-provider';
import { createSyncMachine, SyncMachine } from '../sync-machine/machine';

export class OnlineSyncProvider<S extends Record<string, ZodType>>
    extends OfflineSyncProvider<S>
    implements ISyncProvider<S>
{
    constructor(
        structure: S,
        container: SyncContainer,
        private syncMachine: SyncMachine
    ) {
        super(structure, container, 'online');
    }

    public static async create<S extends Record<string, ZodType>>(
        structure: S,
        container: SyncContainer
    ): Promise<OnlineSyncProvider<S>> {
        const machine = createActor(createSyncMachine(), {
            input: {
                syncStateRepository: container.syncStateRepository,
                updateHandler: container.updateHandler,
                yManager: container.yManager,
                updateEncryptor: container.updateEncryptor,
                snapshotsApi: container.snapshotApi,
                snapshotsSse: container.snapshotSse,
                ikService: container.ikService
            },
            inspect: event => {
                if (event.type === '@xstate.event') {
                    // console.log(`[SyncMachine] Event: ${event.event.type}`);
                }
            }
        });
        machine.start();

        return new OnlineSyncProvider(structure, container, machine);
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
    }

    public restart(): void {
        this.syncMachine.stop();
        this.syncMachine = machineFromContainer(this.container);
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

function machineFromContainer(container: SyncContainer) {
    return createActor(createSyncMachine(), {
        input: {
            syncStateRepository: container.syncStateRepository,
            updateHandler: container.updateHandler,
            yManager: container.yManager,
            updateEncryptor: container.updateEncryptor,
            snapshotsApi: container.snapshotApi,
            snapshotsSse: container.snapshotSse,
            ikService: container.ikService
        },
        inspect: event => {
            if (event.type === '@xstate.event') {
                // console.log(`[SyncMachine] Event: ${event.event.type}`);
            }
        }
    });
}
