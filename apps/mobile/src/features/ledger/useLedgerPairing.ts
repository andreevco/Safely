import { DeviceActionStatus, OpenAppDeviceAction } from '@ledgerhq/device-management-kit';
import { useEffect, useState } from 'react';

import { useLedgerSession } from './LedgerSessionProvider';

export type PairingStatus = 'connecting' | 'connected' | 'error';

const BITCOIN_APP_NAME = 'Bitcoin';

export const useLedgerPairing = () => {
    const { getDmk, selectedDevice, setSessionId } = useLedgerSession();
    const [status, setStatus] = useState<PairingStatus>('connecting');

    useEffect(() => {
        if (!selectedDevice) {
            setStatus('error');

            return;
        }

        let isActive = true;
        let subscription: { unsubscribe: () => void } | undefined;
        const dmk = getDmk();

        dmk.connect({ device: selectedDevice })
            .then(sessionId => {
                if (!isActive) {
                    return;
                }

                setSessionId(sessionId);

                const action = dmk.executeDeviceAction({
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
                            setStatus('error');
                        }
                    },
                    error: () => {
                        if (isActive) {
                            setStatus('error');
                        }
                    }
                });
            })
            .catch(() => {
                if (isActive) {
                    setStatus('error');
                }
            });

        return () => {
            isActive = false;
            subscription?.unsubscribe();
        };
    }, [getDmk, selectedDevice, setSessionId]);

    return { status };
};
