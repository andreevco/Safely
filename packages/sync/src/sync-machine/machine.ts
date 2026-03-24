import * as x from 'xstate';
import { Actor, assign, fromPromise } from 'xstate';

import { pushUpdateToServer } from './actors/push-update';
import { updatesSubscriberActor } from './actors/updates-subscriber-actor';
import { defaultConfig, SyncMachineConfig, SyncMachineInput } from './config';
import { EncryptedState } from '../api/types';
import { hex } from '../utils/buffer';

export type SyncMachine = Awaited<Actor<ReturnType<typeof createSyncMachine>>>;

const initialSyncing = fromPromise(async ({ input }: { input: SyncMachineConfig }) => {
    console.log('[Sync] Initial syncing: fetching latest snapshot from server...');
    const knownState = await input.syncStateRepository.getState();
    const lastState = await input.snapshotsApi.getActualSnapshot({
        withProofChainTo: knownState.snapshotProof.toString('hex')
    });
    console.log(
        '[Sync] Initial syncing: received snapshot from server, proof:',
        lastState.snapshot.snapshotProof.slice(0, 16) + '...'
    );

    try {
        return await input.updateHandler.handle({
            kid: hex(lastState.snapshot.kid),
            ciphertext: hex(lastState.snapshot.ciphertext),
            nonce: hex(lastState.snapshot.nonce),
            signature: hex(lastState.snapshot.signature),
            snapshotProof: hex(lastState.snapshot.snapshotProof),
            snapshotProofChain: lastState.proofChain
                ? lastState.proofChain.proofChain.map(proof => hex(proof))
                : []
        });
    } catch (e) {
        console.error('[SyncMachine] Error during initial syncing', e);
        throw e;
    }
});

const applyUpdate = fromPromise(async ({ input }: { input: { config: SyncMachineConfig } }) => {
    const upd = input.config.remoteUpdates[0] ?? null;
    if (upd === null) return;
    console.log(
        '[Sync Pull] Applying remote update, proof:',
        upd.snapshotProof.toString('hex').slice(0, 16) + '...'
    );
    try {
        await input.config.updateHandler.handle({
            snapshotProofChain: [],
            ...upd
        });
        console.log('[Sync Pull] Remote update applied successfully');
    } catch (e) {
        console.error('[SyncMachine] Error applying update', e);
        throw e;
    }
});

export const createSyncMachine = () => {
    return x
        .setup({
            types: {} as {
                events:
                    | { type: 'LOCAL_UPDATE' }
                    | { type: 'REMOTE_UPDATE'; upd: EncryptedState }
                    | { type: 'CONNECTED' }
                    | { type: 'DISCONNECTED' }
                    | { type: 'CONNECTION_ERROR'; error: string }
                    | { type: 'CONNECT_RETRY' };
                context: SyncMachineConfig;
                input: SyncMachineInput;
            },
            actors: {
                updatesSubscriberActor: updatesSubscriberActor,
                pushUpdateToServer: pushUpdateToServer,
                initialSyncing: initialSyncing,
                applyUpdate: applyUpdate
            },
            guards: {
                isFatalError: () => {
                    // TODO
                    return false;
                },
                shouldSendUpdate: ({ context }) => context.shouldSendUpdate,
                shouldHandleUpdate: ({ context }) => context.remoteUpdates.length > 0
            },
            actions: {
                markDirty: assign({
                    shouldSendUpdate: () => {
                        return true;
                    }
                }),
                clearDirty: assign({
                    shouldSendUpdate: () => {
                        return false;
                    }
                }),
                setRemoteUpdate: assign({
                    remoteUpdates: ({ context, event }) => {
                        if (event.type !== 'REMOTE_UPDATE') return context.remoteUpdates;
                        return [...context.remoteUpdates, event.upd];
                    }
                }),
                clearRemoteUpdate: assign({
                    remoteUpdates: ({ context }) => context.remoteUpdates.slice(1)
                })
            }
        })
        .createMachine({
            id: 'syncMachine',
            initial: 'initialSyncing',
            context: ({ input }) => defaultConfig(input),
            on: {
                LOCAL_UPDATE: {
                    actions: ['markDirty']
                }
            },
            states: {
                initialSyncing: {
                    invoke: {
                        id: 'initialSyncing',
                        src: 'initialSyncing',
                        input: ({ context }) => context,
                        onDone: [
                            {
                                guard: ({ event }) => event.output.hasLocalChanges,
                                actions: ['markDirty'],
                                target: 'connectionSession'
                            },
                            { target: 'connectionSession' }
                        ],
                        onError: {
                            target: '#syncMachine.waitingForRetry'
                        }
                    }
                },
                connectionSession: {
                    invoke: {
                        id: 'updatesSubscriberActor',
                        src: 'updatesSubscriberActor',
                        input: ({ context }) => {
                            return context;
                        },
                        onError: { target: '#syncMachine.waitingForRetry' }
                    },
                    initial: 'connecting',
                    on: {
                        DISCONNECTED: { target: '#syncMachine.waitingForRetry' },
                        CONNECTION_ERROR: { target: '#syncMachine.waitingForRetry' },
                        REMOTE_UPDATE: { actions: 'setRemoteUpdate' }
                    },
                    states: {
                        connecting: {
                            on: {
                                CONNECTED: { target: 'connected' }
                            }
                        },
                        connected: {
                            always: [
                                {
                                    guard: 'shouldHandleUpdate',
                                    target: 'applyingUpdate'
                                },
                                {
                                    guard: 'shouldSendUpdate',
                                    target: 'transmitting'
                                }
                            ],
                            on: {
                                LOCAL_UPDATE: {
                                    actions: ['markDirty'],
                                    target: 'transmitting'
                                },
                                REMOTE_UPDATE: {
                                    actions: ['setRemoteUpdate'],
                                    target: 'applyingUpdate'
                                }
                            }
                        },
                        applyingUpdate: {
                            invoke: {
                                id: 'applyUpdate',
                                src: 'applyUpdate',
                                input: ({ context }) => {
                                    return { config: context };
                                },
                                onDone: {
                                    actions: 'clearRemoteUpdate',
                                    target: 'connected'
                                },
                                onError: {
                                    actions: 'clearRemoteUpdate',
                                    target: '#syncMachine.waitingForRetry'
                                }
                            }
                        },
                        transmitting: {
                            invoke: {
                                id: 'pushUpdateToServer',
                                src: 'pushUpdateToServer',
                                input: ({ context }) => context,
                                onDone: {
                                    actions: 'clearDirty',
                                    target: 'connected'
                                },
                                onError: {
                                    actions: 'clearDirty',
                                    target: '#syncMachine.waitingForRetry'
                                }
                            }
                        }
                    }
                },

                waitingForRetry: {
                    after: {
                        1000: { target: '#syncMachine.initialSyncing' }
                    },
                    on: {
                        CONNECT_RETRY: { target: '#syncMachine.initialSyncing' }
                    }
                }
            }
        });
};
