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
import { getReconnectDelayMs } from './reconnect-backoff';

export type SyncMachine = Awaited<Actor<ReturnType<typeof createSyncMachine>>>;

function shouldSendUpdate(context: SyncMachineConfig<StorageVersion, unknown>): boolean {
    return context.localUpdateVersion > context.acknowledgedLocalUpdateVersion;
}

export const createSyncMachine = () => {
    return x
        .setup({
            types: {} as {
                events:
                    | { type: 'LOCAL_UPDATE' }
                    | { type: 'REMOTE_UPDATE'; upd: EncryptedState }
                    | { type: 'CONNECTED' }
                    | { type: 'DISCONNECTED' }
                    | { type: 'CONNECTION_ERROR'; error: unknown }
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
            delays: {
                reconnectDelay: ({ context }) => getReconnectDelayMs(context.reconnectAttempt)
            },
            guards: {
                shouldSendUpdate: ({ context }) => shouldSendUpdate(context),
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
                setStatusSynchronizedIfIdle: ({ context }) => {
                    if (!shouldSendUpdate(context) && context.remoteUpdates.length === 0) {
                        context.syncStatusManager.setStatus(SyncStatus.SYNCHRONIZED);
                    }
                },
                handleError: assign({
                    lastError: ({
                        context,
                        event
                    }: {
                        context: SyncMachineConfig<StorageVersion, unknown>;
                        event: unknown;
                    }) => {
                        const error = (event as { error?: unknown }).error;
                        if (error instanceof SyncMachineError) {
                            return error.disposition;
                        } else {
                            context.logger.error('Unhandled sync machine error', error);
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
                incrementReconnectAttempt: assign({
                    reconnectAttempt: ({ context }) => context.reconnectAttempt + 1
                }),
                resetReconnectAttemptIfSynced: assign({
                    reconnectAttempt: ({ context }) => {
                        if (shouldSendUpdate(context) || context.remoteUpdates.length > 0) {
                            return context.reconnectAttempt;
                        }

                        return 0;
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
                        CONNECTION_ERROR: {
                            actions: ['handleError'],
                            target: '#syncMachine.errorHandling'
                        },
                        REMOTE_UPDATE: { actions: ['setRemoteUpdate', 'setStatusSynchronizing'] }
                    },
                    states: {
                        connecting: {
                            entry: ['setStatusSynchronizing'],
                            on: {
                                CONNECTED: { target: 'connected' }
                            }
                        },
                        connected: {
                            entry: ['setStatusSynchronizedIfIdle', 'resetReconnectAttemptIfSynced'],
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
                                    actions: ['markDirty', 'setStatusSynchronizing'],
                                    target: 'transmitting'
                                },
                                REMOTE_UPDATE: {
                                    actions: ['setRemoteUpdate', 'setStatusSynchronizing'],
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
                    entry: ['setStatusDisconnected', 'incrementReconnectAttempt'],
                    after: {
                        reconnectDelay: { target: '#syncMachine.initialSyncing' }
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
