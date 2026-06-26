import { useMachine } from '@xstate/react';
import { useEffect } from 'react';

import { useLedgerSession } from './LedgerSigningProvider';
import { ledgerPairingMachine, PAIRING_CONNECT_STEP } from './machine/ledger-pairing-machine';

export type PairingStatus = 'connecting' | 'openingApp' | 'connected' | 'error';

export const useLedgerPairing = () => {
    const { getLedgerKit, selectedDevice, sessionId, setSessionId } = useLedgerSession();

    const [snapshot] = useMachine(ledgerPairingMachine, {
        input: { ledgerKit: getLedgerKit(), device: selectedDevice!, sessionId }
    });

    const machineSessionId = snapshot.context.sessionId;
    const { failedStep, error } = snapshot.context;

    useEffect(() => {
        if (machineSessionId) {
            setSessionId(machineSessionId);
        }
    }, [machineSessionId, setSessionId]);

    const status: PairingStatus = snapshot.matches('connected')
        ? 'connected'
        : snapshot.matches('openingApp')
          ? 'openingApp'
          : snapshot.matches('failed')
            ? 'error'
            : 'connecting';

    return {
        status,
        failedStep: status === 'error' ? failedStep : PAIRING_CONNECT_STEP,
        error: status === 'error' ? error : undefined
    };
};
