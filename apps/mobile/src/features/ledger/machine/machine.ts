import type { DeviceManagementKit, DiscoveredDevice } from '@ledgerhq/device-management-kit';
import { assign, setup } from 'xstate';

import type { LedgerSession } from '@safely/core';
import { LedgerSigningCancelledError } from '@safely/core';

import {
    checkLedgerAppVersion,
    connectLedgerSession,
    openBitcoinApp,
    runLedgerSession,
    scanLedgerDevices,
    verifyLedgerFingerprint
} from './actors';

const CONNECT_TIMEOUT_MS = 30_000;

export const LEDGER_FAILURE_STATES = ['failed', 'wrongDevice', 'unsupportedApp'];

export type LedgerSigningInput = {
    dmk: DeviceManagementKit;
    expectedFingerprint: string;
    run: (session: LedgerSession) => Promise<unknown>;
};

export type LedgerSigningOutput = {
    result: unknown;
    error: unknown;
};

type LedgerSigningContext = LedgerSigningInput & {
    selectedDevice: DiscoveredDevice | null;
    sessionId: string | null;
    step: number;
    result: unknown;
    error: unknown;
};

type LedgerSigningEvent =
    | { type: 'DEVICES_FOUND'; devices: DiscoveredDevice[] }
    | { type: 'RETRY' }
    | { type: 'CANCEL' };

export const ledgerSigningMachine = setup({
    types: {
        context: {} as LedgerSigningContext,
        input: {} as LedgerSigningInput,
        events: {} as LedgerSigningEvent,
        output: {} as LedgerSigningOutput
    },
    actors: {
        scanLedgerDevices,
        connectLedgerSession,
        openBitcoinApp,
        checkLedgerAppVersion,
        verifyLedgerFingerprint,
        runLedgerSession
    },
    actions: {
        disconnect: ({ context }) => {
            if (context.sessionId) {
                void context.dmk.disconnect({ sessionId: context.sessionId }).catch(() => {});
            }
        }
    },
    delays: {
        connectTimeout: CONNECT_TIMEOUT_MS
    }
}).createMachine({
    id: 'ledgerSigning',
    context: ({ input }) => ({
        ...input,
        selectedDevice: null,
        sessionId: null,
        step: 0,
        result: undefined,
        error: undefined
    }),
    initial: 'scanning',
    on: {
        CANCEL: { target: '.cancelled' }
    },
    states: {
        scanning: {
            entry: assign({ step: () => 0 }),
            invoke: {
                src: 'scanLedgerDevices',
                input: ({ context }) => ({ dmk: context.dmk })
            },
            on: {
                DEVICES_FOUND: {
                    guard: ({ event }) => event.devices.length > 0,
                    actions: assign({ selectedDevice: ({ event }) => event.devices[0] }),
                    target: 'connecting'
                }
            }
        },
        connecting: {
            invoke: {
                src: 'connectLedgerSession',
                input: ({ context }) => ({ dmk: context.dmk, device: context.selectedDevice! }),
                onDone: {
                    actions: assign({ sessionId: ({ event }) => event.output }),
                    target: 'openingApp'
                },
                onError: {
                    actions: assign({ error: ({ event }) => event.error }),
                    target: 'failed'
                }
            },
            after: {
                connectTimeout: { target: 'failed' }
            }
        },
        openingApp: {
            entry: assign({ step: () => 1 }),
            invoke: {
                src: 'openBitcoinApp',
                input: ({ context }) => ({ dmk: context.dmk, sessionId: context.sessionId! }),
                onDone: {
                    target: 'checkingApp'
                },
                onError: {
                    actions: assign({ error: ({ event }) => event.error }),
                    target: 'failed'
                }
            },
            after: {
                connectTimeout: { target: 'failed' }
            }
        },
        checkingApp: {
            entry: assign({ step: () => 1 }),
            invoke: {
                src: 'checkLedgerAppVersion',
                input: ({ context }) => ({ dmk: context.dmk, sessionId: context.sessionId! }),
                onDone: [
                    { guard: ({ event }) => event.output, target: 'verifying' },
                    { target: 'unsupportedApp' }
                ],
                onError: {
                    actions: assign({ error: ({ event }) => event.error }),
                    target: 'failed'
                }
            }
        },
        verifying: {
            entry: assign({ step: () => 1 }),
            invoke: {
                src: 'verifyLedgerFingerprint',
                input: ({ context }) => ({
                    dmk: context.dmk,
                    sessionId: context.sessionId!,
                    expectedFingerprint: context.expectedFingerprint
                }),
                onDone: [
                    { guard: ({ event }) => event.output, target: 'signing' },
                    { target: 'wrongDevice' }
                ],
                onError: {
                    actions: assign({ error: ({ event }) => event.error }),
                    target: 'failed'
                }
            }
        },
        signing: {
            entry: assign({ step: () => 2 }),
            invoke: {
                src: 'runLedgerSession',
                input: ({ context }) => ({
                    dmk: context.dmk,
                    sessionId: context.sessionId!,
                    run: context.run
                }),
                onDone: {
                    actions: assign({ result: ({ event }) => event.output }),
                    target: 'done'
                },
                onError: {
                    actions: assign({ error: ({ event }) => event.error }),
                    target: 'failed'
                }
            }
        },
        wrongDevice: {
            entry: 'disconnect',
            on: { RETRY: { target: 'scanning' } }
        },
        unsupportedApp: {
            entry: 'disconnect',
            on: { RETRY: { target: 'scanning' } }
        },
        failed: {
            entry: 'disconnect',
            on: { RETRY: { target: 'scanning' } }
        },
        cancelled: {
            entry: ['disconnect', assign({ error: () => new LedgerSigningCancelledError() })],
            type: 'final'
        },
        done: {
            entry: ['disconnect', assign({ step: () => 3 })],
            type: 'final'
        }
    },
    output: ({ context }) => ({ result: context.result, error: context.error })
});
