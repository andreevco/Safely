import { DeviceActionStatus, OpenAppDeviceAction } from '@ledgerhq/device-management-kit';
import { useEffect, useState } from 'react';

import { useLedgerSession } from './LedgerSigningProvider';

export type PairingStatus = 'connecting' | 'openingApp' | 'connected' | 'error';

const BITCOIN_APP_NAME = 'Bitcoin';

const CONNECT_STEP = 0;
const OPEN_APP_STEP = 1;

export const useLedgerPairing = () => {
    const {
        getLedgerKit,
        selectedDevice,
        setSessionId,
        disconnectSession,
        awaitPendingDisconnect
    } = useLedgerSession();
    const [status, setStatus] = useState<PairingStatus>('connecting');
    const [failedStep, setFailedStep] = useState(CONNECT_STEP);

    useEffect(() => {
        if (!selectedDevice) {
            setFailedStep(CONNECT_STEP);
            setStatus('error');

            return;
        }

        let isActive = true;
        let subscription: { unsubscribe: () => void } | undefined;
        const ledgerKit = getLedgerKit();

        const handleError = (step: number) => {
            if (!isActive) {
                return;
            }

            disconnectSession();
            setFailedStep(step);
            setStatus('error');
        };

        const pair = async () => {
            await awaitPendingDisconnect();
            if (!isActive) {
                return;
            }

            const sessionId = await ledgerKit.connect({ device: selectedDevice });
            if (!isActive) {
                return;
            }

            setSessionId(sessionId);
            setStatus('openingApp');

            const action = ledgerKit.executeDeviceAction({
                sessionId,
                deviceAction: new OpenAppDeviceAction({
                    input: { appName: BITCOIN_APP_NAME }
                })
            });

            subscription = action.observable.subscribe({
                next: state => {
                    if (!isActive) {
                        return;
                    }

                    if (state.status === DeviceActionStatus.Completed) {
                        setStatus('connected');
                    }

                    if (state.status === DeviceActionStatus.Error) {
                        handleError(OPEN_APP_STEP);
                    }
                },
                error: () => handleError(OPEN_APP_STEP)
            });
        };

        void pair().catch(() => handleError(CONNECT_STEP));

        return () => {
            isActive = false;
            subscription?.unsubscribe();
        };
    }, [getLedgerKit, selectedDevice, setSessionId, disconnectSession, awaitPendingDisconnect]);

    return { status, failedStep };
};
