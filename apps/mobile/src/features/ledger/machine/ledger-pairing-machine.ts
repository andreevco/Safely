import type { DeviceManagementKit, DiscoveredDevice } from '@ledgerhq/device-management-kit';
import { assign, setup } from 'xstate';

import { connectLedgerSession, openBitcoinApp } from './actors';

export const PAIRING_CONNECT_STEP = 0;
export const PAIRING_OPEN_APP_STEP = 1;

type LedgerPairingInput = {
    ledgerKit: DeviceManagementKit;
    device: DiscoveredDevice;
    sessionId: string | null;
};

type LedgerPairingContext = LedgerPairingInput & {
    failedStep: number;
};

export const ledgerPairingMachine = setup({
    types: {
        context: {} as LedgerPairingContext,
        input: {} as LedgerPairingInput
    },
    guards: {
        hasLiveSession: ({ context }) => context.sessionId !== null
    },
    actors: {
        connectLedgerSession,
        openBitcoinApp
    }
}).createMachine({
    id: 'ledgerPairing',
    context: ({ input }) => ({ ...input, failedStep: PAIRING_CONNECT_STEP }),
    initial: 'start',
    states: {
        start: {
            always: [{ guard: 'hasLiveSession', target: 'openingApp' }, { target: 'connecting' }]
        },
        connecting: {
            invoke: {
                src: 'connectLedgerSession',
                input: ({ context }) => ({ ledgerKit: context.ledgerKit, device: context.device }),
                onDone: {
                    actions: assign({ sessionId: ({ event }) => event.output }),
                    target: 'openingApp'
                },
                onError: {
                    actions: assign({ failedStep: () => PAIRING_CONNECT_STEP }),
                    target: 'failed'
                }
            }
        },
        openingApp: {
            invoke: {
                src: 'openBitcoinApp',
                input: ({ context }) => ({
                    ledgerKit: context.ledgerKit,
                    sessionId: context.sessionId!
                }),
                onDone: 'connected',
                onError: {
                    actions: assign({ failedStep: () => PAIRING_OPEN_APP_STEP }),
                    target: 'failed'
                }
            }
        },
        connected: { type: 'final' },
        failed: { type: 'final' }
    }
});
