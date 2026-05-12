import type { Actor } from 'xstate';
import * as x from 'xstate';
import { assign } from 'xstate';

import type { StorageVersion } from '@safely/slottree';

import { pushUpdateToServer } from './actors/push-update';
import { updatesSubscriberActor } from './actors/updates-subscriber-actor';
import type { SyncMachineConfig, SyncMachineInput } from './config';
import { defaultConfig } from './config';
import type { EncryptedState } from '../api/types';
import { SyncStatus } from '../sync-provider/sync-status';
import { applyUpdate } from './actors/apply-update';
import { initialSyncing } from './actors/initial-syncing';
import { SyncMachineError } from './error-handler';

export type SyncMachine = Awaited<Actor<ReturnType<typeof createSyncMachine>>>;

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
                context: SyncMachineConfig<StorageVersion, unknown>;
                input: SyncMachineInput<StorageVersion, unknown>;
            },
            actors: {
                updatesSubscriberActor: updatesSubscriberActor,
                pushUpdateToServer: pushUpdateToServer,
                initialSyncing: initialSyncing,
                applyUpdate: applyUpdate
            },
            guards: {
                shouldSendUpdate: ({ context }) =>
                    context.localUpdateVersion > context.acknowledgedLocalUpdateVersion,
                shouldHandleUpdate: ({ context }) => context.remoteUpdates.length > 0,
                isFatalError: ({ context }) => context.lastError?.type === 'fatal'
            },
            actions: {
                setStatusDisconnected: ({ context }) => {
                    context.syncStatusManager.setStatus(SyncStatus.DISCONNECTED);
                },
                setStatusSynchronizing: ({ context }) => {
                    context.syncStatusManager.setStatus(SyncStatus.SYNCHRONIZING);
                },
                setStatusSynchronized: ({ context }) => {
                    context.syncStatusManager.setStatus(SyncStatus.SYNCHRONIZED);
                },
                handleError: assign({
                    lastError: ({ event }: { event: unknown }) => {
                        const error = (event as { error?: unknown }).error;
                        if (error instanceof SyncMachineError) {
                            return error.disposition;
                        } else {
                            return { type: 'reconnect' };
                        }
                    }
                }),
                clearError: assign({
                    lastError: () => undefined
                }),
                applyErrorStatus: ({ context }) => {
                    const resolution = context.lastError;
                    if (resolution?.type === 'fatal') {
                        context.syncStatusManager.setStatus(resolution.status);
                    }
                },
                markDirty: assign({
                    localUpdateVersion: ({ context }) => {
                        return context.localUpdateVersion + 1;
                    }
                }),
                startTransmitting: assign({
                    transmittingLocalUpdateVersion: ({ context }) => {
                        return context.localUpdateVersion;
                    }
                }),
                acknowledgeTransmittedVersion: assign({
                    acknowledgedLocalUpdateVersion: ({ context }) => {
                        return context.transmittingLocalUpdateVersion;
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
                                actions: ['markDirty', 'setStatusSynchronizing'],
                                target: 'connectionSession'
                            },
                            { actions: 'setStatusSynchronizing', target: 'connectionSession' }
                        ],
                        onError: {
                            actions: ['handleError'],
                            target: 'errorHandling'
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
                        onError: {
                            actions: ['handleError'],
                            target: '#syncMachine.errorHandling'
                        }
                    },
                    initial: 'connecting',
                    on: {
                        DISCONNECTED: { target: '#syncMachine.waitingForRetry' },
                        CONNECTION_ERROR: { target: '#syncMachine.waitingForRetry' },
                        REMOTE_UPDATE: { actions: 'setRemoteUpdate' }
                    },
                    states: {
                        connecting: {
                            entry: ['setStatusSynchronizing'],
                            on: {
                                CONNECTED: { target: 'connected' }
                            }
                        },
                        connected: {
                            entry: ['setStatusSynchronized'],
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
                            entry: ['setStatusSynchronizing'],
                            invoke: {
                                id: 'applyUpdate',
                                src: 'applyUpdate',
                                input: ({ context }) => {
                                    return { config: context };
                                },
                                onDone: [
                                    {
                                        guard: ({ event }) => event.output.hasLocalChanges,
                                        actions: ['clearRemoteUpdate', 'markDirty'],
                                        target: 'connected'
                                    },
                                    {
                                        actions: 'clearRemoteUpdate',
                                        target: 'connected'
                                    }
                                ],
                                onError: {
                                    actions: ['clearRemoteUpdate', 'handleError'],
                                    target: '#syncMachine.errorHandling'
                                }
                            }
                        },
                        transmitting: {
                            entry: ['setStatusSynchronizing', 'startTransmitting'],
                            invoke: {
                                id: 'pushUpdateToServer',
                                src: 'pushUpdateToServer',
                                input: ({ context }) => context,
                                onDone: {
                                    actions: 'acknowledgeTransmittedVersion',
                                    target: 'connected'
                                },
                                onError: {
                                    actions: ['handleError'],
                                    target: '#syncMachine.errorHandling'
                                }
                            }
                        }
                    }
                },

                errorHandling: {
                    entry: ['applyErrorStatus'],
                    always: [
                        {
                            guard: 'isFatalError',
                            target: 'fatalError'
                        },
                        {
                            target: 'waitingForRetry'
                        }
                    ],
                    exit: ['clearError']
                },

                waitingForRetry: {
                    entry: ['setStatusDisconnected'],
                    after: {
                        1000: { target: '#syncMachine.initialSyncing' }
                    },
                    on: {
                        CONNECT_RETRY: { target: '#syncMachine.initialSyncing' }
                    }
                },

                fatalError: {
                    type: 'final'
                }
            }
        });
};
